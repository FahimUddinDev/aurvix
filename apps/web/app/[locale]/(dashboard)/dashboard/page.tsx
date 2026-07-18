'use client';

import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/stores/auth.store';

// ── KPI Card ──────────────────────────────────────────────────────────────────

function KPICard({
  title,
  value,
  subtitle,
  color,
  icon,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="kpi-card">
      <div className="kpi-icon" style={{ background: color }}>
        {icon}
      </div>
      <div>
        <div className="kpi-value">{value}</div>
        <div className="kpi-title">{title}</div>
        {subtitle && <div className="kpi-subtitle">{subtitle}</div>}
      </div>
    </div>
  );
}

// ── Simple Bar Chart placeholder ──────────────────────────────────────────────

function MiniBarChart({ data }: { data: number[] }) {
  const max = Math.max(...data);
  return (
    <div className="mini-bar">
      {data.map((v, i) => (
        <div key={i} className="mini-bar-item" style={{ height: `${(v / max) * 100}%` }} />
      ))}
    </div>
  );
}

// ── Bed Heatmap ───────────────────────────────────────────────────────────────

function BedCell({ status }: { status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'CLEANING' }) {
  const colors: Record<string, string> = {
    AVAILABLE: '#10B981',
    OCCUPIED: '#EF4444',
    RESERVED: '#F59E0B',
    CLEANING: '#3B82F6',
  };
  return (
    <div
      title={status}
      style={{
        width: 18,
        height: 18,
        borderRadius: 4,
        background: colors[status],
        opacity: 0.85,
      }}
    />
  );
}

// ── Demo data ─────────────────────────────────────────────────────────────────

const DEMO_BEDS = Array.from({ length: 40 }, (_, i) => {
  const statuses: Array<'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'CLEANING'> = [
    'AVAILABLE',
    'OCCUPIED',
    'RESERVED',
    'CLEANING',
  ];
  return statuses[Math.floor(Math.random() * 4)] as
    'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'CLEANING';
});

const DEMO_QUEUE = [
  {
    token: 'T-001',
    name: 'Karim Uddin',
    doctor: 'Dr. Rahim',
    wait: '5 min',
    status: 'IN_PROGRESS',
  },
  {
    token: 'T-002',
    name: 'Fatema Khatun',
    doctor: 'Dr. Rahim',
    wait: '15 min',
    status: 'CONFIRMED',
  },
  {
    token: 'T-003',
    name: 'Motiur Rahman',
    doctor: 'Dr. Karim',
    wait: '20 min',
    status: 'CONFIRMED',
  },
  {
    token: 'T-004',
    name: 'Nasrin Sultana',
    doctor: 'Dr. Fatema',
    wait: '30 min',
    status: 'BOOKED',
  },
  { token: 'T-005', name: 'Abdur Razzak', doctor: 'Dr. Fatema', wait: '35 min', status: 'BOOKED' },
];

const DEMO_CRITICAL_LABS = [
  { patient: 'Karim Uddin', test: 'Blood Glucose', value: '420 mg/dL', flag: 'CRITICAL_HIGH' },
  { patient: 'Aisha Begum', test: 'Hemoglobin', value: '5.2 g/dL', flag: 'CRITICAL_LOW' },
];

const REVENUE_DATA = [180, 220, 195, 250, 280, 310, 295];

