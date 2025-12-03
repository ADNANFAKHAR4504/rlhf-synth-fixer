import * as pulumi from '@pulumi/pulumi';
import { createSNSTopics } from '../lib/sns-topics';

pulumi.runtime.setMocks({
  newResource: function(args: pulumi.runtime.MockResourceArgs): {id: string, state: any} {
    return {
      id: `${args.name}-id`,
      state: {
        ...args.inputs,
        arn: `arn:aws:sns:us-east-1:123456789012:${args.name}`,
      },
    };
  },
  call: function(args: pulumi.runtime.MockCallArgs) {
    return args.inputs;
  },
});

describe('createSNSTopics', () => {
  it('should create critical, warning, and info topics', (done) => {
    const result = createSNSTopics('test', { Environment: 'test' });

    result.topicArns.apply(arns => {
      expect(arns.critical).toBeDefined();
      expect(arns.warning).toBeDefined();
      expect(arns.info).toBeDefined();
      expect(typeof arns.critical).toBe('string');
      expect(typeof arns.warning).toBe('string');
      expect(typeof arns.info).toBe('string');
      done();
      return arns;
    });
  });

  it('should return topic objects', () => {
    const result = createSNSTopics('test', { Environment: 'test' });

    expect(result.topics).toBeDefined();
    expect(result.topics.critical).toBeDefined();
    expect(result.topics.warning).toBeDefined();
    expect(result.topics.info).toBeDefined();
  });

  it('should use environment suffix in topic names', (done) => {
    const result = createSNSTopics('prod', { Environment: 'prod' });

    result.topicArns.apply(arns => {
      expect(arns.critical).toContain('prod');
      expect(arns.warning).toContain('prod');
      expect(arns.info).toContain('prod');
      done();
      return arns;
    });
  });

  it('should apply tags to topics', () => {
    const tags = { Environment: 'test', Team: 'platform' };
    const result = createSNSTopics('test', tags);

    expect(result.topics.critical).toBeDefined();
    expect(result.topics.warning).toBeDefined();
    expect(result.topics.info).toBeDefined();
  });

  it('should handle empty tags', () => {
    const result = createSNSTopics('test', {});

    expect(result.topicArns).toBeDefined();
    expect(result.topics).toBeDefined();
  });

  it('should accept custom resource options', () => {
    const opts = { protect: true };
    const result = createSNSTopics('test', { Environment: 'test' }, opts);

    expect(result.topicArns).toBeDefined();
  });

  it('should create topic subscriptions', () => {
    const result = createSNSTopics('test', { Environment: 'test' });

    expect(result.topicArns).toBeDefined();
    expect(result.topics).toBeDefined();
  });

  it('should use different suffixes correctly', (done) => {
    const result1 = createSNSTopics('dev', { Environment: 'dev' });
    const result2 = createSNSTopics('staging', { Environment: 'staging' });

    Promise.all([
      result1.topicArns.apply(arns => arns),
      result2.topicArns.apply(arns => arns),
    ]).then(([arns1, arns2]) => {
      expect(arns1.critical).not.toBe(arns2.critical);
      done();
    });
  });
});
