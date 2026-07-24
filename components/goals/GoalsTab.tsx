"use client";
import { useState } from "react";
import { Plus, Trash2, ChevronDown, ChevronUp, Check, X, Target, Clock } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGoals, useTasks, useSettings } from "@/hooks/useStore";
import { Task, CURRENCY_SYMBOLS } from "@/lib/types";

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
  const [tDueTime, setTDueTime] = useState("");
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
      dueTime: (tDue && tDueTime) ? tDueTime : undefined,
      goalId: tGoalId === "none" ? undefined : tGoalId,
    };
    setTasks((prev) => [task, ...prev]);
    setTText(""); setTDue(""); setTDueTime(""); setTGoalId("none");
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
    <div className="flex flex-col gap-4">
      {/* Header buttons */}
      <div className="flex gap-2">
        <Dialog open={goalOpen} onOpenChange={setGoalOpen}>
          <DialogTrigger asChild>
            <Button className="flex-1 h-11">
              <Plus className="h-4 w-4" /> Цель
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Новая цель</DialogTitle>
            </DialogHeader>
            <form onSubmit={addGoal} className="flex flex-col gap-4">
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
                    className="font-mono tabular-nums"
                  />
                </div>
                <div>
                  <Label>Накоплено</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={gCurrent}
                    onChange={(e) => setGCurrent(e.target.value)}
                    className="font-mono tabular-nums"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full h-12 mt-1">
                Создать цель
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={taskOpen} onOpenChange={setTaskOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex-1 h-11">
              <Plus className="h-4 w-4" /> Задача
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Новая задача</DialogTitle>
            </DialogHeader>
            <form onSubmit={addTask} className="flex flex-col gap-4">
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
                  onChange={(e) => { setTDue(e.target.value); if (!e.target.value) setTDueTime(""); }}
                />
              </div>
              {tDue && (
                <div>
                  <Label>Время напоминания (необязательно)</Label>
                  <Input
                    type="time"
                    value={tDueTime}
                    onChange={(e) => setTDueTime(e.target.value)}
                    className="font-mono"
                  />
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    Уведомление придёт в это время, если приложение открыто
                  </p>
                </div>
              )}
              <div>
                <Label>Привязать к цели</Label>
                <Select value={tGoalId} onValueChange={setTGoalId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Без цели</SelectItem>
                    {activeGoals.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full h-12 mt-1">
                Добавить задачу
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* View toggle — pill style */}
      <div className="flex gap-1 rounded-xl bg-[var(--surface-hover)] p-1">
        {(["active", "done"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
              view === v
                ? "bg-[var(--accent)] text-black"
                : "text-[var(--text-secondary)]"
            }`}
          >
            {v === "active" ? "Активные" : "Завершённые"}
          </button>
        ))}
      </div>

      {view === "active" ? (
        <>
          {activeGoals.length === 0 && activeStandalone.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Target className="h-12 w-12 opacity-30 text-[var(--text-secondary)]" />
              <p className="text-sm text-[var(--text-secondary)] mt-4">
                Нет активных целей и задач
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Добавь цель или задачу выше
              </p>
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
                className="rounded-xl bg-[var(--surface)] border border-[var(--border)] overflow-hidden"
              >
                {/* Card header */}
                <div className="flex items-start p-4 gap-2">
                  <button
                    onClick={() => setExpandedGoal(expanded ? null : goal.id)}
                    className="flex-1 min-w-0 text-left"
                  >
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {goal.title}
                    </p>
                    {goal.targetDate && (
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">
                        до {goal.targetDate}
                      </p>
                    )}
                    {allTasks.length > 0 && (
                      <div className="mt-2">
                        <Progress value={progress} className="h-1.5" />
                        <p className="font-mono tabular-nums text-xs text-[var(--text-muted)] mt-1">
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
                        <p className="font-mono tabular-nums text-xs text-[var(--text-muted)] mt-1">
                          {sym} {goal.currentAmount ?? 0} / {goal.targetAmount}
                        </p>
                      </div>
                    )}
                  </button>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => toggleGoalDone(goal.id)}
                      className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--success)] hover:bg-[var(--surface-hover)] transition-colors"
                      title="Завершить цель"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteGoal(goal.id)}
                      className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--destructive)] hover:bg-[var(--surface-hover)] transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setExpandedGoal(expanded ? null : goal.id)}
                      className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors"
                    >
                      {expanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {expanded && (
                  <div className="px-4 pb-4 border-t border-[var(--border)] pt-3 flex flex-col gap-2">
                    {goal.description && (
                      <p className="text-sm text-[var(--text-secondary)] mb-1">
                        {goal.description}
                      </p>
                    )}
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
                          <span className={`font-mono tabular-nums text-xs flex items-center gap-0.5 ${
                            !t.done && t.dueDate < new Date().toISOString().split("T")[0]
                              ? "text-[var(--destructive)]"
                              : "text-[var(--text-muted)]"
                          }`}>
                            {t.dueTime && <Clock className="h-3 w-3" />}
                            {t.dueDate}{t.dueTime ? ` ${t.dueTime}` : ""}
                          </span>
                        )}
                        <button
                          onClick={() => deleteTask(t.id)}
                          className="text-[var(--text-muted)] hover:text-[var(--destructive)] transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    <InlineSubtaskInput
                      onAdd={(text) => addSubtask(goal.id, text)}
                    />
                  </div>
                )}
              </div>
            );
          })}

          {activeStandalone.length > 0 && (
            <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] p-4">
              <p className="text-xs uppercase tracking-widest text-[var(--text-secondary)] mb-3">
                Задачи без цели
              </p>
              <div className="flex flex-col gap-2.5">
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
                      <span className={`font-mono tabular-nums text-xs flex items-center gap-0.5 ${
                        !t.done && t.dueDate < new Date().toISOString().split("T")[0]
                          ? "text-[var(--destructive)]"
                          : "text-[var(--text-muted)]"
                      }`}>
                        {t.dueTime && <Clock className="h-3 w-3" />}
                        {t.dueDate}{t.dueTime ? ` ${t.dueTime}` : ""}
                      </span>
                    )}
                    <button
                      onClick={() => deleteTask(t.id)}
                      className="text-[var(--text-muted)] hover:text-[var(--destructive)] transition-colors"
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
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Check className="h-12 w-12 opacity-30 text-[var(--text-secondary)]" />
              <p className="text-sm text-[var(--text-secondary)] mt-4">
                Завершённых целей пока нет
              </p>
            </div>
          ) : null}
          {doneGoals.map((g) => (
            <div
              key={g.id}
              className="rounded-xl bg-[var(--surface)] border border-[var(--border)] p-4 opacity-60"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium line-through text-[var(--text-secondary)]">
                  {g.title}
                </p>
                <div className="flex gap-1">
                  <button
                    onClick={() => toggleGoalDone(g.id)}
                    className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
                    title="Вернуть в активные"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deleteGoal(g.id)}
                    className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--destructive)] transition-colors"
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
        className="h-9 text-xs"
      />
      <Button type="submit" size="sm" variant="outline" className="h-9 px-3">
        <Plus className="h-3.5 w-3.5" />
      </Button>
    </form>
  );
}
