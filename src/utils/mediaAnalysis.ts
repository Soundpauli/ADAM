interface MediaAnalysisResult {
  dimensions?: { width: number; height: number };
  fileSize?: number; // in bytes
  aspectRatio?: string;
  error?: string;
  analysisAttempted: boolean;
}

export const analyzeMediaAsset = async (url: string): Promise<MediaAnalysisResult> => {
  try {
    // For PDF files, we can't get dimensions but we can get file size
    if (url.toLowerCase().endsWith('.pdf')) {
      try {
        const fileSize = await getFileSize(url);
        return {
          fileSize,
          aspectRatio: 'N/A (PDF)',
          analysisAttempted: true
        };
      } catch (error) {
        return {
          error: 'Unable to analyze PDF file',
          analysisAttempted: true
        };
      }
    }

    // For images, get both dimensions and file size
    const [dimensions, fileSize] = await Promise.allSettled([
      getImageDimensions(url),
      getFileSize(url)
    ]);

    const imageDimensions = dimensions.status === 'fulfilled' ? dimensions.value : null;
    const imageFileSize = fileSize.status === 'fulfilled' ? fileSize.value : null;

    let aspectRatio = 'Unknown';
    if (imageDimensions) {
      const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
      const divisor = gcd(imageDimensions.width, imageDimensions.height);
      const ratioW = imageDimensions.width / divisor;
      const ratioH = imageDimensions.height / divisor;
      aspectRatio = `${ratioW}:${ratioH}`;
    }

    // Determine if we have any useful data
    const hasData = imageDimensions || imageFileSize;
    const errorMessage = !hasData ? 'CORS restriction or network error prevented analysis' : undefined;

    return {
      dimensions: imageDimensions,
      fileSize: imageFileSize,
      aspectRatio,
      error: errorMessage,
      analysisAttempted: true
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Analysis failed',
      analysisAttempted: true
    };
  }
};

const getImageDimensions = (url: string): Promise<{ width: number; height: number } | null> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    let resolved = false;
    
    img.onload = function() {
      if (resolved) return;
      resolved = true;
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight
      });
    };
    
    img.onerror = function() {
      if (resolved) return;
      resolved = true;
      reject(new Error('Image failed to load'));
    };
    
    // Try without crossOrigin first, then with anonymous if that fails
    img.src = url;
    
    // Timeout after 5 seconds
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        reject(new Error('Image analysis timeout'));
      }
    }, 5000);
  });
};

const getFileSize = async (url: string): Promise<number | null> => {
  try {
    // Try HEAD request first
    const response = await fetch(url, { 
      method: 'HEAD',
      mode: 'cors'
    });
    
    const contentLength = response.headers.get('content-length');
    
    if (contentLength) {
      return parseInt(contentLength, 10);
    }
    
    return null;
  } catch (error) {
    // If CORS fails, we can't get file size
    throw new Error('File size analysis blocked by CORS');
  }
};

export const validateDimensions = (
  dimensions: { width: number; height: number },
  constraints: {
    minWidth?: number;
    maxWidth?: number;
    minHeight?: number;
    maxHeight?: number;
  }
): string[] => {
  const issues: string[] = [];
  
  if (constraints.minWidth && dimensions.width < constraints.minWidth) {
    issues.push(`Width ${dimensions.width}px is below minimum ${constraints.minWidth}px`);
  }
  
  if (constraints.maxWidth && dimensions.width > constraints.maxWidth) {
    issues.push(`Width ${dimensions.width}px exceeds maximum ${constraints.maxWidth}px`);
  }
  
  if (constraints.minHeight && dimensions.height < constraints.minHeight) {
    issues.push(`Height ${dimensions.height}px is below minimum ${constraints.minHeight}px`);
  }
  
  if (constraints.maxHeight && dimensions.height > constraints.maxHeight) {
    issues.push(`Height ${dimensions.height}px exceeds maximum ${constraints.maxHeight}px`);
  }
  
  return issues;
};

export const validateFileSize = (
  fileSize: number,
  constraints: {
    minFileSize?: number; // in KB
    maxFileSize?: number; // in KB
  }
): string[] => {
  const issues: string[] = [];
  const fileSizeKB = Math.round(fileSize / 1024);
  
  if (constraints.minFileSize && fileSizeKB < constraints.minFileSize) {
    issues.push(`File size ${fileSizeKB}KB is below minimum ${constraints.minFileSize}KB`);
  }
  
  if (constraints.maxFileSize && fileSizeKB > constraints.maxFileSize) {
    issues.push(`File size ${fileSizeKB}KB exceeds maximum ${constraints.maxFileSize}KB`);
  }
  
  return issues;
};

export const validateAspectRatio = (
  dimensions: { width: number; height: number },
  constraints: {
    aspectRatio?: string;
    allowedAspectRatios?: string[];
  }
): string[] => {
  const issues: string[] = [];
  
  // Calculate actual aspect ratio
  const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
  const divisor = gcd(dimensions.width, dimensions.height);
  const actualRatioW = dimensions.width / divisor;
  const actualRatioH = dimensions.height / divisor;
  const actualRatio = `${actualRatioW}:${actualRatioH}`;
  
  // Check single required aspect ratio
  if (constraints.aspectRatio) {
    if (actualRatio !== constraints.aspectRatio) {
      issues.push(`Aspect ratio ${actualRatio} does not match required ${constraints.aspectRatio}`);
    }
  }
  
  // Check allowed aspect ratios
  if (constraints.allowedAspectRatios && constraints.allowedAspectRatios.length > 0) {
    if (!constraints.allowedAspectRatios.includes(actualRatio)) {
      issues.push(`Aspect ratio ${actualRatio} is not in allowed list: ${constraints.allowedAspectRatios.join(', ')}`);
    }
  }
  
  return issues;
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};