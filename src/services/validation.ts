import OpenAI from 'openai';
import { Product, Field, Media } from '../types';
import prompts from '../data/prompts.json';
import { requestLogger } from './requestLogger';
import { analyzeMediaAsset, validateDimensions, validateFileSize, validateAspectRatio } from '../utils/mediaAnalysis';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

const matchesSubFieldFilter = (data: any, subField: string, filter: { operator: string; value: string }): boolean => {
  // Get the field value, handling different data types
  const rawValue = data[subField];
  
  // If the field doesn't exist, return false
  if (rawValue === undefined || rawValue === null) {
    return false;
  }
  
  // Convert to string for comparison
  const fieldValue = String(rawValue);
  
  // Empty string should be treated as non-existent for most operators
  if (!fieldValue) return false;
  
  switch (filter.operator) {
    case 'equals':
      return fieldValue === filter.value;
    case 'contains':
      return fieldValue.includes(filter.value);
    case 'startsWith':
      return fieldValue.startsWith(filter.value);
    case 'endsWith':
      return fieldValue.endsWith(filter.value);
    case 'notEquals':
      return fieldValue !== filter.value;
    default:
      return false;
  }
};

const buildValidationCriteria = (field: Field, language: string): string[] => {
  const criteria: string[] = [];
  const languageConfig = field.languages?.[language] || field.languages?.['EN'] || {};
  const requirements = languageConfig.requirements || field.general?.requirements || '';
  const format = languageConfig.format || field.general?.format || '';
  
  if (requirements) {
    criteria.push(`Requirements: ${requirements}`);
  }
  if (format) {
    criteria.push(`Format: ${format}`);
  }
  if (languageConfig.whitelist) {
    criteria.push(`Must include terms: ${languageConfig.whitelist}`);
  }
  if (languageConfig.blacklist) {
    criteria.push(`Must not include terms: ${languageConfig.blacklist}`);
  }
  criteria.push(`Language: ${language}`);
  
  return criteria;
};

const buildMediaValidationCriteria = (field: Field): string[] => {
  const criteria: string[] = [];
  const mediaValidation = field.mediaValidation;
  
  if (!mediaValidation) {
    criteria.push('No specific media validation rules defined');
    return criteria;
  }
  
  if (mediaValidation.requireHttps) {
    criteria.push('HTTPS URLs required');
  }
  
  if (mediaValidation.allowedFileTypes?.length > 0) {
    criteria.push(`Allowed file types: ${mediaValidation.allowedFileTypes.join(', ')}`);
  }
  
  if (mediaValidation.aspectRatio) {
    criteria.push(`Required aspect ratio: ${mediaValidation.aspectRatio}`);
  }
  
  if (mediaValidation.allowedAspectRatios?.length > 0) {
    criteria.push(`Allowed aspect ratios: ${mediaValidation.allowedAspectRatios.join(', ')}`);
  }
  
  if (mediaValidation.minWidth || mediaValidation.maxWidth) {
    const widthRange = [
      mediaValidation.minWidth ? `min: ${mediaValidation.minWidth}px` : null,
      mediaValidation.maxWidth ? `max: ${mediaValidation.maxWidth}px` : null
    ].filter(Boolean).join(', ');
    criteria.push(`Width constraints: ${widthRange}`);
  }
  
  if (mediaValidation.minHeight || mediaValidation.maxHeight) {
    const heightRange = [
      mediaValidation.minHeight ? `min: ${mediaValidation.minHeight}px` : null,
      mediaValidation.maxHeight ? `max: ${mediaValidation.maxHeight}px` : null
    ].filter(Boolean).join(', ');
    criteria.push(`Height constraints: ${heightRange}`);
  }
  
  if (mediaValidation.minFileSize || mediaValidation.maxFileSize) {
    const sizeRange = [
      mediaValidation.minFileSize ? `min: ${mediaValidation.minFileSize}KB` : null,
      mediaValidation.maxFileSize ? `max: ${mediaValidation.maxFileSize}KB` : null
    ].filter(Boolean).join(', ');
    criteria.push(`File size constraints: ${sizeRange}`);
  }
  
  if (mediaValidation.mediaCountMin || mediaValidation.mediaCountMax || mediaValidation.mediaCountOptimal) {
    const countInfo = [
      mediaValidation.mediaCountMin ? `min: ${mediaValidation.mediaCountMin}` : null,
      mediaValidation.mediaCountMax ? `max: ${mediaValidation.mediaCountMax}` : null,
      mediaValidation.mediaCountOptimal ? `optimal: ${mediaValidation.mediaCountOptimal}` : null
    ].filter(Boolean).join(', ');
    criteria.push(`Asset count requirements: ${countInfo}`);
  }
  
  return criteria;
};

