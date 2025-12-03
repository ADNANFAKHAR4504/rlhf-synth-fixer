import { handler } from '../../lib/lambda/scanner';

// Mock AWS SDK v3
jest.mock('@aws-sdk/client-ec2');
jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/client-iam');
jest.mock('@aws-sdk/client-cloudwatch-logs');
jest.mock('@aws-sdk/client-dynamodb');

describe('Scanner Lambda Function - Simplified', () => {
  const mockEvent = {
    time: '2025-12-01T00:00:00Z',
    region: 'us-east-1'
  };

  beforeEach(() => {
    process.env.REPORT_BUCKET = 'test-bucket';
    process.env.DYNAMODB_TABLE = 'test-table';
    jest.clearAllMocks();
  });

  it('should export handler function', () => {
    expect(typeof handler).toBe('function');
  });

  it('should have required environment variables', () => {
    expect(process.env.REPORT_BUCKET).toBeDefined();
    expect(process.env.DYNAMODB_TABLE).toBeDefined();
  });
});
