// Enhancement history utility for localStorage

export interface EnhancementHistoryEntry {
  timestamp: string; // ISO string
  user: { id: string; name: string; email: string; role: string };
  productId: string | number;
  productCode: string;
  field: string;
  before: string;
  after: string;
}

const STORAGE_KEY = 'enhancementHistory';

export function logEnhancement(entry: EnhancementHistoryEntry) {
  const history = getEnhancementHistory();
  history.push(entry);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

export function getEnhancementHistory(): EnhancementHistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function getProductFieldHistory(productId: string | number, field: string): EnhancementHistoryEntry[] {
  return getEnhancementHistory().filter(
    (entry) => entry.productId === productId && entry.field === field
  );
}

export function clearEnhancementHistory() {
  localStorage.removeItem(STORAGE_KEY);
} 