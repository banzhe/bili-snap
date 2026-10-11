import { For, Show, createSignal, onMount } from 'solid-js';
import { clearDirHandle, loadDirHandle, saveDirHandle } from '@/lib/dir-store';
import { pickDirectory, queryDirPermission, requestDirPermission, type DirHandleLike } from '@/lib/fsa';
import { LOG_KEY, type LogEntry } from '@/lib/messages';

export default function App() {
  const [dir, setDir] = createSignal<DirHandleLike | null>(null);
  const [permission, setPermission] = createSignal<PermissionState | 'none'>('none');
  const [offscreenAlive, setOffscreenAlive] = createSignal(false);
  const [logs, setLogs] = createSignal<LogEntry[]>([]);
  const [status, setStatus] = createSignal('');
  const [busy, setBusy] = createSignal(false);

  async function refresh() {
    const stored = await browser.storage.local.get(LOG_KEY);
    const handle = await loadDirHandle();
    setDir(handle);
    setPermission(handle ? await queryDirPermission(handle) : 'none');
    setLogs((stored[LOG_KEY] as LogEntry[] | undefined) ?? []);

    const offscreen = (await browser.runtime.sendMessage({
      target: 'background',
      type: 'offscreen-status',
    })) as { alive?: boolean } | undefined;
    setOffscreenAlive(Boolean(offscreen?.alive));
  }

  onMount(() => {
    void refresh();
    browser.storage.onChanged.addListener(() => void refresh());
    window.addEventListener('focus', () => void refresh());
  });

  async function run(label: string, task: () => Promise<string>) {
    setBusy(true);
    setStatus(`${label}…`);
    try {
      setStatus(`${label} → ${await task()}`);
    } catch (error) {
      setStatus(`${label} 失败：${String(error)}`);
    } finally {
      setBusy(false);
      await refresh();
    }
  }

  const chooseDir = () =>
    run('选择保存目录', async () => {
      const handle = await pickDirectory();
      let state = await queryDirPermission(handle);
      if (state !== 'granted') state = await requestDirPermission(handle);
      await saveDirHandle(handle);
      return `${handle.name}（readwrite=${state}）`;
    });

  // requestDirPermission 之前不能有任何 await，否则用户手势会失效。
  const authorize = () =>
    run('授权保存目录', async () => {
      const handle = dir();
      if (!handle) return '还没有保存目录，请先选择';
      const state = await requestDirPermission(handle);
      return state === 'granted' ? '已授权；如果弹出三选一，请选 Allow on every visit' : `未授权（${state}）`;
    });

  const closeOffscreen = () =>
    run('关闭 offscreen 文档', async () => {
      const result = await browser.runtime.sendMessage({ target: 'background', type: 'offscreen-close' });
      return JSON.stringify(result);
    });

  const forgetDir = () =>
    run('清除保存目录', async () => {
      await clearDirHandle();
      return '已清除';
    });

  return (
    <main>
      <h1>bili-snap 设置</h1>
      <p class="hint">
        在 bilibili 视频页按 <kbd>z</kbd> 截取当前视频帧（不含弹幕、字幕和播放器 UI），PNG 会直接写入下面的保存目录。
      </p>

      <section>
        <div class="row">
          <span>保存目录：</span>
          <code>{dir() ? dir()!.name : '（无）'}</code>
        </div>
        <div class="row">
          <span>readwrite 权限：</span>
          <code>{permission()}</code>
        </div>
        <div class="row">
          <span>offscreen 文档：</span>
          <code>{offscreenAlive() ? '存活' : '不存在'}</code>
        </div>
      </section>

      <section class="buttons">
        <button disabled={busy()} onClick={chooseDir}>
          选择 / 更换保存目录
        </button>
        <button disabled={busy() || !dir() || permission() === 'granted'} onClick={authorize}>
          授权保存目录
        </button>
        <button disabled={busy() || !offscreenAlive()} onClick={closeOffscreen}>
          关闭 offscreen 文档
        </button>
        <button disabled={busy() || !dir()} onClick={forgetDir}>
          清除保存目录
        </button>
      </section>

      <Show when={status()}>
        <p class="status">{status()}</p>
      </Show>

      <Show when={dir() && permission() !== 'granted'}>
        <p class="warn">
          当前权限是 <code>{permission()}</code>，按 z 会保存失败。点「授权保存目录」，弹出三选一时选{' '}
          <b>Allow on every visit</b>，之后关闭本页也能持续写入。
        </p>
      </Show>

      <p class="hint">
        持久授权说明：第一次选目录只拿到<b>会话级</b>授权，浏览器重启后会失效。要拿到持久授权，需在下一次访问时对已保存的目录再申请一次：
        关闭 offscreen 文档 → 关闭本页 → 重新打开设置页（权限显示 <code>prompt</code>）→ 点「授权保存目录」→ 选{' '}
        <b>Allow on every visit</b>。
      </p>

      <section>
        <h2>保存记录</h2>
        <Show when={logs().length > 0} fallback={<p class="hint">还没有记录。</p>}>
          <table>
            <thead>
              <tr>
                <th>时间</th>
                <th>结果</th>
                <th>大小</th>
                <th>文件 / 错误</th>
              </tr>
            </thead>
            <tbody>
              <For each={logs()}>
                {(entry) => (
                  <tr class={entry.ok ? 'ok' : 'fail'}>
                    <td>{new Date(entry.at).toLocaleString()}</td>
                    <td>{entry.ok ? '成功' : '失败'}</td>
                    <td>{entry.bytes ? `${Math.round(entry.bytes / 1024)} KB` : '-'}</td>
                    <td>{entry.file ?? entry.error ?? '-'}</td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </Show>
      </section>
    </main>
  );
}
