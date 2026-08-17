# DSH Desktop 自研桌面壳 · 架构蓝图（定稿）

> 代号：DSH Desktop（自研，路线 C）
> 日期：2026-08 · 基于六壳竞品解剖 + 官方接缝文档（api-gateway / CLI / cordis）
> 两条铁律：① 绝不破坏"万物皆插件" ② 桌面应用可热更新

---

## 1. 设计原则（由竞品解剖得出）

1. **壳核分离**：壳是"哑窗户"，所有智能留在官方 DSH 核里。壳永不 vendor、永不魔改官方 UI。
2. **零侵入加载**：spawn 官方 `dsh web` → loadURL 官方 UI；preload 只注入白名单最小桥。
3. **三层独立更新**：UI 内容、核、壳三条更新管线互不阻塞，各自可回滚。
4. **进程管家**：壳接管 dsh 进程生命周期——崩溃自愈（这是解决"浏览器剥离版报错打不开"的对症药）。
5. **桌面能力插件化**：桌面扩展（托盘事件/通知/系统信息）写成 DSH cordis 插件，通过 api-gateway（Typert remote）暴露——桌面本身也是一块积木。

## 2. 总体架构

```
┌──────────────────────────────────────────────────┐
│ 第 3 层：桌面壳（Electron 43 + TypeScript）        │
│  ┌─────────┐ ┌─────────┐ ┌──────────┐ ┌───────┐  │
│  │ 窗口管理 │ │托盘/热键│ │ 通知/自启 │ │壳更新器│  │
│  └─────────┘ └─────────┘ └──────────┘ └───────┘  │
│  ┌─────────────────────────────────────────────┐ │
│  │ 进程管家：spawn/健康检查/崩溃自愈/进程树清理   │ │
│  │ 兼容门禁：dsh 版本范围校验 + stdout 快速失败   │ │
│  └─────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────┐ │
│  │ 白名单 preload 桥（仅 window.dshDesktop）     │ │
│  └─────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────┤
│ 第 2 层：官方 DSH 核（npm @deepseek-ai/dsh）      │
│  spawn: node dsh web --port 0 --patch desktop.yml│
│  ┌────────────┐ ┌───────────┐ ┌──────────────┐  │
│  │ 官方 WebUI │ │ cordis 插件 │ │ api-gateway   │  │
│  │ (loadURL)  │ │ 生态原样    │ │ (Typert 远程) │  │
│  └────────────┘ └───────────┘ └──────────────┘  │
│  核更新器：npm 版本比对 → 一键升级 → 重启管家      │
├──────────────────────────────────────────────────┤
│ 第 1 层：UI 内容（官方 Web UI + client 插件）      │
│  热载由 DSH 官方机制保证，壳零干预                  │
└──────────────────────────────────────────────────┘
```

## 3. 项目目录结构

```
dsh-desktop/                        # 自研壳仓库（独立 git 仓库）
├─ src/
│  ├─ main/                         # Electron 主进程（壳层）
│  │  ├─ index.ts                   # 入口 + 单实例锁 + 生命周期编排
│  │  ├─ process-steward.ts         # dsh 进程管家（★ 核心）
│  │  ├─ window.ts                  # 主窗口（loadURL 官方 UI）
│  │  ├─ tray.ts                    # 托盘图标 + 菜单
│  │  ├─ hotkey.ts                  # 全局热键
│  │  ├─ notify.ts                  # 系统通知
│  │  ├─ autostart.ts               # 开机自启
│  │  ├─ shell-updater.ts           # 壳自更新（electron-updater + 回滚）
│  │  ├─ core-updater.ts            # 核更新（npm 比对 + 升级 + 重启）
│  │  ├─ version-gate.ts            # 兼容门禁（版本范围 + 快速失败）
│  │  └─ config.ts                  # 配置持久化
│  ├─ preload/
│  │  └─ bridge.ts                  # 白名单最小桥（contextIsolation + sandbox）
│  └─ shared/                       # IPC 协议常量、版本常量
├─ dsh-plugins/
│  └─ desktop-bridge/               # DSH 桌面桥插件（P2：cordis + api-gateway）
├─ profile/
│  └─ desktop.cordis.yml            # 壳专用 profile patch（挂桌面桥插件）
├─ build/                           # 图标、electron-builder.yml
├─ scripts/                         # dev-watch（壳热重载）、图标生成
└─ package.json
```

