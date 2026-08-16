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
  { label: "High", value: "high", color: "text-rose-400 border-rose-500/30", badgeBg: "bg-rose-500/10 text-rose-400" },
  { label: "Medium", value: "medium", color: "text-amber-400 border-amber-500/30", badgeBg: "bg-amber-500/10 text-amber-400" },
  { label: "Low", value: "low", color: "text-emerald-400 border-emerald-500/30", badgeBg: "bg-emerald-500/10 text-emerald-400" },
];

function getPriorityMeta(priority: TodoPriority) {
  return PRIORITIES.find((p) => p.value === priority) || {
    label: "Medium",
    value: "medium" as TodoPriority,
    color: "text-amber-400 border-amber-500/30",
    badgeBg: "bg-amber-500/10 text-amber-400",
  };
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
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-card/95 border-l border-border/80 h-full flex flex-col shadow-2xl backdrop-blur-2xl animate-in slide-in-from-right duration-300 relative text-foreground"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="p-5 border-b border-border/60 flex items-center justify-between bg-muted/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm">
                  <ListTodo className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold tracking-tight text-foreground flex items-center gap-2">
                    Academic Tasks & To-Do
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary">
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
                className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                title="Close (Esc)"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Progress & Stats Bar */}
            <div className="px-5 py-4 border-b border-border/40 bg-muted/10 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Study Completion Progress
                </span>
                <span className="font-mono text-primary font-bold">
                  {completedCount}/{totalCount} completed ({progressPercent}%)
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-muted/60 overflow-hidden relative">
                <div
                  className="h-full bg-gradient-to-r from-primary to-indigo-400 transition-all duration-500 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Search & Action Controls */}
            <div className="p-4 border-b border-border/40 space-y-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search tasks or categories..."
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-muted/40 border border-border/60 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
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
                  className="gap-1.5 text-xs font-bold rounded-xl"
                >
                  <Plus className="h-4 w-4" />
                  <span>{showAddForm ? "Close" : "New Task"}</span>
                </Button>
              </div>

              {/* Add Form Expandable */}
              {showAddForm && (
                <form
                  onSubmit={handleAdd}
                  className="p-4 rounded-2xl bg-muted/40 border border-border/80 space-y-3 animate-in fade-in duration-200"
                >
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Task name (e.g. Study Heap Sort & Priority Queues)"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-background border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    autoFocus
                  />

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                        Category
                      </label>
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value as TodoCategory)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-background border border-border/80 text-xs text-foreground focus:outline-none"
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                        Priority
                      </label>
                      <div className="flex gap-1">
                        {PRIORITIES.map((p) => (
                          <button
                            type="button"
                            key={p.value}
                            onClick={() => setSelectedPriority(p.value)}
                            className={cn(
                              "flex-1 py-1 text-[10px] font-bold rounded-md border transition-all",
                              selectedPriority === p.value
                                ? p.badgeBg + " border-current shadow-sm"
                                : "border-border/60 text-muted-foreground hover:bg-muted"
                            )}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                      Due Date / Note (Optional)
                    </label>
                    <input
                      type="text"
                      value={newDueDate}
                      onChange={(e) => setNewDueDate(e.target.value)}
                      placeholder="e.g. Today, Friday, or Oct 24"
                      className="w-full px-3 py-1.5 text-xs rounded-lg bg-background border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-none"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAddForm(false)}
                      className="text-xs h-8"
                    >
                      Cancel
                    </Button>
                    <Button type="submit" size="sm" className="text-xs font-bold h-8 gap-1">
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
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              {filteredTodos.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center p-6 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-muted/40 border border-border/60 flex items-center justify-center text-muted-foreground">
                    <ListTodo className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">No tasks found</p>
                    <p className="text-xs text-muted-foreground mt-1">
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
                      className="text-xs font-semibold rounded-xl"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
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
                        "group p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer flex items-start gap-3 select-none",
                        item.completed
                          ? "bg-muted/20 border-border/40 opacity-70"
                          : "bg-card/90 hover:bg-card border-border/80 hover:border-primary/40 shadow-sm"
                      )}
                    >
                      {/* Checkbox Trigger */}
                      <button
                        type="button"
                        className="mt-0.5 flex-shrink-0 text-muted-foreground hover:text-primary transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggle(item.id, item.completed);
                        }}
                      >
                        {item.completed ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-500 fill-emerald-500/20" />
                        ) : (
                          <Circle className="h-5 w-5 hover:text-primary" />
                        )}
                      </button>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p
                          className={cn(
                            "text-xs font-semibold leading-relaxed transition-all",
                            item.completed
                              ? "line-through text-muted-foreground"
                              : "text-foreground font-medium"
                          )}
                        >
                          {item.title}
                        </p>

                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                          {/* Priority Badge */}
                          <span
                            className={cn(
                              "text-[10px] font-bold px-2 py-0.5 rounded-md border",
                              priorityMeta.badgeBg,
                              priorityMeta.color
                            )}
                          >
                            {priorityMeta.label}
                          </span>

                          {/* Category Tag */}
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-muted/60 text-muted-foreground border border-border/50 flex items-center gap-1">
                            <Tag className="h-2.5 w-2.5" />
                            {item.category}
                          </span>

                          {/* Due Date */}
                          {item.dueDate && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 flex items-center gap-1">
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
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
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
            <div className="p-4 border-t border-border/60 bg-muted/20 flex items-center justify-between text-xs">
              <div className="text-muted-foreground text-[11px] font-mono">
                Press <kbd className="px-1.5 py-0.5 rounded bg-muted border font-bold">Alt+T</kbd> to toggle
              </div>
              {completedCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearCompleted}
                  className="text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
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
        "px-2.5 py-1 rounded-lg font-bold text-xs whitespace-nowrap transition-all flex items-center gap-1.5",
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted"
      )}
    >
      <span>{label}</span>
      <span
        className={cn(
          "px-1.5 py-0.2 rounded-full text-[10px] font-mono",
          active ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
        )}
      >
        {count}
      </span>
    </button>
  );
}
