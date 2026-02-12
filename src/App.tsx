import React, { useEffect, useMemo, useState } from 'react';

type Todo = {
  id: string;
  text: string;
  done: boolean;
  createdAt: number;
};

const STORAGE_KEY = 'ai-todo-items-v1';
const THEME_KEY = 'ai-todo-theme';

function loadInitialTodos(): Todo[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function loadInitialTheme(): 'dark' | 'light' {
  if (typeof window === 'undefined') return 'dark';
  const stored = window.localStorage.getItem(THEME_KEY) as 'dark' | 'light' | null;
  if (stored === 'dark' || stored === 'light') return stored;
  // fall back to system preference
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark' : 'light';
}

const App: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>(() => loadInitialTodos());
  const [input, setInput] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => loadInitialTheme());

  // Persist todos
  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  }, [todos]);

  // Persist + apply theme to <html> (for Tailwind darkMode: 'class')
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    window.localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const filteredTodos = useMemo(() => {
    switch (filter) {
      case 'active':
        return todos.filter((t) => !t.done);
      case 'completed':
        return todos.filter((t) => t.done);
      default:
        return todos;
    }
  }, [todos, filter]);

  const remainingCount = useMemo(
    () => todos.filter((t) => !t.done).length,
    [todos],
  );

  function handleAddTodo(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    const newTodo: Todo = {
      id: crypto.randomUUID(),
      text,
      done: false,
      createdAt: Date.now(),
    };
    setTodos((prev) => [newTodo, ...prev]);
    setInput('');
  }

  function toggleTodo(id: string) {
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === id ? { ...todo, done: !todo.done } : todo,
      ),
    );
  }

  function deleteTodo(id: string) {
    setTodos((prev) => prev.filter((todo) => todo.id !== id));
  }

  function clearCompleted() {
    setTodos((prev) => prev.filter((t) => !t.done));
  }

  function handleThemeToggle() {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-slate-100 flex items-center justify-center px-4 py-10">
      <div className="max-w-3xl w-full space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
              AI Todo
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Minimal, fast, and beautiful task manager with local storage.
            </p>
          </div>

          <button
            onClick={handleThemeToggle}
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium border border-slate-700/70 bg-slate-900/80 hover:bg-slate-800/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70"
            aria-label="Toggle dark mode"
          >
            {theme === 'dark' ? (
              <>
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-sky-400 text-slate-900 text-xs">
                  ☾
                </span>
                <span>Dark</span>
              </>
            ) : (
              <>
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-300 text-slate-900 text-xs">
                  ☼
                </span>
                <span>Light</span>
              </>
            )}
          </button>
        </header>

        {/* Main card */}
        <main className="glass-panel rounded-3xl shadow-glow p-6 sm:p-8 space-y-6">
          {/* Input */}
          <form
            onSubmit={handleAddTodo}
            className="flex flex-col sm:flex-row gap-3"
          >
            <div className="relative flex-1">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="What&apos;s your next task?"
                className="w-full rounded-2xl bg-slate-900/80 border border-slate-700/70 px-4 py-3 text-sm sm:text-base shadow-inner outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 focus-visible:border-sky-400/60 placeholder:text-slate-500"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-2xl bg-sky-400 px-5 py-3 text-sm sm:text-base font-semibold text-slate-950 shadow-lg shadow-sky-500/40 hover:bg-sky-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
            >
              Add task
            </button>
          </form>

          {/* Toolbar */}
          <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm text-slate-400">
            <div className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span>
                {remainingCount === 0
                  ? 'All tasks completed'
                  : `${remainingCount} task${
                      remainingCount === 1 ? '' : 's'
                    } remaining`}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1 rounded-full bg-slate-900/80 p-0.5 border border-slate-700/70">
                {(['all', 'active', 'completed'] as const).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFilter(key)}
                    className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors ${
                      filter === key
                        ? 'bg-sky-400 text-slate-950'
                        : 'text-slate-300 hover:bg-slate-800/80'
                    }`}
                  >
                    {key}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={clearCompleted}
                className="ml-auto text-xs font-medium text-slate-400 hover:text-rose-300 hover:underline"
              >
                Clear completed
              </button>
            </div>
          </section>

          {/* Todo list */}
          <section className="rounded-2xl bg-slate-950/60 border border-slate-800/80 max-h-[420px] overflow-y-auto todo-scrollbar divide-y divide-slate-800/80">
            {filteredTodos.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-slate-500">
                <p className="font-medium mb-1">No tasks to show.</p>
                <p className="text-xs">
                  Add a few tasks above and they&apos;ll be saved automatically
                  in your browser.
                </p>
              </div>
            ) : (
              filteredTodos.map((todo) => (
                <article
                  key={todo.id}
                  className="group flex items-center gap-3 px-4 py-3 hover:bg-slate-900/80 transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => toggleTodo(todo.id)}
                    className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border text-xs transition-colors ${
                      todo.done
                        ? 'border-emerald-400 bg-emerald-400 text-slate-950'
                        : 'border-slate-600 text-transparent hover:border-emerald-400 hover:text-emerald-400'
                    }`}
                    aria-label={todo.done ? 'Mark as incomplete' : 'Mark as done'}
                  >
                    ✓
                  </button>

                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm sm:text-[0.95rem] truncate ${
                        todo.done
                          ? 'text-slate-500 line-through'
                          : 'text-slate-100'
                      }`}
                    >
                      {todo.text}
                    </p>
                    <p className="text-[0.65rem] text-slate-500 mt-0.5">
                      {new Date(todo.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => deleteTodo(todo.id)}
                    className="opacity-0 group-hover:opacity-100 text-xs font-medium text-rose-400 hover:text-rose-300 px-2 py-1 rounded-full hover:bg-rose-500/10 transition-opacity transition-colors"
                    aria-label="Delete task"
                  >
                    Delete
                  </button>
                </article>
              ))
            )}
          </section>
        </main>

        <footer className="text-[0.7rem] text-slate-500 text-center">
          Data is stored locally in your browser using localStorage.
        </footer>
      </div>
    </div>
  );
};

export default App;

