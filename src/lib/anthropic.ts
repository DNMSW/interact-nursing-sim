import Anthropic from '@anthropic-ai/sdk';
type MessageParam = Anthropic.MessageParam;

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6';

// Uses JSON prefill technique: the assistant turn starts with '{' to force JSON output.
// The response text does NOT include the prefilled character, so we prepend it.

export async function callAnthropicChat(
  systemPrompt: string,
  history: { role: 'student' | 'patient'; content: string }[],
  currentStudentMessage: string,
): Promise<string> {
  const historyMessages: MessageParam[] = buildAlternatingHistory(history);

  const messages: MessageParam[] = [
    ...historyMessages,
    { role: 'user', content: currentStudentMessage },
    { role: 'assistant', content: '{' },
  ];

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: systemPrompt,
    messages,
  });

  const block = response.content[0];
  if (block.type !== 'text') {
    throw new Error('Unexpected non-text response block from Anthropic');
  }

  return '{' + block.text;
}

export async function callAnthropicFeedback(
  systemPrompt: string,
  userMessage: string,
  maxTokens = 2048,
): Promise<string> {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [
      { role: 'user', content: userMessage },
      { role: 'assistant', content: '{' },
    ],
  });

  const block = response.content[0];
  if (block.type !== 'text') {
    throw new Error('Unexpected non-text response block from Anthropic');
  }

  return '{' + block.text;
}

// Repair call: same messages, but we append the bad output and ask for correction.
export async function callAnthropicRepair(
  systemPrompt: string,
  originalMessages: MessageParam[],
  badOutput: string,
  repairSchema: string,
): Promise<string> {
  const repairMessages: MessageParam[] = [
    ...originalMessages,
    {
      role: 'user',
      content: `Your previous response was not valid JSON. Respond ONLY with a valid JSON object matching this schema:\n${repairSchema}\n\nDo not include any explanation or markdown.`,
    },
    { role: 'assistant', content: '{' },
  ];

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: systemPrompt,
    messages: repairMessages,
  });

  const block = response.content[0];
  if (block.type !== 'text') {
    throw new Error('Unexpected non-text response block from Anthropic');
  }

  return '{' + block.text;
}

// Ensure the history array alternates correctly (Anthropic requirement).
// If two consecutive turns have the same role, merge them.
function buildAlternatingHistory(
  turns: { role: 'student' | 'patient'; content: string }[],
): MessageParam[] {
  const result: MessageParam[] = [];

  for (const turn of turns) {
    const apiRole: 'user' | 'assistant' = turn.role === 'student' ? 'user' : 'assistant';

    if (result.length > 0 && result[result.length - 1].role === apiRole) {
      // Merge with the previous entry
      const last = result[result.length - 1];
      if (typeof last.content === 'string') {
        last.content = last.content + '\n' + turn.content;
      }
    } else {
      result.push({ role: apiRole, content: turn.content });
    }
  }

  // Anthropic requires the first message to be from the user
  if (result.length > 0 && result[0].role === 'assistant') {
    result.unshift({ role: 'user', content: '.' });
  }

  return result;
}
