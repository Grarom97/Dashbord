"use client";
import { useLocalStorage } from "./useLocalStorage";
import {
  Transaction,
  Goal,
  Habit,
  Settings,
  Task,
  DEFAULT_CATEGORIES,
} from "@/lib/types";

export function useTransactions() {
  return useLocalStorage<Transaction[]>("dashboard_transactions", []);
}

export function useGoals() {
  return useLocalStorage<Goal[]>("dashboard_goals", []);
}

export function useTasks() {
  return useLocalStorage<Task[]>("dashboard_tasks", []);
}

export function useHabits() {
  return useLocalStorage<Habit[]>("dashboard_habits", []);
}

export function useSettings() {
  return useLocalStorage<Settings>("dashboard_settings", {
    currency: "MDL",
    language: "ru",
    categories: DEFAULT_CATEGORIES,
  });
}
