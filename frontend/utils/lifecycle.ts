import type { Cattle } from '../data/farmDatabase';

export type LifeCyclePhase = 'birth' | 'calf' | 'young' | 'adult' | 'pregnant';

export const LIFE_CYCLE_STEPS: Array<{
  id: LifeCyclePhase;
  title: string;
  subtitle: string;
  emoji: string;
  description: string;
}> = [
  {
    id: 'birth',
    title: 'Birth (Calf)',
    subtitle: 'Newborn',
    emoji: '🐮',
    description: 'Calves in their first month after birth.',
  },
  {
    id: 'calf',
    title: 'Calf',
    subtitle: 'Baby cow',
    emoji: '🐄',
    description: 'Young calves growing before weaning.',
  },
  {
    id: 'young',
    title: 'Young Cow',
    subtitle: 'Weaner / Heifer',
    emoji: '🐂',
    description: 'Weaned stock and heifers before first calving.',
  },
  {
    id: 'adult',
    title: 'Adult Cow',
    subtitle: 'Mature animal',
    emoji: '🐃',
    description: 'Mature cows, bulls, and steers in production.',
  },
  {
    id: 'pregnant',
    title: 'Mother Cow',
    subtitle: 'Pregnant',
    emoji: '🤰',
    description: 'Confirmed pregnant females awaiting calving.',
  },
];

export type LifeCycleColors = {
  header: string;
  headerLight: string;
  border: string;
  accent: string;
  soft: string;
  count: string;
};

export const LIFE_CYCLE_COLORS: Record<LifeCyclePhase, LifeCycleColors> = {
  birth: {
    header: '#EC4899',
    headerLight: '#FDF2F8',
    border: '#F9A8D4',
    accent: '#BE185D',
    soft: '#FCE7F3',
    count: '#DB2777',
  },
  calf: {
    header: '#3B82F6',
    headerLight: '#EFF6FF',
    border: '#93C5FD',
    accent: '#1D4ED8',
    soft: '#DBEAFE',
    count: '#2563EB',
  },
  young: {
    header: '#10B981',
    headerLight: '#ECFDF5',
    border: '#6EE7B7',
    accent: '#047857',
    soft: '#D1FAE5',
    count: '#059669',
  },
  adult: {
    header: '#008B8B',
    headerLight: '#E0F7F7',
    border: '#5EEAD4',
    accent: '#0F766E',
    soft: '#CCFBF1',
    count: '#0D9488',
  },
  pregnant: {
    header: '#E6B86F',
    headerLight: '#FFF9EE',
    border: '#FCD34D',
    accent: '#B45309',
    soft: '#FEF3C7',
    count: '#D97706',
  },
};

export function getLifeCycleColors(phase: LifeCyclePhase): LifeCycleColors {
  return LIFE_CYCLE_COLORS[phase];
}

export function stageOptionsForGender(gender: string): string[] {
  if (gender.trim().toLowerCase() === 'female') {
    return ['Calf', 'Weaner', 'Heifer', 'Cow'];
  }
  return ['Calf', 'Weaner', 'Steer', 'Bull'];
}

export function ageInMonths(dateOfBirth: string, reference = new Date()): number | null {
  if (!dateOfBirth?.trim()) {
    return null;
  }
  const birth = new Date(`${dateOfBirth.trim()}T00:00:00`);
  if (Number.isNaN(birth.getTime())) {
    return null;
  }
  let months = (reference.getFullYear() - birth.getFullYear()) * 12 + (reference.getMonth() - birth.getMonth());
  if (reference.getDate() < birth.getDate()) {
    months -= 1;
  }
  return Math.max(0, months);
}

export function resolveLifeCyclePhase(animal: Cattle): LifeCyclePhase {
  const reproductiveStatus = animal.reproductiveStatus.trim().toLowerCase();
  if (reproductiveStatus === 'pregnant' && animal.gender.trim().toLowerCase() === 'female') {
    return 'pregnant';
  }

  const stage = animal.stage.trim().toLowerCase();
  const months = ageInMonths(animal.dateOfBirth);

  if (stage === 'calf') {
    if (months !== null && months < 1) {
      return 'birth';
    }
    return 'calf';
  }

  if (stage === 'weaner' || stage === 'heifer') {
    return 'young';
  }

  return 'adult';
}

export function lifeCycleLabel(phase: LifeCyclePhase): string {
  return LIFE_CYCLE_STEPS.find((step) => step.id === phase)?.title ?? phase;
}

export function groupCattleByLifeCycle(herd: Cattle[]): Record<LifeCyclePhase, Cattle[]> {
  const groups: Record<LifeCyclePhase, Cattle[]> = {
    birth: [],
    calf: [],
    young: [],
    adult: [],
    pregnant: [],
  };

  for (const animal of herd) {
    if (['dead', 'sold', 'culled', 'inactive'].includes(animal.status.trim().toLowerCase())) {
      continue;
    }
    groups[resolveLifeCyclePhase(animal)].push(animal);
  }

  return groups;
}

export function suggestedStageLabel(animal: Cattle): string | null {
  const months = ageInMonths(animal.dateOfBirth);
  if (months === null) {
    return null;
  }
  if (animal.parity >= 1) {
    return animal.gender.toLowerCase() === 'female' ? 'Cow' : null;
  }
  if (animal.gender.toLowerCase() === 'female') {
    if (months >= 12) {
      return 'Heifer';
    }
    if (months >= 6) {
      return 'Weaner';
    }
    return 'Calf';
  }
  if (months >= 6) {
    return 'Weaner';
  }
  return 'Calf';
}
