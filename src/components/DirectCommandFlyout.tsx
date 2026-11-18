import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, CornerDownLeft, Trash2 } from 'lucide-react';
import { useSettings, getTaskbarHeightPx, SystemSettings } from '../hooks/useSettings';
import { getViveFeatures, findViveFeatureById } from '../utils/viveFeatures';
import { showAppToast } from '../utils/toast';

interface DirectCommandFlyoutProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ConsoleLine {
  text: string;
  tone?: 'default' | 'muted' | 'success' | 'error' | 'accent';
  prefillCommand?: string;
}

interface ConsoleEntry {
  id: string;
  command?: string;
  lines: ConsoleLine[];
}

interface CommandSuggestion {
  syntax: string;
  insertText: string;
  description: string;
}

const COMMAND_SUGGESTIONS: CommandSuggestion[] = [
  { syntax: '/help', insertText: '/help', description: 'Get help of all commands available' },
  { syntax: '/ui /si /small|default|large', insertText: '/ui /si /', description: 'Modifies the UI scale of Windows Mode' },
  { syntax: '/theme /light|dark', insertText: '/theme /', description: 'Change the overall theme' },
  { syntax: '/search /appearance /box|button', insertText: '/search /appearance /', description: 'Change the search style on taskbar' },
  { syntax: '/taskbar /si /small|default|large', insertText: '/taskbar /si /', description: 'Modifies the taskbar scale' },
  { syntax: '/taskbar /alignment /center|left', insertText: '/taskbar /alignment /', description: 'Adjust taskbar alignment' },
  { syntax: '/vivetool /list', insertText: '/vivetool /list', description: 'Shows list of available Vive features' },
  { syntax: '/vivetool /enable /id:<ID>', insertText: '/vivetool /enable /id:', description: 'Force enable a Vive feature by 8-digit ID' },
  { syntax: '/vivetool /disable /id:<ID>', insertText: '/vivetool /disable /id:', description: 'Force disable a Vive feature by 8-digit ID' },
  { syntax: '/session /start', insertText: '/session /start', description: 'Start Windows Mode' },
  { syntax: '/session /end', insertText: '/session /end', description: 'Exit Windows Mode' },
];

const WELCOME_ENTRY: ConsoleEntry = {
  id: 'welcome',
  lines: [
    { text: 'Sparkle Direct Command [Version 26165.Moment 1]', tone: 'accent' },
    { text: 'Type /help for a list of commands. Press Tab to autocomplete.', tone: 'muted' },
  ],
};

