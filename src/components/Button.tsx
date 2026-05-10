import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

const variantClasses = {
  primary: 'bg-gradient-to-r from-[#14b8a6] to-[#0d9488] text-white hover:from-[#0fb0a0] hover:to-[#0b8278] border border-white/30',
  secondary: 'bg-gradient-to-r from-[#6366f1] to-[#4338ca] text-white hover:from-[#585de6] hover:to-[#3b30b8] border border-white/30',
  success: 'bg-gradient-to-r from-[#22c55e] to-[#16a34a] text-white hover:from-[#1fb357] hover:to-[#15803d] border border-white/30',
  danger: 'bg-gradient-to-r from-[#ef4444] to-[#dc2626] text-white hover:from-[#dc3e3e] hover:to-[#c72222] border border-white/30',
  warning: 'bg-gradient-to-r from-[#fbbf24] to-[#f59e0b] text-[#6a422d] hover:from-[#f5b524] hover:to-[#df900a] border border-white/40',
  outline: 'bg-white/85 border-2 border-[#e5c9a3] text-[#6a422d] hover:border-[#14b8a6] hover:bg-[#f0fdfa]',
};

const sizeClasses = {
  sm: 'px-4 py-2.5 text-sm min-h-11',
  md: 'px-6 py-3 text-base min-h-11',
  lg: 'px-8 py-4 text-lg min-h-12',
};

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  type = 'button',
}) => {
  const reduceMotion = useReducedMotion();

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled || reduceMotion ? undefined : { y: -2, scale: 1.01 }}
      whileTap={disabled || reduceMotion ? undefined : { y: 1, scale: 0.985 }}
      className={`
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        rounded-3xl font-bold transition-all duration-200 transition-bouncy
        shadow-[0_10px_18px_rgba(106,66,45,0.16)] hover:shadow-[0_14px_24px_rgba(106,66,45,0.2)] active:shadow-[0_6px_12px_rgba(106,66,45,0.15)] active:translate-y-1
        interactive-focus touch-target
        ${disabled ? 'opacity-50 cursor-not-allowed shadow-none active:translate-y-0' : 'cursor-pointer'}
        ${className}
      `}
    >
      {children}
    </motion.button>
  );
};
