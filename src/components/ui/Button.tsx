'use client';

import Link from 'next/link';
import { Magnetic } from '@/components/motion/primitives';

interface ButtonProps {
  href: string;
  children: React.ReactNode;
  variant?: 'primary' | 'ghost' | 'onContainer';
  icon?: string;
  external?: boolean;
  className?: string;
}

const styles = {
  primary: 'bg-primary text-on-primary shadow-soft hover:shadow-premium',
  ghost: 'border border-primary/40 text-primary hover:text-on-primary hover:border-primary',
  onContainer: 'border border-on-primary-container/40 text-on-primary-container hover:text-on-primary',
} as const;

/** The site's one button: magnetic pull, a fill that wipes up on hover, an arrow that slides. */
export default function Button({ href, children, variant = 'primary', icon, external, className = '' }: ButtonProps) {
  const cls = `btn-wipe group inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full font-label uppercase tracking-[0.18em] text-sm transition-[color,box-shadow,border-color,transform] duration-300 active:scale-[0.97] ${styles[variant]} ${className}`;
  const inner = (
    <>
      {children}
      {icon && (
        <span className="material-symbols-outlined text-sm transition-transform duration-500 ease-out group-hover:translate-x-1.5" aria-hidden="true">
          {icon}
        </span>
      )}
    </>
  );
  const isAnchor = external || href.startsWith('mailto:') || href.startsWith('tel:') || href.endsWith('.pdf');
  return (
    <Magnetic>
      {isAnchor ? (
        <a href={href} className={cls} {...(external || href.endsWith('.pdf') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
          {inner}
        </a>
      ) : (
        <Link href={href} className={cls}>
          {inner}
        </Link>
      )}
    </Magnetic>
  );
}
