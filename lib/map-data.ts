// District name variations for normalization
const NORMALIZE: Record<string, string> = {
  "mocimboa da praia": "Mocímboa da Praia",
  "mocimboa": "Mocímboa da Praia",
  "gurue": "Gurúè",
  "ribaue": "Ribáuè",
  "cahora bassa": "Cahora-Bassa",
  "cahora-bassa": "Cahora-Bassa",
  "alto molocue": "Alto Molócuè",
  "alto molócuè": "Alto Molócuè",
  "mecuburi": "Mecubúri",
  "ilha de mocambique": "Ilha de Moçambique",
  "ilha de moçambique": "Ilha de Moçambique",
  "nacala-porto": "Nacala",
  "mocuba": "Mocuba",
  "marrumeu": "Marrumeu",
  "magoé": "Mágoe",
  "mágoe": "Mágoe",
  "massingir": "Massingir",
  "massinga": "Massinga",
};

export function normalizeDistrict(name: string): string {
  const key = name.trim().toLowerCase();
  return NORMALIZE[key] || name.trim();
}

// Coordinates for Mozambique districts
export const DISTRICT_COORDS: Record<string, [number, number]> = {
  "Beira": [-19.8333, 34.8333], "Mueda": [-11.6667, 39.5], "Montepuez": [-13.1167, 39.0],
  "Pemba": [-12.9667, 40.5], "Nampula": [-15.1167, 39.2667], "Quelimane": [-17.8667, 36.8833],
  "Tete": [-16.1667, 33.5833], "Lichinga": [-13.3167, 35.2333], "Chimoio": [-19.1167, 33.4833],
  "Xai-Xai": [-25.05, 33.65], "Inhambane": [-23.8667, 35.3833], "Maputo": [-25.9667, 32.5833],
  "Mocímboa da Praia": [-11.35, 40.3333], "Dondo": [-19.6167, 34.75], "Gorongosa": [-18.6667, 34.0833],
  "Nhamatanda": [-19.2667, 34.2167], "Gondola": [-18.9833, 33.65], "Manica": [-18.9333, 32.8833],
  "Chiúre": [-12.0, 39.8833], "Macomia": [-12.2333, 40.1167], "Balama": [-13.35, 38.5667],
  "Palma": [-10.7833, 40.4667], "Cuamba": [-14.8, 36.55], "Moatize": [-16.1, 33.7167],
  "Angoche": [-16.2333, 39.9167], "Mocuba": [-16.85, 36.9833], "Gurúè": [-15.45, 36.9833],
  "Malema": [-14.95, 37.1], "Changara": [-16.6, 33.0], "Zumbo": [-15.6167, 31.6667],
  "Milange": [-16.1, 35.3], "Ribáuè": [-14.95, 38.3167], "Mágoe": [-15.3833, 32.75],
  "Cahora-Bassa": [-15.5833, 32.6833], "Alto Molócuè": [-15.65, 37.6833],
  "Moma": [-16.75, 39.2167], "Mogovolas": [-15.7333, 39.3667], "Mecubúri": [-14.8333, 39.8],
  "Memba": [-14.1667, 40.55], "Eráti": [-14.6833, 40.55], "Nacala": [-14.55, 40.6833],
  "Nacarôa": [-14.4, 40.35], "Rapale": [-14.55, 36.9167], "Mecula": [-12.1, 37.6667],
  "Mavago": [-11.9667, 37.75], "Sanga": [-13.3, 35.7333], "Muembe": [-13.0167, 36.9833],
  "Macanga": [-14.85, 33.5], "Maravia": [-14.9, 32.1333], "Chiuta": [-14.7667, 33.4333],
  "Mecanhelas": [-14.7337, 35.6667], "Mandimba": [-14.3667, 35.7833],
  "Mossuril": [-15.1, 40.0667], "Ilha de Moçambique": [-15.0333, 40.7333],
};

// Get coordinate for a district, with normalization
export function getCoord(name: string): [number, number] | null {
  const normalized = normalizeDistrict(name);
  return DISTRICT_COORDS[normalized] || null;
}

// Report which districts don't have coordinates
export function findUnmapped(allDistricts: string[]): string[] {
  return allDistricts.filter(d => !getCoord(d));
}
