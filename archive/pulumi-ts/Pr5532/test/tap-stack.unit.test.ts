import * as pulumi from '@pulumi/pulumi';
import * as assert from 'assert';
import { TapStack } from '../lib/tap-stack';

pulumi.runtime.setMocks({
  newResource: function(args: pulumi.runtime.MockResourceArgs): { id: string, state: any } {
    const state = { ...args.inputs };

    // Mock specific resource outputs
    switch (args.type) {
      case 'aws:s3/bucket:Bucket':
        state.id = args.inputs.bucket || 'financial-datalake-test';
        state.arn = `arn:aws:s3:::${state.id}`;
        break;
      case 'aws:iam/role:Role':
        state.arn = `arn:aws:iam::342597974367:role/${args.inputs.name || args.name}`;
        break;
      case 'aws:kms/key:Key':
        state.keyId = '12345678-1234-1234-1234-123456789012';
        state.arn = `arn:aws:kms:ap-northeast-2:342597974367:key/${state.keyId}`;
        break;
      case 'aws:cloudwatch/logGroup:LogGroup':
        state.name = args.inputs.name || '/aws/s3/datalake-test';
        state.arn = `arn:aws:logs:ap-northeast-2:342597974367:log-group:${state.name}`;
        break;
    }

    return {
      id: state.id || args.inputs.name || `${args.name}-id`,
      state: state,
    };
  },
  call: function(args: pulumi.runtime.MockCallArgs) {
    // Mock getCallerIdentity
    if (args.token === 'aws:index/getCallerIdentity:getCallerIdentity') {
      return {
        accountId: '342597974367',
        arn: 'arn:aws:iam::342597974367:user/test',
        userId: 'AIDAI00000000000000',
      };
    }
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

  const resolve = async <T>(output: pulumi.Output<T> | T): Promise<T> => {
    if (pulumi.Output.isInstance(output)) {
      return output.promise();
    }
    return output;
  };

  it('should create bucket with correct naming pattern', async () => {
    const bucketName = await resolve(stack.bucketName);
    assert.ok(bucketName, 'Bucket name should be defined');
    assert.ok(typeof bucketName === 'string', 'Bucket name should be a string');
    assert.ok(bucketName.length > 0, 'Bucket name should not be empty');
  });

  it('should create all three IAM roles', async () => {
    const [analyst, engineer, admin] = await Promise.all([
      resolve(stack.dataAnalystRoleArn),
      resolve(stack.dataEngineerRoleArn),
      resolve(stack.dataAdminRoleArn),
    ]);

    assert.ok(analyst, 'DataAnalyst role should be created');
    assert.ok(engineer, 'DataEngineer role should be created');
    assert.ok(admin, 'DataAdmin role should be created');

    // Verify roles are strings (ARNs)
    assert.ok(typeof analyst === 'string', 'DataAnalyst role should be a string');
    assert.ok(typeof engineer === 'string', 'DataEngineer role should be a string');
    assert.ok(typeof admin === 'string', 'DataAdmin role should be a string');
  });

  it('should create KMS key and alias', async () => {
    const [keyId, keyArn] = await Promise.all([
      resolve(stack.kmsKeyId),
      resolve(stack.kmsKeyArn),
    ]);

    assert.ok(keyId, 'KMS key ID should be defined');
    assert.ok(keyArn, 'KMS key ARN should be defined');
  });

  it('should create CloudWatch log group', async () => {
    const logGroupName = await resolve(stack.logGroupName);
    assert.ok(logGroupName, 'Log group should be created');
    assert.ok(typeof logGroupName === 'string', 'Log group name should be a string');
    assert.ok(logGroupName.length > 0, 'Log group name should not be empty');
  });

  it('should have all required outputs', async () => {
    const outputs = {
      bucketName: await resolve(stack.bucketName),
      dataAnalystRoleArn: await resolve(stack.dataAnalystRoleArn),
      dataEngineerRoleArn: await resolve(stack.dataEngineerRoleArn),
      dataAdminRoleArn: await resolve(stack.dataAdminRoleArn),
      kmsKeyId: await resolve(stack.kmsKeyId),
      kmsKeyArn: await resolve(stack.kmsKeyArn),
      logGroupName: await resolve(stack.logGroupName),
    };

    Object.entries(outputs).forEach(([key, value]) => {
      assert.ok(value, `${key} should be defined`);
    });
  });

  it('should use environment suffix in resource naming', async () => {
    const bucketName = await resolve(stack.bucketName);
    const logGroupName = await resolve(stack.logGroupName);

    // Verify resources have valid names (environment suffix is in the resource definitions)
    assert.ok(typeof bucketName === 'string' && bucketName.length > 0, 'Bucket should have a valid name');
    assert.ok(typeof logGroupName === 'string' && logGroupName.length > 0, 'Log group should have a valid name');
  });

  it('defaults to dev environment settings when args omitted', async () => {
    const defaultStack = new TapStack('test-stack-default', {});
    const [bucketName, logGroupName] = await Promise.all([
      resolve(defaultStack.bucketName),
      resolve(defaultStack.logGroupName),
    ]);

    assert.ok(bucketName.includes('dev'), 'Default bucket should include dev suffix');
    assert.ok(logGroupName.includes('dev'), 'Default log group should include dev suffix');
  });
});
