'use client';

import { useRouter, useParams } from 'next/navigation';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAuthenticatedClient, gql } from '@/lib/graphql-client';

const ADMISSIONS_QUERY = gql`
  query GetAdmissions($status: String, $search: String) {
    admissions(status: $status, search: $search) {
      id
      status
      admissionDate
      dischargeDate
      admissionNotes
      patient {
        uhid
        firstName
        lastName
      }
      bed {
        id
        bedNumber
        ward {
          name
        }
      }
    }
  }
`;

const AVAILABLE_BEDS_QUERY = gql`
  query AvailableBeds {
    beds(status: "AVAILABLE") {
      id
      bedNumber
      ward {
        name
      }
    }
  }
`;

const TRANSFER_MUTATION = gql`
  mutation TransferPatient($admissionId: ID!, $bedId: ID!) {
    transferPatient(admissionId: $admissionId, bedId: $bedId) {
      id
      bed {
        bedNumber
      }
    }
  }
`;

const DISCHARGE_MUTATION = gql`
  mutation DischargePatient($admissionId: ID!, $notes: String) {
    dischargePatient(admissionId: $admissionId, notes: $notes) {
      id
      status
      dischargeDate
    }
  }
`;

export default function AdmissionsQueuePage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params.locale as string) || 'en';
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'' | 'ACTIVE' | 'DISCHARGED'>('');
  const [search, setSearch] = useState('');

  const [transferTargetId, setTransferTargetId] = useState<string | null>(null); // admissionId
  const [selectedNewBed, setSelectedNewBed] = useState('');

  const client = getAuthenticatedClient();

  // Queries
  const { data: admissions, isLoading } = useQuery({
    queryKey: ['admissionsList', activeTab, search],
    queryFn: async () => {
      const res: any = await client.request(ADMISSIONS_QUERY, {
        status: activeTab || undefined,
        search: search || undefined,
      });
      return res.admissions;
    },
    refetchInterval: 8000,
  });

  const { data: availableBeds } = useQuery({
    queryKey: ['availableBedsList'],
    queryFn: async () => {
      const res: any = await client.request(AVAILABLE_BEDS_QUERY);
      return res.beds;
    },
  });

  // Mutations
  const transferMutation = useMutation({
    mutationFn: async (args: { admissionId: string; bedId: string }) => {
      return client.request(TRANSFER_MUTATION, {
        admissionId: args.admissionId,
        bedId: args.bedId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admissionsList'] });
      queryClient.invalidateQueries({ queryKey: ['availableBedsList'] });
      setTransferTargetId(null);
      setSelectedNewBed('');
      alert('Patient successfully transferred to new bed room.');
    },
  });

  const dischargeMutation = useMutation({
    mutationFn: async (args: { admissionId: string; notes?: string }) => {
      return client.request(DISCHARGE_MUTATION, {
        admissionId: args.admissionId,
        notes: args.notes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admissionsList'] });
      queryClient.invalidateQueries({ queryKey: ['availableBedsList'] });
      alert('Patient discharged. Bed marked for cleaning and billing room fee logged.');
    },
  });

  const handleDischarge = (admissionId: string) => {
    const notes = prompt('Enter inpatient discharge notes / routing instructions:');
    if (notes !== null) {
      dischargeMutation.mutate({ admissionId, notes: notes || undefined });
    }
  };

  const handleTransfer = (admissionId: string) => {
    if (!selectedNewBed) return;
    transferMutation.mutate({ admissionId, bedId: selectedNewBed });
  };

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
    <div className="min-h-screen bg-slate-50 p-6 text-slate-800 font-sans space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center border-b pb-4 bg-white p-4 rounded-xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center font-bold text-white text-lg">
            📋
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Inpatient Admissions Desk</h1>
            <p className="text-xs text-slate-500 font-semibold uppercase">Manage hospitalizations, transfers, and discharges</p>
          </div>
        </div>

        <button onClick={() => router.push(`/${locale}/wards`)} className="btn btn-sm btn-outline">
          ← Wards Board Map
        </button>
      </div>

      {/* Tabs & Search filters */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white border p-4 rounded-lg shadow-sm">
        <div className="flex border-b border-slate-200 w-full md:max-w-md">
          {([
            { key: '', label: 'All Hospitalizations' },
            { key: 'ACTIVE', label: 'Active Inpatients' },
            { key: 'DISCHARGED', label: 'Discharged History' },
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
            placeholder="Search patient name or UHID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input w-full p-2 border rounded text-xs font-bold"
          />
        </div>
      </div>

      {/* Ledger list */}
      <div className="card">
        <div className="card-body p-0">
          {isLoading ? (
            <div className="p-10 text-center text-slate-500 font-semibold">Loading admissions ledger...</div>
          ) : !admissions || admissions.length === 0 ? (
            <div className="p-10 text-center text-slate-400 font-medium">No admissions records found matching filters.</div>
          ) : (
            <div className="table-responsive">
              <table className="settings-table w-full text-sm">
                <thead>
                  <tr>
                    <th>Patient Name</th>
                    <th>UHID</th>
                    <th>Inpatient Room</th>
                    <th>Admission Date</th>
                    <th>Discharge Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {admissions.map((adm: any) => {
                    const isActive = adm.status === 'ACTIVE';

                    return (
                      <tr key={adm.id} className="hover:bg-slate-50 transition">
                        <td>
                          <span className="font-bold text-slate-800">
                            {adm.patient?.firstName} {adm.patient?.lastName}
                          </span>
                        </td>
                        <td>
                          <code className="text-xs text-slate-600 font-mono">{adm.patient?.uhid}</code>
                        </td>
                        <td>
                          <div className="font-semibold">
                            {adm.bed?.ward.name} — <code className="font-mono text-xs">Bed {adm.bed?.bedNumber}</code>
                          </div>
                        </td>
                        <td className="text-xs font-semibold text-slate-600">{formatDate(adm.admissionDate)}</td>
                        <td className="text-xs font-semibold text-slate-500">
                          {adm.dischargeDate ? formatDate(adm.dischargeDate) : '—'}
                        </td>
                        <td>
                          <span
                            className={`status-badge font-bold uppercase ${
                              isActive
                                ? 'status-active bg-blue-100 text-blue-800 border-blue-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            {adm.status}
                          </span>
                        </td>
                        <td>
                          {isActive && (
                            <div className="flex items-center gap-2">
                              {transferTargetId === adm.id ? (
                                <div className="flex items-center gap-1">
                                  <select
                                    value={selectedNewBed}
                                    onChange={(e) => setSelectedNewBed(e.target.value)}
                                    className="form-input p-1 text-xs font-bold"
                                  >
                                    <option value="">Select Bed...</option>
                                    {availableBeds?.map((b: any) => (
                                      <option key={b.id} value={b.id}>
                                        {b.ward.name} — Bed {b.bedNumber}
                                      </option>
                                    ))}
                                  </select>
                                  <button
                                    onClick={() => handleTransfer(adm.id)}
                                    className="btn btn-primary btn-sm text-[10px] py-0.5 px-2 font-bold"
                                  >
                                    Go
                                  </button>
                                  <button
                                    onClick={() => setTransferTargetId(null)}
                                    className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <button
                                    onClick={() => setTransferTargetId(adm.id)}
                                    className="btn btn-outline btn-sm text-xs font-bold font-mono"
                                  >
                                    Room Transfer
                                  </button>
                                  <button
                                    onClick={() => handleDischarge(adm.id)}
                                    className="btn bg-red-50 text-red-700 hover:bg-red-100 btn-sm text-xs font-bold"
                                  >
                                    Discharge
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
