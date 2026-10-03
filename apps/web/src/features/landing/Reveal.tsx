import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
  type ReactNode,
} from 'react';
import { cn } from '../../lib/cn';

/**
 * Reveals its children once when they scroll into view. Purely CSS-driven
 * (see `.reveal` in app.css) and disabled under prefers-reduced-motion.
 */
export function Reveal({
  as: Tag = 'div',
  children,
  className,
  delay = 0,
  variant = 'rise',
}: {
  as?: ElementType;
  children?: ReactNode;
  className?: string;
  /** Milliseconds, for staggering siblings. */
  delay?: number;
  variant?: 'rise' | 'fade' | 'draw';
}) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(() => typeof IntersectionObserver === 'undefined');

  useEffect(() => {
    const el = ref.current;
    if (!el || shown) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [shown]);

  return (
    <Tag
      ref={ref}
      className={cn('reveal', `reveal--${variant}`, className)}
      data-shown={shown || undefined}
      style={{ '--reveal-delay': `${delay}ms` } as CSSProperties}
    >
      {children}
    </Tag>
  );
}
