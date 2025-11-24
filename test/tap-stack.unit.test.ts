import * as pulumi from '@pulumi/pulumi';

// Enable Pulumi testing mode
pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs) => {
    return {
      id: `${args.name}-id`,
      state: args.inputs,
    };
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    return args.inputs;
  },
});

import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  let stack: TapStack;

  beforeAll(() => {
    const testArgs = {
      environmentSuffix: 'test',
      tags: { Environment: 'test', Team: 'test-team' },
      githubOwner: 'test-owner',
      githubRepo: 'test-repo',
      githubBranch: 'main',
      githubToken: pulumi.secret('test-token'),
    };
    stack = new TapStack('test-stack', testArgs);
  });

  describe('Stack Instantiation', () => {
    it('creates stack successfully', () => {
      expect(stack).toBeDefined();
    });

    it('has pipelineUrl output', () => {
      expect(stack.pipelineUrl).toBeDefined();
    });

    it('has deploymentTableName output', () => {
      expect(stack.deploymentTableName).toBeDefined();
    });

    it('has correct URN type', () => {
      expect(stack.urn).toBeDefined();
    });
  });

  describe('Output Values', () => {
    it('pipelineUrl contains expected URL format', async () => {
      const url = await pulumi.output(stack.pipelineUrl).promise();
      expect(url).toContain('console.aws.amazon.com');
      expect(url).toContain('codepipeline');
      expect(url).toContain('test');
    });

    it('deploymentTableName contains environment suffix', async () => {
      const tableName = await pulumi.output(stack.deploymentTableName).promise();
      expect(tableName).toContain('test');
    });

    it('outputs are valid strings', async () => {
      const url = await pulumi.output(stack.pipelineUrl).promise();
      const tableName = await pulumi.output(stack.deploymentTableName).promise();
      expect(typeof url).toBe('string');
      expect(typeof tableName).toBe('string');
      expect(url.length).toBeGreaterThan(0);
      expect(tableName.length).toBeGreaterThan(0);
    });
  });

  describe('Input Validation', () => {
    it('accepts valid environmentSuffix', () => {
      const testStack = new TapStack('test-env-suffix', {
        environmentSuffix: 'prod',
        tags: {},
        githubOwner: 'owner',
        githubRepo: 'repo',
        githubBranch: 'main',
        githubToken: pulumi.secret('token'),
      });
      expect(testStack).toBeDefined();
    });

    it('accepts valid tags', () => {
      const customTags = { Custom: 'tag', Environment: 'staging' };
      const testStack = new TapStack('test-tags', {
        environmentSuffix: 'staging',
        tags: customTags,
        githubOwner: 'owner',
        githubRepo: 'repo',
        githubBranch: 'main',
        githubToken: pulumi.secret('token'),
      });
      expect(testStack).toBeDefined();
    });

    it('accepts valid GitHub configuration', () => {
      const testStack = new TapStack('test-github', {
        environmentSuffix: 'dev',
        tags: {},
        githubOwner: 'my-org',
        githubRepo: 'my-repo',
        githubBranch: 'develop',
        githubToken: pulumi.secret('github-token'),
      });
      expect(testStack).toBeDefined();
    });

    it('handles different branch names', () => {
      const testStack = new TapStack('test-branch', {
        environmentSuffix: 'dev',
        tags: {},
        githubOwner: 'owner',
        githubRepo: 'repo',
        githubBranch: 'feature-branch',
        githubToken: pulumi.secret('token'),
      });
      expect(testStack).toBeDefined();
    });
  });

  describe('Default Values', () => {
    it('uses provided environmentSuffix', async () => {
      const tableName = await pulumi.output(stack.deploymentTableName).promise();
      expect(tableName).toContain('test');
    });

    it('creates pipeline URL with environment suffix', async () => {
      const url = await pulumi.output(stack.pipelineUrl).promise();
      expect(url).toContain('test');
    });
  });

  describe('Multiple Stack Instances', () => {
    it('can create multiple stacks with different suffixes', () => {
      const stack1 = new TapStack('test-stack-1', {
        environmentSuffix: 'dev1',
        tags: {},
        githubOwner: 'owner',
        githubRepo: 'repo',
        githubBranch: 'main',
        githubToken: pulumi.secret('token'),
      });
      const stack2 = new TapStack('test-stack-2', {
        environmentSuffix: 'dev2',
        tags: {},
        githubOwner: 'owner',
        githubRepo: 'repo',
        githubBranch: 'main',
        githubToken: pulumi.secret('token'),
      });
      expect(stack1).toBeDefined();
      expect(stack2).toBeDefined();
    });

    it('each stack instance has unique outputs', async () => {
      const stack1 = new TapStack('unique-stack-1', {
        environmentSuffix: 'unique1',
        tags: {},
        githubOwner: 'owner',
        githubRepo: 'repo',
        githubBranch: 'main',
        githubToken: pulumi.secret('token'),
      });
      const stack2 = new TapStack('unique-stack-2', {
        environmentSuffix: 'unique2',
        tags: {},
        githubOwner: 'owner',
        githubRepo: 'repo',
        githubBranch: 'main',
        githubToken: pulumi.secret('token'),
      });
      const table1 = await pulumi.output(stack1.deploymentTableName).promise();
      const table2 = await pulumi.output(stack2.deploymentTableName).promise();
      expect(table1).not.toBe(table2);
    });
  });

  describe('Output Promise Resolution', () => {
    it('resolves pipelineUrl as string', async () => {
      const url = await pulumi.output(stack.pipelineUrl).promise();
      expect(url).toBeTruthy();
      expect(url.length).toBeGreaterThan(0);
    });

    it('resolves deploymentTableName as string', async () => {
      const tableName = await pulumi.output(stack.deploymentTableName).promise();
      expect(tableName).toBeTruthy();
      expect(tableName.length).toBeGreaterThan(0);
    });
  });

  describe('Resource Configuration', () => {
    it('configures resources with proper naming convention', async () => {
      const tableName = await pulumi.output(stack.deploymentTableName).promise();
      expect(tableName).toMatch(/deployment-history-test/);
    });

    it('pipeline URL follows AWS console format', async () => {
      const url = await pulumi.output(stack.pipelineUrl).promise();
      expect(url).toMatch(/^https:\/\/console\.aws\.amazon\.com/);
      expect(url).toMatch(/codepipeline\/pipelines\//);
    });
  });

  describe('Component Resource Methods', () => {
    it('registers outputs correctly', () => {
      expect(stack.pipelineUrl).toBeDefined();
      expect(stack.deploymentTableName).toBeDefined();
    });

    it('outputs are Pulumi Output types', () => {
      expect(pulumi.Output.isInstance(stack.pipelineUrl)).toBe(true);
      expect(pulumi.Output.isInstance(stack.deploymentTableName)).toBe(true);
    });
  });
});
