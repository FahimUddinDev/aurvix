'use client';

import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useState, Suspense } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { resetPasswordSchema, type ResetPasswordInput } from '@aurevix/validators';
import { gqlClient, gql } from '@/lib/graphql-client';

const RESET_PASSWORD_MUTATION = gql`
  mutation ResetPassword($token: String!, $password: String!) {
    resetPassword(token: $token, password: $password)
  }
`;

function ResetPasswordForm() {
  const t = useTranslations('auth');
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token,
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: ResetPasswordInput) => {
    setError(null);
    setSuccess(false);
    if (!data.token) {
      setError('Invalid or missing reset token');
      return;
    }
    try {
      await gqlClient.request(RESET_PASSWORD_MUTATION, {
        token: data.token,
        password: data.newPassword,
      });
      setSuccess(true);
      setTimeout(() => {
        router.push('/en/login');
      }, 3000);
    } catch (err: any) {
      const msg = err?.response?.errors?.[0]?.message ?? t('error');
      setError(msg);
    }
  };

  return (
    <div className="reset-password-card">
      {/* Logo */}
      <div className="reset-password-logo">
        <div className="reset-password-logo-icon">
          <span>A</span>
        </div>
        <div>
          <div className="reset-password-logo-name">Aurevix</div>
          <div className="reset-password-logo-sub">Hospital Management System</div>
        </div>
      </div>

      <h1 className="reset-password-title">{t('resetPasswordTitle')}</h1>
      <p className="reset-password-subtitle">{t('resetPasswordSubtitle')}</p>

      {!token && (
        <div className="reset-password-alert error" role="alert">
          Missing reset token in URL. Please request a new password reset link.
        </div>
      )}

      {error && (
        <div className="reset-password-alert error" role="alert">
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
        <div className="reset-password-alert success" role="alert">
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
          {t('successPasswordReset')}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="reset-password-form" noValidate>
        {/* Hidden token field */}
        <input type="hidden" {...register('token')} />

        <div className="form-group">
          <label htmlFor="newPassword" className="form-label">
            {t('newPassword')}
          </label>
          <input
            id="newPassword"
            type="password"
            {...register('newPassword')}
            className={`form-input ${errors.newPassword ? 'form-input-error' : ''}`}
            placeholder="••••••••"
            disabled={!token || success}
          />
          {errors.newPassword && (
            <span className="form-error-msg">{errors.newPassword.message}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword" className="form-label">
            {t('confirmPassword')}
          </label>
          <input
            id="confirmPassword"
            type="password"
            {...register('confirmPassword')}
            className={`form-input ${errors.confirmPassword ? 'form-input-error' : ''}`}
            placeholder="••••••••"
            disabled={!token || success}
          />
          {errors.confirmPassword && (
            <span className="form-error-msg">{errors.confirmPassword.message}</span>
          )}
        </div>

        <button
          type="submit"
          id="reset-password-submit-btn"
          disabled={isSubmitting || !token || success}
          className="reset-password-btn"
        >
          {isSubmitting ? (
            <span className="btn-loading">
              <span className="spinner" />
              Resetting...
            </span>
          ) : (
            t('resetPasswordButton')
          )}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="reset-password-page">
      <Suspense fallback={<div className="text-white">Loading...</div>}>
        <ResetPasswordForm />
      </Suspense>

      <style>{`
        .reset-password-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #0F1B3D 0%, #1E3056 50%, #0F1B3D 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }
        .reset-password-card {
          background: white;
          border-radius: 16px;
          padding: 40px;
          width: 100%;
          max-width: 420px;
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.4);
        }
        .reset-password-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 28px;
        }
        .reset-password-logo-icon {
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
        .reset-password-logo-name {
          font-size: 20px;
          font-weight: 700;
          color: #0F1B3D;
        }
        .reset-password-logo-sub {
          font-size: 11px;
          color: #64748B;
        }
        .reset-password-title {
          font-size: 24px;
          font-weight: 700;
          color: #0F1B3D;
          margin-bottom: 6px;
        }
        .reset-password-subtitle {
          font-size: 14px;
          color: #64748B;
          margin-bottom: 24px;
        }
        .reset-password-alert {
          border-radius: 8px;
          padding: 10px 14px;
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
        }
        .reset-password-alert.error {
          background: #FEF2F2;
          color: #DC2626;
          border: 1px solid #FECACA;
        }
        .reset-password-alert.success {
          background: #ECFDF5;
          color: #10B981;
          border: 1px solid #A7F3D0;
        }
        .reset-password-form { display: flex; flex-direction: column; gap: 16px; }
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
        .reset-password-btn {
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
        .reset-password-btn:disabled { opacity: 0.7; cursor: not-allowed; }
        .reset-password-btn:not(:disabled):hover { opacity: 0.9; }
        .btn-loading { display: flex; align-items: center; justify-content: center; gap: 8px; }
        .spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
