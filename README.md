# AI Resume Builder

> 一款基于 React + Vite 构建的在线简历生成工具，支持实时预览、照片上传、PDF 导出，数据自动本地持久化。

![Tech Stack](https://img.shields.io/badge/React-18-61DAFB?logo=react) ![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite) ![License](https://img.shields.io/badge/License-MIT-green)

---

## ✨ 功能特性

- **实时双栏预览** — 左侧编辑，右侧即时渲染简历效果
- **拖拽分隔条** — 自由调整编辑区与预览区的宽度比例
- **照片上传** — 支持上传证件照并在简历中展示
- **日期选择器** — 年份 + 月份下拉组合，支持「至今」选项
- **动态增删** — 工作经历、教育背景支持任意增删，标签技能回车添加
- **PDF 导出** — 一键导出 A4 格式高清简历（基于 html2pdf.js）
- **本地持久化** — 数据自动保存到 `localStorage`，刷新不丢失

---

## 🚀 快速开始

### 环境要求

- Node.js ≥ 18
- npm ≥ 9

### 安装与运行

```bash
# 克隆仓库
git clone https://github.com/wangw-hub/demo.git
cd demo

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

打开浏览器访问 `http://localhost:5173` 即可使用。

### 构建生产版本

```bash
npm run build
```

构建产物输出至 `dist/` 目录。

---

## 🗂️ 项目结构

```
demo/
├── index.html          # 应用入口 HTML
├── vite.config.js      # Vite 配置
├── package.json        # 项目依赖
└── src/
    ├── main.jsx        # React 挂载入口
    ├── App.jsx         # 主组件（全部业务逻辑）
    └── index.css       # 全局样式
```

---

## 🛠️ 技术栈

| 库 | 用途 |
|----|------|
| [React 18](https://react.dev) | UI 框架 |
| [Vite](https://vitejs.dev) | 构建工具 |
| [Framer Motion](https://www.framer.com/motion/) | 动画效果 |
| [Lucide React](https://lucide.dev) | 图标库 |
| [html2pdf.js](https://ekoopmans.github.io/html2pdf.js/) | PDF 导出 |

---

## 📄 License

[MIT](./LICENSE)
