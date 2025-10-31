import { promises as fs } from 'fs';
import path from 'path';
import { S3Client, HeadBucketCommand, GetBucketEncryptionCommand } from '@aws-sdk/client-s3';
import { CloudWatchLogsClient, DescribeLogGroupsCommand } from '@aws-sdk/client-cloudwatch-logs';
import { KMSClient, DescribeKeyCommand, GetKeyRotationStatusCommand, KeyState } from '@aws-sdk/client-kms';

type LiveOutputs = {
  bucketName: string;
  kmsKeyArn: string;
  logGroupName: string;
};

const readOutputs = async (): Promise<LiveOutputs> => {
  const candidates = [
    path.resolve(process.cwd(), 'cfn-outputs', 'flat-outputs.json'),
    path.resolve(process.cwd(), '../cfn-outputs', 'flat-outputs.json'),
    path.resolve(process.cwd(), '../../cfn-outputs', 'flat-outputs.json'),
    path.resolve(__dirname, '../cfn-outputs', 'flat-outputs.json'),
    path.resolve(__dirname, '../../cfn-outputs', 'flat-outputs.json'),
  ];

  for (const candidate of candidates) {
    try {
      const data = await fs.readFile(candidate, 'utf-8');
      const parsed = JSON.parse(data) as Partial<LiveOutputs>;
      if (parsed.bucketName && parsed.kmsKeyArn && parsed.logGroupName) {
        return parsed as LiveOutputs;
      }
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw err;
      }
    }
  }

  throw new Error('Unable to locate cfn-outputs/flat-outputs.json with required fields');
};

const deriveRegion = (outputs: LiveOutputs) => {
  const fromEnv = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION;
  if (fromEnv) {
    return fromEnv;
  }

  const arnSegments = outputs.kmsKeyArn.split(':');
  if (arnSegments.length > 3 && arnSegments[3]) {
    return arnSegments[3];
  }

  throw new Error('Unable to determine AWS region for live integration tests');
};

describe('TapStack Live AWS Verification', () => {
  let outputs: LiveOutputs;
  let region: string;
  let s3: S3Client;
  let logs: CloudWatchLogsClient;
  let kms: KMSClient;
  let skipLive = false;
  const skipMessage =
    'Skipping live verification because AWS credentials were not available or could not be resolved.';

  beforeAll(async () => {
    outputs = await readOutputs();
    region = deriveRegion(outputs);
    s3 = new S3Client({ region });
    logs = new CloudWatchLogsClient({ region });
    kms = new KMSClient({ region });

    try {
      const credentials = await kms.config.credentials();
      if (!credentials) {
        skipLive = true;
        console.warn(skipMessage);
      }
    } catch (err) {
      skipLive = true;
      console.warn(skipMessage, err);
    }
  });

  test('S3 bucket exists and enforces KMS encryption', async () => {
    if (skipLive) {
      console.warn(skipMessage);
      return;
    }

    await s3.send(new HeadBucketCommand({ Bucket: outputs.bucketName }));

    const encryption = await s3.send(
      new GetBucketEncryptionCommand({ Bucket: outputs.bucketName })
    );

    expect(encryption.ServerSideEncryptionConfiguration?.Rules).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ApplyServerSideEncryptionByDefault: expect.objectContaining({
            SSEAlgorithm: 'aws:kms',
          }),
        }),
      ])
    );
  });

  test('CloudWatch log group is present', async () => {
    if (skipLive) {
      console.warn(skipMessage);
      return;
    }

    const response = await logs.send(
      new DescribeLogGroupsCommand({ logGroupNamePrefix: outputs.logGroupName })
    );

    const found = response.logGroups?.some(
      group => group.logGroupName === outputs.logGroupName
    );

    expect(found).toBe(true);
  });

  test('KMS key remains enabled with rotation', async () => {
    if (skipLive) {
      console.warn(skipMessage);
      return;
    }

    const describeKey = await kms.send(
      new DescribeKeyCommand({ KeyId: outputs.kmsKeyArn })
    );
    expect(describeKey.KeyMetadata?.KeyState).toBe(KeyState.Enabled);
    expect(describeKey.KeyMetadata?.Enabled).toBe(true);

    const rotation = await kms.send(
      new GetKeyRotationStatusCommand({ KeyId: outputs.kmsKeyArn })
    );
    expect(rotation.KeyRotationEnabled).toBe(true);
  });
});
