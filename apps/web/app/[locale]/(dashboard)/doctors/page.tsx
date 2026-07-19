'use client';

import { useTranslations } from 'next-intl';
import { useRouter, useParams } from 'next/navigation';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAuthenticatedClient, gql } from '@/lib/graphql-client';

const DOCTORS_QUERY = gql`
  query Doctors($filters: DoctorFiltersInput, $page: Int, $limit: Int) {
    doctors(filters: $filters, page: $page, limit: $limit) {
      items {
        id
        bmdcNumber
        specialization
        qualification
        experience
        consultationFee
        isActive
        user {
          id
          firstName
          lastName
          email
          phone
        }
        department {
          id
          name
          nameBn
          code
        }
      }
      total
      page
      limit
    }
  }
`;

const DEPARTMENTS_QUERY = gql`
  query Departments {
    departments {
      id
      name
      nameBn
      code
    }
  }
`;

const USERS_QUERY = gql`
  query Users($filters: UserFilters) {
    users(filters: $filters) {
      items {
        id
        firstName
        lastName
        email
      }
    }
  }
`;

const CREATE_DOCTOR_MUTATION = gql`
  mutation CreateDoctor($input: CreateDoctorInput!) {
    createDoctor(input: $input) {
      id
      bmdcNumber
      specialization
    }
  }
`;

