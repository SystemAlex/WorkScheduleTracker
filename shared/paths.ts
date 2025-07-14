export function base(path?: string): string {
  let baseUrl = '';
  try {
    // In Vite, import.meta.env.BASE_URL reflects the `base` config option.
    // It will be '/vipsrl/' in production and '/' in development.
    baseUrl = import.meta.env.BASE_URL;
  } catch {
    // Fallback for Node.js environment (e.g., server-side code using shared/paths)
    // In Node.js, process.env.NODE_ENV is used.
    baseUrl = process.env.NODE_ENV === 'production' ? '/vipsrl/' : '/';
  }

  // Remove trailing slash from baseUrl if present, as our backend routes don't expect it in the prefix.
  // Example: /vipsrl/api/auth/login, not /vipsrl//api/auth/login
  const trimmedBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

  return `${trimmedBaseUrl}${path}`;
}
