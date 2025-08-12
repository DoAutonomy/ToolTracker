'use client';
import React, { useState, useEffect } from 'react';
import { Layout, Card, Button, Input, Select, Badge, MissingToolsWarning } from '../components/ui';
import { ScanningMode, SCAN_MODE_CONFIGS, Job, Tool, DEFAULT_TOOL_TYPES } from '../types';

export default function ScanPage() {
  const [currentMode, setCurrentMode] = useState<ScanningMode>(ScanningMode.ADD_TOOL);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [scannedTools, setScannedTools] = useState<Tool[]>([]);
  const [missingTools, setMissingTools] = useState<Tool[]>([]);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [toolTypeInput, setToolTypeInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'warning' } | null>(null);

  // Fetch jobs when component mounts or when we need job selection
  useEffect(() => {
    if (currentMode === ScanningMode.ASSIGN_TOOLS || currentMode === ScanningMode.RETURN_TOOLS) {
      fetchJobs();
    }
  }, [currentMode]);

  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/jobs?finished=false');
      const result = await response.json();
      if (result.success) {
        setJobs(result.data);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  // Fetch missing tools for selected job in return mode
  const fetchMissingTools = async (jobId: string) => {
    try {
      const response = await fetch(`/api/jobs/${jobId}/missing-tools`);
      const result = await response.json();
      if (result.success) {
        setMissingTools(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching missing tools:', error);
    }
  };

  // Effect to fetch missing tools when job is selected in return mode
  useEffect(() => {
    if (currentMode === ScanningMode.RETURN_TOOLS && selectedJob) {
      fetchMissingTools(selectedJob.jobId);
    } else {
      setMissingTools([]);
    }
  }, [selectedJob, currentMode]);

  const handleModeChange = (mode: ScanningMode) => {
    setCurrentMode(mode);
    setSelectedJob(null);
    setScannedTools([]);
    setMissingTools([]);
    setBarcodeInput('');
    setToolTypeInput('');
    setMessage(null);
  };

  const handleBarcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    setIsLoading(true);
    
    try {
      if (currentMode === ScanningMode.ADD_TOOL) {
        await handleAddNewTool();
      } else {
        await handleScanExistingTool();
      }
    } catch (error) {
      console.error('Error processing barcode:', error);
      setMessage({ text: 'Error processing barcode', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNewTool = async () => {
    if (!toolTypeInput.trim()) {
      setMessage({ text: 'Please select a tool type', type: 'error' });
      return;
    }

    const response = await fetch('/api/tools', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tin: barcodeInput.trim(),
        toolType: toolTypeInput.trim()
      })
    });

    const result = await response.json();
    
    if (result.success) {
      setMessage({ text: `Tool ${result.data.tin} added successfully!`, type: 'success' });
      setBarcodeInput('');
      setToolTypeInput('');
    } else {
      setMessage({ text: result.error || 'Failed to add tool', type: 'error' });
    }
  };

  const handleScanExistingTool = async () => {
    const response = await fetch(`/api/tools/by-tin/${encodeURIComponent(barcodeInput.trim())}`);
    const result = await response.json();

    if (!result.success) {
      setMessage({ text: 'Tool not found in database', type: 'error' });
      return;
    }

    const tool = result.data;

    // Check if tool is already in scanned list
    if (scannedTools.some(t => t.toolId === tool.toolId)) {
      setMessage({ text: 'Tool already scanned', type: 'warning' });
      return;
    }

    // For assign mode, check if tool is already assigned
    if (currentMode === ScanningMode.ASSIGN_TOOLS && tool.isCurrentlyAssigned) {
      setMessage({ text: `Tool ${tool.tin} is already assigned to a job`, type: 'error' });
      return;
    }

    // For return mode, check if tool is assigned to the selected job
    if (currentMode === ScanningMode.RETURN_TOOLS && selectedJob) {
      if (!tool.isCurrentlyAssigned) {
        setMessage({ text: `Tool ${tool.tin} is not currently assigned`, type: 'error' });
        return;
      }
      if (tool.currentJob?.jobId !== selectedJob.jobId) {
        setMessage({ text: `Tool ${tool.tin} is assigned to a different job`, type: 'error' });
        return;
      }
    }

    setScannedTools(prev => [...prev, tool]);
    setBarcodeInput('');
    setMessage({ text: `Tool ${tool.tin} scanned successfully`, type: 'success' });
  };

  const handleRemoveTool = (toolId: string) => {
    setScannedTools(prev => prev.filter(t => t.toolId !== toolId));
  };

  const handleSubmit = async () => {
    if (scannedTools.length === 0) {
      setMessage({ text: 'No tools to process', type: 'error' });
      return;
    }

    if ((currentMode === ScanningMode.ASSIGN_TOOLS || currentMode === ScanningMode.RETURN_TOOLS) && !selectedJob) {
      setMessage({ text: 'Please select a job', type: 'error' });
      return;
    }

    setIsLoading(true);

    try {
      if (currentMode === ScanningMode.ASSIGN_TOOLS) {
        await handleAssignTools();
      } else if (currentMode === ScanningMode.RETURN_TOOLS) {
        await handleReturnTools();
      }
    } catch (error) {
      console.error('Error submitting:', error);
      setMessage({ text: 'Error processing request', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignTools = async () => {
    const response = await fetch('/api/assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobId: selectedJob!.jobId,
        toolIds: scannedTools.map(t => t.toolId)
      })
    });

    const result = await response.json();
    
    if (result.success) {
      setMessage({ text: `${scannedTools.length} tools assigned to job successfully!`, type: 'success' });
      setScannedTools([]);
    } else {
      setMessage({ text: result.error || 'Failed to assign tools', type: 'error' });
    }
  };

  const handleReturnTools = async () => {
    const response = await fetch('/api/assignments/return', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobId: selectedJob!.jobId,
        toolIds: scannedTools.map(t => t.toolId)
      })
    });

    const result = await response.json();
    
    if (result.success) {
      const data = result.data;
      let messageText = `${data.summary.returned} tools returned successfully!`;
      
      if (data.summary.missing > 0) {
        messageText += ` Warning: ${data.summary.missing} tools still missing from this job.`;
        setMessage({ text: messageText, type: 'warning' });
      } else {
        setMessage({ text: messageText, type: 'success' });
      }
      
      setScannedTools([]);
      // Refresh missing tools after return
      if (selectedJob) {
        fetchMissingTools(selectedJob.jobId);
      }
    } else {
      setMessage({ text: result.error || 'Failed to return tools', type: 'error' });
    }
  };

  const handleClear = () => {
    setScannedTools([]);
    setBarcodeInput('');
    setMessage(null);
  };

  // Enhanced keyboard support for barcode scanners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Focus barcode input when any alphanumeric key is pressed (unless already focused)
      if (document.activeElement?.tagName !== 'INPUT' &&
          document.activeElement?.tagName !== 'SELECT' &&
          /^[a-zA-Z0-9]$/.test(e.key)) {
        const barcodeField = document.getElementById('barcode-input');
        if (barcodeField) {
          barcodeField.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const currentConfig = SCAN_MODE_CONFIGS.find(config => config.id === currentMode)!;

  return (
    <Layout title="Scan Tools">
      <div className="space-y-6">
        
        {/* Mode Selection */}
        <Card title="Select Scanning Mode">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {SCAN_MODE_CONFIGS.map((config) => (
              <button
                key={config.id}
                onClick={() => handleModeChange(config.id)}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  currentMode === config.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <h3 className="font-medium text-gray-900 mb-2">{config.title}</h3>
                <p className="text-sm text-gray-600">{config.description}</p>
              </button>
            ))}
          </div>
        </Card>

        {/* Main Scanning Interface */}
        <Card title={currentConfig.title}>
          <div className="space-y-6">
            
            {/* Job Selection (for modes 2 & 3) */}
            {currentConfig.requiresJob && (
              <div>
                <Select
                  label="Select Job"
                  value={selectedJob?.jobId || ''}
                  onChange={(e) => {
                    const job = jobs.find(j => j.jobId === e.target.value);
                    setSelectedJob(job || null);
                  }}
                  options={jobs.map(job => ({
                    value: job.jobId,
                    label: `${job.company} (${new Date(job.startDate).toLocaleDateString()})`
                  }))}
                  placeholder="Select a job..."
                />
              </div>
            )}

            {/* Tool Type Input (for mode 1) */}
            {currentConfig.requiresToolType && (
              <div>
                <Select
                  label="Tool Type"
                  value={toolTypeInput}
                  onChange={(e) => setToolTypeInput(e.target.value)}
                  options={DEFAULT_TOOL_TYPES.map(type => ({
                    value: type,
                    label: type
                  }))}
                  placeholder="Select tool type..."
                />
              </div>
            )}

            {/* Missing Tools Warning (for return mode) */}
            {currentMode === ScanningMode.RETURN_TOOLS && selectedJob && (
              <MissingToolsWarning
                missingTools={missingTools}
                jobName={`${selectedJob.company} (${new Date(selectedJob.startDate).toLocaleDateString()})`}
                className="mb-4"
              />
            )}

            {/* Barcode Input */}
            <form onSubmit={handleBarcodeSubmit} className="space-y-4">
              <Input
                id="barcode-input"
                label="Scan or Enter Tool Barcode"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder="Scan barcode or type TIN..."
                autoFocus
              />
              <Button
                type="submit"
                loading={isLoading}
                disabled={!barcodeInput.trim() || (currentConfig.requiresToolType && !toolTypeInput) || (currentConfig.requiresJob && !selectedJob)}
              >
                {isLoading ? 'Processing...' : currentMode === ScanningMode.ADD_TOOL ? 'Add Tool' : 'Scan Tool'}
              </Button>
            </form>

            {/* Message Display */}
            {message && (
              <div className={`p-3 rounded-md ${
                message.type === 'success' ? 'bg-green-100 text-green-800' :
                message.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {message.text}
              </div>
            )}

            {/* Scanned Tools List */}
            {scannedTools.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">
                    Scanned Tools ({scannedTools.length})
                  </h4>
                  <div className="text-sm text-gray-500">
                    {currentMode === ScanningMode.RETURN_TOOLS && missingTools.length > 0 &&
                      `${missingTools.length} still missing`
                    }
                  </div>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {scannedTools.map((tool) => (
                    <div key={tool.toolId} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="flex-shrink-0">
                          <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <span className="font-medium">{tool.tin}</span>
                        <Badge variant="info">{tool.toolType}</Badge>
                      </div>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleRemoveTool(tool.toolId)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-4">
                  <Button
                    variant="primary"
                    onClick={handleSubmit}
                    loading={isLoading}
                    disabled={currentConfig.requiresJob && !selectedJob}
                  >
                    {currentConfig.buttonText}
                  </Button>
                  <Button variant="secondary" onClick={handleClear}>
                    Clear All
                  </Button>
                </div>
              </div>
            )}

          </div>
        </Card>
        
      </div>
    </Layout>
  );
}