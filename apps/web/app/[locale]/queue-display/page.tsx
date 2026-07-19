'use client';

import { useTranslations } from 'next-intl';
import { useParams, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAuthenticatedClient, gql } from '@/lib/graphql-client';

const DEPARTMENTS_QUERY = gql`
  query Departments {
    departments {
      id
      name
      nameBn
      code
    }
  }
`;

const DEPT_QUEUE_DISPLAY_QUERY = gql`
  query DeptQueueDisplay($departmentId: ID!) {
    myAppointments(page: 1, limit: 100) {
      items {
        id
        status
        tokenNumber
        scheduledDate
        departmentId
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
        queueToken {
          displayLabel
          estimatedWait
        }
      }
    }
  }
`;

export default function LoungeQueueDisplayPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = (params.locale as string) || 'en';

  const defaultDeptId = searchParams.get('departmentId') || '';
  const [selectedDeptId, setSelectedDeptId] = useState(defaultDeptId);

  const client = getAuthenticatedClient();

  // Query departments
  const { data: departments } = useQuery({
    queryKey: ['departmentsForTV'],
    queryFn: async () => {
      const res: any = await client.request(DEPARTMENTS_QUERY);
      return res.departments;
    },
  });

  // Query queue display data (active and next tokens) for chosen department
  const { data: appointments } = useQuery({
    queryKey: ['deptQueue', selectedDeptId],
    queryFn: async () => {
      const res: any = await client.request(DEPT_QUEUE_DISPLAY_QUERY, {
        departmentId: selectedDeptId,
      });
      return res.myAppointments.items;
    },
    enabled: !!selectedDeptId,
    refetchInterval: 3000, // Poll every 3 seconds for dynamic TV update simulation
  });

  const getFilteredTokens = () => {
    if (!appointments) return { active: [], next: [] };

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const todayApps = appointments.filter((a: any) => {
      const appDate = new Date(a.scheduledDate);
      return a.departmentId === selectedDeptId && appDate >= start && appDate <= end;
    });

    const active = todayApps.filter((a: any) => a.status === 'IN_PROGRESS');
    const next = todayApps.filter((a: any) => a.status === 'CHECKED_IN').slice(0, 5);

    return { active, next };
  };

  const { active, next } = getFilteredTokens();

  return (
    <div className="min-h-screen bg-[#070e1c] text-white flex flex-col font-sans p-6">
      {/* TV Header */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-blue rounded-full flex items-center justify-center font-bold text-white text-lg">
            ✚
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wider uppercase">Aurevix HMS</h1>
            <p className="text-xs text-slate-500 font-semibold uppercase">Lounge Display System</p>
          </div>
        </div>

        {/* Department Selector */}
        <div className="w-64">
          <select
            value={selectedDeptId}
            onChange={(e) => setSelectedDeptId(e.target.value)}
            className="bg-[#101b33] border border-slate-800 rounded p-2 text-sm text-slate-300 w-full focus:outline-none focus:border-brand-blue"
          >
            <option value="">Select Department TV...</option>
            {departments?.map((d: any) => (
              <option key={d.id} value={d.id}>
                {locale === 'bn' ? d.nameBn || d.name : d.name} ({d.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Standalone Dashboard */}
      {!selectedDeptId ? (
        <div className="flex-1 flex flex-col justify-center items-center text-slate-500">
          <svg className="w-16 h-16 mb-4 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a2 2 0 002-2V6a2 2 0 00-2-2H4a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-lg font-bold">Lounge TV Display Board</span>
          <p className="text-sm mt-1 text-slate-600">Please select a clinical department above to launch display mode.</p>
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* Active / Now Serving Panel */}
          <div className="bg-[#0f1b3d] rounded-2xl p-8 flex flex-col justify-between border border-slate-800/80 shadow-2xl">
            <div>
              <span className="text-xs font-bold text-slate-400 block uppercase tracking-widest mb-4">
                Now Consulting / এখন দেখাচ্ছেন
              </span>
              {active.length === 0 ? (
                <div className="py-24 text-center text-slate-500 font-bold text-xl uppercase tracking-wider">
                  No Active Tickets / কোনো সক্রিয় টিকিট নেই
                </div>
              ) : (
                <div className="space-y-6">
                  {active.map((act: any) => (
                    <div key={act.id} className="border-b border-slate-800/60 pb-6 flex justify-between items-start">
                      <div>
                        <div className="text-8xl font-mono font-black text-[#10b981] animate-pulse">
                          {act.queueToken?.displayLabel || `T-${act.tokenNumber}`}
                        </div>
                        <h2 className="text-2xl font-bold mt-2">
                          Dr. {act.doctor.user.firstName} {act.doctor.user.lastName}
                        </h2>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-slate-500 font-bold uppercase block">Patient Name</span>
                        <div className="text-lg font-bold mt-1 text-slate-300">
                          {act.patient.firstName} {act.patient.lastName}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="text-xs text-slate-500 border-t border-slate-800/60 pt-4 flex justify-between">
              <span>Automatic updates enabled</span>
              <span>EST. Time averages 15 mins per slot</span>
            </div>
          </div>

          {/* Up Next Panel */}
          <div className="bg-[#0c1324] rounded-2xl p-8 border border-slate-900 shadow-2xl flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 block uppercase tracking-widest mb-6">
                Up Next / পরবর্তী টিকিট
              </span>

              {next.length === 0 ? (
                <div className="py-20 text-center text-slate-600 font-medium">
                  Lounge is currently empty.
                </div>
              ) : (
                <div className="space-y-4">
                  {next.map((n: any, idx: number) => (
                    <div
                      key={n.id}
                      className="p-4 bg-[#101b33]/40 border border-slate-800/50 rounded-xl flex justify-between items-center"
                    >
                      <div className="flex gap-4 items-center">
                        <span className="text-2xl font-black font-mono text-brand-blue bg-blue-50/10 px-3 py-1 rounded">
                          {n.queueToken?.displayLabel || `T-${n.tokenNumber}`}
                        </span>
                        <div>
                          <h4 className="font-bold text-slate-200">
                            Dr. {n.doctor.user.firstName} {n.doctor.user.lastName}
                          </h4>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs text-slate-500 font-semibold block uppercase">Position</span>
                        <span className="text-sm font-bold text-[#f59e0b]">#{idx + 1} Waiting</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="text-xs text-slate-600 text-center border-t border-slate-800/20 pt-4">
              Please proceed to your assigned clinic room when your token flashes green.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
