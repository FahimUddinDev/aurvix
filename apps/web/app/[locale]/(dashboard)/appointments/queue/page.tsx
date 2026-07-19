'use client';

import { useTranslations } from 'next-intl';
import { useRouter, useParams } from 'next/navigation';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAuthenticatedClient, gql } from '@/lib/graphql-client';

const ACTIVE_DOCTORS_LIST_QUERY = gql`
  query DoctorsList {
    doctors {
      items {
        id
        user {
          firstName
          lastName
        }
        department {
          name
          code
        }
      }
    }
  }
`;

const TODAY_QUEUE_QUERY = gql`
  query TodayQueue($doctorId: ID!) {
    todayQueue(doctorId: $doctorId) {
      id
      type
      status
      slotStartTime
      tokenNumber
      checkedInAt
      patient {
        id
        uhid
        firstName
        lastName
        phone
      }
      queueToken {
        displayLabel
        estimatedWait
      }
    }
  }
`;

const CALL_NEXT_MUTATION = gql`
  mutation CallNextPatient($doctorId: ID!) {
    callNextPatient(doctorId: $doctorId) {
      id
      status
      tokenNumber
      patient {
        firstName
        lastName
      }
    }
  }
`;

const SKIP_MUTATION = gql`
  mutation SkipPatient($appointmentId: ID!, $reason: String!) {
    skipPatient(appointmentId: $appointmentId, reason: $reason) {
      id
      status
    }
  }
`;

