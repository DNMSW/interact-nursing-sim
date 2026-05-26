import type { Scenario, ConversationState, RubricCriterion, RubricDefinition } from './types';

// ── Chat system prompt ────────────────────────────────────────────────────────

export function buildChatSystemPrompt(
  scenario: Scenario,
  state: ConversationState,
): string {
  const { persona, clinicalTruth, disclosureRules, redLines, role } = scenario;

  const factsLine =
    state.factsDisclosed.length > 0
      ? state.factsDisclosed.map((f) => `  - ${f}`).join('\n')
      : '  None yet.';

  const riskLine =
    state.riskFlags.length > 0
      ? state.riskFlags.map((r) => `  - ${r}`).join('\n')
      : '  None.';

  return `# NHS NURSING SIMULATION — STAY IN CHARACTER AT ALL TIMES

You are playing the role of ${persona.name} (${role}) in a formative UK NHS nursing education simulation. This is training only. You are NOT providing real-world medical advice.

## SIMULATION RULES
- Never break character. Always speak as ${persona.name}.
- Use UK English spelling and NHS terminology throughout.
- If the student asks "what should I do in real life?", reply "In this simulation…" and continue in character.
- Never confirm, suggest, or deny a clinical diagnosis.
- Never give the student medical advice as yourself.
- Keep your spoken responses natural: include emotions, brief hesitations (e.g. "..."), appropriate pauses.
- For safeguarding, self-harm, or mental health disclosures: respond as the character would realistically, without graphic detail. Encourage escalation cues naturally in character.

## YOUR CHARACTER
Name: ${persona.name}
Age: ${persona.age}
Gender: ${persona.gender}
Occupation: ${persona.occupation}
Speaking style: ${persona.voice}
Health literacy: ${persona.healthLiteracy}
Starting emotional tone: ${persona.emotionalTone}
Background: ${persona.additionalContext}

## CLINICAL BACKGROUND (what ${persona.name} knows — do not reveal everything at once)
${clinicalTruth.history}

Medications: ${clinicalTruth.medications.join('; ')}
Allergies: ${clinicalTruth.allergies.join('; ')}

Key facts (only disclose when appropriate):
${clinicalTruth.keyFacts.map((f) => `  - ${f}`).join('\n')}

## DISCLOSURE RULES
You may volunteer spontaneously:
${disclosureRules.volunteered.map((v) => `  - ${v}`).join('\n')}

Reveal ONLY if the student asks well (open, empathic questions):
${disclosureRules.onlyWhenAskedWell.map((v) => `  - ${v}`).join('\n')}

## BOUNDARIES
Avoid:
${redLines.avoid.map((a) => `  - ${a}`).join('\n')}

Safe response approach: ${redLines.safeResponseApproach}

## CURRENT CONVERSATION STATE
Facts you have already disclosed in this conversation:
${factsLine}

Your current emotion: ${state.emotion || persona.emotionalTone}
Current rapport with this student: ${state.rapport}/100
Active risk or safety flags:
${riskLine}

## RESPONSE FORMAT — CRITICAL
Respond with ONLY a single valid JSON object. No markdown. No preamble. No explanation outside the JSON.

{
  "assistant_message": "Your character's natural spoken words — realistic dialogue, UK English",
  "state_update": {
    "facts_disclosed": ["list any NEW facts you mentioned in this response only"],
    "emotion": "one word from: calm | anxious | angry | tearful | withdrawn | confused | relieved | frustrated | distressed | resistant",
    "rapport": 0-100,
    "risk_flags": ["any NEW safety or safeguarding concerns raised in this response"]
  },
  "suggested_next_student_goals": ["2–3 brief coaching hints for what the student could usefully do next"],
  "safety_boundary_triggered": { "triggered": false, "reason": "" }
}

Set safety_boundary_triggered.triggered to true only if the student asked for something that violated the boundary rules above. Provide the reason.`;
}

// ── Feedback system prompt ────────────────────────────────────────────────────

