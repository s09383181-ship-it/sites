import { useEffect, useState } from "react";
import { TUTORIAL_STEPS, fmt } from "./data";
import { useGame } from "./store";
import { CoinIcon, Confetti, GemIcon, Modal } from "./ui";
import Home from "./screens/Home";
import Squad from "./screens/Squad";
import Packs from "./screens/Packs";
import Market from "./screens/Market";
import Training from "./screens/Training";
import League from "./screens/League";
import WorldCup from "./screens/WorldCup";
import Penalty from "./screens/Penalty";
import MatchScreen from "./screens/Match";
import { Quiz, Settings } from "./screens/Extras";

const NAV = [
  { id: "home", icon: "🏠", t: "خانه" },
  { id: "squad", icon: "⚽", t: "ترکیب" },
  { id: "packs", icon: "🃏", t: "پک" },
  { id: "market", icon: "💰", t: "بازار" },
  { id: "league", icon: "🏟️", t: "لیگ" },
  { id: "wc", icon: "🌍", t: "جام" },
  { id: "training", icon: "🏋️", t: "تمرین" },
  { id: "penalty", icon: "🥅", t: "پنالتی" },
  { id: "quiz", icon: "🧠", t: "کوئیز" },
  { id: "settings", icon: "⚙️", t: "تنظیمات" },
];

function Onboarding() {
  const g = useGame();
  const [name, setName] = useState("");
  const [club, setClub] = useState("");
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="panel max-w-md w-full p-6 text-center pop-in">
        <div className="text-6xl mb-2 float-y">🏆</div>
        <h1 className="text-3xl font-black gold-text mb-1">سرمربی برتر PRO</h1>
        <p className="text-xs text-white/60 mb-5">بازی مدیریت فوتبال حرفه‌ای — پک بزن، ستاره بساز، جام بگیر!</p>
        <div className="space-y-3 text-right">
          <div>
            <label className="text-xs font-bold text-yellow-200 block mb-1">نام سرمربی 🧑‍💼</label>
            <input value={name} onChange={e => setName(e.target.value)} maxLength={18} placeholder="مثلاً: امیر قهرمان"
              className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-2.5 text-sm focus:border-yellow-400/70" />
          </div>
          <div>
            <label className="text-xs font-bold text-yellow-200 block mb-1">نام باشگاه ⚽</label>
            <input value={club} onChange={e => setClub(e.target.value)} maxLength={18} placeholder="مثلاً: شاهین طلایی"
              className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-2.5 text-sm focus:border-yellow-400/70" />
          </div>
        </div>
        <button className="btn-gold w-full py-3 mt-5 text-base disabled:opacity-40" disabled={!name.trim() || !club.trim()}
          onClick={() => g.newGame(name.trim(), club.trim())}>
          🚀 شروع ماجراجویی
        </button>
        <div className="text-[10px] text-white/40 mt-3">هدیه شروع: ۲۰,۰۰۰ سکه + ۶۰ الماس + ۱۸ بازیکن</div>
      </div>
    </div>
  );
}

