import React, { useState, useEffect } from 'react';
import { X, Globe, Link } from 'lucide-react';
import { useFields } from '../../contexts/FieldContext';
import { Field, MediaValidation } from '../../types';
import MediaValidationForm from './MediaValidationForm';

interface FieldModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  field: Field | null;
  categories: string[]; // Pass categories from parent component
}

const LanguageSelector: React.FC<{
  selectedLanguage: string;
  onChange: (lang: string) => void;
}> = ({ selectedLanguage, onChange }) => {
  const languages = [
    { code: 'EN', name: 'English', flag: '🇬🇧' },
    { code: 'DE', name: 'German', flag: '🇩🇪' },
    { code: 'FR', name: 'French', flag: '🇫🇷' },
  ];

  return (
    <div className="flex items-center space-x-2">
      <div className="relative inline-block w-full">
        <div className="flex items-center space-x-1 rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm hover:bg-gray-50 cursor-pointer">
          <Globe size={16} className="text-gray-500" />
          <select
            id="language"
            value={selectedLanguage}
            onChange={(e) => onChange(e.target.value)}
            className="appearance-none bg-transparent w-full focus:outline-none"
          >
            {languages.map(lang => (
              <option key={lang.code} value={lang.code} className="flex items-center">
                {lang.flag} {lang.name}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
            <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

const defaultMediaValidation: MediaValidation = {
  allowedFileTypes: ['png', 'jpg', 'jpeg', 'gif', 'pdf'],
  requireHttps: true
};

const FieldModal: React.FC<FieldModalProps> = ({ isOpen, onClose, mode, field, categories }) => {
  const { addField, updateField, fields } = useFields();
  
  // Filter out 'All' category
  const PRODUCT_CATEGORIES = categories.filter(cat => cat !== 'All');
  
  // Get goldstandard examples for populating the form
  const [goldstandardExamples, setGoldstandardExamples] = useState<any[]>([]);
  
  useEffect(() => {
    const examples = localStorage.getItem('goldstandardExamples');
    if (examples) {
      setGoldstandardExamples(JSON.parse(examples));
    }
  }, [isOpen]);

  const [formData, setFormData] = useState<Omit<Field, 'id'>>({
    name: '',
    displayName: '',
    subField: '',
    fieldType: 'text',
    applicableTo: 'base',
    isActive: true,
    general: {
      requirements: '',
      format: '',
      skipLanguageDetection: false
    },
    isMandatory: false,
    languages: {
      EN: { requirements: '', format: '', whitelist: '', blacklist: '', positiveExamples: '', negativeExamples: '' },
      DE: { requirements: '', format: '', whitelist: '', blacklist: '', positiveExamples: '', negativeExamples: '' },
      FR: { requirements: '', format: '', whitelist: '', blacklist: '', positiveExamples: '', negativeExamples: '' }
    },
    productCategories: [],
    qualityThreshold: 90,
    subFieldFilter: undefined,
    contextFields: [],
    useClaimList: false
  });
  const [selectedLanguage, setSelectedLanguage] = useState('EN');
  const [activeTab, setActiveTab] = useState<'general' | 'specific'>('general');

  useEffect(() => {
    if (field && mode === 'edit') {
      setFormData({
        name: field.name,
        displayName: field.displayName || '',
        subField: field.subField || '',
        fieldType: field.fieldType,
        applicableTo: field.applicableTo,
        isActive: field.isActive,
        productCategories: field.productCategories,
        general: {
          requirements: typeof field.general?.requirements === 'string' ? field.general.requirements : '',
          format: typeof field.general?.format === 'string' ? field.general.format : '',
          skipLanguageDetection: typeof field.general?.skipLanguageDetection === 'boolean' ? field.general.skipLanguageDetection : false
        },
        languages: field.languages || {
          EN: { requirements: '', format: '', whitelist: '', blacklist: '', positiveExamples: '', negativeExamples: '' },
          DE: { requirements: '', format: '', whitelist: '', blacklist: '', positiveExamples: '', negativeExamples: '' },
          FR: { requirements: '', format: '', whitelist: '', blacklist: '', positiveExamples: '', negativeExamples: '' }
        },
        isMandatory: field.isMandatory || false,
        qualityThreshold: field.qualityThreshold || 90,
        subFieldFilter: field.subFieldFilter,
        mediaValidation: field.mediaValidation || 
          (field.fieldType === 'media' ? defaultMediaValidation : undefined),
        contextFields: field.contextFields || [],
        useClaimList: field.useClaimList || false
      } as Omit<Field, 'id'>);
    } else {
      setFormData({
        name: '',
        displayName: '',
        subField: '',
        fieldType: 'text',
        applicableTo: 'base',
        isActive: true,
        general: {
          requirements: '',
          format: '',
          skipLanguageDetection: false
        },
        isMandatory: false,
        languages: {
          EN: { requirements: '', format: '', whitelist: '', blacklist: '', positiveExamples: '', negativeExamples: '' },
          DE: { requirements: '', format: '', whitelist: '', blacklist: '', positiveExamples: '', negativeExamples: '' },
          FR: { requirements: '', format: '', whitelist: '', blacklist: '', positiveExamples: '', negativeExamples: '' }
        },
        productCategories: [],
        qualityThreshold: 90,
        subFieldFilter: undefined,
        contextFields: [],
        useClaimList: false
      });
    }
  }, [field, mode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (["name", "displayName", "applicableTo", "subField"].includes(name)) {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        general: {
          requirements: typeof prev.general?.requirements === 'string' ? prev.general.requirements : '',
          format: typeof prev.general?.format === 'string' ? prev.general.format : '',
          skipLanguageDetection: typeof prev.general?.skipLanguageDetection === 'boolean' ? prev.general.skipLanguageDetection : false
        }
      }));
    } else if (name === 'isActive') {
      setFormData((prev) => ({
        ...prev,
        isActive: (e.target as HTMLInputElement).checked,
        general: {
          requirements: typeof prev.general?.requirements === 'string' ? prev.general.requirements : '',
          format: typeof prev.general?.format === 'string' ? prev.general.format : '',
          skipLanguageDetection: typeof prev.general?.skipLanguageDetection === 'boolean' ? prev.general.skipLanguageDetection : false
        }
      }));
    } else if (name === 'isMandatory') {
      setFormData((prev) => ({
        ...prev,
        isMandatory: (e.target as HTMLInputElement).checked,
        general: {
          requirements: typeof prev.general?.requirements === 'string' ? prev.general.requirements : '',
          format: typeof prev.general?.format === 'string' ? prev.general.format : '',
          skipLanguageDetection: typeof prev.general?.skipLanguageDetection === 'boolean' ? prev.general.skipLanguageDetection : false
        }
      }));
    } else if (name === 'useClaimList') {
      setFormData((prev) => ({
        ...prev,
        useClaimList: (e.target as HTMLInputElement).checked,
        general: {
          requirements: typeof prev.general?.requirements === 'string' ? prev.general.requirements : '',
          format: typeof prev.general?.format === 'string' ? prev.general.format : '',
          skipLanguageDetection: typeof prev.general?.skipLanguageDetection === 'boolean' ? prev.general.skipLanguageDetection : false
        }
      }));
    } else if (name === 'fieldType') {
      setFormData((prev) => ({
        ...prev,
        fieldType: value as any,
        mediaValidation: value === 'media' ? 
          (prev.mediaValidation || defaultMediaValidation) : undefined,
        general: {
          requirements: typeof prev.general?.requirements === 'string' ? prev.general.requirements : '',
          format: typeof prev.general?.format === 'string' ? prev.general.format : '',
          skipLanguageDetection: typeof prev.general?.skipLanguageDetection === 'boolean' ? prev.general.skipLanguageDetection : false
        }
      }));
    } else if (name === 'qualityThreshold') {
      setFormData((prev) => ({
        ...prev,
        qualityThreshold: parseInt(value, 10),
        general: {
          requirements: typeof prev.general?.requirements === 'string' ? prev.general.requirements : '',
          format: typeof prev.general?.format === 'string' ? prev.general.format : '',
          skipLanguageDetection: typeof prev.general?.skipLanguageDetection === 'boolean' ? prev.general.skipLanguageDetection : false
        }
      }));
    } else if (["requirements", "format"].includes(name) && activeTab === 'general') {
      setFormData((prev) => ({
        ...prev,
        general: {
          ...prev.general,
          requirements: name === 'requirements' ? value : (typeof prev.general?.requirements === 'string' ? prev.general.requirements : ''),
          format: name === 'format' ? value : (typeof prev.general?.format === 'string' ? prev.general.format : ''),
          skipLanguageDetection: typeof prev.general?.skipLanguageDetection === 'boolean' ? prev.general.skipLanguageDetection : false
        }
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        languages: {
          ...prev.languages,
          [selectedLanguage]: {
            ...prev.languages[selectedLanguage],
            [name]: value
          }
        },
        general: {
          requirements: typeof prev.general?.requirements === 'string' ? prev.general.requirements : '',
          format: typeof prev.general?.format === 'string' ? prev.general.format : '',
          skipLanguageDetection: typeof prev.general?.skipLanguageDetection === 'boolean' ? prev.general.skipLanguageDetection : false
        }
      }));
    }
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const options = e.target.options;
    const selectedCategories: string[] = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selectedCategories.push(options[i].value);
      }
    }
    setFormData(prev => ({
      ...prev,
      productCategories: selectedCategories,
      general: {
        requirements: typeof prev.general?.requirements === 'string' ? prev.general.requirements : '',
        format: typeof prev.general?.format === 'string' ? prev.general.format : '',
        skipLanguageDetection: typeof prev.general?.skipLanguageDetection === 'boolean' ? prev.general.skipLanguageDetection : false
      }
    }));
  };

  const handleContextFieldsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const options = e.target.options;
    const selectedFields: string[] = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selectedFields.push(options[i].value);
      }
    }
    setFormData(prev => ({
      ...prev,
      contextFields: selectedFields,
      general: {
        requirements: typeof prev.general?.requirements === 'string' ? prev.general.requirements : '',
        format: typeof prev.general?.format === 'string' ? prev.general.format : '',
        skipLanguageDetection: typeof prev.general?.skipLanguageDetection === 'boolean' ? prev.general.skipLanguageDetection : false
      }
    }));
  };

  const handleSubFieldFilterChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      subFieldFilter: prev.subFieldFilter ? {
        ...prev.subFieldFilter,
        [field]: value
      } : {
        operator: 'equals',
        value: '',
        [field]: value
      },
      general: {
        requirements: typeof prev.general?.requirements === 'string' ? prev.general.requirements : '',
        format: typeof prev.general?.format === 'string' ? prev.general.format : '',
        skipLanguageDetection: typeof prev.general?.skipLanguageDetection === 'boolean' ? prev.general.skipLanguageDetection : false
      }
    }));
  };

  const getAvailableSubFields = () => {
    switch (formData.fieldType) {
      case 'media':
        return [
          { value: 'productContentType', label: 'Product Content Type' },
          { value: 'cssImageSection', label: 'CSS Image Section' },
          { value: 'mime', label: 'MIME Type' },
          { value: 'name', label: 'Name' }
        ];
      default:
        return [];
    }
  };

  const handleMediaValidationChange = (validation: MediaValidation) => {
    setFormData(prev => ({
      ...prev,
      mediaValidation: validation,
      general: {
        requirements: typeof prev.general?.requirements === 'string' ? prev.general.requirements : '',
        format: typeof prev.general?.format === 'string' ? prev.general.format : '',
        skipLanguageDetection: typeof prev.general?.skipLanguageDetection === 'boolean' ? prev.general.skipLanguageDetection : false
      }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === 'create') {
      addField(formData);
    } else if (mode === 'edit' && field) {
      updateField(field.id, formData);
    }
    
    onClose();
  };

  // Get available fields for context selection (excluding the current field)
  const availableContextFields = fields.filter(f => 
    f.isActive && 
    f.fieldType !== 'media' && 
    !f.subField && 
    f.name !== formData.name && // Exclude self
    (!f.productCategories?.length || 
     formData.productCategories.length === 0 ||
     f.productCategories.some(cat => formData.productCategories.includes(cat)) // Only show fields with overlapping categories
    )
  );

  // Filter goldstandard examples to show only those for the current field
  const filteredExamples = goldstandardExamples.filter(ex => 
    ex.fieldName === formData.name
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">&#8203;</span>
        
        <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
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
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              {mode === 'create' ? 'Add New Field' : 'Edit Field'}
            </h3>
            
            <div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isMandatory"
                  name="isMandatory"
                  checked={formData.isMandatory || false}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="isMandatory" className="ml-2 block text-sm font-medium text-gray-700">
                  Field is mandatory
                </label>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Mandatory fields will be shown in products even if they don't exist in the product data, allowing content generation
              </p>
            </div>
            
            <div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="useClaimList"
                  name="useClaimList"
                  checked={formData.useClaimList || false}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="useClaimList" className="ml-2 block text-sm font-medium text-gray-700">
                  Use claims from Claims list
                </label>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                When enabled, matching claims for the product will be used 1:1 in field enhancement (can be embedded in sentences)
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Field Name
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  placeholder="Enter field name"
                />
              </div>
              
              {getAvailableSubFields().length > 0 && (
                <div>
                  <label htmlFor="subField" className="block text-sm font-medium text-gray-700">
                    Subfield (Optional)
                  </label>
                  <select
                    id="subField"
                    name="subField"
                    value={formData.subField || ''}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  >
                    <option value="">No subfield</option>
                    {getAvailableSubFields().map(subField => (
                      <option key={subField.value} value={subField.value}>{subField.label}</option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Select a subfield to create rules for specific nested values (e.g., media - productContentType)
                  </p>
                </div>
              )}
              
              <div>
                <label htmlFor="fieldType" className="block text-sm font-medium text-gray-700">
                  Field Type
                </label>
                <select
                  id="fieldType"
                  name="fieldType"
                  value={formData.fieldType}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                >
                  <option value="text">Text</option>
                  <option value="html">HTML</option>
                  <option value="media">Media</option>
                </select>
              </div>

              <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
                  Display Name
                </label>
                <div className="relative group">
                  <input
                    type="text"
                    name="displayName"
                    id="displayName"
                    value={formData.displayName || ''}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                    placeholder="Enter display name (shown in app)"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 cursor-help group-hover:opacity-100 opacity-0 transition-opacity duration-200 z-10">
                    <div className="bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap shadow-lg" style={{ position: 'absolute', right: 0, top: '120%' }}>
                      Field Type: {formData.fieldType}
                    </div>
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-500">This name will be shown throughout the app for this field</p>
              </div>
              
              <div>
                <label htmlFor="applicableTo" className="block text-sm font-medium text-gray-700">
                  Applicable To
                </label>
                <select
                  id="applicableTo"
                  name="applicableTo"
                  value={formData.applicableTo}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                >
                  <option value="base">Base Product</option>
                  <option value="variant">Variant Only</option>
                  <option value="both">Both Base & Variant</option>
                </select>
              </div>
              
              <div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="isActive" className="ml-2 block text-sm font-medium text-gray-700">
                    Field is active
                  </label>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Only active fields will be shown in product validation and enhancement
                </p>
              </div>
              
              <div>
                <label htmlFor="qualityThreshold" className="block text-sm font-medium text-gray-700">
                  Quality Threshold (%)
                </label>
                <input
                  type="number"
                  name="qualityThreshold"
                  id="qualityThreshold"
                  min="0"
                  max="100"
                  value={formData.qualityThreshold}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">Content with quality rating above this threshold will not be enhanced</p>
              </div>
              
              <div>
                <label htmlFor="productCategories" className="block text-sm font-medium text-gray-700">
                  Product Categories
                </label>
                <select
                  id="productCategories"
                  name="productCategories"
                  multiple
                  value={formData.productCategories}
                  onChange={handleCategoryChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  size={5}
                >
                  {PRODUCT_CATEGORIES.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">Hold Ctrl/Cmd to select multiple categories</p>
              </div>

              {/* Context Fields Section - Only show for text/html fields */}
              {formData.fieldType !== 'media' && (
                <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
                  <div className="flex items-center mb-2">
                    <Link size={16} className="text-blue-500 mr-2" />
                    <label htmlFor="contextFields" className="block text-sm font-medium text-gray-700">
                      Context Fields
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">
                    Select other fields whose content will be provided as context to the AI when enhancing this field. This helps the AI understand the broader product context.
                  </p>
                  <select
                    id="contextFields"
                    name="contextFields"
                    multiple
                    value={formData.contextFields || []}
                    onChange={handleContextFieldsChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                    size={Math.min(6, Math.max(3, availableContextFields.length))}
                  >
                    {availableContextFields.length === 0 ? (
                      <option disabled>No compatible fields available</option>
                    ) : (
                      availableContextFields.map(contextField => (
                        <option key={contextField.id} value={contextField.name}>
                          {contextField.name} ({contextField.fieldType})
                        </option>
                      ))
                    )}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Hold Ctrl/Cmd to select multiple fields. Only active text/html fields with compatible categories are shown.
                  </p>
                  {formData.contextFields && formData.contextFields.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {formData.contextFields.map(fieldName => (
                        <span
                          key={fieldName}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {fieldName}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {formData.subField && (
                <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Subfield Filter Configuration</h4>
                  <p className="text-xs text-gray-500 mb-3">
                    Configure when this field rule should apply based on the subfield value
                  </p>
                  
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Operator
                      </label>
                      <select
                        value={formData.subFieldFilter?.operator || 'equals'}
                        onChange={(e) => handleSubFieldFilterChange('operator', e.target.value)}
                        className="block w-full text-sm rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                      >
                        <option value="equals">Equals</option>
                        <option value="contains">Contains</option>
                        <option value="startsWith">Starts With</option>
                        <option value="endsWith">Ends With</option>
                        <option value="notEquals">Not Equals</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Value
                      </label>
                      <input
                        type="text"
                        value={formData.subFieldFilter?.value || ''}
                        onChange={(e) => handleSubFieldFilterChange('value', e.target.value)}
                        className="block w-full text-sm rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                        placeholder="e.g., packshot_single"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-2 text-xs text-gray-500">
                    <strong>Example:</strong> For media - productContentType, set operator to "equals" and value to "packshot_single" to apply this field rule only to packshot images.
                  </div>
                </div>
              )}
              
              {formData.fieldType === 'media' && (
                <div>
                  <MediaValidationForm 
                    validation={formData.mediaValidation || defaultMediaValidation} 
                    onChange={handleMediaValidationChange} 
                  />
                </div>
              )}
              
              {formData.fieldType !== 'media' && (
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-sm font-medium text-gray-700">Content Settings</h4>
                  </div>
                  
                  {/* Tab Navigation */}
                  <div className="border-b border-gray-200 mb-4">
                    <nav className="-mb-px flex space-x-8">
                      <button
                        type="button"
                        onClick={() => setActiveTab('general')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                          activeTab === 'general'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        General
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('specific')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                          activeTab === 'specific'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        Language-Specific
                      </button>
                    </nav>
                  </div>
                  
                  {activeTab === 'general' && (
                    <div className="p-4 rounded-md bg-gray-50 border border-gray-200">
                      <div className="text-sm font-medium text-gray-700 mb-3">
                        General Settings (Default for all languages)
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id="skipLanguageDetection"
                              name="skipLanguageDetection"
                              checked={formData.general?.skipLanguageDetection || false}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                general: {
                                  ...prev.general,
                                  skipLanguageDetection: e.target.checked,
                                  requirements: typeof prev.general?.requirements === 'string' ? prev.general.requirements : '',
                                  format: typeof prev.general?.format === 'string' ? prev.general.format : ''
                                }
                              }))}
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <label htmlFor="skipLanguageDetection" className="ml-2 block text-sm font-medium text-gray-700">
                              Skip language detection
                            </label>
                          </div>
                          <p className="mt-1 text-xs text-gray-500">
                            When enabled, content validation will not check if the text is in the correct language. 
                            Useful for fields containing mixed languages, technical terms, or product codes.
                          </p>
                        </div>
                        
                        <div>
                          <label htmlFor="requirements" className="block text-sm font-medium text-gray-700">
                            Requirements
                          </label>
                          <textarea
                            id="requirements"
                            name="requirements"
                            rows={3}
                            value={formData.general?.requirements || ''}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                            placeholder="Enter general field requirements"
                          />
                          <p className="mt-1 text-xs text-gray-500">These requirements apply to all languages unless overridden</p>
                        </div>
                        
                        <div>
                          <label htmlFor="format" className="block text-sm font-medium text-gray-700">
                            Format
                          </label>
                          <textarea
                            id="format"
                            name="format"
                            rows={2}
                            value={formData.general?.format || ''}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                            placeholder="Enter general format requirements"
                          />
                          <p className="mt-1 text-xs text-gray-500">These format rules apply to all languages unless overridden</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {activeTab === 'specific' && (
                    <div className="p-4 rounded-md bg-gray-50 border border-gray-200">
                      <div className="flex justify-between items-center mb-4">
                        <div className="text-sm font-medium text-gray-700">Language-Specific Settings</div>
                        <LanguageSelector 
                          selectedLanguage={selectedLanguage}
                          onChange={setSelectedLanguage}
                        />
                      </div>
                      
                      <div className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                        {selectedLanguage === 'EN' && '🇬🇧 English'}
                        {selectedLanguage === 'DE' && '🇩🇪 German'}
                        {selectedLanguage === 'FR' && '🇫🇷 French'}
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="requirements" className="block text-sm font-medium text-gray-700">
                            Requirements
                          </label>
                          <textarea
                            id="requirements"
                            name="requirements"
                            rows={3}
                            value={formData.languages[selectedLanguage].requirements}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                            placeholder={`Enter ${selectedLanguage}-specific requirements (overrides general)`}
                          />
                          <p className="mt-1 text-xs text-gray-500">Leave empty to use general requirements</p>
                        </div>
                        
                        <div>
                          <label htmlFor="format" className="block text-sm font-medium text-gray-700">
                            Format
                          </label>
                          <textarea
                            id="format"
                            name="format"
                            rows={2}
                            value={formData.languages[selectedLanguage].format}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                            placeholder={`Enter ${selectedLanguage}-specific format (overrides general)`}
                          />
                          <p className="mt-1 text-xs text-gray-500">Leave empty to use general format</p>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div>
                            <label htmlFor="whitelist" className="block text-sm font-medium text-gray-700">
                              Whitelist
                            </label>
                            <textarea
                              id="whitelist"
                              name="whitelist"
                              rows={2}
                              value={formData.languages[selectedLanguage].whitelist}
                              onChange={handleChange}
                              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                              placeholder="Comma-separated whitelist"
                            />
                          </div>
                          
                          <div>
                            <label htmlFor="blacklist" className="block text-sm font-medium text-gray-700">
                              Blacklist
                            </label>
                            <textarea
                              id="blacklist"
                              name="blacklist"
                              rows={2}
                              value={formData.languages[selectedLanguage].blacklist}
                              onChange={handleChange}
                              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                              placeholder="Comma-separated blacklist"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label htmlFor="negativeExamples" className="block text-sm font-medium text-gray-700">
                            Negative Examples
                          </label>
                          <textarea
                            id="negativeExamples"
                            name="negativeExamples"
                            rows={2}
                            value={formData.languages[selectedLanguage].negativeExamples}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                            placeholder="Comma-separated bad examples"
                          />
                          <p className="mt-1 text-xs text-gray-500">Add examples of content to avoid, separated by commas</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button
                  type="submit"
                  className="inline-flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  {mode === 'create' ? 'Add Field' : 'Update Field'}
                </button>
                <button
                  type="button"
                  className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm"
                  onClick={onClose}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FieldModal;