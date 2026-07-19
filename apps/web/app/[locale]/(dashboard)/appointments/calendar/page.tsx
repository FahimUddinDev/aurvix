'use client';

import { useTranslations } from 'next-intl';
import { useRouter, useParams } from 'next/navigation';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAuthenticatedClient, gql } from '@/lib/graphql-client';

const CALENDAR_APPOINTMENTS_QUERY = gql`
  query CalendarAppointments {
    myAppointments(page: 1, limit: 100) {
      items {
        id
        status
        scheduledDate
        slotStartTime
        tokenNumber
        patient {
          firstName
          lastName
        }
        doctor {
          user {
            firstName
            lastName
          }
        }
      }
    }
  }
`;

export default function AppointmentCalendarPage() {
  const commonT = useTranslations('common');
  const router = useRouter();
  const params = useParams();
  const locale = (params.locale as string) || 'en';

  const client = getAuthenticatedClient();

  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth()); // 0-11
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(
    new Date().toISOString().split('T')[0]!,
  );

  // Fetch appointments for calendar
  const { data: appointments } = useQuery({
    queryKey: ['calendarAppointments'],
    queryFn: async () => {
      const res: any = await client.request(CALENDAR_APPOINTMENTS_QUERY);
      return res.myAppointments.items;
    },
  });

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay(); // 0 (Sunday) to 6 (Saturday)
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  // Helper to format date key: YYYY-MM-DD
  const formatDateKey = (day: number) => {
    const mm = String(currentMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${currentYear}-${mm}-${dd}`;
  };

  // Filter appointments for a specific day
  const getAppointmentsForDate = (dateKey: string) => {
    if (!appointments) return [];
    return appointments.filter((a: any) => a.scheduledDate.startsWith(dateKey));
  };

  const calendarDays = [];
  // Add empty slots for offset first day of month
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }
  // Add actual days
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  const selectedDayAppointments = selectedDateStr ? getAppointmentsForDate(selectedDateStr) : [];

  return (
    <div className="patient-list-container">
      {/* Header */}
      <div className="settings-header">
        <div>
          <h1 className="settings-title">Clinic Schedule Calendar</h1>
          <p className="settings-subtitle">Monthly overview of doctor consultations and bookings</p>
        </div>
        <button onClick={() => router.push(`/${locale}/appointments`)} className="btn btn-outline">
          ← Table List
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
        {/* Monthly Grid */}
        <div className="lg:col-span-2 card">
          <div className="card-body">
            {/* Nav */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800">
                {monthNames[currentMonth]} {currentYear}
              </h2>
              <div className="flex gap-2">
                <button onClick={prevMonth} className="btn btn-outline btn-sm">
                  ◀ Previous
                </button>
                <button onClick={nextMonth} className="btn btn-outline btn-sm">
                  Next ▶
                </button>
              </div>
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-slate-400 uppercase mb-2">
              <div>Sun</div>
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((day, idx) => {
                if (day === null) {
                  return <div key={`empty-${idx}`} className="h-16 bg-slate-50/50 rounded-lg"></div>;
                }

                const dateKey = formatDateKey(day);
                const dayApps = getAppointmentsForDate(dateKey);
                const isSelected = selectedDateStr === dateKey;

                return (
                  <div
                    key={dateKey}
                    onClick={() => setSelectedDateStr(dateKey)}
                    className={`h-16 border p-1 rounded-lg cursor-pointer hover:bg-blue-50/50 transition flex flex-col justify-between items-start ${
                      isSelected ? 'border-brand-blue bg-blue-50/30' : 'border-slate-100'
                    }`}
                  >
                    <span className={`text-xs font-bold ${isSelected ? 'text-brand-blue font-extrabold' : 'text-slate-700'}`}>
                      {day}
                    </span>
                    {dayApps.length > 0 && (
                      <span className="text-[10px] bg-brand-blue-pale text-brand-blue font-bold px-1.5 py-0.5 rounded-full">
                        {dayApps.length} Booked
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Selected Date Appointments list */}
        <div className="lg:col-span-1">
          <div className="card h-full">
            <div className="card-body">
              <h2 className="text-lg font-bold text-slate-900 border-b pb-2 mb-4">
                Schedule for {selectedDateStr ? new Date(selectedDateStr).toLocaleDateString() : 'Select Date'}
              </h2>

              {selectedDayAppointments.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-sm">
                  No appointments booked for this date.
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                  {selectedDayAppointments.map((a: any) => (
                    <div key={a.id} className="p-3 border rounded-lg bg-slate-50 flex flex-col gap-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-brand-blue font-mono">T-{a.tokenNumber}</span>
                        <span className="font-mono text-slate-500">{a.slotStartTime || 'Walk-in'}</span>
                      </div>
                      <h4 className="font-bold text-slate-800 text-sm">
                        {a.patient.firstName} {a.patient.lastName}
                      </h4>
                      <p className="text-xs text-slate-500">
                        Consultant: Dr. {a.doctor.user.firstName} {a.doctor.user.lastName}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
