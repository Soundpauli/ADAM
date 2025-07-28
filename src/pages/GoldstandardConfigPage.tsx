import React, { useState } from 'react';
import { Plus, Search, Tag, X, Sparkles } from 'lucide-react';
import { useFields } from '../contexts/FieldContext';
import { useLanguage } from '../contexts/LanguageContext';
import { extractCategoryNames } from '../utils/productUtils';
import catalogFullData from '../data/catalog_full.json';

// Extract categories from the full catalog structure
const PRODUCT_CATEGORIES = extractCategoryNames(catalogFullData);

interface GoldstandardExample {
  id: string;
  content: string;
  fieldName: string;
  categories: string[];
  products: string[];
  createdAt: string;
  language: string;
}

const GoldstandardConfigPage = () => {
  const { fields } = useFields();
  const { language } = useLanguage();
  const [examples, setExamples] = useState<GoldstandardExample[]>(() => {
    const savedExamples = localStorage.getItem('goldstandardExamples');
    return savedExamples ? JSON.parse(savedExamples).map((ex: any) => ({
      ...ex,
      language: ex.language || 'EN' // Default to EN for existing examples
    })) : [];
  });
  const [selectedField, setSelectedField] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterLanguage, setFilterLanguage] = useState<string>('All');
  const [isAddingExample, setIsAddingExample] = useState(false);
  const [newExample, setNewExample] = useState<Omit<GoldstandardExample, 'id' | 'createdAt'>>({
    content: '',
    fieldName: '',
    categories: [],
    products: [],
    language: language // Use current language as default
  });

  const saveExamples = (updatedExamples: GoldstandardExample[]) => {
    localStorage.setItem('goldstandardExamples', JSON.stringify(updatedExamples));
    setExamples(updatedExamples);
  };

  const handleAddExample = () => {
    if (!newExample.content || !newExample.fieldName) return;

    const example: GoldstandardExample = {
      ...newExample,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      language: newExample.language || language // Ensure language is set
    };

    const updatedExamples = [...examples, example];
    saveExamples(updatedExamples);
    setIsAddingExample(false);
    setNewExample({
      content: '',
      fieldName: '',
      categories: [],
      products: [],
      language: language
    });
  };

  const handleDeleteExample = (id: string) => {
    if (confirm('Are you sure you want to delete this example?')) {
      const updatedExamples = examples.filter(ex => ex.id !== id);
      saveExamples(updatedExamples);
    }
  };

  const handleCategoryChange = (category: string) => {
    if (newExample.categories.includes(category)) {
      setNewExample({
        ...newExample,
        categories: newExample.categories.filter(c => c !== category)
      });
    } else {
      setNewExample({
        ...newExample,
        categories: [...newExample.categories, category]
      });
    }
  };

  const filteredExamples = examples.filter(example => {
    const matchesField = !selectedField || example.fieldName === selectedField;
    const matchesSearch = !searchTerm || 
      example.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      example.fieldName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'All' || 
      example.categories.includes(filterCategory);
    const matchesLanguage = filterLanguage === 'All' || 
      example.language === filterLanguage;
    
    return matchesField && matchesSearch && matchesCategory && matchesLanguage;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">Goldstandard Examples</h2>
        <button
          onClick={() => setIsAddingExample(true)}
          className="flex items-center px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-150"
        >
          <Plus size={16} className="mr-2" />
          Add Example
        </button>
      </div>

      <div className="flex flex-wrap gap-4 items-center bg-gray-50 p-4 rounded-lg">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search examples..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <select
            value={selectedField}
            onChange={(e) => setSelectedField(e.target.value)}
            className="rounded-md border border-gray-300 py-2 px-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Fields</option>
            {fields.map(field => (
              <option key={field.id} value={field.name}>{field.name}</option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="rounded-md border border-gray-300 py-2 px-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="All">All Categories</option>
            {PRODUCT_CATEGORIES.filter(cat => cat !== 'All').map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
        
        <div>
          <select
            value={filterLanguage}
            onChange={(e) => setFilterLanguage(e.target.value)}
            className="rounded-md border border-gray-300 py-2 px-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="All">All Languages</option>
            <option value="EN">🇬🇧 English</option>
            <option value="DE">🇩🇪 German</option>
            <option value="FR">🇫🇷 French</option>
          </select>
        </div>

        {searchTerm || selectedField || filterCategory !== 'All' || filterLanguage !== 'All' ? (
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedField('');
              setFilterCategory('All');
              setFilterLanguage('All');
            }}
            className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
          >
            Clear Filters
          </button>
        ) : null}
      </div>

      {isAddingExample && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Add New Example</h3>
            <button
              onClick={() => setIsAddingExample(false)}
              className="text-gray-400 hover:text-gray-500"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="fieldName" className="block text-sm font-medium text-gray-700 mb-1">
                Field Type
              </label>
              <select
                id="fieldName"
                value={newExample.fieldName}
                onChange={(e) => setNewExample({...newExample, fieldName: e.target.value})}
                className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                required
              >
                <option value="">Select a field</option>
                {fields.map(field => (
                  <option key={field.id} value={field.name}>{field.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                Example Content
              </label>
              <textarea
                id="content"
                value={newExample.content}
                onChange={(e) => setNewExample({...newExample, content: e.target.value})}
                rows={6}
                className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                placeholder="Enter example content..."
                required
              />
            </div>
            
            <div>
              <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-1">
                Language
              </label>
              <select
                id="language"
                value={newExample.language}
                onChange={(e) => setNewExample({...newExample, language: e.target.value})}
                className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                required
              >
                <option value="EN">🇬🇧 English</option>
                <option value="DE">🇩🇪 German</option>
                <option value="FR">🇫🇷 French</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categories
              </label>
              <div className="flex flex-wrap gap-2">
                {PRODUCT_CATEGORIES.filter(cat => cat !== 'All').map(category => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => handleCategoryChange(category)}
                    className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                      newExample.categories.includes(category)
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setIsAddingExample(false)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddExample}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                disabled={!newExample.content || !newExample.fieldName}
              >
                Save Example
              </button>
            </div>
          </div>
        </div>
      )}

      {filteredExamples.length === 0 ? (
        <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
          <Tag size={48} className="mx-auto text-gray-400 mb-3" />
          <h3 className="text-sm font-medium text-gray-900">No examples found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {examples.length === 0
              ? "You haven't added any goldstandard examples yet."
              : "No examples match your current filters."}
          </p>
          {examples.length === 0 && (
            <button
              onClick={() => setIsAddingExample(true)}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus size={16} className="mr-2" />
              Add Your First Example
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredExamples.map(example => (
            <div key={example.id} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                <div className="flex items-center">
                  <span className="font-medium text-gray-900 mr-2">{example.fieldName}</span>
                  <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800 mr-2">
                    {example.language === 'EN' && '🇬🇧 EN'}
                    {example.language === 'DE' && '🇩🇪 DE'}
                    {example.language === 'FR' && '🇫🇷 FR'}
                  </span>
                  {example.source === 'auto_enhancement' && (
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 mr-2">
                      <Sparkles size={10} className="mr-1" />
                      Auto-generated
                    </span>
                  )}
                  {example.categories.length > 0 && (
                    <div className="flex gap-1">
                      {example.categories.map(category => (
                        <span
                          key={category}
                          className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800"
                        >
                          {category}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">
                    {new Date(example.createdAt).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => handleDeleteExample(example.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
              <div className="p-4">
                <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                  {example.content}
                </pre>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GoldstandardConfigPage;