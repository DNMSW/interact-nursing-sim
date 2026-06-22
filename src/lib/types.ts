export interface Persona {
  name: string;
  age: number;
  gender: string;
  occupation: string;
  voice: string;
  healthLiteracy: 'low' | 'moderate' | 'high';
  emotionalTone: string;
  additionalContext: string;
}

export interface ClinicalTruth {
  history: string;
  medications: string[];
  allergies: string[];
  keyFacts: string[];
}

export interface DisclosureRules {
  volunteered: string[];
  onlyWhenAskedWell: string[];
}

export interface RedLines {
  avoid: string[];
  safeResponseApproach: string;
}

export interface RubricCriterion {
  criterion: string;
  description: string;
}

export interface Scenario {
  id: string;
  title: string;
  description: string;
  setting: string;
  yearLevel: string;
  speciality: string;
  estimatedDuration: string;
  role: 'patient' | 'relative' | 'colleague';
  persona: Persona;
  clinicalTruth: ClinicalTruth;
  disclosureRules: DisclosureRules;
  redLines: RedLines;
  learningObjectives: string[];
  rubricCriteria: RubricCriterion[];
  debriefQuestions: string[];
  goodPracticePhrases: string[];
  rubricId?: string;
  ehrUrl?: string;
}

// ── Rubric definitions ────────────────────────────────────────────────────────

export interface RubricItem {
  label: string;
  markingInstruction: string;
  failureHint: string;
  type: 'transcript' | 'action' | 'investigation';
  mandatory: boolean;
}

export interface RubricSection {
  label: string;
  passingScore: number;
  mandatory: boolean;
  items: RubricItem[];
}

export interface RubricDefinition {
  id: string;
  title: string;
  passingSections: number;
  sections: RubricSection[];
}

// ── Checklist assessment results ──────────────────────────────────────────────

export interface ChecklistItemResult {
  label: string;
  achieved: boolean;
  evidence: string;
}

export interface ChecklistSectionResult {
  label: string;
  passingScore: number;
  achievedCount: number;
  passed: boolean;
  items: ChecklistItemResult[];
}

export interface ChecklistResult {
  rubricTitle: string;
  passingSections: number;
  sectionsPassed: number;
  overallPass: boolean;
  sections: ChecklistSectionResult[];
}

export type MessageRole = 'student' | 'patient';

export interface ConversationTurn {
  role: MessageRole;
  content: string;
  timestamp: number;
}

export interface ConversationState {
  factsDisclosed: string[];
  emotion: string;
  rapport: number;
  riskFlags: string[];
}

// Shapes sent to / received from the API

export interface ChatApiRequest {
  scenarioId: string;
  recentTurns: { role: MessageRole; content: string }[];
  state: ConversationState;
  studentMessage: string;
}

export interface ChatApiResponse {
  assistantMessage: string;
  stateUpdate: {
    factsDisclosed: string[];
    emotion: string;
    rapport: number;
    riskFlags: string[];
  };
  suggestedNextGoals: string[];
  safetyBoundaryTriggered: {
    triggered: boolean;
    reason: string;
  };
}

export interface FeedbackApiRequest {
  scenarioId: string;
  transcript: { role: MessageRole; content: string }[];
  finalState: ConversationState;
}

export interface RubricScore {
  criterion: string;
  score: number;
  rationale: string;
}

export interface NextTimeTry {
  goal: string;
  exampleSentences: string[];
}

export interface FeedbackApiResponse {
  overallSummary: string;
  strengths: string[];
  prioritiesForImprovement: string[];
  rubric: RubricScore[];
  safetyFlags: string[];
  nextTimeTry: NextTimeTry[];
  reflectiveQuestions: string[];
  checklistResult?: ChecklistResult;
}

// Raw AI output shapes (snake_case, before transformation)

export interface RawChatOutput {
  assistant_message: string;
  state_update: {
    facts_disclosed: string[];
    emotion: string;
    rapport: number;
    risk_flags: string[];
  };
  suggested_next_student_goals: string[];
  safety_boundary_triggered: {
    triggered: boolean;
    reason: string;
  };
}

export interface RawFeedbackOutput {
  overall_summary: string;
  strengths: string[];
  priorities_for_improvement: string[];
  rubric: Array<{
    criterion: string;
    score: number;
    rationale: string;
  }>;
  safety_flags: string[];
  next_time_try: Array<{
    goal: string;
    example_sentences: string[];
  }>;
  reflective_questions: string[];
}

export interface RawChecklistItemResult {
  label: string;
  achieved: boolean;
  evidence: string;
}

export interface RawChecklistSectionResult {
  label: string;
  items: RawChecklistItemResult[];
}

export interface RawFeedbackWithChecklistOutput extends Omit<RawFeedbackOutput, 'rubric'> {
  rubric: Array<{ criterion: string; score: number; rationale: string }>;
  checklist_sections: RawChecklistSectionResult[];
}
