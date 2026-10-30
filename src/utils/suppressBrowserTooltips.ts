/**
 * Universal suppressor for native browser tooltips.
 * Prevents OS/browser native yellow/gray tooltips from appearing when hovering over items,
 * while safely preserving accessibility via aria-label and data-original-title.
 */
export function initBrowserTooltipSuppressor(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const sanitizeElement = (el: Element | null): void => {
    if (!el || !(el instanceof HTMLElement || el instanceof SVGElement)) return;
    if (el.hasAttribute('title')) {
      const title = el.getAttribute('title');
      if (title) {
        el.setAttribute('data-original-title', title);
        if (!el.getAttribute('aria-label')) {
          el.setAttribute('aria-label', title);
        }
      }
      el.removeAttribute('title');
    }
  };

  const sanitizeSubtree = (root: ParentNode): void => {
    const elements = root.querySelectorAll('[title]');
    for (let i = 0; i < elements.length; i++) {
      sanitizeElement(elements[i]);
    }
  };

  // 1. Initial cleanup once DOM is accessible
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => sanitizeSubtree(document), { once: true });
  } else {
    sanitizeSubtree(document);
  }

  // 2. Immediate capture on hover/pointer interactions (runs before browser 500ms tooltip timer)
  const handlePointerInteraction = (e: Event): void => {
    let current = e.target as HTMLElement | null;
    while (current && current !== document.body && current !== document.documentElement) {
      if (current.hasAttribute('title')) {
        sanitizeElement(current);
      }
      current = current.parentElement;
    }
  };

  window.addEventListener('mouseover', handlePointerInteraction, { capture: true, passive: true });
  window.addEventListener('pointerover', handlePointerInteraction, { capture: true, passive: true });
  window.addEventListener('mouseenter', handlePointerInteraction, { capture: true, passive: true });
  window.addEventListener('focusin', handlePointerInteraction, { capture: true, passive: true });

  // 3. MutationObserver for dynamic React nodes and routes
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'attributes' && mutation.attributeName === 'title') {
        sanitizeElement(mutation.target as Element);
      } else if (mutation.type === 'childList') {
        for (let i = 0; i < mutation.addedNodes.length; i++) {
          const node = mutation.addedNodes[i];
          if (node.nodeType === Node.ELEMENT_NODE) {
            sanitizeElement(node as Element);
            sanitizeSubtree(node as ParentNode);
          }
        }
      }
    }
  });

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['title'],
    childList: true,
    subtree: true,
  });
}
