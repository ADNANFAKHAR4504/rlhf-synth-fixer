import {
  IAMClient,
  ListRolePoliciesCommand,
  GetRolePolicyCommand,
} from '@aws-sdk/client-iam';
import {
  DynamoDBClient,
  DescribeTableCommand,
  DescribeContinuousBackupsCommand, // Import the new command
} from '@aws-sdk/client-dynamodb';
import {
  LambdaClient,
  GetFunctionConfigurationCommand,
} from '@aws-sdk/client-lambda';
import { SQSClient, GetQueueAttributesCommand } from '@aws-sdk/client-sqs';
import {
  SNSClient,
  ListSubscriptionsByTopicCommand,
} from '@aws-sdk/client-sns';
import * as fs from 'fs';
import * as path from 'path';

// --- Test Configuration ---
const REGION = process.env.AWS_REGION || 'us-east-1';

// --- AWS SDK Clients ---
const iamClient = new IAMClient({ region: REGION });
const dynamoDBClient = new DynamoDBClient({ region: REGION });
const lambdaClient = new LambdaClient({ region: REGION });
const sqsClient = new SQSClient({ region: REGION });
const snsClient = new SNSClient({ region: REGION });

// --- Read Deployed Stack Outputs ---
let outputs: { [key: string]: string } = {};
try {
  // Assumes a file `cfn-outputs.json` is generated after deployment.
  outputs = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../cfn-outputs.json'), 'utf8')
  );
} catch (error) {
  console.warn(
    'Could not read "cfn-outputs.json". Skipping integration tests.'
  );
}

// Conditionally run tests only if the outputs file was loaded successfully.
const testSuite = Object.keys(outputs).length > 0 ? describe : describe.skip;

