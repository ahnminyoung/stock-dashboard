import { createServer } from 'node:http';
import { URL } from 'node:url';

const PORT = Number(process.env.KIS_PROXY_PORT ?? 8787);

// KIS 설정 (선택)
const KIS_APP_KEY    = process.env.KIS_APP_KEY ?? '';
const KIS_APP_SECRET = process.env.KIS_APP_SECRET ?? '';
const KIS_BASE_URL   = process.env.KIS_BASE_URL ?? 'https://openapi.koreainvestment.com:9443';
const KIS_TOKEN_PATH = process.env.KIS_TOKEN_PATH ?? '/oauth2/tokenP';
const KIS_INDEX_PATH = process.env.KIS_INDEX_PATH ?? '/uapi/domestic-stock/v1/quotations/inquire-index-price';
const KIS_TR_ID      = process.env.KIS_TR_ID ?? 'FHPUP02110000';
const KIS_KOSPI_CODE = process.env.KIS_KOSPI_CODE ?? '0001';
const KIS_KOSDAQ_CODE= process.env.KIS_KOSDAQ_CODE ?? '1001';

let kisToken = '';
let kisTokenExp = 0;

// ─── 유틸 ────────────────────────────────────────────────────────────────────

const sendJson = (res, status, payload) => {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(JSON.stringify(payload));
};

const toNum = (s) => {
  const n = Number(String(s ?? '').replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
};

// ─── Yahoo Finance v8 API (무료, API키 불필요) ────────────────────────────────
// 프론트에서 전달하는 심볼 → Yahoo Finance 심볼 매핑
const YF_SYM_MAP = {
  '^SPX':    '^GSPC',
  '^NDX':    '^NDX',
  '^DJI':    '^DJI',
  'USDKRW':  'KRW=X',
  'AAPL.US': 'AAPL',
  'MSFT.US': 'MSFT',
  'NVDA.US': 'NVDA',
  'GOOGL.US':'GOOGL',
  'AMZN.US': 'AMZN',
  'TSLA.US': 'TSLA',
};

const YF_CACHE_TTL = 30_000;
const yfCache = new Map();

const fetchYfQuote = async (displaySymbol) => {
  const cached = yfCache.get(displaySymbol);
  if (cached && Date.now() < cached.expiresAt) return cached.data;

  const yfSym = YF_SYM_MAP[displaySymbol] ?? displaySymbol;
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yfSym)}?range=1d&interval=1d`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const meta = json?.chart?.result?.[0]?.meta;
    if (!meta) return null;

    const price = meta.regularMarketPrice ?? meta.previousClose;
    if (!price) return null;
    const prevClose = meta.chartPreviousClose ?? meta.previousClose ?? price;
    const change = price - prevClose;
    const changePercent = prevClose !== 0 ? (change / prevClose) * 100 : 0;

    const data = { symbol: displaySymbol, price, change, changePercent, timestamp: meta.regularMarketTime ?? 0 };
    yfCache.set(displaySymbol, { data, expiresAt: Date.now() + YF_CACHE_TTL });
    return data;
  } catch {
    return null;
  }
};

const fetchYfBatch = async (symbols) => {
  const entries = await Promise.all(symbols.map(async (s) => [s, await fetchYfQuote(s)]));
  return Object.fromEntries(entries);
};

// 기간 수익률 계산 (Yahoo Finance 히스토리컬)
// tradingDays: 5 | 20 | 60
const periodReturnCache = new Map();
const PERIOD_CACHE_TTL = 5 * 60_000; // 5분

const toTradingDays = (period) => {
  if (period === '60D') return 60;
  if (period === '20D') return 20;
  if (period === '5D') return 5;
  return 1;
};

const fetchPeriodReturn = async (yahooSymbol, tradingDays) => {
  const cacheKey = `${yahooSymbol}:${tradingDays}`;
  const cached = periodReturnCache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) return cached.data;

  const range = tradingDays <= 5 ? '1mo' : tradingDays <= 20 ? '3mo' : '6mo';
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?range=${range}&interval=1d`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const closes = (json?.chart?.result?.[0]?.indicators?.quote?.[0]?.close ?? []).filter((v) => v != null);
    if (closes.length < tradingDays + 1) return null;
    const current = closes[closes.length - 1];
    const past    = closes[closes.length - 1 - tradingDays];
    if (!current || !past) return null;
    const pct = ((current - past) / past) * 100;
    const data = Math.round(pct * 100) / 100;
    periodReturnCache.set(cacheKey, { data, expiresAt: Date.now() + PERIOD_CACHE_TTL });
    return data;
  } catch {
    return null;
  }
};

