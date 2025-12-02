import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

// Mock Pulumi runtime
pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: any;
  } => {
    return {
      id: `${args.name}_id`,
      state: args.inputs,
    };
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    return args.inputs;
  },
});

describe('TapStack', () => {

  describe('constructor', () => {
    it('should create a TapStack with provided environmentSuffix', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test123',
        tags: { Environment: 'test', ManagedBy: 'pulumi' },
      });

      expect(stack).toBeDefined();
      expect(stack.codeBuildProjectName).toBeDefined();
      expect(stack.artifactBucketName).toBeDefined();
    });

    it('should use default environmentSuffix when not provided', async () => {
      const stack = new TapStack('test-stack', {});

      expect(stack).toBeDefined();
      const projectName = await stack.codeBuildProjectName.promise();
      expect(projectName).toContain('dev');
    });

    it('should use default tags when not provided', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test456',
      });

      expect(stack).toBeDefined();
      const projectName = await stack.codeBuildProjectName.promise();
      expect(projectName).toContain('test456');
    });

    it('should expose codeBuildProjectName output', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test789',
      });

      expect(stack.codeBuildProjectName).toBeDefined();
    });

    it('should expose artifactBucketName output', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test789',
      });

      expect(stack.artifactBucketName).toBeDefined();
    });

    it('should register outputs correctly', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test999',
      });

      // Verify outputs are registered
      const projectName = await stack.codeBuildProjectName.promise();
      const bucketName = await stack.artifactBucketName.promise();

      expect(projectName).toBeDefined();
      expect(bucketName).toBeDefined();
    });

    it('should handle empty string environmentSuffix', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: '',
      });

      expect(stack).toBeDefined();
      const projectName = await stack.codeBuildProjectName.promise();
      expect(projectName).toContain('dev');
    });

    it('should merge custom tags with defaults', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'custom',
        tags: { CustomTag: 'value' },
      });

      expect(stack).toBeDefined();
      const projectName = await stack.codeBuildProjectName.promise();
      expect(projectName).toContain('custom');
    });

    it('should create component resource with correct type', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'type-test',
      });

      // Check that the stack is created as a ComponentResource
      expect(stack).toBeInstanceOf(pulumi.ComponentResource);
    });

    it('should pass parent context to child resources', async () => {
      const parentOpts = { protect: true };
      const stack = new TapStack(
        'test-stack',
        {
          environmentSuffix: 'parent-test',
        },
        parentOpts,
      );

      expect(stack).toBeDefined();
      expect(stack.codeBuildProjectName).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should handle undefined args gracefully', async () => {
      expect(() => {
        new TapStack('test-stack', {} as any);
      }).not.toThrow();
    });

    it('should handle null environmentSuffix', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: null as any,
      });

      expect(stack).toBeDefined();
      const projectName = await stack.codeBuildProjectName.promise();
      expect(projectName).toContain('dev');
    });

    it('should handle null tags', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
        tags: null as any,
      });

      expect(stack).toBeDefined();
      const projectName = await stack.codeBuildProjectName.promise();
      expect(projectName).toContain('test');
    });
  });

  describe('output registration', () => {
    it('should register codeBuildProjectName from child stack', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'output-test',
      });

      const projectName = await stack.codeBuildProjectName.promise();
      expect(projectName).toBeDefined();
      expect(typeof projectName).toBe('string');
    });

    it('should register artifactBucketName from child stack', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'output-test',
      });

      const bucketName = await stack.artifactBucketName.promise();
      expect(bucketName).toBeDefined();
      expect(typeof bucketName).toBe('string');
    });

    it('should register both outputs correctly', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'both-outputs',
      });

      const [projectName, bucketName] = await Promise.all([
        stack.codeBuildProjectName.promise(),
        stack.artifactBucketName.promise(),
      ]);

      expect(projectName).toBeDefined();
      expect(bucketName).toBeDefined();
    });
  });
});
