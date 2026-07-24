"use client";
import { useState } from "react";
import { Plus, Trash2, ChevronDown, ChevronUp, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useGoals, useTasks } from "@/hooks/useStore";
import { Goal, Task } from "@/lib/types";
import { useSettings } from "@/hooks/useStore";
import { CURRENCY_SYMBOLS } from "@/lib/types";

export function GoalsTab() {
  const [goals, setGoals] = useGoals();
  const [tasks, setTasks] = useTasks();
  const [settings] = useSettings();
  const [view, setView] = useState<"active" | "done">("active");
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null);
  const [goalOpen, setGoalOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);

  // New goal form
  const [gTitle, setGTitle] = useState("");
  const [gDesc, setGDesc] = useState("");
  const [gDate, setGDate] = useState("");
  const [gAmount, setGAmount] = useState("");
  const [gCurrent, setGCurrent] = useState("");

  // New task form
  const [tText, setTText] = useState("");
  const [tDue, setTDue] = useState("");
  const [tGoalId, setTGoalId] = useState("none");

  const sym = CURRENCY_SYMBOLS[settings.currency] ?? settings.currency;

  function addGoal(e: React.FormEvent) {
    e.preventDefault();
    if (!gTitle) return;
    setGoals((prev) => [
      {
        id: crypto.randomUUID(),
        title: gTitle,
        description: gDesc || undefined,
        targetDate: gDate || undefined,
        targetAmount: gAmount ? parseFloat(gAmount) : undefined,
        currentAmount: gCurrent ? parseFloat(gCurrent) : undefined,
        tasks: [],
        done: false,
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);
    setGTitle(""); setGDesc(""); setGDate(""); setGAmount(""); setGCurrent("");
    setGoalOpen(false);
  }

  function addTask(e: React.FormEvent) {
    e.preventDefault();
    if (!tText) return;
    const task: Task = {
      id: crypto.randomUUID(),
      text: tText,
      done: false,
      dueDate: tDue || undefined,
      goalId: tGoalId === "none" ? undefined : tGoalId,
    };
    setTasks((prev) => [task, ...prev]);
    setTText(""); setTDue(""); setTGoalId("none");
    setTaskOpen(false);
  }

  function toggleSubtask(goalId: string, taskId: string) {
    setGoals((prev) =>
      prev.map((g) =>
        g.id === goalId
          ? {
              ...g,
              tasks: g.tasks.map((t) =>
                t.id === taskId ? { ...t, done: !t.done } : t
              ),
            }
          : g
      )
    );
  }

  function addSubtask(goalId: string, text: string) {
    setGoals((prev) =>
      prev.map((g) =>
        g.id === goalId
          ? {
              ...g,
              tasks: [
                ...g.tasks,
                { id: crypto.randomUUID(), text, done: false },
              ],
            }
          : g
      )
    );
  }

  function deleteGoal(id: string) {
    setGoals((prev) => prev.filter((g) => g.id !== id));
    setTasks((prev) => prev.filter((t) => t.goalId !== id));
  }

  function toggleGoalDone(id: string) {
    setGoals((prev) =>
      prev.map((g) => (g.id === id ? { ...g, done: !g.done } : g))
    );
  }

  function toggleTask(id: string) {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  }

  function deleteTask(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  const activeGoals = goals.filter((g) => !g.done);
  const doneGoals = goals.filter((g) => g.done);
  const standaloneTasks = tasks.filter((t) => !t.goalId);
  const activeStandalone = standaloneTasks.filter((t) => !t.done);
  const doneStandalone = standaloneTasks.filter((t) => t.done);

  return (
    <div className="flex flex-col gap-4 pb-24">
      {/* Header buttons */}
      <div className="flex gap-2">
        <Dialog open={goalOpen} onOpenChange={setGoalOpen}>
          <DialogTrigger asChild>
            <Button className="flex-1" size="sm">
              <Plus className="h-4 w-4" /> Цель
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Новая цель</DialogTitle>
            </DialogHeader>
            <form onSubmit={addGoal} className="flex flex-col gap-3">
              <div>
                <Label>Название</Label>
                <Input
                  placeholder="Улучшить английский до B2"
                  value={gTitle}
                  onChange={(e) => setGTitle(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label>Описание (необязательно)</Label>
                <Input
                  placeholder="Подробности…"
                  value={gDesc}
                  onChange={(e) => setGDesc(e.target.value)}
                />
              </div>
              <div>
                <Label>Дедлайн (необязательно)</Label>
                <Input
                  type="date"
                  value={gDate}
                  onChange={(e) => setGDate(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Цель ({sym})</Label>
                  <Input
                    type="number"
                    placeholder="5000"
                    value={gAmount}
                    onChange={(e) => setGAmount(e.target.value)}
                    className="mono"
                  />
                </div>
                <div>
                  <Label>Накоплено</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={gCurrent}
                    onChange={(e) => setGCurrent(e.target.value)}
                    className="mono"
                  />
                </div>
              </div>
              <Button type="submit" className="mt-1">Создать цель</Button>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={taskOpen} onOpenChange={setTaskOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex-1" size="sm">
              <Plus className="h-4 w-4" /> Задача
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Новая задача</DialogTitle>
            </DialogHeader>
            <form onSubmit={addTask} className="flex flex-col gap-3">
              <div>
                <Label>Задача</Label>
                <Input
                  placeholder="Что нужно сделать?"
                  value={tText}
                  onChange={(e) => setTText(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label>Срок (необязательно)</Label>
                <Input
                  type="date"
                  value={tDue}
                  onChange={(e) => setTDue(e.target.value)}
                />
              </div>
              <div>
                <Label>Привязать к цели</Label>
                <select
                  value={tGoalId}
                  onChange={(e) => setTGoalId(e.target.value)}
                  className="flex h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                >
                  <option value="none">Без цели</option>
                  {activeGoals.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.title}
                    </option>
                  ))}
                </select>
              </div>
              <Button type="submit" className="mt-1">Добавить задачу</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* View toggle */}
      <div className="flex rounded-xl overflow-hidden border border-[var(--border)]">
        {(["active", "done"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              view === v
                ? "bg-[var(--accent)] text-[var(--primary-foreground)]"
                : "bg-[var(--surface)] text-[var(--text-secondary)]"
            }`}
          >
            {v === "active" ? "Активные" : "Завершённые"}
          </button>
        ))}
      </div>

      {view === "active" ? (
        <>
          {/* Goals */}
          {activeGoals.length === 0 && activeStandalone.length === 0 ? (
            <div className="text-center py-10 text-[var(--text-muted)]">
              <p className="text-4xl mb-3">🎯</p>
              <p>Нет активных целей и задач</p>
              <p className="text-sm mt-1">Добавь цель или задачу выше ↑</p>
            </div>
          ) : null}

          {activeGoals.map((goal) => {
            const goalTasks = tasks.filter((t) => t.goalId === goal.id);
            const inline = goal.tasks;
            const allTasks = [...inline, ...goalTasks];
            const doneTasks = allTasks.filter((t) => t.done).length;
            const progress = allTasks.length > 0 ? Math.round((doneTasks / allTasks.length) * 100) : 0;
            const expanded = expandedGoal === goal.id;

            return (
              <div
                key={goal.id}
                className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] overflow-hidden"
              >
                <button
                  onClick={() => setExpandedGoal(expanded ? null : goal.id)}
                  className="flex items-start justify-between w-full p-4 text-left"
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="font-medium text-[var(--text-primary)]">{goal.title}</p>
                    {goal.targetDate && (
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">
                        до {goal.targetDate}
                      </p>
                    )}
                    {allTasks.length > 0 && (
                      <div className="mt-2">
                        <Progress value={progress} className="h-1.5" />
                        <p className="text-xs text-[var(--text-muted)] mt-1">
                          {doneTasks}/{allTasks.length} задач
                        </p>
                      </div>
                    )}
                    {goal.targetAmount && (
                      <div className="mt-2">
                        <Progress
                          value={Math.min(
                            100,
                            ((goal.currentAmount ?? 0) / goal.targetAmount) * 100
                          )}
                          className="h-1.5"
                        />
                        <p className="mono text-xs text-[var(--text-muted)] mt-1">
                          {goal.currentAmount ?? 0} / {goal.targetAmount} {sym}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleGoalDone(goal.id); }}
                      className="text-[var(--text-muted)] hover:text-[var(--success)] transition-colors"
                      title="Завершить цель"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteGoal(goal.id); }}
                      className="text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    {expanded ? (
                      <ChevronUp className="h-4 w-4 text-[var(--text-secondary)]" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-[var(--text-secondary)]" />
                    )}
                  </div>
                </button>

                {expanded && (
                  <div className="px-4 pb-4 border-t border-[var(--border)] pt-3 flex flex-col gap-2">
                    {goal.description && (
                      <p className="text-sm text-[var(--text-secondary)] mb-1">
                        {goal.description}
                      </p>
                    )}
                    {/* Inline subtasks */}
                    {inline.map((t) => (
                      <div key={t.id} className="flex items-center gap-2">
                        <Checkbox
                          checked={t.done}
                          onCheckedChange={() => toggleSubtask(goal.id, t.id)}
                        />
                        <span
                          className={`text-sm ${t.done ? "line-through text-[var(--text-muted)]" : "text-[var(--text-primary)]"}`}
                        >
                          {t.text}
                        </span>
                      </div>
                    ))}
                    {/* Linked tasks */}
                    {goalTasks.map((t) => (
                      <div key={t.id} className="flex items-center gap-2">
                        <Checkbox
                          checked={t.done}
                          onCheckedChange={() => toggleTask(t.id)}
                        />
                        <span
                          className={`text-sm flex-1 ${t.done ? "line-through text-[var(--text-muted)]" : "text-[var(--text-primary)]"}`}
                        >
                          {t.text}
                        </span>
                        {t.dueDate && (
                          <span className="text-xs text-[var(--text-muted)]">{t.dueDate}</span>
                        )}
                        <button
                          onClick={() => deleteTask(t.id)}
                          className="text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    {/* Add inline subtask */}
                    <InlineSubtaskInput
                      onAdd={(text) => addSubtask(goal.id, text)}
                    />
                  </div>
                )}
              </div>
            );
          })}

          {/* Standalone tasks */}
          {activeStandalone.length > 0 && (
            <div className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-4">
              <p className="text-sm font-medium text-[var(--text-secondary)] mb-3">
                Задачи без цели
              </p>
              <div className="flex flex-col gap-2">
                {activeStandalone.map((t) => (
                  <div key={t.id} className="flex items-center gap-2">
                    <Checkbox
                      checked={t.done}
                      onCheckedChange={() => toggleTask(t.id)}
                    />
                    <span className="text-sm flex-1 text-[var(--text-primary)]">
                      {t.text}
                    </span>
                    {t.dueDate && (
                      <span className="text-xs text-[var(--text-muted)]">{t.dueDate}</span>
                    )}
                    <button
                      onClick={() => deleteTask(t.id)}
                      className="text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {doneGoals.length === 0 && doneStandalone.length === 0 ? (
            <div className="text-center py-10 text-[var(--text-muted)]">
              <p className="text-4xl mb-3">✅</p>
              <p>Завершённых целей пока нет</p>
            </div>
          ) : null}
          {doneGoals.map((g) => (
            <div
              key={g.id}
              className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-4 opacity-60"
            >
              <div className="flex items-center justify-between">
                <p className="font-medium line-through text-[var(--text-secondary)]">
                  {g.title}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleGoalDone(g.id)}
                    className="text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deleteGoal(g.id)}
                    className="text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

function InlineSubtaskInput({ onAdd }: { onAdd: (text: string) => void }) {
  const [val, setVal] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (val.trim()) { onAdd(val.trim()); setVal(""); }
      }}
      className="flex gap-2 mt-1"
    >
      <Input
        placeholder="Добавить подзадачу…"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        className="h-8 text-xs"
      />
      <Button type="submit" size="sm" variant="outline" className="h-8 px-2">
        <Plus className="h-3 w-3" />
      </Button>
    </form>
  );
}
