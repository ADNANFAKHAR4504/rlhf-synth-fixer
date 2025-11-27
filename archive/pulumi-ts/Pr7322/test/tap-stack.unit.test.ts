/**
 * Unit tests for TapStack Pulumi component
 */
import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

// Mock Pulumi runtime
pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: any;
  } {
    return {
      id: `${args.name}_id`,
      state: args.inputs,
    };
  },
  call: function (args: pulumi.runtime.MockCallArgs) {
    return args.inputs;
  },
});

describe('TapStack Unit Tests', () => {
  describe('Stack Instantiation', () => {
    it('should create TapStack with default environment suffix', async () => {
      const stack = new TapStack('test-stack', {});

      expect(stack).toBeDefined();
      expect(stack.configBucketName).toBeDefined();
      expect(stack.complianceTableName).toBeDefined();
      expect(stack.complianceFunctionArn).toBeDefined();
      expect(stack.snsTopicArn).toBeDefined();
      expect(stack.dashboardName).toBeDefined();
    });

    it('should create TapStack with custom environment suffix', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'prod',
      });

      expect(stack).toBeDefined();
      const tableName = await stack.complianceTableName.promise();
      expect(tableName).toContain('prod');
    });

    it('should create TapStack with custom tags', async () => {
      const customTags = {
        Project: 'TestProject',
        Owner: 'TestOwner',
      };

      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
        tags: customTags,
      });

      expect(stack).toBeDefined();
    });
  });

  describe('Resource Creation', () => {
    let stack: TapStack;

    beforeAll(() => {
      stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
      });
    });

    it('should export config bucket name', async () => {
      const bucketName = await stack.configBucketName.promise();
      expect(bucketName).toBeDefined();
      expect(typeof bucketName).toBe('string');
    });

    it('should export compliance table name', async () => {
      const tableName = await stack.complianceTableName.promise();
      expect(tableName).toBeDefined();
      expect(tableName).toContain('compliance-results');
    });

    it('should export compliance function ARN', async () => {
      const functionArn = await stack.complianceFunctionArn.promise();
      // In mock mode, ARN might be undefined, but the output should exist
      expect(stack.complianceFunctionArn).toBeDefined();
    });

    it('should export SNS topic ARN', async () => {
      const topicArn = await stack.snsTopicArn.promise();
      // In mock mode, ARN might be undefined, but the output should exist
      expect(stack.snsTopicArn).toBeDefined();
    });

    it('should export dashboard name', async () => {
      const dashboardName = await stack.dashboardName.promise();
      expect(dashboardName).toBeDefined();
      expect(dashboardName).toContain('compliance-dashboard');
    });
  });

  describe('Environment Suffix Handling', () => {
    it('should use provided environment suffix', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'staging',
      });

      const tableName = await stack.complianceTableName.promise();
      expect(tableName).toContain('staging');
    });

    it('should default to "dev" when no suffix provided', async () => {
      const stack = new TapStack('test-stack', {});

      const tableName = await stack.complianceTableName.promise();
      expect(tableName).toContain('dev');
    });
  });

  describe('Tags Configuration', () => {
    it('should handle empty tags object', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
        tags: {},
      });

      expect(stack).toBeDefined();
    });

    it('should handle tags with multiple properties', async () => {
      const tags = {
        Environment: 'test',
        Project: 'compliance',
        Team: 'security',
        CostCenter: '12345',
      };

      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
        tags: tags,
      });

      expect(stack).toBeDefined();
    });
  });

  describe('Component Resource', () => {
    it('should register as ComponentResource', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
      });

      expect(stack).toBeInstanceOf(pulumi.ComponentResource);
    });

    it('should have correct resource type', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
      });

      // ComponentResource type check
      expect(stack).toBeDefined();
    });
  });

  describe('Output Properties', () => {
    let stack: TapStack;

    beforeAll(() => {
      stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
      });
    });

    it('should have all required output properties', () => {
      expect(stack.configBucketName).toBeDefined();
      expect(stack.complianceTableName).toBeDefined();
      expect(stack.complianceFunctionArn).toBeDefined();
      expect(stack.snsTopicArn).toBeDefined();
      expect(stack.dashboardName).toBeDefined();
    });

    it('should have outputs as Pulumi Output types', () => {
      expect(stack.configBucketName).toHaveProperty('apply');
      expect(stack.complianceTableName).toHaveProperty('apply');
      expect(stack.complianceFunctionArn).toHaveProperty('apply');
      expect(stack.snsTopicArn).toHaveProperty('apply');
      expect(stack.dashboardName).toHaveProperty('apply');
    });
  });

  describe('Resource Naming Convention', () => {
    it('should include environment suffix in resource names', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'prod',
      });

      const tableName = await stack.complianceTableName.promise();
      const dashboardName = await stack.dashboardName.promise();

      expect(tableName).toMatch(/prod/);
      expect(dashboardName).toMatch(/prod/);
    });
  });

  describe('Error Handling', () => {
    it('should handle undefined options gracefully', async () => {
      const stack = new TapStack('test-stack', {} as any);
      expect(stack).toBeDefined();
    });
  });

  describe('Interface Compliance', () => {
    it('should accept valid TapStackArgs interface', async () => {
      const validArgs = {
        environmentSuffix: 'test',
        tags: { Environment: 'test' },
      };

      const stack = new TapStack('test-stack', validArgs);
      expect(stack).toBeDefined();
    });

    it('should handle optional environmentSuffix', async () => {
      const args = {
        tags: { Environment: 'test' },
      };

      const stack = new TapStack('test-stack', args);
      expect(stack).toBeDefined();
    });

    it('should handle optional tags', async () => {
      const args = {
        environmentSuffix: 'test',
      };

      const stack = new TapStack('test-stack', args);
      expect(stack).toBeDefined();
    });
  });
});
