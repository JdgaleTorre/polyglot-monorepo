import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { App } from './App';
import * as api from './lib/api';

vi.mock('./lib/api');

describe('App', () => {
  beforeEach(() => {
    vi.mocked(api.fetchTasks).mockResolvedValue([
      { id: 1, title: 'Existing task', completed: false },
    ]);
  });

  it('renders tasks fetched on mount', async () => {
    render(<App />);
    expect(await screen.findByText('Existing task')).toBeInTheDocument();
  });

  it('adds a new task via the form', async () => {
    vi.mocked(api.createTask).mockResolvedValue({
      id: 2,
      title: 'New task',
      completed: false,
    });

    render(<App />);
    await screen.findByText('Existing task');

    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText('New task title'), 'New task');
    await user.click(screen.getByText('Add'));

    await waitFor(() => expect(screen.getByText('New task')).toBeInTheDocument());
  });

  it('marks a task complete', async () => {
    vi.mocked(api.completeTask).mockResolvedValue({
      id: 1,
      title: 'Existing task',
      completed: true,
    });

    render(<App />);
    const completeButton = await screen.findByText('Complete');

    const user = userEvent.setup();
    await user.click(completeButton);

    await waitFor(() => expect(screen.queryByText('Complete')).not.toBeInTheDocument());
  });

  it('shows an error message when fetching tasks fails', async () => {
    vi.mocked(api.fetchTasks).mockRejectedValue(new Error('Network down'));

    render(<App />);

    expect(await screen.findByText('Network down')).toBeInTheDocument();
  });
});
