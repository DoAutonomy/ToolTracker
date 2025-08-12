import React from 'react';
import { Badge } from './index';
import { Tool } from '@/app/types';

export interface MissingToolsWarningProps {
  missingTools: Tool[];
  jobName: string;
  className?: string;
}

export default function MissingToolsWarning({ 
  missingTools, 
  jobName, 
  className = '' 
}: MissingToolsWarningProps) {
  if (missingTools.length === 0) {
    return (
      <div className={`p-4 bg-green-50 border border-green-200 rounded-lg ${className}`}>
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-800">
              All Tools Returned
            </h3>
            <p className="text-sm text-green-600 mt-1">
              All tools for "{jobName}" have been successfully returned.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 bg-red-50 border border-red-200 rounded-lg ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">
            Missing Tools Warning
          </h3>
          <p className="text-sm text-red-600 mt-1">
            The following {missingTools.length} tool{missingTools.length > 1 ? 's are' : ' is'} still missing from "{jobName}":
          </p>
          <div className="mt-3 space-y-2">
            {missingTools.map((tool) => (
              <div key={tool.toolId} className="flex items-center justify-between p-2 bg-white rounded border border-red-200">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-900">{tool.tin}</span>
                  <Badge variant="danger">{tool.toolType}</Badge>
                </div>
                <span className="text-xs text-red-600">Missing</span>
              </div>
            ))}
          </div>
          <div className="mt-3 text-xs text-red-600">
            <p>⚠️ Please locate and return these tools to complete the job closure.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export type { MissingToolsWarningProps };