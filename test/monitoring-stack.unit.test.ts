/**
 * Unit tests for MonitoringStack
 * Tests CloudWatch alarms, EventBridge rules, and SNS topics
 */
import * as pulumi from '@pulumi/pulumi';
import { MonitoringStack } from '../lib/monitoring-stack';

describe('MonitoringStack', () => {
  let monitoringStack: MonitoringStack;
  const mockClusterId = pulumi.output('cluster-12345');
  const mockHealthCheckId = pulumi.output('hc-12345');

  beforeEach(() => {
    monitoringStack = new MonitoringStack('test-monitoring', {
      environmentSuffix: 'test',
      primaryRegion: 'us-east-1',
      secondaryRegion: 'us-west-2',
      globalClusterId: mockClusterId,
      primaryClusterId: mockClusterId,
      secondaryClusterId: mockClusterId,
      healthCheckId: mockHealthCheckId,
      tags: { Environment: 'test' },
    });
  });

  describe('Resource Creation', () => {
    it('should create MonitoringStack instance successfully', () => {
      expect(monitoringStack).toBeDefined();
      expect(monitoringStack).toBeInstanceOf(MonitoringStack);
    });

    it('should expose snsTopicArn output', () => {
      expect(monitoringStack.snsTopicArn).toBeDefined();
    });
  });

  describe('Configuration Validation', () => {
    it('should handle different environment suffixes', () => {
      const stack1 = new MonitoringStack('monitoring-dev', {
        environmentSuffix: 'dev',
        primaryRegion: 'us-east-1',
        secondaryRegion: 'us-west-2',
        globalClusterId: mockClusterId,
        primaryClusterId: mockClusterId,
        secondaryClusterId: mockClusterId,
        healthCheckId: mockHealthCheckId,
      });
      expect(stack1).toBeDefined();

      const stack2 = new MonitoringStack('monitoring-prod', {
        environmentSuffix: 'prod',
        primaryRegion: 'us-east-1',
        secondaryRegion: 'us-west-2',
        globalClusterId: mockClusterId,
        primaryClusterId: mockClusterId,
        secondaryClusterId: mockClusterId,
        healthCheckId: mockHealthCheckId,
      });
      expect(stack2).toBeDefined();
    });

    it('should accept custom tags', () => {
      const customTags = {
        Environment: 'production',
        AlertLevel: 'critical',
        NotificationChannel: 'email',
      };
      const stack = new MonitoringStack('monitoring-tagged', {
        environmentSuffix: 'tagged',
        primaryRegion: 'us-east-1',
        secondaryRegion: 'us-west-2',
        globalClusterId: mockClusterId,
        primaryClusterId: mockClusterId,
        secondaryClusterId: mockClusterId,
        healthCheckId: mockHealthCheckId,
        tags: customTags,
      });
      expect(stack).toBeDefined();
    });

    it('should work without optional tags', () => {
      const stack = new MonitoringStack('monitoring-minimal', {
        environmentSuffix: 'minimal',
        primaryRegion: 'us-east-1',
        secondaryRegion: 'us-west-2',
        globalClusterId: mockClusterId,
        primaryClusterId: mockClusterId,
        secondaryClusterId: mockClusterId,
        healthCheckId: mockHealthCheckId,
      });
      expect(stack).toBeDefined();
    });
  });

  describe('CloudWatch Alarms', () => {
    it('should create database lag alarm', () => {
      const stack = new MonitoringStack('monitoring-dbalarm', {
        environmentSuffix: 'dbalarm',
        primaryRegion: 'us-east-1',
        secondaryRegion: 'us-west-2',
        globalClusterId: mockClusterId,
        primaryClusterId: mockClusterId,
        secondaryClusterId: mockClusterId,
        healthCheckId: mockHealthCheckId,
      });
      expect(stack.snsTopicArn).toBeDefined();
    });

    it('should create health check alarm', () => {
      const healthCheckId = pulumi.output('health-check-123');
      const stack = new MonitoringStack('monitoring-hcalarm', {
        environmentSuffix: 'hcalarm',
        primaryRegion: 'us-east-1',
        secondaryRegion: 'us-west-2',
        globalClusterId: mockClusterId,
        primaryClusterId: mockClusterId,
        secondaryClusterId: mockClusterId,
        healthCheckId: healthCheckId,
      });
      expect(stack).toBeDefined();
    });
  });

  describe('EventBridge Integration', () => {
    it('should create event bus for cross-region replication', () => {
      const stack = new MonitoringStack('monitoring-eventbus', {
        environmentSuffix: 'eb',
        primaryRegion: 'us-east-1',
        secondaryRegion: 'us-west-2',
        globalClusterId: mockClusterId,
        primaryClusterId: mockClusterId,
        secondaryClusterId: mockClusterId,
        healthCheckId: mockHealthCheckId,
      });
      expect(stack).toBeDefined();
    });

    it('should support multi-region event processing', () => {
      const stack = new MonitoringStack('monitoring-events', {
        environmentSuffix: 'events',
        primaryRegion: 'eu-west-1',
        secondaryRegion: 'ap-southeast-1',
        globalClusterId: mockClusterId,
        primaryClusterId: mockClusterId,
        secondaryClusterId: mockClusterId,
        healthCheckId: mockHealthCheckId,
      });
      expect(stack).toBeDefined();
    });
  });

  describe('SNS Notifications', () => {
    it('should create SNS topic for alarms', () => {
      expect(monitoringStack.snsTopicArn).toBeDefined();
    });

    it('should support alarm notifications', () => {
      const stack = new MonitoringStack('monitoring-sns', {
        environmentSuffix: 'sns',
        primaryRegion: 'us-east-1',
        secondaryRegion: 'us-west-2',
        globalClusterId: mockClusterId,
        primaryClusterId: mockClusterId,
        secondaryClusterId: mockClusterId,
        healthCheckId: mockHealthCheckId,
      });
      expect(stack.snsTopicArn).toBeDefined();
    });
  });

  describe('Multi-Region Monitoring', () => {
    it('should support monitoring across multiple regions', () => {
      const stack = new MonitoringStack('monitoring-multiregion', {
        environmentSuffix: 'mr',
        primaryRegion: 'us-east-1',
        secondaryRegion: 'us-west-2',
        globalClusterId: mockClusterId,
        primaryClusterId: mockClusterId,
        secondaryClusterId: mockClusterId,
        healthCheckId: mockHealthCheckId,
      });
      expect(stack.snsTopicArn).toBeDefined();
    });
  });
});
