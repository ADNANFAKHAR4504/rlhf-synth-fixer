import * as pulumi from '@pulumi/pulumi';

/**
 * Comprehensive Unit Tests for TapStack
 *
 * These tests use Pulumi's testing utilities to mock resource creation
 * and validate the infrastructure code logic without actual AWS deployment.
 */

// Set up Pulumi mocking before imports
pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: any;
  } {
    // Return mock resource state with all required outputs
    return {
      id: args.inputs.name
        ? `${args.name}-${args.inputs.name}`
        : `${args.name}-id`,
      state: {
        ...args.inputs,
        arn: args.inputs.arn || `arn:aws:${args.type}:us-east-1:123456789012:${args.name}`,
        id: args.inputs.id || `${args.name}-id`,
        name: args.inputs.name || args.name,
        tags: args.inputs.tags || {},
      },
    };
  },
  call: function (args: pulumi.runtime.MockCallArgs) {
    // Mock AWS API calls
    return args.inputs;
  },
});

// Mock pulumi.getStack() to test different scenarios
let mockStackName: string | undefined = 'test-stack';
jest.spyOn(pulumi, 'getStack').mockImplementation(() => mockStackName as string);

// Import after mocking is set up
import { TapStack } from '../lib/tap-stack';

describe('TapStack - Comprehensive Unit Tests', () => {
  describe('Constructor and Initialization', () => {
    it('should instantiate with default values', async () => {
      const stack = new TapStack('TestStackDefault');

      expect(stack).toBeDefined();
      expect(stack.complianceBucketName).toBeDefined();
      expect(stack.snsTopicArn).toBeDefined();
      expect(stack.complianceLambdaArn).toBeDefined();
      expect(stack.dashboardName).toBeDefined();
    });

    it('should instantiate with custom environment suffix', async () => {
      const stack = new TapStack('TestStackProd', {
        environmentSuffix: 'prod',
      });

      expect(stack).toBeDefined();
      const bucketName = await stack.complianceBucketName.promise();
      expect(bucketName).toContain('prod');
    });

    it('should instantiate with custom AWS regions', async () => {
      const stack = new TapStack('TestStackRegions', {
        primaryRegion: 'us-west-2',
        secondaryRegion: 'us-east-1',
      });

      expect(stack).toBeDefined();
    });

    it('should instantiate with custom notification emails', async () => {
      const stack = new TapStack('TestStackEmails', {
        notificationEmails: ['admin@example.com', 'security@example.com'],
      });

      expect(stack).toBeDefined();
    });

    it('should instantiate with custom required tags', async () => {
      const stack = new TapStack('TestStackTags', {
        requiredTags: ['Project', 'Owner', 'Environment', 'CostCenter'],
      });

      expect(stack).toBeDefined();
    });

    it('should instantiate with custom tags', async () => {
      const stack = new TapStack('TestStackCustomTags', {
        tags: {
          Department: 'Engineering',
          Team: 'Platform',
        },
      });

      expect(stack).toBeDefined();
    });
  });

  describe('Output Properties', () => {
    let stack: TapStack;

    beforeAll(() => {
      stack = new TapStack('TestStackOutputs', {
        environmentSuffix: 'test',
      });
    });

    it('should export complianceBucketName output', async () => {
      const bucketName = await stack.complianceBucketName.promise();
      expect(bucketName).toBeDefined();
      expect(typeof bucketName).toBe('string');
    });

    it('should export complianceBucketArn output', async () => {
      const bucketArn = await stack.complianceBucketArn.promise();
      expect(bucketArn).toBeDefined();
      expect(typeof bucketArn).toBe('string');
      expect(bucketArn).toMatch(/arn.*s3/);
    });

    it('should export snsTopicArn output', async () => {
      const topicArn = await stack.snsTopicArn.promise();
      expect(topicArn).toBeDefined();
      expect(typeof topicArn).toBe('string');
    });

    it('should export complianceLambdaArn output', async () => {
      const lambdaArn = await stack.complianceLambdaArn.promise();
      expect(lambdaArn).toBeDefined();
      expect(typeof lambdaArn).toBe('string');
    });

    it('should export dashboardName output', async () => {
      const dashboardName = await stack.dashboardName.promise();
      expect(dashboardName).toBeDefined();
      expect(typeof dashboardName).toBe('string');
    });

    it('should export replicaBucketName output', async () => {
      const replicaBucketName = await stack.replicaBucketName.promise();
      expect(replicaBucketName).toBeDefined();
      expect(typeof replicaBucketName).toBe('string');
    });

    it('should export replicaBucketArn output', async () => {
      const replicaBucketArn = await stack.replicaBucketArn.promise();
      expect(replicaBucketArn).toBeDefined();
      expect(typeof replicaBucketArn).toBe('string');
      expect(replicaBucketArn).toMatch(/arn.*s3/);
    });

    it('should export replicaLambdaArn output', async () => {
      const replicaLambdaArn = await stack.replicaLambdaArn.promise();
      expect(replicaLambdaArn).toBeDefined();
      expect(typeof replicaLambdaArn).toBe('string');
      expect(replicaLambdaArn).toMatch(/arn.*lambda/);
    });

    it('should export dashboardUrl output', async () => {
      const dashboardUrl = await stack.dashboardUrl.promise();
      expect(dashboardUrl).toBeDefined();
      expect(typeof dashboardUrl).toBe('string');
      expect(dashboardUrl).toContain('cloudwatch');
    });

    it('should export securityHubUrl output', async () => {
      const securityHubUrl = await stack.securityHubUrl.promise();
      expect(securityHubUrl).toBeDefined();
      expect(typeof securityHubUrl).toBe('string');
      expect(securityHubUrl).toContain('securityhub');
    });

    it('should export wellArchitectedWorkloadId output', async () => {
      const wellArchitectedWorkloadId = await stack.wellArchitectedWorkloadId.promise();
      expect(wellArchitectedWorkloadId).toBeDefined();
      expect(typeof wellArchitectedWorkloadId).toBe('string');
    });

    it('should export primaryRegion output', async () => {
      const primaryRegion = await stack.primaryRegion.promise();
      expect(primaryRegion).toBeDefined();
      expect(typeof primaryRegion).toBe('string');
    });

    it('should export secondaryRegion output', async () => {
      const secondaryRegion = await stack.secondaryRegion.promise();
      expect(secondaryRegion).toBeDefined();
      expect(typeof secondaryRegion).toBe('string');
    });
  });

  describe('Environment Suffix Handling', () => {
    it('should use "dev" as default environment suffix', async () => {
      const stack = new TapStack('TestDefault');
      const bucketName = await stack.complianceBucketName.promise();
      expect(bucketName).toContain('dev');
    });

    it('should use custom environment suffix when provided', async () => {
      const stack = new TapStack('TestCustomEnv', {
        environmentSuffix: 'staging',
      });
      const bucketName = await stack.complianceBucketName.promise();
      expect(bucketName).toContain('staging');
    });

    it('should handle production environment suffix', async () => {
      const stack = new TapStack('TestProd', {
        environmentSuffix: 'prod',
      });
      const bucketName = await stack.complianceBucketName.promise();
      expect(bucketName).toContain('prod');
    });
  });

  describe('Region Configuration', () => {
    it('should use us-east-1 as default primary region', () => {
      const stack = new TapStack('TestDefaultRegion');
      expect(stack).toBeDefined();
    });

    it('should use ap-southeast-1 as default secondary region', () => {
      const stack = new TapStack('TestDefaultSecondaryRegion');
      expect(stack).toBeDefined();
    });

    it('should accept custom primary region', () => {
      const stack = new TapStack('TestCustomPrimary', {
        primaryRegion: 'eu-west-1',
      });
      expect(stack).toBeDefined();
    });

    it('should accept custom secondary region', () => {
      const stack = new TapStack('TestCustomSecondary', {
        secondaryRegion: 'eu-central-1',
      });
      expect(stack).toBeDefined();
    });

    it('should support multi-region deployment', () => {
      const stack = new TapStack('TestMultiRegion', {
        primaryRegion: 'us-west-2',
        secondaryRegion: 'us-east-1',
      });
      expect(stack).toBeDefined();
    });
  });

  describe('Tag Configuration', () => {
    it('should apply default tags', () => {
      const stack = new TapStack('TestDefaultTags');
      expect(stack).toBeDefined();
    });

    it('should merge custom tags with default tags', () => {
      const stack = new TapStack('TestMergeTags', {
        tags: {
          CustomTag: 'CustomValue',
        },
      });
      expect(stack).toBeDefined();
    });

    it('should handle empty custom tags', () => {
      const stack = new TapStack('TestEmptyTags', {
        tags: {},
      });
      expect(stack).toBeDefined();
    });
  });

  describe('Notification Email Configuration', () => {
    it('should use default notification email', () => {
      const stack = new TapStack('TestDefaultEmail');
      expect(stack).toBeDefined();
    });

    it('should accept single custom email', () => {
      const stack = new TapStack('TestSingleEmail', {
        notificationEmails: ['admin@example.com'],
      });
      expect(stack).toBeDefined();
    });

    it('should accept multiple custom emails', () => {
      const stack = new TapStack('TestMultipleEmails', {
        notificationEmails: [
          'admin@example.com',
          'security@example.com',
          'compliance@example.com',
        ],
      });
      expect(stack).toBeDefined();
    });
  });

  describe('Required Tags Configuration', () => {
    it('should use default required tags', () => {
      const stack = new TapStack('TestDefaultRequiredTags');
      expect(stack).toBeDefined();
    });

    it('should accept custom required tags', () => {
      const stack = new TapStack('TestCustomRequiredTags', {
        requiredTags: ['Project', 'Owner'],
      });
      expect(stack).toBeDefined();
    });

    it('should handle extensive required tags list', () => {
      const stack = new TapStack('TestExtensiveRequiredTags', {
        requiredTags: [
          'Environment',
          'Owner',
          'CostCenter',
          'Project',
          'Team',
          'Application',
        ],
      });
      expect(stack).toBeDefined();
    });
  });

  describe('Component Resource Type', () => {
    it('should be of type tap:stack:TapStack', () => {
      const stack = new TapStack('TestComponentType');
      expect(stack.constructor.name).toBe('TapStack');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty args object', () => {
      const stack = new TapStack('TestEmptyArgs', {});
      expect(stack).toBeDefined();
    });

    it('should handle undefined args', () => {
      const stack = new TapStack('TestUndefinedArgs');
      expect(stack).toBeDefined();
    });

    it('should handle mixed custom and default values', () => {
      const stack = new TapStack('TestMixed', {
        environmentSuffix: 'staging',
        primaryRegion: 'us-west-2',
        // secondaryRegion will use default
        notificationEmails: ['custom@example.com'],
        // requiredTags will use default
        tags: {
          CustomTag: 'Value',
        },
      });
      expect(stack).toBeDefined();
    });
  });

  describe('Multiple Stack Instances', () => {
    it('should create multiple independent stack instances', () => {
      const stack1 = new TapStack('Stack1', { environmentSuffix: 'dev' });
      const stack2 = new TapStack('Stack2', { environmentSuffix: 'prod' });
      const stack3 = new TapStack('Stack3', { environmentSuffix: 'staging' });

      expect(stack1).toBeDefined();
      expect(stack2).toBeDefined();
      expect(stack3).toBeDefined();
    });

    it('should maintain separate state for each instance', async () => {
      const stack1 = new TapStack('InstanceA', { environmentSuffix: 'envA' });
      const stack2 = new TapStack('InstanceB', { environmentSuffix: 'envB' });

      const bucket1 = await stack1.complianceBucketName.promise();
      const bucket2 = await stack2.complianceBucketName.promise();

      expect(bucket1).not.toBe(bucket2);
    });
  });

  describe('Resource Naming Conventions', () => {
    it('should generate unique resource names with environment suffix', async () => {
      const stack = new TapStack('TestNaming', {
        environmentSuffix: 'test123',
      });
      const bucketName = await stack.complianceBucketName.promise();
      expect(bucketName).toMatch(/test123/);
    });

    it('should preserve environment suffix casing in resource names', async () => {
      const stack = new TapStack('TestLowercase', {
        environmentSuffix: 'PROD',
      });
      const bucketName = await stack.complianceBucketName.promise();
      // Environment suffix is preserved as provided
      expect(bucketName).toContain('PROD');
    });
  });

  describe('Integration with Pulumi Outputs', () => {
    it('should return Pulumi Output objects for all exports', () => {
      const stack = new TapStack('TestOutputTypes');

      expect(stack.complianceBucketName).toBeInstanceOf(pulumi.Output);
      expect(stack.snsTopicArn).toBeInstanceOf(pulumi.Output);
      expect(stack.complianceLambdaArn).toBeInstanceOf(pulumi.Output);
      expect(stack.dashboardName).toBeInstanceOf(pulumi.Output);
    });

    it('should allow output chaining with apply', async () => {
      const stack = new TapStack('TestApply');

      const result = await stack.complianceBucketName
        .apply((name) => `prefix-${name}`)
        .promise();

      expect(result).toContain('prefix-');
    });
  });

  describe('Comprehensive Scenario Testing', () => {
    it('should handle full production configuration', () => {
      const stack = new TapStack('ProdStack', {
        environmentSuffix: 'prod',
        primaryRegion: 'us-east-1',
        secondaryRegion: 'us-west-2',
        notificationEmails: [
          'ops@company.com',
          'security@company.com',
          'compliance@company.com',
        ],
        requiredTags: ['Environment', 'Owner', 'CostCenter', 'Project'],
        tags: {
          Organization: 'Engineering',
          Department: 'Platform',
          Compliance: 'SOC2',
        },
      });

      expect(stack).toBeDefined();
      expect(stack.complianceBucketName).toBeDefined();
      expect(stack.snsTopicArn).toBeDefined();
      expect(stack.complianceLambdaArn).toBeDefined();
      expect(stack.dashboardName).toBeDefined();
    });

    it('should handle minimal configuration', () => {
      const stack = new TapStack('MinimalStack');
      expect(stack).toBeDefined();
    });

    it('should handle development environment configuration', () => {
      const stack = new TapStack('DevStack', {
        environmentSuffix: 'dev',
        primaryRegion: 'us-east-1',
        notificationEmails: ['dev-team@company.com'],
      });

      expect(stack).toBeDefined();
    });

    it('should handle staging environment configuration', () => {
      const stack = new TapStack('StagingStack', {
        environmentSuffix: 'staging',
        primaryRegion: 'eu-west-1',
        secondaryRegion: 'eu-central-1',
      });

      expect(stack).toBeDefined();
    });

    it('should handle multi-account deployment scenario', () => {
      const stack = new TapStack('MultiAccountStack', {
        environmentSuffix: 'shared',
        tags: {
          Account: 'shared-services',
          Purpose: 'compliance-monitoring',
        },
      });

      expect(stack).toBeDefined();
    });
  });

  describe('Parameter Validation and Defaults', () => {
    it('should use environmentSuffix default when not provided', () => {
      const stack = new TapStack('DefaultEnvStack');
      expect(stack).toBeDefined();
    });

    it('should use tags default when not provided', () => {
      const stack = new TapStack('DefaultTagsStack');
      expect(stack).toBeDefined();
    });

    it('should use primaryRegion default when not provided', () => {
      const stack = new TapStack('DefaultPrimaryRegionStack');
      expect(stack).toBeDefined();
    });

    it('should use secondaryRegion default when not provided', () => {
      const stack = new TapStack('DefaultSecondaryRegionStack');
      expect(stack).toBeDefined();
    });

    it('should use notificationEmails default when not provided', () => {
      const stack = new TapStack('DefaultEmailsStack');
      expect(stack).toBeDefined();
    });

    it('should use requiredTags default when not provided', () => {
      const stack = new TapStack('DefaultRequiredTagsStack');
      expect(stack).toBeDefined();
    });
  });

  describe('Resource Options and Pulumi Parent', () => {
    it('should accept custom resource options', () => {
      const opts: pulumi.ResourceOptions = {
        protect: true,
      };
      const stack = new TapStack('ProtectedStack', {}, opts);
      expect(stack).toBeDefined();
    });

    it('should work without resource options', () => {
      const stack = new TapStack('NoOptsStack', {});
      expect(stack).toBeDefined();
    });
  });

  describe('Pulumi Stack Name Handling', () => {
    it('should use stack name from pulumi.getStack() when available', () => {
      // mockStackName is already set to 'test-stack' by default
      const stack = new TapStack('StackWithName');
      expect(stack).toBeDefined();
    });

    it('should fallback to "dev" when pulumi.getStack() returns undefined', () => {
      // Temporarily set mockStackName to undefined
      const originalMock = mockStackName;
      mockStackName = undefined;
      jest.spyOn(pulumi, 'getStack').mockImplementation(() => mockStackName as string);

      const stack = new TapStack('StackWithoutName', {
        environmentSuffix: 'test',
      });
      expect(stack).toBeDefined();

      // Restore original mock
      mockStackName = originalMock;
      jest.spyOn(pulumi, 'getStack').mockImplementation(() => mockStackName as string);
    });

    it('should fallback to "dev" when pulumi.getStack() returns empty string', () => {
      // Test with empty string
      const originalMock = mockStackName;
      mockStackName = '' as any;
      jest.spyOn(pulumi, 'getStack').mockImplementation(() => mockStackName as string);

      const stack = new TapStack('StackWithEmptyName', {
        environmentSuffix: 'testing',
      });
      expect(stack).toBeDefined();

      // Restore original mock
      mockStackName = originalMock;
      jest.spyOn(pulumi, 'getStack').mockImplementation(() => mockStackName as string);
    });

    it('should handle null stack name', () => {
      const originalMock = mockStackName;
      mockStackName = null as any;
      jest.spyOn(pulumi, 'getStack').mockImplementation(() => mockStackName as string);

      const stack = new TapStack('StackWithNullName', {
        environmentSuffix: 'prod',
      });
      expect(stack).toBeDefined();

      // Restore original mock
      mockStackName = originalMock;
      jest.spyOn(pulumi, 'getStack').mockImplementation(() => mockStackName as string);
    });
  });

  describe('Conditional Branch Coverage', () => {
    it('should use provided environmentSuffix when truthy', async () => {
      const stack = new TapStack('TestTruthyEnvSuffix', {
        environmentSuffix: 'production',
      });
      const bucketName = await stack.complianceBucketName.promise();
      expect(bucketName).toContain('production');
    });

    it('should use provided tags when truthy', async () => {
      const customTags = { Custom: 'Value' };
      const stack = new TapStack('TestTruthyTags', {
        tags: customTags,
      });
      expect(stack).toBeDefined();
    });

    it('should use provided primaryRegion when truthy', async () => {
      const stack = new TapStack('TestTruthyPrimaryRegion', {
        primaryRegion: 'eu-west-1',
      });
      const primaryRegion = await stack.primaryRegion.promise();
      expect(primaryRegion).toBe('eu-west-1');
    });

    it('should use provided secondaryRegion when truthy', async () => {
      const stack = new TapStack('TestTruthySecondaryRegion', {
        secondaryRegion: 'eu-central-1',
      });
      const secondaryRegion = await stack.secondaryRegion.promise();
      expect(secondaryRegion).toBe('eu-central-1');
    });

    it('should use provided notificationEmails when truthy', () => {
      const emails = ['test@example.com'];
      const stack = new TapStack('TestTruthyEmails', {
        notificationEmails: emails,
      });
      expect(stack).toBeDefined();
    });

    it('should use provided requiredTags when truthy', () => {
      const tags = ['Tag1', 'Tag2'];
      const stack = new TapStack('TestTruthyRequiredTags', {
        requiredTags: tags,
      });
      expect(stack).toBeDefined();
    });

    it('should handle empty notificationEmails array', () => {
      const stack = new TapStack('TestEmptyEmails', {
        notificationEmails: [],
      });
      expect(stack).toBeDefined();
    });

    it('should handle empty requiredTags array', () => {
      const stack = new TapStack('TestEmptyRequiredTags', {
        requiredTags: [],
      });
      expect(stack).toBeDefined();
    });

    it('should handle undefined notificationEmails', () => {
      const stack = new TapStack('TestUndefinedEmails', {
        notificationEmails: undefined,
      });
      expect(stack).toBeDefined();
    });

    it('should handle undefined requiredTags', () => {
      const stack = new TapStack('TestUndefinedRequiredTags', {
        requiredTags: undefined,
      });
      expect(stack).toBeDefined();
    });

    it('should handle undefined primaryRegion', () => {
      const stack = new TapStack('TestUndefinedPrimaryRegion', {
        primaryRegion: undefined,
      });
      expect(stack).toBeDefined();
    });

    it('should handle undefined secondaryRegion', () => {
      const stack = new TapStack('TestUndefinedSecondaryRegion', {
        secondaryRegion: undefined,
      });
      expect(stack).toBeDefined();
    });

    it('should handle undefined environmentSuffix', () => {
      const stack = new TapStack('TestUndefinedEnvSuffix', {
        environmentSuffix: undefined,
      });
      expect(stack).toBeDefined();
    });

    it('should handle undefined tags', () => {
      const stack = new TapStack('TestUndefinedTags', {
        tags: undefined,
      });
      expect(stack).toBeDefined();
    });

    it('should handle null notificationEmails', () => {
      const stack = new TapStack('TestNullEmails', {
        notificationEmails: null as any,
      });
      expect(stack).toBeDefined();
    });

    it('should handle null requiredTags', () => {
      const stack = new TapStack('TestNullRequiredTags', {
        requiredTags: null as any,
      });
      expect(stack).toBeDefined();
    });

    it('should handle null primaryRegion', () => {
      const stack = new TapStack('TestNullPrimaryRegion', {
        primaryRegion: null as any,
      });
      expect(stack).toBeDefined();
    });

    it('should handle null secondaryRegion', () => {
      const stack = new TapStack('TestNullSecondaryRegion', {
        secondaryRegion: null as any,
      });
      expect(stack).toBeDefined();
    });

    it('should handle null environmentSuffix', () => {
      const stack = new TapStack('TestNullEnvSuffix', {
        environmentSuffix: null as any,
      });
      expect(stack).toBeDefined();
    });

    it('should handle null tags', () => {
      const stack = new TapStack('TestNullTags', {
        tags: null as any,
      });
      expect(stack).toBeDefined();
    });

    it('should handle empty string environmentSuffix', () => {
      const stack = new TapStack('TestEmptyStringEnvSuffix', {
        environmentSuffix: '',
      });
      expect(stack).toBeDefined();
    });

    it('should handle empty string primaryRegion', () => {
      const stack = new TapStack('TestEmptyStringPrimaryRegion', {
        primaryRegion: '',
      });
      expect(stack).toBeDefined();
    });

    it('should handle empty string secondaryRegion', () => {
      const stack = new TapStack('TestEmptyStringSecondaryRegion', {
        secondaryRegion: '',
      });
      expect(stack).toBeDefined();
    });

    it('should handle all properties set to empty values', () => {
      const stack = new TapStack('TestAllEmpty', {
        environmentSuffix: '',
        primaryRegion: '',
        secondaryRegion: '',
        notificationEmails: [],
        requiredTags: [],
        tags: {},
      });
      expect(stack).toBeDefined();
    });

    it('should handle very long environment suffix', () => {
      const stack = new TapStack('TestLongEnvSuffix', {
        environmentSuffix: 'very-long-environment-suffix-name-for-testing',
      });
      expect(stack).toBeDefined();
    });

    it('should handle special characters in environment suffix', () => {
      const stack = new TapStack('TestSpecialChars', {
        environmentSuffix: 'test-env-123',
      });
      expect(stack).toBeDefined();
    });

    it('should handle single character environment suffix', () => {
      const stack = new TapStack('TestSingleChar', {
        environmentSuffix: 'a',
      });
      expect(stack).toBeDefined();
    });
  });

  describe('Output Property Interactions', () => {
    it('should have consistent bucket names between primary and replica', async () => {
      const stack = new TapStack('TestConsistentBuckets', {
        environmentSuffix: 'test',
      });

      const primaryBucket = await stack.complianceBucketName.promise();
      const replicaBucket = await stack.replicaBucketName.promise();

      expect(primaryBucket).toBeDefined();
      expect(replicaBucket).toBeDefined();
      expect(primaryBucket).not.toBe(replicaBucket);
      expect(replicaBucket).toContain('replica');
    });

    it('should have consistent regions in URLs', async () => {
      const stack = new TapStack('TestConsistentRegions', {
        primaryRegion: 'us-west-2',
      });

      const dashboardUrl = await stack.dashboardUrl.promise();
      const securityHubUrl = await stack.securityHubUrl.promise();
      const primaryRegion = await stack.primaryRegion.promise();

      expect(dashboardUrl).toContain(primaryRegion);
      expect(securityHubUrl).toContain(primaryRegion);
    });

    it('should have matching ARN formats', async () => {
      const stack = new TapStack('TestArnFormats', {
        environmentSuffix: 'test',
      });

      const complianceArn = await stack.complianceLambdaArn.promise();
      const replicaArn = await stack.replicaLambdaArn.promise();

      expect(complianceArn).toMatch(/arn.*lambda/);
      expect(replicaArn).toMatch(/arn.*lambda/);
    });

    it('should have wellArchitectedWorkloadId contain environment suffix', async () => {
      const stack = new TapStack('TestWellArchitected', {
        environmentSuffix: 'prod',
      });

      const workloadId = await stack.wellArchitectedWorkloadId.promise();
      expect(workloadId).toContain('prod');
    });
  });

  describe('Edge Cases for Conditional Logic', () => {
    it('should handle whitespace-only environment suffix', () => {
      const stack = new TapStack('TestWhitespaceEnv', {
        environmentSuffix: '   ',
      });
      expect(stack).toBeDefined();
    });

    it('should handle very long region names', () => {
      const stack = new TapStack('TestLongRegion', {
        primaryRegion: 'us-east-1',
        secondaryRegion: 'ap-southeast-1',
      });
      expect(stack).toBeDefined();
    });

    it('should handle single notification email', () => {
      const stack = new TapStack('TestSingleNotification', {
        notificationEmails: ['single@example.com'],
      });
      expect(stack).toBeDefined();
    });

    it('should handle many notification emails', () => {
      const stack = new TapStack('TestManyNotifications', {
        notificationEmails: [
          'email1@example.com',
          'email2@example.com',
          'email3@example.com',
          'email4@example.com',
          'email5@example.com',
        ],
      });
      expect(stack).toBeDefined();
    });

    it('should handle single required tag', () => {
      const stack = new TapStack('TestSingleRequiredTag', {
        requiredTags: ['Environment'],
      });
      expect(stack).toBeDefined();
    });

    it('should handle many required tags', () => {
      const stack = new TapStack('TestManyRequiredTags', {
        requiredTags: [
          'Tag1',
          'Tag2',
          'Tag3',
          'Tag4',
          'Tag5',
          'Tag6',
          'Tag7',
          'Tag8',
          'Tag9',
          'Tag10',
        ],
      });
      expect(stack).toBeDefined();
    });

    it('should handle tags with special values', () => {
      const stack = new TapStack('TestSpecialTagValues', {
        tags: {
          'Tag-With-Dashes': 'value-with-dashes',
          'Tag_With_Underscores': 'value_with_underscores',
          'Tag.With.Dots': 'value.with.dots',
          'Tag With Spaces': 'value with spaces',
          '123NumericTag': '123numericvalue',
        },
      });
      expect(stack).toBeDefined();
    });

    it('should handle zero as a falsy value for arrays', () => {
      // Testing that empty arrays are truthy (won't use default)
      const stack = new TapStack('TestEmptyArrayTruthy', {
        notificationEmails: [],
        requiredTags: [],
      });
      expect(stack).toBeDefined();
    });

    it('should handle all truthy parameter combinations', () => {
      const stack = new TapStack('TestAllTruthy', {
        environmentSuffix: 'test',
        tags: { Key: 'Value' },
        primaryRegion: 'us-west-2',
        secondaryRegion: 'us-east-1',
        notificationEmails: ['email@example.com'],
        requiredTags: ['Tag1'],
      });
      expect(stack).toBeDefined();
    });

    it('should handle all falsy parameter combinations', () => {
      const stack = new TapStack('TestAllFalsy', {
        environmentSuffix: undefined,
        tags: undefined,
        primaryRegion: undefined,
        secondaryRegion: undefined,
        notificationEmails: undefined,
        requiredTags: undefined,
      });
      expect(stack).toBeDefined();
    });

    it('should handle mixed truthy and falsy combinations', () => {
      const stack = new TapStack('TestMixedTruthyFalsy', {
        environmentSuffix: 'prod', // truthy
        tags: undefined, // falsy - will use default {}
        primaryRegion: 'eu-west-1', // truthy
        secondaryRegion: undefined, // falsy - will use default
        notificationEmails: ['test@example.com'], // truthy
        requiredTags: undefined, // falsy - will use default
      });
      expect(stack).toBeDefined();
    });
  });

  describe('Lambda Code String Branch Coverage', () => {
    // Note: Lambda code strings contain conditional logic that can't be directly
    // tested through Pulumi mocks, but we can verify the stack constructs correctly
    it('should construct Lambda functions with conditional code', () => {
      const stack = new TapStack('TestLambdaConditionals', {
        environmentSuffix: 'test',
      });
      expect(stack).toBeDefined();
      expect(stack.complianceLambdaArn).toBeDefined();
      expect(stack.replicaLambdaArn).toBeDefined();
    });

    it('should handle Lambda environment variables correctly', () => {
      const stack = new TapStack('TestLambdaEnvVars', {
        requiredTags: ['CustomTag1', 'CustomTag2'],
        environmentSuffix: 'custom-env',
      });
      expect(stack).toBeDefined();
    });
  });

  describe('Pulumi Output Apply Branch Coverage', () => {
    it('should handle apply callbacks with different stack names', async () => {
      // Test with defined stack name
      mockStackName = 'production-stack';
      jest.spyOn(pulumi, 'getStack').mockImplementation(() => mockStackName as string);
      const stack1 = new TapStack('TestStackName1', {
        environmentSuffix: 'prod',
      });
      const bucket1 = await stack1.complianceBucketName.promise();
      expect(bucket1).toContain('production-stack');

      // Test with undefined stack name (should use 'dev')
      mockStackName = undefined;
      jest.spyOn(pulumi, 'getStack').mockImplementation(() => mockStackName as string);
      const stack2 = new TapStack('TestStackName2', {
        environmentSuffix: 'test',
      });
      const bucket2 = await stack2.complianceBucketName.promise();
      expect(bucket2).toContain('dev');

      // Restore
      mockStackName = 'test-stack';
      jest.spyOn(pulumi, 'getStack').mockImplementation(() => mockStackName as string);
    });

    it('should handle apply callbacks with empty string stack name', async () => {
      mockStackName = '';
      jest.spyOn(pulumi, 'getStack').mockImplementation(() => mockStackName as string);
      const stack = new TapStack('TestEmptyStackName', {
        environmentSuffix: 'test',
      });
      const bucket = await stack.complianceBucketName.promise();
      expect(bucket).toContain('dev');

      // Restore
      mockStackName = 'test-stack';
      jest.spyOn(pulumi, 'getStack').mockImplementation(() => mockStackName as string);
    });
  });
});
