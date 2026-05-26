import { z } from 'zod';
import type {
  RawChatOutput,
  RawFeedbackOutput,
  RawFeedbackWithChecklistOutput,
  ChatApiResponse,
  FeedbackApiResponse,
  ChecklistResult,
  RubricDefinition,
} from './types';

// ── Zod schemas ────────────────────────────────────────────────────────────────

const ChatOutputSchema = z.object({
  assistant_message: z.string().min(1).max(2000),
  state_update: z.object({
    facts_disclosed: z.array(z.string().max(300)).max(20),
    emotion: z.string().max(50),
    rapport: z.number().int().min(0).max(100),
    risk_flags: z.array(z.string().max(300)).max(10),
  }),
  suggested_next_student_goals: z.array(z.string().max(200)).max(5),
  safety_boundary_triggered: z.object({
    triggered: z.boolean(),
    reason: z.string().max(500),
  }),
});

const FeedbackOutputSchema = z.object({
  overall_summary: z.string().min(1).max(1000),
  strengths: z.array(z.string().max(500)).min(1).max(10),
  priorities_for_improvement: z.array(z.string().max(500)).min(1).max(10),
  rubric: z
    .array(
      z.object({
        criterion: z.string().max(100),
        score: z.number().int().min(1).max(5),
        rationale: z.string().max(500),
      }),
    )
    .min(1)
    .max(10),
  safety_flags: z.array(z.string().max(500)).max(10),
  next_time_try: z
    .array(
      z.object({
        goal: z.string().max(300),
        example_sentences: z.array(z.string().max(300)).min(1).max(5),
      }),
    )
    .max(5),
  reflective_questions: z.array(z.string().max(500)).min(1).max(5),
});

// ── Parsers ────────────────────────────────────────────────────────────────────

function safeParseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    // Attempt to extract the first complete JSON object from the text
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

// ── Chat validation ────────────────────────────────────────────────────────────

export function validateChatOutput(raw: string): RawChatOutput | null {
  const parsed = safeParseJson(raw);
  if (!parsed) return null;

  const result = ChatOutputSchema.safeParse(parsed);
  if (!result.success) return null;

  return result.data as RawChatOutput;
}

export function chatOutputToApiResponse(raw: RawChatOutput): ChatApiResponse {
  return {
    assistantMessage: raw.assistant_message,
    stateUpdate: {
      factsDisclosed: raw.state_update.facts_disclosed,
      emotion: raw.state_update.emotion,
      rapport: raw.state_update.rapport,
      riskFlags: raw.state_update.risk_flags,
    },
    suggestedNextGoals: raw.suggested_next_student_goals,
    safetyBoundaryTriggered: raw.safety_boundary_triggered,
  };
}

export function chatFallback(personaName: string): ChatApiResponse {
  return {
    assistantMessage: `Sorry, I... I'm not sure what to say right now. Could you say that again?`,
    stateUpdate: {
      factsDisclosed: [],
      emotion: 'confused',
      rapport: 50,
      riskFlags: [],
    },
    suggestedNextGoals: ['Try rephrasing your question', 'Use a more open question'],
    safetyBoundaryTriggered: { triggered: false, reason: '' },
  };
}

// ── Feedback validation ────────────────────────────────────────────────────────

export function validateFeedbackOutput(raw: string): RawFeedbackOutput | null {
  const parsed = safeParseJson(raw);
  if (!parsed) return null;

  const result = FeedbackOutputSchema.safeParse(parsed);
  if (!result.success) return null;

  return result.data as RawFeedbackOutput;
}

export function feedbackOutputToApiResponse(raw: RawFeedbackOutput): FeedbackApiResponse {
  return {
    overallSummary: raw.overall_summary,
    strengths: raw.strengths,
    prioritiesForImprovement: raw.priorities_for_improvement,
    rubric: raw.rubric,
    safetyFlags: raw.safety_flags,
    nextTimeTry: raw.next_time_try.map((n) => ({
      goal: n.goal,
      exampleSentences: n.example_sentences,
    })),
    reflectiveQuestions: raw.reflective_questions,
  };
}

