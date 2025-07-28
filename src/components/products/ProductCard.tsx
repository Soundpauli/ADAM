import React, { useState, useEffect, useRef } from 'react';
import { Wand2, CheckCircle2, Sparkles, ClipboardCheck, Image as ImageIcon, X, Star, AlertCircle, ChevronDown, ChevronRight, Shield, ShieldCheck, ShieldX, Clock, User, History, CheckCircle, ShieldAlert } from 'lucide-react';
import { Product, Media } from '../../types';
import ValidationResult from './ValidationResult';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useFields } from '../../contexts/FieldContext';
import { useEnhancedProducts } from '../../contexts/EnhancedProductContext';
import QualityStars from '../enhancement/QualityStars';
import { analyzeMediaAsset, formatFileSize } from '../../utils/mediaAnalysis';
import { requestLogger } from '../../services/requestLogger';
import { getProductFieldHistory, EnhancementHistoryEntry } from '../../utils/enhancementHistory';

// Enhanced Product interface with version info
interface EnhancedProduct extends Product {
  baseCode: string;
  version: string;
  isActive: boolean;
}

interface ProductCardProps {
  product: EnhancedProduct;
  isValidating: Record<string, boolean>;
  validationResults: Record<string, { passed: boolean; issues: string[]; quality?: { rating: number; remarks: string } | null; validationCriteria?: string[] }>;
  onValidate: (fieldName: string) => void;
  onEnhance: (fieldName: string) => void;
  onEnhanceAll: (product: EnhancedProduct, fieldNames: string[]) => void;
  onClearValidation: (fieldName: string) => void;
  canEnhance: boolean;
}

interface MediaAssetData {
  exists: boolean;
  dimensions?: { width: number; height: number };
  fileSize?: number;
  aspectRatio?: string;
  error?: string;
}

interface MediaFieldDisplayProps {
  field: any;
  media: Media[];
  onValidate: (fieldName: string) => void;
  isValidating: boolean;
  validationResult?: { passed: boolean; issues: string[]; quality?: { rating: number; remarks: string } | null; validationCriteria?: string[]; validationPrompt?: string };
  onClearValidation: (fieldName: string) => void;
}

