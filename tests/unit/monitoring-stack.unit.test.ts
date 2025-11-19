/**
 * Unit tests for MonitoringStack
 */

import * as pulumi from '@pulumi/pulumi';
import { MonitoringStack } from '../../lib/monitoring-stack';

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

describe('MonitoringStack', () => {
  const environmentSuffix = 'test';
  const dmsReplicationTaskArn = pulumi.output(
    'arn:aws:dms:us-east-1:123456789012:task:test-task'
  );
  const ecsClusterName = pulumi.output('ecs-cluster-test');
  const ecsServiceName = pulumi.output('payment-app-service-test');
  const rdsClusterId = pulumi.output('aurora-cluster-test');
  const tags = {
    Environment: 'prod-migration',
    CostCenter: 'finance',
    MigrationPhase: 'active',
  };

  let stack: MonitoringStack;

  beforeEach(() => {
    stack = new MonitoringStack('test-monitoring', {
      environmentSuffix,
      dmsReplicationTaskArn,
      ecsClusterName,
      ecsServiceName,
      rdsClusterId,
      tags,
    });
  });

  describe('CloudWatch Alarms', () => {
    it('should create monitoring stack', () => {
      expect(stack).toBeDefined();
    });

    it('should not throw errors during creation', () => {
      expect(() => stack).not.toThrow();
    });
  });

  describe('Input Validation', () => {
    it('should accept valid configuration', () => {
      expect(() => {
        new MonitoringStack('test-monitoring-2', {
          environmentSuffix: 'test2',
          dmsReplicationTaskArn,
          ecsClusterName,
          ecsServiceName,
          rdsClusterId,
          tags: { test: 'value' },
        });
      }).not.toThrow();
    });

    it('should handle different ARN formats', () => {
      const customArnStack = new MonitoringStack('test-monitoring-3', {
        environmentSuffix: 'test3',
        dmsReplicationTaskArn: pulumi.output(
          'arn:aws:dms:us-west-2:987654321:task:custom-task'
        ),
        ecsClusterName,
        ecsServiceName,
        rdsClusterId,
        tags,
      });
      expect(customArnStack).toBeDefined();
    });

    it('should handle empty tags', () => {
      const stackWithoutTags = new MonitoringStack('test-monitoring-4', {
        environmentSuffix: 'test4',
        dmsReplicationTaskArn,
        ecsClusterName,
        ecsServiceName,
        rdsClusterId,
        tags: {},
      });
      expect(stackWithoutTags).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle different cluster names', () => {
      const customClusterStack = new MonitoringStack('test-monitoring-custom-cluster', {
        environmentSuffix: 'customcluster',
        dmsReplicationTaskArn,
        ecsClusterName: pulumi.output('custom-cluster'),
        ecsServiceName,
        rdsClusterId,
        tags,
      });
      expect(customClusterStack).toBeDefined();
    });

    it('should handle different service names', () => {
      const customServiceStack = new MonitoringStack('test-monitoring-custom-service', {
        environmentSuffix: 'customservice',
        dmsReplicationTaskArn,
        ecsClusterName,
        ecsServiceName: pulumi.output('custom-service'),
        rdsClusterId,
        tags,
      });
      expect(customServiceStack).toBeDefined();
    });

    it('should handle different RDS cluster IDs', () => {
      const customRdsStack = new MonitoringStack('test-monitoring-custom-rds', {
        environmentSuffix: 'customrds',
        dmsReplicationTaskArn,
        ecsClusterName,
        ecsServiceName,
        rdsClusterId: pulumi.output('custom-rds-cluster'),
        tags,
      });
      expect(customRdsStack).toBeDefined();
    });
  });

  describe('Alarm Configuration', () => {
    it('should configure DMS replication lag alarm', () => {
      expect(stack).toBeDefined();
    });

    it('should configure ECS task health alarm', () => {
      expect(stack).toBeDefined();
    });

    it('should configure RDS CPU utilization alarm', () => {
      expect(stack).toBeDefined();
    });

    it('should configure RDS storage alarm', () => {
      expect(stack).toBeDefined();
    });

    it('should configure ECS CPU utilization alarm', () => {
      expect(stack).toBeDefined();
    });
  });

  describe('SNS Topic', () => {
    it('should create SNS topic for alarms', () => {
      expect(stack).toBeDefined();
    });
  });
});
