'use client';

import { useTranslations } from 'next-intl';
import { useRouter, useParams } from 'next/navigation';
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getAuthenticatedClient, gql } from '@/lib/graphql-client';

const ORDER_DETAILS_QUERY = gql`
  query RadiologyOrderDetails($id: ID!) {
    radiologyOrder(id: $id) {
      id
      clinicalInfo
      patient {
        uhid
        firstName
        lastName
        gender
      }
      modality {
        name
        code
      }
      report {
        findings
        impression
        reportUrl
      }
    }
  }
`;

const UPLOAD_REPORT_MUTATION = gql`
  mutation UploadRadiologyReport($orderId: ID!, $input: UploadRadiologyReportInput!) {
    uploadRadiologyReport(orderId: $orderId, input: $input) {
      id
      findings
      impression
    }
  }
`;

export default function UploadRadiologyReportPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;
  const locale = (params.locale as string) || 'en';

  const [findings, setFindings] = useState('');
  const [impression, setImpression] = useState('');
  const [reportUrl, setReportUrl] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const client = getAuthenticatedClient();

  // Query order details
  const { data: order, isLoading } = useQuery({
    queryKey: ['radiologyOrderForUpload', orderId],
    queryFn: async () => {
      const res: any = await client.request(ORDER_DETAILS_QUERY, { id: orderId });
      const ord = res.radiologyOrder;
      if (ord.report) {
        setFindings(ord.report.findings || '');
        setImpression(ord.report.impression || '');
        setReportUrl(ord.report.reportUrl || '');
      }
      return ord;
    },
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (input: any) => {
      return client.request(UPLOAD_REPORT_MUTATION, { orderId, input });
    },
    onSuccess: () => {
      alert('Radiology findings successfully recorded and routed to radiologist for review.');
      router.push(`/${locale}/radiology`);
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Failed to save report.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!findings || !impression) {
      setErrorMsg('Please specify both findings and diagnostic impression.');
      return;
    }

    uploadMutation.mutate({
      findings,
      impression,
      reportUrl: reportUrl || undefined,
    });
  };

  if (isLoading) {
    return <div className="p-6 text-center text-slate-500 font-medium">Loading imaging order context...</div>;
  }

  if (!order) {
    return <div className="p-6 text-center text-red-500 font-medium">Imaging order not found.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <button onClick={() => router.push(`/${locale}/radiology`)} className="btn btn-sm btn-outline mb-2">
        ← Cancel
      </button>

      <div className="settings-header">
        <div>
          <h1 className="settings-title">Radiology Report Worksheet</h1>
          <p className="settings-subtitle">Register findings and impressions for computed imaging scans</p>
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
            <h3 className="text-md font-bold text-slate-900">
              Patient: {order.patient?.firstName} {order.patient?.lastName}
            </h3>
            <p className="text-xs text-slate-500">
              UHID: {order.patient?.uhid} | Scan Type: <strong className="text-indigo-900">{order.modality?.name} ({order.modality?.code})</strong>
            </p>
            {order.clinicalInfo && (
              <p className="text-xs text-slate-600 bg-slate-50 border p-2 rounded mt-2 font-mono">
                <strong>Clinical Indication:</strong> {order.clinicalInfo}
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="form-label text-sm font-semibold mb-1 block">Clinical Findings</label>
              <textarea
                rows={5}
                value={findings}
                onChange={(e) => setFindings(e.target.value)}
                required
                placeholder="Describe physiological findings, structural observations, and scan results in detail..."
                className="form-input w-full p-2 border rounded"
              />
            </div>

            <div>
              <label className="form-label text-sm font-semibold mb-1 block">Diagnostic Impression</label>
              <textarea
                rows={3}
                value={impression}
                onChange={(e) => setImpression(e.target.value)}
                required
                placeholder="Write final summary diagnostic opinion or impression..."
                className="form-input w-full p-2 border rounded font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="form-label text-sm font-semibold mb-1 block">DICOM Image URL / PACS Attachment (Optional)</label>
              <input
                type="text"
                value={reportUrl}
                onChange={(e) => setReportUrl(e.target.value)}
                placeholder="e.g. https://pacs.hospital.internal/scans/2026/chest-019.dcm"
                className="form-input w-full font-mono text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={uploadMutation.isPending}
              className="btn btn-primary w-full mt-4 font-bold uppercase"
            >
              {uploadMutation.isPending ? 'Uploading Report...' : 'Submit Report for Verification'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
