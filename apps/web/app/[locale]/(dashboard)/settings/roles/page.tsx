'use client';

import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAuthenticatedClient, gql } from '@/lib/graphql-client';
import { toast } from 'sonner';

const ROLES_QUERY = gql`
  query Roles {
    roles {
      id
      name
      displayName
      description
      isSystem
      rolePermissions {
        id
        permissionId
      }
    }
  }
`;

const PERMISSIONS_QUERY = gql`
  query Permissions {
    permissions {
      id
      name
      displayName
      module
      action
      description
    }
  }
`;

const CREATE_ROLE_MUTATION = gql`
  mutation CreateRole($input: CreateRoleInput!) {
    createRole(input: $input) {
      id
      name
    }
  }
`;

const UPDATE_ROLE_MUTATION = gql`
  mutation UpdateRole($id: ID!, $input: UpdateRoleInput!) {
    updateRole(id: $id, input: $input) {
      id
      name
    }
  }
`;

const DELETE_ROLE_MUTATION = gql`
  mutation DeleteRole($id: ID!) {
    deleteRole(id: $id)
  }
`;

const ASSIGN_PERMISSIONS_MUTATION = gql`
  mutation AssignPermissionsToRole($roleId: ID!, $permissionIds: [ID!]!) {
    assignPermissionsToRole(roleId: $roleId, permissionIds: $permissionIds) {
      id
    }
  }
`;

