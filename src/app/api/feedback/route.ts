import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { KNOWN_SCENARIO_IDS, getScenarioById } from '@/lib/scenarios';
import { getRubricById } from '@/lib/rubrics';
import {
  buildFeedbackSystemPrompt,
  buildFeedbackUserMessage,
  buildFeedbackWithRubricSystemPrompt,
} from '@/lib/prompt-builder';
import { callAnthropicFeedback } from '@/lib/anthropic';
import {
  validateFeedbackOutput,
  feedbackOutputToApiResponse,
  validateFeedbackWithChecklistOutput,
  feedbackWithChecklistOutputToApiResponse,
  feedbackFallback,
} from '@/lib/json-validator';

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

const FeedbackRequestSchema = z.object({
  scenarioId: z.string().max(80),
  transcript: z.array(TurnSchema).min(1).max(60),
  finalState: StateSchema,
});

export async function POST(req: NextRequest) {
  const contentLength = Number(req.headers.get('content-length') ?? 0);
  if (contentLength > 50_000) {
    return NextResponse.json({ error: 'Request too large' }, { status: 413 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = FeedbackRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request shape' }, { status: 400 });
  }

  const { scenarioId, transcript, finalState } = parsed.data;

  if (!KNOWN_SCENARIO_IDS.has(scenarioId)) {
    return NextResponse.json({ error: 'Unknown scenario' }, { status: 404 });
  }

  const scenario = getScenarioById(scenarioId)!;
  const rubric = scenario.rubricId ? getRubricById(scenario.rubricId) : undefined;
  const userMessage = buildFeedbackUserMessage(scenario, transcript, finalState);

  try {
    if (rubric) {
      // Rubric-aware path: checklist assessment
      const systemPrompt = buildFeedbackWithRubricSystemPrompt(scenario, rubric);
      const rawOutput = await callAnthropicFeedback(systemPrompt, userMessage, 4096);
      const validated = validateFeedbackWithChecklistOutput(rawOutput);

      if (validated) {
        return NextResponse.json(feedbackWithChecklistOutputToApiResponse(validated, rubric));
      }
    } else {
      // Standard holistic feedback
      const systemPrompt = buildFeedbackSystemPrompt(scenario);
      const rawOutput = await callAnthropicFeedback(systemPrompt, userMessage);
      const validated = validateFeedbackOutput(rawOutput);

      if (validated) {
        return NextResponse.json(feedbackOutputToApiResponse(validated));
      }
    }

    return NextResponse.json(feedbackFallback());
  } catch {
    console.error('[api/feedback] upstream error');
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }
}
