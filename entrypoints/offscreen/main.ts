import { loadDirHandle } from '@/lib/dir-store'
import type { DirHandleLike } from '@/lib/fsa'
import type { SaveResult, ToOffscreen } from '@/lib/messages'

// 按顺序落盘：连按 z 时避免同名探测与写入交错。
let queue: Promise<unknown> = Promise.resolve()

browser.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
  const msg = message as ToOffscreen | undefined
  if (msg?.target !== 'offscreen' || msg.type !== 'save-frame') return false

  const task = queue.then(() => saveFrame(msg.dataUrl, msg.fileName))
  queue = task
  void task.then(sendResponse)
  return true
})

async function saveFrame(dataUrl: string, fileName: string): Promise<SaveResult> {
  try {
    const dir = await loadDirHandle()
    if (!dir) return { ok: false, needsAuth: true, error: '还没有选择保存目录' }

    const permission = await dir.queryPermission({ mode: 'readwrite' })
    if (permission !== 'granted') {
      return { ok: false, needsAuth: true, permission, error: '保存目录未授权' }
    }

    const blob = await (await fetch(dataUrl)).blob()
    const name = await uniqueName(dir, fileName)
    const fileHandle = await dir.getFileHandle(name, { create: true })
    const writable = await fileHandle.createWritable()
    try {
      await writable.write(blob)
      await writable.close()
    } catch (error) {
      await writable.abort()
      throw error
    }

    return { ok: true, file: `${dir.name}/${name}`, bytes: blob.size, permission }
  } catch (error) {
    const err = error as DOMException & Error
    return { ok: false, error: `${err.name ?? 'Error'}: ${err.message}` }
  }
}

/** 已存在同名文件时追加 (1)、(2)…，不覆盖旧截图。 */
async function uniqueName(dir: DirHandleLike, fileName: string): Promise<string> {
  const dot = fileName.lastIndexOf('.')
  const stem = dot > 0 ? fileName.slice(0, dot) : fileName
  const ext = dot > 0 ? fileName.slice(dot) : ''

  for (let index = 0; ; index += 1) {
    const candidate = index === 0 ? fileName : `${stem} (${index})${ext}`
    try {
      await dir.getFileHandle(candidate)
    } catch (error) {
      if ((error as DOMException).name === 'NotFoundError') return candidate
      throw error
    }
  }
}
