import React from 'react';
import { MediaValidation } from '../../types';

interface MediaValidationFormProps {
  validation: MediaValidation;
  onChange: (validation: MediaValidation) => void;
}

const DEFAULT_FILE_TYPES = ['png', 'jpg', 'jpeg', 'webm', 'gif', 'pdf'];
const COMMON_ASPECT_RATIOS = [
  '1:1', '4:3', '3:2', '16:10', '16:9', '21:9', '2:1', '3:1'
];

const MediaValidationForm: React.FC<MediaValidationFormProps> = ({ validation, onChange }) => {
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    
    if (name === 'requireHttps') {
      onChange({
        ...validation,
        requireHttps: checked
      });
    } else if (name.startsWith('fileType-')) {
      const fileType = name.replace('fileType-', '');
      let allowedFileTypes = [...validation.allowedFileTypes];
      
      if (checked) {
        if (!allowedFileTypes.includes(fileType)) {
          allowedFileTypes.push(fileType);
        }
      } else {
        allowedFileTypes = allowedFileTypes.filter(type => type !== fileType);
      }
      
      onChange({
        ...validation,
        allowedFileTypes
      });
    }
  };

  const handleNumberInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    onChange({
      ...validation,
      [name]: value === '' ? undefined : parseInt(value, 10)
    });
  };

  const handleAspectRatioChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { value } = e.target;
    onChange({
      ...validation,
      aspectRatio: value === '' ? undefined : value
    });
  };

  const handleMultipleAspectRatiosChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const options = e.target.options;
    const selectedRatios = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selectedRatios.push(options[i].value);
      }
    }
    onChange({
      ...validation,
      allowedAspectRatios: selectedRatios.length > 0 ? selectedRatios : undefined
    });
  };

  return (
    <div className="space-y-4 p-4 bg-gray-50 rounded-md border border-gray-200">
      <h3 className="text-sm font-medium text-gray-700">Media Validation Settings</h3>
      
      <div>
        <div className="flex items-center">
          <input
            type="checkbox"
            id="requireHttps"
            name="requireHttps"
            checked={validation.requireHttps}
            onChange={handleCheckboxChange}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="requireHttps" className="ml-2 block text-sm text-gray-700">
            Require HTTPS URLs
          </label>
        </div>
        <p className="mt-1 text-xs text-gray-500">Ensure all media URLs use the secure HTTPS protocol</p>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Allowed File Types</label>
        <div className="grid grid-cols-3 gap-2">
          {DEFAULT_FILE_TYPES.map(fileType => (
            <div key={fileType} className="flex items-center">
              <input
                type="checkbox"
                id={`fileType-${fileType}`}
                name={`fileType-${fileType}`}
                checked={validation.allowedFileTypes.includes(fileType)}
                onChange={handleCheckboxChange}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor={`fileType-${fileType}`} className="ml-2 block text-sm text-gray-700">
                .{fileType}
              </label>
            </div>
          ))}
        </div>
      </div>
      
      <div>
        <label htmlFor="aspectRatio" className="block text-sm font-medium text-gray-700 mb-1">
          Required Aspect Ratio (Single)
        </label>
        <select
          id="aspectRatio"
          value={validation.aspectRatio || ''}
          onChange={handleAspectRatioChange}
          className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
        >
          <option value="">No specific ratio required</option>
          {COMMON_ASPECT_RATIOS.map(ratio => (
            <option key={ratio} value={ratio}>{ratio}</option>
          ))}
        </select>
        <p className="mt-1 text-xs text-gray-500">Specify a single required aspect ratio for all media assets</p>
      </div>
      
      <div>
        <label htmlFor="allowedAspectRatios" className="block text-sm font-medium text-gray-700 mb-1">
          Allowed Aspect Ratios (Multiple)
        </label>
        <select
          id="allowedAspectRatios"
          multiple
          value={validation.allowedAspectRatios || []}
          onChange={handleMultipleAspectRatiosChange}
          className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
          size={4}
        >
          {COMMON_ASPECT_RATIOS.map(ratio => (
            <option key={ratio} value={ratio}>{ratio}</option>
          ))}
        </select>
        <p className="mt-1 text-xs text-gray-500">Hold Ctrl/Cmd to select multiple allowed aspect ratios. Leave empty if using single ratio above.</p>
      </div>
      
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="minWidth" className="block text-sm font-medium text-gray-700">
            Min Width (px)
          </label>
          <input
            type="number"
            name="minWidth"
            id="minWidth"
            value={validation.minWidth || ''}
            onChange={handleNumberInputChange}
            min="0"
            className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
            placeholder="Min width"
          />
        </div>
        
        <div>
          <label htmlFor="maxWidth" className="block text-sm font-medium text-gray-700">
            Max Width (px)
          </label>
          <input
            type="number"
            name="maxWidth"
            id="maxWidth"
            value={validation.maxWidth || ''}
            onChange={handleNumberInputChange}
            min="0"
            className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
            placeholder="Max width"
          />
        </div>
        
        <div>
          <label htmlFor="minHeight" className="block text-sm font-medium text-gray-700">
            Min Height (px)
          </label>
          <input
            type="number"
            name="minHeight"
            id="minHeight"
            value={validation.minHeight || ''}
            onChange={handleNumberInputChange}
            min="0"
            className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
            placeholder="Min height"
          />
        </div>
        
        <div>
          <label htmlFor="maxHeight" className="block text-sm font-medium text-gray-700">
            Max Height (px)
          </label>
          <input
            type="number"
            name="maxHeight"
            id="maxHeight"
            value={validation.maxHeight || ''}
            onChange={handleNumberInputChange}
            min="0"
            className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
            placeholder="Max height"
          />
        </div>
        
        <div>
          <label htmlFor="minFileSize" className="block text-sm font-medium text-gray-700">
            Min File Size (KB)
          </label>
          <input
            type="number"
            name="minFileSize"
            id="minFileSize"
            value={validation.minFileSize || ''}
            onChange={handleNumberInputChange}
            min="0"
            className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
            placeholder="Min file size"
          />
        </div>
        
        <div>
          <label htmlFor="maxFileSize" className="block text-sm font-medium text-gray-700">
            Max File Size (KB)
          </label>
          <input
            type="number"
            name="maxFileSize"
            id="maxFileSize"
            value={validation.maxFileSize || ''}
            onChange={handleNumberInputChange}
            min="0"
            className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
            placeholder="Max file size"
          />
        </div>
      </div>
      
      <div>
        <label htmlFor="mediaCountMin" className="block text-sm font-medium text-gray-700">
          Media Count - Minimum
        </label>
        <input
          type="number"
          name="mediaCountMin"
          id="mediaCountMin"
          value={validation.mediaCountMin || ''}
          onChange={handleNumberInputChange}
          min="0"
          className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
          placeholder="Min count"
        />
        <p className="mt-1 text-xs text-gray-500">Minimum number of media assets required</p>
      </div>
      
      <div>
        <label htmlFor="mediaCountMax" className="block text-sm font-medium text-gray-700">
          Media Count - Maximum
        </label>
        <input
          type="number"
          name="mediaCountMax"
          id="mediaCountMax"
          value={validation.mediaCountMax || ''}
          onChange={handleNumberInputChange}
          min="0"
          className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
          placeholder="Max count"
        />
        <p className="mt-1 text-xs text-gray-500">Maximum number of media assets allowed</p>
      </div>
      
      <div>
        <label htmlFor="mediaCountOptimal" className="block text-sm font-medium text-gray-700">
          Media Count - Optimal
        </label>
        <input
          type="number"
          name="mediaCountOptimal"
          id="mediaCountOptimal"
          value={validation.mediaCountOptimal || ''}
          onChange={handleNumberInputChange}
          min="0"
          className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
          placeholder="Optimal count"
        />
        <p className="mt-1 text-xs text-gray-500">Recommended number of media assets for best quality</p>
      </div>
    </div>
  );
};

export default MediaValidationForm;