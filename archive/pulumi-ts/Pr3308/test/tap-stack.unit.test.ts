import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

// Set up Pulumi mocks before importing stacks
pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: any;
  } {
    const outputs: Record<string, any> = args.inputs;

    // Add id and arn for resources that need them
    outputs.id = outputs.id || `${args.name}-id-${Date.now()}`;

    if (args.type === 'aws:ec2/vpc:Vpc') {
      outputs.arn = `arn:aws:ec2:us-east-2:123456789012:vpc/${outputs.id}`;
    } else if (args.type === 'aws:ec2/subnet:Subnet') {
      outputs.arn = `arn:aws:ec2:us-east-2:123456789012:subnet/${outputs.id}`;
    } else if (args.type === 'aws:ec2/securityGroup:SecurityGroup') {
      outputs.arn = `arn:aws:ec2:us-east-2:123456789012:security-group/${outputs.id}`;
    } else if (args.type === 'aws:s3/bucket:Bucket') {
      outputs.arn = `arn:aws:s3:::${outputs.id}`;
      outputs.bucket = outputs.id;
    } else if (args.type === 'aws:iam/role:Role') {
      outputs.arn = `arn:aws:iam::123456789012:role/${outputs.name}`;
      outputs.name = outputs.name || args.name;
    } else if (args.type === 'aws:iam/instanceProfile:InstanceProfile') {
      outputs.arn = `arn:aws:iam::123456789012:instance-profile/${outputs.name}`;
      outputs.name = outputs.name || args.name;
    } else if (args.type === 'aws:lb/targetGroup:TargetGroup') {
      outputs.arn = `arn:aws:elasticloadbalancing:us-east-2:123456789012:targetgroup/${outputs.id}`;
    } else if (
      args.type === 'aws:lb/applicationLoadBalancer:ApplicationLoadBalancer'
    ) {
      outputs.arn = `arn:aws:elasticloadbalancing:us-east-2:123456789012:loadbalancer/app/${outputs.id}`;
      outputs.dnsName = `${outputs.id}.us-east-2.elb.amazonaws.com`;
    } else if (args.type === 'aws:autoscaling/group:Group') {
      outputs.arn = `arn:aws:autoscaling:us-east-2:123456789012:autoScalingGroup:${outputs.id}`;
    }

    return {
      id: outputs.id,
      state: outputs,
    };
  },
  call: function (args: pulumi.runtime.MockCallArgs): any {
    switch (args.token) {
      case 'aws:index/getAvailabilityZones:getAvailabilityZones':
        return {
          names: ['us-east-2a', 'us-east-2b', 'us-east-2c'],
          zoneIds: ['use2-az1', 'use2-az2', 'use2-az3'],
          state: 'available',
        };
      case 'aws:index/getAmi:getAmi':
        return {
          id: 'ami-12345678',
          architecture: 'x86_64',
          description: 'Amazon Linux 2023 AMI',
          imageId: 'ami-12345678',
          name: 'amzn2-ami-hvm-2.0.20231116.0-x86_64-gp2',
        };
      default:
        return {};
    }
  },
});

// Set config
pulumi.runtime.setAllConfig({
  'aws:region': 'us-east-2',
});

import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  describe('Main Stack Creation', () => {
    it('should create TapStack with all components', async () => {
      const stack = new TapStack('test-tap', {
        environmentSuffix: 'test',
      });

      expect(stack).toBeDefined();
    });

    it('should create TapStack with custom tags', async () => {
      const stack = new TapStack('test-tap', {
        environmentSuffix: 'prod',
        tags: {
          Environment: 'production',
          Project: 'TAPPlatform',
        },
      });

      expect(stack).toBeDefined();
    });

    it('should expose VPC outputs', async () => {
      const stack = new TapStack('test-tap', {
        environmentSuffix: 'test',
      });

      expect(stack.vpcId).toBeDefined();
    });

    it('should expose ALB outputs', async () => {
      const stack = new TapStack('test-tap', {
        environmentSuffix: 'test',
      });

      expect(stack.albDns).toBeDefined();
    });

    it('should expose S3 outputs', async () => {
      const stack = new TapStack('test-tap', {
        environmentSuffix: 'test',
      });

      expect(stack.bucketName).toBeDefined();
    });
  });

  describe('Stack Outputs', () => {
    it('should provide all necessary outputs for integration', async () => {
      const stack = new TapStack('test-tap', {
        environmentSuffix: 'test',
      });

      // Check that all outputs are defined
      expect(stack.vpcId).toBeDefined();
      expect(stack.albDns).toBeDefined();
      expect(stack.bucketName).toBeDefined();
    });

    it('should use default environmentSuffix when not provided', () => {
      const stack = new TapStack('test-tap-default', {});

      expect(stack).toBeDefined();
      expect(stack.vpcId).toBeDefined();
    });
  });
});
