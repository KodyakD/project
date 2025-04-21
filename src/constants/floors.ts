import { FloorType } from '@/types/map.types';

export const FLOORS = [
  { id: 'rdc', label: 'RDC', fullName: 'Ground Floor' },
  { id: '1er', label: '1er', fullName: 'First Floor' },
  { id: '2eme', label: '2ème', fullName: 'Second Floor' },
  { id: '3eme', label: '3ème', fullName: 'Third Floor' },
  { id: '4eme', label: '4ème', fullName: 'Fourth Floor' },
];

export const DEFAULT_FLOOR: FloorType = 'rdc';