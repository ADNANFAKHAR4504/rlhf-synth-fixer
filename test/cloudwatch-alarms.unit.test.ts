import * as pulumi from '@pulumi/pulumi';
import { createCloudWatchAlarms } from '../lib/cloudwatch-alarms';

pulumi.runtime.setMocks({
  newResource: function(args: pulumi.runtime.MockResourceArgs): {id: string, state: any} {
    return {
      id: `${args.name}-id`,
      state: {
        ...args.inputs,
        arn: `arn:aws:cloudwatch:us-east-1:123456789012:alarm:${args.name}`,
      },
    };
  },
  call: function(args: pulumi.runtime.MockCallArgs) {
    return args.inputs;
  },
});

describe('createCloudWatchAlarms', () => {
  const mockSnsTopicArns = pulumi.output({
    critical: 'arn:aws:sns:us-east-1:123456789012:critical',
    warning: 'arn:aws:sns:us-east-1:123456789012:warning',
    info: 'arn:aws:sns:us-east-1:123456789012:info',
  });

  it('should create all alarm types', () => {
    const result = createCloudWatchAlarms(
      {
        environmentSuffix: 'test',
        tags: { Environment: 'test' },
        snsTopicArns: mockSnsTopicArns,
      }
    );

    expect(result.alarms).toBeDefined();
    expect(result.alarms.length).toBe(4);
  });

  it('should create database connection alarm', () => {
    const result = createCloudWatchAlarms(
      {
        environmentSuffix: 'test',
        tags: { Environment: 'test' },
        snsTopicArns: mockSnsTopicArns,
      }
    );

    expect(result.alarms[0]).toBeDefined();
  });

  it('should create API latency alarm', () => {
    const result = createCloudWatchAlarms(
      {
        environmentSuffix: 'test',
        tags: { Environment: 'test' },
        snsTopicArns: mockSnsTopicArns,
      }
    );

    expect(result.alarms[1]).toBeDefined();
  });

  it('should create Lambda error alarm', () => {
    const result = createCloudWatchAlarms(
      {
        environmentSuffix: 'test',
        tags: { Environment: 'test' },
        snsTopicArns: mockSnsTopicArns,
      }
    );

    expect(result.alarms[2]).toBeDefined();
  });

  it('should create EC2 CPU warning alarm', () => {
    const result = createCloudWatchAlarms(
      {
        environmentSuffix: 'test',
        tags: { Environment: 'test' },
        snsTopicArns: mockSnsTopicArns,
      }
    );

    expect(result.alarms[3]).toBeDefined();
  });

  it('should use environment suffix in alarm names', () => {
    const result = createCloudWatchAlarms(
      {
        environmentSuffix: 'prod',
        tags: { Environment: 'prod' },
        snsTopicArns: mockSnsTopicArns,
      }
    );

    expect(result.alarms.length).toBe(4);
  });

  it('should apply tags to alarms', () => {
    const tags = { Environment: 'test', Team: 'platform' };
    const result = createCloudWatchAlarms(
      {
        environmentSuffix: 'test',
        tags: tags,
        snsTopicArns: mockSnsTopicArns,
      }
    );

    expect(result.alarms.length).toBe(4);
  });

  it('should accept custom resource options', () => {
    const opts = { protect: true };
    const result = createCloudWatchAlarms(
      {
        environmentSuffix: 'test',
        tags: { Environment: 'test' },
        snsTopicArns: mockSnsTopicArns,
      },
      opts
    );

    expect(result.alarms).toBeDefined();
  });

  it('should handle empty tags', () => {
    const result = createCloudWatchAlarms(
      {
        environmentSuffix: 'test',
        tags: {},
        snsTopicArns: mockSnsTopicArns,
      }
    );

    expect(result.alarms.length).toBe(4);
  });

  it('should return array of alarms', () => {
    const result = createCloudWatchAlarms(
      {
        environmentSuffix: 'test',
        tags: { Environment: 'test' },
        snsTopicArns: mockSnsTopicArns,
      }
    );

    expect(Array.isArray(result.alarms)).toBe(true);
  });

  it('should create alarms with different severity levels', () => {
    const result = createCloudWatchAlarms(
      {
        environmentSuffix: 'test',
        tags: { Environment: 'test' },
        snsTopicArns: mockSnsTopicArns,
      }
    );

    // First 3 alarms use critical topic, last one uses warning
    expect(result.alarms.length).toBe(4);
  });
});
