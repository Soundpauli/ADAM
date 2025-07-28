import React from 'react';
import { ArrowRight, Check, ThumbsUp, ThumbsDown, CheckCircle, AlertCircle } from 'lucide-react';
import QualityAssessment from './QualityAssessment';
import ValidationDisplay from './ValidationDisplay';
import PromptViewer from './PromptViewer';

interface EnhancementCardProps {
  fieldName: string;
  isActive: boolean;
  originalValue: string;
  enhancementState: {
    isLoading: boolean;
    error: string | null;
    enhanced: string | null;
    validation: { passed: boolean; issues: string[] } | null;
    quality: { rating: number; remarks: string } | null;
    prompt: string;
    accepted: boolean;
    declined: boolean;
    skipped: boolean;
  };
  qualityThreshold?: number;
  onAccept: () => void;
  onDecline: () => void;
}

interface EnhancementCardPropsWithEnhanceAnyway extends EnhancementCardProps {
  onEnhanceAnyway?: () => void;
}

const EnhancementCard: React.FC<EnhancementCardPropsWithEnhanceAnyway> = ({
  fieldName,
  isActive,
  originalValue,
  enhancementState: state,
  qualityThreshold = 90,
  onAccept,
  onDecline,
  onEnhanceAnyway
}) => {
  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <span className="font-medium text-gray-900 text-lg">{fieldName}</span>
        <div className="flex items-center gap-2">
          {state.quality && (
            <div className="flex items-center">
              <div className="text-sm font-medium text-gray-700">{state.quality.rating}%</div>
            </div>
          )}
          {state.accepted && (
            <span className="inline-flex items-center text-green-600 text-sm">
              <ThumbsUp size={14} className="mr-1" />
              Accepted
            </span>
          )}
          {state.declined && (
            <span className="inline-flex items-center text-red-600 text-sm">
              <ThumbsDown size={14} className="mr-1" />
              Declined
            </span>
          )}
          {state.skipped && (
            <span className="inline-flex items-center text-blue-600 text-sm">
              <CheckCircle size={14} className="mr-1" />
              High Quality (Retained)
            </span>
          )}
        </div>
      </div>
      <QualityAssessment 
        quality={state.quality}
        isSkipped={state.skipped}
        threshold={qualityThreshold}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900 mb-1">Original Content</h4>
          <div className="rounded-lg border border-gray-200 p-4 bg-gray-50 min-h-[12rem]">
            <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
              {originalValue && originalValue.trim().length > 0 ? (
                originalValue
              ) : (
                <span className="text-gray-400 italic">No original content</span>
              )}
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-sm font-medium text-gray-900 mb-0">
              {state.skipped ? (
                <span className="flex items-center">
                  <Check size={14} className="text-blue-500 mr-1.5" />
                  Original Content (Retained)
                </span>
              ) : (
                <span className="flex items-center">
                  <ArrowRight size={14} className="text-blue-500 mr-1.5" />
                  Enhanced Content
                </span>
              )}
            </h4>
            {state.validation?.passed && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 ml-2">
                <CheckCircle size={12} className="mr-1" />
                Valid
              </span>
            )}
            {state.validation && !state.validation.passed && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 ml-2">
                <AlertCircle size={12} className="mr-1" />
                Invalid
              </span>
            )}
          </div>
          {state.isLoading ? (
            <div className="rounded-lg border border-gray-200 p-4 bg-gray-50 min-h-[12rem] flex flex-col items-center justify-center">
              <div className="flex flex-col items-center space-y-2">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mb-2"></div>
                <span className="text-sm text-gray-600">Analyzing content...</span>
              </div>
            </div>
          ) : state.skipped ? (
            <div className="rounded-lg border border-gray-200 p-4 bg-blue-50 border-blue-200 min-h-[12rem]">
              <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {originalValue}
              </div>
              {state.error && (
                <div className="mt-2 text-sm text-red-600">{state.error}</div>
              )}
            </div>
          ) : state.enhanced ? (
            <div className="rounded-lg border border-gray-200 p-4 bg-gray-50 min-h-[12rem]">
              <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {state.enhanced}
              </div>
              {state.error && (
                <div className="mt-2 text-sm text-red-600">{state.error}</div>
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-gray-200 p-4 bg-gray-50 min-h-[12rem] flex items-center justify-center">
              {state.error && (
                <div className="text-sm text-red-600">{state.error}</div>
              )}
            </div>
          )}
        </div>
      </div>
      <PromptViewer prompt={state.prompt && !state.skipped ? state.prompt : ''} />
      <ValidationDisplay validation={state.validation} />
      {!state.accepted && !state.declined && (state.enhanced || state.skipped) ? (
        <div className="mt-5 flex justify-end space-x-3">
          {state.skipped && state.quality && state.quality.rating >= (qualityThreshold ?? 90) && onEnhanceAnyway && (
            <button
              type="button"
              onClick={onEnhanceAnyway}
              className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-150"
            >
              <ArrowRight size={16} className="mr-2" />
              Enhance Anyway
            </button>
          )}
          <button
            type="button"
            onClick={onAccept}
            className={`inline-flex items-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-150 ${state.skipped ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'}`}
          >
            <Check size={16} className="mr-2" />
            {state.skipped && state.quality && state.quality.rating >= (qualityThreshold ?? 90) ? 'Keep Original' : 'Accept Changes'}
          </button>
          {!(state.skipped && state.quality && state.quality.rating >= (qualityThreshold ?? 90)) && (
            <button
              type="button"
              onClick={onDecline}
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-150"
            >
              <ThumbsDown size={16} className="mr-2" />
              Decline
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default EnhancementCard;