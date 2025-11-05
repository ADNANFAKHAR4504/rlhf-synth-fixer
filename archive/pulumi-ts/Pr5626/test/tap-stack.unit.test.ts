/* eslint-disable @typescript-eslint/no-unused-vars */
import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

// Mock Pulumi runtime
pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: any;
  } {
    return {
      id: `${args.name}-id`,
      state: {
        ...args.inputs,
        arn: `arn:aws:${args.type}:us-east-1:123456789012:${args.name}`,
        name: args.name,
      },
    };
  },
  call: function (args: pulumi.runtime.MockCallArgs) {
    if (args.token === 'aws:index/getCallerIdentity:getCallerIdentity') {
      return {
        accountId: '123456789012',
        arn: 'arn:aws:iam::123456789012:user/test',
        userId: 'AIDAI1234567890',
      };
    }
    return {};
  },
});

describe('TapStack Compliance Monitoring', () => {
  let stack: TapStack;
  const testEnvironmentSuffix = 'test';
  const testComplianceEmail = 'test@example.com';

  beforeAll(() => {
    stack = new TapStack('compliance-monitoring-test', {
      environmentSuffix: testEnvironmentSuffix,
      complianceEmail: testComplianceEmail,
    });
  });

  it('creates the stack successfully', () => {
    expect(stack).toBeDefined();
  });

  it('exports config recorder name output', done => {
    stack.configRecorderName.apply(name => {
      expect(name).toContain('config-recorder');
      expect(name).toContain(testEnvironmentSuffix);
      done();
    });
  });

  it('exports compliance bucket name output', done => {
    stack.complianceBucketName.apply(name => {
      expect(name).toContain('compliance-reports');
      expect(name).toContain(testEnvironmentSuffix);
      done();
    });
  });

  it('exports SNS topic ARN output', done => {
    stack.snsTopicArn.apply(arn => {
      expect(arn).toContain('arn:aws:');
      expect(arn).toContain('compliance-alerts');
      done();
    });
  });

  it('exports dashboard name output', done => {
    stack.dashboardName.apply(name => {
      expect(name).toContain('compliance-monitoring');
      expect(name).toContain(testEnvironmentSuffix);
      done();
    });
  });

  it('includes environmentSuffix in resource naming', done => {
    stack.complianceBucketName.apply(name => {
      expect(name).toContain(testEnvironmentSuffix);
      done();
    });
  });
});
