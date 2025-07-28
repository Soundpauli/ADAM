import React from 'react';

interface QualityAssessmentProps {
  quality: {
    rating: number;
    remarks: string;
  } | null;
  isSkipped?: boolean;
  threshold?: number;
}

const QualityAssessment: React.FC<QualityAssessmentProps> = ({ 
  quality, 
  isSkipped = false, 
  threshold = 90 
}) => {
  if (!quality) return null;
  
  // Check if the remarks mention language issues
  const hasLanguageIssue = quality.remarks.toLowerCase().includes('language') && 
                           (quality.remarks.toLowerCase().includes('wrong') || 
                            quality.remarks.toLowerCase().includes('not in') ||
                            quality.remarks.toLowerCase().includes('incorrect'));
  
  return (
    <div className={`mb-4 p-3 rounded-lg ${
      hasLanguageIssue 
        ? 'bg-red-50 border border-red-200' 
        : 'bg-blue-50 border border-blue-200'
    }`}>
      <div className="flex items-start">
        <h4 className={`text-sm font-medium ${
          hasLanguageIssue ? 'text-red-900' : 'text-blue-900'
        }`}>
          Content Quality Assessment: {quality.rating}%
        </h4>
      </div>
      <p className={`mt-1.5 text-sm ${
        hasLanguageIssue ? 'text-red-800' : 'text-blue-800'
      }`}>
        {quality.remarks}
      </p>
      {hasLanguageIssue && (
        <div className="mt-2 text-sm font-medium text-red-900 bg-red-100 p-2 rounded">
          Language mismatch detected. Content contains text in the wrong language.
        </div>
      )}
      {isSkipped && !hasLanguageIssue && (
        <div className="mt-2 text-sm font-medium text-blue-900 bg-blue-100 p-2 rounded">
          Content already meets quality standards (above {threshold}%). No enhancement needed.
        </div>
      )}
    </div>
  );
};

export default QualityAssessment;