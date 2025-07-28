import React, { useState, useEffect, useRef } from 'react';
import { X, Check, X as XIcon, CheckCircle } from 'lucide-react';
import { Product } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useFields } from '../../contexts/FieldContext';
import { 
  createOpenAIClient, 
  evaluateContentQuality, 
  enhanceField, 
  validateField 
} from '../../services/enhancement';
import LanguageSelector from '../shared/LanguageSelector';
import EnhancementCard from '../enhancement/EnhancementCard';
import { requestLogger } from '../../services/requestLogger';

interface AIEnhanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  fieldNames: string[];
  language: string;
  onAccept: (enhancedProduct: Product) => void;
}

const AIEnhanceModal: React.FC<AIEnhanceModalProps> = ({ 
  isOpen, 
  onClose, 
  product, 
  fieldNames = [], 
  language, 
  onAccept 
}) => {
  const { user } = useAuth();
  const { fields } = useFields();
  const [enhancedProduct, setEnhancedProduct] = useState<Product | null>(null);
  const [enhancementStates, setEnhancementStates] = useState<Record<string, {
    isLoading: boolean;
    error: string | null;
    enhanced: string | null;
    validation: { passed: boolean; issues: string[] } | null;
    quality: { rating: number; remarks: string } | null;
    prompt: string;
    accepted: boolean;
    declined: boolean;
    skipped: boolean;
  }>>({});
  const [currentFieldIndex, setCurrentFieldIndex] = useState<number>(0);
  const [showSummary, setShowSummary] = useState<boolean>(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>(language);
  const [isInitializing, setIsInitializing] = useState(false);
  const inFlightEnhancements = useRef<Set<string>>(new Set());
  const enhancementTriggered = useRef(false);

  // Store original values for all fields at mount
  // Remove originalValuesRef and useEffect

  const openai = createOpenAIClient(import.meta.env.VITE_OPENAI_API_KEY);

  // Helper to get the current field name
  const currentField = fieldNames[currentFieldIndex] || null;

  // Enhance only the current field
  const handleEnhance = async (fieldToEnhance: string, forceEnhance = false) => {
    if (inFlightEnhancements.current.has(fieldToEnhance)) {
      if (!forceEnhance) return;
    }
    inFlightEnhancements.current.add(fieldToEnhance);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setEnhancementStates(prev => ({
        ...prev,
        [fieldToEnhance]: {
          isLoading: true,
          error: null,
          enhanced: null,
          validation: null,
          quality: null,
          prompt: '',
          accepted: false,
          declined: false,
          skipped: false
        }
      }));
      const relevantFields = fields.filter(f => {
        if (!f.isActive) return false;
        const nameMatches = f.name.toLowerCase() === fieldToEnhance.toLowerCase();
        const categoryName = product.categoryName || '';
        const categoryMatches = !f.productCategories?.length || f.productCategories.includes(categoryName);
        return nameMatches && categoryMatches;
      });
      const enhanced = { ...(enhancedProduct || product) };
      if (relevantFields.length === 0) {
        setEnhancementStates(prev => ({
          ...prev,
          [fieldToEnhance]: {
            ...prev[fieldToEnhance],
            isLoading: false,
            error: `No field configuration found for "${fieldToEnhance}" in the "${product.categoryName}" category`
          }
        }));
        return;
      }
      for (const field of relevantFields) {
        const currentValue = (enhancedProduct || product)[fieldToEnhance as keyof Product] as string;
        const valueToEnhance = currentValue || '';
        if (!user) {
          setEnhancementStates(prev => ({
            ...prev,
            [fieldToEnhance]: {
              ...prev[fieldToEnhance],
              isLoading: false,
              error: 'User not authenticated. Cannot enhance content.'
            }
          }));
          continue;
        }
        let quality = null;
        if (valueToEnhance.trim()) {
          quality = await evaluateContentQuality(field, valueToEnhance, selectedLanguage, openai, user, product);
        } else {
          quality = { rating: 0, remarks: 'Field is missing and needs to be generated' };
        }
        const threshold = field.qualityThreshold || 90;
        if (!forceEnhance && quality.rating >= threshold && valueToEnhance.trim()) {
          const validation = validateField(field, valueToEnhance);
          setEnhancementStates(prev => ({
            ...prev,
            [fieldToEnhance]: {
              isLoading: false,
              error: null,
              enhanced: null,
              validation,
              quality,
              prompt: '',
              accepted: false,
              declined: false,
              skipped: true
            }
          }));
          continue;
        }
        const { value, prompt } = await enhanceField(field, valueToEnhance, selectedLanguage, openai, product, user);
        if (typeof value === 'string' && (fieldToEnhance in enhanced)) {
          (enhanced as Record<string, unknown>)[fieldToEnhance] = value;
        }
        const validation = validateField(field, value);
        setEnhancementStates(prev => ({
          ...prev,
          [fieldToEnhance]: {
            isLoading: false,
            error: null,
            enhanced: value,
            validation,
            quality,
            prompt,
            accepted: false,
            declined: false,
            skipped: false
          }
        }));
      }
      setEnhancedProduct(enhanced);
    } catch (error) {
      setEnhancementStates(prev => ({
        ...prev,
        [fieldToEnhance]: {
          ...prev[fieldToEnhance],
          isLoading: false,
          error: 'Failed to enhance product content. Please try again.'
        }
      }));
    } finally {
      inFlightEnhancements.current.delete(fieldToEnhance);
    }
  };

  // When modal opens or field changes, enhance the current field
  useEffect(() => {
    if (isOpen && !showSummary && currentField && !enhancementStates[currentField]) {
      handleEnhance(currentField);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, currentField, showSummary]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIsInitializing(false);
      setEnhancementStates({});
      setCurrentFieldIndex(0);
      setEnhancedProduct(null);
      setShowSummary(false);
    }
  }, [isOpen]);

  const handleChangeLanguage = (newLanguage: string) => {
    setSelectedLanguage(newLanguage);
    setEnhancementStates({});
    setCurrentFieldIndex(0);
    setEnhancedProduct(null);
    setShowSummary(false);
    if (fieldNames.length > 0) {
      setIsInitializing(true);
      // Only enhance the first field
      handleEnhance(fieldNames[0]);
    }
  };

  const handleAcceptField = (fieldName: string) => {
    const state = enhancementStates[fieldName];
    const updatedProduct = { ...(enhancedProduct || product) };
    if (state?.enhanced) {
      (updatedProduct as Record<string, unknown>)[fieldName] = state.enhanced ?? '';
    }
    setEnhancedProduct(updatedProduct);
    setEnhancementStates(prev => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        accepted: true
      }
    }));
    // Move to next field or show summary
    if (currentFieldIndex < fieldNames.length - 1) {
      setCurrentFieldIndex(idx => idx + 1);
    } else {
      setShowSummary(true);
    }
  };

  const handleDeclineField = (fieldName: string) => {
    setEnhancementStates(prev => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        declined: true
      }
    }));
    // Move to next field or show summary
    if (currentFieldIndex < fieldNames.length - 1) {
      setCurrentFieldIndex(idx => idx + 1);
    } else {
      setShowSummary(true);
    }
  };

  const handleBack = () => {
    if (showSummary) {
      setShowSummary(false);
      setCurrentFieldIndex(fieldNames.length - 1);
    } else if (currentFieldIndex > 0) {
      setCurrentFieldIndex(idx => idx - 1);
    }
  };

  const handleConfirmSummary = () => {
    onAccept(enhancedProduct || product);
    onClose();
  };

  if (!isOpen) return null;

  if (showSummary) {
    // Render summary step
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>
          <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">&#8203;</span>
          <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl sm:align-middle">
            <div className="absolute right-0 top-0 pr-4 pt-4">
              <button
                type="button"
                className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                onClick={onClose}
              >
                <span className="sr-only">Close</span>
                <X size={20} aria-hidden="true" />
              </button>
            </div>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-6 border-b pb-3">Enhancement Summary</h3>
              <div className="mb-6">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Field</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {fieldNames.map(fieldName => {
                      const state = enhancementStates[fieldName];
                      let status = '';
                      if (state?.accepted) {
                        if (state.skipped && state.quality && state.quality.rating >= (fields.find(f => f.name === fieldName)?.qualityThreshold ?? 90)) {
                          status = 'Not Changed';
                        } else {
                          status = 'Accepted';
                        }
                      } else if (state?.declined) status = 'Declined';
                      else if (state?.skipped) status = 'Skipped';
                      else status = '—';
                      let value = state?.enhanced ?? (enhancedProduct || product)[fieldName as keyof Product] ?? '';
                      let displayValue: string = '';
                      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
                        displayValue = String(value);
                      } else if (value && typeof value === 'object') {
                        displayValue = JSON.stringify(value, null, 2);
                      } else {
                        displayValue = '';
                      }
                      return (
                        <tr key={fieldName}>
                          <td className="px-4 py-2 text-sm text-gray-700 font-medium">{fieldName}</td>
                          <td className="px-4 py-2 text-sm text-gray-500">{status}</td>
                          <td className="px-4 py-2 text-sm text-gray-900 whitespace-pre-wrap max-w-xs">{displayValue}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-between mt-6">
                <button
                  type="button"
                  onClick={handleBack}
                  className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSummary}
                  className="inline-flex items-center rounded-md border border-blue-600 bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Confirm & Save
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentField) return null;

  const state = enhancementStates[currentField] || {
    isLoading: true,
    error: null,
    enhanced: null,
    validation: null,
    quality: null,
    prompt: '',
    accepted: false,
    declined: false,
    skipped: false
  };
  const originalValue = product[currentField as keyof Product] as string || '';
  const qualityThreshold = fields.find(f => f.name === currentField)?.qualityThreshold || 90;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>
        <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">&#8203;</span>
        <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl sm:align-middle">
          <div className="absolute right-0 top-0 pr-4 pt-4">
            <button
              type="button"
              className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              onClick={onClose}
            >
              <span className="sr-only">Close</span>
              <X size={20} aria-hidden="true" />
            </button>
          </div>
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-center mb-6 pb-3 border-b border-gray-200">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                AI Content Enhancement
              </h3>
              <div className="pr-10">
                <LanguageSelector 
                  selectedLanguage={selectedLanguage}
                  onChange={handleChangeLanguage}
                  disabled={state.isLoading}
                />
              </div>
            </div>
            <div className="mb-4 text-sm text-gray-500 text-right">
              Field {currentFieldIndex + 1} of {fieldNames.length}
            </div>
            <EnhancementCard
              key={currentField}
              fieldName={currentField}
              isActive={true}
              originalValue={originalValue}
              enhancementState={state}
              qualityThreshold={qualityThreshold}
              onAccept={() => handleAcceptField(currentField)}
              onDecline={() => handleDeclineField(currentField)}
              onEnhanceAnyway={state.skipped ? async () => {
                setEnhancementStates(prev => ({
                  ...prev,
                  [currentField]: {
                    ...prev[currentField],
                    skipped: false,
                    isLoading: true,
                    error: null,
                  }
                }));
                await handleEnhance(currentField, true);
              } : undefined}
            />
            <div className="flex justify-between mt-6">
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                disabled={currentFieldIndex === 0}
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => {
                  // Only allow next if accepted or declined
                  if (state.accepted || state.declined) {
                    if (currentFieldIndex < fieldNames.length - 1) {
                      setCurrentFieldIndex(idx => idx + 1);
                    } else {
                      setShowSummary(true);
                    }
                  }
                }}
                className={`inline-flex items-center rounded-md border border-blue-600 bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${!(state.accepted || state.declined) ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={!(state.accepted || state.declined)}
              >
                {currentFieldIndex < fieldNames.length - 1 ? 'Next' : 'Summary'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIEnhanceModal;