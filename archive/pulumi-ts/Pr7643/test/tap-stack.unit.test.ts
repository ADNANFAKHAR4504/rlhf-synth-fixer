/**
 * Unit tests for TapStack Pulumi component
 *
 * These tests verify the TapStack component structure and configuration
 * without deploying actual AWS resources.
 */

import * as pulumi from '@pulumi/pulumi';

// Set up Pulumi mocks before imports
pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs): { id: string; state: any } => {
    return {
      id: `${args.name}-id`,
      state: args.inputs,
    };
  },
  call: (args: pulumi.runtime.MockCallArgs): any => {
    // Mock aws.ec2.getVpc
    if (args.token === 'aws:ec2/getVpc:getVpc') {
      return {
        id: 'vpc-mock',
        cidrBlock: '10.0.0.0/16',
      };
    }
    // Mock aws.ec2.getSubnets
    if (args.token === 'aws:ec2/getSubnets:getSubnets') {
      return {
        ids: ['subnet-1', 'subnet-2'],
      };
    }
    return {};
  },
});

import { TapStack, TapStackArgs } from '../lib/tap-stack';

describe('TapStack Component', () => {
  describe('Constructor', () => {
    it('should create TapStack with default environment suffix', async () => {
      const args: TapStackArgs = {};
      const stack = new TapStack('test-stack', args);
      expect(stack).toBeDefined();
      expect(stack.clusterName).toBeDefined();
      expect(stack.serviceName).toBeDefined();
      expect(stack.albDnsName).toBeDefined();
      expect(stack.serviceEndpoint).toBeDefined();

      const clusterName = await stack.clusterName.promise();
      expect(clusterName).toContain('ecs-cluster');
    });

    it('should create TapStack with custom environment suffix', async () => {
      const args: TapStackArgs = {
        environmentSuffix: 'prod',
      };
      const stack = new TapStack('test-stack-prod', args);
      expect(stack).toBeDefined();

      const clusterName = await stack.clusterName.promise();
      expect(clusterName).toContain('prod');
    });

    it('should create TapStack with custom tags', () => {
      const args: TapStackArgs = {
        environmentSuffix: 'staging',
        tags: {
          Owner: 'DevOps',
          CostCenter: 'Engineering',
        },
      };
      const stack = new TapStack('test-stack-staging', args);
      expect(stack).toBeDefined();
    });

    it('should create TapStack with empty tags object', () => {
      const args: TapStackArgs = {
        tags: {},
      };
      const stack = new TapStack('test-stack-empty-tags', args);
      expect(stack).toBeDefined();
    });

    it('should create TapStack with minimal configuration', async () => {
      const stack = new TapStack('minimal-stack', {});
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(TapStack);

      const serviceName = await stack.serviceName.promise();
      expect(serviceName).toContain('ecs-service');
    });

    it('should expose cluster name output', async () => {
      const stack = new TapStack('test-cluster-output', {
        environmentSuffix: 'test',
      });
      expect(stack.clusterName).toBeDefined();

      const clusterName = await stack.clusterName.promise();
      expect(clusterName).toBe('ecs-cluster-test');
    });

    it('should expose service name output', async () => {
      const stack = new TapStack('test-service-output', {
        environmentSuffix: 'test',
      });
      expect(stack.serviceName).toBeDefined();

      const serviceName = await stack.serviceName.promise();
      expect(serviceName).toBe('ecs-service-test');
    });

    it('should expose ALB DNS name output', () => {
      const stack = new TapStack('test-alb-output', {
        environmentSuffix: 'test',
      });
      expect(stack.albDnsName).toBeDefined();
    });

    it('should expose service endpoint output', () => {
      const stack = new TapStack('test-endpoint-output', {
        environmentSuffix: 'test',
      });
      expect(stack.serviceEndpoint).toBeDefined();
    });
  });

  describe('Interface Compliance', () => {
    it('should accept TapStackArgs interface', () => {
      const args: TapStackArgs = {
        environmentSuffix: 'compliance-test',
        tags: {
          Test: 'Interface',
        },
      };
      const stack = new TapStack('interface-test', args);
      expect(stack).toBeDefined();
    });

    it('should handle undefined environment suffix', async () => {
      const args: TapStackArgs = {
        environmentSuffix: undefined,
      };
      const stack = new TapStack('undefined-suffix', args);
      expect(stack).toBeDefined();

      // Should default to 'dev'
      const clusterName = await stack.clusterName.promise();
      expect(clusterName).toBe('ecs-cluster-dev');
    });

    it('should handle undefined tags', () => {
      const args: TapStackArgs = {
        tags: undefined,
      };
      const stack = new TapStack('undefined-tags', args);
      expect(stack).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle special characters in environment suffix', async () => {
      const args: TapStackArgs = {
        environmentSuffix: 'env-123-test',
      };
      const stack = new TapStack('special-chars', args);
      expect(stack).toBeDefined();

      const clusterName = await stack.clusterName.promise();
      expect(clusterName).toContain('env-123-test');
    });

    it('should handle long environment suffix', async () => {
      const args: TapStackArgs = {
        environmentSuffix: 'verylongenvironmentsuffix',
      };
      const stack = new TapStack('long-suffix', args);
      expect(stack).toBeDefined();

      const clusterName = await stack.clusterName.promise();
      expect(clusterName).toContain('verylongenvironmentsuffix');
    });

    it('should handle multiple tags', () => {
      const args: TapStackArgs = {
        tags: {
          Owner: 'TeamA',
          Project: 'ProjectX',
          CostCenter: 'CC123',
          Environment: 'Development',
        },
      };
      const stack = new TapStack('multi-tags', args);
      expect(stack).toBeDefined();
    });
  });

  describe('Output Properties', () => {
    it('should have all required output properties defined', () => {
      const stack = new TapStack('output-test', {
        environmentSuffix: 'test',
      });
      expect(stack).toHaveProperty('clusterName');
      expect(stack).toHaveProperty('serviceName');
      expect(stack).toHaveProperty('albDnsName');
      expect(stack).toHaveProperty('serviceEndpoint');
    });

    it('should format service endpoint correctly', async () => {
      const stack = new TapStack('endpoint-format-test', {
        environmentSuffix: 'test',
      });

      const endpoint = await stack.serviceEndpoint.promise();
      expect(endpoint).toMatch(/^http:\/\//);
    });
  });

  describe('Resource Configuration', () => {
    it('should include environment suffix in resource naming', async () => {
      const environmentSuffix = 'custom-env';
      const stack = new TapStack('resource-naming-test', {
        environmentSuffix,
      });

      const clusterName = await stack.clusterName.promise();
      const serviceName = await stack.serviceName.promise();

      expect(clusterName).toContain(environmentSuffix);
      expect(serviceName).toContain(environmentSuffix);
    });
  });
});
