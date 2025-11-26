import { render, screen, waitFor } from '@testing-library/react';
import { act } from 'react';
import App from './components/App';

beforeEach(() => {
  global.IntersectionObserver = class {
    constructor(callback) {
      this.callback = callback;
    }
    observe() {
      this.callback([{ isIntersecting: false }]);
    }
    unobserve() {}
    disconnect() {}
  };

  global.fetch = jest.fn((url) => {
    if (url.includes('&s=')) {
      return Promise.resolve({
        json: () =>
          Promise.resolve({
            Response: 'True',
            Search: [
              {
                Title: 'Test Movie',
                Year: '2020',
                Poster: 'N/A',
                Type: 'movie',
                imdbID: 'id1',
              },
            ],
            totalResults: '1',
          }),
      });
    }
    if (url.includes('&i=')) {
      return Promise.resolve({
        json: () =>
          Promise.resolve({
            Response: 'True',
            Country: 'USA',
          }),
      });
    }
    return Promise.resolve({
      json: () =>
        Promise.resolve({
          Response: 'False',
          Error: 'Not found',
        }),
    });
  });
})

afterEach(() => {
  jest.clearAllMocks();
});

test('renders movie search header', async () => {
  await act(async () => {
    render(<App />);
  });
  await waitFor(() => expect(fetch).toHaveBeenCalled());
  const headings = screen.getAllByText(/premiere radar/i);
  expect(headings.length).toBeGreaterThan(0);
});
