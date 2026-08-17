# DeepSeek Harness 本地化 & 积木化使用计划

> 目标：把 DSH 从"浏览器里的会话"变成"自己机器上的积木台"——本地构建、本地运行、像拼乐高一样按需拼装能力。
> 生成日期：2026-08（体检数据：Node v24.15.0 / pnpm 11.9.0 / git 2.53.0 / 克隆 v0.1.0-rc.5 @ 47f943859b）

---

## 0. 核心概念：什么是"积木"

DSH 的插件 = 一个 TypeScript 模块，导出 `apply(ctx)` 函数，通过 `cordis.yml` 挂载进系统。
每一种能力都是一块积木：

| 积木类型 | 对应子系统（packages/） | 你能拼出什么 |
|---|---|---|
| 工具积木 | `tools` | 新的 AI 可用工具（查数据、操作本地文件…） |
| 技能积木 | `skill` | 领域技能包（如万得金融技能） |
| 模型积木 | `llm` | 新增模型提供商/适配器 |
| UI 积木 | `client/*`（ui-slots、ui-theme、hmr） | 改发送按钮、加面板、换主题（博主玩法） |
| 编排积木 | `workflow` / `subagent` / `goal` | 批量并行任务、长期目标 |
| 沙箱积木 | `sandbox` / `code-runtime` | 自定义执行环境 |
| 外部智能体积木 | `acp` / `python/sdk` | 把别的智能体挂进来当插件 |

**拼装方式**：写 `cordis.yml` patch → `pnpm dsh web --patch ./xxx/cordis.yml` → 积木生效。
**积木间协作**：声明 `inject`（依赖注入），框架自动按依赖顺序装配，卸载时自动清理。

---

## M0 · 打地基：本地构建 + 本地运行（~30 分钟）

在 `D:\deepseek-harness` 执行：

```powershell
git pull                      # 同步最新代码
pnpm install                  # 安装依赖（首次约几分钟）
pnpm run build                # 构建所有包
pnpm dsh web --port 3081      # 启动自己的实例（避开当前 3080）
```

完成后浏览器打开 `http://127.0.0.1:3081`：
- 在「设置 → 模型」页配置 DeepSeek 提供商 + API Key（与你 Hermes 用的是同一个 key）
- 验证：能正常对话 = 地基完成

> ⚠️ 注意：`pnpm run dev:web`（开发模式热更新）需与 `dsh web` 并行跑，才能让 UI 插件改动免刷新生效。
> ⚠️ 当前正在运行的 DSH GUI 来自 `C:\Users\LHN20\AppData\Local\npm-cache\_npx\...`，改 `D:\deepseek-harness` 不会影响它——两者互不干扰。

---

## M1 · 第一块积木：hello 插件（~15 分钟）

官方教程 `docs/user/develop/basic/` 原样走一遍：

1. `mkdir scratch-plugin/src`
2. 写 `my-plugin.ts`：
   ```ts
   import type { Context } from '@deepseek-ai/cordis'
   export const name = 'hello-plugin'
   export function apply(ctx: Context) {
     console.log('[hello-plugin] plugin loaded!')
   }
   ```
3. 写 `scratch-plugin/cordis.yml`（绝对路径指向插件文件）
4. `pnpm dsh web --patch ./scratch-plugin/cordis.yml`
5. 启动日志出现 `[hello-plugin] plugin loaded!` = 你会拼积木了

---

## M2 · UI 积木：复刻博主玩法（~1-2 小时）

用 `ui-slots` 槽位 + `ui-theme` 设计令牌改界面：

- **改发送按钮**：定位 `ui-conversation` 里的发送按钮槽位，挂一个自定义组件替换它
- **加自定义面板**：在侧栏挂一个新面板（如"我的快捷命令"）
- **换主题**：改 `--dsw-*` 主题变量或做暗色皮肤
- 开发模式：`pnpm run dev:web` + `dsh web` 并行 → 保存即热更新，无需刷新
- 参考：`docs/web-styling.md`、`packages/client/ui-slots`、`packages/client/ui-theme`

---

## M3 · 工具积木：第一个实用工具（~2-3 小时）

参考 `docs/cookbook/adding-a-tool.md`：

```ts
export const name = 'my-tool-plugin'
export const inject = ['tools']
export function apply(ctx: Context) {
  ctx.tools.register({ /* 工具定义 + 执行函数 */ })
}
```

候选第一个实用工具（三选一）：
1. **本地文件工具箱**：让 DSH 能读写/搜索指定目录（超工作区场景）
2. **万得金融工具**：把当前会话的 wind-mcp-skill 能力固化成本地插件（MCP 配置方式接入）
3. **系统监控工具**：查进程/内存/磁盘，替代你手动跑命令

---

