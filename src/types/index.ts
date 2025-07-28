export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'manager' | 'editor';
}

export interface Field {
  id: string;
  name: string;
  displayName?: string; // User-facing name for the field
  subField?: string; // Optional subfield for nested validation (e.g., 'productContentType')
  fieldType: 'text' | 'html' | 'media';
  applicableTo: 'base' | 'variant' | 'both';
  isActive: boolean; // Whether the field is currently active
  general?: {
    requirements: string;
    format: string;
    skipLanguageDetection?: boolean; // Skip language validation for this field
  };
  isMandatory?: boolean; // Whether this field is mandatory and should be shown even if missing from product data
  languages: {
    [key: string]: {
      requirements: string;
      format: string;
      whitelist: string;
      blacklist: string;
      positiveExamples: string;
      negativeExamples: string;
    }
  };
  productCategories: string[];
  qualityThreshold?: number;
  mediaValidation?: MediaValidation;
  subFieldFilter?: {
    operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'notEquals';
    value: string;
  };
  contextFields?: string[]; // Other field names to use as context when enhancing this field
  useClaimList?: boolean; // Whether to use claims from the claims list when enhancing this field
}

export interface MediaValidation {
  allowedFileTypes: string[]; // e.g., ['png', 'jpg', 'jpeg', 'webm', 'gif', 'pdf']
  aspectRatio?: string; // e.g., '16:9', '1:1', '4:3', etc.
  allowedAspectRatios?: string[]; // Multiple allowed ratios
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  minFileSize?: number; // in KB
  maxFileSize?: number; // in KB
  requireHttps: boolean;
  mediaCountMin?: number; // Minimum required assets
  mediaCountMax?: number; // Maximum allowed assets
  mediaCountOptimal?: number; // Optimal number of assets
  subFieldFilters?: SubFieldFilter[]; // Rules for specific subfield values
}

interface SubFieldFilter {
  id: string;
  name: string; // Human-readable name for the filter
  subField: string; // The subfield to check (e.g., 'productContentType')
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'notEquals';
  value: string; // The value to match against
  validation: {
    allowedFileTypes?: string[];
    minWidth?: number;
    maxWidth?: number;
    minHeight?: number;
    maxHeight?: number;
    minFileSize?: number;
    maxFileSize?: number;
    requireHttps?: boolean;
    required?: boolean; // Whether this type of asset is required
    minCount?: number; // Minimum count of assets matching this filter
    maxCount?: number; // Maximum count of assets matching this filter
  };
}

export interface CatalogVersionWsDTO {
  type: string; // "catalogVersionWsDTO"
  id: string; // e.g. "Online"
  name: string; // e.g. "GERProductCatalog"
  categories: Category[];
}

export interface Category {
  lastModified: string; // ISO timestamp
  name: string;
  code: string;
  description: string;
  softDelete: boolean;
  media: Media[];
  products: Product[];
  subcategories: Category[]; // Recursive subcategories
}

export interface Media {
  assetId: string | number;
  code: string;
  cssImageSection?: string;
  index?: string | number;
  lastModified: string; // ISO timestamp
  mediaURL: string;
  mime: string;
  productContentType?: string;
  name?: string;
  softDelete: boolean;
}

export interface Product {
  allMediaDeleted: boolean;
  assortmentProductApplication: string;
  assortmentProductClaim: string;
  assortmentProductCode: string;
  assortmentProductContent: string; // HTML string
  assortmentProductDescription: string;
  assortmentProductHierarchySort: string;
  assortmentProductName: string;
  code: string;
  description: string; // HTML string
  dosageForm: string;
  hierarchySort: number | string;
  lastModified: string; // ISO timestamp
  media: Media[];
  name: string;
  softDelete: boolean;
  variantOptions: VariantOption[];
  
  // Additional fields for compatibility with existing code
  id?: string;
  categoryName?: string;
  subCategory?: string;
  'B2C-description-long'?: string;
  'B2C-description-short'?: string;
}

interface VariantOption {
  allMediaDeleted: boolean;
  articleSize: string;
  badges: any[];
  code: string;
  content: string;
  eclassNumber: string;
  eclassProperties: any[];
  forRegisteredUsersOnly: boolean;
  hierarchySort: number;
  lastModified: string;
  media: Media[];
  name: string;
  orderable: boolean;
  orderableUnits: {
    unit: string[];
  };
  packaging: string;
  publicationDate: string;
  regulatoryStatus: string;
  sapReferenceNumber: string;
  softDelete: boolean;
  characteristics: Characteristics;
}

interface Characteristics {
  baseUnit: string;
  itemStatus: string;
  previousProductCode: string;
  himiNumber: string;
  pharmacyCode: string;
  contentQuantity: number;
  division: string;
  purchaseUnit: string;
  batchManagement: boolean;
  totalShelfLife: number;
  category: string;
  marketing: string;
  createdOn: string; // ISO timestamp
  referenceNumber: string;
  units: Unit[];
}

interface Unit {
  unit: string; // e.g. "CS", "PK", "PL"
  gtin: string;
  pzn: string;
  numerator: number;
  denominator: number;
  isOrderable: boolean;
  volume: Volume;
  dimension: Dimension;
  weight: Weight;
}

interface Volume {
  volume: number;
  unitOfVolume: string; // e.g. "DMQ"
}

interface Dimension {
  length: number;
  width: number;
  height: number;
  unitOfDimension: string; // e.g. "MMT"
}

interface Weight {
  gross: number;
  net: number;
  unitOfWeight: string; // e.g. "KGM"
}

interface GoldstandardExample {
  id: string;
  content: string;
  fieldName: string;
  categories: string[];
  products: string[];
  createdAt: string;
  source?: string;
  language: string; // Language code (EN, DE, FR)
}

interface ValidationResultProps {
  result: {
    passed: boolean;
    issues: string[];
    quality?: { rating: number; remarks: string } | null;
    validationCriteria?: string[];
    validationPrompt?: string;
  };
  onClear: () => void;
}