'use client';

import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAuthenticatedClient, gql } from '@/lib/graphql-client';
import { toast } from 'sonner';

// Validation imports
import { updateHospitalSchema, type UpdateHospitalInput } from '@aurevix/validators';

const HOSPITAL_QUERY = gql`
  query Hospital {
    hospital {
      id
      name
      nameBn
      address
      addressBn
      phone
      email
      website
      logoUrl
      timezone
      currency
      uhidPrefix
      fiscalYearStart
      isActive
    }
  }
`;

const UPDATE_HOSPITAL_MUTATION = gql`
  mutation UpdateHospital($input: UpdateHospitalInput!) {
    updateHospital(input: $input) {
      id
      name
    }
  }
`;

export default function HospitalSettingsPage() {
  const t = useTranslations('settings');
  const commonT = useTranslations('common');
  const queryClient = useQueryClient();

  const client = getAuthenticatedClient();

  // Query hospital configurations
  const { data: hospitalData, isLoading } = useQuery({
    queryKey: ['hospital'],
    queryFn: async () => {
      const res: any = await client.request(HOSPITAL_QUERY);
      return res.hospital;
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<UpdateHospitalInput>({
    resolver: zodResolver(updateHospitalSchema),
    defaultValues: {
      name: '',
      nameBn: '',
      address: '',
      addressBn: '',
      phone: '',
      email: '',
      website: '',
      timezone: 'Asia/Dhaka',
      currency: 'BDT',
      uhidPrefix: '',
    },
  });

  // Load defaults once data is fetched
  useEffect(() => {
    if (hospitalData) {
      reset({
        name: hospitalData.name || '',
        nameBn: hospitalData.nameBn || '',
        address: hospitalData.address || '',
        addressBn: hospitalData.addressBn || '',
        phone: hospitalData.phone || '',
        email: hospitalData.email || '',
        website: hospitalData.website || '',
        timezone: hospitalData.timezone || 'Asia/Dhaka',
        currency: hospitalData.currency || 'BDT',
        uhidPrefix: hospitalData.uhidPrefix || '',
      });
    }
  }, [hospitalData, reset]);

  // Mutation
  const updateMutation = useMutation({
    mutationFn: async (input: UpdateHospitalInput) => {
      await client.request(UPDATE_HOSPITAL_MUTATION, { input });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hospital'] });
      toast.success(t('hospital.updateSuccess'));
    },
    onError: (err: any) => {
      toast.error(err?.response?.errors?.[0]?.message ?? 'Failed to update hospital settings');
    },
  });

  const onSubmit = (data: UpdateHospitalInput) => {
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return <div className="p-6">Loading hospital configurations...</div>;
  }

  return (
    <div className="hospital-settings-container">
      {/* Page Header */}
      <div className="settings-header">
        <div>
          <h1 className="settings-title">{t('hospital.title')}</h1>
          <p className="settings-subtitle">
            Manage hospital profile, localization settings, and core prefixes
          </p>
        </div>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit(onSubmit)} className="card-body form-grid" noValidate>
          {/* Main Info */}
          <div className="form-section">
            <h3 className="section-title">Profile Information</h3>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">{t('hospital.name')} (EN)</label>
                <input
                  type="text"
                  {...register('name')}
                  className={`form-input ${errors.name ? 'form-input-error' : ''}`}
                  placeholder="Aurevix Medical Center"
                />
                {errors.name && <span className="form-error-msg">{errors.name.message}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">{t('hospital.name')} (BN)</label>
                <input
                  type="text"
                  {...register('nameBn')}
                  className="form-input"
                  placeholder="অরেভিক্স মেডিকেল সেন্টার"
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Hospital Address (EN)</label>
                <input
                  type="text"
                  {...register('address')}
                  className="form-input"
                  placeholder="House 12, Road 5, Dhanmondi, Dhaka"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Hospital Address (BN)</label>
                <input
                  type="text"
                  {...register('addressBn')}
                  className="form-input"
                  placeholder="বাসা ১২, রোড ৫, ধানমণ্ডি, ঢাকা"
                />
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div className="form-section">
            <h3 className="section-title">Contact & Localization</h3>
            <div className="form-grid-3">
              <div className="form-group">
                <label className="form-label">{t('hospital.phone')}</label>
                <input
                  type="text"
                  {...register('phone')}
                  className={`form-input ${errors.phone ? 'form-input-error' : ''}`}
                  placeholder="+8801700000000"
                />
                {errors.phone && <span className="form-error-msg">{errors.phone.message}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  {...register('email')}
                  className={`form-input ${errors.email ? 'form-input-error' : ''}`}
                  placeholder="contact@aurevix.com"
                />
                {errors.email && <span className="form-error-msg">{errors.email.message}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Website URL</label>
                <input
                  type="text"
                  {...register('website')}
                  className={`form-input ${errors.website ? 'form-input-error' : ''}`}
                  placeholder="https://aurevix.com"
                />
                {errors.website && <span className="form-error-msg">{errors.website.message}</span>}
              </div>
            </div>

            <div className="form-grid-3">
              <div className="form-group">
                <label className="form-label">Timezone</label>
                <select {...register('timezone')} className="form-input">
                  <option value="Asia/Dhaka">Asia/Dhaka (GMT+6)</option>
                  <option value="UTC">Coordinated Universal Time (UTC)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Default Currency</label>
                <select {...register('currency')} className="form-input">
                  <option value="BDT">Bangladeshi Taka (৳)</option>
                  <option value="USD">US Dollar ($)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Patient UHID Prefix</label>
                <input
                  type="text"
                  {...register('uhidPrefix')}
                  className={`form-input ${errors.uhidPrefix ? 'form-input-error' : ''}`}
                  placeholder="AVX"
                />
                {errors.uhidPrefix && (
                  <span className="form-error-msg">{errors.uhidPrefix.message}</span>
                )}
              </div>
            </div>
          </div>

          <div className="form-actions-bar">
            <button
              type="submit"
              disabled={isSubmitting || updateMutation.isPending}
              className="btn btn-primary"
            >
              {isSubmitting || updateMutation.isPending ? 'Saving...' : commonT('save')}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .hospital-settings-container {
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
        .btn-primary {
          background: linear-gradient(135deg, var(--brand-blue), var(--brand-blue-light));
          color: white;
        }
      `}</style>
    </div>
  );
}
