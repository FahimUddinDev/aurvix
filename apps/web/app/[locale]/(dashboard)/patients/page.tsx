'use client';

import { useTranslations } from 'next-intl';
import { useRouter, useParams } from 'next/navigation';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAuthenticatedClient, gql } from '@/lib/graphql-client';

const PATIENTS_QUERY = gql`
  query Patients($search: String, $page: Int, $limit: Int) {
    patients(search: $search, page: $page, limit: $limit) {
      items {
        id
        uhid
        firstName
        lastName
        firstNameBn
        lastNameBn
        dateOfBirth
        gender
        bloodGroup
        phone
        isActive
      }
      total
      page
      limit
    }
  }
`;

export default function PatientListPage() {
  const t = useTranslations('settings');
  const commonT = useTranslations('common');
  const router = useRouter();
  const params = useParams();
  const locale = (params.locale as string) || 'en';

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const client = getAuthenticatedClient();

  // Query patient listings
  const { data: patientsData, isLoading } = useQuery({
    queryKey: ['patients', search, page],
    queryFn: async () => {
      const res: any = await client.request(PATIENTS_QUERY, {
        search: search || undefined,
        page,
        limit: 10,
      });
      return res.patients;
    },
  });

  const calculateAge = (dobString: string) => {
    if (!dobString) return '—';
    const dob = new Date(dobString);
    const diff = Date.now() - dob.getTime();
    const ageDate = new Date(diff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  const handleRegisterClick = () => {
    router.push(`/${locale}/patients/new`);
  };

  const handleViewProfile = (id: string) => {
    router.push(`/${locale}/patients/${id}`);
  };

  const totalPages = patientsData ? Math.ceil(patientsData.total / 10) : 1;

  return (
    <div className="patient-list-container">
      {/* Page Header */}
      <div className="settings-header">
        <div>
          <h1 className="settings-title">Patients Directory</h1>
          <p className="settings-subtitle">
            Search, view medical history, and register new patients
          </p>
        </div>
        <button onClick={handleRegisterClick} className="btn btn-primary">
          + Register Patient
        </button>
      </div>

      {/* Search Bar */}
      <div className="filters-card card">
        <div className="card-body">
          <div className="search-group">
            <input
              type="text"
              placeholder="Search by Patient Name, Phone, NID, or UHID..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="form-input search-input"
            />
            <svg
              className="search-icon"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
        </div>
      </div>

      {/* Patient List Card */}
      <div className="card table-card">
        <div className="card-body p-0">
          {isLoading ? (
            <div className="p-6 text-center text-slate-500">Loading patients database...</div>
          ) : !patientsData?.items?.length ? (
            <div className="p-6 text-center text-slate-500">{commonT('noData')}</div>
          ) : (
            <div className="table-responsive">
              <table className="settings-table">
                <thead>
                  <tr>
                    <th>UHID</th>
                    <th>Patient Name</th>
                    <th>Gender</th>
                    <th>Age</th>
                    <th>Phone</th>
                    <th>Blood Group</th>
                    <th>Status</th>
                    <th>{commonT('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {patientsData.items.map((p: any) => (
                    <tr key={p.id}>
                      <td>
                        <code className="uhid-code">{p.uhid}</code>
                      </td>
                      <td>
                        <div className="patient-name-cell">
                          <span className="font-semibold">
                            {p.firstName} {p.lastName}
                          </span>
                          {(p.firstNameBn || p.lastNameBn) && (
                            <span className="bilingual-sub">
                              {p.firstNameBn || ''} {p.lastNameBn || ''}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="capitalize">{p.gender.toLowerCase()}</td>
                      <td>{calculateAge(p.dateOfBirth)} yrs</td>
                      <td>{p.phone}</td>
                      <td>
                        <span className="blood-badge">
                          {p.bloodGroup
                            ? p.bloodGroup.replace('_POS', '+').replace('_NEG', '-')
                            : '—'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${p.isActive ? 'badge-success' : 'badge-danger'}`}>
                          {p.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="actions-cell">
                        <button
                          onClick={() => handleViewProfile(p.id)}
                          className="action-btn text-blue"
                          title="View Profile"
                        >
                          View Profile
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination Footer */}
        {patientsData && totalPages > 1 && (
          <div className="card-footer pagination-bar">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn btn-secondary btn-sm"
            >
              &larr; {commonT('previous')}
            </button>
            <span className="pagination-info">
              {commonT('page')} {page} {commonT('of')} {totalPages} (Total: {patientsData.total})
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn btn-secondary btn-sm"
            >
              {commonT('next')} &rarr;
            </button>
          </div>
        )}
      </div>

      <style>{`
        .patient-list-container { display: flex; flex-direction: column; gap: 20px; }
        .settings-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
        .settings-title { font-size: 22px; font-weight: 700; color: var(--text-primary); }
        .settings-subtitle { font-size: 13.5px; color: var(--text-muted); margin-top: 2px; }
        .filters-card { border-radius: var(--radius-lg); }
        .search-group { position: relative; display: flex; align-items: center; }
        .search-input { width: 100%; padding-left: 40px !important; height: 42px; font-size: 14px; }
        .search-icon { position: absolute; left: 14px; color: var(--text-muted); pointer-events: none; }
        .table-card { border-radius: var(--radius-lg); overflow: hidden; }
        .settings-table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
        .settings-table th { background: var(--bg-secondary); padding: 12px 20px; text-align: left; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; color: var(--text-muted); border-bottom: 1px solid var(--border); }
        .settings-table td { padding: 14px 20px; border-bottom: 1px solid var(--border); color: var(--text-secondary); }
        .settings-table tr:hover td { background: var(--bg-secondary); }
        .uhid-code { background: var(--bg-tertiary); color: var(--brand-blue); padding: 2px 8px; border-radius: 6px; font-family: var(--font-mono); font-weight: 700; font-size: 12.5px; }
        .patient-name-cell { display: flex; flex-direction: column; gap: 2px; }
        .bilingual-sub { font-size: 11.5px; color: var(--text-muted); }
        .blood-badge { background: #FEF2F2; color: #DC2626; padding: 2px 6px; border-radius: 4px; font-size: 11.5px; font-weight: 700; }
        .actions-cell { display: flex; gap: 12px; }
        .action-btn { background: none; border: none; font-size: 13px; font-weight: 600; cursor: pointer; }
        .action-btn.text-blue { color: var(--brand-blue); }
        .action-btn.text-blue:hover { text-decoration: underline; }
        .pagination-bar { display: flex; justify-content: space-between; align-items: center; padding: 12px 20px; border-top: 1px solid var(--border); background: var(--bg-primary); }
        .pagination-info { font-size: 13px; color: var(--text-secondary); }
        .btn { height: 38px; padding: 0 16px; border-radius: var(--radius); font-size: 13.5px; font-weight: 600; cursor: pointer; border: none; display: inline-flex; align-items: center; justify-content: center; transition: opacity 150ms; }
        .btn:hover { opacity: 0.9; }
        .btn-primary { background: linear-gradient(135deg, var(--brand-blue), var(--brand-blue-light)); color: white; }
        .btn-secondary { background: var(--bg-tertiary); color: var(--text-secondary); border: 1px solid var(--border); }
      `}</style>
    </div>
  );
}
