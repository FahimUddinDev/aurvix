'use client';

import { useRouter, useParams } from 'next/navigation';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAuthenticatedClient, gql } from '@/lib/graphql-client';

const BILL_DETAILS_QUERY = gql`
  query GetBillDetails($id: ID!) {
    bill(id: $id) {
      id
      billNo
      status
      subtotal
      taxAmount
      discount
      totalAmount
      paidAmount
      dueAmount
      notes
      createdAt
      patient {
        uhid
        firstName
        lastName
        gender
      }
      lineItems {
        id
        description
        qty
        unitPrice
        taxPercent
        total
      }
      payments {
        id
        method
        status
        amount
        reference
        paidAt
      }
    }
  }
`;

const ADD_LINE_ITEM_MUTATION = gql`
  mutation AddLineItem($billId: ID!, $input: AddLineItemInput!) {
    addLineItem(billId: $billId, input: $input) {
      id
      totalAmount
      dueAmount
    }
  }
`;

const REMOVE_LINE_ITEM_MUTATION = gql`
  mutation RemoveLineItem($billId: ID!, $itemId: ID!) {
    removeLineItem(billId: $billId, itemId: $itemId) {
      id
      totalAmount
      dueAmount
    }
  }
`;

const PROCESS_PAYMENT_MUTATION = gql`
  mutation ProcessPayment($billId: ID!, $input: ProcessPaymentInput!) {
    processPayment(billId: $billId, input: $input) {
      id
      status
      paidAmount
      dueAmount
    }
  }
`;

const INIT_SSL_MUTATION = gql`
  mutation InitSSLCommerz($billId: ID!) {
    initSSLCommerzPayment(billId: $billId) {
      redirectUrl
      gatewayStatus
    }
  }
`;

