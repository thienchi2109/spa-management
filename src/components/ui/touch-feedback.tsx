'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface TouchFeedbackProps {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onTap?: () => void;
  hapticFeedback?: boolean;
}

/**
 * Component that provides visual and haptic feedback for touch interactions
 * Improves mobile UX with proper touch states
 */
export function TouchFeedback({
  children,
  className,
  disabled = false,
  onTap,
  hapticFeedback = true,
}: TouchFeedbackProps) {
  const [isPressed, setIsPressed] = useState(false);

  const handleTouchStart = () => {
    if (disabled) return;
    setIsPressed(true);
    
    // Haptic feedback for supported devices
    if (hapticFeedback && 'vibrate' in navigator) {
      navigator.vibrate(10); // Very light vibration
    }
  };

  const handleTouchEnd = () => {
    setIsPressed(false);
    if (onTap && !disabled) {
      onTap();
    }
  };

  const handleTouchCancel = () => {
    setIsPressed(false);
  };

  return (
    <div
      className={cn(
        'transition-all duration-150 ease-out',
        isPressed && !disabled && 'scale-95 opacity-80',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
      onMouseLeave={handleTouchCancel}
    >
      {children}
    </div>
  );
}

/**
 * Enhanced button component with better mobile touch feedback
 */
interface MobileButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export function MobileButton({
  children,
  className,
  variant = 'default',
  size = 'md',
  loading = false,
  disabled,
  ...props
}: MobileButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50';
  
  const variantClasses = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90',
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
  };

  const sizeClasses = {
    sm: 'h-9 px-3 text-sm min-w-[44px]', // Minimum 44px for touch targets
    md: 'h-10 px-4 py-2 min-w-[44px]',
    lg: 'h-11 px-8 min-w-[44px]',
  };

  return (
    <TouchFeedback disabled={disabled || loading}>
      <button
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        )}
        {children}
      </button>
    </TouchFeedback>
  );
}

/**
 * Card component with touch feedback for mobile
 */
interface TouchableCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}

export function TouchableCard({
  children,
  className,
  onClick,
  disabled = false,
}: TouchableCardProps) {
  return (
    <TouchFeedback
      className={cn(
        'rounded-lg border bg-card text-card-foreground shadow-sm',
        onClick && !disabled && 'cursor-pointer hover:shadow-md',
        className
      )}
      onTap={onClick}
      disabled={disabled}
    >
      {children}
    </TouchFeedback>
  );
}

/**
 * List item with touch feedback
 */
interface TouchableListItemProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}

export function TouchableListItem({
  children,
  className,
  onClick,
  disabled = false,
}: TouchableListItemProps) {
  return (
    <TouchFeedback
      className={cn(
        'flex items-center space-x-4 rounded-lg p-3',
        onClick && !disabled && 'cursor-pointer hover:bg-accent',
        className
      )}
      onTap={onClick}
      disabled={disabled}
    >
      {children}
    </TouchFeedback>
  );
}
