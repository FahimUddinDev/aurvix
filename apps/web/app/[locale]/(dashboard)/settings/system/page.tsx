'use client';

import { useTranslations } from 'next-intl';
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAuthenticatedClient, gql } from '@/lib/graphql-client';
import { toast } from 'sonner';

const SYSTEM_CONFIG_QUERY = gql`
  query SystemConfig {
    systemConfig {
      id
      hospitalId
      key
      value
      dataType
      category
      isPublic
      createdAt
      updatedAt
    }
  }
`;

const UPDATE_CONFIG_MUTATION = gql`
  mutation UpdateConfig($key: String!, $value: String!) {
    updateConfig(key: $key, value: $value) {
      id
      key
      value
    }
  }
`;

export default function SystemConfigSettingsPage() {
  const t = useTranslations('settings');
  const commonT = useTranslations('common');
  const queryClient = useQueryClient();

  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');

  const client = getAuthenticatedClient();

  // Query configuration list
  const { data: configData, isLoading } = useQuery({
    queryKey: ['systemConfig'],
    queryFn: async () => {
      const res: any = await client.request(SYSTEM_CONFIG_QUERY);
      return res.systemConfig;
    },
  });

  // Mutation
  const updateMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      await client.request(UPDATE_CONFIG_MUTATION, { key, value });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['systemConfig'] });
      toast.success('Configuration setting updated successfully.');
      setEditingKey(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.errors?.[0]?.message ?? 'Failed to update setting');
    },
  });

  // Extract categories from config data
  const categories = useMemo(() => {
    if (!configData) return ['ALL'];
    const cats = new Set<string>();
    configData.forEach((c: any) => {
      if (c.category) cats.add(c.category);
    });
    return ['ALL', ...Array.from(cats)];
  }, [configData]);

  // Filter settings by selected category
  const filteredSettings = useMemo(() => {
    if (!configData) return [];
    if (activeCategory === 'ALL') return configData;
    return configData.filter((c: any) => c.category === activeCategory);
  }, [configData, activeCategory]);

  const startEdit = (setting: any) => {
    setEditingKey(setting.key);
    setEditingValue(setting.value);
  };

  const cancelEdit = () => {
    setEditingKey(null);
    setEditingValue('');
  };

  const handleSave = (key: string, dataType: string) => {
    // Basic type validation
    if (dataType === 'NUMBER') {
      const num = Number(editingValue);
      if (isNaN(num)) {
        toast.error('Value must be a valid number');
        return;
      }
    }
    updateMutation.mutate({ key, value: editingValue });
  };

  const formatKeyName = (key: string) => {
    return key
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .replace(/\s+/g, ' ')
      .trim();
  };

  return (
    <div className="system-config-container">
      {/* Page Header */}
      <div className="settings-header">
        <div>
          <h1 className="settings-title">{t('system.title')}</h1>
          <p className="settings-subtitle">
            Manage hospital system default parameters and operational values
          </p>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="categories-tabs flex-row">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => {
              setActiveCategory(cat);
              cancelEdit();
            }}
            className={`tab-btn ${activeCategory === cat ? 'active' : ''}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Configurations Table */}
      <div className="card table-card">
        <div className="card-body p-0">
          {isLoading ? (
            <div className="p-6 text-center text-slate-500">Loading system configurations...</div>
          ) : !filteredSettings?.length ? (
            <div className="p-6 text-center text-slate-500">{commonT('noData')}</div>
          ) : (
            <div className="table-responsive">
              <table className="settings-table">
                <thead>
                  <tr>
                    <th style={{ width: '35%' }}>Parameter Key</th>
                    <th style={{ width: '45%' }}>Setting Value</th>
                    <th style={{ width: '20%' }}>{commonT('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSettings.map((c: any) => {
                    const isEditing = editingKey === c.key;
                    return (
                      <tr key={c.key}>
                        <td>
                          <div className="setting-key-display">{formatKeyName(c.key)}</div>
                          <code className="setting-key-code">{c.key}</code>
                        </td>
                        <td>
                          {isEditing ? (
                            c.dataType === 'BOOLEAN' ? (
                              <select
                                value={editingValue}
                                onChange={(e) => setEditingValue(e.target.value)}
                                className="form-input select-editor"
                              >
                                <option value="true">Enabled (True)</option>
                                <option value="false">Disabled (False)</option>
                              </select>
                            ) : (
                              <input
                                type="text"
                                value={editingValue}
                                onChange={(e) => setEditingValue(e.target.value)}
                                className="form-input input-editor"
                              />
                            )
                          ) : (
                            <div className="setting-value-text">
                              {c.dataType === 'BOOLEAN' ? (
                                c.value === 'true' ? (
                                  <span className="badge badge-success">True</span>
                                ) : (
                                  <span className="badge badge-danger">False</span>
                                )
                              ) : (
                                <span>{c.value}</span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="actions-cell">
                          {isEditing ? (
                            <div className="edit-actions">
                              <button
                                onClick={() => handleSave(c.key, c.dataType)}
                                disabled={updateMutation.isPending}
                                className="btn btn-primary btn-xs"
                              >
                                Save
                              </button>
                              <button onClick={cancelEdit} className="btn btn-secondary btn-xs">
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button onClick={() => startEdit(c)} className="action-btn text-blue">
                              Change
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .system-config-container { display: flex; flex-direction: column; gap: 20px; }
        .settings-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
        .settings-title { font-size: 22px; font-weight: 700; color: var(--text-primary); }
        .settings-subtitle { font-size: 13.5px; color: var(--text-muted); margin-top: 2px; }
        .categories-tabs { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 4px; }
        .tab-btn { padding: 6px 14px; border: 1px solid var(--border); background: white; border-radius: var(--radius); font-size: 12.5px; font-weight: 600; color: var(--text-secondary); cursor: pointer; transition: background 150ms; }
        .tab-btn:hover { background: var(--bg-secondary); }
        .tab-btn.active { background: var(--brand-blue); color: white; border-color: var(--brand-blue); }
        .table-card { border-radius: var(--radius-lg); overflow: hidden; }
        .settings-table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
        .settings-table th { background: var(--bg-secondary); padding: 12px 20px; text-align: left; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; color: var(--text-muted); border-bottom: 1px solid var(--border); }
        .settings-table td { padding: 14px 20px; border-bottom: 1px solid var(--border); color: var(--text-secondary); vertical-align: middle; }
        .settings-table tr:hover td { background: var(--bg-secondary); }
        .setting-key-display { font-weight: 600; color: var(--text-primary); font-size: 14px; }
        .setting-key-code { font-family: var(--font-mono); font-size: 11px; color: var(--text-muted); margin-top: 2px; display: block; }
        .setting-value-text { font-size: 14px; color: var(--text-primary); font-weight: 500; }
        .actions-cell { display: flex; gap: 12px; align-items: center; min-height: 44px; }
        .action-btn { background: none; border: none; font-size: 13.5px; font-weight: 600; cursor: pointer; }
        .action-btn.text-blue { color: var(--brand-blue); }
        .action-btn.text-blue:hover { text-decoration: underline; }
        .form-input { height: 34px; padding: 0 10px; border: 1.5px solid var(--border); border-radius: var(--radius); font-size: 13.5px; color: var(--text-primary); outline: none; background: white; }
        .form-input:focus { border-color: var(--brand-blue); }
        .input-editor { width: 100%; max-width: 320px; }
        .select-editor { width: 100%; max-width: 180px; }
        .edit-actions { display: flex; gap: 6px; }
        .btn { border-radius: var(--radius); font-weight: 600; cursor: pointer; border: none; display: inline-flex; align-items: center; justify-content: center; }
        .btn-xs { height: 28px; padding: 0 10px; font-size: 12px; }
        .btn-primary { background: linear-gradient(135deg, var(--brand-blue), var(--brand-blue-light)); color: white; }
        .btn-secondary { background: var(--bg-tertiary); color: var(--text-secondary); border: 1px solid var(--border); }
      `}</style>
    </div>
  );
}
