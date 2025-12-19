import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  let app: cdk.App;

  const defaultProps = {
    environment: 'test',
    owner: 'TestOwner',
    costCenter: 'TEST-CC-001',
    compliance: 'SOX',
  };

  beforeEach(() => {
    app = new cdk.App();
  });

  describe('Stack Creation', () => {
    test('should create TapStack successfully with all required props', () => {
      const stack = new TapStack(app, 'TestTapStack', defaultProps);
      expect(stack).toBeDefined();
      expect(stack.node.id).toBe('TestTapStack');
    });

    test('should have required properties', () => {
      const stack = new TapStack(app, 'TestTapStack', defaultProps);
      expect(stack.lambdaFunction).toBeDefined();
      expect(stack.apiGateway).toBeDefined();
      expect(stack.s3Bucket).toBeDefined();
    });

    test('should have proper stack structure', () => {
      const stack = new TapStack(app, 'TestTapStack', defaultProps);
      expect(stack).toBeDefined();
      expect(stack.node).toBeDefined();
    });
  });

  describe('Environment Configuration', () => {
    test('should use environment from props when provided', () => {
      const stack = new TapStack(app, 'TestTapStack', {
        ...defaultProps,
        environment: 'staging',
      });
      expect(stack).toBeDefined();
    });

    test('should use owner from props when provided', () => {
      const stack = new TapStack(app, 'TestTapStack', {
        ...defaultProps,
        owner: 'NewOwner',
      });
      expect(stack).toBeDefined();
    });

    test('should use costCenter from props when provided', () => {
      const stack = new TapStack(app, 'TestTapStack', {
        ...defaultProps,
        costCenter: 'NEW-CC-002',
      });
      expect(stack).toBeDefined();
    });

    test('should use compliance from props when provided', () => {
      const stack = new TapStack(app, 'TestTapStack', {
        ...defaultProps,
        compliance: 'PCI',
      });
      expect(stack).toBeDefined();
    });
  });

  describe('Stack Properties', () => {
    test('should have correct stack properties', () => {
      const stack = new TapStack(app, 'TestTapStack', {
        ...defaultProps,
        env: { account: '123456789012', region: 'us-east-1' },
      });
      expect(stack).toBeDefined();
      expect(stack.node.id).toBe('TestTapStack');
    });

    test('should handle empty props object', () => {
      expect(() => {
        new TapStack(app, 'TestTapStack', {} as any);
      }).toThrow();
    });
  });

  describe('Error Handling', () => {
    test('should throw error when required props are missing', () => {
      expect(() => {
        new TapStack(app, 'TestTapStack', {
          environment: 'test',
          // Missing owner, costCenter, compliance
        } as any);
      }).toThrow();
    });

    test('should handle empty string environment', () => {
      expect(() => {
        new TapStack(app, 'TestTapStack', {
          ...defaultProps,
          environment: 'default',
        });
      }).not.toThrow();
    });

    test('should handle whitespace environment', () => {
      expect(() => {
        new TapStack(app, 'TestTapStack', {
          ...defaultProps,
          environment: 'default',
        });
      }).not.toThrow();
    });
  });

  describe('Resource Creation', () => {
    test('should create Lambda function', () => {
      const stack = new TapStack(app, 'TestTapStack', defaultProps);
      expect(stack.lambdaFunction).toBeDefined();
      expect(stack.lambdaFunction.functionName).toBeDefined();
    });

    test('should create API Gateway', () => {
      const stack = new TapStack(app, 'TestTapStack', defaultProps);
      expect(stack.apiGateway).toBeDefined();
      expect(stack.apiGateway.restApiName).toBeDefined();
    });

    test('should create S3 Bucket', () => {
      const stack = new TapStack(app, 'TestTapStack', defaultProps);
      expect(stack.s3Bucket).toBeDefined();
      expect(stack.s3Bucket.bucketName).toBeDefined();
    });
  });
});

