import { For, Show, createSignal, onCleanup, onMount } from 'solid-js'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { LOG_KEY, LOG_LIMIT, type LogEntry } from '@/lib/messages'

export default function LogsPage() {
  const [logs, setLogs] = createSignal<LogEntry[]>([])

  async function refresh() {
    const stored = await browser.storage.local.get(LOG_KEY)
    setLogs((stored[LOG_KEY] as LogEntry[] | undefined) ?? [])
  }

  onMount(() => {
    void refresh()
    const onChanged = (changes: Record<string, unknown>) => {
      if (LOG_KEY in changes) void refresh()
    }
    browser.storage.local.onChanged.addListener(onChanged)
    onCleanup(() => browser.storage.local.onChanged.removeListener(onChanged))
  })

  return (
    <div class="flex flex-col gap-6">
      <div>
        <h2 class="text-2xl font-semibold tracking-tight">保存日志</h2>
        <p class="mt-1 text-sm text-muted-foreground">最近 {LOG_LIMIT} 次截图的保存结果，新记录会自动出现。</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>保存记录</CardTitle>
          <CardDescription>
            共 {logs().length} 条，失败 {logs().filter((entry) => !entry.ok).length} 条
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Show
            when={logs().length > 0}
            fallback={<p class="py-8 text-center text-sm text-muted-foreground">还没有记录。</p>}
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>时间</TableHead>
                  <TableHead>结果</TableHead>
                  <TableHead class="text-right">大小</TableHead>
                  <TableHead>文件 / 错误</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <For each={logs()}>
                  {(entry) => (
                    <TableRow>
                      <TableCell class="whitespace-nowrap text-muted-foreground">
                        {new Date(entry.at).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={entry.ok ? 'success' : 'destructive'}>{entry.ok ? '成功' : '失败'}</Badge>
                      </TableCell>
                      <TableCell class="text-right whitespace-nowrap tabular-nums">
                        {entry.bytes ? `${Math.round(entry.bytes / 1024)} KB` : '-'}
                      </TableCell>
                      <TableCell
                        class={entry.ok ? 'font-mono text-xs break-all' : 'text-xs break-all text-destructive'}
                      >
                        {entry.file ?? entry.error ?? '-'}
                      </TableCell>
                    </TableRow>
                  )}
                </For>
              </TableBody>
            </Table>
          </Show>
        </CardContent>
      </Card>
    </div>
  )
}
