import type { RubricDefinition } from './types';

import nursingAdmission from '../../data/rubrics/nursing-admission-assessment.json';
import sbar from '../../data/rubrics/sbar.json';

const RUBRICS: Record<string, RubricDefinition> = {
  'nursing-admission-assessment': nursingAdmission as RubricDefinition,
  'sbar': sbar as RubricDefinition,
};

export function getRubricById(id: string): RubricDefinition | undefined {
  return RUBRICS[id];
}

export const KNOWN_RUBRIC_IDS = new Set(Object.keys(RUBRICS));
