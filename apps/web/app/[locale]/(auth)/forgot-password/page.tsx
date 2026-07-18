'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { gqlClient, gql } from '@/lib/graphql-client';

const FORGOT_PASSWORD_MUTATION = gql`
  mutation ForgotPassword($email: String!) {
    forgotPassword(email: $email)
  }
`;

const schema = z.object({
  email: z.string().email('Invalid email address'),
});

type FormInput = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const t = useTranslations('auth');
  const router = useRouter();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormInput>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormInput) => {
    setError(null);
    setSuccess(false);
    try {
      await gqlClient.request(FORGOT_PASSWORD_MUTATION, { email: data.email });
      setSuccess(true);
    } catch (err: any) {
      const msg = err?.response?.errors?.[0]?.message ?? t('error');
      setError(msg);
    }
  };

  return (
    <div className="forgot-password-page">
      <div className="forgot-password-card">
        {/* Logo */}
        <div className="forgot-password-logo">
          <div className="forgot-password-logo-icon">
            <span>A</span>
          </div>
          <div>
            <div className="forgot-password-logo-name">Aurevix</div>
            <div className="forgot-password-logo-sub">Hospital Management System</div>
          </div>
        </div>

        <h1 className="forgot-password-title">{t('forgotPasswordTitle')}</h1>
        <p className="forgot-password-subtitle">{t('forgotPasswordSubtitle')}</p>

        {error && (
          <div className="forgot-password-alert error" role="alert">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            {error}
          </div>
        )}

        {success && (
          <div className="forgot-password-alert success" role="alert">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            {t('successResetLink')}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="forgot-password-form" noValidate>
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              {t('email')}
            </label>
            <input
              id="email"
              type="email"
              {...register('email')}
              className={`form-input ${errors.email ? 'form-input-error' : ''}`}
              placeholder="name@example.com"
              autoComplete="email"
              autoFocus
              disabled={success}
            />
            {errors.email && <span className="form-error-msg">{errors.email.message}</span>}
          </div>

          <button
            type="submit"
            id="forgot-password-submit-btn"
            disabled={isSubmitting || success}
            className="forgot-password-btn"
          >
            {isSubmitting ? (
              <span className="btn-loading">
                <span className="spinner" />
                Sending...
              </span>
            ) : (
              t('sendResetLink')
            )}
          </button>
        </form>

        <div className="forgot-password-footer">
          <button onClick={() => router.push('/en/login')} className="back-link">
            &larr; {t('backToLogin')}
          </button>
        </div>
      </div>

      <style>{`
        .forgot-password-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #0F1B3D 0%, #1E3056 50%, #0F1B3D 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }
        .forgot-password-card {
          background: white;
          border-radius: 16px;
          padding: 40px;
          width: 100%;
          max-width: 420px;
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.4);
        }
        .forgot-password-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 28px;
        }
        .forgot-password-logo-icon {
          width: 44px;
          height: 44px;
          background: linear-gradient(135deg, #3366CC, #5B8DEF);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          font-weight: 800;
          color: white;
        }
        .forgot-password-logo-name {
          font-size: 20px;
          font-weight: 700;
          color: #0F1B3D;
        }
        .forgot-password-logo-sub {
          font-size: 11px;
          color: #64748B;
        }
        .forgot-password-title {
          font-size: 24px;
          font-weight: 700;
          color: #0F1B3D;
          margin-bottom: 6px;
        }
        .forgot-password-subtitle {
          font-size: 14px;
          color: #64748B;
          margin-bottom: 24px;
        }
        .forgot-password-alert {
          border-radius: 8px;
          padding: 10px 14px;
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
        }
        .forgot-password-alert.error {
          background: #FEF2F2;
          color: #DC2626;
          border: 1px solid #FECACA;
        }
        .forgot-password-alert.success {
          background: #ECFDF5;
          color: #10B981;
          border: 1px solid #A7F3D0;
        }
        .forgot-password-form { display: flex; flex-direction: column; gap: 16px; }
        .form-group { display: flex; flex-direction: column; gap: 6px; }
        .form-label { font-size: 13px; font-weight: 500; color: #374151; }
        .form-input {
          height: 40px;
          padding: 0 12px;
          border: 1.5px solid #E2E8F0;
          border-radius: 8px;
          font-size: 14px;
          color: #0F1B3D;
          outline: none;
          transition: border-color 150ms;
        }
        .form-input:focus { border-color: #3366CC; box-shadow: 0 0 0 3px rgba(51,102,204,0.12); }
        .form-input:disabled { background: #F1F5F9; color: #94A3B8; cursor: not-allowed; }
        .form-input-error { border-color: #EF4444; }
        .form-error-msg { font-size: 12px; color: #EF4444; }
        .forgot-password-btn {
          height: 42px;
          background: linear-gradient(135deg, #3366CC, #5B8DEF);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 150ms;
          margin-top: 4px;
        }
        .forgot-password-btn:disabled { opacity: 0.7; cursor: not-allowed; }
        .forgot-password-btn:not(:disabled):hover { opacity: 0.9; }
        .btn-loading { display: flex; align-items: center; justify-content: center; gap: 8px; }
        .spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .forgot-password-footer {
          margin-top: 20px;
          display: flex;
          justify-content: center;
        }
        .back-link {
          background: none;
          border: none;
          color: #3366CC;
          font-size: 13.5px;
          font-weight: 500;
          cursor: pointer;
        }
        .back-link:hover { text-decoration: underline; }
      `}</style>
    </div>
  );
}
