'use client';

import { motion, useReducedMotion } from 'framer-motion';

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

/** The default scroll reveal: content rises into place and pulls into focus. */
export default function FadeIn({ children, delay = 0, className = '' }: FadeInProps) {
  const reduce = useReducedMotion();

  const variants = reduce
    ? {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
      }
    : {
        hidden: { opacity: 0, y: 56, scale: 0.97, filter: 'blur(12px)' },
        visible: { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' },
      };

  return (
    <motion.div
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-70px' }}
      transition={{
        duration: reduce ? 0.3 : 1,
        delay: reduce ? 0 : delay,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.div>
  );
}
