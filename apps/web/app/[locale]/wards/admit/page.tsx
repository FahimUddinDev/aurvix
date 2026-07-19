'use client';

import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAuthenticatedClient, gql } from '@/lib/graphql-client';

const PATIENTS_LOOKUP_QUERY = gql`
  query GetPatientsLookup($search: String) {
    patients(search: $search) {
      id
      uhid
      firstName
      lastName
    }
  }
`;

const WARDS_LOOKUP_QUERY = gql`
  query GetWardsLookup {
    wards {
      id
      name
      beds {
        id
        bedNumber
        status
      }
    }
  }
`;

const ADMIT_MUTATION = gql`
  mutation AdmitPatient($input: AdmitPatientInput!) {
    admitPatient(input: $input) {
      id
      status
    }
  }
`;

export default function AdmitPatientPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = (params.locale as string) || 'en';
  const queryClient = useQueryClient();

  const preselectedBedId = searchParams.get('bedId') || '';

  const client = getAuthenticatedClient();

  // Search Patients States
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState('');

  // Selected Wards/Beds States
  const [selectedWardId, setSelectedWardId] = useState('');
  const [selectedBedId, setSelectedBedId] = useState(preselectedBedId);
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Queries
  const { data: patients, isLoading: patientsLoading } = useQuery({
    queryKey: ['patientsLookup', patientSearch],
    queryFn: async () => {
      if (!patientSearch) return [];
      const res: any = await client.request(PATIENTS_LOOKUP_QUERY, { search: patientSearch });
      return res.patients;
    },
    enabled: patientSearch.length > 1,
  });

  const { data: wards, isLoading: wardsLoading } = useQuery({
    queryKey: ['wardsLookup'],
    queryFn: async () => {
      const res: any = await client.request(WARDS_LOOKUP_QUERY);
      return res.wards;
    },
  });

  // Admit mutation
  const admitMutation = useMutation({
    mutationFn: async (input: any) => {
      return client.request(ADMIT_MUTATION, { input });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wardsBoard'] });
      queryClient.invalidateQueries({ queryKey: ['admissionsList'] });
      alert('Patient successfully admitted to ward bed room.');
      router.push(`/${locale}/wards`);
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Admissions check-in failed.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId || !selectedBedId) {
      setErrorMsg('Please select a patient and assign an available bed.');
      return;
    }

    admitMutation.mutate({
      patientId: selectedPatientId,
      bedId: selectedBedId,
      admissionNotes: notes || undefined,
    });
  };

  const activeWard = wards?.find((w: any) => w.id === selectedWardId);
  const availableBeds = activeWard?.beds.filter((b: any) => b.status === 'AVAILABLE') || [];

  return (
    <div className="max-w-md mx-auto p-4 space-y-6">
      <button onClick={() => router.push(`/${locale}/wards`)} className="btn btn-sm btn-outline mb-2">
        ← Back to Wards Board
      </button>

      <div className="settings-header">
        <div>
          <h1 className="settings-title">Admit Inpatient Patient</h1>
          <p className="settings-subtitle">Register hospitalization files and assign rooms</p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 text-red-700 text-xs rounded border border-red-200 font-bold">
          {errorMsg}
        </div>
      )}

      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Patient Search */}
            <div>
              <label className="form-label text-sm font-semibold mb-1 block">Search Patient (Name / UHID)</label>
              <input
                type="text"
                placeholder="Search patient name or UHID..."
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                className="form-input w-full p-2 border text-xs"
              />

              {patientSearch && patients && patients.length > 0 && (
                <div className="bg-white border rounded shadow-md mt-1 divide-y max-h-40 overflow-y-auto z-50 relative">
                  {patients.map((p: any) => (
                    <div
                      key={p.id}
                      onClick={() => {
                        setSelectedPatientId(p.id);
                        setPatientSearch(`${p.firstName} ${p.lastName} (${p.uhid})`);
                      }}
                      className="p-2 hover:bg-indigo-50/50 cursor-pointer text-xs font-bold"
                    >
                      {p.firstName} {p.lastName} (<code className="font-mono">{p.uhid}</code>)
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Ward Selector */}
            <div>
              <label className="form-label text-sm font-semibold mb-1 block">Inpatient Ward</label>
              <select
                value={selectedWardId}
                onChange={(e) => {
                  setSelectedWardId(e.target.value);
                  setSelectedBedId('');
                }}
                required
                className="form-input w-full p-2 text-xs font-bold text-slate-800"
              >
                <option value="">Select Inpatient Ward...</option>
                {wards?.map((w: any) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Bed Selector */}
            <div>
              <label className="form-label text-sm font-semibold mb-1 block">Assign Room Bed</label>
              <select
                value={selectedBedId}
                onChange={(e) => setSelectedBedId(e.target.value)}
                required
                className="form-input w-full p-2 text-xs font-bold text-slate-800"
              >
                <option value="">Select Available Bed...</option>
                {/* Add preselected bed option if matching */}
                {preselectedBedId && (
                  <option value={preselectedBedId}>Suggested Bed (Occupancy Assigned)</option>
                )}
                {availableBeds.map((b: any) => (
                  <option key={b.id} value={b.id}>
                    Bed {b.bedNumber}
                  </option>
                ))}
              </select>
            </div>

            {/* Admission Notes */}
            <div>
              <label className="form-label text-xs font-semibold mb-1 block">Admission Notes / Indication</label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Indicate diagnosis and condition details..."
                className="form-input w-full text-xs p-2"
              />
            </div>

            <button
              type="submit"
              disabled={admitMutation.isPending}
              className="btn btn-primary w-full mt-4 font-bold uppercase text-xs"
            >
              {admitMutation.isPending ? 'Processing admissions check-in...' : 'Admit & Occupy Bed'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