export const validateContent = async (
  product: Product,
  fieldName: string,
  fields: Field[],
  language: string = 'EN',
  user?: { id: string; name: string; email: string; role: string }
): Promise<{ passed: boolean; issues: string[]; quality?: { rating: number; remarks: string }; validationCriteria?: string[]; validationPrompt?: string }> => {
  const startTime = Date.now();
  let logId: string | undefined;
  
  // Log the validation request
  if (user) {
    logId = requestLogger.log({
      user,
      product: {
        id: product.id as string || product.code,
        code: product.code,
        name: product.assortmentProductName || product.name,
        category: product.categoryName || 'Unknown'
      },
      field: fieldName,
      type: 'validation',
      language,
      success: false, // Will update this later
      source: {
        component: 'ProductCard',
        command: 'Validate Field',
        effect: `Validating ${fieldName} content against field requirements`
      }
    });
  }

  // Check if this is a media count validation request
  if (fieldName === 'media-count') {
    const result = validateMediaCount(product, fields);
    
    // Update log with results
    if (user && logId) {
      const duration = Date.now() - startTime;
      requestLogger.log({
        ...requestLogger.getLogs().find(log => log.id === logId)!,
        success: true,
        duration,
        results: {
          validationPassed: result.passed
        }
      });
    }
    
    return result;
  }
  
  // Check if this is an individual media asset validation
  if (fieldName.startsWith('media-')) {
    const assetId = fieldName.replace('media-', '');
    const result = validateMediaAsset(product, assetId, fields);
    
    // Update log with results
    if (user && logId) {
      const duration = Date.now() - startTime;
      requestLogger.log({
        ...requestLogger.getLogs().find(log => log.id === logId)!,
        success: true,
        duration,
        results: {
          validationPassed: result.passed
        }
      });
    }
    
    return result;
  }
  
  // Find all field configurations that match the field name
  const relevantFields = fields.filter(f => {
    // Only consider active fields
    if (!f.isActive) return false;
    
    // For subfield validation, check if this is a subfield request
    if (fieldName.includes(' > ')) {
      const [mainField, subField] = fieldName.split(' > ');
      return f.name === mainField && f.subField === subField;
    }
    return f.name === fieldName && !f.subField;
  });
  
  if (relevantFields.length === 0) {
    // Log failure
    if (user && logId) {
      const duration = Date.now() - startTime;
      requestLogger.log({
        ...requestLogger.getLogs().find(log => log.id === logId)!,
        success: false,
        duration,
        error: 'Field configuration not found'
      });
    }
    
    return {
      passed: false,
      issues: ['Field configuration not found'],
      validationCriteria: ['No active field configuration found']
    };
  }
  
  // Find fields that apply to this product's category
  const applicableFields = relevantFields.filter(f => {
    if (!f.productCategories || f.productCategories.length === 0) {
      return true;
    }
    return f.productCategories.includes(product.categoryName);
  });
  
  if (applicableFields.length === 0) {
    // Log success (no validation needed)
    if (user && logId) {
      const duration = Date.now() - startTime;
      requestLogger.log({
        ...requestLogger.getLogs().find(log => log.id === logId)!,
        success: true,
        duration,
        results: {
          validationPassed: true
        }
      });
    }
    
    return {
      passed: true,
      issues: [],
      validationCriteria: ['No field configuration applies to this product category']
    };
  }

  const field = applicableFields[0];
  
  // Handle subfield validation
  if (field.subField) {
    const result = await validateSubField(product, field, language);
    
    // Update log with results
    if (user && logId) {
      const duration = Date.now() - startTime;
      requestLogger.log({
        ...requestLogger.getLogs().find(log => log.id === logId)!,
        success: true,
        duration,
        results: {
          validationPassed: result.passed,
          qualityBefore: result.quality?.rating,
          answer: `Validation ${result.passed ? 'passed' : 'failed'}${result.issues.length > 0 ? ` with ${result.issues.length} issues` : ''}`,
          issuesFound: result.issues
        }
      });
    }
    
    return result;
  }
  
  // Check if this is a media field
  if (field.fieldType === 'media') {
    const result = await validateMediaField(product, fieldName, field);
    
    // Update log with results
    if (user && logId) {
      const duration = Date.now() - startTime;
      requestLogger.log({
        ...requestLogger.getLogs().find(log => log.id === logId)!,
        success: true,
        duration,
        results: {
          validationPassed: result.passed,
          qualityBefore: result.quality?.rating,
          answer: `Validation ${result.passed ? 'passed' : 'failed'}${result.issues.length > 0 ? ` with ${result.issues.length} issues` : ''}`,
          issuesFound: result.issues
        }
      });
    }
    
    return result;
  }
  
  const languageConfig = field.languages?.[language] || field.languages?.['EN'] || {};
  
  // Use general settings as fallback if language-specific settings are empty
  const requirements = languageConfig.requirements || field.general?.requirements || '';
  const format = languageConfig.format || field.general?.format || '';
  
  const content = product[fieldName as keyof Product] as string;

  if (!content) {
    // Log failure
    if (user && logId) {
      const duration = Date.now() - startTime;
      requestLogger.log({
        ...requestLogger.getLogs().find(log => log.id === logId)!,
        success: false,
        duration,
        error: `Field "${fieldName}" not found in product data`
      });
    }
    
    return {
      passed: false,
      issues: [`Field "${fieldName}" not found in product data`],
      validationCriteria: buildValidationCriteria(field, language)
    };
  }
  
  // Get positive examples from goldstandard
  let positiveExamples = '';
  try {
    const goldstandardExamples = JSON.parse(localStorage.getItem('goldstandardExamples') || '[]');
    const relevantExamples = goldstandardExamples.filter((ex: any) => 
      ex.fieldName === field.name && 
      ex.language === language
    );
    if (relevantExamples.length > 0) {
      positiveExamples = relevantExamples.map((ex: any) => ex.content).join('\n\n');
    }
  } catch (error) {
    console.error('Error fetching goldstandard examples:', error);
  }

  const prompt = `Please validate and evaluate the following ${fieldName} against these requirements and format guidelines:

Requirements: ${requirements || 'None'}
Format: ${format || 'None'}
Whitelist Terms: ${languageConfig.whitelist || 'None'}
Blacklist Terms: ${languageConfig.blacklist || 'None'}
Language: ${language}
${positiveExamples ? `\n===== GOLDSTANDARD EXAMPLES =====\n${positiveExamples}` : ''}

Content to validate:
${content}

${field.general?.skipLanguageDetection ? 
  'IMPORTANT: Language detection is disabled for this field. Focus only on content quality, requirements, and format validation.' :
  `IMPORTANT: First, verify whether the content is actually written in ${language} language. 
If it contains terms or phrases in other languages (except for brand names and registered trademarks), it should be marked as failing validation with "Content not in ${language} language" as an issue.

For language verification:
- EN: Content should be primarily in English
- DE: Content should be primarily in German
- FR: Content should be primarily in French

Note that product names, registered trademarks (®, ™) and specific measurements can be preserved in their original form.`
}

If goldstandard examples are provided above, also evaluate how well the content aligns with the style, structure and quality of these examples.

Rate the quality of this content on a scale of 0-100% based on:
- How well it meets requirements
- Proper formatting
- Use of required terms
- Avoidance of prohibited terms
${field.general?.skipLanguageDetection ? '' : `- Whether it's actually in the specified language (${language})`}
- Alignment with goldstandard examples (if provided)
- Overall clarity and effectiveness

Return ONLY a JSON object with:
1. passed (boolean): whether the content passes validation requirements
2. issues (array of strings): problems found, if any
3. quality (object): with "rating" (number 0-100) and "remarks" (brief explanation for the rating)

Do not include any markdown formatting, code blocks, or backticks. Return the raw JSON object only.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: prompts.system.validator + "\nYou are especially skilled at detecting when content is not in the specified language. Be strict about language validation while respecting that product names, technical terms, and registered trademarks may be preserved in their original language."
        },
        { role: "user", content: prompt }
      ]
    });

    const cleanResponse = completion.choices[0].message.content
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim();

    const result = JSON.parse(cleanResponse);
    
    // Update log with results
    if (user && logId) {
      const duration = Date.now() - startTime;
      requestLogger.log({
        ...requestLogger.getLogs().find(log => log.id === logId)!,
        success: true,
        duration,
        results: {
          validationPassed: result.passed,
          qualityBefore: result.quality?.rating,
          answer: `Validation ${result.passed ? 'passed' : 'failed'}${result.issues.length > 0 ? ` with ${result.issues.length} issues` : ''}`,
          issuesFound: result.issues
        }
      });
    }
    
    return {
      ...result,
      validationCriteria: buildValidationCriteria(field, language)
    };
  } catch (error) {
    console.error('Validation error:', error);
    
    // Log error
    if (user && logId) {
      const duration = Date.now() - startTime;
      requestLogger.log({
        ...requestLogger.getLogs().find(log => log.id === logId)!,
        success: false,
        duration,
        error: error instanceof Error ? error.message : 'Unknown validation error'
      });
    }
    
    return {
      passed: false,
      issues: ['An error occurred during validation. Please try again.'],
      validationCriteria: buildValidationCriteria(field, language)
    };
  }
};

