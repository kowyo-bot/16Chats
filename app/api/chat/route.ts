import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

export const runtime = 'edge';

type Msg = { role: 'user' | 'assistant' | 'system'; content: string };

function personaPrompt(mbti: string) {
  return `You are role-playing as an AI with MBTI type ${mbti}. Match the typical communication style, but do not stereotype in a harmful way.

Rules:
- Keep responses concise and conversational.
- Ask 1 clarifying question when helpful.
- After the user and assistant have exchanged about 5 user messages total, add a short MBTI guess for the user (1-2 candidates) with 1-2 bullet reasons.
`;
}

export async function POST(req: Request) {
  const body = (await req.json()) as { mbti?: string; messages?: Msg[] };
  const mbti = body.mbti ?? 'INTJ';
  const messages = body.messages ?? [];

  const result = await streamText({
    model: openai('gpt-4.1-mini'),
    messages: [{ role: 'system', content: personaPrompt(mbti) }, ...messages],
  });

  return result.toTextStreamResponse();
}
