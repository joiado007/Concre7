
import { PaverModel } from './types';

export const PAVER_MODELS: PaverModel[] = [
  {
    id: '16-faces',
    name: 'Paver 16 Faces',
    length: 24,
    width: 10,
    thickness: 6,
    paversPerM2: 42,
  },
  {
    id: 'tijolinho',
    name: 'Paver Tijolinho',
    length: 20,
    width: 10,
    thickness: 6,
    paversPerM2: 50,
  }
];

export const DEFAULT_UNIT_PRICE = 1.10;
export const DEFAULT_MARGIN = 5;
