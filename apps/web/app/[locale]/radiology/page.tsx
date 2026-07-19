'use client';

import { useTranslations } from 'next-intl';
import { useRouter, useParams } from 'next/navigation';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAuthenticatedClient, gql } from '@/lib/graphql-client';

const RADIOLOGY_WORKLIST_QUERY = gql`
  query RadiologyWorklist($status: String) {
    radiologyWorklist(status: $status) {
      id
      status
      clinicalInfo
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
      modality {
        name
        code
      }
    }
  }
`;

export default function RadiologyWorklistPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params.locale as string) || 'en';

  const [activeTab, setActiveTab] = useState<'PENDING' | 'REPORT_UPLOADED' | 'APPROVED'>('PENDING');

  const client = getAuthenticatedClient();

  // Query worklist (polls every 7 seconds)
  const { data: orders, isLoading } = useQuery({
    queryKey: ['radiologyWorklist', activeTab],
    queryFn: async () => {
      const res: any = await client.request(RADIOLOGY_WORKLIST_QUERY, {
        status: activeTab,
      });
      return res.radiologyWorklist;
    },
    refetchInterval: 7000,
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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans p-6 text-slate-800">
      {/* Header */}
      <div className="flex justify-between items-center border-b pb-4 mb-6 bg-white p-4 rounded-xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center font-bold text-white text-lg">
            🩻
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Radiology Imaging System</h1>
            <p className="text-xs text-slate-500 font-semibold uppercase">Imaging Department Control Worklist</p>
          </div>
        </div>

        <button onClick={() => router.push(`/${locale}/`)} className="btn btn-outline btn-sm">
          ← Main Dashboard
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-6 max-w-md">
        {(['PENDING', 'REPORT_UPLOADED', 'APPROVED'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 text-sm font-bold text-center border-b-2 transition ${
              activeTab === tab
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            {tab === 'PENDING' && 'Pending Scans'}
            {tab === 'REPORT_UPLOADED' && 'Uploaded / Review'}
            {tab === 'APPROVED' && 'Approved Reports'}
          </button>
        ))}
      </div>

      {/* Queue Grid */}
      <div className="card">
        <div className="card-body p-0">
          {isLoading ? (
            <div className="p-10 text-center text-slate-500 font-semibold">Loading radiology worklist...</div>
          ) : !orders || orders.length === 0 ? (
            <div className="p-10 text-center text-slate-400 font-medium">No imaging orders found in this queue.</div>
          ) : (
            <div className="table-responsive">
              <table className="settings-table w-full text-sm">
                <thead>
                  <tr>
                    <th>Ordered At</th>
                    <th>Patient Name</th>
                    <th>UHID</th>
                    <th>Modality / Scan</th>
                    <th>Ordering Doctor</th>
                    <th>Clinical Info / Indications</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((ord: any) => (
                    <tr key={ord.id} className="hover:bg-slate-50 transition">
                      <td className="text-xs text-slate-500 font-medium">{formatDate(ord.createdAt)}</td>
                      <td>
                        <span className="font-bold text-slate-800">
                          {ord.patient?.firstName} {ord.patient?.lastName}
                        </span>
                      </td>
                      <td>
                        <code className="text-xs text-slate-600 font-mono">{ord.patient?.uhid}</code>
                      </td>
                      <td>
                        <div className="font-bold text-indigo-900">{ord.modality?.name}</div>
                        <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-150 px-1.5 py-0.5 rounded font-mono font-bold">
                          {ord.modality?.code}
                        </span>
                      </td>
                      <td className="text-sm text-slate-600 font-medium">
                        Dr. {ord.doctor?.user?.firstName} {ord.doctor?.user?.lastName}
                      </td>
                      <td className="text-xs text-slate-500 italic max-w-xs truncate">
                        {ord.clinicalInfo || 'No notes specified.'}
                      </td>
                      <td>
                        {ord.status === 'PENDING' && (
                          <button
                            onClick={() => router.push(`/${locale}/radiology/upload/${ord.id}`)}
                            className="btn btn-primary btn-sm text-xs font-bold"
                          >
                            Upload Report
                          </button>
                        )}
                        {ord.status === 'REPORT_UPLOADED' && (
                          <button
                            onClick={() => router.push(`/${locale}/radiology/review/${ord.id}`)}
                            className="btn bg-indigo-600 hover:bg-indigo-700 border-none text-white btn-sm text-xs font-bold"
                          >
                            Review & Sign-Off
                          </button>
                        )}
                        {ord.status === 'APPROVED' && (
                          <button
                            onClick={() => router.push(`/${locale}/radiology/review/${ord.id}`)}
                            className="btn btn-outline border-slate-200 text-slate-600 hover:bg-slate-50 btn-sm text-xs font-bold"
                          >
                            View Final Report
                          </button>
                        )}
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
