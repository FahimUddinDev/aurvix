'use client';

import { useTranslations } from 'next-intl';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAuthenticatedClient, gql } from '@/lib/graphql-client';

const DEPARTMENTS_QUERY = gql`
  query Departments {
    departments {
      id
      name
      nameBn
    }
  }
`;

const DOCTORS_QUERY = gql`
  query Doctors($filters: DoctorFiltersInput) {
    doctors(filters: $filters) {
      items {
        id
        user {
          id
          firstName
          lastName
        }
        specialization
      }
    }
  }
`;

const PATIENTS_QUERY = gql`
  query Patients($search: String) {
    patients(search: $search, page: 1, limit: 10) {
      items {
        id
        uhid
        firstName
        lastName
        phone
      }
    }
  }
`;

const AVAILABLE_SLOTS_QUERY = gql`
  query AvailableSlots($doctorId: ID!, $date: String!) {
    availableSlots(doctorId: $doctorId, date: $date) {
      startTime
      endTime
      isAvailable
    }
  }
`;

const CREATE_APPOINTMENT_MUTATION = gql`
  mutation CreateAppointment($input: CreateAppointmentInput!) {
    createAppointment(input: $input) {
      id
      tokenNumber
      scheduledDate
      slotStartTime
      doctor {
        user {
          firstName
          lastName
        }
      }
    }
  }
`;