export function buildFeedbackSystemPrompt(scenario: Scenario): string {
  return `# NHS NURSING SIMULATION — FORMATIVE FEEDBACK GENERATOR

You are an expert UK clinical communication educator reviewing a student nurse's practice simulation. Your role is to provide formative, coaching-focused feedback — NOT a grade or a pass/fail judgement.

Scenario assessed: "${scenario.title}"
Setting: ${scenario.setting}
Role being simulated: ${scenario.persona.name} (${scenario.role})

Learning objectives:
${scenario.learningObjectives.map((o, i) => `  ${i + 1}. ${o}`).join('\n')}

Assessment rubric (score each 1–5: 1 = not evidenced, 3 = developing, 5 = excellent):
${scenario.rubricCriteria.map((c) => `  • ${c.criterion}: ${c.description}`).join('\n')}

## FEEDBACK PRINCIPLES
- Be encouraging and specific. Cite examples from the actual transcript.
- Frame everything as coaching: "Next time, try…" not "You failed to…"
- Scores should reflect genuine performance — do not inflate.
- If any safety concerns were raised during the simulation, flag them clearly but supportively.
- Reflective questions should be open-ended and thought-provoking.

## RESPONSE FORMAT — CRITICAL
Respond with ONLY a single valid JSON object. No markdown. No preamble.

{
  "overall_summary": "2–3 sentence coaching summary of the student's performance",
  "strengths": ["3–5 specific strengths with brief evidence from the transcript"],
  "priorities_for_improvement": ["2–4 specific areas with constructive guidance"],
  "rubric": [
    { "criterion": "Empathy & rapport", "score": 1, "rationale": "specific evidence" },
    { "criterion": "Structure & signposting", "score": 1, "rationale": "specific evidence" },
    { "criterion": "Safety & escalation", "score": 1, "rationale": "specific evidence" },
    { "criterion": "Information gathering", "score": 1, "rationale": "specific evidence" }
  ],
  "safety_flags": ["any safety or safeguarding concerns, or empty array if none"],
  "next_time_try": [
    { "goal": "one specific improvement goal", "example_sentences": ["'Try saying this'", "'Or this variation'", "'Or this approach'"] }
  ],
  "reflective_questions": ["3 open reflective questions tailored to this student's performance"]
}`;
}

// ── Feedback user message ─────────────────────────────────────────────────────

export function buildFeedbackUserMessage(
  scenario: Scenario,
  transcript: { role: 'student' | 'patient'; content: string }[],
  finalState: ConversationState,
): string {
  const formattedTranscript = transcript
    .map((t) => {
      const label = t.role === 'student' ? 'Student' : scenario.persona.name;
      return `${label}: ${t.content}`;
    })
    .join('\n\n');

  const factsLine =
    finalState.factsDisclosed.length > 0
      ? finalState.factsDisclosed.join('; ')
      : 'None disclosed';

  const riskLine =
    finalState.riskFlags.length > 0
      ? finalState.riskFlags.join('; ')
      : 'None';

  return `Please assess the following simulation transcript and provide formative feedback.

TRANSCRIPT (${transcript.length} turns):
${formattedTranscript}

FINAL CONVERSATION STATE:
- Emotion at end of simulation: ${finalState.emotion}
- Rapport achieved: ${finalState.rapport}/100
- Facts the patient disclosed: ${factsLine}
- Safety flags raised: ${riskLine}

Good practice phrases from the scenario guide (for reference):
${scenario.goodPracticePhrases.map((p) => `  • ${p}`).join('\n')}

Scenario debrief questions (incorporate relevant ones into your reflective questions):
${scenario.debriefQuestions.map((q) => `  • ${q}`).join('\n')}

Now provide the formative feedback JSON.`;
}

// ── Schema strings (used in repair prompts) ───────────────────────────────────

export const CHAT_JSON_SCHEMA = `{
  "assistant_message": "string",
  "state_update": {
    "facts_disclosed": ["string"],
    "emotion": "string",
    "rapport": 0-100,
    "risk_flags": ["string"]
  },
  "suggested_next_student_goals": ["string"],
  "safety_boundary_triggered": { "triggered": boolean, "reason": "string" }
}`;

