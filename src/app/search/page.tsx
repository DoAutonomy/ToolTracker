'use client';
import React, { useState, useEffect } from 'react';
import { Layout, Card, Button, Input, Select, Badge } from '../components/ui';
import { ApiResponse } from '../types/api';

interface QueryResult {
  id: string;
  name: string;
  description: string;
  endpoint: string;
  requiresInput?: boolean;
  inputLabel?: string;
  inputPlaceholder?: string;
}

interface MissingTool {
  toolId: string;
  tin: string;
  toolType: string;
  assignedAt: string;
  jobId: string;
  company: string;
  startDate: string;
  endDate?: string;
  daysSinceAssigned: number;
}

interface ToolUsageStats {
  toolId: string;
  tin: string;
  toolType: string;
  totalAssignments: number;
  averageDaysPerAssignment: number;
  lastAssignedAt?: string;
  isCurrentlyAssigned: boolean;
}

interface OverdueTool {
  toolId: string;
  tin: string;
  toolType: string;
  jobId: string;
  company: string;
  endDate: string;
  assignedAt: string;
  daysOverdue: number;
}

interface CompanyTool {
  toolId: string;
  tin: string;
  toolType: string;
  assignedAt: string;
  jobId: string;
  startDate: string;
  endDate?: string;
}

interface JobTool {
  toolId: string;
  tin: string;
  toolType: string;
  assignedAt: string;
  returnedAt?: string;
  isReturned: boolean;
}

interface JobHistoryItem {
  id: string;
  jobId: string;
  company: string;
  startDate: string;
  endDate?: string;
  assignedAt: string;
  returnedAt?: string;
  isReturned: boolean;
}

const PREDEFINED_QUERIES: QueryResult[] = [
  {
    id: 'missing-tools',
    name: 'Missing Tools',
    description: 'All currently missing tools across all jobs',
    endpoint: '/api/queries/missing-tools'
  },
  {
    id: 'tool-usage-stats',
    name: 'Tool Usage Statistics',
    description: 'Usage statistics for all tools in the system',
    endpoint: '/api/queries/tool-usage-stats'
  },
  {
    id: 'overdue-returns',
    name: 'Overdue Returns',
    description: 'Tools not returned after job end date',
    endpoint: '/api/queries/overdue-returns'
  },
  {
    id: 'job-history',
    name: 'Tool Job History',
    description: 'Job history for a specific tool',
    endpoint: '/api/queries/job-history',
    requiresInput: true,
    inputLabel: 'Tool ID',
    inputPlaceholder: 'Enter tool ID to view history'
  },
  {
    id: 'company-tools',
    name: 'Company Tools',
    description: 'All tools currently assigned to a company',
    endpoint: '/api/queries/company-tools',
    requiresInput: true,
    inputLabel: 'Company Name',
    inputPlaceholder: 'Enter company name'
  },
  {
    id: 'tools-by-job',
    name: 'Job Tools',
    description: 'Detailed tool information for a specific job',
    endpoint: '/api/queries/tools-by-job',
    requiresInput: true,
    inputLabel: 'Job ID',
    inputPlaceholder: 'Enter job ID'
  }
];

