"use client";
import { useState, useRef } from "react";
import { Camera, Loader2, Plus, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Transaction } from "@/lib/types";
import { useSettings } from "@/hooks/useStore";

function today() {
  return new Date().toISOString().split("T")[0];
}

interface ScanGroup {
  category: string;
  total: number;
  items: string[];
}

interface ScanResult {
  store?: string;
  date?: string;
  groups?: ScanGroup[];
}

interface Props {
  onSave: (t: Omit<Transaction, "id">) => void;
  onSaveMany?: (items: Omit<Transaction, "id">[]) => void;
}

export function TransactionForm({ onSave, onSaveMany }: Props) {
  const [settings] = useSettings();
  const [type, setType] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [comment, setComment] = useState("");
  const [date, setDate] = useState(today());
  const [currency, setCurrency] = useState<"MDL" | "EUR">(settings.currency);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState("");
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [groupCategories, setGroupCategories] = useState<Record<number, string>>({});
  const [selectedGroups, setSelectedGroups] = useState<Set<number>>(new Set());
  const [scanDate, setScanDate] = useState(today());
  const fileRef = useRef<HTMLInputElement>(null);

  const incomeCategories = ["Зарплата", "Фриланс", "Подработка", "Другое"];
  const categories = type === "income" ? incomeCategories : settings.categories;

  function reset() {
    setAmount("");
    setCategory("");
    setComment("");
    setDate(today());
    setScanResult(null);
    setScanError("");
    setGroupCategories({});
    setSelectedGroups(new Set());
    setScanDate(today());
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || !category) return;
    onSave({
      amount: parseFloat(amount),
      type,
      category,
      comment,
      date,
      source: "manual",
      currency,
    });
    reset();
  }

  function submitScanGroups() {
    if (!scanResult?.groups || selectedGroups.size === 0) return;
    const items: Omit<Transaction, "id">[] = [];
    scanResult.groups.forEach((g, i) => {
      if (!selectedGroups.has(i)) return;
      items.push({
        amount: g.total,
        type: "expense",
        category: groupCategories[i] ?? g.category,
        comment: scanResult.store ?? "",
        date: scanDate,
        source: "scan",
        currency,
      });
    });
    if (onSaveMany) {
      onSaveMany(items);
    } else {
      items.forEach((item) => onSave(item));
    }
    reset();
  }

  function toggleGroup(i: number) {
    setSelectedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      setScanError("Файл слишком большой (макс. 4 МБ)");
      return;
    }
    setScanning(true);
    setScanError("");
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((res, rej) => {
        reader.onload = () => res((reader.result as string).split(",")[1]);
        reader.onerror = rej;
        reader.readAsDataURL(file);
      });
      const resp = await fetch("/api/scan-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64 }),
      });
      const data = await resp.json();
      if (data.error) throw new Error(data.error);
      setScanResult(data);
      if (data.groups && Array.isArray(data.groups)) {
        const cats: Record<number, string> = {};
        const sel = new Set<number>();
        (data.groups as ScanGroup[]).forEach((g, i) => {
          cats[i] = g.category;
          sel.add(i);
        });
        setGroupCategories(cats);
        setSelectedGroups(sel);
        if (data.date) setScanDate(data.date);
      }
    } catch {
      setScanError("Не удалось распознать чек — введи вручную");
    } finally {
      setScanning(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  // Grouped scan review UI
  if (scanResult?.groups && scanResult.groups.length > 0) {
    const checkedCount = selectedGroups.size;
    const pluralForm =
      checkedCount === 1
        ? "транзакцию"
        : checkedCount >= 2 && checkedCount <= 4
        ? "транзакции"
        : "транзакций";

    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-[var(--accent)]">
              Чек распознан
            </p>
            {scanResult.store && (
              <p className="text-sm font-medium text-[var(--text-primary)] mt-0.5">
                {scanResult.store}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={reset}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex gap-2">
          <div className="flex-1">
            <Label>Дата</Label>
            <Input
              type="date"
              value={scanDate}
              onChange={(e) => setScanDate(e.target.value)}
            />
          </div>
          <div className="w-28">
            <Label>Валюта</Label>
            <Select
              value={currency}
              onValueChange={(v) => setCurrency(v as "MDL" | "EUR")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MDL">MDL (L)</SelectItem>
                <SelectItem value="EUR">EUR (€)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {scanResult.groups.map((g, i) => (
            <div
              key={i}
              className={`rounded-xl border p-3 transition-colors cursor-pointer select-none ${
                selectedGroups.has(i)
                  ? "border-[var(--accent)] bg-[var(--accent-muted)]"
                  : "border-[var(--border)] bg-[var(--surface)] opacity-60"
              }`}
              onClick={() => toggleGroup(i)}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`h-5 w-5 rounded flex items-center justify-center shrink-0 border-2 transition-colors ${
                    selectedGroups.has(i)
                      ? "bg-[var(--accent)] border-[var(--accent)]"
                      : "border-[var(--border)]"
                  }`}
                >
                  {selectedGroups.has(i) && (
                    <Check className="h-3 w-3 text-black" />
                  )}
                </div>

                <div
                  className="flex-1 min-w-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Select
                    value={groupCategories[i] ?? g.category}
                    onValueChange={(v) =>
                      setGroupCategories((prev) => ({ ...prev, [i]: v }))
                    }
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {settings.categories.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <p className="font-mono tabular-nums text-sm font-semibold shrink-0">
                  {g.total.toFixed(2)}
                </p>
              </div>

              {g.items && g.items.length > 0 && (
                <div className="mt-2 ml-8 flex flex-col gap-0.5">
                  {g.items.map((item, j) => (
                    <p key={j} className="text-xs text-[var(--text-muted)]">
                      {item}
                    </p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <Button
          type="button"
          onClick={submitScanGroups}
          disabled={checkedCount === 0}
          className="w-full h-12 text-base"
        >
          <Plus className="h-4 w-4" />
          {checkedCount === 0
            ? "Выбери хотя бы одну категорию"
            : `Добавить ${checkedCount} ${pluralForm}`}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      {/* Type toggle */}
      <div className="flex gap-1 rounded-xl bg-[var(--surface-hover)] p-1">
        {(["expense", "income"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setType(t);
              setCategory("");
            }}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
              type === t
                ? "bg-[var(--accent)] text-black"
                : "text-[var(--text-secondary)]"
            }`}
          >
            {t === "expense" ? "Расход" : "Доход"}
          </button>
        ))}
      </div>

      {/* Camera scan zone */}
      {type === "expense" && (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={scanning}
          className="w-full rounded-xl border-2 border-dashed border-[var(--border)] p-6 text-center transition-colors hover:border-[var(--accent)] disabled:opacity-60"
        >
          {scanning ? (
            <Loader2 className="h-6 w-6 mx-auto animate-spin text-[var(--accent)]" />
          ) : (
            <Camera className="h-6 w-6 mx-auto text-[var(--text-secondary)]" />
          )}
          <p className="text-xs uppercase tracking-widest text-[var(--text-secondary)] mt-2">
            {scanning ? "Распознаю чек…" : "Сканировать чек"}
          </p>
          {!scanning && (
            <p className="text-xs text-[var(--text-muted)] mt-1 normal-case tracking-normal">
              Сфотографируй — AI разберёт чек по категориям
            </p>
          )}
        </button>
      )}

      {scanError && (
        <p className="text-sm text-[var(--destructive)] px-1">{scanError}</p>
      )}

      {/* Amount + currency */}
      <div className="flex gap-2">
        <div className="flex-1">
          <Label>Сумма</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            className="font-mono tabular-nums text-right text-lg"
          />
        </div>
        <div className="w-28">
          <Label>Валюта</Label>
          <Select
            value={currency}
            onValueChange={(v) => setCurrency(v as "MDL" | "EUR")}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MDL">MDL (L)</SelectItem>
              <SelectItem value="EUR">EUR (€)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Category */}
      <div>
        <Label>Категория</Label>
        <Select value={category} onValueChange={setCategory} required>
          <SelectTrigger>
            <SelectValue placeholder="Выбери категорию" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Comment */}
      <div>
        <Label>Комментарий</Label>
        <Input
          placeholder="Магазин, заметка…"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </div>

      {/* Date */}
      <div>
        <Label>Дата</Label>
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </div>

      <Button type="submit" className="w-full h-12 text-base mt-1">
        <Plus className="h-4 w-4" />
        Добавить
      </Button>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFile}
      />
    </form>
  );
}
