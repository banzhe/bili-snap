import { storage } from '#imports';

/** 用 event.code 匹配，不受输入法、Shift 大小写和键盘布局影响；key 只用来显示。 */
export interface Shortcut {
  code: string;
  key: string;
  ctrl: boolean;
  alt: boolean;
  shift: boolean;
  meta: boolean;
}

export const DEFAULT_SHORTCUT: Shortcut = {
  code: 'KeyZ',
  key: 'z',
  ctrl: false,
  alt: false,
  shift: false,
  meta: false,
};

export const shortcutItem = storage.defineItem<Shortcut>('local:shortcut', {
  fallback: DEFAULT_SHORTCUT,
});

const MODIFIER_KEYS = new Set(['Control', 'Alt', 'Shift', 'Meta', 'AltGraph', 'CapsLock', 'Fn', 'OS']);

/** bilibili 播放器自带的单键快捷键，绑定它们会同时触发播放器动作。 */
const BILIBILI_KEYS = new Set(['Space', 'KeyF', 'KeyD', 'KeyM', 'BracketLeft', 'BracketRight', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']);

export function matchShortcut(event: KeyboardEvent, shortcut: Shortcut): boolean {
  return (
    event.code === shortcut.code &&
    event.ctrlKey === shortcut.ctrl &&
    event.altKey === shortcut.alt &&
    event.shiftKey === shortcut.shift &&
    event.metaKey === shortcut.meta
  );
}

/** 录制时只按了修饰键返回 null，等用户按下主键。 */
export function shortcutFromEvent(event: KeyboardEvent): Shortcut | null {
  if (MODIFIER_KEYS.has(event.key) || !event.code) return null;
  return {
    code: event.code,
    key: event.key,
    ctrl: event.ctrlKey,
    alt: event.altKey,
    shift: event.shiftKey,
    meta: event.metaKey,
  };
}

export function shortcutParts(shortcut: Shortcut): string[] {
  const parts: string[] = [];
  if (shortcut.ctrl) parts.push('Ctrl');
  if (shortcut.alt) parts.push('Alt');
  if (shortcut.shift) parts.push('Shift');
  if (shortcut.meta) parts.push('Meta');
  parts.push(keyLabel(shortcut));
  return parts;
}

export function formatShortcut(shortcut: Shortcut): string {
  return shortcutParts(shortcut).join(' + ');
}

function keyLabel(shortcut: Shortcut): string {
  const { code, key } = shortcut;
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  if (code === 'Space') return 'Space';
  const arrows: Record<string, string> = { ArrowLeft: '←', ArrowRight: '→', ArrowUp: '↑', ArrowDown: '↓' };
  if (arrows[code]) return arrows[code];
  return key.length === 1 ? key.toUpperCase() : key;
}

export function conflictsWithBilibili(shortcut: Shortcut): boolean {
  const bare = !shortcut.ctrl && !shortcut.alt && !shortcut.meta;
  return bare && BILIBILI_KEYS.has(shortcut.code);
}

export function isSameShortcut(a: Shortcut, b: Shortcut): boolean {
  return a.code === b.code && a.ctrl === b.ctrl && a.alt === b.alt && a.shift === b.shift && a.meta === b.meta;
}