export default function BookAppointmentPage() {
  const commonT = useTranslations('common');
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = (params.locale as string) || 'en';
  const queryClient = useQueryClient();

  const preselectedPatientId = searchParams.get('patientId') || '';

  // Form State
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState(preselectedPatientId);
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [scheduledDate, setScheduledDate] = useState<string>(new Date().toISOString().split('T')[0] || '');
  const [selectedSlotTime, setSelectedSlotTime] = useState('');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [appointmentType, setAppointmentType] = useState('SCHEDULED');
  const [errorMsg, setErrorMsg] = useState('');

  const client = getAuthenticatedClient();

  // Queries
  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const res: any = await client.request(DEPARTMENTS_QUERY);
      return res.departments;
    },
  });

  const { data: doctors } = useQuery({
    queryKey: ['doctorsByDept', selectedDeptId],
    queryFn: async () => {
      const res: any = await client.request(DOCTORS_QUERY, {
        filters: { departmentId: selectedDeptId || undefined },
      });
      return res.doctors.items;
    },
    enabled: !!selectedDeptId,
  });

  const { data: patients } = useQuery({
    queryKey: ['patientsSearch', patientSearch],
    queryFn: async () => {
      const res: any = await client.request(PATIENTS_QUERY, {
        search: patientSearch || undefined,
      });
      return res.patients.items;
    },
    enabled: patientSearch.length > 2,
  });

  const { data: slots, isLoading: isSlotsLoading } = useQuery({
    queryKey: ['availableSlots', selectedDoctorId, scheduledDate],
    queryFn: async () => {
      const res: any = await client.request(AVAILABLE_SLOTS_QUERY, {
        doctorId: selectedDoctorId,
        date: scheduledDate,
      });
      return res.availableSlots;
    },
    enabled: !!selectedDoctorId && !!scheduledDate,
  });

  // Pre-load patient details if query param exists
  useEffect(() => {
    if (preselectedPatientId) {
      setSelectedPatientId(preselectedPatientId);
    }
  }, [preselectedPatientId]);

  // Create Appointment Mutation
  const createAppointmentMutation = useMutation({
    mutationFn: async (input: any) => {
      return client.request(CREATE_APPOINTMENT_MUTATION, { input });
    },
    onSuccess: (data: any) => {
      alert(`Appointment booked successfully! Token: T-${data.createAppointment.tokenNumber}`);
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      router.push(`/${locale}/appointments`);
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Failed to book appointment.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId || !selectedDoctorId || !selectedDeptId || !selectedSlotTime) {
      setErrorMsg('Please select a patient, doctor, date, and available slot.');
      return;
    }

    createAppointmentMutation.mutate({
      patientId: selectedPatientId,
      doctorId: selectedDoctorId,
      departmentId: selectedDeptId,
      scheduledDate: new Date(scheduledDate),
      slotStartTime: selectedSlotTime,
      chiefComplaint: chiefComplaint || undefined,
      type: appointmentType,
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="settings-header">
        <div>
          <h1 className="settings-title">Book Outpatient (OPD) Appointment</h1>
          <p className="settings-subtitle">Schedule a clinic slot and issue queue tokens</p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 text-red-700 rounded border border-red-200 text-sm">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Patient Selection */}
        <div className="card">
          <div className="card-body space-y-4">
            <h2 className="text-lg font-semibold text-slate-900 border-b pb-2">1. Select Patient</h2>

            {preselectedPatientId ? (
              <div className="p-3 bg-slate-50 border rounded flex justify-between items-center">
                <div>
                  <span className="text-sm font-medium block text-slate-700">Pre-selected Patient ID</span>
                  <code className="text-xs text-slate-600 font-mono">{preselectedPatientId}</code>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPatientId('')}
                  className="text-xs font-semibold text-red-500 hover:underline"
                >
                  Change Patient
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="form-label text-sm font-medium mb-1 block">Search Patient (Name, Phone or UHID)</label>
                  <input
                    type="text"
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                    placeholder="Type at least 3 characters to search..."
                    className="form-input w-full"
                  />
                </div>

                {patients && patients.length > 0 && (
                  <div className="border rounded divide-y max-h-48 overflow-y-auto">
                    {patients.map((p: any) => (
                      <div
                        key={p.id}
                        onClick={() => {
                          setSelectedPatientId(p.id);
                          setPatientSearch(`${p.firstName} ${p.lastName} (${p.uhid})`);
                        }}
                        className={`p-3 cursor-pointer hover:bg-slate-50 flex justify-between items-center text-sm ${
                          selectedPatientId === p.id ? 'bg-blue-50/50' : ''
                        }`}
                      >
                        <div>
                          <span className="font-semibold text-slate-800">
                            {p.firstName} {p.lastName}
                          </span>
                          <span className="text-xs text-slate-500 ml-2">UHID: {p.uhid}</span>
                        </div>
                        <span className="text-xs text-slate-500 font-mono">{p.phone}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Step 2: Department and Doctor */}
        <div className="card">
          <div className="card-body">
            <h2 className="text-lg font-semibold text-slate-900 border-b pb-2 mb-4">2. Select Clinic & Doctor</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label text-sm font-medium mb-1 block">Department *</label>
                <select
                  value={selectedDeptId}
                  onChange={(e) => {
                    setSelectedDeptId(e.target.value);
                    setSelectedDoctorId('');
                    setSelectedSlotTime('');
                  }}
                  required
                  className="form-input w-full"
                >
                  <option value="">Select Department...</option>
                  {departments?.map((d: any) => (
                    <option key={d.id} value={d.id}>
                      {locale === 'bn' ? d.nameBn || d.name : d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label text-sm font-medium mb-1 block">Consulting Doctor *</label>
                <select
                  value={selectedDoctorId}
                  onChange={(e) => {
                    setSelectedDoctorId(e.target.value);
                    setSelectedSlotTime('');
                  }}
                  required
                  disabled={!selectedDeptId}
                  className="form-input w-full"
                >
                  <option value="">Select Doctor...</option>
                  {doctors?.map((doc: any) => (
                    <option key={doc.id} value={doc.id}>
                      Dr. {doc.user.firstName} {doc.user.lastName} ({doc.specialization || 'Consultant'})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Step 3: Date and Slot */}
        <div className="card">
          <div className="card-body space-y-4">
            <h2 className="text-lg font-semibold text-slate-900 border-b pb-2">3. Timing Slot</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label text-sm font-medium mb-1 block">Appointment Date *</label>
                <input
                  type="date"
                  value={scheduledDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => {
                    setScheduledDate(e.target.value);
                    setSelectedSlotTime('');
                  }}
                  required
                  className="form-input w-full"
                />
              </div>

              <div>
                <label className="form-label text-sm font-medium mb-1 block">Booking Type *</label>
                <select
                  value={appointmentType}
                  onChange={(e) => setAppointmentType(e.target.value)}
                  className="form-input w-full"
                >
                  <option value="SCHEDULED">Scheduled (OPD)</option>
                  <option value="WALK_IN">Walk-In / Spot Booking</option>
                  <option value="FOLLOW_UP">Follow-Up Consultation</option>
                  <option value="EMERGENCY">Emergency triage</option>
                </select>
              </div>
            </div>

            {selectedDoctorId && (
              <div className="mt-4 space-y-2">
                <span className="form-label text-sm font-medium block">Available Slots</span>
                {isSlotsLoading ? (
                  <div className="text-sm text-slate-500 font-medium">Checking doctor schedules...</div>
                ) : !slots || slots.length === 0 ? (
                  <div className="p-3 bg-amber-50 text-amber-800 rounded text-sm border border-amber-200 font-medium">
                    No active clinic schedule found for this doctor on this day.
                  </div>
                ) : (
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {slots.map((s: any) => (
                      <button
                        key={s.startTime}
                        type="button"
                        disabled={!s.isAvailable}
                        onClick={() => setSelectedSlotTime(s.startTime)}
                        className={`p-2 border text-xs font-mono rounded transition text-center ${
                          !s.isAvailable
                            ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed line-through'
                            : selectedSlotTime === s.startTime
                            ? 'bg-brand-blue text-white border-brand-blue font-bold shadow'
                            : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
                        }`}
                      >
                        {s.startTime}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Step 4: Medical Details */}
        <div className="card">
          <div className="card-body">
            <h2 className="text-lg font-semibold text-slate-900 border-b pb-2 mb-4">4. Chief Complaint</h2>
            <div>
              <textarea
                value={chiefComplaint}
                onChange={(e) => setChiefComplaint(e.target.value)}
                rows={3}
                placeholder="Brief symptoms or consultation details (e.g. routine checkup, back pain, chest distress)..."
                className="form-input w-full p-2 border rounded"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => router.back()} className="btn btn-outline">
            {commonT('cancel')}
          </button>
          <button
            type="submit"
            disabled={createAppointmentMutation.isPending || !selectedSlotTime}
            className="btn btn-primary px-6 font-bold"
          >
            {createAppointmentMutation.isPending ? 'Confirming...' : 'Confirm Appointment'}
          </button>
        </div>
      </form>
    </div>
  );
}
