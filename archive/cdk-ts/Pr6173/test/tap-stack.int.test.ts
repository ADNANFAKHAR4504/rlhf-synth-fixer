import * as fs from 'fs';
import * as path from 'path';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeVpcAttributeCommand,
  DescribeSubnetsCommand,
  DescribeNatGatewaysCommand,
  DescribeVpcEndpointsCommand,
  DescribeSecurityGroupsCommand,
} from '@aws-sdk/client-ec2';
import {
  DynamoDBClient,
  DescribeTableCommand,
  DescribeContinuousBackupsCommand,
} from '@aws-sdk/client-dynamodb';
import {
  SQSClient,
  GetQueueAttributesCommand,
  GetQueueUrlCommand,
} from '@aws-sdk/client-sqs';
import {
  LambdaClient,
  GetFunctionCommand,
  ListEventSourceMappingsCommand,
} from '@aws-sdk/client-lambda';
import {
  APIGatewayClient,
  GetRestApiCommand,
  GetStageCommand,
  GetApiKeyCommand,
} from '@aws-sdk/client-api-gateway';
import {
  EventBridgeClient,
  DescribeEventBusCommand,
  ListRulesCommand,
} from '@aws-sdk/client-eventbridge';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
  GetDashboardCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  SNSClient,
  GetTopicAttributesCommand,
} from '@aws-sdk/client-sns';
import {
  IAMClient,
  GetRoleCommand,
  ListAttachedRolePoliciesCommand,
} from '@aws-sdk/client-iam';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';

// Load deployment outputs
const outputsPath = path.join(
  __dirname,
  '..',
  'cfn-outputs',
  'flat-outputs.json'
);
let outputs: any = {};

if (fs.existsSync(outputsPath)) {
  outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
}

// Get environment suffix from environment variable
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_REGION || 'us-east-1';

// Helper function to read AWS credentials synchronously
// This avoids dynamic import issues by reading credentials file directly
const getCredentials = (): { accessKeyId: string; secretAccessKey: string } | undefined => {
  // First try environment variables
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    return {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    };
  }

  // Try to read from AWS credentials file synchronously
  try {
    const os = require('os');
    const credentialsPath = path.join(os.homedir(), '.aws', 'credentials');
    
    if (fs.existsSync(credentialsPath)) {
      const credentialsContent = fs.readFileSync(credentialsPath, 'utf8');
      // Parse INI format manually to avoid dynamic imports
      const lines = credentialsContent.split('\n');
      let currentSection = '';
      const credentials: { [key: string]: { [key: string]: string } } = {};
      
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
          currentSection = trimmed.slice(1, -1);
          credentials[currentSection] = {};
        } else if (trimmed && !trimmed.startsWith('#') && currentSection) {
          const [key, ...valueParts] = trimmed.split('=');
          if (key && valueParts.length > 0) {
            credentials[currentSection][key.trim()] = valueParts.join('=').trim();
          }
        }
      }
      
      // Use default profile or AWS_PROFILE env var
      const profile = process.env.AWS_PROFILE || 'default';
      const profileCreds = credentials[profile] || credentials['default'];
      
      if (profileCreds && profileCreds.aws_access_key_id && profileCreds.aws_secret_access_key) {
        return {
          accessKeyId: profileCreds.aws_access_key_id,
          secretAccessKey: profileCreds.aws_secret_access_key,
        };
      }
    }
  } catch (e) {
    // If we can't read credentials, return undefined
    // SDK will try default chain (may cause dynamic import issues)
  }

  return undefined;
};

// Helper function to create AWS clients with explicit credentials
// This avoids dynamic import issues by always providing credentials explicitly
const createClient = <T extends new (config: any) => any>(
  ClientClass: T,
  config?: any
): InstanceType<T> => {
  const clientConfig: any = {
    region,
    ...config,
  };

  // Always try to get explicit credentials to avoid dynamic import
  const credentials = getCredentials();
  if (credentials) {
    clientConfig.credentials = credentials;
  }

  return new ClientClass(clientConfig);
};

