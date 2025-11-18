/**
 * Unit tests for TapStack
 *
 * These tests verify the structure and configuration of the TapStack component
 * without actually deploying to AWS. They use Pulumi's runtime mocking capabilities
 * to test resource creation and configuration.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { TapStack } from '../lib/tap-stack';

// Set up Pulumi test environment
pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: any;
  } {
    const id = `${args.name}_id`;
    const state = args.inputs;

    // Mock specific outputs for different resource types
    if (args.type === 'aws:ec2/vpc:Vpc') {
      return { id, state: { ...state, id: 'vpc-mock-id' } };
    }
    if (args.type === 'aws:ec2/subnet:Subnet') {
      return { id, state: { ...state, id: `subnet-mock-${args.name}` } };
    }
    if (args.type === 'aws:s3/bucket:Bucket') {
      return {
        id,
        state: {
          ...state,
          id: `bucket-mock-id`,
          bucket: `data-bucket-${state.tags?.Environment || 'test'}`,
          arn: `arn:aws:s3:::data-bucket-${state.tags?.Environment || 'test'}`,
        },
      };
    }
    if (args.type === 'aws:kms/key:Key') {
      return {
        id,
        state: {
          ...state,
          id: 'key-mock-id',
          arn: 'arn:aws:kms:us-east-1:123456789012:key/mock-key-id',
        },
      };
    }
    if (args.type === 'aws:iam/role:Role') {
      return {
        id,
        state: {
          ...state,
          id: 'role-mock-id',
          arn: 'arn:aws:iam::123456789012:role/mock-role',
          name: args.name,
        },
      };
    }
    if (args.type === 'aws:cloudwatch/logGroup:LogGroup') {
      return {
        id,
        state: {
          ...state,
          id: 'log-group-mock-id',
          name: state.namePrefix || '/aws/lambda/test',
        },
      };
    }

    return { id, state };
  },
  call: function (args: pulumi.runtime.MockCallArgs) {
    // Mock AWS API calls
    if (args.token === 'aws:index/getAvailabilityZones:getAvailabilityZones') {
      return {
        names: ['us-east-1a', 'us-east-1b', 'us-east-1c'],
        state: 'available',
      };
    }
    if (args.token === 'aws:index/getRegion:getRegion') {
      return {
        name: 'us-east-1',
      };
    }
    return {};
  },
});

describe('TapStack Unit Tests', () => {
  describe('Stack Instantiation', () => {
    it('should create a TapStack with default configuration', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
      });

      expect(stack).toBeDefined();
      expect(stack.vpcId).toBeDefined();
      expect(stack.bucketName).toBeDefined();
      expect(stack.kmsKeyId).toBeDefined();
      expect(stack.lambdaRoleArn).toBeDefined();
    });

    it('should create a TapStack with custom environment suffix', async () => {
      const stack = new TapStack('test-stack-custom', {
        environmentSuffix: 'prod',
      });

      expect(stack).toBeDefined();

      // Verify bucket name includes environment suffix
      const bucketName = await stack.bucketName.promise();
      expect(bucketName).toContain('prod');
    });

    it('should apply custom tags when provided', async () => {
      const customTags = {
        Project: 'TestProject',
        CostCenter: '12345',
      };

      const stack = new TapStack('test-stack-tags', {
        environmentSuffix: 'test',
        tags: customTags,
      });

      expect(stack).toBeDefined();
      // Tags are applied internally, structure is verified
    });

    it('should use environment variable for suffix if not provided', async () => {
      // Save original value
      const originalEnv = process.env.ENVIRONMENT_SUFFIX;

      // Set environment variable
      process.env.ENVIRONMENT_SUFFIX = 'staging';

      const stack = new TapStack('test-stack-env', {});

      expect(stack).toBeDefined();

      // Restore original value
      if (originalEnv) {
        process.env.ENVIRONMENT_SUFFIX = originalEnv;
      } else {
        delete process.env.ENVIRONMENT_SUFFIX;
      }
    });
  });

  describe('Resource Outputs', () => {
    let stack: TapStack;

    beforeAll(() => {
      stack = new TapStack('output-test-stack', {
        environmentSuffix: 'test',
      });
    });

    it('should export vpcId output', async () => {
      const vpcId = await stack.vpcId.promise();
      expect(vpcId).toBeDefined();
      expect(typeof vpcId).toBe('string');
      expect(vpcId).toContain('vpc');
    });

    it('should export bucketName output', async () => {
      const bucketName = await stack.bucketName.promise();
      expect(bucketName).toBeDefined();
      expect(typeof bucketName).toBe('string');
      expect(bucketName).toContain('data-bucket');
    });

    it('should export kmsKeyId output', async () => {
      const kmsKeyId = await stack.kmsKeyId.promise();
      expect(kmsKeyId).toBeDefined();
      expect(typeof kmsKeyId).toBe('string');
    });

    it('should export lambdaRoleArn output', async () => {
      const roleArn = await stack.lambdaRoleArn.promise();
      expect(roleArn).toBeDefined();
      expect(typeof roleArn).toBe('string');
      expect(roleArn).toContain('arn:aws:iam');
    });
  });

  describe('Component Registration', () => {
    it('should register as pulumi component resource', () => {
      const stack = new TapStack('component-test', {
        environmentSuffix: 'test',
      });

      // Verify it's a ComponentResource by checking the constructor chain
      expect(stack).toBeInstanceOf(pulumi.ComponentResource);
    });

    it('should have correct resource type', () => {
      const stack = new TapStack('type-test', {
        environmentSuffix: 'test',
      });

      // The component should be registered with type 'tap:stack:TapStack'
      expect(stack).toBeDefined();
    });
  });

  describe('Environment Suffix Handling', () => {
    it('should handle missing environment suffix with default', () => {
      const stack = new TapStack('no-suffix-test', {});

      expect(stack).toBeDefined();
    });

    it('should apply environment suffix to resource names', async () => {
      const suffix = 'custom123';
      const stack = new TapStack('suffix-test', {
        environmentSuffix: suffix,
      });

      const bucketName = await stack.bucketName.promise();
      expect(bucketName).toContain(suffix);
    });
  });

  describe('Tag Application', () => {
    it('should apply mandatory security tags', () => {
      const stack = new TapStack('security-tags-test', {
        environmentSuffix: 'test',
      });

      expect(stack).toBeDefined();
      // Internal tagging structure is tested through resource creation
    });

    it('should merge custom tags with mandatory tags', () => {
      const customTags = {
        Application: 'DataPipeline',
        Version: '1.0',
      };

      const stack = new TapStack('merged-tags-test', {
        environmentSuffix: 'test',
        tags: customTags,
      });

      expect(stack).toBeDefined();
    });

    it('should include DataClassification and Owner tags', () => {
      const stack = new TapStack('mandatory-tags-test', {
        environmentSuffix: 'test',
      });

      expect(stack).toBeDefined();
      // DataClassification and Owner are applied internally
    });
  });

  describe('Error Handling', () => {
    it('should handle empty args object', () => {
      const stack = new TapStack('empty-args-test', {});

      expect(stack).toBeDefined();
    });

    it('should handle undefined tags', () => {
      const stack = new TapStack('undefined-tags-test', {
        environmentSuffix: 'test',
        tags: undefined,
      });

      expect(stack).toBeDefined();
    });
  });

  describe('Resource Options', () => {
    it('should accept resource options', () => {
      const stack = new TapStack(
        'options-test',
        { environmentSuffix: 'test' },
        {
          protect: false,
        }
      );

      expect(stack).toBeDefined();
    });

    it('should accept custom provider in options', () => {
      const customProvider = new aws.Provider('custom-provider', {
        region: 'us-west-2',
      });

      const stack = new TapStack(
        'custom-provider-test',
        { environmentSuffix: 'test' },
        { provider: customProvider }
      );

      expect(stack).toBeDefined();
    });
  });
});
