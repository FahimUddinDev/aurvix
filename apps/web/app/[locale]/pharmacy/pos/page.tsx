'use client';

import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAuthenticatedClient, gql } from '@/lib/graphql-client';

const ACTIVE_SHIFT_QUERY = gql`
  query ActiveShift {
    activePharmacyShift {
      id
      status
    }
  }
`;

const POS_INVENTORY_QUERY = gql`
  query PosInventory($search: String) {
    pharmacyInventory(search: $search) {
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

const CREATE_POS_SALE_MUTATION = gql`
  mutation CreatePosSale($input: CreatePosSaleInput!) {
    createPosSale(input: $input) {
      id
      invoiceNo
      total
    }
  }
`;

const PARK_CART_MUTATION = gql`
  mutation HoldPosSale($patientId: ID, $itemsJson: String!) {
    holdPosSale(patientId: $patientId, itemsJson: $itemsJson) {
      id
    }
  }
`;

const RESUME_CART_MUTATION = gql`
  mutation ResumePosSale($holdId: ID!) {
    resumePosSale(holdId: $holdId) {
      id
      patientId
      itemsJson
    }
  }
`;

interface CartItem {
  id: string; // Unique key: batchId
  medicineId: string;
  name: string;
  batchId: string;
  batchNumber: string;
  qty: number;
  unitPrice: number;
  maxQty: number;
}

export default function PosTerminalPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params.locale as string) || 'en';
  const client = getAuthenticatedClient();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [discount, setDiscount] = useState(0);

  // Split payment forms
  const [paymentCash, setPaymentCash] = useState(0);
  const [paymentBkash, setPaymentBkash] = useState(0);
  const [paymentBkashRef, setPaymentBkashRef] = useState('');
  const [paymentSslCard, setPaymentSslCard] = useState(0);
  const [paymentSslRef, setPaymentSslRef] = useState('');

  const [parkedId, setParkedId] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Query active shift
  const { data: shift, isLoading: shiftLoading } = useQuery({
    queryKey: ['activePharmacyShift'],
    queryFn: async () => {
      const res: any = await client.request(ACTIVE_SHIFT_QUERY);
      return res.activePharmacyShift;
    },
  });

  // Query inventory items
  const { data: stock } = useQuery({
    queryKey: ['posInventory', search],
    queryFn: async () => {
      if (!search) return [];
      const res: any = await client.request(POS_INVENTORY_QUERY, { search });
      return res.pharmacyInventory;
    },
    enabled: search.length > 1,
  });

  // Mutations
  const saleMutation = useMutation({
    mutationFn: async (input: any) => {
      return client.request(CREATE_POS_SALE_MUTATION, { input });
    },
    onSuccess: (res: any) => {
      alert(`Sale completed successfully! Invoice: ${res.createPosSale.invoiceNo}`);
      setCart([]);
      setDiscount(0);
      clearPayments();
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Transaction checkout failed.');
    },
  });

  const parkMutation = useMutation({
    mutationFn: async (itemsJson: string) => {
      return client.request(PARK_CART_MUTATION, { itemsJson });
    },
    onSuccess: (res: any) => {
      setParkedId(res.holdPosSale.id);
      setCart([]);
      alert(`Cart parked. Hold ID: ${res.holdPosSale.id}`);
    },
  });

  const resumeMutation = useMutation({
    mutationFn: async (holdId: string) => {
      return client.request(RESUME_CART_MUTATION, { holdId });
    },
    onSuccess: (res: any) => {
      if (res.resumePosSale) {
        setCart(JSON.parse(res.resumePosSale.itemsJson));
        alert('Cart successfully resumed.');
      } else {
        alert('Hold ID not found or expired.');
      }
    },
  });

  const clearPayments = () => {
    setPaymentCash(0);
    setPaymentBkash(0);
    setPaymentBkashRef('');
    setPaymentSslCard(0);
    setPaymentSslRef('');
  };

  // Keyboard shortcut hooks
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'F4') {
        e.preventDefault();
        handlePark();
      } else if (e.key === 'F8') {
        e.preventDefault();
        handleCheckout();
      } else if (e.key === 'F9') {
        e.preventDefault();
        const code = prompt('Enter Hold ID to resume parked sale:');
        if (code) resumeMutation.mutate(code);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, discount, paymentCash, paymentBkash, paymentSslCard]);

  const addToCart = (batch: any) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.batchId === batch.id);
      if (existing) {
        if (existing.qty >= batch.qty) return prev;
        return prev.map((item) =>
          item.batchId === batch.id ? { ...item, qty: item.qty + 1 } : item,
        );
      }

      return [
        ...prev,
        {
          id: batch.id,
          medicineId: batch.medicineId,
          name: batch.medicine.brandName || batch.medicine.name,
          batchId: batch.id,
          batchNumber: batch.batchNumber,
          qty: 1,
          unitPrice: Number(batch.unitCost) * 1.2, // 20% selling markup
          maxQty: batch.qty,
        },
      ];
    });
    setSearch('');
  };

  const handlePark = () => {
    if (cart.length === 0) return;
    parkMutation.mutate(JSON.stringify(cart));
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;

    const subtotal = cart.reduce((acc, i) => acc + i.qty * i.unitPrice, 0);
    const total = subtotal - discount;

    const paySum = paymentCash + paymentBkash + paymentSslCard;
    if (paySum < total) {
      setErrorMsg(`Insufficient payment received (Expected: ${total.toFixed(2)} BDT, Received: ${paySum.toFixed(2)} BDT)`);
      return;
    }

    const itemsInput = cart.map((i) => ({
      medicineId: i.medicineId,
      batchId: i.batchId,
      qty: i.qty,
      unitPrice: i.unitPrice,
      discount: 0,
    }));

    const paymentsInput = [];
    if (paymentCash > 0) paymentsInput.push({ method: 'CASH', amount: paymentCash });
    if (paymentBkash > 0) paymentsInput.push({ method: 'BKASH', amount: paymentBkash, reference: paymentBkashRef || undefined });
    if (paymentSslCard > 0) paymentsInput.push({ method: 'SSLCOMMERZ', amount: paymentSslCard, reference: paymentSslRef || undefined });

    saleMutation.mutate({
      items: itemsInput,
      payments: paymentsInput,
      discount,
    });
  };

  if (shiftLoading) {
    return <div className="p-6 text-center text-slate-500 font-medium">Verifying active cashier registers...</div>;
  }

  // Require active open shift to unlock POS terminal
  if (!shift) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="card max-w-md text-center p-8 border space-y-4">
          <div className="text-4xl">🔒</div>
          <h2 className="text-lg font-black text-slate-900">POS Terminal Locked</h2>
          <p className="text-sm text-slate-500">You must open a cashier shift drawer with starting funds before processes POS sales.</p>
          <button
            onClick={() => router.push(`/${locale}/pharmacy/pos/shift`)}
            className="btn btn-primary w-full font-bold uppercase"
          >
            Go to Shift Manager
          </button>
        </div>
      </div>
    );
  }

  const subtotal = cart.reduce((acc, i) => acc + i.qty * i.unitPrice, 0);
  const total = subtotal - discount;

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-6 text-slate-800 grid grid-cols-1 xl:grid-cols-4 gap-6">
      {/* Search & Cart list */}
      <div className="xl:col-span-3 space-y-4">
        {/* Top Header */}
        <div className="flex justify-between items-center bg-white border p-4 rounded-xl shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center font-bold text-white text-lg">
              🏪
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-900">POS Cashier counter</h1>
              <p className="text-[10px] text-slate-400 font-black uppercase">Fast Checkout Desk</p>
            </div>
          </div>

          <div className="flex gap-1.5 text-xs">
            <button onClick={handlePark} className="btn btn-outline btn-sm font-bold">Hold (F4)</button>
            <button
              onClick={() => {
                const code = prompt('Enter Hold ID to resume parked sale:');
                if (code) resumeMutation.mutate(code);
              }}
              className="btn btn-outline btn-sm font-bold"
            >
              Resume (F9)
            </button>
            <button onClick={() => router.push(`/${locale}/pharmacy/pos/shift`)} className="btn btn-outline btn-sm font-bold">
              Shift Manager
            </button>
            <button onClick={() => router.push(`/${locale}/pharmacy`)} className="btn btn-outline btn-sm font-bold">
              ← Dispense Queue
            </button>
          </div>
        </div>

        {/* Search autocomplete bar */}
        <div className="card">
          <div className="card-body relative">
            <label className="text-xs font-black uppercase text-slate-400 mb-1 block">Barcode Scanner / Drug Lookup (F1)</label>
            <input
              type="text"
              ref={searchInputRef}
              placeholder="Scan medicine barcode or type generic name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input w-full p-2.5 border rounded-lg text-sm font-bold text-slate-900"
            />

            {/* Suggestions Dropdown */}
            {search && stock && stock.length > 0 && (
              <div className="absolute top-[75px] left-[32px] right-[32px] bg-white border rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto divide-y">
                {stock.map((b: any) => (
                  <div
                    key={b.id}
                    onClick={() => addToCart(b)}
                    className="p-3 hover:bg-indigo-50/50 cursor-pointer flex justify-between items-center text-sm"
                  >
                    <div>
                      <span className="font-bold text-slate-800">{b.medicine.brandName || b.medicine.name}</span>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Generic: {b.medicine.genericName}</p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-mono text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded">
                        Batch: {b.batchNumber} (Stock: {b.qty})
                      </span>
                      <p className="text-xs text-indigo-700 font-mono font-bold mt-1">{(Number(b.unitCost) * 1.2).toFixed(2)} BDT</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Cart table sheet */}
        <div className="card">
          <div className="card-body p-0">
            {cart.length === 0 ? (
              <div className="p-16 text-center text-slate-400 font-medium">Cart is empty. Scan barcode to append items.</div>
            ) : (
              <div className="table-responsive">
                <table className="settings-table w-full text-sm">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Batch Number</th>
                      <th>Unit Price</th>
                      <th>Quantity</th>
                      <th>Total (BDT)</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map((item) => (
                      <tr key={item.batchId} className="hover:bg-slate-50 transition">
                        <td>
                          <span className="font-bold text-slate-800">{item.name}</span>
                        </td>
                        <td>
                          <code className="text-xs text-slate-500 font-mono font-bold">{item.batchNumber}</code>
                        </td>
                        <td className="font-mono text-slate-700 font-bold">{item.unitPrice.toFixed(2)} BDT</td>
                        <td>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() =>
                                setCart((prev) =>
                                  prev.map((i) =>
                                    i.batchId === item.batchId
                                      ? { ...i, qty: Math.max(1, i.qty - 1) }
                                      : i,
                                  ),
                                )
                              }
                              className="px-2 py-0.5 border rounded bg-slate-50 text-slate-500 font-bold hover:bg-slate-100"
                            >
                              -
                            </button>
                            <span className="w-8 text-center font-bold text-sm font-mono">{item.qty}</span>
                            <button
                              onClick={() => {
                                if (item.qty >= item.maxQty) return;
                                setCart((prev) =>
                                  prev.map((i) =>
                                    i.batchId === item.batchId ? { ...i, qty: i.qty + 1 } : i,
                                  ),
                                );
                              }}
                              className="px-2 py-0.5 border rounded bg-slate-50 text-slate-500 font-bold hover:bg-slate-100"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="font-bold text-slate-900 font-mono">
                          {(item.qty * item.unitPrice).toFixed(2)} BDT
                        </td>
                        <td>
                          <button
                            onClick={() => setCart((prev) => prev.filter((i) => i.batchId !== item.batchId))}
                            className="text-red-500 font-bold hover:underline"
                          >
                            Remove
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

      {/* Checkout Sidebar panel */}
      <div className="space-y-4">
        {errorMsg && (
          <div className="p-3 bg-red-50 text-red-700 text-xs rounded border border-red-200 font-semibold">
            {errorMsg}
          </div>
        )}

        <div className="card">
          <div className="card-body space-y-4">
            <h3 className="text-md font-bold text-slate-900 border-b pb-3 mb-2 uppercase tracking-wide text-xs text-slate-400">
              Receipt Invoice Summary
            </h3>

            <div className="space-y-2 text-sm font-semibold border-b pb-4">
              <div className="flex justify-between">
                <span className="text-slate-500">Subtotal:</span>
                <span className="font-mono">{subtotal.toFixed(2)} BDT</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Discount (BDT):</span>
                <input
                  type="number"
                  value={discount || ''}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  className="form-input w-24 p-1 text-right text-xs font-mono font-bold"
                />
              </div>
              <div className="flex justify-between text-base font-black pt-2 border-t text-slate-900">
                <span>Net Total:</span>
                <span className="font-mono text-indigo-700">{total.toFixed(2)} BDT</span>
              </div>
            </div>

            {/* Split payments checkout forms */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Split Payments Registry</h4>

              <div className="space-y-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Cash amount (BDT)</label>
                  <input
                    type="number"
                    value={paymentCash || ''}
                    onChange={(e) => setPaymentCash(Number(e.target.value))}
                    className="form-input w-full p-1.5 text-sm font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">bKash Mobile Banking (BDT)</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Amount..."
                      value={paymentBkash || ''}
                      onChange={(e) => setPaymentBkash(Number(e.target.value))}
                      className="form-input w-1/2 p-1.5 text-sm font-mono font-bold"
                    />
                    <input
                      type="text"
                      placeholder="Transaction Ref..."
                      value={paymentBkashRef}
                      onChange={(e) => setPaymentBkashRef(e.target.value)}
                      className="form-input w-1/2 p-1.5 text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">SSL Card Terminal (BDT)</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Amount..."
                      value={paymentSslCard || ''}
                      onChange={(e) => setPaymentSslCard(Number(e.target.value))}
                      className="form-input w-1/2 p-1.5 text-sm font-mono font-bold"
                    />
                    <input
                      type="text"
                      placeholder="Approval Code..."
                      value={paymentSslRef}
                      onChange={(e) => setPaymentSslRef(e.target.value)}
                      className="form-input w-1/2 p-1.5 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={cart.length === 0 || saleMutation.isPending}
              className="btn btn-primary w-full mt-4 font-black uppercase text-sm"
            >
              {saleMutation.isPending ? 'Processing...' : 'Complete Checkout (F8)'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
