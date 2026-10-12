import {
  LOG_KEY,
  LOG_LIMIT,
  OFFSCREEN_PATH,
  type FramePayload,
  type LogEntry,
  type SaveResult,
  type ToBackground,
  type ToOffscreen,
} from '@/lib/messages'

export default defineBackground(() => {
  browser.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
    const msg = message as ToBackground | undefined
    if (msg?.target !== 'background') return false

    void (async () => {
      if (msg.type === 'save-frame') {
        sendResponse(await saveFrame(msg))
      } else if (msg.type === 'open-options') {
        await browser.runtime.openOptionsPage()
        sendResponse({ ok: true })
      }
    })()

    return true
  })
})

function offscreenUrl(): string {
  return browser.runtime.getURL(`/${OFFSCREEN_PATH}`)
}

async function offscreenExists(): Promise<boolean> {
  const contexts = await browser.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
    documentUrls: [offscreenUrl()],
  })
  return contexts.length > 0
}

let creatingOffscreen: Promise<void> | null = null

async function ensureOffscreen(): Promise<void> {
  if (await offscreenExists()) return

  creatingOffscreen ??= browser.offscreen
    .createDocument({
      url: OFFSCREEN_PATH,
      reasons: ['BLOBS'],
      justification: 'Write captured video frames to the user-picked directory.',
    })
    .finally(() => {
      creatingOffscreen = null
    })

  await creatingOffscreen
}

async function saveFrame(frame: FramePayload): Promise<SaveResult> {
  let result: SaveResult
  try {
    await ensureOffscreen()
    const message: ToOffscreen = {
      target: 'offscreen',
      type: 'save-frame',
      dataUrl: frame.dataUrl,
      fileName: frame.fileName,
    }
    const response = (await browser.runtime.sendMessage(message)) as SaveResult | undefined
    result = response ?? { ok: false, error: 'offscreen document did not respond' }
  } catch (error) {
    result = { ok: false, error: String(error) }
  }

  await appendLog(result)
  return result
}

async function appendLog(result: SaveResult): Promise<void> {
  const entry: LogEntry = { at: new Date().toISOString(), ...result }
  const stored = await browser.storage.local.get(LOG_KEY)
  const previous = (stored[LOG_KEY] as LogEntry[] | undefined) ?? []
  await browser.storage.local.set({ [LOG_KEY]: [entry, ...previous].slice(0, LOG_LIMIT) })
}
