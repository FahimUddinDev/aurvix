'use client';

import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAuthenticatedClient, gql } from '@/lib/graphql-client';

const WARDS_QUERY = gql`
  query GetWards {
    wards {
      id
      name
      floor
      dailyRate
      type
      beds {
        id
        bedNumber
        status
      }
    }
  }
`;

const MARK_BED_CLEAN_MUTATION = gql`
  mutation MarkBedClean($bedId: ID!) {
    markBedAvailable(bedId: $bedId) {
      id
      status
    }
  }
`;

export default function WardsBoardPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params.locale as string) || 'en';
  const queryClient = useQueryClient();

  const client = getAuthenticatedClient();

  // Query wards
  const { data: wards, isLoading } = useQuery({
    queryKey: ['wardsBoard'],
    queryFn: async () => {
      const res: any = await client.request(WARDS_QUERY);
      return res.wards;
    },
    refetchInterval: 8000,
  });

  // Clean bed mutation
  const cleanMutation = useMutation({
    mutationFn: async (bedId: string) => {
      return client.request(MARK_BED_CLEAN_MUTATION, { bedId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wardsBoard'] });
      alert('Bed has been cleaned and is now available.');
    },
  });

  const getBedStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100/50';
      case 'OCCUPIED':
        return 'bg-indigo-50 border-indigo-200 text-indigo-700 cursor-not-allowed';
      case 'UNDER_CLEANING':
        return 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100/50';
      default:
        return 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-800 font-sans space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center border-b pb-4 bg-white p-4 rounded-xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center font-bold text-white text-lg">
            🏥
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Inpatient Wards Board</h1>
            <p className="text-xs text-slate-500 font-semibold uppercase">Real-time room occupancy & cleaning logs</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={() => router.push(`/${locale}/wards/admissions`)} className="btn btn-primary btn-sm text-xs font-bold font-mono">
            📋 Inpatient admissions
          </button>
          <button onClick={() => router.push(`/${locale}/wards/admit`)} className="btn btn-outline btn-sm text-xs font-bold">
            ➕ Admit Patient
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="p-10 text-center text-slate-500 font-semibold">Loading wards map...</div>
      ) : !wards || wards.length === 0 ? (
        <div className="p-10 text-center text-slate-400 font-medium">No wards currently configured in database.</div>
      ) : (
        <div className="space-y-6">
          {wards.map((ward: any) => (
            <div key={ward.id} className="card bg-white border rounded-xl shadow-sm overflow-hidden">
              {/* Ward Banner Header */}
              <div className="bg-slate-50 border-b p-4 flex justify-between items-center">
                <div>
                  <h3 className="text-base font-black text-slate-900">{ward.name}</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    Type: {ward.type} | Floor: {ward.floor || '—'}
                  </p>
                </div>
                <span className="text-sm font-black text-indigo-700 font-mono">
                  {Number(ward.dailyRate).toFixed(2)} ৳ / Day
                </span>
              </div>

              {/* Beds Grid */}
              <div className="p-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                  {ward.beds.map((bed: any) => {
                    const isCleaning = bed.status === 'UNDER_CLEANING';
                    const isAvailable = bed.status === 'AVAILABLE';

                    return (
                      <div
                        key={bed.id}
                        onClick={() => {
                          if (isAvailable) {
                            router.push(`/${locale}/wards/admit?bedId=${bed.id}`);
                          }
                        }}
                        className={`p-3 border-2 rounded-xl text-center flex flex-col justify-between h-24 transition cursor-pointer select-none ${getBedStatusColor(
                          bed.status,
                        )}`}
                      >
                        <span className="text-xs font-bold font-mono tracking-wider block">Bed {bed.bedNumber}</span>

                        <div className="space-y-1">
                          <span className="text-[9px] font-black tracking-wider uppercase block">
                            {bed.status.replace('_', ' ')}
                          </span>

                          {isCleaning && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                cleanMutation.mutate(bed.id);
                              }}
                              className="px-2 py-0.5 bg-amber-500 text-white font-bold rounded text-[9px] hover:bg-amber-600 block mx-auto w-full transition"
                            >
                              Clean
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
