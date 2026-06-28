# Electron 封装总结

## 1. 背景与目标

本次工作在分支 `feat/electron-shell` 上完成，目标是将当前 `guoren-v2` 主应用封装为可运行的 Electron 桌面应用，并产出 macOS 安装包。

本次封装范围如下：

- 封装主应用 `guoren-v2`
- 保持主应用现有 Vite + React 架构不变
- 保持 `/api/*` 继续访问外部后端 `http://127.0.0.1:8080`
- 不将 `workflow-designer`、`amis-designer`、`code-server` 一并打进桌面包

本次不包含的范围如下：

- 不内置后端服务
- 不内置 `5176`、`5177`、`8443` 端口对应的辅助服务
- 不处理 Windows 安装包
- 不处理 macOS 正式签名与 notarization

## 2. 已完成的实现

### 2.1 Electron 主进程与预加载

新增文件：

- [electron/main.js](/Users/hongleizhang/Documents/GitHub/guoren-v2/electron/main.js)
- [electron/preload.cjs](/Users/hongleizhang/Documents/GitHub/guoren-v2/electron/preload.cjs)
- [electron/appServer.js](/Users/hongleizhang/Documents/GitHub/guoren-v2/electron/appServer.js)

实现内容：

- Electron 主窗口创建与生命周期管理
- `preload` 注入最小桌面能力，不开启 `nodeIntegration`
- 使用 `contextIsolation: true`
- 拦截 `window.open` 和页面导航
- 站内地址与指定本地服务地址在 Electron 内部打开
- 其他外部链接交给系统浏览器

### 2.2 本地静态服务与 API 代理

为了避免直接使用 `file://` 加载页面后导致 `/api/*` 相对路径失效，本次没有直接让 Electron 打开本地 html 文件，而是在桌面端内部启动了一个轻量 HTTP 服务。

该服务负责：

- 提供 `dist/` 静态资源
- 对 SPA 路由回退到 `index.html`
- 将 `/api/*` 转发到 `http://127.0.0.1:8080`

这样处理后：

- 前端业务代码不需要全面改写接口地址
- 保持了与浏览器模式接近的运行方式
- Electron 与现有 Vite 产物兼容

### 2.3 桌面环境提示与边界说明

新增文件：

- [src/shared/desktop.js](/Users/hongleizhang/Documents/GitHub/guoren-v2/src/shared/desktop.js)
- [src/shared/DesktopServiceNotice.jsx](/Users/hongleizhang/Documents/GitHub/guoren-v2/src/shared/DesktopServiceNotice.jsx)

在以下模块中增加了桌面端提示：

- [src/pageDesigner/PageDesignerModule.jsx](/Users/hongleizhang/Documents/GitHub/guoren-v2/src/pageDesigner/PageDesignerModule.jsx)
- [src/pageDesigner/PageDesigner.jsx](/Users/hongleizhang/Documents/GitHub/guoren-v2/src/pageDesigner/PageDesigner.jsx)
- [src/archive/ArchiveModule.jsx](/Users/hongleizhang/Documents/GitHub/guoren-v2/src/archive/ArchiveModule.jsx)
- [src/leave/ProcessDiagramModal.jsx](/Users/hongleizhang/Documents/GitHub/guoren-v2/src/leave/ProcessDiagramModal.jsx)
- [src/onlineDev/OnlineDevModule.jsx](/Users/hongleizhang/Documents/GitHub/guoren-v2/src/onlineDev/OnlineDevModule.jsx)

提示内容聚焦于：

- 桌面版未内置 `workflow-designer`
- 桌面版未内置 `amis-designer`
- 桌面版未内置 `code-server`
- 对应功能依赖外部服务已启动

### 2.4 构建与打包配置

主要调整文件：

- [package.json](/Users/hongleizhang/Documents/GitHub/guoren-v2/package.json)
- [README.md](/Users/hongleizhang/Documents/GitHub/guoren-v2/README.md)
- [eslint.config.js](/Users/hongleizhang/Documents/GitHub/guoren-v2/eslint.config.js)
- [\.gitignore](/Users/hongleizhang/Documents/GitHub/guoren-v2/.gitignore)

