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
import { Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { TransactionForm } from "./TransactionForm";
import { useTransactions, useSettings } from "@/hooks/useStore";
import { Transaction, CURRENCY_SYMBOLS } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const COLORS = [
  "#E8A87C", "#7CB9E8", "#A87CE8", "#7CE8A8",
  "#E87C7C", "#E8D57C", "#7CE8D5", "#E87CB9",
  "#B9E87C", "#7C8BE8", "#E8B97C", "#7CE87C",
];

function fmt(amount: number, currency: string) {
  const sym = CURRENCY_SYMBOLS[currency] ?? currency;
  return `${amount.toFixed(2)} ${sym}`;
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
  const [settings] = useSettings();
  const [showForm, setShowForm] = useState(false);
  const [filterMonth, setFilterMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [filterCategory, setFilterCategory] = useState("all");

  const todayStr = new Date().toISOString().split("T")[0];

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
    <div className="flex flex-col gap-4 pb-24">
      {/* Today summary */}
      <div className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-4">
        <p className="text-[var(--text-secondary)] text-sm">Сегодня потрачено</p>
        <p className="mono text-3xl font-bold text-[var(--accent)] text-right mt-1">
          {fmt(todayTotal, settings.currency)}
        </p>
      </div>

      {/* Monthly balance */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-3">
          <p className="text-[var(--text-secondary)] text-xs">Расходы</p>
          <p className="mono text-lg font-semibold text-[var(--danger)] text-right">
            −{fmt(mainCurrencyExpenses, settings.currency)}
          </p>
        </div>
        <div className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-3">
          <p className="text-[var(--text-secondary)] text-xs">Доходы</p>
          <p className="mono text-lg font-semibold text-[var(--success)] text-right">
            +{fmt(mainCurrencyIncome, settings.currency)}
          </p>
        </div>
      </div>

      {/* Balance card */}
      {mainCurrencyIncome > 0 && (
        <div className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-3">
          <p className="text-[var(--text-secondary)] text-xs">Баланс за месяц</p>
          <p
            className={`mono text-xl font-bold text-right ${
              mainCurrencyIncome - mainCurrencyExpenses >= 0
                ? "text-[var(--success)]"
                : "text-[var(--danger)]"
            }`}
          >
            {mainCurrencyIncome - mainCurrencyExpenses >= 0 ? "+" : ""}
            {fmt(mainCurrencyIncome - mainCurrencyExpenses, settings.currency)}
          </p>
        </div>
      )}

      {/* Donut chart */}
      {chartData.length > 0 && (
        <div className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-4">
          <p className="text-[var(--text-secondary)] text-sm mb-2">По категориям</p>
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
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v) => fmt(Number(v), settings.currency)}
                contentStyle={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
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

      {/* Add transaction */}
      <div className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-4">
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center justify-between w-full text-left"
        >
          <span className="font-medium text-[var(--text-primary)]">
            Добавить запись
          </span>
          {showForm ? (
            <ChevronUp className="h-5 w-5 text-[var(--text-secondary)]" />
          ) : (
            <ChevronDown className="h-5 w-5 text-[var(--text-secondary)]" />
          )}
        </button>
        {showForm && (
          <div className="mt-4">
            <TransactionForm onSave={addTransaction} />
          </div>
        )}
      </div>

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
          <div className="text-center py-10 text-[var(--text-muted)]">
            <p className="text-4xl mb-3">💸</p>
            <p>Нет записей за этот период</p>
            <p className="text-sm mt-1">Добавь первую запись выше ↑</p>
          </div>
        ) : (
          monthTransactions.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between rounded-xl bg-[var(--surface)] border border-[var(--border)] px-4 py-3"
            >
              <div className="flex-1 min-w-0">
                <p className="text-[var(--text-primary)] text-sm font-medium truncate">
                  {t.category}
                </p>
                {t.comment && (
                  <p className="text-[var(--text-muted)] text-xs truncate">{t.comment}</p>
                )}
                <p className="text-[var(--text-muted)] text-xs">{t.date}</p>
              </div>
              <div className="flex items-center gap-3 ml-2">
                <p
                  className={`mono text-sm font-semibold ${
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
                  className="text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors"
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
