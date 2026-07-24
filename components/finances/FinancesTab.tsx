"use client";
import { useState, useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Trash2, ChevronUp, Plus, Wallet, RefreshCw } from "lucide-react";
import { TransactionForm } from "./TransactionForm";
import { useTransactions, useSettings } from "@/hooks/useStore";
import { Transaction, CURRENCY_SYMBOLS } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function getDaysUntil31(): number {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const endDay = Math.min(31, lastDay);
  const diff = endDay - now.getDate() + 1;
  return Math.max(1, diff);
}

function isCurrentMonth(dateStr: string): boolean {
  const stored = new Date(dateStr + "T12:00:00");
  const now = new Date();
  return stored.getFullYear() === now.getFullYear() && stored.getMonth() === now.getMonth();
}

const COLORS = [
  "#E8A87C", "#7CB9E8", "#A87CE8", "#7CE8A8",
  "#E87C7C", "#E8D57C", "#7CE8D5", "#E87CB9",
  "#B9E87C", "#7C8BE8", "#E8B97C", "#7CE87C",
];

function fmt(amount: number, currency: string) {
  const sym = CURRENCY_SYMBOLS[currency] ?? currency;
  return `${sym} ${amount.toFixed(2)}`;
}

function getMonths() {
  const now = new Date();
  const months = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return months;
}

