'use client';

import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/stores/auth.store';
import { useQuery } from '@tanstack/react-query';
import { getAuthenticatedClient, gql } from '@/lib/graphql-client';
import { useState } from 'react';

// GraphQL Queries
const DASHBOARD_STATS_QUERY = gql`
  query DashboardStats {
    dashboardStats {
      revenueToday
      revenueThisMonth
      appointmentsTodayCount
      appointmentsCheckedInCount
      occupiedBedsCount
      totalBedsCount
      pendingLabOrdersCount
      pendingPrescriptionsCount
      lowStockItemsCount
      activePatientsCount
    }
  }
`;

const RECENT_ACTIVITIES_QUERY = gql`
  query RecentActivities {
    recentActivities(limit: 8) {
      id
      action
      entity
      createdAt
      user {
        firstName
        lastName
      }
    }
  }
`;

const BED_OCCUPANCY_SUMMARY_QUERY = gql`
  query BedOccupancySummary {
    bedOccupancySummary {
      wardName
      wardNameBn
      occupiedBeds
      totalBeds
    }
  }
`;

const PENDING_LAB_ORDERS_QUERY = gql`
  query PendingLabOrders {
    pendingLabOrders(limit: 6) {
      id
      status
      createdAt
      patient {
        id
        uhid
        firstName
        lastName
      }
    }
  }
`;

const PENDING_PRESCRIPTIONS_QUERY = gql`
  query PendingPrescriptions {
    pendingPrescriptions(limit: 6) {
      id
      status
      createdAt
      patient {
        id
        uhid
        firstName
        lastName
      }
    }
  }
`;

const LOW_STOCK_ALERTS_QUERY = gql`
  query LowStockAlerts {
    lowStockAlerts(limit: 6) {
      id
      name
      category
      unit
      totalQty
      reorderLevel
    }
  }
`;

const UPCOMING_FOLLOW_UPS_QUERY = gql`
  query UpcomingFollowUps {
    upcomingFollowUps(limit: 6) {
      id
      followUpDate
      notes
      patient {
        id
        uhid
        firstName
        lastName
      }
    }
  }
`;

// Helper component for KPI Cards
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

