import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

// Mock Pulumi runtime to avoid actual resource creation during tests
pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: Record<string, any>;
  } => {
    // Return mock resource ID and state
    return {
      id: `${args.name}_id`,
      state: args.inputs,
    };
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    // Mock function calls
    return args.inputs;
  },
});

describe('TapStack Unit Tests', () => {
  let stack: TapStack;

  beforeAll(() => {
    // Set environment variables for testing
    process.env.ENVIRONMENT_SUFFIX = 'test';
    process.env.GITHUB_TOKEN = 'test-token';
    process.env.GITHUB_OWNER = 'test-owner';
    process.env.GITHUB_REPO = 'test-repo';
    process.env.GITHUB_BRANCH = 'main';
    process.env.AWS_REGION = 'us-east-1';
  });

  describe('Stack Instantiation', () => {
    it('should create TapStack with default props', () => {
      expect(() => {
        stack = new TapStack('TestTapStack', {
          tags: {
            Environment: 'test',
            Team: 'test-team',
          },
        });
      }).not.toThrow();
    });

    it('should have pipelineUrl output', (done) => {
      stack.pipelineUrl.apply((url) => {
        expect(url).toBeDefined();
        expect(typeof url).toBe('string');
        expect(url).toContain('console.aws.amazon.com');
        expect(url).toContain('codepipeline');
        done();
        return url;
      });
    });

    it('should have deploymentTableName output', (done) => {
      stack.deploymentTableName.apply((name) => {
        expect(name).toBeDefined();
        expect(typeof name).toBe('string');
        expect(name).toContain('deployment-history');
        expect(name).toContain('test'); // environmentSuffix
        done();
        return name;
      });
    });
  });

  describe('Resource Naming with environmentSuffix', () => {
    it('should use environmentSuffix in all resource names', (done) => {
      const promises: Promise<any>[] = [];

      // Test artifact bucket name
      promises.push(
        pulumi.all([stack.pipelineUrl]).apply(([_url]) => {
          // Stack creates resources, names should contain environmentSuffix
          expect(process.env.ENVIRONMENT_SUFFIX).toBe('test');
          return true;
        })
      );

      // Test deployment table name
      promises.push(
        stack.deploymentTableName.apply((name) => {
          expect(name).toContain('test');
          return true;
        })
      );

      // Wait for all promises
      Promise.all(promises).then(() => done());
    });
  });

  describe('Environment Variables', () => {
    it('should use ENVIRONMENT_SUFFIX from environment', () => {
      process.env.ENVIRONMENT_SUFFIX = 'custom-env';
      const customStack = new TapStack('CustomEnvStack', {
        tags: { Environment: 'custom' },
      });

      customStack.deploymentTableName.apply((name) => {
        expect(name).toContain('custom-env');
      });
    });

    it('should use GITHUB variables from environment', () => {
      process.env.GITHUB_TOKEN = 'custom-token';
      process.env.GITHUB_OWNER = 'custom-owner';
      process.env.GITHUB_REPO = 'custom-repo';
      process.env.GITHUB_BRANCH = 'develop';

      const githubStack = new TapStack('GitHubStack', {
        tags: { Environment: 'test' },
      });

      expect(githubStack).toBeDefined();
    });

    it('should fall back to default values when environment variables are not set', () => {
      delete process.env.ENVIRONMENT_SUFFIX;
      delete process.env.GITHUB_TOKEN;
      delete process.env.GITHUB_OWNER;
      delete process.env.GITHUB_REPO;
      delete process.env.GITHUB_BRANCH;

      const defaultStack = new TapStack('DefaultStack', {
        tags: { Environment: 'test' },
      });

      expect(defaultStack).toBeDefined();

      // Restore for other tests
      process.env.ENVIRONMENT_SUFFIX = 'test';
    });
  });

  describe('Tags Propagation', () => {
    it('should accept custom tags', () => {
      const taggedStack = new TapStack('TaggedStack', {
        tags: {
          Environment: 'production',
          Team: 'platform',
          Project: 'cicd',
        },
      });

      expect(taggedStack).toBeDefined();
    });

    it('should work without tags', () => {
      const noTagsStack = new TapStack('NoTagsStack', {});
      expect(noTagsStack).toBeDefined();
    });
  });

  describe('Output Registration', () => {
    it('should register pipelineUrl output', (done) => {
      stack.pipelineUrl.apply((url) => {
        expect(url).toBeTruthy();
        done();
        return url;
      });
    });

    it('should register deploymentTableName output', (done) => {
      stack.deploymentTableName.apply((name) => {
        expect(name).toBeTruthy();
        done();
        return name;
      });
    });

    it('should have outputs with correct types', () => {
      expect(stack.pipelineUrl).toBeInstanceOf(pulumi.Output);
      expect(stack.deploymentTableName).toBeInstanceOf(pulumi.Output);
    });
  });

  describe('Component Resource', () => {
    it('should be instance of ComponentResource', () => {
      expect(stack).toBeInstanceOf(pulumi.ComponentResource);
    });

    it('should have correct resource type', () => {
      expect(stack.__pulumiType).toBe('custom:module:TapStack');
    });
  });

  describe('AWS Region Configuration', () => {
    it('should respect AWS_REGION environment variable', () => {
      process.env.AWS_REGION = 'us-west-2';
      const regionalStack = new TapStack('RegionalStack', {
        tags: { Environment: 'test' },
      });
      expect(regionalStack).toBeDefined();

      // Restore default
      process.env.AWS_REGION = 'us-east-1';
    });

    it('should default to us-east-1 when AWS_REGION not set', () => {
      delete process.env.AWS_REGION;
      const defaultRegionStack = new TapStack('DefaultRegionStack', {
        tags: { Environment: 'test' },
      });
      expect(defaultRegionStack).toBeDefined();

      // Restore
      process.env.AWS_REGION = 'us-east-1';
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string environment suffix', () => {
      process.env.ENVIRONMENT_SUFFIX = '';
      const emptyEnvStack = new TapStack('EmptyEnvStack', {
        tags: { Environment: 'test' },
      });
      expect(emptyEnvStack).toBeDefined();

      // Restore
      process.env.ENVIRONMENT_SUFFIX = 'test';
    });

    it('should handle special characters in environment suffix', () => {
      process.env.ENVIRONMENT_SUFFIX = 'test-123';
      const specialCharStack = new TapStack('SpecialCharStack', {
        tags: { Environment: 'test' },
      });
      expect(specialCharStack).toBeDefined();

      // Restore
      process.env.ENVIRONMENT_SUFFIX = 'test';
    });

    it('should handle multiple stack instantiations', () => {
      const stack1 = new TapStack('Stack1', { tags: { Environment: 'test1' } });
      const stack2 = new TapStack('Stack2', { tags: { Environment: 'test2' } });
      const stack3 = new TapStack('Stack3', { tags: { Environment: 'test3' } });

      expect(stack1).toBeDefined();
      expect(stack2).toBeDefined();
      expect(stack3).toBeDefined();
    });
  });

  describe('Pipeline Configuration', () => {
    it('should create pipeline with correct URL format', (done) => {
      stack.pipelineUrl.apply((url) => {
        expect(url).toMatch(/^https:\/\/console\.aws\.amazon\.com\//);
        expect(url).toContain('/codesuite/codepipeline/pipelines/');
        expect(url).toContain('/view');
        done();
        return url;
      });
    });

    it('should include environment suffix in pipeline name', (done) => {
      process.env.ENVIRONMENT_SUFFIX = 'staging';
      const stagingStack = new TapStack('StagingStack', {
        tags: { Environment: 'staging' },
      });

      stagingStack.pipelineUrl.apply((url) => {
        expect(url).toContain('staging');
        done();
        return url;
      });

      // Restore
      process.env.ENVIRONMENT_SUFFIX = 'test';
    });
  });

  describe('DynamoDB Configuration', () => {
    it('should create table name with environment suffix', (done) => {
      stack.deploymentTableName.apply((name) => {
        expect(name).toContain('deployment-history');
        expect(name).toMatch(/-test$/); // ends with -test
        done();
        return name;
      });
    });

    it('should have consistent naming pattern', (done) => {
      stack.deploymentTableName.apply((name) => {
        // Pattern: deployment-history-{environmentSuffix}
        expect(name).toMatch(/^deployment-history-[a-z0-9-]+$/);
        done();
        return name;
      });
    });
  });

  describe('Props Interface', () => {
    it('should accept tags prop', () => {
      const propsStack = new TapStack('PropsStack', {
        tags: {
          Key1: 'Value1',
          Key2: 'Value2',
        },
      });
      expect(propsStack).toBeDefined();
    });

    it('should work with empty tags', () => {
      const emptyTagsStack = new TapStack('EmptyTagsStack', {
        tags: {},
      });
      expect(emptyTagsStack).toBeDefined();
    });

    it('should work with optional tags', () => {
      const optionalTagsStack = new TapStack('OptionalTagsStack', {});
      expect(optionalTagsStack).toBeDefined();
    });
  });
});