export default function DashboardPage() {
  const t = useTranslations('nav');
  const { user } = useAuthStore();

  return (
    <div className="dashboard">
      {/* ── Header ── */}
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Good morning, {user?.firstName ?? 'User'} 👋</h1>
          <p className="dash-subtitle">
            {new Date().toLocaleDateString('en-BD', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        <div className="dash-actions">
          <button className="dash-action-btn">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 5v14M5 12l7 7 7-7" />
            </svg>
            Export
          </button>
        </div>
      </div>

      {/* ── KPI Row ── */}
      <div className="kpi-grid">
        <KPICard
          title="Today's Appointments"
          value="128"
          subtitle="↑ 12 from yesterday"
          color="rgba(51,102,204,0.12)"
          icon={
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#3366CC"
              strokeWidth="2"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          }
        />
        <KPICard
          title="OPD Patients"
          value="87"
          subtitle="34 in queue"
          color="rgba(16,185,129,0.12)"
          icon={
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#10B981"
              strokeWidth="2"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          }
        />
        <KPICard
          title="IPD Occupied Beds"
          value="62/80"
          subtitle="18 available"
          color="rgba(245,158,11,0.12)"
          icon={
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#F59E0B"
              strokeWidth="2"
            >
              <rect x="2" y="7" width="20" height="14" rx="2" />
              <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
            </svg>
          }
        />
        <KPICard
          title="Today's Revenue"
          value="৳ 2,84,500"
          subtitle="↑ 8.2% vs last week"
          color="rgba(139,92,246,0.12)"
          icon={
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#8B5CF6"
              strokeWidth="2"
            >
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          }
        />
        <KPICard
          title="Pending Lab Results"
          value="23"
          subtitle="3 critical"
          color="rgba(239,68,68,0.12)"
          icon={
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#EF4444"
              strokeWidth="2"
            >
              <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v11m0 0a4 4 0 0 0 4 4h2a4 4 0 0 0 4-4V9M9 14H5a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h4" />
            </svg>
          }
        />
        <KPICard
          title="Pharmacy Sales"
          value="৳ 1,12,800"
          subtitle="64 transactions"
          color="rgba(20,184,166,0.12)"
          icon={
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#14B8A6"
              strokeWidth="2"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          }
        />
      </div>

      {/* ── Main Grid ── */}
      <div className="dash-grid">
        {/* Left: Queue + Critical Labs */}
        <div className="dash-col-left">
          {/* Live Queue */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">🔴 Live OPD Queue</span>
              <span className="badge badge-danger">Live</span>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Token</th>
                    <th>Patient</th>
                    <th>Doctor</th>
                    <th>Wait</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {DEMO_QUEUE.map((q) => (
                    <tr key={q.token}>
                      <td>
                        <span
                          style={{ fontFamily: 'monospace', fontWeight: 700, color: '#3366CC' }}
                        >
                          {q.token}
                        </span>
                      </td>
                      <td>{q.name}</td>
                      <td style={{ color: '#64748B' }}>{q.doctor}</td>
                      <td style={{ color: '#64748B' }}>{q.wait}</td>
                      <td>
                        <span
                          className={`badge ${q.status === 'IN_PROGRESS' ? 'badge-success' : q.status === 'CONFIRMED' ? 'badge-info' : 'badge-default'}`}
                        >
                          {q.status.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Critical Lab Alerts */}
          {DEMO_CRITICAL_LABS.length > 0 && (
            <div className="card" style={{ borderColor: '#FECACA' }}>
              <div className="card-header" style={{ background: '#FEF2F2' }}>
                <span className="card-title" style={{ color: '#DC2626' }}>
                  ⚠️ Critical Lab Values
                </span>
              </div>
              <div className="card-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {DEMO_CRITICAL_LABS.map((lab, i) => (
                    <div key={i} className="critical-alert">
                      <span>🔺 {lab.flag === 'CRITICAL_HIGH' ? '▲' : '▼'}</span>
                      <span>{lab.patient}</span>
                      <span style={{ opacity: 0.85 }}>
                        — {lab.test}: <strong>{lab.value}</strong>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Bed Board + Revenue */}
        <div className="dash-col-right">
          {/* Bed Board */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">🛏 Bed Board</span>
              <div style={{ display: 'flex', gap: 8, fontSize: 11 }}>
                <span style={{ color: '#10B981' }}>● Available</span>
                <span style={{ color: '#EF4444' }}>● Occupied</span>
                <span style={{ color: '#F59E0B' }}>● Reserved</span>
              </div>
            </div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 6 }}>
                {DEMO_BEDS.map((status, i) => (
                  <BedCell key={i} status={status} />
                ))}
              </div>
            </div>
          </div>

          {/* Revenue Trend */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">📈 Weekly Revenue (BDT)</span>
              <span className="badge badge-success">↑ 8.2%</span>
            </div>
            <div className="card-body">
              <MiniBarChart data={REVENUE_DATA} />
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: 8,
                  fontSize: 11,
                  color: '#94A3B8',
                }}
              >
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                  <span key={d}>{d}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">📊 Department Load</span>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { dept: 'General Medicine', load: 92 },
                  { dept: 'Cardiology', load: 78 },
                  { dept: 'Pediatrics', load: 65 },
                  { dept: 'Gynecology', load: 55 },
                  { dept: 'Orthopedics', load: 40 },
                ].map(({ dept, load }) => (
                  <div key={dept}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: 4,
                        fontSize: 12,
                      }}
                    >
                      <span>{dept}</span>
                      <span
                        style={{
                          fontWeight: 600,
                          color: load > 80 ? '#EF4444' : load > 60 ? '#F59E0B' : '#10B981',
                        }}
                      >
                        {load}%
                      </span>
                    </div>
                    <div style={{ height: 6, background: '#F1F5F9', borderRadius: 99 }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${load}%`,
                          background: load > 80 ? '#EF4444' : load > 60 ? '#F59E0B' : '#10B981',
                          borderRadius: 99,
                          transition: 'width 0.5s',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .dashboard { padding: 0; }
        .dash-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
        .dash-title { font-size: 22px; font-weight: 700; color: var(--text-primary); }
        .dash-subtitle { font-size: 13px; color: var(--text-muted); margin-top: 2px; }
        .dash-actions { display: flex; gap: 8px; }
        .dash-action-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 7px 14px; border: 1px solid var(--border);
          border-radius: var(--radius); background: white;
          font-size: 13px; font-weight: 500; cursor: pointer;
          transition: background var(--transition);
        }
        .dash-action-btn:hover { background: var(--bg-secondary); }
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }
        .kpi-card {
          background: var(--bg-primary);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 16px;
          display: flex;
          align-items: flex-start;
          gap: 14px;
          box-shadow: var(--shadow-sm);
        }
        .kpi-icon {
          width: 44px; height: 44px;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .kpi-value { font-size: 22px; font-weight: 700; color: var(--text-primary); }
        .kpi-title { font-size: 12px; color: var(--text-muted); margin-top: 2px; }
        .kpi-subtitle { font-size: 11px; color: #10B981; margin-top: 3px; }
        .dash-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        @media (max-width: 1100px) { .dash-grid { grid-template-columns: 1fr; } }
        .dash-col-left { display: flex; flex-direction: column; gap: 16px; }
        .dash-col-right { display: flex; flex-direction: column; gap: 16px; }
        .dash-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .dash-table th { background: var(--bg-secondary); padding: 10px 16px; text-align: left; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; color: var(--text-muted); }
        .dash-table td { padding: 10px 16px; border-top: 1px solid var(--border); }
        .dash-table tr:hover td { background: var(--bg-secondary); }
        .mini-bar {
          display: flex; gap: 6px; align-items: flex-end;
          height: 80px;
        }
        .mini-bar-item {
          flex: 1;
          background: linear-gradient(to top, #3366CC, #5B8DEF);
          border-radius: 4px 4px 0 0;
          min-height: 4px;
          transition: height 0.3s;
        }
      `}</style>
    </div>
  );
}
