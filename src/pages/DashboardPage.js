import { useEffect, useState } from 'react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { AppLayout } from '../components/AppLayout';
import { fetchDashboardStats } from '../api/dashboard';

// ── Palette ──────────────────────────────────────────────────────────────────
const NAVY   = '#1B2A4A';
const AMBER  = '#F59E0B';
const TEAL   = '#0D9488';
const ROSE   = '#E11D48';
const VIOLET = '#7C3AED';
const SKY    = '#0EA5E9';
const SLATE  = '#64748B';
const BRAND  = '#1E4FD8'; // matches the icon-blue used in the reference screenshot

const PIE_COLORS_GENDER         = [NAVY, AMBER, SLATE];
const PIE_COLORS_MODE           = [TEAL, AMBER];
const BAR_COLORS_LANGUAGE       = [NAVY, TEAL, AMBER, VIOLET, SKY, ROSE, SLATE];
const BAR_COLOR_AGE             = TEAL;

// ── Hero icons (Global Reach section) ─────────────────────────────────────────
// Simple line icons, same single brand-blue color for all four —
// matches the reference screenshot rather than per-card accent colors.

function IconDisciplesHero({ size = 22, color = BRAND }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="8" r="4" />
      <path d="M2 21v-1a6 6 0 0 1 12 0v1" />
      <path d="M17 8a3 3 0 0 1 0 6" />
      <path d="M16 21v-1a5 5 0 0 0-3-4.6" />
    </svg>
  );
}

function IconGlobeHero({ size = 22, color = BRAND }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <path d="M12 3a13.5 13.5 0 0 1 3.5 9 13.5 13.5 0 0 1-3.5 9 13.5 13.5 0 0 1-3.5-9A13.5 13.5 0 0 1 12 3z" />
    </svg>
  );
}

// Replaces the old "church" icon with a generic training-center / building icon,
// still drawn in the same brand-blue used by the other three icons.
function IconCenterHero({ size = 22, color = BRAND }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 21h16" />
      <path d="M6 21V9l6-4 6 4v12" />
      <path d="M10 21v-5h4v5" />
      <path d="M9 9h.01M15 9h.01M9 13h.01M15 13h.01" />
    </svg>
  );
}

function IconMapHero({ size = 22, color = BRAND }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
      <line x1="8" y1="2" x2="8" y2="18" />
      <line x1="16" y1="6" x2="16" y2="22" />
    </svg>
  );
}

// Used in place of the continents/countries cards on a site-scoped
// dashboard (teacher, leader, ...), where "how many continents" is
// meaningless -- this shows something about their own site instead.
function IconGraduationHero({ size = 22, color = BRAND }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10 12 5 2 10l10 5 10-5z" />
      <path d="M6 12v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5" />
      <path d="M22 10v6" />
    </svg>
  );
}

function IconMaleHero({ size = 22, color = BRAND }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="14" r="6" />
      <path d="M14.5 9.5 21 3" />
      <path d="M15 3h6v6" />
    </svg>
  );
}

function IconFemaleHero({ size = 22, color = BRAND }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="9" r="6" />
      <line x1="12" y1="15" x2="12" y2="22" />
      <line x1="8.5" y1="18.5" x2="15.5" y2="18.5" />
    </svg>
  );
}

