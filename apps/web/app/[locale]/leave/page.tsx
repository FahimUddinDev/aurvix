'use client';

import { useRouter, useParams } from 'next/navigation';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAuthenticatedClient, gql } from '@/lib/graphql-client';

const LEAVE_BALANCES_QUERY = gql`
  query LeaveBalances {
    leaveBalances {
      id
      year
      allocated
      used
      remaining
      leaveType {
        id
        name
        daysPerYear
      }
    }
  }
`;

const LEAVE_REQUESTS_QUERY = gql`
  query LeaveRequests($status: String) {
    leaveRequests(status: $status) {
      id
      startDate
      endDate
      days
      reason
      status
      rejectionNote
      createdAt
      leaveType {
        name
      }
    }
  }
`;

const APPLY_LEAVE_MUTATION = gql`
  mutation ApplyLeave($leaveTypeId: ID!, $startDate: DateTime!, $endDate: DateTime!, $reason: String) {
    applyLeave(leaveTypeId: $leaveTypeId, startDate: $startDate, endDate: $endDate, reason: $reason) {
      id
      status
    }
  }
`;

export default function LeaveCenterPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params.locale as string) || 'en';
  const queryClient = useQueryClient();

  const client = getAuthenticatedClient();

  // Form States
  const [selectedLeaveTypeId, setSelectedLeaveTypeId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Queries
  const { data: balances, isLoading: balancesLoading } = useQuery({
    queryKey: ['leaveBalancesList'],
    queryFn: async () => {
      const res: any = await client.request(LEAVE_BALANCES_QUERY);
      return res.leaveBalances;
    },
  });

  const { data: requests, isLoading: requestsLoading } = useQuery({
    queryKey: ['leaveRequestsList'],
    queryFn: async () => {
      const res: any = await client.request(LEAVE_REQUESTS_QUERY);
      return res.leaveRequests;
    },
  });

  // Apply Leave Mutation
  const applyMutation = useMutation({
    mutationFn: async (input: { leaveTypeId: string; startDate: string; endDate: string; reason?: string }) => {
      return client.request(APPLY_LEAVE_MUTATION, {
        leaveTypeId: input.leaveTypeId,
        startDate: new Date(input.startDate).toISOString(),
        endDate: new Date(input.endDate).toISOString(),
        reason: input.reason,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaveBalancesList'] });
      queryClient.invalidateQueries({ queryKey: ['leaveRequestsList'] });
      setSelectedLeaveTypeId('');
      setStartDate('');
      setEndDate('');
      setReason('');
      setErrorMsg('');
      alert('Leave request successfully submitted for review.');
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Leave request failed.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeaveTypeId || !startDate || !endDate) {
      setErrorMsg('Please select leave type and specify start/end dates.');
      return;
    }

    applyMutation.mutate({
      leaveTypeId: selectedLeaveTypeId,
      startDate,
      endDate,
      reason: reason || undefined,
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-800 font-sans space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center border-b pb-4 bg-white p-4 rounded-xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center font-bold text-white text-lg">
            🌴
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Inpatient Staff Leave Center</h1>
            <p className="text-xs text-slate-500 font-semibold uppercase">Manage leave types, balances, and allocations</p>
          </div>
        </div>

        <button onClick={() => router.push(`/${locale}/attendance`)} className="btn btn-sm btn-outline">
          ← Timecard Clock
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Leave Balances Grid */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="card-body">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4">Leave Balances ({new Date().getFullYear()})</h3>
              {balancesLoading ? (
                <div className="text-xs text-slate-400">Loading leave sheets...</div>
              ) : !balances || balances.length === 0 ? (
                <div className="text-xs text-slate-400 font-semibold">No leave balances assigned. Contact HR.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {balances.map((b: any) => (
                    <div key={b.id} className="p-4 border rounded-xl bg-slate-50/50 space-y-2">
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wide block border-b pb-1">
                        {b.leaveType.name}
                      </span>
                      <div className="flex justify-between text-xs font-mono font-bold text-slate-500 pt-1">
                        <span>Allocated:</span>
                        <span>{b.allocated} days</span>
                      </div>
                      <div className="flex justify-between text-xs font-mono font-bold text-slate-500">
                        <span>Used:</span>
                        <span className="text-[#10b981]">{b.used} days</span>
                      </div>
                      <div className="flex justify-between text-sm font-mono font-black text-slate-900 border-t pt-1.5">
                        <span>Remaining:</span>
                        <span className="text-indigo-700">{b.remaining} days</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Past Leave Requests History */}
          <div className="card">
            <div className="card-body">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4">Leave Requests History</h3>
              {requestsLoading ? (
                <div className="text-xs text-slate-400">Loading history...</div>
              ) : !requests || requests.length === 0 ? (
                <div className="text-xs text-slate-400 font-medium py-4 text-center">No leave requests submitted yet.</div>
              ) : (
                <div className="table-responsive">
                  <table className="settings-table w-full text-xs">
                    <thead>
                      <tr>
                        <th>Leave Type</th>
                        <th>Dates</th>
                        <th>Duration</th>
                        <th>Status</th>
                        <th>Rejection Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requests.map((r: any) => (
                        <tr key={r.id} className="hover:bg-slate-50 transition">
                          <td className="font-bold text-slate-800">{r.leaveType.name}</td>
                          <td>
                            <span className="font-semibold text-slate-600">
                              {formatDate(r.startDate)} to {formatDate(r.endDate)}
                            </span>
                          </td>
                          <td className="font-mono font-bold text-slate-900">{r.days} days</td>
                          <td>
                            <span
                              className={`status-badge font-bold uppercase ${
                                r.status === 'APPROVED'
                                  ? 'status-active'
                                  : r.status === 'PENDING'
                                  ? 'bg-blue-100 text-blue-800 border-blue-200'
                                  : 'bg-red-50 text-red-700 border-red-200'
                              }`}
                            >
                              {r.status}
                            </span>
                          </td>
                          <td className="text-red-600 font-semibold italic">{r.rejectionNote || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Apply for Leave Form Panel */}
        <div className="card">
          <div className="card-body space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Apply for Leave</h3>

            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded border border-red-200 font-bold">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="form-label text-xs font-semibold mb-1 block">Leave Type</label>
                <select
                  value={selectedLeaveTypeId}
                  onChange={(e) => setSelectedLeaveTypeId(e.target.value)}
                  required
                  className="form-input w-full p-2 text-xs font-bold text-slate-800 border rounded"
                >
                  <option value="">Select Leave Type...</option>
                  {balances?.map((b: any) => (
                    <option key={b.leaveType.id} value={b.leaveType.id}>
                      {b.leaveType.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label text-xs font-semibold mb-1 block">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  className="form-input w-full text-xs p-1.5 border font-mono"
                />
              </div>

              <div>
                <label className="form-label text-xs font-semibold mb-1 block">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                  className="form-input w-full text-xs p-1.5 border font-mono"
                />
              </div>

              <div>
                <label className="form-label text-xs font-semibold mb-1 block">Reason / Indication</label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explain reason for request..."
                  className="form-input w-full text-xs p-2"
                />
              </div>

              <button
                type="submit"
                disabled={applyMutation.isPending}
                className="btn btn-primary w-full mt-4 font-bold uppercase text-xs"
              >
                {applyMutation.isPending ? 'Submitting Form...' : 'Submit Leave Request'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
