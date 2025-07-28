import React, { useState } from 'react';
import { Plus, Search, Tag, X, FileText } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { extractCategoryNames } from '../utils/productUtils';
import catalogFullData from '../data/catalog_full.json';

// Extract categories from the full catalog structure
const PRODUCT_CATEGORIES = extractCategoryNames(catalogFullData);

interface Claim {
  id: string;
  productIds: string[];
  claimType: string;
  claim: string;
  language: string;
  createdAt: string;
}

const CLAIM_TYPES = [
  'Health Benefit',
  'Performance',
  'Comfort',
  'Safety',
  'Environmental',
  'Quality',
  'Innovation',
  'Regulatory',
  'Clinical',
  'Other'
];

const ClaimsPage = () => {
  const { language } = useLanguage();
  const [claims, setClaims] = useState<Claim[]>(() => {
    const savedClaims = localStorage.getItem('productClaims');
    return savedClaims ? JSON.parse(savedClaims).map((claim: any) => ({
      ...claim,
      language: claim.language || 'EN' // Default to EN for existing claims
    })) : [];
  });
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterClaimType, setFilterClaimType] = useState<string>('All');
  const [filterLanguage, setFilterLanguage] = useState<string>('All');
  const [isAddingClaim, setIsAddingClaim] = useState(false);
  const [newClaim, setNewClaim] = useState<Omit<Claim, 'id' | 'createdAt'>>({
    productIds: [],
    claimType: '',
    claim: '',
    language: language // Use current language as default
  });

  const saveClaims = (updatedClaims: Claim[]) => {
    localStorage.setItem('productClaims', JSON.stringify(updatedClaims));
    setClaims(updatedClaims);
  };

  const handleAddClaim = () => {
    if (!newClaim.claim || !newClaim.claimType || newClaim.productIds.length === 0) return;

    const claim: Claim = {
      ...newClaim,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      language: newClaim.language || language // Ensure language is set
    };

    const updatedClaims = [...claims, claim];
    saveClaims(updatedClaims);
    setIsAddingClaim(false);
    setNewClaim({
      productIds: [],
      claimType: '',
      claim: '',
      language: language
    });
  };

  const handleDeleteClaim = (id: string) => {
    if (confirm('Are you sure you want to delete this claim?')) {
      const updatedClaims = claims.filter(claim => claim.id !== id);
      saveClaims(updatedClaims);
    }
  };

  const handleProductIdsChange = (value: string) => {
    // Split by comma, semicolon, or newline and clean up
    const ids = value
      .split(/[,;\n]/)
      .map(id => id.trim())
      .filter(id => id.length > 0);
    
    setNewClaim({
      ...newClaim,
      productIds: ids
    });
  };

  const filteredClaims = claims.filter(claim => {
    const matchesSearch = !searchTerm || 
      claim.claim.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.claimType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.productIds.some(id => id.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesClaimType = filterClaimType === 'All' || 
      claim.claimType === filterClaimType;
    const matchesLanguage = filterLanguage === 'All' || 
      claim.language === filterLanguage;
    
    return matchesSearch && matchesClaimType && matchesLanguage;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">Product Claims</h2>
        <button
          onClick={() => setIsAddingClaim(true)}
          className="flex items-center px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-150"
        >
          <Plus size={16} className="mr-2" />
          Add Claim
        </button>
      </div>

      <div className="flex flex-wrap gap-4 items-center bg-gray-50 p-4 rounded-lg">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search claims..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <select
            value={filterClaimType}
            onChange={(e) => setFilterClaimType(e.target.value)}
            className="rounded-md border border-gray-300 py-2 px-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="All">All Claim Types</option>
            {CLAIM_TYPES.map(type => (
              <option key={type} value={type}>{type}</option>
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

        {(searchTerm || filterClaimType !== 'All' || filterLanguage !== 'All') && (
          <button
            onClick={() => {
              setSearchTerm('');
              setFilterClaimType('All');
              setFilterLanguage('All');
            }}
            className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
          >
            Clear Filters
          </button>
        )}
      </div>

      {isAddingClaim && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Add New Claim</h3>
            <button
              onClick={() => setIsAddingClaim(false)}
              className="text-gray-400 hover:text-gray-500"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="productIds" className="block text-sm font-medium text-gray-700 mb-1">
                Product ID(s)
              </label>
              <textarea
                id="productIds"
                value={newClaim.productIds.join(', ')}
                onChange={(e) => handleProductIdsChange(e.target.value)}
                rows={3}
                className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                placeholder="Enter product codes separated by commas, semicolons, or new lines (e.g., MOLICARE_PREMIUM_ELASTIC_10, MOLICARE_PAD_SUPER)"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                Enter multiple product codes separated by commas, semicolons, or new lines
              </p>
              {newClaim.productIds.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {newClaim.productIds.map((id, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {id}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="claimType" className="block text-sm font-medium text-gray-700 mb-1">
                Claim Type
              </label>
              <select
                id="claimType"
                value={newClaim.claimType}
                onChange={(e) => setNewClaim({...newClaim, claimType: e.target.value})}
                className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                required
              >
                <option value="">Select a claim type</option>
                {CLAIM_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="claim" className="block text-sm font-medium text-gray-700 mb-1">
                Claim
              </label>
              <textarea
                id="claim"
                value={newClaim.claim}
                onChange={(e) => setNewClaim({...newClaim, claim: e.target.value})}
                rows={6}
                className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                placeholder="Enter the product claim..."
                required
              />
            </div>
            
            <div>
              <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-1">
                Language
              </label>
              <select
                id="language"
                value={newClaim.language}
                onChange={(e) => setNewClaim({...newClaim, language: e.target.value})}
                className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                required
              >
                <option value="EN">🇬🇧 English</option>
                <option value="DE">🇩🇪 German</option>
                <option value="FR">🇫🇷 French</option>
              </select>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setIsAddingClaim(false)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddClaim}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                disabled={!newClaim.claim || !newClaim.claimType || newClaim.productIds.length === 0}
              >
                Save Claim
              </button>
            </div>
          </div>
        </div>
      )}

      {filteredClaims.length === 0 ? (
        <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
          <FileText size={48} className="mx-auto text-gray-400 mb-3" />
          <h3 className="text-sm font-medium text-gray-900">No claims found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {claims.length === 0
              ? "You haven't added any product claims yet."
              : "No claims match your current filters."}
          </p>
          {claims.length === 0 && (
            <button
              onClick={() => setIsAddingClaim(true)}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus size={16} className="mr-2" />
              Add Your First Claim
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredClaims.map(claim => (
            <div key={claim.id} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                <div className="flex items-center">
                  <span className="font-medium text-gray-900 mr-2">{claim.claimType}</span>
                  <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800 mr-2">
                    {claim.language === 'EN' && '🇬🇧 EN'}
                    {claim.language === 'DE' && '🇩🇪 DE'}
                    {claim.language === 'FR' && '🇫🇷 FR'}
                  </span>
                  <div className="flex gap-1">
                    {claim.productIds.map(productId => (
                      <span
                        key={productId}
                        className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800"
                      >
                        {productId}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">
                    {new Date(claim.createdAt).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => handleDeleteClaim(claim.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
              <div className="p-4">
                <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                  {claim.claim}
                </pre>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClaimsPage;