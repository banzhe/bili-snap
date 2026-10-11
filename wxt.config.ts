import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-solid'],
  manifest: {
    name: 'bili-snap',
    description: '在 bilibili 视频页按 z 截取不含弹幕的视频帧，保存到指定目录。',
    permissions: ['storage', 'offscreen'],
  },
});
