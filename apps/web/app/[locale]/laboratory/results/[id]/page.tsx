'use client';

import { useTranslations } from 'next-intl';
import { useRouter, useParams } from 'next/navigation';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAuthenticatedClient, gql } from '@/lib/graphql-client';

const LAB_ORDER_QUERY = gql`
  query LabOrderForResults($id: ID!) {
    labOrder(id: $id) {
      id
      status
      priority
      createdAt
      patient {
        uhid
        firstName
        lastName
        gender
        dateOfBirth
      }
      doctor {
        user {
          firstName
          lastName
        }
      }
      items {
        test {
          id
          name
          normalRangeMale
          normalRangeFemale
          unit
        }
      }
      results {
        id
        testId
        value
        unit
        flag
        normalRange
        remarks
      }
    }
  }
`;

const ENTER_RESULTS_MUTATION = gql`
  mutation EnterLabResult($orderId: ID!, $results: [LabResultValueInput!]!) {
    enterLabResult(orderId: $orderId, results: $results) {
      id
      value
      flag
    }
  }
`;

const APPROVE_RESULTS_MUTATION = gql`
  mutation ApproveLabResult($orderId: ID!) {
    approveLabResult(orderId: $orderId) {
      id
      status
    }
  }
`;

const REJECT_RESULTS_MUTATION = gql`
  mutation RejectLabResult($orderId: ID!, $reason: String!) {
    rejectLabResult(orderId: $orderId, reason: $reason) {
      id
      status
    }
  }
`;

