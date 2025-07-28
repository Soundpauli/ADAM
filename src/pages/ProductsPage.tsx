import React, { useState, useEffect, useRef } from 'react';
import { Package, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useFields } from '../contexts/FieldContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useEnhancedProducts } from '../contexts/EnhancedProductContext';
import AIEnhanceModal from '../components/products/AIEnhanceModal';
import ProductCard from '../components/products/ProductCard';
import CategoryTreeSelector from '../components/shared/CategoryTreeSelector';
import { validateContent } from '../services/validation';
import { Product, CatalogVersionWsDTO, Category } from '../types';
import { extractProductsFromCatalog } from '../utils/productUtils';

// Import the full catalog data
import catalogFullData from '../data/catalog_full.json';

// Enhanced Product interface with version info
interface EnhancedProduct extends Product {
  baseCode: string;
  version: string;
  isActive: boolean;
}

const ProductsPage = () => {
  const { user } = useAuth();
  const { fields } = useFields();
  const { language } = useLanguage();
  const { 
    enhancedProducts, 
    updateEnhancedProduct, 
    getProductData, 
    exportEnhancedCatalog, 
    getEnhancementStats 
  } = useEnhancedProducts();
  
  // Process the new catalog data format
  const catalog = catalogFullData as CatalogVersionWsDTO;
  
  const [selectedCategory, setSelectedCategory] = useState(() => {
    return localStorage.getItem('adam_selectedCategory') || '';
  });
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showInactive, setShowInactive] = useState(false);
  const [enhanceField, setEnhanceField] = useState<{ product: Product; fields: string[]; key: number } | null>(null);
  const [products, setProducts] = useState<EnhancedProduct[]>([]);
  const [validationResults, setValidationResults] = useState<Record<string, Record<string, { passed: boolean; issues: string[]; quality?: { rating: number; remarks: string } | null; validationCriteria?: string[]; validationPrompt?: string }>>>({});
  const [isValidating, setIsValidating] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>(() => {
    try {
      const stored = localStorage.getItem('adam_openCategories');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });
  const scrollRestored = useRef(false);

  const canEnhance = ['admin', 'manager'].includes(user?.role || '');

  // Function to determine active/inactive status for products
  const enhanceProductsWithVersionInfo = (products: Product[]): EnhancedProduct[] => {
    // Group products by assortmentProductCode
    const groupedProducts = products.reduce((groups, product) => {
      const baseCode = product.assortmentProductCode;
      if (!groups[baseCode]) {
        groups[baseCode] = [];
      }
      groups[baseCode].push(product);
      return groups;
    }, {} as Record<string, Product[]>);

    // Determine active/inactive status within each group
    const enhancedProducts: EnhancedProduct[] = [];

    Object.entries(groupedProducts).forEach(([baseCode, productsInGroup]) => {
      // Extract version numbers from code field (last 2 digits)
      const productsWithVersions = productsInGroup.map(product => {
        const version = product.code.slice(-2);
        return {
          ...product,
          baseCode,
          version,
          versionNumber: parseInt(version, 10)
        };
      });

      // Find the highest version number in this group
      const maxVersion = Math.max(...productsWithVersions.map(p => p.versionNumber));

      // Mark products as active/inactive
      productsWithVersions.forEach(product => {
        enhancedProducts.push({
          ...product,
          isActive: product.versionNumber === maxVersion
        });
      });
    });

    return enhancedProducts;
  };

  // Helper function to build hierarchical category order map
  const buildCategoryOrderMap = (): Map<string, number> => {
    const orderMap = new Map<string, number>();
    let currentIndex = 0;
    
    const traverseCategories = (categories: Category[]) => {
      categories.forEach(category => {
        orderMap.set(category.name, currentIndex++);
        if (category.subcategories && category.subcategories.length > 0) {
          traverseCategories(category.subcategories);
        }
      });
    };
    
    if (catalog.categories) {
      traverseCategories(catalog.categories);
    }
    
    return orderMap;
  };

  // Helper function to get all subcategory names recursively
  const getAllSubcategoryNames = (category: Category): string[] => {
    const names = [category.name];
    
    if (category.subcategories && category.subcategories.length > 0) {
      category.subcategories.forEach(subcategory => {
        names.push(...getAllSubcategoryNames(subcategory));
      });
    }
    
    return names;
  };

  // Helper function to find category by path
  const findCategoryByPath = (path: string): Category | null => {
    if (!catalog.categories) return null;
    
    const pathParts = path.split(' > ');
    const targetCategoryName = pathParts[pathParts.length - 1];
    
    const searchInCategories = (categories: Category[]): Category | null => {
      for (const category of categories) {
        if (category.name === targetCategoryName) {
          return category;
        }
        
        if (category.subcategories && category.subcategories.length > 0) {
          const found = searchInCategories(category.subcategories);
          if (found) return found;
        }
      }
      return null;
    };
    
    return searchInCategories(catalog.categories);
  };

  // Helper function to find the full path of a category
  const findCategoryFullPath = (targetCategoryName: string): string => {
    if (!catalog.categories) return targetCategoryName;
    
    const searchInCategories = (categories: Category[], currentPath: string[] = []): string | null => {
      for (const category of categories) {
        const newPath = [...currentPath, category.name];
        
        if (category.name === targetCategoryName) {
          return newPath.join(' > ');
        }
        
        if (category.subcategories && category.subcategories.length > 0) {
          const found = searchInCategories(category.subcategories, newPath);
          if (found) return found;
        }
      }
      return null;
    };
    
    return searchInCategories(catalog.categories) || targetCategoryName;
  };

  // Helper function to get the display path (excluding selected category path)
  const getDisplayPath = (fullPath: string): string => {
    if (!selectedCategory) {
      return fullPath;
    }
    
    // If the full path starts with the selected category, remove that part
    if (fullPath.startsWith(selectedCategory + ' > ')) {
      return fullPath.substring(selectedCategory.length + 3); // +3 for ' > '
    }
    
    // If the full path is exactly the selected category, return just the category name
    if (fullPath === selectedCategory) {
      return fullPath.split(' > ').pop() || fullPath;
    }
    
    return fullPath;
  };

  // Generate color for category separators
  const getCategoryColor = (categoryName: string): string => {
    const colors = [
      'bg-blue-500',
      'bg-green-500', 
      'bg-purple-500',
      'bg-orange-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-yellow-500',
      'bg-red-500',
      'bg-teal-500',
      'bg-cyan-500'
    ];
    
    // Generate a consistent color based on category name
    let hash = 0;
    for (let i = 0; i < categoryName.length; i++) {
      hash = categoryName.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  // Helper to map Tailwind bg-* class to hex color for inline style
  const getCategoryColorHex = (categoryName: string): string => {
    const colorMap: Record<string, string> = {
      'bg-blue-500': '#3b82f6',
      'bg-green-500': '#22c55e',
      'bg-purple-500': '#a855f7',
      'bg-orange-500': '#f97316',
      'bg-pink-500': '#ec4899',
      'bg-indigo-500': '#6366f1',
      'bg-yellow-500': '#eab308',
      'bg-red-500': '#ef4444',
      'bg-teal-500': '#14b8a6',
      'bg-cyan-500': '#06b6d4',
    };
    return colorMap[getCategoryColor(categoryName)] || '#3b82f6';
  };

  // Group products by category with full paths
  const groupProductsByCategory = (products: EnhancedProduct[]): { [categoryName: string]: { products: EnhancedProduct[], fullPath: string, activeCount: number } } => {
    return products.reduce((groups, product) => {
      const category = product.categoryName || 'Unknown';
      const fullPath = findCategoryFullPath(category);
      
      if (!groups[category]) {
        groups[category] = { products: [], fullPath, activeCount: 0 };
      }
      groups[category].products.push(product);
      if (product.isActive) {
        groups[category].activeCount++;
      }
      return groups;
    }, {} as { [categoryName: string]: { products: EnhancedProduct[], fullPath: string, activeCount: number } });
  };

  // Load products when category changes
  useEffect(() => {
    setIsLoading(true);
    // Simulate network delay to show loading state
    setTimeout(() => {
      const allProducts = extractProductsFromCatalog(catalog);
      
      // Use enhanced product data where available
      const productsWithEnhancements = allProducts.map(product => {
        const enhanced = getProductData(product.code);
        return enhanced || product;
      });
      
      // Enhance products with version info and active/inactive status
      const enhancedProducts = enhanceProductsWithVersionInfo(productsWithEnhancements);
      
      // Handle hierarchical category filtering with recursive subcategory inclusion
      let filteredProducts = enhancedProducts;
      
      if (selectedCategory) {
        // Find the selected category in the catalog structure
        const selectedCategoryObj = findCategoryByPath(selectedCategory || '');
        
        if (selectedCategoryObj) {
          // Get all category names that should be included (selected category + all subcategories)
          const includedCategoryNames = getAllSubcategoryNames(selectedCategoryObj);
          
          // Filter products to include only those in the included categories
          filteredProducts = enhancedProducts.filter(product => 
            includedCategoryNames.includes(product.categoryName ?? '')
          );
        } else {
          // Fallback to simple name matching if category structure lookup fails
          const categoryPath = selectedCategory.split(' > ');
          const lastCategory = categoryPath[categoryPath.length - 1];
          filteredProducts = enhancedProducts.filter(product => 
            (product.categoryName ?? '') === lastCategory || selectedCategory.includes(product.categoryName ?? '')
          );
        }
      }

      // Filter by active/inactive status
      if (!showInactive) {
        filteredProducts = filteredProducts.filter(product => product.isActive);
      }
        
      // Sort the products by hierarchical order (matching category selector)
      const categoryOrderMap = buildCategoryOrderMap();
      const sortedProducts = [...filteredProducts].sort((a, b) => {
        const aCategory = a.categoryName || '';
        const bCategory = b.categoryName || '';
        
        // Get hierarchical order positions
        const aOrder = categoryOrderMap.get(aCategory) ?? 999999;
        const bOrder = categoryOrderMap.get(bCategory) ?? 999999;
        
        // Primary sort by hierarchical order
        const orderComparison = aOrder - bOrder;
        if (orderComparison !== 0) {
          return sortOrder === 'asc' ? orderComparison : -orderComparison;
        }

        // Secondary sort by base code
        const baseCodeComparison = a.baseCode.localeCompare(b.baseCode);
        if (baseCodeComparison !== 0) {
          return sortOrder === 'asc' ? baseCodeComparison : -baseCodeComparison;
        }
        
        // Tertiary sort by version (highest version first)
        const versionComparison = b.version.localeCompare(a.version);
        return versionComparison;
      });
      
      setProducts(sortedProducts);
      setIsLoading(false);
    }, 500); // Small delay to show loading state
  }, [selectedCategory, sortOrder, showInactive, getProductData]);

  // Persist selectedCategory to localStorage
  useEffect(() => {
    localStorage.setItem('adam_selectedCategory', selectedCategory);
  }, [selectedCategory]);

  // Persist openCategories to localStorage
  useEffect(() => {
    localStorage.setItem('adam_openCategories', JSON.stringify(openCategories));
  }, [openCategories]);

  // Persist scroll position
  useEffect(() => {
    const handleScroll = () => {
      localStorage.setItem('adam_productsScroll', String(window.scrollY));
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Restore scroll position on mount
  useEffect(() => {
    if (!scrollRestored.current) {
      const scrollY = localStorage.getItem('adam_productsScroll');
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY, 10));
      }
      scrollRestored.current = true;
    }
  }, []);

  const handleValidateContent = async (product: EnhancedProduct, fieldName: string) => {
    const validationKey = `${product.id ?? product.code}-${fieldName}`;
    setIsValidating(prev => ({ ...prev, [validationKey]: true }));
    
    try {
      const result = await validateContent(product, fieldName, fields, language);
      setValidationResults(prev => ({
        ...prev,
        [(product.id ?? product.code) as string]: {
          ...prev[(product.id ?? product.code) as string],
          [fieldName]: result
        }
      }));
    } finally {
      setIsValidating(prev => ({ ...prev, [validationKey]: false }));
    }
  };

  const handleEnhanceField = (product: EnhancedProduct, fieldNames: string[]) => {
    // Create a copy of the product with the correct field names
    const productWithCorrectFields: Product = {
      ...product,
      name: product.assortmentProductName || product.name,
      description: product.description
    };
    setEnhanceField({ product: productWithCorrectFields, fields: fieldNames, key: Date.now() });
  };

  // In handleAcceptEnhancement, updateEnhancedProduct signature is now (productId, updatedProduct, originalProduct, userId, userName, changedFields)
  const handleAcceptEnhancement = (enhancedProduct: Product) => {
    // Find the original product to get the before values
    const originalProduct = products.find(p => p.id === enhancedProduct.id || p.code === enhancedProduct.code);
    if (!originalProduct) return;
    const updatedProduct = { ...enhancedProduct };
    if (user && enhanceField) {
      const changedFields = enhanceField?.fields || [];
      updateEnhancedProduct(
        updatedProduct.code, 
        updatedProduct, 
        originalProduct,
        user.id, 
        user.name,
        changedFields
      );
      setProducts(prevProducts => 
        prevProducts.map(p => 
          p.code === updatedProduct.code ? { ...p, ...updatedProduct } : p
        )
      );
      const enhanced = products.find(p => p.code === updatedProduct.code) || { ...originalProduct, ...updatedProduct };
      changedFields.forEach(fieldName => handleValidateContent(enhanced, fieldName));
    }
    setEnhanceField(null);
  };

  const handleClearValidation = (productId: string, fieldName: string) => {
    setValidationResults(prev => {
      const productResults = { ...prev[productId] };
      if (productResults && fieldName in productResults) {
        delete productResults[fieldName];
      }
      return {
        ...prev,
        [productId]: productResults
      };
    });
  };

  // Helper to toggle accordion state for a category
  const toggleCategory = (categoryName: string) => {
    setOpenCategories((prev) => ({
      ...prev,
      [categoryName]: !prev[categoryName],
    }));
  };

  // Group products by category for display and sort categories by hierarchical order
  const productGroups = groupProductsByCategory(products);
  const categoryOrderMap = buildCategoryOrderMap();
  
  // Sort category names by their hierarchical position
  const categoryNames = Object.keys(productGroups).sort((a, b) => {
    const aOrder = categoryOrderMap.get(a) ?? 999999;
    const bOrder = categoryOrderMap.get(b) ?? 999999;
    const orderComparison = aOrder - bOrder;
    return sortOrder === 'asc' ? orderComparison : -orderComparison;
  });
  
  const shouldShowSeparators = categoryNames.length > 1 && selectedCategory;
  const selectedCategoryName = selectedCategory.split(' > ').pop();

  // Calculate total counts
  const totalActiveProducts = products.filter(p => p.isActive).length;
  const totalProducts = products.length;
  const enhancementStats = getEnhancementStats();

  // Before rendering AIEnhanceModal
  const latestProduct = enhanceField
    ? products.find(p => p.code === enhanceField.product.code) || enhanceField.product
    : undefined;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Products</h2>
          <div className="mt-1 text-sm text-gray-500">
            {showInactive 
              ? `Showing ${totalProducts} products (${totalActiveProducts} active, ${totalProducts - totalActiveProducts} inactive)`
              : `Showing ${totalActiveProducts} active products`
            }
            {enhancementStats.enhancedProducts > 0 && (
              <span className="ml-2 text-blue-600 font-medium">
                • {enhancementStats.enhancedProducts} enhanced ({enhancementStats.enhancementPercentage}%)
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap justify-end items-center gap-2 w-auto">
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
          </div>
          <CategoryTreeSelector
            catalog={catalog}
            selectedCategory={selectedCategory}
            onCategoryChange={(cat) => {
              setSelectedCategory(cat);
              // Optionally, reset scroll or openCategories here if desired
            }}
            className="h-10 text-sm"
          />
          <button
            onClick={() => setSortOrder(order => order === 'asc' ? 'desc' : 'asc')}
            className="inline-flex items-center h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Sort {sortOrder === 'asc' ? '↓' : '↑'}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <span className="ml-3 text-gray-700">Loading products...</span>
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <Package size={48} className="text-gray-300" />
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {!selectedCategory ? 'No category selected' : `No ${showInactive ? '' : 'active '}products in ${selectedCategory.split(' > ').pop()}`}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {!selectedCategory ? 'Please select a category to view products.' : 'Please select a different category or toggle inactive products.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {categoryNames.map((categoryName, index) => {
            const displayPath = getDisplayPath(productGroups[categoryName].fullPath || '');
            const isOpen = !!openCategories[categoryName];
            return (
              <div key={categoryName} className="mb-8 shadow-sm bg-white" style={{ borderLeft: `4px solid ${getCategoryColorHex(categoryName)}` }}>
                <div className="flex flex-col">
                  <div className="flex-1">
                    {/* Accordion Header */}
                    <button
                      type="button"
                      onClick={() => toggleCategory(categoryName)}
                      className={"flex items-center w-full px-8 py-5 text-lg font-semibold focus:outline-none transition-colors duration-150 bg-white"}
                      aria-expanded={isOpen}
                      aria-controls={`category-panel-${index}`}
                    >
                      <span className="mr-4 text-xl transform transition-transform duration-200 text-gray-400" style={{ display: 'inline-block', rotate: isOpen ? '90deg' : '0deg' }}>
                        ▶
                      </span>
                      <span className="flex-1 text-left" style={{ color: getCategoryColorHex(categoryName) }}>{displayPath}</span>
                      <span className="ml-4 text-sm text-gray-500 px-3 py-1">
                        {showInactive 
                          ? `${productGroups[categoryName].products.length} products (${productGroups[categoryName].activeCount} active)`
                          : `${productGroups[categoryName].activeCount} active products`
                        }
                      </span>
                    </button>
                    {/* Accordion Panel */}
                    {isOpen && (
                      <div
                        id={`category-panel-${index}`}
                        className="animate-fade-in bg-white px-8 py-6"
                        style={{ animation: 'fadeIn 0.2s' }}
                      >
                        <div className="space-y-6">
                          {productGroups[categoryName].products.map((product) => (
                            <div className="border border-gray-200 shadow-sm rounded-md" key={product.id ?? product.code}>
                              <ProductCard
                                product={product}
                                isValidating={isValidating}
                                validationResults={validationResults[(product.id ?? product.code) as string] || {}}
                                onValidate={(fieldName) => handleValidateContent(product, fieldName)}
                                onEnhance={(fieldName) => handleEnhanceField(product, [fieldName])}
                                onEnhanceAll={handleEnhanceField}
                                onClearValidation={(fieldName) => handleClearValidation((product.id !== undefined ? String(product.id) : product.code), fieldName)}
                                canEnhance={canEnhance}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      <AIEnhanceModal
        isOpen={enhanceField !== null}
        onClose={() => setEnhanceField(null)}
        product={latestProduct!}
        fieldNames={enhanceField?.fields!}
        language={language}
        key={enhanceField?.key}
        onAccept={handleAcceptEnhancement}
      />
    </div>
  );
};

export default ProductsPage;