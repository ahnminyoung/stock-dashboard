/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FINNHUB_API_KEY?: string;
  readonly VITE_ALPHA_VANTAGE_API_KEY?: string;
  readonly VITE_KIS_PROXY_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
