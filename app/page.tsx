'use client';

import { useMemo, useState } from 'react';

type Msg = { role: 'user' | 'assistant' | 'system'; content: string };

const MBTI_OPTIONS = [
  'INTJ','INTP','ENTJ','ENTP',
  'INFJ','INFP','ENFJ','ENFP',
  'ISTJ','ISFJ','ESTJ','ESFJ',
  'ISTP','ISFP','ESTP','ESFP',
] as const;

export default function Page() {
  const [mbti, setMbti] = useState<(typeof MBTI_OPTIONS)[number]>('INTJ');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(false);

  const turns = useMemo(() => messages.filter(m => m.role !== 'system').length, [messages]);

  async function send() {
    const content = input.trim();
    if (!content || loading) return;

    const nextMessages: Msg[] = [...messages, { role: 'user', content }];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ mbti, messages: nextMessages }),
      });

      if (!res.ok || !res.body) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = '';

      // stream text chunks
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages([...nextMessages, { role: 'assistant', content: acc }]);
      }
    } catch (e: any) {
      setMessages([...nextMessages, { role: 'assistant', content: `Error: ${e?.message ?? String(e)}` }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <h1>16Chats</h1>
      <p>
        Choose an MBTI persona, chat for a few turns, and (after 5 rounds) get a lightweight MBTI guess.
      </p>

      <label>
        Persona:&nbsp;
        <select value={mbti} onChange={(e) => setMbti(e.target.value as any)}>
          {MBTI_OPTIONS.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </label>

      <div style={{ marginTop: 24 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ marginBottom: 12 }}>
            <strong>{m.role}:</strong>
            <pre>{m.content}</pre>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 16 }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Say something…"
        />
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button onClick={send} disabled={loading}>Send</button>
          <span style={{ opacity: 0.7 }}>turns: {turns}</span>
        </div>
      </div>
    </main>
  );
}
