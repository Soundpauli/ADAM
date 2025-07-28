import React, { useState } from 'react';

interface PromptViewerProps {
  prompt: string;
}

const PromptViewer: React.FC<PromptViewerProps> = ({ prompt }) => {
  const [isPromptVisible, setIsPromptVisible] = useState(false);
  
  if (!prompt) return null;
  
  return (
    <div className="mt-5">
      <button
        onClick={() => setIsPromptVisible(!isPromptVisible)}
        className="flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors duration-150"
      >
        <span className="mr-2">{isPromptVisible ? '▼' : '▶'}</span>
        View AI Prompt
      </button>
      {isPromptVisible && (
        <div className="mt-2">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <pre className="whitespace-pre-wrap text-sm text-gray-600 font-mono overflow-auto max-h-48">
              {prompt}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromptViewer;