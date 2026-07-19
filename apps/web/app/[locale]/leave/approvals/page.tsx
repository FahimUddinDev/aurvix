'use client';

import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAuthenticatedClient, gql } from '@/lib/graphql-client';

const PENDING_LEAVES_QUERY = gql`
  query GetPendingLeaves {
    leaveRequests(status: "PENDING") {
      id
      startDate
      endDate
      days
      reason
      createdAt
      employee {
        firstName
        lastName
        employeeCode
      }
      leaveType {
        name
      }
    }
  }
`;

const REVIEW_LEAVE_MUTATION = gql`
  mutation ReviewLeave($id: ID!, $approve: Boolean!, $rejectionNote: String) {
    approveLeave(id: $id, approve: $approve, rejectionNote: $rejectionNote) {
      id
      status
    }
  }
`;

export default function LeaveApprovalsPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params.locale as string) || 'en';
  const queryClient = useQueryClient();

  const client = getAuthenticatedClient();

  // Query pending requests
  const { data: requests, isLoading } = useQuery({
    queryKey: ['pendingLeavesList'],
    queryFn: async () => {
      const res: any = await client.request(PENDING_LEAVES_QUERY);
      return res.leaveRequests;
    },
    refetchInterval: 8000,
  });

  // Review mutation
  const reviewMutation = useMutation({
    mutationFn: async (args: { id: string; approve: boolean; rejectionNote?: string }) => {
      return client.request(REVIEW_LEAVE_MUTATION, {
        id: args.id,
        approve: args.approve,
        rejectionNote: args.rejectionNote,
      });
    },
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['pendingLeavesList'] });
      alert(`Leave request reviewed. Status updated to ${res.approveLeave.status}.`);
    },
  });

  const handleApprove = (id: string) => {
    if (confirm('Are you sure you want to approve this leave request?')) {
      reviewMutation.mutate({ id, approve: true });
    }
  };

  const handleReject = (id: string) => {
    const note = prompt('Please specify a rejection reason / comment:');
    if (note !== null) {
      reviewMutation.mutate({ id, approve: false, rejectionNote: note || undefined });
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <button onClick={() => router.push(`/${locale}/leave`)} className="btn btn-sm btn-outline mb-2">
        ← Back to Leave Center
      </button>

      <div className="settings-header">
        <div>
          <h1 className="settings-title">HR Supervisor Leave Approvals</h1>
          <p className="settings-subtitle">Review, approve, or reject employee leave request sheets</p>
        </div>
      </div>

      <div className="card">
        <div className="card-body p-0">
          {isLoading ? (
            <div className="p-10 text-center text-slate-500 font-semibold">Loading leave requests...</div>
          ) : !requests || requests.length === 0 ? (
            <div className="p-10 text-center text-slate-400 font-medium">No pending leave requests awaiting approval.</div>
          ) : (
            <div className="table-responsive">
              <table className="settings-table w-full text-xs">
                <thead>
                  <tr>
                    <th>Staff Member</th>
                    <th>Employee Code</th>
                    <th>Leave Type</th>
                    <th>Dates Range</th>
                    <th>Duration</th>
                    <th>Reason</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r: any) => (
                    <tr key={r.id} className="hover:bg-slate-50 transition">
                      <td>
                        <span className="font-bold text-slate-800">
                          {r.employee?.firstName} {r.employee?.lastName}
                        </span>
                      </td>
                      <td>
                        <code className="text-xs text-slate-500 font-mono font-semibold">{r.employee?.employeeCode}</code>
                      </td>
                      <td>
                        <span className="badge badge-outline text-[10px]">{r.leaveType?.name}</span>
                      </td>
                      <td>
                        <span className="font-semibold text-slate-600">
                          {formatDate(r.startDate)} to {formatDate(r.endDate)}
                        </span>
                      </td>
                      <td className="font-mono font-bold text-slate-900">{r.days} days</td>
                      <td className="text-slate-500 max-w-xs truncate">{r.reason || '—'}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleApprove(r.id)}
                            className="btn btn-primary btn-sm text-[10px] font-bold"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(r.id)}
                            className="btn bg-red-50 text-red-700 hover:bg-red-100 btn-sm text-[10px] font-bold"
                          >
                            Reject
                          </button>
                        </div>
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
  );
}
