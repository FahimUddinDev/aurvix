'use client';

import { getAuthenticatedClient, gql } from '@/lib/graphql-client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { useFieldArray, useForm } from 'react-hook-form';
import { toast } from 'sonner';

// Validations
import { createPatientSchema } from '@aurevix/validators';

const CREATE_PATIENT_MUTATION = gql`
  mutation CreatePatient($input: CreatePatientInput!) {
    createPatient(input: $input) {
      id
      uhid
      firstName
      lastName
    }
  }
`;

export default function NewPatientPage() {
  const t = useTranslations('settings');
  const commonT = useTranslations('common');
  const router = useRouter();
  const params = useParams();
  const locale = (params.locale as string) || 'en';
  const queryClient = useQueryClient();

  const client = getAuthenticatedClient();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<any>({
    resolver: zodResolver(createPatientSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      firstNameBn: '',
      lastNameBn: '',
      gender: 'MALE',
      dateOfBirth: undefined,
      bloodGroup: undefined,
      phone: '+880',
      email: '',
      address: '',
      addressBn: '',
      nid: '',
      hospitalId: '00000000-0000-0000-0000-000000000001', // Placeholder UUID to satisfy Zod validation
      emergencyContacts: [],
      allergies: [],
    },
  });

  // Dynamic Array for Emergency Contacts
  const {
    fields: contactFields,
    append: appendContact,
    remove: removeContact,
  } = useFieldArray({
    control,
    name: 'emergencyContacts',
  });

  // Dynamic Array for Allergies
  const {
    fields: allergyFields,
    append: appendAllergy,
    remove: removeAllergy,
  } = useFieldArray({
    control,
    name: 'allergies',
  });

  // Mutation
  const registerMutation = useMutation({
    mutationFn: async (input: any) => {
      // Ensure dateOfBirth is sent as ISO String
      const res: any = await client.request(CREATE_PATIENT_MUTATION, {
        input: {
          ...input,
          dateOfBirth: new Date(input.dateOfBirth).toISOString(),
        },
      });
      return res.createPatient;
    },
    onSuccess: (newPatient) => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      toast.success('Patient registered successfully.');
      router.push(`/${locale}/patients/${newPatient.id}`);
    },
    onError: (err: any) => {
      toast.error(err?.response?.errors?.[0]?.message ?? 'Failed to register patient');
    },
  });

  const onSubmit = (data: any) => {
    registerMutation.mutate(data);
  };

  return (
    <div className="new-patient-container">
      {/* Page Header */}
      <div className="settings-header">
        <div>
          <h1 className="settings-title">New Patient Registration</h1>
          <p className="settings-subtitle">
            Enter demographics, contact info, emergency contacts, and active allergies
          </p>
        </div>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit(onSubmit)} className="card-body form-grid" noValidate>
          {/* Section 1: Demographics */}
          <div className="form-section">
            <h3 className="section-title">1. Patient Demographics</h3>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">First Name (EN) *</label>
                <input
                  type="text"
                  placeholder="Karim"
                  {...register('firstName')}
                  className={`form-input ${errors.firstName ? 'form-input-error' : ''}`}
                />
                {errors.firstName?.message && (
                  <span className="form-error-msg">{String(errors.firstName.message)}</span>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Last Name (EN) *</label>
                <input
                  type="text"
                  placeholder="Uddin"
                  {...register('lastName')}
                  className={`form-input ${errors.lastName ? 'form-input-error' : ''}`}
                />
                {errors.lastName?.message && (
                  <span className="form-error-msg">{String(errors.lastName.message)}</span>
                )}
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">First Name (BN)</label>
                <input
                  type="text"
                  placeholder="করিম"
                  {...register('firstNameBn')}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name (BN)</label>
                <input
                  type="text"
                  placeholder="উদ্দিন"
                  {...register('lastNameBn')}
                  className="form-input"
                />
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
                {errors.dateOfBirth?.message && (
                  <span className="form-error-msg">{String(errors.dateOfBirth.message)}</span>
                )}
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
          </div>

          {/* Section 2: Contact & NID */}
          <div className="form-section">
            <h3 className="section-title">2. Contact & Identity Information</h3>

            <div className="form-grid-3">
              <div className="form-group">
                <label className="form-label">Contact Phone *</label>
                <input
                  type="text"
                  placeholder="+8801700000000"
                  {...register('phone')}
                  className={`form-input ${errors.phone ? 'form-input-error' : ''}`}
                />
                {errors.phone?.message && (
                  <span className="form-error-msg">{String(errors.phone.message)}</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  placeholder="patient@example.com"
                  {...register('email')}
                  className={`form-input ${errors.email ? 'form-input-error' : ''}`}
                />
                {errors.email?.message && (
                  <span className="form-error-msg">{String(errors.email.message)}</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">National ID (NID)</label>
                <input
                  type="text"
                  placeholder="10 or 17 digit NID number"
                  {...register('nid')}
                  className={`form-input ${errors.nid ? 'form-input-error' : ''}`}
                />
                {errors.nid?.message && (
                  <span className="form-error-msg">{String(errors.nid.message)}</span>
                )}
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Residential Address (EN)</label>
                <input
                  type="text"
                  placeholder="House 12, Road 5, Dhanmondi, Dhaka"
                  {...register('address')}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Residential Address (BN)</label>
                <input
                  type="text"
                  placeholder="বাসা ১২, রোড ৫, ধানমণ্ডি, ঢাকা"
                  {...register('addressBn')}
                  className="form-input"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Emergency Contacts */}
          <div className="form-section">
            <div className="flex-between">
              <h3 className="section-title">3. Emergency Contacts</h3>
              <button
                type="button"
                onClick={() => appendContact({ name: '', relationship: '', phone: '+880' })}
                className="btn btn-secondary btn-sm"
              >
                + Add Emergency Contact
              </button>
            </div>

            {contactFields.map((field, index) => (
              <div key={field.id} className="sub-form-row">
                <div className="form-grid-3">
                  <div className="form-group">
                    <label className="form-label">Contact Name *</label>
                    <input
                      type="text"
                      placeholder="Relationship Contact Name"
                      {...register(`emergencyContacts.${index}.name` as const)}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Relationship *</label>
                    <input
                      type="text"
                      placeholder="Spouse, Parent, Sibling"
                      {...register(`emergencyContacts.${index}.relationship` as const)}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group relative-remove">
                    <label className="form-label">Phone *</label>
                    <div className="flex-row">
                      <input
                        type="text"
                        placeholder="+8801700000000"
                        {...register(`emergencyContacts.${index}.phone` as const)}
                        className="form-input flex-grow-1"
                      />
                      <button
                        type="button"
                        onClick={() => removeContact(index)}
                        className="remove-row-btn"
                        title="Remove Contact"
                      >
                        &times;
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Section 4: Clinical Allergies */}
          <div className="form-section">
            <div className="flex-between">
              <h3 className="section-title">4. Active Clinical Allergies</h3>
              <button
                type="button"
                onClick={() => appendAllergy({ allergen: '', reaction: '', severity: 'MODERATE' })}
                className="btn btn-secondary btn-sm"
              >
                + Add Allergy Record
              </button>
            </div>

            {allergyFields.map((field, index) => (
              <div key={field.id} className="sub-form-row">
                <div className="form-grid-3">
                  <div className="form-group">
                    <label className="form-label">Allergen (Drug / Food / Environment) *</label>
                    <input
                      type="text"
                      placeholder="Penicillin, Peanuts"
                      {...register(`allergies.${index}.allergen` as const)}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Reaction Details</label>
                    <input
                      type="text"
                      placeholder="Skin rash, anaphylaxis"
                      {...register(`allergies.${index}.reaction` as const)}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group relative-remove">
                    <label className="form-label">Severity Level</label>
                    <div className="flex-row">
                      <select
                        {...register(`allergies.${index}.severity` as const)}
                        className="form-input flex-grow-1"
                      >
                        <option value="MILD">Mild</option>
                        <option value="MODERATE">Moderate</option>
                        <option value="SEVERE">Severe</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => removeAllergy(index)}
                        className="remove-row-btn"
                        title="Remove Allergy"
                      >
                        &times;
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Submit Actions */}
          <div className="form-actions-bar">
            <button
              type="button"
              onClick={() => router.push(`/${locale}/patients`)}
              className="btn btn-secondary"
            >
              {commonT('cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || registerMutation.isPending}
              className="btn btn-primary"
            >
              {isSubmitting || registerMutation.isPending ? 'Registering...' : 'Register Patient'}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .new-patient-container {
          max-width: 800px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .settings-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 4px;
        }
        .settings-title {
          font-size: 22px;
          font-weight: 700;
          color: var(--text-primary);
        }
        .settings-subtitle {
          font-size: 13.5px;
          color: var(--text-muted);
          margin-top: 2px;
        }
        .form-grid {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .form-section {
          display: flex;
          flex-direction: column;
          gap: 16px;
          border-bottom: 1px solid var(--border);
          padding-bottom: 24px;
        }
        .form-section:last-of-type {
          border-bottom: none;
          padding-bottom: 0;
        }
        .section-title {
          font-size: 15px;
          font-weight: 700;
          color: var(--text-primary);
        }
        .flex-between {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .form-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .form-grid-3 {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 16px;
        }
        @media (max-width: 768px) {
          .form-grid-2, .form-grid-3 {
            grid-template-columns: 1fr;
          }
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .form-label {
          font-size: 12.5px;
          font-weight: 600;
          color: var(--text-primary);
        }
        .form-input {
          height: 38px;
          padding: 0 12px;
          border: 1.5px solid var(--border);
          border-radius: var(--radius);
          font-size: 13.5px;
          color: var(--text-primary);
          outline: none;
          transition: border-color 150ms;
          background: white;
        }
        .form-input:focus {
          border-color: var(--brand-blue);
          box-shadow: 0 0 0 3px rgba(51, 102, 204, 0.12);
        }
        .form-input-error {
          border-color: var(--danger);
        }
        .form-error-msg {
          font-size: 11.5px;
          color: var(--danger);
        }
        .sub-form-row {
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          padding: 16px;
          border-radius: var(--radius-lg);
          margin-bottom: 8px;
        }
        .flex-grow-1 {
          flex-grow: 1;
        }
        .relative-remove .flex-row {
          display: flex;
          gap: 10px;
        }
        .remove-row-btn {
          width: 38px;
          height: 38px;
          background: #FEF2F2;
          color: #DC2626;
          border: 1px solid #FECACA;
          border-radius: var(--radius);
          font-size: 20px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: background 150ms;
        }
        .remove-row-btn:hover {
          background: #FEE2E2;
        }
        .form-actions-bar {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 8px;
        }
        .btn {
          height: 38px;
          padding: 0 20px;
          border-radius: var(--radius);
          font-size: 13.5px;
          font-weight: 600;
          cursor: pointer;
          border: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: opacity 150ms;
        }
        .btn:hover {
          opacity: 0.9;
        }
        .btn-sm {
          height: 30px;
          padding: 0 12px;
          font-size: 12px;
        }
        .btn-primary {
          background: linear-gradient(135deg, var(--brand-blue), var(--brand-blue-light));
          color: white;
        }
        .btn-secondary {
          background: var(--bg-tertiary);
          color: var(--text-secondary);
          border: 1px solid var(--border);
        }
      `}</style>
    </div>
  );
}