export default function DashboardPage() {
  const t = useTranslations('nav');
  const { user } = useAuthStore();
  const client = getAuthenticatedClient();

  // Queries
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      const res: any = await client.request(DASHBOARD_STATS_QUERY);
      return res.dashboardStats;
    },
  });

  const { data: activities } = useQuery({
    queryKey: ['recentActivities'],
    queryFn: async () => {
      const res: any = await client.request(RECENT_ACTIVITIES_QUERY);
      return res.recentActivities;
    },
  });

  const { data: bedSummary } = useQuery({
    queryKey: ['bedOccupancy'],
    queryFn: async () => {
      const res: any = await client.request(BED_OCCUPANCY_SUMMARY_QUERY);
      return res.bedOccupancySummary;
    },
  });

  const { data: labOrders } = useQuery({
    queryKey: ['pendingLabs'],
    queryFn: async () => {
      const res: any = await client.request(PENDING_LAB_ORDERS_QUERY);
      return res.pendingLabOrders;
    },
  });

  const { data: prescriptions } = useQuery({
    queryKey: ['pendingPrescriptions'],
    queryFn: async () => {
      const res: any = await client.request(PENDING_PRESCRIPTIONS_QUERY);
      return res.pendingPrescriptions;
    },
  });

  const { data: lowStock } = useQuery({
    queryKey: ['lowStock'],
    queryFn: async () => {
      const res: any = await client.request(LOW_STOCK_ALERTS_QUERY);
      return res.lowStockAlerts;
    },
  });

  const { data: followUps } = useQuery({
    queryKey: ['upcomingFollowUps'],
    queryFn: async () => {
      const res: any = await client.request(UPCOMING_FOLLOW_UPS_QUERY);
      return res.upcomingFollowUps;
    },
  });

  if (statsLoading) {
    return <div className="p-6">Loading dashboard data...</div>;
  }

  const role = user?.role || 'DOCTOR';

  // Render KPIs based on role
  const renderKPIs = () => {
    switch (role) {
      case 'SUPER_ADMIN':
      case 'ADMIN':
        return (
          <div className="kpi-grid">
            <KPICard
              title="Today's Revenue"
              value={`৳ ${stats?.revenueToday?.toLocaleString() || '0'}`}
              subtitle="Cash & Digital transactions"
              color="rgba(139, 92, 246, 0.12)"
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
              title="Monthly Revenue"
              value={`৳ ${stats?.revenueThisMonth?.toLocaleString() || '0'}`}
              subtitle="Current fiscal month"
              color="rgba(16, 185, 129, 0.12)"
              icon={
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="2"
                >
                  <rect x="2" y="3" width="20" height="14" rx="2" />
                  <line x1="2" y1="10" x2="22" y2="10" />
                </svg>
              }
            />
            <KPICard
              title="Today's Appointments"
              value={`${stats?.appointmentsTodayCount || '0'}`}
              subtitle={`${stats?.appointmentsCheckedInCount || '0'} checked in`}
              color="rgba(51, 102, 204, 0.12)"
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
                </svg>
              }
            />
            <KPICard
              title="Occupied Beds"
              value={`${stats?.occupiedBedsCount || '0'} / ${stats?.totalBedsCount || '0'}`}
              subtitle="IPD Bed Board occupancy"
              color="rgba(245, 158, 11, 0.12)"
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
          </div>
        );

      case 'DOCTOR':
        return (
          <div className="kpi-grid">
            <KPICard
              title="Today's Appointments"
              value={`${stats?.appointmentsTodayCount || '0'}`}
              subtitle="OPD Consultation queue"
              color="rgba(51, 102, 204, 0.12)"
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
                </svg>
              }
            />
            <KPICard
              title="Active Patients"
              value={`${stats?.activePatientsCount || '0'}`}
              color="rgba(16, 185, 129, 0.12)"
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
                </svg>
              }
            />
            <KPICard
              title="Pending Lab Results"
              value={`${stats?.pendingLabOrdersCount || '0'}`}
              subtitle="Awaiting clinical sign-off"
              color="rgba(239, 68, 68, 0.12)"
              icon={
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#EF4444"
                  strokeWidth="2"
                >
                  <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v11" />
                </svg>
              }
            />
          </div>
        );

      case 'PHARMACIST':
        return (
          <div className="kpi-grid">
            <KPICard
              title="Pending Prescriptions"
              value={`${stats?.pendingPrescriptionsCount || '0'}`}
              subtitle="Awaiting fulfillment"
              color="rgba(139, 92, 246, 0.12)"
              icon={
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#8B5CF6"
                  strokeWidth="2"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              }
            />
            <KPICard
              title="Low Stock Items"
              value={`${stats?.lowStockItemsCount || '0'}`}
              subtitle="Below safety margin"
              color="rgba(239, 68, 68, 0.12)"
              icon={
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#EF4444"
                  strokeWidth="2"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                </svg>
              }
            />
          </div>
        );

      default:
        return (
          <div className="kpi-grid">
            <KPICard
              title="Active Patients"
              value={`${stats?.activePatientsCount || '0'}`}
              color="rgba(16, 185, 129, 0.12)"
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
                </svg>
              }
            />
            <KPICard
              title="Today's Appointments"
              value={`${stats?.appointmentsTodayCount || '0'}`}
              color="rgba(51, 102, 204, 0.12)"
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
                </svg>
              }
            />
          </div>
        );
    }
  };

  // Render role-specific main widgets
  const renderWidgets = () => {
    switch (role) {
      case 'SUPER_ADMIN':
      case 'ADMIN':
        return (
          <div className="dash-grid">
            {/* Bed Board Occupancy breakdown */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">🛏 Ward Bed Occupancy</span>
              </div>
              <div className="card-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {bedSummary?.map((ward: any) => {
                    const percent = Math.round((ward.occupiedBeds / ward.totalBeds) * 100) || 0;
                    return (
                      <div key={ward.wardName}>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginBottom: 6,
                            fontSize: 13,
                          }}
                        >
                          <span className="font-semibold">{ward.wardName}</span>
                          <span
                            style={{
                              color:
                                percent > 80 ? '#EF4444' : percent > 50 ? '#F59E0B' : '#10B981',
                            }}
                          >
                            {ward.occupiedBeds} / {ward.totalBeds} ({percent}%)
                          </span>
                        </div>
                        <div style={{ height: 8, background: '#F1F5F9', borderRadius: 99 }}>
                          <div
                            style={{
                              height: '100%',
                              width: `${percent}%`,
                              background:
                                percent > 80 ? '#EF4444' : percent > 50 ? '#F59E0B' : '#10B981',
                              borderRadius: 99,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Recent Activity Log */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">🕒 Recent Activity Logs</span>
              </div>
              <div className="card-body" style={{ padding: 0 }}>
                {!activities?.length ? (
                  <div className="p-6 text-center text-slate-400">No recent activity</div>
                ) : (
                  <table className="dash-table">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Action</th>
                        <th>Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activities.map((act: any) => (
                        <tr key={act.id}>
                          <td className="font-semibold">
                            {act.user ? `${act.user.firstName} ${act.user.lastName}` : 'System'}
                          </td>
                          <td>
                            <code>{act.action}</code> ({act.entity})
                          </td>
                          <td style={{ color: '#64748B' }}>
                            {new Date(act.createdAt).toLocaleTimeString('en-BD', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        );

      case 'DOCTOR':
        return (
          <div className="dash-grid">
            {/* Lab results to review */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">🔬 Lab Results Review Queue</span>
              </div>
              <div className="card-body" style={{ padding: 0 }}>
                {!labOrders?.length ? (
                  <div className="p-6 text-center text-slate-400">No pending results</div>
                ) : (
                  <table className="dash-table">
                    <thead>
                      <tr>
                        <th>UHID</th>
                        <th>Patient</th>
                        <th>Status</th>
                        <th>Created At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {labOrders.map((o: any) => (
                        <tr key={o.id}>
                          <td>
                            <code>{o.patient?.uhid}</code>
                          </td>
                          <td className="font-semibold">
                            {o.patient?.firstName} {o.patient?.lastName}
                          </td>
                          <td>
                            <span className="badge badge-warning">{o.status}</span>
                          </td>
                          <td style={{ color: '#64748B' }}>
                            {new Date(o.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Upcoming Follow Ups */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">📅 Patient Follow Ups</span>
              </div>
              <div className="card-body" style={{ padding: 0 }}>
                {!followUps?.length ? (
                  <div className="p-6 text-center text-slate-400">No upcoming followups</div>
                ) : (
                  <table className="dash-table">
                    <thead>
                      <tr>
                        <th>UHID</th>
                        <th>Patient</th>
                        <th>Notes</th>
                        <th>Follow Up Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {followUps.map((f: any) => (
                        <tr key={f.id}>
                          <td>
                            <code>{f.patient?.uhid}</code>
                          </td>
                          <td className="font-semibold">
                            {f.patient?.firstName} {f.patient?.lastName}
                          </td>
                          <td>{f.notes || 'Routine consultation'}</td>
                          <td style={{ color: '#64748B' }}>
                            {new Date(f.followUpDate).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        );

      case 'PHARMACIST':
        return (
          <div className="dash-grid">
            {/* Pending prescriptions */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">💊 Pending Prescriptions</span>
              </div>
              <div className="card-body" style={{ padding: 0 }}>
                {!prescriptions?.length ? (
                  <div className="p-6 text-center text-slate-400">No pending prescriptions</div>
                ) : (
                  <table className="dash-table">
                    <thead>
                      <tr>
                        <th>UHID</th>
                        <th>Patient</th>
                        <th>Status</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {prescriptions.map((p: any) => (
                        <tr key={p.id}>
                          <td>
                            <code>{p.patient?.uhid}</code>
                          </td>
                          <td className="font-semibold">
                            {p.patient?.firstName} {p.patient?.lastName}
                          </td>
                          <td>
                            <span className="badge badge-warning">{p.status}</span>
                          </td>
                          <td style={{ color: '#64748B' }}>
                            {new Date(p.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Low stock alerts */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">⚠️ Low Drug Stock Warnings</span>
              </div>
              <div className="card-body" style={{ padding: 0 }}>
                {!lowStock?.length ? (
                  <div className="p-6 text-center text-slate-400">All drug stocks normal</div>
                ) : (
                  <table className="dash-table">
                    <thead>
                      <tr>
                        <th>Medicine</th>
                        <th>Category</th>
                        <th>Qty</th>
                        <th>Reorder lvl</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lowStock.map((l: any) => (
                        <tr key={l.id}>
                          <td className="font-semibold text-red">{l.name}</td>
                          <td>{l.category}</td>
                          <td>
                            {l.totalQty} {l.unit}
                          </td>
                          <td>
                            {l.reorderLevel} {l.unit}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="dash-grid">
            <div className="card">
              <div className="card-header">
                <span className="card-title">🕒 Recent Activity Logs</span>
              </div>
              <div className="card-body" style={{ padding: 0 }}>
                {!activities?.length ? (
                  <div className="p-6 text-center text-slate-400">No recent activity</div>
                ) : (
                  <table className="dash-table">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Action</th>
                        <th>Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activities.map((act: any) => (
                        <tr key={act.id}>
                          <td className="font-semibold">
                            {act.user ? `${act.user.firstName} ${act.user.lastName}` : 'System'}
                          </td>
                          <td>
                            <code>{act.action}</code> ({act.entity})
                          </td>
                          <td style={{ color: '#64748B' }}>
                            {new Date(act.createdAt).toLocaleTimeString('en-BD', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="dashboard">
      {/* Header */}
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
      </div>

      {/* Role specific KPIs row */}
      {renderKPIs()}

      {/* Role specific widgets row */}
      {renderWidgets()}

      <style>{`
        .dashboard { padding: 0; display: flex; flex-direction: column; gap: 20px; }
        .dash-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
        .dash-title { font-size: 22px; font-weight: 700; color: var(--text-primary); }
        .dash-subtitle { font-size: 13px; color: var(--text-muted); margin-top: 2px; }
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
        }
        .kpi-card {
          background: var(--bg-primary);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 18px;
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
        .kpi-subtitle { font-size: 11.5px; color: var(--text-secondary); margin-top: 4px; }
        .dash-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        @media (max-width: 900px) { .dash-grid { grid-template-columns: 1fr; } }
        .dash-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .dash-table th { background: var(--bg-secondary); padding: 10px 16px; text-align: left; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; color: var(--text-muted); border-bottom: 1px solid var(--border); }
        .dash-table td { padding: 12px 16px; border-bottom: 1px solid var(--border); color: var(--text-secondary); }
        .dash-table tr:hover td { background: var(--bg-secondary); }
        .badge { display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 600; text-transform: uppercase; }
        .badge-success { background: #ECFDF5; color: #10B981; }
        .badge-danger { background: #FEF2F2; color: #DC2626; }
        .badge-warning { background: #FFFBEB; color: #F59E0B; }
        code { background: var(--bg-tertiary); padding: 2px 6px; border-radius: 4px; font-family: var(--font-mono); font-size: 12px; font-weight: 600; color: var(--brand-blue); }
        .text-red { color: #DC2626 !important; }
      `}</style>
    </div>
  );
}
