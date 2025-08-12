// Export all test helpers for easy importing
export { AWSTestHelper } from './aws-helper';
export { SecurityValidator } from './security-validator';
export * from './types';
export * from './test-fixtures';

// Utility functions
export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const retry = async <T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delayMs: number = 1000
): Promise<T> => {
  let lastError: any;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      console.warn(`Attempt ${attempt}/${maxAttempts} failed:`, error);
      
      if (attempt < maxAttempts) {
        await sleep(delayMs * attempt); // Exponential backoff
      }
    }
  }

  throw lastError;
};

export const timeout = <T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage = 'Operation timed out'
): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs)
    )
  ]);
};

export const validateEnvironment = (): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required environment variables
  if (!process.env.AWS_DEFAULT_REGION && !process.env.AWS_REGION) {
    warnings.push('AWS_DEFAULT_REGION or AWS_REGION not set, defaulting to us-east-1');
  }

  if (!process.env.ENVIRONMENT_SUFFIX) {
    warnings.push('ENVIRONMENT_SUFFIX not set, defaulting to "dev"');
  }

  // Check if in CI environment
  if (process.env.CI) {
    console.log('Running in CI environment');
    
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      errors.push('AWS credentials not found in CI environment');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
};

export const generateTestReport = (results: any[]): string => {
  const passed = results.filter(r => r.status === 'PASSED').length;
  const failed = results.filter(r => r.status === 'FAILED').length;
  const skipped = results.filter(r => r.status === 'SKIPPED').length;
  const total = results.length;
  
  const successRate = Math.round((passed / total) * 100);
  
  return `
# Test Report

## Summary
- **Total Tests**: ${total}
- **Passed**: ${passed} (${successRate}%)
- **Failed**: ${failed}
- **Skipped**: ${skipped}

## Results
${results.map(result => `
- **${result.testName}**: ${result.status}
  - Duration: ${result.duration}ms
  - Assertions: ${result.assertions}
  ${result.errors.length > 0 ? `- Errors: ${result.errors.join(', ')}` : ''}
`).join('')}

Generated at: ${new Date().toISOString()}
`;
};