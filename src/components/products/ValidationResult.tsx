import React from 'react';
import { AlertCircle, CheckCircle, Info, FileText } from 'lucide-react';

interface ValidationResultProps {
  result: {
    passed: boolean;
    issues: string[];
    quality?: { rating: number; remarks: string } | null;
    validationCriteria?: string[];
    validationPrompt?: string;
  };
  onClear: () => void;
}

const ValidationResult: React.FC<ValidationResultProps> = ({ result, onClear }) => {
  const [showPrompt, setShowPrompt] = React.useState(false);
  
  const handlePromptClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowPrompt(!showPrompt);
  };
  
  return (
    <div className="w-full">
      <button onClick={onClear} className="w-full text-left">
      <div className={`rounded-md overflow-hidden border transition-colors duration-150 ${
        result.passed
          ? 'border-green-200 hover:bg-green-50'
          : 'border-red-200 hover:bg-red-50'
      }`}>
        <div className={`flex items-center px-3 py-2 ${
          result.passed
            ? 'bg-green-50 text-green-800'
            : 'bg-red-50 text-red-800'
        }`}>
          {result.passed ? (
            <CheckCircle size={16} className="text-green-500 mr-2 flex-shrink-0" />
          ) : (
            <AlertCircle size={16} className="text-red-500 mr-2 flex-shrink-0" />
          )}
          <div className="font-medium text-sm">
            {result.passed ? 'Validation Passed' : 'Validation Failed'}
          </div>
        </div>
        
        <div className="p-3 text-sm bg-white">
          {result.quality && (
            <div className="mb-2">
              <span className="font-medium">Quality assessment:</span> {result.quality.remarks}
            </div>
          )}
          
          {result.validationCriteria && result.validationCriteria.length > 0 && (
            <div className="mb-2">
              <div className="flex items-center mb-1">
                <Info size={14} className="text-blue-500 mr-1" />
                <span className="font-medium text-blue-700">Validated against:</span>
              </div>
              <ul className="list-disc pl-5 space-y-1 text-xs text-blue-600">
                {result.validationCriteria.map((criteria, index) => (
                  <li key={index}>{criteria}</li>
                ))}
              </ul>
            </div>
          )}
          
          {!result.passed && result.issues.length > 0 && (
            <>
              <div className="font-medium mb-1 text-red-700">Issues found:</div>
              <ul className="list-disc pl-5 space-y-1 text-xs">
                {result.issues.map((issue, index) => (
                  <li key={index}>{issue}</li>
                ))}
              </ul>
            </>
          )}
          
          {result.passed && (
            <p className="text-green-700 text-xs">
              Content meets all requirements and format guidelines.
            </p>
          )}
          
          <div className="mt-2 text-xs text-gray-500 text-right italic">
            Click to dismiss
          </div>
        </div>
      </div>
      </button>
      
      {result.validationPrompt && (
        <div className="mt-2">
          <button
            onClick={handlePromptClick}
            className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800 transition-colors duration-150"
          >
            <FileText size={12} className="mr-1" />
            {showPrompt ? 'Hide' : 'Show'} validation details
          </button>
          
          {showPrompt && (
            <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-md">
              <div className="text-xs font-medium text-gray-700 mb-2">Validation Analysis Details:</div>
              <pre className="text-xs text-gray-600 whitespace-pre-wrap overflow-auto max-h-64 font-mono">
                {result.validationPrompt}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ValidationResult;