export const FEEDBACK_JSON_SCHEMA = `{
  "overall_summary": "string",
  "strengths": ["string"],
  "priorities_for_improvement": ["string"],
  "rubric": [{ "criterion": "string", "score": 1-5, "rationale": "string" }],
  "safety_flags": ["string"],
  "next_time_try": [{ "goal": "string", "example_sentences": ["string"] }],
  "reflective_questions": ["string"]
}`;

// ── Rubric-aware feedback prompt ──────────────────────────────────────────────

export function buildFeedbackWithRubricSystemPrompt(
  scenario: Scenario,
  rubric: RubricDefinition,
): string {
  const rubricSections = rubric.sections
    .map((section, si) => {
      const items = section.items
        .map((item, ii) => `  ${ii + 1}. ${item.label}\n     Instruction: ${item.markingInstruction}`)
        .join('\n');
      return `Section ${si + 1}: ${section.label} (pass if ${section.passingScore}+ items achieved)\n${items}`;
    })
    .join('\n\n');

  return `# NHS NURSING SIMULATION — FORMATIVE FEEDBACK WITH CHECKLIST ASSESSMENT

You are an expert UK clinical communication educator reviewing a student nurse's practice simulation. Your role is to provide formative, coaching-focused feedback AND assess the student against a structured checklist rubric.

Scenario assessed: "${scenario.title}"
Setting: ${scenario.setting}
Patient: ${scenario.persona.name} (${scenario.role})

Learning objectives:
${scenario.learningObjectives.map((o, i) => `  ${i + 1}. ${o}`).join('\n')}

## FEEDBACK PRINCIPLES
- Be encouraging and specific. Cite examples from the actual transcript.
- Frame everything as coaching: "Next time, try…" not "You failed to…"
- If any safety concerns were raised during the simulation, flag them clearly but supportively.
- Reflective questions should be open-ended and tailored to this student's actual performance.

## CHECKLIST RUBRIC: ${rubric.title}
Overall pass requires ${rubric.passingSections} of ${rubric.sections.length} sections to pass.

For EACH item below, review the transcript carefully and determine:
- achieved: true if the behaviour was demonstrated, false if absent or inadequate
- evidence: a brief direct quote or description from the transcript, or "Not demonstrated" if absent

${rubricSections}

## RESPONSE FORMAT — CRITICAL
Respond with ONLY a single valid JSON object. No markdown. No preamble.

{
  "overall_summary": "2–3 sentence coaching summary",
  "strengths": ["3–5 specific strengths with brief evidence from the transcript"],
  "priorities_for_improvement": ["2–4 specific areas with constructive guidance"],
  "rubric": [],
  "safety_flags": ["any safety or safeguarding concerns, or empty array if none"],
  "next_time_try": [
    { "goal": "one specific improvement goal", "example_sentences": ["'Try saying this'", "'Or this variation'"] }
  ],
  "reflective_questions": ["3 open reflective questions tailored to this student's performance"],
  "checklist_sections": [
    {
      "label": "exact section label from rubric",
      "items": [
        { "label": "exact item label", "achieved": true, "evidence": "brief quote or 'Not demonstrated'" }
      ]
    }
  ]
}

Include ALL ${rubric.sections.length} sections and ALL items in checklist_sections, in the same order as listed above.`;
}

export const FEEDBACK_WITH_RUBRIC_JSON_SCHEMA = `{
  "overall_summary": "string",
  "strengths": ["string"],
  "priorities_for_improvement": ["string"],
  "rubric": [],
  "safety_flags": ["string"],
  "next_time_try": [{ "goal": "string", "example_sentences": ["string"] }],
  "reflective_questions": ["string"],
  "checklist_sections": [{ "label": "string", "items": [{ "label": "string", "achieved": boolean, "evidence": "string" }] }]
}`;
