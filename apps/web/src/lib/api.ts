export interface Task {
  id: number;
  title: string;
  completed: boolean;
}

const BASE_URL = 'http://localhost:8000';

export async function fetchTasks(): Promise<Task[]> {
  const res = await fetch(`${BASE_URL}/tasks`);
  if (!res.ok) {
    throw new Error(`Failed to fetch tasks: ${res.status}`);
  }
  const data = (await res.json()) as { tasks: Task[] };
  return data.tasks;
}

export async function createTask(title: string): Promise<Task> {
  const res = await fetch(`${BASE_URL}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { detail?: string } | null;
    throw new Error(body?.detail ?? `Failed to create task: ${res.status}`);
  }
  return res.json();
}

export async function completeTask(id: number): Promise<Task> {
  const res = await fetch(`${BASE_URL}/tasks/${id}/complete`, {
    method: 'POST',
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { detail?: string } | null;
    throw new Error(body?.detail ?? `Failed to complete task: ${res.status}`);
  }
  return res.json();
}

export async function deleteTask(id: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/tasks/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { detail?: string } | null;
    throw new Error(body?.detail ?? `Failed to delete task: ${res.status}`);
  }
}
