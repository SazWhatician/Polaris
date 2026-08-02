"use client";

import { useTheme } from "next-themes";
import { useEffect, useState, useId } from "react";

const THEME_OPTIONS = [
  { id: "dark", label: "DK", angle: -60, radioClass: "radio1", containerClass: "radioContainer1" },
  { id: "light", label: "LT", angle: -35, radioClass: "radio2", containerClass: "radioContainer2" },
  { id: "theme-gold", label: "GL", angle: 0, radioClass: "radio3", containerClass: "radioContainer3" },
  { id: "theme-emerald", label: "EM", angle: 35, radioClass: "radio4", containerClass: "radioContainer4" },
  { id: "theme-sapphire", label: "SP", angle: 60, radioClass: "radio5", containerClass: "radioContainer5" },
];

/**
 * Skeuomorphic Radio Knob Theme Switcher (Uiverse.io by Subaashbala)
 * Stibob & Arbob Collaboration: Ultra tactile physical knob switch with click rotation & label select.
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const instanceId = useId();

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const currentIndex = THEME_OPTIONS.findIndex((t) => t.id === theme);
  const activeIdx = currentIndex >= 0 ? currentIndex : 0;
  const currentOption = THEME_OPTIONS[activeIdx]!;

  const handleKnobClick = () => {
    const nextIdx = (activeIdx + 1) % THEME_OPTIONS.length;
    setTheme(THEME_OPTIONS[nextIdx]!.id);
  };

  return (
    <div
      className="radio-input skeuo-card p-1.5 flex items-center justify-center select-none shadow-2xl border border-white/25 z-30 transition-transform active:scale-95 cursor-pointer"
      title="Click Knob or Label to Turn Theme Dial"
    >
      <div className="radio-input-path">
        {THEME_OPTIONS.map((item) => {
          const inputId = `${instanceId}-${item.id}`;
          const isChecked = theme === item.id;
          return (
            <div
              key={item.id}
              onClick={(e) => {
                e.stopPropagation();
                setTheme(item.id);
              }}
              className={`radioContainer ${item.containerClass} cursor-pointer hover:scale-110 transition-transform`}
            >
              <label htmlFor={inputId} className="cursor-pointer">
                {item.label}
              </label>
              <input
                className={`${item.radioClass} cursor-pointer`}
                value={item.id}
                name={`theme-radio-${instanceId}`}
                id={inputId}
                type="radio"
                checked={isChecked}
                onChange={() => setTheme(item.id)}
              />
            </div>
          );
        })}
      </div>

      {/* Rotating Knob — Click to cycle to next theme */}
      <div
        onClick={handleKnobClick}
        className="knob cursor-pointer transition-transform duration-300 ease-out hover:brightness-110"
        style={{ transform: `translateX(-50%) rotateZ(${currentOption.angle}deg)` }}
      >
        <div className="center"></div>
      </div>
    </div>
  );
}