## 4. 模块说明

### 壳层（Electron 主进程）
- **process-steward**：spawn 系统 Node 跑 dsh bin（`--port 0` 随机端口），stdout 正则解析真实 URL，HTTP 探活，崩溃指数退避自动重启（上限后降级提示），退出时杀净进程树。规避 Electron 内置 Node 与 dsh 版本不匹配的坑。
- **version-gate**：启动时校验 dsh 版本是否在支持范围内；端口解析失败时快速失败并给出明确提示（六壳通病的解法）。
- **window**：BrowserWindow 加载官方 UI；无边框可选；记忆位置/大小；单实例锁。
- **shell-updater**：electron-updater 走 GitHub Releases（或本地静态服务器）+ latest.yml 签名校验；下载新壳 → 下次启动换装；保留上一版本安装包做回滚。
- **core-updater**：`dsh --version` vs npm registry 比对 → 一键 `npm install -g @deepseek-ai/dsh` → 重启 process-steward；记录版本链支持回退。
- **preload/bridge**：只暴露 `window.dshDesktop`（窗口控制/通知/壳版本查询），其余 IPC 一律不通；绝不 executeJavaScript 注入 DOM。

### DSH 核层（插件，P2 实施）
- **desktop-bridge**：cordis 插件，通过 api-gateway 的 Typert remote 把桌面事件（托盘点击/系统通知/窗口状态）注册为模型可调用的远程方法——桌面能力成为可插拔积木，卸载插件即还原纯 Web 形态。
- **desktop.cordis.yml**：壳启动时 `--patch` 叠加，只挂壳兼容插件清单。

### 打包层
- **electron-builder**：NSIS 安装包（与 Hermes 同款产物）；asar 打包；图标资源。

## 5. 三层热更新管线

| 层 | 更新物 | 通道 | 回滚 |
|---|---|---|---|
| L1 UI 内容 | 官方 UI + client 插件 | DSH 官方热载 / dev:web HMR | 官方机制 |
| L2 核 | @deepseek-ai/dsh（npm） | core-updater：版本比对 → 升级 → 重启管家 | npm 版本锁定/回退 |
| L3 壳 | 桌面壳本体 | shell-updater：electron-updater + latest.yml | 上一版本安装包 |

开发期额外通道：`scripts/dev-watch` 监听壳主进程源码 → 保存即重启壳（托盘/热键/窗口代码免手刷）。

## 6. 里程碑

- **MVP**（窗口+托盘+进程管家+自愈+门禁+打包）：~500-800 行
- **V1**（双层更新+热键+通知+自启）：+~800 行
- **V2**（desktop-bridge 插件：万物皆插件的桌面形态）：+~500 行插件
- 总规模预估 ~2,000-2,500 行，对标 lijian-ui/Quan-Robin 量级，远小于 csyyywy 的 3,947 行

## 7. 风险与对策

| 风险 | 对策 |
|---|---|
| DSH 预览版破坏性变更 | 版本门禁 + 锁定版本 + 升级前自测 |
| stdout 端口解析脆弱 | 快速失败 + 固定端口探测 + 门禁提示 |
| Electron Node ≠ dsh Node | 用系统 Node spawn（MVP 阶段） |
| 壳更新失败 | 上一版本安装包回滚 + 更新前校验签名 |
| 更新通道需服务器 | 先本地静态目录/自建 Releases，后接 GitHub Releases |

## 8. 与 Hermes 的差异点（卖点）

- 三层独立更新：Hermes 整壳整核捆绑更新（本机翻车 6 次），本设计壳核互不牵连
- 桌面能力插件化：桌面桥是 DSH 插件，可插拔、可热载、可卸载还原
- 零侵入：官方 UI + 官方插件生态完整保留，永久享受上游红利
