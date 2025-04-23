export interface SafetyTip {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  category: 'fire' | 'emergency' | 'first_aid' | 'evacuation' | 'prevention';
  priority: 'high' | 'medium' | 'low';
}

const safetyTips: SafetyTip[] = [
  {
    id: 'fire-1',
    title: 'Stop, Drop & Roll',
    content: 'If your clothes catch fire, stop immediately, drop to the ground, and roll to extinguish the flames.',
    category: 'fire',
    priority: 'high',
  },
  {
    id: 'fire-2',
    title: 'Test Smoke Alarms',
    content: 'Test smoke alarms monthly and replace batteries annually to ensure they work when needed.',
    category: 'prevention',
    priority: 'medium',
  },
  {
    id: 'emergency-1',
    title: 'Know Your Exits',
    content: 'Always be aware of the nearest exits in any building you enter.',
    category: 'evacuation',
    priority: 'high',
  },
  {
    id: 'emergency-2',
    title: 'Emergency Contact',
    content: 'Keep emergency contact information readily available, including campus security at 555-1234.',
    category: 'emergency',
    priority: 'high',
  },
  {
    id: 'first-aid-1',
    title: 'Treating Burns',
    content: 'For minor burns, cool the area with cold running water for 10-15 minutes. Do not use ice directly on burns.',
    category: 'first_aid',
    priority: 'medium',
  },
  {
    id: 'evacuation-1',
    title: 'Use Stairs, Not Elevators',
    content: 'During fire evacuations, always use stairs instead of elevators, which may malfunction or become traps.',
    category: 'evacuation',
    priority: 'high',
  },
  {
    id: 'prevention-1',
    title: 'Keep Pathways Clear',
    content: 'Maintain clear pathways and exits in all areas. Blocked exits can prevent escape during emergencies.',
    category: 'prevention',
    priority: 'medium',
  },
  {
    id: 'first-aid-2',
    title: 'CPR Basics',
    content: 'For unresponsive victims: Check, Call, Compress. Push hard and fast in the center of the chest.',
    category: 'first_aid',
    priority: 'high',
  },
  {
    id: 'fire-3',
    title: 'Fire Extinguisher Use',
    content: 'Remember PASS: Pull the pin, Aim at the base, Squeeze the handle, Sweep side to side.',
    category: 'fire',
    priority: 'high',
  },
  {
    id: 'evacuation-2',
    title: 'Assembly Points',
    content: "Know your building's designated assembly points and proceed there immediately during evacuations.",
    category: 'evacuation',
    priority: 'medium',
  },
];

export const getRandomSafetyTips = (count: number = 5): SafetyTip[] => {
  // Prioritize high priority tips
  const highPriorityTips = safetyTips.filter(tip => tip.priority === 'high');
  const otherTips = safetyTips.filter(tip => tip.priority !== 'high');
  
  // Shuffle the arrays
  const shuffledHigh = [...highPriorityTips].sort(() => Math.random() - 0.5);
  const shuffledOther = [...otherTips].sort(() => Math.random() - 0.5);
  
  // Select 60% high priority, 40% other, up to the requested count
  const highCount = Math.min(Math.ceil(count * 0.6), shuffledHigh.length);
  const otherCount = Math.min(count - highCount, shuffledOther.length);
  
  return [
    ...shuffledHigh.slice(0, highCount),
    ...shuffledOther.slice(0, otherCount)
  ].sort(() => Math.random() - 0.5).slice(0, count);
};

export const getSafetyTipsByCategory = (category: SafetyTip['category']): SafetyTip[] => {
  return safetyTips.filter(tip => tip.category === category);
};

export default safetyTips;