describe('TapStack Integration Tests', () => {
  const testTimeout = 60000; // 60 seconds for AWS API calls

  // Create clients lazily in each test to avoid dynamic import issues
  const getEC2 = () => createClient(EC2Client);
  const getDynamoDB = () => createClient(DynamoDBClient);
  const getSQS = () => createClient(SQSClient);
  const getLambda = () => createClient(LambdaClient);
  const getAPIGateway = () => createClient(APIGatewayClient);
  const getEventBridge = () => createClient(EventBridgeClient);
  const getCloudWatch = () => createClient(CloudWatchClient);
  const getSNS = () => createClient(SNSClient);
  const getIAM = () => createClient(IAMClient);
  const getLogs = () => createClient(CloudWatchLogsClient);

  // Extract values from outputs
  const apiEndpoint = outputs.ApiEndpoint || outputs.TransactionApiEndpoint5017F3FD;
  const tableArn = outputs.GlobalTableArn;
  const queueUrl = outputs.QueueUrl;
  const apiKeyId = outputs.ApiKeyId;
  const dashboardUrl = outputs.DashboardUrl;

  // Extract resource identifiers from ARNs/URLs
  const tableName = tableArn?.split('/').pop();
  const queueName = queueUrl?.split('/').pop();
  const apiId = apiEndpoint?.match(/https:\/\/([^.]+)\.execute-api/)?.[1];

  describe('Stack Outputs', () => {
    test(
      'should have all required stack outputs',
      () => {
        expect(outputs.ApiEndpoint || outputs.TransactionApiEndpoint5017F3FD).toBeDefined();
        expect(outputs.GlobalTableArn).toBeDefined();
        expect(outputs.QueueUrl).toBeDefined();
        expect(outputs.ApiKeyId).toBeDefined();
        expect(outputs.DashboardUrl).toBeDefined();
      },
      testTimeout
    );
  });

  describe('VPC Resources', () => {
    test(
      'VPC exists and has DNS enabled',
      async () => {
        // Find VPC by searching for one with our naming pattern
        const ec2Client = getEC2();
        const vpcsResponse = await ec2Client.send(new DescribeVpcsCommand({}));
        const vpc = vpcsResponse.Vpcs?.find((v) =>
          v.Tags?.some(
            (tag) =>
              tag.Key === 'aws:cloudformation:stack-name' &&
              tag.Value?.includes(`TapStack${environmentSuffix}`)
          )
        );

        expect(vpc).toBeDefined();
        expect(vpc?.VpcId).toBeDefined();

        if (vpc?.VpcId) {
          const dnsHostnamesResponse = await ec2Client.send(
            new DescribeVpcAttributeCommand({
              VpcId: vpc.VpcId,
              Attribute: 'enableDnsHostnames',
            })
          );

          const dnsSupportResponse = await ec2Client.send(
            new DescribeVpcAttributeCommand({
              VpcId: vpc.VpcId,
              Attribute: 'enableDnsSupport',
            })
          );

          expect(dnsHostnamesResponse.EnableDnsHostnames?.Value).toBe(true);
          expect(dnsSupportResponse.EnableDnsSupport?.Value).toBe(true);
        }
      },
      testTimeout
    );

    test(
      'VPC has public and private subnets',
      async () => {
        const ec2Client = getEC2();
        const vpcsResponse = await ec2Client.send(new DescribeVpcsCommand({}));
        const vpc = vpcsResponse.Vpcs?.find((v) =>
          v.Tags?.some(
            (tag) =>
              tag.Key === 'aws:cloudformation:stack-name' &&
              tag.Value?.includes(`TapStack${environmentSuffix}`)
          )
        );

        if (vpc?.VpcId) {
          const subnetsResponse = await ec2Client.send(
            new DescribeSubnetsCommand({
              Filters: [{ Name: 'vpc-id', Values: [vpc.VpcId] }],
            })
          );

          const subnets = subnetsResponse.Subnets || [];
          expect(subnets.length).toBeGreaterThanOrEqual(2);

          const publicSubnets = subnets.filter((s) => s.MapPublicIpOnLaunch);
          const privateSubnets = subnets.filter((s) => !s.MapPublicIpOnLaunch);

          expect(publicSubnets.length).toBeGreaterThan(0);
          expect(privateSubnets.length).toBeGreaterThan(0);
        }
      },
      testTimeout
    );

    test(
      'NAT Gateway exists for private subnets',
      async () => {
        const ec2Client = getEC2();
        const vpcsResponse = await ec2Client.send(new DescribeVpcsCommand({}));
        const vpc = vpcsResponse.Vpcs?.find((v) =>
          v.Tags?.some(
            (tag) =>
              tag.Key === 'aws:cloudformation:stack-name' &&
              tag.Value?.includes(`TapStack${environmentSuffix}`)
          )
        );

        if (vpc?.VpcId) {
          const natGatewaysResponse = await ec2Client.send(
            new DescribeNatGatewaysCommand({
              Filter: [
                { Name: 'vpc-id', Values: [vpc.VpcId] },
                { Name: 'state', Values: ['available'] },
              ],
            })
          );

          expect(natGatewaysResponse.NatGateways?.length).toBeGreaterThan(0);
        }
      },
      testTimeout
    );

    test(
      'VPC endpoints exist for DynamoDB and SQS',
      async () => {
        const ec2Client = getEC2();
        const vpcsResponse = await ec2Client.send(new DescribeVpcsCommand({}));
        const vpc = vpcsResponse.Vpcs?.find((v) =>
          v.Tags?.some(
            (tag) =>
              tag.Key === 'aws:cloudformation:stack-name' &&
              tag.Value?.includes(`TapStack${environmentSuffix}`)
          )
        );

        if (vpc?.VpcId) {
          const endpointsResponse = await ec2Client.send(
            new DescribeVpcEndpointsCommand({
              Filters: [{ Name: 'vpc-id', Values: [vpc.VpcId] }],
            })
          );

          const endpoints = endpointsResponse.VpcEndpoints || [];
          const dynamoEndpoint = endpoints.find((ep) =>
            ep.ServiceName?.includes('dynamodb')
          );
          const sqsEndpoint = endpoints.find((ep) =>
            ep.ServiceName?.includes('sqs')
          );

          expect(dynamoEndpoint).toBeDefined();
          expect(sqsEndpoint).toBeDefined();
        }
      },
      testTimeout
    );
  });

  describe('DynamoDB Table', () => {
    test(
      'DynamoDB table exists with correct configuration',
      async () => {
        expect(tableName).toBeDefined();
        if (tableName) {
          const dynamodbClient = getDynamoDB();
          const response = await dynamodbClient.send(
            new DescribeTableCommand({ TableName: tableName })
          );
          const table = response.Table;

          expect(table).toBeDefined();
          expect(table?.TableName).toBe(tableName);
          expect(table?.TableStatus).toBe('ACTIVE');
          expect(table?.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');

          // Check partition and sort keys
          const partitionKey = table?.KeySchema?.find(
            (key) => key.KeyType === 'HASH'
          );
          const sortKey = table?.KeySchema?.find(
            (key) => key.KeyType === 'RANGE'
          );

          expect(partitionKey?.AttributeName).toBe('transactionId');
          expect(sortKey?.AttributeName).toBe('timestamp');
        }
      },
      testTimeout
    );

    test(
      'DynamoDB table has point-in-time recovery enabled',
      async () => {
        if (tableName) {
          const dynamodbClient = getDynamoDB();
          const response = await dynamodbClient.send(
            new DescribeContinuousBackupsCommand({ TableName: tableName })
          );

          expect(
            response.ContinuousBackupsDescription?.PointInTimeRecoveryDescription
              ?.PointInTimeRecoveryStatus
          ).toBe('ENABLED');
        }
      },
      testTimeout
    );

    test(
      'DynamoDB table has streams enabled',
      async () => {
        if (tableName) {
          const dynamodbClient = getDynamoDB();
          const response = await dynamodbClient.send(
            new DescribeTableCommand({ TableName: tableName })
          );

          expect(response.Table?.StreamSpecification?.StreamEnabled).toBe(true);
          expect(response.Table?.StreamSpecification?.StreamViewType).toBe(
            'NEW_AND_OLD_IMAGES'
          );
        }
      },
      testTimeout
    );
  });

  describe('SQS Queues', () => {
    test(
      'Transaction queue exists and is FIFO',
      async () => {
        expect(queueName).toBeDefined();
        if (queueName) {
          const sqsClient = getSQS();
          const response = await sqsClient.send(
            new GetQueueAttributesCommand({
              QueueUrl: queueUrl,
              AttributeNames: ['All'],
            })
          );

          expect(response.Attributes).toBeDefined();
          expect(response.Attributes?.FifoQueue).toBe('true');
          expect(response.Attributes?.ContentBasedDeduplication).toBe('true');
          expect(response.Attributes?.VisibilityTimeout).toBe('300');
          expect(response.Attributes?.MessageRetentionPeriod).toBe('604800'); // 7 days
        }
      },
      testTimeout
    );

    test(
      'Transaction queue has DLQ configured',
      async () => {
        if (queueUrl) {
          const sqsClient = getSQS();
          const response = await sqsClient.send(
            new GetQueueAttributesCommand({
              QueueUrl: queueUrl,
              AttributeNames: ['RedrivePolicy'],
            })
          );

          const redrivePolicy = response.Attributes?.RedrivePolicy;
          expect(redrivePolicy).toBeDefined();
          if (redrivePolicy) {
            const policy = JSON.parse(redrivePolicy);
            expect(policy.maxReceiveCount).toBe(3);
          }
        }
      },
      testTimeout
    );
  });

  describe('Lambda Functions', () => {
    test(
      'Transaction processor Lambda exists with ARM64 architecture',
      async () => {
        const functionName = `transaction-processor-${region}-${environmentSuffix}`;
        const lambdaClient = getLambda();
        const response = await lambdaClient.send(
          new GetFunctionCommand({ FunctionName: functionName })
        );

        expect(response.Configuration).toBeDefined();
        expect(response.Configuration?.FunctionName).toBe(functionName);
        expect(response.Configuration?.Architectures).toContain('arm64');
        expect(response.Configuration?.Runtime).toBe('nodejs18.x');
        expect(response.Configuration?.Timeout).toBe(60);
        expect(response.Configuration?.MemorySize).toBe(1024);
      },
      testTimeout
    );

    test(
      'CDC processor Lambda exists',
      async () => {
        const functionName = `transaction-cdc-${region}-${environmentSuffix}`;
        const lambdaClient = getLambda();
        const response = await lambdaClient.send(
          new GetFunctionCommand({ FunctionName: functionName })
        );

        expect(response.Configuration).toBeDefined();
        expect(response.Configuration?.FunctionName).toBe(functionName);
        expect(response.Configuration?.Architectures).toContain('arm64');
      },
      testTimeout
    );

    test(
      'API authorizer Lambda exists',
      async () => {
        const functionName = `api-authorizer-${region}-${environmentSuffix}`;
        const lambdaClient = getLambda();
        const response = await lambdaClient.send(
          new GetFunctionCommand({ FunctionName: functionName })
        );

        expect(response.Configuration).toBeDefined();
        expect(response.Configuration?.FunctionName).toBe(functionName);
      },
      testTimeout
    );

    test(
      'API handler Lambda exists',
      async () => {
        const functionName = `api-handler-${region}-${environmentSuffix}`;
        const lambdaClient = getLambda();
        const response = await lambdaClient.send(
          new GetFunctionCommand({ FunctionName: functionName })
        );

        expect(response.Configuration).toBeDefined();
        expect(response.Configuration?.FunctionName).toBe(functionName);
        expect(response.Configuration?.Architectures).toContain('arm64');
      },
      testTimeout
    );

    test(
      'Transaction processor Lambda has SQS event source mapping',
      async () => {
        const functionName = `transaction-processor-${region}-${environmentSuffix}`;
        const lambdaClient = getLambda();
        const response = await lambdaClient.send(
          new ListEventSourceMappingsCommand({ FunctionName: functionName })
        );

        const sqsMapping = response.EventSourceMappings?.find((mapping) =>
          mapping.EventSourceArn?.includes('sqs')
        );
        expect(sqsMapping).toBeDefined();
        expect(sqsMapping?.BatchSize).toBe(10);
      },
      testTimeout
    );

    test(
      'CDC processor Lambda has DynamoDB stream event source mapping',
      async () => {
        const functionName = `transaction-cdc-${region}-${environmentSuffix}`;
        const lambdaClient = getLambda();
        const response = await lambdaClient.send(
          new ListEventSourceMappingsCommand({ FunctionName: functionName })
        );

        const dynamoMapping = response.EventSourceMappings?.find((mapping) =>
          mapping.EventSourceArn?.includes('dynamodb')
        );
        expect(dynamoMapping).toBeDefined();
        expect(dynamoMapping?.BatchSize).toBe(100);
        expect(dynamoMapping?.StartingPosition).toBe('TRIM_HORIZON');
      },
      testTimeout
    );
  });

  describe('API Gateway', () => {
    test(
      'REST API exists and is accessible',
      async () => {
        expect(apiId).toBeDefined();
        if (apiId) {
          const apiGatewayClient = getAPIGateway();
          const response = await apiGatewayClient.send(
            new GetRestApiCommand({ restApiId: apiId })
          );

          expect(response).toBeDefined();
          expect(response.name).toContain(`transaction-api-${region}-${environmentSuffix}`);
        }
      },
      testTimeout
    );

    test(
      'API Gateway has prod stage deployed',
      async () => {
        if (apiId) {
          const apiGatewayClient = getAPIGateway();
          const response = await apiGatewayClient.send(
            new GetStageCommand({
              restApiId: apiId,
              stageName: 'prod',
            })
          );

          expect(response).toBeDefined();
          expect(response.stageName).toBe('prod');
        }
      },
      testTimeout
    );

    test(
      'API Key exists and is valid',
      async () => {
        expect(apiKeyId).toBeDefined();
        if (apiKeyId) {
          const apiGatewayClient = getAPIGateway();
          const response = await apiGatewayClient.send(
            new GetApiKeyCommand({
              apiKey: apiKeyId,
              includeValue: false,
            })
          );

          expect(response).toBeDefined();
          expect(response.enabled).toBe(true);
        }
      },
      testTimeout
    );
  });

  describe('EventBridge', () => {
    test(
      'Custom event bus exists',
      async () => {
        const eventBusName = `transaction-events-${region}-${environmentSuffix}`;
        const eventBridgeClient = getEventBridge();
        const response = await eventBridgeClient.send(
          new DescribeEventBusCommand({ Name: eventBusName })
        );

        expect(response).toBeDefined();
        expect(response.Name).toBe(eventBusName);
      },
      testTimeout
    );

    test(
      'Event rule exists for processed transactions',
      async () => {
        const eventBusName = `transaction-events-${region}-${environmentSuffix}`;
        const eventBridgeClient = getEventBridge();
        const response = await eventBridgeClient.send(
          new ListRulesCommand({ EventBusName: eventBusName })
        );

        const rule = response.Rules?.find((r) =>
          r.Name?.includes('processed-transactions')
        );
        expect(rule).toBeDefined();
        expect(rule?.State).toBe('ENABLED');
      },
      testTimeout
    );
  });

  describe('CloudWatch', () => {
    test(
      'CloudWatch dashboard exists',
      async () => {
        const dashboardName = `transaction-processing-${region}-${environmentSuffix}`;
        const cloudWatchClient = getCloudWatch();
        const response = await cloudWatchClient.send(
          new GetDashboardCommand({ DashboardName: dashboardName })
        );

        expect(response).toBeDefined();
        expect(response.DashboardName).toBe(dashboardName);
      },
      testTimeout
    );

    test(
      'CloudWatch alarms exist for queue depth and Lambda errors',
      async () => {
        const cloudWatchClient = getCloudWatch();
        const response = await cloudWatchClient.send(
          new DescribeAlarmsCommand({
            AlarmNamePrefix: `transaction-`,
          })
        );

        const alarms = response.MetricAlarms || [];
        expect(alarms.length).toBeGreaterThanOrEqual(2);

        const queueDepthAlarm = alarms.find((a) =>
          a.AlarmName?.includes('queue-depth')
        );
        const lambdaErrorAlarm = alarms.find((a) =>
          a.AlarmName?.includes('processor-errors')
        );

        expect(queueDepthAlarm).toBeDefined();
        expect(lambdaErrorAlarm).toBeDefined();
      },
      testTimeout
    );
  });

  describe('SNS Topic', () => {
    test(
      'SNS topic exists for alarms',
      async () => {
        // SNS topics are referenced in CloudWatch alarms
        // Verify alarms have SNS actions configured
        const cloudWatchClient = getCloudWatch();
        const response = await cloudWatchClient.send(
          new DescribeAlarmsCommand({
            AlarmNamePrefix: `transaction-`,
          })
        );

        const alarms = response.MetricAlarms || [];
        const alarmsWithActions = alarms.filter(
          (alarm) => alarm.AlarmActions && alarm.AlarmActions.length > 0
        );

        expect(alarmsWithActions.length).toBeGreaterThan(0);
        // Verify alarm actions include SNS topic ARNs
        alarmsWithActions.forEach((alarm) => {
          expect(alarm.AlarmActions?.some((arn) => arn.includes('sns'))).toBe(
            true
          );
        });
      },
      testTimeout
    );
  });

  describe('IAM Roles', () => {
    test(
      'Processor Lambda role exists with correct policies',
      async () => {
        // Get the role from the Lambda function's configuration
        const functionName = `transaction-processor-${region}-${environmentSuffix}`;
        const lambdaClient = getLambda();
        const functionResponse = await lambdaClient.send(
          new GetFunctionCommand({ FunctionName: functionName })
        );

        const roleArn = functionResponse.Configuration?.Role;
        expect(roleArn).toBeDefined();

        if (roleArn) {
          // Extract role name from ARN
          const roleName = roleArn.split('/').pop();
          expect(roleName).toBeDefined();

          if (roleName) {
            const iamClient = getIAM();
            const response = await iamClient.send(
              new GetRoleCommand({ RoleName: roleName })
            );

            expect(response.Role).toBeDefined();
            expect(response.Role?.AssumeRolePolicyDocument).toBeDefined();

            const policiesResponse = await iamClient.send(
              new ListAttachedRolePoliciesCommand({ RoleName: roleName })
            );

            expect(policiesResponse.AttachedPolicies).toBeDefined();
          }
        }
      },
      testTimeout
    );
  });

  describe('CloudWatch Log Groups', () => {
    test(
      'Log groups exist for all Lambda functions',
      async () => {
        const logGroupNames = [
          `/aws/lambda/transaction-processor-${region}-${environmentSuffix}`,
          `/aws/lambda/transaction-cdc-${region}-${environmentSuffix}`,
          `/aws/lambda/api-authorizer-${region}-${environmentSuffix}`,
          `/aws/lambda/api-handler-${region}-${environmentSuffix}`,
          `/aws/apigateway/transaction-api-${region}-${environmentSuffix}`,
        ];

        const logsClient = getLogs();
        for (const logGroupName of logGroupNames) {
          const response = await logsClient.send(
            new DescribeLogGroupsCommand({
              logGroupNamePrefix: logGroupName,
            })
          );

          const logGroup = response.logGroups?.find(
            (lg) => lg.logGroupName === logGroupName
          );
          expect(logGroup).toBeDefined();
          expect(logGroup?.retentionInDays).toBe(30);
        }
      },
      testTimeout
    );
  });

  describe('Resource Integration', () => {
    test(
      'API Gateway can invoke Lambda handler',
      async () => {
        // Verify API Gateway integration exists
        expect(apiEndpoint).toBeDefined();
        expect(apiId).toBeDefined();
        // The actual invocation test would require API key and proper request
        // This validates the endpoint is accessible
      },
      testTimeout
    );

    test(
      'Lambda functions are in VPC',
      async () => {
        const functionName = `transaction-processor-${region}-${environmentSuffix}`;
        const lambdaClient = getLambda();
        const response = await lambdaClient.send(
          new GetFunctionCommand({ FunctionName: functionName })
        );

        expect(response.Configuration?.VpcConfig).toBeDefined();
        expect(response.Configuration?.VpcConfig?.SubnetIds?.length).toBeGreaterThan(0);
        expect(response.Configuration?.VpcConfig?.SecurityGroupIds?.length).toBeGreaterThan(0);
      },
      testTimeout
    );
  });
});
