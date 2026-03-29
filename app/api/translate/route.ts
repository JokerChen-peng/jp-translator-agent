import { google } from '@ai-sdk/google';
import { embed, embedMany, streamText } from 'ai';
import { cosineSimilarity, splitKnowledge, topKBySimilarity } from '@/lib/rag';

export const runtime = 'edge';

const embeddingModel = google.embedding('gemini-embedding-001');
const RAG_TOP_K = 3;
/** 余弦相似度下限；低于此值的 chunk 不注入（可按实际语料微调，常见试算区间约 0.3～0.55） */
const RAG_MIN_COSINE = 0.35;
/** Base64 字符数上限（约对应数 MB 原图，避免压满 Edge 请求体） */
const MAX_IMAGE_BASE64_LEN = 6_500_000;

const jaContextMap: Record<string, string> = {
  meeting:
    '这是研究室组会。请将中文翻译成专业的日语学术口语（丁寧語），注意专业术语的准确性。',
  business:
    '这是商务邮件。请使用标准的敬语（尊敬語/謙譲語），确保格式地道（如：お世話になっております）。',
  friend:
    '这是朋友聊天。请使用自然、亲切的日语口语（ため口），可以适当使用助词（ね、よ）。',
};
const zhContextMap: Record<string, string> = {
  meeting: '这是大学研究室组会场景，请使用正式、专业的中文学术口吻。',
  business: '这是商务办公场景，请使用得体的职场中文，确保符合商务礼仪。',
  friend: '这是好朋友聊天场景，请使用自然的中文口语，可以带一点亲切感。',
};

function stripBase64Payload(raw: string): string {
  return raw.replace(/^data:image\/[\w+.-]+;base64,/i, '').trim();
}

export async function POST(req: Request) {
  const body = await req.json();
  const {
    prompt,
    context,
    direction,
    mode,
    knowledgeBase,
    imageBase64,
    imageMediaType,
  } = body;

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

  const ctxKey = typeof context === 'string' ? context : 'meeting';
  const isZhToJa = direction === 'zh-ja';
  const instruction =
    (isZhToJa ? jaContextMap[ctxKey] : zhContextMap[ctxKey]) ??
    (isZhToJa ? jaContextMap.meeting : zhContextMap.meeting);

  if (mode === 'translate-image') {
    const raw =
      typeof imageBase64 === 'string' ? imageBase64 : '';
    const clean = stripBase64Payload(raw);
    if (!clean) {
      return new Response('缺少图片数据', { status: 400 });
    }
    if (clean.length > MAX_IMAGE_BASE64_LEN) {
      return new Response('图片过大，请压缩后重试', { status: 400 });
    }
    let binary: Uint8Array;
    try {
      binary = Uint8Array.from(globalThis.atob(clean), (ch) => ch.charCodeAt(0));
    } catch {
      return new Response('图片 Base64 无效', { status: 400 });
    }
    const mime =
      typeof imageMediaType === 'string' && /^image\//i.test(imageMediaType)
        ? imageMediaType
        : 'image/jpeg';

    const result = await streamText({
      model: google('gemini-3.1-flash-lite-preview'),
      system: `你是一个精通中日互译的专家。
用户会提供一张含文字的图片。请先识别图中全部可见文字，再按要求完成翻译（一步完成，不要描述识别过程）。
当前任务：${isZhToJa ? '【中译日】' : '【日译中】'}。
语境设定：${instruction}。
规则：只输出翻译后的正文，语序符合目标语言阅读习惯；严禁输出原文、严禁任何解释或前后缀。若图中没有任何可读文字，仅输出一个字：无`,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', image: binary, mediaType: mime },
            { type: 'text', text: '请翻译图片中的文字。' },
          ],
        },
      ],
    });
    return result.toTextStreamResponse();
  }

  let ragSection = '';
  const kb =
    typeof knowledgeBase === 'string' && knowledgeBase.trim().length > 0
      ? knowledgeBase
      : '';
  if (kb && typeof prompt === 'string' && prompt.trim().length > 0) {
    const chunks = splitKnowledge(kb);
    if (chunks.length > 0) {
      const { embedding: queryVec } = await embed({
        model: embeddingModel,
        value: prompt,
        providerOptions: {
          google: { taskType: 'RETRIEVAL_QUERY' },
        },
      });
      const { embeddings: docVecs } = await embedMany({
        model: embeddingModel,
        values: chunks,
        providerOptions: {
          google: { taskType: 'RETRIEVAL_DOCUMENT' },
        },
      });
      const scores = docVecs.map((v) => cosineSimilarity(queryVec, v));
      const top = topKBySimilarity(
        chunks,
        scores,
        RAG_TOP_K,
        RAG_MIN_COSINE,
      );
      if (top.length > 0) {
        ragSection = `

【检索到的参考资料（Gemini Embedding 语义匹配，仅供术语与表达一致时参考；以用户原文为准）】
${top.map((t, i) => `${i + 1}. ${t}`).join('\n\n')}`;
      }
    }
  }

  const result = await streamText({
    model: google('gemini-3.1-flash-lite-preview'),
    system: `你是一个精通中日互译的专家。
      当前任务：${isZhToJa ? '【中译日】' : '【日译中】'}。
      语境设定：${instruction}。
      规则：只输出翻译结果，严禁解释，严禁回复多余的内容。${ragSection}`,
    prompt: prompt,
  });
  return result.toTextStreamResponse();
}
