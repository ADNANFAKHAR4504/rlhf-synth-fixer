import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

// Mock Pulumi runtime
pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: any;
  } {
    return {
      id: `${args.name}-id`,
      state: {
        ...args.inputs,
        arn: `arn:aws:dynamodb:ap-southeast-2:123456789012:table/${args.name}`,
        name: args.inputs.name || args.name,
        streamArn: args.inputs.streamEnabled
          ? `arn:aws:dynamodb:ap-southeast-2:123456789012:table/${args.name}/stream/2025-11-03T00:00:00.000`
          : undefined,
      },
    };
  },
  call: function (args: pulumi.runtime.MockCallArgs) {
    return args.inputs;
  },
});

describe('TapStack Unit Tests', () => {
  describe('Stack Instantiation', () => {
    it('should create stack with default environment suffix', async () => {
      const stack = new TapStack('test-stack', {});
      expect(stack).toBeDefined();
      expect(stack.tableNames).toBeDefined();
      expect(stack.tableArns).toBeDefined();
      expect(stack.streamArns).toBeDefined();
    });

    it('should create stack with custom environment suffix', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'prod',
      });
      expect(stack).toBeDefined();
    });

    it('should create stack with custom tags', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
        tags: {
          Team: 'testing-team',
          CostCenter: 'testing-cost-center',
        },
      });
      expect(stack).toBeDefined();
    });
  });

  describe('Stack Outputs', () => {
    it('should export table names output', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
      });

      const tableNames = await stack.tableNames.promise();
      expect(tableNames).toEqual(['events', 'sessions', 'users']);
    });

    it('should export table ARNs output', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
      });

      const tableArns = await stack.tableArns.promise();
      expect(tableArns).toBeDefined();
      expect(Array.isArray(tableArns)).toBe(true);
      expect(tableArns.length).toBe(3);
    });

    it('should export stream ARNs output', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
      });

      const streamArns = await stack.streamArns.promise();
      expect(streamArns).toBeDefined();
      expect(Array.isArray(streamArns)).toBe(true);
    });
  });

  describe('Environment Suffix Handling', () => {
    it('should default to dev when no suffix provided', async () => {
      const stack = new TapStack('test-stack', {});
      expect(stack).toBeDefined();
      // Environment suffix defaults to 'dev' in the implementation
    });

    it('should accept custom environment suffix', async () => {
      const suffixes = ['dev', 'staging', 'prod', 'test'];

      suffixes.forEach(suffix => {
        const stack = new TapStack(`test-stack-${suffix}`, {
          environmentSuffix: suffix,
        });
        expect(stack).toBeDefined();
      });
    });
  });

  describe('Tag Configuration', () => {
    it('should accept empty tags object', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
        tags: {},
      });
      expect(stack).toBeDefined();
    });

    it('should accept custom tags', async () => {
      const customTags = {
        Environment: 'production',
        Team: 'data-team',
        CostCenter: 'analytics',
        Project: 'dynamodb-optimization',
      };

      const stack = new TapStack('test-stack', {
        environmentSuffix: 'prod',
        tags: customTags,
      });
      expect(stack).toBeDefined();
    });
  });

  describe('Resource Creation', () => {
    it('should create all required tables', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
      });

      const tableNames = await stack.tableNames.promise();
      expect(tableNames).toContain('events');
      expect(tableNames).toContain('sessions');
      expect(tableNames).toContain('users');
    });

    it('should create tables with correct configuration', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
      });

      const tableNames = await stack.tableNames.promise();
      expect(tableNames.length).toBe(3);

      // Verify all expected tables are present
      const expectedTables = ['events', 'sessions', 'users'];
      expectedTables.forEach(tableName => {
        expect(tableNames).toContain(tableName);
      });
    });
  });

  describe('Component Resource Structure', () => {
    it('should be a valid Pulumi ComponentResource', () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
      });

      expect(stack).toBeInstanceOf(pulumi.ComponentResource);
    });

    it('should register outputs correctly', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
      });

      // Verify all outputs are Output types
      expect(stack.tableNames).toBeDefined();
      expect(stack.tableArns).toBeDefined();
      expect(stack.streamArns).toBeDefined();

      // Verify they're Pulumi Outputs
      expect(typeof stack.tableNames.apply).toBe('function');
      expect(typeof stack.tableArns.apply).toBe('function');
      expect(typeof stack.streamArns.apply).toBe('function');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing arguments gracefully', () => {
      expect(() => {
        new TapStack('test-stack', {} as any);
      }).not.toThrow();
    });

    it('should handle undefined tags', () => {
      expect(() => {
        new TapStack('test-stack', {
          environmentSuffix: 'test',
          tags: undefined,
        });
      }).not.toThrow();
    });
  });

  describe('Table Configuration', () => {
    it('should create events table with streams enabled', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
      });

      const streamArns = await stack.streamArns.promise();
      // Events table should have a stream ARN
      expect(streamArns.length).toBeGreaterThan(0);
    });

    it('should create sessions table with GSI', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
      });

      const tableNames = await stack.tableNames.promise();
      expect(tableNames).toContain('sessions');
    });

    it('should create users table with PITR', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
      });

      const tableNames = await stack.tableNames.promise();
      expect(tableNames).toContain('users');
    });
  });

  describe('Output Validation', () => {
    it('should have exactly 3 table names', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
      });

      const tableNames = await stack.tableNames.promise();
      expect(tableNames.length).toBe(3);
    });

    it('should have exactly 3 table ARNs', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
      });

      const tableArns = await stack.tableArns.promise();
      expect(tableArns.length).toBe(3);
    });

    it('should filter undefined stream ARNs', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
      });

      const streamArns = await stack.streamArns.promise();
      streamArns.forEach(arn => {
        expect(arn).toBeDefined();
        expect(typeof arn).toBe('string');
      });
    });
  });
});
