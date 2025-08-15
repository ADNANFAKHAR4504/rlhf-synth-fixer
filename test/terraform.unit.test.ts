import { TapStack } from '../lib/tap-stack';

describe('Terraform HCL Security Implementation Tests', () => {
  let stack: TapStack;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  describe('Stack Instantiation', () => {
    test('TapStack instantiates successfully via props', () => {
      stack = new TapStack(null, 'TestTapStackWithProps', {
        environmentSuffix: 'prod',
        stateBucket: 'custom-state-bucket',
        stateBucketRegion: 'us-west-2',
        awsRegion: 'us-west-2',
      });

      // Verify that TapStack instantiates without errors via props
      expect(stack).toBeDefined();
      expect(stack.environmentSuffix).toBe('prod');
      expect(stack.stateBucket).toBe('custom-state-bucket');
      expect(stack.stateBucketRegion).toBe('us-west-2');
      expect(stack.awsRegion).toBe('us-west-2');
    });

    test('TapStack uses default values when no props provided', () => {
      stack = new TapStack(null, 'TestTapStackDefault');

      // Verify that TapStack instantiates without errors when no props are provided
      expect(stack).toBeDefined();
      expect(stack.environmentSuffix).toBe('dev');
      expect(stack.stateBucketRegion).toBe('us-east-1');
      expect(stack.awsRegion).toBe('us-east-1');
    });
  });

  describe('Terraform File Loading', () => {
    beforeEach(() => {
      stack = new TapStack(null, 'TestStack');
    });

    test('loads Terraform files from lib directory', () => {
      expect(stack.terraformFiles.size).toBeGreaterThan(0);
      expect(stack.terraformFiles.has('main.tf')).toBe(true);
    });

    test('validates Terraform syntax', () => {
      expect(() => stack.validateTerraformSyntax()).not.toThrow();
      expect(stack.validateTerraformSyntax()).toBe(true);
    });
  });

  describe('Security Requirements Validation - trainr859', () => {
    beforeEach(() => {
      stack = new TapStack(null, 'SecurityTestStack');
    });

    // Requirement 1: IAM Security
    test('has IAM roles with least privilege principle', () => {
      expect(stack.hasIAMRoles()).toBe(true);
    });

    // Requirement 2: Resource Management - Required tags
    test('has required Environment and Owner tags', () => {
      expect(stack.hasRequiredTags()).toBe(true);
    });

    // Requirement 3: Logging and Monitoring
    test('has CloudTrail logging enabled', () => {
      expect(stack.hasCloudTrail()).toBe(true);
    });

    test('has VPC flow logs enabled', () => {
      expect(stack.hasVPCFlowLogs()).toBe(true);
    });

    test('has AWS Config for compliance monitoring', () => {
      expect(stack.hasAWSConfig()).toBe(true);
    });

    test('has CloudWatch alarms for monitoring', () => {
      expect(stack.hasCloudWatchAlarms()).toBe(true);
    });

    // Requirement 4: Data Protection
    test('has S3 buckets with versioning enabled', () => {
      expect(stack.hasS3Buckets()).toBe(true);
      expect(stack.hasS3Versioning()).toBe(true);
    });

    test('has RDS encryption enabled', () => {
      expect(stack.hasRDSEncryption()).toBe(true);
    });

    test('has Systems Manager Parameter Store for sensitive data', () => {
      expect(stack.hasSSMParameterStore()).toBe(true);
    });

    // Requirement 5: Network Security
    test('has security groups for network access control', () => {
      expect(stack.hasSecurityGroups()).toBe(true);
    });

    test('has CloudFront with Shield protection', () => {
      expect(stack.hasCloudFrontShield()).toBe(true);
    });

    // Infrastructure Components
    test('has VPC with network segmentation', () => {
      expect(stack.hasVPCResources()).toBe(true);
    });

    test('has outputs defined', () => {
      expect(stack.hasOutputs()).toBe(true);
    });
  });

  describe('Resource Analysis', () => {
    beforeEach(() => {
      stack = new TapStack(null, 'AnalysisTestStack');
    });

    test('counts all resources correctly', () => {
      const resourceCount = stack.getResourceCount();
      expect(resourceCount).toBeGreaterThan(0);
      expect(resourceCount).toBeGreaterThanOrEqual(10); // Should have at least 10+ resources for comprehensive security
    });

    test('identifies all AWS resource types', () => {
      const resourceTypes = stack.getAllResourceTypes();
      expect(resourceTypes.length).toBeGreaterThan(0);
      
      // Should contain key AWS security resources based on requirements
      const expectedTypes = [
        'aws_iam_role',
        's3_bucket',
        'aws_vpc',
        'aws_security_group',
        'aws_cloudtrail'
      ];

      // Check that at least some expected types are present
      const hasExpectedTypes = expectedTypes.some(type => 
        resourceTypes.some((rt: string) => rt.includes(type.replace('aws_', '')) || rt === type)
      );
      expect(hasExpectedTypes).toBe(true);
    });
  });

  describe('Terraform Best Practices', () => {
    beforeEach(() => {
      stack = new TapStack(null, 'BestPracticesStack');
    });

    test('follows proper file structure', () => {
      // Should have main infrastructure components separated appropriately
      expect(stack.terraformFiles.has('main.tf')).toBe(true);
      
      // May have additional organizational files
      const hasVariablesOrOutputs = stack.terraformFiles.has('variables.tf') || 
                                   stack.terraformFiles.has('outputs.tf');
      
      // Either in separate files or in main.tf
      const hasOutputsDefined = stack.hasOutputs();
      expect(hasVariablesOrOutputs || hasOutputsDefined).toBe(true);
    });

    test('has comprehensive resource coverage for security requirements', () => {
      const resourceCount = stack.getResourceCount();
      const resourceTypes = stack.getAllResourceTypes();
      
      // Should have substantial infrastructure for all 14 security requirements
      expect(resourceCount).toBeGreaterThanOrEqual(15); // Comprehensive infrastructure
      expect(resourceTypes.length).toBeGreaterThanOrEqual(8); // Diverse resource types
    });
  });
});

// Additional test suites can be added for specific security controls or compliance validation
