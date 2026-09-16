import { useState } from "react";
import { ALL_PLAYERS, fmt } from "../data";
import { effRating, makePlayer, valueOf } from "../engine";
import { useGame } from "../store";
import { Chip, CoinIcon, PlayerCard, SectionTitle } from "../ui";

export default function Market() {
  const g = useGame();
  const [tab, setTab] = useState<"buy" | "sell">("buy");
  const [msg, setMsg] = useState("");

  const flash = (t: string) => { setMsg(t); setTimeout(() => setMsg(""), 2500); };
  const items = g.marketPool.map(id => ALL_PLAYERS.find(p => p.id === id)!).filter(Boolean);
  const sellable = [...g.squad].sort((a, b) => effRating(b) - effRating(a));

  return (
    <div>
      <SectionTitle icon="💰">بازار نقل‌وانتقالات</SectionTitle>
      <div className="flex gap-2 mb-3">
        <button className={`flex-1 py-2 rounded-xl font-bold text-sm ${tab === "buy" ? "btn-gold" : "btn-ghost"}`} onClick={() => setTab("buy")}>🛒 خرید بازیکن</button>
        <button className={`flex-1 py-2 rounded-xl font-bold text-sm ${tab === "sell" ? "btn-gold" : "btn-ghost"}`} onClick={() => setTab("sell")}>📤 فروش بازیکن</button>
      </div>
      {msg && <div className="panel p-3 mb-3 text-sm font-bold text-yellow-300 pop-in">{msg}</div>}

      {tab === "buy" && (
        <>
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <Chip>لیست امروز بازار — هر روز نو می‌شود</Chip>
            {g.staff.scout > 0 && <Chip color="bg-emerald-700/50">تخفیف استعدادیاب: {fmt(g.staff.scout * 3)}٪</Chip>}
            <button className="btn-blue px-3 py-1 text-xs mr-auto" onClick={() => { g.refreshMarket(true); flash("لیست بازار تازه شد! 🔄"); }}>
              🔄 تازه‌سازی ({fmt(1000)} <CoinIcon s={11} />)
            </button>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {items.map(t => {
              const price = Math.round(valueOf(t.rating) * (1 - g.staff.scout * 0.03));
              const preview = makePlayer(t);
              return (
                <div key={t.id} className="text-center">
                  <PlayerCard p={preview} />
                  <button className="btn-gold w-full mt-1 py-1.5 text-[11px] flex items-center justify-center gap-1"
                    onClick={() => flash(g.buyPlayer(t.id) ? `${t.name} به تیم پیوست! ✅` : "سکه کافی نداری! ❌")}>
                    {fmt(price)} <CoinIcon s={11} />
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}

      {tab === "sell" && (
        <>
          <div className="panel p-3 mb-3 text-[11px] text-white/70 leading-6">
            ⚖️ <b className="text-yellow-300">قوانین ضد تقلب فدراسیون:</b> مالیات فروش <b className="text-rose-300">۳۰٪</b> است.
            حداقل <b>۱۵ بازیکن</b> باید در تیم بمانند و بازیکنانِ ترکیب اصلی قابل فروش نیستند.
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {sellable.map(p => {
              const inXI = g.lineup.includes(p.uid);
              const gain = Math.round(valueOf(p.rating + p.boost) * 0.7);
              return (
                <div key={p.uid} className="text-center">
                  <PlayerCard p={p} dim={inXI} />
                  <button disabled={inXI || g.squad.length <= 15}
                    className="btn-ghost w-full mt-1 py-1.5 text-[11px] disabled:opacity-30 flex items-center justify-center gap-1"
                    onClick={() => flash(g.sellPlayer(p.uid) ? `${p.name} فروخته شد (+${fmt(gain)} سکه پس از مالیات)` : "فروش ممکن نیست!")}>
                    {inXI ? "در ترکیب" : <>فروش {fmt(gain)} <CoinIcon s={11} /></>}
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
