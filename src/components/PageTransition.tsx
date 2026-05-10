"use client";

import React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

interface PageTransitionProps {
  routeKey: string;
  children: React.ReactNode;
}

export function PageTransition({ routeKey, children }: PageTransitionProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div>{children}</div>;
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={routeKey}
        initial={{ opacity: 0, y: 18, scale: 0.992, filter: 'blur(5px)' }}
        animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
        exit={{ opacity: 0, y: -12, scale: 0.996, filter: 'blur(3px)' }}
        transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
        className="page-stage"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
