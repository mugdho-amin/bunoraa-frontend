import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Button } from './Button'

describe('Button', () => {
  it('renders children correctly', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('applies primary variant by default', () => {
    render(<Button>Click me</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-primary')
  })

  it('applies secondary variant when specified', () => {
    render(<Button variant="secondary">Click me</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('border-border')
  })

  it('is disabled when the disabled prop is passed', () => {
    render(<Button disabled>Click me</Button>)
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(button).toHaveClass('disabled:opacity-50')
  })
})
