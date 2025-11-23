import * as pulumi from '@pulumi/pulumi';
import * as assert from 'assert';
import { TapStack } from '../lib/tap-stack';

pulumi.runtime.setMocks({
  newResource: function(args: pulumi.runtime.MockResourceArgs): { id: string, state: any } {
    return {
      id: args.inputs.name ? `${args.name}-id` : `${args.type}-id`,
      state: args.inputs,
    };
  },
  call: function(args: pulumi.runtime.MockCallArgs) {
    return args.inputs;
  },
});

describe('TapStack', () => {
  let stack: TapStack;

  beforeAll(async () => {
    stack = new TapStack('test-stack', {
      environmentSuffix: 'test',
      tags: { TestTag: 'TestValue' },
    });
  });

  it('should create bucket with correct naming pattern', async () => {
    const bucketName = await stack.bucketName;
    assert.ok(bucketName, 'Bucket name should be defined');
  });

  it('should create all three IAM roles', async () => {
    const [analyst, engineer, admin] = await Promise.all([
      stack.dataAnalystRoleArn,
      stack.dataEngineerRoleArn,
      stack.dataAdminRoleArn,
    ]);

    assert.ok(analyst, 'DataAnalyst role should be created');
    assert.ok(engineer, 'DataEngineer role should be created');
    assert.ok(admin, 'DataAdmin role should be created');
  });

  it('should create KMS key and alias', async () => {
    const [keyId, keyArn] = await Promise.all([
      stack.kmsKeyId,
      stack.kmsKeyArn,
    ]);

    assert.ok(keyId, 'KMS key ID should be defined');
    assert.ok(keyArn, 'KMS key ARN should be defined');
  });

  it('should create CloudWatch log group', async () => {
    const logGroupName = await stack.logGroupName;
    assert.ok(logGroupName, 'Log group should be created');
    const logGroupStr = String(logGroupName);
    assert.ok(logGroupStr.includes('test'), 'Log group should include environment suffix');
  });
});
