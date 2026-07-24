"use client";
import { useState, useEffect, useRef } from "react";
import { Wallet, Target, CheckCircle2 } from "lucide-react";
import { FinancesTab } from "@/components/finances/FinancesTab";
import { GoalsTab } from "@/components/goals/GoalsTab";
import { HabitsTab } from "@/components/habits/HabitsTab";
import { useTasks } from "@/hooks/useStore";

const TABS = [
  { id: "finances", label: "Финансы", icon: Wallet },
  { id: "goals", label: "Цели", icon: Target },
  { id: "habits", label: "Привычки", icon: CheckCircle2 },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function Home() {
  const [tab, setTab] = useState<TabId>("finances");
  const [lsWarning, setLsWarning] = useState(false);
  const [tasks] = useTasks();
  const scheduledNotifs = useRef<Set<string>>(new Set());

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

  // Schedule task notifications
  useEffect(() => {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    const now = new Date();

    tasks.forEach((task) => {
      if (task.done || !task.dueDate || !task.dueTime) return;
      if (scheduledNotifs.current.has(task.id)) return;
      scheduledNotifs.current.add(task.id);

      const taskAt = new Date(`${task.dueDate}T${task.dueTime}:00`);
      const msUntil = taskAt.getTime() - now.getTime();

      const notify = () => {
        navigator.serviceWorker?.ready.then((sw) => {
          sw.showNotification("Задача", {
            body: task.text,
            icon: "/icon-192.png",
            badge: "/icon-192.png",
            tag: `task-${task.id}`,
          });
        });
      };

      if (msUntil <= 0) {
        notify();
      } else {
        setTimeout(notify, msUntil);
      }
    });
  }, [tasks]);

  const activeTab = TABS.find((t) => t.id === tab)!;

  return (
    <main className="flex flex-col min-h-screen max-w-[430px] mx-auto">
      {lsWarning && (
        <div className="bg-[var(--warning)] text-black text-xs text-center py-2 px-3">
          ⚠️ Хранилище недоступно — данные не будут сохранены
        </div>
      )}

      {/* Header */}
      <div className="sticky top-0 z-10 bg-[var(--background)] border-b border-[var(--border)] px-4 pb-3 pt-4">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
          {activeTab.label}
        </h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-28 scrollbar-none">
        {tab === "finances" && <FinancesTab />}
        {tab === "goals" && <GoalsTab />}
        {tab === "habits" && <HabitsTab />}
      </div>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-[var(--surface)] border-t border-[var(--border)] flex pb-[env(safe-area-inset-bottom)]">
        {TABS.map((t) => {
          const Icon = t.icon;
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 transition-colors ${
                isActive
                  ? "text-[var(--accent)]"
                  : "text-[var(--text-secondary)]"
              }`}
            >
              <span
                className={`flex items-center justify-center rounded-full px-4 py-1 transition-colors ${
                  isActive ? "bg-[var(--accent-muted)]" : ""
                }`}
              >
                <Icon className="h-5 w-5" strokeWidth={isActive ? 2.2 : 1.8} />
              </span>
              <span className="text-[10px] font-medium tracking-wide">
                {t.label}
              </span>
            </button>
          );
        })}
      </nav>
    </main>
  );
}
