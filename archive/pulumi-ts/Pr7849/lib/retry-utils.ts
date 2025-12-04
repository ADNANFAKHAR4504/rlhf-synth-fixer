/**
 * Retry utility with exponential backoff for handling API rate limiting
 */
export interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelayMs = 1000,
    maxDelayMs = 10000,
    backoffMultiplier = 2,
  } = options;

  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Check if error is rate limiting related
      const isRateLimitError =
        lastError.message.includes('ThrottlingException') ||
        lastError.message.includes('TooManyRequestsException') ||
        lastError.message.includes('RequestLimitExceeded');

      // If it's the last attempt or not a rate limit error, throw
      if (attempt === maxRetries - 1 || !isRateLimitError) {
        throw lastError;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        initialDelayMs * Math.pow(backoffMultiplier, attempt),
        maxDelayMs
      );

      console.warn(
        `Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms due to: ${lastError.message}`
      );

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error('Retry failed');
}
