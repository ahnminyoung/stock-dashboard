# 무료 실시간 데이터 API 가이드

## 현재 코드에서 연결한 API

1. Finnhub
- 용도: 해외 지수 대체치(ETF), 미국 관심종목, USD/KRW(FX)
- 코드: `src/api/providers/finnhub.ts`, `src/api/dashboardApi.ts`
- 환경변수: `VITE_FINNHUB_API_KEY`

2. Alpha Vantage
- 용도: Finnhub 실패 시 fallback (QQQ/SPY, USD/KRW)
- 코드: `src/api/providers/alphaVantage.ts`, `src/api/dashboardApi.ts`
- 환경변수: `VITE_ALPHA_VANTAGE_API_KEY`

3. KIS Open API (프록시 연동)
- 용도: KOSPI/KOSDAQ 실시간 지수
- 코드: `src/api/providers/kisProxy.ts`, `src/api/dashboardApi.ts`
- 환경변수: `VITE_KIS_PROXY_BASE_URL`
- 주의: App Key/App Secret은 브라우저에 노출하면 안 되므로 백엔드 프록시 필수

## 실시간 반영 방식
- 프론트 훅: `src/hooks/useDashboardData.ts`
- 기본 갱신 주기: 30초 polling
- 추가 실시간: Finnhub WebSocket (`wss://ws.finnhub.io`) 구독으로 틱 단위 가격 반영
- 실패 시: mock 데이터 fallback

## 바로 움직이게 실행하는 순서
1. `.env` 파일에 `VITE_FINNHUB_API_KEY` 설정
2. 프론트 실행: `npm run dev`
3. (국내 지수도 실시간으로 쓰려면) 프록시 실행: `npm run dev:proxy`
4. 프론트 `.env`에 `VITE_KIS_PROXY_BASE_URL=http://127.0.0.1:8787` 설정

## KIS 프록시 응답 스펙(현재 프론트가 기대하는 형식)
`GET {VITE_KIS_PROXY_BASE_URL}/kis/index?market=KOSPI`

```json
{
  "value": 2650.23,
  "change": 15.25,
  "changePercent": 0.58
}
```

KOSDAQ도 동일 스키마로 `market=KOSDAQ`.