export default function DoctorDirectoryPage() {
  const commonT = useTranslations('common');
  const router = useRouter();
  const params = useParams();
  const locale = (params.locale as string) || 'en';
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [userId, setUserId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [bmdcNumber, setBmdcNumber] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [qualification, setQualification] = useState('');
  const [experience, setExperience] = useState('');
  const [consultationFee, setConsultationFee] = useState('');
  const [bio, setBio] = useState('');
  const [bioBn, setBioBn] = useState('');
  const [formError, setFormError] = useState('');

  const client = getAuthenticatedClient();

  // Query doctors
  const { data: doctorsData, isLoading } = useQuery({
    queryKey: ['doctors', search, selectedDeptId, page],
    queryFn: async () => {
      const res: any = await client.request(DOCTORS_QUERY, {
        filters: {
          search: search || undefined,
          departmentId: selectedDeptId || undefined,
        },
        page,
        limit: 10,
      });
      return res.doctors;
    },
  });

  // Query departments for filter/form dropdowns
  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const res: any = await client.request(DEPARTMENTS_QUERY);
      return res.departments;
    },
  });

  // Query users with DOCTOR role (role-003) for the creation dropdown
  const { data: usersData } = useQuery({
    queryKey: ['doctorUsers'],
    queryFn: async () => {
      const res: any = await client.request(USERS_QUERY, {
        filters: {
          roleId: 'role-003', // Fixed ID for DOCTOR role in seeders
        },
      });
      return res.users.items;
    },
    enabled: isModalOpen,
  });

  // Create Doctor Mutation
  const createDoctorMutation = useMutation({
    mutationFn: async (input: any) => {
      return client.request(CREATE_DOCTOR_MUTATION, { input });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
      setIsModalOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to create doctor profile.');
    },
  });

  const resetForm = () => {
    setUserId('');
    setDepartmentId('');
    setBmdcNumber('');
    setSpecialization('');
    setQualification('');
    setExperience('');
    setConsultationFee('');
    setBio('');
    setBioBn('');
    setFormError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !departmentId) {
      setFormError('Please select a user and a department.');
      return;
    }

    createDoctorMutation.mutate({
      userId,
      departmentId,
      bmdcNumber: bmdcNumber || undefined,
      specialization: specialization || undefined,
      qualification: qualification || undefined,
      experience: experience ? parseInt(experience, 10) : undefined,
      consultationFee: consultationFee ? parseFloat(consultationFee) : 0,
      bio: bio || undefined,
      bioBn: bioBn || undefined,
    });
  };

  const totalPages = doctorsData ? Math.ceil(doctorsData.total / 10) : 1;

  return (
    <div className="patient-list-container">
      {/* Header */}
      <div className="settings-header">
        <div>
          <h1 className="settings-title">Doctors Directory</h1>
          <p className="settings-subtitle">Manage medical staff profiles, schedules, and departments</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
          + Add Doctor Profile
        </button>
      </div>

      {/* Filters and search */}
      <div className="filters-card card mb-4">
        <div className="card-body grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="search-group relative">
            <input
              type="text"
              placeholder="Search by name, specialization, or qualification..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="form-input search-input w-full pl-10"
            />
            <svg
              className="absolute left-3 top-3 text-slate-400"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>

          <div>
            <select
              value={selectedDeptId}
              onChange={(e) => {
                setSelectedDeptId(e.target.value);
                setPage(1);
              }}
              className="form-input w-full"
            >
              <option value="">All Departments</option>
              {departments?.map((d: any) => (
                <option key={d.id} value={d.id}>
                  {locale === 'bn' ? d.nameBn || d.name : d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Directory Table */}
      <div className="card table-card">
        <div className="card-body p-0">
          {isLoading ? (
            <div className="p-6 text-center text-slate-500">Loading doctors directory...</div>
          ) : !doctorsData?.items?.length ? (
            <div className="p-6 text-center text-slate-500">{commonT('noData')}</div>
          ) : (
            <div className="table-responsive">
              <table className="settings-table w-full">
                <thead>
                  <tr>
                    <th>BMDC No.</th>
                    <th>Name</th>
                    <th>Department</th>
                    <th>Specialization</th>
                    <th>Experience</th>
                    <th>Fee (BDT)</th>
                    <th>Status</th>
                    <th>{commonT('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {doctorsData.items.map((d: any) => (
                    <tr key={d.id} className="hover:bg-slate-50 transition">
                      <td>
                        <code className="uhid-code">{d.bmdcNumber || 'N/A'}</code>
                      </td>
                      <td>
                        <span className="font-semibold text-slate-800">
                          Dr. {d.user.firstName} {d.user.lastName}
                        </span>
                        <div className="text-xs text-slate-500">{d.user.email}</div>
                      </td>
                      <td>
                        <span className="badge badge-info">
                          {locale === 'bn' ? d.department.nameBn || d.department.name : d.department.name}
                        </span>
                      </td>
                      <td className="text-slate-600 text-sm">{d.specialization || 'General Practitioner'}</td>
                      <td>{d.experience ? `${d.experience} Yrs` : '—'}</td>
                      <td className="font-medium text-slate-800">{d.consultationFee} BDT</td>
                      <td>
                        <span className={`status-badge ${d.isActive ? 'status-active' : 'status-inactive'}`}>
                          {d.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <button
                            onClick={() => router.push(`/${locale}/doctors/${d.id}`)}
                            className="btn btn-outline btn-sm text-xs px-2 py-1"
                          >
                            Profile
                          </button>
                          <button
                            onClick={() => router.push(`/${locale}/doctors/${d.id}/schedule`)}
                            className="btn btn-outline btn-sm text-xs px-2 py-1"
                          >
                            Schedule
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {doctorsData && doctorsData.total > 10 && (
        <div className="flex justify-between items-center mt-4">
          <span className="text-sm text-slate-500">
            Showing {(page - 1) * 10 + 1} to {Math.min(page * 10, doctorsData.total)} of {doctorsData.total} entries
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="btn btn-outline btn-sm"
            >
              Previous
            </button>
            <span className="self-center text-sm font-medium text-slate-700">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
              className="btn btn-outline btn-sm"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Add Doctor Modal */}
      {isModalOpen && (
        <div className="modal-backdrop fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex justify-center items-center p-4">
          <div className="modal-container bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto card">
            <div className="card-body">
              <div className="flex justify-between items-center border-b pb-3 mb-4">
                <h3 className="text-lg font-bold text-slate-900">Register Doctor Profile</h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  ✕
                </button>
              </div>

              {formError && (
                <div className="p-3 bg-red-50 text-red-700 rounded text-sm mb-4 border border-red-200">
                  {formError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label font-medium block text-sm mb-1 text-slate-700">Select User *</label>
                    <select
                      value={userId}
                      onChange={(e) => setUserId(e.target.value)}
                      required
                      className="form-input w-full"
                    >
                      <option value="">Choose User...</option>
                      {usersData?.map((u: any) => (
                        <option key={u.id} value={u.id}>
                          {u.firstName} {u.lastName} ({u.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="form-label font-medium block text-sm mb-1 text-slate-700">Department *</label>
                    <select
                      value={departmentId}
                      onChange={(e) => setDepartmentId(e.target.value)}
                      required
                      className="form-input w-full"
                    >
                      <option value="">Select Department...</option>
                      {departments?.map((d: any) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label font-medium block text-sm mb-1 text-slate-700">BMDC Reg Number</label>
                    <input
                      type="text"
                      value={bmdcNumber}
                      onChange={(e) => setBmdcNumber(e.target.value)}
                      placeholder="e.g. A-12345"
                      className="form-input w-full"
                    />
                  </div>

                  <div>
                    <label className="form-label font-medium block text-sm mb-1 text-slate-700">Consultation Fee (BDT)</label>
                    <input
                      type="number"
                      value={consultationFee}
                      onChange={(e) => setConsultationFee(e.target.value)}
                      placeholder="e.g. 800"
                      className="form-input w-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label font-medium block text-sm mb-1 text-slate-700">Specialization</label>
                    <input
                      type="text"
                      value={specialization}
                      onChange={(e) => setSpecialization(e.target.value)}
                      placeholder="e.g. Interventional Cardiology"
                      className="form-input w-full"
                    />
                  </div>

                  <div>
                    <label className="form-label font-medium block text-sm mb-1 text-slate-700">Experience (Years)</label>
                    <input
                      type="number"
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                      placeholder="e.g. 10"
                      className="form-input w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label font-medium block text-sm mb-1 text-slate-700">Qualification</label>
                  <input
                    type="text"
                    value={qualification}
                    onChange={(e) => setQualification(e.target.value)}
                    placeholder="e.g. MBBS, FCPS (Medicine)"
                    className="form-input w-full"
                  />
                </div>

                <div>
                  <label className="form-label font-medium block text-sm mb-1 text-slate-700">Professional Bio (English)</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    placeholder="Brief professional profile..."
                    className="form-input w-full p-2 border rounded"
                  />
                </div>

                <div>
                  <label className="form-label font-medium block text-sm mb-1 text-slate-700">Professional Bio (বাংলা)</label>
                  <textarea
                    value={bioBn}
                    onChange={(e) => setBioBn(e.target.value)}
                    rows={3}
                    placeholder="সংক্ষিপ্ত পেশাগত বিবরণ..."
                    className="form-input w-full p-2 border rounded"
                  />
                </div>

                <div className="flex justify-end gap-2 border-t pt-3 mt-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-outline">
                    {commonT('cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={createDoctorMutation.isPending}
                    className="btn btn-primary"
                  >
                    {createDoctorMutation.isPending ? 'Saving...' : 'Register'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
