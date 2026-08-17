# DSH Harbor（鲸港）🛟🐋

> DeepSeek Harness 桌面壳：壳核分离 · 三层热更新 · 万物皆插件
> DSH Harbor: a self-built Windows desktop shell for DeepSeek Harness — shell/core separation, three-layer hot updates, plugin ecosystem fully preserved.

DSH Harbor 是一个自研桌面壳，把 DeepSeek Harness（DSH）从浏览器"请"进原生窗口，并完整保留 DSH "everything is a plugin" 的插件生态。

## 为什么存在

- 浏览器剥离版（PWA）依赖 `dsh web` 进程存活，进程一死只剩报错页
- Harbor 的**进程管家**接管 dsh 生命周期：崩溃秒自愈、退出杀净进程树——稳定性的对症药
- **三层独立热更新**（UI 内容 / dsh 核 / 壳本体），互不阻塞、各自可回滚——这是捆绑式更新的 Hermes 没做到的

## 设计铁律（源自六壳竞品源码解剖）

1. **壳核分离**：壳是"哑窗户"，智能全部留在官方 DSH 核里
2. **零侵入**：spawn 官方 `dsh web` + loadURL 官方 UI；preload 只注入白名单最小桥；绝不 vendor、绝不魔改 DOM
3. **桌面能力插件化**：桌面桥是 DSH cordis 插件（api-gateway Typert remote）——桌面本身也是一块积木，可插拔、可热载

## 仓库结构

```
DSH-harbor/
├─ shell/      # 自研 Electron 壳（TypeScript）
├─ kernel/     # deepseek-harness 官方内核克隆（git-ignored，不随仓库分发）
└─ docs/       # 架构蓝图 + 竞品分析报告 + 本地化计划
```

## 状态

MVP 开发中：窗口 + 托盘 + 进程管家 + 崩溃自愈 + 兼容门禁

## 文档

- [架构蓝图](docs/dsh-desktop-blueprint.md)
- [六壳竞品解剖报告](docs/shell-analysis-report.md)
- [DSH 本地化与积木化计划](docs/harness-localization-plan.md)

## License

[MIT](LICENSE)

---

## Why DSH Harbor

The browser-stripped PWA dies the moment the `dsh web` process dies. DSH Harbor owns the process lifecycle: a process steward auto-restarts the core on crash, and a version gate fast-fails on incompatible core versions. Updates are split into three independent layers — UI content, the dsh core (npm), and the shell itself (electron-updater) — each with its own rollback. All extension points stay official: the shell loads the unmodified official Web UI and manages plugins through `dsh plugin`, so the entire Cordis/client-plugin ecosystem keeps working.
