import { google } from '@ai-sdk/google';
import { streamText } from 'ai';

export async function POST(req: Request) {
  const { prompt, context,direction,mode } = await req.json();
    // 如果是标注模式
    if (mode === 'annotate') {
        const result = await streamText({
        model: google('gemini-3.1-flash-lite-preview'),
        system: `你是一个日语老师。
            任务：给这段日语标注全假名（振假名/Furigana)。
            格式要求：
            1. 第一行显示原句汉字带假名的形式（如：私（わたし）は...）。
            2. 第二行显示纯假名。
            只输出这两行内容，不要解释。`,
        prompt: prompt,
        });
        return result.toTextStreamResponse();
    }
  const jaContextMap: Record<string, string> = {
    meeting: "这是研究室组会。请将中文翻译成专业的日语学术口语（丁寧語），注意专业术语的准确性。",
    business: "这是商务邮件。请使用标准的敬语（尊敬語/謙譲語），确保格式地道（如：お世話になっております）。",
    friend: "这是朋友聊天。请使用自然、亲切的日语口语（ため口），可以适当使用助词（ね、よ）。"
  };
  const zhContextMap: Record<string, string> = {
    meeting: "这是大学研究室组会场景，请使用正式、专业的中文学术口吻。",
    business: "这是商务办公场景，请使用得体的职场中文，确保符合商务礼仪。",
    friend: "这是好朋友聊天场景，请使用自然的中文口语，可以带一点亲切感。"
  };
  // 根据方向选择对应的指令集
  const isZhToJa = direction === 'zh-ja';
  const instruction = isZhToJa ? jaContextMap[context] : zhContextMap[context];
  const result = await streamText({
    model: google('gemini-3.1-flash-lite-preview'), 
    system: `你是一个精通中日互译的专家。
      当前任务：${isZhToJa ? '【中译日】' : '【日译中】'}。
      语境设定：${instruction}。
      规则：只输出翻译结果，严禁解释，严禁回复多余的内容。`,
    prompt: prompt,
  });
  return result.toTextStreamResponse();
}