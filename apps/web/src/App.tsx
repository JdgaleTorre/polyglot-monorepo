import { useEffect, useState, type FormEvent } from 'react';
import { completeTask, createTask, deleteTask, fetchTasks, type Task } from './lib/api';

export function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadTasks() {
    try {
      setError(null);
      const data = await fetchTasks();
      setTasks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTasks();
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    try {
      setError(null);
      const task = await createTask(title);
      setTasks((prev) => [...prev, task]);
      setTitle('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }

  async function handleComplete(id: number) {
    try {
      setError(null);
      const updated = await completeTask(id);
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }

  async function handleDelete(id: number) {
    try {
      setError(null);
      await deleteTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-800 font-sans antialiased">
      <main className="mx-auto max-w-lg px-4 py-16 sm:py-24">
        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-semibold tracking-tight">Task Tracker</h1>
          <p className="mt-1 text-sm text-neutral-500">
            React → FastAPI gateway → gRPC TaskService → SQLAlchemy/SQLite
          </p>

          <form onSubmit={handleSubmit} className="mt-6 flex gap-2">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="New task title"
              className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none transition focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200"
            />
            <button
              type="submit"
              className="rounded-lg bg-neutral-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-700 active:bg-neutral-900"
            >
              Add
            </button>
          </form>

          {error && (
            <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}

          {loading ? (
            <div className="mt-8 flex justify-center">
              <span className="inline-block size-5 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-800" />
            </div>
          ) : tasks.length === 0 ? (
            <p className="mt-8 text-center text-sm text-neutral-400">
              No tasks yet. Add one above.
            </p>
          ) : (
            <ul className="mt-6 space-y-1">
              {tasks.map((task) => (
                <li
                  key={task.id}
                  className="flex items-center justify-between rounded-lg px-3 py-2 transition hover:bg-neutral-50"
                >
                  <span
                    className={`text-sm ${
                      task.completed
                        ? 'text-neutral-400 line-through'
                        : 'text-neutral-800'
                    }`}
                  >
                    {task.title}
                  </span>
                  <div className="flex gap-1.5">
                    {!task.completed && (
                      <button
                        onClick={() => handleComplete(task.id)}
                        className="rounded-md border border-neutral-200 px-3 py-1 text-xs font-medium text-neutral-600 transition hover:bg-neutral-100 active:bg-neutral-200"
                      >
                        Complete
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(task.id)}
                      className="rounded-md px-3 py-1 text-xs font-medium text-neutral-400 transition hover:bg-red-50 hover:text-red-500 active:text-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
