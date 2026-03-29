

# JP-ZH Translation Agent | 中日双向翻译智能体

这是一个基于 **Next.js 16** 和 **Google Gemini 3.1** 开发的高性能中日互译工具。它不仅是一个简单的翻译器，更是一个能够理解语境、辅助发音并记录学习点滴的“随身翻译官”。

-----

## 🌟 核心特性

  * **⚡ 极速双向翻译**：利用 Gemini 3.1 Flash-Lite 模型，实现毫秒级的流式响应。
  * **🧠 多语境感知**：
      * **🏫 组会模式**：侧重学术用语与丁寧語，助力研究室汇报。
      * **💼 商务模式**：严谨的敬语处理，搞定 Lawson 打工或正式邮件。
      * **🍺 朋友模式**：地道的口语化表达，消除社交隔阂。
  * **🎙️ 连续语音输入**：集成 Web Speech API，支持长文本录入，适合实时记录对话。
  * **🎌 五十音标注**：一键为日语结果生成假名与罗马音，解决“会看不会读”的痛点。
  * **⭐ 手动历史收藏**：基于 LocalStorage 的持久化存储，只记录你认为重要的翻译片段。
  * **🎨 现代响应式 UI**：使用 Tailwind CSS 构建，适配桌面端与移动端单手操作。

-----

## 🛠️ 技术栈

  * **框架**: [Next.js](https://nextjs.org/) (App Router)
  * **AI 引擎**: [Google Gemini 3.1 Flash-Lite](https://ai.google.dev/)
  * **SDK**: [Vercel AI SDK](https://sdk.vercel.ai/) (Text Stream Protocol)
  * **样式**: Tailwind CSS
  * **存储**: Browser LocalStorage
  * **接口**: Web Speech API (STT)

-----

## 🚀 快速开始

### 1\. 克隆项目

```bash
git clone https://github.com/JokerChen-peng/tsproject.git
cd tsproject
```

### 2\. 配置环境变量

在项目根目录创建 `.env.local` 文件，并填入你的 Google AI API Key：

```env
GOOGLE_GENERATIVE_AI_API_KEY=你的API_KEY
```

### 3\. 安装依赖并启动

```bash
npm install
npm run dev
```

访问 [http://localhost:3000](https://www.google.com/search?q=http://localhost:3000) 即可开始使用。

-----

## 📂 项目结构

```text
├── app/
│   ├── api/translate/route.ts  # 后端 AI 逻辑与 Prompt 工程
│   └── page.tsx                # 主交互页面
├── components/
│   └── TranslationHistory.tsx  # 解耦的历史记录组件
├── hooks/
│   └── useSpeechToText.ts      # 封装的语音识别逻辑
└── public/                     # 静态资源
```