import React, { useRef } from 'react';
import { Download, Upload } from 'lucide-react';
import { useFields } from '../../contexts/FieldContext';
import { useAuth } from '../../contexts/AuthContext';
import { Field } from '../../types';

const FieldConfigSettings = () => {
  const { fields, importFields } = useFields();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const fieldsData = JSON.stringify(fields, null, 2);
    const blob = new Blob([fieldsData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'field-configurations.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedFields = JSON.parse(event.target?.result as string) as Field[];
        const cleanFields = importedFields.map(({ id, ...fieldData }) => fieldData);
        importFields(cleanFields);
        alert('Field configurations imported successfully');
      } catch (error) {
        console.error('Error importing fields:', error);
        alert('Error importing field configurations. Please check the file format.');
      }
    };
    reader.readAsText(file);
  };

  if (user?.role !== 'admin') {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Field Configurations</h3>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-base font-medium text-gray-900">Import/Export</h4>
            <p className="mt-1 text-sm text-gray-500">
              Manage your field configurations by importing or exporting them
            </p>
          </div>
          <div className="flex space-x-3">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".json"
              onChange={handleImport}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <Upload size={16} className="mr-2" />
              Import
            </button>
            <button
              onClick={handleExport}
              className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <Download size={16} className="mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-md bg-gray-50 p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-gray-800">Import Format</h3>
            <div className="mt-2 text-sm text-gray-600">
              <p>The JSON file should include an array of field configurations with:</p>
              <ul className="mt-1 list-disc space-y-1 pl-5">
                <li>name (field name)</li>
                <li>category (base, variant, or both)</li>
                <li>productCategories (array of applicable categories)</li>
                <li>requirements (field requirements)</li>
                <li>format (format requirements)</li>
                <li>whitelist (allowed terms)</li>
                <li>blacklist (prohibited terms)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FieldConfigSettings;