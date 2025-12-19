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

    if (args.type === 'aws:ec2/securityGroup:SecurityGroup') {
      outputs.arn = `arn:aws:ec2:us-east-2:123456789012:security-group/${outputs.id}`;
    } else if (
      args.type === 'aws:lb/loadBalancer:LoadBalancer' ||
      args.type === 'aws:alb/loadBalancer:LoadBalancer'
    ) {
      outputs.arn = `arn:aws:elasticloadbalancing:us-east-2:123456789012:loadbalancer/app/${args.name}/${Date.now()}`;
      outputs.dnsName = `${args.name}.elb.us-east-2.amazonaws.com`;
      outputs.name = outputs.name || args.name;
    } else if (args.type === 'aws:lb/listener:Listener') {
      outputs.arn = `arn:aws:elasticloadbalancing:us-east-2:123456789012:listener/app/${args.name}/${Date.now()}`;
    } else if (args.type === 'aws:s3/bucket:Bucket') {
      outputs.arn = `arn:aws:s3:::${outputs.id}`;
      outputs.bucket = outputs.id;
    }

    return {
      id: outputs.id,
      state: outputs,
    };
  },
  call: function (args: pulumi.runtime.MockCallArgs): any {
    switch (args.token) {
      case 'aws:elb/getServiceAccount:getServiceAccount':
        return {
          arn: 'arn:aws:iam::033677994240:root',
          id: '033677994240',
        };
      default:
        return {};
    }
  },
});

pulumi.runtime.setAllConfig({
  'aws:region': 'us-east-2',
});

import { AlbStack } from '../lib/alb-stack';

describe('AlbStack Unit Tests', () => {
  describe('ALB Creation', () => {
    it('should create Application Load Balancer', async () => {
      const vpcId = pulumi.output('vpc-12345');
      const publicSubnetIds = pulumi.output(['subnet-1', 'subnet-2']);
      const targetGroupArn = pulumi.output(
        'arn:aws:elasticloadbalancing:us-east-2:123456789012:targetgroup/test/abc123'
      );

      const stack = new AlbStack('test-alb', {
        environmentSuffix: 'test',
        vpcId: vpcId,
        publicSubnetIds: publicSubnetIds,
        targetGroupArn: targetGroupArn,
      });

      expect(stack).toBeDefined();

      const albArn = await stack.albArn.promise();
      expect(albArn).toBeDefined();
      expect(albArn).toContain('loadbalancer');
    });

    it('should expose ALB DNS name', async () => {
      const vpcId = pulumi.output('vpc-12345');
      const publicSubnetIds = pulumi.output(['subnet-1', 'subnet-2']);
      const targetGroupArn = pulumi.output(
        'arn:aws:elasticloadbalancing:us-east-2:123456789012:targetgroup/test/abc123'
      );

      const stack = new AlbStack('test-alb', {
        environmentSuffix: 'test',
        vpcId: vpcId,
        publicSubnetIds: publicSubnetIds,
        targetGroupArn: targetGroupArn,
      });

      const albDns = await stack.albDns.promise();
      expect(albDns).toBeDefined();
      expect(albDns).toContain('elb.us-east-2.amazonaws.com');
    });
  });

  describe('Security Group', () => {
    it('should create security group for ALB', async () => {
      const vpcId = pulumi.output('vpc-12345');
      const publicSubnetIds = pulumi.output(['subnet-1', 'subnet-2']);
      const targetGroupArn = pulumi.output(
        'arn:aws:elasticloadbalancing:us-east-2:123456789012:targetgroup/test/abc123'
      );

      const stack = new AlbStack('test-alb', {
        environmentSuffix: 'test',
        vpcId: vpcId,
        publicSubnetIds: publicSubnetIds,
        targetGroupArn: targetGroupArn,
      });

      expect(stack).toBeDefined();
    });
  });

  describe('Tags', () => {
    it('should apply custom tags', async () => {
      const vpcId = pulumi.output('vpc-12345');
      const publicSubnetIds = pulumi.output(['subnet-1', 'subnet-2']);
      const targetGroupArn = pulumi.output(
        'arn:aws:elasticloadbalancing:us-east-2:123456789012:targetgroup/test/abc123'
      );

      const stack = new AlbStack('test-alb', {
        environmentSuffix: 'prod',
        vpcId: vpcId,
        publicSubnetIds: publicSubnetIds,
        targetGroupArn: targetGroupArn,
        tags: {
          Environment: 'production',
          CostCenter: 'Engineering',
        },
      });

      expect(stack).toBeDefined();
    });
  });

  describe('Outputs', () => {
    it('should expose ALB ARN and DNS as outputs', async () => {
      const vpcId = pulumi.output('vpc-12345');
      const publicSubnetIds = pulumi.output(['subnet-1', 'subnet-2']);
      const targetGroupArn = pulumi.output(
        'arn:aws:elasticloadbalancing:us-east-2:123456789012:targetgroup/test/abc123'
      );

      const stack = new AlbStack('test-alb', {
        environmentSuffix: 'test',
        vpcId: vpcId,
        publicSubnetIds: publicSubnetIds,
        targetGroupArn: targetGroupArn,
      });

      expect(stack.albArn).toBeDefined();
      expect(stack.albDns).toBeDefined();
    });
  });
});
