import { useState } from "react";
import { fmt } from "../data";
import { useGame } from "../store";
import { SectionTitle } from "../ui";

// موقعیت ۶ ناحیه دروازه (۳ ستون × ۲ ردیف)
const ZONES = [
  { x: -110, y: -95 }, { x: 0, y: -105 }, { x: 110, y: -95 },
  { x: -110, y: -35 }, { x: 0, y: -35 }, { x: 110, y: -35 },
];
const col = (z: number) => z % 3;
const row = (z: number) => (z / 3) | 0;

type Mode = "menu" | "solo" | "duel";

export default function Penalty() {
  const g = useGame();
  const [mode, setMode] = useState<Mode>("menu");
  const [shot, setShot] = useState(0);
  const [scored, setScored] = useState(0);
  const [ballZone, setBallZone] = useState<number | null>(null);
  const [keeperZone, setKeeperZone] = useState<number | null>(null);
  const [result, setResult] = useState<"" | "goal" | "save">("");
  const [busy, setBusy] = useState(false);
  const [finished, setFinished] = useState(false);
  // دوئل
  const [duelPhase, setDuelPhase] = useState<"keeper" | "shooter">("keeper");
  const [secretDive, setSecretDive] = useState<number | null>(null);
  const [half, setHalf] = useState(1); // 1: بازیکن۱ شوت می‌زند
  const [p1Score, setP1Score] = useState(0);
  const [p2Score, setP2Score] = useState(0);

  const reset = (m: Mode) => {
    setMode(m); setShot(0); setScored(0); setBallZone(null); setKeeperZone(null);
    setResult(""); setBusy(false); setFinished(false);
    setDuelPhase("keeper"); setSecretDive(null); setHalf(1); setP1Score(0); setP2Score(0);
  };

  const shoot = (z: number, diveZ: number) => {
    if (busy) return;
    setBusy(true);
    setBallZone(z); setKeeperZone(diveZ);
    const sameCol = col(z) === col(diveZ);
    const sameRow = row(z) === row(diveZ);
    const isGoal = !sameCol ? Math.random() < 0.94 : sameRow ? Math.random() < 0.18 : Math.random() < 0.55;
    setTimeout(() => {
      setResult(isGoal ? "goal" : "save");
      if (mode === "solo" && isGoal) { setScored(s => s + 1); }
      if (mode === "duel" && isGoal) { half === 1 ? setP1Score(s => s + 1) : setP2Score(s => s + 1); }
      setTimeout(() => {
        const next = shot + 1;
        setBallZone(null); setKeeperZone(null); setResult(""); setBusy(false);
        if (mode === "solo") {
          if (next >= 5) {
            setFinished(true);
            const sc = scored + (isGoal ? 1 : 0);
            g.earn(sc * 300 + (sc === 5 ? 1000 : 0), 0, sc * 10);
          } else setShot(next);
        } else {
          if (next >= 5) {
            if (half === 1) { setHalf(2); setShot(0); setDuelPhase("keeper"); setSecretDive(null); }
            else { setFinished(true); g.earn(500, 0, 30); }
          } else { setShot(next); setDuelPhase("keeper"); setSecretDive(null); }
        }
      }, 1100);
    }, 600);
  };

  const soloShoot = (z: number) => shoot(z, ((Math.random() * 6) | 0));

  if (mode === "menu") {
    return (
      <div>
        <SectionTitle icon="🥅">زمین پنالتی</SectionTitle>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="panel p-5 text-center">
            <div className="text-5xl mb-2">🎯</div>
            <div className="font-black">چالش پنالتی</div>
            <p className="text-[11px] text-white/60 my-2 leading-5">۵ ضربه بزن! هر گل ۳۰۰ سکه — گل کردن هر ۵ ضربه، ۱۰۰۰ سکه جایزه ویژه دارد.</p>
            <button className="btn-gold px-6 py-2" onClick={() => reset("solo")}>شروع 🚀</button>
          </div>
          <div className="panel p-5 text-center">
            <div className="text-5xl mb-2">🤼</div>
            <div className="font-black">دوئل دو نفره (آفلاین)</div>
            <p className="text-[11px] text-white/60 my-2 leading-5">با دوستت روی یک دستگاه! دروازه‌بان مخفیانه شیرجه را انتخاب می‌کند، بعد شوت‌زننده می‌زند. ۵ ضربه هر نفر.</p>
            <button className="btn-blue px-6 py-2" onClick={() => reset("duel")}>شروع دوئل ⚔️</button>
          </div>
        </div>
      </div>
    );
  }

  const shooterName = mode === "duel" ? (half === 1 ? "بازیکن ۱" : "بازیکن ۲") : g.manager;
  const keeperName = mode === "duel" ? (half === 1 ? "بازیکن ۲" : "بازیکن ۱") : "دروازه‌بان هوش مصنوعی";

  return (
    <div>
      <SectionTitle icon="🥅">{mode === "solo" ? "چالش پنالتی" : "دوئل پنالتی"}</SectionTitle>
      <div className="flex items-center justify-between mb-2 text-xs font-bold flex-wrap gap-2">
        <span className="text-yellow-300">ضربه {fmt(Math.min(shot + 1, 5))} از ۵ {mode === "duel" ? `— نیمه ${fmt(half)}` : ""}</span>
        {mode === "solo"
          ? <span>گل‌ها: {"⚽".repeat(scored) || "—"}</span>
          : <span>بازیکن ۱: {fmt(p1Score)} ⚽ | بازیکن ۲: {fmt(p2Score)} ⚽</span>}
      </div>

      {finished ? (
        <div className="panel p-6 text-center pop-in">
          <div className="text-5xl mb-2">{mode === "solo" ? (scored >= 4 ? "🏆" : scored >= 2 ? "👏" : "😅") : "🏁"}</div>
          {mode === "solo" ? (
            <>
              <div className="font-black text-lg gold-text">{fmt(scored)} گل از ۵ ضربه!</div>
              <div className="text-sm text-white/70 mt-1">پاداش: {fmt(scored * 300 + (scored === 5 ? 1000 : 0))} سکه</div>
            </>
          ) : (
            <div className="font-black text-lg gold-text">
              {p1Score === p2Score ? "مساوی! 🤝" : p1Score > p2Score ? "بازیکن ۱ برنده شد! 🏆" : "بازیکن ۲ برنده شد! 🏆"}
            </div>
          )}
          <button className="btn-gold px-6 py-2 mt-4" onClick={() => reset(mode)}>دوباره 🔁</button>
          <button className="btn-ghost px-6 py-2 mt-4 mr-2" onClick={() => setMode("menu")}>بازگشت</button>
        </div>
      ) : mode === "duel" && duelPhase === "keeper" ? (
        <div className="panel p-5 text-center pop-in">
          <div className="text-4xl mb-2">🧤</div>
          <div className="font-black">{keeperName} — نوبت توست!</div>
          <p className="text-[11px] text-white/60 my-2">مخفیانه جهت شیرجه را انتخاب کن ({shooterName} نگاه نکند! 🙈)</p>
          <div className="grid grid-cols-3 gap-2 max-w-60 mx-auto">
            {["↖️", "⬆️", "↗️", "↙️", "⬇️", "↘️"].map((ic, i) => (
              <button key={i} className="btn-blue py-3 text-xl" onClick={() => { setSecretDive(i); setDuelPhase("shooter"); }}>{ic}</button>
            ))}
          </div>
        </div>
      ) : (
        <div className="penalty-scene relative w-full max-w-xl mx-auto h-[380px] rounded-2xl overflow-hidden panel"
          style={{ background: "linear-gradient(#7dd3fc 0%, #bae6fd 42%, #157f3d 42%)" }}>
          {/* زمین */}
          <div className="penalty-ground absolute bottom-0 inset-x-0 h-[220px]" />
          {/* دروازه */}
          <div className="absolute left-1/2 top-[46px] -translate-x-1/2 w-[320px] h-[130px]">
            <svg viewBox="0 0 320 130" className="w-full h-full">
              <rect x="4" y="4" width="312" height="122" fill="none" stroke="#fff" strokeWidth="7" />
              {Array.from({ length: 15 }).map((_, i) => <line key={i} x1={8 + i * 21} y1="8" x2={8 + i * 21} y2="126" stroke="#e2e8f0" strokeWidth="1" opacity=".55" />)}
              {Array.from({ length: 6 }).map((_, i) => <line key={i} x1="8" y1={10 + i * 20} x2="312" y2={10 + i * 20} stroke="#e2e8f0" strokeWidth="1" opacity=".55" />)}
            </svg>
            {/* دروازه‌بان */}
            <div className="pen-keeper absolute left-1/2 bottom-0 -translate-x-1/2"
              style={{ transform: keeperZone !== null ? `translateX(${ZONES[keeperZone].x * 0.9 - 24}px) translateY(${row(keeperZone) === 0 ? -34 : 0}px) rotate(${col(keeperZone) === 0 ? -35 : col(keeperZone) === 2 ? 35 : 0}deg)` : "translateX(-50%)" }}>
              <svg width="48" height="72" viewBox="0 0 48 72">
                <circle cx="24" cy="10" r="8" fill="#e0ac69" />
                <rect x="14" y="18" width="20" height="26" rx="5" fill="#facc15" />
                <rect x="4" y="18" width="10" height="7" rx="3" fill="#facc15" transform={keeperZone !== null ? "rotate(-40 9 21)" : ""} />
                <rect x="34" y="18" width="10" height="7" rx="3" fill="#facc15" transform={keeperZone !== null ? "rotate(40 39 21)" : ""} />
                <rect x="15" y="44" width="8" height="24" rx="3" fill="#1e293b" />
                <rect x="25" y="44" width="8" height="24" rx="3" fill="#1e293b" />
              </svg>
            </div>
            {/* نواحی شوت */}
            {!busy && ZONES.map((z, i) => (
              <button key={i}
                className="absolute w-[92px] h-[54px] -translate-x-1/2 rounded-lg border-2 border-yellow-300/0 hover:border-yellow-300/80 hover:bg-yellow-300/10 z-20"
                style={{ left: `calc(50% + ${z.x}px)`, top: `${row(i) === 0 ? 8 : 68}px` }}
                onClick={() => (mode === "solo" ? soloShoot(i) : shoot(i, secretDive!))} />
            ))}
          </div>
          {/* توپ */}
          <div className="pen-ball absolute left-1/2 bottom-[26px] -translate-x-1/2 text-4xl z-10"
            style={{ transform: ballZone !== null ? `translate(calc(-50% + ${ZONES[ballZone].x}px), ${-175 + ZONES[ballZone].y * 0.55}px) scale(.45)` : "translateX(-50%)" }}>
            ⚽
          </div>
          {/* نتیجه */}
          {result && (
            <div className="absolute inset-0 z-30 flex items-center justify-center">
              <div className={`goal-flash text-5xl font-black drop-shadow-2xl ${result === "goal" ? "text-yellow-300" : "text-rose-400"}`}>
                {result === "goal" ? "⚽ گــــل!" : "🧤 مهار شد!"}
              </div>
            </div>
          )}
          <div className="absolute bottom-2 inset-x-0 text-center text-[11px] font-bold text-white/90 z-20">
            {busy ? "..." : `${shooterName} — روی یکی از نقاط دروازه کلیک کن! 🎯`}
          </div>
        </div>
      )}
      {!finished && <button className="btn-ghost px-4 py-1.5 text-xs mt-3" onClick={() => setMode("menu")}>خروج ↩️</button>}
    </div>
  );
}
