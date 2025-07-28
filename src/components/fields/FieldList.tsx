import React, { useState, useEffect } from 'react';
import { Copy, Trash2, Edit, Plus, Eye, EyeOff, Link } from 'lucide-react';
import { useFields } from '../../contexts/FieldContext';
import { useAuth } from '../../contexts/AuthContext';
import { Field } from '../../types';
import catalogFullData from '../../data/catalog_full.json';
import { extractCategoryNames } from '../../utils/productUtils';
import FieldModal from './FieldModal';

const FieldList = () => {
  // Extract categories from the catalog
  const PRODUCT_CATEGORIES = extractCategoryNames(catalogFullData);
  
  const { fields, deleteField, copyField, updateField } = useFields();
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentField, setCurrentField] = useState<Field | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showInactive, setShowInactive] = useState(false);
  
  const filteredFields = fields
    .filter(field => {
      // Filter by active/inactive status
      if (!showInactive && !field.isActive) return false;
      
      if (selectedCategory === 'All') return true;
      if (!field.productCategories || field.productCategories.length === 0) return true;
      return field.productCategories.includes(selectedCategory);
    })
    .sort((a, b) => {
      const comparison = a.name.localeCompare(b.name);
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const handleAddField = () => {
    setCurrentField(null);
    setModalMode('create');
    setIsModalOpen(true);
  };
  
  const handleEditField = (field: Field) => {
    setCurrentField(field);
    setModalMode('edit');
    setIsModalOpen(true);
  };
  
  const handleCopyField = (id: string) => {
    copyField(id);
  };
  
  const handleDeleteField = (id: string) => {
    if (confirm('Are you sure you want to delete this field?')) {
      deleteField(id);
    }
  };
  
  const handleToggleActive = (id: string, isActive: boolean) => {
    updateField(id, { isActive: !isActive });
  };
  
  const closeModal = () => {
    setIsModalOpen(false);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-4">
        <h2 className="text-xl font-semibold text-gray-800">Field Configurations</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowInactive(!showInactive)}
              className={`inline-flex items-center h-10 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150 ${
                showInactive
                  ? 'bg-gray-600 text-white hover:bg-gray-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {showInactive ? <EyeOff size={14} className="mr-1.5" /> : <Eye size={14} className="mr-1.5" />}
              Hide Inactive
            </button>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded-md border border-gray-300 bg-white h-10 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            >
              <option value="All">All Categories</option>
              {PRODUCT_CATEGORIES.filter(cat => cat !== 'All').map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <button
              onClick={() => setSortOrder(order => order === 'asc' ? 'desc' : 'asc')}
              className="inline-flex items-center h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Sort {sortOrder === 'asc' ? '↓' : '↑'}
            </button>
          </div>
          <button
            onClick={handleAddField}
            className="flex items-center px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-150"
          >
            <Plus size={16} className="mr-2" />
            Add Field
          </button>
        </div>
      </div>
      
      {filteredFields.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <SlidersHorizontal size={48} className="text-gray-300" />
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No fields configured</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new field configuration.</p>
          <div className="mt-6">
            <button
              type="button"
              onClick={handleAddField}
              className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <Plus size={16} className="-ml-1 mr-2" />
              Add Field
            </button>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-2 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 w-4">
                  <span className="sr-only">Type Indicator</span>
                </th>
                <th scope="col" className="px-2 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 w-16">
                  Active
                </th>
                <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Field Name</th>
                <th scope="col" className="hidden md:table-cell px-4 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Requirements</th>
                <th scope="col" className="relative px-4 sm:px-6 py-3 w-24">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredFields.map((field) => (
                <tr key={field.id} className={`hover:bg-gray-50 transition-colors duration-150 ${
                  !field.isActive ? 'opacity-60' : ''
                }`}>
                  <td className="whitespace-nowrap px-2 py-4 w-4">
                    <div className="flex items-center">
                      <div 
                        className={`w-1 h-8 rounded-full ${
                          field.applicableTo === 'base' 
                            ? 'bg-blue-500' 
                            : field.applicableTo === 'variant' 
                            ? 'bg-green-500' 
                            : 'bg-purple-500'
                        }`}
                        title={`Applies to: ${field.applicableTo}`}
                      ></div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-2 py-4 w-16">
                    <button
                      onClick={() => handleToggleActive(field.id, field.isActive)}
                      disabled={!['admin', 'manager'].includes(user?.role || '')}
                      className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors duration-150 ${
                        field.isActive
                          ? 'bg-green-100 text-green-600 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                      } ${
                        !['admin', 'manager'].includes(user?.role || '')
                          ? 'cursor-not-allowed opacity-50'
                          : 'cursor-pointer'
                      }`}
                      title={field.isActive ? 'Click to deactivate' : 'Click to activate'}
                    >
                      {field.isActive ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                  </td>
                  <td className="whitespace-nowrap px-4 sm:px-6 py-4">
                    <div className="flex items-center">
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          <div className="flex items-center">
                            <span>
                              {field.name}
                              {field.subField && (
                                <span className="text-gray-500">{" > "}{field.subField}</span>
                              )}
                            </span>
                            <span className="ml-2 inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                              {field.fieldType}
                            </span>
                            {!field.isActive && (
                              <span className="ml-2 inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                                Inactive
                              </span>
                            )}
                            {field.isMandatory && (
                              <span className="ml-2 inline-flex items-center rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-800">
                                Mandatory
                              </span>
                            )}
                            {field.useClaimList && (
                              <span className="ml-2 inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800">
                                Uses Claims
                              </span>
                            )}
                            {(!field.productCategories || field.productCategories.length === 0) && (
                              <span className="ml-2 inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                                All Categories
                              </span>
                            )}
                            {field.contextFields && field.contextFields.length > 0 && (
                              <span className="ml-2 inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800" title={`Uses context from: ${field.contextFields.join(', ')}`}>
                                <Link size={12} className="mr-1" />
                                {field.contextFields.length} context
                              </span>
                            )}
                          </div>
                          {field.productCategories && field.productCategories.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {(field.productCategories || []).map(category => (
                                <span
                                  key={category}
                                  className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700"
                                >
                                  {category}
                                </span>
                              ))}
                            </div>
                          )}
                          {field.contextFields && field.contextFields.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {field.contextFields.map(contextField => (
                                <span
                                  key={contextField}
                                  className="inline-flex items-center rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700"
                                >
                                  {contextField}
                                </span>
                              ))}
                            </div>
                          )}
                          {field.subField && field.subFieldFilter && (
                            <div className="mt-1 text-xs text-gray-500">
                              Filter: {field.subField} {field.subFieldFilter.operator} "{field.subFieldFilter.value}"
                            </div>
                          )}
                          <div className="text-xs text-gray-500 mt-1">Applies to: {field.applicableTo}</div>
                          <div className="text-xs text-gray-500 mt-1 flex items-center">
                            <div 
                              className={`w-2 h-2 rounded-full mr-1 ${
                                field.applicableTo === 'base' 
                                  ? 'bg-blue-500' 
                                  : field.applicableTo === 'variant' 
                                  ? 'bg-green-500' 
                                  : 'bg-purple-500'
                              }`}
                            ></div>
                            {field.applicableTo === 'base' && 'Base Product'}
                            {field.applicableTo === 'variant' && 'Variant Only'}
                            {field.applicableTo === 'both' && 'Base & Variant'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="hidden md:table-cell px-4 sm:px-6 py-4">
                    <div className="text-sm text-gray-900 truncate max-w-xs">
                      {field.languages?.EN?.requirements || field.general?.requirements || 'None specified'}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 sm:px-6 py-4 text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        disabled={!['admin', 'manager'].includes(user?.role || '')}
                        onClick={() => handleEditField(field)}
                        className={`rounded-full p-1 ${
                          ['admin', 'manager'].includes(user?.role || '')
                            ? 'text-blue-600 hover:text-blue-900'
                            : 'text-gray-400 cursor-not-allowed'
                        } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        disabled={!['admin', 'manager'].includes(user?.role || '')}
                        onClick={() => handleCopyField(field.id)}
                        className={`rounded-full p-1 ${
                          ['admin', 'manager'].includes(user?.role || '')
                            ? 'text-gray-600 hover:text-gray-900'
                            : 'text-gray-400 cursor-not-allowed'
                        } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                      >
                        <Copy size={16} />
                      </button>
                      <button
                        disabled={!['admin', 'manager'].includes(user?.role || '')}
                        onClick={() => handleDeleteField(field.id)}
                        className={`rounded-full p-1 ${
                          ['admin', 'manager'].includes(user?.role || '')
                            ? 'text-red-600 hover:text-red-900'
                            : 'text-gray-400 cursor-not-allowed'
                        } focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      <FieldModal 
        isOpen={isModalOpen} 
        onClose={closeModal} 
        mode={modalMode} 
        field={currentField} 
        categories={PRODUCT_CATEGORIES}
      />
    </div>
  );
};

const SlidersHorizontal = ({ size, className }: { size: number, className?: string }) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <line x1="4" y1="21" x2="4" y2="14"></line>
      <line x1="4" y1="10" x2="4" y2="3"></line>
      <line x1="12" y1="21" x2="12" y2="12"></line>
      <line x1="12" y1="8" x2="12" y2="3"></line>
      <line x1="20" y1="21" x2="20" y2="16"></line>
      <line x1="20" y1="12" x2="20" y2="3"></line>
      <line x1="1" y1="14" x2="7" y2="14"></line>
      <line x1="9" y1="8" x2="15" y2="8"></line>
      <line x1="17" y1="16" x2="23" y2="16"></line>
    </svg>
  );
};

export default FieldList;