testSuite('IaC Serverless Healthcare App - Integration Tests', () => {
  // Get all necessary resource identifiers from stack outputs
  const {
    PatientDataTableName,
    AnalyticsTaskQueueURL,
    AnalyticsTaskDeadLetterQueueArn,
    PatientUpdatesTopicArn,
    ProcessPatientDataRoleName,
    AnalyticsProcessingRoleName,
    SendNotificationRoleName,
    ProcessPatientDataFunctionName,
    AnalyticsProcessingFunctionName,
    SendNotificationFunctionName,
    AnalyticsTaskQueueARN,
  } = outputs;

  // Helper function to fetch and parse an IAM *inline* policy
  const getInlinePolicyDocument = async (roleName: string) => {
    const { PolicyNames } = await iamClient.send(
      new ListRolePoliciesCommand({ RoleName: roleName })
    );
    if (!PolicyNames || PolicyNames.length === 0) {
      throw new Error(`Could not find any inline policies on role ${roleName}`);
    }
    const { PolicyDocument } = await iamClient.send(
      new GetRolePolicyCommand({
        RoleName: roleName,
        PolicyName: PolicyNames[0],
      })
    );
    return JSON.parse(decodeURIComponent(PolicyDocument || '{}'));
  };

  describe('🛡️ IAM Roles & Least Privilege', () => {
    test('ProcessPatientDataRole should have correct least-privilege permissions', async () => {
      const policy = await getInlinePolicyDocument(ProcessPatientDataRoleName);
      const statements = policy.Statement;

      const ddbStatement = statements.find(
        (s: any) => s.Action === 'dynamodb:PutItem'
      );
      expect(ddbStatement.Effect).toBe('Allow');
      expect(ddbStatement.Resource).toContain(
        PatientDataTableName.split('-').slice(0, -1).join('-')
      );

      const sqsStatement = statements.find(
        (s: any) => s.Action === 'sqs:SendMessage'
      );
      expect(sqsStatement.Effect).toBe('Allow');
      expect(sqsStatement.Resource).toBe(AnalyticsTaskQueueARN);

      const logStatement = statements.find(
        (s: any) =>
          Array.isArray(s.Action) && s.Action.includes('logs:CreateLogGroup')
      );
      expect(logStatement.Effect).toBe('Allow');

      const allActions = statements.map((s: any) => s.Action).flat();
      expect(allActions.length).toBe(5);
    });

    test('AnalyticsProcessingRole should have correct least-privilege permissions', async () => {
      const policy = await getInlinePolicyDocument(AnalyticsProcessingRoleName);
      const statements = policy.Statement;
      const sqsStatement = statements.find(
        (s: any) =>
          Array.isArray(s.Action) && s.Action.includes('sqs:ReceiveMessage')
      );

      expect(sqsStatement.Effect).toBe('Allow');
      expect(sqsStatement.Action).toEqual(
        expect.arrayContaining([
          'sqs:ReceiveMessage',
          'sqs:DeleteMessage',
          'sqs:GetQueueAttributes',
        ])
      );
      expect(sqsStatement.Resource).toBe(AnalyticsTaskQueueARN);
    });

    test('SendNotificationRole should have correct least-privilege permissions', async () => {
      const policy = await getInlinePolicyDocument(SendNotificationRoleName);
      const snsStatement = policy.Statement.find(
        (s: any) => s.Action === 'sns:Publish'
      );

      expect(snsStatement.Effect).toBe('Allow');
      expect(snsStatement.Resource).toBe(PatientUpdatesTopicArn);
    });
  });

  describe('⚙️ AWS Service Configuration', () => {
    // ✅ CORRECTED TEST
    test('DynamoDB table should have PITR and SSE enabled', async () => {
      // Check SSE using DescribeTableCommand
      const { Table } = await dynamoDBClient.send(
        new DescribeTableCommand({ TableName: PatientDataTableName })
      );
      expect(Table?.SSEDescription?.Status).toBe('ENABLED');

      // Check PITR using the dedicated DescribeContinuousBackupsCommand
      const backupInfo = await dynamoDBClient.send(
        new DescribeContinuousBackupsCommand({
          TableName: PatientDataTableName,
        })
      );
      expect(
        backupInfo.ContinuousBackupsDescription?.PointInTimeRecoveryDescription
          ?.PointInTimeRecoveryStatus
      ).toBe('ENABLED');
    });

    test('SQS queue should have a DLQ configured', async () => {
      const { Attributes } = await sqsClient.send(
        new GetQueueAttributesCommand({
          QueueUrl: AnalyticsTaskQueueURL,
          AttributeNames: ['RedrivePolicy'],
        })
      );
      const redrivePolicy = JSON.parse(Attributes?.RedrivePolicy || '{}');
      expect(redrivePolicy.deadLetterTargetArn).toBe(
        AnalyticsTaskDeadLetterQueueArn
      );
      expect(redrivePolicy.maxReceiveCount).toBe(5);
    });
  });

  describe('🔄 Lambda and Trigger Configuration', () => {
    test('All Lambda functions should have the correct runtime and role', async () => {
      const functionsToTest = [
        {
          name: ProcessPatientDataFunctionName,
          role: ProcessPatientDataRoleName,
        },
        {
          name: AnalyticsProcessingFunctionName,
          role: AnalyticsProcessingRoleName,
        },
        { name: SendNotificationFunctionName, role: SendNotificationRoleName },
      ];

      for (const func of functionsToTest) {
        const response = await lambdaClient.send(
          new GetFunctionConfigurationCommand({ FunctionName: func.name })
        );
        expect(response.Runtime).toBe('nodejs20.x');
        expect(response.Role).toContain(func.role);
      }
    });

    test('SendNotificationFunction should be subscribed to the PatientUpdatesTopic', async () => {
      const { Subscriptions } = await snsClient.send(
        new ListSubscriptionsByTopicCommand({
          TopicArn: PatientUpdatesTopicArn,
        })
      );
      const lambdaSubscription = Subscriptions?.find(
        s =>
          s.Protocol === 'lambda' &&
          s.Endpoint?.includes(SendNotificationFunctionName)
      );

      expect(lambdaSubscription).toBeDefined();
      expect(lambdaSubscription?.TopicArn).toBe(PatientUpdatesTopicArn);
    });
  });
});
