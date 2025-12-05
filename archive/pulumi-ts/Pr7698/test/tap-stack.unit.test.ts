import {
  ConfigServiceClient,
  DescribeConfigurationRecordersCommand,
  DescribeDeliveryChannelsCommand,
} from '@aws-sdk/client-config-service';
import * as pulumi from '@pulumi/pulumi';
import { mockClient } from 'aws-sdk-client-mock';

// Create an SDK mock for ConfigServiceClient used by the stack
const configMock = mockClient(ConfigServiceClient);

// Set up Pulumi runtime mocks for resource creation
pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs) => {
    const base = {
      id: `${args.name}_id`,
      arn: `arn:aws:service:us-east-1:123456789012:resource/${args.name}`,
      name: args.inputs.name || args.name,
    } as any;

    // Ensure S3 bucket has bucket name/arn
    if (args.type === 'aws:s3/bucket:Bucket') {
      const bucketName = args.inputs.bucket || args.name;
      return {
        id: `${bucketName}_id`,
        state: {
          ...args.inputs,
          ...base,
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
          ...base,
          arn: `arn:aws:lambda:us-east-1:123456789012:function:${fnName}`,
          qualifiedArn: `arn:aws:lambda:us-east-1:123456789012:function:${fnName}:$LATEST`,
        },
      };
    }

    if (args.type === 'aws:sns/topic:Topic') {
      const topicName = args.inputs.name || args.name;
      return {
        id: `${topicName}_id`,
        state: {
          ...args.inputs,
          ...base,
          arn: `arn:aws:sns:us-east-1:123456789012:${topicName}`,
        },
      };
    }

    // AWS Config resources (recorder, deliveryChannel, recorderStatus, rule)
    if (args.type.startsWith('aws:cfg/')) {
      return {
        id: `${args.name}_id`,
        state: {
          ...args.inputs,
          ...base,
        },
      };
    }

    // Default mock behaviour
    return {
      id: base.id,
      state: {
        ...args.inputs,
        ...base,
      },
    };
  },
  call: (args: pulumi.runtime.MockCallArgs) => args.inputs,
});

// Mock Pulumi Config if required by stacks
jest.spyOn(pulumi, 'Config').mockImplementation(
  () =>
  ({
    get: (key: string) => undefined,
    getBoolean: (key: string) => false,
    getNumber: (key: string) => undefined,
    require: (key: string) => undefined,
  } as any)
);

// Import AFTER mocks are in place
import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  const testEnvironmentSuffix = 'unittest';
  let stack: TapStack;

  beforeEach(() => {
    // Reset SDK mocks
    configMock.reset();
    // Default to no recorder/delivery-channel present so stack creates its own
    configMock.on(DescribeConfigurationRecordersCommand).resolves({
      ConfigurationRecorders: [],
    });
    configMock.on(DescribeDeliveryChannelsCommand).resolves({
      DeliveryChannels: [],
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Outputs and resources', () => {
    beforeAll(async () => {
      stack = new TapStack('test-stack', {
        tags: { Department: 'Compliance' },
        environmentSuffix: testEnvironmentSuffix,
      });
    });

    it('should expose expected outputs', () => {
      expect(stack.configRecorderName).toBeDefined();
      expect(stack.configBucketArn).toBeDefined();
      expect(stack.complianceTopicArn).toBeDefined();
      expect(stack.tagCheckerLambdaArn).toBeDefined();
    });

    it('configRecorderName should default to shared recorder name when none exists', done => {
      stack.configRecorderName.apply((name) => {
        expect(name).toBe('config-recorder-shared');
        done();
      });
    });

    it('configBucketArn should be a valid s3 arn', done => {
      stack.configBucketArn.apply((arn) => {
        expect(arn).toContain('arn:aws:s3:::');
        expect(arn).toContain(testEnvironmentSuffix);
        done();
      });
    });

    it('complianceTopicArn should reference sns', done => {
      stack.complianceTopicArn.apply((arn) => {
        expect(arn).toContain('arn:aws:sns:');
        expect(arn).toContain(testEnvironmentSuffix);
        done();
      });
    });

    it('tagCheckerLambdaArn should reference a lambda function', done => {
      stack.tagCheckerLambdaArn.apply((arn) => {
        expect(arn).toContain(':function:');
        expect(arn).toContain(testEnvironmentSuffix);
        done();
      });
    });
  });

  describe('When an existing config recorder/channel exists', () => {
    let existingStack: TapStack;
    beforeEach(async () => {
      // Mock existing data before constructing the stack
      configMock.on(DescribeConfigurationRecordersCommand).resolves({
        ConfigurationRecorders: [{ name: 'existing-recorder' } as any],
      });
      configMock.on(DescribeDeliveryChannelsCommand).resolves({
        DeliveryChannels: [{ name: 'existing-delivery-channel' } as any],
      });

      existingStack = new TapStack('existing-stack', {
        tags: { Department: 'Compliance' },
        environmentSuffix: 'existtest',
      });
    });

    it('should reuse existing recorder name', (done) => {
      existingStack.configRecorderName.apply((name) => {
        expect(name).toBe('existing-recorder');
        done();
      });
    });
  });

  describe('Existing recorder only / existing channel only combos', () => {
    it('should create a delivery channel when only the recorder exists', (done) => {
      // Prepare mocks: existing recorder, no delivery channel
      configMock.on(DescribeConfigurationRecordersCommand).resolves({
        ConfigurationRecorders: [{ name: 'existing-recorder-only' } as any],
      });
      configMock.on(DescribeDeliveryChannelsCommand).resolves({
        DeliveryChannels: [],
      });

      const stackRecorderOnly = new TapStack('recorder-only-stack', {
        tags: { Department: 'Compliance' },
        environmentSuffix: 'recorderonly',
      });

      // The stack should still set configRecorderName to existing recorder
      stackRecorderOnly.configRecorderName.apply((name) => {
        expect(name).toBe('existing-recorder-only');
        done();
      });
    });

    it('should reuse delivery channel when only the channel exists', (done) => {
      // existing delivery channel, no recorder
      configMock.on(DescribeConfigurationRecordersCommand).resolves({
        ConfigurationRecorders: [],
      });
      configMock.on(DescribeDeliveryChannelsCommand).resolves({
        DeliveryChannels: [{ name: 'existing-only-channel' } as any],
      });

      const stackDeliveryOnly = new TapStack('delivery-only-stack', {
        tags: { Department: 'Compliance' },
        environmentSuffix: 'deliveryonly',
      });

      // The channel is used, and a recorder should be created with shared name
      stackDeliveryOnly.configRecorderName.apply((name) => {
        expect(name).toBe('config-recorder-shared');
        done();
      });
    });
  });

  describe('When the AWS SDK fails', () => {
    let fallbackStack: TapStack;
    beforeEach(async () => {
      configMock.on(DescribeConfigurationRecordersCommand).rejects(new Error('AWS error'));
      configMock.on(DescribeDeliveryChannelsCommand).rejects(new Error('AWS error'));
      fallbackStack = new TapStack('fallback-stack', {
        tags: { Department: 'Compliance' },
        environmentSuffix: 'fallback',
      });
    });

    it('should still produce outputs when detection fails', (done) => {
      pulumi.all([fallbackStack.configRecorderName, fallbackStack.configBucketArn]).apply(([rec, arn]) => {
        expect(rec).toBeDefined();
        expect(arn).toContain('arn:aws:s3:::');
        done();
      });
    });
  });
});
