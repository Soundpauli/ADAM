import OpenAI from 'openai';
import { Field, Product } from '../types';
import prompts from '../data/prompts.json';
import { requestLogger } from './requestLogger';
import { logEnhancement } from '../utils/enhancementHistory';

export const createOpenAIClient = (apiKey: string) => {
  return new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true
  });
};

export const validateField = (field: Field, value: string): { passed: boolean; issues: string[] } => {
  const issues: string[] = [];
  
  // Validate HTML content if the value contains HTML tags
  if (value.startsWith('<') && value.includes('</')) {
    if (!value.match(/<\/?[a-z][\s\S]*>/i)) {
      issues.push('Invalid HTML format');
    }
  }
  
  // Check whitelist terms
  if (field.whitelist) {
    const whitelistTerms = field.whitelist.split(',').map(term => term.trim()).filter(Boolean);
    if (whitelistTerms.length > 0) {
      const hasWhitelistedTerm = whitelistTerms.some(term => 
        value.toLowerCase().includes(term.toLowerCase())
      );
      if (!hasWhitelistedTerm) {
        issues.push(`Must include at least one of: ${whitelistTerms.join(', ')}`);
      }
    }
  }
  
  // Check blacklist terms
  if (field.blacklist) {
    const blacklistTerms = field.blacklist.split(',').map(term => term.trim()).filter(Boolean);
    const foundBlacklistedTerms = blacklistTerms.filter(term =>
      value.toLowerCase().includes(term.toLowerCase())
    );
    if (foundBlacklistedTerms.length > 0) {
      issues.push(`Contains prohibited terms: ${foundBlacklistedTerms.join(', ')}`);
    }
  }
  
  // Check format requirements
  if (field.format) {
    if (field.format.includes('Title Case') && 
        !value.split(' ').every(word => word.charAt(0) === word.charAt(0).toUpperCase())) {
      issues.push('Must be in Title Case format');
    }
    
    if (field.format.includes('Paragraph') && !value.includes('.')) {
      issues.push('Must be in paragraph format');
    }
    
    if (field.format.includes('bullet points') && !value.includes('•')) {
      issues.push('Must include bullet points');
    }
  }
  
  return {
    passed: issues.length === 0,
    issues
  };
};

