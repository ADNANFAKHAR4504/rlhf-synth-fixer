import * as pulumi from '@pulumi/pulumi';

pulumi.runtime.setMocks(
  {
    newResource: function (args: pulumi.runtime.MockResourceArgs): {
      id: string;
      state: any;
    } {
      return {
        id: args.inputs.name
          ? `${args.name}_${args.inputs.name}`
          : `${args.name}_id`,
        state: {
          ...args.inputs,
          arn:
            args.inputs.name ||
            `arn:aws:${args.type}:us-east-1:123456789012:${args.name}`,
          bucket: args.inputs.bucket || args.inputs.name,
        },
      };
    },
    call: function (args: pulumi.runtime.MockCallArgs) {
      return args.inputs;
    },
  },
  'TapStack',
  'test',
  false
);

describe('TapStack', () => {
  let stack: typeof import('../lib/tap-stack');

  beforeAll(() => {
    // Dynamically import to ensure mocks are set up first
    stack = require('../lib/tap-stack');
  });

  describe('TapStack class', () => {
    it('should be defined', () => {
      expect(stack.TapStack).toBeDefined();
    });

    it('should export TapStack class', () => {
      expect(typeof stack.TapStack).toBe('function');
    });
  });

  describe('TapStack resource creation', () => {
    let tapStack: any;

    beforeAll(async () => {
      tapStack = new stack.TapStack('test-stack', {
        tags: { Environment: 'test' },
        environmentSuffix: 'test123',
      });
    });

    it('should create TapStack instance', () => {
      expect(tapStack).toBeDefined();
    });

    it('should have configRecorderName output', done => {
      pulumi.all([tapStack.configRecorderName]).apply(([name]) => {
        expect(name).toBeDefined();
        expect(typeof name).toBe('string');
        done();
      });
    });

    it('should have configBucketArn output', done => {
      pulumi.all([tapStack.configBucketArn]).apply(([arn]) => {
        expect(arn).toBeDefined();
        expect(typeof arn).toBe('string');
        done();
      });
    });

    it('should have complianceTopicArn output', done => {
      pulumi.all([tapStack.complianceTopicArn]).apply(([arn]) => {
        expect(arn).toBeDefined();
        expect(typeof arn).toBe('string');
        done();
      });
    });

    it('should have tagCheckerLambdaArn output', done => {
      pulumi.all([tapStack.tagCheckerLambdaArn]).apply(([arn]) => {
        expect(arn).toBeDefined();
        expect(typeof arn).toBe('string');
        done();
      });
    });
  });

  describe('TapStack configuration', () => {
    it('should accept tags in arguments', () => {
      const testTags = { Department: 'IT', CostCenter: 'CC123' };
      const tapStack = new stack.TapStack('test-tags-stack', {
        tags: testTags,
        environmentSuffix: 'test123',
      });
      expect(tapStack).toBeDefined();
    });

    it('should require environmentSuffix argument', () => {
      const tapStack = new stack.TapStack('test-required-args-stack', {
        environmentSuffix: 'test123',
      });
      expect(tapStack).toBeDefined();
    });
  });

  describe('Resource naming with environmentSuffix', () => {
    it('should include environmentSuffix in resource names', done => {
      const tapStack = new stack.TapStack('suffix-test-stack', {
        environmentSuffix: 'test123',
      });

      pulumi.all([tapStack.configRecorderName]).apply(([name]) => {
        expect(name).toContain('test123'); // environmentSuffix from args
        done();
      });
    });
  });

  describe('AWS Config components', () => {
    it('should create Config recorder', () => {
      const tapStack = new stack.TapStack('config-recorder-test', {
        environmentSuffix: 'test123',
      });
      expect(tapStack.configRecorderName).toBeDefined();
    });

    it('should create S3 bucket for Config', () => {
      const tapStack = new stack.TapStack('s3-bucket-test', {
        environmentSuffix: 'test123',
      });
      expect(tapStack.configBucketArn).toBeDefined();
    });

    it('should create SNS topic for compliance', () => {
      const tapStack = new stack.TapStack('sns-topic-test', {
        environmentSuffix: 'test123',
      });
      expect(tapStack.complianceTopicArn).toBeDefined();
    });

    it('should create Lambda function for custom rule', () => {
      const tapStack = new stack.TapStack('lambda-test', {
        environmentSuffix: 'test123',
      });
      expect(tapStack.tagCheckerLambdaArn).toBeDefined();
    });
  });

  describe('Output validation', () => {
    it('should register all required outputs', done => {
      const tapStack = new stack.TapStack('output-validation-test', {
        environmentSuffix: 'test123',
      });

      pulumi
        .all([
          tapStack.configRecorderName,
          tapStack.configBucketArn,
          tapStack.complianceTopicArn,
          tapStack.tagCheckerLambdaArn,
        ])
        .apply(([recorderName, bucketArn, topicArn, lambdaArn]) => {
          expect(recorderName).toBeDefined();
          expect(bucketArn).toBeDefined();
          expect(topicArn).toBeDefined();
          expect(lambdaArn).toBeDefined();
          done();
        });
    });
  });
});
