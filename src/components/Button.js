export function Button({
  children,
  type = 'submit',
  isLoading,
  disabled,
  onClick,
  variant = 'primary',
  size = 'md',
}) {
  const base =
    'w-full rounded-xl font-semibold transition-all duration-150 disabled:opacity-55 disabled:cursor-not-allowed flex items-center justify-center gap-2';
 
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-5 py-3 text-base',
  };

  const variants = {
    primary:
      'bg-brand text-white hover:bg-brand-dark shadow-sm hover:shadow-md',
    secondary:
      'bg-white text-brand border border-brand/25 hover:bg-brand-pale hover:border-brand/40',
    danger:
      'bg-red-600 text-white hover:bg-red-700 shadow-sm',
    ghost:
      'bg-transparent text-brand hover:bg-brand-pale',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`${base} ${sizes[size] ?? sizes.md} ${variants[variant] ?? variants.primary}`}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
          </svg>
          Please wait…
        </>
      ) : (
        children
      )}
    </button>
  );
}