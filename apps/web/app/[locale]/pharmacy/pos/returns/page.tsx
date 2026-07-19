'use client';

import { useRouter, useParams } from 'next/navigation';
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getAuthenticatedClient, gql } from '@/lib/graphql-client';

const FIND_SALE_QUERY = gql`
  query FindSale($invoiceNo: String!) {
    findPharmacySale(invoiceNo: $invoiceNo) {
      id
      invoiceNo
      total
      patientId
      patient {
        firstName
        lastName
      }
      items {
        id
        medicineId
        batchId
        qty
        unitPrice
        batch {
          batchNumber
        }
        medicine {
          name
          brandName
        }
      }
    }
  }
`;

const POS_RETURN_MUTATION = gql`
  mutation PosReturn(
    $saleId: ID!
    $items: [PosReturnItemInput!]!
    $reason: String
    $isWasted: Boolean
  ) {
    posReturn(saleId: $saleId, items: $items, reason: $reason, isWasted: $isWasted) {
      id
      refundAmt
    }
  }
`;

export default function PosReturnsPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params.locale as string) || 'en';

  const client = getAuthenticatedClient();

  const [invoiceNo, setInvoiceNo] = useState('');
  const [searchTrigger, setSearchTrigger] = useState('');
  const [returnQtys, setReturnQtys] = useState<Record<string, number>>({}); // itemId -> qty
  const [returnReason, setReturnReason] = useState('');
  const [isWasted, setIsWasted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Query invoice
  const { data: sale, isLoading } = useQuery({
    queryKey: ['findPharmacySale', searchTrigger],
    queryFn: async () => {
      if (!searchTrigger) return null;
      const res: any = await client.request(FIND_SALE_QUERY, { invoiceNo: searchTrigger });
      return res.findPharmacySale;
    },
    enabled: !!searchTrigger,
  });

  // Return mutation
  const returnMutation = useMutation({
    mutationFn: async (args: { saleId: string; items: any[]; reason?: string; isWasted: boolean }) => {
      return client.request(POS_RETURN_MUTATION, {
        saleId: args.saleId,
        items: args.items,
        reason: args.reason,
        isWasted: args.isWasted,
      });
    },
    onSuccess: (res: any) => {
      alert(`Return processed successfully. Refund amount: ${res.posReturn.refundAmt.toFixed(2)} BDT.`);
      router.push(`/${locale}/pharmacy/pos`);
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Failed to process return.');
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceNo) return;
    setSearchTrigger(invoiceNo);
    setErrorMsg('');
    setReturnQtys({});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sale || !sale.items) return;

    const items = sale.items;

    const formattedItems = items
      .filter((item: any) => Number(returnQtys[item.id] || 0) > 0)
      .map((item: any) => ({
        medicineId: item.medicineId,
        batchId: item.batchId,
        qty: Number(returnQtys[item.id] || 0),
        unitPrice: Number(item.unitPrice),
      }));

    if (formattedItems.length === 0) {
      setErrorMsg('Please specify return quantities for at least one item.');
      return;
    }

    const hasInvalidQty = formattedItems.some((f: any) => {
      const match = items.find((i: any) => i.medicineId === f.medicineId);
      return f.qty > (match?.qty || 0);
    });

    if (hasInvalidQty) {
      setErrorMsg('Return quantity cannot exceed purchased quantity.');
      return;
    }

    returnMutation.mutate({
      saleId: sale.id,
      items: formattedItems,
      reason: returnReason || undefined,
      isWasted,
    });
  };

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      <button onClick={() => router.push(`/${locale}/pharmacy/pos`)} className="btn btn-sm btn-outline mb-2">
        ← Back to POS Terminal
      </button>

      <div className="settings-header">
        <div>
          <h1 className="settings-title">POS Invoice Returns</h1>
          <p className="settings-subtitle">Search invoices, select return quantities, and reverse stock levels</p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 text-red-700 text-xs rounded border border-red-200 font-bold">
          {errorMsg}
        </div>
      )}

      {/* Invoice Search Input */}
      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              placeholder="Enter POS Invoice Number (e.g., INV-POS-1721...)"
              value={invoiceNo}
              onChange={(e) => setInvoiceNo(e.target.value)}
              required
              className="form-input w-full p-2 border rounded font-mono text-sm font-bold"
            />
            <button type="submit" className="btn btn-primary font-bold px-6 whitespace-nowrap text-sm">
              Search Invoice
            </button>
          </form>
        </div>
      </div>

      {isLoading && <div className="p-6 text-center text-slate-500 font-semibold">Searching invoice database...</div>}

      {/* Invoice Details & Return Form */}
      {searchTrigger && !isLoading && !sale && (
        <div className="p-6 text-center text-red-500 font-bold bg-red-50 border rounded-lg">
          Invoice number not found. Verify invoice spelling.
        </div>
      )}

      {sale && (
        <div className="card">
          <div className="card-body space-y-4">
            <div className="border-b pb-3 mb-2 flex justify-between">
              <div>
                <h3 className="text-md font-bold text-slate-900">
                  Invoice: <code className="font-mono text-indigo-700">{sale.invoiceNo}</code>
                </h3>
                <p className="text-xs text-slate-400 font-semibold">
                  Patient: {sale.patient ? `${sale.patient.firstName} ${sale.patient.lastName}` : 'Walk-in OTC Customer'}
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-400 font-bold block uppercase">Invoice Total</span>
                <span className="text-base font-black text-indigo-900 font-mono">{Number(sale.total).toFixed(2)} BDT</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="table-responsive">
                <table className="settings-table w-full text-xs">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Batch</th>
                      <th>Sold Qty</th>
                      <th>Unit Price</th>
                      <th>Return Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sale.items.map((item: any) => (
                      <tr key={item.id} className="hover:bg-slate-50 transition">
                        <td className="font-semibold text-slate-800">{item.medicine?.brandName || item.medicine?.name}</td>
                        <td>
                          <code className="text-slate-500 font-mono font-semibold">{item.batch?.batchNumber}</code>
                        </td>
                        <td className="font-mono font-semibold text-slate-600">{item.qty} pcs</td>
                        <td className="font-mono font-bold">{Number(item.unitPrice).toFixed(2)} BDT</td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            max={item.qty}
                            value={returnQtys[item.id] || ''}
                            onChange={(e) =>
                              setReturnQtys((prev) => ({ ...prev, [item.id]: Number(e.target.value) }))
                            }
                            placeholder="Qty..."
                            className="form-input w-20 p-1 text-center font-mono font-bold border text-xs"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                <div>
                  <label className="form-label text-sm font-semibold mb-1 block">Reason for Return</label>
                  <textarea
                    rows={2}
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    placeholder="e.g., Damaged item or wrong dose returned..."
                    className="form-input w-full text-xs p-2"
                  />
                </div>

                <div>
                  <label className="form-label text-sm font-semibold mb-1 block">Return Destination</label>
                  <select
                    value={isWasted ? 'true' : 'false'}
                    onChange={(e) => setIsWasted(e.target.value === 'true')}
                    className="form-input w-full p-2 text-xs font-bold text-slate-800"
                  >
                    <option value="false">Restocked to Shelf (Add back to batch qty)</option>
                    <option value="true">Discard as Damaged/Wasted (Do not restock)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={returnMutation.isPending}
                className="btn btn-primary w-full mt-4 font-bold uppercase tracking-wider text-xs"
              >
                {returnMutation.isPending ? 'Processing stock reversal...' : 'Confirm Return & Reverse Stock'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
