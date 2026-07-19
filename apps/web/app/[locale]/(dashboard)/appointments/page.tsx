'use client';

import { useTranslations } from 'next-intl';
import { useRouter, useParams } from 'next/navigation';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAuthenticatedClient, gql } from '@/lib/graphql-client';

const APPOINTMENTS_QUERY = gql`
  query MyAppointments($patientId: ID, $status: String, $page: Int, $limit: Int) {
    myAppointments(patientId: $patientId, status: $status, page: $page, limit: $limit) {
      items {
        id
        type
        status
        scheduledDate
        slotStartTime
        tokenNumber
        patient {
          id
          uhid
          firstName
          lastName
          phone
        }
        doctor {
          id
          user {
            firstName
            lastName
          }
          department {
            name
            nameBn
          }
        }
        queueToken {
          id
          displayLabel
          estimatedWait
        }
      }
      total
      page
      limit
    }
  }
`;

const CHECKIN_MUTATION = gql`
  mutation CheckInPatient($appointmentId: ID!) {
    checkInPatient(appointmentId: $appointmentId) {
      id
      status
    }
  }
`;

const CANCEL_MUTATION = gql`
  mutation CancelAppointment($input: CancelInput!) {
    cancelAppointment(input: $input) {
      id
      status
    }
  }
`;

export default function AppointmentListPage() {
  const commonT = useTranslations('common');
  const router = useRouter();
  const params = useParams();
  const locale = (params.locale as string) || 'en';
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const client = getAuthenticatedClient();

  // Query appointments
  const { data: appointmentsData, isLoading } = useQuery({
    queryKey: ['appointments', statusFilter, page],
    queryFn: async () => {
      const res: any = await client.request(APPOINTMENTS_QUERY, {
        status: statusFilter || undefined,
        page,
        limit: 10,
      });
      return res.myAppointments;
    },
  });

  // Checkin mutation
  const checkinMutation = useMutation({
    mutationFn: async (appointmentId: string) => {
      return client.request(CHECKIN_MUTATION, { appointmentId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      alert('Patient checked-in successfully.');
    },
  });

  // Cancel mutation
  const cancelMutation = useMutation({
    mutationFn: async (appointmentId: string) => {
      return client.request(CANCEL_MUTATION, {
        input: { appointmentId, reason: 'Patient requested cancellation' },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      alert('Appointment cancelled.');
    },
  });

  const totalPages = appointmentsData ? Math.ceil(appointmentsData.total / 10) : 1;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="patient-list-container">
      {/* Header */}
      <div className="settings-header">
        <div>
          <h1 className="settings-title">Appointments Directory</h1>
          <p className="settings-subtitle">Search outpatient consultation history and schedule status</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => router.push(`/${locale}/appointments/queue`)} className="btn btn-outline">
            📋 Active Queue Board
          </button>
          <button onClick={() => router.push(`/${locale}/appointments/new`)} className="btn btn-primary">
            + Book Appointment
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-card card mb-4">
        <div className="card-body">
          <div className="w-full md:w-1/3">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="form-input w-full"
            >
              <option value="">All Statuses</option>
              <option value="BOOKED">Booked</option>
              <option value="CHECKED_IN">Checked In</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="NO_SHOW">No Show</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid Table */}
      <div className="card table-card">
        <div className="card-body p-0">
          {isLoading ? (
            <div className="p-6 text-center text-slate-500">Loading appointments database...</div>
          ) : !appointmentsData?.items?.length ? (
            <div className="p-6 text-center text-slate-500">{commonT('noData')}</div>
          ) : (
            <div className="table-responsive">
              <table className="settings-table w-full">
                <thead>
                  <tr>
                    <th>Token</th>
                    <th>Date/Time</th>
                    <th>Patient Name</th>
                    <th>UHID</th>
                    <th>Consulting Doctor</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>{commonT('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {appointmentsData.items.map((a: any) => (
                    <tr key={a.id} className="hover:bg-slate-50 transition">
                      <td>
                        <span className="uhid-code font-bold font-mono">
                          {a.queueToken?.displayLabel || `T-${a.tokenNumber}`}
                        </span>
                      </td>
                      <td>
                        <span className="font-semibold text-slate-800 text-sm">{formatDate(a.scheduledDate)}</span>
                        <div className="text-xs text-slate-500 font-mono">{a.slotStartTime || 'Walk-in'}</div>
                      </td>
                      <td>
                        <span className="font-semibold text-slate-800">
                          {a.patient.firstName} {a.patient.lastName}
                        </span>
                        <div className="text-xs text-slate-500">{a.patient.phone}</div>
                      </td>
                      <td>
                        <code className="text-xs text-slate-600 font-mono">{a.patient.uhid}</code>
                      </td>
                      <td>
                        <span className="font-medium text-slate-800 text-sm">
                          Dr. {a.doctor.user.firstName} {a.doctor.user.lastName}
                        </span>
                        <div className="text-xs text-slate-500">
                          {locale === 'bn' ? a.doctor.department.nameBn || a.doctor.department.name : a.doctor.department.name}
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-outline text-xs">{a.type}</span>
                      </td>
                      <td>
                        <span
                          className={`status-badge ${
                            a.status === 'COMPLETED'
                              ? 'status-active'
                              : a.status === 'CANCELLED' || a.status === 'NO_SHOW'
                              ? 'status-inactive'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}
                        >
                          {a.status}
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-2">
                          {a.status === 'BOOKED' && (
                            <>
                              <button
                                onClick={() => checkinMutation.mutate(a.id)}
                                className="btn btn-outline btn-sm text-xs px-2 py-1 border-brand-blue text-brand-blue"
                              >
                                Check-In
                              </button>
                              <button
                                onClick={() => cancelMutation.mutate(a.id)}
                                className="btn btn-outline btn-sm text-xs px-2 py-1 text-red-600 border-red-200"
                              >
                                Cancel
                              </button>
                            </>
                          )}
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

      {/* Pagination */}
      {appointmentsData && appointmentsData.total > 10 && (
        <div className="flex justify-between items-center mt-4">
          <span className="text-sm text-slate-500">
            Showing {(page - 1) * 10 + 1} to {Math.min(page * 10, appointmentsData.total)} of {appointmentsData.total} entries
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="btn btn-outline btn-sm"
            >
              Previous
            </button>
            <span className="self-center text-sm font-medium">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
              className="btn btn-outline btn-sm"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
