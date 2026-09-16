import { LEAGUES, fmt } from "../data";
import { sortIdx, useGame } from "../store";
import { Chip, SectionTitle } from "../ui";

export default function League() {
  const g = useGame();
  const L = g.league;

  if (!L) {
    return (
      <div>
        <SectionTitle icon="🏟️">انتخاب لیگ — فصل جدید</SectionTitle>
        <p className="text-xs text-white/60 mb-3">در یکی از ۷ لیگ ثبت‌نام کن. ۱۴ هفته رفت و برگشت، جایزه قهرمانی و سهمیه افتخار!</p>
        <div className="grid sm:grid-cols-2 gap-3">
          {LEAGUES.map(l => (
            <div key={l.id} className="panel p-4 flex items-center gap-3">
              <div className="text-4xl">{l.flag}</div>
              <div className="flex-1">
                <div className="font-black">{l.name}</div>
                <div className="text-[11px] text-white/60 mt-0.5">
                  {l.teams.slice(0, 4).map(t => t.name).join("، ")}...
                </div>
                <div className="text-[11px] text-yellow-300 mt-1">🏆 جایزه قهرمانی: {fmt(l.prize)} سکه</div>
              </div>
              <button className="btn-gold px-4 py-2 text-sm" onClick={() => g.startLeague(l.id)}>ثبت‌نام</button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const def = LEAGUES.find(x => x.id === L.defId)!;
  const order = sortIdx(L.table, L.teams.map((_, i) => i));
  const opp = g.nextLeagueOpp();
  const myPlace = order.indexOf(0) + 1;

  return (
    <div>
      <SectionTitle icon="🏟️">{def.name} {def.flag}</SectionTitle>
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <Chip color="bg-blue-600/60">هفته {fmt(Math.min(L.round + 1, L.fixtures.length))} از {fmt(L.fixtures.length)}</Chip>
        <Chip color={myPlace === 1 ? "bg-yellow-600/60" : "bg-white/10"}>رتبه تو: {fmt(myPlace)}</Chip>
        {L.done && <Chip color="bg-emerald-700/60">فصل تمام شد ✅</Chip>}
      </div>

      {!L.done && opp && (
        <div className="panel p-4 mb-4 flex items-center gap-3 flex-wrap">
          <div className="text-3xl">⚔️</div>
          <div className="flex-1 min-w-40">
            <div className="font-black">بازی بعدی: مقابل {opp.name}</div>
            <div className="text-[11px] text-white/60">قدرت حریف: {fmt(opp.str)} — قدرت تو: {fmt(Math.round(g.myStrength()))}</div>
          </div>
          <button className="btn-gold px-6 py-2.5" onClick={() => g.playNext("league")}>شروع مسابقه زنده 📣</button>
        </div>
      )}
      {L.done && (
        <div className="panel p-4 mb-4 text-center">
          <div className="text-lg font-black gold-text">{myPlace === 1 ? "🏆 قهرمان شدی! تبریک سرمربی!" : `پایان فصل — رتبه ${fmt(myPlace)}`}</div>
          <button className="btn-blue px-6 py-2 mt-3" onClick={() => g.startLeague(L.defId)}>فصل جدید در همین لیگ 🔁</button>
          <button className="btn-ghost px-6 py-2 mt-3 mr-2" onClick={() => useGame.setState({ league: null })}>تغییر لیگ</button>
        </div>
      )}

      {/* جدول */}
      <div className="panel overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-white/10 text-yellow-200">
            <tr>
              <th className="p-2 text-right">#</th><th className="p-2 text-right">تیم</th>
              <th className="p-2">بازی</th><th className="p-2">برد</th><th className="p-2">مساوی</th><th className="p-2">باخت</th>
              <th className="p-2">گل±</th><th className="p-2">امتیاز</th>
            </tr>
          </thead>
          <tbody>
            {order.map((ti, rank) => {
              const r = L.table[ti];
              const me = ti === 0;
              return (
                <tr key={ti} className={`border-t border-white/5 ${me ? "bg-yellow-400/10 font-black text-yellow-200" : ""} ${rank === 0 ? "text-emerald-300" : ""}`}>
                  <td className="p-2">{fmt(rank + 1)}</td>
                  <td className="p-2">{me ? `⭐ ${g.club}` : L.teams[ti].name}</td>
                  <td className="p-2 text-center">{fmt(r.p)}</td><td className="p-2 text-center">{fmt(r.w)}</td>
                  <td className="p-2 text-center">{fmt(r.d)}</td><td className="p-2 text-center">{fmt(r.l)}</td>
                  <td className="p-2 text-center" dir="ltr">{fmt(r.gf - r.ga)}</td>
                  <td className="p-2 text-center font-black">{fmt(r.pts)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
