import React, { useState, useRef } from 'react';
import { Upload, Download, RotateCcw } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useEnhancedProducts } from '../../contexts/EnhancedProductContext';

const DataOriginSettings = () => {
  const { user } = useAuth();
  const { exportEnhancedCatalog, resetEnhancements, getEnhancementStats } = useEnhancedProducts();
  const [isDragging, setIsDragging] = useState(false);
  const [lastUpload, setLastUpload] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const enhancementStats = getEnhancementStats();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.csv')) {
      handleFileUpload(file);
    } else {
      alert('Please upload a CSV file');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csv = e.target?.result as string;
        // Here you would normally process the CSV and update the products
        // For demo purposes, we'll just store the last upload time
        setLastUpload(new Date().toLocaleString());
      } catch (error) {
        console.error('Error processing CSV:', error);
        alert('Error processing CSV file');
      }
    };
    reader.readAsText(file);
  };

  const handleResetEnhancements = () => {
    if (confirm('Are you sure you want to reset all enhancements? This action cannot be undone.')) {
      resetEnhancements();
      alert('All enhancements have been reset.');
    }
  };

  if (user?.role !== 'admin') {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Data Origin</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={exportEnhancedCatalog}
            className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <Download size={16} className="mr-2" />
            Export Enhanced Catalog
          </button>
          <button
            onClick={handleResetEnhancements}
            className="inline-flex items-center rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 shadow-sm hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            <RotateCcw size={16} className="mr-2" />
            Reset Enhancements
          </button>
        </div>
      </div>

      {enhancementStats.enhancedProducts > 0 && (
        <div className="rounded-md bg-blue-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Enhancement Statistics</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  <strong>{enhancementStats.enhancedProducts}</strong> out of <strong>{enhancementStats.totalProducts}</strong> products have been enhanced ({enhancementStats.enhancementPercentage}%)
                </p>
                <p className="mt-1">
                  Export the enhanced catalog to download a complete dataset with all AI enhancements integrated.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      <div 
        className={`relative rounded-lg border-2 border-dashed p-6 ${
          isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept=".csv"
          onChange={handleFileSelect}
        />
        
        <div className="text-center">
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <div className="mt-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Upload CSV
            </button>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            or drag and drop your CSV file here
          </p>
        </div>
        
        {lastUpload && (
          <div className="mt-4 text-center text-sm text-gray-500">
            Last upload: {lastUpload}
          </div>
        )}
      </div>
      
      <div className="rounded-md bg-gray-50 p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-gray-800">CSV Format Requirements</h3>
            <div className="mt-2 text-sm text-gray-600">
              <p>The CSV file should include the following columns:</p>
              <ul className="mt-1 list-disc space-y-1 pl-5">
                <li>product_id (unique identifier)</li>
                <li>name (product name)</li>
                <li>description (product description)</li>
                <li>image_url (URL to product image)</li>
                <li>variant_name (name of the variant)</li>
                <li>sku (unique SKU for the variant)</li>
                <li>price (variant price)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataOriginSettings;