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

// Import TapStack class after mocks are set
import { TapStack, TapStackArgs } from '../lib/tap-stack';

describe('TapStack ComponentResource', () => {
  let devStack: TapStack;
  let prodStack: TapStack;

  const devArgs: TapStackArgs = {
    environmentSuffix: 'dev',
    tags: {
      Environment: 'dev',
      ManagedBy: 'pulumi',
      Project: 'ecs-optimization',
    },
    costCenter: 'engineering',
  };

  const prodArgs: TapStackArgs = {
    environmentSuffix: 'prod',
    tags: {
      Environment: 'prod',
      ManagedBy: 'pulumi',
      Project: 'ecs-optimization',
    },
    costCenter: 'engineering',
  };

  beforeAll(() => {
    devStack = new TapStack('test-dev-stack', devArgs);
    prodStack = new TapStack('test-prod-stack', prodArgs);
  });

  describe('VPC Configuration', () => {
    it('should export VPC ID', () => {
      expect(devStack.vpcId).toBeDefined();
      expect(devStack.vpcId).toHaveProperty('apply');
    });
  });

  describe('ECS Cluster', () => {
    it('should export cluster ID', () => {
      expect(devStack.clusterId).toBeDefined();
      expect(devStack.clusterId).toHaveProperty('apply');
    });

    it('should export cluster name', () => {
      expect(devStack.clusterName).toBeDefined();
      expect(devStack.clusterName).toHaveProperty('apply');
    });

    it('should export cluster ARN', () => {
      expect(devStack.clusterArn).toBeDefined();
      expect(devStack.clusterArn).toHaveProperty('apply');
    });
  });

  describe('Application Load Balancer', () => {
    it('should export ALB DNS name', () => {
      expect(devStack.albDnsName).toBeDefined();
      expect(devStack.albDnsName).toHaveProperty('apply');
    });

    it('should export ALB ARN', () => {
      expect(devStack.albArn).toBeDefined();
      expect(devStack.albArn).toHaveProperty('apply');
    });

    it('should export target group ARN', () => {
      expect(devStack.targetGroupArn).toBeDefined();
      expect(devStack.targetGroupArn).toHaveProperty('apply');
    });
  });

  describe('ECS Service', () => {
    it('should export service ARN', () => {
      expect(devStack.serviceArn).toBeDefined();
      expect(devStack.serviceArn).toHaveProperty('apply');
    });
  });

  describe('Task Definition', () => {
    it('should export task definition ARN', () => {
      expect(devStack.taskDefinitionArn).toBeDefined();
      expect(devStack.taskDefinitionArn).toHaveProperty('apply');
    });
  });

  describe('Launch Template', () => {
    it('should export launch template ID', () => {
      expect(devStack.launchTemplateId).toBeDefined();
      expect(devStack.launchTemplateId).toHaveProperty('apply');
    });

    it('should have proper instance type for dev', () => {
      expect(devStack.instanceType).toBeDefined();
      expect(typeof devStack.instanceType).toBe('string');
      expect(devStack.instanceType).toBe('t3.medium');
    });
  });

  describe('Auto Scaling Group', () => {
    it('should export ASG name', () => {
      expect(devStack.autoScalingGroupName).toBeDefined();
      expect(devStack.autoScalingGroupName).toHaveProperty('apply');
    });
  });

  describe('Capacity Provider', () => {
    it('should export capacity provider name', () => {
      expect(devStack.capacityProviderName).toBeDefined();
      expect(devStack.capacityProviderName).toHaveProperty('apply');
    });
  });

  describe('CloudWatch Alarms', () => {
    it('should export low CPU alarm ARN', () => {
      expect(devStack.lowCpuAlarmArn).toBeDefined();
      expect(devStack.lowCpuAlarmArn).toHaveProperty('apply');
    });
  });

  describe('Exports Validation', () => {
    it('should export all required outputs as Pulumi Outputs', () => {
      const outputs = [
        devStack.vpcId,
        devStack.clusterId,
        devStack.clusterName,
        devStack.clusterArn,
        devStack.albDnsName,
        devStack.albArn,
        devStack.targetGroupArn,
        devStack.serviceArn,
        devStack.taskDefinitionArn,
        devStack.launchTemplateId,
        devStack.autoScalingGroupName,
        devStack.capacityProviderName,
        devStack.lowCpuAlarmArn,
      ];

      outputs.forEach((output) => {
        expect(output).toBeDefined();
        expect(output).toHaveProperty('apply');
      });
    });

    it('should export instance type as string', () => {
      expect(devStack.instanceType).toBeDefined();
      expect(typeof devStack.instanceType).toBe('string');
      expect(devStack.instanceType.length).toBeGreaterThan(0);
    });
  });

  describe('Configuration Validation', () => {
    it('should have valid environment configuration', () => {
      expect(devStack.instanceType).toBeDefined();
      expect(['t3.medium', 'm5.large']).toContain(devStack.instanceType);
    });
  });

  describe('Resource Exports', () => {
    it('should export VPC resources', () => {
      expect(devStack.vpcId).toBeDefined();
    });

    it('should export ECS resources', () => {
      expect(devStack.clusterId).toBeDefined();
      expect(devStack.clusterName).toBeDefined();
      expect(devStack.clusterArn).toBeDefined();
      expect(devStack.serviceArn).toBeDefined();
      expect(devStack.taskDefinitionArn).toBeDefined();
    });

    it('should export load balancer resources', () => {
      expect(devStack.albDnsName).toBeDefined();
      expect(devStack.albArn).toBeDefined();
      expect(devStack.targetGroupArn).toBeDefined();
    });

    it('should export compute resources', () => {
      expect(devStack.launchTemplateId).toBeDefined();
      expect(devStack.autoScalingGroupName).toBeDefined();
      expect(devStack.capacityProviderName).toBeDefined();
    });

    it('should export monitoring resources', () => {
      expect(devStack.lowCpuAlarmArn).toBeDefined();
    });
  });

  describe('Type Validation', () => {
    it('should export Pulumi Output types', () => {
      // All exports except instanceType should be Output types
      expect(devStack.vpcId.constructor.name).toBe('OutputImpl');
      expect(devStack.clusterId.constructor.name).toBe('OutputImpl');
      expect(devStack.clusterName.constructor.name).toBe('OutputImpl');
    });

    it('should export primitive instance type', () => {
      // instanceType should be a plain string
      expect(typeof devStack.instanceType).toBe('string');
    });
  });

  describe('TapStack Class Properties', () => {
    it('should have all required public properties', () => {
      const requiredProperties = [
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

      requiredProperties.forEach((propertyName) => {
        expect(devStack).toHaveProperty(propertyName);
        expect((devStack as any)[propertyName]).toBeDefined();
      });
    });
  });

  describe('Branch Coverage Tests', () => {
    it('should test environment-specific instance type selection', () => {
      // This tests the conditional logic in TapStack constructor
      // instanceType is determined by environment: 'dev' -> t3.medium, 'prod' -> m5.large
      expect(['t3.medium', 'm5.large']).toContain(devStack.instanceType);
    });

    it('should validate all outputs are properly initialized', () => {
      // Ensure no outputs are null or undefined
      expect(devStack.vpcId).not.toBeNull();
      expect(devStack.clusterId).not.toBeNull();
      expect(devStack.clusterName).not.toBeNull();
      expect(devStack.clusterArn).not.toBeNull();
      expect(devStack.albDnsName).not.toBeNull();
      expect(devStack.albArn).not.toBeNull();
      expect(devStack.targetGroupArn).not.toBeNull();
      expect(devStack.serviceArn).not.toBeNull();
      expect(devStack.taskDefinitionArn).not.toBeNull();
      expect(devStack.launchTemplateId).not.toBeNull();
      expect(devStack.autoScalingGroupName).not.toBeNull();
      expect(devStack.capacityProviderName).not.toBeNull();
      expect(devStack.lowCpuAlarmArn).not.toBeNull();
      expect(devStack.instanceType).not.toBeNull();
    });
  });

  // Production Environment Tests (merged from tap-stack-prod.unit.test.ts)
  describe('Production Environment', () => {
    describe('Production Instance Type', () => {
      it('should use m5.large instance type for prod environment', () => {
        // The stack should detect 'prod' environment and use m5.large
        expect(prodStack.instanceType).toBeDefined();
        expect(typeof prodStack.instanceType).toBe('string');
        expect(prodStack.instanceType).toBe('m5.large');
      });
    });

    describe('Production Exports', () => {
      it('should export all required resources for prod environment', () => {
        expect(prodStack.vpcId).toBeDefined();
        expect(prodStack.clusterId).toBeDefined();
        expect(prodStack.clusterName).toBeDefined();
        expect(prodStack.clusterArn).toBeDefined();
        expect(prodStack.albDnsName).toBeDefined();
        expect(prodStack.albArn).toBeDefined();
        expect(prodStack.targetGroupArn).toBeDefined();
        expect(prodStack.serviceArn).toBeDefined();
        expect(prodStack.taskDefinitionArn).toBeDefined();
        expect(prodStack.launchTemplateId).toBeDefined();
        expect(prodStack.autoScalingGroupName).toBeDefined();
        expect(prodStack.capacityProviderName).toBeDefined();
        expect(prodStack.lowCpuAlarmArn).toBeDefined();
      });
    });

    describe('Environment-Specific Configuration', () => {
      it('should use different instance types for dev vs prod', () => {
        expect(devStack.instanceType).toBe('t3.medium');
        expect(prodStack.instanceType).toBe('m5.large');
      });

      it('should have valid instance type for each environment', () => {
        expect(['t3.medium']).toContain(devStack.instanceType);
        expect(['m5.large']).toContain(prodStack.instanceType);
      });
    });
  });

  describe('TapStackArgs Interface', () => {
    it('should accept valid dev configuration', () => {
      const args: TapStackArgs = {
        environmentSuffix: 'dev',
        tags: { Environment: 'dev' },
      };
      expect(args.environmentSuffix).toBe('dev');
      expect(args.tags).toBeDefined();
    });

    it('should accept valid prod configuration', () => {
      const args: TapStackArgs = {
        environmentSuffix: 'prod',
        tags: { Environment: 'prod' },
        costCenter: 'production',
      };
      expect(args.environmentSuffix).toBe('prod');
      expect(args.costCenter).toBe('production');
    });

    it('should allow optional costCenter', () => {
      const argsWithCost: TapStackArgs = {
        environmentSuffix: 'staging',
        tags: {},
        costCenter: 'staging-team',
      };
      const argsWithoutCost: TapStackArgs = {
        environmentSuffix: 'staging',
        tags: {},
      };
      expect(argsWithCost.costCenter).toBe('staging-team');
      expect(argsWithoutCost.costCenter).toBeUndefined();
    });
  });
});
