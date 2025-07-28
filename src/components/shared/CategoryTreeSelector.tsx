import React, { useState, useEffect, useMemo } from 'react';
import { ChevronDown, ChevronRight, Search, X } from 'lucide-react';
import { CatalogVersionWsDTO, Category } from '../../types';

interface CategoryNode {
  name: string;
  code: string;
  fullPath: string;
  level: number;
  children: CategoryNode[];
  hasProducts: boolean;
  productCount: number;
  activeProductCount: number;
}

interface CategoryTreeSelectorProps {
  catalog: CatalogVersionWsDTO;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  className?: string;
}

const CategoryTreeSelector: React.FC<CategoryTreeSelectorProps> = ({
  catalog,
  selectedCategory,
  onCategoryChange,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Build the category tree from catalog data with active product counts
  const categoryTree = useMemo(() => {
    const buildTree = (categories: Category[], level = 0, parentPath = ''): CategoryNode[] => {
      return categories.map(category => {
        const fullPath = parentPath ? `${parentPath} > ${category.name}` : category.name;
        const productCount = category.products?.length || 0;
        
        // Calculate active product count based on version logic
        const activeProductCount = category.products ? category.products.filter(product => {
          // Group products by assortmentProductCode and find highest version
          const relatedProducts = category.products.filter(p => 
            p.assortmentProductCode === product.assortmentProductCode
          );
          
          if (relatedProducts.length === 1) return true;
          
          // Find the highest version in this group
          const versions = relatedProducts.map(p => ({
            product: p,
            version: parseInt(p.code.slice(-2), 10)
          }));
          
          const maxVersion = Math.max(...versions.map(v => v.version));
          return parseInt(product.code.slice(-2), 10) === maxVersion;
        }).length : 0;
        
        // Recursively build children
        const children = category.subcategories ? buildTree(category.subcategories, level + 1, fullPath) : [];
        
        // Calculate total counts including subcategories
        const totalProductCount = productCount + children.reduce((sum, child) => sum + child.productCount, 0);
        const totalActiveProductCount = activeProductCount + children.reduce((sum, child) => sum + child.activeProductCount, 0);
        
        return {
          name: category.name,
          code: category.code,
          fullPath,
          level,
          children,
          hasProducts: productCount > 0,
          productCount: totalProductCount,
          activeProductCount: totalActiveProductCount
        };
      });
    };

    // Just return the categories without the "All" option
    if (catalog.categories) {
      return buildTree(catalog.categories);
    }
    
    return [];
  }, [catalog]);

  // Filter tree based on search term
  const filteredTree = useMemo(() => {
    if (!searchTerm) return categoryTree;

    const filterNode = (node: CategoryNode): CategoryNode | null => {
      const matchesSearch = node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           node.fullPath.toLowerCase().includes(searchTerm.toLowerCase());
      
      const filteredChildren = node.children
        .map(child => filterNode(child))
        .filter(Boolean) as CategoryNode[];

      if (matchesSearch || filteredChildren.length > 0) {
        return {
          ...node,
          children: filteredChildren
        };
      }

      return null;
    };

    return categoryTree
      .map(node => filterNode(node))
      .filter(Boolean) as CategoryNode[];
  }, [categoryTree, searchTerm]);

  // Auto-expand nodes when searching
  useEffect(() => {
    if (searchTerm) {
      const expandAll = (nodes: CategoryNode[]) => {
        const newExpanded = new Set(expandedNodes);
        nodes.forEach(node => {
          newExpanded.add(node.code);
          if (node.children.length > 0) {
            expandAll(node.children);
          }
        });
        setExpandedNodes(newExpanded);
      };
      expandAll(filteredTree);
    }
  }, [searchTerm, filteredTree]);

  // Set default category to first category if no category is selected
  useEffect(() => {
    if (!selectedCategory && categoryTree.length > 0) {
      onCategoryChange(categoryTree[0].fullPath);
    }
  }, [categoryTree, selectedCategory, onCategoryChange]);

  const toggleExpanded = (code: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(code)) {
      newExpanded.delete(code);
    } else {
      newExpanded.add(code);
    }
    setExpandedNodes(newExpanded);
  };

  const handleCategorySelect = (fullPath: string) => {
    onCategoryChange(fullPath);
    setIsOpen(false);
    setSearchTerm('');
  };

  const renderTreeNode = (node: CategoryNode) => {
    const isExpanded = expandedNodes.has(node.code);
    const isSelected = selectedCategory === node.fullPath;
    const hasChildren = node.children.length > 0;

    return (
      <div key={node.code} className="select-none">
        <div
          className={`flex items-center py-1 px-2 hover:bg-blue-50 cursor-pointer rounded transition-colors duration-150 ${
            isSelected ? 'bg-blue-100 text-blue-800 font-medium' : 'text-gray-700'
          }`}
          style={{ paddingLeft: `${node.level * 16 + 8}px` }}
          onClick={() => handleCategorySelect(node.fullPath)}
        >
          <div className="flex items-center flex-1 min-w-0">
            {hasChildren ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpanded(node.code);
                }}
                className="mr-1 p-0.5 hover:bg-blue-200 rounded transition-colors duration-150"
              >
                {isExpanded ? (
                  <ChevronDown size={14} className="text-gray-500" />
                ) : (
                  <ChevronRight size={14} className="text-gray-500" />
                )}
              </button>
            ) : (
              <div className="w-5 mr-1" />
            )}
            
            <span className="truncate flex-1">{node.name}</span>
            
            {node.activeProductCount > 0 && (
              <span className="ml-2 text-xs bg-green-200 text-green-700 px-1.5 py-0.5 rounded-full font-medium">
                {node.activeProductCount}
              </span>
            )}
            {node.productCount > node.activeProductCount && (
              <span className="ml-1 text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">
                {node.productCount - node.activeProductCount}
              </span>
            )}
          </div>
        </div>
        
        {hasChildren && isExpanded && (
          <div>
            {node.children.map(child => renderTreeNode(child))}
          </div>
        )}
      </div>
    );
  };

  const getDisplayValue = () => {
    if (!selectedCategory) return 'Select Category';
    return selectedCategory.length > 50 ? `${selectedCategory.substring(0, 50)}...` : selectedCategory;
  };

  return (
    <div className={`relative inline-block min-w-0 w-[48rem] text-left ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-[48rem] min-w-0 px-3 py-2 text-left bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-150"
      >
        <span className="block truncate text-sm">{getDisplayValue()}</span>
        <ChevronDown 
          size={16} 
          className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => {
              setIsOpen(false);
              setSearchTerm('');
            }}
          />
          
          {/* Dropdown */}
          <div className="absolute z-20 w-[48rem] min-w-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-96 overflow-hidden">
            {/* Search Header */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search categories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-8 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  onClick={(e) => e.stopPropagation()}
                />
                {searchTerm && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSearchTerm('');
                    }}
                    className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              <div className="mt-2 text-xs text-gray-500 flex items-center gap-4">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-200 rounded-full mr-1"></div>
                  <span>Active products</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-gray-200 rounded-full mr-1"></div>
                  <span>Inactive products</span>
                </div>
              </div>
            </div>

            {/* Tree View */}
            <div className="max-h-80 overflow-y-auto p-2">
              {filteredTree.length > 0 ? (
                filteredTree.map(node => renderTreeNode(node))
              ) : (
                <div className="px-3 py-4 text-sm text-gray-500 text-center">
                  No categories found matching "{searchTerm}"
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CategoryTreeSelector;