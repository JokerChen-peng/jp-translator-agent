import { google } from '@ai-sdk/google';
import { streamText } from 'ai';

// 强制使用 Edge Runtime (可选，但推荐，因为流式传输速度更快)
export const runtime = 'edge';

export async function POST(req: Request) {
  const { prompt, context } = await req.json();

  const contextMap: Record<string, string> = {
    meeting: "大学研究室组会场景。请使用‘丁寧語’（です/ます体），术语翻译要专业。",
    business: "正式商务邮件。请使用‘尊敬语’和‘謙譲語’，语气务必正式、得体。",
    friend: "好朋友聊天。请使用‘ため口’（普通体/口语），语气轻松自然。"
  };

  const result = await streamText({
    model: google('gemini-3-flash'),
    system: `你是一个精通中日互译的专家。
      当前语境：${contextMap[context] || "通用场景"}。
      要求：直接输出翻译结果，保持原意，符合当地表达习惯。`,
    prompt: prompt,
  });
  return result.toTextStreamResponse();
}