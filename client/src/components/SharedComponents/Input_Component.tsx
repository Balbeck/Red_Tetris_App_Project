'use client';

import React from 'react';

interface InputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  maxLength?: number;
  autoFocus?: boolean;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}

const Input_Component = ({
  label,
  value,
  onChange,
  placeholder,
  error,
  maxLength,
  autoFocus,
  onKeyDown,
}: InputProps) => (
  <div className="flex flex-col gap-1.5 w-full">
    {label && (
      <label className="text-sm font-medium text-white/60 uppercase tracking-widest">
        {label}
      </label>
    )}
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      autoFocus={autoFocus}
      onKeyDown={onKeyDown}
      className={[
        'w-full px-4 py-3 rounded-xl',
        'bg-white/5 border text-white placeholder-white/30',
        'input-glow transition-all duration-200',
        error ? 'border-red-500/60' : 'border-white/10 focus:border-purple-500/60',
        'outline-none text-base',
      ].join(' ')}
    />
    {error && (
      <p className="text-red-400 text-sm animate-fade-in">{error}</p>
    )}
  </div>
);

export default Input_Component;
