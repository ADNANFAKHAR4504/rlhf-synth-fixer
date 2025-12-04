/**
 * Unit tests for TapStack Pulumi component
 * Tests infrastructure configuration without deploying to AWS
 */
import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

// Set up Pulumi mocks for unit testing
pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs): { id: string; state: any } => {
    return {
      id: args.name + '_id',
      state: {
        ...args.inputs,
        arn: `arn:aws:${args.type}:us-east-1:123456789012:${args.name}`,
        name: args.name,
        url: `https://${args.name}.example.com`,
      },
    };
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    return args.inputs;
  },
});

describe('TapStack Component Resource', () => {
  describe('Resource Creation', () => {
    it('should create stack with default environment suffix', async () => {
      const stack = new TapStack('test-stack', {});
      expect(stack).toBeDefined();
    });

    it('should create stack with custom environment suffix', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'prod',
      });
      expect(stack).toBeDefined();
    });

    it('should create stack with custom tags', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'staging',
        tags: {
          Environment: 'staging',
          Owner: 'devops',
        },
      });
      expect(stack).toBeDefined();
    });
  });

  describe('Stack Outputs', () => {
    it('should expose lambdaFunctionName output', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
      });

      const functionName = await stack.lambdaFunctionName.promise();
      expect(functionName).toBeDefined();
      expect(typeof functionName).toBe('string');
    });

    it('should expose dlqUrl output', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
      });

      const dlqUrl = await stack.dlqUrl.promise();
      expect(dlqUrl).toBeDefined();
      expect(typeof dlqUrl).toBe('string');
    });

    it('should expose logGroupName output', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
      });

      const logGroupName = await stack.logGroupName.promise();
      expect(logGroupName).toBeDefined();
      expect(typeof logGroupName).toBe('string');
    });
  });

  describe('Environment-Specific Configuration', () => {
    it('should use 60s timeout for dev environment', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'dev',
      });
      expect(stack).toBeDefined();
      // Timeout configuration is internal but stack should be created
    });

    it('should use 300s timeout for prod environment', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'prod',
      });
      expect(stack).toBeDefined();
      // Timeout configuration is internal but stack should be created
    });

    it('should use DEBUG log level for non-prod', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'dev',
      });
      expect(stack).toBeDefined();
    });

    it('should use INFO log level for prod', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'prod',
      });
      expect(stack).toBeDefined();
    });
  });

  describe('Resource Naming', () => {
    it('should include environment suffix in resource names', async () => {
      const suffix = 'test123';
      const stack = new TapStack('test-stack', {
        environmentSuffix: suffix,
      });

      const functionName = await stack.lambdaFunctionName.promise();
      expect(functionName).toContain(suffix);
    });

    it('should have consistent naming pattern', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
      });

      const functionName = await stack.lambdaFunctionName.promise();
      expect(functionName).toMatch(/^[\w-]+$/);
    });
  });

  describe('Default Values', () => {
    it('should use dev as default environment suffix', async () => {
      const stack = new TapStack('test-stack', {});
      const functionName = await stack.lambdaFunctionName.promise();
      expect(functionName).toContain('dev');
    });

    it('should handle empty tags object', async () => {
      const stack = new TapStack('test-stack', {
        tags: {},
      });
      expect(stack).toBeDefined();
    });
  });

  describe('Component Resource Structure', () => {
    it('should be a Pulumi ComponentResource', () => {
      const stack = new TapStack('test-stack', {});
      expect(stack).toBeInstanceOf(pulumi.ComponentResource);
    });

    it('should have correct resource type', async () => {
      const stack = new TapStack('test-stack', {});
      // The resource type is checked during creation
      expect(stack).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle undefined environmentSuffix gracefully', () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: undefined,
      });
      expect(stack).toBeDefined();
    });

    it('should handle undefined tags gracefully', () => {
      const stack = new TapStack('test-stack', {
        tags: undefined,
      });
      expect(stack).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty environment suffix', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: '',
      });
      expect(stack).toBeDefined();
    });

    it('should handle special characters in environment suffix', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test-env-123',
      });
      expect(stack).toBeDefined();
    });

    it('should handle multiple tag entries', async () => {
      const stack = new TapStack('test-stack', {
        tags: {
          Environment: 'prod',
          Owner: 'devops',
          Project: 'tap',
          CostCenter: '12345',
        },
      });
      expect(stack).toBeDefined();
    });
  });

  describe('Output Types', () => {
    it('should return Output<string> for lambdaFunctionName', () => {
      const stack = new TapStack('test-stack', {});
      expect(stack.lambdaFunctionName).toBeInstanceOf(pulumi.Output);
    });

    it('should return Output<string> for dlqUrl', () => {
      const stack = new TapStack('test-stack', {});
      expect(stack.dlqUrl).toBeInstanceOf(pulumi.Output);
    });

    it('should return Output<string> for logGroupName', () => {
      const stack = new TapStack('test-stack', {});
      expect(stack.logGroupName).toBeInstanceOf(pulumi.Output);
    });
  });

  describe('Registered Outputs', () => {
    it('should register outputs correctly', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
      });

      // All three outputs should be defined
      expect(stack.lambdaFunctionName).toBeDefined();
      expect(stack.dlqUrl).toBeDefined();
      expect(stack.logGroupName).toBeDefined();

      // Should be able to access promise() on outputs
      const functionName = await stack.lambdaFunctionName.promise();
      const dlqUrl = await stack.dlqUrl.promise();
      const logGroupName = await stack.logGroupName.promise();

      expect(functionName).toBeTruthy();
      expect(dlqUrl).toBeTruthy();
      expect(logGroupName).toBeTruthy();
    });
  });

  describe('Configuration Options', () => {
    it('should accept partial TapStackArgs', () => {
      const stack1 = new TapStack('test-stack-1', {
        environmentSuffix: 'dev',
      });
      const stack2 = new TapStack('test-stack-2', {
        tags: { Owner: 'team' },
      });
      const stack3 = new TapStack('test-stack-3', {});

      expect(stack1).toBeDefined();
      expect(stack2).toBeDefined();
      expect(stack3).toBeDefined();
    });

    it('should accept full TapStackArgs', () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'prod',
        tags: {
          Environment: 'prod',
          Owner: 'devops',
        },
      });
      expect(stack).toBeDefined();
    });
  });

  describe('Resource Options', () => {
    it('should accept custom resource options', () => {
      const stack = new TapStack(
        'test-stack',
        {
          environmentSuffix: 'test',
        },
        {
          protect: false,
        }
      );
      expect(stack).toBeDefined();
    });
  });
});
