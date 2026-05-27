import Link from 'next/link';
import Image from 'next/image';
import { getAllScenarios } from '@/lib/scenarios';

const LEVEL_COLOUR: Record<string, string> = {
  'Year 1': 'bg-green-100 text-green-800',
  'Year 2': 'bg-blue-100 text-blue-800',
  'Year 3': 'bg-purple-100 text-purple-800',
  'Year 2–3': 'bg-blue-100 text-blue-800',
};

export default function HomePage() {
  const scenarios = getAllScenarios();

  return (
    <div>
      <h1 className="text-2xl font-bold text-nhs-dark-blue mb-1">Simulation Scenarios</h1>
      <p className="text-gray-500 text-sm mb-6">
        Select a scenario to begin a formative communication practice session.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {scenarios.map(s => (
          <Link
            key={s.id}
            href={`/scenarios/${s.id}`}
            className="block bg-white rounded-lg border border-gray-200 hover:border-nhs-blue hover:shadow-sm transition-all overflow-hidden"
          >
            <div className="relative h-40 bg-nhs-pale-grey">
              <Image
                src={`/patients/${s.id}.jpg`}
                alt={s.persona.name}
                fill
                className="object-cover object-top"
                onError={() => {}}
              />
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h2 className="font-semibold text-gray-900 text-sm leading-snug flex-1">{s.title}</h2>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 ${LEVEL_COLOUR[s.yearLevel] ?? 'bg-gray-100 text-gray-600'}`}
                >
                  {s.yearLevel}
                </span>
              </div>
              <p className="text-xs text-gray-500 mb-2">{s.persona.name}, {s.persona.age}</p>
              <p className="text-xs text-gray-500 mb-3 line-clamp-2">{s.description}</p>
              <div className="flex flex-wrap gap-1">
                <span className="text-xs bg-nhs-pale-grey text-gray-600 px-2 py-0.5 rounded">
                  {s.setting}
                </span>
                <span className="text-xs bg-nhs-pale-grey text-gray-600 px-2 py-0.5 rounded">
                  {s.estimatedDuration}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
