'use client';

import { useTranslations } from 'next-intl';
import { useRouter, useParams } from 'next/navigation';
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getAuthenticatedClient, gql } from '@/lib/graphql-client';

const ACTIVE_DOCTORS_QUERY = gql`
  query ActiveDoctors {
    doctors {
      items {
        id
        user {
          firstName
          lastName
        }
        department {
          name
        }
      }
    }
  }
`;

const TODAY_CLINIC_QUEUE_QUERY = gql`
  query TodayClinicQueue($doctorId: ID!) {
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
        gender
        phone
      }
      queueToken {
        displayLabel
      }
    }
  }
`;

const START_CONSULTATION_MUTATION = gql`
  mutation StartConsultation($appointmentId: ID!) {
    startConsultation(appointmentId: $appointmentId) {
      id
      patientId
      doctorId
    }
  }
`;

export default function DoctorClinicQueuePage() {
  const commonT = useTranslations('common');
  const router = useRouter();
  const params = useParams();
  const locale = (params.locale as string) || 'en';

  const [selectedDoctorId, setSelectedDoctorId] = useState('');

  const client = getAuthenticatedClient();

  // Doctors list for selector
  const { data: doctors } = useQuery({
    queryKey: ['doctorsListForEMR'],
    queryFn: async () => {
      const res: any = await client.request(ACTIVE_DOCTORS_QUERY);
      return res.doctors.items;
    },
  });

  // Doctor Queue
  const { data: queueItems, isLoading: isQueueLoading } = useQuery({
    queryKey: ['doctorClinicQueue', selectedDoctorId],
    queryFn: async () => {
      const res: any = await client.request(TODAY_CLINIC_QUEUE_QUERY, { doctorId: selectedDoctorId });
      return res.todayQueue;
    },
    enabled: !!selectedDoctorId,
    refetchInterval: 5000, // Poll queue every 5s
  });

  // Start consultation mutation
  const startConsultationMutation = useMutation({
    mutationFn: async (appointmentId: string) => {
      return client.request(START_CONSULTATION_MUTATION, { appointmentId });
    },
    onSuccess: (data: any) => {
      router.push(`/${locale}/emr/visit/${data.startConsultation.id}`);
    },
    onError: (err: any) => {
      alert(err.message || 'Failed to start consultation.');
    },
  });

  const handleStartConsultation = (appointmentId: string) => {
    startConsultationMutation.mutate(appointmentId);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans p-6 text-slate-800">
      {/* Clinic Header */}
      <div className="flex justify-between items-center border-b pb-4 mb-6 bg-white p-4 rounded-xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-blue rounded-full flex items-center justify-center font-bold text-white text-lg">
            ✚
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Physician EMR Queue</h1>
            <p className="text-xs text-slate-500 font-semibold uppercase">Consultation Workspace Dashboard</p>
          </div>
        </div>

        {/* Doctor Selector */}
        <div className="w-80">
          <select
            value={selectedDoctorId}
            onChange={(e) => setSelectedDoctorId(e.target.value)}
            className="form-input w-full p-2 border rounded-lg focus:outline-none focus:border-brand-blue text-sm"
          >
            <option value="">Select Doctor Context...</option>
            {doctors?.map((doc: any) => (
              <option key={doc.id} value={doc.id}>
                Dr. {doc.user.firstName} {doc.user.lastName} ({doc.department.name})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Content */}
      {!selectedDoctorId ? (
        <div className="flex-1 flex flex-col justify-center items-center py-20 text-slate-400">
          <svg className="w-16 h-16 mb-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="text-lg font-bold text-slate-600">Select Doctor Context</span>
          <p className="text-sm mt-1 text-slate-500">Choose your name from the dropdown to access your active clinic session.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 max-w-6xl mx-auto w-full">
          <div className="card">
            <div className="card-body">
              <div className="flex justify-between items-center border-b pb-3 mb-4">
                <h2 className="text-lg font-bold text-slate-900">Today's Appointment Queue</h2>
                <span className="badge badge-outline text-xs bg-slate-100 text-slate-600 font-semibold">Active Session</span>
              </div>

              {isQueueLoading ? (
                <div className="text-sm text-slate-500 py-8 text-center">Loading patients list...</div>
              ) : !queueItems || queueItems.length === 0 ? (
                <div className="text-sm text-slate-400 py-8 text-center font-medium">
                  No appointments scheduled for you today.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="settings-table w-full">
                    <thead>
                      <tr>
                        <th>Token</th>
                        <th>Time</th>
                        <th>Patient Name</th>
                        <th>UHID</th>
                        <th>Phone</th>
                        <th>Gender</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {queueItems.map((item: any) => (
                        <tr key={item.id} className="hover:bg-slate-50 transition">
                          <td>
                            <span className="uhid-code font-black font-mono">
                              {item.queueToken?.displayLabel || `T-${item.tokenNumber}`}
                            </span>
                          </td>
                          <td className="font-mono text-sm text-slate-600 font-medium">
                            {item.slotStartTime || 'Walk-in'}
                          </td>
                          <td>
                            <span className="font-bold text-slate-800">
                              {item.patient.firstName} {item.patient.lastName}
                            </span>
                          </td>
                          <td>
                            <code className="text-xs text-slate-600 font-mono">{item.patient.uhid}</code>
                          </td>
                          <td className="text-sm text-slate-600 font-mono">{item.patient.phone}</td>
                          <td className="text-sm text-slate-600 font-semibold">{item.patient.gender}</td>
                          <td>
                            <span
                              className={`status-badge ${
                                item.status === 'IN_PROGRESS'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : item.status === 'CHECKED_IN'
                                  ? 'bg-green-50 text-green-700 border-green-200 font-bold'
                                  : 'bg-slate-100 text-slate-500'
                              }`}
                            >
                              {item.status}
                            </span>
                          </td>
                          <td>
                            {item.status === 'CHECKED_IN' && (
                              <button
                                onClick={() => handleStartConsultation(item.id)}
                                disabled={startConsultationMutation.isPending}
                                className="btn btn-primary btn-sm px-3 py-1 font-bold text-xs"
                              >
                                Start Consultation
                              </button>
                            )}
                            {item.status === 'IN_PROGRESS' && (
                              <button
                                onClick={() => handleStartConsultation(item.id)}
                                className="btn btn-outline btn-sm px-3 py-1 font-bold border-amber-300 text-amber-700 hover:bg-amber-50 text-xs"
                              >
                                Resume Workspace
                              </button>
                            )}
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
      )}
    </div>
  );
}
