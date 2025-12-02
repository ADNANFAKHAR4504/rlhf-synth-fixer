import * as pulumi from '@pulumi/pulumi';

// Set up Pulumi mocks BEFORE importing the stack
pulumi.runtime.setMocks({
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
    return args.inputs;
  },
});

// Import stack after mocks are set
import * as stack from '../lib/tap-stack';

describe('ECS Infrastructure Stack', () => {
  describe('VPC Configuration', () => {
    it('should export VPC ID', () => {
      expect(stack.vpcId).toBeDefined();
      expect(stack.vpcId).toHaveProperty('apply');
    });
  });

  describe('ECS Cluster', () => {
    it('should export cluster ID', () => {
      expect(stack.clusterId).toBeDefined();
      expect(stack.clusterId).toHaveProperty('apply');
    });

    it('should export cluster name', () => {
      expect(stack.clusterName).toBeDefined();
      expect(stack.clusterName).toHaveProperty('apply');
    });

    it('should export cluster ARN', () => {
      expect(stack.clusterArn).toBeDefined();
      expect(stack.clusterArn).toHaveProperty('apply');
    });
  });

  describe('Application Load Balancer', () => {
    it('should export ALB DNS name', () => {
      expect(stack.albDnsName).toBeDefined();
      expect(stack.albDnsName).toHaveProperty('apply');
    });

    it('should export ALB ARN', () => {
      expect(stack.albArn).toBeDefined();
      expect(stack.albArn).toHaveProperty('apply');
    });

    it('should export target group ARN', () => {
      expect(stack.targetGroupArn).toBeDefined();
      expect(stack.targetGroupArn).toHaveProperty('apply');
    });
  });

  describe('ECS Service', () => {
    it('should export service ARN', () => {
      expect(stack.serviceArn).toBeDefined();
      expect(stack.serviceArn).toHaveProperty('apply');
    });
  });

  describe('Task Definition', () => {
    it('should export task definition ARN', () => {
      expect(stack.taskDefinitionArn).toBeDefined();
      expect(stack.taskDefinitionArn).toHaveProperty('apply');
    });
  });

  describe('Launch Template', () => {
    it('should export launch template ID', () => {
      expect(stack.launchTemplateId).toBeDefined();
      expect(stack.launchTemplateId).toHaveProperty('apply');
    });

    it('should have proper instance type', () => {
      expect(stack.instanceType).toBeDefined();
      expect(typeof stack.instanceType).toBe('string');
      expect(['t3.medium', 'm5.large']).toContain(stack.instanceType);
    });
  });

  describe('Auto Scaling Group', () => {
    it('should export ASG name', () => {
      expect(stack.autoScalingGroupName).toBeDefined();
      expect(stack.autoScalingGroupName).toHaveProperty('apply');
    });
  });

  describe('Capacity Provider', () => {
    it('should export capacity provider name', () => {
      expect(stack.capacityProviderName).toBeDefined();
      expect(stack.capacityProviderName).toHaveProperty('apply');
    });
  });

  describe('CloudWatch Alarms', () => {
    it('should export low CPU alarm ARN', () => {
      expect(stack.lowCpuAlarmArn).toBeDefined();
      expect(stack.lowCpuAlarmArn).toHaveProperty('apply');
    });
  });

  describe('Exports Validation', () => {
    it('should export all required outputs as Pulumi Outputs', () => {
      const outputs = [
        stack.vpcId,
        stack.clusterId,
        stack.clusterName,
        stack.clusterArn,
        stack.albDnsName,
        stack.albArn,
        stack.targetGroupArn,
        stack.serviceArn,
        stack.taskDefinitionArn,
        stack.launchTemplateId,
        stack.autoScalingGroupName,
        stack.capacityProviderName,
        stack.lowCpuAlarmArn,
      ];

      outputs.forEach((output) => {
        expect(output).toBeDefined();
        expect(output).toHaveProperty('apply');
      });
    });

    it('should export instance type as string', () => {
      expect(stack.instanceType).toBeDefined();
      expect(typeof stack.instanceType).toBe('string');
      expect(stack.instanceType.length).toBeGreaterThan(0);
    });
  });

  describe('Configuration Validation', () => {
    it('should have valid environment configuration', () => {
      expect(stack.instanceType).toBeDefined();
      expect(['t3.medium', 'm5.large']).toContain(stack.instanceType);
    });
  });

  describe('Resource Exports', () => {
    it('should export VPC resources', () => {
      expect(stack.vpcId).toBeDefined();
    });

    it('should export ECS resources', () => {
      expect(stack.clusterId).toBeDefined();
      expect(stack.clusterName).toBeDefined();
      expect(stack.clusterArn).toBeDefined();
      expect(stack.serviceArn).toBeDefined();
      expect(stack.taskDefinitionArn).toBeDefined();
    });

    it('should export load balancer resources', () => {
      expect(stack.albDnsName).toBeDefined();
      expect(stack.albArn).toBeDefined();
      expect(stack.targetGroupArn).toBeDefined();
    });

    it('should export compute resources', () => {
      expect(stack.launchTemplateId).toBeDefined();
      expect(stack.autoScalingGroupName).toBeDefined();
      expect(stack.capacityProviderName).toBeDefined();
    });

    it('should export monitoring resources', () => {
      expect(stack.lowCpuAlarmArn).toBeDefined();
    });
  });

  describe('Type Validation', () => {
    it('should export Pulumi Output types', () => {
      // All exports except instanceType should be Output types
      expect(stack.vpcId.constructor.name).toBe('OutputImpl');
      expect(stack.clusterId.constructor.name).toBe('OutputImpl');
      expect(stack.clusterName.constructor.name).toBe('OutputImpl');
    });

    it('should export primitive instance type', () => {
      // instanceType should be a plain string
      expect(typeof stack.instanceType).toBe('string');
    });
  });

  describe('Infrastructure Stack Structure', () => {
    it('should define all required exports', () => {
      const requiredExports = [
        'vpcId',
        'clusterId',
        'clusterName',
        'clusterArn',
        'albDnsName',
        'albArn',
        'targetGroupArn',
        'serviceArn',
        'taskDefinitionArn',
        'launchTemplateId',
        'autoScalingGroupName',
        'capacityProviderName',
        'lowCpuAlarmArn',
        'instanceType',
      ];

      requiredExports.forEach((exportName) => {
        expect(stack).toHaveProperty(exportName);
        expect(stack[exportName]).toBeDefined();
      });
    });
  });

  describe('Branch Coverage Tests', () => {
    it('should test environment-specific instance type selection', () => {
      // This tests the conditional logic in tap-stack.ts line 10
      // instanceType is determined by environment: 'dev' -> t3.medium, 'prod' -> m5.large
      expect(['t3.medium', 'm5.large']).toContain(stack.instanceType);
    });

    it('should validate all outputs are properly initialized', () => {
      // Ensure no outputs are null or undefined
      expect(stack.vpcId).not.toBeNull();
      expect(stack.clusterId).not.toBeNull();
      expect(stack.clusterName).not.toBeNull();
      expect(stack.clusterArn).not.toBeNull();
      expect(stack.albDnsName).not.toBeNull();
      expect(stack.albArn).not.toBeNull();
      expect(stack.targetGroupArn).not.toBeNull();
      expect(stack.serviceArn).not.toBeNull();
      expect(stack.taskDefinitionArn).not.toBeNull();
      expect(stack.launchTemplateId).not.toBeNull();
      expect(stack.autoScalingGroupName).not.toBeNull();
      expect(stack.capacityProviderName).not.toBeNull();
      expect(stack.lowCpuAlarmArn).not.toBeNull();
      expect(stack.instanceType).not.toBeNull();
    });
  });
});
