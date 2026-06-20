export interface ExpenseItem {
  id: string;
  description: string;
  price: number;
  tag?: string;
  createdAt: number;
}

export interface DayExpenses {
  dateStr: string; // YYYY-MM-DD
  items: ExpenseItem[];
}

export type ExpenseStore = Record<string, ExpenseItem[]>; // maps YYYY-MM-DD to items
