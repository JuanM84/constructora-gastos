const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:3005';
const cleanUrl = rawUrl.replace(/\/+$/, '');
export const API_BASE = cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
