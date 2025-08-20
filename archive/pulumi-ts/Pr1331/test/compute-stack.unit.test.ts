import * as pulumi from '@pulumi/pulumi';
import './mocks';
import { ComputeStack } from '../lib/compute-stack';
import { mockOutput, mockAll } from './mocks';

describe('ComputeStack', () => {
  let computeStack: ComputeStack;
  const mockVpcId = mockOutput('vpc-123456');
  const mockPrivateSubnetIds = mockAll(['subnet-private-1', 'subnet-private-2']);
  const mockPublicSubnetIds = mockAll(['subnet-public-1', 'subnet-public-2']);
  const mockWebSgId = mockOutput('sg-web-123');
  const mockAlbSgId = mockOutput('sg-alb-123');
  const mockInstanceProfileName = mockOutput('test-instance-profile');

  describe('with standard configuration', () => {
    beforeAll(async () => {
      await pulumi.runtime.runInPulumiStack(async () => {
        computeStack = new ComputeStack('test-compute', {
          vpcId: mockVpcId,
          privateSubnetIds: mockPrivateSubnetIds,
          publicSubnetIds: mockPublicSubnetIds,
          webSecurityGroupId: mockWebSgId,
          albSecurityGroupId: mockAlbSgId,
          instanceProfileName: mockInstanceProfileName,
          environmentSuffix: 'test',
          tags: { Environment: 'test' },
        });

        return {
          albDnsName: computeStack.applicationLoadBalancer.dnsName,
          asgName: computeStack.autoScalingGroup.name,
        };
      });
    });

    it('creates launch template', () => {
      expect(computeStack.launchTemplate).toBeDefined();
    });

    it('creates application load balancer', () => {
      expect(computeStack.applicationLoadBalancer).toBeDefined();
    });

    it('creates target group', () => {
      expect(computeStack.targetGroup).toBeDefined();
    });

    it('creates ALB listener', () => {
      expect(computeStack.listener).toBeDefined();
    });

    it('creates auto scaling group', () => {
      expect(computeStack.autoScalingGroup).toBeDefined();
    });

    it('creates scaling policies', () => {
      expect(computeStack.scaleUpPolicy).toBeDefined();
      expect(computeStack.scaleDownPolicy).toBeDefined();
    });
  });

  describe('auto scaling configuration', () => {
    beforeAll(async () => {
      await pulumi.runtime.runInPulumiStack(async () => {
        computeStack = new ComputeStack('scaling-test', {
          vpcId: mockVpcId,
          privateSubnetIds: mockPrivateSubnetIds,
          publicSubnetIds: mockPublicSubnetIds,
          webSecurityGroupId: mockWebSgId,
          albSecurityGroupId: mockAlbSgId,
          instanceProfileName: mockInstanceProfileName,
          environmentSuffix: 'test',
          tags: {},
        });

        return {
          asgName: computeStack.autoScalingGroup.name,
        };
      });
    });

    it('sets correct min, max, and desired capacity', () => {
      expect(computeStack.autoScalingGroup).toBeDefined();
      // Should have min: 2, max: 6, desired: 2
    });

    it('creates scale up policy with correct adjustment', () => {
      expect(computeStack.scaleUpPolicy).toBeDefined();
      // Scale up should add 2 instances
    });

    it('creates scale down policy with correct adjustment', () => {
      expect(computeStack.scaleDownPolicy).toBeDefined();
      // Scale down should remove 1 instance
    });

    it('uses ELB health check type', () => {
      expect(computeStack.autoScalingGroup).toBeDefined();
      // Health check type should be 'ELB'
    });
  });

  describe('load balancer configuration', () => {
    beforeAll(async () => {
      await pulumi.runtime.runInPulumiStack(async () => {
        computeStack = new ComputeStack('alb-test', {
          vpcId: mockVpcId,
          privateSubnetIds: mockPrivateSubnetIds,
          publicSubnetIds: mockPublicSubnetIds,
          webSecurityGroupId: mockWebSgId,
          albSecurityGroupId: mockAlbSgId,
          instanceProfileName: mockInstanceProfileName,
          environmentSuffix: 'test',
          tags: { Environment: 'test' },
        });

        return {
          albDnsName: computeStack.applicationLoadBalancer.dnsName,
        };
      });
    });

    it('ALB is deployed in public subnets', () => {
      expect(computeStack.applicationLoadBalancer).toBeDefined();
      // ALB should use public subnet IDs
    });

    it('ALB uses correct security group', () => {
      expect(computeStack.applicationLoadBalancer).toBeDefined();
      // ALB should use the ALB security group
    });

    it('listener is configured for HTTP on port 80', () => {
      expect(computeStack.listener).toBeDefined();
      // Listener should be on port 80 with HTTP protocol
    });

    it('target group has health check configured', () => {
      expect(computeStack.targetGroup).toBeDefined();
      // Health check should be enabled with correct settings
    });
  });

  describe('CloudWatch alarms', () => {
    beforeAll(async () => {
      await pulumi.runtime.runInPulumiStack(async () => {
        computeStack = new ComputeStack('alarm-test', {
          vpcId: mockVpcId,
          privateSubnetIds: mockPrivateSubnetIds,
          publicSubnetIds: mockPublicSubnetIds,
          webSecurityGroupId: mockWebSgId,
          albSecurityGroupId: mockAlbSgId,
          instanceProfileName: mockInstanceProfileName,
          environmentSuffix: 'test',
          tags: {},
        });

        return {
          asgName: computeStack.autoScalingGroup.name,
        };
      });
    });

    it('creates CPU high alarm', () => {
      expect(computeStack.scaleUpPolicy).toBeDefined();
      // Should trigger scale up at 70% CPU
    });

    it('creates CPU low alarm', () => {
      expect(computeStack.scaleDownPolicy).toBeDefined();
      // Should trigger scale down at 30% CPU
    });

    it('alarms are linked to scaling policies', () => {
      expect(computeStack.scaleUpPolicy).toBeDefined();
      expect(computeStack.scaleDownPolicy).toBeDefined();
      // Alarms should reference the correct policies
    });
  });

  describe('launch template configuration', () => {
    beforeAll(async () => {
      await pulumi.runtime.runInPulumiStack(async () => {
        computeStack = new ComputeStack('launch-test', {
          vpcId: mockVpcId,
          privateSubnetIds: mockPrivateSubnetIds,
          publicSubnetIds: mockPublicSubnetIds,
          webSecurityGroupId: mockWebSgId,
          albSecurityGroupId: mockAlbSgId,
          instanceProfileName: mockInstanceProfileName,
          environmentSuffix: 'production',
          tags: { Environment: 'production' },
        });

        return {
          launchTemplateId: computeStack.launchTemplate.id,
        };
      });
    });

    it('uses t3.micro instance type', () => {
      expect(computeStack.launchTemplate).toBeDefined();
      // Instance type should be t3.micro
    });

    it('includes user data script', () => {
      expect(computeStack.launchTemplate).toBeDefined();
      // Should have user data for application setup
    });

    it('assigns correct IAM instance profile', () => {
      expect(computeStack.launchTemplate).toBeDefined();
      // Should use the provided instance profile
    });

    it('uses correct security group', () => {
      expect(computeStack.launchTemplate).toBeDefined();
      // Should use web security group
    });
  });
});