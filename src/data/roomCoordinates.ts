import { FloorType, Room } from '@/types/map.types';

export const roomCoordinates: Record<FloorType, Room[]> = {
  'rdc': [
    {
      id: 'hall-main',
      label: 'Main Hall',
      x: 280,
      y: 150,
      width: 120,
      height: 80,
      type: 'common',
    },
    {
      id: 'amphi-01',
      label: 'Amphitheater 01',
      x: 450,
      y: 200,
      width: 150,
      height: 120,
      type: 'classroom',
    },
    {
      id: 'library',
      label: 'Library',
      x: 150,
      y: 300,
      width: 200,
      height: 150,
      type: 'resource',
    }
  ],
  '1er': [
    {
      id: 'lab-101',
      label: 'Laboratory 101',
      x: 250,
      y: 180,
      width: 100,
      height: 80,
      type: 'lab',
    },
    {
      id: 'class-101',
      label: 'Classroom 101',
      x: 400,
      y: 220,
      width: 120,
      height: 90,
      type: 'classroom',
    }
  ],
  '2eme': [
    {
      id: 'lab-201',
      label: 'Laboratory 201',
      x: 250,
      y: 200,
      width: 120,
      height: 90,
      type: 'lab',
    },
    {
      id: 'office-201',
      label: 'Office Area 201',
      x: 400,
      y: 200,
      width: 160,
      height: 110,
      type: 'office',
    }
  ],
  '3eme': [
    {
      id: 'lab-301',
      label: 'Laboratory 301',
      x: 250,
      y: 200,
      width: 120,
      height: 90,
      type: 'lab',
    },
    {
      id: 'seminar-301',
      label: 'Seminar Room 301',
      x: 400,
      y: 200,
      width: 130,
      height: 100,
      type: 'classroom',
    }
  ],
  '4eme': [
    {
      id: 'admin-401',
      label: 'Administration 401',
      x: 250,
      y: 200,
      width: 150,
      height: 100,
      type: 'office',
    },
    {
      id: 'meeting-401',
      label: 'Meeting Room 401',
      x: 420,
      y: 200,
      width: 100,
      height: 80,
      type: 'meeting',
    }
  ]
};