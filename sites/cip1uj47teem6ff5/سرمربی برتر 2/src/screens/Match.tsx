import { useEffect, useRef, useState } from "react";
import { useGame } from "../store";
import { MatchEvent, effRating, tickMinute } from "../engine";
import { BallIcon, Modal, PlayerCard } from "../ui";
import { fmt } from "../data";

export default function MatchScreen() {
  const g = useGame();
  const m = g.match!;
  const [minute, setMinute] = useState(0);
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [homeGoals, setHomeGoals] = useState(0);
  const [awayGoals, setAwayGoals] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [paused, setPaused] = useState(false);
  const [subsLeft, setSubsLeft] = useState(3);
  const [subModal, setSubModal] = useState(false);
  const [subOut, setSubOut] = useState<string | null>(null);
  const [goalFlash, setGoalFlash] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const ref = useRef({ minute: 0, hg: 0, ag: 0 });

  const myName = g.club;
  const homeName = m.home ? myName : m.oppName;
  const awayName = m.home ? m.oppName : myName;
  const myStr = g.myStrength();

  useEffect(() => {
    if (paused || done || subModal) return;
    const iv = setInterval(() => {
      const st = ref.current;
      st.minute++;
      if (st.minute > 90) {
        setDone(true);
        return;
      }
      setMinute(st.minute);
      if (st.minute === 45) setEvents(ev => [{ minute: 45, side: "none", type: "info", text: "☕ پایان نیمه اول" }, ...ev]);
      const e = tickMinute(st.minute, myStr, m.oppStr, m.home);
      if (e) {
        if (e.type === "goal") {
          if (e.side === "home") { st.hg++; setHomeGoals(st.hg); } else { st.ag++; setAwayGoals(st.ag); }
          const mine = (e.side === "home") === m.home;
          setGoalFlash(mine ? "⚽ گـــــل برای تو!" : "😱 گل خوردی!");
          setTimeout(() => setGoalFlash(null), 1500);
        }
        setEvents(ev => [e, ...ev].slice(0, 60));
      }
    }, 520 / speed);
    return () => clearInterval(iv);
  }, [paused, done, speed, subModal, myStr, m.oppStr, m.home]);

  const finish = () => {
    const mg = m.home ? ref.current.hg : ref.current.ag;
    const og = m.home ? ref.current.ag : ref.current.hg;
    g.resolveMatch(mg, og);
  };

  const xi = g.lineup.map(id => g.squad.find(p => p.uid === id)!).filter(Boolean);
  const bench = g.squad.filter(p => !g.lineup.includes(p.uid)).sort((a, b) => effRating(b) - effRating(a));

  const sideColor = (s: string) => s === "none" ? "border-white/20" : (s === "home") === m.home ? "border-emerald-400/60" : "border-rose-400/60";

  return (
    <div className="fixed inset-0 z-40 bg-[#060b1c] overflow-y-auto">
      {goalFlash && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="goal-flash text-4xl sm:text-6xl font-black gold-text drop-shadow-2xl">{goalFlash}</div>
        </div>
      )}
      <div className="max-w-3xl mx-auto p-3 pb-24">
        {/* تابلوی نتیجه */}
        <div className="panel p-4 sticky top-2 z-30 bg-[#0a1228]/95">
          <div className="text-center text-[11px] text-yellow-300/80 font-bold mb-1">
            {m.kind === "league" ? "🏟️ لیگ — مسابقه زنده" : m.kind === "wc" ? `🌍 جام جهانی ${m.oppFlag}` : "🤝 بازی دوستانه"}
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 text-center">
              <div className="font-black text-sm truncate">{homeName}</div>
              {m.home && <div className="text-[10px] text-emerald-400">تیم تو • قدرت {fmt(myStr)}</div>}
            </div>
            <div className="text-center px-3">
              <div className="text-3xl font-black gold-text tabular-nums" dir="ltr">{homeGoals} - {awayGoals}</div>
              <div className="text-xs font-bold text-white/70 mt-1">
                <span className="ball-bounce"><BallIcon s={14} /></span> {fmt(minute)}′
              </div>
            </div>
            <div className="flex-1 text-center">
              <div className="font-black text-sm truncate">{awayName}</div>
              {!m.home && <div className="text-[10px] text-emerald-400">تیم تو • قدرت {fmt(myStr)}</div>}
            </div>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full bg-gradient-to-l from-yellow-400 to-blue-500 transition-all" style={{ width: `${(minute / 90) * 100}%` }} />
          </div>
          {/* کنترل‌ها */}
          <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
            {!done && (
              <>
                <button className="btn-ghost px-3 py-1 text-xs" onClick={() => setPaused(p => !p)}>{paused ? "▶️ ادامه" : "⏸️ توقف"}</button>
                {[1, 2, 4].map(s => (
                  <button key={s} className={`px-3 py-1 text-xs rounded-lg font-bold ${speed === s ? "btn-gold" : "btn-ghost"}`} onClick={() => setSpeed(s)}>{fmt(s)}x</button>
                ))}
                <button className="btn-blue px-3 py-1 text-xs" disabled={subsLeft === 0} onClick={() => { setSubModal(true); setSubOut(null); }}>
                  🔄 تعویض ({fmt(subsLeft)})
                </button>
              </>
            )}
            {done && <button className="btn-gold px-6 py-2 text-sm" onClick={finish}>پایان مسابقه — دریافت نتیجه 🏁</button>}
          </div>
        </div>

        {/* لاگ زنده */}
        <div className="mt-3 space-y-1.5">
          {events.length === 0 && <div className="text-center text-white/40 text-sm py-8">سوت آغاز... مسابقه شروع شد! 📣</div>}
          {events.map((e, i) => (
            <div key={events.length - i} className={`log-in flex items-center gap-2 bg-white/5 border-r-4 ${sideColor(e.side)} rounded-lg px-3 py-2 text-xs`}>
              <span className="font-black text-yellow-300 tabular-nums w-8">{fmt(e.minute)}′</span>
              <span className="text-base">
                {e.type === "goal" ? "⚽" : e.type === "save" ? "🧤" : e.type === "card" ? "🟨" : e.type === "chance" ? "💥" : e.type === "sub" ? "🔄" : "ℹ️"}
              </span>
              <span className="flex-1">
                {e.side !== "none" && <b className={((e.side === "home") === m.home) ? "text-emerald-300" : "text-rose-300"}>{(e.side === "home") ? homeName : awayName}: </b>}
                {e.text}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* مودال تعویض */}
      {subModal && (
        <Modal onClose={() => setSubModal(false)} wide>
          <h3 className="font-black gold-text mb-2">🔄 تعویض بازیکن {subOut ? "— بازیکن ورودی را انتخاب کن" : "— بازیکن خروجی را انتخاب کن"}</h3>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {(subOut ? bench : xi).map(p => (
              <PlayerCard key={p.uid} p={p} size="sm" selected={subOut === p.uid}
                onClick={() => {
                  if (!subOut) setSubOut(p.uid);
                  else {
                    g.substitute(subOut, p.uid);
                    setSubsLeft(n => n - 1);
                    setEvents(ev => [{ minute: ref.current.minute, side: m.home ? "home" : "away", type: "sub", text: `تعویض انجام شد: ${p.name} وارد زمین شد` }, ...ev]);
                    setSubModal(false);
                  }
                }} />
            ))}
          </div>
          {subOut && bench.length === 0 && <div className="text-xs text-white/50">نیمکت خالی است!</div>}
          <button className="btn-ghost w-full py-2 mt-2 text-sm" onClick={() => setSubModal(false)}>بستن</button>
        </Modal>
      )}
    </div>
  );
}
