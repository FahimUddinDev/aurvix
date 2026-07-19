'use client';

import { useTranslations } from 'next-intl';
import { useRouter, useParams } from 'next/navigation';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAuthenticatedClient, gql } from '@/lib/graphql-client';

const APPROVED_REPORTS_QUERY = gql`
  query ApprovedReports($status: String) {
    labWorklist(status: $status) {
      id
      priority
      createdAt
      patient {
        uhid
        firstName
        lastName
      }
      doctor {
        user {
          firstName
          lastName
        }
      }
      items {
        test {
          name
        }
      }
    }
  }
`;

export default function LabReportsPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params.locale as string) || 'en';

  const [searchQuery, setSearchQuery] = useState('');

  const client = getAuthenticatedClient();

  // Query approved orders
  const { data: reports, isLoading } = useQuery({
    queryKey: ['approvedLabReports'],
    queryFn: async () => {
      const res: any = await client.request(APPROVED_REPORTS_QUERY, { status: 'APPROVED' });
      return res.labWorklist;
    },
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredReports = reports?.filter(
    (r: any) =>
      r.patient.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.patient.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.patient.uhid.toLowerCase().includes(searchQuery.toLowerCase()),
  ) || [];

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-800 font-sans">
      {/* Header */}
      <div className="flex justify-between items-center border-b pb-4 mb-6 bg-white p-4 rounded-xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center font-bold text-white text-lg">
            📋
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Lab Reports Index</h1>
            <p className="text-xs text-slate-500 font-semibold uppercase">Archived Clinical Lab Reports</p>
          </div>
        </div>

        <button onClick={() => router.push(`/${locale}/laboratory`)} className="btn btn-sm btn-outline">
          ← Back to Worklist
        </button>
      </div>

      {/* Search */}
      <div className="filters-card card mb-6">
        <div className="card-body">
          <input
            type="text"
            placeholder="Search approved reports by patient name or UHID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input w-full p-2 border rounded-lg text-sm"
          />
        </div>
      </div>

      {/* List */}
      <div className="card">
        <div className="card-body p-0">
          {isLoading ? (
            <div className="p-10 text-center text-slate-500 font-semibold">Loading finalized reports...</div>
          ) : filteredReports.length === 0 ? (
            <div className="p-10 text-center text-slate-400 font-medium">No finalized reports found.</div>
          ) : (
            <div className="table-responsive">
              <table className="settings-table w-full text-sm">
                <thead>
                  <tr>
                    <th>Sign-off Date</th>
                    <th>Patient Name</th>
                    <th>UHID</th>
                    <th>Tests Performed</th>
                    <th>Ordering Doctor</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReports.map((r: any) => (
                    <tr key={r.id} className="hover:bg-slate-50 transition">
                      <td className="text-xs font-semibold text-slate-500">{formatDate(r.createdAt)}</td>
                      <td>
                        <span className="font-bold text-slate-800">
                          {r.patient.firstName} {r.patient.lastName}
                        </span>
                      </td>
                      <td>
                        <code className="text-xs text-slate-600 font-mono">{r.patient.uhid}</code>
                      </td>
                      <td>
                        <div className="flex flex-col gap-0.5 text-xs text-slate-700 font-semibold">
                          {r.items.map((i: any, idx: number) => (
                            <span key={idx}>• {i.test.name}</span>
                          ))}
                        </div>
                      </td>
                      <td className="text-sm text-slate-600">
                        Dr. {r.doctor.user.firstName} {r.doctor.user.lastName}
                      </td>
                      <td>
                        <button
                          onClick={() => router.push(`/${locale}/laboratory/results/${r.id}`)}
                          className="btn btn-outline border-slate-200 text-slate-700 hover:bg-slate-50 btn-sm text-xs font-bold"
                        >
                          View Report sheet
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
