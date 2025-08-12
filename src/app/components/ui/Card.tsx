import React from 'react';

export interface CardProps {
  title?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ 
  title, 
  children, 
  actions, 
  className = '' 
}) => {
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {(title || actions) && (
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          {title && (
            <h3 className="text-lg font-medium text-gray-900">
              {title}
            </h3>
          )}
          {actions && (
            <div className="flex space-x-2">
              {actions}
            </div>
          )}
        </div>
      )}
      
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};

export default Card;