## M4 · 技能/模型积木：领域能力（~3-4 小时）

- 按 `docs/cookbook/adding-a-tool.md` 思路做**技能插件**：打包"提示词 + 工具 + 数据源"为可复用的技能（对标 Hermes 的技能目录模式）
- 按 `docs/cookbook/adding-an-llm-adapter.md` 加**第二个模型提供商**（如本地 Ollama），实现模型热切换

---

## M5 · 进阶：向 Hermes 短板开炮（长期目标，按需排期）

用 DSH 插件补 Hermes 有的能力：

| 目标能力 | 可行路线 |
|---|---|
| 桌面常驻/托盘 | `subprocess` + 桌面插件（托盘、全局热键） |
| 记忆 | `storage` + `session` 插件做长期记忆 |
| 语音 | `api` + 语音识别/合成服务插件 |
| 定时任务 | `schedule` 包（现成子系统） |
| 更多技能 | 订阅 [Oh-My-DSH](https://github.com/like-study1/Oh-My-DSH) 目录，或从 Hermes 的 skills 库移植 |

---

## M6 · 桌面化路线：像 Hermes 一样使用 DSH（三条路）

> 现状：DSH 官方只有 CLI + Web（apps/ 里无桌面端）。目标：独立窗口 + 托盘 + 热键 + 常驻。

### 路线 A · 零代码 PWA 壳（5 分钟尝鲜）
- Edge 打开 `http://127.0.0.1:3081` → 菜单「应用」→「将此站点作为应用安装」
- 或命令行：`msedge --app=http://127.0.0.1:3081`
- 配合开机自启：把 `pnpm dsh web --port 3081` 放进启动文件夹（Win+R → `shell:startup`）或任务计划程序
- 效果：独立窗口、任务栏图标、无浏览器边框；缺点：无托盘、无全局热键

### 路线 B · 社区成品壳（30 分钟，推荐起点）
- [kevenxz/dsh-desktop](https://github.com/kevenxz/dsh-desktop)：Windows 原生窗口 + 托盘 + 共享 DSH profiles/sessions，最贴合需求
- [csyyywy/dsh-desktop](https://github.com/csyyywy/dsh-desktop)：壳核分离，一键安装/启动/更新，不破坏扩展性
- [ChisaAlter/Deepseek-Harness-Desktop](https://github.com/ChisaAlter/Deepseek-Harness-Desktop)：支持主题和背景图个性化
- ⚠️ 使用前审查：看 star/最近提交/依赖清单，确认不上传配置或密钥；优选壳核分离方案

### 路线 C · 自造 Electron 壳（1-2 周，M5 正餐）
- 主进程 ~100 行：spawn `dsh web` → BrowserWindow 加载 → Tray 托盘 → globalShortcut 全局热键 → 通知 → 开机自启 → electron-builder 打包（Hermes 自己就是同款 win-unpacked 产物）
- 终极形态：做成 **dsh-desktop 插件**（Cordis 插件内嵌 Electron），桌面能力成为一块可插拔积木
- 捷径：从路线 B 的壳 fork 改造

### 桌面化后 vs Hermes 能力缺口
| Hermes 能力 | 桌面壳后状态 | 补法 |
|---|---|---|
| 窗口/托盘/热键/常驻 | ✅ 路线 A/B/C 覆盖 | — |
| 定时任务 | ✅ 现成 | `schedule` 包 |
| 长期记忆 | ❌ | M5 记忆插件（storage/session） |
| 语音 | ❌ | 语音识别/合成插件 |
| computer use（操作桌面） | ❌ | 截屏+键鼠插件（安全风险高，最后做） |

### 纪律
- 壳核分离：桌面壳只做"窗户"，核心永远是 `dsh web`（吸取 Hermes 更新翻车 6 次的教训）
- 端口：壳加载的仍是本地 dsh 服务（3080/3081）

---

## 风险与纪律

1. **开发者预览**：DSH 是 developer preview，官方声明会有破坏性变更 → 重要改动前记录当前 commit，升级后跑一遍自测
2. **不动 npx 本体**：当前会话依赖 `npm-cache\_npx` 里的 checkout，开发全部在 `D:\deepseek-harness` 进行
3. **端口纪律**：本地实例用 3081+，避免与现有 GUI 冲突
4. **git 纪律**：每完成一个积木就 commit，坏了可回滚

---

## 里程碑验收标准

- M0 通过：3081 端口实例可对话
- M1 通过：hello 插件日志出现
- M2 通过：发送按钮/面板外观变化，且保存即热更新
- M3 通过：新工具出现在模型可用工具列表中并实际执行成功
- M4 通过：技能插件可复用、模型可热切换
- M5 通过：至少一项"Hermes 能力"在 DSH 上跑通
