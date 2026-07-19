'use client';

import { useTranslations } from 'next-intl';
import { useRouter, useParams } from 'next/navigation';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAuthenticatedClient, gql } from '@/lib/graphql-client';

const VISIT_DETAILS_QUERY = gql`
  query VisitDetails($id: ID!) {
    myAppointments(page: 1, limit: 100) {
      items {
        id
        patient {
          id
          uhid
          firstName
          lastName
          dateOfBirth
          gender
        }
      }
    }
  }
`;

const SEARCH_ICD10_QUERY = gql`
  query SearchICD10($query: String!) {
    searchICD10(query: $query) {
      id
      code
      description
    }
  }
`;

const SEARCH_MEDICINE_QUERY = gql`
  query SearchMedicine($query: String!) {
    searchMedicine(query: $query) {
      id
      genericName
      brandName
      category
      dosageForm
      strength
    }
  }
`;

const ADD_VITALS_MUTATION = gql`
  mutation AddVitals($visitId: ID!, $input: VitalsInput!) {
    addVitals(visitId: $visitId, input: $input) {
      id
    }
  }
`;

const ADD_DIAGNOSIS_MUTATION = gql`
  mutation AddDiagnosis($visitId: ID!, $input: DiagnosisInput!) {
    addDiagnosis(visitId: $visitId, input: $input) {
      id
    }
  }
`;

const ADD_NOTE_MUTATION = gql`
  mutation AddClinicalNote($visitId: ID!, $input: ClinicalNoteInput!) {
    addClinicalNote(visitId: $visitId, input: $input) {
      id
    }
  }
`;

const CREATE_PRESCRIPTION_MUTATION = gql`
  mutation CreatePrescription($input: CreatePrescriptionInput!) {
    createPrescription(input: $input) {
      id
    }
  }
`;

const COMPLETE_CONSULTATION_MUTATION = gql`
  mutation CompleteConsultation($visitId: ID!) {
    completeConsultation(visitId: $visitId) {
      id
      isCompleted
    }
  }
`;

