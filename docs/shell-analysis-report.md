# DSH 桌面壳竞品分析报告（6 个项目源码解剖）

> 生成：2026-08 · 基于本地克隆的 6 个社区仓库逐文件源码分析（位于 `D:\Hermes\000.project\research\dsh-desktop-shells\`）
> 分析目标：为自研路线 C 提供证据——如何造一个"不破坏万物皆插件 + 可热更新"的 DSH 桌面壳

---

## 一、六壳总览

| 项目 | 技术栈 | 加载方式 | 壳核关系 | 更新机制 | 插件生态 |
|---|---|---|---|---|---|
| kevenxz/dsh-desktop | Electron 37 + JS | spawn → loadURL | dsh 作为 npm 依赖随壳打包 | ❌ 无 updater | ✅ 100% 兼容（核冻结 rc.6） |
| ChisaAlter/Deepseek-Harness-Desktop | Electron 33 + JS | 三重 spawn → loadURL | **vendor 整个源码 1.4GB** | GitHub Releases 整壳换装 | ⚠️ 基本兼容（魔改 UI + 冻结 rc.5） |
| lijian-ui/dsh-desktop | Electron 43 + TS | spawn `--port 0` → 解析 stdout → loadURL | dsh npm 依赖 asarUnpack | electron-updater 整壳更新 | ✅ 兼容（最小 preload） |
| csyyywy/dsh-desktop | Electron 43 + React19 | spawn → loadURL | **核独立 npm 安装，与壳分离** | **双层：壳静默自更 + 核锁定/回滚** | ✅ 兼容（零 preload 注入） |
| xiincs/deepseek-harness-desktop | Tauri 2 + Rust | spawn → **iframe 加载** | 零 IPC 容器 | tauri-plugin-updater（壳）+ 核构建期 pin | ✅ 兼容（iframe 隔离最彻底） |
| Quan-Robin/DSH-desktop-for-Linux | Electron 43.4 + JS | spawn → 直接 loadURL | npx/global/bundled 三模式 | **双层：壳自更 + dsh npm 一键热更** | ✅ 兼容（插件失败自动禁用） |

---

## 二、各家"长什么样"（基于代码 + README + 本地截图推断）

- **kevenxz**：最朴素的窗口——一个 1280×820 原生窗口直接装官方 UI，托盘菜单极简。像"官方网页套了个窗框"。
- **ChisaAlter**：最华丽——无边框自绘标题栏（配色跟随主题）、右侧面板（Git/PTY 终端）、插件市场、MCP/技能集成。像"Hermes 风格的完整 IDE 化 DSH"。
- **lijian-ui**：工程化最规范——TS 模块化（dsh-process/updater/tray/window 各司其职），界面接近官方原版 + 托盘。
- **csyyywy**：带自研仪表盘 + 插件管理器（pnpm 装进 profiles/web + 备份回滚），React/Tailwind 现代化前端。
- **xiincs**：无边框 + 右侧原生 dock（文件树/Git/编辑器/终端/插件市场），官方 UI 嵌在 iframe 里。本地截图在 `research\dsh-desktop-shells\xiincs-deepseek-harness-desktop\docs\screenshots\`（app-boot.png / app-running.png），可直接打开看。
- **Quan-Robin**：Linux 向，主窗口即官方界面，托盘打磨细（含 Wayland SNI 支持）。

---

## 三、优缺点提炼（按主题横切）

### 加载方式
- ✅ 六家全部收敛到同一条路：**spawn 官方 `dsh web` + loadURL/iframe 加载官方 UI**——没有任何一家敢自研替代 UI（xiincs 的自研 UI 只是"启动页 + 扩展 dock"的容器，官方 UI 完整嵌在 iframe 里）。这是保住插件生态的行业共识。
- ✅ 端口策略亮点：lijian-ui 用 `--port 0` 让系统分配随机端口，从 stdout 正则解析真实 URL——彻底避免端口冲突。

### 更新机制（优劣两极化）
- ❌ kevenxz / lijian-ui：核随壳打包，版本冻结，升级必须重发安装包——**反面教材**。
- ❌ ChisaAlter：整壳+整核一起换，无回滚；且 vendor 源码导致升级要 subtree 三方合并——**最差模式**。
- ✅ csyyywy：**双层更新模型**——壳走 NSIS 静默自更新，核独立 npm 安装 + 版本锁定/回滚。壳核互不阻塞。
- ✅ Quan-Robin：**真·dsh 热更新**——启动比对 `dsh --version` vs npm 最新，一键 `npm install -g` 后重启服务生效。全场唯一实现核运行时热更新的。

### 对"万物皆插件"的态度
- ✅ 零破坏派：kevenxz、lijian-ui（最小 preload）、csyyywy（零 preload）、xiincs（iframe 零 IPC）、Quan-Robin——全部走官方 UI + 官方 `dsh plugin` 体系，cordis.yml/client 插件原样可用。
- ⚠️ 魔改派：ChisaAlter——preload 注入 `window.shell` 大量 IPC + `executeJavaScript` 注入标题栏 chrome，vendor 冻结 rc.5。功能最强但升级最痛。
- 💡 亮点：csyyywy 的插件管理器本质是官方 `dsh plugin --profile` 的封装 + reconcile + 备份回滚；Quan-Robin 写 cordis.patch.yml 自动禁用坏插件——**都在官方机制上做加法，不碰内核**。

### 稳定性
- ✅ xiincs：崩溃自愈 + 进程树清理、安装确认 + 风险提示。
- ⚠️ 各家通病：依赖 stdout 格式解析端口/依赖 ~/.dsh 内部格式（未公开 API），上游一改就碎——这是自研壳必须接受的脆弱性，解法是**探测后快速失败 + 版本门禁**（ChisaAlter 的 parseCompatibilityFeatures 门禁思路可取）。

---

## 四、对路线 C 的设计裁决（对照你的两条硬要求）

### 要求 1：不破坏"万物皆插件"
**铁律（六壳证据共同指向）：**
1. **绝不 vendor / fork DSH 源码**——ChisaAlter 用 1.4GB 换来版本冻结，是唯一反面教材
2. **spawn 官方 `dsh web`，loadURL 官方 UI**——六家共识，没有例外
3. **preload 只注入白名单最小桥**（窗口控制/通知），绝不 executeJavaScript 魔改 DOM
4. **桌面扩展能力走官方插件机制**——想加"桌面级"功能（托盘通知、系统事件）就写成 DSH 插件（cordis + api-gateway 的 Typert remote），壳只做转发。这样桌面能力本身也是一块积木，可插拔、可热载
5. 插件管理一律代理官方 `dsh plugin --profile web` / `--patch`，不另起炉灶

### 要求 2：桌面应用可热更新
**三层热更新架构（吸收各家优点）：**
| 层 | 内容 | 机制（来源） |
|---|---|---|
| 第 1 层：UI 内容 | 官方 UI + client 插件 | DSH 自带（dev:web HMR / 官方热载），壳不干预 |
| 第 2 层：核（dsh） | 本体运行时 | Quan-Robin 模式：启动比对 npm 版本 → 一键 `npm install -g @deepseek-ai/dsh` → 重启服务生效 |
| 第 3 层：壳（窗口/托盘/热键） | 自研桌面层 | csyyywy 模式：electron-updater 静默更新 + 版本锁定/回滚；开发期另加 watch + 主进程热重启（修改托盘/菜单代码保存即生效） |

关键设计：**壳是"哑窗户"，所有智能都留在核里**——核升级不打断壳，壳升级不碰核，UI 层永远跟随官方。三条更新管线互不阻塞，这正是 Hermes（整壳+整核捆绑更新，翻车 6 次）没做到的事。

### 技术选型建议
- **Electron 43 + TypeScript**（与你的 Node/pnpm 环境同构；Hermes 同款物种；社区样本最多），骨架参考 lijian-ui 的模块划分，更新模型参考 csyyywy + Quan-Robin
- Tauri 2 是备选（更小更快），但需要 Rust 工具链且社区样本仅 Windows 可用，暂不推荐起步用

---

## 五、一句话总结

**六家壳已用血泪验证：官方 UI + 官方 dsh 是唯一正确内核，壳核分离是唯一正确姿势；你的两条要求（插件生态 + 热更新）在技术上完全可行——取 kevenxz 的零侵入骨架 + csyyywy 的双层更新 + Quan-Robin 的核热更 + xiincs 的 iframe 隔离，拒绝 ChisaAlter 的 vendor 路线，就是路线 C 的最优解。**

---

## 六、难度评估（附代码量证据）

| 参考实现 | 代码量 | 对应能力 |
|---|---|---|
| kevenxz | 264 行 / 1 文件 | 能用的 MVP（窗口+托盘+进程管理） |
| lijian-ui | 1,536 行 / 9 文件 | 规范 TS 架构 |
| Quan-Robin | 2,451 行 | + 核热更新 |
| csyyywy | 3,947 行 | + 双层更新 + 插件管理器 |
| ChisaAlter | 17,175 行 / 95 文件 | 魔改巨兽（反面教材） |

**总分：6/10。MVP 3/10；稳定性加固 5/10；双层热更新 6/10；桌面桥插件 7/10。**

三个真正的难点（不是窗口/托盘，那些很浅）：
1. **进程生命周期鲁棒性**：崩溃自愈、进程树清理、stdout 解析端口的脆弱性（六壳通病，上游一改就碎）→ 解法：版本门禁 + 快速失败 + 固定端口探测
2. **双层更新与回滚**：壳走 electron-updater + 版本锁定回滚；核走 npm 版本比对 + 一键升级重启（Quan-Robin 模式）
3. **DSH 预览版破坏性变更**：官方明示随时破坏兼容 → 锁定版本 + 升级前跑自测

给你的技能要求：几乎为零（你负责跑命令和拍板，代码由 AI 全部生成）。
时间线（AI 写码模式）：MVP 1-2 次会话；+ 双层更新/热键/自启 再加 1-2 次；桌面桥插件 2-3 次。

诚实提醒：壳解决的是"恢复"不是"预防"——DSH 预览版本身的偶发不稳定，壳只能做到崩了秒拉起；另注意 Electron 内置 Node 与 dsh 的 Node 要求可能不匹配，MVP 阶段用系统 Node（24.15）spawn 规避。
