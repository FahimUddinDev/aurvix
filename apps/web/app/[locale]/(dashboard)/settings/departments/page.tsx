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
  createDepartmentSchema,
  updateDepartmentSchema,
  type CreateDepartmentInput,
  type UpdateDepartmentInput,
} from '@aurevix/validators';

const DEPARTMENTS_QUERY = gql`
  query Departments {
    departments {
      id
      hospitalId
      name
      nameBn
      code
      description
      isActive
      createdAt
    }
  }
`;

const CREATE_DEPARTMENT_MUTATION = gql`
  mutation CreateDepartment($input: CreateDepartmentInput!) {
    createDepartment(input: $input) {
      id
      name
    }
  }
`;

const UPDATE_DEPARTMENT_MUTATION = gql`
  mutation UpdateDepartment($id: ID!, $input: UpdateDepartmentInput!) {
    updateDepartment(id: $id, input: $input) {
      id
      name
    }
  }
`;

export default function DepartmentsSettingsPage() {
  const t = useTranslations('settings');
  const commonT = useTranslations('common');
  const queryClient = useQueryClient();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<any>(null);

  const client = getAuthenticatedClient();

  // Queries
  const { data: departmentsData, isLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const res: any = await client.request(DEPARTMENTS_QUERY);
      return res.departments;
    },
  });

  // Mutations
  const createDeptMutation = useMutation({
    mutationFn: async (input: CreateDepartmentInput) => {
      await client.request(CREATE_DEPARTMENT_MUTATION, { input });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast.success(t('departments.createSuccess'));
      setIsCreateOpen(false);
      resetCreate();
    },
    onError: (err: any) => {
      toast.error(err?.response?.errors?.[0]?.message ?? 'Failed to create department');
    },
  });

  const updateDeptMutation = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateDepartmentInput }) => {
      await client.request(UPDATE_DEPARTMENT_MUTATION, { id, input });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast.success(t('departments.updateSuccess'));
      setEditingDept(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.errors?.[0]?.message ?? 'Failed to update department');
    },
  });

  // React Hook Form for Create Department
  const {
    register: registerCreate,
    handleSubmit: handleCreateSubmit,
    formState: { errors: errorsCreate, isSubmitting: isCreating },
    reset: resetCreate,
  } = useForm<CreateDepartmentInput>({
    resolver: zodResolver(createDepartmentSchema),
    defaultValues: {
      name: '',
      nameBn: '',
      code: '',
      description: '',
    },
  });

  // React Hook Form for Edit Department
  const {
    register: registerEdit,
    handleSubmit: handleEditSubmit,
    formState: { errors: errorsEdit, isSubmitting: isUpdating },
    setValue: setEditValue,
  } = useForm<UpdateDepartmentInput>({
    resolver: zodResolver(updateDepartmentSchema),
  });

  const openEditModal = (dept: any) => {
    setEditingDept(dept);
    setEditValue('name', dept.name);
    setEditValue('nameBn', dept.nameBn || '');
    setEditValue('code', dept.code);
    setEditValue('description', dept.description || '');
    setEditValue('isActive', dept.isActive);
  };

  return (
    <div className="departments-settings-container">
      {/* Page Header */}
      <div className="settings-header">
        <div>
          <h1 className="settings-title">{t('departments.title')}</h1>
          <p className="settings-subtitle">Manage hospital clinical and operations departments</p>
        </div>
        <button onClick={() => setIsCreateOpen(true)} className="btn btn-primary">
          + {t('departments.createDept')}
        </button>
      </div>

      {/* Departments Table */}
      <div className="card table-card">
        <div className="card-body p-0">
          {isLoading ? (
            <div className="p-6 text-center text-slate-500">Loading departments...</div>
          ) : !departmentsData?.length ? (
            <div className="p-6 text-center text-slate-500">{commonT('noData')}</div>
          ) : (
            <div className="table-responsive">
              <table className="settings-table">
                <thead>
                  <tr>
                    <th>Department Name</th>
                    <th>Name (BN)</th>
                    <th>Code</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th>{commonT('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {departmentsData.map((d: any) => (
                    <tr key={d.id}>
                      <td className="font-semibold">{d.name}</td>
                      <td>{d.nameBn || '—'}</td>
                      <td>
                        <code className="code-pill">{d.code}</code>
                      </td>
                      <td>{d.description || '—'}</td>
                      <td>
                        <span className={`badge ${d.isActive ? 'badge-success' : 'badge-danger'}`}>
                          {d.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="actions-cell">
                        <button
                          onClick={() => openEditModal(d)}
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
            <h3 className="modal-title">{t('departments.createDept')}</h3>
            <form
              onSubmit={handleCreateSubmit((data) => createDeptMutation.mutate(data))}
              className="modal-form"
              noValidate
            >
              <div className="form-group">
                <label className="form-label">Department Name (EN)</label>
                <input
                  type="text"
                  placeholder="Cardiology"
                  {...registerCreate('name')}
                  className={`form-input ${errorsCreate.name ? 'form-input-error' : ''}`}
                />
                {errorsCreate.name && (
                  <span className="form-error-msg">{errorsCreate.name.message}</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Department Name (BN)</label>
                <input
                  type="text"
                  placeholder="কার্ডিওলজি"
                  {...registerCreate('nameBn')}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Department Code (Uppercase)</label>
                <input
                  type="text"
                  placeholder="CARD"
                  {...registerCreate('code')}
                  className={`form-input ${errorsCreate.code ? 'form-input-error' : ''}`}
                />
                {errorsCreate.code && (
                  <span className="form-error-msg">{errorsCreate.code.message}</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  rows={3}
                  placeholder="Describe department operations"
                  {...registerCreate('description')}
                  className="form-input form-textarea"
                />
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
      {editingDept && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3 className="modal-title">{t('departments.editDept')}</h3>
            <form
              onSubmit={handleEditSubmit((data) =>
                updateDeptMutation.mutate({ id: editingDept.id, input: data }),
              )}
              className="modal-form"
              noValidate
            >
              <div className="form-group">
                <label className="form-label">Department Name (EN)</label>
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
                <label className="form-label">Department Name (BN)</label>
                <input type="text" {...registerEdit('nameBn')} className="form-input" />
              </div>

              <div className="form-group">
                <label className="form-label">Department Code (Uppercase)</label>
                <input
                  type="text"
                  {...registerEdit('code')}
                  className={`form-input ${errorsEdit.code ? 'form-input-error' : ''}`}
                />
                {errorsEdit.code && (
                  <span className="form-error-msg">{errorsEdit.code.message}</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  rows={3}
                  {...registerEdit('description')}
                  className="form-input form-textarea"
                />
              </div>

              <div className="form-group flex-row">
                <input
                  type="checkbox"
                  id="isActive"
                  {...registerEdit('isActive')}
                  className="checkbox-input"
                />
                <label htmlFor="isActive" className="form-label margin-left">
                  Active Department
                </label>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setEditingDept(null)}
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
        .departments-settings-container { display: flex; flex-direction: column; gap: 20px; }
        .settings-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
        .settings-title { font-size: 22px; font-weight: 700; color: var(--text-primary); }
        .settings-subtitle { font-size: 13.5px; color: var(--text-muted); margin-top: 2px; }
        .table-card { border-radius: var(--radius-lg); overflow: hidden; }
        .settings-table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
        .settings-table th { background: var(--bg-secondary); padding: 12px 20px; text-align: left; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; color: var(--text-muted); border-bottom: 1px solid var(--border); }
        .settings-table td { padding: 14px 20px; border-bottom: 1px solid var(--border); color: var(--text-secondary); }
        .settings-table tr:hover td { background: var(--bg-secondary); }
        .code-pill { background: var(--bg-tertiary); color: var(--brand-navy-light); padding: 2px 6px; border-radius: 4px; font-family: var(--font-mono); font-size: 12px; font-weight: 600; }
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
        .form-textarea { height: auto; padding: 10px 12px; resize: vertical; }
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
