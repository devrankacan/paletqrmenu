const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

export function apiUrl(path: string) {
  return `${BASE}${path}`;
}