const validateSubField = (
  product: Product,
  field: Field,
  language: string = 'EN'
): Promise<{ passed: boolean; issues: string[]; quality?: { rating: number; remarks: string }; validationCriteria?: string[]; validationPrompt?: string }> => {
  return new Promise(async (resolve) => {
    if (!field.subField || !field.subFieldFilter) {
      resolve({
        passed: false,
        issues: ['Subfield configuration incomplete'],
        validationCriteria: ['Subfield configuration is incomplete']
      });
      return;
    }

    // For media fields, get the media array directly
    let mainFieldData;
    if (field.fieldType === 'media') {
      mainFieldData = product.media;
    } else {
      mainFieldData = product[field.name as keyof Product];
    }
    
    if (!mainFieldData) {
      resolve({
        passed: false,
        issues: [`Field "${field.name}" not found in product data`],
        validationCriteria: [`Field "${field.name}" should exist in product data`]
      });
      return;
    }

    // Handle different field types
    if (field.fieldType === 'media' && Array.isArray(mainFieldData)) {
      // For media fields, find assets that match the subfield filter
      const allAssets = mainFieldData as Media[];
      const matchingAssets = allAssets.filter(asset => 
        matchesSubFieldFilter(asset, field.subField!, field.subFieldFilter!)
      );

      const criteria = [
        `Subfield filter: ${field.subField} ${field.subFieldFilter.operator} "${field.subFieldFilter.value}"`,
        `Total assets in product: ${allAssets.length}`,
        `Assets matching filter: ${matchingAssets.length}`,
        ...buildMediaValidationCriteria(field)
      ];

      // Build detailed asset information for validation prompt
      const assetDetails = await Promise.all(allAssets.map(async (asset) => {
        const subFieldValue = asset[field.subField as keyof Media];
        const matches = matchesSubFieldFilter(asset, field.subField!, field.subFieldFilter!);
        const analysis = await analyzeMediaAsset(asset.mediaURL);
        
        return {
          id: asset.assetId,
          url: asset.mediaURL,
          subFieldValue: subFieldValue || 'undefined',
          matches,
          type: asset.mediaURL?.split('.').pop()?.toLowerCase() || 'unknown',
          https: asset.mediaURL?.startsWith('https://') || false,
          dimensions: analysis.dimensions,
          fileSize: analysis.fileSize,
          aspectRatio: analysis.aspectRatio,
          analysisError: analysis.error
        };
      }));

      const validationPrompt = `Media Subfield Validation Analysis

Field: ${field.name} > ${field.subField}
Filter: ${field.subField} ${field.subFieldFilter.operator} "${field.subFieldFilter.value}"
Product Category: ${product.categoryName}

Asset Analysis:
${assetDetails.map(asset => `
- Asset ID: ${asset.id}
  URL: ${asset.url}
  ${field.subField}: "${asset.subFieldValue}"
  Matches Filter: ${asset.matches ? 'YES' : 'NO'}
  File Type: ${asset.type}
  HTTPS: ${asset.https ? 'YES' : 'NO'}
  Dimensions: ${asset.dimensions ? `${asset.dimensions.width}×${asset.dimensions.height}px` : 'Unknown'}
  Aspect Ratio: ${asset.aspectRatio || 'Unknown'}
  File Size: ${asset.fileSize ? `${Math.round(asset.fileSize / 1024)}KB` : 'Unknown'}
  ${asset.analysisError ? `Analysis Error: ${asset.analysisError}` : ''}
`).join('')}

Summary:
- Total assets: ${allAssets.length}
- Matching assets: ${matchingAssets.length}
- Filter criteria: ${field.subField} ${field.subFieldFilter.operator} "${field.subFieldFilter.value}"

Validation Rules Applied:
${criteria.join('\n')}`;

      if (matchingAssets.length === 0) {
        resolve({
          passed: false,
          issues: [`No media assets found where ${field.subField} ${field.subFieldFilter.operator} "${field.subFieldFilter.value}". Found ${allAssets.length} total assets, but none match the filter criteria.`],
          quality: {
            rating: 0,
            remarks: `No assets match the required ${field.subField} criteria. Expected: ${field.subField} ${field.subFieldFilter.operator} "${field.subFieldFilter.value}"`
          },
          validationCriteria: criteria,
          validationPrompt
        });
        return;
      }

      // Validate each matching asset with comprehensive media validation
      const issues: string[] = [];
      let totalQuality = 0;
      let validAssetCount = 0;
      
      // Analyze all matching assets in parallel
      const assetAnalyses = await Promise.all(
        matchingAssets.map(async (asset) => {
          const analysis = await analyzeMediaAsset(asset.mediaURL);
          return { asset, analysis };
        })
      );

      assetAnalyses.forEach(({ asset, analysis }) => {
        let assetQuality = 100;
        const assetIssues: string[] = [];
        
        // Basic asset validation
        if (!asset.mediaURL) {
          assetIssues.push(`Asset ${asset.assetId}: Missing media URL`);
          assetQuality -= 50;
        } else {
          // HTTPS validation
          if (field.mediaValidation?.requireHttps && !asset.mediaURL.startsWith('https://')) {
            assetIssues.push(`Asset ${asset.assetId}: URL must use HTTPS protocol`);
            assetQuality -= 25;
          }
          
          // File type validation
          if (field.mediaValidation?.allowedFileTypes?.length > 0) {
            const fileExtension = asset.mediaURL.split('.').pop()?.toLowerCase();
            if (!fileExtension || !field.mediaValidation.allowedFileTypes.includes(fileExtension)) {
              assetIssues.push(`Asset ${asset.assetId}: File type '${fileExtension || 'unknown'}' not allowed. Allowed types: ${field.mediaValidation.allowedFileTypes.join(', ')}`);
              assetQuality -= 20;
            }
          }
          
          // Actual dimension validation using measured dimensions
          if (analysis.dimensions && field.mediaValidation) {
            const dimensionIssues = validateDimensions(analysis.dimensions, {
              minWidth: field.mediaValidation.minWidth,
              maxWidth: field.mediaValidation.maxWidth,
              minHeight: field.mediaValidation.minHeight,
              maxHeight: field.mediaValidation.maxHeight
            });
            
            dimensionIssues.forEach(issue => {
              assetIssues.push(`Asset ${asset.assetId}: ${issue}`);
              assetQuality -= 15;
            });
            
            // Aspect ratio validation using measured dimensions
            const aspectRatioIssues = validateAspectRatio(analysis.dimensions, {
              aspectRatio: field.mediaValidation.aspectRatio,
              allowedAspectRatios: field.mediaValidation.allowedAspectRatios
            });
            
            aspectRatioIssues.forEach(issue => {
              assetIssues.push(`Asset ${asset.assetId}: ${issue}`);
              assetQuality -= 20;
            });
          } else if ((field.mediaValidation?.minWidth || field.mediaValidation?.maxWidth || 
                     field.mediaValidation?.minHeight || field.mediaValidation?.maxHeight ||
                     field.mediaValidation?.aspectRatio || field.mediaValidation?.allowedAspectRatios) 
                     && !analysis.dimensions) {
            assetIssues.push(`Asset ${asset.assetId}: Could not analyze dimensions for validation`);
            assetQuality -= 10;
          }
          
          // Actual file size validation using measured file size
          if (analysis.fileSize && field.mediaValidation) {
            const fileSizeIssues = validateFileSize(analysis.fileSize, {
              minFileSize: field.mediaValidation.minFileSize,
              maxFileSize: field.mediaValidation.maxFileSize
            });
            
            fileSizeIssues.forEach(issue => {
              assetIssues.push(`Asset ${asset.assetId}: ${issue}`);
              assetQuality -= 15;
            });
          } else if ((field.mediaValidation?.minFileSize || field.mediaValidation?.maxFileSize) 
                     && !analysis.fileSize) {
            assetIssues.push(`Asset ${asset.assetId}: Could not analyze file size for validation`);
            assetQuality -= 10;
          }
          
          // Add analysis error as an issue if present
          if (analysis.error) {
            assetIssues.push(`Asset ${asset.assetId}: Analysis error - ${analysis.error}`);
            assetQuality -= 5;
          }
        }

        // Add asset issues to main issues list
        issues.push(...assetIssues);
        
        // Ensure minimum quality
        assetQuality = Math.max(0, assetQuality);
        totalQuality += assetQuality;
        
        if (assetIssues.length === 0) {
          validAssetCount++;
        }
      });

      const averageQuality = Math.round(totalQuality / matchingAssets.length);

      resolve({
        passed: issues.length === 0,
        issues,
        quality: {
          rating: averageQuality,
          remarks: issues.length === 0 
            ? `All ${matchingAssets.length} matching ${field.subField} assets meet requirements`
            : `${validAssetCount} of ${matchingAssets.length} matching assets pass validation. Issues found in ${matchingAssets.length - validAssetCount} assets.`
        },
        validationCriteria: criteria,
        validationPrompt
      });
    } else {
      resolve({
        passed: false,
        issues: ['Subfield validation only supported for media fields'],
        validationCriteria: ['Subfield validation only supported for media fields']
      });
    }
  });
};

