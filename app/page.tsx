"use client";
import { useState, useEffect } from "react";
import { FinancesTab } from "@/components/finances/FinancesTab";
import { GoalsTab } from "@/components/goals/GoalsTab";
import { HabitsTab } from "@/components/habits/HabitsTab";

const TABS = [
  { id: "finances", label: "Финансы", emoji: "💰" },
  { id: "goals", label: "Цели", emoji: "🎯" },
  { id: "habits", label: "Привычки", emoji: "✅" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function Home() {
  const [tab, setTab] = useState<TabId>("finances");
  const [lsWarning, setLsWarning] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem("__test__", "1");
      localStorage.removeItem("__test__");
    } catch {
      setLsWarning(true);
    }

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  return (
    <main className="flex flex-col min-h-screen max-w-[430px] mx-auto">
      {lsWarning && (
        <div
          style={{ background: "var(--warning)", color: "#000" }}
          className="text-xs text-center py-2 px-3"
        >
          ⚠️ Хранилище недоступно — данные не будут сохранены
        </div>
      )}

      {/* Header */}
      <div
        className="sticky top-0 z-10 border-b px-4 pb-3 pt-4"
        style={{ background: "var(--background)", borderColor: "var(--border)" }}
      >
        <h1 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
          {TABS.find((t) => t.id === tab)?.emoji}{" "}
          {TABS.find((t) => t.id === tab)?.label}
        </h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-24 scrollbar-none">
        {tab === "finances" && <FinancesTab />}
        {tab === "goals" && <GoalsTab />}
        {tab === "habits" && <HabitsTab />}
      </div>

      {/* Bottom nav */}
      <nav
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] border-t flex"
        style={{ background: "var(--background)", borderColor: "var(--border)" }}
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex-1 flex flex-col items-center gap-0.5 py-3 transition-colors"
            style={{
              color: tab === t.id ? "var(--accent)" : "var(--text-muted)",
            }}
          >
            <span className="text-xl">{t.emoji}</span>
            <span className="text-[10px] font-medium">{t.label}</span>
          </button>
        ))}
      </nav>
    </main>
  );
}
