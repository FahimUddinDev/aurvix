'use client';

import { useTranslations } from 'next-intl';
import { useRouter, useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { getAuthenticatedClient, gql } from '@/lib/graphql-client';

const PATIENT_EMR_QUERY = gql`
  query PatientEMR($patientId: ID!) {
    patientEmr(patientId: $patientId) {
      patient {
        id
        uhid
        firstName
        lastName
        gender
        dateOfBirth
        phone
        email
        address
      }
      visits {
        id
        visitDate
        chiefComplaint
        vitals {
          systolicBp
          diastolicBp
          heartRate
          temperature
          spo2
        }
        diagnoses {
          icd10Code
          icd10Desc
          description
          isPrimary
        }
        notes {
          content
        }
        prescriptions {
          items {
            dosage
            frequency
            duration
            instructions
            qty
            medicine {
              brandName
              genericName
              dosageForm
              strength
            }
          }
        }
      }
    }
  }
`;

export default function PatientEMRTimelinePage() {
  const router = useRouter();
  const params = useParams();
  const patientId = params.id as string;
  const locale = (params.locale as string) || 'en';

  const client = getAuthenticatedClient();

  // Query patient EMR
  const { data: emrData, isLoading } = useQuery({
    queryKey: ['patientEMR', patientId],
    queryFn: async () => {
      const res: any = await client.request(PATIENT_EMR_QUERY, { patientId });
      return res.patientEmr;
    },
  });

  const getAge = (dobString: string) => {
    const dob = new Date(dobString);
    const diffMs = Date.now() - dob.getTime();
    const ageDate = new Date(diffMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return <div className="p-6 text-center text-slate-500 font-medium">Loading EMR database...</div>;
  }

  if (!emrData) {
    return <div className="p-6 text-center text-red-500 font-medium">Patient EMR not found.</div>;
  }

  const { patient, visits } = emrData;

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-800">
      {/* Back button */}
      <button onClick={() => router.back()} className="btn btn-sm btn-outline mb-6">
        ← Back
      </button>

      {/* Patient Profile Card */}
      <div className="card mb-6">
        <div className="card-body">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-1">
                EMR Folder File
              </span>
              <h1 className="text-2xl font-black text-slate-900">
                {patient.firstName} {patient.lastName}
              </h1>
              <div className="flex flex-wrap gap-4 text-xs font-semibold text-slate-500 mt-2">
                <span>UHID: <code className="font-mono text-slate-700">{patient.uhid}</code></span>
                <span>Age: {getAge(patient.dateOfBirth)} Yrs</span>
                <span>Gender: {patient.gender}</span>
                <span>Phone: {patient.phone}</span>
              </div>
            </div>
            {patient.email && (
              <div className="text-right text-sm">
                <span className="text-xs text-slate-400 font-bold block uppercase">Email Address</span>
                <span className="font-medium text-slate-700">{patient.email}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Timeline Section */}
      <div className="max-w-4xl mx-auto space-y-6">
        <h2 className="text-lg font-bold text-slate-800 border-b pb-2">Clinical Visit Timeline</h2>

        {visits.length === 0 ? (
          <div className="p-8 text-center text-slate-400 font-medium bg-white rounded-xl shadow-sm border border-slate-100">
            No completed consultation records found for this patient.
          </div>
        ) : (
          <div className="space-y-6">
            {visits.map((visit: any, index: number) => (
              <div key={visit.id} className="relative bg-white rounded-xl shadow-sm border border-slate-100 p-6 space-y-4">
                {/* Date marker */}
                <div className="absolute top-6 right-6 text-right">
                  <span className="text-xs text-slate-400 font-bold block">Visit Date</span>
                  <span className="text-sm font-bold text-slate-700">{formatDate(visit.visitDate)}</span>
                </div>

                {/* Left Line */}
                <div className="border-l-4 border-brand-blue pl-4">
                  <span className="text-xs text-slate-400 font-bold block uppercase tracking-wider">
                    Complaint / কারণ
                  </span>
                  <p className="text-slate-800 font-semibold text-md mt-1">
                    {visit.chiefComplaint || 'Routine Medical Checkup'}
                  </p>
                </div>

                {/* Vitals */}
                {visit.vitals.length > 0 && (
                  <div className="bg-slate-50 rounded-lg p-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    {visit.vitals.map((v: any, vi: number) => (
                      <div key={vi} className="space-y-1">
                        <span className="text-slate-400 block font-bold uppercase text-[10px]">Vitals Sign</span>
                        <div className="text-slate-700 font-semibold">
                          {v.systolicBp && `${v.systolicBp}/${v.diastolicBp} mmHg`}
                          {v.heartRate && ` | HR: ${v.heartRate} bpm`}
                          {v.temperature && ` | Temp: ${v.temperature} °C`}
                          {v.spo2 && ` | SpO2: ${v.spo2} %`}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* SOAP note */}
                {visit.notes.length > 0 && (
                  <div className="space-y-1 text-sm border-t pt-3">
                    <span className="text-slate-400 block font-bold uppercase text-xs">Clinical Notes (SOAP)</span>
                    <p className="text-slate-700 whitespace-pre-line leading-relaxed font-medium mt-1">
                      {visit.notes[0].content}
                    </p>
                  </div>
                )}

                {/* Diagnoses */}
                {visit.diagnoses.length > 0 && (
                  <div className="space-y-2 border-t pt-3 text-xs">
                    <span className="text-slate-400 block font-bold uppercase">Assessment & Diagnosis</span>
                    <div className="flex flex-wrap gap-2">
                      {visit.diagnoses.map((diag: any, di: number) => (
                        <div key={di} className="bg-blue-50/50 border border-blue-100 rounded px-2.5 py-1 flex items-center gap-2">
                          <code className="font-bold text-brand-blue font-mono text-sm">{diag.icd10Code}</code>
                          <span className="text-slate-600 font-medium">{diag.icd10Desc || diag.description}</span>
                          {diag.isPrimary && (
                            <span className="text-[9px] bg-brand-blue text-white font-black uppercase px-1 rounded">
                              Primary
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Prescriptions */}
                {visit.prescriptions.length > 0 && (
                  <div className="space-y-3 border-t pt-3 text-xs">
                    <span className="text-slate-400 block font-bold uppercase">Electronic Prescription (Rx)</span>
                    <div className="divide-y border rounded-lg bg-slate-50/50 divide-slate-100">
                      {visit.prescriptions[0].items.map((item: any, itemIdx: number) => (
                        <div key={itemIdx} className="p-3 flex justify-between items-center text-sm">
                          <div>
                            <span className="font-bold text-slate-800">
                              {item.medicine.brandName}
                            </span>
                            <span className="text-xs text-slate-500 font-mono ml-2">
                              ({item.medicine.genericName} - {item.medicine.strength} {item.medicine.dosageForm})
                            </span>
                            {item.instructions && (
                              <div className="text-xs text-slate-500 font-medium mt-1">
                                Instructions: {item.instructions}
                              </div>
                            )}
                          </div>
                          <div className="text-right font-semibold text-slate-600 text-xs">
                            <div className="font-mono text-brand-navy">{item.dosage}</div>
                            <div>{item.frequency} | {item.duration}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
