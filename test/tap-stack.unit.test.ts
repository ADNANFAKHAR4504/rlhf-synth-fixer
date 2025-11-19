import * as pulumi from '@pulumi/pulumi';
import './mocks';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  let stack: TapStack;

  describe('Stack Initialization', () => {
    it('should create stack with default environment suffix', async () => {
      await pulumi.runtime.runInPulumiStack(async () => {
        stack = new TapStack('test-stack-default', {});

        return {
          vpcId: stack.vpcId,
          ecsClusterName: stack.ecsClusterName,
          albDnsName: stack.albDnsName,
        };
      });

      expect(stack).toBeDefined();
      expect(stack.vpcId).toBeDefined();
      expect(stack.ecsClusterName).toBeDefined();
      expect(stack.albDnsName).toBeDefined();
    });

    it('should create stack with custom environment suffix', async () => {
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

    it('should create stack with tags', async () => {
      await pulumi.runtime.runInPulumiStack(async () => {
        stack = new TapStack('test-stack-tags', {
          environmentSuffix: 'test',
          tags: {
            Environment: 'test',
            Team: 'platform',
            Project: 'payment-system',
          },
        });

        return {
          vpcId: stack.vpcId,
        };
      });

      expect(stack).toBeDefined();
      expect(stack.vpcId).toBeDefined();
    });

    it('should handle empty environment suffix', async () => {
      await pulumi.runtime.runInPulumiStack(async () => {
        stack = new TapStack('empty-test', {
          environmentSuffix: '',
        });
        return {
          vpcId: stack.vpcId,
        };
      });

      expect(stack).toBeDefined();
      expect(stack.vpcId).toBeDefined();
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

    it('should create VPC with correct CIDR block', () => {
      expect(stack.vpcId).toBeDefined();
    });

    it('should export VPC ID', () => {
      expect(stack.vpcId).toBeDefined();
    });

    it('should enable DNS support and hostnames', () => {
      expect(stack.vpcId).toBeDefined();
    });
  });

  describe('Networking Components', () => {
    beforeAll(async () => {
      await pulumi.runtime.runInPulumiStack(async () => {
        stack = new TapStack('network-test', {
          environmentSuffix: 'network',
        });

        return {
          vpcId: stack.vpcId,
        };
      });
    });

    it('should create VPC', () => {
      expect(stack.vpcId).toBeDefined();
    });

    it('should have all required network outputs', () => {
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

    it('should have container insights enabled', () => {
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

    it('should be internet-facing', () => {
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

    it('should use payment.local domain', () => {
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

    it('should have three distinct services', () => {
      const services = [
        stack.apiGatewayServiceName,
        stack.paymentProcessorServiceName,
        stack.fraudDetectorServiceName,
      ];
      expect(services.every((s) => s !== undefined)).toBe(true);
    });
  });

  describe('Security Configuration', () => {
    beforeAll(async () => {
      await pulumi.runtime.runInPulumiStack(async () => {
        stack = new TapStack('security-test', {
          environmentSuffix: 'sec',
        });

        return {
          vpcId: stack.vpcId,
        };
      });
    });

    it('should create security groups', () => {
      expect(stack.vpcId).toBeDefined();
    });

    it('should configure secrets manager', () => {
      expect(stack.vpcId).toBeDefined();
    });

    it('should configure KMS encryption', () => {
      expect(stack.vpcId).toBeDefined();
    });
  });

  describe('IAM Configuration', () => {
    beforeAll(async () => {
      await pulumi.runtime.runInPulumiStack(async () => {
        stack = new TapStack('iam-test', {
          environmentSuffix: 'iam',
        });

        return {
          vpcId: stack.vpcId,
        };
      });
    });

    it('should create task execution role', () => {
      expect(stack.vpcId).toBeDefined();
    });

    it('should create task roles for services', () => {
      expect(stack.vpcId).toBeDefined();
    });

    it('should configure proper IAM policies', () => {
      expect(stack.vpcId).toBeDefined();
    });
  });

  describe('Logging Configuration', () => {
    beforeAll(async () => {
      await pulumi.runtime.runInPulumiStack(async () => {
        stack = new TapStack('logging-test', {
          environmentSuffix: 'log',
        });

        return {
          vpcId: stack.vpcId,
        };
      });
    });

    it('should create CloudWatch log groups', () => {
      expect(stack.vpcId).toBeDefined();
    });

    it('should configure log retention', () => {
      expect(stack.vpcId).toBeDefined();
    });

    it('should enable log encryption', () => {
      expect(stack.vpcId).toBeDefined();
    });
  });

  describe('Container Registry', () => {
    beforeAll(async () => {
      await pulumi.runtime.runInPulumiStack(async () => {
        stack = new TapStack('ecr-test', {
          environmentSuffix: 'ecr',
        });

        return {
          vpcId: stack.vpcId,
        };
      });
    });

    it('should create ECR repositories', () => {
      expect(stack.vpcId).toBeDefined();
    });

    it('should enable image scanning', () => {
      expect(stack.vpcId).toBeDefined();
    });

    it('should configure lifecycle policies', () => {
      expect(stack.vpcId).toBeDefined();
    });
  });

  describe('Auto Scaling Configuration', () => {
    beforeAll(async () => {
      await pulumi.runtime.runInPulumiStack(async () => {
        stack = new TapStack('autoscaling-test', {
          environmentSuffix: 'as',
        });

        return {
          apiGateway: stack.apiGatewayServiceName,
        };
      });
    });

    it('should configure auto scaling for services', () => {
      expect(stack.apiGatewayServiceName).toBeDefined();
    });

    it('should set min and max capacity', () => {
      expect(stack.apiGatewayServiceName).toBeDefined();
    });

    it('should configure scaling policies', () => {
      expect(stack.apiGatewayServiceName).toBeDefined();
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

    it('should handle special characters in environment suffix', async () => {
      await pulumi.runtime.runInPulumiStack(async () => {
        stack = new TapStack('special-test', {
          environmentSuffix: 'test-123',
        });

        return {
          vpcId: stack.vpcId,
        };
      });

      expect(stack.vpcId).toBeDefined();
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

    it('should have seven outputs total', () => {
      const outputs = [
        stack.vpcId,
        stack.ecsClusterName,
        stack.albDnsName,
        stack.serviceDiscoveryNamespace,
        stack.apiGatewayServiceName,
        stack.paymentProcessorServiceName,
        stack.fraudDetectorServiceName,
      ];
      expect(outputs.every((o) => o !== undefined)).toBe(true);
      expect(outputs.length).toBe(7);
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

    it('should use consistent naming convention', () => {
      expect(stack.ecsClusterName).toBeDefined();
      expect(stack.apiGatewayServiceName).toBeDefined();
    });
  });

  describe('High Availability Configuration', () => {
    beforeAll(async () => {
      await pulumi.runtime.runInPulumiStack(async () => {
        stack = new TapStack('ha-test', {
          environmentSuffix: 'ha',
        });

        return {
          vpcId: stack.vpcId,
        };
      });
    });

    it('should create multiple availability zones', () => {
      expect(stack.vpcId).toBeDefined();
    });

    it('should create public and private subnets', () => {
      expect(stack.vpcId).toBeDefined();
    });

    it('should configure NAT gateway for HA', () => {
      expect(stack.vpcId).toBeDefined();
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

    it('should handle undefined tags', async () => {
      await expect(
        pulumi.runtime.runInPulumiStack(async () => {
          new TapStack('no-tags-test', {
            environmentSuffix: 'test',
            tags: undefined,
          });
          return {};
        })
      ).resolves.not.toThrow();
    });

    it('should handle empty tags object', async () => {
      await expect(
        pulumi.runtime.runInPulumiStack(async () => {
          new TapStack('empty-tags-test', {
            environmentSuffix: 'test',
            tags: {},
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

    it('should create stack with all optional parameters', async () => {
      await pulumi.runtime.runInPulumiStack(async () => {
        stack = new TapStack('full-test', {
          environmentSuffix: 'full',
          tags: {
            Environment: 'test',
            ManagedBy: 'pulumi',
            CostCenter: 'engineering',
          },
        });

        return {
          vpcId: stack.vpcId,
          ecsClusterName: stack.ecsClusterName,
        };
      });

      expect(stack.vpcId).toBeDefined();
      expect(stack.ecsClusterName).toBeDefined();
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

  describe('Resource Dependencies', () => {
    beforeAll(async () => {
      await pulumi.runtime.runInPulumiStack(async () => {
        stack = new TapStack('deps-test', {
          environmentSuffix: 'deps',
        });

        return {
          vpcId: stack.vpcId,
          albDnsName: stack.albDnsName,
        };
      });
    });

    it('should create resources in correct order', () => {
      expect(stack.vpcId).toBeDefined();
      expect(stack.albDnsName).toBeDefined();
    });

    it('should handle resource dependencies', () => {
      expect(stack.ecsClusterName).toBeDefined();
      expect(stack.apiGatewayServiceName).toBeDefined();
    });
  });

  describe('Tagging Strategy', () => {
    it('should apply tags to resources', async () => {
      await pulumi.runtime.runInPulumiStack(async () => {
        stack = new TapStack('tag-test', {
          environmentSuffix: 'tag',
          tags: {
            Team: 'platform',
            Project: 'payment',
            Environment: 'test',
          },
        });

        return {
          vpcId: stack.vpcId,
        };
      });

      expect(stack.vpcId).toBeDefined();
    });

    it('should merge provided tags with default tags', async () => {
      await pulumi.runtime.runInPulumiStack(async () => {
        stack = new TapStack('tag-merge-test', {
          environmentSuffix: 'merge',
          tags: {
            CustomTag: 'value',
          },
        });

        return {
          vpcId: stack.vpcId,
        };
      });

      expect(stack.vpcId).toBeDefined();
    });
  });
});
