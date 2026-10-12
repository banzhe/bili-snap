export const OFFSCREEN_PATH = 'offscreen.html'
export const LOG_KEY = 'snapLog'
export const LOG_LIMIT = 50

export interface SaveResult {
  ok: boolean
  file?: string
  bytes?: number
  /** 写入时 offscreen 里查到的 readwrite 权限，排查授权问题用。 */
  permission?: string
  /** 没有目录或没有权限时为 true，内容脚本据此提示用户去设置页授权。 */
  needsAuth?: boolean
  error?: string
}

export interface LogEntry extends SaveResult {
  at: string
}

/** Chrome 的扩展消息走 JSON 序列化，Blob/ArrayBuffer 过不去，所以帧数据用 data URL 传。 */
export interface FramePayload {
  dataUrl: string
  fileName: string
}

export type ToBackground =
  | ({ target: 'background'; type: 'save-frame' } & FramePayload)
  | { target: 'background'; type: 'open-options' }

export type ToOffscreen = { target: 'offscreen'; type: 'save-frame' } & FramePayload
