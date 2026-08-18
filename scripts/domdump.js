// DOM dump helper: loads the running DSH UI and exports rendered DOM + key computed styles.
// Usage: node_modules\electron\dist\electron.exe domdump.js
const { app, BrowserWindow } = require('electron')
const fs = require('node:fs')
const path = require('node:path')

const out = path.join(app.getPath('temp'), 'dsh-dom-dump.txt')

app.whenReady().then(async () => {
  const win = new BrowserWindow({ width: 1280, height: 820, show: false })
  await win.loadURL('http://127.0.0.1:3210')
  // wait for React render + connections
  await new Promise((r) => setTimeout(r, 12000))
  const html = await win.webContents.executeJavaScript('document.body.outerHTML')
  fs.writeFileSync(out, html, 'utf8')
  const info = await win.webContents.executeJavaScript(`(() => {
    const root = document.body.firstElementChild
    const walk = (el, depth, acc) => {
      if (!el || depth > 5 || acc.length > 400) return acc
      acc.push('  '.repeat(depth) + el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.className && typeof el.className === 'string' ? '.' + el.className.split(/\\s+/).filter(Boolean).join('.') : ''))
      for (const c of el.children) walk(c, depth + 1, acc)
      return acc
    }
    return walk(root, 0, []).join('\\n')
  })()`)
  fs.writeFileSync(out + '.tree', info, 'utf8')
  console.log('dumped:', out)
  app.exit(0)
})