function Tutorial() {
  const g = useGame();
  const [step, setStep] = useState(0);
  const s = TUTORIAL_STEPS[step];
  return (
    <Modal>
      <div className="text-center">
        <div className="text-5xl mb-2">{s.icon}</div>
        <h3 className="font-black text-lg gold-text mb-2">{s.title}</h3>
        <p className="text-xs text-white/75 leading-6 mb-4">{s.text}</p>
        <div className="flex justify-center gap-1 mb-4">
          {TUTORIAL_STEPS.map((_, i) => <div key={i} className={`w-2 h-2 rounded-full ${i === step ? "bg-yellow-400" : "bg-white/20"}`} />)}
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost flex-1 py-2 text-xs" onClick={g.finishTutorial}>رد شدن</button>
          {step > 0 && <button className="btn-ghost flex-1 py-2 text-xs" onClick={() => setStep(step - 1)}>قبلی</button>}
          <button className="btn-gold flex-1 py-2 text-xs"
            onClick={() => (step + 1 >= TUTORIAL_STEPS.length ? g.finishTutorial() : setStep(step + 1))}>
            {step + 1 >= TUTORIAL_STEPS.length ? "بزن بریم! 🚀" : "بعدی"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function App() {
  const g = useGame();
  const [tab, setTab] = useState("home");

  useEffect(() => { g.dailyTick(); }, []);

  if (!g.started) return <Onboarding />;

  const win = g.lastResult && g.lastResult.mg > g.lastResult.og;

  return (
    <div className="min-h-screen pb-20">
      {/* هدر */}
      <header className="sticky top-0 z-30 bg-[#0a1228]/90 backdrop-blur border-b border-yellow-400/15">
        <div className="max-w-5xl mx-auto px-3 py-2 flex items-center gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-2xl">🏆</span>
            <div className="min-w-0">
              <div className="font-black text-sm gold-text leading-4 truncate">سرمربی برتر PRO</div>
              <div className="text-[9px] text-white/50 truncate">{g.club} {g.vip && "👑"}</div>
            </div>
          </div>
          <div className="mr-auto flex items-center gap-2 text-xs font-black">
            <span className="bg-black/40 border border-yellow-400/30 rounded-full px-3 py-1 flex items-center gap-1">
              {fmt(g.coins)} <CoinIcon s={13} />
            </span>
            <span className="bg-black/40 border border-cyan-400/30 rounded-full px-3 py-1 flex items-center gap-1">
              {fmt(g.gems)} <GemIcon s={13} />
            </span>
            <span className="hidden sm:flex bg-black/40 border border-white/15 rounded-full px-3 py-1 items-center gap-1">
              ⭐ سطح {fmt(Math.floor(g.xp / 500) + 1)}
            </span>
          </div>
        </div>
      </header>

      {/* محتوا */}
      <main className="max-w-5xl mx-auto p-3">
        {tab === "home" && <Home nav={setTab} />}
        {tab === "squad" && <Squad />}
        {tab === "packs" && <Packs />}
        {tab === "market" && <Market />}
        {tab === "league" && <League />}
        {tab === "wc" && <WorldCup />}
        {tab === "training" && <Training />}
        {tab === "penalty" && <Penalty />}
        {tab === "quiz" && <Quiz />}
        {tab === "settings" && <Settings />}
      </main>

      {/* نوار ناوبری */}
      <nav className="fixed bottom-0 inset-x-0 z-30 bg-[#0a1228]/95 backdrop-blur border-t border-yellow-400/15">
        <div className="max-w-5xl mx-auto flex overflow-x-auto no-scrollbar">
          {NAV.map(n => (
            <button key={n.id} onClick={() => setTab(n.id)}
              className={`flex-1 min-w-16 py-2 text-center transition-colors ${tab === n.id ? "text-yellow-300" : "text-white/50 hover:text-white/80"}`}>
              <div className={`text-xl ${tab === n.id ? "scale-110" : ""} transition-transform`}>{n.icon}</div>
              <div className="text-[9px] font-bold mt-0.5">{n.t}</div>
              {tab === n.id && <div className="h-0.5 w-8 mx-auto mt-1 rounded-full bg-yellow-400" />}
            </button>
          ))}
        </div>
      </nav>

      {/* مسابقه زنده */}
      {g.match && <MatchScreen />}

      {/* نتیجه مسابقه */}
      {g.lastResult && (
        <>
          {win && <Confetti />}
          <Modal onClose={g.clearResult}>
            <div className="text-center">
              <div className="text-5xl mb-2">{win ? "🎉" : g.lastResult.mg === g.lastResult.og ? "🤝" : "😔"}</div>
              <div className="text-3xl font-black gold-text" dir="ltr">{fmt(g.lastResult.mg)} - {fmt(g.lastResult.og)}</div>
              <div className="font-black mt-1">{win ? "پیروزی شیرین!" : g.lastResult.mg === g.lastResult.og ? "تساوی" : "شکست — دفعه بعد جبران کن!"}</div>
              <div className="text-xs text-yellow-300 mt-2">+{fmt(g.lastResult.coins)} سکه {g.vip && "(×۱.۵ VIP)"}</div>
              {g.lastResult.note && <div className="text-xs text-emerald-300 font-bold mt-2 leading-6">{g.lastResult.note}</div>}
              <button className="btn-gold px-8 py-2.5 mt-4" onClick={g.clearResult}>ادامه 💪</button>
            </div>
          </Modal>
        </>
      )}

      {/* آموزش */}
      {!g.tutorialDone && <Tutorial />}
    </div>
  );
}
