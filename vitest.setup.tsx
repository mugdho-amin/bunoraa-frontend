import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(),
  }),
  usePathname: () => '',
}))

// Mock next/image
type MockImageProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  fill?: boolean;
  priority?: boolean;
  quality?: number | string;
};

vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: MockImageProps) => {
    const imgProps = { ...props };
    delete imgProps.fill;
    delete imgProps.priority;
    delete imgProps.quality;

    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} {...imgProps} />
  },
}))
