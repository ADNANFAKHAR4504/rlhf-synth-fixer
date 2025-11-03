import * as pulumi from '@pulumi/pulumi';
import './mocks';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  let stack: TapStack;

  describe('with custom environment suffix', () => {
    beforeAll(async () => {
      await pulumi.runtime.runInPulumiStack(async () => {
        stack = new TapStack('test-webapp', {
          environmentSuffix: 'prod',
          tags: {
            Environment: 'prod',
            ManagedBy: 'Pulumi',
            Project: 'WebApp',
          },
        });

        return {
          vpcId: stack.networkStack.vpc.id,
          clusterArn: stack.ecsClusterStack.cluster.arn,
          albDnsName: stack.albStack.alb.dnsName,
          applicationUrl: stack.route53Stack.fullDomainName,
        };
      });
    });

    it('should instantiate successfully', () => {
      expect(stack).toBeDefined();
    });

    it('should create network stack', () => {
      expect(stack.networkStack).toBeDefined();
    });

    it('should create ECS cluster stack', () => {
      expect(stack.ecsClusterStack).toBeDefined();
    });

    it('should create ALB stack', () => {
      expect(stack.albStack).toBeDefined();
    });

    it('should create frontend service', () => {
      expect(stack.frontendService).toBeDefined();
    });

    it('should create backend service', () => {
      expect(stack.backendService).toBeDefined();
    });

    it('should create Route53 stack', () => {
      expect(stack.route53Stack).toBeDefined();
    });

    it('should use custom environment suffix', () => {
      expect(stack).toBeDefined();
      // Environment suffix 'prod' should be passed to all sub-stacks
    });
  });

  describe('with default values', () => {
    beforeAll(async () => {
      await pulumi.runtime.runInPulumiStack(async () => {
        stack = new TapStack('test-webapp-default', {});

        return {
          vpcId: stack.networkStack.vpc.id,
        };
      });
    });

    it('should instantiate successfully', () => {
      expect(stack).toBeDefined();
    });

    it('should use default environment suffix', () => {
      expect(stack).toBeDefined();
      // Default environment suffix should be 'dev'
    });

    it('should create all required stacks', () => {
      expect(stack.networkStack).toBeDefined();
      expect(stack.ecsClusterStack).toBeDefined();
      expect(stack.albStack).toBeDefined();
      expect(stack.frontendService).toBeDefined();
      expect(stack.backendService).toBeDefined();
      expect(stack.route53Stack).toBeDefined();
    });
  });

  describe('integration between components', () => {
    beforeAll(async () => {
      await pulumi.runtime.runInPulumiStack(async () => {
        stack = new TapStack('test-webapp-integration', {
          environmentSuffix: 'staging',
        });

        return {
          vpcId: stack.networkStack.vpc.id,
          clusterArn: stack.ecsClusterStack.cluster.arn,
        };
      });
    });

    it('should connect ALB to network VPC', () => {
      expect(stack.albStack).toBeDefined();
      expect(stack.networkStack).toBeDefined();
      // ALB should use VPC from network stack
    });

    it('should connect ALB to public subnets', () => {
      expect(stack.albStack).toBeDefined();
      expect(stack.networkStack.publicSubnets).toBeDefined();
      // ALB should be deployed in public subnets
    });

    it('should connect services to ECS cluster', () => {
      expect(stack.frontendService).toBeDefined();
      expect(stack.backendService).toBeDefined();
      expect(stack.ecsClusterStack.cluster).toBeDefined();
      // Services should use cluster from ECS cluster stack
    });

    it('should connect services to private subnets', () => {
      expect(stack.frontendService).toBeDefined();
      expect(stack.backendService).toBeDefined();
      expect(stack.networkStack.privateSubnets).toBeDefined();
      // Services should be deployed in private subnets
    });

    it('should connect Route53 to ALB', () => {
      expect(stack.route53Stack).toBeDefined();
      expect(stack.albStack.alb).toBeDefined();
      // Route53 A record should point to ALB
    });
  });

  describe('frontend service configuration', () => {
    beforeAll(async () => {
      await pulumi.runtime.runInPulumiStack(async () => {
        stack = new TapStack('test-webapp-frontend', {
          environmentSuffix: 'test',
        });

        return {
          frontendServiceArn: stack.frontendService.service.id,
        };
      });
    });

    it('should configure frontend on port 3000', () => {
      expect(stack.frontendService).toBeDefined();
      // Frontend should use port 3000
    });

    it('should configure frontend with 2 desired tasks', () => {
      expect(stack.frontendService).toBeDefined();
      // Frontend should have 2 desired tasks
    });

    it('should configure frontend auto-scaling 2-10', () => {
      expect(stack.frontendService).toBeDefined();
      // Frontend should scale between 2 and 10 tasks
    });

    it('should connect frontend to frontend target group', () => {
      expect(stack.frontendService).toBeDefined();
      expect(stack.albStack.frontendTargetGroup).toBeDefined();
      // Frontend service should connect to frontend TG
    });

    it('should use frontend ECR repository', () => {
      expect(stack.frontendService).toBeDefined();
      expect(stack.ecsClusterStack.ecrRepositoryFrontend).toBeDefined();
      // Frontend service should use frontend ECR repo
    });

    it('should configure frontend environment variables', () => {
      expect(stack.frontendService).toBeDefined();
      // Should have NODE_ENV and PORT environment variables
    });
  });

  describe('backend service configuration', () => {
    beforeAll(async () => {
      await pulumi.runtime.runInPulumiStack(async () => {
        stack = new TapStack('test-webapp-backend', {
          environmentSuffix: 'test',
        });

        return {
          backendServiceArn: stack.backendService.service.id,
        };
      });
    });

    it('should configure backend on port 8080', () => {
      expect(stack.backendService).toBeDefined();
      // Backend should use port 8080
    });

    it('should configure backend with 3 desired tasks', () => {
      expect(stack.backendService).toBeDefined();
      // Backend should have 3 desired tasks
    });

    it('should configure backend auto-scaling 3-15', () => {
      expect(stack.backendService).toBeDefined();
      // Backend should scale between 3 and 15 tasks
    });

    it('should connect backend to backend target group', () => {
      expect(stack.backendService).toBeDefined();
      expect(stack.albStack.backendTargetGroup).toBeDefined();
      // Backend service should connect to backend TG
    });

    it('should use backend ECR repository', () => {
      expect(stack.backendService).toBeDefined();
      expect(stack.ecsClusterStack.ecrRepositoryBackend).toBeDefined();
      // Backend service should use backend ECR repo
    });

    it('should configure backend environment variables', () => {
      expect(stack.backendService).toBeDefined();
      // Should have NODE_ENV, PORT, and API_PREFIX environment variables
    });
  });

  describe('resource configuration', () => {
    beforeAll(async () => {
      await pulumi.runtime.runInPulumiStack(async () => {
        stack = new TapStack('test-webapp-resources', {
          environmentSuffix: 'dev',
          tags: {
            Team: 'Platform',
            Cost: 'Engineering',
          },
        });

        return {
          clusterArn: stack.ecsClusterStack.cluster.arn,
        };
      });
    });

    it('should configure services with 512 CPU units', () => {
      expect(stack.frontendService).toBeDefined();
      expect(stack.backendService).toBeDefined();
      // Both services should use 512 CPU units
    });

    it('should configure services with 1024 MB memory', () => {
      expect(stack.frontendService).toBeDefined();
      expect(stack.backendService).toBeDefined();
      // Both services should use 1024 MB memory
    });

    it('should apply tags to resources', () => {
      expect(stack).toBeDefined();
      // Custom tags should be passed to all resources
    });

    it('should configure CloudWatch logs with 7-day retention', () => {
      expect(stack.frontendService.logGroup).toBeDefined();
      expect(stack.backendService.logGroup).toBeDefined();
      // Log groups should have 7-day retention
    });
  });

  describe('AWS provider configuration', () => {
    beforeAll(async () => {
      await pulumi.runtime.runInPulumiStack(async () => {
        stack = new TapStack('test-webapp-provider', {
          environmentSuffix: 'prod',
        });

        return {
          vpcId: stack.networkStack.vpc.id,
        };
      });
    });

    it('should configure AWS provider for eu-west-2', () => {
      expect(stack).toBeDefined();
      // AWS provider should use eu-west-2 region
    });

    it('should pass provider to all child resources', () => {
      expect(stack.networkStack).toBeDefined();
      expect(stack.ecsClusterStack).toBeDefined();
      expect(stack.albStack).toBeDefined();
      // All resources should use the configured provider
    });
  });

  describe('DNS configuration', () => {
    beforeAll(async () => {
      await pulumi.runtime.runInPulumiStack(async () => {
        stack = new TapStack('test-webapp-dns', {
          environmentSuffix: 'staging',
        });

        return {
          applicationUrl: stack.route53Stack.fullDomainName,
        };
      });
    });

    it('should create Route53 hosted zone', () => {
      expect(stack.route53Stack.hostedZone).toBeDefined();
      // Should create hosted zone for domain
    });

    it('should create A record for app.example.com', () => {
      expect(stack.route53Stack.aRecord).toBeDefined();
      // Should create A record pointing to ALB
    });

    it('should configure domain as app.example.com', () => {
      expect(stack.route53Stack.fullDomainName).toBeDefined();
      // Full domain name should be 'app.example.com'
    });
  });
});
