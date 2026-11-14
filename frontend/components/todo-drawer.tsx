"use client";

import { useState, useEffect, useMemo } from "react";
import {
  CheckCircle2,
  Circle,
  Trash2,
  Plus,
  X,
  Calendar,
  Tag,
  Sparkles,
  Search,
  Check,
  ListTodo,
} from "lucide-react";
import { toast } from "sonner";

import {
  type TodoItem,
  type TodoPriority,
  type TodoCategory,
  getStoredTodos,
  fetchUserTodosFromCloud,
  addTodo,
  toggleTodo,
  deleteTodo,
  clearCompletedTodos,
} from "@/lib/todo-store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const CATEGORIES: TodoCategory[] = [
  "General",
  "Revision",
  "Syllabus",
  "RAG Research",
  "Assignment",
  "Exam Prep",
];

const PRIORITIES: { label: string; value: TodoPriority; color: string; badgeBg: string }[] = [
  {
    label: "High",
    value: "high",
    color: "text-rose-400 border-rose-500/30",
    badgeBg: "bg-rose-500/10 text-rose-400",
  },
  {
    label: "Medium",
    value: "medium",
    color: "text-amber-400 border-amber-500/30",
    badgeBg: "bg-amber-500/10 text-amber-400",
  },
  {
    label: "Low",
    value: "low",
    color: "text-emerald-400 border-emerald-500/30",
    badgeBg: "bg-emerald-500/10 text-emerald-400",
  },
];

function getPriorityMeta(priority: TodoPriority) {
  return (
    PRIORITIES.find((p) => p.value === priority) || {
      label: "Medium",
      value: "medium" as TodoPriority,
      color: "text-amber-400 border-amber-500/30",
      badgeBg: "bg-amber-500/10 text-amber-400",
    }
  );
}

