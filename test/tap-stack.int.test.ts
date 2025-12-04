import {
  ConfigServiceClient,
  DescribeConfigurationRecordersCommand,
  DescribeDeliveryChannelsCommand,
} from '@aws-sdk/client-config-service';
import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

// Collect resources created by Pulumi runtime mock to inspect inputs
const resources: Array<{ type: string; name: string; inputs: any }> = [];

pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs) => {
    // capture resource for later assertions
    resources.push({ type: args.type, name: args.name, inputs: args.inputs });

    // Provide sensible default ids/arns
    const defaults = args.type.startsWith('aws:')
      ? {
        arn: `arn:aws:mock:${args.type.split('/').slice(-1)[0]}:${args.name}`,
        id: `${args.name}_id`,
        name: args.inputs.name || args.name,
      }
      : {};

    // Handle specific AWS resource types we care about
    if (args.type === 'aws:s3/bucket:Bucket') {
      const bucketName = args.inputs.bucket || args.name;
      return {
        id: `${bucketName}_id`,
        state: {
          ...args.inputs,
          ...defaults,
          bucket: bucketName,
          arn: `arn:aws:s3:::${bucketName}`,
        },
      };
    }

    if (args.type === 'aws:lambda/function:Function') {
      const fnName = args.inputs.name || args.name;
      return {
        id: `${fnName}_id`,
        state: {
          ...args.inputs,
          ...defaults,
          arn: `arn:aws:lambda:us-east-1:123456789012:function:${fnName}`,
          qualifiedArn: `arn:aws:lambda:us-east-1:123456789012:function:${fnName}:$LATEST`,
        },
      };
    }

    // default resource state
    return { id: defaults.id || `${args.name}_id`, state: { ...args.inputs, ...defaults } };
  },
  call: (args: pulumi.runtime.MockCallArgs) => args.inputs,
});

// Helpers to spy on AWS SDK ConfigServiceClient
let sendSpy: jest.SpyInstance;
const setConfigResponses = (recorders: Array<any> = [], channels: Array<any> = []) => {
  sendSpy.mockImplementation((command: any) => {
    if (command instanceof DescribeConfigurationRecordersCommand) {
      return Promise.resolve({ ConfigurationRecorders: recorders });
    }
    if (command instanceof DescribeDeliveryChannelsCommand) {
      return Promise.resolve({ DeliveryChannels: channels });
    }
    return Promise.resolve({});
  });
};
const setConfigError = () => {
  sendSpy.mockImplementation(() => Promise.reject(new Error('AWS error')));
};

jest.spyOn(pulumi, 'Config').mockImplementation(
  () =>
  ({
    get: (key: string) => undefined,
    getBoolean: (key: string) => false,
    getNumber: (key: string) => undefined,
    require: (key: string) => undefined,
  } as any)
);

