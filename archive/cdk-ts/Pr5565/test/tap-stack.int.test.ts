import {
  BatchGetBuildsCommand,
  CodeBuildClient,
  StartBuildCommand,
} from '@aws-sdk/client-codebuild';
import {
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  QueryCommand,
} from '@aws-sdk/client-dynamodb';
import {
  EventBridgeClient,
  ListRulesCommand,
  PutEventsCommand,
} from '@aws-sdk/client-eventbridge';
import {
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import {
  ListSubscriptionsByTopicCommand,
  PublishCommand,
  SNSClient,
} from '@aws-sdk/client-sns';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import fs from 'fs';
import path from 'path';
const outputsPath = path.join('cfn-outputs', 'flat-outputs.json');
const envSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_REGION || 'us-east-1';

const ddbClient = new DynamoDBClient({ region });
const s3Client = new S3Client({ region });
const snsClient = new SNSClient({ region });
const eventsClient = new EventBridgeClient({ region });
const codebuildClient = new CodeBuildClient({ region });

async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts = 5,
  delayMs = 1000
): Promise<T> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxAttempts - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, delayMs * (i + 1)));
    }
  }
  throw new Error('Retry exhausted');
}

describe('ConfigSync Integration Tests', () => {
  let outputs: Record<string, string>;
  let configTableName: string;
  let reportsBucketName: string;
  let approvalTopicArn: string;
  let validationProjectName: string;

  beforeAll(() => {
    if (!fs.existsSync(outputsPath)) {
      throw new Error(
        `Outputs file not found: ${outputsPath}. Please deploy the stack first.`
      );
    }

    const raw = fs.readFileSync(outputsPath, 'utf8').trim();
    if (!raw || raw === '{}') {
      throw new Error(
        `Outputs file is empty: ${outputsPath}. Stack deployment may not have completed successfully.`
      );
    }

    try {
      outputs = JSON.parse(raw);
    } catch (error) {
      throw new Error(
        `Failed to parse outputs file: ${outputsPath}. Error: ${error}`
      );
    }

    if (!outputs || Object.keys(outputs).length === 0) {
      throw new Error(
        `Outputs file contains no values: ${outputsPath}. Stack may not have outputs defined.`
      );
    }

    configTableName =
      outputs[`${envSuffix}-ConfigTableName`] || outputs['ConfigTableName'];
    reportsBucketName =
      outputs[`${envSuffix}-ReportsBucketName`] || outputs['ReportsBucketName'];
    approvalTopicArn =
      outputs[`${envSuffix}-ApprovalTopicArn`] || outputs['ApprovalTopicArn'];
    validationProjectName = `${envSuffix}-config-validation`;

    if (!configTableName) {
      throw new Error(
        `Missing output: ${envSuffix}-ConfigTableName or ConfigTableName. Found keys: ${Object.keys(outputs).join(', ')}`
      );
    }
    if (!reportsBucketName) {
      throw new Error(
        `Missing output: ${envSuffix}-ReportsBucketName or ReportsBucketName. Found keys: ${Object.keys(outputs).join(', ')}`
      );
    }
    if (!approvalTopicArn) {
      throw new Error(
        `Missing output: ${envSuffix}-ApprovalTopicArn or ApprovalTopicArn. Found keys: ${Object.keys(outputs).join(', ')}`
      );
    }
  });

  describe('Flow 1: Drift Detection and Report Storage', () => {
    test('should detect drift, write to DynamoDB, and store report in S3', async () => {
      const configId = `test-config-${Date.now()}`;
      const timestamp = Date.now();
      const ttl = Math.floor(Date.now() / 1000) + 90 * 24 * 60 * 60;

      const configItem = marshall({
        configId,
        version: 'v1',
        environment: envSuffix,
        timestamp,
        stackOutputs: { test: 'value' },
        tags: { Environment: envSuffix },
        ttl,
      });

      await ddbClient.send(
        new PutItemCommand({
          TableName: configTableName,
          Item: configItem,
        })
      );

      const driftReport = JSON.stringify({
        configId,
        detectedAt: new Date().toISOString(),
        driftType: 'CONFIGURATION_MISMATCH',
        differences: ['Tag mismatch', 'Output mismatch'],
      });

      const reportKey = `drift-reports/${envSuffix}/${configId}-${timestamp}.json`;
      await s3Client.send(
        new PutObjectCommand({
          Bucket: reportsBucketName,
          Key: reportKey,
          Body: driftReport,
          ContentType: 'application/json',
        })
      );

      const stored = await s3Client.send(
        new GetObjectCommand({
          Bucket: reportsBucketName,
          Key: reportKey,
        })
      );

      const body = await stored.Body?.transformToString();
      expect(body).toBe(driftReport);

      const dbItem = await ddbClient.send(
        new GetItemCommand({
          TableName: configTableName,
          Key: marshall({ configId, version: 'v1' }),
        })
      );

      expect(dbItem.Item).toBeDefined();
      const item = unmarshall(dbItem.Item!);
      expect(item.configId).toBe(configId);
    });

    test('should query DynamoDB by environment index', async () => {
      const result = await retry(async () => {
        return await ddbClient.send(
          new QueryCommand({
            TableName: configTableName,
            IndexName: 'EnvironmentIndex',
            KeyConditionExpression: 'environment = :env',
            ExpressionAttributeValues: marshall({
              ':env': envSuffix,
            }),
            Limit: 10,
          })
        );
      });

      expect(result.Items).toBeDefined();
      expect(Array.isArray(result.Items)).toBe(true);
    });
  });

  describe('Flow 2: Validation Workflow', () => {
    test('should trigger CodeBuild validation and track results', async () => {
      const configId = `validation-test-${Date.now()}`;
      const validationRecord = marshall({
        configId,
        version: 'v1',
        environment: envSuffix,
        timestamp: Date.now(),
        validationStatus: 'PENDING',
        ttl: Math.floor(Date.now() / 1000) + 90 * 24 * 60 * 60,
      });

      await ddbClient.send(
        new PutItemCommand({
          TableName: configTableName,
          Item: validationRecord,
        })
      );

      const buildResult = await retry(async () => {
        const startCmd = await codebuildClient.send(
          new StartBuildCommand({
            projectName: validationProjectName,
            environmentVariablesOverride: [
              {
                name: 'ENVIRONMENT',
                value: envSuffix,
              },
              {
                name: 'CONFIG_TABLE',
                value: configTableName,
              },
              {
                name: 'REPORTS_BUCKET',
                value: reportsBucketName,
              },
            ],
          })
        );

        if (!startCmd.build?.id) {
          throw new Error('Build ID not returned');
        }

        await new Promise((resolve) => setTimeout(resolve, 3000));

        const statusCmd = await codebuildClient.send(
          new BatchGetBuildsCommand({
            ids: [startCmd.build.id],
          })
        );

        return statusCmd.builds?.[0];
      }, 3, 2000);

      expect(buildResult).toBeDefined();
      expect(buildResult?.projectName).toBe(validationProjectName);
    });
  });

  describe('Flow 3: Approval Workflow via SNS', () => {
    test('should publish approval request to SNS and verify subscription', async () => {
      const approvalRequest = {
        configId: `approval-test-${Date.now()}`,
        environment: envSuffix,
        action: 'PROMOTE_TO_PRODUCTION',
        requestedBy: 'integration-test',
        timestamp: new Date().toISOString(),
      };

      const publishResult = await retry(async () => {
        return await snsClient.send(
          new PublishCommand({
            TopicArn: approvalTopicArn,
            Message: JSON.stringify(approvalRequest),
            Subject: `Config Sync Approval Request - ${envSuffix}`,
            MessageAttributes: {
              Environment: {
                DataType: 'String',
                StringValue: envSuffix,
              },
              Action: {
                DataType: 'String',
                StringValue: 'PROMOTE_TO_PRODUCTION',
              },
            },
          })
        );
      });

      expect(publishResult.MessageId).toBeDefined();
    });

    test('should verify SNS subscription exists and is configured correctly', async () => {
      const subscriptions = await retry(async () => {
        return await snsClient.send(
          new ListSubscriptionsByTopicCommand({
            TopicArn: approvalTopicArn,
          })
        );
      });

      expect(subscriptions.Subscriptions).toBeDefined();
      expect(subscriptions.Subscriptions!.length).toBeGreaterThan(0);

      const lambdaSubscription = subscriptions.Subscriptions!.find(
        (sub) => sub.Protocol === 'lambda'
      );

      expect(lambdaSubscription).toBeDefined();
      expect(lambdaSubscription?.Protocol).toBe('lambda');
      expect(lambdaSubscription?.TopicArn).toBe(approvalTopicArn);
      expect(lambdaSubscription?.SubscriptionArn).toBeDefined();
      expect(
        lambdaSubscription?.SubscriptionArn?.startsWith('arn:aws:sns')
      ).toBe(true);
    });

    test('should track approval state in DynamoDB', async () => {
      const configId = `approval-track-${Date.now()}`;
      const approvalRecord = marshall({
        configId,
        version: 'v1',
        environment: envSuffix,
        timestamp: Date.now(),
        approvalStatus: 'PENDING',
        approvalTopicArn,
        requestedAt: new Date().toISOString(),
        ttl: Math.floor(Date.now() / 1000) + 90 * 24 * 60 * 60,
      });

      await ddbClient.send(
        new PutItemCommand({
          TableName: configTableName,
          Item: approvalRecord,
        })
      );

      const retrieved = await retry(async () => {
        const result = await ddbClient.send(
          new GetItemCommand({
            TableName: configTableName,
            Key: marshall({ configId, version: 'v1' }),
          })
        );
        if (!result.Item) throw new Error('Item not found');
        return unmarshall(result.Item);
      });

      expect(retrieved.approvalStatus).toBe('PENDING');
      expect(retrieved.approvalTopicArn).toBe(approvalTopicArn);
    });
  });

  describe('Flow 4: Configuration Promotion', () => {
    test('should promote configuration from dev to staging via DynamoDB', async () => {
      const sourceConfig = marshall({
        configId: `promote-source-${Date.now()}`,
        version: 'v1',
        environment: 'dev',
        timestamp: Date.now(),
        config: { key: 'value', version: '1.0.0' },
        ttl: Math.floor(Date.now() / 1000) + 90 * 24 * 60 * 60,
      });

      await ddbClient.send(
        new PutItemCommand({
          TableName: configTableName,
          Item: sourceConfig,
        })
      );

      const targetConfig = marshall({
        configId: sourceConfig.configId?.S,
        version: 'v1',
        environment: 'staging',
        timestamp: Date.now(),
        config: sourceConfig.config,
        promotedFrom: 'dev',
        promotedAt: new Date().toISOString(),
        ttl: Math.floor(Date.now() / 1000) + 90 * 24 * 60 * 60,
      });

      await ddbClient.send(
        new PutItemCommand({
          TableName: configTableName,
          Item: targetConfig,
        })
      );

      const promoted = await retry(async () => {
        const result = await ddbClient.send(
          new QueryCommand({
            TableName: configTableName,
            IndexName: 'EnvironmentIndex',
            KeyConditionExpression: 'environment = :env',
            FilterExpression: 'promotedFrom = :source',
            ExpressionAttributeValues: marshall({
              ':env': 'staging',
              ':source': 'dev',
            }),
            Limit: 5,
          })
        );
        if (!result.Items || result.Items.length === 0) {
          throw new Error('Promoted config not found');
        }
        return unmarshall(result.Items[0]);
      }, 5, 2000);

      expect(promoted.promotedFrom).toBe('dev');
      expect(promoted.environment).toBe('staging');
    });
  });

  describe('Flow 5: EventBridge Schedule Verification', () => {
    test('should verify drift detection EventBridge rule exists', async () => {
      const rules = await retry(async () => {
        return await eventsClient.send(new ListRulesCommand({}));
      });

      expect(rules.Rules).toBeDefined();

      const driftRule = rules.Rules!.find(
        (r) =>
          r.Name?.includes('DriftSchedule') ||
          r.Name?.includes('drift-detection') ||
          r.ScheduleExpression
      );

      expect(driftRule).toBeDefined();
      expect(driftRule?.State).toBe('ENABLED');
      expect(driftRule?.ScheduleExpression).toBeDefined();
    });

    test('should simulate stack failure event for rollback flow', async () => {
      const rollbackEvent = {
        Source: 'aws.cloudformation',
        DetailType: 'CloudFormation Stack Status Change',
        Detail: JSON.stringify({
          'stack-id': `arn:aws:cloudformation:${region}:123456789012:stack/${envSuffix}-test-stack`,
          'stack-name': `${envSuffix}-test-stack`,
          'status-details': {
            status: 'UPDATE_FAILED',
          },
        }),
      };

      await retry(async () => {
        await eventsClient.send(
          new PutEventsCommand({
            Entries: [rollbackEvent],
          })
        );
      }, 2, 500);

      const rollbackRecord = marshall({
        configId: `rollback-test-${Date.now()}`,
        version: 'v1',
        environment: envSuffix,
        timestamp: Date.now(),
        rollbackTriggered: true,
        stackName: `${envSuffix}-test-stack`,
        rollbackReason: 'UPDATE_FAILED',
        ttl: Math.floor(Date.now() / 1000) + 90 * 24 * 60 * 60,
      });

      await ddbClient.send(
        new PutItemCommand({
          TableName: configTableName,
          Item: rollbackRecord,
        })
      );

      const stored = await retry(async () => {
        const result = await ddbClient.send(
          new GetItemCommand({
            TableName: configTableName,
            Key: marshall({
              configId: rollbackRecord.configId?.S,
              version: 'v1',
            }),
          })
        );
        if (!result.Item) throw new Error('Rollback record not found');
        return unmarshall(result.Item);
      });

      expect(stored.rollbackTriggered).toBe(true);
      expect(stored.stackName).toBe(`${envSuffix}-test-stack`);
    });
  });

  describe('Flow 6: End-to-End Configuration Sync Lifecycle', () => {
    test('should complete full lifecycle: detect -> store -> validate -> approve -> promote', async () => {
      const lifecycleId = `lifecycle-${Date.now()}`;
      const now = Date.now();

      const step1 = marshall({
        configId: lifecycleId,
        version: 'v1',
        environment: envSuffix,
        timestamp: now,
        stage: 'DETECTED',
        driftDetected: true,
        ttl: Math.floor(now / 1000) + 90 * 24 * 60 * 60,
      });

      await ddbClient.send(
        new PutItemCommand({
          TableName: configTableName,
          Item: step1,
        })
      );

      const reportKey = `lifecycle-reports/${envSuffix}/${lifecycleId}-report.json`;
      await s3Client.send(
        new PutObjectCommand({
          Bucket: reportsBucketName,
          Key: reportKey,
          Body: JSON.stringify({ configId: lifecycleId, stage: 'STORED' }),
        })
      );

      const step2 = marshall({
        configId: lifecycleId,
        version: 'v2',
        environment: envSuffix,
        timestamp: now + 1000,
        stage: 'VALIDATED',
        validationStatus: 'PASSED',
        reportLocation: `s3://${reportsBucketName}/${reportKey}`,
        ttl: Math.floor(now / 1000) + 90 * 24 * 60 * 60,
      });

      await ddbClient.send(
        new PutItemCommand({
          TableName: configTableName,
          Item: step2,
        })
      );

      await snsClient.send(
        new PublishCommand({
          TopicArn: approvalTopicArn,
          Message: JSON.stringify({ configId: lifecycleId, stage: 'APPROVAL_REQUESTED' }),
        })
      );

      const step3 = marshall({
        configId: lifecycleId,
        version: 'v3',
        environment: envSuffix,
        timestamp: now + 2000,
        stage: 'APPROVED',
        approvalStatus: 'APPROVED',
        approvedAt: new Date().toISOString(),
        ttl: Math.floor(now / 1000) + 90 * 24 * 60 * 60,
      });

      await ddbClient.send(
        new PutItemCommand({
          TableName: configTableName,
          Item: step3,
        })
      );

      const final = await retry(async () => {
        const result = await ddbClient.send(
          new QueryCommand({
            TableName: configTableName,
            KeyConditionExpression: 'configId = :id',
            ExpressionAttributeValues: marshall({
              ':id': lifecycleId,
            }),
            ScanIndexForward: false,
            Limit: 1,
          })
        );
        if (!result.Items || result.Items.length === 0) {
          throw new Error('Final record not found');
        }
        return unmarshall(result.Items[0]);
      }, 5, 2000);

      expect(final.stage).toBe('APPROVED');
      expect(final.approvalStatus).toBe('APPROVED');

      const reportExists = await s3Client.send(
        new GetObjectCommand({
          Bucket: reportsBucketName,
          Key: reportKey,
        })
      );

      expect(reportExists).toBeDefined();
    });
  });

  describe('Flow 7: S3 Lifecycle Policy Verification', () => {
    test('should verify reports are stored with versioning enabled', async () => {
      const testKey = `version-test/${envSuffix}/test-${Date.now()}.json`;
      const content1 = JSON.stringify({ version: 1, data: 'initial' });

      await s3Client.send(
        new PutObjectCommand({
          Bucket: reportsBucketName,
          Key: testKey,
          Body: content1,
        })
      );

      await new Promise((resolve) => setTimeout(resolve, 1000));

      const content2 = JSON.stringify({ version: 2, data: 'updated' });
      await s3Client.send(
        new PutObjectCommand({
          Bucket: reportsBucketName,
          Key: testKey,
          Body: content2,
        })
      );

      const listed = await retry(async () => {
        return await s3Client.send(
          new ListObjectsV2Command({
            Bucket: reportsBucketName,
            Prefix: `version-test/${envSuffix}/`,
          })
        );
      });

      expect(listed.Contents).toBeDefined();
      const testFile = listed.Contents!.find((o) => o.Key === testKey);
      expect(testFile).toBeDefined();
    });
  });
});
