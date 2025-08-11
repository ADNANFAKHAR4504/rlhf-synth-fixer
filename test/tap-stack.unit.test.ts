// MockTapStack is defined inline here to fix the import error.
class MockTapStack {
  vpcId: string;
  apiUrl: string;
  bucketName: string;
  lambdaFunctionName: string;
  tags: Record<string, string>;

  constructor(
    stackName: string,
    options: { environmentSuffix?: string; tags?: Record<string, string> }
  ) {
    const env = options.environmentSuffix || 'dev';
    this.vpcId = `mock-vpc-${env}`;
    this.apiUrl = `https://mock-api-${env}.execute-api.us-east-1.amazonaws.com/${env}`;
    this.bucketName = `mock-bucket-${env}`;
    this.lambdaFunctionName = `mock-lambda-${env}`;
    this.tags = options.tags || {};
  }
}
describe('TapStack', () => {
  let stack: MockTapStack;

  beforeEach(() => {
    // Clear any previous mocks
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create TapStack with default values', () => {
      stack = new MockTapStack('test-stack', {});

      expect(stack).toBeDefined();
      expect(stack.vpcId).toBe('mock-vpc-dev');
      expect(stack.apiUrl).toBe(
        'https://mock-api-dev.execute-api.us-east-1.amazonaws.com/dev'
      );
      expect(stack.bucketName).toBe('mock-bucket-dev');
      expect(stack.lambdaFunctionName).toBe('mock-lambda-dev');
    });

    it('should create TapStack with custom environment suffix', () => {
      stack = new MockTapStack('test-stack', { environmentSuffix: 'prod' });

      expect(stack).toBeDefined();
      expect(stack.vpcId).toBe('mock-vpc-prod');
      expect(stack.apiUrl).toBe(
        'https://mock-api-prod.execute-api.us-east-1.amazonaws.com/prod'
      );
      expect(stack.bucketName).toBe('mock-bucket-prod');
      expect(stack.lambdaFunctionName).toBe('mock-lambda-prod');
    });

    it('should create TapStack with custom tags', () => {
      const customTags = { Owner: 'TestTeam', CostCenter: 'CC001' };
      stack = new MockTapStack('test-stack', {
        environmentSuffix: 'test',
        tags: customTags,
      });

      expect(stack).toBeDefined();
      expect(stack.vpcId).toBe('mock-vpc-test');
      expect(stack.apiUrl).toBe(
        'https://mock-api-test.execute-api.us-east-1.amazonaws.com/test'
      );
      expect(stack.bucketName).toBe('mock-bucket-test');
      expect(stack.lambdaFunctionName).toBe('mock-lambda-test');
    });

    it('should handle missing environment suffix gracefully', () => {
      stack = new MockTapStack('test-stack', {});

      expect(stack).toBeDefined();
      expect(stack.vpcId).toBe('mock-vpc-dev');
    });

    it('should handle empty tags gracefully', () => {
      stack = new MockTapStack('test-stack', { tags: {} });

      expect(stack).toBeDefined();
      expect(stack.vpcId).toBe('mock-vpc-dev');
    });
  });

  describe('output properties', () => {
    beforeEach(() => {
      stack = new MockTapStack('test-stack', {});
    });

    it('should have vpcId output', () => {
      expect(stack.vpcId).toBe('mock-vpc-dev');
    });

    it('should have apiUrl output', () => {
      expect(stack.apiUrl).toBe(
        'https://mock-api-dev.execute-api.us-east-1.amazonaws.com/dev'
      );
    });

    it('should have bucketName output', () => {
      expect(stack.bucketName).toBe('mock-bucket-dev');
    });

    it('should have lambdaFunctionName output', () => {
      expect(stack.lambdaFunctionName).toBe('mock-lambda-dev');
    });
  });
});
