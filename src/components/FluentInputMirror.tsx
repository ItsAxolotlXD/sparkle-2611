import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FluentEmojiText, containsEmoji, useFlumojsEnabled } from './FluentEmoji';

type TextField = HTMLInputElement | HTMLTextAreaElement;

type InlineStyleValue = {
  value: string;
  priority: string;
};

type OriginalTextStyles = {
  color: InlineStyleValue;
  textFillColor: InlineStyleValue;
  caretColor: InlineStyleValue;
  renderedColor: string;
  renderedCaretColor: string;
};

interface InputMirrorState {
  id: string;
  value: string;
  wrapperStyle: React.CSSProperties;
  textStyle: React.CSSProperties;
}

const SUPPORTED_INPUT_TYPES = new Set(['text', 'search', 'email', 'url', 'tel']);

const readInlineStyle = (style: CSSStyleDeclaration, property: string): InlineStyleValue => ({
  value: style.getPropertyValue(property),
  priority: style.getPropertyPriority(property),
});

const restoreInlineStyle = (
  style: CSSStyleDeclaration,
  property: string,
  previous: InlineStyleValue,
) => {
  if (previous.value) {
    style.setProperty(property, previous.value, previous.priority);
  } else {
    style.removeProperty(property);
  }
};

const getTextField = (target: EventTarget | null): TextField | null => {
  if (target instanceof HTMLTextAreaElement && !target.disabled) return target;
  if (
    target instanceof HTMLInputElement &&
    !target.disabled &&
    SUPPORTED_INPUT_TYPES.has(target.type)
  ) {
    return target;
  }
  return null;
};

const getOriginalStyles = (field: TextField): OriginalTextStyles => {
  const computed = window.getComputedStyle(field);
  const computedTextFill = computed.getPropertyValue('-webkit-text-fill-color');
  const renderedColor =
    computedTextFill && computedTextFill !== 'currentcolor' ? computedTextFill : computed.color;

  return {
    color: readInlineStyle(field.style, 'color'),
    textFillColor: readInlineStyle(field.style, '-webkit-text-fill-color'),
    caretColor: readInlineStyle(field.style, 'caret-color'),
    renderedColor,
    renderedCaretColor: computed.caretColor === 'auto' ? computed.color : computed.caretColor,
  };
};

const isInputOnTop = (field: TextField, rect: DOMRect) => {
  const centerY = rect.top + rect.height / 2;
  const horizontalInset = Math.min(4, rect.width / 2);
  const points = [
    [rect.left + rect.width / 2, centerY],
    [rect.left + horizontalInset, centerY],
    [rect.right - horizontalInset, centerY],
  ];

  return points.some(([x, y]) => {
    if (x < 0 || y < 0 || x >= window.innerWidth || y >= window.innerHeight) return false;
    return document.elementFromPoint(x, y) === field;
  });
};

