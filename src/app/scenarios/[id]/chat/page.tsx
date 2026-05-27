'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getScenarioById } from '@/lib/scenarios';
import type {
  ConversationState,
  ConversationTurn,
  ChatApiResponse,
  FeedbackApiResponse,
} from '@/lib/types';

// ── Typing indicator ──────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-3 py-2.5">
      {[0, 0.15, 0.3].map((delay, i) => (
        <span
          key={i}
          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
          style={{ animationDelay: `${delay}s` }}
        />
      ))}
    </div>
  );
}

// ── Rapport bar ───────────────────────────────────────────────────────────────

function RapportBar({ value }: { value: number }) {
  const colour =
    value >= 70 ? 'bg-green-500' : value >= 40 ? 'bg-amber-500' : 'bg-red-400';
  return (
    <div className="flex items-center gap-2 min-w-0">
      <span className="text-xs text-gray-500 shrink-0">Rapport</span>
      <div className="flex-1 bg-gray-200 rounded-full h-1.5 min-w-0">
        <div
          className={`h-1.5 rounded-full transition-all duration-700 ${colour}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-xs text-gray-500 w-6 text-right shrink-0">{value}</span>
    </div>
  );
}

// ── Checklist section component ───────────────────────────────────────────────

function ChecklistSection({ section }: { section: FeedbackApiResponse['checklistResult'] extends undefined ? never : NonNullable<FeedbackApiResponse['checklistResult']>['sections'][number] }) {
  return (
    <div className={`rounded-lg border p-3 ${section.passed ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-gray-800">{section.label}</span>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${section.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {section.achievedCount}/{section.items.length} · {section.passed ? 'Pass' : `Need ${section.passingScore}`}
        </span>
      </div>
      <ul className="space-y-1">
        {section.items.map((item, i) => (
          <li key={i} className="flex gap-2 text-xs">
            <span className={`shrink-0 mt-0.5 ${item.achieved ? 'text-green-600' : 'text-red-500'}`}>
              {item.achieved ? '✓' : '✗'}
            </span>
            <div className="min-w-0">
              <span className="font-medium text-gray-800">{item.label}</span>
              {item.evidence && item.evidence !== 'Not demonstrated' && (
                <span className="text-gray-500"> — {item.evidence}</span>
              )}
              {(!item.achieved) && item.evidence === 'Not demonstrated' && (
                <span className="text-gray-400 italic"> — not demonstrated</span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Feedback display ──────────────────────────────────────────────────────────

function FeedbackDisplay({ data }: { data: FeedbackApiResponse }) {
  const cl = data.checklistResult;

  return (
    <div className="space-y-5 pb-8">
      <h2 className="text-lg font-bold text-nhs-dark-blue">Formative Feedback</h2>

      <div className="bg-nhs-pale-grey rounded-lg p-4">
        <p className="text-sm text-gray-800 leading-relaxed">{data.overallSummary}</p>
      </div>

      {data.safetyFlags.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-red-800 mb-2">Safety flags</h3>
          <ul className="space-y-1">
            {data.safetyFlags.map((f, i) => (
              <li key={i} className="text-sm text-red-700">⚠ {f}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Strengths</h3>
          <ul className="space-y-1.5">
            {data.strengths.map((s, i) => (
              <li key={i} className="text-sm text-gray-700 flex gap-2">
                <span className="text-green-600 shrink-0 mt-0.5">✓</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Priorities for improvement</h3>
          <ul className="space-y-1.5">
            {data.prioritiesForImprovement.map((p, i) => (
              <li key={i} className="text-sm text-gray-700 flex gap-2">
                <span className="text-amber-500 shrink-0 mt-0.5">→</span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Checklist result when rubric is attached */}
      {cl && (
        <div>
          <div className="flex items-center gap-3 mb-3">
            <h3 className="text-sm font-semibold text-gray-900">{cl.rubricTitle}</h3>
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${cl.overallPass ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {cl.overallPass ? '✓ Overall Pass' : '✗ Not Yet Passed'} — {cl.sectionsPassed}/{cl.sections.length} sections
            </span>
          </div>
          <div className="space-y-2">
            {cl.sections.map((section, i) => (
              <ChecklistSection key={i} section={section} />
            ))}
          </div>
        </div>
      )}

      {/* Holistic rubric scores when no checklist */}
      {!cl && data.rubric.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Assessment scores</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {data.rubric.map((r, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-800">{r.criterion}</span>
                  <span className={`text-base font-bold ${r.score >= 4 ? 'text-green-600' : r.score >= 3 ? 'text-amber-500' : 'text-red-500'}`}>
                    {r.score}/5
                  </span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">{r.rationale}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.nextTimeTry.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Next time, try…</h3>
          <div className="space-y-3">
            {data.nextTimeTry.map((n, i) => (
              <div key={i} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm font-medium text-blue-800 mb-1.5">{n.goal}</p>
                <ul className="space-y-0.5">
                  {n.exampleSentences.map((e, j) => (
                    <li key={j} className="text-xs text-blue-700 italic">
                      {e}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Reflective questions</h3>
        <ol className="space-y-2">
          {data.reflectiveQuestions.map((q, i) => (
            <li key={i} className="text-sm text-gray-700 flex gap-2">
              <span className="text-nhs-blue shrink-0 font-medium">{i + 1}.</span>
              <span>{q}</span>
            </li>
          ))}
        </ol>
      </div>

      <Link
        href="/"
        className="inline-block bg-nhs-blue text-white px-5 py-2.5 rounded font-semibold text-sm hover:bg-nhs-dark-blue transition-colors"
      >
        ← Return to scenarios
      </Link>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ChatPage() {
  const params = useParams();
  const scenarioId = params.id as string;
  const scenario = getScenarioById(scenarioId);

  const [turns, setTurns] = useState<ConversationTurn[]>([]);
  const [convState, setConvState] = useState<ConversationState>({
    factsDisclosed: [],
    emotion: scenario?.persona.emotionalTone ?? 'calm',
    rapport: 50,
    riskFlags: [],
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [goals, setGoals] = useState<string[]>([]);
  const [safetyFlag, setSafetyFlag] = useState<string | null>(null);
  const [ended, setEnded] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackApiResponse | null>(null);
  const [loadingFeedback, setLoadingFeedback] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const mimeTypeRef = useRef<string>('audio/webm');

  useEffect(() => {
    audioRef.current = new Audio();
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [turns, loading]);

  if (!scenario) {
    return (
      <div className="text-red-600 p-4">
        Scenario not found.{' '}
        <Link href="/" className="underline">
          Return home
        </Link>
      </div>
    );
  }

  // ── Voice output ────────────────────────────────────────────────────────────

  async function playTTS(text: string) {
    if (!voiceEnabled || !audioRef.current) return;
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      audioRef.current.pause();
      audioRef.current.src = url;
      await audioRef.current.play().catch(() => {});
    } catch {
      // Non-fatal — typed response still visible
    }
  }

  // ── Send message ────────────────────────────────────────────────────────────

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading || ended) return;

    const newTurn: ConversationTurn = {
      role: 'student',
      content: trimmed,
      timestamp: Date.now(),
    };
    const allTurns = [...turns, newTurn];

    setTurns(allTurns);
    setInput('');
    setLoading(true);
    setSafetyFlag(null);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioId,
          recentTurns: allTurns
            .slice(-8)
            .map(t => ({ role: t.role, content: t.content })),
          state: convState,
          studentMessage: trimmed,
        }),
      });

      if (!res.ok) throw new Error('Chat request failed');
      const data: ChatApiResponse = await res.json();

      setTurns(prev => [
        ...prev,
        { role: 'patient', content: data.assistantMessage, timestamp: Date.now() },
      ]);
      setConvState(prev => ({
        factsDisclosed: Array.from(
          new Set([...prev.factsDisclosed, ...data.stateUpdate.factsDisclosed]),
        ),
        emotion: data.stateUpdate.emotion,
        rapport: data.stateUpdate.rapport,
        riskFlags: Array.from(
          new Set([...prev.riskFlags, ...data.stateUpdate.riskFlags]),
        ),
      }));
      setGoals(data.suggestedNextGoals);

      if (data.safetyBoundaryTriggered?.triggered) {
        setSafetyFlag(data.safetyBoundaryTriggered.reason);
      }

      playTTS(data.assistantMessage);
    } catch {
      setTurns(prev => [
        ...prev,
        {
          role: 'patient',
          content: 'Sorry... can you say that again? I lost my train of thought.',
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  // ── Voice input ─────────────────────────────────────────────────────────────

  async function toggleRecording() {
    if (recording) {
      mediaRecorderRef.current?.stop();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/ogg')
        ? 'audio/ogg'
        : '';
      mimeTypeRef.current = mimeType || 'audio/webm';

      const mr = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      chunksRef.current = [];

      mr.ondataavailable = e => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        setRecording(false);
        const ext = mimeTypeRef.current === 'audio/ogg' ? 'ogg' : 'webm';
        const blob = new Blob(chunksRef.current, { type: mimeTypeRef.current });
        await transcribeAudio(blob, ext);
      };

      mr.start();
      mediaRecorderRef.current = mr;
      setRecording(true);
    } catch {
      alert(
        'Microphone access is needed for voice input. Please allow it in your browser settings and reload.',
      );
    }
  }

  async function transcribeAudio(blob: Blob, ext: string) {
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append(
        'audio',
        new File([blob], `recording.${ext}`, { type: blob.type }),
        `recording.${ext}`,
      );
      const res = await fetch('/api/stt', { method: 'POST', body: fd });
      if (!res.ok) throw new Error();
      const { transcript } = await res.json();
      if (transcript?.trim()) {
        setInput(transcript.trim());
        inputRef.current?.focus();
      }
    } catch {
      // User can type instead
    } finally {
      setLoading(false);
    }
  }

  // ── End & feedback ──────────────────────────────────────────────────────────

  async function endAndGetFeedback() {
    if (turns.length < 2) return;
    setEnded(true);
    audioRef.current?.pause();
    setLoadingFeedback(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioId,
          transcript: turns.map(t => ({ role: t.role, content: t.content })),
          finalState: convState,
        }),
      });
      if (!res.ok) throw new Error();
      setFeedback(await res.json());
    } catch {
      // Show ended state without feedback
    } finally {
      setLoadingFeedback(false);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto">

      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-t-lg px-4 py-3 flex items-center gap-3">
        <Link
          href={`/scenarios/${scenarioId}`}
          className="text-nhs-blue hover:underline text-sm shrink-0"
        >
          ← Brief
        </Link>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm truncate">{scenario.title}</p>
          <p className="text-xs text-gray-500">
            {scenario.setting} · {scenario.yearLevel}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setVoiceEnabled(v => !v)}
            title={voiceEnabled ? "Mute George's voice" : "Unmute George's voice"}
            className={`p-1.5 rounded transition-colors text-lg ${
              voiceEnabled
                ? 'text-nhs-blue hover:bg-nhs-pale-grey'
                : 'text-gray-400 hover:bg-gray-100'
            }`}
          >
            {voiceEnabled ? '🔊' : '🔇'}
          </button>
          {!ended && turns.length >= 2 && (
            <button
              onClick={endAndGetFeedback}
              className="text-xs bg-nhs-green text-white px-3 py-1.5 rounded font-medium hover:opacity-90 transition-opacity"
            >
              End &amp; Feedback
            </button>
          )}
        </div>
      </div>

      {/* Status bar */}
      <div className="bg-nhs-pale-grey border-x border-gray-200 px-4 py-2 flex items-center gap-4">
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-gray-500">Mood:</span>
          <span className="text-xs font-medium text-gray-800 capitalize">
            {convState.emotion}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <RapportBar value={convState.rapport} />
        </div>
        {convState.riskFlags.length > 0 && (
          <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full shrink-0">
            ⚠ Safeguarding
          </span>
        )}
      </div>

      {/* Chat area */}
      <div
        className="bg-white border-x border-gray-200 px-4 py-4 space-y-3 overflow-y-auto"
        style={{ minHeight: '420px', maxHeight: '55vh' }}
      >
        {turns.length === 0 && (
          <div className="text-center text-gray-400 text-sm py-12">
            <p className="mb-1 font-medium">George is waiting.</p>
            <p>Introduce yourself to begin the consultation.</p>
          </div>
        )}

        {turns.map((t, i) => (
          <div
            key={i}
            className={`flex items-end gap-2 ${t.role === 'student' ? 'justify-end' : 'justify-start'}`}
          >
            {t.role === 'patient' && (
              <div className="relative w-8 h-8 rounded-full overflow-hidden bg-gray-200 shrink-0">
                <Image
                  src={`/patients/${scenarioId}.jpg`}
                  alt={scenario.persona.name}
                  fill
                  className="object-cover object-top"
                />
              </div>
            )}
            <div
              className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                t.role === 'student'
                  ? 'bg-nhs-blue text-white rounded-br-sm'
                  : 'bg-gray-100 text-gray-900 rounded-bl-sm'
              }`}
            >
              {t.role === 'patient' && (
                <p className="text-xs font-semibold text-gray-500 mb-0.5">{scenario.persona.name}</p>
              )}
              {t.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl rounded-bl-sm">
              <TypingDots />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Safety flag */}
      {safetyFlag && (
        <div className="bg-red-50 border-x border-red-200 px-4 py-2 text-xs text-red-700">
          ⚠ {safetyFlag}
        </div>
      )}

      {/* Coaching hints */}
      {goals.length > 0 && !ended && (
        <div className="bg-blue-50 border-x border-gray-200 px-4 py-2.5">
          <p className="text-xs font-medium text-blue-600 mb-1.5">Coaching hints:</p>
          <div className="flex flex-wrap gap-1.5">
            {goals.map((g, i) => (
              <span
                key={i}
                className="text-xs bg-white border border-blue-200 text-blue-700 px-2.5 py-0.5 rounded-full"
              >
                {g}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Input area */}
      {!ended ? (
        <div className="bg-white border border-t-0 border-gray-200 rounded-b-lg px-3 py-3">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(input);
                }
              }}
              placeholder={
                recording
                  ? '🎤 Recording… click the mic again to stop'
                  : 'Type your message — or use the mic to speak  (Enter to send)'
              }
              disabled={loading && !recording}
              rows={2}
              className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nhs-blue disabled:opacity-50 leading-relaxed"
            />
            <div className="flex flex-col gap-1.5 shrink-0">
              <button
                onClick={toggleRecording}
                disabled={loading && !recording}
                title={recording ? 'Stop recording' : 'Start voice input'}
                className={`w-10 h-10 rounded-lg text-lg flex items-center justify-center transition-colors ${
                  recording
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50'
                }`}
              >
                🎤
              </button>
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || loading || recording}
                className="w-10 h-10 rounded-lg bg-nhs-blue text-white text-xs font-bold flex items-center justify-center hover:bg-nhs-dark-blue disabled:opacity-40 transition-colors"
              >
                ↑
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-1.5 pl-0.5">
            Shift+Enter for new line · recording stops when you click mic again
          </p>
        </div>
      ) : (
        <div className="bg-nhs-pale-grey border border-t-0 border-gray-200 rounded-b-lg px-4 py-3 text-sm text-center text-gray-600">
          Simulation ended.
          {loadingFeedback && (
            <span className="ml-2 text-nhs-blue animate-pulse">Generating feedback…</span>
          )}
        </div>
      )}

      {/* Feedback section */}
      {ended && !loadingFeedback && !feedback && (
        <div className="mt-4 text-sm text-gray-500 text-center">
          Feedback unavailable — please review the transcript with a peer or supervisor.
        </div>
      )}
      {feedback && (
        <div className="mt-6 border-t border-gray-200 pt-6">
          <FeedbackDisplay data={feedback} />
        </div>
      )}
    </div>
  );
}
