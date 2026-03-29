export const CONTEXTS = [
  { id: 'meeting', label: '🏫 组会', color: 'bg-blue-500' },
  { id: 'business', label: '💼 商务', color: 'bg-green-600' },
  { id: 'friend', label: '🍺 朋友', color: 'bg-orange-500' },
] as const;

export type ContextId = (typeof CONTEXTS)[number]['id'];
