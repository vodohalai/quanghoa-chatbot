import type { Env, Message, AIResponse } from './types';
import { getBotSettings, buildAIContext } from './db';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const run = (env: Env, model: string, inputs: unknown) => (env.AI.run as any)(model, inputs);
const CHAT_MODEL = '@cf/meta/llama-4-scout-17b-16e-instruct';
const VISION_MODEL = '@cf/meta/llama-3.2-11b-vision-instruct';

const RESPONSE_SCHEMA = `
Trả lời dưới dạng JSON với cấu trúc sau:
{
  "message": "nội dung trả lời cho khách hàng (bắt buộc)",
  "send_image_key": "key của ảnh muốn gửi hoặc null (chỉ gửi khi thực sự cần thiết)",
  "image_reason": "lý do gửi ảnh hoặc null"
}

QUAN TRỌNG:
- Chỉ set send_image_key khi khách hỏi về sản phẩm LẦN ĐẦU, hỏi giá, hoặc chủ động yêu cầu xem ảnh
- KHÔNG gửi ảnh liên tục, KHÔNG gửi ảnh khi không cần thiết
- send_image_key phải là KEY CHÍNH XÁC từ danh mục ảnh hoặc null
- Trả lời bằng tiếng Việt tự nhiên, thân thiện
`.trim();

export async function analyzeImage(env: Env, imageUrl: string): Promise<string> {
  const response = await run(env, VISION_MODEL, {
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image_url', url: imageUrl },
          { type: 'text', text: 'Mô tả chi tiết hình ảnh này bằng tiếng Việt. Nếu có sản phẩm, hãy mô tả đặc điểm, màu sắc, kiểu dáng.' }
        ]
      }
    ]
  });

  return (response as { response?: string }).response || 'Không thể phân tích ảnh';
}

export async function generateResponse(
  env: Env,
  psid: string,
  userMessage: string,
  history: Message[],
  imageUrl?: string
): Promise<AIResponse> {
  const [settings, context] = await Promise.all([
    getBotSettings(env),
    buildAIContext(env),
  ]);

  let userContent = userMessage;

  // Phân tích ảnh từ khách nếu có
  if (imageUrl) {
    try {
      const imageDesc = await analyzeImage(env, imageUrl);
      userContent = `[Khách gửi ảnh: ${imageDesc}]\n${userMessage || ''}`.trim();
    } catch {
      userContent = `[Khách gửi một ảnh]\n${userMessage || ''}`.trim();
    }
  }

  const systemPrompt = `${settings.system_prompt}

${context}

${RESPONSE_SCHEMA}`;

  const maxHistory = parseInt(settings.max_history || '20', 10);
  const recentHistory = history.slice(-maxHistory);

  const messages: Message[] = [
    { role: 'system', content: systemPrompt },
    ...recentHistory,
    { role: 'user', content: userContent },
  ];

  try {
    const result = await run(env, CHAT_MODEL, {
      messages,
      max_tokens: 1024,
      temperature: 0.7,
    });

    const rawText = (result as { response?: string }).response || '';

    // Parse JSON response
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as AIResponse;
      return {
        message: parsed.message || rawText,
        send_image_key: parsed.send_image_key || null,
        image_reason: parsed.image_reason || null,
      };
    }

    return { message: rawText, send_image_key: null, image_reason: null };
  } catch (err) {
    console.error('AI error:', err);
    return {
      message: 'Xin lỗi, tôi đang gặp sự cố. Bạn vui lòng thử lại sau hoặc liên hệ trực tiếp với chúng tôi nhé!',
      send_image_key: null,
      image_reason: null,
    };
  }
}
