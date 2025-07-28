import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Field } from '../types';

interface FieldContextType {
  fields: Field[];
  addField: (fieldData: Omit<Field, 'id'>) => void;
  importFields: (fieldsData: Omit<Field, 'id'>[]) => void;
  updateField: (id: string, fieldData: Partial<Field>) => void;
  deleteField: (id: string) => void;
  copyField: (id: string) => void;
  validateFieldAgainstData: (fieldId: string, data: Record<string, unknown>) => Promise<boolean>;
}

const FieldContext = createContext<FieldContextType | undefined>(undefined);

export const useFields = () => {
  const context = useContext(FieldContext);
  if (context === undefined) {
    throw new Error('useFields must be used within a FieldProvider');
  }
  return context;
};

export const FieldProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [fields, setFields] = useState<Field[]>([]);

  useEffect(() => {
    // Load fields from localStorage
    const storedFields = localStorage.getItem('fields');
    if (storedFields) {
      setFields(JSON.parse(storedFields));
    } else {
      // Initialize with sample fields if none exist
      const sampleFields: Field[] = [
        {
          id: uuidv4(),
          name: 'assortmentProductName',
          fieldType: 'text',
          applicableTo: 'base',
          isActive: true,
          isMandatory: true,
          general: {
            requirements: '',
            format: '',
            skipLanguageDetection: false
          },
          languages: {
            EN: {
              requirements: 'Product name following HARTMANN naming conventions',
              format: 'Title Case with registered trademark symbols where applicable',
              whitelist: '',
              blacklist: '',
              positiveExamples: '',
              negativeExamples: ''
            },
            DE: {
              requirements: 'Produktname gemäß HARTMANN-Namenskonventionen',
              format: 'Titel-Schreibweise mit Warenzeichen-Symbolen, wo anwendbar',
              whitelist: '',
              blacklist: '',
              positiveExamples: '',
              negativeExamples: ''
            },
            FR: {
              requirements: 'Nom du produit selon les conventions de dénomination HARTMANN',
              format: 'Majuscules avec symboles de marque déposée le cas échéant',
              whitelist: '',
              blacklist: '',
              positiveExamples: '',
              negativeExamples: ''
            }
          },
          productCategories: [],
          contextFields: []
        },
        {
          id: uuidv4(),
          name: 'assortmentProductDescription',
          fieldType: 'text',
          applicableTo: 'base',
          isActive: true,
          isMandatory: true,
          languages: {
            EN: {
              requirements: 'Short product description highlighting key features',
              format: 'Short paragraph, concise language',
              whitelist: '',
              blacklist: '',
              positiveExamples: '',
              negativeExamples: ''
            },
            DE: {
              requirements: 'Kurze Produktbeschreibung mit wichtigsten Merkmalen',
              format: 'Kurzer Absatz, präzise Sprache',
              whitelist: '',
              blacklist: '',
              positiveExamples: '',
              negativeExamples: ''
            },
            FR: {
              requirements: 'Brève description du produit soulignant les caractéristiques principales',
              format: 'Paragraphe court, langage concis',
              whitelist: '',
              blacklist: '',
              positiveExamples: '',
              negativeExamples: ''
            }
          },
          productCategories: [],
          contextFields: ['assortmentProductName', 'assortmentProductClaim']
        },
        {
          id: uuidv4(),
          name: 'assortmentProductContent',
          fieldType: 'html',
          applicableTo: 'base',
          isActive: true,
          languages: {
            EN: {
              requirements: 'Detailed HTML list of product features and benefits',
              format: '<ul> with <li> items, each starting with a dash',
              whitelist: '',
              blacklist: '',
              positiveExamples: '',
              negativeExamples: ''
            },
            DE: {
              requirements: 'Detaillierte HTML-Liste der Produktmerkmale und -vorteile',
              format: '<ul> mit <li> Einträgen, jeweils beginnend mit einem Bindestrich',
              whitelist: '',
              blacklist: '',
              positiveExamples: '',
              negativeExamples: ''
            },
            FR: {
              requirements: 'Liste HTML détaillée des caractéristiques et avantages du produit',
              format: '<ul> avec des éléments <li>, chacun commençant par un tiret',
              whitelist: '',
              blacklist: '',
              positiveExamples: '',
              negativeExamples: ''
            }
          },
          productCategories: [],
          contextFields: ['assortmentProductName', 'assortmentProductDescription', 'assortmentProductApplication']
        },
        {
          id: uuidv4(),
          name: 'assortmentProductClaim',
          fieldType: 'text',
          applicableTo: 'base',
          isActive: true,
          languages: {
            EN: {
              requirements: 'Main product claim highlighting unique selling proposition',
              format: 'Single sentence with key benefit',
              whitelist: '',
              blacklist: '',
              positiveExamples: '',
              negativeExamples: ''
            },
            DE: {
              requirements: 'Hauptproduktaussage, die die einzigartige Verkaufsposition hervorhebt',
              format: 'Ein einzelner Satz mit dem Hauptvorteil',
              whitelist: '',
              blacklist: '',
              positiveExamples: '',
              negativeExamples: ''
            },
            FR: {
              requirements: 'Principale revendication du produit mettant en évidence la proposition de vente unique',
              format: 'Une seule phrase avec l\'avantage principal',
              whitelist: '',
              blacklist: '',
              positiveExamples: '',
              negativeExamples: ''
            }
          },
          productCategories: [],
          contextFields: ['assortmentProductName', 'assortmentProductApplication']
        },
        {
          id: uuidv4(),
          name: 'assortmentProductApplication',
          fieldType: 'text',
          applicableTo: 'base',
          isActive: true,
          languages: {
            EN: {
              requirements: 'Detailed application instructions and use cases',
              format: 'Paragraph format with clear steps',
              whitelist: '',
              blacklist: '',
              positiveExamples: '',
              negativeExamples: ''
            },
            DE: {
              requirements: 'Detaillierte Anwendungshinweise und Anwendungsfälle',
              format: 'Absatzformat mit klaren Schritten',
              whitelist: '',
              blacklist: '',
              positiveExamples: '',
              negativeExamples: ''
            },
            FR: {
              requirements: 'Instructions d\'application détaillées et cas d\'utilisation',
              format: 'Format de paragraphe avec des étapes claires',
              whitelist: '',
              blacklist: '',
              positiveExamples: '',
              negativeExamples: ''
            }
          },
          productCategories: [],
          contextFields: ['assortmentProductName', 'assortmentProductClaim']
        },
        {
          id: uuidv4(),
          name: 'description',
          fieldType: 'text',
          applicableTo: 'base',
          isActive: true,
          languages: {
            EN: {
              requirements: 'Detailed marketing description for B2C channels',
              format: 'Paragraph format with consumer benefits',
              whitelist: '',
              blacklist: '',
              positiveExamples: '',
              negativeExamples: ''
            },
            DE: {
              requirements: 'Ausführliche Marketingbeschreibung für B2C-Kanäle',
              format: 'Absatzformat mit Verbrauchervorteilen',
              whitelist: '',
              blacklist: '',
              positiveExamples: '',
              negativeExamples: ''
            },
            FR: {
              requirements: 'Description marketing détaillée pour les canaux B2C',
              format: 'Format de paragraphe avec avantages pour le consommateur',
              whitelist: '',
              blacklist: '',
              positiveExamples: '',
              negativeExamples: ''
            }
          },
          productCategories: [],
          contextFields: ['assortmentProductName', 'assortmentProductDescription', 'assortmentProductClaim']
        },
      ];
      
      setFields(sampleFields);
      localStorage.setItem('fields', JSON.stringify(sampleFields));
    }
  }, []);

  const addField = (fieldData: Omit<Field, 'id'>) => {
    // Check for unique name + product categories combination
    const isDuplicate = fields.some(field => {
      if (field.name.toLowerCase() !== fieldData.name.toLowerCase()) {
        return false;
      }
      
      // If either field has no categories, they can coexist
      if (field.productCategories.length === 0 || fieldData.productCategories.length === 0) {
        return false;
      }
      
      // Check for any overlap in product categories
      return field.productCategories.some(category => 
        fieldData.productCategories.includes(category)
      );
    });
    
    if (isDuplicate) {
      alert('A field with this name already exists for one or more of the selected product categories');
      return;
    }
    
    const newField: Field = {
      ...fieldData,
      id: uuidv4(),
      isActive: fieldData.isActive !== undefined ? fieldData.isActive : true, // Default to active
      contextFields: fieldData.contextFields || [] // Ensure contextFields is always an array
    };
    
    const updatedFields = [...fields, newField];
    setFields(updatedFields);
    localStorage.setItem('fields', JSON.stringify(updatedFields));
  };

  const importFields = (fieldsData: Omit<Field, 'id'>[]) => {
    const newFields = fieldsData.map(fieldData => ({
      ...fieldData,
      id: uuidv4(),
      contextFields: fieldData.contextFields || [], // Ensure contextFields is always an array
      useClaimList: fieldData.useClaimList || false // Ensure useClaimList has a default value
    }));
    
    setFields(newFields);
    localStorage.setItem('fields', JSON.stringify(newFields));
  };

  const updateField = (id: string, fieldData: Partial<Field>) => {
    // Check for unique name + product categories combination if either is being updated
    if (fieldData.name || fieldData.productCategories) {
      const currentField = fields.find(f => f.id === id);
      if (!currentField) return;
      
      const updatedField = {
        ...currentField,
        ...fieldData
      };
      
      const isDuplicate = fields.some(field => {
        if (field.id === id) return false;
        if (field.name.toLowerCase() !== updatedField.name.toLowerCase()) return false;
        
        // If either field has no categories, they can coexist
        if (field.productCategories.length === 0 || updatedField.productCategories.length === 0) {
          return false;
        }
        
        // Check for any overlap in product categories
        return field.productCategories.some(category => 
          updatedField.productCategories.includes(category)
        );
      });
      
      if (isDuplicate) {
        alert('A field with this name already exists for one or more of the selected product categories');
        return;
      }
    }
    
    const updatedFields = fields.map(field => 
      field.id === id ? { 
        ...field, 
        ...fieldData,
        contextFields: fieldData.contextFields !== undefined ? fieldData.contextFields : field.contextFields || [],
        useClaimList: fieldData.useClaimList !== undefined ? fieldData.useClaimList : field.useClaimList || false
      } : field
    );
    
    setFields(updatedFields);
    localStorage.setItem('fields', JSON.stringify(updatedFields));
  };

  const deleteField = (id: string) => {
    const updatedFields = fields.filter(field => field.id !== id);
    setFields(updatedFields);
    localStorage.setItem('fields', JSON.stringify(updatedFields));
  };

  const copyField = (id: string) => {
    const fieldToCopy = fields.find(field => field.id === id);
    if (!fieldToCopy) return;
    
    // Create a copy with a new name
    let copyName = `${fieldToCopy.name} (Copy)`;
    let copyNumber = 1;
    
    // Keep incrementing the copy number until we find a unique name
    while (fields.some(field => field.name === copyName)) {
      copyNumber += 1;
      copyName = `${fieldToCopy.name} (Copy ${copyNumber})`;
    }
    
    const newField: Field = {
      ...fieldToCopy,
      id: uuidv4(),
      name: copyName,
      isActive: false, // Copied fields start as inactive
      contextFields: fieldToCopy.contextFields || [], // Ensure contextFields is copied
      useClaimList: fieldToCopy.useClaimList || false // Ensure useClaimList is copied
    };
    
    const updatedFields = [...fields, newField];
    setFields(updatedFields);
    localStorage.setItem('fields', JSON.stringify(updatedFields));
  };

  const validateFieldAgainstData = async (fieldId: string, data: Record<string, unknown>): Promise<boolean> => {
    // In a real implementation, this would connect to OpenAI/GPT-4
    // For demo purposes, we'll just do basic validation
    const field = fields.find(f => f.id === fieldId);
    if (!field) return false;
    
    // Check if the field exists in the data
    const fieldValue = data[field.name] || data[field.name.replace(/-/g, '')];
    if (!fieldValue) return false;
    
    // Check if field applies to this category
    if (field.productCategories.length > 0) {
      const categoryName = data.categoryName as string;
      if (!field.productCategories.includes(categoryName)) {
        return false;
      }
    }
    
    // Basic validations
    if (!fieldValue) return false;
    
    // Check blacklist
    if (field.languages?.EN?.blacklist) {
      const blacklistTerms = field.languages.EN.blacklist.split(',').map(term => term.trim().toLowerCase());
      for (const term of blacklistTerms) {
        if (term && String(fieldValue).toLowerCase().includes(term)) {
          return false;
        }
      }
    }
    
    // Check whitelist (if specified, at least one term must be present)
    if (field.languages?.EN?.whitelist) {
      const whitelistTerms = field.languages.EN.whitelist.split(',').map(term => term.trim().toLowerCase());
      if (whitelistTerms.length > 0 && !whitelistTerms.some(term => term && String(fieldValue).toLowerCase().includes(term))) {
        return false;
      }
    }
    
    return true;
  };

  return (
    <FieldContext.Provider 
      value={{ 
        fields, 
        addField, 
        importFields,
        updateField, 
        deleteField, 
        copyField,
        validateFieldAgainstData,
      }}
    >
      {children}
    </FieldContext.Provider>
  );
};