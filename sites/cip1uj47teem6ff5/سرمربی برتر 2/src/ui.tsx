import React from "react";
import { POS_COLOR, POS_FA, fmt, tierOf } from "./data";
import { Player, effRating } from "./engine";

// ---------- آیکون‌های SVG داخلی ----------
export const CoinIcon = ({ s = 16 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" className="inline-block">
    <circle cx="12" cy="12" r="10" fill="url(#gc)" stroke="#8a6508" strokeWidth="1.5" />
    <text x="12" y="16.5" textAnchor="middle" fontSize="12" fontWeight="900" fill="#7c5804">$</text>
    <defs><linearGradient id="gc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffe9a3" /><stop offset="1" stopColor="#eab308" /></linearGradient></defs>
  </svg>
);
export const GemIcon = ({ s = 16 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" className="inline-block">
    <path d="M6 3h12l4 6-10 12L2 9l4-6z" fill="url(#gg)" stroke="#0e7490" strokeWidth="1" />
    <path d="M2 9h20M9 3l3 6 3-6M12 9v12" stroke="#a5f3fc" strokeWidth=".8" opacity=".7" />
    <defs><linearGradient id="gg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#67e8f9" /><stop offset="1" stopColor="#0891b2" /></linearGradient></defs>
  </svg>
);
export const BallIcon = ({ s = 18 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" className="inline-block">
    <circle cx="12" cy="12" r="10" fill="#f8fafc" stroke="#1e293b" />
    <path d="M12 7l4.7 3.4-1.8 5.6H9.1L7.3 10.4 12 7z" fill="#1e293b" />
    <path d="M12 2v5M4.7 6.5l2.6 3.9M2.5 14.6l4.8-.6M8 21.4l1.1-5.4M16 21.4l-1.1-5.4M21.5 14.6l-4.8-.6M19.3 6.5l-2.6 3.9" stroke="#1e293b" strokeWidth=".9" fill="none" />
  </svg>
);

// آواتار SVG بازیکن (بدون تصویر خارجی)
export const PlayerAvatar = ({ seed, size = 44 }: { seed: number; size?: number }) => {
  const skins = ["#f2c9a0", "#e0ac69", "#c68642", "#8d5524", "#f5d3b3"];
  const hairs = ["#1c1008", "#3d2314", "#0f0f0f", "#5c3a1e", "#2b2b2b", "#6b7280"];
  const skin = skins[seed % skins.length];
  const hair = hairs[(seed * 7) % hairs.length];
  const hairStyle = seed % 3;
  return (
    <svg width={size} height={size} viewBox="0 0 48 48">
      <circle cx="24" cy="18" r="10" fill={skin} />
      {hairStyle === 0 && <path d="M14 16c0-7 20-7 20 0v-2c0-9-20-9-20 0z" fill={hair} />}
      {hairStyle === 1 && <path d="M13 17c-1-10 23-10 22 0-2-5-6-7-11-7s-9 2-11 7z" fill={hair} />}
      {hairStyle === 2 && <ellipse cx="24" cy="10.5" rx="10" ry="4.5" fill={hair} />}
      <path d="M8 46c1-11 8-15 16-15s15 4 16 15z" fill={`hsl(${(seed * 37) % 360} 55% 42%)`} />
      <path d="M20 32l4 5 4-5" fill="#fff" opacity=".9" />
    </svg>
  );
};

// ---------- کارت بازیکن ----------
export function PlayerCard({ p, size = "md", onClick, selected, dim }: {
  p: Player; size?: "sm" | "md" | "lg"; onClick?: () => void; selected?: boolean; dim?: boolean;
}) {
  const r = effRating(p);
  const t = tierOf(r);
  const big = size === "lg";
  const sm = size === "sm";
  const w = sm ? "w-20" : big ? "w-40" : "w-28";
  const shine = r >= 80;
  return (
    <div
      onClick={onClick}
      className={`${w} shrink-0 no-select ${onClick ? "cursor-pointer active:scale-95 transition-transform" : ""} ${dim ? "opacity-40" : ""}`}
      style={{ ["--glow" as string]: t.glow }}
    >
      <div className={`relative bg-gradient-to-br ${t.grad} rounded-xl ${sm ? "p-1.5" : big ? "p-3" : "p-2"} ring-2 ${t.ring} ${shine ? "card-shine" : ""} ${selected ? "outline outline-2 outline-offset-2 outline-yellow-300" : ""} ${r >= 89 ? "glow-pulse" : ""} shadow-lg`}>
        <div className="flex items-start justify-between">
          <div className={`${t.text} font-black leading-none ${sm ? "text-sm" : big ? "text-3xl" : "text-xl"}`}>{r}</div>
          <span className={`${sm ? "text-[9px]" : "text-[10px]"} font-bold px-1 rounded ${POS_COLOR[p.pos]} text-white`}>{p.pos}</span>
        </div>
        <div className="flex justify-center my-0.5">
          <PlayerAvatar seed={p.id} size={sm ? 30 : big ? 66 : 44} />
        </div>
        <div className={`${t.text} text-center font-bold truncate ${sm ? "text-[9px]" : big ? "text-sm" : "text-[11px]"}`}>{p.name}</div>
        <div className={`flex items-center justify-center gap-1 ${sm ? "text-[8px]" : "text-[10px]"} ${t.text} opacity-90`}>
          <span>{p.nation}</span>
          {!sm && <span className="truncate max-w-16">{p.club}</span>}
        </div>
        <div className={`text-center ${sm ? "text-[8px]" : "text-[9px]"} font-bold mt-0.5 ${t.text} bg-black/20 rounded-full px-1`}>{t.name}{p.boost > 0 ? ` +${p.boost}` : ""}</div>
        {!sm && (
          <div className="mt-1 h-1 rounded-full bg-black/30 overflow-hidden">
            <div className={`h-full ${p.energy > 60 ? "bg-emerald-400" : p.energy > 30 ? "bg-yellow-400" : "bg-red-500"}`} style={{ width: `${p.energy}%` }} />
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- مودال ----------
export function Modal({ children, onClose, wide }: { children: React.ReactNode; onClose?: () => void; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className={`panel pop-in w-full ${wide ? "max-w-2xl" : "max-w-md"} max-h-[88vh] overflow-y-auto p-4`} onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

export const SectionTitle = ({ icon, children }: { icon: string; children: React.ReactNode }) => (
  <div className="flex items-center gap-2 mb-3">
    <span className="text-xl">{icon}</span>
    <h2 className="text-lg font-black gold-text">{children}</h2>
    <div className="flex-1 divider-gold" />
  </div>
);

export const Chip = ({ children, color = "bg-white/10" }: { children: React.ReactNode; color?: string }) => (
  <span className={`${color} text-[11px] px-2 py-0.5 rounded-full font-bold`}>{children}</span>
);

export function Confetti() {
  const colors = ["#f5c542", "#4f8cff", "#34d399", "#fb7185", "#e879f9", "#fff"];
  return (
    <>
      {Array.from({ length: 40 }).map((_, i) => (
        <div key={i} className="confetti" style={{
          left: `${(i * 53) % 100}%`,
          background: colors[i % colors.length],
          animationDuration: `${2 + (i % 5) * 0.5}s`,
          animationDelay: `${(i % 10) * 0.15}s`,
        }} />
      ))}
    </>
  );
}

export const posLabel = (p: Player) => `${POS_FA[p.pos]} • ${p.nation}`;
export const money = (n: number) => <span className="inline-flex items-center gap-1">{fmt(n)} <CoinIcon s={13} /></span>;
