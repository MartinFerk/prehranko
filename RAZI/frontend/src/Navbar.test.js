import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import Navbar from './components/Navbar';
import { MemoryRouter } from 'react-router-dom';

beforeEach(() => {
  // Ponaredimo localStorage
  localStorage.setItem('loggedIn', 'true');
  localStorage.setItem('userEmail', 'test@example.com');

  // Ponaredimo fetch, ki vrne uporabnika brez klica pravega API
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          user: {
            username: 'TestUser',
          },
        }),
    })
  );
});

afterEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
});

test('navbar fetches and displays username from API', async () => {
  render(
    <MemoryRouter>
      <Navbar />
    </MemoryRouter>
  );

  // Počakamo, da se username pojavi
  await waitFor(() => {
    expect(screen.getByText('TestUser')).toBeInTheDocument();
  });

  // (Dodatno preverimo, da je fetch bil klican)
  expect(global.fetch).toHaveBeenCalledWith(
    expect.stringContaining('/auth/user?email=test%40example.com')
  );
});