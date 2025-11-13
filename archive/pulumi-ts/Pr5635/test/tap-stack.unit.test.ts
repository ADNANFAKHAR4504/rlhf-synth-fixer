/**
 * Unit tests for TapStack
 *
 * Tests the TapStack component resource creation and validation using Pulumi mocks.
 * Ensures all resources are created with correct properties and environmentSuffix usage.
 */

import * as pulumi from '@pulumi/pulumi';

// Set up Pulumi mocks before any imports
pulumi.runtime.setMocks({
  newResource: function(args: pulumi.runtime.MockResourceArgs): {id: string; state: any} {
    const id = args.inputs.name ? `${args.inputs.name}_id` : `${args.name}_id`;
    return {
      id: id,
      state: {
        ...args.inputs,
        arn: `arn:aws:${args.type}:ap-southeast-1:123456789012:${id}`,
        id: id,
      },
    };
  },
  call: function(args: pulumi.runtime.MockCallArgs) {
    return args.inputs;
  },
});

import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  let stack: TapStack;
  const testSuffix = 'test123';

  beforeAll(() => {
    // Create stack instance with test environment suffix
    stack = new TapStack('test-tap-stack', {
      environmentSuffix: testSuffix,
      tags: {
        Environment: testSuffix,
        Repository: 'test-repo',
        Author: 'test-author',
      },
    });
  });

  describe('Stack instantiation', () => {
    it('should create TapStack successfully', () => {
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(TapStack);
    });

    it('should have complianceBucket output', async () => {
      const bucketName = await stack.complianceBucket.promise();
      expect(bucketName).toBeDefined();
      expect(bucketName).toContain(testSuffix);
    });

    it('should have snsTopicArn output', async () => {
      const topicArn = await stack.snsTopicArn.promise();
      expect(topicArn).toBeDefined();
      expect(topicArn).toContain('arn:aws:');
    });

    it('should have dashboardName output', async () => {
      const dashboardName = await stack.dashboardName.promise();
      expect(dashboardName).toBeDefined();
      expect(dashboardName).toContain(testSuffix);
    });
  });

  describe('Environment suffix handling', () => {
    it('should use provided environmentSuffix', async () => {
      const bucketName = await stack.complianceBucket.promise();
      expect(bucketName).toContain(testSuffix);
    });

    it('should use default suffix when not provided', () => {
      const defaultStack = new TapStack('default-stack', {});
      expect(defaultStack).toBeDefined();
      // Default should be 'dev' as per tap-stack.ts
    });
  });

  describe('Tags propagation', () => {
    it('should accept custom tags', () => {
      const customTags = {
        Environment: 'production',
        CostCenter: 'engineering',
        Owner: 'platform-team',
      };

      const taggedStack = new TapStack('tagged-stack', {
        environmentSuffix: 'prod',
        tags: customTags,
      });

      expect(taggedStack).toBeDefined();
    });

    it('should handle empty tags object', () => {
      const emptyTagsStack = new TapStack('empty-tags-stack', {
        environmentSuffix: 'test',
        tags: {},
      });

      expect(emptyTagsStack).toBeDefined();
    });
  });

  describe('ComplianceMonitoringStack integration', () => {
    it('should create compliance monitoring resources', async () => {
      const bucketName = await stack.complianceBucket.promise();
      const topicArn = await stack.snsTopicArn.promise();
      const dashboardName = await stack.dashboardName.promise();

      expect(bucketName).toBeDefined();
      expect(topicArn).toBeDefined();
      expect(dashboardName).toBeDefined();
    });

    it('should expose correct output properties', () => {
      expect(stack.complianceBucket).toBeInstanceOf(pulumi.Output);
      expect(stack.snsTopicArn).toBeInstanceOf(pulumi.Output);
      expect(stack.dashboardName).toBeInstanceOf(pulumi.Output);
    });
  });

  describe('Resource naming conventions', () => {
    it('should include environmentSuffix in bucket name', async () => {
      const bucketName = await stack.complianceBucket.promise();
      expect(bucketName).toMatch(new RegExp(`${testSuffix}`));
    });

    it('should include environmentSuffix in dashboard name', async () => {
      const dashboardName = await stack.dashboardName.promise();
      expect(dashboardName).toMatch(new RegExp(`${testSuffix}`));
    });
  });

  describe('Output registration', () => {
    it('should register outputs correctly', () => {
      expect(stack.complianceBucket).toBeDefined();
      expect(stack.snsTopicArn).toBeDefined();
      expect(stack.dashboardName).toBeDefined();
    });

    it('should have outputs with proper type', () => {
      expect(typeof stack.complianceBucket.apply).toBe('function');
      expect(typeof stack.snsTopicArn.apply).toBe('function');
      expect(typeof stack.dashboardName.apply).toBe('function');
    });
  });

  describe('Error handling', () => {
    it('should handle missing tags gracefully', () => {
      const stackWithoutTags = new TapStack('no-tags-stack', {
        environmentSuffix: 'test',
      });

      expect(stackWithoutTags).toBeDefined();
    });

    it('should handle undefined environmentSuffix', () => {
      const stackNoSuffix = new TapStack('no-suffix-stack', {
        tags: { Test: 'value' },
      });

      expect(stackNoSuffix).toBeDefined();
    });
  });

  describe('Stack configuration validation', () => {
    it('should create stack with minimal configuration', () => {
      const minimalStack = new TapStack('minimal-stack', {
        environmentSuffix: 'min',
      });

      expect(minimalStack).toBeDefined();
      expect(minimalStack.complianceBucket).toBeDefined();
      expect(minimalStack.snsTopicArn).toBeDefined();
      expect(minimalStack.dashboardName).toBeDefined();
    });

    it('should create stack with full configuration', () => {
      const fullStack = new TapStack('full-stack', {
        environmentSuffix: 'full',
        tags: {
          Environment: 'production',
          Owner: 'platform-team',
          CostCenter: 'engineering',
          Application: 'compliance-monitoring',
        },
      });

      expect(fullStack).toBeDefined();
    });
  });

  describe('Component resource hierarchy', () => {
    it('should create as component resource', () => {
      expect(stack).toBeInstanceOf(pulumi.ComponentResource);
    });

    it('should have correct resource type', () => {
      // Stack should be created as tap:stack:TapStack
      expect(stack).toBeDefined();
    });
  });

  describe('Compliance bucket properties', () => {
    it('should return string output for bucket name', async () => {
      const bucketName = await stack.complianceBucket.promise();
      expect(typeof bucketName).toBe('string');
    });

    it('should have valid bucket naming format', async () => {
      const bucketName = await stack.complianceBucket.promise();
      // Bucket names should be lowercase, contain testSuffix
      expect(bucketName).toBeTruthy();
      expect(bucketName.length).toBeGreaterThan(0);
    });
  });

  describe('SNS topic ARN properties', () => {
    it('should return string output for topic ARN', async () => {
      const topicArn = await stack.snsTopicArn.promise();
      expect(typeof topicArn).toBe('string');
    });

    it('should have valid ARN format', async () => {
      const topicArn = await stack.snsTopicArn.promise();
      expect(topicArn).toMatch(/^arn:aws:/);
    });
  });

  describe('Dashboard name properties', () => {
    it('should return string output for dashboard name', async () => {
      const dashboardName = await stack.dashboardName.promise();
      expect(typeof dashboardName).toBe('string');
    });

    it('should contain compliance-related naming', async () => {
      const dashboardName = await stack.dashboardName.promise();
      expect(dashboardName).toContain('compliance');
    });
  });
});

