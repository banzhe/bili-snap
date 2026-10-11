import { Show, createSignal, onMount } from 'solid-js';
import { loadDirHandle } from '@/lib/dir-store';
import { queryDirPermission } from '@/lib/fsa';
import { LOG_KEY, type LogEntry } from '@/lib/messages';
import './App.css';

export default function App() {
  const [dirName, setDirName] = createSignal('');
  const [granted, setGranted] = createSignal(false);
  const [last, setLast] = createSignal<LogEntry | null>(null);

  onMount(async () => {
    const handle = await loadDirHandle();
    setDirName(handle?.name ?? '');
    setGranted(handle ? (await queryDirPermission(handle)) === 'granted' : false);
    const stored = await browser.storage.local.get(LOG_KEY);
    setLast(((stored[LOG_KEY] as LogEntry[] | undefined) ?? [])[0] ?? null);
  });

  return (
    <div class="panel">
      <h1>bili-snap</h1>
      <p>在视频页按 z 截图</p>
      <p class={dirName() && granted() ? 'ok' : 'fail'}>
        {dirName() ? `保存目录：${dirName()}${granted() ? '' : '（未授权）'}` : '还没有选择保存目录'}
      </p>
      <Show when={last()}>
        {(entry) => (
          <p class={entry().ok ? 'ok' : 'fail'}>
            最近一次：{entry().ok ? entry().file : `失败 · ${entry().error ?? ''}`}
          </p>
        )}
      </Show>
      <button onClick={() => browser.runtime.openOptionsPage()}>打开设置</button>
      <p class="hint">选目录和授权在设置页完成：popup 关闭会中断文件夹选择对话框。</p>
    </div>
  );
}