export const DirectCommandFlyout: React.FC<DirectCommandFlyoutProps> = ({ isOpen, onClose }) => {
  const { settings, updateSetting } = useSettings();
  const isLightMode = settings.theme === 'light';
  const taskbarHeight = getTaskbarHeightPx(settings.taskbarScale);
  const bottomOffset = settings.windowsMode ? taskbarHeight + 8 : 12;

  const [inputValue, setInputValue] = useState('');
  const [entries, setEntries] = useState<ConsoleEntry[]>([WELCOME_ENTRY]);
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState<number>(-1);

  const flyoutRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const outputEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const t = setTimeout(() => {
      inputRef.current?.focus();
    }, 60);
    return () => clearTimeout(t);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    outputEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [entries, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('#btn-taskbar-direct-command')) return;
      if (target.closest('[data-windows-context-menu]')) return;
      if (flyoutRef.current && !flyoutRef.current.contains(target)) {
        onClose();
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleOutside);
    window.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      window.removeEventListener('keydown', handleKey);
    };
  }, [isOpen, onClose]);

  const matchingSuggestions = useMemo(() => {
    const q = inputValue.trim().toLowerCase();
    if (!q || !q.startsWith('/')) return [];
    const tokens = q.split(/\s+/);
    const filtered = COMMAND_SUGGESTIONS.filter((s) => {
      const lowerSyntax = s.syntax.toLowerCase();
      return tokens.every((tok) => lowerSyntax.includes(tok));
    });
    return filtered.slice(0, 5);
  }, [inputValue]);

  const appendEntry = (command: string, lines: ConsoleLine[]) => {
    setEntries((prev) => [
      ...prev,
      {
        id: `cmd-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        command,
        lines,
      },
    ]);
  };

  const executeCommand = (rawCommand: string) => {
    const trimmed = rawCommand.trim();
    if (!trimmed) return;

    setCmdHistory((prev) => [trimmed, ...prev.filter((c) => c !== trimmed)].slice(0, 40));
    setHistoryIdx(-1);
    setInputValue('');

    const normalized = trimmed.replace(/\s+/g, ' ');
    const tokens = normalized.split(' ');
    const lowerTokens = tokens.map((t) => t.toLowerCase());
    const cmd = lowerTokens[0];

    // Clear screen aliases
    if (cmd === 'cls' || cmd === '/clear' || cmd === 'clear') {
      setEntries([]);
      return;
    }

    // /help
    if (cmd === '/help' || cmd === 'help' || cmd === '/?') {
      appendEntry(trimmed, [
        { text: 'Available Sparkle Direct Commands:', tone: 'accent' },
        { text: '  /help                                  Get help of all commands available', prefillCommand: '/help' },
        { text: '  /ui /si /small|default|large           Modifies UI scale of Windows Mode', prefillCommand: '/ui /si /' },
        { text: '  /theme /light|dark                     Change the overall theme', prefillCommand: '/theme /' },
        { text: '  /search /appearance /box|button        Change taskbar search style', prefillCommand: '/search /appearance /' },
        { text: '  /taskbar /si /small|default|large      Modifies the taskbar scale', prefillCommand: '/taskbar /si /' },
        { text: '  /taskbar /alignment /center|left       Adjust taskbar alignment', prefillCommand: '/taskbar /alignment /' },
        { text: '  /vivetool /enable|disable /id:<ID>     Force enable or disable Vive features', prefillCommand: '/vivetool /enable /id:' },
        { text: '  /vivetool /list                        Shows list of available Vive features', prefillCommand: '/vivetool /list' },
        { text: '  /session /end                          Exit Windows Mode', prefillCommand: '/session /end' },
        { text: '  /session /start                        Start Windows Mode', prefillCommand: '/session /start' },
        { text: '  cls                                    Clear command output', tone: 'muted' },
      ]);
      return;
    }

    // /ui /si /small|default|large
    if (cmd === '/ui') {
      const sub = lowerTokens[1];
      const val = lowerTokens[2];
      if (sub === '/si' && (val === '/small' || val === '/default' || val === '/large')) {
        const scale = val.slice(1) as 'small' | 'default' | 'large';
        updateSetting('windowsUiScale', scale);
        showAppToast(`Windows Mode UI scale set to ${scale}`, { source: 'settings' });
        appendEntry(trimmed, [
          { text: `Windows Mode UI scale updated to "${scale}".`, tone: 'success' },
        ]);
      } else {
        appendEntry(trimmed, [
          { text: 'Invalid syntax for /ui.', tone: 'error' },
          { text: 'Usage: /ui /si /small|default|large', tone: 'muted' },
        ]);
      }
      return;
    }

    // /theme /light|dark
    if (cmd === '/theme') {
      const val = lowerTokens[1];
      if (val === '/light' || val === '/dark') {
        const nextTheme = val.slice(1) as 'light' | 'dark';
        updateSetting('theme', nextTheme);
        showAppToast(`Theme switched to ${nextTheme === 'light' ? 'Light' : 'Dark'} mode`, { source: 'settings' });
        appendEntry(trimmed, [
          { text: `Overall theme changed to "${nextTheme}".`, tone: 'success' },
        ]);
      } else {
        appendEntry(trimmed, [
          { text: 'Invalid syntax for /theme.', tone: 'error' },
          { text: 'Usage: /theme /light|dark', tone: 'muted' },
        ]);
      }
      return;
    }

    // /search /appearance /box|button
    if (cmd === '/search') {
      const sub = lowerTokens[1];
      const val = lowerTokens[2];
      if (sub === '/appearance' && (val === '/box' || val === '/button')) {
        const style = val.slice(1) as 'box' | 'button';
        updateSetting('taskbarSearchStyle', style);
        showAppToast(`Taskbar search style set to ${style}`, { source: 'settings' });
        appendEntry(trimmed, [
          { text: `Taskbar search appearance changed to "${style}".`, tone: 'success' },
        ]);
      } else {
        appendEntry(trimmed, [
          { text: 'Invalid syntax for /search.', tone: 'error' },
          { text: 'Usage: /search /appearance /box|button', tone: 'muted' },
        ]);
      }
      return;
    }

    // /taskbar /si /small|default|large OR /taskbar /alignment /center|left
    if (cmd === '/taskbar') {
      const sub = lowerTokens[1];
      const val = lowerTokens[2];
      if (sub === '/si' && (val === '/small' || val === '/default' || val === '/large')) {
        const scale = val.slice(1) as 'small' | 'default' | 'large';
        updateSetting('taskbarScale', scale);
        showAppToast(`Taskbar scale set to ${scale}`, { source: 'settings' });
        appendEntry(trimmed, [
          { text: `Taskbar scale updated to "${scale}".`, tone: 'success' },
        ]);
        return;
      }
      if (sub === '/alignment' && (val === '/center' || val === '/left')) {
        const alignment = val.slice(1) as 'center' | 'left';
        updateSetting('taskbarAlignment', alignment);
        showAppToast(`Taskbar alignment set to ${alignment}`, { source: 'settings' });
        appendEntry(trimmed, [
          { text: `Taskbar alignment adjusted to "${alignment}".`, tone: 'success' },
        ]);
        return;
      }
      appendEntry(trimmed, [
        { text: 'Invalid syntax for /taskbar.', tone: 'error' },
        { text: 'Usage: /taskbar /si /small|default|large  |  /taskbar /alignment /center|left', tone: 'muted' },
      ]);
      return;
    }

    // /vivetool /list OR /vivetool /enable|disable /id:<ID number>
    if (cmd === '/vivetool') {
      const sub = lowerTokens[1];
      if (sub === '/list') {
        const features = getViveFeatures();
        appendEntry(trimmed, [
          { text: 'ViVeTool v0.3.3 — Available Vive Features:', tone: 'accent' },
          { text: '  ID         State      Feature Name', tone: 'muted' },
          { text: '  --------   --------   ------------------------', tone: 'muted' },
          ...features.map((f) => {
            const isEnabled = Boolean(settings[f.key]);
            const stateLabel = isEnabled ? 'Enabled ' : 'Disabled';
            const nextAction = isEnabled ? 'disable' : 'enable';
            return {
              text: `  ${f.id}   ${stateLabel}   ${f.name}`,
              tone: (isEnabled ? 'success' : 'default') as ConsoleLine['tone'],
              prefillCommand: `/vivetool /${nextAction} /id:${f.id}`,
            };
          }),
          { text: 'Tip: Click any row above to prefill its toggle command.', tone: 'muted' },
        ]);
        return;
      }

      if (sub === '/enable' || sub === '/disable') {
        const shouldEnable = sub === '/enable';
        const idArg = lowerTokens[2] || '';
        let extractedId = '';
        if (idArg.startsWith('/id:')) {
          extractedId = idArg.slice(4);
        } else if (idArg.startsWith('/id=')) {
          extractedId = idArg.slice(4);
        } else if (idArg === '/id' && lowerTokens[3]) {
          extractedId = lowerTokens[3];
        }

        if (!/^\d{8}$/.test(extractedId)) {
          appendEntry(trimmed, [
            { text: 'Error: Missing or invalid 8-digit feature ID.', tone: 'error' },
            { text: 'Usage: /vivetool /enable|disable /id:<8-digit ID>  (Run /vivetool /list to view IDs)', tone: 'muted', prefillCommand: '/vivetool /list' },
          ]);
          return;
        }

        const feature = findViveFeatureById(extractedId);
        if (!feature) {
          appendEntry(trimmed, [
            { text: `Error: Vive feature with ID "${extractedId}" was not found.`, tone: 'error' },
            { text: 'Run /vivetool /list to see valid 8-digit feature IDs.', tone: 'muted', prefillCommand: '/vivetool /list' },
          ]);
          return;
        }

        updateSetting(feature.key as keyof SystemSettings, shouldEnable as never);
        showAppToast(
          `${shouldEnable ? 'Enabled' : 'Disabled'} Vive feature: ${feature.name} (${feature.id})`,
          { source: 'settings' }
        );
        appendEntry(trimmed, [
          { text: 'Successfully set feature configuration(s).', tone: 'success' },
          { text: `  [${feature.id}] ${feature.name} -> ${shouldEnable ? 'Enabled' : 'Disabled'}`, tone: 'default' },
        ]);
        return;
      }

      appendEntry(trimmed, [
        { text: 'Invalid syntax for /vivetool.', tone: 'error' },
        { text: 'Usage: /vivetool /list  |  /vivetool /enable|disable /id:<ID number>', tone: 'muted' },
      ]);
      return;
    }

    // /session /end | /session /start
    if (cmd === '/session') {
      const sub = lowerTokens[1];
      if (sub === '/end') {
        if (!settings.windowsMode) {
          appendEntry(trimmed, [{ text: 'Windows Mode is already inactive.', tone: 'muted' }]);
        } else {
          updateSetting('windowsMode', false);
          showAppToast('Exited Windows Mode', { source: 'settings' });
          appendEntry(trimmed, [
            { text: 'Windows Mode session ended.', tone: 'success' },
            { text: 'Run /session /start anytime to re-enter Windows Mode.', tone: 'muted', prefillCommand: '/session /start' },
          ]);
        }
        return;
      }
      if (sub === '/start') {
        if (settings.windowsMode) {
          appendEntry(trimmed, [{ text: 'Windows Mode is already running.', tone: 'muted' }]);
        } else {
          updateSetting('windowsMode', true);
          showAppToast('Started Windows Mode', { source: 'settings' });
          appendEntry(trimmed, [{ text: 'Windows Mode session started.', tone: 'success' }]);
        }
        return;
      }
      appendEntry(trimmed, [
        { text: 'Invalid syntax for /session.', tone: 'error' },
        { text: 'Usage: /session /start  |  /session /end', tone: 'muted' },
      ]);
      return;
    }

    // Unrecognized command
    appendEntry(trimmed, [
      { text: `'${tokens[0]}' is not recognized as an internal or external command.`, tone: 'error' },
      { text: 'Type /help to see all supported commands.', tone: 'muted', prefillCommand: '/help' },
    ]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Tab') {
      if (matchingSuggestions.length > 0) {
        e.preventDefault();
        setInputValue(matchingSuggestions[0].insertText);
      }
      return;
    }
    if (e.key === 'ArrowUp') {
      if (cmdHistory.length > 0) {
        e.preventDefault();
        const nextIdx = Math.min(historyIdx + 1, cmdHistory.length - 1);
        setHistoryIdx(nextIdx);
        setInputValue(cmdHistory[nextIdx]);
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      if (historyIdx > 0) {
        e.preventDefault();
        const nextIdx = historyIdx - 1;
        setHistoryIdx(nextIdx);
        setInputValue(cmdHistory[nextIdx]);
      } else if (historyIdx === 0) {
        e.preventDefault();
        setHistoryIdx(-1);
        setInputValue('');
      }
    }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="windows-direct-command-flyout-wrapper"
          initial={settings.reduceAllMotion ? false : { x: '110%', opacity: 0 }}
          animate={{
            x: 0,
            opacity: 1,
            transition: settings.reduceAllMotion
              ? { duration: 0 }
              : { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
          }}
          exit={
            settings.reduceAllMotion
              ? undefined
              : {
                  x: '110%',
                  opacity: 0,
                  transition: { duration: 0.2, ease: [0.4, 0, 1, 1] },
                }
          }
          style={{ zIndex: 9100, paddingBottom: `${bottomOffset}px` }}
          className="fixed bottom-0 inset-x-0 flex justify-center sm:justify-end px-3 pointer-events-none"
        >
          <div
            ref={flyoutRef}
            id="windows-direct-command-flyout"
            role="dialog"
            aria-label="Direct Command"
            className="pointer-events-auto w-full max-w-[490px] rounded-[14px] border border-black/10 dark:border-white/[0.12] shadow-none overflow-hidden flex flex-col"
          >
            {/* Upper Frosted Command Prompt Console Area */}
            <div
              style={{
                backgroundColor: isLightMode ? 'rgba(235, 240, 248, 0.86)' : 'rgba(24, 27, 33, 0.88)',
                backdropFilter: 'blur(36px) saturate(175%)',
                WebkitBackdropFilter: 'blur(36px) saturate(175%)',
              }}
              className="flex flex-col"
            >
              {/* Title Bar Strip */}
              <div className="flex items-center justify-between px-3.5 py-2 border-b border-black/[0.06] dark:border-white/[0.08]">
                <div className="flex items-center gap-2 min-w-0">
                  <img
                    src="/assets/aistudio/direct_command_6240d59d.png"
                    alt=""
                    draggable={false}
                    className="w-4 h-4 object-contain shrink-0"
                  />
                  <span className="text-[12.5px] font-semibold text-[#111827] dark:text-white truncate">
                    Direct Command
                  </span>
                  <span className="text-[10.5px] font-mono px-1.5 py-0.5 rounded-[4px] bg-black/[0.06] dark:bg-white/[0.08] text-black/65 dark:text-white/65">
                    cmd
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setEntries([]);
                      inputRef.current?.focus();
                    }}
                    title="Clear output"
                    aria-label="Clear output"
                    className="h-6 px-2 rounded-[5px] flex items-center gap-1 text-[11px] text-black/65 dark:text-white/65 hover:bg-black/[0.06] dark:hover:bg-white/[0.08] hover:text-black dark:hover:text-white transition-colors cursor-pointer border-none bg-transparent"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear</span>
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close Direct Command"
                    className="w-6 h-6 rounded-[5px] flex items-center justify-center text-black/65 dark:text-white/65 hover:bg-black/[0.06] dark:hover:bg-white/[0.08] hover:text-black dark:hover:text-white transition-colors cursor-pointer border-none bg-transparent"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Console Output Scroll Area */}
              <div className="px-3.5 py-2.5 h-[260px] sm:h-[290px] overflow-y-auto sidebar-scroller font-mono text-[11.5px] leading-[1.55] space-y-2.5 text-[#111827] dark:text-[#e5e7eb] select-text">
                {entries.length === 0 ? (
                  <div className="text-black/45 dark:text-white/45 italic">
                    Console cleared. Type /help to list available commands.
                  </div>
                ) : (
                  entries.map((entry) => (
                    <div key={entry.id} className="space-y-0.5">
                      {entry.command && (
                        <div className="flex items-start gap-1.5 font-semibold text-[#111827] dark:text-white">
                          <span className="text-[#005fb8] dark:text-[#4cc2ff] shrink-0">C:\Sparkle&gt;</span>
                          <span className="break-all">{entry.command}</span>
                        </div>
                      )}
                      {entry.lines.map((line, idx) => {
                        const toneClass =
                          line.tone === 'error'
                            ? 'text-[#c42b1c] dark:text-[#ff7b89]'
                            : line.tone === 'success'
                            ? 'text-[#0f7b0f] dark:text-[#6ccb5f]'
                            : line.tone === 'accent'
                            ? 'text-[#005fb8] dark:text-[#4cc2ff] font-semibold'
                            : line.tone === 'muted'
                            ? 'text-black/55 dark:text-white/55'
                            : 'text-[#1f2937] dark:text-[#e5e7eb]';

                        if (line.prefillCommand) {
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setInputValue(line.prefillCommand!);
                                inputRef.current?.focus();
                              }}
                              className={`block w-full text-left whitespace-pre-wrap break-words rounded-[4px] px-1 -mx-1 py-0.5 hover:bg-black/[0.06] dark:hover:bg-white/[0.08] transition-colors cursor-pointer border-none bg-transparent font-mono ${toneClass}`}
                            >
                              {line.text}
                            </button>
                          );
                        }
                        return (
                          <div key={idx} className={`whitespace-pre-wrap break-words ${toneClass}`}>
                            {line.text}
                          </div>
                        );
                      })}
                    </div>
                  ))
                )}
                <div ref={outputEndRef} />
              </div>

              {/* Autocomplete Suggestions while typing / */}
              {matchingSuggestions.length > 0 && (
                <div className="px-2 pb-1.5 pt-1 border-t border-black/[0.06] dark:border-white/[0.07] space-y-0.5">
                  {matchingSuggestions.map((s) => (
                    <button
                      key={s.syntax}
                      type="button"
                      onClick={() => {
                        setInputValue(s.insertText);
                        inputRef.current?.focus();
                      }}
                      className="w-full px-2.5 py-1.5 rounded-[6px] flex items-center justify-between gap-3 text-left hover:bg-black/[0.06] dark:hover:bg-white/[0.08] transition-colors cursor-pointer border-none bg-transparent"
                    >
                      <span className="font-mono text-[11.5px] font-medium text-[#005fb8] dark:text-[#4cc2ff] truncate">
                        {s.syntax}
                      </span>
                      <span className="text-[11px] text-black/55 dark:text-white/55 truncate shrink-0 max-w-[46%]">
                        {s.description}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Command Prompt Input Strip (matching Search UI strip) */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                executeCommand(inputValue);
              }}
              style={{
                backgroundColor: isLightMode ? 'rgba(255, 255, 255, 0.96)' : 'rgba(20, 22, 27, 0.96)',
              }}
              className="h-[46px] px-3.5 border-t border-black/[0.06] dark:border-white/[0.08] flex items-center gap-2 shrink-0"
            >
              <span className="font-mono text-[12.5px] font-semibold text-[#005fb8] dark:text-[#4cc2ff] shrink-0 select-none">
                C:\&gt;
              </span>
              <input
                ref={inputRef}
                id="windows-direct-command-input"
                type="text"
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  setHistoryIdx(-1);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Type a command (e.g. /help)"
                autoComplete="off"
                spellCheck={false}
                className="flex-1 min-w-0 !bg-transparent font-mono text-[13px] text-[#111827] dark:text-white placeholder-black/50 dark:placeholder-white/50 !outline-none focus:!outline-none !border-none !shadow-none"
              />
              {inputValue && (
                <button
                  type="button"
                  onClick={() => {
                    setInputValue('');
                    inputRef.current?.focus();
                  }}
                  aria-label="Clear command"
                  className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/15 cursor-pointer border-none bg-transparent text-black/60 dark:text-white/70"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="submit"
                aria-label="Run command"
                title="Run command (Enter)"
                className="w-7 h-7 rounded-[6px] flex items-center justify-center bg-[#0078d4]/12 dark:bg-[#4cc2ff]/15 hover:bg-[#0078d4]/22 dark:hover:bg-[#4cc2ff]/25 text-[#005fb8] dark:text-[#4cc2ff] transition-colors cursor-pointer border-none shrink-0"
              >
                <CornerDownLeft className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};
