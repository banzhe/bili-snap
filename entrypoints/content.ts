import type { SaveResult, ToBackground } from '@/lib/messages';
import { DEFAULT_SHORTCUT, matchShortcut, shortcutItem, type Shortcut } from '@/lib/shortcut';

const TOAST_MS = 2500;

let shortcut: Shortcut = DEFAULT_SHORTCUT;

export default defineContentScript({
  // bilibili 是 SPA，站内跳转不会重新注入，所以匹配整个站点、按键时再找 <video>。
  matches: ['*://www.bilibili.com/*'],
  main() {
    void shortcutItem.getValue().then((value) => (shortcut = value));
    shortcutItem.watch((value) => (shortcut = value));
    window.addEventListener('keydown', onKeydown, true);
  },
});

function onKeydown(event: KeyboardEvent): void {
  if (!matchShortcut(event, shortcut)) return;
  if (event.repeat || event.isComposing) return;
  if (isTyping(event)) return;

  const video = findVideo();
  if (!video) return;

  event.preventDefault();
  void snap(video);
}

/** 评论框、弹幕输入框、搜索框里打字时不截图。 */
function isTyping(event: KeyboardEvent): boolean {
  for (const node of event.composedPath()) {
    if (!(node instanceof HTMLElement)) continue;
    if (node.isContentEditable) return true;
    if (node instanceof HTMLTextAreaElement || node instanceof HTMLSelectElement) return true;
    if (node instanceof HTMLInputElement && !['button', 'checkbox', 'radio', 'range'].includes(node.type)) {
      return true;
    }
  }
  return false;
}

/** 每次按键都重新查找：切清晰度 / 换 P 时 bilibili 会重建 <video>。 */
function findVideo(): HTMLVideoElement | null {
  const player = document.querySelector<HTMLVideoElement>('#bilibili-player video');
  if (player && player.videoWidth > 0) return player;

  let best: HTMLVideoElement | null = null;
  for (const video of document.querySelectorAll('video')) {
    if (video.videoWidth === 0) continue;
    const area = video.clientWidth * video.clientHeight;
    if (!best || area > best.clientWidth * best.clientHeight) best = video;
  }
  return best;
}

async function snap(video: HTMLVideoElement): Promise<void> {
  try {
    if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      showToast('视频还没有可用的画面', 'fail');
      return;
    }

    const fileName = buildFileName(video);
    const dataUrl = captureFrame(video);
    const message: ToBackground = { target: 'background', type: 'save-frame', dataUrl, fileName };
    const result = (await browser.runtime.sendMessage(message)) as SaveResult | undefined;

    if (result?.ok) {
      showToast(`已保存 ${result.file ?? fileName}`, 'ok');
    } else if (result?.needsAuth) {
      showToast(`${result.error ?? '保存目录未授权'}，点此打开设置`, 'fail', openOptions);
    } else {
      showToast(`截图失败：${result?.error ?? '后台没有响应'}`, 'fail');
    }
  } catch (error) {
    showToast(`截图失败：${String(error)}`, 'fail');
  }
}

/** drawImage 只画 <video> 本身的解码帧，天然不含弹幕、字幕和播放器 UI。 */
function captureFrame(video: HTMLVideoElement): string {
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas 2d context unavailable');
  ctx.drawImage(video, 0, 0);
  return canvas.toDataURL('image/png');
}

function buildFileName(video: HTMLVideoElement): string {
  const title = document.title.replace(/_哔哩哔哩_bilibili$/, '').replace(/-哔哩哔哩$/, '').trim();
  const id = location.pathname.match(/(BV\w+|ep\d+|ss\d+)/)?.[1] ?? '';
  const page = new URLSearchParams(location.search).get('p');
  const parts = [title || 'bilibili', id, page ? `p${page}` : '', formatTime(video.currentTime)];
  return `${sanitize(parts.filter(Boolean).join('_'))}.png`;
}

function formatTime(seconds: number): string {
  const total = Math.floor(seconds * 1000);
  const ms = total % 1000;
  const s = Math.floor(total / 1000) % 60;
  const m = Math.floor(total / 60_000) % 60;
  const h = Math.floor(total / 3_600_000);
  const pad = (value: number, width = 2) => String(value).padStart(width, '0');
  return `${h > 0 ? `${pad(h)}-` : ''}${pad(m)}-${pad(s)}.${pad(ms, 3)}`;
}

/** Windows 文件名不允许 <>:"/\|?* 和控制字符，也不能以点或空格结尾。 */
function sanitize(name: string): string {
  return name
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_')
    .replace(/\s+/g, ' ')
    .slice(0, 150)
    .replace(/[. ]+$/, '');
}

function openOptions(): void {
  const message: ToBackground = { target: 'background', type: 'open-options' };
  void browser.runtime.sendMessage(message);
}

let toast: HTMLDivElement | null = null;
let toastTimer: ReturnType<typeof setTimeout> | undefined;

function showToast(text: string, kind: 'ok' | 'fail', onClick?: () => void): void {
  toast?.remove();
  clearTimeout(toastTimer);

  const el = document.createElement('div');
  el.textContent = text;
  Object.assign(el.style, {
    position: 'fixed',
    top: '16px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: '2147483647',
    maxWidth: '80vw',
    padding: '8px 14px',
    borderRadius: '6px',
    font: '13px/1.5 system-ui, "Microsoft YaHei", sans-serif',
    color: '#fff',
    background: kind === 'ok' ? 'rgba(20, 140, 90, 0.92)' : 'rgba(200, 50, 50, 0.92)',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
    wordBreak: 'break-all',
    cursor: onClick ? 'pointer' : 'default',
    pointerEvents: onClick ? 'auto' : 'none',
  } satisfies Partial<CSSStyleDeclaration>);
  if (onClick) el.addEventListener('click', onClick);

  // 全屏时挂在普通位置会被遮住，必须挂进全屏元素内部。
  (document.fullscreenElement ?? document.body).append(el);
  toast = el;
  toastTimer = setTimeout(() => el.remove(), onClick ? TOAST_MS * 2 : TOAST_MS);
}
