import { useState } from "react";
import { PACKS, PackDef, fmt, tierOf } from "../data";
import { Player, effRating } from "../engine";
import { useGame } from "../store";
import { CoinIcon, Confetti, GemIcon, PlayerCard, SectionTitle } from "../ui";

type Phase = "idle" | "shaking" | "burst" | "reveal";

export default function Packs() {
  const g = useGame();
  const [phase, setPhase] = useState<Phase>("idle");
  const [pack, setPack] = useState<PackDef | null>(null);
  const [pulled, setPulled] = useState<Player[]>([]);
  const [shown, setShown] = useState(0);
  const [err, setErr] = useState("");

  const buy = (p: PackDef) => {
    setErr("");
    if (p.vipOnly && !g.vip) { setErr("این پک مخصوص اعضای VIP است! 👑"); return; }
    const res = g.openPack(p.id);
    if (!res) { setErr("موجودی کافی نیست! 💸"); return; }
    setPack(p); setPulled(res); setShown(0); setPhase("shaking");
    setTimeout(() => setPhase("burst"), 1400);
    setTimeout(() => setPhase("reveal"), 1950);
  };

  const best = pulled.length ? Math.max(...pulled.map(effRating)) : 0;

  if (phase !== "idle" && pack) {
    return (
      <div className="fixed inset-0 z-40 bg-black/90 flex flex-col items-center justify-center p-4 overflow-hidden">
        {/* پرتوهای نور */}
        <div className="absolute inset-0 flex items-center justify-center opacity-40 pointer-events-none">
          <svg className="rays" width="700" height="700" viewBox="0 0 100 100">
            {Array.from({ length: 12 }).map((_, i) => (
              <polygon key={i} points="50,50 46,0 54,0" fill={best >= 89 ? "#f5c542" : "#3b82f6"} opacity=".5" transform={`rotate(${i * 30} 50 50)`} />
            ))}
          </svg>
        </div>
        {phase === "reveal" && best >= 87 && <Confetti />}

        {(phase === "shaking" || phase === "burst") && (
          <div className={`relative ${phase === "shaking" ? "pack-shake" : "pack-burst"}`}>
            <div className={`w-44 h-60 rounded-2xl bg-gradient-to-br ${pack.grad} ring-4 ring-yellow-300/60 shadow-2xl flex flex-col items-center justify-center card-shine`}>
              <div className="text-6xl">{pack.icon}</div>
              <div className="font-black text-white mt-3 text-lg drop-shadow">{pack.name}</div>
              <div className="text-white/70 text-xs mt-1">سرمربی برتر PRO</div>
            </div>
          </div>
        )}

        {phase === "reveal" && (
          <div className="relative z-10 w-full max-w-lg text-center">
            <h2 className="text-2xl font-black gold-text mb-4">{shown + 1 <= pulled.length ? "روی کارت ضربه بزن! 👆" : "کارت‌های تو 🎉"}</h2>
            <div className="flex flex-wrap justify-center gap-3">
              {pulled.map((p, i) =>
                i < shown ? (
                  <div key={p.uid} className="card-in"><PlayerCard p={p} /></div>
                ) : i === shown ? (
                  <div key={p.uid} onClick={() => setShown(s => s + 1)}
                    className="w-28 h-40 rounded-xl bg-gradient-to-br from-blue-800 to-indigo-950 ring-2 ring-yellow-300/70 flex flex-col items-center justify-center cursor-pointer float-y card-shine"
                    style={{ ["--glow" as string]: tierOf(effRating(p)).glow }}>
                    <div className="text-3xl">❓</div>
                    <div className="text-[10px] text-yellow-200 mt-2 font-bold">لمس کن</div>
                  </div>
                ) : (
                  <div key={p.uid} className="w-28 h-40 rounded-xl bg-white/5 ring-1 ring-white/10" />
                )
              )}
            </div>
            {shown >= pulled.length && (
              <div className="mt-6 space-y-2">
                {best >= 89 && <div className="text-xl font-black text-orange-300">🔥 کارت افسانه‌ای گرفتی! 🔥</div>}
                <button className="btn-gold px-8 py-3" onClick={() => { setPhase("idle"); setPack(null); }}>عالیه! 💪</button>
                <button className="btn-ghost px-6 py-3 mr-2" onClick={() => buy(pack)}>یکی دیگه {pack.icon}</button>
              </div>
            )}
            {shown < pulled.length && (
              <button className="btn-ghost px-5 py-2 mt-5 text-xs" onClick={() => setShown(pulled.length)}>نمایش همه ⏩</button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <SectionTitle icon="🃏">فروشگاه پک — شانست را امتحان کن!</SectionTitle>
      {err && <div className="panel border-rose-400/40 text-rose-300 text-sm p-3 mb-3 font-bold">{err}</div>}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {PACKS.map(p => (
          <div key={p.id} className={`panel p-4 text-center relative overflow-hidden ${p.vipOnly && !g.vip ? "opacity-80" : ""}`}>
            <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-l ${p.grad}`} />
            {p.vipOnly && <span className="absolute top-2 left-2 text-[10px] bg-fuchsia-600 px-2 py-0.5 rounded-full font-bold">VIP 👑</span>}
            <div className={`mx-auto w-20 h-28 rounded-xl bg-gradient-to-br ${p.grad} ring-2 ring-white/30 flex items-center justify-center text-4xl card-shine float-y mb-2`}>{p.icon}</div>
            <div className="font-black">{p.name}</div>
            <div className="text-[11px] text-white/60 my-1 h-8">{p.desc} • {fmt(p.cards)} کارت</div>
            <button className="btn-gold w-full py-2 text-sm flex items-center justify-center gap-1" onClick={() => buy(p)}>
              {fmt(p.cost)} {p.currency === "coins" ? <CoinIcon /> : <GemIcon />}
            </button>
          </div>
        ))}
      </div>
      <div className="panel p-3 mt-4 text-[11px] text-white/60 leading-6">
        💡 <b className="text-yellow-300">راهنمای شانس:</b> هر پک از باندهای احتمال مشخص استفاده می‌کند. پک‌های گران‌تر «کارت تضمینی» دارند.
        کارت‌های سطح <b className="text-fuchsia-300">کهکشانی، جاودان و الهی</b> فقط در پک‌های افسانه و الهی پیدا می‌شوند!
      </div>
    </div>
  );
}
