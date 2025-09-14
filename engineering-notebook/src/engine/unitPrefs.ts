export type UnitPrefs = {
  lengthBase: 'in' | 'ft' | 'mm' | 'm';
  forceBase: 'lb' | 'kip' | 'N' | 'kN';
  timeBase: 's';
  stressScale: 'psi/ksi' | 'Pa/kPa/MPa';
};

let prefs: UnitPrefs = {
  lengthBase: 'in',
  forceBase: 'lb',
  timeBase: 's',
  stressScale: 'psi/ksi',
};

const listeners = new Set<() => void>();

export function getUnitPrefs(): UnitPrefs {
  return prefs;
}

export function setUnitPrefs(next: Partial<UnitPrefs>) {
  prefs = { ...prefs, ...next };
  listeners.forEach((l) => l());
}

export function setSystem(key: 'imperial_in' | 'imperial_ft' | 'metric_mm' | 'metric_m') {
  if (key === 'imperial_in') setUnitPrefs({ lengthBase: 'in', forceBase: 'lb', stressScale: 'psi/ksi' });
  else if (key === 'imperial_ft') setUnitPrefs({ lengthBase: 'ft', forceBase: 'lb', stressScale: 'psi/ksi' });
  else if (key === 'metric_mm') setUnitPrefs({ lengthBase: 'mm', forceBase: 'N', stressScale: 'Pa/kPa/MPa' });
  else if (key === 'metric_m') setUnitPrefs({ lengthBase: 'm', forceBase: 'N', stressScale: 'Pa/kPa/MPa' });
}

export function subscribeUnitPrefs(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
} 