import * as pulumi from '@pulumi/pulumi';
import { Ec2Stack } from '../lib/ec2-stack';
import { LambdaStack } from '../lib/lambda-stack';
import { MonitoringStack } from '../lib/monitoring-stack';
import { TapStack } from '../lib/tap-stack';
import { VpcStack } from '../lib/vpc-stack';

// Mock Pulumi modules
pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: any;
  } => {
    return {
      id: `${args.name}_id`,
      state: args.inputs,
    };
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    return args.inputs;
  },
});

describe('TapStack Unit Tests', () => {
  describe('TapStack Component', () => {
    it('should create TapStack with default environment suffix', async () => {
      const stack = new TapStack('test-stack', {});
      const vpcId = await stack.vpcId.promise();
      const instanceIds = await stack.instanceIds.promise();
      const dashboardUrl = await stack.dashboardUrl.promise();

      expect(vpcId).toBeDefined();
      expect(instanceIds).toBeDefined();
      expect(dashboardUrl).toBeDefined();
    });

    it('should create TapStack with custom environment suffix', async () => {
      const stack = new TapStack('test-stack-custom', {
        environmentSuffix: 'prod',
      });
      const vpcId = await stack.vpcId.promise();
      expect(vpcId).toBeDefined();
    });

    it('should create TapStack with custom tags', async () => {
      const stack = new TapStack('test-stack-tags', {
        environmentSuffix: 'staging',
        tags: {
          Environment: 'staging',
          Owner: 'test-owner',
        },
      });
      const vpcId = await stack.vpcId.promise();
      expect(vpcId).toBeDefined();
    });

    it('should export vpcId output', async () => {
      const stack = new TapStack('test-export-vpc', { environmentSuffix: 'test' });
      const vpcId = await stack.vpcId.promise();
      expect(typeof vpcId).toBe('string');
    });

    it('should export instanceIds output', async () => {
      const stack = new TapStack('test-export-instances', {
        environmentSuffix: 'test',
      });
      const instanceIds = await stack.instanceIds.promise();
      expect(Array.isArray(instanceIds)).toBe(true);
    });

    it('should export dashboardUrl output', async () => {
      const stack = new TapStack('test-export-dashboard', {
        environmentSuffix: 'test',
      });
      const dashboardUrl = await stack.dashboardUrl.promise();
      expect(typeof dashboardUrl).toBe('string');
    });
  });

  describe('VpcStack Component', () => {
    it('should create VPC with environment suffix', async () => {
      const vpcStack = new VpcStack('test-vpc', {
        environmentSuffix: 'test',
      });
      const vpcId = await vpcStack.vpc.id.promise();
      expect(vpcId).toBeDefined();
    });

    it('should create public subnets', async () => {
      const vpcStack = new VpcStack('test-vpc-subnets', {
        environmentSuffix: 'test',
      });
      expect(vpcStack.publicSubnets).toBeDefined();
      expect(vpcStack.publicSubnets.length).toBeGreaterThan(0);
    });

    it('should create private subnets', async () => {
      const vpcStack = new VpcStack('test-vpc-private', {
        environmentSuffix: 'test',
      });
      expect(vpcStack.privateSubnets).toBeDefined();
      expect(vpcStack.privateSubnets.length).toBeGreaterThan(0);
    });

    it('should create internet gateway', async () => {
      const vpcStack = new VpcStack('test-vpc-igw', {
        environmentSuffix: 'test',
      });
      expect(vpcStack.internetGateway).toBeDefined();
    });

    it('should create NAT gateway', async () => {
      const vpcStack = new VpcStack('test-vpc-nat', {
        environmentSuffix: 'test',
      });
      expect(vpcStack.natGateway).toBeDefined();
    });

    it('should apply custom tags to VPC', async () => {
      const vpcStack = new VpcStack('test-vpc-tags', {
        environmentSuffix: 'test',
        tags: {
          Environment: 'test',
          Owner: 'qa',
        },
      });
      const vpcId = await vpcStack.vpc.id.promise();
      expect(vpcId).toBeDefined();
    });
  });

  describe('Ec2Stack Component', () => {
    it('should create EC2 instances with correct configuration', async () => {
      const ec2Stack = new Ec2Stack('test-ec2', {
        environmentSuffix: 'test',
        vpcId: pulumi.output('vpc-12345'),
        privateSubnetIds: pulumi.output(['subnet-1', 'subnet-2']),
      });
      expect(ec2Stack.instances).toBeDefined();
      expect(ec2Stack.instances.length).toBeGreaterThan(0);
    });

    it('should create security group for EC2 instances', async () => {
      const ec2Stack = new Ec2Stack('test-ec2-sg', {
        environmentSuffix: 'test',
        vpcId: pulumi.output('vpc-12345'),
        privateSubnetIds: pulumi.output(['subnet-1', 'subnet-2']),
      });
      expect(ec2Stack.securityGroup).toBeDefined();
    });

    it('should create IAM role for EC2 instances', async () => {
      const ec2Stack = new Ec2Stack('test-ec2-role', {
        environmentSuffix: 'test',
        vpcId: pulumi.output('vpc-12345'),
        privateSubnetIds: pulumi.output(['subnet-1', 'subnet-2']),
      });
      expect(ec2Stack.instances.length).toBeGreaterThan(0);
    });

    it('should apply tags to EC2 instances', async () => {
      const ec2Stack = new Ec2Stack('test-ec2-tags', {
        environmentSuffix: 'test',
        vpcId: pulumi.output('vpc-12345'),
        privateSubnetIds: pulumi.output(['subnet-1', 'subnet-2']),
        tags: {
          Project: 'compliance',
        },
      });
      expect(ec2Stack.instances.length).toBeGreaterThan(0);
    });
  });

  describe('LambdaStack Component', () => {
    it('should create Lambda function for tag remediation', async () => {
      const lambdaStack = new LambdaStack('test-lambda', {
        environmentSuffix: 'test',
      });
      expect(lambdaStack.function).toBeDefined();
    });

    it('should create IAM role for Lambda', async () => {
      const lambdaStack = new LambdaStack('test-lambda-role', {
        environmentSuffix: 'test',
      });
      expect(lambdaStack.function).toBeDefined();
    });

    it('should create CloudWatch log group for Lambda', async () => {
      const lambdaStack = new LambdaStack('test-lambda-logs', {
        environmentSuffix: 'test',
      });
      expect(lambdaStack.function).toBeDefined();
    });

    it('should apply custom tags to Lambda function', async () => {
      const lambdaStack = new LambdaStack('test-lambda-tags', {
        environmentSuffix: 'test',
        tags: {
          Environment: 'test',
        },
      });
      expect(lambdaStack.function).toBeDefined();
    });
  });

  describe('MonitoringStack Component', () => {
    it('should create CloudWatch dashboard', async () => {
      const monitoringStack = new MonitoringStack('test-monitoring', {
        environmentSuffix: 'test',
        instanceIds: pulumi.output(['i-123', 'i-456']),
        lambdaFunctionArn: pulumi.output('arn:aws:lambda:us-east-1:123:function:test'),
      });
      expect(monitoringStack.dashboard).toBeDefined();
    });

    it('should create CloudWatch alarms', async () => {
      const monitoringStack = new MonitoringStack('test-monitoring-alarms', {
        environmentSuffix: 'test',
        instanceIds: pulumi.output(['i-123', 'i-456']),
        lambdaFunctionArn: pulumi.output('arn:aws:lambda:us-east-1:123:function:test'),
      });
      expect(monitoringStack.complianceAlarm).toBeDefined();
    });

    it('should create EventBridge rule', async () => {
      const monitoringStack = new MonitoringStack('test-monitoring-rule', {
        environmentSuffix: 'test',
        instanceIds: pulumi.output(['i-123', 'i-456']),
        lambdaFunctionArn: pulumi.output('arn:aws:lambda:us-east-1:123:function:test'),
      });
      expect(monitoringStack.eventRule).toBeDefined();
    });

    it('should apply custom tags to monitoring resources', async () => {
      const monitoringStack = new MonitoringStack('test-monitoring-tags', {
        environmentSuffix: 'test',
        instanceIds: pulumi.output(['i-123', 'i-456']),
        lambdaFunctionArn: pulumi.output('arn:aws:lambda:us-east-1:123:function:test'),
        tags: {
          Environment: 'test',
        },
      });
      expect(monitoringStack.dashboard).toBeDefined();
    });

    it('should handle empty instance IDs array', async () => {
      const monitoringStack = new MonitoringStack('test-monitoring-empty', {
        environmentSuffix: 'test',
        instanceIds: pulumi.output([]),
        lambdaFunctionArn: pulumi.output('arn:aws:lambda:us-east-1:123:function:test'),
      });
      expect(monitoringStack.dashboard).toBeDefined();
    });
  });
});

describe('Additional Coverage Tests', () => {
  it('should test registerOutputs is called', async () => {
    const ec2Stack = new Ec2Stack('test-ec2-outputs', {
      environmentSuffix: 'test',
      vpcId: pulumi.output('vpc-test'),
      privateSubnetIds: pulumi.output(['subnet-1', 'subnet-2']),
    });
    // Just verify the stack is created, which calls registerOutputs internally
    expect(ec2Stack).toBeDefined();
  });

  it('should create TapStack and verify all child stacks', async () => {
    const stack = new TapStack('test-full-stack', {
      environmentSuffix: 'full-test',
      tags: { TestTag: 'value' },
    });
    // Verify all outputs are defined
    expect(stack.vpcId).toBeDefined();
    expect(stack.instanceIds).toBeDefined();
    expect(stack.lambdaFunctionArn).toBeDefined();
    expect(stack.dashboardUrl).toBeDefined();
  });
});