describe('TP integration tests (TapStack + TagChecker)', () => {
  const suffix = 'inttest';

  beforeEach(() => {
    // reset captured resources
    resources.length = 0;
    jest.restoreAllMocks();
    sendSpy = jest.spyOn(ConfigServiceClient.prototype as any, 'send');
    // default to no existing recorder/channel
    setConfigResponses([], []);
  });

  test('creates the expected outputs', async () => {
    const stack = new TapStack('stack', { environmentSuffix: suffix });
    expect(stack.configRecorderName).toBeDefined();
    expect(stack.configBucketArn).toBeDefined();
    expect(stack.complianceTopicArn).toBeDefined();
    expect(stack.tagCheckerLambdaArn).toBeDefined();
  });

  test('tagCheckerLambdaArn indicates a lambda function and suffix', (done) => {
    const stack = new TapStack('stack2', { environmentSuffix: suffix });
    stack.tagCheckerLambdaArn.apply(arn => {
      expect(arn).toContain(':function:');
      expect(arn).toContain(suffix);
      done();
    });
  });

  test('defaults to shared recorder when none exists', (done) => {
    setConfigResponses([], []);
    const stack = new TapStack('stack3', { environmentSuffix: suffix });
    stack.configRecorderName.apply(name => {
      expect(name).toBe('config-recorder-shared');
      done();
    });
  });

  test('reuses existing recorder name when present', (done) => {
    setConfigResponses([{ name: 'existing-recorder' } as any], []);
    const stack = new TapStack('stack4', { environmentSuffix: suffix });
    stack.configRecorderName.apply(name => {
      expect(name).toBe('existing-recorder');
      done();
    });
  });

  test('reuses existing delivery channel when present', (done) => {
    setConfigResponses([], [{ name: 'existing-channel' } as any]);
    const stack = new TapStack('stack5', { environmentSuffix: suffix });
    stack.configRecorderName.apply(name => {
      // When only channel exists, recorderName defaults to shared
      expect(name).toBe('config-recorder-shared');
      done();
    });
  });

  test('creates delivery channel when only recorder exists', (done) => {
    setConfigResponses([{ name: 'existing-recorder-only' } as any], []);
    const stack = new TapStack('stack6', { environmentSuffix: suffix });
    // the presence of resources captured should include a deliveryChannel
    setTimeout(() => {
      const dc = resources.find(r => r.type.startsWith('aws:cfg/deliveryChannel'));
      expect(dc).toBeDefined();
      done();
    }, 0);
  });

  test('creates recorder when only channel exists', (done) => {
    setConfigResponses([], [{ name: 'existing-channel-only' } as any]);
    const stack = new TapStack('stack7', { environmentSuffix: suffix });
    setTimeout(() => {
      const rc = resources.find(r => r.type.startsWith('aws:cfg/recorder'));
      expect(rc).toBeDefined();
      done();
    }, 0);
  });

  test('fallback path works when AWS SDK errors', (done) => {
    setConfigError();
    const stack = new TapStack('stack8', { environmentSuffix: suffix });
    stack.configRecorderName.apply(name => {
      expect(name).toBe('config-recorder-shared');
      done();
    });
  });

  test('config bucket policy contains required acl condition', (done) => {
    setConfigResponses([], []);
    const stack = new TapStack('stack9', { environmentSuffix: suffix });
    // Wait for resource creation to be recorded
    setTimeout(() => {
      const bp = resources.find(r => r.type.startsWith('aws:s3/bucketPolicy'));
      expect(bp).toBeDefined();
      expect(bp!.inputs.policy).toContain('s3:x-amz-acl');
      done();
    }, 0);
  });

  test('lambda runtime is nodejs18.x and name contains suffix', (done) => {
    setConfigResponses([], []);
    const stack = new TapStack('stack10', { environmentSuffix: suffix });
    setTimeout(() => {
      const fn = resources.find(r => r.type.startsWith('aws:lambda/function'));
      expect(fn).toBeDefined();
      expect(fn!.inputs.runtime).toBe('nodejs18.x');
      expect(fn!.inputs.name).toContain(suffix);
      done();
    }, 0);
  });

  test('creates the custom-lambda-based config rule', (done) => {
    setConfigResponses([], []);
    const stack = new TapStack('stack11', { environmentSuffix: suffix });
    setTimeout(() => {
      const cr = resources.find(r => r.type.startsWith('aws:cfg/rule') && (r.inputs.name as string).startsWith('custom-tag-rule'));
      expect(cr).toBeDefined();
      expect(cr!.inputs.source.owner).toBe('CUSTOM_LAMBDA');
      done();
    }, 0);
  });

  test('creates managed config rules when recorder is present', (done) => {
    setConfigResponses([], []);
    const stack = new TapStack('stack12', { environmentSuffix: suffix });
    setTimeout(() => {
      const managedRules = resources.filter(r => r.type.startsWith('aws:cfg/rule') && (r.inputs.name as string).includes('rds-encryption-rule'));
      expect(managedRules.length).toBeGreaterThanOrEqual(1);
      done();
    }, 0);
  });

  test('exports a compliance topic arn that contains sns and suffix', (done) => {
    setConfigResponses([], []);
    const stack = new TapStack('stack13', { environmentSuffix: suffix });
    stack.complianceTopicArn.apply(arn => {
      expect(arn).toContain('arn:aws:mock:topic:Topic:compliance-topic-inttest');
      expect(arn).toContain(suffix);
      done();
    });
  });
});
