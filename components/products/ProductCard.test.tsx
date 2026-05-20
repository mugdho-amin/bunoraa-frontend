import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactElement } from 'react'
import { ProductCard } from './ProductCard'
import { ToastProvider } from '@/components/ui/ToastProvider'
import type { ProductListItem } from '@/lib/types'

// Mock next/navigation (already in setup but ensuring here)
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/',
}))

// Mock useUiMessages
vi.mock('@/components/i18n/useUiMessages', () => ({
  useUiMessages: () => ({
    t: (key: string, fallback: string) => fallback,
  }),
}))

const mockProduct: ProductListItem = {
  id: '1',
  name: 'Test Product',
  slug: 'test-product',
  price: '100.00',
  current_price: '100.00',
  currency: 'BDT',
  is_in_stock: true,
  is_on_sale: false,
  average_rating: 4.5,
  reviews_count: 10,
  primary_category_name: 'Electronics',
  primary_image: 'http://example.com/image.jpg',
}

function renderWithQueryClient(ui: ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>{ui}</ToastProvider>
    </QueryClientProvider>
  )
}

describe('ProductCard', () => {
  it('renders product name and price', () => {
    renderWithQueryClient(<ProductCard product={mockProduct} />)
    expect(screen.getAllByText('Test Product').length).toBeGreaterThan(0)
    expect(screen.getByText(/100\.00/)).toBeInTheDocument()
  })

  it('renders Sold Out when product is out of stock', () => {
    const outOfStockProduct = { ...mockProduct, is_in_stock: false }
    renderWithQueryClient(<ProductCard product={outOfStockProduct} variant="minimal" />)
    expect(screen.getByText('Sold Out')).toBeInTheDocument()
  })

  it('renders Add to bag button when in stock', () => {
    renderWithQueryClient(<ProductCard product={mockProduct} />)
    expect(screen.getByRole('button', { name: /add to bag/i })).toBeInTheDocument()
  })
})
