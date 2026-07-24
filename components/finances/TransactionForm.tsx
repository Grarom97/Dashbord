"use client";
import { useState, useRef } from "react";
import { Camera, Loader2, Plus } from "lucide-react";
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
import { Transaction, CURRENCY_SYMBOLS } from "@/lib/types";
import { useSettings } from "@/hooks/useStore";

function today() {
  return new Date().toISOString().split("T")[0];
}

interface Props {
  onSave: (t: Omit<Transaction, "id">) => void;
}

export function TransactionForm({ onSave }: Props) {
  const [settings] = useSettings();
  const [type, setType] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [comment, setComment] = useState("");
  const [date, setDate] = useState(today());
  const [currency, setCurrency] = useState<"MDL" | "EUR">(settings.currency);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState("");
  const [scanResult, setScanResult] = useState<{
    store?: string;
    total?: number;
    items?: { name: string; price: number }[];
    suggested_category?: string;
  } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const incomeCategories = ["Зарплата", "Фриланс", "Подработка", "Другое"];
  const categories =
    type === "income" ? incomeCategories : settings.categories;

  function reset() {
    setAmount("");
    setCategory("");
    setComment("");
    setDate(today());
    setScanResult(null);
    setScanError("");
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
      source: scanResult ? "scan" : "manual",
      currency,
    });
    reset();
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
      if (data.total) setAmount(String(data.total));
      if (data.suggested_category) setCategory(data.suggested_category);
      if (data.store) setComment(data.store);
    } catch {
      setScanError("Не удалось распознать чек — введи вручную");
    } finally {
      setScanning(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      {/* Type toggle */}
      <div className="flex rounded-xl overflow-hidden border border-[var(--border)]">
        {(["expense", "income"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => { setType(t); setCategory(""); }}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              type === t
                ? "bg-[var(--accent)] text-[var(--primary-foreground)]"
                : "bg-[var(--surface)] text-[var(--text-secondary)]"
            }`}
          >
            {t === "expense" ? "Расход" : "Доход"}
          </button>
        ))}
      </div>

      {/* Scan result banner */}
      {scanResult && (
        <div className="rounded-xl bg-[var(--surface-2)] p-3 text-sm border border-[var(--border)]">
          <p className="text-[var(--text-secondary)] mb-1">Чек распознан:</p>
          <p className="text-[var(--text-primary)] font-medium">{scanResult.store}</p>
          {scanResult.items?.slice(0, 3).map((it, i) => (
            <p key={i} className="text-[var(--text-muted)] text-xs">
              {it.name} — {it.price}
            </p>
          ))}
        </div>
      )}

      {scanError && (
        <p className="text-[var(--danger)] text-sm px-1">{scanError}</p>
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
            className="mono text-right text-lg"
          />
        </div>
        <div className="w-24">
          <Label>Валюта</Label>
          <Select value={currency} onValueChange={(v) => setCurrency(v as "MDL" | "EUR")}>
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

      {/* Actions */}
      <div className="flex gap-2 mt-1">
        <Button type="submit" className="flex-1">
          <Plus className="h-4 w-4" />
          Добавить
        </Button>
        {type === "expense" && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => fileRef.current?.click()}
            disabled={scanning}
            title="Сканировать чек"
          >
            {scanning ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Camera className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>

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
