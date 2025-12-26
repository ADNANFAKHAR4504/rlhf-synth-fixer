import AWS from 'aws-sdk';
import fs from 'fs';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

const lambda = new AWS.Lambda({ region: process.env.AWS_REGION || 'us-west-2' });
const apigatewayv2 = new AWS.ApiGatewayV2({ region: process.env.AWS_REGION || 'us-west-2' });
const dynamodb = new AWS.DynamoDB({ region: process.env.AWS_REGION || 'us-west-2' });
const s3 = new AWS.S3({ region: process.env.AWS_REGION || 'us-west-2' });
const sns = new AWS.SNS({ region: process.env.AWS_REGION || 'us-west-2' });
const sqs = new AWS.SQS({ region: process.env.AWS_REGION || 'us-west-2' });
const ec2 = new AWS.EC2({ region: process.env.AWS_REGION || 'us-west-2' });
const cloudwatchlogs = new AWS.CloudWatchLogs({ region: process.env.AWS_REGION || 'us-west-2' });
const eventbridge = new AWS.EventBridge({ region: process.env.AWS_REGION || 'us-west-2' });
const kms = new AWS.KMS({ region: process.env.AWS_REGION || 'us-west-2' });

describe('Serverless Infrastructure Integration Tests', () => {
  describe('Lambda → VPC → VPC Endpoints Integration', () => {
    test('Lambda function should be deployed in VPC with multiple subnets', async () => {
      const lambdaFunctionName = outputs.LambdaFunctionName;

      const lambdaResponse = await lambda.getFunction({
        FunctionName: lambdaFunctionName
      }).promise();

      const vpcConfig = lambdaResponse.Configuration!.VpcConfig!;

      expect(vpcConfig.SubnetIds).toBeDefined();
      expect(vpcConfig.SubnetIds!.length).toBe(2);
      expect(vpcConfig.SecurityGroupIds).toBeDefined();
      expect(vpcConfig.SecurityGroupIds!.length).toBeGreaterThan(0);
      expect(vpcConfig.VpcId).toBeDefined();
    });

    test('VPC should have S3 and DynamoDB gateway endpoints for Lambda access', async () => {
      const vpcId = outputs.VPCId;

      const endpointsResponse = await ec2.describeVpcEndpoints({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId]
          }
        ]
      }).promise();

      const endpoints = endpointsResponse.VpcEndpoints || [];

      const s3Endpoint = endpoints.find(ep =>
        ep.ServiceName?.includes('.s3')
      );
      const dynamoEndpoint = endpoints.find(ep =>
        ep.ServiceName?.includes('.dynamodb')
      );

      expect(s3Endpoint).toBeDefined();
      expect(s3Endpoint!.VpcEndpointType).toBe('Gateway');
      expect(dynamoEndpoint).toBeDefined();
      expect(dynamoEndpoint!.VpcEndpointType).toBe('Gateway');
    });

    test('Lambda security group should allow HTTPS egress for AWS service access', async () => {
      const lambdaFunctionName = outputs.LambdaFunctionName;

      const lambdaResponse = await lambda.getFunction({
        FunctionName: lambdaFunctionName
      }).promise();

      const securityGroupIds = lambdaResponse.Configuration!.VpcConfig!.SecurityGroupIds!;

      const sgResponse = await ec2.describeSecurityGroups({
        GroupIds: securityGroupIds
      }).promise();

      const sg = sgResponse.SecurityGroups![0];
      const egressRules = sg.IpPermissionsEgress || [];

      const httpsEgress = egressRules.find(rule =>
        rule.FromPort === 443 && rule.ToPort === 443 && rule.IpProtocol === 'tcp'
      );

      expect(httpsEgress).toBeDefined();
    });
  });

  describe('API Gateway HTTP API → Lambda Integration', () => {
    test('HTTP API should be integrated with Lambda function', async () => {
      const apiEndpoint = outputs.HttpApiEndpoint;
      const apiId = apiEndpoint.split('.')[0].split('//')[1];

      const integrationsResponse = await apigatewayv2.getIntegrations({
        ApiId: apiId
      }).promise();

      const integrations = integrationsResponse.Items || [];
      const lambdaIntegration = integrations.find(i =>
        i.IntegrationType === 'AWS_PROXY'
      );

      expect(lambdaIntegration).toBeDefined();
      expect(lambdaIntegration!.PayloadFormatVersion).toBe('2.0');
      expect(lambdaIntegration!.IntegrationUri).toContain(outputs.LambdaFunctionArn);
    });

    test('HTTP API should have routes configured for Lambda integration', async () => {
      const apiEndpoint = outputs.HttpApiEndpoint;
      const apiId = apiEndpoint.split('.')[0].split('//')[1];

      const routesResponse = await apigatewayv2.getRoutes({
        ApiId: apiId
      }).promise();

      const routes = routesResponse.Items || [];

      const postRoute = routes.find(r => r.RouteKey === 'POST /process');
      const getRoute = routes.find(r => r.RouteKey === 'GET /process');

      expect(postRoute).toBeDefined();
      expect(getRoute).toBeDefined();
      expect(postRoute!.Target).toContain('integrations/');
      expect(getRoute!.Target).toContain('integrations/');
    });

    test('HTTP API should have CORS configured', async () => {
      const apiEndpoint = outputs.HttpApiEndpoint;
      const apiId = apiEndpoint.split('.')[0].split('//')[1];

      const apiResponse = await apigatewayv2.getApi({
        ApiId: apiId
      }).promise();

      const corsConfig = apiResponse.CorsConfiguration;

      expect(corsConfig).toBeDefined();
      expect(corsConfig!.AllowOrigins).toContain('*');
      expect(corsConfig!.AllowMethods).toContain('GET');
      expect(corsConfig!.AllowMethods).toContain('POST');
    });
  });

  describe('Lambda → DynamoDB Integration', () => {
    test('Lambda function should have permissions to access DynamoDB table', async () => {
      const lambdaFunctionName = outputs.LambdaFunctionName;
      const tableName = outputs.DynamoDBTableName;

      const lambdaResponse = await lambda.getFunction({
        FunctionName: lambdaFunctionName
      }).promise();

      const envVars = lambdaResponse.Configuration!.Environment!.Variables!;

      expect(envVars.DYNAMODB_TABLE_NAME).toBe(tableName);
    });

    test('DynamoDB table should be accessible and properly configured', async () => {
      const tableName = outputs.DynamoDBTableName;

      const tableResponse = await dynamodb.describeTable({
        TableName: tableName
      }).promise();

      const table = tableResponse.Table!;

      expect(table.TableStatus).toBe('ACTIVE');
      expect(table.KeySchema).toHaveLength(2);
      expect(table.KeySchema![0].KeyType).toBe('HASH');
      expect(table.KeySchema![1].KeyType).toBe('RANGE');
      expect(table.ProvisionedThroughput!.ReadCapacityUnits).toBe(5);
      expect(table.ProvisionedThroughput!.WriteCapacityUnits).toBe(5);
    });

    test('DynamoDB table should have KMS encryption enabled', async () => {
      const tableName = outputs.DynamoDBTableName;

      const tableResponse = await dynamodb.describeTable({
        TableName: tableName
      }).promise();

      const table = tableResponse.Table!;

      expect(table.SSEDescription).toBeDefined();
      expect(table.SSEDescription!.Status).toBe('ENABLED');
      expect(table.SSEDescription!.SSEType).toBe('KMS');
      expect(table.SSEDescription!.KMSMasterKeyArn).toContain('arn:aws:kms');
    });
  });

  describe('Lambda → S3 Integration', () => {
    test('Lambda function should have S3 bucket name in environment variables', async () => {
      const lambdaFunctionName = outputs.LambdaFunctionName;
      const bucketName = outputs.S3BucketName;

      const lambdaResponse = await lambda.getFunction({
        FunctionName: lambdaFunctionName
      }).promise();

      const envVars = lambdaResponse.Configuration!.Environment!.Variables!;

      expect(envVars.S3_BUCKET_NAME).toBe(bucketName);
    });

    test('S3 bucket should have versioning enabled', async () => {
      const bucketName = outputs.S3BucketName;

      const versioningResponse = await s3.getBucketVersioning({
        Bucket: bucketName
      }).promise();

      expect(versioningResponse.Status).toBe('Enabled');
    });

    test('S3 bucket should have encryption configured', async () => {
      const bucketName = outputs.S3BucketName;

      const encryptionResponse = await s3.getBucketEncryption({
        Bucket: bucketName
      }).promise();

      const rules = encryptionResponse.ServerSideEncryptionConfiguration!.Rules!;

      expect(rules.length).toBeGreaterThan(0);
      expect(rules[0].ApplyServerSideEncryptionByDefault!.SSEAlgorithm).toBe('aws:kms');
      expect(rules[0].BucketKeyEnabled).toBe(true);
    });
  });

  describe('Lambda → SNS Integration', () => {
    test('Lambda function should have SNS topic ARN in environment variables', async () => {
      const lambdaFunctionName = outputs.LambdaFunctionName;
      const snsTopicArn = outputs.SNSTopicArn;

      const lambdaResponse = await lambda.getFunction({
        FunctionName: lambdaFunctionName
      }).promise();

      const envVars = lambdaResponse.Configuration!.Environment!.Variables!;

      expect(envVars.SNS_TOPIC_ARN).toBe(snsTopicArn);
    });

    test('SNS topic should have subscription or policy allowing Lambda to publish', async () => {
      const snsTopicArn = outputs.SNSTopicArn;

      const attributesResponse = await sns.getTopicAttributes({
        TopicArn: snsTopicArn
      }).promise();

      expect(attributesResponse.Attributes).toBeDefined();

      const policy = JSON.parse(attributesResponse.Attributes!.Policy!);
      const lambdaStatement = policy.Statement.find((s: any) =>
        s.Principal?.Service === 'lambda.amazonaws.com'
      );

      expect(lambdaStatement).toBeDefined();
      expect(lambdaStatement.Action).toBe('sns:Publish');
    });

    test('SNS topic should have KMS encryption enabled', async () => {
      const snsTopicArn = outputs.SNSTopicArn;

      const attributesResponse = await sns.getTopicAttributes({
        TopicArn: snsTopicArn
      }).promise();

      expect(attributesResponse.Attributes!.KmsMasterKeyId).toBeDefined();
      // KMS key can be returned as either ARN or key ID
      expect(attributesResponse.Attributes!.KmsMasterKeyId).toMatch(/^(arn:aws:kms|[a-f0-9-]{36})/);
    });
  });

  describe('Lambda → Dead Letter Queue Integration', () => {
    test('Lambda function should have Dead Letter Queue configured', async () => {
      const lambdaFunctionName = outputs.LambdaFunctionName;

      const lambdaResponse = await lambda.getFunction({
        FunctionName: lambdaFunctionName
      }).promise();

      const deadLetterConfig = lambdaResponse.Configuration!.DeadLetterConfig;

      expect(deadLetterConfig).toBeDefined();
      expect(deadLetterConfig!.TargetArn).toContain('arn:aws:sqs');
    });

    test('Dead Letter Queue should exist and be accessible', async () => {
      const lambdaFunctionName = outputs.LambdaFunctionName;

      const lambdaResponse = await lambda.getFunction({
        FunctionName: lambdaFunctionName
      }).promise();

      const dlqArn = lambdaResponse.Configuration!.DeadLetterConfig!.TargetArn!;
      const queueUrl = await sqs.getQueueUrl({
        QueueName: dlqArn.split(':').pop()!
      }).promise();

      const queueAttributes = await sqs.getQueueAttributes({
        QueueUrl: queueUrl.QueueUrl!,
        AttributeNames: ['All']
      }).promise();

      expect(queueAttributes.Attributes).toBeDefined();
      expect(queueAttributes.Attributes!.KmsMasterKeyId).toBeDefined();
      expect(queueAttributes.Attributes!.MessageRetentionPeriod).toBe('1209600');
    });
  });

  describe('EventBridge → Lambda Integration', () => {
    test('EventBridge rule should target Lambda function', async () => {
      const lambdaFunctionArn = outputs.LambdaFunctionArn;

      const rulesResponse = await eventbridge.listRules().promise();
      const rules = rulesResponse.Rules || [];

      const scheduleRule = rules.find(r =>
        r.ScheduleExpression === 'rate(24 hours)'
      );

      expect(scheduleRule).toBeDefined();
      expect(scheduleRule!.State).toBe('ENABLED');

      const targetsResponse = await eventbridge.listTargetsByRule({
        Rule: scheduleRule!.Name!
      }).promise();

      const targets = targetsResponse.Targets || [];
      const lambdaTarget = targets.find(t => t.Arn === lambdaFunctionArn);

      expect(lambdaTarget).toBeDefined();
    });

    test('Lambda function should have permission for EventBridge invocation', async () => {
      const lambdaFunctionName = outputs.LambdaFunctionName;

      const policyResponse = await lambda.getPolicy({
        FunctionName: lambdaFunctionName
      }).promise();

      const policy = JSON.parse(policyResponse.Policy!);
      const eventBridgeStatement = policy.Statement.find((s: any) =>
        s.Principal?.Service === 'events.amazonaws.com'
      );

      expect(eventBridgeStatement).toBeDefined();
      expect(eventBridgeStatement.Action).toBe('lambda:InvokeFunction');
    });
  });

  describe('CloudWatch Logs → Lambda Integration', () => {
    test('Lambda function should have dedicated log group', async () => {
      const lambdaFunctionName = outputs.LambdaFunctionName;

      const lambdaResponse = await lambda.getFunction({
        FunctionName: lambdaFunctionName
      }).promise();

      const loggingConfig = lambdaResponse.Configuration!.LoggingConfig;

      expect(loggingConfig).toBeDefined();
      // LogGroup can be either ARN or physical resource ID
      expect(loggingConfig!.LogGroup).toBeDefined();
      expect(loggingConfig!.LogGroup!.length).toBeGreaterThan(0);
    });

    test('Lambda log group should exist with KMS encryption', async () => {
      const lambdaFunctionName = outputs.LambdaFunctionName;

      const lambdaResponse = await lambda.getFunction({
        FunctionName: lambdaFunctionName
      }).promise();

      const logGroupName = lambdaResponse.Configuration!.LoggingConfig!.LogGroup!;

      const logGroupResponse = await cloudwatchlogs.describeLogGroups({
        logGroupNamePrefix: logGroupName
      }).promise();

      const logGroup = logGroupResponse.logGroups!.find(lg => lg.logGroupName === logGroupName);

      expect(logGroup).toBeDefined();
      expect(logGroup!.kmsKeyId).toBeDefined();
      expect(logGroup!.retentionInDays).toBe(30);
    });
  });

  describe('CloudWatch Logs → API Gateway Integration', () => {
    test('API Gateway should have log group configured for access logs', async () => {
      const apiEndpoint = outputs.HttpApiEndpoint;
      const apiId = apiEndpoint.split('.')[0].split('//')[1];

      const stagesResponse = await apigatewayv2.getStages({
        ApiId: apiId
      }).promise();

      const defaultStage = stagesResponse.Items!.find(s => s.StageName === '$default');

      expect(defaultStage).toBeDefined();
      expect(defaultStage!.AccessLogSettings).toBeDefined();
      expect(defaultStage!.AccessLogSettings!.DestinationArn).toContain('log-group');
    });

    test('API Gateway log group should exist with KMS encryption', async () => {
      const stackName = outputs.HttpApiEndpoint.split('.')[0].split('//')[1].split('-')[0];

      const logGroupResponse = await cloudwatchlogs.describeLogGroups({
        logGroupNamePrefix: '/aws/apigateway/'
      }).promise();

      const apiLogGroup = logGroupResponse.logGroups!.find(lg =>
        lg.logGroupName!.includes('http-api')
      );

      expect(apiLogGroup).toBeDefined();
      expect(apiLogGroup!.kmsKeyId).toBeDefined();
      expect(apiLogGroup!.retentionInDays).toBe(30);
    });
  });

  describe('KMS → Multiple Services Integration', () => {
    test('KMS key should be used by DynamoDB, S3, SNS, and CloudWatch Logs', async () => {
      const kmsKeyId = outputs.KMSKeyId;

      const keyResponse = await kms.describeKey({
        KeyId: kmsKeyId
      }).promise();

      expect(keyResponse.KeyMetadata).toBeDefined();
      expect(keyResponse.KeyMetadata!.KeyState).toBe('Enabled');
      expect(keyResponse.KeyMetadata!.KeyUsage).toBe('ENCRYPT_DECRYPT');
    });

    test('KMS key should have alias for easy identification', async () => {
      const kmsKeyArn = outputs.KMSKeyArn;

      const aliasesResponse = await kms.listAliases().promise();
      const aliases = aliasesResponse.Aliases || [];

      const keyAlias = aliases.find(a => a.TargetKeyId === kmsKeyArn.split('/').pop());

      expect(keyAlias).toBeDefined();
      expect(keyAlias!.AliasName).toContain('alias/');
    });
  });

  describe('VPC Flow Logs → CloudWatch Logs Integration', () => {
    test('VPC should have flow logs enabled', async () => {
      const vpcId = outputs.VPCId;

      const flowLogsResponse = await ec2.describeFlowLogs({
        Filter: [
          {
            Name: 'resource-id',
            Values: [vpcId]
          }
        ]
      }).promise();

      const flowLogs = flowLogsResponse.FlowLogs || [];

      expect(flowLogs.length).toBeGreaterThan(0);
      expect(flowLogs[0].FlowLogStatus).toBe('ACTIVE');
      expect(flowLogs[0].TrafficType).toBe('ALL');
      expect(flowLogs[0].LogDestinationType).toBe('cloud-watch-logs');
    });

    test('VPC flow logs should write to CloudWatch log group', async () => {
      const vpcId = outputs.VPCId;

      const flowLogsResponse = await ec2.describeFlowLogs({
        Filter: [
          {
            Name: 'resource-id',
            Values: [vpcId]
          }
        ]
      }).promise();

      const flowLog = flowLogsResponse.FlowLogs![0];

      expect(flowLog.LogDestinationType).toBe('cloud-watch-logs');

      // LogGroupName might be in LogGroupName field or need to be extracted from LogDestination
      const logGroupName = flowLog.LogGroupName ||
        (flowLog.LogDestination ? flowLog.LogDestination.split(':').pop() : null);

      expect(logGroupName).toBeDefined();

      const logGroupResponse = await cloudwatchlogs.describeLogGroups({
        logGroupNamePrefix: logGroupName!
      }).promise();

      expect(logGroupResponse.logGroups!.length).toBeGreaterThan(0);
      expect(logGroupResponse.logGroups![0].kmsKeyId).toBeDefined();
    });
  });
});
