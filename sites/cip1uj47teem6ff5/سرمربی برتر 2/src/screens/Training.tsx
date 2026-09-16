import { useState } from "react";
import { STAFF_DEFS, fmt } from "../data";
import { effRating } from "../engine";
import { useGame } from "../store";
import { Chip, CoinIcon, PlayerCard, SectionTitle } from "../ui";

export default function Training() {
  const g = useGame();
  const [msg, setMsg] = useState("");
  const flash = (t: string) => { setMsg(t); setTimeout(() => setMsg(""), 2500); };
  const restCost = Math.max(500, (5 - g.staff.doctor) * 400);

  return (
    <div>
      <SectionTitle icon="🏋️">مرکز تمرین و کادر فنی</SectionTitle>
      {msg && <div className="panel p-3 mb-3 text-sm font-bold text-yellow-300 pop-in">{msg}</div>}

      {/* کادر فنی */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {STAFF_DEFS.map(s => {
          const lvl = g.staff[s.id] ?? 0;
          const cost = s.baseCost * (lvl + 1);
          return (
            <div key={s.id} className="panel p-3 text-center">
              <div className="text-3xl">{s.icon}</div>
              <div className="font-black text-sm mt-1">{s.name}</div>
              <div className="text-[10px] text-white/60 h-8 mt-1">{s.desc}</div>
              <div className="flex justify-center gap-1 my-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className={`w-4 h-1.5 rounded-full ${i < lvl ? "bg-yellow-400" : "bg-white/15"}`} />
                ))}
              </div>
              <button className="btn-blue w-full py-1.5 text-[11px] disabled:opacity-40" disabled={lvl >= 5}
                onClick={() => flash(g.hireStaff(s.id) ? `${s.name} ارتقا یافت! 📈` : "سکه کافی نیست!")}>
                {lvl >= 5 ? "حداکثر سطح ✅" : <>ارتقا — {fmt(cost)} <CoinIcon s={11} /></>}
              </button>
            </div>
          );
        })}
      </div>

      {/* ریکاوری */}
      <div className="panel p-4 mb-5 flex items-center gap-3 flex-wrap">
        <div className="text-3xl">🛌</div>
        <div className="flex-1 min-w-40">
          <div className="font-black text-sm">اردوی ریکاوری</div>
          <div className="text-[11px] text-white/60">انرژی همه بازیکنان را کامل بازیابی می‌کند. پزشک تیم هزینه را کم می‌کند.</div>
        </div>
        <button className="btn-gold px-4 py-2 text-sm" onClick={() => flash(g.restSquad() ? "همه بازیکنان سرحال شدند! ⚡" : "سکه کافی نیست!")}>
          {fmt(restCost)} <CoinIcon s={12} />
        </button>
      </div>

      {/* تمرین انفرادی */}
      <SectionTitle icon="📈">تمرین انفرادی (تا +۵ ریتینگ)</SectionTitle>
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <Chip>هزینه با هر ارتقا بیشتر می‌شود</Chip>
        <Chip color="bg-rose-800/50">هر تمرین ۲۰ انرژی می‌گیرد</Chip>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        {[...g.squad].sort((a, b) => effRating(b) - effRating(a)).map(p => {
          const cost = Math.round((p.rating + p.boost) * 140 * (p.boost + 1));
          const maxed = p.boost >= 5 || p.rating + p.boost >= 99;
          return (
            <div key={p.uid} className="text-center">
              <PlayerCard p={p} />
              <button className="btn-blue w-full mt-1 py-1.5 text-[11px] disabled:opacity-30" disabled={maxed || p.energy < 20}
                onClick={() => flash(g.trainPlayer(p.uid) ? `${p.name} پیشرفت کرد! +۱ 🎯` : "سکه یا انرژی کافی نیست!")}>
                {maxed ? "تکمیل 🌟" : p.energy < 20 ? "خسته 😮‍💨" : <>تمرین {fmt(cost)} <CoinIcon s={11} /></>}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
