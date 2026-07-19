'use client';

import { useTranslations } from 'next-intl';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAuthenticatedClient, gql } from '@/lib/graphql-client';

const ORDER_DETAILS_QUERY = gql`
  query RadiologyOrderDetailsForReview($id: ID!) {
    radiologyOrder(id: $id) {
      id
      status
      clinicalInfo
      createdAt
      patient {
        uhid
        firstName
        lastName
        gender
      }
      doctor {
        user {
          firstName
          lastName
        }
      }
      modality {
        name
        code
      }
      report {
        findings
        impression
        reportUrl
        approvedAt
      }
    }
  }
`;

const APPROVE_REPORT_MUTATION = gql`
  mutation ApproveRadiologyReport($orderId: ID!) {
    approveRadiologyReport(orderId: $orderId) {
      id
      status
    }
  }
`;

export default function ReviewRadiologyReportPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;
  const locale = (params.locale as string) || 'en';
  const queryClient = useQueryClient();

  const client = getAuthenticatedClient();

  // Query order details
  const { data: order, isLoading } = useQuery({
    queryKey: ['radiologyOrderForReview', orderId],
    queryFn: async () => {
      const res: any = await client.request(ORDER_DETAILS_QUERY, { id: orderId });
      return res.radiologyOrder;
    },
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async () => {
      return client.request(APPROVE_REPORT_MUTATION, { orderId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['radiologyOrderForReview', orderId] });
      alert('Radiology report officially signed-off and finalized.');
      router.push(`/${locale}/radiology`);
    },
  });

  const handleApprove = () => {
    approveMutation.mutate();
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return <div className="p-6 text-center text-slate-500 font-medium">Loading report sheet...</div>;
  }

  if (!order) {
    return <div className="p-6 text-center text-red-500 font-medium">Imaging order not found.</div>;
  }

  const isReviewMode = order.status === 'REPORT_UPLOADED';
  const isFinalized = order.status === 'APPROVED';

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6 print:p-0 print:max-w-full">
      {/* Top action bar - hidden during print */}
      <div className="flex justify-between items-center print:hidden">
        <button onClick={() => router.push(`/${locale}/radiology`)} className="btn btn-sm btn-outline">
          ← Back to worklist
        </button>

        <div className="flex gap-2">
          {isFinalized && (
            <button onClick={handlePrint} className="btn btn-outline btn-sm font-bold">
              🖨️ Print Report
            </button>
          )}
          {isReviewMode && (
            <button
              onClick={handleApprove}
              disabled={approveMutation.isPending}
              className="btn bg-[#10b981] hover:bg-[#059669] text-white btn-sm font-bold border-none"
            >
              {approveMutation.isPending ? 'Verifying...' : 'Sign-Off & Approve Report'}
            </button>
          )}
        </div>
      </div>

      {/* Hospital Letterhead Report Layout */}
      <div className="bg-white border rounded-xl p-8 shadow-sm space-y-6 print:border-none print:shadow-none print:p-0">
        {/* Hospital Header */}
        <div className="text-center border-b pb-6">
          <h2 className="text-2xl font-black tracking-wide text-indigo-900">AUREVIX HOSPITAL & IMAGING</h2>
          <p className="text-xs text-slate-400 font-bold tracking-widest uppercase">Department of Radiology & Molecular Imaging</p>
          <p className="text-[10px] text-slate-400 font-semibold mt-1">Dhanmondi, Dhaka, Bangladesh | Phone: +880-2-9660000</p>
        </div>

        {/* Patient / Doctor Metadata Panel */}
        <div className="grid grid-cols-2 gap-4 bg-slate-50 border p-4 rounded-lg text-sm print:bg-white">
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase">Patient Demographics</p>
            <p className="font-bold text-slate-900 mt-1">Name: {order.patient?.firstName} {order.patient?.lastName}</p>
            <p className="text-xs text-slate-500 font-semibold">UHID: <code className="font-mono">{order.patient?.uhid}</code> | Gender: {order.patient?.gender}</p>
          </div>

          <div className="text-right">
            <p className="text-xs text-slate-400 font-bold uppercase">Clinical Context</p>
            <p className="font-bold text-indigo-900 mt-1">Scan: {order.modality?.name}</p>
            <p className="text-xs text-slate-500 font-semibold">Ref Doctor: Dr. {order.doctor?.user?.firstName} {order.doctor?.user?.lastName}</p>
          </div>
        </div>

        {/* Report Content */}
        <div className="space-y-6 py-4">
          <div>
            <h3 className="text-sm font-black text-slate-900 border-b pb-1 uppercase tracking-wider mb-2">Clinical Findings</h3>
            <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-line font-medium">
              {order.report?.findings || 'No findings reported yet.'}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-black text-slate-900 border-b pb-1 uppercase tracking-wider mb-2">Diagnostic Impression</h3>
            <p className="text-sm font-bold text-slate-900 leading-relaxed bg-slate-50 p-3 border-l-4 border-indigo-600 rounded print:bg-white whitespace-pre-line">
              {order.report?.impression || 'No impression summary entered.'}
            </p>
          </div>

          {order.report?.reportUrl && (
            <div className="print:hidden bg-slate-50 border p-3 rounded-lg flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-500">PACS Image Attachment Link:</span>
              <a href={order.report.reportUrl} target="_blank" rel="noreferrer" className="text-indigo-600 font-bold hover:underline font-mono">
                {order.report.reportUrl}
              </a>
            </div>
          )}
        </div>

        {/* Signature Line */}
        <div className="border-t pt-8 grid grid-cols-2 items-end">
          <div>
            <span className="text-[10px] text-slate-400 font-bold block uppercase">Report Status</span>
            <span className={`status-badge font-bold inline-block mt-1 ${
              isFinalized ? 'status-active' : 'bg-yellow-100 text-yellow-800 border-yellow-200'
            }`}>
              {order.status}
            </span>
          </div>

          <div className="text-right space-y-1">
            {isFinalized ? (
              <>
                <div className="w-24 h-10 border border-slate-200 bg-slate-50 rounded flex items-center justify-center font-bold text-slate-400 text-xs italic ml-auto print:bg-white">
                  [Verified Stamp]
                </div>
                <p className="text-xs font-bold text-slate-800">Dr. M. Rahman, MD</p>
                <p className="text-[9px] text-slate-400 font-bold uppercase">Consultant Radiologist</p>
              </>
            ) : (
              <p className="text-xs italic text-slate-400 font-medium">Pending Radiologist Approval</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
