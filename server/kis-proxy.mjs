import { createServer } from 'node:http';
import { URL } from 'node:url';

const PORT = Number(process.env.KIS_PROXY_PORT ?? 8787);
const APP_KEY = process.env.KIS_APP_KEY ?? '';
const APP_SECRET = process.env.KIS_APP_SECRET ?? '';
const BASE_URL = process.env.KIS_BASE_URL ?? 'https://openapi.koreainvestment.com:9443';
const TOKEN_PATH = process.env.KIS_TOKEN_PATH ?? '/oauth2/tokenP';
const INDEX_PATH = process.env.KIS_INDEX_PATH ?? '/uapi/domestic-stock/v1/quotations/inquire-index-price';
const TR_ID = process.env.KIS_TR_ID ?? 'FHPUP02110000';

const KOSPI_CODE = process.env.KIS_KOSPI_CODE ?? '0001';
const KOSDAQ_CODE = process.env.KIS_KOSDAQ_CODE ?? '1001';

let cachedToken = '';
let tokenExpiresAt = 0;

const sendJson = (res, status, payload) => {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(JSON.stringify(payload));
};

const toNumber = (value) => {
  const num = Number(String(value ?? '').replace(/,/g, ''));
  return Number.isFinite(num) ? num : null;
};

const extractIndex = (json) => {
  const output = json?.output ?? json?.output1 ?? json?.result ?? json;
  const candidates = [
    { value: output?.bstp_nmix_prpr, change: output?.bstp_nmix_prdy_vrss, changePercent: output?.prdy_ctrt },
    { value: output?.stck_prpr, change: output?.prdy_vrss, changePercent: output?.prdy_ctrt },
    { value: output?.value, change: output?.change, changePercent: output?.changePercent },
  ];
  for (const item of candidates) {
    const value = toNumber(item.value);
    const change = toNumber(item.change);
    const changePercent = toNumber(item.changePercent);
    if (value !== null && change !== null && changePercent !== null) {
      return { value, change, changePercent };
    }
  }
  return null;
};

const getAccessToken = async () => {
  const now = Date.now();
  if (cachedToken && now < tokenExpiresAt - 60_000) return cachedToken;
  if (!APP_KEY || !APP_SECRET) {
    throw new Error('KIS_APP_KEY / KIS_APP_SECRET 환경변수가 필요합니다.');
  }

  const response = await fetch(`${BASE_URL}${TOKEN_PATH}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      appkey: APP_KEY,
      appsecret: APP_SECRET,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`토큰 발급 실패: ${response.status} ${text}`);
  }

  const json = await response.json();
  const token = json?.access_token;
  const expiresIn = Number(json?.expires_in ?? 3600);
  if (!token) {
    throw new Error('토큰 응답에 access_token이 없습니다.');
  }

  cachedToken = token;
  tokenExpiresAt = Date.now() + expiresIn * 1000;
  return cachedToken;
};

const fetchIndex = async (market) => {
  const token = await getAccessToken();
  const code = market === 'KOSDAQ' ? KOSDAQ_CODE : KOSPI_CODE;
  const params = new URLSearchParams({
    FID_COND_MRKT_DIV_CODE: 'U',
    FID_INPUT_ISCD: code,
  });

  const response = await fetch(`${BASE_URL}${INDEX_PATH}?${params.toString()}`, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      authorization: `Bearer ${token}`,
      appkey: APP_KEY,
      appsecret: APP_SECRET,
      tr_id: TR_ID,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`지수 조회 실패: ${response.status} ${text}`);
  }

  const json = await response.json();
  const parsed = extractIndex(json);
  if (!parsed) {
    throw new Error(`지수 응답 파싱 실패: ${JSON.stringify(json).slice(0, 300)}`);
  }
  return parsed;
};

const server = createServer(async (req, res) => {
  if (!req.url) return sendJson(res, 400, { error: 'bad request' });
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    return res.end();
  }

  if (url.pathname === '/health') {
    return sendJson(res, 200, { ok: true, now: new Date().toISOString() });
  }

  if (url.pathname === '/kis/index' && req.method === 'GET') {
    const market = url.searchParams.get('market') === 'KOSDAQ' ? 'KOSDAQ' : 'KOSPI';
    try {
      const data = await fetchIndex(market);
      return sendJson(res, 200, data);
    } catch (error) {
      return sendJson(res, 502, {
        error: error instanceof Error ? error.message : 'upstream error',
        hint: 'KIS_* 환경변수와 TR_ID/ISCD 코드를 확인하세요.',
      });
    }
  }

  return sendJson(res, 404, { error: 'not found' });
});

server.listen(PORT, () => {
  console.log(`[kis-proxy] listening on http://127.0.0.1:${PORT}`);
});
