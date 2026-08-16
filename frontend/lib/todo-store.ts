import { getFirebaseFirestore, getFirebaseAuth } from "./firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

export type TodoPriority = "high" | "medium" | "low";
export type TodoCategory = "General" | "Revision" | "Syllabus" | "RAG Research" | "Assignment" | "Exam Prep";

export interface TodoItem {
  id: string;
  title: string;
  completed: boolean;
  priority: TodoPriority;
  category: TodoCategory;
  dueDate?: string;
  createdAt: number;
}

const STORAGE_KEY = "polaris_todos_v1";

const DEFAULT_TODOS: TodoItem[] = [
  {
    id: "todo-1",
    title: "Upload CS 301 Syllabus & Lecture PDFs for indexing",
    completed: true,
    priority: "high",
    category: "Syllabus",
    createdAt: Date.now() - 3600000 * 24,
  },
  {
    id: "todo-2",
    title: "Run Gap Analysis on Binary Search Trees & AVL rotations",
    completed: false,
    priority: "high",
    category: "RAG Research",
    dueDate: "Today",
    createdAt: Date.now() - 3600000 * 12,
  },
  {
    id: "todo-3",
    title: "Review Knowledge Graph cluster nodes for Midterm Prep",
    completed: false,
    priority: "medium",
    category: "Revision",
    dueDate: "Tomorrow",
    createdAt: Date.now() - 3600000 * 4,
  },
  {
    id: "todo-4",
    title: "Generate 7-day Revision Schedule for Graph Algorithms",
    completed: false,
    priority: "low",
    category: "Exam Prep",
    createdAt: Date.now() - 3600000,
  },
];

async function syncTodosToCloud(todos: TodoItem[]): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const auth = getFirebaseAuth();
    const currentUser = auth.currentUser;
    const demoUser = localStorage.getItem("polaris_demo_user");
    const uid = currentUser?.uid || (demoUser ? JSON.parse(demoUser).uid : null);
    if (!uid) return;

    const db = getFirebaseFirestore();
    const userRef = doc(db, "users", uid);
    await setDoc(userRef, { todos, todosUpdatedAt: new Date().toISOString() }, { merge: true });
  } catch {
    // Non-blocking sync fallback
  }
}

export function getStoredTodos(): TodoItem[] {
  if (typeof window === "undefined") return DEFAULT_TODOS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_TODOS));
      return DEFAULT_TODOS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_TODOS;
  } catch {
    return DEFAULT_TODOS;
  }
}

export function saveStoredTodos(todos: TodoItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    window.dispatchEvent(new CustomEvent("polaris:todos-updated", { detail: todos }));
    syncTodosToCloud(todos).catch(() => {});
  } catch (err) {
    console.error("Failed to save todos to localStorage", err);
  }
}

export async function fetchUserTodosFromCloud(): Promise<TodoItem[] | null> {
  if (typeof window === "undefined") return null;
  try {
    const auth = getFirebaseAuth();
    const currentUser = auth.currentUser;
    const demoUser = localStorage.getItem("polaris_demo_user");
    const uid = currentUser?.uid || (demoUser ? JSON.parse(demoUser).uid : null);
    if (!uid) return null;

    const db = getFirebaseFirestore();
    const userRef = doc(db, "users", uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const data = snap.data();
      if (Array.isArray(data?.todos)) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data.todos));
        window.dispatchEvent(new CustomEvent("polaris:todos-updated", { detail: data.todos }));
        return data.todos as TodoItem[];
      }
    }
  } catch {
    // Non-blocking
  }
  return null;
}

export function addTodo(
  title: string,
  priority: TodoPriority = "medium",
  category: TodoCategory = "General",
  dueDate?: string
): TodoItem {
  const newTodo: TodoItem = {
    id: "todo-" + Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
    title: title.trim(),
    completed: false,
    priority,
    category,
    dueDate: dueDate?.trim() || undefined,
    createdAt: Date.now(),
  };

  const current = getStoredTodos();
  const updated = [newTodo, ...current];
  saveStoredTodos(updated);
  return newTodo;
}

export function toggleTodo(id: string): TodoItem[] {
  const current = getStoredTodos();
  const updated = current.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t));
  saveStoredTodos(updated);
  return updated;
}

export function deleteTodo(id: string): TodoItem[] {
  const current = getStoredTodos();
  const updated = current.filter((t) => t.id !== id);
  saveStoredTodos(updated);
  return updated;
}

export function updateTodo(id: string, updates: Partial<Omit<TodoItem, "id" | "createdAt">>): TodoItem[] {
  const current = getStoredTodos();
  const updated = current.map((t) => (t.id === id ? { ...t, ...updates } : t));
  saveStoredTodos(updated);
  return updated;
}

export function clearCompletedTodos(): TodoItem[] {
  const current = getStoredTodos();
  const updated = current.filter((t) => !t.completed);
  saveStoredTodos(updated);
  return updated;
}

// Global UI Event Emitters
export function openTodoDrawer(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("polaris:open-todo"));
  }
}

export function openSideDrawer(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("polaris:open-drawer"));
  }
}

export function openCopilotModal(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("polaris:open-copilot"));
  }
}

