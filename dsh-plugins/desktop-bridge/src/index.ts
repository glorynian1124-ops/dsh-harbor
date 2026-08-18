/**
 * desktop-bridge — DSH Harbor 桌面桥插件（V2）
 *
 * 把桌面壳的能力（系统通知 / 窗口控制 / 状态查询 / 打开路径）注册为 DSH 模型
 * 可调用的工具——"桌面"由此成为 DSH 的一块积木：卸载本插件即还原纯 Web 形态。
 *
 * 通信模型：本插件运行在 dsh 核心进程内；通过 127.0.0.1 回环 HTTP 调用
 * Electron 壳的 bridge 服务（端口由环境变量 DSH_HARBOR_BRIDGE_PORT 注入，
 * 默认 3211）。壳是"哑窗户"的边界仍然成立：桥只转发，不注入 DOM。
 */
import { createRequire } from 'node:module'
import * as path from 'node:path'
import { pathToFileURL } from 'node:url'
import type { Context } from '@deepseek-ai/cordis'
// Side-effect type import: pulls in dsh-tools' Context augmentation (ctx.tools).
import type {
  DefineToolOptions,
  ParameterSchemaSpec,
  ToolDefinition,
  ValueSchemaSpec,
} from '@deepseek-ai/dsh-tools'

export const name = 'desktop-bridge'
export const inject = ['tools']

const BRIDGE_PORT = Number(process.env.DSH_HARBOR_BRIDGE_PORT ?? 3211)
const BASE = `http://127.0.0.1:${BRIDGE_PORT}`

interface BridgeResult {
  ok: boolean
}

async function callBridge<T = BridgeResult>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: body === undefined ? undefined : { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`desktop bridge ${path}: HTTP ${res.status}`)
  return (await res.json()) as T
}

type DefineToolFn = <const S extends ParameterSchemaSpec, const O extends ValueSchemaSpec>(
  options: DefineToolOptions<S, O>,
) => ToolDefinition

/**
 * Load defineTool synchronously. The plugin is executed as ESM by the DSH
 * loader (no `require`), and the plugin directory has no node_modules of its
 * own — so anchor a createRequire at the shell directory, which the shell
 * injects deterministically via DSH_HARBOR_SHELL_DIR (cwd is not reliable).
 */
function loadDefineTool(): DefineToolFn {
  const shellDir = process.env.DSH_HARBOR_SHELL_DIR ?? process.cwd()
  const anchor = pathToFileURL(path.join(shellDir, '.harbor-anchor.js')).href
  const shellRequire = createRequire(anchor)
  return shellRequire('@deepseek-ai/dsh-tools').defineTool as DefineToolFn
}

export function apply(ctx: Context): void {
  const defineTool = loadDefineTool()

  ctx.tools.register(
    defineTool({
      name: 'desktop_notify',
      description: '通过 DSH Harbor 桌面壳显示 Windows 系统通知。',
      parameters: {
        title: { type: 'string', required: true, description: '通知标题' },
        body: { type: 'string', required: true, description: '通知正文' },
      },
      output: {
        schema: { type: 'string' },
        render: (_args: unknown, value: string) => [{ type: 'text', text: value }],
      },
      async execute(args: { title: string; body: string }) {
        await callBridge('/bridge/notify', { title: args.title, body: args.body })
        return 'notification sent'
      },
    }),
  )

  ctx.tools.register(
    defineTool({
      name: 'desktop_status',
      description: '查询 DSH Harbor 桌面壳状态：核心地址/版本、窗口可见性等。',
      parameters: {},
      output: {
        schema: { type: 'string' },
        render: (_args: unknown, value: string) => [{ type: 'text', text: value }],
      },
      async execute() {
        const status = await callBridge<Record<string, unknown>>('/bridge/status')
        return JSON.stringify(status, null, 2)
      },
    }),
  )

  ctx.tools.register(
    defineTool({
      name: 'desktop_show_window',
      description: '显示、隐藏或切换 DSH Harbor 桌面窗口。action 取值：show | hide | toggle。',
      parameters: {
        action: { type: 'string', required: true, description: 'show | hide | toggle' },
      },
      output: {
        schema: { type: 'string' },
        render: (_args: unknown, value: string) => [{ type: 'text', text: value }],
      },
      async execute(args: { action: string }) {
        await callBridge('/bridge/window', { action: args.action })
        return `window ${args.action} requested`
      },
    }),
  )

  ctx.tools.register(
    defineTool({
      name: 'desktop_open_path',
      description: '在 Windows 资源管理器中打开本地文件或文件夹。',
      parameters: {
        path: { type: 'string', required: true, description: '本地绝对路径' },
      },
      output: {
        schema: { type: 'string' },
        render: (_args: unknown, value: string) => [{ type: 'text', text: value }],
      },
      async execute(args: { path: string }) {
        await callBridge('/bridge/open-path', { path: args.path })
        return 'path opened'
      },
    }),
  )
}