export default function SearchPage() {
  const [selectedQuery, setSelectedQuery] = useState<QueryResult | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleQuerySelect = (query: QueryResult) => {
    setSelectedQuery(query);
    setInputValue('');
    setResults([]);
    setError(null);
    setSearchTerm('');
  };

  const executeQuery = async () => {
    if (!selectedQuery) return;
    
    if (selectedQuery.requiresInput && !inputValue.trim()) {
      setError(`Please enter a ${selectedQuery.inputLabel?.toLowerCase()}`);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let url = selectedQuery.endpoint;
      if (selectedQuery.requiresInput) {
        url += `/${encodeURIComponent(inputValue.trim())}`;
      }

      const response = await fetch(url);
      const result: ApiResponse = await response.json();

      if (result.success) {
        setResults(Array.isArray(result.data) ? result.data : []);
      } else {
        setError(result.error || 'Query failed');
        setResults([]);
      }
    } catch (err) {
      setError('Failed to execute query');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setSelectedQuery(null);
    setInputValue('');
    setResults([]);
    setError(null);
    setSearchTerm('');
  };

  // Filter results based on search term
  const filteredResults = results.filter(result => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return Object.values(result).some(value => 
      value && value.toString().toLowerCase().includes(searchLower)
    );
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const renderMissingToolsTable = (tools: MissingTool[]) => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TIN</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tool Type</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned Date</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days Missing</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job End</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {tools.map((tool) => (
            <tr key={tool.toolId} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{tool.tin}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <Badge variant="info">{tool.toolType}</Badge>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{tool.company}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(tool.assignedAt)}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">{tool.daysSinceAssigned} days</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {tool.endDate ? formatDate(tool.endDate) : 'Ongoing'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderUsageStatsTable = (stats: ToolUsageStats[]) => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TIN</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tool Type</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Uses</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Days/Use</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Used</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {stats.map((stat) => (
            <tr key={stat.toolId} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{stat.tin}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <Badge variant="info">{stat.toolType}</Badge>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{stat.totalAssignments}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{Math.round(stat.averageDaysPerAssignment)}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {stat.lastAssignedAt ? formatDate(stat.lastAssignedAt) : 'Never'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <Badge variant={stat.isCurrentlyAssigned ? 'warning' : 'success'}>
                  {stat.isCurrentlyAssigned ? 'Assigned' : 'Available'}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderOverdueTable = (tools: OverdueTool[]) => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TIN</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tool Type</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job End Date</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days Overdue</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned Date</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {tools.map((tool) => (
            <tr key={tool.toolId} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{tool.tin}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <Badge variant="info">{tool.toolType}</Badge>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{tool.company}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(tool.endDate)}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">{tool.daysOverdue} days</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(tool.assignedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderCompanyToolsTable = (tools: CompanyTool[]) => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TIN</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tool Type</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned Date</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job Start</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job End</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {tools.map((tool) => (
            <tr key={tool.toolId} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{tool.tin}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <Badge variant="info">{tool.toolType}</Badge>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(tool.assignedAt)}</td>
<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(tool.startDate)}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {tool.endDate ? formatDate(tool.endDate) : 'Ongoing'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderJobToolsTable = (tools: JobTool[]) => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TIN</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tool Type</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned Date</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Return Date</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {tools.map((tool) => (
            <tr key={tool.toolId} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{tool.tin}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <Badge variant="info">{tool.toolType}</Badge>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(tool.assignedAt)}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {tool.returnedAt ? formatDate(tool.returnedAt) : '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <Badge variant={tool.isReturned ? 'success' : 'warning'}>
                  {tool.isReturned ? 'Returned' : 'Missing'}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderJobHistoryTable = (history: JobHistoryItem[]) => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job Start</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job End</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned Date</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Return Date</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {history.map((item) => (
            <tr key={item.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.company}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(item.startDate)}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {item.endDate ? formatDate(item.endDate) : 'Ongoing'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(item.assignedAt)}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {item.returnedAt ? formatDate(item.returnedAt) : '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <Badge variant={item.isReturned ? 'success' : 'warning'}>
                  {item.isReturned ? 'Returned' : 'Still Out'}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderResults = () => {
    if (!selectedQuery || filteredResults.length === 0) return null;

    const renderTable = () => {
      switch (selectedQuery.id) {
        case 'missing-tools':
          return renderMissingToolsTable(filteredResults as MissingTool[]);
        case 'tool-usage-stats':
          return renderUsageStatsTable(filteredResults as ToolUsageStats[]);
        case 'overdue-returns':
          return renderOverdueTable(filteredResults as OverdueTool[]);
        case 'company-tools':
          return renderCompanyToolsTable(filteredResults as CompanyTool[]);
        case 'tools-by-job':
          return renderJobToolsTable(filteredResults as JobTool[]);
        case 'job-history':
          return renderJobHistoryTable(filteredResults as JobHistoryItem[]);
        default:
          return (
            <div className="text-gray-500 text-center py-8">
              No results to display
            </div>
          );
      }
    };

    return (
      <Card title={`${selectedQuery.name} Results (${filteredResults.length})`}>
        <div className="space-y-4">
          {/* Search/Filter */}
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Input
                label=""
                placeholder="Filter results..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="text-sm text-gray-500">
              {filteredResults.length} of {results.length} results
            </div>
          </div>

          {/* Results Table */}
          {renderTable()}
        </div>
      </Card>
    );
  };

  return (
    <Layout title="Search & Query Tools">
      <div className="space-y-6">
        
        {/* Query Selection */}
        <Card title="Select Query">
          <div className="space-y-4">
            <p className="text-gray-600">
              Choose from predefined queries to search through the database and analyze tool usage.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {PREDEFINED_QUERIES.map((query) => (
                <button
                  key={query.id}
                  onClick={() => handleQuerySelect(query)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    selectedQuery?.id === query.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <h3 className="font-medium text-gray-900 mb-2">{query.name}</h3>
                  <p className="text-sm text-gray-600">{query.description}</p>
                  {query.requiresInput && (
                    <div className="mt-2">
                      <Badge variant="info">Requires Input</Badge>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Query Execution */}
        {selectedQuery && (
          <Card title={`Execute Query: ${selectedQuery.name}`}>
            <div className="space-y-4">
              <p className="text-gray-600">{selectedQuery.description}</p>
              
              {/* Input field for queries that require parameters */}
              {selectedQuery.requiresInput && (
                <div className="max-w-md">
                  <Input
                    label={selectedQuery.inputLabel || 'Input'}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={selectedQuery.inputPlaceholder || 'Enter value...'}
                  />
                </div>
              )}

              {/* Action buttons */}
              <div className="flex space-x-4">
                <Button
                  variant="primary"
                  onClick={executeQuery}
                  loading={isLoading}
                  disabled={selectedQuery.requiresInput && !inputValue.trim()}
                >
                  {isLoading ? 'Executing...' : 'Execute Query'}
                </Button>
                <Button variant="secondary" onClick={handleClear}>
                  Clear
                </Button>
              </div>

              {/* Error display */}
              {error && (
                <div className="p-3 rounded-md bg-red-100 text-red-800">
                  {error}
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Results */}
        {renderResults()}

        {/* Empty state */}
        {selectedQuery && !isLoading && results.length === 0 && !error && (
          <Card title="No Results">
            <div className="text-center py-8 text-gray-500">
              {selectedQuery.requiresInput 
                ? 'Execute the query to see results'
                : 'No data found for this query'
              }
            </div>
          </Card>
        )}
        
      </div>
    </Layout>
  );
}