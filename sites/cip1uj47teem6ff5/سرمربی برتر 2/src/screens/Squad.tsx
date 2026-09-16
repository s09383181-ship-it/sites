import { useState } from "react";
import { POS_FA, fmt } from "../data";
import { effRating } from "../engine";
import { useGame } from "../store";
import { Chip, Modal, PlayerCard, SectionTitle } from "../ui";

// موقعیت اسلات‌ها روی زمین (4-3-3)
const SLOTS = [
  { top: "88%", left: "50%", label: "GK" },
  { top: "70%", left: "12%", label: "DF" }, { top: "74%", left: "38%", label: "DF" },
  { top: "74%", left: "62%", label: "DF" }, { top: "70%", left: "88%", label: "DF" },
  { top: "48%", left: "25%", label: "MF" }, { top: "52%", left: "50%", label: "MF" }, { top: "48%", left: "75%", label: "MF" },
  { top: "22%", left: "18%", label: "FW" }, { top: "16%", left: "50%", label: "FW" }, { top: "22%", left: "82%", label: "FW" },
];

export default function Squad() {
  const g = useGame();
  const [pickSlot, setPickSlot] = useState<number | null>(null);
  const xi = g.lineup.map(id => g.squad.find(p => p.uid === id));
  const bench = g.squad.filter(p => !g.lineup.includes(p.uid)).sort((a, b) => effRating(b) - effRating(a));
  const str = g.myStrength();

  return (
    <div>
      <SectionTitle icon="⚽">ترکیب تیم {g.club}</SectionTitle>
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <Chip color="bg-blue-600/60">قدرت تیم: <b className="text-yellow-300">{fmt(Math.round(str))}</b></Chip>
        <Chip>بازیکنان: {fmt(g.squad.length)}</Chip>
        <Chip color="bg-emerald-700/50">سیستم 4-3-3</Chip>
        <button className="btn-blue px-3 py-1 text-xs mr-auto" onClick={g.autoLineup}>✨ چیدمان خودکار</button>
      </div>

      {/* زمین */}
      <div className="pitch w-full h-[480px] sm:h-[560px] mb-4">
        {SLOTS.map((s, i) => {
          const p = xi[i];
          return (
            <div key={i} className="absolute -translate-x-1/2 -translate-y-1/2 z-10" style={{ top: s.top, left: s.left }}>
              {p ? (
                <div onClick={() => setPickSlot(i)} className="cursor-pointer text-center active:scale-95 transition-transform">
                  <PlayerCard p={p} size="sm" />
                </div>
              ) : (
                <button onClick={() => setPickSlot(i)}
                  className="w-14 h-16 rounded-lg border-2 border-dashed border-white/60 bg-black/25 text-white/80 text-[10px] font-bold hover:bg-black/40">
                  + {s.label}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* نیمکت */}
      <SectionTitle icon="🪑">نیمکت و ذخیره‌ها ({fmt(bench.length)})</SectionTitle>
      <div className="flex gap-2 overflow-x-auto pb-3">
        {bench.map(p => <PlayerCard key={p.uid} p={p} size="sm" />)}
        {bench.length === 0 && <div className="text-white/40 text-sm">نیمکت خالی است — پک باز کن!</div>}
      </div>

      {pickSlot !== null && (
        <Modal onClose={() => setPickSlot(null)} wide>
          <h3 className="font-black gold-text mb-1">انتخاب بازیکن برای پست {SLOTS[pickSlot].label} ({POS_FA[SLOTS[pickSlot].label as keyof typeof POS_FA]})</h3>
          <p className="text-[11px] text-white/50 mb-2">بازیکن هم‌پست بهترین عملکرد را دارد. انتخاب از هر پستی آزاد است.</p>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 max-h-80 overflow-y-auto p-1">
            {[...g.squad].sort((a, b) => (b.pos === SLOTS[pickSlot].label ? 1 : 0) - (a.pos === SLOTS[pickSlot].label ? 1 : 0) || effRating(b) - effRating(a)).map(p => (
              <PlayerCard key={p.uid} p={p} size="sm" selected={g.lineup[pickSlot] === p.uid}
                dim={g.lineup.includes(p.uid) && g.lineup[pickSlot] !== p.uid}
                onClick={() => { g.setLineupSlot(pickSlot, p.uid); setPickSlot(null); }} />
            ))}
          </div>
          <button className="btn-ghost w-full py-2 mt-3 text-sm" onClick={() => setPickSlot(null)}>بستن</button>
        </Modal>
      )}
    </div>
  );
}
