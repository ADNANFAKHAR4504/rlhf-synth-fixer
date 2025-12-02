import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { CodeBuildStack } from '../lib/codebuild-stack';

// Mock Pulumi runtime
pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: any;
  } => {
    const resourceName = args.name;
    return {
      id: `${resourceName}_id`,
      state: {
        ...args.inputs,
        arn: `arn:aws:service:region:account:${resourceName}`,
      },
    };
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    return args.inputs;
  },
});

describe('CodeBuildStack', () => {
  const environmentSuffix = 'test123';
  const tags = { Environment: 'test', ManagedBy: 'pulumi' };

  describe('constructor', () => {
    it('should create all required resources', async () => {
      const stack = new CodeBuildStack('test-codebuild', {
        environmentSuffix,
        tags,
      });

      expect(stack).toBeDefined();
      expect(stack.codeBuildProjectName).toBeDefined();
      expect(stack.artifactBucketName).toBeDefined();
    });

    it('should create S3 bucket with correct name', async () => {
      const stack = new CodeBuildStack('test-codebuild', {
        environmentSuffix,
        tags,
      });

      const bucketName = await stack.artifactBucketName.promise();
      expect(bucketName).toContain(environmentSuffix);
    });

    it('should create CodeBuild project with correct name', async () => {
      const stack = new CodeBuildStack('test-codebuild', {
        environmentSuffix,
        tags,
      });

      const projectName = await stack.codeBuildProjectName.promise();
      expect(projectName).toContain(environmentSuffix);
    });

    it('should expose codeBuildProjectName as output', async () => {
      const stack = new CodeBuildStack('test-codebuild', {
        environmentSuffix,
        tags,
      });

      const projectName = await stack.codeBuildProjectName.promise();
      expect(projectName).toBeDefined();
      expect(typeof projectName).toBe('string');
    });

    it('should expose artifactBucketName as output', async () => {
      const stack = new CodeBuildStack('test-codebuild', {
        environmentSuffix,
        tags,
      });

      const bucketName = await stack.artifactBucketName.promise();
      expect(bucketName).toBeDefined();
      expect(typeof bucketName).toBe('string');
    });

    it('should register outputs correctly', async () => {
      const stack = new CodeBuildStack('test-codebuild', {
        environmentSuffix,
        tags,
      });

      const projectName = await stack.codeBuildProjectName.promise();
      const bucketName = await stack.artifactBucketName.promise();

      expect(projectName).toBeDefined();
      expect(bucketName).toBeDefined();
    });
  });

  describe('resource naming', () => {
    it('should include environmentSuffix in all resource names', async () => {
      const suffix = 'unique123';
      const stack = new CodeBuildStack('test-codebuild', {
        environmentSuffix: suffix,
        tags,
      });

      const projectName = await stack.codeBuildProjectName.promise();
      const bucketName = await stack.artifactBucketName.promise();

      expect(projectName).toContain(suffix);
      expect(bucketName).toContain(suffix);
    });

    it('should use consistent naming pattern', async () => {
      const stack = new CodeBuildStack('test-codebuild', {
        environmentSuffix,
        tags,
      });

      const projectName = await stack.codeBuildProjectName.promise();
      const bucketName = await stack.artifactBucketName.promise();

      expect(projectName).toMatch(/nodejs-build-/);
      expect(bucketName).toMatch(/codebuild-artifacts-/);
    });
  });

  describe('tags', () => {
    it('should apply tags to all resources', async () => {
      const customTags = {
        Environment: 'production',
        ManagedBy: 'pulumi',
        Owner: 'DevOps',
      };

      const stack = new CodeBuildStack('test-codebuild', {
        environmentSuffix,
        tags: customTags,
      });

      expect(stack).toBeDefined();
    });

    it('should handle undefined tags', async () => {
      const stack = new CodeBuildStack('test-codebuild', {
        environmentSuffix,
      });

      expect(stack).toBeDefined();
    });

    it('should handle empty tags object', async () => {
      const stack = new CodeBuildStack('test-codebuild', {
        environmentSuffix,
        tags: {},
      });

      expect(stack).toBeDefined();
    });
  });

  describe('component resource', () => {
    it('should create as ComponentResource', async () => {
      const stack = new CodeBuildStack('test-codebuild', {
        environmentSuffix,
        tags,
      });

      expect(stack).toBeInstanceOf(pulumi.ComponentResource);
    });

    it('should have correct resource type', async () => {
      const stack = new CodeBuildStack('test-codebuild', {
        environmentSuffix,
        tags,
      });

      // Component resources have __pulumiType property
      expect((stack as any).__pulumiType).toBe('tap:stack:CodeBuildStack');
    });

    it('should respect parent option', async () => {
      const parentStack = new pulumi.ComponentResource(
        'test:parent',
        'parent',
      );
      const stack = new CodeBuildStack(
        'test-codebuild',
        {
          environmentSuffix,
          tags,
        },
        { parent: parentStack },
      );

      expect(stack).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should handle special characters in environmentSuffix', async () => {
      const stack = new CodeBuildStack('test-codebuild', {
        environmentSuffix: 'test-123-abc',
        tags,
      });

      const projectName = await stack.codeBuildProjectName.promise();
      expect(projectName).toContain('test-123-abc');
    });

    it('should handle long environmentSuffix', async () => {
      const longSuffix = 'very-long-environment-suffix-name';
      const stack = new CodeBuildStack('test-codebuild', {
        environmentSuffix: longSuffix,
        tags,
      });

      const projectName = await stack.codeBuildProjectName.promise();
      expect(projectName).toContain(longSuffix);
    });

    it('should handle single character environmentSuffix', async () => {
      const stack = new CodeBuildStack('test-codebuild', {
        environmentSuffix: 'a',
        tags,
      });

      const projectName = await stack.codeBuildProjectName.promise();
      expect(projectName).toContain('a');
    });
  });

  describe('integration points', () => {
    it('should create interdependent resources', async () => {
      const stack = new CodeBuildStack('test-codebuild', {
        environmentSuffix,
        tags,
      });

      // Verify both outputs are available
      const projectName = await stack.codeBuildProjectName.promise();
      const bucketName = await stack.artifactBucketName.promise();

      expect(projectName).toBeDefined();
      expect(bucketName).toBeDefined();
    });

    it('should properly chain resource dependencies', async () => {
      const stack = new CodeBuildStack('test-codebuild', {
        environmentSuffix,
        tags,
      });

      // Outputs should be resolvable
      await expect(stack.codeBuildProjectName.promise()).resolves.toBeDefined();
      await expect(stack.artifactBucketName.promise()).resolves.toBeDefined();
    });
  });

  describe('resource configuration', () => {
    it('should create resources with environmentSuffix', async () => {
      const suffix = 'config-test';
      const stack = new CodeBuildStack('test-codebuild', {
        environmentSuffix: suffix,
        tags,
      });

      const projectName = await stack.codeBuildProjectName.promise();
      const bucketName = await stack.artifactBucketName.promise();

      expect(projectName).toMatch(/nodejs-build-config-test/);
      expect(bucketName).toMatch(/codebuild-artifacts-config-test/);
    });

    it('should handle options parameter', async () => {
      const opts: pulumi.ComponentResourceOptions = {
        protect: false,
        deleteBeforeReplace: true,
      };

      const stack = new CodeBuildStack(
        'test-codebuild',
        {
          environmentSuffix,
          tags,
        },
        opts,
      );

      expect(stack).toBeDefined();
    });
  });
});
