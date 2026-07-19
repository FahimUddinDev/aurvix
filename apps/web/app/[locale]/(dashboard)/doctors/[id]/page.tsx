'use client';

import { useTranslations } from 'next-intl';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAuthenticatedClient, gql } from '@/lib/graphql-client';
import { useState } from 'react';

const DOCTOR_QUERY = gql`
  query Doctor($id: ID!) {
    doctor(id: $id) {
      id
      bmdcNumber
      specialization
      qualification
      experience
      consultationFee
      bio
      bioBn
      isActive
      user {
        id
        firstName
        lastName
        email
        phone
      }
      department {
        id
        name
        nameBn
        code
      }
      schedules {
        id
        dayOfWeek
        startTime
        endTime
        slotDurationMin
        maxPatients
        isActive
      }
      fees {
        id
        feeType
        amount
        isActive
      }
    }
  }
`;

const UPDATE_DOCTOR_MUTATION = gql`
  mutation UpdateDoctor($id: ID!, $input: UpdateDoctorInput!) {
    updateDoctor(id: $id, input: $input) {
      id
      isActive
      specialization
    }
  }
`;

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAYS_BN = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];

export default function DoctorProfilePage() {
  const commonT = useTranslations('common');
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const locale = (params.locale as string) || 'en';
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [specialization, setSpecialization] = useState('');
  const [qualification, setQualification] = useState('');
  const [experience, setExperience] = useState('');
  const [consultationFee, setConsultationFee] = useState('');
  const [bmdcNumber, setBmdcNumber] = useState('');
  const [bio, setBio] = useState('');
  const [bioBn, setBioBn] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const client = getAuthenticatedClient();

  // Fetch Doctor Detail
  const { data: doctor, isLoading } = useQuery({
    queryKey: ['doctor', id],
    queryFn: async () => {
      const res: any = await client.request(DOCTOR_QUERY, { id });
      const doc = res.doctor;
      // Set form initials
      setSpecialization(doc.specialization || '');
      setQualification(doc.qualification || '');
      setExperience(doc.experience ? String(doc.experience) : '');
      setConsultationFee(doc.consultationFee ? String(doc.consultationFee) : '');
      setBmdcNumber(doc.bmdcNumber || '');
      setBio(doc.bio || '');
      setBioBn(doc.bioBn || '');
      return doc;
    },
  });

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: async (input: any) => {
      return client.request(UPDATE_DOCTOR_MUTATION, { id, input });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor', id] });
      setIsEditing(false);
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Failed to update profile.');
    },
  });

  const handleToggleActive = async () => {
    if (!doctor) return;
    try {
      await client.request(UPDATE_DOCTOR_MUTATION, {
        id,
        input: { isActive: !doctor.isActive },
      });
      queryClient.invalidateQueries({ queryKey: ['doctor', id] });
    } catch (err: any) {
      alert(err.message || 'Failed to toggle doctor status');
    }
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      specialization: specialization || undefined,
      qualification: qualification || undefined,
      experience: experience ? parseInt(experience, 10) : undefined,
      consultationFee: consultationFee ? parseFloat(consultationFee) : undefined,
      bmdcNumber: bmdcNumber || undefined,
      bio: bio || undefined,
      bioBn: bioBn || undefined,
    });
  };

  if (isLoading) {
    return <div className="p-6 text-center text-slate-500">Loading doctor profile details...</div>;
  }

  if (!doctor) {
    return <div className="p-6 text-center text-red-500">Doctor profile not found.</div>;
  }

  return (
    <div className="patient-profile-container">
      {/* Back to List */}
      <button onClick={() => router.push(`/${locale}/doctors`)} className="btn btn-outline btn-sm mb-4">
        ← Back to Directory
      </button>

      {/* Profile Overview Card */}
      <div className="card mb-6">
        <div className="card-body">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center border-2 border-brand-blue text-brand-navy font-bold text-2xl">
                {doctor.user.firstName[0]}
                {doctor.user.lastName[0]}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Dr. {doctor.user.firstName} {doctor.user.lastName}
                </h1>
                <p className="text-slate-500 font-medium">
                  {locale === 'bn' ? doctor.department.nameBn || doctor.department.name : doctor.department.name} Department
                </p>
                <div className="flex gap-2 items-center mt-1">
                  <span className={`status-badge ${doctor.isActive ? 'status-active' : 'status-inactive'}`}>
                    {doctor.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <code className="text-xs text-slate-400">BMDC: {doctor.bmdcNumber || 'N/A'}</code>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setIsEditing(!isEditing)} className="btn btn-outline">
                {isEditing ? 'Cancel Edit' : 'Edit Profile'}
              </button>
              <button
                onClick={handleToggleActive}
                className={`btn ${doctor.isActive ? 'btn-outline border-red-200 text-red-600' : 'btn-primary'}`}
              >
                {doctor.isActive ? 'Deactivate Profile' : 'Activate Profile'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Info Form / Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="card-body">
              <h2 className="text-lg font-semibold text-slate-900 border-b pb-2 mb-4">Professional Details</h2>

              {isEditing ? (
                <form onSubmit={handleUpdate} className="space-y-4">
                  {errorMsg && <div className="p-3 bg-red-50 text-red-600 rounded text-sm mb-2">{errorMsg}</div>}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="form-label text-sm font-medium mb-1 block">BMDC Reg No.</label>
                      <input
                        type="text"
                        value={bmdcNumber}
                        onChange={(e) => setBmdcNumber(e.target.value)}
                        className="form-input w-full"
                      />
                    </div>
                    <div>
                      <label className="form-label text-sm font-medium mb-1 block">Consultation Fee (BDT)</label>
                      <input
                        type="number"
                        value={consultationFee}
                        onChange={(e) => setConsultationFee(e.target.value)}
                        className="form-input w-full"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="form-label text-sm font-medium mb-1 block">Specialization</label>
                      <input
                        type="text"
                        value={specialization}
                        onChange={(e) => setSpecialization(e.target.value)}
                        className="form-input w-full"
                      />
                    </div>
                    <div>
                      <label className="form-label text-sm font-medium mb-1 block">Experience (Years)</label>
                      <input
                        type="number"
                        value={experience}
                        onChange={(e) => setExperience(e.target.value)}
                        className="form-input w-full"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="form-label text-sm font-medium mb-1 block">Qualifications</label>
                    <input
                      type="text"
                      value={qualification}
                      onChange={(e) => setQualification(e.target.value)}
                      className="form-input w-full"
                    />
                  </div>

                  <div>
                    <label className="form-label text-sm font-medium mb-1 block">Professional Bio (English)</label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={4}
                      className="form-input w-full p-2 border rounded"
                    />
                  </div>

                  <div>
                    <label className="form-label text-sm font-medium mb-1 block">Professional Bio (বাংলা)</label>
                    <textarea
                      value={bioBn}
                      onChange={(e) => setBioBn(e.target.value)}
                      rows={4}
                      className="form-input w-full p-2 border rounded"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t">
                    <button type="button" onClick={() => setIsEditing(false)} className="btn btn-outline">
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={updateMutation.isPending}>
                      {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs text-slate-400 font-semibold block uppercase">Qualifications</span>
                      <span className="text-slate-800 font-medium">{doctor.qualification || 'MBBS'}</span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 font-semibold block uppercase">Specialization</span>
                      <span className="text-slate-800 font-medium">{doctor.specialization || 'General Practice'}</span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 font-semibold block uppercase">Experience</span>
                      <span className="text-slate-800 font-medium">
                        {doctor.experience ? `${doctor.experience} Years` : '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 font-semibold block uppercase">Consultation Fee</span>
                      <span className="text-slate-800 font-medium">{doctor.consultationFee} BDT</span>
                    </div>
                  </div>

                  {doctor.bio && (
                    <div className="border-t pt-3">
                      <span className="text-xs text-slate-400 font-semibold block uppercase">Bio (English)</span>
                      <p className="text-slate-700 mt-1 whitespace-pre-line text-sm">{doctor.bio}</p>
                    </div>
                  )}

                  {doctor.bioBn && (
                    <div className="border-t pt-3">
                      <span className="text-xs text-slate-400 font-semibold block uppercase">Bio (বাংলা)</span>
                      <p className="text-slate-700 mt-1 whitespace-pre-line text-sm">{doctor.bioBn}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Panel: Contact Info & Weekly Schedules */}
        <div className="space-y-6">
          {/* Contact Details */}
          <div className="card">
            <div className="card-body">
              <h2 className="text-lg font-semibold text-slate-900 border-b pb-2 mb-4">Contact Info</h2>
              <div className="space-y-3">
                <div>
                  <span className="text-xs text-slate-400 font-semibold block uppercase">Email</span>
                  <span className="text-slate-800 text-sm">{doctor.user.email}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-semibold block uppercase">Phone</span>
                  <span className="text-slate-800 text-sm">{doctor.user.phone || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Schedule Summary */}
          <div className="card">
            <div className="card-body">
              <div className="flex justify-between items-center border-b pb-2 mb-4">
                <h2 className="text-lg font-semibold text-slate-900">Weekly Schedule</h2>
                <button
                  onClick={() => router.push(`/${locale}/doctors/${doctor.id}/schedule`)}
                  className="text-xs text-brand-blue font-semibold hover:underline"
                >
                  Manage
                </button>
              </div>

              {!doctor.schedules || doctor.schedules.length === 0 ? (
                <p className="text-sm text-slate-500">No schedules configured for this doctor.</p>
              ) : (
                <div className="space-y-2">
                  {doctor.schedules.map((s: any) => (
                    <div key={s.id} className="flex justify-between items-center border-b pb-1 text-sm">
                      <span className="font-medium text-slate-700">
                        {locale === 'bn' ? DAYS_BN[s.dayOfWeek] : DAYS[s.dayOfWeek]}
                      </span>
                      <span className="text-slate-600 font-mono">
                        {s.startTime} - {s.endTime}
                      </span>
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
