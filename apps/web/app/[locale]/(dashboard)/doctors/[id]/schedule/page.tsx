'use client';

import { useTranslations } from 'next-intl';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAuthenticatedClient, gql } from '@/lib/graphql-client';
import { useState } from 'react';

const DOCTOR_SCHEDULES_QUERY = gql`
  query DoctorSchedules($id: ID!) {
    doctor(id: $id) {
      id
      user {
        id
        firstName
        lastName
      }
      department {
        id
        name
      }
      schedules {
        id
        dayOfWeek
        startTime
        endTime
        slotDurationMin
        maxPatients
      }
    }
  }
`;

const UPDATE_SCHEDULE_MUTATION = gql`
  mutation UpdateSchedule($id: ID!, $slots: [ScheduleSlotInput!]!) {
    updateSchedule(id: $id, slots: $slots) {
      id
      dayOfWeek
      startTime
      endTime
      slotDurationMin
      maxPatients
    }
  }
`;

const DAYS = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

export default function DoctorSchedulePage() {
  const commonT = useTranslations('common');
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const locale = (params.locale as string) || 'en';
  const queryClient = useQueryClient();

  const [slotsList, setSlotsList] = useState<any[]>([]);
  const [dayOfWeek, setDayOfWeek] = useState(0);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('13:00');
  const [slotDurationMin, setSlotDurationMin] = useState(15);
  const [maxPatients, setMaxPatients] = useState(16);
  const [errorMsg, setErrorMsg] = useState('');

  const client = getAuthenticatedClient();

  // Fetch current schedule
  const { data: doctor, isLoading } = useQuery({
    queryKey: ['doctorSchedule', id],
    queryFn: async () => {
      const res: any = await client.request(DOCTOR_SCHEDULES_QUERY, { id });
      const doc = res.doctor;
      // Initialize slotsList state with current slots
      const initialSlots = doc.schedules.map((s: any) => ({
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime,
        slotDurationMin: s.slotDurationMin,
        maxPatients: s.maxPatients,
      }));
      setSlotsList(initialSlots);
      return doc;
    },
  });

  // Update Schedule Mutation
  const updateScheduleMutation = useMutation({
    mutationFn: async (slots: any[]) => {
      return client.request(UPDATE_SCHEDULE_MUTATION, { id, slots });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctorSchedule', id] });
      queryClient.invalidateQueries({ queryKey: ['doctor', id] });
      alert('Schedules updated successfully!');
      router.push(`/${locale}/doctors/${id}`);
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Failed to update schedule slots.');
    },
  });

  const handleAddSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startTime || !endTime) {
      setErrorMsg('Please specify start and end times.');
      return;
    }

    // Basic overlap check
    const hasOverlap = slotsList.some(
      (s) =>
        s.dayOfWeek === dayOfWeek &&
        ((startTime >= s.startTime && startTime < s.endTime) ||
          (endTime > s.startTime && endTime <= s.endTime) ||
          (startTime <= s.startTime && endTime >= s.endTime)),
    );

    if (hasOverlap) {
      setErrorMsg('This slot overlaps with an existing schedule for the same day.');
      return;
    }

    const newSlot = {
      dayOfWeek,
      startTime,
      endTime,
      slotDurationMin: Number(slotDurationMin),
      maxPatients: Number(maxPatients),
    };

    setSlotsList((prev) => [...prev, newSlot].sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime)));
    setErrorMsg('');
  };

  const handleRemoveSlot = (indexToRemove: number) => {
    setSlotsList((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSave = () => {
    setErrorMsg('');
    const formattedSlots = slotsList.map((s) => ({
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      endTime: s.endTime,
      slotDurationMin: s.slotDurationMin,
      maxPatients: s.maxPatients,
    }));
    updateScheduleMutation.mutate(formattedSlots);
  };

  if (isLoading) {
    return <div className="p-6 text-center text-slate-500">Loading doctor schedule editor...</div>;
  }

  if (!doctor) {
    return <div className="p-6 text-center text-red-500">Doctor not found.</div>;
  }

  return (
    <div className="patient-profile-container">
      {/* Back link */}
      <button onClick={() => router.push(`/${locale}/doctors/${id}`)} className="btn btn-outline btn-sm mb-4">
        ← Back to Doctor Profile
      </button>

      <div className="settings-header">
        <div>
          <h1 className="settings-title">Manage Schedule: Dr. {doctor.user.firstName} {doctor.user.lastName}</h1>
          <p className="settings-subtitle">Setup weekly recurring clinic consultation hours</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
        {/* Add Slot Form */}
        <div className="lg:col-span-1">
          <div className="card">
            <div className="card-body">
              <h2 className="text-lg font-semibold text-slate-900 border-b pb-2 mb-4">Add Schedule Slot</h2>

              {errorMsg && (
                <div className="p-3 bg-red-50 text-red-700 rounded text-sm mb-4 border border-red-200">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleAddSlot} className="space-y-4">
                <div>
                  <label className="form-label text-sm font-medium mb-1 block">Day of Week</label>
                  <select
                    value={dayOfWeek}
                    onChange={(e) => setDayOfWeek(parseInt(e.target.value, 10))}
                    className="form-input w-full"
                  >
                    {DAYS.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label text-sm font-medium mb-1 block">Start Time</label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      required
                      className="form-input w-full"
                    />
                  </div>
                  <div>
                    <label className="form-label text-sm font-medium mb-1 block">End Time</label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      required
                      className="form-input w-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label text-sm font-medium mb-1 block">Slot (Mins)</label>
                    <input
                      type="number"
                      value={slotDurationMin}
                      onChange={(e) => setSlotDurationMin(parseInt(e.target.value, 10))}
                      min={5}
                      max={120}
                      className="form-input w-full"
                    />
                  </div>
                  <div>
                    <label className="form-label text-sm font-medium mb-1 block">Max Patients</label>
                    <input
                      type="number"
                      value={maxPatients}
                      onChange={(e) => setMaxPatients(parseInt(e.target.value, 10))}
                      min={1}
                      className="form-input w-full"
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary w-full mt-2">
                  + Add to List
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Slots List and Submit */}
        <div className="lg:col-span-2">
          <div className="card h-full flex flex-col justify-between">
            <div className="card-body">
              <h2 className="text-lg font-semibold text-slate-900 border-b pb-2 mb-4">Pending Schedule Slots</h2>

              {slotsList.length === 0 ? (
                <div className="p-6 text-center text-slate-400">
                  No schedule slots added yet. Add slots on the left panel to populate weekly hours.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="settings-table w-full">
                    <thead>
                      <tr>
                        <th>Day</th>
                        <th>Time Frame</th>
                        <th>Slot Duration</th>
                        <th>Max Capacity</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {slotsList.map((slot, index) => (
                        <tr key={index} className="hover:bg-slate-50">
                          <td className="font-semibold text-slate-800">
                            {DAYS.find((d) => d.value === slot.dayOfWeek)?.label}
                          </td>
                          <td className="font-mono text-sm text-slate-600">
                            {slot.startTime} - {slot.endTime}
                          </td>
                          <td>{slot.slotDurationMin} Mins</td>
                          <td>{slot.maxPatients} Patients</td>
                          <td>
                            <button
                              type="button"
                              onClick={() => handleRemoveSlot(index)}
                              className="text-xs font-semibold text-red-500 hover:text-red-700"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {slotsList.length > 0 && (
              <div className="border-t p-4 flex justify-end gap-2 bg-slate-50">
                <button
                  type="button"
                  onClick={() => setSlotsList([])}
                  className="btn btn-outline border-red-200 text-red-500 hover:bg-red-50"
                >
                  Clear All
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={updateScheduleMutation.isPending}
                  className="btn btn-primary"
                >
                  {updateScheduleMutation.isPending ? 'Saving...' : 'Save Schedule'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
