import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

// Mock Pulumi runtime for testing
pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: any;
  } {
    return {
      id: args.name + '_id',
      state: args.inputs,
    };
  },
  call: function (args: pulumi.runtime.MockCallArgs) {
    return args.inputs;
  },
});

describe('TapStack Unit Tests', () => {
  let stack: TapStack;

  describe('Stack Instantiation with Default Props', () => {
    beforeAll(() => {
      stack = new TapStack('test-stack', {
        tags: { TestTag: 'TestValue' },
      });
    });

    it('should create TapStack successfully', () => {
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(TapStack);
    });

    it('should have artifactBucketArn output', async () => {
      const arn = await new Promise<string>((resolve) => {
        stack.artifactBucketArn.apply((value) => {
          resolve(value);
        });
      });
      expect(arn).toBeDefined();
      expect(typeof arn).toBe('string');
    });

    it('should have codeBuildProjectName output', async () => {
      const name = await new Promise<string>((resolve) => {
        stack.codeBuildProjectName.apply((value) => {
          resolve(value);
        });
      });
      expect(name).toBeDefined();
      expect(typeof name).toBe('string');
    });
  });

  describe('Stack with Custom Environment Suffix', () => {
    beforeAll(() => {
      stack = new TapStack('test-stack-prod', {
        environmentSuffix: 'prod',
        tags: { Environment: 'Production' },
      });
    });

    it('should instantiate successfully with prod environment', () => {
      expect(stack).toBeDefined();
    });

    it('should export required outputs', async () => {
      const [bucketArn, projectName] = await Promise.all([
        new Promise<string>((resolve) => {
          stack.artifactBucketArn.apply((value) => resolve(value));
        }),
        new Promise<string>((resolve) => {
          stack.codeBuildProjectName.apply((value) => resolve(value));
        }),
      ]);

      expect(bucketArn).toBeDefined();
      expect(projectName).toBeDefined();
    });
  });

  describe('Nested Components', () => {
    beforeAll(() => {
      stack = new TapStack('test-stack-nested', {
        tags: { Component: 'CodeBuild' },
      });
    });

    it('should create CodeBuildStack component', () => {
      expect(stack).toBeDefined();
    });

    it('should expose CodeBuild outputs', async () => {
      const projectName = await new Promise<string>((resolve) => {
        stack.codeBuildProjectName.apply((value) => resolve(value));
      });
      expect(projectName).toBeTruthy();
    });

    it('should expose S3 bucket outputs', async () => {
      const bucketArn = await new Promise<string>((resolve) => {
        stack.artifactBucketArn.apply((value) => resolve(value));
      });
      expect(bucketArn).toBeTruthy();
    });
  });

  describe('Output Validation', () => {
    beforeAll(() => {
      stack = new TapStack('test-output-stack', {});
    });

    it('should have non-empty artifact bucket ARN', async () => {
      const arn = await new Promise<string>((resolve) => {
        stack.artifactBucketArn.apply((value) => resolve(value));
      });
      expect(arn.length).toBeGreaterThan(0);
    });

    it('should have non-empty CodeBuild project name', async () => {
      const name = await new Promise<string>((resolve) => {
        stack.codeBuildProjectName.apply((value) => resolve(value));
      });
      expect(name.length).toBeGreaterThan(0);
    });

    it('should maintain output types', async () => {
      expect(stack.artifactBucketArn).toBeDefined();
      expect(stack.codeBuildProjectName).toBeDefined();
    });
  });
});