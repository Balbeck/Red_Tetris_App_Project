'use client';

import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  fullWidth?: boolean;
  type?: 'button' | 'submit';
}

const variantClasses = {
  primary: 'btn-primary text-white font-semibold',
  secondary: 'bg-white/10 hover:bg-white/20 text-white border border-white/20',
  danger: 'bg-red-600/80 hover:bg-red-500 text-white border border-red-500/30',
  ghost: 'bg-transparent hover:bg-white/10 text-white/70 hover:text-white',
};

const sizeClasses = {
  sm: 'px-4 py-2 text-sm rounded-lg',
  md: 'px-6 py-3 text-base rounded-xl',
  lg: 'px-8 py-4 text-lg rounded-xl',
};

const Button_Component = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  fullWidth = false,
  type = 'button',
}: ButtonProps) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    className={[
      variantClasses[variant],
      sizeClasses[size],
      fullWidth ? 'w-full' : '',
      disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : 'cursor-pointer',
      'transition-all duration-200 active:scale-95 select-none',
    ].join(' ')}
  >
    {children}
  </button>
);

export default Button_Component;
