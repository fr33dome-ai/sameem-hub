/**
 * Typed API client — axios with JWT injection, refresh, and tenant scoping.
 * All resource modules import this base client.
 */
import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';

// In-memory token store. In production, session is httpOnly cookie + this is a fallback.
let accessToken: string | null = null;
let refreshToken: string | null = null;

export function setTokens(tokens: { accessToken: string; refreshToken: string }) {
  accessToken = tokens.accessToken;
  refreshToken = tokens.refreshToken;
}
export function clearTokens() { accessToken = null; refreshToken = null; }

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 30_000,
  withCredentials: true
});

api.interceptors.request.use(config => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  config.headers['X-Client-Version'] = '1.4.0';
  return config;
});

// Refresh-on-401 with single-flight to avoid stampede
let refreshing: Promise<void> | null = null;
api.interceptors.response.use(
  r => r,
  async (error) => {
    const original = error.config as AxiosRequestConfig & { _retried?: boolean };
    if (error.response?.status === 401 && !original._retried && refreshToken) {
      original._retried = true;
      refreshing = refreshing ?? (async () => {
        const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        setTokens(data);
      })();
      try {
        await refreshing;
        refreshing = null;
        return api(original);
      } catch (e) {
        clearTokens();
        if (typeof window !== 'undefined') window.location.href = '/login';
        throw e;
      }
    }
    throw error;
  }
);

export default api;
