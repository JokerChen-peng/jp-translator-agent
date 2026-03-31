# JP-ZH Translation Agent | 中日双向翻译助手

基于 Next.js 16 + Vercel AI SDK + Gemini 3.1 构建的中日互译应用。支持文本与图片翻译、流式输出、语境切换、语音输入与历史管理，适合作为学习和日常沟通工具。

---

## 功能亮点

- **双向流式翻译**：支持日译中 / 中译日，响应采用流式输出。
- **语境 Prompt**：内置组会、商务、朋友聊天三种语境。
- **图片翻译（多模态）**：上传图片后可直接识别并翻译图中文字；支持可选文字说明（作为约束指令而非待译正文）。
- **RAG 增强**：基于 Gemini Embedding 语义召回，并融合关键词重叠分进行混合检索；Top-K + 阈值过滤后再注入上下文。
- **语音能力**：Web Speech API 输入 + Speech Synthesis 朗读译文。
- **历史管理**：LocalStorage 持久化、JSON 导入导出、按 id 合并（导入优先）。
- **Schema 校验**：历史导入通过 JSON Schema（Ajv）做结构校验。

---

## 技术栈

- **框架**：Next.js 16 (App Router)
- **语言**：TypeScript / React 19
- **AI**：Google Gemini 3.1 Flash-Lite、Gemini Embedding
- **SDK**：Vercel AI SDK (`streamText` / `useCompletion`)
- **样式**：Tailwind CSS 4
- **校验**：Ajv + JSON Schema
- **存储**：Browser LocalStorage

---

## 快速开始

### 1) 克隆仓库

```bash
git clone https://github.com/JokerChen-peng/jp-translator-agent.git
cd jp-translator-agent
```

### 2) 配置环境变量

在项目根目录创建 `.env.local`：

```env
GOOGLE_GENERATIVE_AI_API_KEY=your_api_key
```

### 3) 安装并启动

```bash
npm install
npm run dev
```

打开 `http://localhost:3000`。

---

## 常用命令

```bash
npm run dev
npm run build
npm run lint
```

---

## 目录结构（核心）

```text
app/
  api/translate/route.ts              # 翻译/注音/RAG/图片翻译主接口
  page.tsx                            # 页面状态编排
components/
  translator/                         # 主页面拆分后的 UI 组件
  TranslationHistory.tsx              # 历史记录视图与导入导出入口
hooks/
  useSpeechToText.ts                  # 语音转文本
  useTextToSpeech.ts                  # 文本转语音
  useAutoScroll.ts                    # 流式输出自动滚动
lib/
  rag.ts                              # 检索与融合打分
  historyBackup.ts                    # 导入导出与合并策略
  historyImportJsonSchema.ts          # Ajv 校验入口
  schemas/translation-history-import.schema.json
  imageCompress.ts                    # 图片压缩与 Base64 转换
```