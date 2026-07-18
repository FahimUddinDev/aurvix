'use client';

import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAuthenticatedClient, gql } from '@/lib/graphql-client';
import { toast } from 'sonner';

// Zod schema imports
import { createUserSchema, type CreateUserInput } from '@aurevix/validators';

const USERS_QUERY = gql`
  query Users($filters: UserFilters, $pagination: PaginationInput) {
    users(filters: $filters, pagination: $pagination) {
      items {
        id
        email
        firstName
        lastName
        phone
        status
        roleId
        role {
          id
          name
          displayName
        }
        hospitalId
        createdAt
      }
      total
      page
      limit
      totalPages
      hasNextPage
      hasPrevPage
    }
  }
`;

const ROLES_QUERY = gql`
  query Roles {
    roles {
      id
      name
      displayName
    }
  }
`;

const CREATE_USER_MUTATION = gql`
  mutation CreateUser($input: CreateUserInput!) {
    createUser(input: $input) {
      id
      email
    }
  }
`;

const UPDATE_USER_MUTATION = gql`
  mutation UpdateUser($id: ID!, $input: UpdateUserInput!) {
    updateUser(id: $id, input: $input) {
      id
      email
    }
  }
`;

const DEACTIVATE_USER_MUTATION = gql`
  mutation DeactivateUser($id: ID!) {
    deactivateUser(id: $id) {
      id
      status
    }
  }
`;

