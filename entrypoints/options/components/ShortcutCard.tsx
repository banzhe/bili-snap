import CircleAlert from 'lucide-solid/icons/circle-alert'
import Keyboard from 'lucide-solid/icons/keyboard'
import RotateCcw from 'lucide-solid/icons/rotate-ccw'
import { For, Show, createEffect, createSignal, onCleanup, onMount } from 'solid-js'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Kbd, KbdGroup } from '@/components/ui/kbd'
import {
  DEFAULT_SHORTCUT,
  conflictsWithBilibili,
  formatShortcut,
  isSameShortcut,
  shortcutFromEvent,
  shortcutItem,
  shortcutParts,
  type Shortcut,
} from '@/lib/shortcut'

export function ShortcutKeys(props: { shortcut: Shortcut }) {
  return (
    <KbdGroup>
      <For each={shortcutParts(props.shortcut)}>
        {(part, index) => (
          <>
            <Show when={index() > 0}>
              <span class="text-xs text-muted-foreground">+</span>
            </Show>
            <Kbd>{part}</Kbd>
          </>
        )}
      </For>
    </KbdGroup>
  )
}

export default function ShortcutCard() {
  const [shortcut, setShortcut] = createSignal<Shortcut>(DEFAULT_SHORTCUT)
  const [recording, setRecording] = createSignal(false)
  const [message, setMessage] = createSignal('')

  onMount(() => {
    void shortcutItem.getValue().then(setShortcut)
    onCleanup(shortcutItem.watch(setShortcut))
  })

  async function save(next: Shortcut) {
    await shortcutItem.setValue(next)
    setShortcut(next)
    setMessage(`快捷键已改为 ${formatShortcut(next)}，已打开的视频页无需刷新即可生效。`)
  }

  // 录制期间在捕获阶段吞掉所有按键，避免触发按钮或页面上的其它快捷键。
  function onKeydown(event: KeyboardEvent) {
    event.preventDefault()
    event.stopPropagation()
    if (event.key === 'Escape' && !event.ctrlKey && !event.altKey && !event.shiftKey && !event.metaKey) {
      setRecording(false)
      return
    }
    const next = shortcutFromEvent(event)
    if (!next) return
    setRecording(false)
    void save(next)
  }

  createEffect(() => {
    if (!recording()) return

    window.addEventListener('keydown', onKeydown, true)
    window.addEventListener('blur', stopRecording)
    onCleanup(() => {
      window.removeEventListener('keydown', onKeydown, true)
      window.removeEventListener('blur', stopRecording)
    })
  })

  function startRecording() {
    ;(document.activeElement as HTMLElement | null)?.blur()
    setMessage('')
    setRecording(true)
  }

  function stopRecording() {
    setRecording(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>截图快捷键</CardTitle>
        <CardDescription>在 bilibili 视频页按下这个组合键截取当前帧。在输入框里打字时不会触发。</CardDescription>
      </CardHeader>
      <CardContent class="flex flex-col gap-4">
        <div
          class="flex h-14 items-center justify-center rounded-lg border border-dashed text-sm data-[recording=true]:border-primary data-[recording=true]:bg-accent"
          data-recording={recording()}
        >
          <Show when={recording()} fallback={<ShortcutKeys shortcut={shortcut()} />}>
            <span class="animate-pulse text-muted-foreground">请按下新的快捷键，Esc 取消</span>
          </Show>
        </div>

        <Show when={!recording() && conflictsWithBilibili(shortcut())}>
          <Alert variant="warning">
            <CircleAlert />
            <AlertDescription>
              这个键也是 bilibili 播放器的快捷键，按下时会同时触发播放器的动作，建议换一个或加上修饰键。
            </AlertDescription>
          </Alert>
        </Show>

        <Show when={message()}>
          <p class="text-sm text-muted-foreground">{message()}</p>
        </Show>
      </CardContent>
      <CardFooter class="flex-wrap">
        <Show
          when={recording()}
          fallback={
            <Button onClick={startRecording}>
              <Keyboard />
              修改快捷键
            </Button>
          }
        >
          <Button variant="outline" onClick={stopRecording}>
            取消
          </Button>
        </Show>
        <Button
          variant="ghost"
          disabled={recording() || isSameShortcut(shortcut(), DEFAULT_SHORTCUT)}
          onClick={() => void save(DEFAULT_SHORTCUT)}
        >
          <RotateCcw />
          恢复默认（Z）
        </Button>
      </CardFooter>
    </Card>
  )
}
