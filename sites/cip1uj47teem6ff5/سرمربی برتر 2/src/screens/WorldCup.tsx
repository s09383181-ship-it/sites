import { WC_TEAMS, fmt } from "../data";
import { sortIdx, useGame } from "../store";
import { Chip, SectionTitle } from "../ui";

const WC_GROUPS = [[0, 4, 8, 12], [1, 5, 9, 13], [2, 6, 10, 14], [3, 7, 11, 15]];
const GROUP_NAMES = ["A", "B", "C", "D"];

export default function WorldCup() {
  const g = useGame();
  const wc = g.wc;

  if (!wc) {
    return (
      <div>
        <SectionTitle icon="🌍">جام جهانی — رویای بزرگ</SectionTitle>
        <div className="panel p-6 text-center">
          <div className="text-6xl mb-3">🏆</div>
          <h3 className="text-xl font-black gold-text mb-2">هدایت تیم ملی ایران 🇮🇷</h3>
          <p className="text-xs text-white/60 leading-6 max-w-md mx-auto mb-4">
            با ترکیب باشگاهت، سکان تیم ملی را به دست بگیر! ۱۶ تیم، ۴ گروه، مرحله حذفی و فینال رویایی.
            قدرت تیم ملی = قدرت ترکیب فعلی تو. قبل از شروع، بهترین ترکیب را بچین!
          </p>
          <div className="text-[11px] text-yellow-300 mb-4">🎁 جایزه قهرمانی: ۱۰۰,۰۰۰ سکه + ۱۰۰ الماس</div>
          <button className="btn-gold px-8 py-3" onClick={g.startWC}>🎺 شروع جام جهانی</button>
        </div>
      </div>
    );
  }

  const opp = g.nextWCOpp();
  const stageName = wc.stage === "group" ? `مرحله گروهی — بازی ${fmt(wc.groupRound + 1)} از ۳`
    : wc.stage === "qf" ? "یک‌چهارم نهایی" : wc.stage === "sf" ? "نیمه‌نهایی" : wc.stage === "final" ? "فینال 🌟" : "پایان جام";

  return (
    <div>
      <SectionTitle icon="🌍">جام جهانی — {stageName}</SectionTitle>

      {wc.stage === "done" ? (
        <div className="panel p-6 text-center mb-4">
          <div className="text-6xl mb-2">{wc.champion === 0 ? "🏆" : "🎖️"}</div>
          <div className="text-xl font-black gold-text">{wc.myResult}</div>
          {wc.champion >= 0 && wc.champion !== 0 && (
            <div className="text-sm text-white/70 mt-2">قهرمان جام: {WC_TEAMS[wc.champion].flag} {WC_TEAMS[wc.champion].name}</div>
          )}
          <button className="btn-blue px-6 py-2 mt-4" onClick={g.startWC}>جام جدید 🔁</button>
        </div>
      ) : opp && (
        <div className="panel p-4 mb-4 flex items-center gap-3 flex-wrap">
          <div className="text-4xl">{opp.flag}</div>
          <div className="flex-1 min-w-40">
            <div className="font-black">بازی بعدی: 🇮🇷 ایران مقابل {opp.name}</div>
            <div className="text-[11px] text-white/60">قدرت حریف: {fmt(opp.str)} — قدرت تو: {fmt(Math.round(g.myStrength()))}</div>
            {wc.stage !== "group" && <div className="text-[11px] text-rose-300 mt-1">⚠️ حذفی: مساوی به ضربات پنالتی می‌رود!</div>}
          </div>
          <button className="btn-gold px-6 py-2.5" onClick={() => g.playNext("wc")}>شروع مسابقه 📣</button>
        </div>
      )}

      {/* گروه‌ها */}
      {wc.stage === "group" || wc.qualified.length === 0 ? (
        <div className="grid sm:grid-cols-2 gap-3">
          {WC_GROUPS.map((grp, gi) => {
            const order = sortIdx(wc.table, grp);
            return (
              <div key={gi} className="panel overflow-hidden">
                <div className="bg-white/10 px-3 py-1.5 text-xs font-black text-yellow-200">گروه {GROUP_NAMES[gi]}</div>
                <table className="w-full text-[11px]">
                  <tbody>
                    {order.map((ti, rank) => (
                      <tr key={ti} className={`border-t border-white/5 ${ti === 0 ? "bg-yellow-400/10 font-black" : ""} ${rank < 2 ? "text-emerald-300" : "text-white/60"}`}>
                        <td className="p-1.5 w-6 text-center">{fmt(rank + 1)}</td>
                        <td className="p-1.5">{WC_TEAMS[ti].flag} {ti === 0 ? `ایران (${g.club})` : WC_TEAMS[ti].name}</td>
                        <td className="p-1.5 text-center w-8">{fmt(wc.table[ti].p)}</td>
                        <td className="p-1.5 text-center w-10" dir="ltr">{fmt(wc.table[ti].gf - wc.table[ti].ga)}</td>
                        <td className="p-1.5 text-center w-8 font-black">{fmt(wc.table[ti].pts)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="panel p-4">
          <h3 className="font-black text-sm mb-3 text-yellow-200">🗺️ جدول حذفی</h3>
          <div className="grid grid-cols-3 gap-2 text-[11px]">
            <div className="space-y-2">
              <div className="text-center text-white/50 font-bold">یک‌چهارم</div>
              {[0, 2, 4, 6].map(i => wc.qualified[i] !== undefined && (
                <div key={i} className="panel p-2 text-center">
                  {WC_TEAMS[wc.qualified[i]].flag} {WC_TEAMS[wc.qualified[i]].name}
                  <div className="text-white/40 my-0.5">vs</div>
                  {WC_TEAMS[wc.qualified[i + 1]].flag} {WC_TEAMS[wc.qualified[i + 1]].name}
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <div className="text-center text-white/50 font-bold">نیمه‌نهایی</div>
              {wc.sfTeams.length ? [0, 2].map(i => (
                <div key={i} className="panel p-2 text-center mt-8">
                  {WC_TEAMS[wc.sfTeams[i]].flag} {WC_TEAMS[wc.sfTeams[i]].name}
                  <div className="text-white/40 my-0.5">vs</div>
                  {WC_TEAMS[wc.sfTeams[i + 1]].flag} {WC_TEAMS[wc.sfTeams[i + 1]].name}
                </div>
              )) : <div className="text-center text-white/30 mt-10">—</div>}
            </div>
            <div className="space-y-2">
              <div className="text-center text-white/50 font-bold">فینال 🏆</div>
              {wc.finalTeams.length ? (
                <div className="panel p-2 text-center mt-16 ring-1 ring-yellow-400/50">
                  {WC_TEAMS[wc.finalTeams[0]].flag} {WC_TEAMS[wc.finalTeams[0]].name}
                  <div className="text-yellow-300 my-0.5 font-black">VS</div>
                  {WC_TEAMS[wc.finalTeams[1]].flag} {WC_TEAMS[wc.finalTeams[1]].name}
                </div>
              ) : <div className="text-center text-white/30 mt-16">—</div>}
            </div>
          </div>
        </div>
      )}

      <div className="mt-3 flex gap-2 flex-wrap">
        <Chip>🇮🇷 تیم تو در گروه A است</Chip>
        <Chip color="bg-emerald-800/50">دو تیم اول هر گروه صعود می‌کنند</Chip>
      </div>
    </div>
  );
}
