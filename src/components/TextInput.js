export function TextInput({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  required,
  autoFocus,
  hint, 
}) {
  return (
    <label className="block mb-4">
      <span className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </span>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        autoFocus={autoFocus}
        className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900
                   focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand
                   placeholder:text-gray-300 transition-all bg-gray-50 hover:bg-white"
      />
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </label>
  );
}