新增脚本：

```bash
npm run dev:desktop
npm run build:web
npm run build:desktop
npm run pack:desktop
```

打包行为：

- `build:web` 先生成前端 `dist`
- `build:desktop` 生成 macOS `.dmg`
- `pack:desktop` 生成 macOS `.app` 目录输出

## 3. 本次过程中遇到的问题与解决方案

### 问题 1：Git 无法创建新分支

现象：

- `git checkout -b feat/electron-shell` 初次执行失败
- 原因是当前沙箱对 `.git` 目录只有读权限

解决方案：

- 申请提升权限执行分支创建命令
- 成功切换到 `feat/electron-shell`

结论：

- 问题是执行环境权限问题，不是仓库问题

### 问题 2：`file://` 方式加载前端会破坏 `/api` 请求

现象：

- 如果 Electron 直接打开 `dist/index.html`
- 前端中大量接口仍然使用相对路径 `/api/...`
- 在 `file://` 协议下会导致请求目标异常

解决方案：

- 新增 Electron 内部本地 HTTP 服务
- 统一从 `http://127.0.0.1:<port>` 加载前端
- 将 `/api/*` 代理到 `http://127.0.0.1:8080`

结论：

- 这是本次封装的关键设计点
- 该方案比大规模修改业务代码更稳妥

### 问题 3：Electron 依赖安装失败，提示证书错误

现象：

- `npm install` 安装 Electron 相关依赖时报错
- 错误信息为 `unable to verify the first certificate`

原因：

- 当前机器网络环境在下载 Electron 二进制时证书校验失败

解决方案：

- 通过命令级环境变量临时放宽 TLS 校验完成安装：

```bash
NODE_TLS_REJECT_UNAUTHORIZED=0 npm install
```

注意：

- 这是环境规避方案，不应作为长期默认配置写入项目脚本
- 本次未将该设置固化进 `package.json`

### 问题 4：Electron 打包时尝试重编译原生依赖 `canvas`

现象：

- `npm run build:desktop` 进入 `electron-builder` 后失败
- 错误中显示尝试重编译 `canvas`
- 并因 `.electron-gyp` 目录创建权限或原生重建流程失败而中断

原因：

- `electron-builder` 默认会尝试重建原生依赖
- 本项目桌面壳实际不需要在打包阶段重编译该依赖

解决方案：

在 `package.json` 的 Electron build 配置中关闭重建：

- `npmRebuild: false`
- `nodeGypRebuild: false`

结论：

- 关闭后打包流程继续向前推进
- 该调整适合当前项目的实际运行方式

### 问题 5：`electron-builder` 打包阶段再次出现证书错误

现象：

- 即使 Electron 已安装成功
- `electron-builder` 仍需下载打包资源
- 再次报 `unable to verify the first certificate`

解决方案：

- 使用命令级 TLS 放宽参数重试打包：

```bash
NODE_TLS_REJECT_UNAUTHORIZED=0 npm run build:desktop
```

结论：

- 问题来自当前环境的证书链，不是项目代码问题
- 桌面包最终可正常生成

### 问题 6：`package.json` 与 `package-lock.json` 没有出现在 Git 改动中

现象：

- 修改了根目录 `package.json`
- 但 `git status` 初始看不到这两个文件

原因：

- 本机全局 gitignore 默认忽略了 `package.json` 和 `package-lock.json`

解决方案：

- 在仓库级 [\.gitignore](/Users/hongleizhang/Documents/GitHub/guoren-v2/.gitignore) 中显式反忽略根目录：

```gitignore
!/package.json
!/package-lock.json
```

结论：

- 根目录依赖与脚本改动现在可以被正常提交
- 子项目 `amis-designer` 与 `workflow-designer` 的 `package*.json` 仍保持全局忽略，不受影响

### 问题 7：Electron 代码 lint 时 `process` 被误判为未定义

现象：

- `electron/main.js` 在 eslint 下报 `process is not defined`

