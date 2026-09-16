import { useMemo, useState } from "react";
import { QUIZ, fmt } from "../data";
import { useGame } from "../store";
import { Chip, SectionTitle } from "../ui";

const today = () => new Date().toISOString().slice(0, 10);

// ================= کوئیز روزانه =================
export function Quiz() {
  const g = useGame();
  const done = g.lastQuiz === today();
  const qs = useMemo(() => {
    const seed = Number(today().replace(/-/g, "")) % 1000;
    const idxs: number[] = [];
    for (let i = 0; i < 5; i++) idxs.push((seed * 7 + i * 13 + i * i * 3) % QUIZ.length);
    return [...new Set(idxs)].slice(0, 5).map(i => QUIZ[i]);
  }, []);
  const [i, setI] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [over, setOver] = useState(false);
  const [reward, setReward] = useState(0);

  if (done && !over) {
    return (
      <div>
        <SectionTitle icon="🧠">کوئیز روزانه فوتبال</SectionTitle>
        <div className="panel p-6 text-center">
          <div className="text-5xl mb-2">✅</div>
          <div className="font-black">کوئیز امروز را حل کرده‌ای!</div>
          <p className="text-xs text-white/60 mt-2">فردا با ۵ سوال جدید برگرد. هر پاسخ درست ۳۰۰ سکه! 🌙</p>
        </div>
      </div>
    );
  }

  const answer = (a: number) => {
    if (picked !== null) return;
    setPicked(a);
    const ok = a === qs[i].c;
    if (ok) setCorrect(c => c + 1);
    setTimeout(() => {
      if (i + 1 >= qs.length) {
        const total = correct + (ok ? 1 : 0);
        setReward(g.finishQuiz(total));
        setOver(true);
      } else { setI(i + 1); setPicked(null); }
    }, 900);
  };

  return (
    <div>
      <SectionTitle icon="🧠">کوئیز روزانه فوتبال</SectionTitle>
      {over ? (
        <div className="panel p-6 text-center pop-in">
          <div className="text-5xl mb-2">{correct >= 4 ? "🏆" : correct >= 2 ? "👏" : "📚"}</div>
          <div className="font-black text-lg gold-text">{fmt(correct)} پاسخ درست از ۵</div>
          <div className="text-sm text-white/70 mt-1">پاداش: {fmt(reward)} سکه {correct === 5 ? "+ ۵ الماس 💎" : ""}</div>
        </div>
      ) : (
        <div className="panel p-5">
          <div className="flex justify-between text-xs mb-3">
            <Chip color="bg-blue-700/60">سوال {fmt(i + 1)} از ۵</Chip>
            <Chip>درست‌ها: {fmt(correct)}</Chip>
          </div>
          <div className="font-black text-sm leading-7 mb-4">{qs[i].q}</div>
          <div className="grid gap-2">
            {qs[i].a.map((opt, ai) => (
              <button key={ai} onClick={() => answer(ai)}
                className={`text-right px-4 py-3 rounded-xl text-sm font-bold border transition-colors
                  ${picked === null ? "border-white/15 bg-white/5 hover:bg-white/10"
                    : ai === qs[i].c ? "border-emerald-400 bg-emerald-500/20 text-emerald-300"
                    : ai === picked ? "border-rose-400 bg-rose-500/20 text-rose-300" : "border-white/10 bg-white/5 opacity-50"}`}>
                {opt} {picked !== null && ai === qs[i].c && "✅"}{picked === ai && ai !== qs[i].c && " ❌"}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ================= تنظیمات =================
export function Settings() {
  const g = useGame();
  const [code, setCode] = useState("");
  const [restore, setRestore] = useState("");
  const [msg, setMsg] = useState("");
  const flash = (t: string) => { setMsg(t); setTimeout(() => setMsg(""), 3000); };

  const backup = () => {
    const raw = localStorage.getItem("smb-pro-save-v1") || "";
    const b64 = btoa(unescape(encodeURIComponent(raw)));
    navigator.clipboard?.writeText(b64).catch(() => {});
    setRestore(b64);
    flash("کد پشتیبان ساخته و کپی شد! آن را جای امن نگه دار 🔐");
  };
  const doRestore = () => {
    try {
      const raw = decodeURIComponent(escape(atob(restore.trim())));
      JSON.parse(raw);
      localStorage.setItem("smb-pro-save-v1", raw);
      location.reload();
    } catch { flash("کد پشتیبان نامعتبر است! ❌"); }
  };

  return (
    <div>
      <SectionTitle icon="⚙️">تنظیمات و حساب کاربری</SectionTitle>
      {msg && <div className="panel p-3 mb-3 text-sm font-bold text-yellow-300 pop-in">{msg}</div>}

      <div className="grid sm:grid-cols-2 gap-3">
        {/* پروفایل */}
        <div className="panel p-4">
          <h3 className="font-black text-sm mb-2 text-yellow-200">👤 پروفایل سرمربی</h3>
          <div className="text-xs space-y-1.5 text-white/80">
            <div>سرمربی: <b>{g.manager}</b></div>
            <div>باشگاه: <b>{g.club}</b></div>
            <div>سطح: <b className="text-yellow-300">{fmt(Math.floor(g.xp / 500) + 1)}</b> (XP: {fmt(g.xp)})</div>
            <div className="flex items-center gap-2 flex-wrap">
              شناسه دستگاه:
              <code className="bg-black/40 px-2 py-0.5 rounded text-[10px] text-cyan-300" dir="ltr">{g.deviceId}</code>
              <button className="btn-ghost px-2 py-0.5 text-[10px]" onClick={() => { navigator.clipboard?.writeText(g.deviceId); flash("کپی شد! 📋"); }}>کپی</button>
            </div>
          </div>
          <div className="mt-3 text-[10px] text-white/50 leading-5">
            🛡️ این شناسه برای بازیابی اکانت است. همراه کد پشتیبان نگه‌داری کن.
          </div>
        </div>

        {/* VIP */}
        <div className={`panel p-4 ${g.vip ? "ring-1 ring-fuchsia-400/60" : ""}`}>
          <h3 className="font-black text-sm mb-2 text-fuchsia-300">👑 عضویت VIP</h3>
          {g.vip ? (
            <div className="text-xs text-white/80 leading-6">
              ✨ تو عضو VIP هستی! <br />• پاداش‌های سکه ۱.۵ برابر <br />• دسترسی به پک الهی <br />• نشان طلایی کنار نام باشگاه
            </div>
          ) : (
            <>
              <p className="text-[11px] text-white/70 leading-5 mb-2">
                با خرید VIP: پاداش سکه ×۱.۵، پک الهی، ۵۰,۰۰۰ سکه و ۲۰۰ الماس هدیه!
              </p>
              <a href="https://rubika.ir/ZODIAC_MAFIANIGHTS" target="_blank" rel="noreferrer"
                className="btn-gold block text-center py-2 text-sm mb-2">💳 خرید VIP از روبیکا</a>
              <div className="flex gap-2">
                <input value={code} onChange={e => setCode(e.target.value)} placeholder="کد فعال‌سازی..."
                  className="flex-1 bg-black/40 border border-white/15 rounded-lg px-3 py-1.5 text-xs" dir="ltr" />
                <button className="btn-blue px-4 py-1.5 text-xs"
                  onClick={() => flash(g.activateVip(code) ? "VIP فعال شد! خوش آمدی 👑" : "کد اشتباه است! پس از پرداخت، کد برایت ارسال می‌شود.")}>فعال‌سازی</button>
              </div>
            </>
          )}
        </div>

        {/* پشتیبان‌گیری */}
        <div className="panel p-4 sm:col-span-2">
          <h3 className="font-black text-sm mb-2 text-cyan-300">💾 پشتیبان‌گیری و بازیابی اکانت</h3>
          <div className="flex gap-2 mb-2 flex-wrap">
            <button className="btn-blue px-4 py-1.5 text-xs" onClick={backup}>📤 ساخت کد پشتیبان</button>
            <button className="btn-gold px-4 py-1.5 text-xs" onClick={doRestore} disabled={!restore.trim()}>📥 بازیابی از کد</button>
          </div>
          <textarea value={restore} onChange={e => setRestore(e.target.value)} rows={3} dir="ltr"
            placeholder="کد پشتیبان را اینجا بچسبان..."
            className="w-full bg-black/40 border border-white/15 rounded-lg p-2 text-[10px] text-cyan-200" />
        </div>

        {/* آمار و افتخارات */}
        <div className="panel p-4">
          <h3 className="font-black text-sm mb-2 text-emerald-300">📊 آمار کل</h3>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-white/5 rounded-lg p-2"><div className="font-black text-emerald-300">{fmt(g.stats.w)}</div>برد</div>
            <div className="bg-white/5 rounded-lg p-2"><div className="font-black text-yellow-300">{fmt(g.stats.d)}</div>مساوی</div>
            <div className="bg-white/5 rounded-lg p-2"><div className="font-black text-rose-300">{fmt(g.stats.l)}</div>باخت</div>
            <div className="bg-white/5 rounded-lg p-2"><div className="font-black">{fmt(g.stats.gf)}</div>گل زده</div>
            <div className="bg-white/5 rounded-lg p-2"><div className="font-black">{fmt(g.stats.ga)}</div>گل خورده</div>
            <div className="bg-white/5 rounded-lg p-2"><div className="font-black">{fmt(g.stats.packs)}</div>پک باز شده</div>
          </div>
        </div>
        <div className="panel p-4">
          <h3 className="font-black text-sm mb-2 text-yellow-300">🏆 افتخارات</h3>
          {g.trophies.length ? (
            <ul className="text-xs space-y-1">{g.trophies.map((t, i) => <li key={i}>{t}</li>)}</ul>
          ) : <div className="text-xs text-white/40">هنوز جامی نگرفته‌ای — برو بجنگ قهرمان! 💪</div>}
        </div>

        <div className="panel p-4 sm:col-span-2 flex gap-2 flex-wrap">
          <button className="btn-ghost px-4 py-2 text-xs" onClick={() => useGame.setState({ tutorialDone: false })}>🎓 نمایش دوباره آموزش</button>
          <button className="btn-ghost px-4 py-2 text-xs border-rose-400/40 text-rose-300"
            onClick={() => { if (confirm("همه پیشرفت پاک می‌شود! مطمئنی؟")) { localStorage.removeItem("smb-pro-save-v1"); location.reload(); } }}>
            🗑️ شروع مجدد بازی
          </button>
        </div>
      </div>
    </div>
  );
}
