import React from 'react';

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  icon: Icon = null,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#090909] disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

  const sizes = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2.5',
  };

  const variants = {
    primary: 'bg-white hover:bg-[#d4d4d4] text-[#090909] focus:ring-[#a3a3a3]',
    secondary: 'bg-[#171717] hover:bg-[#262626] text-white border border-[#333333] focus:ring-[#737373]',
    outline: 'border border-[#404040] text-white hover:bg-[#171717] focus:ring-[#737373]',
    ghost: 'text-[#a3a3a3] hover:text-white hover:bg-[#171717]',
    danger: 'bg-[#262626] hover:bg-[#333333] text-white focus:ring-[#737373]',
  };

  return (
    <button
      type={type}
      className={`${baseStyles} ${sizes[size]} ${variants[variant]} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
      ) : Icon ? (
        <Icon className="w-4 h-4 shrink-0" />
      ) : null}
      <span>{children}</span>
    </button>
  );
};

export default Button;
