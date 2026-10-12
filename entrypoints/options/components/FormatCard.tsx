import { For, createSignal, onCleanup, onMount } from 'solid-js'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DEFAULT_IMAGE_FORMAT, IMAGE_FORMATS, imageFormatItem, type ImageFormat } from '@/lib/image-format'

export default function FormatCard() {
  const [format, setFormat] = createSignal<ImageFormat>(DEFAULT_IMAGE_FORMAT)

  onMount(() => {
    void imageFormatItem.getValue().then(setFormat)
    onCleanup(imageFormatItem.watch(setFormat))
  })

  function select(next: ImageFormat) {
    setFormat(next)
    void imageFormatItem.setValue(next)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>保存格式</CardTitle>
        <CardDescription>之后的截图按这个格式保存，已打开的视频页无需刷新即可生效。</CardDescription>
      </CardHeader>
      <CardContent>
        <div role="radiogroup" aria-label="保存格式" class="grid gap-3 sm:grid-cols-2">
          <For each={IMAGE_FORMATS}>
            {(option) => (
              <button
                type="button"
                role="radio"
                aria-checked={format() === option.value}
                class="flex flex-col gap-1 rounded-lg border p-4 text-left transition-colors outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-checked:border-primary aria-checked:bg-accent"
                onClick={() => select(option.value)}
              >
                <span class="flex items-center gap-2 text-sm font-medium">
                  <span
                    class="flex size-4 items-center justify-center rounded-full border data-[checked=true]:border-primary"
                    data-checked={format() === option.value}
                  >
                    <span
                      class="size-2 rounded-full bg-primary opacity-0 data-[checked=true]:opacity-100"
                      data-checked={format() === option.value}
                    />
                  </span>
                  {option.label}
                  <span class="font-mono text-xs text-muted-foreground">.{option.value}</span>
                </span>
                <span class="pl-6 text-xs text-muted-foreground">{option.description}</span>
              </button>
            )}
          </For>
        </div>
      </CardContent>
    </Card>
  )
}