export default function RolePermissionPage() {
  const t = useTranslations('settings');
  const commonT = useTranslations('common');
  const queryClient = useQueryClient();

  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);

  // Selected permissions state (for the active role checkbox matrix)
  const [checkedPermissionIds, setCheckedPermissionIds] = useState<string[]>([]);

  const client = getAuthenticatedClient();

  // Queries
  const { data: rolesData, isLoading: rolesLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const res: any = await client.request(ROLES_QUERY);
      return res.roles;
    },
  });

  const { data: permissionsData, isLoading: permissionsLoading } = useQuery({
    queryKey: ['permissions'],
    queryFn: async () => {
      const res: any = await client.request(PERMISSIONS_QUERY);
      return res.permissions;
    },
  });

  // Mutations
  const createRoleMutation = useMutation({
    mutationFn: async (input: any) => {
      await client.request(CREATE_ROLE_MUTATION, { input });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success(t('roles.createSuccess'));
      setIsCreateOpen(false);
      resetCreate();
    },
    onError: (err: any) => {
      toast.error(err?.response?.errors?.[0]?.message ?? 'Failed to create role');
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: any }) => {
      await client.request(UPDATE_ROLE_MUTATION, { id, input });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success(t('roles.updateSuccess'));
      setEditingRole(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.errors?.[0]?.message ?? 'Failed to update role');
    },
  });

  const deleteRoleMutation = useMutation({
    mutationFn: async (id: string) => {
      await client.request(DELETE_ROLE_MUTATION, { id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success(t('roles.deleteSuccess'));
      if (selectedRoleId === editingRole?.id) {
        setSelectedRoleId(null);
        setCheckedPermissionIds([]);
      }
    },
    onError: (err: any) => {
      toast.error(err?.response?.errors?.[0]?.message ?? 'Failed to delete role');
    },
  });

  const assignPermissionsMutation = useMutation({
    mutationFn: async () => {
      if (!selectedRoleId) return;
      await client.request(ASSIGN_PERMISSIONS_MUTATION, {
        roleId: selectedRoleId,
        permissionIds: checkedPermissionIds,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success(t('roles.assignSuccess'));
    },
    onError: (err: any) => {
      toast.error(err?.response?.errors?.[0]?.message ?? 'Failed to assign permissions');
    },
  });

  // Forms
  const {
    register: registerCreate,
    handleSubmit: handleCreateSubmit,
    formState: { errors: errorsCreate, isSubmitting: isCreating },
    reset: resetCreate,
  } = useForm<any>();

  const {
    register: registerEdit,
    handleSubmit: handleEditSubmit,
    formState: { isSubmitting: isUpdating },
    setValue: setEditValue,
  } = useForm<any>();

  const activeRole = useMemo(() => {
    if (!rolesData || !selectedRoleId) return null;
    return rolesData.find((r: any) => r.id === selectedRoleId) || null;
  }, [rolesData, selectedRoleId]);

  const selectRole = (role: any) => {
    setSelectedRoleId(role.id);
    const assignedIds = role.rolePermissions.map((rp: any) => rp.permissionId);
    setCheckedPermissionIds(assignedIds);
  };

  const handlePermissionToggle = (permissionId: string) => {
    setCheckedPermissionIds((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId],
    );
  };

  const openEditModal = (role: any) => {
    setEditingRole(role);
    setEditValue('displayName', role.displayName);
    setEditValue('description', role.description || '');
  };

  const handleDeleteRole = (id: string) => {
    if (confirm(t('roles.confirmDelete'))) {
      deleteRoleMutation.mutate(id);
    }
  };

  // Group permissions by module for the matrix display
  const permissionsByModule = useMemo(() => {
    if (!permissionsData) return {};
    const groups: Record<string, any[]> = {};
    permissionsData.forEach((p: any) => {
      const mod = p.module.toUpperCase();
      if (!groups[mod]) groups[mod] = [];
      groups[mod].push(p);
    });
    return groups;
  }, [permissionsData]);

  return (
    <div className="role-permissions-container">
      {/* Page Header */}
      <div className="settings-header">
        <div>
          <h1 className="settings-title">{t('roles.title')}</h1>
          <p className="settings-subtitle">Configure system access levels and permissions matrix</p>
        </div>
        <button onClick={() => setIsCreateOpen(true)} className="btn btn-primary">
          + {t('roles.createRole')}
        </button>
      </div>

      {/* Two-Column Layout */}
      <div className="settings-grid">
        {/* Left Side: Roles List */}
        <div className="roles-list-column">
          <div className="card">
            <div className="card-header">
              <span className="card-title">Roles</span>
            </div>
            <div className="card-body p-0">
              {rolesLoading ? (
                <div className="p-4 text-slate-500">Loading roles...</div>
              ) : (
                <div className="roles-list-group">
                  {rolesData?.map((r: any) => (
                    <div
                      key={r.id}
                      onClick={() => selectRole(r)}
                      className={`role-item-row ${selectedRoleId === r.id ? 'active' : ''}`}
                    >
                      <div className="role-item-info">
                        <div className="role-item-name-row">
                          <span className="role-item-display">{r.displayName}</span>
                          {r.isSystem && <span className="system-pill">System</span>}
                        </div>
                        <p className="role-item-desc">{r.description || 'No description'}</p>
                      </div>

                      <div className="role-item-actions">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(r);
                          }}
                          className="role-action-btn text-blue"
                        >
                          Edit
                        </button>
                        {!r.isSystem && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteRole(r.id);
                            }}
                            className="role-action-btn text-red"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Permissions Checklist Matrix */}
        <div className="permissions-matrix-column">
          <div className="card">
            <div className="card-header flex-between">
              <div>
                <span className="card-title">{t('roles.permissions')}</span>
                {activeRole && (
                  <span className="active-role-sub font-semibold text-blue ml-2">
                    ({activeRole.displayName})
                  </span>
                )}
              </div>
              {selectedRoleId && (
                <button
                  onClick={() => assignPermissionsMutation.mutate()}
                  disabled={assignPermissionsMutation.isPending}
                  className="btn btn-primary btn-sm"
                >
                  {assignPermissionsMutation.isPending ? 'Saving...' : t('roles.assignPermissions')}
                </button>
              )}
            </div>

            <div className="card-body">
              {!selectedRoleId ? (
                <div className="p-6 text-center text-slate-500">
                  Select a role from the left column to view and configure its permissions.
                </div>
              ) : permissionsLoading ? (
                <div className="p-6 text-center text-slate-500">Loading system permissions...</div>
              ) : (
                <div className="permissions-module-list">
                  {activeRole?.isSystem && (
                    <div className="system-warning alert warning mb-4">
                      {t('roles.systemRoleWarning')}
                    </div>
                  )}

                  {Object.keys(permissionsByModule).map((moduleName) => (
                    <div key={moduleName} className="module-permission-group">
                      <h4 className="module-group-title">{moduleName}</h4>
                      <div className="module-permission-grid">
                        {(permissionsByModule[moduleName] || []).map((p: any) => (
                          <label key={p.id} className="permission-checkbox-label">
                            <input
                              type="checkbox"
                              checked={checkedPermissionIds.includes(p.id)}
                              onChange={() => handlePermissionToggle(p.id)}
                              disabled={activeRole?.isSystem}
                              className="checkbox-input"
                            />
                            <div>
                              <div className="permission-display">{p.displayName}</div>
                              <p className="permission-desc">{p.description || p.name}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create Role Modal Dialog */}
      {isCreateOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3 className="modal-title">{t('roles.createRole')}</h3>
            <form
              onSubmit={handleCreateSubmit((data) => createRoleMutation.mutate(data))}
              className="modal-form"
              noValidate
            >
              <div className="form-group">
                <label className="form-label">{t('roles.roleName')}</label>
                <input
                  type="text"
                  placeholder="DOCTOR"
                  {...registerCreate('name', { required: true })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('roles.displayName')}</label>
                <input
                  type="text"
                  placeholder="Doctor"
                  {...registerCreate('displayName', { required: true })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('roles.description')}</label>
                <textarea
                  rows={3}
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

      {/* Edit Role Modal Dialog */}
      {editingRole && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3 className="modal-title">{t('roles.editRole')}</h3>
            <form
              onSubmit={handleEditSubmit((data) =>
                updateRoleMutation.mutate({ id: editingRole.id, input: data }),
              )}
              className="modal-form"
              noValidate
            >
              <div className="form-group">
                <label className="form-label">{t('roles.displayName')}</label>
                <input
                  type="text"
                  {...registerEdit('displayName', { required: true })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('roles.description')}</label>
                <textarea
                  rows={3}
                  {...registerEdit('description')}
                  className="form-input form-textarea"
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setEditingRole(null)}
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
        .role-permissions-container { display: flex; flex-direction: column; gap: 20px; }
        .settings-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
        .settings-title { font-size: 22px; font-weight: 700; color: var(--text-primary); }
        .settings-subtitle { font-size: 13.5px; color: var(--text-muted); margin-top: 2px; }
        .settings-grid { display: grid; grid-template-columns: 2fr 3fr; gap: 20px; align-items: start; }
        @media (max-width: 900px) { .settings-grid { grid-template-columns: 1fr; } }
        .roles-list-group { display: flex; flex-direction: column; }
        .role-item-row { display: flex; align-items: center; justify-content: space-between; padding: 14px 20px; border-bottom: 1px solid var(--border); cursor: pointer; transition: background var(--transition); }
        .role-item-row:hover { background: var(--bg-secondary); }
        .role-item-row.active { background: var(--bg-tertiary); border-left: 3px solid var(--brand-blue); padding-left: 17px; }
        .role-item-info { display: flex; flex-direction: column; gap: 4px; }
        .role-item-name-row { display: flex; align-items: center; gap: 8px; }
        .role-item-display { font-size: 14px; font-weight: 600; color: var(--text-primary); }
        .system-pill { background: rgba(51, 102, 204, 0.08); color: var(--brand-blue); font-size: 10px; font-weight: 600; padding: 1px 6px; border-radius: 4px; text-transform: uppercase; }
        .role-item-desc { font-size: 12px; color: var(--text-secondary); max-width: 250px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .role-item-actions { display: flex; gap: 10px; opacity: 0.7; }
        .role-action-btn { background: none; border: none; font-size: 12px; font-weight: 600; cursor: pointer; }
        .role-action-btn.text-blue { color: var(--brand-blue); }
        .role-action-btn.text-red { color: var(--danger); }
        .role-action-btn:hover { text-decoration: underline; }
        .flex-between { display: flex; align-items: center; justify-content: space-between; }
        .permissions-module-list { display: flex; flex-direction: column; gap: 24px; }
        .module-permission-group { display: flex; flex-direction: column; gap: 12px; }
        .module-group-title { font-size: 13px; font-weight: 700; color: var(--text-primary); border-bottom: 1.5px solid var(--border); padding-bottom: 6px; text-transform: uppercase; letter-spacing: 0.04em; }
        .module-permission-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        @media (max-width: 1200px) { .module-permission-grid { grid-template-columns: 1fr; } }
        .permission-checkbox-label { display: flex; gap: 10px; align-items: flex-start; padding: 8px; border-radius: var(--radius); border: 1px solid var(--border); background: var(--bg-secondary); cursor: pointer; transition: background 150ms; }
        .permission-checkbox-label:hover { background: var(--bg-tertiary); }
        .checkbox-input { width: 16px; height: 16px; margin-top: 2px; accent-color: var(--brand-blue); }
        .permission-display { font-size: 12.5px; font-weight: 600; color: var(--text-primary); }
        .permission-desc { font-size: 11.5px; color: var(--text-secondary); margin-top: 1px; line-height: 1.4; }
        .alert { border-radius: var(--radius); padding: 10px 14px; font-size: 12.5px; }
        .alert.warning { background: var(--warning-bg); color: var(--warning); border: 1px solid rgba(245, 158, 11, 0.2); }
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15, 27, 61, 0.4); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: var(--z-modal); }
        .modal-card { background: white; border-radius: 12px; padding: 28px; width: 100%; max-width: 450px; box-shadow: var(--shadow-lg); border: 1px solid var(--border); }
        .modal-title { font-size: 18px; font-weight: 700; color: var(--text-primary); margin-bottom: 20px; }
        .modal-form { display: flex; flex-direction: column; gap: 16px; }
        .form-group { display: flex; flex-direction: column; gap: 6px; }
        .form-label { font-size: 12.5px; font-weight: 600; color: var(--text-primary); }
        .form-input { height: 38px; padding: 0 12px; border: 1.5px solid var(--border); border-radius: var(--radius); font-size: 13.5px; color: var(--text-primary); outline: none; transition: border-color 150ms; background: white; }
        .form-input:focus { border-color: var(--brand-blue); box-shadow: 0 0 0 3px rgba(51, 102, 204, 0.12); }
        .form-textarea { height: auto; padding: 10px 12px; resize: vertical; }
        .modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 8px; }
        .btn { height: 36px; padding: 0 16px; border-radius: var(--radius); font-size: 13px; font-weight: 600; cursor: pointer; border: none; display: inline-flex; align-items: center; justify-content: center; transition: opacity 150ms; }
        .btn:hover { opacity: 0.9; }
        .btn-primary { background: linear-gradient(135deg, var(--brand-blue), var(--brand-blue-light)); color: white; }
        .btn-secondary { background: var(--bg-tertiary); color: var(--text-secondary); border: 1px solid var(--border); }
      `}</style>
    </div>
  );
}
