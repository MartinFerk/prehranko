import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom'; // Dodaj za Router
import App from './App';

test('renders Home page', () => {
  render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
  const titleElement = screen.getByText(/Statistika/i);
  expect(titleElement).toBeInTheDocument();
});