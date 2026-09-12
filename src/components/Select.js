export function Select({ label, value, onChange, children, required, disabled }) {
  return (
    <label className="block mb-4">
      <span className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </span>
      <select
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 bg-gray-50
                   focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand
                   disabled:opacity-50 disabled:cursor-not-allowed
                   hover:bg-white transition-all appearance-none
                   bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%230A5EB0%22%20stroke-width%3D%222%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%2F%3E%3C%2Fsvg%3E')]
                   bg-no-repeat bg-[right_12px_center]"
      >
        {children} 
      </select>
    </label>
  );
}