const validateMediaField = (
  product: Product,
  fieldName: string,
  field: Field
): Promise<{ passed: boolean; issues: string[]; quality?: { rating: number; remarks: string }; validationCriteria?: string[] }> => {
  return new Promise(async (resolve) => {
  if (fieldName !== 'media') {
    resolve({
      passed: false,
      issues: ['Not a media field'],
      validationCriteria: ['Field type should be media']
    });
    return;
  }

  // Extract media assets from the product
  const mediaAssets = product.media;
  
  if (!mediaAssets || mediaAssets.length === 0) {
    resolve({
      passed: false,
      issues: ['No media assets found'],
      quality: {
        rating: 0,
        remarks: 'No media assets available to validate'
      },
      validationCriteria: buildMediaValidationCriteria(field)
    });
    return;
  }

  const mediaValidation = field.mediaValidation;
  if (!mediaValidation) {
    resolve({
      passed: true,
      issues: [],
      quality: {
        rating: 100,
        remarks: 'No validation rules defined for media assets'
      },
      validationCriteria: ['No specific media validation rules defined']
    });
    return;
  }

  const issues: string[] = [];
  let totalQuality = 0;
  
  // Analyze all assets in parallel
  const assetAnalyses = await Promise.all(
    mediaAssets.map(async (asset) => {
      const analysis = await analyzeMediaAsset(asset.mediaURL);
      return { asset, analysis };
    })
  );
  
  const validAssets = assetAnalyses.filter(({ asset, analysis }) => {
    const assetIssues: string[] = [];
    
    // Check for valid URLs
    if (!asset.mediaURL) {
      assetIssues.push(`Asset ${asset.assetId}: Missing URL`);
      return false;
    }
    
    // Check HTTPS requirement
    if (mediaValidation.requireHttps && !asset.mediaURL.startsWith('https://')) {
      assetIssues.push(`Asset ${asset.assetId}: URL must use HTTPS protocol`);
    }
    
    // Check file types
    if (mediaValidation.allowedFileTypes && mediaValidation.allowedFileTypes.length > 0) {
      const fileExtension = asset.mediaURL.split('.').pop()?.toLowerCase();
      if (!fileExtension || !mediaValidation.allowedFileTypes.includes(fileExtension)) {
        assetIssues.push(`Asset ${asset.assetId}: File type '${fileExtension || 'unknown'}' not allowed. Accepted types: ${mediaValidation.allowedFileTypes.join(', ')}`);
      }
    }
    
    // Actual dimension and aspect ratio validation
    if (analysis.dimensions) {
      const dimensionIssues = validateDimensions(analysis.dimensions, {
        minWidth: mediaValidation.minWidth,
        maxWidth: mediaValidation.maxWidth,
        minHeight: mediaValidation.minHeight,
        maxHeight: mediaValidation.maxHeight
      });
      
      dimensionIssues.forEach(issue => {
        assetIssues.push(`Asset ${asset.assetId}: ${issue}`);
      });
      
      const aspectRatioIssues = validateAspectRatio(analysis.dimensions, {
        aspectRatio: mediaValidation.aspectRatio,
        allowedAspectRatios: mediaValidation.allowedAspectRatios
      });
      
      aspectRatioIssues.forEach(issue => {
        assetIssues.push(`Asset ${asset.assetId}: ${issue}`);
      });
    } else if (mediaValidation.minWidth || mediaValidation.maxWidth || 
               mediaValidation.minHeight || mediaValidation.maxHeight ||
               mediaValidation.aspectRatio || mediaValidation.allowedAspectRatios) {
      assetIssues.push(`Asset ${asset.assetId}: Could not analyze dimensions for validation`);
    }
    
    // Actual file size validation
    if (analysis.fileSize) {
      const fileSizeIssues = validateFileSize(analysis.fileSize, {
        minFileSize: mediaValidation.minFileSize,
        maxFileSize: mediaValidation.maxFileSize
      });
      
      fileSizeIssues.forEach(issue => {
        assetIssues.push(`Asset ${asset.assetId}: ${issue}`);
      });
    } else if (mediaValidation.minFileSize || mediaValidation.maxFileSize) {
      assetIssues.push(`Asset ${asset.assetId}: Could not analyze file size for validation`);
    }
    
    // Add analysis error as an issue if present
    if (analysis.error) {
      assetIssues.push(`Asset ${asset.assetId}: Analysis error - ${analysis.error}`);
    }
    
    // Add asset issues to main issues list
    issues.push(...assetIssues);
    
    // Calculate a simple quality score based on issues
    const assetQuality = assetIssues.length === 0 ? 100 : Math.max(0, 100 - (assetIssues.length * 15));
    totalQuality += assetQuality;
    
    return assetIssues.length === 0;
  });

  // Calculate average quality
  const averageQuality = Math.round(totalQuality / (assetAnalyses.length || 1));
  
  resolve({
    passed: issues.length === 0,
    issues,
    quality: {
      rating: averageQuality,
      remarks: issues.length === 0 
        ? 'All media assets meet the required specifications' 
        : `${validAssets.length} of ${assetAnalyses.length} assets pass validation`
    },
    validationCriteria: buildMediaValidationCriteria(field)
  });
  });
};

