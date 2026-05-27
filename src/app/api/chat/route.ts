import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { KNOWN_SCENARIO_IDS, getScenarioById } from '@/lib/scenarios';
import { buildChatSystemPrompt, CHAT_JSON_SCHEMA } from '@/lib/prompt-builder';
import { callAnthropicChat, callAnthropicRepair } from '@/lib/anthropic';
import {
  validateChatOutput,
  chatOutputToApiResponse,
  chatFallback,
} from '@/lib/json-validator';

// ── Input validation schema ────────────────────────────────────────────────────

const TurnSchema = z.object({
  role: z.enum(['student', 'patient']),
  content: z.string().max(600),
});

const StateSchema = z.object({
  factsDisclosed: z.array(z.string().max(300)).max(50),
  emotion: z.string().max(50),
  rapport: z.number().min(0).max(100),
  riskFlags: z.array(z.string().max(300)).max(20),
});

const ChatRequestSchema = z.object({
  scenarioId: z.string().max(80),
  recentTurns: z.array(TurnSchema).max(16),
  state: StateSchema,
  studentMessage: z.string().min(1).max(500),
});

// ── Route handler ──────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // Content-length guard (approx 20 KB max)
  const contentLength = Number(req.headers.get('content-length') ?? 0);
  if (contentLength > 20_000) {
    return NextResponse.json({ error: 'Request too large' }, { status: 413 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = ChatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request shape' }, { status: 400 });
  }

  const { scenarioId, recentTurns, state, studentMessage } = parsed.data;

  if (!KNOWN_SCENARIO_IDS.has(scenarioId)) {
    return NextResponse.json({ error: 'Unknown scenario' }, { status: 404 });
  }

  const scenario = getScenarioById(scenarioId)!;

  // Sanitise the student's message — strip HTML/script fragments
  const sanitised = studentMessage
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/javascript:/gi, '')
    .trim()
    .slice(0, 500);

  if (!sanitised) {
    return NextResponse.json({ error: 'Empty message after sanitisation' }, { status: 400 });
  }

  const systemPrompt = buildChatSystemPrompt(scenario, state);

  try {
    // First attempt
    const rawOutput = await callAnthropicChat(systemPrompt, recentTurns, sanitised);
    const validated = validateChatOutput(rawOutput);

    if (validated) {
      return NextResponse.json(chatOutputToApiResponse(validated));
    }

    // Repair attempt
    // Do not log rawOutput — may contain user-submitted content
    const repaired = await callAnthropicRepair(
      systemPrompt,
      [],
      rawOutput,
      CHAT_JSON_SCHEMA,
    );
    const revalidated = validateChatOutput(repaired);

    if (revalidated) {
      return NextResponse.json(chatOutputToApiResponse(revalidated));
    }

    // Both attempts failed — return safe fallback
    return NextResponse.json(chatFallback(scenario.persona.name));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[api/chat] upstream error:', msg);
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }
}
