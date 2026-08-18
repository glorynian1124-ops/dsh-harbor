// dsh-harbor-theme — purple glassmorphism client plugin.
// Injected as a script-loaded client plugin; injects one <style data-plugin-css>
// tag at module scope (the same mechanism the official CSS modules use).
// Selectors prefer stable data-* attributes over hashed CSS-module class names.
window.__ModuleLoader__.load({
  id: 'dsh-harbor-theme',
  factory: () => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

    const css = `
/* ═══════════ DSH Harbor — 紫色毛玻璃主题 ═══════════ */

/* ── 全局彩色渐变基底（任何状态下都生效） ── */
html, body {
  background:
    radial-gradient(1100px 750px at 12% -8%, rgba(157, 107, 255, 0.5), transparent 60%),
    radial-gradient(950px 700px at 108% 15%, rgba(99, 60, 200, 0.45), transparent 55%),
    radial-gradient(850px 850px at 50% 125%, rgba(168, 85, 247, 0.4), transparent 60%),
    linear-gradient(160deg, #22123f, #3a1f77 45%, #5526b0 100%) !important;
  background-attachment: fixed !important;
}

/* ── 设计令牌：紫色系覆盖（浅色） ── */
:root {
  --dsw-alias-bg-base: rgba(58, 40, 116, 0.55);
  --dsw-alias-bg-layer-1: rgba(78, 56, 148, 0.45);
  --dsw-alias-bg-layer-2: rgba(92, 68, 168, 0.4);
  --dsw-alias-bg-layer-3: rgba(106, 80, 188, 0.38);
  --dsw-alias-bg-mask-1: rgba(52, 36, 104, 0.8);
  --dsw-alias-bg-mask-2: rgba(60, 42, 116, 0.75);
  --dsw-alias-bg-mask-3: rgba(68, 48, 130, 0.7);
  --dsw-alias-bg-mask-photo: rgba(48, 32, 96, 0.65);
  --dsw-alias-bg-mask-drop: rgba(44, 30, 88, 0.85);
  --dsw-alias-bg-module-platform: rgba(104, 78, 192, 0.3);
  --dsw-alias-bg-multi-select: rgba(136, 100, 226, 0.38);
  --dsw-alias-bg-overlay: rgba(38, 26, 80, 0.72);
  --dsw-alias-bg-skeleton: rgba(126, 100, 210, 0.25);

  --dsw-alias-border-l1: rgba(158, 128, 238, 0.3);
  --dsw-alias-border-l2: rgba(158, 128, 238, 0.22);
  --dsw-alias-border-l2-darkmode-thin: rgba(158, 128, 238, 0.16);
  --dsw-alias-border-l3: rgba(168, 138, 244, 0.32);
  --dsw-alias-border-l4: rgba(178, 148, 250, 0.38);
  --dsw-alias-border-inverted: rgba(205, 178, 255, 0.5);
  --dsw-alias-border-inverted2: rgba(222, 205, 255, 0.6);

  --dsw-alias-label-primary: #ece5ff;
  --dsw-alias-label-secondary: #cdbdf2;
  --dsw-alias-label-tertiary: #ab9ad8;
  --dsw-alias-label-caption: #bba9ea;
  --dsw-alias-label-dimmed: #a392d0;
  --dsw-alias-label-primary-foreground: #f6f1ff;
  --dsw-alias-label-primary-inverted: #2a1a5e;
  --dsw-alias-label-primary-dimmed: #dcd0ff;
  --dsw-alias-label-primary-bluish: #cfc2ff;

  --dsw-alias-brand-primary: #9d6bff;
  --dsw-alias-brand-primary-invert: #f0e8ff;
  --dsw-alias-brand-text: #dcc9ff;
  --dsw-alias-brand-primary-new-colorprimary-new-color: #9d6bff;

  --dsw-alias-interactive-bg-hover: rgba(136, 100, 226, 0.32);
  --dsw-alias-interactive-bg-active: rgba(154, 114, 242, 0.48);
  --dsw-alias-interactive-bg-hover-accent: rgba(157, 107, 255, 0.4);
  --dsw-alias-interactive-bg-hover-danger: rgba(255, 92, 122, 0.32);
  --dsw-alias-interactive-bg-hover-solid: rgba(182, 142, 255, 0.5);

  --dsw-alias-button-primary-fill: rgba(133, 88, 233, 0.85);
  --dsw-alias-button-primary-hover: rgba(148, 100, 250, 0.95);
  --dsw-alias-button-primary-dimmed: rgba(133, 88, 233, 0.5);
  --dsw-alias-button-elevated-fill: rgba(104, 76, 196, 0.5);
  --dsw-alias-button-floating-fill: rgba(94, 68, 180, 0.6);
  --dsw-alias-button-floating-hover: rgba(108, 78, 200, 0.75);
  --dsw-alias-button-info-fill: rgba(112, 80, 210, 0.5);
  --dsw-alias-button-info-hover: rgba(124, 90, 224, 0.65);
  --dsw-alias-button-contrast-fill: rgba(232, 218, 255, 0.9);
  --dsw-alias-button-tool-bar-fill: rgba(100, 74, 186, 0.35);
  --dsw-alias-button-tool-bar-hover: rgba(116, 86, 206, 0.5);
  --dsw-alias-button-tool-bar-fill-invisible: rgba(100, 74, 186, 0.15);
  --dsw-alias-button-ghost-active-fill: rgba(134, 98, 228, 0.3);
  --dsw-alias-button-ghost-active-hover: rgba(148, 108, 242, 0.4);
  --dsw-alias-button-ghost-active-border: rgba(164, 128, 248, 0.5);

  --dsw-alias-markdown-code-block: rgba(50, 36, 98, 0.85);
  --dsw-alias-markdown-code-block-banner: rgba(60, 44, 114, 0.9);
  --dsw-alias-markdown-inline-code: rgba(124, 92, 214, 0.45);
  --dsw-alias-markdown-code-segment-selected: rgba(133, 88, 233, 0.4);
  --dsw-alias-markdown-code-segment-unselected: rgba(133, 88, 233, 0.15);
  --dsw-alias-markdown-citation: rgba(157, 107, 255, 0.35);
  --dsw-alias-markdown-placeholder: rgba(184, 154, 248, 0.4);

  --dsw-alias-scrollbar-bg-l1: rgba(133, 96, 220, 0.45);
  --dsw-alias-scrollbar-hover-l1: rgba(150, 110, 235, 0.65);
  --dsw-alias-scrollbar-bg-l2: rgba(150, 112, 236, 0.5);
  --dsw-alias-scrollbar-hover-l2: rgba(166, 126, 248, 0.7);
}

/* ── 深色模式：同系但更深的紫 ── */
body[data-ds-dark-theme] {
  --dsw-alias-bg-base: rgba(40, 28, 84, 0.6);
  --dsw-alias-bg-layer-1: rgba(56, 40, 112, 0.5);
  --dsw-alias-bg-layer-2: rgba(68, 48, 132, 0.45);
  --dsw-alias-bg-layer-3: rgba(80, 58, 152, 0.42);
  --dsw-alias-bg-overlay: rgba(24, 16, 52, 0.78);
  --dsw-alias-bg-module-platform: rgba(88, 64, 168, 0.35);
  --dsw-alias-border-l1: rgba(150, 118, 232, 0.3);
  --dsw-alias-border-l2: rgba(150, 118, 232, 0.22);
  --dsw-alias-label-primary: #e8e0ff;
  --dsw-alias-label-secondary: #c4b4ee;
  --dsw-alias-label-tertiary: #a290d4;
  --dsw-alias-label-dimmed: #9a88ca;
  --dsw-alias-brand-primary: #9d6bff;
  --dsw-alias-interactive-bg-hover: rgba(128, 94, 220, 0.35);
  --dsw-alias-button-primary-fill: rgba(122, 80, 226, 0.85);
  --dsw-alias-button-primary-hover: rgba(136, 92, 242, 0.95);
}

/* ── 毛玻璃：三列布局（frame 的直接子元素，按结构定位） ── */
[data-details-collapsed] > :first-child {
  background: rgba(70, 48, 140, 0.35) !important;
  backdrop-filter: blur(22px) saturate(150%);
  -webkit-backdrop-filter: blur(22px) saturate(150%);
  border-right: 1px solid rgba(170, 140, 248, 0.22) !important;
}
[data-details-collapsed] > :nth-child(2) {
  background: rgba(88, 62, 164, 0.18) !important;
  backdrop-filter: blur(16px) saturate(140%);
  -webkit-backdrop-filter: blur(16px) saturate(140%);
}
[data-details-collapsed] > :nth-child(3) {
  background: rgba(66, 45, 132, 0.32) !important;
  backdrop-filter: blur(20px) saturate(140%);
  -webkit-backdrop-filter: blur(20px) saturate(140%);
  border-left: 1px solid rgba(170, 140, 248, 0.2) !important;
}

/* ── 输入卡片毛玻璃 ── */
[data-composer-card] {
  background: rgba(100, 70, 190, 0.32) !important;
  backdrop-filter: blur(24px) saturate(160%);
  -webkit-backdrop-filter: blur(24px) saturate(160%);
  border: 1px solid rgba(185, 155, 255, 0.25) !important;
  box-shadow: 0 8px 32px rgba(18, 8, 48, 0.45);
}

/* ── 浮层（对话框/菜单/下拉）毛玻璃 ── */
[role='dialog'],
[role='menu'],
[role='listbox'],
[data-shell-overlay] > * {
  background: rgba(56, 38, 118, 0.62) !important;
  backdrop-filter: blur(26px) saturate(150%);
  -webkit-backdrop-filter: blur(26px) saturate(150%);
}

/* ── 细节 ── */
::selection { background: rgba(157, 107, 255, 0.45); }
* { scrollbar-color: rgba(160, 125, 245, 0.6) rgba(40, 26, 85, 0.25); }
`;

    const tagId = 'dsh-harbor-theme/theme.css';
    if (typeof document !== 'undefined' && document.querySelector('style[data-plugin-css="' + tagId + '"]') === null) {
      const tag = document.createElement('style');
      tag.dataset.plugin = 'dsh-harbor-theme';
      tag.dataset.pluginCss = tagId;
      tag.textContent = css;
      document.head.appendChild(tag);
    }

    exports.name = 'harbor-theme';
    exports.inject = [];
    exports.apply = function apply() {};
    return module.exports;
  },
});
