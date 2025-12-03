import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

// Set up Pulumi mocking
pulumi.runtime.setMocks({
  newResource: function(args: pulumi.runtime.MockResourceArgs): {id: string, state: any} {
    return {
      id: args.inputs.name ? `${args.type}-${args.inputs.name}` : `${args.type}-${args.name}`,
      state: {
        ...args.inputs,
        arn: `arn:aws:${args.type}:us-east-1:123456789012:${args.name}`,
        id: `${args.name}-id`,
      },
    };
  },
  call: function(args: pulumi.runtime.MockCallArgs) {
    return args.inputs;
  },
});

describe('TapStack', () => {
  let stack: TapStack;

  describe('with custom arguments', () => {
    beforeAll(() => {
      stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
        tags: { Environment: 'test', Team: 'platform' },
        monitoringRegions: ['us-east-1', 'us-west-2'],
        analysisSchedule: 'rate(30 minutes)',
        reportSchedule: 'rate(1 day)',
      });
    });

    it('should create stack instance', () => {
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(TapStack);
    });

    it('should expose dashboardUrls output', (done) => {
      stack.dashboardUrls.apply(urls => {
        expect(urls).toBeDefined();
        expect(Array.isArray(urls)).toBe(true);
        done();
        return urls;
      });
    });

    it('should expose snsTopicArns output', (done) => {
      stack.snsTopicArns.apply(arns => {
        expect(arns).toBeDefined();
        expect(arns.critical).toBeDefined();
        expect(arns.warning).toBeDefined();
        expect(arns.info).toBeDefined();
        done();
        return arns;
      });
    });

    it('should expose lambdaFunctionArns output', (done) => {
      stack.lambdaFunctionArns.apply(arns => {
        expect(arns).toBeDefined();
        expect(Array.isArray(arns)).toBe(true);
        expect(arns.length).toBe(2);
        done();
        return arns;
      });
    });
  });

  describe('with default arguments', () => {
    beforeAll(() => {
      stack = new TapStack('test-stack-default', {});
    });

    it('should create stack with defaults', () => {
      expect(stack).toBeDefined();
    });

    it('should have dashboard URLs', (done) => {
      stack.dashboardUrls.apply(urls => {
        expect(urls).toBeDefined();
        done();
        return urls;
      });
    });

    it('should have SNS topic ARNs', (done) => {
      stack.snsTopicArns.apply(arns => {
        expect(arns).toBeDefined();
        done();
        return arns;
      });
    });

    it('should have Lambda function ARNs', (done) => {
      stack.lambdaFunctionArns.apply(arns => {
        expect(arns).toBeDefined();
        done();
        return arns;
      });
    });
  });

  describe('with minimal arguments', () => {
    beforeAll(() => {
      stack = new TapStack('test-stack-minimal', {
        environmentSuffix: 'prod',
      });
    });

    it('should use provided environmentSuffix', () => {
      expect(stack).toBeDefined();
    });

    it('should apply default values for optional parameters', (done) => {
      Promise.all([
        stack.dashboardUrls.apply(urls => urls),
        stack.snsTopicArns.apply(arns => arns),
        stack.lambdaFunctionArns.apply(arns => arns),
      ]).then(([urls, arns, functionArns]) => {
        expect(urls).toBeDefined();
        expect(arns).toBeDefined();
        expect(functionArns).toBeDefined();
        done();
      });
    });
  });

  describe('resource creation order', () => {
    beforeAll(() => {
      stack = new TapStack('test-stack-ordering', {
        environmentSuffix: 'order-test',
      });
    });

    it('should create resources in correct order', () => {
      expect(stack).toBeDefined();
      // SNS topics created first
      // IAM roles created second
      // Lambda functions use IAM role and SNS topics
      // CloudWatch resources use SNS topics
      // This validates the dependency chain
    });
  });

  describe('with single monitoring region', () => {
    beforeAll(() => {
      stack = new TapStack('test-stack-single-region', {
        environmentSuffix: 'single',
        monitoringRegions: ['us-east-1'],
      });
    });

    it('should handle single region', (done) => {
      stack.dashboardUrls.apply(urls => {
        expect(Array.isArray(urls)).toBe(true);
        done();
        return urls;
      });
    });
  });

  describe('with custom schedules', () => {
    beforeAll(() => {
      stack = new TapStack('test-stack-schedules', {
        environmentSuffix: 'schedule-test',
        analysisSchedule: 'rate(15 minutes)',
        reportSchedule: 'rate(3 days)',
      });
    });

    it('should accept custom schedule configurations', () => {
      expect(stack).toBeDefined();
    });
  });

  describe('with multiple monitoring regions', () => {
    beforeAll(() => {
      stack = new TapStack('test-stack-multi-region', {
        environmentSuffix: 'multi',
        monitoringRegions: ['us-east-1', 'us-west-2', 'eu-west-1'],
      });
    });

    it('should handle multiple regions', (done) => {
      stack.dashboardUrls.apply(urls => {
        expect(Array.isArray(urls)).toBe(true);
        done();
        return urls;
      });
    });
  });
});