const MediaFieldDisplay: React.FC<MediaFieldDisplayProps> = ({
  field,
  media,
  onValidate,
  isValidating,
  validationResult,
  onClearValidation
}) => {
  const [mediaData, setMediaData] = useState<Record<string, MediaAssetData>>({});
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchMediaData = async () => {
      const newMediaData: Record<string, MediaAssetData> = {};
      const loadingState: Record<string, boolean> = {};
      
      // Filter media based on subfield filter if present
      let filteredMedia = media;
      if (field.subField && field.subFieldFilter) {
        filteredMedia = media.filter(asset => {
          const fieldValue = asset[field.subField as keyof Media] as string;
          if (!fieldValue) return false;
          
          switch (field.subFieldFilter.operator) {
            case 'equals':
              return fieldValue === field.subFieldFilter.value;
            case 'contains':
              return fieldValue.includes(field.subFieldFilter.value);
            case 'startsWith':
              return fieldValue.startsWith(field.subFieldFilter.value);
            case 'endsWith':
              return fieldValue.endsWith(field.subFieldFilter.value);
            case 'notEquals':
              return fieldValue !== field.subFieldFilter.value;
            default:
              return false;
          }
        });
      }
      
      for (const asset of filteredMedia) {
        const assetIdStr = String(asset.assetId);
        loadingState[assetIdStr] = true;
        setIsLoading({...loadingState});
        
        try {
          const analysis = await analyzeMediaAsset(asset.mediaURL);
          const result: MediaAssetData = {
            exists: true,
            dimensions: analysis.dimensions,
            fileSize: analysis.fileSize,
            aspectRatio: analysis.aspectRatio,
            error: analysis.error
          };
          newMediaData[assetIdStr] = result;
        } catch (error) {
          newMediaData[assetIdStr] = { 
            exists: false, 
            error: 'Failed to load image data' 
          };
        }
        
        loadingState[assetIdStr] = false;
        setIsLoading({...loadingState});
      }
      
      setMediaData(newMediaData);
    };
    
    fetchMediaData();
  }, [media, field]);


  const getFileType = (url: string) => {
    if (!url) return 'unknown';
    const extension = url.split('.').pop()?.toLowerCase() || 'unknown';
    return extension;
  };

  // Filter media based on subfield filter if present
  let filteredMedia = media;
  if (field.subField && field.subFieldFilter) {
    filteredMedia = media.filter(asset => {
      const fieldValue = asset[field.subField as keyof Media] as string;
      if (!fieldValue) return false;
      
      switch (field.subFieldFilter.operator) {
        case 'equals':
          return fieldValue === field.subFieldFilter.value;
        case 'contains':
          return fieldValue.includes(field.subFieldFilter.value);
        case 'startsWith':
          return fieldValue.startsWith(field.subFieldFilter.value);
        case 'endsWith':
          return fieldValue.endsWith(field.subFieldFilter.value);
        case 'notEquals':
          return fieldValue !== field.subFieldFilter.value;
        default:
          return false;
      }
    });
  }

  const fieldDisplayName = field.subField 
    ? `${field.name} > ${field.subField} (${field.subFieldFilter?.operator} "${field.subFieldFilter?.value}")`
    : field.name;

  if (filteredMedia.length === 0) {
    return (
      <tr className="hover:bg-gray-50">
        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-500 align-top">
          <div className="uppercase text-xs">{fieldDisplayName}</div>
          <div className="text-xs text-gray-500 mt-1">No matching media assets</div>
        </td>
        <td className="px-4 py-4">
          <div className="flex justify-between">
            <div className="text-sm text-gray-500 italic">
              No media assets found matching the field criteria
            </div>
            <div className="flex-shrink-0">
              <button
                onClick={() => onValidate(field.subField ? `${field.name} > ${field.subField}` : field.name)}
                className="inline-flex items-center justify-center rounded-md w-8 h-8 border border-gray-300 bg-white text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:ring-offset-1 transition-colors duration-150"
                disabled={isValidating}
                title="Validate"
              >
                {isValidating ? (
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
                ) : (
                  <CheckCircle2 size={16} />
                )}
              </button>
            </div>
          </div>
          {validationResult && (
            <div className="mt-2">
              <ValidationResult
                result={validationResult}
                onClear={() => onClearValidation(field.subField ? `${field.name} > ${field.subField}` : field.name)}
              />
            </div>
          )}
        </td>
      </tr>
    );
  }

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-500 align-top">
        <div className="uppercase text-xs">{fieldDisplayName}</div>
        <div className="text-xs text-gray-500 mt-1">{filteredMedia.length} asset(s)</div>
        {validationResult?.quality && (
          <div className="mt-1">
            <QualityStars rating={validationResult.quality.rating} size={14} />
          </div>
        )}
      </td>
      <td className="px-4 py-4">
        <div className="flex justify-between">
          <div className="pr-4 flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredMedia.map((asset) => {
                const assetIdStr = String(asset.assetId);
                const assetData = mediaData[assetIdStr];
                const fileType = getFileType(asset.mediaURL);
                const isLoadingAsset = isLoading[assetIdStr];
                
                return (
                  <div key={assetIdStr} className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                    {/* Thumbnail */}
                    <div className="h-24 bg-gray-100 flex items-center justify-center">
                      {isLoadingAsset ? (
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
                      ) : asset.mediaURL?.endsWith('.pdf') ? (
                        <div className="text-blue-600 text-xs p-1 text-center">
                          PDF Document
                        </div>
                      ) : (
                        <img
                          src={asset.mediaURL}
                          alt="Preview"
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            // Don't replace with placeholder, just hide the broken image
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            // Show a fallback div
                            const parent = target.parentElement;
                            if (parent && !parent.querySelector('.fallback-icon')) {
                              const fallback = document.createElement('div');
                              fallback.className = 'fallback-icon text-gray-400 text-xs p-2 text-center';
                              fallback.innerHTML = `<div class="mb-1">📷</div><div>Image</div>`;
                              parent.appendChild(fallback);
                            }
                          }}
                        />
                      )}
                    </div>
                    
                    {/* Asset Info */}
                    <div className="p-2">
                      <div className="text-xs font-medium text-gray-900 truncate" title={String(asset.assetId)}>
                        ID: {asset.assetId}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Type: {fileType}
                      </div>
                      {asset.productContentType && (
                        <div className="text-xs text-gray-500">
                          Content: {asset.productContentType}
                        </div>
                      )}
                      <div className="flex items-center mt-1">
                        <span className="text-xs text-gray-500 mr-2">HTTPS:</span>
                        {asset.mediaURL?.startsWith('https://') ? (
                          <span className="text-green-600 text-xs">✓</span>
                        ) : (
                          <span className="text-red-600 text-xs">✗</span>
                        )}
                      </div>
                      
                      {/* Dimensions and file info */}
                      {isLoadingAsset ? (
                        <div className="text-xs text-gray-500 mt-1">Analyzing...</div>
                      ) : assetData ? (
                        <div className="text-xs mt-1 space-y-1">
                          {assetData.error ? (
                            <div className="text-orange-600" title={assetData.error}>
                              {assetData.error.includes('CORS') ? 'CORS restricted' : 'Analysis failed'}
                            </div>
                          ) : assetData.dimensions ? (
                            <>
                              <div className="text-gray-600">
                                {assetData.dimensions.width}×{assetData.dimensions.height}px
                              </div>
                              {assetData.aspectRatio && (
                                <div className="text-gray-500">
                                  Ratio: {assetData.aspectRatio}
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="text-gray-500" title="Image exists but dimensions cannot be measured due to CORS restrictions">
                              Dimensions restricted
                            </div>
                          )}
                          {assetData.fileSize && (
                            <div className="text-gray-500">
                              Size: {formatFileSize(assetData.fileSize)}
                            </div>
                          )}
                          {!assetData.fileSize && !assetData.error && (
                            <div className="text-gray-500" title="File size cannot be determined due to CORS restrictions">
                              Size restricted
                            </div>
                          )}
                        </div>
                      ) : null}
                      
                      {/* URL link */}
                      <div className="mt-1">
                        <a 
                          href={asset.mediaURL} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-xs text-blue-600 hover:underline truncate block"
                          title={asset.mediaURL}
                        >
                          View Asset
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex-shrink-0">
            <button
              onClick={() => onValidate(field.subField ? `${field.name} > ${field.subField}` : field.name)}
              className="inline-flex items-center justify-center rounded-md w-8 h-8 border border-gray-300 bg-white text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:ring-offset-1 transition-colors duration-150"
              disabled={isValidating}
              title="Validate"
            >
              {isValidating ? (
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
              ) : (
                <CheckCircle2 size={16} />
              )}
            </button>
          </div>
        </div>
        {validationResult && (
          <div className="mt-2">
            <ValidationResult
              result={validationResult}
              onClear={() => onClearValidation(field.subField ? `${field.name} > ${field.subField}` : field.name)}
            />
          </div>
        )}
      </td>
    </tr>
  );
};

