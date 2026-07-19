'use client';

import { useTranslations } from 'next-intl';
import { useRouter, useParams } from 'next/navigation';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAuthenticatedClient, gql } from '@/lib/graphql-client';

const PENDING_PRESCRIPTIONS_QUERY = gql`
  query PendingPrescriptions {
    pendingPrescriptions {
      id
      status
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
        medicineId
        dosage
        frequency
        duration
        qty
        medicine {
          id
          name
          brandName
        }
      }
    }
  }
`;

const INVENTORY_QUERY = gql`
  query PharmacyInventory {
    pharmacyInventory {
      id
      medicineId
      batchNumber
      expiryDate
      qty
      unitCost
      medicine {
        id
        name
        brandName
      }
    }
  }
`;

const DISPENSE_MUTATION = gql`
  mutation DispenseMedication($prescriptionId: ID!, $items: [DispenseItemInput!]!, $notes: String) {
    dispenseMedication(prescriptionId: $prescriptionId, items: $items, notes: $notes) {
      id
      isPartial
    }
  }
`;

export default function PharmacyQueuePage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params.locale as string) || 'en';
  const queryClient = useQueryClient();

  const client = getAuthenticatedClient();

  const [selectedRx, setSelectedRx] = useState<any | null>(null);
  const [selectedBatches, setSelectedBatches] = useState<Record<string, string>>({}); // itemId -> batchId
  const [dispenseNotes, setDispenseNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Queries
  const { data: prescriptions, isLoading: rxLoading } = useQuery({
    queryKey: ['pendingPrescriptions'],
    queryFn: async () => {
      const res: any = await client.request(PENDING_PRESCRIPTIONS_QUERY);
      return res.pendingPrescriptions;
    },
    refetchInterval: 7000,
  });

  const { data: stock, isLoading: stockLoading } = useQuery({
    queryKey: ['pharmacyInventory'],
    queryFn: async () => {
      const res: any = await client.request(INVENTORY_QUERY);
      return res.pharmacyInventory;
    },
  });

  // Dispense mutation
  const dispenseMutation = useMutation({
    mutationFn: async (args: { rxId: string; items: any[]; notes?: string }) => {
      return client.request(DISPENSE_MUTATION, {
        prescriptionId: args.rxId,
        items: args.items,
        notes: args.notes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingPrescriptions'] });
      setSelectedRx(null);
      setSelectedBatches({});
      setDispenseNotes('');
      alert('Medications successfully dispensed to patient.');
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Dispensing failed. Check batch quantities.');
    },
  });

  const handleSelectRx = (rx: any) => {
    setSelectedRx(rx);
    setErrorMsg('');
    // Auto-select FEFO batches for each item
    const autoSelected: Record<string, string> = {};
    rx.items.forEach((item: any) => {
      const available = stock?.filter((s: any) => s.medicineId === item.medicineId) || [];
      // Grab first available with quantity (sorted by expiryDate ascending in service)
      if (available.length > 0) {
        autoSelected[item.id] = available[0].id;
      }
    });
    setSelectedBatches(autoSelected);
  };

  const handleDispense = () => {
    if (!selectedRx) return;

    const formattedItems = selectedRx.items.map((item: any) => {
      const batchId = selectedBatches[item.id];
      const matchBatch = stock?.find((s: any) => s.id === batchId);

      return {
        medicineId: item.medicineId,
        batchId,
        qty: item.qty,
        unitPrice: matchBatch ? Number(matchBatch.unitCost) * 1.2 : 5.0, // Selling price 20% markup
      };
    });

    const missingBatch = formattedItems.some((f: any) => !f.batchId);
    if (missingBatch) {
      setErrorMsg('Please assign stock batches for all prescription items.');
      return;
    }

    dispenseMutation.mutate({
      rxId: selectedRx.id,
      items: formattedItems,
      notes: dispenseNotes || undefined,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-800 font-sans grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* List Queue */}
      <div className="lg:col-span-2 space-y-6">
        <div className="flex justify-between items-center border-b pb-4 bg-white p-4 rounded-xl shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center font-bold text-white text-lg">
              💊
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">Pharmacy Dispensing Desk</h1>
              <p className="text-xs text-slate-500 font-semibold uppercase">Pending Prescriptions Fulfillments</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={() => router.push(`/${locale}/pharmacy/pos`)} className="btn btn-primary btn-sm text-xs font-bold font-mono">
              🏪 Open POS Terminal
            </button>
            <button onClick={() => router.push(`/${locale}/pharmacy/stock`)} className="btn btn-outline btn-sm text-xs font-bold">
              📦 Stock Levels
            </button>
          </div>
        </div>

        <div className="card">
          <div className="card-body p-0">
            {rxLoading ? (
              <div className="p-10 text-center text-slate-500 font-semibold">Loading prescriptions queue...</div>
            ) : !prescriptions || prescriptions.length === 0 ? (
              <div className="p-10 text-center text-slate-400 font-medium">No pending prescriptions waiting in pharmacy.</div>
            ) : (
              <div className="table-responsive">
                <table className="settings-table w-full text-sm">
                  <thead>
                    <tr>
                      <th>Patient Name</th>
                      <th>UHID</th>
                      <th>Prescribing Doctor</th>
                      <th>Medications</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prescriptions.map((rx: any) => (
                      <tr
                        key={rx.id}
                        className={`hover:bg-indigo-50/30 transition cursor-pointer ${
                          selectedRx?.id === rx.id ? 'bg-indigo-50 border-l-4 border-indigo-600' : ''
                        }`}
                        onClick={() => handleSelectRx(rx)}
                      >
                        <td>
                          <span className="font-bold text-slate-800">
                            {rx.patient.firstName} {rx.patient.lastName}
                          </span>
                        </td>
                        <td>
                          <code className="text-xs text-slate-600 font-mono">{rx.patient.uhid}</code>
                        </td>
                        <td>
                          Dr. {rx.doctor.user.firstName} {rx.doctor.user.lastName}
                        </td>
                        <td>
                          <div className="flex flex-col gap-0.5 text-xs text-slate-600 font-semibold">
                            {rx.items.map((i: any) => (
                              <span key={i.id}>• {i.medicine.brandName || i.medicine.name} ({i.qty} pcs)</span>
                            ))}
                          </div>
                        </td>
                        <td>
                          <button className="btn btn-outline btn-sm text-xs font-bold">Select</button>
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

      {/* Detail / Action Sidebar */}
      <div>
        {selectedRx ? (
          <div className="card h-full flex flex-col">
            <div className="card-body space-y-4 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-md font-bold text-slate-900 border-b pb-3 mb-2">
                  Prescription Details
                </h3>

                {errorMsg && (
                  <div className="p-2 bg-red-50 text-red-700 text-xs border border-red-200 rounded mb-2">
                    {errorMsg}
                  </div>
                )}

                <div className="text-xs space-y-1 mb-4 bg-slate-50 p-3 rounded">
                  <p><strong>Patient:</strong> {selectedRx.patient.firstName} {selectedRx.patient.lastName}</p>
                  <p><strong>UHID:</strong> <code>{selectedRx.patient.uhid}</code></p>
                  <p><strong>Doctor:</strong> Dr. {selectedRx.doctor.user.firstName} {selectedRx.doctor.user.lastName}</p>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Item Batch Allocation</h4>
                  {selectedRx.items.map((item: any) => {
                    const availableBatches = stock?.filter((s: any) => s.medicineId === item.medicineId) || [];

                    return (
                      <div key={item.id} className="border p-3 rounded-lg space-y-2">
                        <div className="flex justify-between items-start text-sm">
                          <span className="font-bold text-slate-800">{item.medicine.brandName || item.medicine.name}</span>
                          <span className="text-xs text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded font-mono">
                            Qty: {item.qty}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-semibold">Dosage: {item.dosage} | {item.frequency}</p>

                        <div>
                          <label className="text-[10px] font-bold text-slate-400 block mb-1">Select Expiry Batch (FEFO suggestion)</label>
                          {availableBatches.length === 0 ? (
                            <span className="text-xs text-red-500 font-bold">OUT OF STOCK</span>
                          ) : (
                            <select
                              value={selectedBatches[item.id] || ''}
                              onChange={(e) =>
                                setSelectedBatches((prev) => ({ ...prev, [item.id]: e.target.value }))
                              }
                              className="form-input w-full p-1 text-xs font-mono font-bold"
                            >
                              {availableBatches.map((b: any) => (
                                <option key={b.id} value={b.id}>
                                  Batch: {b.batchNumber} (Stock: {b.qty} | Exp: {new Date(b.expiryDate).toLocaleDateString()})
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4">
                  <label className="text-xs font-semibold mb-1 block">Dispensing Notes</label>
                  <textarea
                    rows={2}
                    value={dispenseNotes}
                    onChange={(e) => setDispenseNotes(e.target.value)}
                    placeholder="Pharmacist counseling remarks..."
                    className="form-input w-full text-xs p-2"
                  />
                </div>
              </div>

              <div className="pt-4 border-t">
                <button
                  onClick={handleDispense}
                  disabled={dispenseMutation.isPending}
                  className="btn btn-primary w-full font-bold uppercase tracking-wider"
                >
                  {dispenseMutation.isPending ? 'Dispensing...' : 'Confirm Dispensed & Release'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="card h-full flex items-center justify-center text-center p-8 border-2 border-dashed">
            <div>
              <p className="text-slate-400 font-medium">Select a patient prescription from the queue on the left to start dispensing.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
