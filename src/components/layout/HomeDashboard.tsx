import { useDashboardData } from '../../hooks/useDashboardData';
import { GlobalMarketBar } from '../sections/GlobalMarketBar';
import { DomesticSection } from '../sections/DomesticSection';
import { OverseasSection } from '../sections/OverseasSection';

export const HomeDashboard = () => {
  const { data, loading, error, sources, wsConnected, hasFinnhubToken, wsMessage } = useDashboardData();

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {loading && <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-500">실시간 데이터 불러오는 중...</div>}

        <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-600">
          Finnhub 키: {hasFinnhubToken ? '설정됨' : '미설정'} · 웹소켓: {wsConnected ? '연결됨' : '미연결'} · 상태: {wsMessage}
        </div>

        {sources.length > 0 && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
            데이터 소스: {sources.join(', ')}
          </div>
        )}

        {error && <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">{error}</div>}

        <GlobalMarketBar data={data.globalMarketBar} />
        <DomesticSection data={data.domestic} />
        <OverseasSection data={data.overseas} />
      </div>
    </main>
  );
};
