# DSH Harbor（鲸港）🛟🐋

> DeepSeek Harness 桌面壳：壳核分离 · 三层热更新 · 万物皆插件
> DSH Harbor: a self-built Windows desktop shell for DeepSeek Harness — shell/core separation, three-layer hot updates, plugin ecosystem fully preserved.

**状态：v0.3.0 已发布**（[GitHub Releases](https://github.com/glorynian1124-ops/dsh-harbor/releases)）

DSH Harbor 是一个自研桌面壳，把 DeepSeek Harness（DSH）从浏览器"请"进原生窗口，并完整保留 DSH "everything is a plugin" 的插件生态。

## 为什么存在

- 浏览器剥离版（PWA）依赖 `dsh web` 进程存活，进程一死只剩报错页
- Harbor 的**进程管家**接管 dsh 生命周期：崩溃秒自愈（指数退避）、退出杀净进程树
- **三层独立热更新**（UI 内容 / dsh 核 / 壳本体），互不阻塞、各自可回滚——这是捆绑式更新的 Hermes 没做到的

## 功能

| 能力 | 说明 |
|---|---|
| 进程管家 | 核心崩溃自动重启（1s→30s 指数退避），5 次后弹窗告警；退出时 taskkill 进程树 |
| 桌面桥插件 | DSH 模型可直接调用：`desktop_notify`（系统通知）/ `desktop_status`（壳状态）/ `desktop_show_window`（窗口控制）/ `desktop_open_path`（打开路径）——桌面能力是一块可插拔积木 |
| 核心更新器 | 托盘一键检查 npm registry → 更新 shell 本地 dsh 依赖 → 自动重启核心 |
| 壳更新器 | electron-updater 对接 GitHub Releases（本仓库 v0.3.0 即第一个更新源） |
| 桌面体验 | 全局热键 `Ctrl+Alt+D`、开机自启、托盘常驻、窗口位置记忆、关闭进托盘 |

## 设计铁律（源自六壳竞品源码解剖）

1. **壳核分离**：壳是"哑窗户"，智能全部留在官方 DSH 核里；绝不 vendor、绝不魔改
2. **零侵入**：spawn 官方 `dsh web` + loadURL 官方 UI；preload 只注入白名单最小桥（`window.dshDesktop`），无 DOM 注入
3. **桌面能力插件化**：桌面桥是 DSH cordis 插件（回环 HTTP 桥 127.0.0.1:3211）——卸载补丁即还原纯 Web 形态
4. **三层独立更新**：UI 内容（官方热载）/ 核（npm）/ 壳（electron-updater），各自可回滚

## 仓库结构

```
DSH-harbor/
├─ shell/      # Electron 43 + TypeScript 壳
│  ├─ src/main/       # 进程管家 / 更新器 / 桥 / 托盘 / 热键 / 自启
│  └─ release/        # 构建产物（git-ignored）
├─ dsh-plugins/
│  └─ desktop-bridge/ # DSH cordis 插件：模型 ↔ 桌面桥
├─ kernel/     # deepseek-harness 官方内核克隆（git-ignored，随时 git pull 同步）
└─ docs/       # 架构蓝图 / 六壳竞品分析 / 本地化计划
```

## 安装与使用

1. 从 [Releases](https://github.com/glorynian1124-ops/dsh-harbor/releases) 下载 `DSH-Harbor-Setup-0.3.0.exe` 安装
2. 从开始菜单/桌面快捷方式启动
3. 首次启动自动拉起官方 dsh 核心（端口 3210），界面即官方 DSH（沿用你的 profile/凭据）
4. 在对话中可让模型使用桌面桥工具（如「查询桌面壳状态」「用桌面通知提醒我」）

### 开发者模式

```sh
cd shell
npm install      # Electron + dsh（.npmrc 已配国内镜像）
npm run dev      # tsc + electron .（源码布局）
npm run dev:watch  # 壳热重载
npm run dist     # NSIS 安装包 → release/
```

## 里程碑

- `722874b` 骨架（壳核分离、kernel git-ignored）
- `24e9a7a` MVP（进程管家/窗口/托盘/版本门禁）
- `619a7d8` V1（双层更新器/热键/自启/双击启动/镜像）
- `a5d7954` V2（desktop-bridge 桌面桥插件 + 运行时补丁注入）
- `3474fb6` V2.1 打包修复（AUMID/asar 解包/peer 依赖）
- `v0.3.0` **首个正式发布**

## 路线图

- 打包态核心更新器适配（app.asar.unpacked 内 npm 更新）
- sidecar 核心：把 dsh 从安装包拆出，首启全局安装，消灭巨型依赖打包
- 更多桌面桥工具（剪贴板、屏幕尺寸、锁屏）
- 记忆/定时任务插件（对标 Hermes 的常驻能力）

## License

[MIT](LICENSE)
