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
import { Transaction } from "@/lib/types";
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
    <form onSubmit={submit} className="flex flex-col gap-4">
      {/* Type toggle — pill style */}
      <div className="flex gap-1 rounded-xl bg-[var(--surface-hover)] p-1">
        {(["expense", "income"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => { setType(t); setCategory(""); }}
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
              Сфотографируй — AI заполнит поля сам
            </p>
          )}
        </button>
      )}

      {/* Scan result banner */}
      {scanResult && (
        <div className="rounded-xl bg-[var(--accent-muted)] border border-[var(--accent)] p-3">
          <p className="text-xs uppercase tracking-widest text-[var(--accent)] mb-1">
            Чек распознан
          </p>
          <p className="text-sm font-medium text-[var(--text-primary)]">
            {scanResult.store}
          </p>
          {scanResult.items?.slice(0, 3).map((it, i) => (
            <p key={i} className="text-xs text-[var(--text-secondary)]">
              {it.name} — <span className="font-mono tabular-nums">{it.price}</span>
            </p>
          ))}
        </div>
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

      {/* Submit */}
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
