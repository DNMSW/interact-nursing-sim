import type { Scenario } from './types';

import s01 from '../../data/scenarios/01-chest-pain-ed.json';
import s02 from '../../data/scenarios/02-post-op-confusion-ward.json';
import s03 from '../../data/scenarios/03-insulin-refusal-ward.json';
import s04 from '../../data/scenarios/04-breaking-bad-news-relative.json';
import s05 from '../../data/scenarios/05-angry-relative-ed.json';
import s06 from '../../data/scenarios/06-mental-health-community.json';
import s07 from '../../data/scenarios/07-george-ashworth-glaucoma.json';

const SCENARIOS: Scenario[] = [s01, s02, s03, s04, s05, s06, s07] as Scenario[];

export function getAllScenarios(): Scenario[] {
  return SCENARIOS;
}

export function getScenarioById(id: string): Scenario | undefined {
  return SCENARIOS.find((s) => s.id === id);
}

export const KNOWN_SCENARIO_IDS = new Set(SCENARIOS.map((s) => s.id));
