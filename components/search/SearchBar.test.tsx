import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SearchBar } from "./SearchBar";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock lib/api
vi.mock("@/lib/api", () => ({
  apiFetch: vi.fn().mockResolvedValue({
    data: {
      products: [],
      categories: [],
      query: "",
    },
  }),
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe("SearchBar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the search input", () => {
    render(<SearchBar />, { wrapper });
    expect(screen.getByPlaceholderText(/search products/i)).toBeDefined();
  });

  it("updates query value on change", () => {
    render(<SearchBar />, { wrapper });
    const input = screen.getByPlaceholderText(/search products/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "dress" } });
    expect(input.value).toBe("dress");
  });

  it("shows suggestions when typing (mocked)", async () => {
    const { apiFetch } = await import("@/lib/api");
    (apiFetch as any).mockResolvedValue({
      data: {
        products: [
          { id: "1", name: "Summer Dress", slug: "summer-dress", price: "1200", currency: "BDT" },
        ],
        categories: [],
        query: "dress",
      },
    });

    render(<SearchBar />, { wrapper });
    const input = screen.getByPlaceholderText(/search products/i);
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "dress" } });

    // Wait for debounce and query
    await waitFor(() => {
      expect(screen.getByText(/summer dress/i)).toBeDefined();
    }, { timeout: 1000 });
  });
});