export const evaluateContentQuality = async (
  field: Field, 
  currentValue: string, 
  selectedLanguage: string,
  openai: OpenAI,
  user?: { id: string; name: string; email: string; role: string },
  product?: Product
): Promise<{ rating: number; remarks: string }> => {
  const startTime = Date.now();
  let logId: string | undefined;
  
  // Log the quality evaluation request
  if (user && product) {
    logId = requestLogger.log({
      user,
      product: {
        id: product.id as string || product.code,
        code: product.code,
        name: product.assortmentProductName || product.name,
        category: product.categoryName || 'Unknown'
      },
      field: field.name,
      type: 'quality_evaluation', // changed from 'enhancement'
      language: selectedLanguage,
      success: false, // Will update this later
      source: {
        component: 'AIEnhanceModal',
        command: 'Evaluate Content Quality',
        effect: `Assessing quality of ${field.name} content before enhancement`
      }
    });
  }

  // Add null checks for field.languages and language-specific properties
  const fieldLanguages = field.languages || {};
  const languageConfig = fieldLanguages[selectedLanguage] || {};
  
  // Use general settings as fallback if language-specific settings are empty
  const requirements = languageConfig.requirements || field.general?.requirements || '';
  const format = languageConfig.format || field.general?.format || '';
  
  // Get positive examples from goldstandard
  let positiveExamples = '';
  try {
    const goldstandardExamples = JSON.parse(localStorage.getItem('goldstandardExamples') || '[]');
    const relevantExamples = goldstandardExamples.filter((ex: any) => 
      ex.fieldName === field.name && 
      ex.language === selectedLanguage
    );
    if (relevantExamples.length > 0) {
      positiveExamples = relevantExamples.map((ex: any) => ex.content).join('\n\n');
    }
  } catch (error) {
    console.error('Error fetching goldstandard examples:', error);
  }
  
  const promptText = `Evaluate the quality of the following content for a "${field.name}" field according to these requirements:

Requirements: ${requirements}
Format: ${format}
Whitelist Terms: ${languageConfig.whitelist || ''}
Blacklist Terms: ${languageConfig.blacklist || ''}
Language: ${selectedLanguage}
${positiveExamples ? `\nGoldstandard Examples:\n${positiveExamples}` : ''}

Content to evaluate:
${currentValue}

IMPORTANT: First check if the content is actually written in ${selectedLanguage} language.
If it contains significant text in other languages (except for brand names and registered trademarks), it should receive a low quality rating.

Please rate the content quality on a scale of 0-100%, where:
- 0-25%: Poor quality, needs complete rewrite (including content in wrong language)
- 26-50%: Below average, requires significant improvement
- 51-75%: Average, could be improved
- 76-90%: Good, needs minor improvements
- 91-100%: Excellent, little to no improvement needed

Return ONLY a JSON object with:
1. rating: numeric score between 0-100
2. remarks: brief explanation for the rating (including language assessment)

For example:
{"rating": 85, "remarks": "Content is well-structured but could be more engaging."}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { 
          role: "system", 
          content: "You are a content quality evaluator with excellent language detection abilities. Return only a raw JSON object with rating results - no markdown, no formatting, no explanations. Be strict about language validation."
        },
        { role: "user", content: promptText }
      ]
    });

    const cleanResponse = completion.choices[0].message.content
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim();

    const result = JSON.parse(cleanResponse);
    
    // Update log with results
    if (user && product && logId) {
      const duration = Date.now() - startTime;
      requestLogger.log({
        ...requestLogger.getLogs().find(log => log.id === logId)!,
        success: true,
        duration,
        results: {
          qualityBefore: result.rating
        }
      });
    }
    
    return result;
  } catch (error) {
    console.error('Content evaluation error:', error);
    
    // Log error
    if (user && product && logId) {
      const duration = Date.now() - startTime;
      requestLogger.log({
        ...requestLogger.getLogs().find(log => log.id === logId)!,
        success: false,
        duration,
        error: error instanceof Error ? error.message : 'Quality evaluation failed'
      });
    }
    
    return {
      rating: 0,
      remarks: 'Error evaluating content quality'
    };
  }
};

export const enhanceField = async (
  field: Field, 
  currentValue: string, 
  selectedLanguage: string,
  openai: OpenAI,
  product?: Product,
  user?: { id: string; name: string; email: string; role: string }
) => {
  const startTime = Date.now();
  // let logId: string | undefined; // REMOVE initial logId and log
  // Log the enhancement request ONLY after the OpenAI call
  
  // Add null checks for field.languages and language-specific properties
  const fieldLanguages = field.languages || {};
  const languageConfig = fieldLanguages[selectedLanguage] || {};
  
  // Use general settings as fallback if language-specific settings are empty
  const requirements = languageConfig.requirements || field.general?.requirements || '';
  const format = languageConfig.format || field.general?.format || '';
  
  // Get positive examples from goldstandard with high priority
  let positiveExamples = '';
  try {
    const goldstandardExamples = JSON.parse(localStorage.getItem('goldstandardExamples') || '[]');
    const relevantExamples = goldstandardExamples.filter((ex: any) => 
      ex.fieldName === field.name && 
      ex.language === selectedLanguage
    );
    if (relevantExamples.length > 0) {
      positiveExamples = relevantExamples.map((ex: any) => `• ${ex.content}`).join('\n');
    }
  } catch (error) {
    console.error('Error fetching goldstandard examples:', error);
  }
  
  // Get context from linked fields
  let contextContent = '';
  if (field.contextFields && field.contextFields.length > 0 && product) {
    const contextParts: string[] = [];
    field.contextFields.forEach(contextFieldName => {
      const contextValue = product[contextFieldName as keyof Product] as string;
      if (contextValue && typeof contextValue === 'string' && contextValue.trim()) {
        contextParts.push(`${contextFieldName}: ${contextValue}`);
      }
    });
    
    if (contextParts.length > 0) {
      contextContent = `\n===== PRODUCT CONTEXT =====\nThe following content from other fields provides context about this product:\n\n${contextParts.join('\n\n')}\n\nUse this context to ensure the enhanced content is consistent and complementary.\n`;
    }
  }
  
  // Get claims for this product if useClaimList is enabled
  let claimsContent = '';
  if (field.useClaimList && product) {
    try {
      const savedClaims = localStorage.getItem('productClaims');
      if (savedClaims) {
        const claims = JSON.parse(savedClaims);
        const matchingClaims = claims.filter((claim: any) => 
          claim.productIds.includes(product.code) && 
          claim.language === selectedLanguage
        );
        
        if (matchingClaims.length > 0) {
          const claimTexts = matchingClaims.map((claim: any) => `• ${claim.claim}`).join('\n');
          claimsContent = `\n===== PRODUCT CLAIMS =====\nThe following claims are defined for this product and MUST be used exactly as written (can be embedded in sentences):\n\n${claimTexts}\n\nIMPORTANT: Use these claims exactly as provided - do not modify, paraphrase, or change the wording. They can be embedded naturally within sentences but the claim text itself must remain unchanged.\n`;
        }
      }
    } catch (error) {
      console.error('Error fetching product claims:', error);
    }
  }
  
  // Format negative examples as bullet points if multiple examples exist
  const formatExamples = (examples: string) => {
    if (!examples) return 'None provided';
    const items = examples.split(',').map(ex => ex.trim()).filter(Boolean);
    return items.length > 0 ? items.map(ex => `• ${ex}`).join('\n') : 'None provided';
  };

  // Handle missing/empty content for mandatory fields
  const isGeneratingNewContent = !currentValue || currentValue.trim() === '';
  const enhancementType = isGeneratingNewContent ? 'generate' : 'enhance';
  
  // Modify the prompt based on whether we're generating new content or enhancing existing content
  let basePrompt = prompts.templates.enhance;
  if (isGeneratingNewContent) {
    basePrompt = basePrompt.replace(
      'Please enhance the following {fieldName}',
      'Please generate content for the following {fieldName}'
    ).replace(
      'Current Value:\n{currentValue}',
      'Current Value: [MISSING - Please generate new content]'
    ).replace(
      'Please provide an improved version',
      'Please generate new content'
    );
  }
  const modifiedPrompt = basePrompt.replace(/\{([^}]+)\}/g, (match, key) => {
    switch (key) {
      case 'fieldName':
        return field.name;
      case 'requirements':
        return requirements;
      case 'format':
        return format;
      case 'whitelist':
        return languageConfig.whitelist || '';
      case 'positiveExamples':
        return positiveExamples || 'None provided';
      case 'negativeExamples':
        return formatExamples(languageConfig.negativeExamples);
      case 'blacklist':
        return languageConfig.blacklist || '';
      case 'currentValue':
        return currentValue || '[MISSING - Please generate new content based on the requirements and context]';
      case 'language':
        return selectedLanguage;
      default:
        return match;
    }
  }) + contextContent + claimsContent;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { 
          role: "system",
          content: prompts.system.contentOptimizer + " You maintain strict adherence to the specified target language, while preserving product names, trademarks, and technical terms in their original form. CRITICAL: The goldstandard examples represent our ideal content style and must be prioritized as your primary reference for style, tone, and structure. Use any provided product context to ensure consistency across all content fields. When generating new content for missing fields, create comprehensive, high-quality content that follows all requirements and format specifications. CLAIMS USAGE: When product claims are provided, you MUST use them exactly as written without any modifications, paraphrasing, or changes. Claims can be naturally embedded within sentences, but the claim text itself must remain completely unchanged."
        },
        { role: "user", content: modifiedPrompt }
      ],
      temperature: 0.7
    });

    const result = {
      value: completion.choices[0].message.content.trim(),
      prompt: modifiedPrompt
    };
    
    // Log only after success
    if (user && product) {
      const duration = Date.now() - startTime;
      requestLogger.log({
        user,
        product: {
          id: product.id as string || product.code,
          code: product.code,
          name: product.assortmentProductName || product.name,
          category: product.categoryName || 'Unknown'
        },
        field: field.name,
        type: 'enhancement',
        language: selectedLanguage,
        success: true,
        duration,
        source: {
          component: 'AIEnhanceModal',
          command: 'Enhance Field Content',
          effect: `Enhancing ${field.name} content using AI with ${selectedLanguage} language requirements`
        },
        results: {
          answer: result.value,
          contentLength: result.value.length
        }
      });
      // Enhancement history logging
      logEnhancement({
        timestamp: new Date().toISOString(),
        user,
        productId: product.id as string || product.code,
        productCode: product.code,
        field: field.name,
        before: currentValue || '',
        after: result.value
      });
    }
    
    return result;
  } catch (error) {
    console.error('Enhancement error:', error);
    // Log only after failure
    if (user && product) {
      const duration = Date.now() - startTime;
      requestLogger.log({
        user,
        product: {
          id: product.id as string || product.code,
          code: product.code,
          name: product.assortmentProductName || product.name,
          category: product.categoryName || 'Unknown'
        },
        field: field.name,
        type: 'enhancement',
        language: selectedLanguage,
        success: false,
        duration,
        source: {
          component: 'AIEnhanceModal',
          command: 'Enhance Field Content',
          effect: `Enhancing ${field.name} content using AI with ${selectedLanguage} language requirements`
        },
        error: error instanceof Error ? error.message : 'Enhancement failed'
      });
    }
    throw error;
  }
};