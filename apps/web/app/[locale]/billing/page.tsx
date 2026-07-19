'use client';

import { useTranslations } from 'next-intl';
import { useRouter, useParams } from 'next/navigation';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAuthenticatedClient, gql } from '@/lib/graphql-client';

const BILLS_QUERY = gql`
  query GetBills($status: String, $search: String) {
    bills(status: $status, search: $search) {
      id
      billNo
      status
      totalAmount
      paidAmount
      dueAmount
      createdAt
      patient {
        uhid
        firstName
        lastName
      }
    }
  }
`;

export default function BillsListPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params.locale as string) || 'en';

  const [activeTab, setActiveTab] = useState<'' | 'ISSUED' | 'PARTIALLY_PAID' | 'PAID'>('');
  const [search, setSearch] = useState('');

  const client = getAuthenticatedClient();

  // Query bills (re-fetches every 8 seconds)
  const { data: invoices, isLoading } = useQuery({
    queryKey: ['billsQueue', activeTab, search],
    queryFn: async () => {
      const res: any = await client.request(BILLS_QUERY, {
        status: activeTab || undefined,
        search: search || undefined,
      });
      return res.bills;
    },
    refetchInterval: 8000,
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
            ৳
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Billing & Invoices</h1>
            <p className="text-xs text-slate-500 font-semibold uppercase">Outpatient & Inpatient Billing ledger</p>
          </div>
        </div>

        <button onClick={() => router.push(`/${locale}/`)} className="btn btn-outline btn-sm">
          ← Main Dashboard
        </button>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 bg-white border p-4 rounded-lg shadow-sm">
        <div className="flex border-b border-slate-200 w-full md:max-w-md">
          {([
            { key: '', label: 'All Bills' },
            { key: 'ISSUED', label: 'Unpaid' },
            { key: 'PARTIALLY_PAID', label: 'Partially Paid' },
            { key: 'PAID', label: 'Settled' },
          ] as const).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2 text-xs font-bold text-center border-b-2 transition ${
                activeTab === tab.key
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="w-full md:max-w-xs">
          <input
            type="text"
            placeholder="Search invoice no or UHID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input w-full p-2 border rounded text-xs font-bold"
          />
        </div>
      </div>

      {/* List */}
      <div className="card">
        <div className="card-body p-0">
          {isLoading ? (
            <div className="p-10 text-center text-slate-500 font-semibold">Loading billing registry...</div>
          ) : !invoices || invoices.length === 0 ? (
            <div className="p-10 text-center text-slate-400 font-medium">No invoices found matching these filters.</div>
          ) : (
            <div className="table-responsive">
              <table className="settings-table w-full text-sm">
                <thead>
                  <tr>
                    <th>Invoice No</th>
                    <th>Created At</th>
                    <th>Patient Name</th>
                    <th>UHID</th>
                    <th>Total Amount</th>
                    <th>Paid Amount</th>
                    <th>Due Amount</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv: any) => (
                    <tr key={inv.id} className="hover:bg-slate-50 transition">
                      <td>
                        <code className="text-xs font-mono font-bold text-indigo-900">{inv.billNo}</code>
                      </td>
                      <td className="text-xs text-slate-500 font-semibold">{formatDate(inv.createdAt)}</td>
                      <td>
                        <span className="font-bold text-slate-800">
                          {inv.patient?.firstName} {inv.patient?.lastName}
                        </span>
                      </td>
                      <td>
                        <code className="text-xs text-slate-600 font-mono">{inv.patient?.uhid}</code>
                      </td>
                      <td className="font-bold text-slate-900 font-mono">{Number(inv.totalAmount).toFixed(2)} ৳</td>
                      <td className="font-bold text-[#10b981] font-mono">{Number(inv.paidAmount).toFixed(2)} ৳</td>
                      <td className="font-bold text-red-600 font-mono">{Number(inv.dueAmount).toFixed(2)} ৳</td>
                      <td>
                        <span
                          className={`status-badge font-bold uppercase ${
                            inv.status === 'PAID'
                              ? 'status-active'
                              : inv.status === 'PARTIALLY_PAID'
                              ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                              : 'bg-red-50 text-red-700 border-red-200'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => router.push(`/${locale}/billing/${inv.id}`)}
                          className="btn btn-primary btn-sm text-xs font-bold"
                        >
                          Checkout / Details
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