const validateMediaAsset = (
  product: Product,
  assetId: string,
  fields: Field[]
): { passed: boolean; issues: string[]; quality?: { rating: number; remarks: string }; validationCriteria?: string[] } => {
  // Find media field configuration
  const mediaField = fields.find(f => 
    f.fieldType === 'media' && 
    f.isActive &&
    (!f.productCategories?.length || f.productCategories.includes(product.categoryName))
  );
  
  if (!mediaField) {
    return {
      passed: false,
      issues: ['No media field configuration found for this product category'],
      quality: {
        rating: 0,
        remarks: 'Cannot validate without field configuration'
      },
      validationCriteria: ['No active media field configuration found for this product category']
    };
  }
  
  // Find the specific asset
  const asset = product.media.find(a => a.assetId === assetId);
  if (!asset) {
    return {
      passed: false,
      issues: [`Asset "${assetId}" not found`],
      quality: {
        rating: 0,
        remarks: 'Asset does not exist'
      },
      validationCriteria: buildMediaValidationCriteria(mediaField)
    };
  }
  
  const mediaValidation = mediaField.mediaValidation;
  if (!mediaValidation) {
    return {
      passed: true,
      issues: [],
      quality: {
        rating: 100,
        remarks: 'No validation rules defined for media assets'
      },
      validationCriteria: ['No specific media validation rules defined']
    };
  }
  
  const issues: string[] = [];
  
  // Check for valid URL
  if (!asset.mediaURL) {
    issues.push('Missing URL');
  }
  
  // Check HTTPS requirement
  if (mediaValidation.requireHttps && !asset.mediaURL.startsWith('https://')) {
    issues.push('URL must use HTTPS protocol');
  }
  
  // Check file types
  if (mediaValidation.allowedFileTypes && mediaValidation.allowedFileTypes.length > 0) {
    const fileExtension = asset.mediaURL.split('.').pop()?.toLowerCase();
    if (!fileExtension || !mediaValidation.allowedFileTypes.includes(fileExtension)) {
      issues.push(`File type '${fileExtension || 'unknown'}' not allowed. Accepted types: ${mediaValidation.allowedFileTypes.join(', ')}`);
    }
  }
  
  // Note: Advanced validations like dimensions, aspect ratio, and file size
  // would require actual image analysis which isn't implemented in this demo
  
  // Calculate quality score based on issues
  const quality = issues.length === 0 ? 100 : Math.max(0, 100 - (issues.length * 25));
  
  return {
    passed: issues.length === 0,
    issues,
    quality: {
      rating: quality,
      remarks: issues.length === 0 
        ? 'Asset meets all required specifications' 
        : `Asset has ${issues.length} validation issues`
    },
    validationCriteria: buildMediaValidationCriteria(mediaField)
  };
};

