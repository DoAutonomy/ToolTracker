'use client';
import React, { useState, useEffect } from 'react';
import { Layout, Card, Button, Input, Select, Badge } from '../components/ui';
import { Tool, DEFAULT_TOOL_TYPES } from '../types';

interface CreateToolData {
  tin: string;
  toolType: string;
}

interface ToolWithStatus extends Tool {
  isCurrentlyAssigned: boolean;
  currentJob?: {
    jobId: string;
    company: string;
    startDate: string;
    endDate?: string;
  };
}

export default function ToolsPage() {
  const [tools, setTools] = useState<ToolWithStatus[]>([]);
  const [filteredTools, setFilteredTools] = useState<ToolWithStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [toolTypeFilter, setToolTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Create form data
  const [createData, setCreateData] = useState<CreateToolData>({
    tin: '',
    toolType: ''
  });

  useEffect(() => {
    fetchTools();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [tools, searchTerm, toolTypeFilter, statusFilter]);

  const fetchTools = async () => {
    try {
      setIsLoading(true);
      
      // Fetch tools with assignment data
      const response = await fetch('/api/tools');
      const result = await response.json();
      
      if (result.success) {
        // For each tool, check its current assignment status
        const toolsWithStatus = await Promise.all(
          result.data.map(async (tool: Tool) => {
            try {
              // Check if tool is currently assigned by looking for active assignments
              const assignmentResponse = await fetch(`/api/tools/${tool.toolId}`);
              const assignmentResult = await assignmentResponse.json();
              
              const toolWithStatus: ToolWithStatus = {
                ...tool,
                isCurrentlyAssigned: false,
                currentJob: undefined
              };

              if (assignmentResult.success && assignmentResult.data.isCurrentlyAssigned) {
                toolWithStatus.isCurrentlyAssigned = true;
                toolWithStatus.currentJob = assignmentResult.data.currentJob;
              }

              return toolWithStatus;
            } catch (err) {
              // If individual tool fetch fails, just return the tool without assignment info
              return {
                ...tool,
                isCurrentlyAssigned: false,
                currentJob: undefined
              };
            }
          })
        );
        
        setTools(toolsWithStatus);
      } else {
        setError(result.error || 'Failed to load tools');
      }
    } catch (err) {
      setError('Failed to load tools');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = tools;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(tool => 
        tool.tin.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tool.toolType.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply tool type filter
    if (toolTypeFilter !== 'all') {
      filtered = filtered.filter(tool => 
        tool.toolType.toLowerCase() === toolTypeFilter.toLowerCase()
      );
    }

    // Apply status filter
    if (statusFilter === 'assigned') {
      filtered = filtered.filter(tool => tool.isCurrentlyAssigned);
    } else if (statusFilter === 'available') {
      filtered = filtered.filter(tool => !tool.isCurrentlyAssigned);
    }

    setFilteredTools(filtered);
  };

  const handleCreateTool = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!createData.tin.trim() || !createData.toolType.trim()) {
      setError('TIN and tool type are required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tin: createData.tin.trim(),
          toolType: createData.toolType.trim()
        })
      });

      const result = await response.json();
      
      if (result.success) {
        const newTool: ToolWithStatus = {
          ...result.data,
          isCurrentlyAssigned: false,
          currentJob: undefined
        };
        setTools(prev => [newTool, ...prev]);
        setCreateData({ tin: '', toolType: '' });
        setShowCreateForm(false);
      } else {
        setError(result.error || 'Failed to create tool');
      }
    } catch (err) {
      setError('Failed to create tool');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getUniqueToolTypes = () => {
    const types = new Set(tools.map(tool => tool.toolType));
    return Array.from(types).sort();
  };

  const getStatusBadgeVariant = (isAssigned: boolean) => {
    return isAssigned ? 'warning' : 'success';
  };

  return (
    <Layout title="Tools Management">
      <div className="space-y-6">
        
        {/* Header and Actions */}
        <Card title="Tool Management">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <p className="text-gray-600">
                Manage all tools in the system. View tool status and create new tools.
              </p>
              <Button
                variant="primary"
                onClick={() => setShowCreateForm(true)}
              >
                Add New Tool
              </Button>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Search Tools"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by TIN or tool type..."
              />
              <Select
                label="Tool Type Filter"
                value={toolTypeFilter}
                onChange={(e) => setToolTypeFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'All Tool Types' },
                  ...getUniqueToolTypes().map(type => ({
                    value: type,
                    label: type
                  }))
                ]}
              />
              <Select
                label="Status Filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'All Tools' },
                  { value: 'available', label: 'Available' },
                  { value: 'assigned', label: 'Assigned' }
                ]}
              />
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{tools.length}</div>
                <div className="text-sm text-gray-500">Total Tools</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {tools.filter(t => !t.isCurrentlyAssigned).length}
                </div>
                <div className="text-sm text-gray-500">Available</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {tools.filter(t => t.isCurrentlyAssigned).length}
                </div>
                <div className="text-sm text-gray-500">Assigned</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Create Tool Form */}
        {showCreateForm && (
          <Card title="Add New Tool">
            <form onSubmit={handleCreateTool} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Tool Identification Number (TIN)"
                  value={createData.tin}
                  onChange={(e) => setCreateData(prev => ({ ...prev, tin: e.target.value }))}
                  placeholder="Enter TIN/Barcode..."
                  required
                />
                <Select
                  label="Tool Type"
                  value={createData.toolType}
                  onChange={(e) => setCreateData(prev => ({ ...prev, toolType: e.target.value }))}
                  options={DEFAULT_TOOL_TYPES.map(type => ({
                    value: type,
                    label: type
                  }))}
                  placeholder="Select tool type..."
                />
              </div>
              
              <div className="flex space-x-4">
                <Button
                  type="submit"
                  variant="primary"
                  loading={isSubmitting}
                  disabled={!createData.tin.trim() || !createData.toolType.trim()}
                >
                  Add Tool
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowCreateForm(false);
                    setCreateData({ tin: '', toolType: '' });
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

        {/* Tools List */}
        <Card title={`Tools (${filteredTools.length})`}>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="text-gray-500">Loading tools...</div>
            </div>
          ) : filteredTools.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-500">
                {tools.length === 0 ? 'No tools found. Add your first tool!' : 'No tools match your current filters.'}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      TIN
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tool Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Current Job
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date Added
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTools.map((tool) => (
                    <tr key={tool.toolId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {tool.tin}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="info">{tool.toolType}</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={getStatusBadgeVariant(tool.isCurrentlyAssigned)}>
                          {tool.isCurrentlyAssigned ? 'Assigned' : 'Available'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {tool.currentJob ? (
                          <div>
                            <div className="font-medium">{tool.currentJob.company}</div>
                            <div className="text-xs text-gray-400">
                              Started: {formatDate(tool.currentJob.startDate)}
                            </div>
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(tool.dateAdded)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
        
      </div>
    </Layout>
  );
}