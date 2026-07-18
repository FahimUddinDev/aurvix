'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { loginSchema, type LoginInput } from '@aurevix/validators';
import { useAuthStore } from '@/stores/auth.store';
import { getAuthenticatedClient, gql } from '@/lib/graphql-client';

const LOGIN_MUTATION = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      accessToken
      refreshToken
      user {
        id
        email
        firstName
        lastName
        role
        hospitalId
        locale
      }
    }
  }
`;

export default function LoginPage() {
  const t = useTranslations('auth');
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setError(null);
    try {
      const client = getAuthenticatedClient();
      const result: any = await client.request(LOGIN_MUTATION, { input: data });
      const { accessToken, refreshToken, user } = result.login;
      setAuth(user, accessToken, refreshToken);
      router.push('/en/dashboard');
    } catch (err: any) {
      const msg = err?.response?.errors?.[0]?.message ?? t('invalidCredentials');
      setError(msg);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Logo */}
        <div className="login-logo">
          <div className="login-logo-icon">
            <span>A</span>
          </div>
          <div>
            <div className="login-logo-name">Aurevix</div>
            <div className="login-logo-sub">Hospital Management System</div>
          </div>
        </div>

        <h1 className="login-title">Welcome back</h1>
        <p className="login-subtitle">Sign in to your account</p>

        {error && (
          <div className="login-error" role="alert">
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

        <form onSubmit={handleSubmit(onSubmit)} className="login-form" noValidate>
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              {t('email')}
            </label>
            <input
              id="email"
              type="email"
              {...register('email')}
              className={`form-input ${errors.email ? 'form-input-error' : ''}`}
              placeholder="admin@aurevix.com"
              autoComplete="email"
              autoFocus
            />
            {errors.email && <span className="form-error-msg">{errors.email.message}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              {t('password')}
            </label>
            <input
              id="password"
              type="password"
              {...register('password')}
              className={`form-input ${errors.password ? 'form-input-error' : ''}`}
              placeholder="••••••••"
              autoComplete="current-password"
            />
            {errors.password && <span className="form-error-msg">{errors.password.message}</span>}
          </div>

          <div className="login-options">
            <a href="#" className="forgot-link">
              {t('forgotPassword')}
            </a>
          </div>

          <button type="submit" id="login-submit-btn" disabled={isSubmitting} className="login-btn">
            {isSubmitting ? (
              <span className="login-btn-loading">
                <span className="spinner" />
                Signing in...
              </span>
            ) : (
              t('loginButton')
            )}
          </button>
        </form>

        <div className="login-demo">
          <p>
            Demo credentials: <code>admin@aurevix.com</code> / <code>Demo@123</code>
          </p>
        </div>
      </div>

      <style>{`
        .login-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #0F1B3D 0%, #1E3056 50%, #0F1B3D 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }
        .login-card {
          background: white;
          border-radius: 16px;
          padding: 40px;
          width: 100%;
          max-width: 420px;
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.4);
        }
        .login-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 28px;
        }
        .login-logo-icon {
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
        .login-logo-name {
          font-size: 20px;
          font-weight: 700;
          color: #0F1B3D;
        }
        .login-logo-sub {
          font-size: 11px;
          color: #64748B;
        }
        .login-title {
          font-size: 24px;
          font-weight: 700;
          color: #0F1B3D;
          margin-bottom: 6px;
        }
        .login-subtitle {
          font-size: 14px;
          color: #64748B;
          margin-bottom: 24px;
        }
        .login-error {
          background: #FEF2F2;
          color: #DC2626;
          border: 1px solid #FECACA;
          border-radius: 8px;
          padding: 10px 14px;
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
        }
        .login-form { display: flex; flex-direction: column; gap: 16px; }
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
        .form-input-error { border-color: #EF4444; }
        .form-error-msg { font-size: 12px; color: #EF4444; }
        .login-options { display: flex; justify-content: flex-end; margin-top: -8px; }
        .forgot-link { font-size: 13px; color: #3366CC; text-decoration: none; }
        .forgot-link:hover { text-decoration: underline; }
        .login-btn {
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
        .login-btn:disabled { opacity: 0.7; cursor: not-allowed; }
        .login-btn:not(:disabled):hover { opacity: 0.9; }
        .login-btn-loading { display: flex; align-items: center; justify-content: center; gap: 8px; }
        .spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .login-demo {
          margin-top: 20px;
          padding: 12px;
          background: #F8FAFC;
          border-radius: 8px;
          font-size: 12px;
          color: #64748B;
          text-align: center;
        }
        .login-demo code {
          background: #E2E8F0;
          padding: 1px 5px;
          border-radius: 4px;
          font-family: monospace;
          color: #0F1B3D;
        }
      `}</style>
    </div>
  );
}