const validateMediaCount = (
  product: Product,
  fields: Field[]
): { passed: boolean; issues: string[]; quality?: { rating: number; remarks: string }; validationCriteria?: string[] } => {
  // Find media field configuration
  const mediaField = fields.find(f => 
    f.fieldType === 'media' && 
    f.isActive &&
    (!f.productCategories?.length || f.productCategories.includes(product.categoryName))
  );
  
  if (!mediaField) {
    return {
      passed: true,
      issues: [],
      quality: {
        rating: 50,
        remarks: 'No media requirements defined for this product category'
      },
      validationCriteria: ['No media field configuration found for this product category']
    };
  }
  
  const mediaAssets = product.media || [];
  const assetCount = mediaAssets.length;
  
  // Use validation rules from field configuration
  const mediaValidation = mediaField.mediaValidation;
  const minCount = mediaValidation?.mediaCountMin || 1;
  const maxCount = mediaValidation?.mediaCountMax || 10;
  const optimalCount = mediaValidation?.mediaCountOptimal || 3;
  
  const issues: string[] = [];
  
  if (assetCount < minCount) {
    issues.push(`Insufficient media assets. Minimum required: ${minCount}, found: ${assetCount}`);
  }
  
  if (assetCount > maxCount) {
    issues.push(`Too many media assets. Maximum allowed: ${maxCount}, found: ${assetCount}`);
  }
  
  // Calculate quality score based on proximity to optimal count
  let quality = 100;
  
  if (assetCount < minCount) {
    quality = Math.max(0, 50 - ((minCount - assetCount) * 25));
  } else if (assetCount > maxCount) {
    quality = Math.max(0, 70 - ((assetCount - maxCount) * 5));
  } else if (assetCount !== optimalCount) {
    // Reduce quality slightly if not optimal but within range
    quality = Math.max(70, 100 - (Math.abs(assetCount - optimalCount) * 10));
  }
  
  const criteria = [
    `Minimum assets required: ${minCount}`,
    `Maximum assets allowed: ${maxCount}`,
    `Optimal asset count: ${optimalCount}`,
    `Current asset count: ${assetCount}`
  ];
  
  return {
    passed: issues.length === 0,
    issues,
    quality: {
      rating: quality,
      remarks: issues.length === 0 
        ? assetCount === optimalCount 
          ? `Optimal number of media assets (${assetCount})` 
          : `Acceptable number of media assets (${assetCount})`
        : `Media count issues: ${issues.join(', ')}`
    },
    validationCriteria: criteria
  };
};