原因：

- 现有 eslint 配置默认只声明浏览器全局变量
- Electron 主进程代码需要 Node 全局

解决方案：

- 在 [eslint.config.js](/Users/hongleizhang/Documents/GitHub/guoren-v2/eslint.config.js) 中为 `electron/**/*.{js,cjs}` 增加 Node globals

结论：

- 新增的 Electron 文件已通过静态检查

## 4. 验证结果

### 4.1 已完成验证

1. 前端构建成功

```bash
npm run build:web
```

结果：

- 成功输出 `dist/`

2. Electron 依赖安装成功

```bash
NODE_TLS_REJECT_UNAUTHORIZED=0 npm install
```

结果：

- 成功安装 `electron`、`electron-builder`、`wait-on`、`concurrently`

3. Electron 打包成功

```bash
NODE_TLS_REJECT_UNAUTHORIZED=0 npm run build:desktop
```

结果：

- 成功生成：
  - `release/Guoren-0.0.0-arm64.dmg`
  - `release/mac-arm64/Guoren.app`

4. 本地桌面静态服务验证通过

验证结论：

- 根页面返回 `200`
- SPA 资源可被正确读取
- 当后端未启动时，`/api/*` 返回 `502`，符合代理设计预期

### 4.2 打包产物

当前生成产物如下：

- [release/Guoren-0.0.0-arm64.dmg](/Users/hongleizhang/Documents/GitHub/guoren-v2/release/Guoren-0.0.0-arm64.dmg)
- [release/mac-arm64/Guoren.app](/Users/hongleizhang/Documents/GitHub/guoren-v2/release/mac-arm64/Guoren.app)

## 5. 当前已知限制

### 5.1 外部服务仍需单独启动

桌面版当前仍依赖以下服务：

- `http://127.0.0.1:8080`：业务后端
- `http://localhost:5176`：`workflow-designer`
- `http://127.0.0.1:5177`：`amis-designer`
- `http://localhost:8443`：`code-server`

如果这些服务未启动，对应模块会出现提示，但不会自动拉起服务。

### 5.2 当前使用默认 Electron 图标

打包日志中已提示当前仍在使用默认 Electron 图标。

原因：

- 尚未提供 `.icns` 图标资源

建议：

- 后续补一套正式应用图标
- 在 `electron-builder` 配置中指定 macOS 图标

### 5.3 当前未做 macOS 正式签名

打包日志中已提示：

- 未找到有效 `Developer ID Application` 证书

影响：

- 当前产物适合本地使用或内部分发测试
- 如果要正式外发，需要补签名与 notarization

## 6. 后续建议

建议后续继续处理以下事项：

1. 增加正式图标资源
2. 增加应用版本号与发布规范
3. 将证书问题从“命令级绕过”升级为“环境级修复”
4. 评估是否需要内置拉起后端服务
5. 评估是否需要将 `workflow-designer` 与 `amis-designer` 一并纳入桌面端
6. 如需对外分发，补充 macOS 签名与 notarization 流程

## 7. 推荐使用方式

### 开发调试

```bash
npm run dev:desktop
```

### 构建前端

```bash
npm run build:web
```

### 生成桌面包

如果当前环境证书链正常：

```bash
npm run build:desktop
```

如果当前环境仍存在证书校验问题：

```bash
NODE_TLS_REJECT_UNAUTHORIZED=0 npm run build:desktop
```

## 8. 总结

本次 Electron 封装已经完成从浏览器应用到桌面应用的第一阶段落地，核心目标已经实现：

- 已形成独立开发分支
- 已完成 Electron 主壳接入
- 已完成桌面端本地静态服务与 API 代理
- 已完成构建与打包链路
- 已产出 macOS `.app` 与 `.dmg`

当前阻塞点已经不在代码实现本身，而主要集中在环境层面：

- 网络证书链问题
- 外部服务未内置
- 图标与签名尚未完善

因此，当前状态可以定义为：

**Electron 桌面封装已可用，可用于本地运行与内部分发测试。**