// ── Feedback with checklist validation ───────────────────────────────────────

const ChecklistItemResultSchema = z.object({
  label: z.string().max(200),
  achieved: z.boolean(),
  evidence: z.string().max(500),
});

const ChecklistSectionResultSchema = z.object({
  label: z.string().max(200),
  items: z.array(ChecklistItemResultSchema).max(25),
});

const FeedbackWithChecklistOutputSchema = z.object({
  overall_summary: z.string().min(1).max(1000),
  strengths: z.array(z.string().max(500)).min(1).max(10),
  priorities_for_improvement: z.array(z.string().max(500)).min(1).max(10),
  rubric: z.array(z.object({
    criterion: z.string().max(100),
    score: z.number().int().min(1).max(5),
    rationale: z.string().max(500),
  })).max(10),
  safety_flags: z.array(z.string().max(500)).max(10),
  next_time_try: z.array(z.object({
    goal: z.string().max(300),
    example_sentences: z.array(z.string().max(300)).min(1).max(5),
  })).max(5),
  reflective_questions: z.array(z.string().max(500)).min(1).max(5),
  checklist_sections: z.array(ChecklistSectionResultSchema).min(1).max(15),
});

export function validateFeedbackWithChecklistOutput(
  raw: string,
): RawFeedbackWithChecklistOutput | null {
  const parsed = safeParseJson(raw);
  if (!parsed) return null;
  const result = FeedbackWithChecklistOutputSchema.safeParse(parsed);
  if (!result.success) return null;
  return result.data as RawFeedbackWithChecklistOutput;
}

export function feedbackWithChecklistOutputToApiResponse(
  raw: RawFeedbackWithChecklistOutput,
  rubric: RubricDefinition,
): FeedbackApiResponse {
  const sections = raw.checklist_sections.map((sec) => {
    const rubricSection = rubric.sections.find(s => s.label === sec.label);
    const passingScore = rubricSection?.passingScore ?? 0;
    const achievedCount = sec.items.filter(i => i.achieved).length;
    return {
      label: sec.label,
      passingScore,
      achievedCount,
      passed: achievedCount >= passingScore,
      items: sec.items.map(item => ({
        label: item.label,
        achieved: item.achieved,
        evidence: item.evidence,
      })),
    };
  });

  const sectionsPassed = sections.filter(s => s.passed).length;

  const checklistResult: ChecklistResult = {
    rubricTitle: rubric.title,
    passingSections: rubric.passingSections,
    sectionsPassed,
    overallPass: sectionsPassed >= rubric.passingSections,
    sections,
  };

  return {
    overallSummary: raw.overall_summary,
    strengths: raw.strengths,
    prioritiesForImprovement: raw.priorities_for_improvement,
    rubric: raw.rubric,
    safetyFlags: raw.safety_flags,
    nextTimeTry: raw.next_time_try.map(n => ({
      goal: n.goal,
      exampleSentences: n.example_sentences,
    })),
    reflectiveQuestions: raw.reflective_questions,
    checklistResult,
  };
}

export function feedbackFallback(): FeedbackApiResponse {
  return {
    overallSummary:
      'Feedback could not be generated automatically. Please review the transcript with your supervisor.',
    strengths: ['The simulation was completed — well done for engaging with the practice.'],
    prioritiesForImprovement: [
      'Review the transcript with a peer or supervisor to identify areas for growth.',
    ],
    rubric: [
      { criterion: 'Empathy & rapport', score: 3, rationale: 'Unable to assess automatically.' },
      { criterion: 'Structure & signposting', score: 3, rationale: 'Unable to assess automatically.' },
      { criterion: 'Safety & escalation', score: 3, rationale: 'Unable to assess automatically.' },
      { criterion: 'Information gathering', score: 3, rationale: 'Unable to assess automatically.' },
    ],
    safetyFlags: [],
    nextTimeTry: [],
    reflectiveQuestions: [
      'What went well in this simulation?',
      'What would you do differently next time?',
      'Which learning objectives do you feel you met?',
    ],
  };
}
