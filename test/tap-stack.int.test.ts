import {
  APIGatewayClient,
  GetRestApiCommand,
} from '@aws-sdk/client-api-gateway';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  DescribeTableCommand,
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
} from '@aws-sdk/client-dynamodb';
import {
  GetFunctionCommand,
  InvokeCommand,
  LambdaClient,
} from '@aws-sdk/client-lambda';
import fs from 'fs';
import fetch from 'node-fetch';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

const lambda = new LambdaClient({});
const dynamodb = new DynamoDBClient({});
const cloudwatch = new CloudWatchClient({});
const apigateway = new APIGatewayClient({});
const logs = new CloudWatchLogsClient({});

describe('TapStack Serverless Stack Integration Tests', () => {
  test('Lambda function is deployed and invokable directly', async () => {
    const lambdaArn = outputs.LambdaArn;
    expect(lambdaArn).toBeDefined();

    const getFn = await lambda.send(
      new GetFunctionCommand({ FunctionName: lambdaArn })
    );
    expect(getFn.Configuration?.FunctionName).toBeDefined();

    const result = await lambda.send(
      new InvokeCommand({
        FunctionName: lambdaArn,
        Payload: Buffer.from(JSON.stringify({ test: true })),
        InvocationType: 'RequestResponse',
      })
    );
    expect(result.StatusCode).toBe(200);
    if (result.Payload) {
      const payload = JSON.parse(Buffer.from(result.Payload).toString());
      expect(payload.statusCode).toBe(200);
      expect(payload.body).toBe(JSON.stringify('Hello from Lambda!'));
    }
  });

  test('DynamoDB table exists and is usable', async () => {
    const tableName = outputs.DynamoDBTable;
    expect(tableName).toBeDefined();

    const { Table } = await dynamodb.send(
      new DescribeTableCommand({ TableName: tableName })
    );
    expect(Table?.TableStatus).toBe('ACTIVE');

    // Put and Get an item
    const testId = { S: 'integration-test-id' };
    await dynamodb.send(
      new PutItemCommand({
        TableName: tableName,
        Item: { id: testId },
      })
    );
    const { Item } = await dynamodb.send(
      new GetItemCommand({
        TableName: tableName,
        Key: { id: testId },
      })
    );
    expect(Item).toBeDefined();
    expect(Item!.id.S).toBe('integration-test-id');
  });

  test('CloudWatch Log Group exists', async () => {
    const logGroupName = outputs.LogGroupName;
    expect(logGroupName).toBeDefined();
    const { logGroups } = await logs.send(
      new DescribeLogGroupsCommand({ logGroupNamePrefix: logGroupName })
    );
    const found = logGroups?.some(lg => lg.logGroupName === logGroupName);
    expect(found).toBe(true);
  });

  test('CloudWatch Alarm exists', async () => {
    const alarmName = outputs.AlarmName;
    expect(alarmName).toBeDefined();
    const { MetricAlarms } = await cloudwatch.send(
      new DescribeAlarmsCommand({ AlarmNames: [alarmName] })
    );
    expect(MetricAlarms?.length).toBe(1);
    expect(MetricAlarms?.[0].AlarmName).toBe(alarmName);
  });

  test('All outputs are defined and non-empty', () => {
    Object.entries(outputs).forEach(([key, val]: [string, any]) => {
      expect(val).toBeDefined();
      if (typeof val === 'string') expect(val.length).toBeGreaterThan(0);
    });
  });

  // --- Negative/Edge Case Test Examples ---
  test('Should not output deprecated or forbidden outputs', () => {
    expect(outputs.CustomDomain).toBeUndefined();
    expect(outputs.ArtifactsBucketName).toBeUndefined();
    expect(outputs.AlarmArn).toBeUndefined();
  });
});
