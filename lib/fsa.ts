// lib.dom 的 File System Access 声明随 TypeScript 版本变动，这里用局部结构类型，
// 避免 spike 依赖具体 TS lib 版本。
export interface WritableLike {
  write(data: BufferSource | Blob | string): Promise<void>;
  close(): Promise<void>;
  abort(): Promise<void>;
}

export interface FileHandleLike {
  readonly kind: 'file';
  readonly name: string;
  getFile(): Promise<File>;
  createWritable(options?: { keepExistingData?: boolean }): Promise<WritableLike>;
}

export interface DirHandleLike {
  readonly kind: 'directory';
  readonly name: string;
  queryPermission(descriptor?: { mode?: 'read' | 'readwrite' }): Promise<PermissionState>;
  requestPermission(descriptor?: { mode?: 'read' | 'readwrite' }): Promise<PermissionState>;
  getFileHandle(name: string, options?: { create?: boolean }): Promise<FileHandleLike>;
  removeEntry(name: string, options?: { recursive?: boolean }): Promise<void>;
}

type DirPicker = (options?: {
  id?: string;
  mode?: 'read' | 'readwrite';
  startIn?: unknown;
}) => Promise<unknown>;

function dirPicker(): DirPicker {
  const picker = (globalThis as { showDirectoryPicker?: DirPicker }).showDirectoryPicker;
  if (typeof picker !== 'function') {
    throw new Error('showDirectoryPicker is not available in this context');
  }
  return picker;
}

export function canPickDirectory(): boolean {
  try {
    dirPicker();
    return true;
  } catch {
    return false;
  }
}

/** 必须在有用户手势的可见页面里调用。 */
export async function pickDirectory(): Promise<DirHandleLike> {
  const handle = await dirPicker()({ id: 'bili-snap-save-dir', mode: 'readwrite' });
  return handle as DirHandleLike;
}

export function queryDirPermission(handle: DirHandleLike): Promise<PermissionState> {
  return handle.queryPermission({ mode: 'readwrite' });
}

/** 同样需要用户手势；在 offscreen document 里不会弹窗。 */
export function requestDirPermission(handle: DirHandleLike): Promise<PermissionState> {
  return handle.requestPermission({ mode: 'readwrite' });
}
