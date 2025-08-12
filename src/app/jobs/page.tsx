'use client';
import React, { useState, useEffect } from 'react';
import { Layout, Card, Button, Input, Select, Badge } from '../components/ui';
import { Job } from '../types';

interface CreateJobData {
  company: string;
  startDate: string;
  endDate: string;
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Create form data
  const [createData, setCreateData] = useState<CreateJobData>({
    company: '',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [jobs, searchTerm, statusFilter]);

  const fetchJobs = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/jobs');
      const result = await response.json();
      
      if (result.success) {
        setJobs(result.data);
      } else {
        setError(result.error || 'Failed to load jobs');
      }
    } catch (err) {
      setError('Failed to load jobs');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = jobs;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(job => 
        job.company.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter === 'active') {
      filtered = filtered.filter(job => !job.finished);
    } else if (statusFilter === 'finished') {
      filtered = filtered.filter(job => job.finished);
    }

    setFilteredJobs(filtered);
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!createData.company.trim() || !createData.startDate) {
      setError('Company name and start date are required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: createData.company.trim(),
          startDate: createData.startDate,
          endDate: createData.endDate || null
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setJobs(prev => [result.data, ...prev]);
        setCreateData({ company: '', startDate: '', endDate: '' });
        setShowCreateForm(false);
      } else {
        setError(result.error || 'Failed to create job');
      }
    } catch (err) {
      setError('Failed to create job');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinishJob = async (jobId: string) => {
    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ finished: true })
      });

      const result = await response.json();
      
      if (result.success) {
        setJobs(prev => prev.map(job => 
          job.jobId === jobId ? { ...job, finished: true } : job
        ));
      } else {
        setError(result.error || 'Failed to finish job');
      }
    } catch (err) {
      setError('Failed to finish job');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getJobStatus = (job: Job) => {
    if (job.finished) return 'finished';
    if (job.endDate && new Date(job.endDate) < new Date()) return 'overdue';
    return 'active';
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'finished': return 'info';
      case 'overdue': return 'danger';
      default: return 'info';
    }
  };

  return (
    <Layout title="Jobs Management">
      <div className="space-y-6">
        
        {/* Header and Actions */}
        <Card title="Job Management">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <p className="text-gray-600">
                Manage all jobs in the system. Create new jobs and track their status.
              </p>
              <Button
                variant="primary"
                onClick={() => setShowCreateForm(true)}
              >
                Create New Job
              </Button>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Search Jobs"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by company name..."
              />
              <Select
                label="Status Filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'All Jobs' },
                  { value: 'active', label: 'Active Jobs' },
                  { value: 'finished', label: 'Finished Jobs' }
                ]}
              />
            </div>
          </div>
        </Card>

        {/* Create Job Form */}
        {showCreateForm && (
          <Card title="Create New Job">
            <form onSubmit={handleCreateJob} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Company Name"
                  value={createData.company}
                  onChange={(e) => setCreateData(prev => ({ ...prev, company: e.target.value }))}
                  placeholder="Enter company name..."
                  required
                />
                <Input
                  label="Start Date"
                  type="date"
                  value={createData.startDate}
                  onChange={(e) => setCreateData(prev => ({ ...prev, startDate: e.target.value }))}
                  required
                />
                <Input
                  label="End Date (Optional)"
                  type="date"
                  value={createData.endDate}
                  onChange={(e) => setCreateData(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
              
              <div className="flex space-x-4">
                <Button
                  type="submit"
                  variant="primary"
                  loading={isSubmitting}
                  disabled={!createData.company.trim() || !createData.startDate}
                >
                  Create Job
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowCreateForm(false);
                    setCreateData({ company: '', startDate: '', endDate: '' });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Error Display */}
        {error && (
          <div className="p-3 rounded-md bg-red-100 text-red-800">
            {error}
          </div>
        )}

        {/* Jobs List */}
        <Card title={`Jobs (${filteredJobs.length})`}>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="text-gray-500">Loading jobs...</div>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-500">
                {jobs.length === 0 ? 'No jobs found. Create your first job!' : 'No jobs match your current filters.'}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Company
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Start Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      End Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredJobs.map((job) => {
                    const status = getJobStatus(job);
                    return (
                      <tr key={job.jobId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {job.company}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(job.startDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {job.endDate ? formatDate(job.endDate) : 'Ongoing'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={getStatusBadgeVariant(status)}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(job.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            {!job.finished && (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleFinishJob(job.jobId)}
                              >
                                Finish Job
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
        
      </div>
    </Layout>
  );
}