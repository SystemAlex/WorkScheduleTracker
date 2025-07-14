export function base(path?: string): string {
  const baseUrl = import.meta.env.BASE_URL;
  const trimmedBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  return `${trimmedBaseUrl}${path}`;
}
