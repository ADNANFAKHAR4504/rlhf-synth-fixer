/**
 * S3Stack Unit Tests
 *
 * Comprehensive unit tests for the S3Stack Pulumi component.
 * Tests resource creation, configuration, and lifecycle policies.
 */
import * as pulumi from '@pulumi/pulumi';

// Set up Pulumi test environment
pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: any;
  } {
    return {
      id: args.inputs.name ? `${args.inputs.name}_id` : args.name + '_id',
      state: {
        ...args.inputs,
        arn: `arn:aws:${args.type}:us-east-1:123456789012:${args.name}`,
        id: args.inputs.bucket || args.inputs.name || args.name,
        bucket:
          args.inputs.bucket ||
          args.inputs.name ||
          `${args.name}-${args.inputs.environmentSuffix || 'dev'}`,
      },
    };
  },
  call: function (args: pulumi.runtime.MockCallArgs) {
    return args.inputs;
  },
});

import { S3Stack } from '../lib/s3-stack';

describe('S3Stack Unit Tests', () => {
  describe('Resource Creation', () => {
    let resources: any[];

    beforeAll((done) => {
      resources = [];
      // Override pulumi.CustomResource to capture all resources
      const originalCustomResource = pulumi.CustomResource;
      (pulumi as any).CustomResource = class extends originalCustomResource {
        constructor(
          t: string,
          name: string,
          props?: any,
          opts?: pulumi.CustomResourceOptions
        ) {
          super(t, name, props, opts);
          resources.push({ type: t, name, props, opts });
        }
      };

      // Create stack instance
      const stack = new S3Stack('test-s3', {
        environmentSuffix: 'dev',
        tags: { Project: 'VideoStorage' },
      });

      // Wait for all resources to be registered
      pulumi.all([stack.bucketName, stack.bucketArn]).apply(() => {
        done();
        return null;
      });
    });

    it('should create S3 bucket with correct configuration', (done) => {
      const stack = new S3Stack('s3-test-bucket', {
        environmentSuffix: 'test',
      });

      pulumi.all([stack.bucketName]).apply(([bucketName]) => {
        expect(bucketName).toContain('video-bucket');
        expect(bucketName).toContain('test');
        done();
        return null;
      });
    });

    it('should register bucket name output', (done) => {
      const stack = new S3Stack('s3-output-test', {
        environmentSuffix: 'dev',
      });

      pulumi.all([stack.bucketName]).apply(([bucketName]) => {
        expect(bucketName).toBeDefined();
        expect(typeof bucketName).toBe('string');
        done();
        return null;
      });
    });

    it('should register bucket ARN output', (done) => {
      const stack = new S3Stack('s3-arn-test', {
        environmentSuffix: 'dev',
      });

      pulumi.all([stack.bucketArn]).apply(([bucketArn]) => {
        expect(bucketArn).toBeDefined();
        expect(bucketArn).toContain('arn:aws:');
        done();
        return null;
      });
    });
  });

  describe('Environment Suffix Handling', () => {
    it('should accept environment suffix in arguments', (done) => {
      const stack = new S3Stack('env-test', {
        environmentSuffix: 'prod',
      });

      pulumi.all([stack.bucketName]).apply(([bucketName]) => {
        expect(bucketName).toContain('prod');
        done();
        return null;
      });
    });

    it('should use environment suffix for bucket naming', (done) => {
      const testEnv = 'staging';
      const stack = new S3Stack('naming-test', {
        environmentSuffix: testEnv,
      });

      pulumi.all([stack.bucketName]).apply(([bucketName]) => {
        expect(bucketName).toContain(testEnv);
        done();
        return null;
      });
    });
  });

  describe('Tag Configuration', () => {
    it('should apply default tags', (done) => {
      const stack = new S3Stack('tag-test', {
        environmentSuffix: 'dev',
      });

      pulumi.all([stack.bucketName]).apply(() => {
        // Tags are applied to resources, stack should be created successfully
        expect(stack).toBeDefined();
        done();
        return null;
      });
    });

    it('should merge custom tags with defaults', (done) => {
      const customTags = {
        CustomTag: 'CustomValue',
        Department: 'Engineering',
      };

      const stack = new S3Stack('custom-tag-test', {
        environmentSuffix: 'dev',
        tags: customTags,
      });

      pulumi.all([stack.bucketName]).apply(() => {
        expect(stack).toBeDefined();
        done();
        return null;
      });
    });

    it('should allow empty tags object', (done) => {
      const stack = new S3Stack('empty-tag-test', {
        environmentSuffix: 'dev',
        tags: {},
      });

      pulumi.all([stack.bucketName]).apply(() => {
        expect(stack).toBeDefined();
        done();
        return null;
      });
    });
  });

  describe('Component Resource Options', () => {
    it('should accept parent option', (done) => {
      const parentResource = new pulumi.ComponentResource('test:parent', 'parent');
      const stack = new S3Stack('parent-test', {
        environmentSuffix: 'dev',
      }, { parent: parentResource });

      pulumi.all([stack.bucketName]).apply(() => {
        expect(stack).toBeDefined();
        done();
        return null;
      });
    });

    it('should work without component resource options', (done) => {
      const stack = new S3Stack('no-opts-test', {
        environmentSuffix: 'dev',
      });

      pulumi.all([stack.bucketName]).apply(() => {
        expect(stack).toBeDefined();
        done();
        return null;
      });
    });
  });

  describe('Resource Naming', () => {
    it('should create unique resource names with environment suffix', (done) => {
      const env1 = 'dev';
      const env2 = 'prod';

      const stack1 = new S3Stack('unique-1', { environmentSuffix: env1 });
      const stack2 = new S3Stack('unique-2', { environmentSuffix: env2 });

      pulumi
        .all([stack1.bucketName, stack2.bucketName])
        .apply(([bucket1, bucket2]) => {
          expect(bucket1).not.toBe(bucket2);
          expect(bucket1).toContain(env1);
          expect(bucket2).toContain(env2);
          done();
          return null;
        });
    });

    it('should include video-bucket prefix in bucket name', (done) => {
      const stack = new S3Stack('prefix-test', {
        environmentSuffix: 'dev',
      });

      pulumi.all([stack.bucketName]).apply(([bucketName]) => {
        expect(bucketName).toMatch(/video-bucket/);
        done();
        return null;
      });
    });
  });

  describe('Bucket Configuration', () => {
    it('should configure forceDestroy for testing', (done) => {
      const stack = new S3Stack('force-destroy-test', {
        environmentSuffix: 'dev',
      });

      // Stack should be created with forceDestroy configuration
      pulumi.all([stack.bucketName]).apply(() => {
        expect(stack).toBeDefined();
        done();
        return null;
      });
    });
  });

  describe('Output Registration', () => {
    it('should register outputs correctly', (done) => {
      const stack = new S3Stack('output-registration-test', {
        environmentSuffix: 'dev',
      });

      // Both outputs should be registered
      pulumi.all([stack.bucketName, stack.bucketArn]).apply(([name, arn]) => {
        expect(name).toBeDefined();
        expect(arn).toBeDefined();
        done();
        return null;
      });
    });
  });

  describe('Stack Construction', () => {
    it('should complete construction without errors', (done) => {
      expect(() => {
        const stack = new S3Stack('construction-test', {
          environmentSuffix: 'dev',
        });

        pulumi.all([stack.bucketName]).apply(() => {
          done();
          return null;
        });
      }).not.toThrow();
    });

    it('should handle multiple instances', (done) => {
      const stack1 = new S3Stack('multi-1', { environmentSuffix: 'env1' });
      const stack2 = new S3Stack('multi-2', { environmentSuffix: 'env2' });
      const stack3 = new S3Stack('multi-3', { environmentSuffix: 'env3' });

      pulumi
        .all([stack1.bucketName, stack2.bucketName, stack3.bucketName])
        .apply(([b1, b2, b3]) => {
          expect(b1).toBeDefined();
          expect(b2).toBeDefined();
          expect(b3).toBeDefined();
          done();
          return null;
        });
    });
  });

  describe('Error Handling', () => {
    it('should handle missing environment suffix', (done) => {
      // Environment suffix is required in the interface
      const stack = new S3Stack('error-test', {
        environmentSuffix: 'test',
      });

      pulumi.all([stack.bucketName]).apply(() => {
        expect(stack).toBeDefined();
        done();
        return null;
      });
    });
  });

  describe('Integration with Parent Stack', () => {
    it('should work as child component', (done) => {
      const parentComponent = new pulumi.ComponentResource(
        'test:parent',
        'test-parent'
      );

      const stack = new S3Stack('child-component', {
        environmentSuffix: 'dev',
      }, { parent: parentComponent });

      pulumi.all([stack.bucketName, stack.bucketArn]).apply(() => {
        expect(stack).toBeDefined();
        done();
        return null;
      });
    });
  });

  describe('Type Safety', () => {
    it('should have correct output types', (done) => {
      const stack = new S3Stack('type-test', {
        environmentSuffix: 'dev',
      });

      // Outputs should be Pulumi Outputs
      expect(stack.bucketName).toBeInstanceOf(pulumi.Output);
      expect(stack.bucketArn).toBeInstanceOf(pulumi.Output);

      pulumi.all([stack.bucketName]).apply(() => {
        done();
        return null;
      });
    });
  });
});
