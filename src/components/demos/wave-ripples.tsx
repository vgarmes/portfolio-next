"use client";

import { useState } from "react";
import {
  DEFAULT_WAVE_SETTINGS,
  WaveMark,
  type WaveSettings,
} from "@/components/wave-mark";
import { Demo } from "../demo";

/** A large wave with sliders for every ripple setting, for finding the balance. */

interface Control {
  key: keyof WaveSettings;
  label: string;
  min: number;
  max: number;
  step: number;
}

const GROUPS: { title: string; controls: Control[] }[] = [
  {
    title: "Click shockwave",
    controls: [
      { key: "shock", label: "Strength", min: 0, max: 6, step: 0.1 },
      { key: "shockSpeed", label: "Speed", min: 0.5, max: 8, step: 0.1 },
      { key: "shockLife", label: "Life (s)", min: 0.1, max: 3, step: 0.05 },
      { key: "shockWidth", label: "Width", min: 0.05, max: 1, step: 0.05 },
    ],
  },
  {
    title: "Origin kick",
    controls: [
      { key: "kick", label: "Strength", min: 0, max: 4, step: 0.1 },
      { key: "kickSpeed", label: "Speed", min: 0, max: 8, step: 0.1 },
      { key: "settle", label: "Settle (s)", min: 0.2, max: 5, step: 0.1 },
      {
        key: "linger",
        label: "Old origin fade (s)",
        min: 0.2,
        max: 6,
        step: 0.1,
      },
    ],
  },
  {
    title: "Hover",
    controls: [
      { key: "hover", label: "Depth", min: 0, max: 3, step: 0.1 },
      { key: "hoverRadius", label: "Radius", min: 0.1, max: 1.5, step: 0.05 },
    ],
  },
  {
    title: "Water",
    controls: [
      { key: "speed", label: "Ripple speed", min: 0.2, max: 5, step: 0.1 },
      { key: "density", label: "Ripple density", min: 4, max: 30, step: 0.5 },
    ],
  },
];

const CONTROLS = GROUPS.flatMap((group) => group.controls);

const decimals = (step: number) => (step >= 1 ? 0 : step >= 0.1 ? 1 : 2);

export function WaveRipplesDemo() {
  const [settings, setSettings] = useState<WaveSettings>(DEFAULT_WAVE_SETTINGS);
  const changed = CONTROLS.some(
    ({ key }) => settings[key] !== DEFAULT_WAVE_SETTINGS[key],
  );

  return (
    <Demo>
      <div className="flex w-full max-w-md flex-col gap-6">
        <WaveMark className="w-full" settings={settings} />
        <div className="grid gap-5 text-sm">
          {GROUPS.map(({ title, controls }) => (
            <fieldset key={title} className="grid gap-2">
              <legend className="mb-2 font-medium">{title}</legend>
              {controls.map(({ key, label, min, max, step }) => (
                <label
                  key={key}
                  className="grid grid-cols-[9rem_1fr_3rem] items-center gap-3"
                >
                  <span className="text-muted-foreground">{label}</span>
                  <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={settings[key]}
                    onChange={(event) =>
                      setSettings((current) => ({
                        ...current,
                        [key]: Number(event.target.value),
                      }))
                    }
                    className="accent-current"
                  />
                  <output className="text-right tabular-nums">
                    {settings[key].toFixed(decimals(step))}
                  </output>
                </label>
              ))}
            </fieldset>
          ))}
        </div>
        <div className="flex items-center justify-between gap-3 text-xs">
          <code className="text-muted-foreground truncate">
            {CONTROLS.map(({ key }) => `${key}: ${settings[key]}`).join(", ")}
          </code>
          <button
            type="button"
            disabled={!changed}
            onClick={() => setSettings(DEFAULT_WAVE_SETTINGS)}
            className="shrink-0 cursor-pointer rounded border px-2 py-1 disabled:cursor-default disabled:opacity-40"
          >
            Reset
          </button>
        </div>
      </div>
    </Demo>
  );
}
