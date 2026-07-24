"use client";
import { useState } from "react";
import { Plus, Trash2, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useHabits } from "@/hooks/useStore";
import { Habit } from "@/lib/types";

const DAY_NAMES = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
const today = () => new Date().toISOString().split("T")[0];

function getLast7Days(): string[] {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split("T")[0]);
  }
  return days;
}

function isTargetDay(habit: Habit, dateStr: string): boolean {
  if (habit.targetDays === "daily") return true;
  const day = new Date(dateStr + "T12:00:00").getDay();
  return (habit.targetDays as number[]).includes(day);
}

function getStreak(habit: Habit): number {
  let streak = 0;
  const now = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const ds = d.toISOString().split("T")[0];
    if (!isTargetDay(habit, ds)) continue;
    if (habit.completions.includes(ds)) {
      streak++;
    } else {
      if (ds === today()) continue;
      break;
    }
  }
  return streak;
}

const WEEKDAYS = [
  { label: "Пн", value: 1 },
  { label: "Вт", value: 2 },
  { label: "Ср", value: 3 },
  { label: "Чт", value: 4 },
  { label: "Пт", value: 5 },
  { label: "Сб", value: 6 },
  { label: "Вс", value: 0 },
];

export function HabitsTab() {
  const [habits, setHabits] = useHabits();
  const [open, setOpen] = useState(false);

  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("✅");
  const [freq, setFreq] = useState<"daily" | "custom">("daily");
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]);

  const last7 = getLast7Days();
  const todayStr = today();

  function addHabit(e: React.FormEvent) {
    e.preventDefault();
    if (!name) return;
    const newHabit: Habit = {
      id: crypto.randomUUID(),
      name,
      emoji,
      targetDays: freq === "daily" ? "daily" : selectedDays,
      completions: [],
      createdAt: new Date().toISOString(),
    };
    setHabits((prev) => [...prev, newHabit]);
    setName(""); setEmoji("✅"); setFreq("daily"); setSelectedDays([1, 2, 3, 4, 5]);
    setOpen(false);
  }

  function toggleDay(day: number) {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  function toggleCompletion(habitId: string, dateStr: string) {
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== habitId) return h;
        const has = h.completions.includes(dateStr);
        return {
          ...h,
          completions: has
            ? h.completions.filter((d) => d !== dateStr)
            : [...h.completions, dateStr],
        };
      })
    );
  }

  function deleteHabit(id: string) {
    setHabits((prev) => prev.filter((h) => h.id !== id));
  }

  return (
    <div className="flex flex-col gap-4 pb-24">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="w-full">
            <Plus className="h-4 w-4" /> Добавить привычку
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Новая привычка</DialogTitle>
          </DialogHeader>
          <form onSubmit={addHabit} className="flex flex-col gap-3">
            <div className="flex gap-2">
              <div className="w-16">
                <Label>Эмодзи</Label>
                <Input
                  value={emoji}
                  onChange={(e) => setEmoji(e.target.value)}
                  maxLength={2}
                  className="text-center text-xl"
                />
              </div>
              <div className="flex-1">
                <Label>Название</Label>
                <Input
                  placeholder="Отжимания утром"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <Label>Частота</Label>
              <div className="flex rounded-xl overflow-hidden border border-[var(--border)] mt-1">
                <button
                  type="button"
                  onClick={() => setFreq("daily")}
                  className={`flex-1 py-2 text-sm font-medium transition-colors ${
                    freq === "daily"
                      ? "bg-[var(--accent)] text-[var(--primary-foreground)]"
                      : "bg-[var(--surface)] text-[var(--text-secondary)]"
                  }`}
                >
                  Каждый день
                </button>
                <button
                  type="button"
                  onClick={() => setFreq("custom")}
                  className={`flex-1 py-2 text-sm font-medium transition-colors ${
                    freq === "custom"
                      ? "bg-[var(--accent)] text-[var(--primary-foreground)]"
                      : "bg-[var(--surface)] text-[var(--text-secondary)]"
                  }`}
                >
                  Дни недели
                </button>
              </div>
            </div>

            {freq === "custom" && (
              <div className="flex gap-1 justify-between">
                {WEEKDAYS.map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => toggleDay(d.value)}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                      selectedDays.includes(d.value)
                        ? "bg-[var(--accent)] text-[var(--primary-foreground)]"
                        : "bg-[var(--surface-2)] text-[var(--text-secondary)]"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            )}

            <Button type="submit" className="mt-1">Создать</Button>
          </form>
        </DialogContent>
      </Dialog>

      {habits.length === 0 ? (
        <div className="text-center py-10 text-[var(--text-muted)]">
          <p className="text-4xl mb-3">✅</p>
          <p>Нет привычек</p>
          <p className="text-sm mt-1">Добавь первую привычку выше ↑</p>
        </div>
      ) : (
        <>
          {/* Week header */}
          <div className="flex items-center pr-10">
            <div className="flex-1" />
            {last7.map((d) => {
              const dayIdx = new Date(d + "T12:00:00").getDay();
              return (
                <div
                  key={d}
                  className={`w-9 text-center text-xs ${
                    d === todayStr
                      ? "text-[var(--accent)] font-semibold"
                      : "text-[var(--text-muted)]"
                  }`}
                >
                  {DAY_NAMES[dayIdx]}
                </div>
              );
            })}
          </div>

          {habits.map((habit) => {
            const streak = getStreak(habit);
            const isTodayTarget = isTargetDay(habit, todayStr);
            const doneToday = habit.completions.includes(todayStr);

            return (
              <div
                key={habit.id}
                className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-3"
              >
                <div className="flex items-center gap-2">
                  {/* Today toggle */}
                  <button
                    onClick={() =>
                      isTodayTarget && toggleCompletion(habit.id, todayStr)
                    }
                    disabled={!isTodayTarget}
                    className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-lg shrink-0 transition-all ${
                      doneToday
                        ? "border-[var(--success)] bg-[var(--success)]/20"
                        : isTodayTarget
                        ? "border-[var(--border)] hover:border-[var(--accent)]"
                        : "border-[var(--border)] opacity-30"
                    }`}
                  >
                    {doneToday ? "✓" : habit.emoji}
                  </button>

                  {/* Name + streak */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                      {habit.name}
                    </p>
                    {streak > 0 && (
                      <div className="flex items-center gap-0.5 text-xs text-[var(--warning)]">
                        <Flame className="h-3 w-3" />
                        <span>{streak} дн.</span>
                      </div>
                    )}
                  </div>

                  {/* Week grid */}
                  <div className="flex gap-0 shrink-0">
                    {last7.map((d) => {
                      const isTarget = isTargetDay(habit, d);
                      const done = habit.completions.includes(d);
                      const isToday = d === todayStr;
                      return (
                        <button
                          key={d}
                          onClick={() =>
                            isTarget && toggleCompletion(habit.id, d)
                          }
                          disabled={!isTarget}
                          className={`w-9 h-7 rounded-md mx-0.5 text-xs font-medium transition-colors ${
                            !isTarget
                              ? "text-[var(--text-muted)] opacity-20"
                              : done
                              ? "bg-[var(--success)]/30 text-[var(--success)]"
                              : isToday
                              ? "bg-[var(--surface-2)] text-[var(--accent)] border border-[var(--accent)]"
                              : "bg-[var(--surface-2)] text-[var(--danger)]"
                          }`}
                        >
                          {!isTarget ? "–" : done ? "✓" : isToday ? "○" : "✗"}
                        </button>
                      );
                    })}
                  </div>

                  {/* Delete */}
                  <button
                    onClick={() => deleteHabit(habit.id)}
                    className="text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors ml-1 shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
