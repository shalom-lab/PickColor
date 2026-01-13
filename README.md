<div align="center">

<img src="./icons/logo.svg" alt="PickColor Logo" width="120" height="120" />

# PickColor

**极简、高效、专业的色彩助手浏览器插件**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Chrome Web Store](https://img.shields.io/badge/Chrome-Extension-blue?logo=google-chrome)](https://chrome.google.com/webstore)
[![Firefox Add-on](https://img.shields.io/badge/Firefox-Add--on-orange?logo=firefox-browser)](https://addons.mozilla.org/)

</div>

---

## ✨ 功能特性

- 🎨 **屏幕取色** - 使用 EyeDropper API 从屏幕任意位置取色
- 📋 **颜色历史** - 自动记录取色历史，支持一键复制 HEX、RGB、HSL 格式
- 🎨 **色板管理** - 创建和管理自定义色板，支持批量导入导出
- 🌈 **多格式显示** - 同时显示 HEX、RGB、HSL 三种颜色格式
- 🎯 **一键复制** - 点击任意颜色格式即可快速复制
- 💾 **数据持久化** - 使用浏览器本地存储，数据永不丢失
- 🌍 **多语言支持** - 支持中文、英文，可轻松扩展其他语言
- 📦 **导出功能** - 支持导出所有色板为 JSON 格式

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 构建插件

**Chrome/Edge:**
```bash
npm run build:chrome
```

**Firefox:**
```bash
npm run build:firefox
```

### 加载到浏览器

#### Chrome/Edge
1. 打开 `chrome://extensions/` 或 `edge://extensions/`
2. 开启右上角的"开发者模式"
3. 点击"加载已解压的扩展程序"
4. 选择项目根目录下的 `dist` 文件夹

#### Firefox
1. 打开 `about:debugging#/runtime/this-firefox`
2. 点击"临时载入附加组件"
3. 选择 `dist/manifest.json` 文件

## 📁 项目结构

```
PickColor/
├── src/
│   ├── App.jsx              # 主应用组件
│   ├── popup.jsx            # Popup 入口
│   ├── background.js        # 后台脚本
│   ├── content.js           # 内容脚本
│   ├── hooks/
│   │   └── useStorage.js    # 存储 Hook
│   ├── i18n/
│   │   └── translations.js # 多语言翻译
│   └── index.css           # 样式文件
├── icons/                   # 图标文件
│   ├── logo.svg            # Logo
│   └── icon*.png           # 各尺寸图标
├── popup.html              # Popup HTML
├── manifest.chrome.json    # Chrome Manifest V3
├── manifest.firefox.json   # Firefox Manifest V2
├── vite.config.js         # Vite 构建配置
└── package.json
```

## 🛠️ 技术栈

- **React 18** - UI 框架
- **Vite** - 构建工具
- **Tailwind CSS** - 样式框架
- **Lucide React** - 图标库
- **Chrome Extension API** - 浏览器扩展 API

## 📖 使用说明

### 屏幕取色
1. 点击插件图标打开弹窗
2. 点击"屏幕吸取"按钮
3. 在屏幕上选择任意颜色
4. 颜色会自动添加到历史记录

### 手动调色
1. 点击"手动调色"按钮
2. 在颜色选择器中选择颜色
3. 点击"确认"保存到历史记录

### 色板管理
1. 切换到"色板"标签页
2. 使用多行输入框批量添加色板（格式：`色板名称:颜色1,颜色2,颜色3`）
3. 点击色板中的颜色方块可复制 HEX 值
4. 使用复制和删除按钮管理色板

### 导出色板
1. 切换到"配置"标签页
2. 点击"导出全部色板"按钮
3. 所有色板将导出为 JSON 文件

## 🌍 多语言支持

PickColor 支持多语言，当前包含：
- 🇨🇳 中文
- 🇺🇸 English

添加新语言只需在 `src/i18n/translations.js` 中添加对应的翻译即可。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

本项目采用 [MIT](LICENSE) 许可证。

## 🔗 相关链接

- [GitHub Repository](https://github.com/shalom-lab/PickColor)
- [Chrome Web Store](https://chrome.google.com/webstore) (即将发布)
- [Firefox Add-ons](https://addons.mozilla.org/) (即将发布)

---

<div align="center">

Made with ❤️ by [shalom-lab](https://github.com/shalom-lab)

</div>
