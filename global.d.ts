/* DOM globals - some TS configs don't resolve them */
interface Storage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}
declare var window:
  | { localStorage: Storage; devicePixelRatio: number; innerWidth: number; [key: string]: unknown }
  | undefined;
