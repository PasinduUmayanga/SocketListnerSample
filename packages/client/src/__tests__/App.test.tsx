import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import { socket } from '../socket/client';
import type { FakeSocket } from './test-utils/fakeSocket';

vi.mock('../socket/client', async () => {
  const { createFakeSocket } = await import('./test-utils/fakeSocket');
  const fake = createFakeSocket();
  return {
    socket: fake,
    subscribeConnection: fake.subscribeConnection,
    getConnectionSnapshot: fake.getConnectionSnapshot,
  };
});

const fakeSocket = socket as unknown as FakeSocket;

describe('App', () => {
  it('renders the welcome message pushed by the server', async () => {
    render(<App />);

    fakeSocket.__emitFromServer('welcome', { message: "I'm from socket", timestamp: Date.now() });

    expect(await screen.findByText("I'm from socket")).toBeInTheDocument();
  });

  it('sends a broadcast message and renders replies from the server', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByPlaceholderText('Broadcast message'), 'hello everyone');
    await user.click(screen.getByRole('button', { name: 'Send to everyone' }));

    expect(fakeSocket.emit).toHaveBeenCalledWith('client:broadcast', { text: 'hello everyone' });

    fakeSocket.__emitFromServer('broadcast:message', {
      from: 'abc123',
      text: 'hello everyone',
      timestamp: Date.now(),
    });

    expect(await screen.findByText('hello everyone')).toBeInTheDocument();
  });
});
