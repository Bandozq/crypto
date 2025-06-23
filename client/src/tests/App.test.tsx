import { render, screen } from '@testing-library/react';
import App from '../App';
import { vi } from 'vitest';

// Mock the fetch function
global.fetch = vi.fn(() =>
  Promise.resolve(new Response(JSON.stringify([]), {
    status: 200,
    statusText: 'OK',
    headers: new Headers({
      'Content-Type': 'application/json'
    })
  }))
);

test('renders the main application component', () => {
  render(<App />);
  const linkElement = screen.getByText(/CryptoHunt/i);
  expect(linkElement).toBeInTheDocument();
});
