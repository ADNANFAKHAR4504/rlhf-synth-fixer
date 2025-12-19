import {
  CloudFormationClient,
  DescribeStacksCommand,
  ListStacksCommand,
  ListStackResourcesCommand,
  StackStatus,
} from '@aws-sdk/client-cloudformation';
import {
  DynamoDBClient,
  DescribeTableCommand,
  ListTablesCommand,
  DescribeContinuousBackupsCommand,
  DescribeTimeToLiveCommand,
} from '@aws-sdk/client-dynamodb';
import {
  LambdaClient,
  GetFunctionCommand,
  ListFunctionsCommand,
} from '@aws-sdk/client-lambda';
import {
  APIGatewayClient,
  GetRestApiCommand,
  GetApiKeysCommand,
} from '@aws-sdk/client-api-gateway';
import {
  SNSClient,
  GetTopicAttributesCommand,
  ListTopicsCommand,
} from '@aws-sdk/client-sns';
import {
  KMSClient,
  DescribeKeyCommand,
  ListKeysCommand,
} from '@aws-sdk/client-kms';
import {
  IAMClient,
  GetRoleCommand,
  ListRolesCommand,
} from '@aws-sdk/client-iam';
import {
  EventBridgeClient,
  DescribeRuleCommand,
  ListRulesCommand,
} from '@aws-sdk/client-eventbridge';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';

