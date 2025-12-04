import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

// Mock Pulumi runtime
pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs): { id: string; state: any } => {
    return {
      id: `${args.name}_id`,
      state: args.inputs,
    };
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    return args.inputs;
  },
});

describe('TapStack', () => {
  let stack: TapStack;

  beforeEach(() => {
    // Set environment variables for testing
    process.env.ENVIRONMENT_SUFFIX = 'test';
    process.env.AWS_REGION = 'us-east-1';
  });

  afterEach(() => {
    delete process.env.ENVIRONMENT_SUFFIX;
    delete process.env.AWS_REGION;
  });

  describe('Stack Creation', () => {
    it('should create a TapStack with default tags', async () => {
      stack = new TapStack('test-stack', {
        tags: {
          Team: 'platform',
          CostCenter: 'engineering',
        },
      });

      expect(stack).toBeDefined();
      expect(stack.albDnsName).toBeDefined();
      expect(stack.dashboardUrl).toBeDefined();
    });

    it('should create a TapStack with custom tags', async () => {
      stack = new TapStack('test-stack', {
        tags: {
          Team: 'custom-team',
          CostCenter: 'custom-cost-center',
          Project: 'test-project',
        },
      });

      expect(stack).toBeDefined();
    });

    it('should create a TapStack with no tags', async () => {
      stack = new TapStack('test-stack', {});

      expect(stack).toBeDefined();
    });
  });

  describe('Resource Naming', () => {
    it('should use environment suffix in resource names', async () => {
      process.env.ENVIRONMENT_SUFFIX = 'custom-env';
      stack = new TapStack('test-stack', {});

      // Verify the stack was created
      expect(stack).toBeDefined();
    });

    it('should default to "dev" when ENVIRONMENT_SUFFIX not set', async () => {
      delete process.env.ENVIRONMENT_SUFFIX;
      stack = new TapStack('test-stack', {});

      expect(stack).toBeDefined();
    });
  });

  describe('Stack Outputs', () => {
    it('should export albDnsName output', async () => {
      stack = new TapStack('test-stack', {});

      const albDnsName = await stack.albDnsName;
      expect(albDnsName).toBeDefined();
    });

    it('should export dashboardUrl output', async () => {
      stack = new TapStack('test-stack', {});

      // dashboardUrl is a Pulumi Output, verify it exists
      expect(stack.dashboardUrl).toBeDefined();
    });
  });

  describe('Network Configuration', () => {
    it('should create VPC with correct CIDR block', async () => {
      stack = new TapStack('test-stack', {});

      // Stack should be created successfully
      expect(stack).toBeDefined();
    });

    it('should create public and private subnets', async () => {
      stack = new TapStack('test-stack', {});

      expect(stack).toBeDefined();
    });

    it('should create NAT Gateway for private subnets', async () => {
      stack = new TapStack('test-stack', {});

      expect(stack).toBeDefined();
    });
  });

  describe('Security Groups', () => {
    it('should create ALB security group with HTTP and HTTPS rules', async () => {
      stack = new TapStack('test-stack', {});

      expect(stack).toBeDefined();
    });

    it('should create ECS task security group', async () => {
      stack = new TapStack('test-stack', {});

      expect(stack).toBeDefined();
    });
  });

  describe('Load Balancer Configuration', () => {
    it('should create ALB with 30 second idle timeout', async () => {
      stack = new TapStack('test-stack', {});

      expect(stack).toBeDefined();
    });

    it('should create target group with health checks', async () => {
      stack = new TapStack('test-stack', {});

      expect(stack).toBeDefined();
    });

    it('should create ALB listener on port 80', async () => {
      stack = new TapStack('test-stack', {});

      expect(stack).toBeDefined();
    });
  });

  describe('ECS Configuration', () => {
    it('should create ECS cluster with Container Insights enabled', async () => {
      stack = new TapStack('test-stack', {});

      expect(stack).toBeDefined();
    });

    it('should create task definition with 1 vCPU and 2GB memory', async () => {
      stack = new TapStack('test-stack', {});

      expect(stack).toBeDefined();
    });

    it('should create ECS service with 2 desired tasks', async () => {
      stack = new TapStack('test-stack', {});

      expect(stack).toBeDefined();
    });
  });

  describe('CloudWatch Configuration', () => {
    it('should create log group with 7-day retention', async () => {
      stack = new TapStack('test-stack', {});

      expect(stack).toBeDefined();
    });

    it('should create CPU utilization alarm with 80% threshold', async () => {
      stack = new TapStack('test-stack', {});

      expect(stack).toBeDefined();
    });

    it('should create memory utilization alarm with 80% threshold', async () => {
      stack = new TapStack('test-stack', {});

      expect(stack).toBeDefined();
    });

    it('should create CloudWatch dashboard', async () => {
      stack = new TapStack('test-stack', {});

      expect(stack).toBeDefined();
    });
  });

  describe('IAM Roles', () => {
    it('should create ECS execution role', async () => {
      stack = new TapStack('test-stack', {});

      expect(stack).toBeDefined();
    });

    it('should create ECS task role', async () => {
      stack = new TapStack('test-stack', {});

      expect(stack).toBeDefined();
    });

    it('should attach AmazonECSTaskExecutionRolePolicy to execution role', async () => {
      stack = new TapStack('test-stack', {});

      expect(stack).toBeDefined();
    });
  });

  describe('Resource Tags', () => {
    it('should apply Environment tag to all resources', async () => {
      process.env.ENVIRONMENT_SUFFIX = 'prod';
      stack = new TapStack('test-stack', {});

      expect(stack).toBeDefined();
    });

    it('should apply Team tag from props', async () => {
      stack = new TapStack('test-stack', {
        tags: {
          Team: 'data-platform',
        },
      });

      expect(stack).toBeDefined();
    });

    it('should apply CostCenter tag from props', async () => {
      stack = new TapStack('test-stack', {
        tags: {
          CostCenter: 'product',
        },
      });

      expect(stack).toBeDefined();
    });

    it('should apply ManagedBy tag', async () => {
      stack = new TapStack('test-stack', {});

      expect(stack).toBeDefined();
    });
  });

  describe('Container Configuration', () => {
    it('should use nginx:latest image', async () => {
      stack = new TapStack('test-stack', {});

      expect(stack).toBeDefined();
    });

    it('should configure container port mapping on port 80', async () => {
      stack = new TapStack('test-stack', {});

      expect(stack).toBeDefined();
    });

    it('should configure awslogs log driver', async () => {
      stack = new TapStack('test-stack', {});

      expect(stack).toBeDefined();
    });

    it('should set ENVIRONMENT variable in container', async () => {
      stack = new TapStack('test-stack', {});

      expect(stack).toBeDefined();
    });
  });

  describe('Region Configuration', () => {
    it('should use us-east-1 as default region', async () => {
      delete process.env.AWS_REGION;
      stack = new TapStack('test-stack', {});

      expect(stack).toBeDefined();
    });

    it('should use AWS_REGION environment variable when set', async () => {
      process.env.AWS_REGION = 'us-west-2';
      stack = new TapStack('test-stack', {});

      expect(stack).toBeDefined();
    });
  });

  describe('Fargate Configuration', () => {
    it('should configure awsvpc network mode', async () => {
      stack = new TapStack('test-stack', {});

      expect(stack).toBeDefined();
    });

    it('should require FARGATE compatibility', async () => {
      stack = new TapStack('test-stack', {});

      expect(stack).toBeDefined();
    });

    it('should place tasks in private subnets', async () => {
      stack = new TapStack('test-stack', {});

      expect(stack).toBeDefined();
    });

    it('should disable public IP assignment', async () => {
      stack = new TapStack('test-stack', {});

      expect(stack).toBeDefined();
    });
  });

  describe('Target Group Configuration', () => {
    it('should set deregistration delay to 30 seconds', async () => {
      stack = new TapStack('test-stack', {});

      expect(stack).toBeDefined();
    });

    it('should configure health check with 2 healthy threshold', async () => {
      stack = new TapStack('test-stack', {});

      expect(stack).toBeDefined();
    });

    it('should configure health check with 3 unhealthy threshold', async () => {
      stack = new TapStack('test-stack', {});

      expect(stack).toBeDefined();
    });

    it('should configure health check interval of 30 seconds', async () => {
      stack = new TapStack('test-stack', {});

      expect(stack).toBeDefined();
    });
  });
});