export default function BillCheckoutPage() {
  const router = useRouter();
  const params = useParams();
  const billId = params.id as string;
  const locale = (params.locale as string) || 'en';
  const queryClient = useQueryClient();

  const client = getAuthenticatedClient();

  // Add Item States
  const [itemDesc, setItemDesc] = useState('');
  const [itemPrice, setItemPrice] = useState<number>(0);
  const [itemQty, setItemQty] = useState<number>(1);
  const [itemTax, setItemTax] = useState<number>(5); // 5% default

  // Checkout Payment States
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState('CASH');
  const [payRef, setPayRef] = useState('');
  const [payNotes, setPayNotes] = useState('');

  const [gatewayUrl, setGatewayUrl] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Query Bill Details
  const { data: invoice, isLoading } = useQuery({
    queryKey: ['billDetails', billId],
    queryFn: async () => {
      const res: any = await client.request(BILL_DETAILS_QUERY, { id: billId });
      const b = res.bill;
      setPayAmount(Number(b.dueAmount));
      return b;
    },
  });

  // Mutations
  const addItemMutation = useMutation({
    mutationFn: async (input: any) => {
      return client.request(ADD_LINE_ITEM_MUTATION, { billId, input });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billDetails', billId] });
      setItemDesc('');
      setItemPrice(0);
      setItemQty(1);
      alert('Custom item charge successfully added to invoice.');
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      return client.request(REMOVE_LINE_ITEM_MUTATION, { billId, itemId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billDetails', billId] });
      alert('Item charge successfully removed from invoice.');
    },
  });

  const paymentMutation = useMutation({
    mutationFn: async (input: any) => {
      return client.request(PROCESS_PAYMENT_MUTATION, { billId, input });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billDetails', billId] });
      clearCheckout();
      alert('Payment receipt logged and invoice updated.');
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Payment register failed.');
    },
  });

  const sslMutation = useMutation({
    mutationFn: async () => {
      return client.request(INIT_SSL_MUTATION, { billId });
    },
    onSuccess: (res: any) => {
      setGatewayUrl(res.initSSLCommerzPayment.redirectUrl);
    },
  });

  const clearCheckout = () => {
    setPayRef('');
    setPayNotes('');
    setGatewayUrl('');
    setErrorMsg('');
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemDesc || itemPrice <= 0) return;

    addItemMutation.mutate({
      description: itemDesc,
      qty: itemQty,
      unitPrice: itemPrice,
      taxPercent: itemTax,
    });
  };

  const handleProcessPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (payAmount <= 0) return;

    if (payAmount > Number(invoice.dueAmount)) {
      setErrorMsg('Payment amount cannot exceed the pending invoice due balance.');
      return;
    }

    paymentMutation.mutate({
      method: payMethod,
      amount: payAmount,
      reference: payRef || undefined,
      notes: payNotes || undefined,
    });
  };

  const handleInitSSL = () => {
    sslMutation.mutate();
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return <div className="p-6 text-center text-slate-500 font-medium">Loading invoice record...</div>;
  }

  if (!invoice) {
    return <div className="p-6 text-center text-red-500 font-medium">Invoice record not found.</div>;
  }

  const isFinalized = invoice.status === 'PAID';

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6 print:p-0 print:max-w-full">
      {/* Action panel header */}
      <div className="flex justify-between items-center print:hidden">
        <button onClick={() => router.push(`/${locale}/billing`)} className="btn btn-sm btn-outline">
          ← Back to Invoice ledger
        </button>

        <button onClick={handlePrint} className="btn btn-sm btn-primary font-bold">
          🖨️ Print Invoice Receipt
        </button>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 text-red-700 text-xs rounded border border-red-200 font-bold print:hidden">
          {errorMsg}
        </div>
      )}

      {/* Main Content Workspace Layout split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Printable Bill sheet */}
        <div className="lg:col-span-2 card bg-white border p-6 rounded-xl space-y-6 print:shadow-none print:border-none print:p-0">
          {/* Hospital Letterhead */}
          <div className="text-center border-b pb-4">
            <h2 className="text-2xl font-black text-indigo-900 tracking-wide">AUREVIX MEDICAL COLLEGE & HOSPITAL</h2>
            <p className="text-[10px] text-slate-400 font-black tracking-widest uppercase">Patient Billing Invoice</p>
            <p className="text-[9px] text-slate-400 font-semibold mt-0.5">Dhanmondi, Dhaka, Bangladesh | Phone: +880-2-9660000</p>
          </div>

          {/* Invoice Metadata */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 border rounded-lg text-xs print:bg-white">
            <div>
              <span className="text-slate-400 font-bold block uppercase">Bill To Patient</span>
              <p className="font-bold text-slate-900 mt-1">Name: {invoice.patient?.firstName} {invoice.patient?.lastName}</p>
              <p className="text-slate-500 font-semibold">UHID: <code className="font-mono">{invoice.patient?.uhid}</code> | Gender: {invoice.patient?.gender}</p>
            </div>

            <div className="text-right">
              <span className="text-slate-400 font-bold block uppercase">Invoice Metadata</span>
              <p className="font-bold text-indigo-900 mt-1">Bill No: <code className="font-mono">{invoice.billNo}</code></p>
              <p className="text-slate-500 font-semibold">Issued: {new Date(invoice.createdAt).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Table Items */}
          <div className="space-y-4">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-2">Line Items Charge Ledger</h4>
            <div className="table-responsive">
              <table className="settings-table w-full text-xs">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Unit Price</th>
                    <th>Qty</th>
                    <th>Tax</th>
                    <th>Total</th>
                    <th className="print:hidden">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.lineItems.map((item: any) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition">
                      <td className="font-semibold text-slate-800">{item.description}</td>
                      <td className="font-mono">{Number(item.unitPrice).toFixed(2)} ৳</td>
                      <td className="font-mono">{item.qty}</td>
                      <td className="font-mono text-slate-400">{Number(item.taxPercent)}%</td>
                      <td className="font-bold text-slate-900 font-mono">{Number(item.total).toFixed(2)} ৳</td>
                      <td className="print:hidden">
                        {!isFinalized && (
                          <button
                            onClick={() => removeItemMutation.mutate(item.id)}
                            className="text-red-500 font-bold hover:underline"
                          >
                            Remove
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals panel */}
          <div className="border-t pt-4 flex flex-col items-end text-xs font-semibold space-y-1.5 max-w-sm ml-auto">
            <div className="flex justify-between w-full">
              <span className="text-slate-500">Subtotal:</span>
              <span className="font-mono">{Number(invoice.subtotal).toFixed(2)} ৳</span>
            </div>
            <div className="flex justify-between w-full">
              <span className="text-slate-500">Govt Health Tax:</span>
              <span className="font-mono">+{Number(invoice.taxAmount).toFixed(2)} ৳</span>
            </div>
            <div className="flex justify-between w-full font-black text-slate-900 border-t pt-1.5">
              <span>Grand Total:</span>
              <span className="font-mono text-indigo-700">{Number(invoice.totalAmount).toFixed(2)} ৳</span>
            </div>
            <div className="flex justify-between w-full text-[#10b981]">
              <span>Amount Paid:</span>
              <span className="font-mono">-{Number(invoice.paidAmount).toFixed(2)} ৳</span>
            </div>
            <div className="flex justify-between w-full font-black text-red-600 border-t pt-1 text-sm bg-red-50/50 p-2 rounded">
              <span>Net Due Balance:</span>
              <span className="font-mono">{Number(invoice.dueAmount).toFixed(2)} ৳</span>
            </div>
          </div>

          {/* Payment Log History */}
          {invoice.payments.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-2">Payment Transaction History</h4>
              <div className="space-y-2 text-xs">
                {invoice.payments.map((p: any) => (
                  <div key={p.id} className="p-2 border rounded-lg bg-slate-50 flex justify-between items-center font-mono">
                    <div>
                      <span className="font-bold text-slate-700">Paid {Number(p.amount).toFixed(2)} ৳</span>
                      <span className="text-[10px] text-slate-400 font-bold block">Method: {p.method} | Ref: {p.reference || '—'}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-semibold">{new Date(p.paidAt).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Panel sidebar (hidden in prints) */}
        <div className="space-y-4 print:hidden">
          {/* Add custom item charge */}
          {!isFinalized && (
            <div className="card">
              <div className="card-body">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">Add Custom Charge</h3>
                <form onSubmit={handleAddItem} className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">Item Description</label>
                    <input
                      type="text"
                      placeholder="e.g. Injection procedure cost, IV fluid kit..."
                      value={itemDesc}
                      onChange={(e) => setItemDesc(e.target.value)}
                      required
                      className="form-input w-full text-xs p-2 border"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-1">Unit Price (৳)</label>
                      <input
                        type="number"
                        value={itemPrice || ''}
                        onChange={(e) => setItemPrice(Number(e.target.value))}
                        required
                        className="form-input w-full text-xs p-1.5 border font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-1">Qty</label>
                      <input
                        type="number"
                        value={itemQty || ''}
                        onChange={(e) => setItemQty(Number(e.target.value))}
                        required
                        className="form-input w-full text-xs p-1.5 border font-mono"
                      />
                    </div>
                  </div>

                  <button type="submit" className="btn btn-outline border-indigo-200 text-indigo-700 hover:bg-indigo-50 w-full text-xs font-bold">
                    Add Charge to Bill
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Settle Checkout */}
          {!isFinalized && (
            <div className="card">
              <div className="card-body space-y-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Process Receipt Settlement</h3>

                <form onSubmit={handleProcessPayment} className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">Payment Amount (৳)</label>
                    <input
                      type="number"
                      max={invoice.dueAmount}
                      value={payAmount || ''}
                      onChange={(e) => setPayAmount(Number(e.target.value))}
                      required
                      className="form-input w-full text-sm font-mono font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">Payment Method</label>
                    <select
                      value={payMethod}
                      onChange={(e) => setPayMethod(e.target.value)}
                      className="form-input w-full text-xs font-bold text-slate-800 p-2"
                    >
                      <option value="CASH">Cash Drawer</option>
                      <option value="BKASH">bKash Mobile Sandbox</option>
                      <option value="SSLCOMMERZ">SSLCommerz Sandbox</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">Transaction Ref (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Card approval code or trxID..."
                      value={payRef}
                      onChange={(e) => setPayRef(e.target.value)}
                      className="form-input w-full text-xs p-2 font-mono"
                    />
                  </div>

                  <button type="submit" className="btn btn-primary w-full font-bold uppercase text-xs">
                    Process Payment
                  </button>
                </form>

                {/* Online digital checkout trigger */}
                <div className="border-t pt-4 space-y-2">
                  <button onClick={handleInitSSL} className="btn btn-outline border-indigo-200 text-indigo-700 hover:bg-indigo-50 w-full text-xs font-bold font-mono">
                    📱 Initialize SSLCommerz Gateway Link
                  </button>

                  {gatewayUrl && (
                    <div className="bg-slate-50 border p-3 rounded text-[10px] space-y-1">
                      <span className="font-semibold text-slate-500 block">Simulated Gateway Redirect Link:</span>
                      <a href={gatewayUrl} target="_blank" rel="noreferrer" className="text-indigo-600 font-bold hover:underline font-mono">
                        {gatewayUrl}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
