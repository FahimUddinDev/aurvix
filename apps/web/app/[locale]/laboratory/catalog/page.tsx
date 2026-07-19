'use client';

import { useTranslations } from 'next-intl';
import { useRouter, useParams } from 'next/navigation';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAuthenticatedClient, gql } from '@/lib/graphql-client';

const CATALOG_QUERY = gql`
  query LabCatalog($category: String, $search: String) {
    labTestCatalog(category: $category, search: $search) {
      id
      name
      nameBn
      code
      category
      sampleType
      normalRangeMale
      normalRangeFemale
      unit
      price
      turnaroundHrs
    }
  }
`;

export default function LabCatalogPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params.locale as string) || 'en';

  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const client = getAuthenticatedClient();

  // Query catalog
  const { data: tests, isLoading } = useQuery({
    queryKey: ['labCatalog', categoryFilter, searchQuery],
    queryFn: async () => {
      const res: any = await client.request(CATALOG_QUERY, {
        category: categoryFilter || undefined,
        search: searchQuery || undefined,
      });
      return res.labTestCatalog;
    },
  });

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-800 font-sans">
      {/* Header */}
      <div className="flex justify-between items-center border-b pb-4 mb-6 bg-white p-4 rounded-xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center font-bold text-white text-lg">
            📘
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Lab Test Catalog</h1>
            <p className="text-xs text-slate-500 font-semibold uppercase">Reference Catalog & Clinical pricing</p>
          </div>
        </div>

        <button onClick={() => router.push(`/${locale}/laboratory`)} className="btn btn-sm btn-outline">
          ← Back to Worklist
        </button>
      </div>

      {/* Search and Filters */}
      <div className="filters-card card mb-6">
        <div className="card-body grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <input
              type="text"
              placeholder="Search tests by name or reference code (e.g. Hemoglobin, BIO-CRE)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input w-full p-2 border rounded-lg text-sm"
            />
          </div>

          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="form-input w-full p-2 border rounded-lg text-sm"
            >
              <option value="">All Categories</option>
              <option value="HEMATOLOGY">Hematology</option>
              <option value="BIOCHEMISTRY">Biochemistry</option>
              <option value="IMMUNOLOGY">Immunology</option>
              <option value="SEROLOGY">Serology</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid List */}
      <div className="card">
        <div className="card-body p-0">
          {isLoading ? (
            <div className="p-10 text-center text-slate-500 font-semibold">Loading catalog data...</div>
          ) : !tests || tests.length === 0 ? (
            <div className="p-10 text-center text-slate-400 font-medium">No tests found in catalog.</div>
          ) : (
            <div className="table-responsive">
              <table className="settings-table w-full text-sm">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Test Name</th>
                    <th>Category</th>
                    <th>Specimen Type</th>
                    <th>Normal Range (Male)</th>
                    <th>Normal Range (Female)</th>
                    <th>Turnaround (TAT)</th>
                    <th>Price (BDT)</th>
                  </tr>
                </thead>
                <tbody>
                  {tests.map((t: any) => (
                    <tr key={t.id} className="hover:bg-slate-50 transition">
                      <td>
                        <span className="uhid-code font-bold font-mono text-xs">{t.code || '—'}</span>
                      </td>
                      <td>
                        <span className="font-bold text-slate-800">{t.name}</span>
                        {t.nameBn && <div className="text-xs text-slate-400 font-semibold">{t.nameBn}</div>}
                      </td>
                      <td>
                        <span className="badge badge-outline text-[10px]">{t.category}</span>
                      </td>
                      <td className="text-xs font-medium text-slate-600">{t.sampleType}</td>
                      <td className="text-xs font-mono text-slate-500 font-bold">{t.normalRangeMale || 'Negative'} {t.unit}</td>
                      <td className="text-xs font-mono text-slate-500 font-bold">{t.normalRangeFemale || 'Negative'} {t.unit}</td>
                      <td>{t.turnaroundHrs} Hours</td>
                      <td className="font-bold text-slate-900 font-mono">{t.price} BDT</td>
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