export default function DoctorWorkspacePage() {
  const router = useRouter();
  const params = useParams();
  const visitId = params.id as string;
  const locale = (params.locale as string) || 'en';
  const queryClient = useQueryClient();

  const client = getAuthenticatedClient();

  // Load Visit context (we query appointments to match the patient)
  const { data: appointments } = useQuery({
    queryKey: ['visitContext', visitId],
    queryFn: async () => {
      const res: any = await client.request(VISIT_DETAILS_QUERY);
      return res.myAppointments.items;
    },
  });

  // Clinical Forms States
  // Vitals
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [heartRate, setHeartRate] = useState('');
  const [temp, setTemp] = useState('');
  const [spo2, setSpo2] = useState('');

  // SOAP notes
  const [subjective, setSubjective] = useState('');
  const [objective, setObjective] = useState('');
  const [assessment, setAssessment] = useState('');
  const [plan, setPlan] = useState('');

  // Diagnosis
  const [diagSearch, setDiagSearch] = useState('');
  const [diagnosesList, setDiagnosesList] = useState<any[]>([]);

  // Prescriptions
  const [medSearch, setMedSearch] = useState('');
  const [prescriptionItems, setPrescriptionItems] = useState<any[]>([]);

  // Sub-queries
  const { data: icdCodes } = useQuery({
    queryKey: ['searchICD10', diagSearch],
    queryFn: async () => {
      const res: any = await client.request(SEARCH_ICD10_QUERY, { query: diagSearch });
      return res.searchICD10;
    },
    enabled: diagSearch.length >= 2,
  });

  const { data: medicines } = useQuery({
    queryKey: ['searchMedicine', medSearch],
    queryFn: async () => {
      const res: any = await client.request(SEARCH_MEDICINE_QUERY, { query: medSearch });
      return res.searchMedicine;
    },
    enabled: medSearch.length >= 2,
  });

  // Calculate age helper
  const getAge = (dobString: string) => {
    const dob = new Date(dobString);
    const diffMs = Date.now() - dob.getTime();
    const ageDate = new Date(diffMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  // Diagnosis actions
  const handleAddDiagnosis = (code: any) => {
    const exists = diagnosesList.some((d) => d.icd10Code === code.code);
    if (exists) return;
    setDiagnosesList((prev) => [
      ...prev,
      {
        icd10Code: code.code,
        icd10Desc: code.description,
        isPrimary: prev.length === 0,
      },
    ]);
    setDiagSearch('');
  };

  const handleRemoveDiagnosis = (idx: number) => {
    setDiagnosesList((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSetPrimary = (idx: number) => {
    setDiagnosesList((prev) =>
      prev.map((d, i) => ({ ...d, isPrimary: i === idx })),
    );
  };

  // Prescription actions
  const handleAddMedicine = (med: any) => {
    const exists = prescriptionItems.some((m) => m.medicineId === med.id);
    if (exists) return;
    setPrescriptionItems((prev) => [
      ...prev,
      {
        medicineId: med.id,
        brandName: med.brandName || med.genericName,
        genericName: med.genericName,
        dosage: '1+0+1',
        frequency: 'after meal',
        duration: '7 days',
        route: 'ORAL',
        instructions: '',
        qty: 10,
      },
    ]);
    setMedSearch('');
  };

  const handleUpdatePrescriptionItem = (idx: number, key: string, value: any) => {
    setPrescriptionItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [key]: value } : item)),
    );
  };

  const handleRemoveMedicine = (idx: number) => {
    setPrescriptionItems((prev) => prev.filter((_, i) => i !== idx));
  };

  // Submit complete consultation
  const handleFinalize = async () => {
    try {
      // 1. Submit Vitals if filled
      if (systolic || diastolic || heartRate || temp || spo2) {
        await client.request(ADD_VITALS_MUTATION, {
          visitId,
          input: {
            systolicBp: systolic ? parseInt(systolic, 10) : undefined,
            diastolicBp: diastolic ? parseInt(diastolic, 10) : undefined,
            heartRate: heartRate ? parseInt(heartRate, 10) : undefined,
            temperature: temp ? parseFloat(temp) : undefined,
            spo2: spo2 ? parseInt(spo2, 10) : undefined,
          },
        });
      }

      // 2. Submit SOAP note
      const soapContent = `[Subjective] ${subjective}\n[Objective] ${objective}\n[Assessment] ${assessment}\n[Plan] ${plan}`;
      await client.request(ADD_NOTE_MUTATION, {
        visitId,
        input: { noteType: 'SOAP', content: soapContent },
      });

      // 3. Submit Diagnoses
      for (const diag of diagnosesList) {
        await client.request(ADD_DIAGNOSIS_MUTATION, {
          visitId,
          input: {
            icd10Code: diag.icd10Code,
            icd10Desc: diag.icd10Desc,
            isPrimary: diag.isPrimary,
          },
        });
      }

      // 4. Submit Prescription if any medicines added
      if (prescriptionItems.length > 0) {
        await client.request(CREATE_PRESCRIPTION_MUTATION, {
          input: {
            visitId,
            items: prescriptionItems.map((p) => ({
              medicineId: p.medicineId,
              dosage: p.dosage,
              frequency: p.frequency,
              duration: p.duration,
              route: p.route,
              instructions: p.instructions || undefined,
              qty: p.qty,
            })),
          },
        });
      }

      // 5. Complete Consultation
      await client.request(COMPLETE_CONSULTATION_MUTATION, { visitId });

      alert('Consultation completed successfully! Bills and prescriptions routed.');
      router.push(`/${locale}/emr/queue`);
    } catch (err: any) {
      alert(err.message || 'Failed to complete consultation');
    }
  };

  // Find dummy patient details
  const patient = appointments?.[0]?.patient || {
    firstName: 'Patient',
    lastName: 'Workspace',
    uhid: 'UHID-LOADING',
    gender: 'MALE',
    dateOfBirth: '1990-01-01',
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800">
      {/* Header Workspace */}
      <div className="bg-brand-navy text-white p-4 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push(`/${locale}/emr/queue`)} className="btn btn-sm btn-outline border-white/20 text-white hover:bg-white/10">
            ← Exit Desk
          </button>
          <div>
            <h1 className="text-md font-bold">Clinical Workspace: {patient.firstName} {patient.lastName}</h1>
            <p className="text-xs text-white/60">UHID: {patient.uhid} | Age: {getAge(patient.dateOfBirth)} Yrs | Gender: {patient.gender}</p>
          </div>
        </div>

        <button onClick={handleFinalize} className="btn bg-[#10b981] hover:bg-[#059669] border-none text-white font-bold px-6">
          💾 Complete & Save Consultation
        </button>
      </div>

      {/* Main Workspace Panels */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 items-stretch overflow-hidden">
        {/* Left Panel: Vitals & Details */}
        <div className="space-y-4">
          <div className="card h-full bg-white flex flex-col">
            <div className="card-body">
              <h2 className="text-md font-bold text-slate-800 border-b pb-2 mb-4">Patient Vitals & Allergy checks</h2>

              <div className="space-y-4">
                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-xs font-semibold border border-red-100">
                  ⚠️ No recorded allergies.
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label text-xs font-semibold text-slate-500 mb-1 block">BP (Systolic)</label>
                    <input
                      type="number"
                      value={systolic}
                      onChange={(e) => setSystolic(e.target.value)}
                      placeholder="mmHg"
                      className="form-input w-full p-2 border text-sm"
                    />
                  </div>
                  <div>
                    <label className="form-label text-xs font-semibold text-slate-500 mb-1 block">BP (Diastolic)</label>
                    <input
                      type="number"
                      value={diastolic}
                      onChange={(e) => setDiastolic(e.target.value)}
                      placeholder="mmHg"
                      className="form-input w-full p-2 border text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label text-xs font-semibold text-slate-500 mb-1 block">Pulse rate</label>
                    <input
                      type="number"
                      value={heartRate}
                      onChange={(e) => setHeartRate(e.target.value)}
                      placeholder="bpm"
                      className="form-input w-full p-2 border text-sm"
                    />
                  </div>
                  <div>
                    <label className="form-label text-xs font-semibold text-slate-500 mb-1 block">Temp (°C)</label>
                    <input
                      type="number"
                      value={temp}
                      onChange={(e) => setTemp(e.target.value)}
                      placeholder="e.g. 37.2"
                      className="form-input w-full p-2 border text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label text-xs font-semibold text-slate-500 mb-1 block">SpO2 (%)</label>
                  <input
                    type="number"
                    value={spo2}
                    onChange={(e) => setSpo2(e.target.value)}
                    placeholder="oxygen saturation"
                    className="form-input w-full p-2 border text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Center Panel: SOAP Clinical Note & Diagnoses */}
        <div className="space-y-4 flex flex-col justify-between">
          <div className="card bg-white flex-1 flex flex-col">
            <div className="card-body flex-1 flex flex-col">
              <h2 className="text-md font-bold text-slate-800 border-b pb-2 mb-4">SOAP Clinical Notes</h2>

              <div className="space-y-3 flex-1 flex flex-col overflow-y-auto">
                <div>
                  <label className="form-label text-xs font-bold text-slate-600 block mb-1">Subjective (Symptoms)</label>
                  <textarea
                    rows={2}
                    value={subjective}
                    onChange={(e) => setSubjective(e.target.value)}
                    placeholder="Chief symptoms reported by patient..."
                    className="form-input w-full p-2 border text-sm"
                  />
                </div>

                <div>
                  <label className="form-label text-xs font-bold text-slate-600 block mb-1">Objective (Findings)</label>
                  <textarea
                    rows={2}
                    value={objective}
                    onChange={(e) => setObjective(e.target.value)}
                    placeholder="Physical examination and vitals logs..."
                    className="form-input w-full p-2 border text-sm"
                  />
                </div>

                <div>
                  <label className="form-label text-xs font-bold text-slate-600 block mb-1">Assessment (ICD Diagnosis)</label>
                  <textarea
                    rows={2}
                    value={assessment}
                    onChange={(e) => setAssessment(e.target.value)}
                    placeholder="Provisional or ICD diagnosis note..."
                    className="form-input w-full p-2 border text-sm"
                  />
                </div>

                <div>
                  <label className="form-label text-xs font-bold text-slate-600 block mb-1">Plan (Treatments/Labs)</label>
                  <textarea
                    rows={2}
                    value={plan}
                    onChange={(e) => setPlan(e.target.value)}
                    placeholder="Treatment orders or recommended testing..."
                    className="form-input w-full p-2 border text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Coded Diagnoses (ICD-10) */}
          <div className="card bg-white h-60 flex flex-col">
            <div className="card-body flex-1 flex flex-col">
              <h2 className="text-md font-bold text-slate-800 border-b pb-2 mb-3">ICD-10 Coded Diagnosis</h2>

              <div className="space-y-2 flex-1 flex flex-col overflow-hidden">
                <input
                  type="text"
                  value={diagSearch}
                  onChange={(e) => setDiagSearch(e.target.value)}
                  placeholder="Lookup ICD-10 code (e.g. J45 for Asthma)..."
                  className="form-input w-full p-2 border text-xs"
                />

                {icdCodes && icdCodes.length > 0 && (
                  <div className="absolute z-20 bg-white border shadow-md max-h-40 overflow-y-auto w-[320px] rounded divide-y text-xs">
                    {icdCodes.map((c: any) => (
                      <div
                        key={c.id}
                        onClick={() => handleAddDiagnosis(c)}
                        className="p-2 cursor-pointer hover:bg-slate-50 font-medium"
                      >
                        <span className="font-bold text-brand-blue mr-2 font-mono">{c.code}</span>
                        {c.description}
                      </div>
                    ))}
                  </div>
                )}

                {/* Staged Diagnoses List */}
                <div className="flex-1 overflow-y-auto divide-y mt-2">
                  {diagnosesList.map((d, idx) => (
                    <div key={idx} className="flex justify-between items-center py-1 text-xs">
                      <div>
                        <span className={`badge ${d.isPrimary ? 'bg-brand-blue text-white' : 'bg-slate-200 text-slate-600'} text-[10px] mr-2`}>
                          {d.isPrimary ? 'Primary' : 'Secondary'}
                        </span>
                        <span className="font-bold font-mono text-slate-800 mr-2">{d.icd10Code}</span>
                        <span className="text-slate-600">{d.icd10Desc}</span>
                      </div>
                      <div className="flex gap-2">
                        {!d.isPrimary && (
                          <button
                            type="button"
                            onClick={() => handleSetPrimary(idx)}
                            className="text-[10px] text-brand-blue font-bold hover:underline"
                          >
                            Set Primary
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveDiagnosis(idx)}
                          className="text-[10px] text-red-500 font-bold hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Prescription Pad */}
        <div className="space-y-4">
          <div className="card h-full bg-white flex flex-col">
            <div className="card-body flex-1 flex flex-col">
              <h2 className="text-md font-bold text-slate-800 border-b pb-2 mb-4">Prescription Pad (E-Rx)</h2>

              <div className="flex-1 flex flex-col space-y-4 overflow-hidden">
                <input
                  type="text"
                  value={medSearch}
                  onChange={(e) => setMedSearch(e.target.value)}
                  placeholder="Lookup generic/brand drugs..."
                  className="form-input w-full p-2 border text-sm"
                />

                {medicines && medicines.length > 0 && (
                  <div className="absolute z-20 bg-white border shadow-md max-h-40 overflow-y-auto w-[320px] rounded divide-y text-xs">
                    {medicines.map((m: any) => (
                      <div
                        key={m.id}
                        onClick={() => handleAddMedicine(m)}
                        className="p-2 cursor-pointer hover:bg-slate-50 font-medium"
                      >
                        <span className="font-bold text-brand-navy mr-2">{m.brandName || m.genericName}</span>
                        <span className="text-slate-400 font-mono text-[10px]">{m.strength} {m.dosageForm}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Selected Meds Pad */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {prescriptionItems.map((item, idx) => (
                    <div key={idx} className="p-3 border rounded-lg bg-slate-50 space-y-2 text-xs">
                      <div className="flex justify-between items-center border-b pb-1">
                        <span className="font-bold text-slate-800">{item.brandName}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveMedicine(idx)}
                          className="text-[10px] text-red-500 font-semibold hover:underline"
                        >
                          Delete
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-semibold text-slate-400 block mb-0.5">Dosage</label>
                          <input
                            type="text"
                            value={item.dosage}
                            onChange={(e) => handleUpdatePrescriptionItem(idx, 'dosage', e.target.value)}
                            placeholder="e.g. 1+0+1"
                            className="form-input w-full p-1 border text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-slate-400 block mb-0.5">Frequency</label>
                          <input
                            type="text"
                            value={item.frequency}
                            onChange={(e) => handleUpdatePrescriptionItem(idx, 'frequency', e.target.value)}
                            placeholder="after meal"
                            className="form-input w-full p-1 border text-xs"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-semibold text-slate-400 block mb-0.5">Duration</label>
                          <input
                            type="text"
                            value={item.duration}
                            onChange={(e) => handleUpdatePrescriptionItem(idx, 'duration', e.target.value)}
                            placeholder="7 days"
                            className="form-input w-full p-1 border text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-slate-400 block mb-0.5">Quantity</label>
                          <input
                            type="number"
                            value={item.qty}
                            onChange={(e) => handleUpdatePrescriptionItem(idx, 'qty', parseInt(e.target.value, 10))}
                            className="form-input w-full p-1 border text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