export default function UserManagementPage() {
  const t = useTranslations('settings');
  const commonT = useTranslations('common');
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Dialog Modals State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  const client = getAuthenticatedClient();

  // Queries
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['users', page, roleFilter, statusFilter, searchQuery],
    queryFn: async () => {
      const res: any = await client.request(USERS_QUERY, {
        filters: {
          roleId: roleFilter || undefined,
          status: statusFilter || undefined,
          query: searchQuery || undefined,
        },
        pagination: { page, limit: 10 },
      });
      return res.users;
    },
  });

  const { data: rolesData } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const res: any = await client.request(ROLES_QUERY);
      return res.roles;
    },
  });

  // Mutations
  const createUserMutation = useMutation({
    mutationFn: async (input: CreateUserInput) => {
      await client.request(CREATE_USER_MUTATION, { input });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(t('users.createUserSuccess'));
      setIsCreateOpen(false);
      resetCreate();
    },
    onError: (err: any) => {
      toast.error(err?.response?.errors?.[0]?.message ?? 'Failed to create user');
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: any }) => {
      await client.request(UPDATE_USER_MUTATION, { id, input });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(t('users.updateUserSuccess'));
      setEditingUser(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.errors?.[0]?.message ?? 'Failed to update user');
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: async (id: string) => {
      await client.request(DEACTIVATE_USER_MUTATION, { id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(t('users.deactivateUserSuccess'));
    },
    onError: (err: any) => {
      toast.error(err?.response?.errors?.[0]?.message ?? 'Failed to deactivate user');
    },
  });

  // React Hook Form for Create User
  const {
    register: registerCreate,
    handleSubmit: handleCreateSubmit,
    formState: { errors: errorsCreate, isSubmitting: isCreating },
    reset: resetCreate,
  } = useForm<Omit<CreateUserInput, 'hospitalId'>>({
    resolver: zodResolver(createUserSchema.omit({ hospitalId: true })), // Hospital ID will be added by backend from context
    defaultValues: {
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      phone: '',
      roleId: '',
    },
  });

  // React Hook Form for Edit User
  const {
    register: registerEdit,
    handleSubmit: handleEditSubmit,
    formState: { errors: errorsEdit, isSubmitting: isUpdating },
    setValue: setEditValue,
  } = useForm<any>({
    defaultValues: {
      firstName: '',
      lastName: '',
      phone: '',
      roleId: '',
      status: '',
    },
  });

  const openEditModal = (user: any) => {
    setEditingUser(user);
    setEditValue('firstName', user.firstName);
    setEditValue('lastName', user.lastName);
    setEditValue('phone', user.phone || '');
    setEditValue('roleId', user.roleId);
    setEditValue('status', user.status);
  };

  const handleDeactivate = (id: string) => {
    if (confirm(t('users.confirmDeactivate'))) {
      deactivateMutation.mutate(id);
    }
  };

  return (
    <div className="user-management-container">
      {/* Page Header */}
      <div className="settings-header">
        <div>
          <h1 className="settings-title">{t('users.title')}</h1>
          <p className="settings-subtitle">Manage hospital staff credentials and permissions</p>
        </div>
        <button onClick={() => setIsCreateOpen(true)} className="btn btn-primary">
          + {t('users.createUser')}
        </button>
      </div>

      {/* Filters Bar */}
      <div className="filters-card card">
        <div className="card-body filters-grid">
          <div className="form-group">
            <input
              type="text"
              placeholder={commonT('search') + '...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="form-input"
            >
              <option value="">All Roles</option>
              {rolesData?.map((r: any) => (
                <option key={r.id} value={r.id}>
                  {r.displayName}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-input"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="LOCKED">Locked</option>
              <option value="PENDING_VERIFICATION">Pending Verification</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card table-card">
        <div className="card-body p-0">
          {usersLoading ? (
            <div className="p-6 text-center text-slate-500">Loading user accounts...</div>
          ) : !usersData?.items?.length ? (
            <div className="p-6 text-center text-slate-500">{commonT('noData')}</div>
          ) : (
            <div className="table-responsive">
              <table className="settings-table">
                <thead>
                  <tr>
                    <th>{t('users.firstName')}</th>
                    <th>{t('users.email')}</th>
                    <th>{t('users.phone')}</th>
                    <th>{t('users.role')}</th>
                    <th>{t('users.status')}</th>
                    <th>{commonT('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {usersData.items.map((u: any) => (
                    <tr key={u.id}>
                      <td className="font-semibold">
                        {u.firstName} {u.lastName}
                      </td>
                      <td>{u.email}</td>
                      <td>{u.phone || '—'}</td>
                      <td>
                        <span className="role-tag">{u.role?.displayName || u.role?.name}</span>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            u.status === 'ACTIVE'
                              ? 'badge-success'
                              : u.status === 'INACTIVE'
                                ? 'badge-danger'
                                : 'badge-warning'
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="actions-cell">
                        <button
                          onClick={() => openEditModal(u)}
                          className="action-btn text-blue"
                          title={commonT('edit')}
                        >
                          Edit
                        </button>
                        {u.status === 'ACTIVE' && (
                          <button
                            onClick={() => handleDeactivate(u.id)}
                            className="action-btn text-red"
                            title={t('users.deactivateUser')}
                          >
                            Deactivate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination Footer */}
        {usersData && usersData.totalPages > 1 && (
          <div className="card-footer pagination-bar">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!usersData.hasPrevPage}
              className="btn btn-secondary btn-sm"
            >
              &larr; {commonT('previous')}
            </button>
            <span className="pagination-info">
              {commonT('page')} {usersData.page} {commonT('of')} {usersData.totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(usersData.totalPages, p + 1))}
              disabled={!usersData.hasNextPage}
              className="btn btn-secondary btn-sm"
            >
              {commonT('next')} &rarr;
            </button>
          </div>
        )}
      </div>

      {/* Create Modal Dialog */}
      {isCreateOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3 className="modal-title">{t('users.createUser')}</h3>
            <form
              onSubmit={handleCreateSubmit((data) =>
                // Pass mock hospitalId uuid as placeholder (backend will resolve it anyway)
                createUserMutation.mutate({
                  ...data,
                  hospitalId: '00000000-0000-0000-0000-000000000001',
                }),
              )}
              className="modal-form"
              noValidate
            >
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">{t('users.firstName')}</label>
                  <input
                    type="text"
                    {...registerCreate('firstName')}
                    className={`form-input ${errorsCreate.firstName ? 'form-input-error' : ''}`}
                  />
                  {errorsCreate.firstName && (
                    <span className="form-error-msg">{errorsCreate.firstName.message}</span>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">{t('users.lastName')}</label>
                  <input
                    type="text"
                    {...registerCreate('lastName')}
                    className={`form-input ${errorsCreate.lastName ? 'form-input-error' : ''}`}
                  />
                  {errorsCreate.lastName && (
                    <span className="form-error-msg">{errorsCreate.lastName.message}</span>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">{t('users.email')}</label>
                <input
                  type="email"
                  {...registerCreate('email')}
                  className={`form-input ${errorsCreate.email ? 'form-input-error' : ''}`}
                />
                {errorsCreate.email && (
                  <span className="form-error-msg">{errorsCreate.email.message}</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">{t('users.password')}</label>
                <input
                  type="password"
                  {...registerCreate('password')}
                  className={`form-input ${errorsCreate.password ? 'form-input-error' : ''}`}
                />
                {errorsCreate.password && (
                  <span className="form-error-msg">{errorsCreate.password.message}</span>
                )}
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">{t('users.phone')}</label>
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

                <div className="form-group">
                  <label className="form-label">{t('users.role')}</label>
                  <select
                    {...registerCreate('roleId')}
                    className={`form-input ${errorsCreate.roleId ? 'form-input-error' : ''}`}
                  >
                    <option value="">Select Role</option>
                    {rolesData?.map((r: any) => (
                      <option key={r.id} value={r.id}>
                        {r.displayName}
                      </option>
                    ))}
                  </select>
                  {errorsCreate.roleId && (
                    <span className="form-error-msg">{errorsCreate.roleId.message}</span>
                  )}
                </div>
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
      {editingUser && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3 className="modal-title">{t('users.editUser')}</h3>
            <form
              onSubmit={handleEditSubmit((data) =>
                updateUserMutation.mutate({ id: editingUser.id, input: data }),
              )}
              className="modal-form"
              noValidate
            >
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">{t('users.firstName')}</label>
                  <input
                    type="text"
                    {...registerEdit('firstName', { required: true })}
                    className={`form-input ${errorsEdit.firstName ? 'form-input-error' : ''}`}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('users.lastName')}</label>
                  <input
                    type="text"
                    {...registerEdit('lastName', { required: true })}
                    className={`form-input ${errorsEdit.lastName ? 'form-input-error' : ''}`}
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">{t('users.phone')}</label>
                  <input type="text" {...registerEdit('phone')} className="form-input" />
                </div>

                <div className="form-group">
                  <label className="form-label">{t('users.role')}</label>
                  <select {...registerEdit('roleId')} className="form-input">
                    {rolesData?.map((r: any) => (
                      <option key={r.id} value={r.id}>
                        {r.displayName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">{t('users.status')}</label>
                <select {...registerEdit('status')} className="form-input">
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="LOCKED">Locked</option>
                  <option value="PENDING_VERIFICATION">Pending Verification</option>
                </select>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
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
        .user-management-container { display: flex; flex-direction: column; gap: 20px; }
        .settings-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
        .settings-title { font-size: 22px; font-weight: 700; color: var(--text-primary); }
        .settings-subtitle { font-size: 13.5px; color: var(--text-muted); margin-top: 2px; }
        .filters-card { border-radius: var(--radius-lg); }
        .filters-grid { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 16px; padding: 16px; }
        .table-card { border-radius: var(--radius-lg); overflow: hidden; }
        .settings-table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
        .settings-table th { background: var(--bg-secondary); padding: 12px 20px; text-align: left; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; color: var(--text-muted); border-bottom: 1px solid var(--border); }
        .settings-table td { padding: 14px 20px; border-bottom: 1px solid var(--border); color: var(--text-secondary); }
        .settings-table tr:hover td { background: var(--bg-secondary); }
        .role-tag { background: var(--bg-tertiary); color: var(--brand-navy-light); padding: 2px 8px; border-radius: 6px; font-size: 11.5px; font-weight: 600; text-transform: uppercase; }
        .actions-cell { display: flex; gap: 12px; }
        .action-btn { background: none; border: none; font-size: 13px; font-weight: 600; cursor: pointer; }
        .action-btn.text-blue { color: var(--brand-blue); }
        .action-btn.text-blue:hover { text-decoration: underline; }
        .action-btn.text-red { color: var(--danger); }
        .action-btn.text-red:hover { text-decoration: underline; }
        .pagination-bar { display: flex; justify-content: space-between; align-items: center; padding: 12px 20px; border-top: 1px solid var(--border); background: var(--bg-primary); }
        .pagination-info { font-size: 13px; color: var(--text-secondary); }
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15, 27, 61, 0.4); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: var(--z-modal); }
        .modal-card { background: white; border-radius: 12px; padding: 28px; width: 100%; max-width: 500px; box-shadow: var(--shadow-lg); border: 1px solid var(--border); }
        .modal-title { font-size: 18px; font-weight: 700; color: var(--text-primary); margin-bottom: 20px; }
        .modal-form { display: flex; flex-direction: column; gap: 16px; }
        .form-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .form-group { display: flex; flex-direction: column; gap: 6px; }
        .form-label { font-size: 12.5px; font-weight: 600; color: var(--text-primary); }
        .form-input { height: 38px; padding: 0 12px; border: 1.5px solid var(--border); border-radius: var(--radius); font-size: 13.5px; color: var(--text-primary); outline: none; transition: border-color 150ms; background: white; }
        .form-input:focus { border-color: var(--brand-blue); box-shadow: 0 0 0 3px rgba(51, 102, 204, 0.12); }
        .form-input-error { border-color: var(--danger); }
        .form-error-msg { font-size: 11.5px; color: var(--danger); }
        .modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 8px; }
        .btn { height: 36px; padding: 0 16px; border-radius: var(--radius); font-size: 13px; font-weight: 600; cursor: pointer; border: none; display: inline-flex; align-items: center; justify-content: center; transition: opacity 150ms; }
        .btn:hover { opacity: 0.9; }
        .btn-primary { background: linear-gradient(135deg, var(--brand-blue), var(--brand-blue-light)); color: white; }
        .btn-secondary { background: var(--bg-tertiary); color: var(--text-secondary); border: 1px solid var(--border); }
        .btn-danger { background: var(--danger); color: white; }
      `}</style>
    </div>
  );
}