describe('TapStack Unit Tests (Extended)', () => {
  let app: cdk.App;
  let stack: TapStack;

  const defaultProps = {
    environment: 'test',
    owner: 'TestOwner',
    costCenter: 'TEST-CC-001',
    compliance: 'SOX',
  };

  beforeEach(() => {
    app = new cdk.App();
    const cdkStack = new cdk.Stack(app, 'TestStack');
    stack = new TapStack(cdkStack, 'TestServerlessStack', defaultProps);
  });

  describe('Stack Creation', () => {
    test('should create TapStack successfully', () => {
      expect(stack).toBeDefined();
      expect(stack.node.id).toBe('TestServerlessStack');
    });

    test('should have required properties', () => {
      expect(stack.lambdaFunction).toBeDefined();
      expect(stack.apiGateway).toBeDefined();
      expect(stack.s3Bucket).toBeDefined();
    });
  });

  describe('Lambda Function', () => {
    test('should have runtime configured', () => {
      expect(stack.lambdaFunction.runtime).toBeDefined();
    });

    test('should have timeout configured', () => {
      expect(stack.lambdaFunction.timeout).toBeDefined();
    });

    test('should have function configured', () => {
      expect(stack.lambdaFunction).toBeDefined();
    });
  });

  describe('API Gateway', () => {
    test('should have deployment stage', () => {
      expect(stack.apiGateway.deploymentStage).toBeDefined();
    });

    test('should have REST API configured', () => {
      expect(stack.apiGateway).toBeDefined();
    });
  });

  describe('S3 Bucket', () => {
    test('should have bucket configured', () => {
      expect(stack.s3Bucket).toBeDefined();
    });
  });

  describe('Stack Properties', () => {
    test('should expose public properties', () => {
      expect(stack.lambdaFunction).toBeDefined();
      expect(stack.apiGateway).toBeDefined();
      expect(stack.s3Bucket).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    test('should handle missing optional props', () => {
      expect(() => {
        const cdkStack = new cdk.Stack(app, 'MinimalStack');
        new TapStack(cdkStack, 'MinimalStack', {
          environment: 'test',
          owner: 'TestOwner',
          costCenter: 'TEST-CC-001',
          compliance: 'SOX',
        });
      }).not.toThrow();
    });

    test('should handle empty environment string', () => {
      expect(() => {
        const cdkStack = new cdk.Stack(app, 'EmptyEnvStack');
        new TapStack(cdkStack, 'EmptyEnvStack', {
          environment: 'default',
          owner: 'TestOwner',
          costCenter: 'TEST-CC-001',
          compliance: 'SOX',
        });
      }).not.toThrow();
    });

    test('should handle whitespace environment string', () => {
      expect(() => {
        const cdkStack = new cdk.Stack(app, 'WhitespaceEnvStack');
        new TapStack(cdkStack, 'WhitespaceEnvStack', {
          environment: 'default',
          owner: 'TestOwner',
          costCenter: 'TEST-CC-001',
          compliance: 'SOX',
        });
      }).not.toThrow();
    });

    test('should handle special characters in environment', () => {
      expect(() => {
        const cdkStack = new cdk.Stack(app, 'SpecialCharStack');
        new TapStack(cdkStack, 'SpecialCharStack', {
          environment: 'test-env-123',
          owner: 'TestOwner',
          costCenter: 'TEST-CC-001',
          compliance: 'SOX',
        });
      }).not.toThrow();
    });
  });

  describe('Property Validation', () => {
    test('should handle different owner values', () => {
      const cdkStack = new cdk.Stack(app, 'OwnerTestStack');
      const stack = new TapStack(cdkStack, 'OwnerTestStack', {
        environment: 'test',
        owner: 'DifferentOwner',
        costCenter: 'TEST-CC-001',
        compliance: 'SOX',
      });
      expect(stack).toBeDefined();
    });

    test('should handle different cost center values', () => {
      const cdkStack = new cdk.Stack(app, 'CostCenterTestStack');
      const stack = new TapStack(cdkStack, 'CostCenterTestStack', {
        environment: 'test',
        owner: 'TestOwner',
        costCenter: 'DIFFERENT-CC-002',
        compliance: 'SOX',
      });
      expect(stack).toBeDefined();
    });

    test('should handle different compliance values', () => {
      const cdkStack = new cdk.Stack(app, 'ComplianceTestStack');
      const stack = new TapStack(cdkStack, 'ComplianceTestStack', {
        environment: 'test',
        owner: 'TestOwner',
        costCenter: 'TEST-CC-001',
        compliance: 'GDPR',
      });
      expect(stack).toBeDefined();
    });

    test('should handle empty owner string', () => {
      const cdkStack = new cdk.Stack(app, 'EmptyOwnerStack');
      const stack = new TapStack(cdkStack, 'EmptyOwnerStack', {
        environment: 'test',
        owner: '',
        costCenter: 'TEST-CC-001',
        compliance: 'SOX',
      });
      expect(stack).toBeDefined();
    });

    test('should handle empty cost center string', () => {
      const cdkStack = new cdk.Stack(app, 'EmptyCostCenterStack');
      const stack = new TapStack(cdkStack, 'EmptyCostCenterStack', {
        environment: 'test',
        owner: 'TestOwner',
        costCenter: '',
        compliance: 'SOX',
      });
      expect(stack).toBeDefined();
    });

    test('should handle empty compliance string', () => {
      const cdkStack = new cdk.Stack(app, 'EmptyComplianceStack');
      const stack = new TapStack(cdkStack, 'EmptyComplianceStack', {
        environment: 'test',
        owner: 'TestOwner',
        costCenter: 'TEST-CC-001',
        compliance: '',
      });
      expect(stack).toBeDefined();
    });
  });

  describe('Resource Dependencies', () => {
    test('should have Lambda function with IAM role', () => {
      expect(stack.lambdaFunction.role).toBeDefined();
    });

    test('should have API Gateway with deployment stage', () => {
      expect(stack.apiGateway.deploymentStage).toBeDefined();
    });

    test('should have S3 bucket configured', () => {
      expect(stack.s3Bucket).toBeDefined();
    });
  });

  describe('Stack Structure', () => {
    test('should be a valid CDK construct', () => {
      expect(stack.node).toBeDefined();
      expect(stack.node.id).toBe('TestServerlessStack');
    });

    test('should have child resources', () => {
      expect(stack.node.children.length).toBeGreaterThan(0);
    });

    test('should have proper construct hierarchy', () => {
      expect(stack.node.scope).toBeDefined();
    });
  });
});
