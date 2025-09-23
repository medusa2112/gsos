'use client';
import React, { useMemo, useState } from 'react';

const SERVICES = [
  { id: 'web', label: 'Website & Portal' },
  { id: 'mobile', label: 'Mobile App' },
  { id: 'sis', label: 'SIS / Admissions' },
  { id: 'attendance', label: 'Attendance & Safeguarding' },
  { id: 'grading', label: 'Grading & Assessments' },
  { id: 'billing', label: 'Billing & Payments' },
  { id: 'comms', label: 'Messaging & Comms' },
  { id: 'automations', label: 'Automations (Tray.io)' },
  { id: 'reports', label: 'Reports & Analytics' },
];

const PRICE_BANDS: Record<string, [number, number]> = {
  web: [3000, 8000],
  mobile: [5000, 15000],
  sis: [7000, 25000],
  attendance: [2000, 6000],
  grading: [3000, 9000],
  billing: [2500, 8000],
  comms: [1500, 5000],
  automations: [2000, 10000],
  reports: [2500, 9000],
};

function money(n: number) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(n);
}

function useBudget(selected: string[]) {
  return useMemo(() => {
    if (!selected.length) return null;
    const low = selected.reduce((a, s) => a + (PRICE_BANDS[s]?.[0] ?? 0), 0);
    const high = selected.reduce((a, s) => a + (PRICE_BANDS[s]?.[1] ?? 0), 0);
    return [low, high] as const;
  }, [selected]);
}

function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`inline-flex items-center rounded-2xl border px-3 py-1 text-sm transition active:scale-[.98] ${value ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-50'}`}
      aria-pressed={value}
    >
      <span className="mr-2 inline-block h-4 w-7 rounded-full border transition-all">
        <span className={`block h-3.5 w-3.5 translate-x-0.5 rounded-full bg-current transition-all ${value ? 'translate-x-3' : ''}`} />
      </span>
      {label}
    </button>
  );
}

function ConsentModal({ open, onClose, onAccept }: { open: boolean; onClose: () => void; onAccept: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="mb-2 text-lg font-semibold">Share Approved Posts to Agency Socials</h3>
        <p className="mb-4 text-sm leading-6 text-gray-700">
          Tick to allow us to share only your explicitly <span className="font-medium">approved</span> posts on our social channels.
        </p>
        <div className="flex items-center justify-end gap-2">
          <button onClick={onClose} className="rounded-2xl border px-4 py-2 text-sm hover:bg-gray-50">Not now</button>
          <button onClick={() => { onAccept(); onClose(); }} className="rounded-2xl bg-black px-4 py-2 text-sm text-white">
            I agree
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [showConsent, setShowConsent] = useState(true);
  const [selected, setSelected] = useState<string[]>(['web','sis','attendance']);
  const [consent, setConsent] = useState(false);
  const budget = useBudget(selected);

  return (
    <div>
      <header className="border-b">
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 rounded-lg bg-black" aria-hidden />
            <span className="text-sm font-medium tracking-wide">GSOS</span>
          </div>
          <div className="flex gap-2">
            {['Continue with Google','Continue with LinkedIn','Continue with Facebook'].map((t)=> (
              <button key={t} className="rounded-2xl border px-3 py-1 text-sm hover:bg-gray-50">{t}</button>
            ))}
          </div>
        </div>
      </header>

      <section className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold">Welcome 👋</h1>
          <p className="text-sm text-gray-700">Clean, minimal, and distraction-free — just like ChatGPT.</p>
        </div>

        <div className="rounded-2xl border p-4">
          <h2 className="mb-3 text-lg font-medium">Services you need</h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {SERVICES.map((s) => {
              const checked = selected.includes(s.id);
              return (
                <label key={s.id} className={`flex cursor-pointer items-center justify-between rounded-2xl border p-3 text-sm ${checked ? 'bg-gray-50' : 'bg-white'}`}>
                  <span>{s.label}</span>
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={checked}
                    onChange={(e) => {
                      setSelected((prev) => e.target.checked ? [...prev, s.id] : prev.filter((x) => x !== s.id));
                    }}
                  />
                </label>
              );
            })}
          </div>
          <div className="mt-4 flex items-center justify-between rounded-xl bg-gray-50 p-3 text-sm">
            <span className="text-gray-700">Estimated budget range</span>
            <strong>{budget ? new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(budget[0]) + ' – ' + new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(budget[1]) : 'Select services'}</strong>
          </div>
        </div>

        <div className="rounded-2xl border p-4">
          <h2 className="mb-3 text-lg font-medium">Social Sharing Consent</h2>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-700 max-w-[26ch]">
              Allow sharing of your <span className="font-medium">approved</span> posts on our social channels.
            </p>
            <Toggle value={consent} onChange={setConsent} label={consent ? 'Enabled' : 'Disabled'} />
          </div>
        </div>
      </section>

      <ConsentModal open={showConsent} onClose={() => setShowConsent(false)} onAccept={() => setConsent(true)} />
    </div>
  );
}