export function FinancesTab() {
  const [transactions, setTransactions] = useTransactions();
  const [settings, setSettings] = useSettings();
  const [showForm, setShowForm] = useState(false);
  const [filterMonth, setFilterMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [filterCategory, setFilterCategory] = useState("all");
  const [balanceInput, setBalanceInput] = useState("");

  const todayStr = new Date().toISOString().split("T")[0];

  const needsBalanceSetup =
    !settings.balanceSetup || !isCurrentMonth(settings.balanceSetup.setAt);

  function saveBalance(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseFloat(balanceInput.replace(",", "."));
    if (isNaN(amount) || amount < 0) return;
    setSettings((prev) => ({
      ...prev,
      balanceSetup: { amount, setAt: todayStr },
    }));
    setBalanceInput("");
  }

  function resetBalance() {
    setSettings((prev) => ({ ...prev, balanceSetup: undefined }));
  }

  const effectiveBalance = useMemo(() => {
    if (!settings.balanceSetup) return null;
    const spentSinceSetup = transactions
      .filter(
        (t) =>
          t.type === "expense" &&
          t.currency === settings.currency &&
          t.date >= settings.balanceSetup!.setAt
      )
      .reduce((sum, t) => sum + t.amount, 0);
    return settings.balanceSetup.amount - spentSinceSetup;
  }, [settings.balanceSetup, transactions, settings.currency]);

  const daysLeft = getDaysUntil31();
  const dailyBudget = effectiveBalance !== null ? effectiveBalance / daysLeft : null;

  const todayTotal = useMemo(
    () =>
      transactions
        .filter((t) => t.date === todayStr && t.type === "expense" && t.currency === settings.currency)
        .reduce((sum, t) => sum + t.amount, 0),
    [transactions, todayStr, settings.currency]
  );

  const monthTransactions = useMemo(
    () =>
      transactions.filter(
        (t) =>
          t.date.startsWith(filterMonth) &&
          (filterCategory === "all" || t.category === filterCategory)
      ),
    [transactions, filterMonth, filterCategory]
  );

  const monthExpenses = monthTransactions.filter((t) => t.type === "expense");
  const monthIncome = monthTransactions.filter((t) => t.type === "income");

  const mainCurrencyExpenses = useMemo(
    () =>
      monthExpenses
        .filter((t) => t.currency === settings.currency)
        .reduce((sum, t) => sum + t.amount, 0),
    [monthExpenses, settings.currency]
  );

  const mainCurrencyIncome = useMemo(
    () =>
      monthIncome
        .filter((t) => t.currency === settings.currency)
        .reduce((sum, t) => sum + t.amount, 0),
    [monthIncome, settings.currency]
  );

  const chartData = useMemo(() => {
    const map: Record<string, number> = {};
    monthExpenses
      .filter((t) => t.currency === settings.currency)
      .forEach((t) => {
        map[t.category] = (map[t.category] ?? 0) + t.amount;
      });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [monthExpenses, settings.currency]);

  function addTransaction(data: Omit<Transaction, "id">) {
    setTransactions((prev) => [
      { ...data, id: crypto.randomUUID() },
      ...prev,
    ]);
    setShowForm(false);
  }

  function deleteTransaction(id: string) {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }

  const months = getMonths();

  return (
    <div className="flex flex-col gap-4">
      {/* Balance setup prompt */}
      {needsBalanceSetup ? (
        <div className="rounded-xl bg-[var(--surface)] border border-[var(--accent)] p-4">
          <p className="text-xs uppercase tracking-widest text-[var(--accent)] mb-1">
            Дневной бюджет
          </p>
          <p className="text-sm text-[var(--text-secondary)] mb-3">
            Сколько денег у тебя сейчас?
          </p>
          <form onSubmit={saveBalance} className="flex gap-2">
            <Input
              type="number"
              inputMode="decimal"
              placeholder="0.00"
              value={balanceInput}
              onChange={(e) => setBalanceInput(e.target.value)}
              className="flex-1 font-mono tabular-nums"
              step="0.01"
              min="0"
              required
            />
            <Button type="submit" className="shrink-0">
              Готово
            </Button>
          </form>
          <p className="text-xs text-[var(--text-muted)] mt-2">
            Рассчитаю сколько можно тратить каждый день до 31-го
          </p>
        </div>
      ) : dailyBudget !== null ? (() => {
        const pct = dailyBudget > 0 ? Math.min(todayTotal / dailyBudget, 1) : 1;
        const remaining = (dailyBudget ?? 0) - todayTotal;
        const color =
          pct < 0.5
            ? "var(--success)"
            : pct < 0.8
            ? "var(--warning)"
            : "var(--destructive)";
        return (
          <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs uppercase tracking-widest text-[var(--text-secondary)]">
                Дневной бюджет
              </p>
              <button
                onClick={resetBalance}
                className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                title="Обновить баланс"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            </div>
            <p
              className="font-mono tabular-nums text-3xl font-semibold mt-1"
              style={{ color }}
            >
              {fmt(dailyBudget, settings.currency)}
            </p>

            {/* Progress bar */}
            <div className="h-1.5 rounded-full bg-[var(--surface-hover)] mt-3 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${pct * 100}%`, background: color }}
              />
            </div>

            <div className="flex justify-between mt-2 text-xs text-[var(--text-muted)] font-mono tabular-nums">
              <span>Потрачено {fmt(todayTotal, settings.currency)}</span>
              <span
                style={{ color: remaining >= 0 ? "var(--text-secondary)" : "var(--destructive)" }}
              >
                {remaining >= 0 ? `Осталось ${fmt(remaining, settings.currency)}` : `Перерасход ${fmt(-remaining, settings.currency)}`}
              </span>
            </div>

            <p className="text-xs text-[var(--text-muted)] mt-2">
              Баланс{" "}
              <span className="font-mono tabular-nums text-[var(--text-secondary)]">
                {fmt(effectiveBalance!, settings.currency)}
              </span>
              {" · "}{daysLeft} {daysLeft === 1 ? "день" : daysLeft < 5 ? "дня" : "дней"} до 31-го
            </p>
          </div>
        );
      })() : null}

      {/* Monthly stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] p-4">
          <p className="text-xs uppercase tracking-widest text-[var(--text-secondary)]">
            Расходы
          </p>
          <p className="font-mono tabular-nums text-2xl font-semibold text-[var(--destructive)] mt-2">
            −{fmt(mainCurrencyExpenses, settings.currency)}
          </p>
        </div>
        <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] p-4">
          <p className="text-xs uppercase tracking-widest text-[var(--text-secondary)]">
            Доходы
          </p>
          <p className="font-mono tabular-nums text-2xl font-semibold text-[var(--success)] mt-2">
            +{fmt(mainCurrencyIncome, settings.currency)}
          </p>
        </div>
      </div>

      {/* Balance card */}
      {mainCurrencyIncome > 0 && (
        <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] p-4">
          <p className="text-xs uppercase tracking-widest text-[var(--text-secondary)]">
            Баланс за месяц
          </p>
          <p
            className={`font-mono tabular-nums text-2xl font-semibold mt-2 ${
              mainCurrencyIncome - mainCurrencyExpenses >= 0
                ? "text-[var(--success)]"
                : "text-[var(--destructive)]"
            }`}
          >
            {mainCurrencyIncome - mainCurrencyExpenses >= 0 ? "+" : ""}
            {fmt(mainCurrencyIncome - mainCurrencyExpenses, settings.currency)}
          </p>
        </div>
      )}

      {/* Donut chart */}
      {chartData.length > 0 && (
        <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] p-4">
          <p className="text-xs uppercase tracking-widest text-[var(--text-secondary)] mb-2">
            По категориям
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="none" />
                ))}
              </Pie>
              <Tooltip
                formatter={(v) => fmt(Number(v), settings.currency)}
                contentStyle={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "12px",
                  color: "var(--text-primary)",
                }}
              />
              <Legend
                formatter={(value) => (
                  <span style={{ color: "var(--text-secondary)", fontSize: 12 }}>
                    {value}
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Add transaction button */}
      <Button
        onClick={() => setShowForm((v) => !v)}
        className="w-full h-12 rounded-xl bg-[var(--accent)] text-black font-medium hover:bg-[var(--accent-hover)]"
      >
        {showForm ? (
          <>
            <ChevronUp className="h-4 w-4" />
            Свернуть
          </>
        ) : (
          <>
            <Plus className="h-4 w-4" />
            Добавить запись
          </>
        )}
      </Button>

      {/* Form container */}
      {showForm && (
        <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] p-4">
          <TransactionForm onSave={addTransaction} />
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2">
        <Select value={filterMonth} onValueChange={setFilterMonth}>
          <SelectTrigger className="flex-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {months.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="flex-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все категории</SelectItem>
            {settings.categories.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Transaction list */}
      <div className="flex flex-col gap-2">
        {monthTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Wallet className="h-12 w-12 opacity-30 text-[var(--text-secondary)]" />
            <p className="text-sm text-[var(--text-secondary)] mt-4">
              Нет записей за этот период
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Добавь первую запись выше
            </p>
          </div>
        ) : (
          monthTransactions.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between rounded-xl bg-[var(--surface)] border border-[var(--border)] px-4 py-3"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                  {t.category}
                </p>
                {t.comment && (
                  <p className="text-xs text-[var(--text-muted)] truncate">
                    {t.comment}
                  </p>
                )}
                <p className="text-xs text-[var(--text-muted)]">{t.date}</p>
              </div>
              <div className="flex items-center gap-3 ml-2">
                <p
                  className={`font-mono tabular-nums text-sm font-semibold ${
                    t.type === "income"
                      ? "text-[var(--success)]"
                      : "text-[var(--text-primary)]"
                  }`}
                >
                  {t.type === "income" ? "+" : "−"}
                  {fmt(t.amount, t.currency)}
                </p>
                <button
                  onClick={() => deleteTransaction(t.id)}
                  className="text-[var(--text-muted)] hover:text-[var(--destructive)] transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