const createMirrorState = (
  field: TextField,
  original: OriginalTextStyles,
  id: string,
): InputMirrorState | null => {
  const rect = field.getBoundingClientRect();
  const computed = window.getComputedStyle(field);
  const isMultiline = field instanceof HTMLTextAreaElement;

  if (
    rect.width <= 0 ||
    rect.height <= 0 ||
    computed.display === 'none' ||
    computed.visibility === 'hidden' ||
    Number.parseFloat(computed.opacity) === 0 ||
    !isInputOnTop(field, rect)
  ) {
    return null;
  }

  const borderLeft = Number.parseFloat(computed.borderLeftWidth) || 0;
  const borderRight = Number.parseFloat(computed.borderRightWidth) || 0;
  const borderTop = Number.parseFloat(computed.borderTopWidth) || 0;
  const borderBottom = Number.parseFloat(computed.borderBottomWidth) || 0;
  const paddingLeft = Number.parseFloat(computed.paddingLeft) || 0;
  const paddingRight = Number.parseFloat(computed.paddingRight) || 0;
  const paddingTop = Number.parseFloat(computed.paddingTop) || 0;
  const paddingBottom = Number.parseFloat(computed.paddingBottom) || 0;
  const contentWidth = Math.max(
    0,
    rect.width - borderLeft - borderRight - paddingLeft - paddingRight,
  );
  const contentHeight = Math.max(
    0,
    rect.height - borderTop - borderBottom - paddingTop - paddingBottom,
  );
  const textWidth = Math.max(contentWidth, field.scrollWidth - paddingLeft - paddingRight);
  const textHeight = isMultiline
    ? Math.max(contentHeight, field.scrollHeight - paddingTop - paddingBottom)
    : contentHeight;
  const whiteSpace = isMultiline
    ? (field as HTMLTextAreaElement).wrap === 'off'
      ? 'pre'
      : computed.whiteSpace
    : 'pre';

  return {
    id,
    value: field.value,
    wrapperStyle: {
      position: 'fixed',
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
      zIndex: 1,
      boxSizing: 'border-box',
      display: isMultiline ? 'block' : 'flex',
      alignItems: isMultiline ? undefined : 'center',
      overflow: 'hidden',
      padding: computed.padding,
      borderWidth: computed.borderWidth,
      borderStyle: 'solid',
      borderColor: 'transparent',
      background: 'transparent',
      color: original.renderedColor,
      fontFamily: computed.fontFamily,
      fontSize: computed.fontSize,
      fontWeight: computed.fontWeight as React.CSSProperties['fontWeight'],
      fontStyle: computed.fontStyle as React.CSSProperties['fontStyle'],
      lineHeight: computed.lineHeight,
      letterSpacing: computed.letterSpacing,
      wordSpacing: computed.wordSpacing,
      textAlign: computed.textAlign as React.CSSProperties['textAlign'],
      textTransform: computed.textTransform as React.CSSProperties['textTransform'],
      direction: computed.direction as React.CSSProperties['direction'],
      whiteSpace: whiteSpace as React.CSSProperties['whiteSpace'],
      overflowWrap: computed.overflowWrap as React.CSSProperties['overflowWrap'],
      wordBreak: computed.wordBreak as React.CSSProperties['wordBreak'],
      pointerEvents: 'none',
      userSelect: 'none',
    },
    textStyle: {
      display: 'block',
      flex: 'none',
      width: textWidth,
      height: textHeight,
      minWidth: contentWidth,
      minHeight: contentHeight,
      boxSizing: 'border-box',
      whiteSpace: whiteSpace as React.CSSProperties['whiteSpace'],
      overflowWrap: computed.overflowWrap as React.CSSProperties['overflowWrap'],
      wordBreak: computed.wordBreak as React.CSSProperties['wordBreak'],
      textAlign: computed.textAlign as React.CSSProperties['textAlign'],
      textIndent: computed.textIndent,
      transform: `translate(${-field.scrollLeft}px, ${-field.scrollTop}px)`,
    },
  };
};