// ── Hero stat card ────────────────────────────────────────────────────────────
// Compact, colorful card: a soft tinted icon badge up top, small caps label,
// and the number as the visual anchor. Each card gets its own accent color
// (passed in) so the row reads as a set of distinct, lively stats rather
// than four identical blue tiles. Grows a touch and lifts its shadow on
// hover for a bit of life without being distracting.
function HeroStatCard({ icon, label, value, color = BRAND }) {
  return (
    <div
      className="group bg-white rounded-xl border border-gray-100 shadow-sm
                 px-4 py-4 flex flex-col gap-3
                 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
      style={{ borderTopWidth: '3px', borderTopColor: color }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wide text-gray-400 leading-tight">
          {label}
        </span>
        <div
          className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-transform duration-200 group-hover:scale-110"
          style={{ backgroundColor: `${color}1A` }}
        >
          {icon}
        </div>
      </div>
      <span className="text-3xl font-extrabold leading-none text-gray-900 tabular-nums">
        {value}
      </span>
    </div>
  );
}

// ── Global reach section ──────────────────────────────────────────────────────
// Sits above the existing KPI cards. "Churches" replaced with "Centers"
// throughout, backed by a real distinct-centers count from the backend
// (stats.centersReached).
function GlobalReachSection({ stats }) {
  if (!stats) return null;

  // Site-scoped roles (teacher, leader, ...) never see "how many
  // continents/countries" -- that's always 1 and 1 for them, so it tells
  // them nothing. Show cards about their own site instead: how many
  // disciples they have, how many graduated this year, and the male/
  // female split.
  if (stats.scopedToCenter) {
    const maleCount = stats.byGender.find((g) => g.gender === 'Male')?.count ?? 0;
    const femaleCount = stats.byGender.find((g) => g.gender === 'Female')?.count ?? 0;

    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <HeroStatCard
          icon={<IconDisciplesHero color={BRAND} />}
          label="Your disciples"
          value={stats.totalDisciples.toLocaleString()}
          color={BRAND}
        />
        <HeroStatCard
          icon={<IconGraduationHero color={AMBER} />}
          label={`Graduated in ${stats.currentYear}`}
          value={(stats.graduatesThisYear ?? 0).toLocaleString()}
          color={AMBER}
        />
        <HeroStatCard
          icon={<IconMaleHero color={SKY} />}
          label="Male disciples"
          value={maleCount.toLocaleString()}
          color={SKY}
        />
        <HeroStatCard
          icon={<IconFemaleHero color={ROSE} />}
          label="Female disciples"
          value={femaleCount.toLocaleString()}
          color={ROSE}
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <HeroStatCard
        icon={<IconDisciplesHero color={BRAND} />}
        label="Total BCC disciples"
        value={stats.totalDisciples.toLocaleString()}
        color={BRAND}
      />
      <HeroStatCard
        icon={<IconGlobeHero color={TEAL} />}
        label="Continents reached"
        value={stats.byContinent.length}
        color={TEAL}
      />
      <HeroStatCard
        icon={<IconCenterHero color={VIOLET} />}
        label="Centers with graduates"
        value={(stats.centersReached ?? 0).toLocaleString()}
        color={VIOLET}
      />
      <HeroStatCard
        icon={<IconMapHero color={AMBER} />}
        label="Countries reached"
        value={stats.byCountry.length}
        color={AMBER}
      />
    </div>
  );
}

// ── Small reusable components ─────────────────────────────────────────────────

function ChartCard({ title, subtitle, children, className = '' }) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6 ${className}`}>
      <p className="text-sm font-bold text-gray-800 mb-0.5">{title}</p>
      {subtitle && <p className="text-xs text-gray-400 mb-4">{subtitle}</p>}
      {!subtitle && <div className="mb-4" />}
      {children}
    </div>
  );
}

// Custom tooltip shared by bar charts
function BarTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-sm">
      <p className="font-semibold text-gray-700">{label}</p>
      <p className="text-gray-500">{payload[0].value.toLocaleString()} disciples</p>
    </div>
  );
}

// Custom label for pie slices (only render if slice is big enough)
function PieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) {
  if (percent < 0.06) return null;
  const RADIAN = Math.PI / 180;
  const r = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central"
      fontSize={11} fontWeight={700}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

// ── Continent summary bar (signature element) ────────────────────────────────
function ContinentBar({ data, total }) {
  if (!data?.length || !total) return null;

  // Assign a color per continent deterministically
  const CONT_COLORS = [NAVY, TEAL, AMBER, VIOLET, ROSE, SKY, SLATE];
  const withColors = data.map((d, i) => ({ ...d, color: CONT_COLORS[i % CONT_COLORS.length] }));

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 sm:px-6 py-4 sm:py-5">
      <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
        Disciples by continent
      </p>
      {/* Segmented bar */}
      <div className="flex rounded-full overflow-hidden h-4 mb-4">
        {withColors.map((c) => (
          <div
            key={c.name}
            style={{ width: `${(c.count / total) * 100}%`, backgroundColor: c.color }}
            title={`${c.name}: ${c.count}`}
          />
        ))}
      </div>
      {/* Legend */}
      <div className="flex flex-wrap gap-x-5 gap-y-2">
        {withColors.map((c) => (
          <div key={c.name} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: c.color }} />
            <span className="text-xs text-gray-600">{c.name}</span>
            <span className="text-xs font-semibold text-gray-800">{c.count.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Skeleton loader ──────────────────────────────────────────────────────────
function Skeleton({ className = '' }) {
  return <div className={`bg-gray-100 rounded-xl animate-pulse ${className}`} />;
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Global reach skeleton row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[...Array(4)].map((_, i) => <Skeleton key={`hero-${i}`} className="h-[104px]" />)}
      </div>
      <Skeleton className="h-16" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-72" />
        <Skeleton className="h-72" />
        <Skeleton className="h-72" />
        <Skeleton className="h-72" />
        <Skeleton className="h-72 lg:col-span-2" />
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardStats()
      .then(setStats)
      .catch(() => setError('Could not load dashboard statistics. Please refresh.'));
  }, []);

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  return (
    <AppLayout>
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-0 mb-6">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-gray-900">
            {greeting}, {user?.fullName?.split(' ')[0]}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {stats?.scopedToCenter
              ? `Showing your disciples${stats.site ? ` — ${[stats.site.centerName, stats.site.name].filter(Boolean).join(', ')}` : ''}`
              : 'Global overview — all disciples across all locations'}
          </p>
        </div>
        <span className="text-xs text-gray-300 mt-1 hidden sm:block">
          {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </span>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-6">
          {error}
        </div>
      )}

      {!stats && !error && <DashboardSkeleton />}

      {stats && (
        <div className="space-y-6">

          {/* ── Global reach cards (matches reference screenshot) ── */}
          <GlobalReachSection stats={stats} />

          {/* ── Continent bar (signature element) — meaningless for a
                single-site view where it would always show just one
                continent, so it's admin/super_admin only. ── */}
          {!stats.scopedToCenter && (
            <ContinentBar data={stats.byContinent} total={stats.totalDisciples} />
          )}

          {/* ── Chart grid ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Graduation trend — combo chart: bars + a line overlay on
                the same data, same axis. Bars show the yearly count,
                the line traces the trend across years so both views are
                visible in the one chart at once. */}
            <ChartCard
              title="Graduates per year"
              subtitle={`${stats.graduationByYear[0]?.year}–${stats.graduationByYear[stats.graduationByYear.length - 1]?.year}`}
              className="lg:col-span-2"
            >
              <ResponsiveContainer width="100%" height={260}>
                <ComposedChart data={stats.graduationByYear} barSize={28}
                  margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="year" tick={{ fontSize: 12, fill: SLATE }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: SLATE }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<BarTooltip />} />
                  <Bar dataKey="count" fill={NAVY} radius={[4, 4, 0, 0]} />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke={AMBER}
                    strokeWidth={3}
                    dot={{ r: 4, fill: AMBER, strokeWidth: 0 }}
                    activeDot={{ r: 6 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Top countries — meaningless for a single-site view where
                it would always show just one country, so it's
                admin/super_admin only. */}
            {!stats.scopedToCenter && (
              <ChartCard title="Top countries" subtitle="Disciples per country" className="lg:col-span-2">
                <ResponsiveContainer width="100%" height={Math.max(220, stats.byCountry.length * 30)}>
                  <BarChart
                    data={stats.byCountry}
                    layout="vertical"
                    barSize={16}
                    margin={{ top: 0, right: 24, left: 8, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: SLATE }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" width={110}
                      tick={{ fontSize: 12, fill: '#374151' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<BarTooltip />} />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                      {stats.byCountry.map((_, i) => (
                        <Cell key={i}
                          fill={i === 0 ? NAVY : i === 1 ? TEAL : i < 5 ? SKY : '#CBD5E1'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            )}

            {/* Gender */}
            <ChartCard title="Gender breakdown" subtitle="All disciples">
              {stats.byGender.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-10">No data yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={stats.byGender}
                      dataKey="count"
                      nameKey="gender"
                      cx="50%" cy="50%"
                      outerRadius={85}
                      labelLine={false}
                      label={<PieLabel />}
                    >
                      {stats.byGender.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS_GENDER[i % PIE_COLORS_GENDER.length]} />
                      ))}
                    </Pie>
                    <Legend
                      formatter={(v) => <span className="text-xs text-gray-600">{v}</span>}
                    />
                    <Tooltip formatter={(v, n) => [v.toLocaleString(), n]} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            {/* Age distribution */}
            <ChartCard title="Age distribution" subtitle="All disciples">
              {stats.byAgeGroup.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-10">No data yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart
                    data={stats.byAgeGroup}
                    barSize={28}
                    margin={{ top: 4, right: 8, left: -16, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis dataKey="ageGroup" tick={{ fontSize: 11, fill: SLATE }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: SLATE }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip content={<BarTooltip />} />
                    <Bar dataKey="count" fill={BAR_COLOR_AGE} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            {/* Training mode */}
            <ChartCard title="Training mode" subtitle="Online vs In-person">
              {stats.byTrainingMode.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-10">No data yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={stats.byTrainingMode}
                      dataKey="count"
                      nameKey="trainingMode"
                      cx="50%" cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      labelLine={false}
                      label={<PieLabel />}
                    >
                      {stats.byTrainingMode.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS_MODE[i % PIE_COLORS_MODE.length]} />
                      ))}
                    </Pie>
                    <Legend
                      formatter={(v) => <span className="text-xs text-gray-600">{v}</span>}
                    />
                    <Tooltip formatter={(v, n) => [v.toLocaleString(), n]} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            {/* Training language */}
            <ChartCard title="Training languages" subtitle="Disciples per language">
              {stats.byLanguage.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-10">No data yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart
                    data={stats.byLanguage}
                    barSize={28}
                    margin={{ top: 4, right: 8, left: -16, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: SLATE }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: SLATE }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip content={<BarTooltip />} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {stats.byLanguage.map((_, i) => (
                        <Cell key={i} fill={BAR_COLORS_LANGUAGE[i % BAR_COLORS_LANGUAGE.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

          </div>
        </div>
      )}
    </AppLayout>
  );
}