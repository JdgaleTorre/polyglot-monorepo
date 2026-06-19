import { useEffect, useState, type FormEvent } from 'react';
import { completeTask, createTask, fetchTasks, type Task } from './lib/api';

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

  return (
    <main style={{ maxWidth: 480, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h1>Task Tracker</h1>
      <p style={{ color: '#666', fontSize: 14 }}>
        React → FastAPI gateway → gRPC TaskService → SQLAlchemy/SQLite
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8, margin: '16px 0' }}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="New task title"
          style={{ flex: 1, padding: 8 }}
        />
        <button type="submit">Add</button>
      </form>

      {error && <p style={{ color: 'crimson' }}>{error}</p>}
      {loading ? (
        <p>Loading…</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {tasks.map((task) => (
            <li
              key={task.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 0',
                borderBottom: '1px solid #eee',
                textDecoration: task.completed ? 'line-through' : 'none',
                opacity: task.completed ? 0.5 : 1,
              }}
            >
              {task.title}
              {!task.completed && (
                <button onClick={() => handleComplete(task.id)}>Complete</button>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