export function TodoDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [selectedPriority, setSelectedPriority] = useState<TodoPriority>("medium");
  const [selectedCategory, setSelectedCategory] = useState<TodoCategory>("General");
  const [newDueDate, setNewDueDate] = useState("");
  const [filterTab, setFilterTab] = useState<"all" | "active" | "completed" | "high">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  // Sync todos from store
  const refreshTodos = () => {
    setTodos(getStoredTodos());
  };

  useEffect(() => {
    refreshTodos();
    fetchUserTodosFromCloud().catch(() => {});

    const handleUpdate = () => refreshTodos();
    const handleOpen = () => setIsOpen(true);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
      // Alt+T shortcut to toggle todo
      if (e.altKey && (e.key === "t" || e.key === "T")) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    window.addEventListener("polaris:todos-updated", handleUpdate);
    window.addEventListener("polaris:open-todo", handleOpen);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("polaris:todos-updated", handleUpdate);
      window.removeEventListener("polaris:open-todo", handleOpen);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    addTodo(newTitle, selectedPriority, selectedCategory, newDueDate);
    setNewTitle("");
    setNewDueDate("");
    setShowAddForm(false);
    toast.success("Task added to your study plan!");
  };

  const handleToggle = (id: string, currentStatus: boolean) => {
    toggleTodo(id);
    if (!currentStatus) {
      toast.success("Task completed! 🎉");
    }
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteTodo(id);
    toast.info("Task removed");
  };

  const handleClearCompleted = () => {
    const completedCount = todos.filter((t) => t.completed).length;
    if (completedCount === 0) return;
    clearCompletedTodos();
    toast.info(`Cleared ${completedCount} completed task${completedCount > 1 ? "s" : ""}`);
  };

  // Filtered list
  const filteredTodos = useMemo(() => {
    return todos.filter((item) => {
      // Tab filter
      if (filterTab === "active" && item.completed) return false;
      if (filterTab === "completed" && !item.completed) return false;
      if (filterTab === "high" && item.priority !== "high") return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesCat = item.category.toLowerCase().includes(q);
        return matchesTitle || matchesCat;
      }
      return true;
    });
  }, [todos, filterTab, searchQuery]);

  const totalCount = todos.length;
  const completedCount = todos.filter((t) => t.completed).length;
  const progressPercent = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  return (
    <>
      {/* Todo Slide-Over Drawer Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm duration-200 animate-in fade-in"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="relative flex h-full w-full max-w-lg flex-col border-l border-border/80 bg-card/95 text-foreground shadow-2xl backdrop-blur-2xl duration-300 animate-in slide-in-from-right"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-border/60 bg-muted/20 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary shadow-sm">
                  <ListTodo className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="flex items-center gap-2 text-base font-extrabold tracking-tight text-foreground">
                    Academic Tasks & To-Do
                    <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 font-mono text-[10px] text-primary">
                      Storage Active
                    </span>
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Persistent task manager synchronized across your workspace
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
                title="Close (Esc)"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Progress & Stats Bar */}
            <div className="space-y-2 border-b border-border/40 bg-muted/10 px-5 py-4">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Study Completion Progress
                </span>
                <span className="font-mono font-bold text-primary">
                  {completedCount}/{totalCount} completed ({progressPercent}%)
                </span>
              </div>
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted/60">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-indigo-400 transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Search & Action Controls */}
            <div className="space-y-3 border-b border-border/40 p-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search tasks or categories..."
                    className="w-full rounded-xl border border-border/60 bg-muted/40 py-2 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <Button
                  size="sm"
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="gap-1.5 rounded-xl text-xs font-bold"
                >
                  <Plus className="h-4 w-4" />
                  <span>{showAddForm ? "Close" : "New Task"}</span>
                </Button>
              </div>

              {/* Add Form Expandable */}
              {showAddForm && (
                <form
                  onSubmit={handleAdd}
                  className="space-y-3 rounded-2xl border border-border/80 bg-muted/40 p-4 duration-200 animate-in fade-in"
                >
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Task name (e.g. Study Heap Sort & Priority Queues)"
                    className="w-full rounded-xl border border-border/80 bg-background px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    autoFocus
                  />

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Category
                      </label>
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value as TodoCategory)}
                        className="w-full rounded-lg border border-border/80 bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none"
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Priority
                      </label>
                      <div className="flex gap-1">
                        {PRIORITIES.map((p) => (
                          <button
                            type="button"
                            key={p.value}
                            onClick={() => setSelectedPriority(p.value)}
                            className={cn(
                              "flex-1 rounded-md border py-1 text-[10px] font-bold transition-all",
                              selectedPriority === p.value
                                ? p.badgeBg + " border-current shadow-sm"
                                : "border-border/60 text-muted-foreground hover:bg-muted",
                            )}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Due Date / Note (Optional)
                    </label>
                    <input
                      type="text"
                      value={newDueDate}
                      onChange={(e) => setNewDueDate(e.target.value)}
                      placeholder="e.g. Today, Friday, or Oct 24"
                      className="w-full rounded-lg border border-border/80 bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAddForm(false)}
                      className="h-8 text-xs"
                    >
                      Cancel
                    </Button>
                    <Button type="submit" size="sm" className="h-8 gap-1 text-xs font-bold">
                      <Check className="h-3.5 w-3.5" />
                      Save Task
                    </Button>
                  </div>
                </form>
              )}

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
                <FilterTabButton
                  active={filterTab === "all"}
                  onClick={() => setFilterTab("all")}
                  label="All"
                  count={totalCount}
                />
                <FilterTabButton
                  active={filterTab === "active"}
                  onClick={() => setFilterTab("active")}
                  label="Active"
                  count={totalCount - completedCount}
                />
                <FilterTabButton
                  active={filterTab === "completed"}
                  onClick={() => setFilterTab("completed")}
                  label="Done"
                  count={completedCount}
                />
                <FilterTabButton
                  active={filterTab === "high"}
                  onClick={() => setFilterTab("high")}
                  label="High Priority"
                  count={todos.filter((t) => t.priority === "high" && !t.completed).length}
                />
              </div>
            </div>

            {/* Todo List Scrollable Area */}
            <div className="flex-1 space-y-2.5 overflow-y-auto p-4">
              {filteredTodos.length === 0 ? (
                <div className="flex h-64 flex-col items-center justify-center space-y-3 p-6 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border/60 bg-muted/40 text-muted-foreground">
                    <ListTodo className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">No tasks found</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {searchQuery
                        ? "Try clearing your search query"
                        : filterTab === "completed"
                          ? "No completed tasks yet. Finish some items to see them here!"
                          : "Your study task queue is clear! Click '+ New Task' to add items."}
                    </p>
                  </div>
                  {!searchQuery && filterTab === "all" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAddForm(true)}
                      className="rounded-xl text-xs font-semibold"
                    >
                      <Plus className="mr-1 h-3.5 w-3.5" />
                      Create First Task
                    </Button>
                  )}
                </div>
              ) : (
                filteredTodos.map((item) => {
                  const priorityMeta = getPriorityMeta(item.priority);

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleToggle(item.id, item.completed)}
                      className={cn(
                        "group flex cursor-pointer select-none items-start gap-3 rounded-2xl border p-3.5 transition-all duration-200",
                        item.completed
                          ? "border-border/40 bg-muted/20 opacity-70"
                          : "border-border/80 bg-card/90 shadow-sm hover:border-primary/40 hover:bg-card",
                      )}
                    >
                      {/* Checkbox Trigger */}
                      <button
                        type="button"
                        className="mt-0.5 flex-shrink-0 text-muted-foreground transition-colors hover:text-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggle(item.id, item.completed);
                        }}
                      >
                        {item.completed ? (
                          <CheckCircle2 className="h-5 w-5 fill-emerald-500/20 text-emerald-500" />
                        ) : (
                          <Circle className="h-5 w-5 hover:text-primary" />
                        )}
                      </button>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            "text-xs font-semibold leading-relaxed transition-all",
                            item.completed
                              ? "text-muted-foreground line-through"
                              : "font-medium text-foreground",
                          )}
                        >
                          {item.title}
                        </p>

                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          {/* Priority Badge */}
                          <span
                            className={cn(
                              "rounded-md border px-2 py-0.5 text-[10px] font-bold",
                              priorityMeta.badgeBg,
                              priorityMeta.color,
                            )}
                          >
                            {priorityMeta.label}
                          </span>

                          {/* Category Tag */}
                          <span className="flex items-center gap-1 rounded-md border border-border/50 bg-muted/60 px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                            <Tag className="h-2.5 w-2.5" />
                            {item.category}
                          </span>

                          {/* Due Date */}
                          {item.dueDate && (
                            <span className="flex items-center gap-1 rounded-md border border-primary/20 bg-primary/10 px-2 py-0.5 font-mono text-[10px] text-primary">
                              <Calendar className="h-2.5 w-2.5" />
                              {item.dueDate}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Delete Action */}
                      <button
                        type="button"
                        onClick={(e) => handleDelete(item.id, e)}
                        className="rounded-lg p-1.5 text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                        title="Delete task"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Drawer Footer */}
            <div className="flex items-center justify-between border-t border-border/60 bg-muted/20 p-4 text-xs">
              <div className="font-mono text-[11px] text-muted-foreground">
                Press <kbd className="rounded border bg-muted px-1.5 py-0.5 font-bold">Alt+T</kbd>{" "}
                to toggle
              </div>
              {completedCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearCompleted}
                  className="h-8 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="mr-1 h-3.5 w-3.5" />
                  Clear Completed ({completedCount})
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function FilterTabButton({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1 text-xs font-bold transition-all",
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <span>{label}</span>
      <span
        className={cn(
          "py-0.2 rounded-full px-1.5 font-mono text-[10px]",
          active
            ? "bg-primary-foreground/20 text-primary-foreground"
            : "bg-muted text-muted-foreground",
        )}
      >
        {count}
      </span>
    </button>
  );
}
