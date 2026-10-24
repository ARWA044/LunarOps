"use client";

import React, { useState, useEffect, useRef } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { soundEngine } from "@/lib/sound-engine";

export function SoundWidget() {
  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolume] = useState(0.4);
  const [showSlider, setShowSlider] = useState(false);
  const animRef = useRef<number | null>(null);
  const [barHeights, setBarHeights] = useState<number[]>([4, 6, 8, 5, 3]);

  useEffect(() => {
    if (!soundEngine) return;
    setIsMuted(soundEngine.getIsMuted());
    setVolume(soundEngine.getVolume());

    const dataArray = new Uint8Array(16);

    const updateVisualizer = () => {
      soundEngine.getVisualizerData(dataArray);
      if (!soundEngine.getIsMuted()) {
        const h0 = Math.max(3, (dataArray[1] / 255) * 14);
        const h1 = Math.max(3, (dataArray[2] / 255) * 16);
        const h2 = Math.max(3, (dataArray[4] / 255) * 18);
        const h3 = Math.max(3, (dataArray[6] / 255) * 15);
        const h4 = Math.max(3, (dataArray[8] / 255) * 12);
        setBarHeights([h0, h1, h2, h3, h4]);
      } else {
        setBarHeights([2, 2, 2, 2, 2]);
      }
      animRef.current = requestAnimationFrame(updateVisualizer);
    };

    animRef.current = requestAnimationFrame(updateVisualizer);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  const handleToggle = () => {
    if (!soundEngine) return;
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (soundEngine) {
      soundEngine.setVolume(val);
      if (isMuted && val > 0) {
        const muted = soundEngine.toggleMute();
        setIsMuted(muted);
      }
    }
  };

  return (
    <div
      className="relative flex items-center glass-panel rounded-xl px-2.5 py-1.5 shadow-glass gap-2"
      onMouseEnter={() => setShowSlider(true)}
      onMouseLeave={() => setShowSlider(false)}
    >
      <button
        onClick={handleToggle}
        className={`flex items-center gap-1.5 text-xs font-mono transition-all ${
          !isMuted ? "text-amber-400 font-bold" : "text-slate-400 hover:text-white"
        }`}
        title={isMuted ? "Activate Space Audio & Drone" : "Mute Sound"}
      >
        {!isMuted ? <Volume2 className="w-3.5 h-3.5 text-amber-400 animate-pulse" /> : <VolumeX className="w-3.5 h-3.5" />}
        <span className="hidden lg:inline">{!isMuted ? "AUDIO ON" : "MUTED"}</span>
      </button>

      {/* Mini Audio Visualizer Wave */}
      <div className="flex items-end gap-0.5 h-4 w-7 px-0.5 justify-center">
        {barHeights.map((h, i) => (
          <span
            key={i}
            className={`w-0.5 rounded-full transition-all duration-75 ${
              !isMuted ? "bg-amber-400" : "bg-slate-600"
            }`}
            style={{ height: `${h}px` }}
          />
        ))}
      </div>

      {/* Popover volume slider on hover */}
      {showSlider && (
        <div className="absolute right-0 top-full mt-1.5 bg-space-950/90 backdrop-blur-xl border border-white/10 rounded-xl p-2.5 shadow-glass flex items-center gap-2 z-50">
          <span className="text-[10px] font-mono text-slate-400">VOL</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={handleVolumeChange}
            className="w-20 accent-amber-500 cursor-pointer h-1 bg-white/10 rounded"
          />
          <span className="text-[10px] font-mono text-amber-400 w-6 text-right">
            {Math.round(volume * 100)}%
          </span>
        </div>
      )}
    </div>
  );
}
