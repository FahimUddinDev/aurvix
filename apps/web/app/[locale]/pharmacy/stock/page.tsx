'use client';

import { useRouter, useParams } from 'next/navigation';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAuthenticatedClient, gql } from '@/lib/graphql-client';

const INVENTORY_DASHBOARD_QUERY = gql`
  query InventoryDashboard($search: String, $category: String) {
    pharmacyInventory(search: $search, category: $category) {
      id
      batchNumber
      expiryDate
      qty
      unitCost
      medicine {
        name
        brandName
        genericName
        category
      }
    }
  }
`;

const EXPIRING_MEDICINES_QUERY = gql`
  query ExpiringMedicines($withinDays: Int!) {
    expiringMedicines(withinDays: $withinDays) {
      id
      batchNumber
      expiryDate
      qty
      medicine {
        name
        brandName
        genericName
      }
    }
  }
`;

export default function PharmacyStockDashboardPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params.locale as string) || 'en';

  const client = getAuthenticatedClient();

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  // Queries
  const { data: stock, isLoading: stockLoading } = useQuery({
    queryKey: ['pharmacyStockDashboard', search, category],
    queryFn: async () => {
      const res: any = await client.request(INVENTORY_DASHBOARD_QUERY, {
        search: search || undefined,
        category: category || undefined,
      });
      return res.pharmacyInventory;
    },
  });

  const { data: expiring, isLoading: expiringLoading } = useQuery({
    queryKey: ['expiringMedicinesBoard'],
    queryFn: async () => {
      const res: any = await client.request(EXPIRING_MEDICINES_QUERY, { withinDays: 90 });
      return res.expiringMedicines;
    },
  });

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
            📦
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Pharmacy Inventory & Stock Levels</h1>
            <p className="text-xs text-slate-500 font-semibold uppercase">Real-time Formulary & FEFO Shelf levels</p>
          </div>
        </div>

        <button onClick={() => router.push(`/${locale}/pharmacy`)} className="btn btn-sm btn-outline">
          ← Back to Dispense Queue
        </button>
      </div>

      {/* Near Expiry Board */}
      <div className="card border-red-200 bg-red-50/20">
        <div className="card-body">
          <h3 className="text-sm font-black text-red-800 uppercase tracking-wider mb-3">
            ⚠️ Near-Expiry Warnings (Less than 90 Days)
          </h3>

          {expiringLoading ? (
            <div className="text-xs text-slate-400">Checking expiration dates...</div>
          ) : !expiring || expiring.length === 0 ? (
            <div className="text-xs text-green-700 font-bold">No batches currently expiring within 90 days.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {expiring.map((exp: any) => (
                <div key={exp.id} className="p-3 bg-white border border-red-200 rounded-lg flex justify-between items-center">
                  <div>
                    <span className="font-bold text-slate-800 text-xs">{exp.medicine.brandName || exp.medicine.name}</span>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">Batch: {exp.batchNumber}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-red-600 font-bold block">{formatDate(exp.expiryDate)}</span>
                    <span className="text-[10px] bg-red-50 text-red-700 font-black px-1.5 py-0.5 rounded">
                      {exp.qty} pcs
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Search filters */}
      <div className="filters-card card">
        <div className="card-body grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <input
              type="text"
              placeholder="Search stock by brand, generic name, or batch number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input w-full p-2 border rounded-lg text-sm"
            />
          </div>

          <div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="form-input w-full p-2 border rounded-lg text-sm"
            >
              <option value="">All Categories</option>
              <option value="TABLET">Tablet</option>
              <option value="CAPSULE">Capsule</option>
              <option value="SYRUP">Syrup</option>
              <option value="INJECTION">Injection</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stock list table */}
      <div className="card">
        <div className="card-body p-0">
          {stockLoading ? (
            <div className="p-10 text-center text-slate-500 font-semibold">Loading stock records...</div>
          ) : !stock || stock.length === 0 ? (
            <div className="p-10 text-center text-slate-400 font-medium">No stock records found on shelf.</div>
          ) : (
            <div className="table-responsive">
              <table className="settings-table w-full text-sm">
                <thead>
                  <tr>
                    <th>Medicine Details</th>
                    <th>Form / Category</th>
                    <th>Batch Code</th>
                    <th>Expiry Date</th>
                    <th>Stock Qty</th>
                    <th>Unit Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {stock.map((item: any) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition">
                      <td>
                        <span className="font-bold text-slate-800">{item.medicine.brandName || item.medicine.name}</span>
                        <div className="text-xs text-slate-400 font-semibold">Gen: {item.medicine.genericName}</div>
                      </td>
                      <td>
                        <span className="badge badge-outline text-[10px]">{item.medicine.category}</span>
                      </td>
                      <td>
                        <code className="text-xs font-mono font-bold text-slate-600">{item.batchNumber}</code>
                      </td>
                      <td>
                        <span className="text-xs font-bold text-slate-600">{formatDate(item.expiryDate)}</span>
                      </td>
                      <td>
                        <span className={`badge text-xs font-black ${item.qty < 50 ? 'bg-yellow-50 text-yellow-800' : 'bg-slate-100 text-slate-700'}`}>
                          {item.qty} pcs
                        </span>
                      </td>
                      <td className="font-bold text-slate-900 font-mono">{Number(item.unitCost).toFixed(2)} BDT</td>
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
