import { useState } from "react";
import { DAILY_REWARDS, NEWS, fmt } from "../data";
import { effRating } from "../engine";
import { useGame } from "../store";
import { Chip, CoinIcon, Confetti, GemIcon, PlayerCard, SectionTitle } from "../ui";

const today = () => new Date().toISOString().slice(0, 10);

export default function Home({ nav }: { nav: (t: string) => void }) {
  const g = useGame();
  const [claimed, setClaimed] = useState<{ coins: number; gems: number } | null>(null);
  const canClaim = g.lastDaily !== today();
  const best = [...g.squad].sort((a, b) => effRating(b) - effRating(a)).slice(0, 5);

  const TILES = [
    { id: "squad", icon: "⚽", t: "ترکیب تیم" }, { id: "packs", icon: "🃏", t: "فروشگاه پک" },
    { id: "league", icon: "🏟️", t: "لیگ‌ها" }, { id: "wc", icon: "🌍", t: "جام جهانی" },
    { id: "market", icon: "💰", t: "بازار" }, { id: "training", icon: "🏋️", t: "تمرین" },
    { id: "penalty", icon: "🥅", t: "پنالتی" }, { id: "quiz", icon: "🧠", t: "کوئیز" },
  ];

  return (
    <div>
      {claimed && <Confetti />}
      {/* خوش‌آمد */}
      <div className="panel p-4 mb-4 relative overflow-hidden">
        <div className="absolute -left-8 -top-8 w-40 h-40 rounded-full bg-blue-500/20 blur-2xl" />
        <div className="absolute -right-8 -bottom-8 w-40 h-40 rounded-full bg-yellow-500/10 blur-2xl" />
        <div className="relative flex items-center gap-3 flex-wrap">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-900 ring-2 ring-yellow-400/60 flex items-center justify-center text-3xl">🧑‍💼</div>
          <div className="flex-1 min-w-40">
            <div className="font-black text-lg">سلام سرمربی {g.manager}! {g.vip && <span className="text-fuchsia-300">👑</span>}</div>
            <div className="text-[11px] text-white/60">باشگاه {g.club} • سطح {fmt(Math.floor(g.xp / 500) + 1)} • قدرت تیم {fmt(Math.round(g.myStrength()))}</div>
          </div>
          <button className="btn-blue px-4 py-2 text-sm" onClick={() => g.playNext("friendly")}>🤝 بازی دوستانه سریع</button>
        </div>
      </div>

      {/* نوار خبر */}
      <div className="panel overflow-hidden mb-4 py-1.5 flex items-center gap-2">
        <span className="bg-rose-600 text-[10px] font-black px-2 py-0.5 rounded-full mr-2 shrink-0">زنده 🔴</span>
        <div className="flex-1 overflow-hidden" dir="ltr">
          <div className="ticker-anim text-xs text-white/80" dir="rtl">{NEWS.join("  ✦  ")}</div>
        </div>
      </div>

      {/* پاداش روزانه */}
      <div className="panel p-4 mb-4">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h3 className="font-black text-sm text-yellow-200">🎁 پاداش ورود روزانه — روز {fmt(canClaim ? (g.streak % 7) + 1 : g.streak || 1)}</h3>
          <button className="btn-gold px-5 py-1.5 text-xs disabled:opacity-40" disabled={!canClaim}
            onClick={() => { const r = g.claimDaily(); if (r) { setClaimed(r); setTimeout(() => setClaimed(null), 3000); } }}>
            {canClaim ? "دریافت پاداش ✋" : "فردا برگرد ⏰"}
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {DAILY_REWARDS.map(r => {
            const done = g.streak >= r.day && !canClaim || g.streak > r.day - 1 && canClaim && g.streak >= r.day;
            const next = canClaim && (g.streak % 7) + 1 === r.day;
            return (
              <div key={r.day} className={`rounded-lg p-1.5 text-center text-[9px] border ${done ? "bg-emerald-600/25 border-emerald-400/50" : next ? "bg-yellow-500/20 border-yellow-400/70 glow-pulse" : "bg-white/5 border-white/10"}`}>
                <div className="font-black text-[10px]">روز {fmt(r.day)}</div>
                <div className="mt-0.5">{fmt(r.coins)} <CoinIcon s={9} /></div>
                {r.gems > 0 && <div>{fmt(r.gems)} <GemIcon s={9} /></div>}
                {done && <div>✅</div>}
              </div>
            );
          })}
        </div>
        {claimed && <div className="text-center text-sm font-black text-yellow-300 mt-2 pop-in">+{fmt(claimed.coins)} سکه {claimed.gems ? `و ${fmt(claimed.gems)} الماس` : ""} دریافت شد! 🎉</div>}
      </div>

      {/* دسترسی سریع */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {TILES.map(t => (
          <button key={t.id} onClick={() => nav(t.id)}
            className="panel p-3 text-center hover:bg-white/10 transition-colors active:scale-95">
            <div className="text-2xl mb-1">{t.icon}</div>
            <div className="text-[10px] font-bold text-white/80">{t.t}</div>
          </button>
        ))}
      </div>

      {/* ستاره‌های تیم */}
      <SectionTitle icon="🌟">ستاره‌های تیم تو</SectionTitle>
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {best.map(p => <PlayerCard key={p.uid} p={p} />)}
      </div>

      {/* وضعیت مسابقات */}
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="panel p-4">
          <h3 className="font-black text-sm mb-1">🏟️ وضعیت لیگ</h3>
          {g.league && !g.league.done
            ? <div className="text-xs text-white/70">هفته {fmt(g.league.round + 1)} — بازی بعدی با <b className="text-yellow-300">{g.nextLeagueOpp()?.name}</b></div>
            : <div className="text-xs text-white/50">فصلی فعال نیست — ثبت‌نام کن!</div>}
          <button className="btn-ghost px-4 py-1.5 text-xs mt-2" onClick={() => nav("league")}>ورود به لیگ ←</button>
        </div>
        <div className="panel p-4">
          <h3 className="font-black text-sm mb-1">🌍 جام جهانی</h3>
          {g.wc && g.wc.stage !== "done"
            ? <div className="text-xs text-white/70">در جریان — حریف بعدی: <b className="text-yellow-300">{g.nextWCOpp()?.flag} {g.nextWCOpp()?.name}</b></div>
            : <div className="text-xs text-white/50">جام جهانی منتظر توست ایران! 🇮🇷</div>}
          <button className="btn-ghost px-4 py-1.5 text-xs mt-2" onClick={() => nav("wc")}>ورود به جام ←</button>
        </div>
      </div>

      {!g.vip && (
        <div className="panel p-4 mt-4 ring-1 ring-fuchsia-400/40 flex items-center gap-3 flex-wrap">
          <div className="text-3xl">👑</div>
          <div className="flex-1 min-w-40 text-xs text-white/80">
            <b className="text-fuchsia-300">VIP شو!</b> پاداش ×۱.۵، پک الهی و ۵۰,۰۰۰ سکه هدیه
          </div>
          <button className="btn-gold px-4 py-2 text-xs" onClick={() => nav("settings")}>مشاهده 💎</button>
        </div>
      )}

      <div className="mt-4 flex gap-2 flex-wrap">
        <Chip>🃏 {fmt(g.stats.packs)} پک باز شده</Chip>
        <Chip color="bg-emerald-800/50">✅ {fmt(g.stats.w)} برد</Chip>
        <Chip color="bg-blue-800/50">⚽ {fmt(g.stats.gf)} گل زده</Chip>
        {g.trophies.slice(-2).map((t, i) => <Chip key={i} color="bg-yellow-700/40">{t}</Chip>)}
      </div>
    </div>
  );
}
