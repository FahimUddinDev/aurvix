'use client';

import { useRouter, useParams } from 'next/navigation';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAuthenticatedClient, gql } from '@/lib/graphql-client';

const ACTIVE_SHIFT_QUERY = gql`
  query GetActiveShift {
    activePharmacyShift {
      id
      status
      openingBalance
      openedAt
    }
  }
`;

const SHIFT_CLOSE_REPORT_QUERY = gql`
  query ShiftCloseReport($shiftId: ID!) {
    shiftCloseReport(shiftId: $shiftId) {
      openingBalance
      expectedCash
      expectedBkash
      expectedSslcommerz
      totalExpected
    }
  }
`;

const OPEN_SHIFT_MUTATION = gql`
  mutation OpenPosShift($openingBalance: FloatScalar!) {
    openPosShift(openingBalance: $openingBalance) {
      id
      status
    }
  }
`;

const CLOSE_SHIFT_MUTATION = gql`
  mutation ClosePosShift($shiftId: ID!, $actualCash: FloatScalar!, $notes: String) {
    closePosShift(shiftId: $shiftId, actualCash: $actualCash, notes: $notes) {
      id
      status
      variance
    }
  }
`;

export default function PosShiftManagerPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params.locale as string) || 'en';
  const queryClient = useQueryClient();

  const client = getAuthenticatedClient();

  const [openingBalance, setOpeningBalance] = useState<number>(1000);
  const [actualCash, setActualCash] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Query active shift
  const { data: shift, isLoading: shiftLoading } = useQuery({
    queryKey: ['activePharmacyShift'],
    queryFn: async () => {
      const res: any = await client.request(ACTIVE_SHIFT_QUERY);
      return res.activePharmacyShift;
    },
  });

  // Query shift report if active shift exists
  const { data: report, isLoading: reportLoading } = useQuery({
    queryKey: ['shiftCloseReport', shift?.id],
    queryFn: async () => {
      if (!shift?.id) return null;
      const res: any = await client.request(SHIFT_CLOSE_REPORT_QUERY, { shiftId: shift.id });
      return res.shiftCloseReport;
    },
    enabled: !!shift?.id,
  });

  // Mutations
  const openShiftMutation = useMutation({
    mutationFn: async (bal: number) => {
      return client.request(OPEN_SHIFT_MUTATION, { openingBalance: bal });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activePharmacyShift'] });
      alert('Cashier register opened successfully.');
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Failed to open shift.');
    },
  });

  const closeShiftMutation = useMutation({
    mutationFn: async (args: { shiftId: string; actualCash: number; notes?: string }) => {
      return client.request(CLOSE_SHIFT_MUTATION, {
        shiftId: args.shiftId,
        actualCash: args.actualCash,
        notes: args.notes,
      });
    },
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['activePharmacyShift'] });
      alert(`Shift closed. Drawer variance: ${res.closePosShift.variance.toFixed(2)} BDT.`);
      router.push(`/${locale}/pharmacy/pos`);
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Failed to close shift.');
    },
  });

  const handleOpen = (e: React.FormEvent) => {
    e.preventDefault();
    openShiftMutation.mutate(openingBalance);
  };

  const handleClose = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shift?.id) return;
    closeShiftMutation.mutate({
      shiftId: shift.id,
      actualCash,
      notes: notes || undefined,
    });
  };

  if (shiftLoading || (shift && reportLoading)) {
    return <div className="p-6 text-center text-slate-500 font-medium">Loading shift status...</div>;
  }

  return (
    <div className="max-w-md mx-auto p-4 space-y-6">
      <button onClick={() => router.push(`/${locale}/pharmacy/pos`)} className="btn btn-sm btn-outline mb-2">
        ← Go to POS Register
      </button>

      <div className="settings-header">
        <div>
          <h1 className="settings-title">POS Shift Drawer Management</h1>
          <p className="settings-subtitle">Audit opening float, count drawer assets, and reconcile variances</p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 text-red-700 text-xs rounded border border-red-200 font-bold">
          {errorMsg}
        </div>
      )}

      {shift ? (
        /* Close Shift Form */
        <div className="card">
          <div className="card-body space-y-4">
            <h3 className="text-md font-bold text-slate-900 border-b pb-3 mb-2">
              Close Cash Register drawer
            </h3>

            <div className="text-xs space-y-1 bg-slate-50 p-3 rounded font-mono">
              <p><strong>Shift ID:</strong> <code>{shift.id.slice(-8)}</code></p>
              <p><strong>Opened At:</strong> {new Date(shift.openedAt).toLocaleString()}</p>
              <p><strong>Starting Balance:</strong> {Number(shift.openingBalance).toFixed(2)} BDT</p>
            </div>

            {report && (
              <div className="space-y-2 text-sm font-semibold border-b pb-4 pt-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Expected POS Cash:</span>
                  <span className="font-mono">+{report.expectedCash.toFixed(2)} BDT</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Expected bKash:</span>
                  <span className="font-mono">+{report.expectedBkash.toFixed(2)} BDT</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Expected Card (SSL):</span>
                  <span className="font-mono">+{report.expectedSslcommerz.toFixed(2)} BDT</span>
                </div>
                <div className="flex justify-between pt-2 border-t font-black text-slate-950">
                  <span>Total expected in drawer:</span>
                  <span className="font-mono text-indigo-700">{report.totalExpected.toFixed(2)} BDT</span>
                </div>
              </div>
            )}

            <form onSubmit={handleClose} className="space-y-4">
              <div>
                <label className="form-label text-sm font-semibold mb-1 block">Actual Counted Cash Drawer float</label>
                <input
                  type="number"
                  value={actualCash || ''}
                  onChange={(e) => setActualCash(Number(e.target.value))}
                  required
                  placeholder="Total counted cash..."
                  className="form-input w-full p-2 border font-mono font-bold text-slate-900 text-base"
                />
              </div>

              <div>
                <label className="form-label text-xs font-semibold mb-1 block">Audit Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Explain any drawer variance discrepancies..."
                  className="form-input w-full text-xs p-2"
                />
              </div>

              <button
                type="submit"
                disabled={closeShiftMutation.isPending}
                className="btn bg-red-600 hover:bg-red-700 text-white w-full font-bold uppercase"
              >
                {closeShiftMutation.isPending ? 'Closing shift...' : 'Close shift & Log reconciliation'}
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* Open Shift Form */
        <div className="card">
          <div className="card-body space-y-4">
            <h3 className="text-md font-bold text-slate-900 border-b pb-3 mb-2">
              Open Cash Register drawer
            </h3>
            <p className="text-xs text-slate-400 font-medium">Verify drawer float before serving customers.</p>

            <form onSubmit={handleOpen} className="space-y-4">
              <div>
                <label className="form-label text-sm font-semibold mb-1 block">Starting Cash float (BDT)</label>
                <input
                  type="number"
                  value={openingBalance || ''}
                  onChange={(e) => setOpeningBalance(Number(e.target.value))}
                  required
                  className="form-input w-full p-2 border font-mono font-bold text-slate-900 text-base"
                />
              </div>

              <button
                type="submit"
                disabled={openShiftMutation.isPending}
                className="btn btn-primary w-full font-bold uppercase"
              >
                {openShiftMutation.isPending ? 'Opening...' : 'Unlock Cash Register'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
