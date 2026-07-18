'use client';

import { useTranslations } from 'next-intl';
import { useRouter, useParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAuthenticatedClient, gql } from '@/lib/graphql-client';
import { toast } from 'sonner';

// Validations
import { updatePatientSchema, type UpdatePatientInput } from '@aurevix/validators';

const PATIENT_QUERY = gql`
  query Patient($id: ID!) {
    patient(id: $id) {
      id
      uhid
      firstName
      lastName
      firstNameBn
      lastNameBn
      dateOfBirth
      gender
      bloodGroup
      phone
      email
      address
      addressBn
      nidDecrypted
      isActive
      allergies {
        id
        allergen
        reaction
        severity
        isActive
      }
      emergencyContacts {
        id
        name
        relationship
        phone
      }
    }
  }
`;

const TIMELINE_QUERY = gql`
  query PatientTimeline($id: ID!) {
    patientTimeline(id: $id) {
      id
      type
      title
      description
      date
    }
  }
`;

const UPDATE_PATIENT_MUTATION = gql`
  mutation UpdatePatient($id: ID!, $input: UpdatePatientInput!) {
    updatePatient(id: $id, input: $input) {
      id
      firstName
      lastName
    }
  }
`;

export default function PatientProfilePage() {
  const t = useTranslations('settings');
  const commonT = useTranslations('common');
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const locale = (params.locale as string) || 'en';
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'profile' | 'timeline'>('profile');
  const [isEditOpen, setIsEditOpen] = useState(false);

  const client = getAuthenticatedClient();

  // Queries
  const { data: patient, isLoading: patientLoading } = useQuery({
    queryKey: ['patient', id],
    queryFn: async () => {
      const res: any = await client.request(PATIENT_QUERY, { id });
      return res.patient;
    },
  });

  const { data: timeline, isLoading: timelineLoading } = useQuery({
    queryKey: ['patientTimeline', id],
    queryFn: async () => {
      const res: any = await client.request(TIMELINE_QUERY, { id });
      return res.patientTimeline;
    },
  });

  // Mutation
  const updateMutation = useMutation({
    mutationFn: async (input: any) => {
      const formattedInput = { ...input };
      if (input.dateOfBirth) {
        formattedInput.dateOfBirth = new Date(input.dateOfBirth).toISOString() as any;
      }
      await client.request(UPDATE_PATIENT_MUTATION, { id, input: formattedInput });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient', id] });
      queryClient.invalidateQueries({ queryKey: ['patientTimeline', id] });
      toast.success('Patient profile updated successfully.');
      setIsEditOpen(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.errors?.[0]?.message ?? 'Failed to update profile');
    },
  });

  // React Hook Form for Edit Patient
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<any>({
    resolver: zodResolver(updatePatientSchema),
  });

  const openEditModal = () => {
    if (!patient) return;
    reset({
      firstName: patient.firstName,
      lastName: patient.lastName,
      firstNameBn: patient.firstNameBn || '',
      lastNameBn: patient.lastNameBn || '',
      gender: patient.gender as any,
      dateOfBirth: patient.dateOfBirth
        ? (new Date(patient.dateOfBirth).toISOString().split('T')[0] as any)
        : undefined,
      bloodGroup: patient.bloodGroup as any,
      phone: patient.phone,
      email: patient.email || '',
      address: patient.address || '',
      addressBn: patient.addressBn || '',
      nid: patient.nidDecrypted || '',
    });
    setIsEditOpen(true);
  };

  const calculateAge = (dobString: string) => {
    if (!dobString) return '—';
    const dob = new Date(dobString);
    const diff = Date.now() - dob.getTime();
    const ageDate = new Date(diff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  if (patientLoading) {
    return <div className="p-6">Loading patient profile...</div>;
  }

  if (!patient) {
    return <div className="p-6 text-center text-slate-500">Patient not found</div>;
  }

  return (
    <div className="patient-profile-container">
      {/* Back to List link */}
      <button onClick={() => router.push(`/${locale}/patients`)} className="back-btn">
        &larr; Back to Patient Directory
      </button>

      {/* Patient Header Summary Card */}
      <div className="card profile-header-card">
        <div className="card-body profile-header-body">
          <div className="avatar-large">
            {patient.firstName[0]}
            {patient.lastName[0]}
          </div>

          <div className="header-info">
            <h1 className="patient-name">
              {patient.firstName} {patient.lastName}
              {(patient.firstNameBn || patient.lastNameBn) && (
                <span className="bilingual-title">
                  ({patient.firstNameBn || ''} {patient.lastNameBn || ''})
                </span>
              )}
            </h1>
            <div className="header-badges flex-row">
              <code className="uhid-code">{patient.uhid}</code>
              <span className={`badge ${patient.isActive ? 'badge-success' : 'badge-danger'}`}>
                {patient.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>

          <button onClick={openEditModal} className="btn btn-secondary">
            Edit Profile
          </button>
        </div>
      </div>

      {/* Dual Column Content */}
      <div className="profile-layout-grid">
        {/* Left Column: Core demographics, emergency contact, and allergies */}
        <div className="layout-col-left">
          {/* Demographic details */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Demographics</span>
            </div>
            <div className="card-body detail-grid">
              <div className="detail-item">
                <span className="detail-label">Age</span>
                <span className="detail-val font-semibold">
                  {calculateAge(patient.dateOfBirth)} yrs
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Date of Birth</span>
                <span className="detail-val">
                  {new Date(patient.dateOfBirth).toLocaleDateString()}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Gender</span>
                <span className="detail-val capitalize">{patient.gender.toLowerCase()}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Blood Group</span>
                <span className="detail-val">
                  <span className="blood-badge">
                    {patient.bloodGroup
                      ? patient.bloodGroup.replace('_POS', '+').replace('_NEG', '-')
                      : '—'}
                  </span>
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Phone</span>
                <span className="detail-val">{patient.phone}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Email</span>
                <span className="detail-val">{patient.email || '—'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">NID</span>
                <span className="detail-val font-mono">{patient.nidDecrypted || '—'}</span>
              </div>
              <div className="detail-item full-width">
                <span className="detail-label">Address</span>
                <span className="detail-val">
                  {patient.address || '—'}
                  {patient.addressBn && (
                    <span className="bilingual-sub block mt-1">{patient.addressBn}</span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Emergency contacts */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Emergency Contacts</span>
            </div>
            <div className="card-body p-0">
              {!patient.emergencyContacts?.length ? (
                <div className="p-4 text-center text-slate-400">
                  No emergency contacts registered
                </div>
              ) : (
                <div className="contact-list">
                  {patient.emergencyContacts.map((c: any) => (
                    <div key={c.id} className="contact-item">
                      <div className="contact-name font-semibold">{c.name}</div>
                      <div className="contact-rel-phone text-slate-500">
                        {c.relationship} &bull; {c.phone}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Clinical Allergies */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Active Allergies</span>
            </div>
            <div className="card-body p-0">
              {!patient.allergies?.length ? (
                <div className="p-4 text-center text-slate-400">No active allergies</div>
              ) : (
                <div className="allergies-list">
                  {patient.allergies.map((a: any) => (
                    <div key={a.id} className="allergy-item">
                      <div className="allergy-header flex-between">
                        <span className="allergen-title font-semibold">{a.allergen}</span>
                        <span className={`severity-badge severity-${a.severity.toLowerCase()}`}>
                          {a.severity}
                        </span>
                      </div>
                      {a.reaction && <p className="allergy-reaction">{a.reaction}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Tab View */}
        <div className="layout-col-right">
          <div className="card tabbed-card">
            <div className="card-header tab-header p-0">
              <button
                onClick={() => setActiveTab('profile')}
                className={`tab-link ${activeTab === 'profile' ? 'active' : ''}`}
              >
                Information
              </button>
              <button
                onClick={() => setActiveTab('timeline')}
                className={`tab-link ${activeTab === 'timeline' ? 'active' : ''}`}
              >
                Medical History Timeline
              </button>
            </div>

            <div className="card-body">
              {activeTab === 'profile' && (
                <div className="profile-tab-content">
                  <h3 className="tab-section-title">Clinical Summary Overview</h3>
                  <p className="tab-section-desc">
                    This file aggregates demographic data, NID identity records, emergency contacts,
                    and critical warnings for clinical practitioners.
                  </p>

                  <div className="summary-widgets">
                    <div className="summary-widget-card alert warning">
                      <div className="widget-header">Allergy Status Check</div>
                      <div className="widget-value mt-2 font-semibold">
                        {patient.allergies?.length > 0
                          ? `${patient.allergies.length} active allergy warnings recorded`
                          : 'No known allergies'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'timeline' && (
                <div className="timeline-tab-content">
                  {timelineLoading ? (
                    <div className="p-4 text-slate-400">Loading timeline...</div>
                  ) : !timeline?.length ? (
                    <div className="p-4 text-center text-slate-400">
                      No medical timeline events found
                    </div>
                  ) : (
                    <div className="timeline-history">
                      {timeline.map((item: any) => (
                        <div key={item.id} className="timeline-node">
                          <div className="timeline-marker" />
                          <div className="timeline-card card">
                            <div className="card-body">
                              <div className="timeline-meta flex-between">
                                <span className="timeline-type-badge">{item.type}</span>
                                <span className="timeline-date">
                                  {new Date(item.date).toLocaleDateString()}
                                </span>
                              </div>
                              <h4 className="timeline-title font-semibold mt-2">{item.title}</h4>
                              {item.description && (
                                <p className="timeline-desc text-slate-500 mt-1">
                                  {item.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal Dialog */}
      {isEditOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3 className="modal-title">Edit Patient Profile</h3>
            <form
              onSubmit={handleSubmit((data) => updateMutation.mutate(data))}
              className="modal-form"
              noValidate
            >
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">First Name (EN) *</label>
                  <input
                    type="text"
                    {...register('firstName')}
                    className={`form-input ${errors.firstName ? 'form-input-error' : ''}`}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name (EN) *</label>
                  <input
                    type="text"
                    {...register('lastName')}
                    className={`form-input ${errors.lastName ? 'form-input-error' : ''}`}
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">First Name (BN)</label>
                  <input type="text" {...register('firstNameBn')} className="form-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name (BN)</label>
                  <input type="text" {...register('lastNameBn')} className="form-input" />
                </div>
              </div>

              <div className="form-grid-3">
                <div className="form-group">
                  <label className="form-label">Gender *</label>
                  <select {...register('gender')} className="form-input">
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Date of Birth *</label>
                  <input
                    type="date"
                    {...register('dateOfBirth')}
                    className={`form-input ${errors.dateOfBirth ? 'form-input-error' : ''}`}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Blood Group</label>
                  <select {...register('bloodGroup')} className="form-input">
                    <option value="">Select Blood Group</option>
                    <option value="A_POS">A +ve</option>
                    <option value="A_NEG">A -ve</option>
                    <option value="B_POS">B +ve</option>
                    <option value="B_NEG">B -ve</option>
                    <option value="AB_POS">AB +ve</option>
                    <option value="AB_NEG">AB -ve</option>
                    <option value="O_POS">O +ve</option>
                    <option value="O_NEG">O -ve</option>
                  </select>
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Phone *</label>
                  <input
                    type="text"
                    {...register('phone')}
                    className={`form-input ${errors.phone ? 'form-input-error' : ''}`}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">National ID (NID)</label>
                  <input
                    type="text"
                    {...register('nid')}
                    className={`form-input ${errors.nid ? 'form-input-error' : ''}`}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Residential Address (EN)</label>
                <input type="text" {...register('address')} className="form-input" />
              </div>

              <div className="form-group">
                <label className="form-label">Residential Address (BN)</label>
                <input type="text" {...register('addressBn')} className="form-input" />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="btn btn-secondary"
                >
                  {commonT('cancel')}
                </button>
                <button type="submit" disabled={isSubmitting} className="btn btn-primary">
                  {isSubmitting ? 'Saving...' : commonT('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .patient-profile-container { display: flex; flex-direction: column; gap: 20px; }
        .back-btn { background: none; border: none; font-size: 13.5px; font-weight: 600; color: var(--brand-blue); cursor: pointer; text-align: left; align-self: flex-start; }
        .back-btn:hover { text-decoration: underline; }
        .profile-header-card { border-radius: var(--radius-lg); }
        .profile-header-body { display: flex; align-items: center; gap: 20px; }
        @media (max-width: 600px) { .profile-header-body { flex-direction: column; text-align: center; } }
        .avatar-large { width: 64px; height: 64px; border-radius: 50%; background: var(--brand-blue); color: white; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 700; flex-shrink: 0; }
        .header-info { flex-grow: 1; display: flex; flex-direction: column; gap: 6px; }
        .patient-name { font-size: 22px; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .bilingual-title { font-size: 14px; color: var(--text-muted); font-weight: 500; }
        .header-badges { display: flex; gap: 10px; align-items: center; }
        @media (max-width: 600px) { .header-badges { justify-content: center; } }
        .uhid-code { background: var(--bg-tertiary); color: var(--brand-blue); padding: 2px 8px; border-radius: 6px; font-family: var(--font-mono); font-weight: 700; font-size: 12.5px; }
        .profile-layout-grid { display: grid; grid-template-columns: 2fr 3fr; gap: 20px; align-items: start; }
        @media (max-width: 900px) { .profile-layout-grid { grid-template-columns: 1fr; } }
        .layout-col-left { display: flex; flex-direction: column; gap: 20px; }
        .layout-col-right { display: flex; flex-direction: column; gap: 20px; }
        .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .detail-item { display: flex; flex-direction: column; gap: 4px; }
        .detail-item.full-width { grid-column: span 2; }
        @media (max-width: 600px) { .detail-item.full-width { grid-column: span 1; } .detail-grid { grid-template-columns: 1fr; } }
        .detail-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); }
        .detail-val { font-size: 13.5px; color: var(--text-secondary); }
        .bilingual-sub { font-size: 11.5px; color: var(--text-muted); }
        .block { display: block; }
        .blood-badge { background: #FEF2F2; color: #DC2626; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: 700; }
        .contact-list { display: flex; flex-direction: column; }
        .contact-item { padding: 12px 20px; border-bottom: 1px solid var(--border); }
        .contact-item:last-child { border-bottom: none; }
        .contact-name { font-size: 13.5px; color: var(--text-primary); }
        .contact-rel-phone { font-size: 12px; margin-top: 2px; }
        .allergies-list { display: flex; flex-direction: column; }
        .allergy-item { padding: 12px 20px; border-bottom: 1px solid var(--border); }
        .allergy-item:last-child { border-bottom: none; }
        .allergen-title { font-size: 13.5px; color: var(--text-primary); }
        .severity-badge { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 9999px; text-transform: uppercase; }
        .severity-mild { background: #ECFDF5; color: #10B981; }
        .severity-moderate { background: #FFFBEB; color: #F59E0B; }
        .severity-severe { background: #FEF2F2; color: #DC2626; }
        .allergy-reaction { font-size: 12px; color: var(--text-muted); margin-top: 4px; }
        .tab-header { display: flex; border-bottom: 1px solid var(--border); background: var(--bg-secondary); }
        .tab-link { flex: 1; padding: 12px 20px; font-size: 13.5px; font-weight: 600; text-align: center; background: none; border: none; color: var(--text-secondary); cursor: pointer; transition: all 150ms; }
        .tab-link:hover { color: var(--text-primary); }
        .tab-link.active { color: var(--brand-blue); border-bottom: 2px solid var(--brand-blue); background: var(--bg-primary); }
        .tab-section-title { font-size: 15px; font-weight: 700; color: var(--text-primary); margin-bottom: 8px; }
        .tab-section-desc { font-size: 13px; color: var(--text-secondary); line-height: 1.5; margin-bottom: 20px; }
        .alert { border-radius: var(--radius); padding: 12px 16px; font-size: 13px; }
        .alert.warning { background: var(--warning-bg); color: var(--warning); border: 1px solid rgba(245, 158, 11, 0.2); }
        .widget-header { font-size: 11px; text-transform: uppercase; font-weight: 600; letter-spacing: 0.05em; }
        .timeline-history { display: flex; flex-direction: column; gap: 20px; position: relative; padding-left: 20px; border-left: 2px solid var(--border); margin-left: 10px; margin-top: 10px; }
        .timeline-node { position: relative; }
        .timeline-marker { position: absolute; left: -26px; top: 16px; width: 10px; height: 10px; border-radius: 50%; background: var(--brand-blue); border: 2px solid var(--bg-primary); }
        .timeline-card { border-radius: var(--radius-lg); }
        .timeline-type-badge { background: var(--bg-secondary); color: var(--text-secondary); padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; text-transform: uppercase; }
        .timeline-date { font-size: 11.5px; color: var(--text-muted); }
        .timeline-title { font-size: 13.5px; color: var(--text-primary); }
        .timeline-desc { font-size: 12.5px; line-height: 1.4; }
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15, 27, 61, 0.4); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: var(--z-modal); }
        .modal-card { background: white; border-radius: 12px; padding: 28px; width: 100%; max-width: 500px; box-shadow: var(--shadow-lg); border: 1px solid var(--border); }
        .modal-title { font-size: 18px; font-weight: 700; color: var(--text-primary); margin-bottom: 20px; }
        .modal-form { display: flex; flex-direction: column; gap: 16px; }
        .form-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .form-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
        .form-group { display: flex; flex-direction: column; gap: 6px; }
        .form-label { font-size: 12.5px; font-weight: 600; color: var(--text-primary); }
        .form-input { height: 38px; padding: 0 12px; border: 1.5px solid var(--border); border-radius: var(--radius); font-size: 13.5px; color: var(--text-primary); outline: none; transition: border-color 150ms; background: white; }
        .form-input:focus { border-color: var(--brand-blue); box-shadow: 0 0 0 3px rgba(51, 102, 204, 0.12); }
        .form-input-error { border-color: var(--danger); }
        .checkbox-input { width: 16px; height: 16px; accent-color: var(--brand-blue); cursor: pointer; }
        .modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 8px; }
        .btn { height: 38px; padding: 0 16px; border-radius: var(--radius); font-size: 13.5px; font-weight: 600; cursor: pointer; border: none; display: inline-flex; align-items: center; justify-content: center; transition: opacity 150ms; }
        .btn:hover { opacity: 0.9; }
        .btn-primary { background: linear-gradient(135deg, var(--brand-blue), var(--brand-blue-light)); color: white; }
        .btn-secondary { background: var(--bg-tertiary); color: var(--text-secondary); border: 1px solid var(--border); }
      `}</style>
    </div>
  );
}
