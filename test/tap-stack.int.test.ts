// Configuration - These are coming from cfn-outputs after cdk deploy
import {
  CloudFormationClient,
  DescribeStacksCommand,
} from '@aws-sdk/client-cloudformation';
import { DescribeDBInstancesCommand, RDSClient } from '@aws-sdk/client-rds';
import { HeadBucketCommand, S3Client } from '@aws-sdk/client-s3';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const stackName = `TapStack${environmentSuffix}`;
const region = process.env.AWS_REGION || 'us-east-1';

describe('TapStack Integration Tests', () => {
  let stackOutputs: Record<string, any> = {};

  beforeAll(async () => {
    const cf = new CloudFormationClient({ region });
    const stacks = await cf.send(
      new DescribeStacksCommand({ StackName: stackName })
    );
    const stack =
      stacks.Stacks && stacks.Stacks.length > 0 ? stacks.Stacks[0] : undefined;
    expect(stack).toBeDefined();
    if (stack && stack.Outputs) {
      for (const output of stack.Outputs) {
        stackOutputs[output.OutputKey!] = output.OutputValue;
      }
    }
  });

  test('all expected outputs should exist and be non-empty', () => {
    const expectedOutputs = [
      'StackName',
      'EnvironmentSuffix',
      'VPCID',
      'PublicSubnet1ID',
      'PublicSubnet2ID',
      'PrivateSubnet1ID',
      'PrivateSubnet2ID',
      'LoadBalancerDNS',
      'AppDataBucketName',
      'DatabaseEndpoint',
      'KMSKeyARN',
    ];
    for (const key of expectedOutputs) {
      expect(stackOutputs[key]).toBeDefined();
      expect(stackOutputs[key]).not.toEqual('');
    }
  });

  test('AppDataBucket exists in AWS', async () => {
    const s3 = new S3Client({ region });
    const bucketName = stackOutputs.AppDataBucketName;
    expect(bucketName).toBeDefined();
    await expect(
      s3.send(new HeadBucketCommand({ Bucket: bucketName }))
    ).resolves.toBeDefined();
  });

  test('RDS Database exists in AWS', async () => {
    const rds = new RDSClient({ region });
    const endpoint = stackOutputs.DatabaseEndpoint;
    expect(endpoint).toBeDefined();
    const dbs = await rds.send(new DescribeDBInstancesCommand({}));
    const found = dbs.DBInstances?.some(
      db => db.Endpoint?.Address === endpoint
    );
    expect(found).toBe(true);
  });
});
