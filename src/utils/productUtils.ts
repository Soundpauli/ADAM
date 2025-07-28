import { CatalogVersionWsDTO, Product, Category } from '../types';

/**
 * Flattens the category hierarchy and extracts products
 * @param catalog The catalog version data
 * @returns An array of products with category information
 */
export function extractProductsFromCatalog(catalog: CatalogVersionWsDTO): Product[] {
  const products: Product[] = [];
  
  // Process each category and its subcategories recursively
  const processCategory = (category: Category, parentName?: string) => {
    // Process current category's products
    if (category.products && category.products.length > 0) {
      category.products.forEach(product => {
        // Add category information to the product for easier access
        products.push({
          ...product,
          id: product.code, // Use code as ID for compatibility
          categoryName: category.name,
          subCategory: parentName || '',
          // Map legacy format B2C descriptions for compatibility
          'B2C-description-long': product.description || '',
          'B2C-description-short': product.assortmentProductDescription || ''
        });
      });
    }
    
    // Process subcategories recursively
    if (category.subcategories && category.subcategories.length > 0) {
      category.subcategories.forEach(subCategory => {
        processCategory(subCategory, category.name);
      });
    }
  };
  
  // Process all top-level categories
  if (catalog.categories && catalog.categories.length > 0) {
    catalog.categories.forEach(category => {
      processCategory(category);
    });
  }
  
  return products;
}

/**
 * Extracts all unique category names from the catalog
 * @param catalog The catalog version data
 * @returns An array of unique category names
 */
export function extractCategoryNames(catalog: CatalogVersionWsDTO): string[] {
  const categories = new Set<string>();
  
  const processCategory = (category: Category) => {
    categories.add(category.name);
    
    if (category.subcategories && category.subcategories.length > 0) {
      category.subcategories.forEach(subCategory => {
        processCategory(subCategory);
      });
    }
  };
  
  if (catalog.categories && catalog.categories.length > 0) {
    catalog.categories.forEach(category => {
      processCategory(category);
    });
  }
  
  return Array.from(categories);
}