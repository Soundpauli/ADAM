import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from '../types';
import { useLanguage } from './LanguageContext';
import { extractProductsFromCatalog } from '../utils/productUtils';
import catalogFullData from '../data/catalog_full.json';

interface EnhancedProductContextType {
  enhancedProducts: Record<string, Product>;
  updateEnhancedProduct: (productId: string, updatedProduct: Product, originalProduct: Product, userId: string, userName: string, changedFields: string[]) => void;
  getProductData: (productId: string) => Product | null;
  exportEnhancedCatalog: () => void;
  getEnhancementStats: () => {
    totalProducts: number;
    enhancedProducts: number;
    enhancementPercentage: number;
  };
  resetEnhancements: () => void;
  addToGoldstandard: (fieldName: string, content: string, productCategory: string, productCode: string) => void;
}

const EnhancedProductContext = createContext<EnhancedProductContextType | undefined>(undefined);

export const useEnhancedProducts = () => {
  const context = useContext(EnhancedProductContext);
  if (context === undefined) {
    throw new Error('useEnhancedProducts must be used within an EnhancedProductProvider');
  }
  return context;
};

export const EnhancedProductProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [enhancedProducts, setEnhancedProducts] = useState<Record<string, Product>>({});
  const { language } = useLanguage();

  // Load enhanced products from localStorage on initialization
  useEffect(() => {
    const storedEnhancedProducts = localStorage.getItem('enhancedProducts');
    if (storedEnhancedProducts) {
      try {
        setEnhancedProducts(JSON.parse(storedEnhancedProducts));
      } catch (error) {
        console.error('Error loading enhanced products:', error);
      }
    }
  }, []);

  const updateEnhancedProduct = (
    productId: string, 
    updatedProduct: Product, 
    originalProduct: Product,
    userId: string, 
    userName: string, 
    changedFields: string[]
  ) => {
    // Update enhanced products
    const newEnhancedProducts = {
      ...enhancedProducts,
      [productId]: updatedProduct
    };
    setEnhancedProducts(newEnhancedProducts);
    localStorage.setItem('enhancedProducts', JSON.stringify(newEnhancedProducts));

    // Automatically add enhanced content to goldstandard examples
    const productCategory = originalProduct.categoryName || 'Unknown';
    changedFields.forEach(fieldName => {
      const enhancedContent = updatedProduct[fieldName as keyof Product] as string;
      if (enhancedContent && enhancedContent.trim()) {
        addToGoldstandard(fieldName, enhancedContent, productCategory, productId, language);
      }
    });
  };

  const addToGoldstandard = (fieldName: string, content: string, productCategory: string, productCode: string, contentLanguage?: string) => {
    try {
      const existingExamples = JSON.parse(localStorage.getItem('goldstandardExamples') || '[]');
      
      // Check if this exact content already exists for this field
      const isDuplicate = existingExamples.some((example: any) => 
        example.fieldName === fieldName && 
        example.content === content &&
        example.language === (contentLanguage || language)
      );
      
      if (!isDuplicate) {
        const newExample = {
          id: `auto_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          content,
          fieldName,
          categories: [productCategory],
          products: [productCode],
          createdAt: new Date().toISOString(),
          language: contentLanguage || language,
          source: 'auto_enhancement' // Mark as automatically generated
        };
        
        const updatedExamples = [newExample, ...existingExamples];
        localStorage.setItem('goldstandardExamples', JSON.stringify(updatedExamples));
        
        console.log(`Auto-added goldstandard example for field "${fieldName}" from product "${productCode}" in language "${contentLanguage || language}"`);
      }
    } catch (error) {
      console.error('Error adding to goldstandard examples:', error);
    }
  };

  const getProductData = (productId: string): Product | null => {
    // Return enhanced version if available, otherwise original
    if (enhancedProducts[productId]) {
      return enhancedProducts[productId];
    }
    
    // Fall back to original catalog data
    const originalProducts = extractProductsFromCatalog(catalogFullData as any);
    return originalProducts.find(p => p.code === productId) || null;
  };

  const exportEnhancedCatalog = () => {
    const originalProducts = extractProductsFromCatalog(catalogFullData as any);
    
    // Create enhanced catalog with all enhancements applied
    const enhancedCatalog = {
      ...catalogFullData,
      exportMetadata: {
        exportDate: new Date().toISOString(),
        exportType: 'enhanced_catalog',
        enhancementStats: getEnhancementStats(),
        totalEnhancements: Object.keys(enhancedProducts).length // Count of enhanced products
      },
      products: originalProducts.map(product => {
        const enhanced = enhancedProducts[product.code];
        return enhanced || product;
      })
    };

    // Download as JSON
    const dataStr = JSON.stringify(enhancedCatalog, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `enhanced_catalog_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getEnhancementStats = () => {
    const originalProducts = extractProductsFromCatalog(catalogFullData as any);
    const totalProducts = originalProducts.length;
    const enhancedProductsCount = Object.keys(enhancedProducts).length;
    const enhancementPercentage = totalProducts > 0 ? Math.round((enhancedProductsCount / totalProducts) * 100) : 0;

    return {
      totalProducts,
      enhancedProducts: enhancedProductsCount,
      enhancementPercentage
    };
  };

  const resetEnhancements = () => {
    setEnhancedProducts({});
    localStorage.removeItem('enhancedProducts');
    localStorage.removeItem('enhancementHistory'); // Clean up old key
  };

  return (
    <EnhancedProductContext.Provider 
      value={{
        enhancedProducts,
        updateEnhancedProduct,
        getProductData,
        exportEnhancedCatalog,
        getEnhancementStats,
        resetEnhancements,
        addToGoldstandard
      }}
    >
      {children}
    </EnhancedProductContext.Provider>
  );
};