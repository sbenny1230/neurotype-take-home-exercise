const DEFAULT_API_URL = 'http://localhost:8000'

export default function getApiUrl(): string {
  return import.meta.env.VITE_API_URL ?? DEFAULT_API_URL
}