export default function LabResultWorkspacePage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;
  const locale = (params.locale as string) || 'en';
  const queryClient = useQueryClient();

  const client = getAuthenticatedClient();

  const [resultsValues, setResultsValues] = useState<Record<string, string>>({});
  const [remarksValues, setRemarksValues] = useState<Record<string, string>>({});
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Query order
  const { data: order, isLoading } = useQuery({
    queryKey: ['labOrderForResults', orderId],
    queryFn: async () => {
      const res: any = await client.request(LAB_ORDER_QUERY, { id: orderId });
      const ord = res.labOrder;
      // Pre-fill existing results if present
      const initialVals: Record<string, string> = {};
      const initialRemarks: Record<string, string> = {};
      ord.results.forEach((r: any) => {
        initialVals[r.testId] = r.value;
        initialRemarks[r.testId] = r.remarks || '';
      });
      setResultsValues(initialVals);
      setRemarksValues(initialRemarks);
      return ord;
    },
  });

  // Enter results mutation
  const enterResultsMutation = useMutation({
    mutationFn: async (resultsArray: any[]) => {
      return client.request(ENTER_RESULTS_MUTATION, { orderId, results: resultsArray });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labOrderForResults', orderId] });
      alert('Lab values saved and routed to pathologist review.');
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Failed to enter results.');
    },
  });

  // Approve results mutation
  const approveResultsMutation = useMutation({
    mutationFn: async () => {
      return client.request(APPROVE_RESULTS_MUTATION, { orderId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labOrderForResults', orderId] });
      alert('Lab report approved and finalized.');
      router.push(`/${locale}/laboratory`);
    },
  });

  // Reject results mutation
  const rejectResultsMutation = useMutation({
    mutationFn: async (reason: string) => {
      return client.request(REJECT_RESULTS_MUTATION, { orderId, reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labOrderForResults', orderId] });
      setRejectModalOpen(false);
      alert('Report rejected and sent back to testing queue.');
      router.push(`/${locale}/laboratory`);
    },
  });

  const handleSaveValues = (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;

    const formatted = order.items.map((i: any) => ({
      testId: i.test.id,
      value: resultsValues[i.test.id] || '',
      remarks: remarksValues[i.test.id] || undefined,
    }));

    const hasEmpty = formatted.some((f: any) => !f.value);
    if (hasEmpty) {
      setErrorMsg('Please specify result values for all tests.');
      return;
    }

    enterResultsMutation.mutate(formatted);
  };

  const handleApprove = () => {
    approveResultsMutation.mutate();
  };

  const handleReject = () => {
    if (!rejectReason) return;
    rejectResultsMutation.mutate(rejectReason);
  };

  if (isLoading) {
    return <div className="p-6 text-center text-slate-500 font-medium">Loading laboratory workspace...</div>;
  }

  if (!order) {
    return <div className="p-6 text-center text-red-500 font-medium">Lab order not found.</div>;
  }

  const isEntryMode = order.status === 'SAMPLE_COLLECTED' || order.status === 'REJECTED';
  const isReviewMode = order.status === 'RESULTED';
  const isFinalized = order.status === 'APPROVED';

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Back link */}
      <button onClick={() => router.push(`/${locale}/laboratory`)} className="btn btn-sm btn-outline mb-2">
        ← Back to Worklist
      </button>

      <div className="settings-header">
        <div>
          <h1 className="settings-title">Lab Workspace: Order details</h1>
          <p className="settings-subtitle">Enter values, review reference flags, and sign-off report sheets</p>
        </div>

        {isReviewMode && (
          <div className="flex gap-2">
            <button onClick={() => setRejectModalOpen(true)} className="btn btn-outline border-red-200 text-red-600 hover:bg-red-50">
              Reject Report (Re-run)
            </button>
            <button onClick={handleApprove} className="btn bg-[#10b981] hover:bg-[#059669] text-white font-bold border-none">
              Sign-Off & Approve Report
            </button>
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 text-red-700 rounded border border-red-200 text-sm">
          {errorMsg}
        </div>
      )}

      {/* Patient / Order Profile Context Card */}
      <div className="card">
        <div className="card-body">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-bold text-slate-400 block uppercase">Outpatient Record</span>
              <h2 className="text-lg font-black text-slate-900">
                {order.patient.firstName} {order.patient.lastName}
              </h2>
              <div className="flex gap-4 text-xs font-semibold text-slate-500 mt-1">
                <span>UHID: <code>{order.patient.uhid}</code></span>
                <span>Gender: {order.patient.gender}</span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs font-bold text-slate-400 block uppercase">Worklist Status</span>
              <span className={`status-badge font-bold mt-1 inline-block ${
                isFinalized ? 'status-active' : 'bg-indigo-50 text-indigo-700 border-indigo-200'
              }`}>
                {order.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Entry / Review Table Sheet */}
      <div className="card">
        <div className="card-body p-0">
          <form onSubmit={handleSaveValues}>
            <div className="table-responsive">
              <table className="settings-table w-full">
                <thead>
                  <tr>
                    <th>Test Name</th>
                    <th>Reference Range ({order.patient.gender})</th>
                    <th>Result Value</th>
                    <th>Unit</th>
                    <th>Reference Flag</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item: any) => {
                    const test = item.test;
                    const existingRes = order.results.find((r: any) => r.testId === test.id);
                    const rangeStr = order.patient.gender === 'FEMALE' ? test.normalRangeFemale : test.normalRangeMale;

                    return (
                      <tr key={test.id} className="hover:bg-slate-50 transition">
                        <td className="font-semibold text-slate-800">{test.name}</td>
                        <td className="text-xs text-slate-400 font-mono">{rangeStr}</td>
                        <td>
                          {isEntryMode ? (
                            <input
                              type="text"
                              value={resultsValues[test.id] || ''}
                              onChange={(e) =>
                                setResultsValues((prev) => ({ ...prev, [test.id]: e.target.value }))
                              }
                              required
                              placeholder="Enter value..."
                              className="form-input w-28 p-1 text-sm text-center border font-mono font-bold"
                            />
                          ) : (
                            <span className="font-bold text-slate-900 font-mono text-md">
                              {existingRes?.value || '—'}
                            </span>
                          )}
                        </td>
                        <td className="text-xs font-semibold text-slate-500 font-mono">{test.unit}</td>
                        <td>
                          {!isEntryMode && existingRes ? (
                            <span
                              className={`status-badge ${
                                existingRes.flag === 'NORMAL'
                                  ? 'status-active'
                                  : existingRes.flag.startsWith('CRITICAL')
                                  ? 'bg-red-500 text-white border-red-600 font-black animate-pulse'
                                  : 'bg-yellow-100 text-yellow-800 border-yellow-200 font-semibold'
                              }`}
                            >
                              {existingRes.flag}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs">—</span>
                          )}
                        </td>
                        <td>
                          {isEntryMode ? (
                            <input
                              type="text"
                              value={remarksValues[test.id] || ''}
                              onChange={(e) =>
                                setRemarksValues((prev) => ({ ...prev, [test.id]: e.target.value }))
                              }
                              placeholder="Clinical remarks..."
                              className="form-input w-full p-1 text-xs border"
                            />
                          ) : (
                            <span className="text-xs text-slate-600 font-medium">
                              {existingRes?.remarks || '—'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {isEntryMode && (
              <div className="p-4 border-t flex justify-end bg-slate-50">
                <button
                  type="submit"
                  disabled={enterResultsMutation.isPending}
                  className="btn btn-primary font-bold px-6 text-sm"
                >
                  {enterResultsMutation.isPending ? 'Saving values...' : 'Save & Submit Values'}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Reject Modal dialog */}
      {rejectModalOpen && (
        <div className="modal-backdrop fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex justify-center items-center p-4">
          <div className="modal-container bg-white rounded-lg shadow-xl w-full max-w-md card">
            <div className="card-body">
              <h3 className="text-lg font-bold text-slate-900 mb-2">Reject Lab Report</h3>
              <p className="text-slate-500 text-sm mb-4">Please specify the reasons for rejecting this test result sheet.</p>

              <div className="space-y-4">
                <textarea
                  rows={3}
                  placeholder="e.g. Sample hemolyzed or value inconsistent. Requesting blood collection re-run."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="form-input w-full p-2 border rounded"
                />

                <div className="flex justify-end gap-2 border-t pt-3 mt-4">
                  <button type="button" onClick={() => setRejectModalOpen(false)} className="btn btn-outline text-xs">
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleReject}
                    disabled={!rejectReason || rejectResultsMutation.isPending}
                    className="btn btn-primary bg-red-600 hover:bg-red-700 border-none text-white text-xs"
                  >
                    Confirm Rejection
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
