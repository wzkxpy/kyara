# AGENTS.md

## 代码规范
- 代码注释使用简洁中文，只在必要位置添加。
- 不要为显而易见的代码添加冗余注释。
- 修改或新增功能时，同步维护相关注释。
- 保持 TypeScript、Vue、Electron 的分层结构清晰。

## 当前环境限制
- 当前环境只能手动运行 npm 命令。
- Agent 不要自动执行 npm install、npm run、npm build、npm test。
- 需要执行 npm 相关命令时，应明确提示用户在本机终端手动运行。
- 构建或测试结果由用户反馈后再继续处理。

## 项目结构约定
- `src/main`：Electron 主进程。
- `src/preload`：预加载脚本，负责安全桥接。
- `src/renderer/src`：Vue 渲染层代码。
- `resources`：运行时资源。
- `build`：打包资源。
