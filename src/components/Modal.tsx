import React, { ReactNode } from 'react';
import { X } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
}) => {
  const reduceMotion = useReducedMotion();

  React.useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
      <motion.div
        className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-3 sm:p-4"
        initial={reduceMotion ? undefined : { opacity: 0 }}
        animate={reduceMotion ? undefined : { opacity: 1 }}
        exit={reduceMotion ? undefined : { opacity: 0 }}
        transition={{ duration: 0.2 }}
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) {
            onClose();
          }
        }}
      >
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          initial={reduceMotion ? undefined : { opacity: 0, y: 14, scale: 0.96 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
          exit={reduceMotion ? undefined : { opacity: 0, y: 8, scale: 0.98 }}
          transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          className={`${sizeClasses[size]} w-full bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto`}
        >
          <div className="flex justify-between items-center px-4 py-4 sm:p-6 border-b-4 border-islamic-blue">
            <h2 className="text-lg sm:text-2xl font-bold text-islamic-dark">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-red-500 transition interactive-focus touch-target"
              aria-label="Close modal"
            >
              <X size={28} />
            </button>
          </div>
          <div className="px-4 py-4 sm:p-6">
            {children}
          </div>
        </motion.div>
      </motion.div>
    )}
    </AnimatePresence>
  );
};