export const FluentInputMirror: React.FC = () => {
  const useFlumojs = useFlumojsEnabled();
  const [mirrors, setMirrors] = useState<InputMirrorState[]>([]);
  const mirrorsRef = useRef(new Map<TextField, InputMirrorState>());
  const trackedFieldsRef = useRef(new Set<TextField>());
  const originalStylesRef = useRef(new WeakMap<TextField, OriginalTextStyles>());
  const idsRef = useRef(new WeakMap<TextField, string>());
  const nextIdRef = useRef(0);

  const restoreField = useCallback((field: TextField) => {
    const previous = originalStylesRef.current.get(field);
    if (!previous) return;

    restoreInlineStyle(field.style, 'color', previous.color);
    restoreInlineStyle(field.style, '-webkit-text-fill-color', previous.textFillColor);
    restoreInlineStyle(field.style, 'caret-color', previous.caretColor);
    originalStylesRef.current.delete(field);
  }, []);

  const getId = useCallback((field: TextField) => {
    let id = idsRef.current.get(field);
    if (!id) {
      id = `flumojs-input-${nextIdRef.current++}`;
      idsRef.current.set(field, id);
    }
    return id;
  }, []);

  const syncField = useCallback((field: TextField) => {
    if (!useFlumojs || !field.isConnected || !containsEmoji(field.value)) {
      restoreField(field);
      trackedFieldsRef.current.delete(field);
      mirrorsRef.current.delete(field);
      return;
    }

    trackedFieldsRef.current.add(field);
    let original = originalStylesRef.current.get(field);
    if (!original) {
      original = getOriginalStyles(field);
      originalStylesRef.current.set(field, original);
    }

    const mirror = createMirrorState(field, original, getId(field));
    if (!mirror) {
      restoreField(field);
      trackedFieldsRef.current.delete(field);
      mirrorsRef.current.delete(field);
      return;
    }

    field.style.setProperty('color', 'transparent', 'important');
    field.style.setProperty('-webkit-text-fill-color', 'transparent', 'important');
    field.style.setProperty('caret-color', original.renderedCaretColor, 'important');
    mirrorsRef.current.set(field, mirror);
  }, [getId, restoreField, useFlumojs]);

  const syncAllFields = useCallback(() => {
    if (!useFlumojs) {
      for (const field of trackedFieldsRef.current) restoreField(field);
      trackedFieldsRef.current.clear();
      mirrorsRef.current.clear();
      setMirrors([]);
      return;
    }

    const fields = new Set(trackedFieldsRef.current);
    document.querySelectorAll('input, textarea').forEach((element) => {
      const field = getTextField(element);
      if (field && containsEmoji(field.value)) fields.add(field);
    });

    fields.forEach(syncField);
    setMirrors(Array.from(mirrorsRef.current.values()));
  }, [restoreField, syncField, useFlumojs]);

  useEffect(() => {
    let scheduledFrame = 0;
    let resizeObserver: ResizeObserver | null = null;

    const runSync = () => {
      scheduledFrame = 0;
      syncAllFields();
      resizeObserver?.disconnect();
      trackedFieldsRef.current.forEach((field) => resizeObserver?.observe(field));
    };

    const scheduleSync = () => {
      if (scheduledFrame) return;
      scheduledFrame = window.requestAnimationFrame(runSync);
    };

    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(scheduleSync);
    }

    const fieldChanged = (event: Event) => {
      const field = getTextField(event.target);
      if (!field) return;
      syncField(field);
      setMirrors(Array.from(mirrorsRef.current.values()));
      if (trackedFieldsRef.current.has(field)) resizeObserver?.observe(field);
    };

    const isMirrorMutation = (mutation: MutationRecord) => {
      const target = mutation.target;
      if (target instanceof Element && target.closest('[data-flumojs-input-mirror-root]')) {
        return true;
      }
      if (mutation.type === 'childList') {
        const changedNodes = [...mutation.addedNodes, ...mutation.removedNodes];
        if (
          changedNodes.length > 0 &&
          changedNodes.every(
            (node) => node instanceof Element && node.hasAttribute('data-flumojs-input-mirror-root'),
          )
        ) {
          return true;
        }
      }
      return false;
    };

    const mutationObserver = new MutationObserver((mutations) => {
      if (mutations.some((mutation) => !isMirrorMutation(mutation))) scheduleSync();
    });

    document.addEventListener('focusin', scheduleSync);
    document.addEventListener('focusout', scheduleSync);
    document.addEventListener('input', fieldChanged, true);
    document.addEventListener('change', fieldChanged, true);
    document.addEventListener('scroll', scheduleSync, true);
    window.addEventListener('resize', scheduleSync);
    mutationObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ['class', 'hidden', 'aria-hidden', 'value'],
      childList: true,
      subtree: true,
    });

    runSync();

    return () => {
      document.removeEventListener('focusin', scheduleSync);
      document.removeEventListener('focusout', scheduleSync);
      document.removeEventListener('input', fieldChanged, true);
      document.removeEventListener('change', fieldChanged, true);
      document.removeEventListener('scroll', scheduleSync, true);
      window.removeEventListener('resize', scheduleSync);
      mutationObserver.disconnect();
      resizeObserver?.disconnect();
      if (scheduledFrame) window.cancelAnimationFrame(scheduledFrame);

      for (const field of trackedFieldsRef.current) restoreField(field);
      trackedFieldsRef.current.clear();
      mirrorsRef.current.clear();
    };
  }, [restoreField, syncAllFields, syncField, useFlumojs]);

  if (!useFlumojs || mirrors.length === 0) return null;

  return createPortal(
    <div
      aria-hidden="true"
      data-flumojs-input-mirror-root="true"
      style={{ position: 'fixed', inset: 0, zIndex: 2147483647, pointerEvents: 'none' }}
    >
      {mirrors.map((mirror) => (
        <div key={mirror.id} data-flumojs-input-mirror="true" style={mirror.wrapperStyle}>
          <div style={mirror.textStyle}>
            <FluentEmojiText>{mirror.value}</FluentEmojiText>
          </div>
        </div>
      ))}
    </div>,
    document.body,
  );
};
