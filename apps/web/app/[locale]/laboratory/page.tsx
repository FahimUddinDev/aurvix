'use client';

import { useTranslations } from 'next-intl';
import { useRouter, useParams } from 'next/navigation';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAuthenticatedClient, gql } from '@/lib/graphql-client';

const LAB_WORKLIST_QUERY = gql`
  query LabWorklist($status: String, $priority: String) {
    labWorklist(status: $status, priority: $priority) {
      id
      status
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
        id
        test {
          name
          category
        }
      }
      samples {
        barcode
      }
    }
  }
`;

export default function LabWorklistPage() {
  const commonT = useTranslations('common');
  const router = useRouter();
  const params = useParams();
  const locale = (params.locale as string) || 'en';

  const [activeTab, setActiveTab] = useState<'PENDING' | 'SAMPLE_COLLECTED' | 'RESULTED' | 'APPROVED'>('PENDING');

  const client = getAuthenticatedClient();

  // Query worklist (polls every 6 seconds to keep worklist fresh)
  const { data: orders, isLoading } = useQuery({
    queryKey: ['labWorklist', activeTab],
    queryFn: async () => {
      const res: any = await client.request(LAB_WORKLIST_QUERY, {
        status: activeTab,
      });
      return res.labWorklist;
    },
    refetchInterval: 6000,
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
            🧪
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Laboratory Information System</h1>
            <p className="text-xs text-slate-500 font-semibold uppercase">Technician Worklist Control Panel</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={() => router.push(`/${locale}/laboratory/catalog`)} className="btn btn-outline btn-sm">
            📘 Test Catalog
          </button>
          <button onClick={() => router.push(`/${locale}/`)} className="btn btn-outline btn-sm">
            ← Main Dashboard
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-6 max-w-lg">
        {(['PENDING', 'SAMPLE_COLLECTED', 'RESULTED', 'APPROVED'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 text-sm font-bold text-center border-b-2 transition ${
              activeTab === tab
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            {tab === 'PENDING' && 'Pending Collection'}
            {tab === 'SAMPLE_COLLECTED' && 'Collected / Testing'}
            {tab === 'RESULTED' && 'Resulted / Approvals'}
            {tab === 'APPROVED' && 'Approved Reports'}
          </button>
        ))}
      </div>

      {/* List Worklist */}
      <div className="card">
        <div className="card-body p-0">
          {isLoading ? (
            <div className="p-10 text-center text-slate-500 font-semibold">Loading lab orders...</div>
          ) : !orders || orders.length === 0 ? (
            <div className="p-10 text-center text-slate-400 font-medium">
              No laboratory orders found in this queue.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="settings-table w-full">
                <thead>
                  <tr>
                    <th>Priority</th>
                    <th>Ordered At</th>
                    <th>Patient Name</th>
                    <th>UHID</th>
                    <th>Tests Requested</th>
                    <th>Ordering Doctor</th>
                    <th>Specimen Barcode</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((ord: any) => (
                    <tr key={ord.id} className="hover:bg-slate-50 transition">
                      <td>
                        <span
                          className={`badge text-[10px] font-black uppercase ${
                            ord.priority === 'URGENT' || ord.priority === 'STAT'
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {ord.priority}
                        </span>
                      </td>
                      <td className="text-xs text-slate-500 font-medium">{formatDate(ord.createdAt)}</td>
                      <td>
                        <span className="font-bold text-slate-800">
                          {ord.patient.firstName} {ord.patient.lastName}
                        </span>
                      </td>
                      <td>
                        <code className="text-xs text-slate-600 font-mono">{ord.patient.uhid}</code>
                      </td>
                      <td>
                        <div className="flex flex-col gap-0.5 text-xs text-slate-700 font-semibold">
                          {ord.items.map((i: any, idx: number) => (
                            <span key={idx}>• {i.test.name}</span>
                          ))}
                        </div>
                      </td>
                      <td className="text-sm text-slate-600">
                        Dr. {ord.doctor.user.firstName} {ord.doctor.user.lastName}
                      </td>
                      <td>
                        <span className="text-xs font-mono text-slate-500 font-bold">
                          {ord.samples?.[0]?.barcode || '—'}
                        </span>
                      </td>
                      <td>
                        {ord.status === 'PENDING' && (
                          <button
                            onClick={() => router.push(`/${locale}/laboratory/collect/${ord.id}`)}
                            className="btn btn-primary btn-sm text-xs font-bold"
                          >
                            Collect Specimen
                          </button>
                        )}
                        {ord.status === 'SAMPLE_COLLECTED' && (
                          <button
                            onClick={() => router.push(`/${locale}/laboratory/results/${ord.id}`)}
                            className="btn bg-indigo-600 hover:bg-indigo-700 border-none text-white btn-sm text-xs font-bold"
                          >
                            Enter Result Values
                          </button>
                        )}
                        {ord.status === 'RESULTED' && (
                          <button
                            onClick={() => router.push(`/${locale}/laboratory/results/${ord.id}`)}
                            className="btn btn-outline border-indigo-200 text-indigo-700 hover:bg-indigo-50 btn-sm text-xs font-bold"
                          >
                            Review & Approve
                          </button>
                        )}
                        {ord.status === 'APPROVED' && (
                          <button
                            onClick={() => router.push(`/${locale}/laboratory/results/${ord.id}`)}
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
