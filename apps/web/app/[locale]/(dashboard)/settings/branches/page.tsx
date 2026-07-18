'use client';

import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAuthenticatedClient, gql } from '@/lib/graphql-client';
import { toast } from 'sonner';

// Validations
import {
  createBranchSchema,
  updateBranchSchema,
  type CreateBranchInput,
  type UpdateBranchInput,
} from '@aurevix/validators';

const BRANCHES_QUERY = gql`
  query Branches {
    branches {
      id
      hospitalId
      name
      nameBn
      address
      phone
      isActive
      createdAt
    }
  }
`;

const CREATE_BRANCH_MUTATION = gql`
  mutation CreateBranch($input: CreateBranchInput!) {
    createBranch(input: $input) {
      id
      name
    }
  }
`;

const UPDATE_BRANCH_MUTATION = gql`
  mutation UpdateBranch($id: ID!, $input: UpdateBranchInput!) {
    updateBranch(id: $id, input: $input) {
      id
      name
    }
  }
`;

export default function BranchesSettingsPage() {
  const t = useTranslations('settings');
  const commonT = useTranslations('common');
  const queryClient = useQueryClient();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<any>(null);

  const client = getAuthenticatedClient();

  // Queries
  const { data: branchesData, isLoading } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const res: any = await client.request(BRANCHES_QUERY);
      return res.branches;
    },
  });

  // Mutations
  const createBranchMutation = useMutation({
    mutationFn: async (input: CreateBranchInput) => {
      await client.request(CREATE_BRANCH_MUTATION, { input });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      toast.success(t('branches.createSuccess'));
      setIsCreateOpen(false);
      resetCreate();
    },
    onError: (err: any) => {
      toast.error(err?.response?.errors?.[0]?.message ?? 'Failed to create branch');
    },
  });

  const updateBranchMutation = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateBranchInput }) => {
      await client.request(UPDATE_BRANCH_MUTATION, { id, input });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      toast.success(t('branches.updateSuccess'));
      setEditingBranch(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.errors?.[0]?.message ?? 'Failed to update branch');
    },
  });

  // React Hook Form for Create Branch
  const {
    register: registerCreate,
    handleSubmit: handleCreateSubmit,
    formState: { errors: errorsCreate, isSubmitting: isCreating },
    reset: resetCreate,
  } = useForm<CreateBranchInput>({
    resolver: zodResolver(createBranchSchema),
    defaultValues: {
      name: '',
      nameBn: '',
      address: '',
      phone: '',
    },
  });

  // React Hook Form for Edit Branch
  const {
    register: registerEdit,
    handleSubmit: handleEditSubmit,
    formState: { errors: errorsEdit, isSubmitting: isUpdating },
    setValue: setEditValue,
  } = useForm<UpdateBranchInput>({
    resolver: zodResolver(updateBranchSchema),
  });

  const openEditModal = (branch: any) => {
    setEditingBranch(branch);
    setEditValue('name', branch.name);
    setEditValue('nameBn', branch.nameBn || '');
    setEditValue('address', branch.address || '');
    setEditValue('phone', branch.phone || '');
    setEditValue('isActive', branch.isActive);
  };

  return (
    <div className="branches-settings-container">
      {/* Page Header */}
      <div className="settings-header">
        <div>
          <h1 className="settings-title">{t('branches.title')}</h1>
          <p className="settings-subtitle">
            Configure separate geographical hospital branches and centers
          </p>
        </div>
        <button onClick={() => setIsCreateOpen(true)} className="btn btn-primary">
          + {t('branches.createBranch')}
        </button>
      </div>

      {/* Branches Table */}
      <div className="card table-card">
        <div className="card-body p-0">
          {isLoading ? (
            <div className="p-6 text-center text-slate-500">Loading branches...</div>
          ) : !branchesData?.length ? (
            <div className="p-6 text-center text-slate-500">{commonT('noData')}</div>
          ) : (
            <div className="table-responsive">
              <table className="settings-table">
                <thead>
                  <tr>
                    <th>Branch Name</th>
                    <th>Name (BN)</th>
                    <th>Phone</th>
                    <th>Address</th>
                    <th>Status</th>
                    <th>{commonT('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {branchesData.map((b: any) => (
                    <tr key={b.id}>
                      <td className="font-semibold">{b.name}</td>
                      <td>{b.nameBn || '—'}</td>
                      <td>{b.phone || '—'}</td>
                      <td>{b.address || '—'}</td>
                      <td>
                        <span className={`badge ${b.isActive ? 'badge-success' : 'badge-danger'}`}>
                          {b.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="actions-cell">
                        <button
                          onClick={() => openEditModal(b)}
                          className="action-btn text-blue"
                          title={commonT('edit')}
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal Dialog */}
      {isCreateOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3 className="modal-title">{t('branches.createBranch')}</h3>
            <form
              onSubmit={handleCreateSubmit((data) => createBranchMutation.mutate(data))}
              className="modal-form"
              noValidate
            >
              <div className="form-group">
                <label className="form-label">Branch Name (EN)</label>
                <input
                  type="text"
                  placeholder="Dhanmondi Branch"
                  {...registerCreate('name')}
                  className={`form-input ${errorsCreate.name ? 'form-input-error' : ''}`}
                />
                {errorsCreate.name && (
                  <span className="form-error-msg">{errorsCreate.name.message}</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Branch Name (BN)</label>
                <input
                  type="text"
                  placeholder="ধানমন্ডি শাখা"
                  {...registerCreate('nameBn')}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Address</label>
                <input
                  type="text"
                  placeholder="House 12, Road 5, Dhanmondi, Dhaka"
                  {...registerCreate('address')}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Contact Phone</label>
                <input
                  type="text"
                  placeholder="+8801700000000"
                  {...registerCreate('phone')}
                  className={`form-input ${errorsCreate.phone ? 'form-input-error' : ''}`}
                />
                {errorsCreate.phone && (
                  <span className="form-error-msg">{errorsCreate.phone.message}</span>
                )}
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="btn btn-secondary"
                >
                  {commonT('cancel')}
                </button>
                <button type="submit" disabled={isCreating} className="btn btn-primary">
                  {isCreating ? 'Creating...' : commonT('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal Dialog */}
      {editingBranch && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3 className="modal-title">{t('branches.editBranch')}</h3>
            <form
              onSubmit={handleEditSubmit((data) =>
                updateBranchMutation.mutate({ id: editingBranch.id, input: data }),
              )}
              className="modal-form"
              noValidate
            >
              <div className="form-group">
                <label className="form-label">Branch Name (EN)</label>
                <input
                  type="text"
                  {...registerEdit('name')}
                  className={`form-input ${errorsEdit.name ? 'form-input-error' : ''}`}
                />
                {errorsEdit.name && (
                  <span className="form-error-msg">{errorsEdit.name.message}</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Branch Name (BN)</label>
                <input type="text" {...registerEdit('nameBn')} className="form-input" />
              </div>

              <div className="form-group">
                <label className="form-label">Address</label>
                <input type="text" {...registerEdit('address')} className="form-input" />
              </div>

              <div className="form-group">
                <label className="form-label">Contact Phone</label>
                <input
                  type="text"
                  {...registerEdit('phone')}
                  className={`form-input ${errorsEdit.phone ? 'form-input-error' : ''}`}
                />
                {errorsEdit.phone && (
                  <span className="form-error-msg">{errorsEdit.phone.message}</span>
                )}
              </div>

              <div className="form-group flex-row">
                <input
                  type="checkbox"
                  id="isActive"
                  {...registerEdit('isActive')}
                  className="checkbox-input"
                />
                <label htmlFor="isActive" className="form-label margin-left">
                  Active Branch
                </label>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setEditingBranch(null)}
                  className="btn btn-secondary"
                >
                  {commonT('cancel')}
                </button>
                <button type="submit" disabled={isUpdating} className="btn btn-primary">
                  {isUpdating ? 'Saving...' : commonT('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .branches-settings-container { display: flex; flex-direction: column; gap: 20px; }
        .settings-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
        .settings-title { font-size: 22px; font-weight: 700; color: var(--text-primary); }
        .settings-subtitle { font-size: 13.5px; color: var(--text-muted); margin-top: 2px; }
        .table-card { border-radius: var(--radius-lg); overflow: hidden; }
        .settings-table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
        .settings-table th { background: var(--bg-secondary); padding: 12px 20px; text-align: left; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; color: var(--text-muted); border-bottom: 1px solid var(--border); }
        .settings-table td { padding: 14px 20px; border-bottom: 1px solid var(--border); color: var(--text-secondary); }
        .settings-table tr:hover td { background: var(--bg-secondary); }
        .actions-cell { display: flex; gap: 12px; }
        .action-btn { background: none; border: none; font-size: 13px; font-weight: 600; cursor: pointer; }
        .action-btn.text-blue { color: var(--brand-blue); }
        .action-btn.text-blue:hover { text-decoration: underline; }
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15, 27, 61, 0.4); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: var(--z-modal); }
        .modal-card { background: white; border-radius: 12px; padding: 28px; width: 100%; max-width: 450px; box-shadow: var(--shadow-lg); border: 1px solid var(--border); }
        .modal-title { font-size: 18px; font-weight: 700; color: var(--text-primary); margin-bottom: 20px; }
        .modal-form { display: flex; flex-direction: column; gap: 16px; }
        .form-group { display: flex; flex-direction: column; gap: 6px; }
        .form-group.flex-row { flex-direction: row; align-items: center; gap: 8px; margin: 4px 0; }
        .form-label { font-size: 12.5px; font-weight: 600; color: var(--text-primary); }
        .form-label.margin-left { margin-top: -1px; }
        .form-input { height: 38px; padding: 0 12px; border: 1.5px solid var(--border); border-radius: var(--radius); font-size: 13.5px; color: var(--text-primary); outline: none; transition: border-color 150ms; background: white; }
        .form-input:focus { border-color: var(--brand-blue); box-shadow: 0 0 0 3px rgba(51, 102, 204, 0.12); }
        .form-input-error { border-color: var(--danger); }
        .form-error-msg { font-size: 11.5px; color: var(--danger); }
        .checkbox-input { width: 16px; height: 16px; accent-color: var(--brand-blue); cursor: pointer; }
        .modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 8px; }
        .btn { height: 36px; padding: 0 16px; border-radius: var(--radius); font-size: 13px; font-weight: 600; cursor: pointer; border: none; display: inline-flex; align-items: center; justify-content: center; transition: opacity 150ms; }
        .btn:hover { opacity: 0.9; }
        .btn-primary { background: linear-gradient(135deg, var(--brand-blue), var(--brand-blue-light)); color: white; }
        .btn-secondary { background: var(--bg-tertiary); color: var(--text-secondary); border: 1px solid var(--border); }
      `}</style>
    </div>
  );
}
