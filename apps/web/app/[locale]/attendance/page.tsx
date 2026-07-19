'use client';

import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAuthenticatedClient, gql } from '@/lib/graphql-client';

const ATTENDANCE_LOGS_QUERY = gql`
  query GetAttendanceLogs($search: String) {
    attendanceLogs(search: $search) {
      id
      type
      timestamp
      method
      ipAddress
      employee {
        firstName
        lastName
        employeeCode
      }
    }
  }
`;

const CLOCK_IN_MUTATION = gql`
  mutation ClockIn($ipAddress: String, $method: String) {
    clockIn(ipAddress: $ipAddress, method: $method) {
      id
      type
      timestamp
    }
  }
`;

const CLOCK_OUT_MUTATION = gql`
  mutation ClockOut($ipAddress: String, $method: String) {
    clockOut(ipAddress: $ipAddress, method: $method) {
      id
      type
      timestamp
    }
  }
`;

export default function AttendanceClockPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params.locale as string) || 'en';
  const queryClient = useQueryClient();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [search, setSearch] = useState('');

  const client = getAuthenticatedClient();

  // Tick clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Query logs
  const { data: logs, isLoading } = useQuery({
    queryKey: ['attendanceLogsList', search],
    queryFn: async () => {
      const res: any = await client.request(ATTENDANCE_LOGS_QUERY, {
        search: search || undefined,
      });
      return res.attendanceLogs;
    },
    refetchInterval: 10000,
  });

  // Mutations
  const clockInMutation = useMutation({
    mutationFn: async () => {
      return client.request(CLOCK_IN_MUTATION, {
        ipAddress: '192.168.10.45',
        method: 'MANUAL',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendanceLogsList'] });
      alert('Clock In registered successfully.');
    },
  });

  const clockOutMutation = useMutation({
    mutationFn: async () => {
      return client.request(CLOCK_OUT_MUTATION, {
        ipAddress: '192.168.10.45',
        method: 'MANUAL',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendanceLogsList'] });
      alert('Clock Out registered successfully.');
    },
  });

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString(locale === 'bn' ? 'bn-BD' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-800 font-sans grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Clock Widget */}
      <div className="space-y-6">
        <div className="card text-center p-8 bg-white border flex flex-col justify-between h-96">
          <div className="space-y-2">
            <span className="text-[10px] text-indigo-600 font-black uppercase tracking-wider bg-indigo-50 px-2 py-0.5 rounded">
              Dhaka Hospital Core Area
            </span>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight mt-3">
              {formatTime(currentTime)}
            </h1>
            <p className="text-xs text-slate-400 font-semibold">{formatDate(currentTime)}</p>
          </div>

          <div className="bg-slate-50 border p-3 rounded-lg text-xs space-y-1 text-left font-mono">
            <p><strong>Mock IP Address:</strong> <code>192.168.10.45</code></p>
            <p><strong>Status:</strong> Network coordinates verified (23.7561° N, 90.3769° E)</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => clockInMutation.mutate()}
              disabled={clockInMutation.isPending}
              className="btn btn-primary font-bold uppercase py-3"
            >
              {clockInMutation.isPending ? 'Clocking...' : 'Clock In'}
            </button>
            <button
              onClick={() => clockOutMutation.mutate()}
              disabled={clockOutMutation.isPending}
              className="btn btn-outline border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-bold uppercase py-3"
            >
              {clockOutMutation.isPending ? 'Clocking...' : 'Clock Out'}
            </button>
          </div>
        </div>

        <div className="flex gap-2 w-full">
          <button onClick={() => router.push(`/${locale}/leave`)} className="btn btn-outline w-1/2 text-xs font-bold">
            🌴 Apply for Leave
          </button>
          <button onClick={() => router.push(`/${locale}/leave/approvals`)} className="btn btn-outline w-1/2 text-xs font-bold">
            ✓ Leave approvals
          </button>
        </div>
      </div>

      {/* Logs queue */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex justify-between items-center border-b pb-4 bg-white p-4 rounded-xl shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center font-bold text-white text-lg">
              ⏱️
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-900">Hospital Timecard Sheet</h1>
              <p className="text-[10px] text-slate-400 font-black uppercase">Staff entry/exit registry</p>
            </div>
          </div>

          <input
            type="text"
            placeholder="Search employee name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input w-48 p-1.5 border rounded text-xs"
          />
        </div>

        <div className="card">
          <div className="card-body p-0">
            {isLoading ? (
              <div className="p-10 text-center text-slate-500 font-medium">Loading timecards...</div>
            ) : !logs || logs.length === 0 ? (
              <div className="p-10 text-center text-slate-400 font-medium">No clocking logs registered today.</div>
            ) : (
              <div className="table-responsive">
                <table className="settings-table w-full text-xs">
                  <thead>
                    <tr>
                      <th>Staff Name</th>
                      <th>Employee Code</th>
                      <th>Method</th>
                      <th>IP Location</th>
                      <th>Event Log</th>
                      <th>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log: any) => {
                      const isCheckIn = log.type === 'CHECK_IN';

                      return (
                        <tr key={log.id} className="hover:bg-slate-50 transition">
                          <td>
                            <span className="font-bold text-slate-800">
                              {log.employee?.firstName} {log.employee?.lastName}
                            </span>
                          </td>
                          <td>
                            <code className="text-xs text-slate-500 font-mono font-semibold">{log.employee?.employeeCode}</code>
                          </td>
                          <td>
                            <span className="badge badge-outline text-[9px]">{log.method}</span>
                          </td>
                          <td>
                            <code className="text-xs text-slate-400 font-mono">{log.ipAddress || '—'}</code>
                          </td>
                          <td>
                            <span
                              className={`status-badge font-bold uppercase ${
                                isCheckIn
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                              }`}
                            >
                              {log.type.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="font-mono text-slate-600">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
