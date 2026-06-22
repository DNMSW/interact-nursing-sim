import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getScenarioById } from '@/lib/scenarios';

interface Props {
  params: { id: string };
}

export default function ScenarioBriefPage({ params }: Props) {
  const scenario = getScenarioById(params.id);
  if (!scenario) notFound();

  return (
    <div className="max-w-2xl">
      <Link href="/" className="text-nhs-blue text-sm hover:underline mb-4 inline-block">
        ← All scenarios
      </Link>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h1 className="text-xl font-bold text-nhs-dark-blue mb-2">{scenario.title}</h1>

        <div className="flex flex-wrap gap-2 text-xs text-gray-500 mb-4">
          <span className="bg-nhs-pale-grey px-2 py-0.5 rounded">{scenario.setting}</span>
          <span className="bg-nhs-pale-grey px-2 py-0.5 rounded">{scenario.yearLevel}</span>
          <span className="bg-nhs-pale-grey px-2 py-0.5 rounded">{scenario.speciality}</span>
          <span className="bg-nhs-pale-grey px-2 py-0.5 rounded">{scenario.estimatedDuration}</span>
        </div>

        <p className="text-gray-700 text-sm mb-5">{scenario.description}</p>

        <div className="mb-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-2">Learning objectives</h2>
          <ul className="space-y-1">
            {scenario.learningObjectives.map((obj, i) => (
              <li key={i} className="text-sm text-gray-700 flex gap-2">
                <span className="text-nhs-blue mt-0.5 shrink-0">•</span>
                <span>{obj}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-nhs-pale-grey rounded-lg p-4 mb-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">About this patient</h2>
          <p className="text-sm text-gray-800">
            <strong>{scenario.persona.name}</strong>, {scenario.persona.age} —{' '}
            {scenario.persona.occupation}
          </p>
          <p className="text-sm text-gray-600 mt-1">{scenario.persona.additionalContext}</p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 mb-5">
          <strong>Simulation guidance:</strong> This is a formative practice session. No real
          medical advice is given or received. Aim to communicate as you would in practice — with
          empathy, clarity, and a person-centred focus.
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/scenarios/${scenario.id}/chat`}
            className="inline-block bg-nhs-blue text-white px-6 py-2.5 rounded font-semibold text-sm hover:bg-nhs-dark-blue transition-colors"
          >
            Start Simulation →
          </Link>
          {scenario.ehrUrl && (
            <a
              href={scenario.ehrUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block border border-nhs-blue text-nhs-blue px-4 py-2.5 rounded font-semibold text-sm hover:bg-nhs-pale-grey transition-colors"
            >
              Open EPR Record ↗
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