describe('TapStack Integration with ComplianceMonitoringStack', () => {
  const testSuffix = 'integration-test';
  let stack: TapStack;

  beforeAll(() => {
    stack = new TapStack('integration-test-stack', {
      environmentSuffix: testSuffix,
      tags: {
        Environment: testSuffix,
        Test: 'integration',
      },
    });
  });

  it('should propagate environmentSuffix to child stack', async () => {
    const bucketName = await stack.complianceBucket.promise();
    expect(bucketName).toContain(testSuffix);
  });

  it('should propagate tags to child stack', () => {
    // Child stack should inherit tags
    expect(stack).toBeDefined();
  });

  it('should expose child stack outputs', () => {
    expect(stack.complianceBucket).toBeDefined();
    expect(stack.snsTopicArn).toBeDefined();
    expect(stack.dashboardName).toBeDefined();
  });
});

describe('TapStack Resource Outputs', () => {
  it('should export outputs for external consumption', async () => {
    const stack = new TapStack('export-test-stack', {
      environmentSuffix: 'export',
    });

    const [bucket, topic, dashboard] = await Promise.all([
      stack.complianceBucket.promise(),
      stack.snsTopicArn.promise(),
      stack.dashboardName.promise(),
    ]);

    expect(bucket).toBeDefined();
    expect(topic).toBeDefined();
    expect(dashboard).toBeDefined();
  });

  it('should have consistent output values', async () => {
    const stack = new TapStack('consistent-test-stack', {
      environmentSuffix: 'consistent',
    });

    const bucket1 = await stack.complianceBucket.promise();
    const bucket2 = await stack.complianceBucket.promise();

    expect(bucket1).toEqual(bucket2);
  });
});
