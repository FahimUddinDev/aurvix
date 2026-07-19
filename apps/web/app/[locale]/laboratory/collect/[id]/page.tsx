'use client';

import { useTranslations } from 'next-intl';
import { useRouter, useParams } from 'next/navigation';
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getAuthenticatedClient, gql } from '@/lib/graphql-client';

const ORDER_DETAILS_QUERY = gql`
  query OrderDetails($id: ID!) {
    labOrder(id: $id) {
      id
      priority
      patient {
        uhid
        firstName
        lastName
        gender
      }
      items {
        test {
          id
          name
          sampleType
        }
      }
    }
  }
`;

const COLLECT_SAMPLE_MUTATION = gql`
  mutation CollectSample($orderId: ID!, $input: CollectSampleInput!) {
    collectSample(orderId: $orderId, input: $input) {
      id
      barcode
      sampleType
    }
  }
`;

export default function CollectSamplePage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;
  const locale = (params.locale as string) || 'en';

  const [barcode, setBarcode] = useState('');
  const [sampleType, setSampleType] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const client = getAuthenticatedClient();

  // Query order details
  const { data: order, isLoading } = useQuery({
    queryKey: ['labOrderForCollect', orderId],
    queryFn: async () => {
      const res: any = await client.request(ORDER_DETAILS_QUERY, { id: orderId });
      const ord = res.labOrder;
      // Pre-fill sample type from first test
      if (ord.items.length > 0) {
        setSampleType(ord.items[0].test.sampleType);
      }
      return ord;
    },
  });

  // Collect mutation
  const collectMutation = useMutation({
    mutationFn: async (input: any) => {
      return client.request(COLLECT_SAMPLE_MUTATION, { orderId, input });
    },
    onSuccess: () => {
      alert('Sample collected successfully and logged in laboratory registry.');
      router.push(`/${locale}/laboratory`);
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Failed to collect sample.');
    },
  });

  const handleAutoGenerateBarcode = () => {
    const num = Math.floor(100000 + Math.random() * 900000);
    setBarcode(`L-2026-${num}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcode || !sampleType) {
      setErrorMsg('Please specify sample type and scan or enter a barcode.');
      return;
    }

    collectMutation.mutate({
      sampleType,
      barcode,
    });
  };

  if (isLoading) {
    return <div className="p-6 text-center text-slate-500 font-medium">Loading lab order details...</div>;
  }

  if (!order) {
    return <div className="p-6 text-center text-red-500 font-medium">Lab order not found.</div>;
  }

  return (
    <div className="max-w-xl mx-auto p-4 space-y-6">
      {/* Back button */}
      <button onClick={() => router.push(`/${locale}/laboratory`)} className="btn btn-sm btn-outline mb-2">
        ← Cancel
      </button>

      <div className="settings-header">
        <div>
          <h1 className="settings-title">Specimen Sample Collection</h1>
          <p className="settings-subtitle">Register and label test tubes for incoming lab orders</p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 text-red-700 rounded border border-red-200 text-sm">
          {errorMsg}
        </div>
      )}

      <div className="card">
        <div className="card-body space-y-4">
          <div className="border-b pb-3 mb-2">
            <span className="text-[10px] bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded-full font-bold">
              {order.priority}
            </span>
            <h3 className="text-md font-bold mt-1 text-slate-900">
              Patient: {order.patient.firstName} {order.patient.lastName}
            </h3>
            <p className="text-xs text-slate-500">UHID: {order.patient.uhid} | Gender: {order.patient.gender}</p>
          </div>

          <div>
            <h4 className="text-xs text-slate-400 font-bold uppercase mb-2">Tests Requested</h4>
            <div className="bg-slate-50 rounded-lg p-3 divide-y text-sm">
              {order.items.map((i: any) => (
                <div key={i.test.id} className="py-2 flex justify-between">
                  <span className="font-semibold text-slate-700">{i.test.name}</span>
                  <span className="text-xs font-mono text-slate-400">Specimen: {i.test.sampleType}</span>
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 border-t pt-4">
            <div>
              <label className="form-label text-sm font-semibold mb-1 block">Specimen Sample Type</label>
              <input
                type="text"
                value={sampleType}
                onChange={(e) => setSampleType(e.target.value)}
                required
                className="form-input w-full"
              />
            </div>

            <div>
              <label className="form-label text-sm font-semibold mb-1 block">Triage Barcode Label</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="Scan tube barcode or enter manually..."
                  required
                  className="form-input w-full font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={handleAutoGenerateBarcode}
                  className="btn btn-outline border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-bold whitespace-nowrap text-xs"
                >
                  Generate Barcode
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={collectMutation.isPending}
              className="btn btn-primary w-full mt-4 font-bold uppercase"
            >
              {collectMutation.isPending ? 'Logging Specimen...' : 'Confirm Specimen Collected'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