const FieldControls: React.FC<{
  fieldName: string;
  productId: string | number;
  isValidating: boolean;
  onValidate: () => void;
  onEnhance: () => void;
  canEnhance: boolean;
}> = ({ fieldName, productId, isValidating, onValidate, onEnhance, canEnhance }) => {
  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={onValidate}
        className="inline-flex items-center justify-center rounded-md w-8 h-8 border border-gray-300 bg-white text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:ring-offset-1 transition-colors duration-150"
        disabled={isValidating}
        title="Validate"
      >
        {isValidating ? (
          <div className="h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
        ) : (
          <CheckCircle2 size={16} />
        )}
      </button>
      
      {canEnhance && (
        <button
          onClick={onEnhance}
          className="inline-flex items-center justify-center rounded-md w-8 h-8 border border-transparent bg-blue-600 text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:ring-offset-1 transition-colors duration-150"
          title="Enhance"
        >
          <Wand2 size={16} />
        </button>
      )}
    </div>
  );
};

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  isValidating,
  validationResults,
  onValidate,
  onEnhance: handleEnhance,
  onEnhanceAll,
  onClearValidation,
  canEnhance,
}) => {
  const [isExpanded, setIsExpanded] = useState(() => {
    try {
      const stored = localStorage.getItem('adam_expandedProducts');
      if (stored) {
        const obj = JSON.parse(stored);
        return !!obj[product.code];
      }
    } catch {}
    return false;
  });
  const { user } = useAuth();
  const { language } = useLanguage();
  const { fields } = useFields();
  const canEdit = ['admin', 'manager'].includes(user?.role || '');
  const [openFieldHistory, setOpenFieldHistory] = useState<string | null>(null);
  const fieldHistoryRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Sync expanded state to localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('adam_expandedProducts');
      const obj = stored ? JSON.parse(stored) : {};
      if (isExpanded) {
        obj[product.code] = true;
      } else {
        delete obj[product.code];
      }
      localStorage.setItem('adam_expandedProducts', JSON.stringify(obj));
    } catch {}
  }, [isExpanded, product.code]);

  // Get active fields for this product category
  const activeFields = fields.filter(field => 
    field.isActive &&
    (!field.productCategories?.length || field.productCategories.includes(product.categoryName))
  );

  // Separate text/html fields from media fields
  const textFields = activeFields.filter(field => 
    ['text', 'html'].includes(field.fieldType) && !field.subField
  );
  
  const mediaFields = activeFields.filter(field => 
    field.fieldType === 'media'
  );

  // Map product text fields for display (INCLUDE ALL, mark missing if not present)
  // When constructing fieldDisplays, ensure key is always a string
  const fieldDisplays: { field: typeof textFields[number]; key: string; value: string; isMissing: boolean; displayName: string }[] = textFields
    .filter(field => field.name) // Ensure field.name is not undefined
    .map(field => {
      const value = product[field.name as keyof Product] as string;
      const isMissing = !(typeof value === 'string' && value.trim().length > 0);
      return {
        field,
        key: field.name,
        value,
        isMissing,
        displayName: typeof field.displayName === 'string' && field.displayName.trim() !== '' ? field.displayName : field.name,
      };
    });

  // Count missing fields
  const missingFieldCount = fieldDisplays.filter(fd => fd.isMissing).length;
  const totalConfiguredFields = fieldDisplays.length + mediaFields.length;

  // Calculate validation summary for collapsed view
  const getValidationSummary = () => {
    const allFieldNames = [
      ...fieldDisplays.map(({key}) => key),
      ...mediaFields.map(field => field.subField ? `${field.name} > ${field.subField}` : field.name)
    ];
    
    const validatedFields = allFieldNames.filter(fieldName => validationResults[fieldName]);
    const totalFields = allFieldNames.length;
    
    if (validatedFields.length === 0) return null;
    
    const fieldScores = validatedFields.map(fieldName => {
      const result = validationResults[fieldName];
      return {
        name: fieldName,
        score: result?.quality?.rating || 0,
        passed: result?.passed || false
      };
    });
    
    const averageScore = fieldScores.reduce((sum, field) => sum + field.score, 0) / fieldScores.length;
    const passedCount = fieldScores.filter(field => field.passed).length;
    
    return {
      averageScore: Math.round(averageScore),
      validatedCount: validatedFields.length,
      totalFields,
      passedCount,
      fieldScores
    };
  };

  const validationSummary = getValidationSummary();

  // Get gradient color based on score
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getScoreGradient = (score: number) => {
    if (score >= 80) return 'from-green-400 to-green-600';
    if (score >= 60) return 'from-yellow-400 to-yellow-600';
    if (score >= 40) return 'from-orange-400 to-orange-600';
    return 'from-red-400 to-red-600';
  };

  // Track which fields are being validated by the Validate All button
  const [lastValidatedFields, setLastValidatedFields] = useState<string[]>([]);

  useEffect(() => {
    if (lastValidatedFields.length > 0) {
      const allDone = lastValidatedFields.every(fieldName => !isValidating[`${product.id ?? product.code}-${fieldName}`]);
      if (allDone) setLastValidatedFields([]);
    }
  }, [isValidating, lastValidatedFields, product.id, product.code]);

  // Enhancement status helpers
  const isFieldEnhanced = (fieldKey: string) => {
    return getProductFieldHistory(product.id ?? product.code, fieldKey).length > 0;
  };
  const isProductPartlyEnhanced = () => {
    const allFieldKeys = [
      ...fieldDisplays.map(({key}) => key),
      ...mediaFields.map(field => field.subField ? `${field.name} > ${field.subField}` : field.name)
    ];
    const enhancedCount = allFieldKeys.filter(isFieldEnhanced).length;
    return enhancedCount > 0 && enhancedCount < allFieldKeys.length;
  };
  const isProductFullyEnhanced = () => {
    const allFieldKeys = [
      ...fieldDisplays.map(({key}) => key),
      ...mediaFields.map(field => field.subField ? `${field.name} > ${field.subField}` : field.name)
    ];
    return allFieldKeys.every(isFieldEnhanced);
  };

  // Enhancement history modal state
  const [historyField, setHistoryField] = useState<string | null>(null);
  const [historyEntries, setHistoryEntries] = useState<EnhancementHistoryEntry[]>([]);

  const openHistory = (fieldKey: string) => {
    setHistoryEntries(getProductFieldHistory(product.id ?? product.code, fieldKey));
    setHistoryField(fieldKey);
  };
  const closeHistory = () => {
    setHistoryField(null);
    setHistoryEntries([]);
  };

  return (
    <div className="hover:bg-gray-50 transition-colors duration-200 group relative">
      <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity z-10">
        <button
          onClick={() => {
            const allFieldNames = [
              ...fieldDisplays.map(({key}) => key),
              ...mediaFields.map(field => field.subField ? `${field.name} > ${field.subField}` : field.name)
            ].filter((name): name is string => typeof name === 'string' && !!name);
            setLastValidatedFields(allFieldNames);
            // Log group validation
            if (user) {
              requestLogger.log({
                user,
                product: {
                  id: product.id as string || product.code,
                  code: product.code,
                  name: product.assortmentProductName || product.name,
                  category: product.categoryName || 'Unknown'
                },
                type: 'group_validation',
                language,
                success: true,
                source: {
                  component: 'ProductCard',
                  command: 'Validate All Fields',
                  effect: `Validating all ${allFieldNames.length} configured fields for this product`
                },
                results: {}
              });
            }
            allFieldNames.forEach(fieldName => onValidate(fieldName));
          }}
          className="inline-flex items-center justify-center rounded-md w-8 h-8 border border-gray-300 bg-white text-gray-700 shadow-sm hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-150"
          title="Validate All Fields"
          tabIndex={0}
        >
          {lastValidatedFields.some(fieldName => isValidating[`${product.id ?? product.code}-${fieldName}`]) ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
          ) : (
            <ClipboardCheck size={16} />
          )}
        </button>
        {canEnhance && fieldDisplays.length > 0 && (
          <button
            onClick={() => {
              const textFieldNames = fieldDisplays.map(({key}) => key);
              // Log group enhancement
              if (user) {
                requestLogger.log({
                  user,
                  product: {
                    id: product.id as string || product.code,
                    code: product.code,
                    name: product.assortmentProductName || product.name,
                    category: product.categoryName || 'Unknown'
                  },
                  type: 'group_enhancement',
                  language,
                  success: true,
                  source: {
                    component: 'ProductCard',
                    command: 'Enhance All Fields',
                    effect: `Starting AI enhancement for all ${textFieldNames.length} text fields`
                  },
                  results: {}
                });
              }
              onEnhanceAll(product, textFieldNames);
            }}
            className="inline-flex items-center justify-center rounded-md w-8 h-8 border border-blue-200 bg-blue-50 text-blue-700 shadow-sm hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-150"
            disabled={!product.isActive}
            title="Enhance All Fields"
            tabIndex={0}
          >
            <Sparkles size={16} />
          </button>
        )}
      </div>
      <div className="p-6 relative">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-2 group focus:outline-none"
              aria-expanded={isExpanded}
              tabIndex={0}
            >
              {isExpanded ? (
                <ChevronDown size={20} className="text-gray-600 group-hover:text-blue-600 transition-colors duration-150" />
              ) : (
                <ChevronRight size={20} className="text-gray-600 group-hover:text-blue-600 transition-colors duration-150" />
              )}
              <h2 className="text-xl font-medium text-gray-900 group-hover:text-blue-600 transition-colors duration-150">
                {product.assortmentProductName || product.name}
              </h2>
            </button>
            <div className="mt-1 flex items-center text-sm text-gray-500 gap-2">
              {/* Product Code Display */}
              <span className="inline-flex items-center bg-gray-100 px-2.5 py-0.5 text-xs font-mono text-gray-800 rounded-md">
                {product.code}
              </span>

              {/* Version and Status Display */}
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 rounded-md">
                  v{product.version}
                </span>
                {product.isActive ? (
                  <span className="inline-flex items-center bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 rounded-md">
                    <ShieldCheck size={12} className="mr-1" />
                    ACTIVE
                  </span>
                ) : (
                  <span className="inline-flex items-center bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 rounded-md">
                    <ShieldX size={12} className="mr-1" />
                    INACTIVE
                  </span>
                )}
              </div>
              
              {/* Category and subcategory display removed as requested */}
              <span className="ml-2 text-xs text-gray-400">
                {totalConfiguredFields} fields configured{missingFieldCount > 0 ? ` / ${missingFieldCount} missing` : ''}
              </span>
            </div>
            
            {/* Validation Summary Bar - Only show when not expanded and validation results exist */}
            {!isExpanded && validationSummary && (
              <div className="mt-3 space-y-2">
                <div className="text-xs text-gray-600 mb-1">Validation Results</div>
                {/* Overall Score Bar with count on right */}
                <div className="flex items-center w-48 max-w-full">
                  <div className="relative flex-1">
                    <div className="bg-gray-200 rounded-full h-2 w-full">
                      <div 
                        className={`h-2 rounded-full bg-gradient-to-r ${getScoreGradient(validationSummary.averageScore)} transition-all duration-500`}
                        style={{ width: `${validationSummary.averageScore}%` }}
                      ></div>
                    </div>
                  </div>
                  <span className="ml-3 text-xs text-gray-600 font-medium whitespace-nowrap">{validationSummary.passedCount}/{validationSummary.validatedCount} passed</span>
                </div>
              </div>
            )}
          </div>
          
          {/* Remove the old Validate All and Enhance All buttons from the bottom of the card */}
        </div>
      </div>
      
      {/* Expandable Content */}
      {isExpanded && (fieldDisplays.length > 0 || mediaFields.length > 0) && (
        <div className="overflow-hidden border border-gray-200 rounded-lg shadow mb-8">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 w-1/6">Field</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Content</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {/* Text/HTML Fields */}
              {fieldDisplays.map(({field, key, value, isMissing, displayName}) => {
                if (!key) return null; // Guard against undefined key

                const validationResult = validationResults[key];
                const isMissingMandatory = field.isMandatory && (!value || value.trim().length === 0);
                
                return (
                  <tr key={key} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-500 align-top">
                      <div className="uppercase text-xs flex items-center gap-2">
                        {displayName}
                        {isFieldEnhanced(key) && (
                          <span className="ml-1 inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-800 gap-1">
                            <CheckCircle size={12} className="text-blue-600" /> Enhanced
                          </span>
                        )}
                        <button
                          className="ml-1 text-gray-400 hover:text-blue-600 focus:outline-none"
                          title="Show Enhancement History"
                          onClick={() => openHistory(key)}
                          type="button"
                        >
                          <History size={14} />
                        </button>
                      </div>
                      <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-2">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium mb-1 mr-2 ${
                          field.fieldType === 'text' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                        }`}>
                          {field.fieldType}
                        </span>
                        {field.isMandatory && (
                          <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium mb-1 mr-2 bg-orange-100 text-orange-800">
                            Mandatory
                          </span>
                        )}
                        {(isMissing || isMissingMandatory) && (
                          <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium mb-1 mr-2 bg-red-100 text-red-800">
                            Missing
                          </span>
                        )}
                      </div>
                      {validationResult?.quality && (
                        <div className="mt-1">
                          <QualityStars rating={validationResult.quality.rating} size={14} />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-between">
                        <div className={`text-sm whitespace-pre-wrap pr-4 ${key.includes('HTML') || key === 'assortmentProductContent' ? '' : ''}`}> 
                          {isMissing ? (
                            <div className="text-gray-400 italic bg-gray-50 p-3 rounded border-2 border-dashed border-gray-300">
                              <div className="text-center">
                                <span className="text-sm">No content available</span>
                                <div className="text-xs mt-1">This field is configured but missing from product data.</div>
                              </div>
                            </div>
                          ) : key.includes('HTML') || key === 'assortmentProductContent' ? (
                            <div className="text-gray-700" dangerouslySetInnerHTML={{ __html: value }} />
                          ) : (
                            <div className="text-gray-700">{value}</div>
                          )}
                        </div>
                        <div className="flex-shrink-0">
                          <FieldControls 
                            fieldName={key}
                            productId={product.id ?? product.code}
                            isValidating={isValidating[`${product.id ?? product.code}-${key}`]}
                            onValidate={() => onValidate(key)}
                            onEnhance={() => handleEnhance(key)}
                            canEnhance={canEnhance && product.isActive}
                          />
                        </div>
                      </div>
                      {validationResult && (
                        <div className="mt-2">
                          <ValidationResult
                            result={validationResult}
                            onClear={() => onClearValidation(key)}
                          />
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              
              {/* Media Fields */}
              {mediaFields.map((field) => {
                const fieldKey = field.subField ? `${field.name} > ${field.subField}` : field.name;
                const validationResult = validationResults[fieldKey];
                const isFieldValidating = isValidating[`${product.id}-${fieldKey}`];
                
                return (
                  <MediaFieldDisplay
                    key={field.id}
                    field={field}
                    media={product.media}
                    onValidate={onValidate}
                    isValidating={isFieldValidating}
                    validationResult={validationResult}
                    onClearValidation={onClearValidation}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Show message if no active fields */}
      {isExpanded && fieldDisplays.length === 0 && mediaFields.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <ImageIcon className="mx-auto h-12 w-12 text-gray-300 mb-3" />
          <p>No active field configurations found for this product category.</p>
          <p className="text-sm mt-1">Configure fields in the Field Config section to enable validation and enhancement.</p>
        </div>
      )}
      
      {isExpanded && (
      <div className="mt-6 bg-white rounded-lg border border-gray-200 p-4">
        <h4 className="text-base font-medium text-gray-900 mb-3">Variants</h4>
        <div className="mt-2 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-3 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Name</th>
                <th scope="col" className="px-3 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Size</th>
                <th scope="col" className="px-3 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Packaging</th>
                <th scope="col" className="px-3 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Regulatory Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {(product.variantOptions || []).map((variant, index) => (
                <tr key={index} className="hover:bg-gray-50 transition-colors duration-150">
                  <td className="whitespace-nowrap px-3 py-2.5 text-sm font-medium text-gray-900">{variant.name}</td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-sm text-gray-500">{variant.articleSize}</td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-sm text-gray-500">{variant.packaging}</td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-sm text-gray-500">{variant.regulatoryStatus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}
      {historyField && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
    <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6 relative">
      <button
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
        onClick={closeHistory}
        title="Close"
      >
        <X size={20} />
      </button>
      <h3 className="text-lg font-medium mb-4">Enhancement History for <span className="font-mono">{historyField}</span></h3>
      {historyEntries.length === 0 ? (
        <div className="text-gray-500 text-sm">No enhancement history for this field.</div>
      ) : (
        <ul className="space-y-4 max-h-80 overflow-y-auto">
          {historyEntries.map((entry, idx) => (
            <li key={idx} className="border rounded p-3 bg-gray-50">
              <div className="text-xs text-gray-500 mb-1">{new Date(entry.timestamp).toLocaleString()} by {entry.user.name} ({entry.user.email})</div>
              <div className="text-xs text-gray-400 mb-1">Before:</div>
              <div className="text-xs bg-white border rounded p-2 mb-1 whitespace-pre-wrap">{entry.before}</div>
              <div className="text-xs text-gray-400 mb-1">After:</div>
              <div className="text-xs bg-white border rounded p-2 whitespace-pre-wrap">{entry.after}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  </div>
)}
    </div>
  );
};

export default ProductCard;