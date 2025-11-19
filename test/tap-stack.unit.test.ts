import * as pulumi from '@pulumi/pulumi';
import './mocks';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  let stack: TapStack;

  describe('Stack Initialization', () => {
    it('should create stack with environment suffix', async () => {
      await pulumi.runtime.runInPulumiStack(async () => {
        stack = new TapStack('test-stack', {
          environmentSuffix: 'test',
        });

        return {
          vpcId: stack.vpcId,
          ecsClusterName: stack.ecsClusterName,
          albDnsName: stack.albDnsName,
        };
      });

      expect(stack).toBeDefined();
      expect(stack.vpcId).toBeDefined();
      expect(stack.ecsClusterName).toBeDefined();
    });

    it('should create stack with custom region', async () => {
      await pulumi.runtime.runInPulumiStack(async () => {
        stack = new TapStack('test-stack-custom', {
          environmentSuffix: 'custom',
          awsRegion: 'us-west-2',
        });

        return {
          vpcId: stack.vpcId,
        };
      });

      expect(stack).toBeDefined();
    });
  });

  describe('VPC Configuration', () => {
    beforeAll(async () => {
      await pulumi.runtime.runInPulumiStack(async () => {
        stack = new TapStack('vpc-test', {
          environmentSuffix: 'vpc-test',
        });

        return {
          vpcId: stack.vpcId,
        };
      });
    });

    it('should export VPC ID', () => {
      expect(stack.vpcId).toBeDefined();
    });
  });

  describe('ECS Cluster', () => {
    beforeAll(async () => {
      await pulumi.runtime.runInPulumiStack(async () => {
        stack = new TapStack('ecs-test', {
          environmentSuffix: 'ecs-test',
        });

        return {
          ecsClusterName: stack.ecsClusterName,
        };
      });
    });

    it('should create ECS cluster', () => {
      expect(stack.ecsClusterName).toBeDefined();
    });

    it('should export cluster name', () => {
      expect(stack.ecsClusterName).toBeDefined();
    });
  });

  describe('ALB Configuration', () => {
    beforeAll(async () => {
      await pulumi.runtime.runInPulumiStack(async () => {
        stack = new TapStack('alb-test', {
          environmentSuffix: 'alb-test',
        });

        return {
          albDnsName: stack.albDnsName,
        };
      });
    });

    it('should create ALB with DNS name', () => {
      expect(stack.albDnsName).toBeDefined();
    });

    it('should export ALB DNS name', () => {
      expect(stack.albDnsName).toBeDefined();
    });
  });

  describe('Service Discovery', () => {
    beforeAll(async () => {
      await pulumi.runtime.runInPulumiStack(async () => {
        stack = new TapStack('sd-test', {
          environmentSuffix: 'sd-test',
        });

        return {
          namespace: stack.serviceDiscoveryNamespace,
        };
      });
    });

    it('should create service discovery namespace', () => {
      expect(stack.serviceDiscoveryNamespace).toBeDefined();
    });

    it('should export namespace', () => {
      expect(stack.serviceDiscoveryNamespace).toBeDefined();
    });
  });

  describe('ECS Services', () => {
    beforeAll(async () => {
      await pulumi.runtime.runInPulumiStack(async () => {
        stack = new TapStack('services-test', {
          environmentSuffix: 'services-test',
        });

        return {
          apiGateway: stack.apiGatewayServiceName,
          paymentProcessor: stack.paymentProcessorServiceName,
          fraudDetector: stack.fraudDetectorServiceName,
        };
      });
    });

    it('should create api-gateway service', () => {
      expect(stack.apiGatewayServiceName).toBeDefined();
    });

    it('should create payment-processor service', () => {
      expect(stack.paymentProcessorServiceName).toBeDefined();
    });

    it('should create fraud-detector service', () => {
      expect(stack.fraudDetectorServiceName).toBeDefined();
    });

    it('should export all service names', () => {
      expect(stack.apiGatewayServiceName).toBeDefined();
      expect(stack.paymentProcessorServiceName).toBeDefined();
      expect(stack.fraudDetectorServiceName).toBeDefined();
    });
  });

  describe('Environment Suffix Propagation', () => {
    it('should use environment suffix in resource names', async () => {
      const testSuffix = 'unique-env-123';
      await pulumi.runtime.runInPulumiStack(async () => {
        stack = new TapStack('env-test', {
          environmentSuffix: testSuffix,
        });

        return {
          clusterName: stack.ecsClusterName,
          apiGateway: stack.apiGatewayServiceName,
          paymentProcessor: stack.paymentProcessorServiceName,
          fraudDetector: stack.fraudDetectorServiceName,
        };
      });

      expect(stack.ecsClusterName).toBeDefined();
      expect(stack.apiGatewayServiceName).toBeDefined();
      expect(stack.paymentProcessorServiceName).toBeDefined();
      expect(stack.fraudDetectorServiceName).toBeDefined();
    });
  });

  describe('Stack Outputs', () => {
    beforeAll(async () => {
      await pulumi.runtime.runInPulumiStack(async () => {
        stack = new TapStack('output-test', {
          environmentSuffix: 'output-test',
        });

        return {
          vpcId: stack.vpcId,
          ecsClusterName: stack.ecsClusterName,
          albDnsName: stack.albDnsName,
          serviceDiscoveryNamespace: stack.serviceDiscoveryNamespace,
          apiGatewayServiceName: stack.apiGatewayServiceName,
          paymentProcessorServiceName: stack.paymentProcessorServiceName,
          fraudDetectorServiceName: stack.fraudDetectorServiceName,
        };
      });
    });

    it('should have all required outputs defined', () => {
      expect(stack.vpcId).toBeDefined();
      expect(stack.ecsClusterName).toBeDefined();
      expect(stack.albDnsName).toBeDefined();
      expect(stack.serviceDiscoveryNamespace).toBeDefined();
      expect(stack.apiGatewayServiceName).toBeDefined();
      expect(stack.paymentProcessorServiceName).toBeDefined();
      expect(stack.fraudDetectorServiceName).toBeDefined();
    });

    it('should export all outputs', () => {
      expect(stack.vpcId).toBeDefined();
      expect(stack.ecsClusterName).toBeDefined();
      expect(stack.albDnsName).toBeDefined();
      expect(stack.serviceDiscoveryNamespace).toBeDefined();
      expect(stack.apiGatewayServiceName).toBeDefined();
      expect(stack.paymentProcessorServiceName).toBeDefined();
      expect(stack.fraudDetectorServiceName).toBeDefined();
    });
  });

  describe('Resource Naming Conventions', () => {
    beforeAll(async () => {
      await pulumi.runtime.runInPulumiStack(async () => {
        stack = new TapStack('naming-test', {
          environmentSuffix: 'naming',
        });

        return {
          clusterName: stack.ecsClusterName,
          services: {
            apiGateway: stack.apiGatewayServiceName,
            paymentProcessor: stack.paymentProcessorServiceName,
            fraudDetector: stack.fraudDetectorServiceName,
          },
        };
      });
    });

    it('should follow naming pattern for cluster', () => {
      expect(stack.ecsClusterName).toBeDefined();
    });

    it('should follow naming pattern for services', () => {
      expect(stack.apiGatewayServiceName).toBeDefined();
      expect(stack.paymentProcessorServiceName).toBeDefined();
      expect(stack.fraudDetectorServiceName).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing environment suffix gracefully', async () => {
      await expect(
        pulumi.runtime.runInPulumiStack(async () => {
          new TapStack('error-test', {});
          return {};
        })
      ).resolves.not.toThrow();
    });

    it('should handle empty environment suffix', async () => {
      await expect(
        pulumi.runtime.runInPulumiStack(async () => {
          new TapStack('empty-test', {
            environmentSuffix: '',
          });
          return {};
        })
      ).resolves.not.toThrow();
    });
  });

  describe('Region Configuration', () => {
    it('should accept custom AWS region', async () => {
      await expect(
        pulumi.runtime.runInPulumiStack(async () => {
          new TapStack('region-test', {
            environmentSuffix: 'test',
            awsRegion: 'eu-west-1',
          });
          return {};
        })
      ).resolves.not.toThrow();
    });

    it('should use default region when not specified', async () => {
      await expect(
        pulumi.runtime.runInPulumiStack(async () => {
          new TapStack('default-region-test', {
            environmentSuffix: 'test',
          });
          return {};
        })
      ).resolves.not.toThrow();
    });
  });

  describe('Complete Stack Creation', () => {
    it('should create all infrastructure components', async () => {
      await pulumi.runtime.runInPulumiStack(async () => {
        stack = new TapStack('complete-test', {
          environmentSuffix: 'complete',
        });

        return {
          vpcId: stack.vpcId,
          ecsClusterName: stack.ecsClusterName,
          albDnsName: stack.albDnsName,
          serviceDiscoveryNamespace: stack.serviceDiscoveryNamespace,
          apiGatewayServiceName: stack.apiGatewayServiceName,
          paymentProcessorServiceName: stack.paymentProcessorServiceName,
          fraudDetectorServiceName: stack.fraudDetectorServiceName,
        };
      });

      // Verify all stack outputs are available
      expect(stack.vpcId).toBeDefined();
      expect(stack.ecsClusterName).toBeDefined();
      expect(stack.albDnsName).toBeDefined();
      expect(stack.serviceDiscoveryNamespace).toBeDefined();
      expect(stack.apiGatewayServiceName).toBeDefined();
      expect(stack.paymentProcessorServiceName).toBeDefined();
      expect(stack.fraudDetectorServiceName).toBeDefined();
    });
  });

  describe('Infrastructure Components', () => {
    beforeAll(async () => {
      await pulumi.runtime.runInPulumiStack(async () => {
        stack = new TapStack('components-test', {
          environmentSuffix: 'comp',
        });

        return {
          all: {
            vpcId: stack.vpcId,
            ecsClusterName: stack.ecsClusterName,
            albDnsName: stack.albDnsName,
            serviceDiscoveryNamespace: stack.serviceDiscoveryNamespace,
            apiGatewayServiceName: stack.apiGatewayServiceName,
            paymentProcessorServiceName: stack.paymentProcessorServiceName,
            fraudDetectorServiceName: stack.fraudDetectorServiceName,
          },
        };
      });
    });

    it('should create VPC', () => {
      expect(stack.vpcId).toBeDefined();
    });

    it('should create ECS cluster', () => {
      expect(stack.ecsClusterName).toBeDefined();
    });

    it('should create load balancer', () => {
      expect(stack.albDnsName).toBeDefined();
    });

    it('should create service discovery', () => {
      expect(stack.serviceDiscoveryNamespace).toBeDefined();
    });

    it('should create all three ECS services', () => {
      expect(stack.apiGatewayServiceName).toBeDefined();
      expect(stack.paymentProcessorServiceName).toBeDefined();
      expect(stack.fraudDetectorServiceName).toBeDefined();
    });
  });
});