// 국내 종목 → Yahoo Finance 심볼 (KOSPI: .KS, KOSDAQ: .KQ)
const KR_YAHOO_SYM = {
  '005930': '005930.KS', '000660': '000660.KS', '042700': '042700.KQ',
  '006400': '006400.KS', '373220': '373220.KS', '247540': '247540.KQ',
  '035420': '035420.KS', '035720': '035720.KS', '036570': '036570.KS',
  '005380': '005380.KS', '000270': '000270.KS', '012330': '012330.KS',
  '352820': '352820.KS', '041510': '041510.KS', '122870': '122870.KQ',
  '090430': '090430.KS', '051900': '051900.KS', '002790': '002790.KS',
};

// ─── 네이버 금융 API ──────────────────────────────────────────────────────────

const NAVER_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

const fetchNaverIndex = async (market) => {
  const url = `https://m.stock.naver.com/api/index/${market}/basic`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': NAVER_UA, Referer: 'https://m.stock.naver.com/' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const price = toNum(json?.closePrice);
    if (price === null) return null;
    return {
      symbol: market,
      price,
      change: toNum(json?.compareToPreviousClosePrice) ?? 0,
      changePercent: toNum(json?.fluctuationsRatio) ?? 0,
    };
  } catch { return null; }
};

const fetchNaverStock = async (ticker) => {
  const url = `https://m.stock.naver.com/api/stock/${ticker}/basic`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': NAVER_UA, Referer: 'https://m.stock.naver.com/' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const price = toNum(json?.closePrice);
    if (price === null) return null;
    return {
      symbol: ticker,
      name: json?.stockName ?? ticker,
      price,
      change: toNum(json?.compareToPreviousClosePrice) ?? 0,
      changePercent: toNum(json?.fluctuationsRatio) ?? 0,
    };
  } catch { return null; }
};

// ─── 섹터 데이터 ────────────────────────────────────────────────────────────────

// 국내 섹터별 대표 종목 (ticker → 종목명)
const KR_SECTOR_MAP = {
  '반도체':    { tickers: ['005930', '000660', '042700'], leaders: ['삼성전자', 'SK하이닉스', '한미반도체'] },
  '2차전지':   { tickers: ['006400', '373220', '247540'], leaders: ['삼성SDI', 'LG에너지솔루션', '에코프로비엠'] },
  'AI/클라우드':{ tickers: ['035420', '035720', '036570'], leaders: ['네이버', '카카오', 'NC소프트'] },
  '자동차':    { tickers: ['005380', '000270', '012330'], leaders: ['현대차', '기아', '현대모비스'] },
  '엔터':      { tickers: ['352820', '041510', '122870'], leaders: ['하이브', 'SM', '와이지엔터'] },
  '화장품':    { tickers: ['090430', '051900', '002790'], leaders: ['아모레퍼시픽', 'LG생활건강', '아모레G'] },
};

// 해외 섹터 (Yahoo Finance 심볼)
const US_SECTOR_MAP = {
  '기술주':    { tickers: ['AAPL', 'MSFT', 'GOOGL'], leaders: ['AAPL', 'MSFT', 'GOOGL'] },
  '반도체':    { tickers: ['NVDA', 'AMD', 'QCOM'],   leaders: ['NVDA', 'AMD', 'QCOM'] },
  'AI/클라우드':{ tickers: ['MSFT', 'NVDA', 'META'], leaders: ['MSFT', 'NVDA', 'META'] },
  '전기차':    { tickers: ['TSLA', 'RIVN'],           leaders: ['TSLA', 'RIVN'] },
  '헬스케어':  { tickers: ['JNJ', 'PFE', 'UNH'],     leaders: ['JNJ', 'PFE', 'UNH'] },
  '금융':      { tickers: ['JPM', 'BAC', 'GS'],      leaders: ['JPM', 'BAC', 'GS'] },
};

// ─── 국내 랭킹 종목 풀 ────────────────────────────────────────────────────────

// 급등 탭: 전체 풀에서 등락률 상위 정렬
const RANKING_POOL = [
  '005930', '000660', '042700', '006400', '373220', '247540',
  '035420', '035720', '005380', '000270', '352820', '041510',
  '090430', '051900', '068270', '207940', '036570', '003670',
  '000100', '012330',
];

// 대금 탭: 시총 상위 (실제 거래대금 대신 대형주 순서로 근사)
const CAP_ORDER = ['005930', '000660', '373220', '207940', '068270', '005380', '006400', '035420'];

