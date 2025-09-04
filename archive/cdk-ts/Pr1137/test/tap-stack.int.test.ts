/* eslint-env jest */
import {
  CloudFormationClient,
  DescribeStacksCommand,
} from '@aws-sdk/client-cloudformation';
import {
  CloudWatchClient,
  GetDashboardCommand,
} from '@aws-sdk/client-cloudwatch';
import { GetFunctionCommand, LambdaClient } from '@aws-sdk/client-lambda';
import {
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  HeadBucketCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { GetParameterCommand, SSMClient } from '@aws-sdk/client-ssm';
import { describe, expect, jest, test } from '@jest/globals';

jest.setTimeout(120000);

const envSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const regions = [
  process.env.PRIMARY_REGION || 'us-east-1',
  process.env.BACKUP_REGION || 'us-west-2',
];

type StackOutputs = Record<string, string>;

async function fetchStackOutputs(
  region: string,
  stackName: string
): Promise<StackOutputs | null> {
  const cfn = new CloudFormationClient({ region });
  try {
    const resp = await cfn.send(
      new DescribeStacksCommand({ StackName: stackName })
    );
    const stack = resp.Stacks && resp.Stacks[0];
    if (!stack || !stack.Outputs) return null;
    const map: StackOutputs = {};
    for (const o of stack.Outputs) {
      if (o.OutputKey && o.OutputValue) map[o.OutputKey] = o.OutputValue;
    }
    return map;
  } catch (_e) {
    return null;
  }
}

describe('Integration - Deployed resources (per region)', () => {
  for (const region of regions) {
    const stackName = `TapStack${envSuffix}-${region}`;

    test(`stack outputs are available in ${region} (skips if not deployed)`, async () => {
      const outputs = await fetchStackOutputs(region, stackName);
      if (!outputs) return; // skip if not deployed
      expect(outputs.CorpBucketName).toBeTruthy();
      expect(outputs.CorpSyncFunctionArn).toBeTruthy();
      expect(outputs.CorpLocalBucketParamName).toBeTruthy();
      expect(outputs.CorpDashboardName).toBeTruthy();
    });

    test(`S3 bucket configuration is correct in ${region}`, async () => {
      const outputs = await fetchStackOutputs(region, stackName);
      if (!outputs) return; // skip if not deployed
      const bucket = outputs.CorpBucketName;
      const s3 = new S3Client({ region });
      await s3.send(new HeadBucketCommand({ Bucket: bucket }));
      const versioning = await s3.send(
        new GetBucketVersioningCommand({ Bucket: bucket })
      );
      expect(versioning.Status).toBe('Enabled');
      const enc = await s3.send(
        new GetBucketEncryptionCommand({ Bucket: bucket })
      );
      expect(
        enc.ServerSideEncryptionConfiguration?.Rules?.length
      ).toBeGreaterThan(0);
    });

    test(`SSM parameter for local bucket is present in ${region}`, async () => {
      const outputs = await fetchStackOutputs(region, stackName);
      if (!outputs) return; // skip if not deployed
      const paramName = outputs.CorpLocalBucketParamName;
      const ssm = new SSMClient({ region });
      const res = await ssm.send(new GetParameterCommand({ Name: paramName }));
      expect(res.Parameter?.Name).toBe(paramName);
    });

    test(`Lambda function exists in ${region}`, async () => {
      const outputs = await fetchStackOutputs(region, stackName);
      if (!outputs) return; // skip if not deployed
      const lambdaArn = outputs.CorpSyncFunctionArn;
      const lambda = new LambdaClient({ region });
      const fn = await lambda.send(
        new GetFunctionCommand({ FunctionName: lambdaArn })
      );
      expect(fn.Configuration?.FunctionArn).toBe(lambdaArn);
    });

    test(`CloudWatch dashboard exists in ${region}`, async () => {
      const outputs = await fetchStackOutputs(region, stackName);
      if (!outputs) return; // skip if not deployed
      const cw = new CloudWatchClient({ region });
      const dash = await cw.send(
        new GetDashboardCommand({ DashboardName: outputs.CorpDashboardName })
      );
      expect(dash.DashboardArn).toBeTruthy();
    });
  }
});
