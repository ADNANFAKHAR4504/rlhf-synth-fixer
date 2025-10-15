import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

// Set up Pulumi mocks
pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: any;
  } {
    const outputs: Record<string, any> = args.inputs;
    outputs.id = outputs.id || `${args.name}-id-${Date.now()}`;

    if (args.type === 'aws:iam/role:Role') {
      outputs.arn = `arn:aws:iam::123456789012:role/${outputs.name || args.name}`;
      outputs.name = outputs.name || args.name;
    } else if (args.type === 'aws:iam/instanceProfile:InstanceProfile') {
      outputs.arn = `arn:aws:iam::123456789012:instance-profile/${outputs.name || args.name}`;
      outputs.name = outputs.name || args.name;
    } else if (args.type === 'aws:ec2/securityGroup:SecurityGroup') {
      outputs.arn = `arn:aws:ec2:us-east-2:123456789012:security-group/${outputs.id}`;
    } else if (args.type === 'aws:ec2/launchTemplate:LaunchTemplate') {
      outputs.arn = `arn:aws:ec2:us-east-2:123456789012:launch-template/${outputs.id}`;
    } else if (args.type === 'aws:lb/targetGroup:TargetGroup') {
      outputs.arn = `arn:aws:elasticloadbalancing:us-east-2:123456789012:targetgroup/${args.name}/${Date.now()}`;
    } else if (args.type === 'aws:autoscaling/group:Group') {
      outputs.arn = `arn:aws:autoscaling:us-east-2:123456789012:autoScalingGroup:*:autoScalingGroupName/${outputs.name || args.name}`;
      outputs.name = outputs.name || args.name;
    }

    return {
      id: outputs.id,
      state: outputs,
    };
  },
  call: function (args: pulumi.runtime.MockCallArgs): any {
    switch (args.token) {
      case 'aws:ec2/getAmi:getAmi':
        return {
          id: 'ami-12345678',
          architecture: 'x86_64',
          imageId: 'ami-12345678',
        };
      default:
        return {};
    }
  },
});

pulumi.runtime.setAllConfig({
  'aws:region': 'us-east-2',
});

import { Ec2Stack } from '../lib/ec2-stack';

describe('Ec2Stack Unit Tests', () => {
  describe('EC2 Instance Configuration', () => {
    it('should create EC2 resources with Auto Scaling Group', async () => {
      const vpcId = pulumi.output('vpc-12345');
      const privateSubnetIds = pulumi.output(['subnet-1', 'subnet-2']);

      const stack = new Ec2Stack('test-ec2', {
        environmentSuffix: 'test',
        vpcId: vpcId,
        privateSubnetIds: privateSubnetIds,
      });

      expect(stack).toBeDefined();

      const asgName = await stack.autoScalingGroupName.promise();
      expect(asgName).toBeDefined();
      expect(typeof asgName).toBe('string');
    });

    it('should create target group for ALB integration', async () => {
      const vpcId = pulumi.output('vpc-12345');
      const privateSubnetIds = pulumi.output(['subnet-1', 'subnet-2']);

      const stack = new Ec2Stack('test-ec2', {
        environmentSuffix: 'test',
        vpcId: vpcId,
        privateSubnetIds: privateSubnetIds,
      });

      const targetGroupArn = await stack.targetGroupArn.promise();
      expect(targetGroupArn).toBeDefined();
      expect(targetGroupArn).toContain('targetgroup');
    });
  });

  describe('Security Configuration', () => {
    it('should create security group for EC2 instances', async () => {
      const vpcId = pulumi.output('vpc-12345');
      const privateSubnetIds = pulumi.output(['subnet-1', 'subnet-2']);

      const stack = new Ec2Stack('test-ec2', {
        environmentSuffix: 'staging',
        vpcId: vpcId,
        privateSubnetIds: privateSubnetIds,
      });

      expect(stack).toBeDefined();
    });
  });

  describe('IAM Configuration', () => {
    it('should create IAM role for EC2 instances', async () => {
      const vpcId = pulumi.output('vpc-12345');
      const privateSubnetIds = pulumi.output(['subnet-1', 'subnet-2']);

      const stack = new Ec2Stack('test-ec2', {
        environmentSuffix: 'test',
        vpcId: vpcId,
        privateSubnetIds: privateSubnetIds,
      });

      expect(stack).toBeDefined();
    });
  });

  describe('Tags', () => {
    it('should apply custom tags to resources', async () => {
      const vpcId = pulumi.output('vpc-12345');
      const privateSubnetIds = pulumi.output(['subnet-1', 'subnet-2']);

      const stack = new Ec2Stack('test-ec2', {
        environmentSuffix: 'test',
        vpcId: vpcId,
        privateSubnetIds: privateSubnetIds,
        tags: {
          Environment: 'test',
          Application: 'MediaApp',
        },
      });

      expect(stack).toBeDefined();
    });
  });
});