// 조회수 탭: 인기/성장주
const POPULAR_ORDER = ['035420', '035720', '000660', '005930', '352820', '042700', '373220', '247540'];

// ─── KIS (선택적 fallback) ───────────────────────────────────────────────────

const getKisToken = async () => {
  if (kisToken && Date.now() < kisTokenExp - 60_000) return kisToken;
  if (!KIS_APP_KEY || !KIS_APP_SECRET) throw new Error('KIS 키 없음');
  const res = await fetch(`${KIS_BASE_URL}${KIS_TOKEN_PATH}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ grant_type: 'client_credentials', appkey: KIS_APP_KEY, appsecret: KIS_APP_SECRET }),
  });
  if (!res.ok) throw new Error(`KIS 토큰 실패: ${res.status}`);
  const json = await res.json();
  kisToken = json?.access_token;
  kisTokenExp = Date.now() + Number(json?.expires_in ?? 3600) * 1000;
  return kisToken;
};

const fetchKisIndex = async (market) => {
  const token = await getKisToken();
  const code = market === 'KOSDAQ' ? KIS_KOSDAQ_CODE : KIS_KOSPI_CODE;
  const params = new URLSearchParams({ FID_COND_MRKT_DIV_CODE: 'U', FID_INPUT_ISCD: code });
  const res = await fetch(`${KIS_BASE_URL}${KIS_INDEX_PATH}?${params}`, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      authorization: `Bearer ${token}`,
      appkey: KIS_APP_KEY,
      appsecret: KIS_APP_SECRET,
      tr_id: KIS_TR_ID,
    },
  });
  if (!res.ok) throw new Error(`KIS 지수 실패: ${res.status}`);
  const json = await res.json();
  const out = json?.output ?? json?.output1 ?? json;
  const price = toNum(out?.bstp_nmix_prpr ?? out?.stck_prpr);
  if (price === null) throw new Error('KIS 파싱 실패');
  return {
    price,
    change: toNum(out?.bstp_nmix_prdy_vrss ?? out?.prdy_vrss) ?? 0,
    changePercent: toNum(out?.prdy_ctrt) ?? 0,
  };
};

// ─── HTTP Server ─────────────────────────────────────────────────────────────

const server = createServer(async (req, res) => {
  if (!req.url) return sendJson(res, 400, { error: 'bad request' });
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    return res.end();
  }

  if (url.pathname === '/health') {
    return sendJson(res, 200, { ok: true, now: new Date().toISOString() });
  }

  // Yahoo Finance API 해외 주식/지수 다중 조회
  // GET /yahoo/quote?symbols=^SPX,^NDX,AAPL.US,...
  if (url.pathname === '/yahoo/quote' && req.method === 'GET') {
    const param = url.searchParams.get('symbols') ?? '';
    if (!param) return sendJson(res, 400, { error: 'symbols required' });
    const symbols = param.split(',').map((s) => s.trim()).filter(Boolean);
    try {
      const quoteMap = await fetchYfBatch(symbols);
      return sendJson(res, 200, { quoteMap });
    } catch (e) {
      return sendJson(res, 502, { error: String(e) });
    }
  }

  // 네이버 금융 국내 지수
  // GET /naver/index?market=KOSPI|KOSDAQ
  if (url.pathname === '/naver/index' && req.method === 'GET') {
    const market = url.searchParams.get('market') === 'KOSDAQ' ? 'KOSDAQ' : 'KOSPI';
    try {
      const data = await fetchNaverIndex(market);
      if (!data) return sendJson(res, 502, { error: '네이버 응답 없음' });
      return sendJson(res, 200, data);
    } catch (e) {
      return sendJson(res, 502, { error: String(e) });
    }
  }

  // 네이버 금융 국내 주식 다중 조회
  // GET /naver/stock?tickers=005930,000660,...
  if (url.pathname === '/naver/stock' && req.method === 'GET') {
    const param = url.searchParams.get('tickers') ?? '';
    if (!param) return sendJson(res, 400, { error: 'tickers required' });
    const tickers = param.split(',').map((s) => s.trim()).filter(Boolean);
    try {
      const entries = await Promise.all(tickers.map(async (t) => [t, await fetchNaverStock(t)]));
      return sendJson(res, 200, { quoteMap: Object.fromEntries(entries) });
    } catch (e) {
      return sendJson(res, 502, { error: String(e) });
    }
  }

  // 국내 섹터별 등락률 (히트맵용)
  // GET /naver/sectors
  if (url.pathname === '/naver/sectors' && req.method === 'GET') {
    try {
      const period = url.searchParams.get('period') ?? '1D';
      const tradingDays = toTradingDays(period);
      const allTickers = [...new Set(Object.values(KR_SECTOR_MAP).flatMap((s) => s.tickers))];
      const entries = await Promise.all(
        allTickers.map(async (ticker) => {
          if (tradingDays === 1) {
            return [ticker, await fetchNaverStock(ticker)];
          }
          const yahooSymbol = KR_YAHOO_SYM[ticker];
          if (!yahooSymbol) return [ticker, null];
          const changeRate = await fetchPeriodReturn(yahooSymbol, tradingDays);
          return [
            ticker,
            changeRate === null
              ? null
              : { symbol: ticker, name: ticker, price: 0, change: 0, changePercent: changeRate },
          ];
        }),
      );
      const stockMap = Object.fromEntries(entries);

      const sectors = Object.entries(KR_SECTOR_MAP).map(([name, { tickers, leaders }]) => {
        const stocks = tickers.map((t) => stockMap[t]).filter(Boolean);
        const avgChange = stocks.length
          ? stocks.reduce((sum, s) => sum + s.changePercent, 0) / stocks.length
          : 0;
        return { name, changeRate: Math.round(avgChange * 100) / 100, leaders };
      });
      return sendJson(res, 200, { sectors });
    } catch (e) {
      return sendJson(res, 502, { error: String(e) });
    }
  }

  // 해외 섹터별 등락률 (히트맵용)
  // GET /yahoo/sectors
  if (url.pathname === '/yahoo/sectors' && req.method === 'GET') {
    try {
      const period = url.searchParams.get('period') ?? '1D';
      const tradingDays = toTradingDays(period);
      const allTickers = [...new Set(Object.values(US_SECTOR_MAP).flatMap((s) => s.tickers))];
      const quoteMap = tradingDays === 1
        ? await fetchYfBatch(allTickers)
        : Object.fromEntries(
            await Promise.all(
              allTickers.map(async (ticker) => {
                const changeRate = await fetchPeriodReturn(ticker, tradingDays);
                return [
                  ticker,
                  changeRate === null
                    ? null
                    : { symbol: ticker, price: 0, change: 0, changePercent: changeRate, timestamp: 0 },
                ];
              }),
            ),
          );

      const sectors = Object.entries(US_SECTOR_MAP).map(([name, { tickers, leaders }]) => {
        const stocks = tickers.map((t) => quoteMap[t]).filter(Boolean);
        const avgChange = stocks.length
          ? stocks.reduce((sum, s) => sum + s.changePercent, 0) / stocks.length
          : 0;
        return { name, changeRate: Math.round(avgChange * 100) / 100, leaders };
      });
      return sendJson(res, 200, { sectors });
    } catch (e) {
      return sendJson(res, 502, { error: String(e) });
    }
  }

  // 국내 주식 랭킹 (모버 탭용)
  // GET /naver/ranking?type=change|cap|popular&limit=5
  if (url.pathname === '/naver/ranking' && req.method === 'GET') {
    const type  = url.searchParams.get('type') ?? 'change';
    const limit = Math.min(Number(url.searchParams.get('limit') ?? 5), 20);
    try {
      const pool = type === 'cap'     ? CAP_ORDER
                 : type === 'popular' ? POPULAR_ORDER
                 : RANKING_POOL;

      const entries = await Promise.all(pool.map(async (t) => [t, await fetchNaverStock(t)]));
      let stocks = entries.filter(([, s]) => s !== null).map(([, s]) => s);

      if (type === 'change') {
        stocks = [...stocks].sort((a, b) => b.changePercent - a.changePercent);
      }

      return sendJson(res, 200, { stocks: stocks.slice(0, limit) });
    } catch (e) {
      return sendJson(res, 502, { error: String(e) });
    }
  }

  // KIS 지수 (KIS 키 있을 때만)
  if (url.pathname === '/kis/index' && req.method === 'GET') {
    const market = url.searchParams.get('market') === 'KOSDAQ' ? 'KOSDAQ' : 'KOSPI';
    try {
      const data = await fetchKisIndex(market);
      return sendJson(res, 200, data);
    } catch (e) {
      return sendJson(res, 502, { error: String(e), hint: 'KIS_APP_KEY, KIS_APP_SECRET 확인' });
    }
  }

  return sendJson(res, 404, { error: 'not found' });
});

server.listen(PORT, () => {
  console.log(`[proxy] http://127.0.0.1:${PORT} 대기 중`);
});
