'use client';

import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAuthenticatedClient, gql } from '@/lib/graphql-client';

const ME_QUERY = gql`
  query Me {
    me {
      id
      email
      firstName
      lastName
      role
      mfaEnabled
    }
  }
`;

const GENERATE_MFA_SECRET_MUTATION = gql`
  mutation GenerateMfaSecret {
    generateMfaSecret {
      secret
      qrCodeUrl
    }
  }
`;

const ENABLE_MFA_MUTATION = gql`
  mutation EnableMfa($token: String!) {
    enableMfa(token: $token)
  }
`;

const DISABLE_MFA_MUTATION = gql`
  mutation DisableMfa($token: String!) {
    disableMfa(token: $token)
  }
`;

const mfaCodeSchema = z.object({
  code: z.string().regex(/^\d{6}$/, 'Code must be exactly 6 digits'),
});

type MfaCodeInput = z.infer<typeof mfaCodeSchema>;

export default function SecuritySettingsPage() {
  const t = useTranslations('settings');
  const authT = useTranslations('auth');
  const queryClient = useQueryClient();
  const [mfaSetupData, setMfaSetupData] = useState<{ secret: string; qrCodeUrl: string } | null>(
    null,
  );
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const client = getAuthenticatedClient();

  // Fetch current user details including MFA status
  const { data: meData, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const res: any = await client.request(ME_QUERY);
      return res.me;
    },
  });

  // Generate MFA Secret mutation
  const generateSecretMutation = useMutation({
    mutationFn: async () => {
      const res: any = await client.request(GENERATE_MFA_SECRET_MUTATION);
      return res.generateMfaSecret;
    },
    onSuccess: (data) => {
      setMfaSetupData(data);
      setErrorMsg(null);
    },
    onError: (err: any) => {
      setErrorMsg(err?.response?.errors?.[0]?.message ?? 'Failed to generate MFA secret');
    },
  });

  // Enable MFA mutation
  const enableMfaMutation = useMutation({
    mutationFn: async (token: string) => {
      await client.request(ENABLE_MFA_MUTATION, { token });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      setMfaSetupData(null);
      setSuccessMsg('MFA has been successfully enabled on your account.');
      setErrorMsg(null);
      resetEnable();
    },
    onError: (err: any) => {
      setErrorMsg(err?.response?.errors?.[0]?.message ?? 'Failed to enable MFA. Check your code.');
    },
  });

  // Disable MFA mutation
  const disableMfaMutation = useMutation({
    mutationFn: async (token: string) => {
      await client.request(DISABLE_MFA_MUTATION, { token });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      setSuccessMsg('MFA has been successfully disabled on your account.');
      setErrorMsg(null);
      resetDisable();
    },
    onError: (err: any) => {
      setErrorMsg(err?.response?.errors?.[0]?.message ?? 'Failed to disable MFA. Check your code.');
    },
  });

  const {
    register: registerEnable,
    handleSubmit: handleEnableSubmit,
    formState: { errors: errorsEnable, isSubmitting: isEnabling },
    reset: resetEnable,
  } = useForm<MfaCodeInput>({
    resolver: zodResolver(mfaCodeSchema),
  });

  const {
    register: registerDisable,
    handleSubmit: handleDisableSubmit,
    formState: { errors: errorsDisable, isSubmitting: isDisabling },
    reset: resetDisable,
  } = useForm<MfaCodeInput>({
    resolver: zodResolver(mfaCodeSchema),
  });

  if (isLoading) {
    return <div className="p-6">Loading security settings...</div>;
  }

  const user = meData;
  const isMfaEnabled = user?.mfaEnabled;

  return (
    <div className="security-settings-container">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">{t('security.title')}</h2>
        </div>
        <div className="card-body">
          <div className="security-section">
            <div className="security-info">
              <h3 className="security-sub-title">{t('security.mfaTitle')}</h3>
              <p className="security-description">{t('security.mfaDescription')}</p>

              <div className="mfa-status-badge">
                <span>{t('security.status')}: </span>
                {isMfaEnabled ? (
                  <span className="badge badge-success">{t('security.mfaEnabled')}</span>
                ) : (
                  <span className="badge badge-danger">{t('security.mfaDisabled')}</span>
                )}
              </div>
            </div>

            {errorMsg && <div className="alert error">{errorMsg}</div>}
            {successMsg && <div className="alert success">{successMsg}</div>}

            {/* MFA is Disabled & Setup is Not Triggered Yet */}
            {!isMfaEnabled && !mfaSetupData && (
              <div className="mfa-actions">
                <button
                  onClick={() => {
                    setSuccessMsg(null);
                    generateSecretMutation.mutate();
                  }}
                  disabled={generateSecretMutation.isPending}
                  className="btn btn-primary"
                >
                  {generateSecretMutation.isPending ? 'Generating QR...' : t('security.enableMfa')}
                </button>
              </div>
            )}

            {/* MFA is Disabled & Setup is Active (QR Displayed) */}
            {!isMfaEnabled && mfaSetupData && (
              <div className="mfa-setup-box">
                <p className="setup-instructions">{t('security.setupInstructions')}</p>

                <div className="qr-container">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={mfaSetupData.qrCodeUrl} alt="MFA QR Code" className="qr-image" />
                  <div className="manual-secret">
                    <span>Secret Key:</span> <code>{mfaSetupData.secret}</code>
                  </div>
                </div>

                <form
                  onSubmit={handleEnableSubmit((data) => enableMfaMutation.mutate(data.code))}
                  className="mfa-verification-form"
                  noValidate
                >
                  <div className="form-group">
                    <label htmlFor="enableCode" className="form-label">
                      {t('security.enterCode')}
                    </label>
                    <input
                      id="enableCode"
                      type="text"
                      maxLength={6}
                      {...registerEnable('code')}
                      className={`form-input ${errorsEnable.code ? 'form-input-error' : ''}`}
                      placeholder="000000"
                    />
                    {errorsEnable.code && (
                      <span className="form-error-msg">{errorsEnable.code.message}</span>
                    )}
                  </div>

                  <div className="form-actions">
                    <button
                      type="button"
                      onClick={() => setMfaSetupData(null)}
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                    <button type="submit" disabled={isEnabling} className="btn btn-primary">
                      {isEnabling ? 'Enabling...' : t('security.verifyAndEnable')}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* MFA is Enabled - Display Deactivation Panel */}
            {isMfaEnabled && (
              <div className="mfa-deactivation-box">
                <form
                  onSubmit={handleDisableSubmit((data) => disableMfaMutation.mutate(data.code))}
                  className="mfa-verification-form"
                  noValidate
                >
                  <p className="deactivate-warning">
                    To disable Multi-Factor Authentication, please scan the code from your device.
                  </p>

                  <div className="form-group">
                    <label htmlFor="disableCode" className="form-label">
                      {t('security.enterCode')}
                    </label>
                    <input
                      id="disableCode"
                      type="text"
                      maxLength={6}
                      {...registerDisable('code')}
                      className={`form-input ${errorsDisable.code ? 'form-input-error' : ''}`}
                      placeholder="000000"
                    />
                    {errorsDisable.code && (
                      <span className="form-error-msg">{errorsDisable.code.message}</span>
                    )}
                  </div>

                  <div className="form-actions">
                    <button type="submit" disabled={isDisabling} className="btn btn-danger">
                      {isDisabling ? 'Disabling...' : t('security.verifyAndDisable')}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .security-settings-container {
          max-width: 600px;
          margin: 0 auto;
        }
        .security-section {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .security-sub-title {
          font-size: 16px;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 8px;
        }
        .security-description {
          font-size: 13.5px;
          color: var(--text-secondary);
          line-height: 1.5;
          margin-bottom: 16px;
        }
        .mfa-status-badge {
          font-size: 13.5px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .alert {
          border-radius: var(--radius);
          padding: 10px 14px;
          font-size: 13px;
          margin-bottom: 16px;
        }
        .alert.error {
          background: var(--danger-bg);
          color: var(--danger);
          border: 1px solid rgba(239, 68, 68, 0.2);
        }
        .alert.success {
          background: var(--success-bg);
          color: var(--success);
          border: 1px solid rgba(16, 185, 129, 0.2);
        }
        .mfa-setup-box, .mfa-deactivation-box {
          border-top: 1px solid var(--border);
          padding-top: 20px;
          margin-top: 10px;
        }
        .setup-instructions {
          font-size: 13px;
          color: var(--text-secondary);
          margin-bottom: 16px;
        }
        .qr-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
          padding: 16px;
          background: var(--bg-secondary);
          border-radius: var(--radius-lg);
          border: 1px dashed var(--border-strong);
        }
        .qr-image {
          width: 180px;
          height: 180px;
        }
        .manual-secret {
          font-size: 12px;
          color: var(--text-secondary);
        }
        .manual-secret code {
          background: var(--bg-tertiary);
          padding: 2px 6px;
          border-radius: 4px;
          font-family: var(--font-mono);
          font-weight: 600;
          color: var(--brand-blue);
        }
        .mfa-verification-form {
          max-width: 320px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .form-label {
          font-size: 13px;
          font-weight: 500;
          color: var(--text-primary);
        }
        .form-input {
          height: 38px;
          padding: 0 12px;
          border: 1.5px solid var(--border);
          border-radius: var(--radius);
          font-size: 14px;
          color: var(--text-primary);
          outline: none;
          transition: border-color 150ms;
        }
        .form-input:focus {
          border-color: var(--brand-blue);
          box-shadow: 0 0 0 3px rgba(51, 102, 204, 0.12);
        }
        .form-input-error {
          border-color: var(--danger);
        }
        .form-error-msg {
          font-size: 12px;
          color: var(--danger);
        }
        .form-actions {
          display: flex;
          gap: 8px;
        }
        .btn {
          height: 38px;
          padding: 0 16px;
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
        .btn-secondary {
          background: var(--bg-tertiary);
          color: var(--text-secondary);
          border: 1px solid var(--border);
        }
        .btn-danger {
          background: var(--danger);
          color: white;
        }
        .deactivate-warning {
          font-size: 13px;
          color: var(--text-secondary);
          margin-bottom: 16px;
        }
      `}</style>
    </div>
  );
}
