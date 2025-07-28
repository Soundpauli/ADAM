import React from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface ValidationDisplayProps {
  validation: {
    passed: boolean;
    issues: string[];
  } | null;
}

const ValidationDisplay: React.FC<ValidationDisplayProps> = ({ validation }) => {
  if (!validation) return null;
  
  if (validation.passed) return null;

  return (
    <div className="mt-3">
      <div className="rounded-md p-3 bg-red-50 text-red-800 border border-red-200">
        <div className="flex items-center text-sm font-medium">
          <AlertCircle size={16} className="mr-2 text-red-500" />
          Validation Failed
        </div>
        {validation.issues.length > 0 && (
          <ul className="mt-2 list-disc pl-5 text-sm">
            {validation.issues.map((issue, index) => (
              <li key={index}>{issue}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ValidationDisplay;