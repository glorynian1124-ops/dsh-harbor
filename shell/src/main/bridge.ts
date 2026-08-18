import * as http from 'node:http'
import { Notification, shell as electronShell } from 'electron'
import type { BrowserWindow } from 'electron'

export interface BridgeHandlers {
  getStatus: () => Record<string, unknown>
  controlWindow: (action: string) => void
}

/**
 * Loopback HTTP bridge: the only channel through which DSH core plugins may
 * touch desktop capabilities. Binds 127.0.0.1 only; tiny whitelisted surface;
 * never exposes raw IPC or DOM access.
 */
export function startBridge(port: number, handlers: BridgeHandlers): http.Server {
  const server = http.createServer((req, res) => {
    const send = (code: number, data: unknown): void => {
      res.writeHead(code, { 'content-type': 'application/json' })
      res.end(JSON.stringify(data))
    }

    let pathname = '/'
    try {
      pathname = new URL(req.url ?? '/', 'http://127.0.0.1').pathname
    } catch {
      /* keep root */
    }

    const readBody = (): Promise<Record<string, unknown>> =>
      new Promise((resolve) => {
        let raw = ''
        req.on('data', (chunk) => {
          raw += chunk.toString('utf8')
        })
        req.on('end', () => {
          try {
            resolve(raw ? (JSON.parse(raw) as Record<string, unknown>) : {})
          } catch {
            resolve({})
          }
        })
      })

    if (req.method === 'GET' && pathname === '/bridge/status') {
      send(200, handlers.getStatus())
      return
    }
    if (req.method === 'POST' && pathname === '/bridge/notify') {
      void readBody().then((body) => {
        new Notification({
          title: String(body.title ?? 'DSH Harbor'),
          body: String(body.body ?? ''),
        }).show()
        send(200, { ok: true })
      })
      return
    }
    if (req.method === 'POST' && pathname === '/bridge/window') {
      void readBody().then((body) => {
        handlers.controlWindow(String(body.action ?? 'toggle'))
        send(200, { ok: true })
      })
      return
    }
    if (req.method === 'POST' && pathname === '/bridge/open-path') {
      void readBody().then((body) => {
        const p = String(body.path ?? '')
        if (p) void electronShell.openPath(p)
        send(200, { ok: true })
      })
      return
    }
    send(404, { error: 'not found' })
  })

  server.listen(port, '127.0.0.1')
  console.log(`[harbor] bridge listening on 127.0.0.1:${port}`)
  return server
}

export function applyWindowAction(win: BrowserWindow | null, action: string): void {
  if (!win) return
  if (action === 'show') {
    if (win.isMinimized()) win.restore()
    win.show()
    win.focus()
  } else if (action === 'hide') {
    win.hide()
  } else {
    if (win.isVisible() && !win.isMinimized()) {
      win.hide()
    } else {
      if (win.isMinimized()) win.restore()
      win.show()
      win.focus()
    }
  }
}
