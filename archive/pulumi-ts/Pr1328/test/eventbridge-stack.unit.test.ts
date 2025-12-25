import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { EventBridgeStack } from '../lib/eventbridge-stack';

// Mock Pulumi and AWS
(pulumi as any).runtime = {
  isDryRun: () => true,
  setMocks: () => {},
  registerStackTransformation: () => {},
} as any;

describe('EventBridgeStack', () => {
  let stack: EventBridgeStack;
  const mockEventBus = {
    name: pulumi.Output.create('tap-application-events-test'),
    arn: pulumi.Output.create(
      'arn:aws:events:us-west-2:123456789012:event-bus/tap-application-events-test'
    ),
  };
  const mockLogGroup = {
    name: pulumi.Output.create('/aws/events/tap-application-test'),
    arn: pulumi.Output.create(
      'arn:aws:logs:us-west-2:123456789012:log-group:/aws/events/tap-application-test'
    ),
  };
  const mockEventRule = {
    name: pulumi.Output.create('tap-s3-processing-test'),
    arn: pulumi.Output.create(
      'arn:aws:events:us-west-2:123456789012:rule/tap-s3-processing-test'
    ),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock AWS resources
    jest
      .spyOn(aws.cloudwatch, 'EventBus')
      .mockImplementation((() => mockEventBus) as any);
    jest
      .spyOn(aws.cloudwatch, 'LogGroup')
      .mockImplementation((() => mockLogGroup) as any);
    jest
      .spyOn(aws.cloudwatch, 'EventRule')
      .mockImplementation((() => mockEventRule) as any);
  });

  describe('constructor', () => {
    it('should create custom EventBridge event bus', () => {
      stack = new EventBridgeStack('test-eventbridge', {
        environmentSuffix: 'test',
        tags: { Environment: 'test' },
      });

      expect(aws.cloudwatch.EventBus).toHaveBeenCalledWith(
        expect.stringContaining('tap-event-bus-test'),
        expect.objectContaining({
          name: 'tap-application-events-test',
          tags: expect.objectContaining({
            Name: 'tap-event-bus-test',
            Component: 'EventBridge',
            Environment: 'test',
          }),
        }),
        expect.any(Object)
      );
    });

    it('should create CloudWatch log group for event monitoring', () => {
      stack = new EventBridgeStack('test-eventbridge', {
        environmentSuffix: 'test',
        tags: { Environment: 'test' },
      });

      expect(aws.cloudwatch.LogGroup).toHaveBeenCalledWith(
        expect.stringContaining('tap-events-logs-test'),
        expect.objectContaining({
          name: '/aws/events/tap-application-test',
          retentionInDays: 14,
          tags: expect.objectContaining({
            Name: 'tap-events-logs-test',
            Component: 'Monitoring',
          }),
        }),
        expect.any(Object)
      );
    });

    it('should create EventBridge rule for S3 processing events', () => {
      stack = new EventBridgeStack('test-eventbridge', {
        environmentSuffix: 'test',
      });

      expect(aws.cloudwatch.EventRule).toHaveBeenCalledWith(
        expect.stringContaining('tap-s3-processing-rule-test'),
        expect.objectContaining({
          name: 'tap-s3-processing-test',
          description:
            'Rule to capture S3 object processing events from Lambda',
          eventBusName: mockEventBus.name,
          state: 'ENABLED',
          tags: expect.objectContaining({
            Name: 'tap-s3-processing-rule-test',
            Component: 'EventBridge',
          }),
        }),
        expect.any(Object)
      );
    });

    it('should create event pattern with correct source', () => {
      stack = new EventBridgeStack('test-eventbridge', {
        environmentSuffix: 'test',
      });

      const ruleCall = (aws.cloudwatch.EventRule as unknown as jest.Mock).mock
        .calls[0];
      const eventPattern = JSON.parse(ruleCall[1].eventPattern);

      expect(eventPattern.source).toEqual(['tap.application.test']);
      expect(eventPattern['detail-type']).toEqual(['S3 Object Processed']);
      expect(eventPattern.detail.status).toEqual(['success', 'error']);
    });

    it('should use default environment suffix when not provided', () => {
      stack = new EventBridgeStack('test-eventbridge', {});

      expect(aws.cloudwatch.EventBus).toHaveBeenCalledWith(
        expect.stringContaining('tap-event-bus-dev'),
        expect.objectContaining({
          name: 'tap-application-events-dev',
        }),
        expect.any(Object)
      );
    });

    it('should expose custom event bus ARN', () => {
      stack = new EventBridgeStack('test-eventbridge', {
        environmentSuffix: 'test',
      });

      expect(stack.customEventBusArn).toBeDefined();
      expect(stack.customEventBusArn).toBe(mockEventBus.arn);
    });

    it('should expose event bus object', () => {
      stack = new EventBridgeStack('test-eventbridge', {
        environmentSuffix: 'test',
      });

      expect(stack.customEventBus).toBeDefined();
      expect(stack.customEventBus).toBe(mockEventBus);
    });

    it('should expose S3 processing rule', () => {
      stack = new EventBridgeStack('test-eventbridge', {
        environmentSuffix: 'test',
      });

      expect(stack.s3ProcessingRule).toBeDefined();
      expect(stack.s3ProcessingRule).toBe(mockEventRule);
    });

    it('should expose monitoring log group', () => {
      stack = new EventBridgeStack('test-eventbridge', {
        environmentSuffix: 'test',
      });

      expect(stack.monitoringLogGroup).toBeDefined();
      expect(stack.monitoringLogGroup).toBe(mockLogGroup);
    });

    it('should set log retention to 14 days', () => {
      stack = new EventBridgeStack('test-eventbridge', {
        environmentSuffix: 'test',
      });

      expect(aws.cloudwatch.LogGroup).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          retentionInDays: 14,
        }),
        expect.any(Object)
      );
    });

    it('should enable the event rule', () => {
      stack = new EventBridgeStack('test-eventbridge', {
        environmentSuffix: 'test',
      });

      expect(aws.cloudwatch.EventRule).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          state: 'ENABLED',
        }),
        expect.any(Object)
      );
    });

    it('should create event pattern for multiple statuses', () => {
      stack = new EventBridgeStack('test-eventbridge', {
        environmentSuffix: 'test',
      });

      const ruleCall = (aws.cloudwatch.EventRule as unknown as jest.Mock).mock
        .calls[0];
      const eventPattern = JSON.parse(ruleCall[1].eventPattern);

      expect(eventPattern.detail.status).toContain('success');
      expect(eventPattern.detail.status).toContain('error');
    });

    it('should set correct log group path', () => {
      stack = new EventBridgeStack('test-eventbridge', {
        environmentSuffix: 'test',
      });

      expect(aws.cloudwatch.LogGroup).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          name: '/aws/events/tap-application-test',
        }),
        expect.any(Object)
      );
    });
  });
});
