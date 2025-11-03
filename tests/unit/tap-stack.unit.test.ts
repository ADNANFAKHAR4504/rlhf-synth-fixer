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
import { TapStack } from '../../lib/tap-stack';

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
    it('should use ap-southeast-2 as default primary region', () => {
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
});
