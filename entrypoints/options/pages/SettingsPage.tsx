import CircleAlert from 'lucide-solid/icons/circle-alert';
import FolderOpen from 'lucide-solid/icons/folder-open';
import Info from 'lucide-solid/icons/info';
import ShieldCheck from 'lucide-solid/icons/shield-check';
import { Show, createSignal, onCleanup, onMount } from 'solid-js';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { loadDirHandle, saveDirHandle } from '@/lib/dir-store';
import { pickDirectory, queryDirPermission, requestDirPermission, type DirHandleLike } from '@/lib/fsa';
import ShortcutCard from '../components/ShortcutCard';

type Permission = PermissionState | 'none';

const PERMISSION_LABEL: Record<Permission, string> = {
  granted: '已授权',
  prompt: '待授权',
  denied: '已拒绝',
  none: '未选择目录',
};

const PERMISSION_VARIANT = {
  granted: 'success',
  prompt: 'warning',
  denied: 'destructive',
  none: 'secondary',
} as const;

export default function SettingsPage() {
  const [dir, setDir] = createSignal<DirHandleLike | null>(null);
  const [permission, setPermission] = createSignal<Permission>('none');
  const [status, setStatus] = createSignal<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = createSignal(false);

  async function refresh() {
    const handle = await loadDirHandle();
    setDir(handle);
    setPermission(handle ? await queryDirPermission(handle) : 'none');
  }

  onMount(() => {
    void refresh();
    const onFocus = () => void refresh();
    window.addEventListener('focus', onFocus);
    onCleanup(() => window.removeEventListener('focus', onFocus));
  });

  async function run(label: string, task: () => Promise<string>) {
    setBusy(true);
    try {
      setStatus({ ok: true, text: `${label}：${await task()}` });
    } catch (error) {
      setStatus({ ok: false, text: `${label}失败：${String(error)}` });
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
      return `${handle.name}（${PERMISSION_LABEL[state]}）`;
    });

  // requestDirPermission 之前不能有任何 await，否则用户手势会失效。
  const authorize = () =>
    run('授权保存目录', async () => {
      const handle = dir();
      if (!handle) return '还没有保存目录，请先选择';
      const state = await requestDirPermission(handle);
      return state === 'granted' ? '已授权；如果弹出三选一，请选 Allow on every visit' : `未授权（${state}）`;
    });

  return (
    <div class="flex flex-col gap-6">
      <div>
        <h2 class="text-2xl font-semibold tracking-tight">配置</h2>
        <p class="mt-1 text-sm text-muted-foreground">
          在 bilibili 视频页按快捷键截取当前视频帧（不含弹幕、字幕和播放器 UI），PNG 会直接写入下面的保存目录。
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>保存目录</CardTitle>
          <CardDescription>截图写入的本地文件夹，需要读写权限。</CardDescription>
        </CardHeader>
        <CardContent>
          <dl class="grid grid-cols-[6rem_1fr] items-center gap-y-3 text-sm">
            <dt class="text-muted-foreground">目录</dt>
            <dd class="flex items-center gap-2 font-mono">
              <FolderOpen class="size-4 text-muted-foreground" />
              {dir()?.name ?? '（无）'}
            </dd>
            <dt class="text-muted-foreground">读写权限</dt>
            <dd>
              <Badge variant={PERMISSION_VARIANT[permission()]}>{PERMISSION_LABEL[permission()]}</Badge>
            </dd>
          </dl>
        </CardContent>
        <CardFooter class="flex-wrap">
          <Button disabled={busy()} onClick={chooseDir}>
            <FolderOpen />
            {dir() ? '更换保存目录' : '选择保存目录'}
          </Button>
          <Button variant="outline" disabled={busy() || !dir() || permission() === 'granted'} onClick={authorize}>
            <ShieldCheck />
            授权保存目录
          </Button>
        </CardFooter>
      </Card>

      <Show when={status()}>
        {(current) => (
          <Alert variant={current().ok ? 'default' : 'destructive'}>
            <Info />
            <AlertDescription class="break-all">{current().text}</AlertDescription>
          </Alert>
        )}
      </Show>

      <Show when={dir() && permission() !== 'granted'}>
        <Alert variant="warning">
          <CircleAlert />
          <AlertTitle>保存目录未授权，截图会保存失败</AlertTitle>
          <AlertDescription>
            点「授权保存目录」，弹出三选一时选 <b>Allow on every visit</b>，之后关闭本页也能持续写入。
          </AlertDescription>
        </Alert>
      </Show>

      <Card>
        <CardHeader>
          <CardTitle>如何获得持久授权</CardTitle>
          <CardDescription>
            第一次选目录只拿到会话级授权，浏览器重启后会失效。需要在之后的一次访问里，对已保存的目录再申请一次。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol class="list-decimal space-y-1.5 pl-5 text-sm">
            <li>重启浏览器。</li>
            <li>
              打开本设置页，确认读写权限显示为 <Badge variant="warning">待授权</Badge>。
            </li>
            <li>点「授权保存目录」。</li>
            <li>
              在弹出的三选一中选择 <b>Allow on every visit</b>。
            </li>
          </ol>
        </CardContent>
      </Card>

      <ShortcutCard />
    </div>
  );
}
