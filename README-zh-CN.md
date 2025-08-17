# 下一代二维码生成器

一款 Firefox 扩展程序，提供二维码生成器功能，支持生成 Chromium 风格的二维码，并在中心位置显示 Firefox 图标。

## 🌟 功能特色

- **Chromium 风格二维码**：生成与 Chrome 原生实现完全相同样式的二维码
- **Firefox 图标中心图案**：在二维码中心显示 Firefox 图标
- **即时生成**：自动为当前页面 URL 生成二维码
- **自定义文本支持**：为任何文本或 URL 创建二维码
- **一键复制**：将二维码作为高质量 PNG 图像复制到剪贴板
- **便捷下载**：智能文件名生成，轻松下载二维码
- **完美尺寸**：匹配 Chrome 精确的二维码尺寸和样式
- **深色模式支持**：与浏览器主题无缝集成

## 🚀 安装方法

### 从 Firefox 附加组件商店安装

您可以直接从 [Firefox 附加组件商店](https://addons.mozilla.org/zh-CN/firefox/addon/next-qrcode-generator/) 安装扩展（即将推出）。

### 手动安装（开发）

1. **克隆仓库**

   ```bash
   git clone https://github.com/chromium-style-qrcode/next-qrcode-generator.git
   cd next-qrcode-generator
   ```

2. **安装依赖**

   ```bash
   pnpm install
   ```

3. **构建扩展**

   ```bash
   pnpm build
   ```

4. **在 Firefox 中加载**
   - 打开 Firefox 并导航到 `about:debugging#/runtime/this-firefox`
   - 点击“载入临时附加组件”
   - 从 `.output/firefox-mv2` 文件夹中选择 `manifest.json` 文件

## 🎯 使用方法

1. **访问扩展**：点击浏览器工具栏中的二维码图标
2. **自动填充当前 URL**：扩展程序自动加载当前页面的 URL
3. **自定义文本**：将 URL 替换为您想要转换为二维码的任何文本
4. **复制到剪贴板**：点击"复制"按钮将二维码作为图像复制
5. **下载**：点击"下载"将二维码保存为 PNG 文件

## 🛠️ 技术栈

- **框架**：[WXT](https://wxt.dev/) - 现代 Web 扩展框架
- **前端**：React 19 + TypeScript
- **样式**：Tailwind CSS 4.0 + Radix UI 组件
- **二维码生成**：WebAssembly (WASM) 模块，实现 Chromium 精确的二维码生成
- **构建系统**：Vite + Rollup
- **包管理器**：pnpm

## 🔧 开发指南

### 环境要求

- Node.js ≥ 24.3.0
- pnpm ≥ 10.12.4

### 开发命令

```bash
# 启动开发服务器
pnpm dev

# 生产环境构建
pnpm build

# 创建分发压缩包
pnpm zip

# 类型检查
pnpm compile

# 代码格式化
pnpm format

# 依据 Conventional Commits 生成/更新 CHANGELOG.md（最近变更）
pnpm changelog

# 初次生成（覆盖式，包含所有历史）
pnpm changelog:init
```

### 项目结构

```tree
src/
├── components/
│   └── ui/           # 可复用UI组件
├── hooks/
│   ├── use-qrcode.ts # 二维码生成逻辑
│   └── use-dark-mode.ts
├── lib/
│   ├── wasm-loader.ts    # WASM模块加载器
│   └── utils.ts
├── popup/
│   ├── App.tsx       # 主弹窗组件
│   └── main.tsx      # 入口点
├── providers/
│   └── theme.tsx     # 主题提供者
├── styles/
│   └── base.css      # 全局样式
└── types/            # TypeScript类型定义
```

## 🎨 功能详解

### Chromium 精确二维码生成

扩展使用 WebAssembly 模块复制 Chrome 的原生二维码生成算法，确保：

- 与 Chrome 内置二维码完全相同的视觉外观
- 相同的模块样式（圆形 vs 方形）
- 圆角定位图案
- 精确的尺寸和边距

### 智能文件名生成

下载的二维码自动获得有意义的文件名：

- 域名：`qrcode_example.com.png`
- 其他内容：`qrcode_firefox.png`

### 无障碍支持

- 完整的键盘导航支持
- 屏幕阅读器兼容
- 高对比度模式支持
- 正确的 ARIA 标签和描述

## 🚀 发布

这个项目使用 GitHub Actions 自动化发布。

### 创建一个发布

```bash
# 稳定版本（发布到商店）
pnpm version 1.0.0
git push origin main
git push origin 1.0.0

# 预发布版本（仅 GitHub）
pnpm version prerelease --preid='[alpha｜beta|rc]'
git push origin main
git push origin 1.0.0-alpha.0
```

### 版本类型

- **稳定版本**（1.0.0）：用于发布到 Firefox 扩展商店
- **预发布版本**（1.0.0-alpha.0）：仅用于 GitHub，适合测试和开发

## 🤝 贡献指南

欢迎贡献！请随时提交 Pull Request。对于重大更改，请先打开 issue 讨论您想要更改的内容。

### 开发指南

1. 遵循现有代码风格
2. 为新功能添加 TypeScript 类型
3. 在 Firefox 上进行测试
4. 根据需要更新文档

## 📄 许可证

本项目基于 MIT 许可证 - 详情请参见 [LICENSE](LICENSE) 文件。

## 🙏 致谢

- Chrome 团队提供原始二维码实现
- [WXT](https://wxt.dev/) 提供优秀的扩展框架
- [Radix UI](https://www.radix-ui.com/) 提供无障碍组件
- [Tailwind CSS](https://tailwindcss.com/) 提供样式工具

## 📞 支持

如果您遇到任何问题或有疑问：

- 在 [GitHub](https://github.com/chromium-style-qrcode/next-qrcode-generator/issues) 上开启 issue