export default function QueueManagementPage() {
  const commonT = useTranslations('common');
  const router = useRouter();
  const params = useParams();
  const locale = (params.locale as string) || 'en';
  const queryClient = useQueryClient();

  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [skipReasonModal, setSkipReasonModal] = useState<string | null>(null);
  const [skipReason, setSkipReason] = useState('');

  const client = getAuthenticatedClient();

  // Fetch doctors for selector
  const { data: doctorsData } = useQuery({
    queryKey: ['doctorsForQueue'],
    queryFn: async () => {
      const res: any = await client.request(ACTIVE_DOCTORS_LIST_QUERY);
      return res.doctors.items;
    },
  });

  // Fetch today's queue for selected doctor (polls every 5 seconds for real-time responsiveness)
  const { data: queueItems, isLoading: isQueueLoading } = useQuery({
    queryKey: ['todayQueue', selectedDoctorId],
    queryFn: async () => {
      const res: any = await client.request(TODAY_QUEUE_QUERY, { doctorId: selectedDoctorId });
      return res.todayQueue;
    },
    enabled: !!selectedDoctorId,
    refetchInterval: 5000, // Poll every 5s for queue display updates
  });

  // Call next mutation
  const callNextMutation = useMutation({
    mutationFn: async (doctorId: string) => {
      return client.request(CALL_NEXT_MUTATION, { doctorId });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['todayQueue', selectedDoctorId] });
      alert(`Called token: T-${data.callNextPatient.tokenNumber} (Dr. ${data.callNextPatient.patient?.firstName || ''})`);
    },
    onError: (err: any) => {
      alert(err.message || 'No patients checked-in to call.');
    },
  });

  // Skip mutation
  const skipMutation = useMutation({
    mutationFn: async ({ appointmentId, reason }: { appointmentId: string; reason: string }) => {
      return client.request(SKIP_MUTATION, { appointmentId, reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todayQueue', selectedDoctorId] });
      setSkipReasonModal(null);
      setSkipReason('');
      alert('Patient marked as skipped.');
    },
    onError: (err: any) => {
      alert(err.message || 'Failed to skip patient.');
    },
  });

  const handleCallNext = () => {
    if (!selectedDoctorId) return;
    callNextMutation.mutate(selectedDoctorId);
  };

  const handleOpenSkip = (appointmentId: string) => {
    setSkipReasonModal(appointmentId);
  };

  const handleConfirmSkip = () => {
    if (!skipReasonModal || !skipReason) return;
    skipMutation.mutate({ appointmentId: skipReasonModal, reason: skipReason });
  };

  // Group queue by status
  const inProgressApp = queueItems?.find((q: any) => q.status === 'IN_PROGRESS');
  const checkedInApps = queueItems?.filter((q: any) => q.status === 'CHECKED_IN') || [];
  const bookedApps = queueItems?.filter((q: any) => q.status === 'BOOKED' || q.status === 'CONFIRMED') || [];

  return (
    <div className="patient-list-container">
      {/* Header */}
      <div className="settings-header">
        <div>
          <h1 className="settings-title">Active Queue & Token Manager</h1>
          <p className="settings-subtitle">Manage today's checked-in queue and dispatch live waiting tickets</p>
        </div>
        <button onClick={() => router.push(`/${locale}/appointments`)} className="btn btn-outline">
          ← Back to Bookings
        </button>
      </div>

      {/* Select Doctor Bar */}
      <div className="filters-card card mb-6">
        <div className="card-body grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div className="md:col-span-2">
            <label className="form-label text-sm font-semibold text-slate-700 block mb-1">Select Consulting Doctor</label>
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className="form-input w-full"
            >
              <option value="">Choose Doctor...</option>
              {doctorsData?.map((d: any) => (
                <option key={d.id} value={d.id}>
                  Dr. {d.user.firstName} {d.user.lastName} ({d.department.name})
                </option>
              ))}
            </select>
          </div>

          <div className="pt-5">
            <button
              onClick={handleCallNext}
              disabled={!selectedDoctorId || callNextMutation.isPending}
              className="btn btn-primary w-full font-bold uppercase tracking-wider"
            >
              🔔 Call Next Patient
            </button>
          </div>
        </div>
      </div>

      {/* Queue Boards */}
      {selectedDoctorId && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 1. Currently Serving */}
          <div className="card bg-brand-navy text-white shadow-lg border-none">
            <div className="card-body flex flex-col justify-between min-h-[250px]">
              <div>
                <span className="text-xs text-white/60 font-bold block uppercase tracking-wider mb-2">
                  Now Consulting
                </span>
                {inProgressApp ? (
                  <div className="space-y-4">
                    <div className="text-5xl font-mono font-extrabold text-white">
                      {inProgressApp.queueToken?.displayLabel}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">
                        {inProgressApp.patient.firstName} {inProgressApp.patient.lastName}
                      </h3>
                      <p className="text-xs text-white/70">UHID: {inProgressApp.patient.uhid}</p>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center text-white/50 font-medium">
                    No patient currently inside consultation room.
                  </div>
                )}
              </div>

              {inProgressApp && (
                <button
                  onClick={() => handleOpenSkip(inProgressApp.id)}
                  className="btn btn-outline border-white/20 text-white hover:bg-white/10 w-full mt-4 text-xs font-semibold"
                >
                  Skip Patient (No-Show)
                </button>
              )}
            </div>
          </div>

          {/* 2. Checked-in (Waiting Lounge) */}
          <div className="lg:col-span-2 card">
            <div className="card-body">
              <h2 className="text-lg font-bold text-slate-900 border-b pb-2 mb-4">
                Checked-In Queue ({checkedInApps.length})
              </h2>

              {isQueueLoading ? (
                <div className="text-sm text-slate-500 py-6 text-center">Loading queue...</div>
              ) : checkedInApps.length === 0 ? (
                <div className="text-sm text-slate-400 py-6 text-center">
                  No patients checked-in at desk yet. Use the main directory to check-in booked slots.
                </div>
              ) : (
                <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                  {checkedInApps.map((q: any) => (
                    <div
                      key={q.id}
                      className="p-3 border rounded-lg hover:bg-slate-50 transition flex justify-between items-center"
                    >
                      <div className="flex gap-4 items-center">
                        <span className="text-lg font-bold font-mono text-brand-blue bg-blue-50 px-2 py-1 rounded">
                          {q.queueToken?.displayLabel}
                        </span>
                        <div>
                          <h4 className="font-bold text-slate-800">
                            {q.patient.firstName} {q.patient.lastName}
                          </h4>
                          <span className="text-xs text-slate-500 font-mono">UHID: {q.patient.uhid}</span>
                        </div>
                      </div>

                      <div className="flex gap-3 items-center">
                        <span className="text-xs text-slate-500 font-medium font-mono">
                          Est. Wait: {q.queueToken?.estimatedWait || 15} mins
                        </span>
                        <button
                          onClick={() => handleOpenSkip(q.id)}
                          className="text-xs text-red-500 font-semibold hover:underline"
                        >
                          Skip
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Skip Reason Dialog */}
      {skipReasonModal && (
        <div className="modal-backdrop fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex justify-center items-center p-4">
          <div className="modal-container bg-white rounded-lg shadow-xl w-full max-w-md card">
            <div className="card-body">
              <h3 className="text-lg font-bold text-slate-900 mb-2">Skip Patient Ticket</h3>
              <p className="text-slate-500 text-sm mb-4">Provide a reason for marking this ticket as skipped (No-show).</p>

              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="e.g. Patient did not respond after 3 announcements"
                  value={skipReason}
                  onChange={(e) => setSkipReason(e.target.value)}
                  className="form-input w-full"
                />

                <div className="flex justify-end gap-2 border-t pt-3 mt-4">
                  <button type="button" onClick={() => setSkipReasonModal(null)} className="btn btn-outline text-xs">
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmSkip}
                    disabled={!skipReason || skipMutation.isPending}
                    className="btn btn-primary text-xs"
                  >
                    Confirm Skip
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
