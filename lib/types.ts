export interface Transaction {
  id: string;
  amount: number;
  type: "expense" | "income";
  category: string;
  comment: string;
  date: string;
  source: "manual" | "scan";
  currency: "MDL" | "EUR";
}

export interface Task {
  id: string;
  text: string;
  done: boolean;
  dueDate?: string;
  goalId?: string;
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  targetDate?: string;
  targetAmount?: number;
  currentAmount?: number;
  tasks: { id: string; text: string; done: boolean }[];
  done: boolean;
  createdAt: string;
}

export interface Habit {
  id: string;
  name: string;
  emoji: string;
  targetDays: "daily" | number[];
  completions: string[];
  createdAt: string;
  reminderTime?: string;
}

export interface BalanceSetup {
  amount: number;
  setAt: string; // ISO date "YYYY-MM-DD"
}

export interface Settings {
  currency: "MDL" | "EUR";
  language: "ru" | "en";
  categories: string[];
  pushSubscription?: string;
  balanceSetup?: BalanceSetup;
}

export const DEFAULT_CATEGORIES = [
  "Еда",
  "Транспорт",
  "Жильё",
  "Здоровье",
  "Развлечения",
  "Одежда",
  "Алкоголь",
  "Кафе / рестораны",
  "Котики / питомцы",
  "Подписки",
  "Подарки",
  "Спорт",
  "Аптека",
  "Прочее",
];

export const DEFAULT_INCOME_CATEGORIES = [
  "Зарплата",
  "Фриланс",
  "Подработка",
  "Другое",
];

export const CURRENCY_SYMBOLS: Record<string, string> = {
  MDL: "L",
  EUR: "€",
};
