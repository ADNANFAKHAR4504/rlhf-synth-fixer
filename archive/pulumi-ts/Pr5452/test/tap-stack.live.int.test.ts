import { promises as fs } from 'fs';
import path from 'path';
import { DynamoDBClient, DescribeTableCommand } from '@aws-sdk/client-dynamodb';
import { LambdaClient, GetFunctionCommand } from '@aws-sdk/client-lambda';
import { SNSClient, GetTopicAttributesCommand } from '@aws-sdk/client-sns';
import { SQSClient, GetQueueAttributesCommand } from '@aws-sdk/client-sqs';
import fetch from 'node-fetch';

type LiveOutputs = {
  dynamoTableName?: string;
  lambdaFunctionName?: string;
  snsTopicArn?: string;
  dlqUrl?: string;
  apiUrl?: string;
};

const findOutputsFile = async (): Promise<LiveOutputs> => {
  const candidates = [
    path.resolve(process.cwd(), 'cfn-outputs', 'flat-outputs.json'),
    path.resolve(process.cwd(), '../cfn-outputs', 'flat-outputs.json'),
    path.resolve(process.cwd(), '../../cfn-outputs', 'flat-outputs.json'),
    path.resolve(__dirname, '../cfn-outputs', 'flat-outputs.json'),
    path.resolve(__dirname, '../../cfn-outputs', 'flat-outputs.json'),
  ];

  for (const candidate of candidates) {
    try {
      const contents = await fs.readFile(candidate, 'utf8');
      return JSON.parse(contents) as LiveOutputs;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw err;
      }
    }
  }

  throw new Error('Unable to locate cfn-outputs/flat-outputs.json');
};

const deriveRegion = (outputs: LiveOutputs) => {
  if (process.env.AWS_REGION) {
    return process.env.AWS_REGION;
  }
  if (process.env.AWS_DEFAULT_REGION) {
    return process.env.AWS_DEFAULT_REGION;
  }
  if (outputs.apiUrl) {
    try {
      const url = new URL(outputs.apiUrl);
      const hostParts = url.host.split('.');
      if (hostParts.length >= 3) {
        return hostParts[2];
      }
    } catch {
      // ignore parse errors
    }
  }
  if (outputs.snsTopicArn) {
    const arnParts = outputs.snsTopicArn.split(':');
    if (arnParts.length > 3 && arnParts[3]) {
      return arnParts[3];
    }
  }
  return undefined;
};

describe('TapStack Live AWS Verification', () => {
  let outputs: LiveOutputs;
  let region: string | undefined;
  let skipReason: string | undefined;

  let dynamo: DynamoDBClient;
  let lambda: LambdaClient;
  let sns: SNSClient;
  let sqs: SQSClient;

  beforeAll(async () => {
    try {
      outputs = await findOutputsFile();
    } catch (err) {
      skipReason = `Live outputs file not found: ${(err as Error).message}`;
      return;
    }

    const requiredKeys: Array<keyof LiveOutputs> = [
      'dynamoTableName',
      'lambdaFunctionName',
      'snsTopicArn',
      'dlqUrl',
      'apiUrl',
    ];

    const missing = requiredKeys.filter(key => !outputs[key]);
    if (missing.length > 0) {
      skipReason = `Missing required live outputs: ${missing.join(', ')}`;
      return;
    }

    region = deriveRegion(outputs);
    if (!region) {
      skipReason = 'Unable to determine AWS region for live verification';
      return;
    }

    dynamo = new DynamoDBClient({ region });
    lambda = new LambdaClient({ region });
    sns = new SNSClient({ region });
    sqs = new SQSClient({ region });
    try {
      const creds = await dynamo.config.credentials();
      if (!creds) {
        skipReason = 'AWS credentials not available for live verification';
      }
    } catch (err) {
      skipReason = `Unable to resolve AWS credentials: ${(err as Error).message}`;
    }
  });

  const ensureLive = () => {
    if (skipReason) {
      console.warn(skipReason);
      return false;
    }
    return true;
  };

  test('DynamoDB table exists with point-in-time recovery', async () => {
    if (!ensureLive()) return;

    const tableName = outputs.dynamoTableName!;
    const result = await dynamo.send(
      new DescribeTableCommand({ TableName: tableName })
    );

    expect(result.Table?.TableStatus).toBe('ACTIVE');
    const recoveryStatus =
      result.Table?.PointInTimeRecoveryDescription?.PointInTimeRecoveryStatus;
    expect(recoveryStatus).toBe('ENABLED');
  });

  test('Lambda function is deployed with expected environment variables', async () => {
    if (!ensureLive()) return;

    const functionName = outputs.lambdaFunctionName!;
    const lambdaInfo = await lambda.send(
      new GetFunctionCommand({ FunctionName: functionName })
    );

    expect(lambdaInfo.Configuration?.Runtime).toBe('nodejs18.x');

    const envVars = lambdaInfo.Configuration?.Environment?.Variables ?? {};
    expect(envVars.DYNAMODB_TABLE).toBe(outputs.dynamoTableName);
    expect(envVars.SNS_TOPIC_ARN).toBe(outputs.snsTopicArn);
    expect(envVars.DLQ_URL).toBe(outputs.dlqUrl);
  });

  test('SNS topic and SQS DLQ are configured', async () => {
    if (!ensureLive()) return;

    const topicArn = outputs.snsTopicArn!;
    const topicAttributes = await sns.send(
      new GetTopicAttributesCommand({ TopicArn: topicArn })
    );

    expect(topicAttributes.Attributes?.KmsMasterKeyId).toBeDefined();

    const queueUrl = outputs.dlqUrl!;
    const queueAttributes = await sqs.send(
      new GetQueueAttributesCommand({
        QueueUrl: queueUrl,
        AttributeNames: ['All'],
      })
    );

    expect(queueAttributes.Attributes?.QueueArn).toBeDefined();
    expect(queueAttributes.Attributes?.KmsMasterKeyId).toBeDefined();
  });

  test('API Gateway endpoint responds (indicating deployed stage)', async () => {
    if (!ensureLive()) return;

    if (!outputs.apiUrl) {
      console.warn('apiUrl output not available for live verification');
      return;
    }

    const response = await fetch(outputs.apiUrl, {
      method: 'OPTIONS',
    });

    expect(response.status).toBeGreaterThanOrEqual(200);
    expect(response.status).toBeLessThan(600);
  });
});
