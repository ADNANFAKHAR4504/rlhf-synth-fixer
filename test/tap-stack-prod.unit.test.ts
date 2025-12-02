import * as pulumi from '@pulumi/pulumi';

// Set up Pulumi mocks for prod environment BEFORE importing the stack
pulumi.runtime.setMocks(
  {
    newResource: function (args: pulumi.runtime.MockResourceArgs): {
      id: string;
      state: any;
    } {
      return {
        id: `${args.name}_id`,
        state: args.inputs,
      };
    },
    call: function (args: pulumi.runtime.MockCallArgs) {
      if (args.token === 'aws:ec2/getAmi:getAmi') {
        return {
          id: 'ami-12345678',
          architecture: 'x86_64',
          mostRecent: true,
        };
      }
      // Mock getStack to return 'prod' for this test suite
      if (args.token === 'pulumi:pulumi:getStack') {
        return 'prod';
      }
      return args.inputs;
    },
  },
  'prod', // Set project to 'prod' stack
  'prod' // Set stack to 'prod'
);

// Import stack after mocks are set
import * as stack from '../lib/tap-stack';

describe('ECS Infrastructure Stack - Production Environment', () => {
  describe('Production Instance Type', () => {
    it('should use m5.large instance type for prod environment', () => {
      // The stack should detect 'prod' stack and use m5.large
      expect(stack.instanceType).toBeDefined();
      expect(typeof stack.instanceType).toBe('string');
      expect(stack.instanceType).toBe('m5.large');
    });
  });

  describe('Production Exports', () => {
    it('should export all required resources for prod environment', () => {
      expect(stack.vpcId).toBeDefined();
      expect(stack.clusterId).toBeDefined();
      expect(stack.clusterName).toBeDefined();
      expect(stack.clusterArn).toBeDefined();
      expect(stack.albDnsName).toBeDefined();
      expect(stack.albArn).toBeDefined();
      expect(stack.targetGroupArn).toBeDefined();
      expect(stack.serviceArn).toBeDefined();
      expect(stack.taskDefinitionArn).toBeDefined();
      expect(stack.launchTemplateId).toBeDefined();
      expect(stack.autoScalingGroupName).toBeDefined();
      expect(stack.capacityProviderName).toBeDefined();
      expect(stack.lowCpuAlarmArn).toBeDefined();
    });
  });
});