describe('TapStack CloudFormation Integration Tests', () => {
  const region = process.env.AWS_REGION || 'us-east-1';
  let cfnClient: CloudFormationClient;
  let dynamoClient: DynamoDBClient;
  let lambdaClient: LambdaClient;
  let apiGatewayClient: APIGatewayClient;
  let snsClient: SNSClient;
  let kmsClient: KMSClient;
  let iamClient: IAMClient;
  let eventBridgeClient: EventBridgeClient;
  let cloudWatchClient: CloudWatchClient;

  let stackName: string;
  let stackOutputs: Record<string, string> = {};
  let discoveredResources: {
    dynamoDBTables: string[];
    lambdaFunctions: string[];
    apiGatewayApis: string[];
    snsTopics: string[];
    kmsKeys: string[];
    iamRoles: string[];
    eventBridgeRules: string[];
    cloudWatchAlarms: string[];
  } = {
    dynamoDBTables: [],
    lambdaFunctions: [],
    apiGatewayApis: [],
    snsTopics: [],
    kmsKeys: [],
    iamRoles: [],
    eventBridgeRules: [],
    cloudWatchAlarms: [],
  };

  beforeAll(async () => {
    // Initialize AWS clients
    cfnClient = new CloudFormationClient({ region });
    dynamoClient = new DynamoDBClient({ region });
    lambdaClient = new LambdaClient({ region });
    apiGatewayClient = new APIGatewayClient({ region });
    snsClient = new SNSClient({ region });
    kmsClient = new KMSClient({ region });
    iamClient = new IAMClient({ region });
    eventBridgeClient = new EventBridgeClient({ region });
    cloudWatchClient = new CloudWatchClient({ region });

    // Dynamically discover stack name
    console.log(`🔍 Discovering TapStack in region: ${region}`);
    
    try {
      // First, try environment variable
      if (process.env.STACK_NAME) {
        const testStackName = process.env.STACK_NAME;
        const describeResponse = await cfnClient.send(
          new DescribeStacksCommand({ StackName: testStackName })
        );
        if (describeResponse.Stacks && describeResponse.Stacks.length > 0) {
          const status = describeResponse.Stacks[0].StackStatus;
          if (status === 'CREATE_COMPLETE' || status === 'UPDATE_COMPLETE') {
            stackName = testStackName;
            console.log(`✅ Using stack from STACK_NAME: ${stackName}`);
          }
        }
      }

      // If not found, try ENVIRONMENT_SUFFIX
      if (!stackName && process.env.ENVIRONMENT_SUFFIX) {
        const testStackName = `TapStack${process.env.ENVIRONMENT_SUFFIX}`;
        try {
          const describeResponse = await cfnClient.send(
            new DescribeStacksCommand({ StackName: testStackName })
          );
          if (describeResponse.Stacks && describeResponse.Stacks.length > 0) {
            const status = describeResponse.Stacks[0].StackStatus;
            if (status === 'CREATE_COMPLETE' || status === 'UPDATE_COMPLETE') {
              stackName = testStackName;
              console.log(`✅ Using stack from ENVIRONMENT_SUFFIX: ${stackName}`);
            }
          }
        } catch (error) {
          // Stack not found, continue to discovery
        }
      }

      // Fallback: List all stacks and find TapStack*
      if (!stackName) {
        const listResponse = await cfnClient.send(
          new ListStacksCommand({
            StackStatusFilter: [
              'CREATE_COMPLETE',
              'UPDATE_COMPLETE',
              'UPDATE_ROLLBACK_COMPLETE',
            ] as StackStatus[],
          })
        );

        const tapStacks =
          listResponse.StackSummaries?.filter(
            (stack) =>
              stack.StackName?.startsWith('TapStack') &&
              stack.StackStatus !== 'DELETE_COMPLETE'
          ) || [];

        if (tapStacks.length === 0) {
          throw new Error(
            'No TapStack found. Please deploy the stack first.'
          );
        }

        // Sort by creation time (most recent first)
        const sortedStacks = tapStacks.sort((a, b) => {
          const aTime = a.CreationTime?.getTime() || 0;
          const bTime = b.CreationTime?.getTime() || 0;
          return bTime - aTime;
        });

        stackName = sortedStacks[0].StackName!;
        console.log(`✅ Discovered stack: ${stackName}`);
      }

      // Get stack details and outputs
      const describeResponse = await cfnClient.send(
        new DescribeStacksCommand({ StackName: stackName })
      );

      if (!describeResponse.Stacks || describeResponse.Stacks.length === 0) {
        throw new Error(`Stack ${stackName} not found`);
      }

      const stack = describeResponse.Stacks[0];
      if (
        stack.StackStatus !== 'CREATE_COMPLETE' &&
        stack.StackStatus !== 'UPDATE_COMPLETE'
      ) {
        throw new Error(
          `Stack ${stackName} is not in a valid state. Status: ${stack.StackStatus}`
        );
      }

      // Extract outputs
      if (stack.Outputs) {
        for (const output of stack.Outputs) {
          if (output.OutputKey && output.OutputValue) {
            stackOutputs[output.OutputKey] = output.OutputValue;
          }
        }
      }
      console.log(`📊 Stack outputs: ${Object.keys(stackOutputs).join(', ')}`);

      // Dynamically discover all resources from the stack
      console.log(`🔍 Discovering resources from stack: ${stackName}`);
      const resourcesResponse = await cfnClient.send(
        new ListStackResourcesCommand({ StackName: stackName })
      );

      if (!resourcesResponse.StackResourceSummaries) {
        throw new Error('No stack resources found');
      }

      const resources = resourcesResponse.StackResourceSummaries;

      // Discover DynamoDB tables
      const dynamoResources = resources.filter(
        (r) => r.ResourceType === 'AWS::DynamoDB::Table'
      );
      discoveredResources.dynamoDBTables = dynamoResources
        .map((r) => r.PhysicalResourceId)
        .filter((id): id is string => id !== undefined);

      // Discover Lambda functions
      const lambdaResources = resources.filter(
        (r) => r.ResourceType === 'AWS::Lambda::Function'
      );
      discoveredResources.lambdaFunctions = lambdaResources
        .map((r) => r.PhysicalResourceId)
        .filter((id): id is string => id !== undefined);

      // Discover API Gateway REST APIs
      const apiResources = resources.filter(
        (r) => r.ResourceType === 'AWS::ApiGateway::RestApi'
      );
      discoveredResources.apiGatewayApis = apiResources
        .map((r) => r.PhysicalResourceId)
        .filter((id): id is string => id !== undefined);

      // Discover SNS Topics
      const snsResources = resources.filter(
        (r) => r.ResourceType === 'AWS::SNS::Topic'
      );
      discoveredResources.snsTopics = snsResources
        .map((r) => {
          // SNS topic ARN is in PhysicalResourceId
          return r.PhysicalResourceId;
        })
        .filter((id): id is string => id !== undefined);

      // Discover KMS Keys
      const kmsResources = resources.filter(
        (r) => r.ResourceType === 'AWS::KMS::Key'
      );
      discoveredResources.kmsKeys = kmsResources
        .map((r) => r.PhysicalResourceId)
        .filter((id): id is string => id !== undefined);

      // Discover IAM Roles
      const iamResources = resources.filter(
        (r) => r.ResourceType === 'AWS::IAM::Role'
      );
      discoveredResources.iamRoles = iamResources
        .map((r) => {
          // Extract role name from ARN
          const arn = r.PhysicalResourceId;
          if (arn) {
            return arn.split('/').pop() || arn;
          }
          return undefined;
        })
        .filter((id): id is string => id !== undefined);

      // Discover EventBridge Rules
      const eventBridgeResources = resources.filter(
        (r) => r.ResourceType === 'AWS::Events::Rule'
      );
      discoveredResources.eventBridgeRules = eventBridgeResources
        .map((r) => r.PhysicalResourceId)
        .filter((id): id is string => id !== undefined);

      // Discover CloudWatch Alarms
      const alarmResources = resources.filter(
        (r) => r.ResourceType === 'AWS::CloudWatch::Alarm'
      );
      discoveredResources.cloudWatchAlarms = alarmResources
        .map((r) => r.PhysicalResourceId)
        .filter((id): id is string => id !== undefined);

      console.log(`✅ Discovered ${resources.length} resources:`);
      console.log(`   - DynamoDB Tables: ${discoveredResources.dynamoDBTables.length}`);
      console.log(`   - Lambda Functions: ${discoveredResources.lambdaFunctions.length}`);
      console.log(`   - API Gateway APIs: ${discoveredResources.apiGatewayApis.length}`);
      console.log(`   - SNS Topics: ${discoveredResources.snsTopics.length}`);
      console.log(`   - KMS Keys: ${discoveredResources.kmsKeys.length}`);
      console.log(`   - IAM Roles: ${discoveredResources.iamRoles.length}`);
      console.log(`   - EventBridge Rules: ${discoveredResources.eventBridgeRules.length}`);
      console.log(`   - CloudWatch Alarms: ${discoveredResources.cloudWatchAlarms.length}`);
    } catch (error: any) {
      console.error('❌ Failed to discover stack:', error);
      throw error;
    }
  });

  afterAll(async () => {
    // Clean up clients
    cfnClient.destroy();
    dynamoClient.destroy();
    lambdaClient.destroy();
    apiGatewayClient.destroy();
    snsClient.destroy();
    kmsClient.destroy();
    iamClient.destroy();
    eventBridgeClient.destroy();
    cloudWatchClient.destroy();
  });

  describe('Stack Validation', () => {
    test('should have stack deployed successfully', async () => {
      expect(stackName).toBeDefined();
      const response = await cfnClient.send(
        new DescribeStacksCommand({ StackName: stackName })
      );

      expect(response.Stacks).toBeDefined();
      expect(response.Stacks!.length).toBe(1);
      expect(['CREATE_COMPLETE', 'UPDATE_COMPLETE']).toContain(
        response.Stacks![0].StackStatus
      );
    });

    test('should have expected outputs', () => {
      expect(stackOutputs.WebhookApiUrl).toBeDefined();
      expect(stackOutputs.ApiKeyId).toBeDefined();
      expect(stackOutputs.PriceAlertsTableName).toBeDefined();
      expect(stackOutputs.PriceHistoryTableName).toBeDefined();
    });
  });

  describe('DynamoDB Tables', () => {
    test('should have PriceAlertsTable deployed', async () => {
      expect(discoveredResources.dynamoDBTables.length).toBeGreaterThanOrEqual(1);

      const tableName = stackOutputs.PriceAlertsTableName || discoveredResources.dynamoDBTables[0];
      expect(tableName).toBeDefined();

      const response = await dynamoClient.send(
        new DescribeTableCommand({ TableName: tableName })
      );

      expect(response.Table).toBeDefined();
      expect(response.Table!.TableName).toBe(tableName);
      expect(response.Table!.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');
      
      // Check Point-in-Time Recovery
      const pitrResponse = await dynamoClient.send(
        new DescribeContinuousBackupsCommand({ TableName: tableName })
      );
      expect(pitrResponse.ContinuousBackupsDescription?.PointInTimeRecoveryDescription?.PointInTimeRecoveryStatus).toBe('ENABLED');
    });

    test('should have PriceHistoryTable deployed', async () => {
      expect(discoveredResources.dynamoDBTables.length).toBeGreaterThanOrEqual(2);

      const tableName = stackOutputs.PriceHistoryTableName || discoveredResources.dynamoDBTables[1];
      expect(tableName).toBeDefined();

      const response = await dynamoClient.send(
        new DescribeTableCommand({ TableName: tableName })
      );

      expect(response.Table).toBeDefined();
      expect(response.Table!.TableName).toBe(tableName);
      expect(response.Table!.StreamSpecification?.StreamEnabled).toBe(true);
      
      // Check Time-to-Live
      const ttlResponse = await dynamoClient.send(
        new DescribeTimeToLiveCommand({ TableName: tableName })
      );
      expect(ttlResponse.TimeToLiveDescription?.TimeToLiveStatus).toBe('ENABLED');
    });
  });

  describe('Lambda Functions', () => {
    test('should have all Lambda functions deployed', async () => {
      expect(discoveredResources.lambdaFunctions.length).toBeGreaterThanOrEqual(4);

      for (const functionName of discoveredResources.lambdaFunctions) {
        const response = await lambdaClient.send(
          new GetFunctionCommand({ FunctionName: functionName })
        );

        expect(response.Configuration).toBeDefined();
        expect(response.Configuration!.FunctionName).toBe(functionName);
        expect(response.Configuration!.Runtime).toMatch(/^nodejs\d+\.x$/);
        expect(response.Configuration!.State).toBe('Active');
      }
    });

    test('should have ProcessWebhookFunction with correct configuration', async () => {
      const processWebhook = discoveredResources.lambdaFunctions.find((name) =>
        name.includes('ProcessWebhook')
      );
      expect(processWebhook).toBeDefined();

      if (processWebhook) {
        const response = await lambdaClient.send(
          new GetFunctionCommand({ FunctionName: processWebhook })
        );

        expect(response.Configuration!.MemorySize).toBe(1024);
        expect(response.Configuration!.Timeout).toBe(30);
        expect(response.Configuration!.Architectures).toContain('arm64');
      }
    });
  });

  describe('API Gateway', () => {
    test('should have WebhookApi deployed', async () => {
      expect(discoveredResources.apiGatewayApis.length).toBeGreaterThanOrEqual(1);

      const apiId = discoveredResources.apiGatewayApis[0];
      const response = await apiGatewayClient.send(
        new GetRestApiCommand({ restApiId: apiId })
      );

      expect(response.id).toBe(apiId);
      expect(response.name).toBeDefined();
    });

    test('should have API Key created', async () => {
      const apiKeysResponse = await apiGatewayClient.send(
        new GetApiKeysCommand({ includeValues: false })
      );

      const stackApiKey = apiKeysResponse.items?.find((key) =>
        key.id === stackOutputs.ApiKeyId
      );
      expect(stackApiKey).toBeDefined();
    });
  });

  describe('SNS Topics', () => {
    test('should have NotificationTopic deployed', async () => {
      expect(discoveredResources.snsTopics.length).toBeGreaterThanOrEqual(1);

      const topicArn = discoveredResources.snsTopics[0];
      const response = await snsClient.send(
        new GetTopicAttributesCommand({ TopicArn: topicArn })
      );

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes!.TopicArn).toBe(topicArn);
    });
  });

  describe('KMS Keys', () => {
    test('should have KMS key deployed and enabled', async () => {
      expect(discoveredResources.kmsKeys.length).toBeGreaterThanOrEqual(1);

      const keyId = discoveredResources.kmsKeys[0];
      const response = await kmsClient.send(
        new DescribeKeyCommand({ KeyId: keyId })
      );

      expect(response.KeyMetadata).toBeDefined();
      expect(response.KeyMetadata!.KeyState).toBe('Enabled');
    });
  });

  describe('IAM Roles', () => {
    test('should have IAM roles deployed', async () => {
      expect(discoveredResources.iamRoles.length).toBeGreaterThanOrEqual(4);

      for (const roleName of discoveredResources.iamRoles) {
        const response = await iamClient.send(
          new GetRoleCommand({ RoleName: roleName })
        );

        expect(response.Role).toBeDefined();
        expect(response.Role!.RoleName).toBe(roleName);
        expect(response.Role!.AssumeRolePolicyDocument).toBeDefined();
      }
    });
  });

  describe('EventBridge Rules', () => {
    test('should have CleanupScheduleRule deployed', async () => {
      expect(discoveredResources.eventBridgeRules.length).toBeGreaterThanOrEqual(1);

      const ruleName = discoveredResources.eventBridgeRules[0];
      const response = await eventBridgeClient.send(
        new DescribeRuleCommand({ Name: ruleName })
      );

      expect(response.Name).toBe(ruleName);
      expect(response.State).toBe('ENABLED');
      expect(response.ScheduleExpression).toBe('rate(1 hour)');
    });
  });

  describe('CloudWatch Alarms', () => {
    test('should have CloudWatch alarms deployed', async () => {
      expect(discoveredResources.cloudWatchAlarms.length).toBeGreaterThanOrEqual(1);

      const alarmNames = discoveredResources.cloudWatchAlarms;
      const response = await cloudWatchClient.send(
        new DescribeAlarmsCommand({ AlarmNames: alarmNames })
      );

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms!.length).toBeGreaterThanOrEqual(1);
    });
  });
});

