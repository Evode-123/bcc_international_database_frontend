export function AuthCard({ title, subtitle, children }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'linear-gradient(145deg, #0A2E6E 0%, #0A5EB0 60%, #1E7FD8 100%)' }}
    >
      <div className="w-full max-w-md"> 
        {/* Logo header */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-20 h-20 rounded-full overflow-hidden ring-4 ring-white/20 mb-3 shadow-xl">
            <img
              src="/bcc_logo.png"
              alt="BCC"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentElement.innerHTML =
                  '<div style="width:80px;height:80px;background:#1E7FD8;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:800;color:white">BCC</div>';
              }}
            />
          </div>
          <p className="text-white/80 text-sm font-medium tracking-wide">
            Bible Communication Center
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ boxShadow: '0 20px 60px rgba(10,46,110,0.35)' }}
        >
          {/* Card header strip */}
          <div
            className="px-8 py-5"
            style={{ background: 'rgba(255,255,255,0.12)', borderBottom: '1px solid rgba(255,255,255,0.15)' }}
          >
            <h1 className="text-xl font-bold text-white">{title}</h1>
            {subtitle && <p className="text-sm text-white/65 mt-0.5">{subtitle}</p>}
          </div>

          {/* Card body */}
          <div className="bg-white px-8 py-7">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}