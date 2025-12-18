
export interface PaverModel {
  id: string;
  name: string;
  length: number; // in cm
  width: number;  // in cm
  thickness: number; // in cm
  paversPerM2: number;
}

export interface CalculationResult {
  id: string;
  timestamp: number;
  area: number;
  model: PaverModel;
  margin: number;
  totalPavers: number;
  totalValue: number;
  unitPrice: number;
}

export enum AppTab {
  CALCULATOR = 'calculator',
  HISTORY = 'history',
  SETTINGS = 'settings'
}
