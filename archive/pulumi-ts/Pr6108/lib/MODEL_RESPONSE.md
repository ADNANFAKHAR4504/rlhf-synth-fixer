# Serverless Fraud Detection System - Initial Implementation

This document contains the initial Pulumi TypeScript infrastructure code for a serverless fraud detection system.

## Architecture Overview

The implementation creates:
- DynamoDB table for transaction storage
- 3 Lambda functions (ingestion, detection, alerts)
- SQS queues with DLQs
- API Gateway REST API
- EventBridge scheduled rule
- SNS topic for alerts
- VPC with private subnets and VPC endpoints
- KMS keys for encryption
- IAM roles with least-privilege permissions
- CloudWatch log groups

## File: lib/tap-stack.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';

export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly apiEndpoint: pulumi.Output<string>;
  public readonly tableArn: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // Get region
    const region = aws.getRegionOutput({}, { parent: this }).name;

    // VPC Configuration
    const vpc = new aws.ec2.Vpc(`fraud-vpc-${environmentSuffix}`, {
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: { ...tags, Name: `fraud-vpc-${environmentSuffix}` },
    }, { parent: this });

    // Get availability zones
    const azs = aws.getAvailabilityZones({
      state: 'available',
    }, { parent: this });

    // Private subnets (3 AZs)
    const privateSubnets = azs.then(zones => zones.names.slice(0, 3).map((az, idx) =>
      new aws.ec2.Subnet(`fraud-private-subnet-${idx + 1}-${environmentSuffix}`, {
        vpcId: vpc.id,
        cidrBlock: `10.0.${idx + 1}.0/24`,
        availabilityZone: az,
        tags: { ...tags, Name: `fraud-private-subnet-${idx + 1}-${environmentSuffix}` },
      }, { parent: this })
    ));

    // VPC Endpoints Security Group
    const vpcEndpointSg = new aws.ec2.SecurityGroup(`vpc-endpoint-sg-${environmentSuffix}`, {
      vpcId: vpc.id,
      description: 'Security group for VPC endpoints',
      ingress: [{
        protocol: 'tcp',
        fromPort: 443,
        toPort: 443,
        cidrBlocks: ['10.0.0.0/16'],
        description: 'HTTPS from VPC',
      }],
      egress: [{
        protocol: '-1',
        fromPort: 0,
        toPort: 0,
        cidrBlocks: ['0.0.0.0/0'],
        description: 'All outbound',
      }],
      tags: { ...tags, Name: `vpc-endpoint-sg-${environmentSuffix}` },
    }, { parent: this });

    // Route table for private subnets
    const privateRouteTable = new aws.ec2.RouteTable(`fraud-private-rt-${environmentSuffix}`, {
      vpcId: vpc.id,
      tags: { ...tags, Name: `fraud-private-rt-${environmentSuffix}` },
    }, { parent: this });

    // Associate route table with private subnets
    privateSubnets.then(subnets => subnets.forEach((subnet, idx) =>
      new aws.ec2.RouteTableAssociation(`fraud-rta-${idx + 1}-${environmentSuffix}`, {
        subnetId: subnet.id,
        routeTableId: privateRouteTable.id,
      }, { parent: this })
    ));

    // VPC Endpoints
    const dynamodbEndpoint = new aws.ec2.VpcEndpoint(`dynamodb-endpoint-${environmentSuffix}`, {
      vpcId: vpc.id,
      serviceName: pulumi.interpolate`com.amazonaws.${region}.dynamodb`,
      vpcEndpointType: 'Gateway',
      routeTableIds: [privateRouteTable.id],
      tags: { ...tags, Name: `dynamodb-endpoint-${environmentSuffix}` },
    }, { parent: this });

    const sqsEndpoint = new aws.ec2.VpcEndpoint(`sqs-endpoint-${environmentSuffix}`, {
      vpcId: vpc.id,
      serviceName: pulumi.interpolate`com.amazonaws.${region}.sqs`,
      vpcEndpointType: 'Interface',
      subnetIds: pulumi.output(privateSubnets).apply(subnets => subnets.map(s => s.id)),
      securityGroupIds: [vpcEndpointSg.id],
      privateDnsEnabled: true,
      tags: { ...tags, Name: `sqs-endpoint-${environmentSuffix}` },
    }, { parent: this });

    const snsEndpoint = new aws.ec2.VpcEndpoint(`sns-endpoint-${environmentSuffix}`, {
      vpcId: vpc.id,
      serviceName: pulumi.interpolate`com.amazonaws.${region}.sns`,
      vpcEndpointType: 'Interface',
      subnetIds: pulumi.output(privateSubnets).apply(subnets => subnets.map(s => s.id)),
      securityGroupIds: [vpcEndpointSg.id],
      privateDnsEnabled: true,
      tags: { ...tags, Name: `sns-endpoint-${environmentSuffix}` },
    }, { parent: this });

    // KMS Key for Lambda environment variables
    const kmsKey = new aws.kms.Key(`fraud-lambda-kms-${environmentSuffix}`, {
      description: 'KMS key for Lambda environment variable encryption',
      enableKeyRotation: true,
      tags: { ...tags, Name: `fraud-lambda-kms-${environmentSuffix}` },
    }, { parent: this });

    new aws.kms.Alias(`fraud-lambda-kms-alias-${environmentSuffix}`, {
      name: `alias/fraud-lambda-${environmentSuffix}`,
      targetKeyId: kmsKey.id,
    }, { parent: this });

    // DynamoDB Table
    const fraudTable = new aws.dynamodb.Table(`fraud-transactions-${environmentSuffix}`, {
      name: `fraud-transactions-${environmentSuffix}`,
      billingMode: 'PAY_PER_REQUEST',
      hashKey: 'transactionId',
      rangeKey: 'timestamp',
      attributes: [
        { name: 'transactionId', type: 'S' },
        { name: 'timestamp', type: 'N' },
      ],
      pointInTimeRecovery: { enabled: true },
      tags: { ...tags, Name: `fraud-transactions-${environmentSuffix}` },
    }, { parent: this });

    // SNS Topic for fraud alerts
    const fraudAlertsTopic = new aws.sns.Topic(`fraud-alerts-${environmentSuffix}`, {
      name: `fraud-alerts-${environmentSuffix}`,
      tags: { ...tags, Name: `fraud-alerts-${environmentSuffix}` },
    }, { parent: this });

    // SQS Dead Letter Queues
    const analysisQueueDlq = new aws.sqs.Queue(`fraud-analysis-dlq-${environmentSuffix}`, {
      name: `fraud-analysis-dlq-${environmentSuffix}`,
      messageRetentionSeconds: 1209600, // 14 days
      tags: { ...tags, Name: `fraud-analysis-dlq-${environmentSuffix}` },
    }, { parent: this });

    const alertQueueDlq = new aws.sqs.Queue(`alert-dlq-${environmentSuffix}`, {
      name: `alert-dlq-${environmentSuffix}`,
      messageRetentionSeconds: 1209600, // 14 days
      tags: { ...tags, Name: `alert-dlq-${environmentSuffix}` },
    }, { parent: this });

    // SQS Queues
    const fraudAnalysisQueue = new aws.sqs.Queue(`fraud-analysis-queue-${environmentSuffix}`, {
      name: `fraud-analysis-queue-${environmentSuffix}`,
      visibilityTimeoutSeconds: 300,
      redrivePolicy: pulumi.jsonStringify({
        deadLetterTargetArn: analysisQueueDlq.arn,
        maxReceiveCount: 3,
      }),
      tags: { ...tags, Name: `fraud-analysis-queue-${environmentSuffix}` },
    }, { parent: this });

    const alertQueue = new aws.sqs.Queue(`alert-queue-${environmentSuffix}`, {
      name: `alert-queue-${environmentSuffix}`,
      visibilityTimeoutSeconds: 300,
      redrivePolicy: pulumi.jsonStringify({
        deadLetterTargetArn: alertQueueDlq.arn,
        maxReceiveCount: 3,
      }),
      tags: { ...tags, Name: `alert-queue-${environmentSuffix}` },
    }, { parent: this });

    // Lambda Security Group
    const lambdaSg = new aws.ec2.SecurityGroup(`lambda-sg-${environmentSuffix}`, {
      vpcId: vpc.id,
      description: 'Security group for Lambda functions',
      egress: [{
        protocol: '-1',
        fromPort: 0,
        toPort: 0,
        cidrBlocks: ['0.0.0.0/0'],
        description: 'All outbound',
      }],
      tags: { ...tags, Name: `lambda-sg-${environmentSuffix}` },
    }, { parent: this });

    // IAM Role for transaction-ingestion Lambda
    const ingestionRole = new aws.iam.Role(`transaction-ingestion-role-${environmentSuffix}`, {
      name: `transaction-ingestion-role-${environmentSuffix}`,
      assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
        Service: 'lambda.amazonaws.com',
      }),
      tags: { ...tags, Name: `transaction-ingestion-role-${environmentSuffix}` },
    }, { parent: this });

    new aws.iam.RolePolicyAttachment(`ingestion-vpc-policy-${environmentSuffix}`, {
      role: ingestionRole.name,
      policyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole',
    }, { parent: this });

    new aws.iam.RolePolicy(`ingestion-policy-${environmentSuffix}`, {
      role: ingestionRole.id,
      policy: pulumi.all([fraudTable.arn, fraudAnalysisQueue.arn, kmsKey.arn]).apply(([tableArn, queueArn, kmsArn]) =>
        JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'dynamodb:PutItem',
                'dynamodb:UpdateItem',
              ],
              Resource: tableArn,
            },
            {
              Effect: 'Allow',
              Action: ['sqs:SendMessage'],
              Resource: queueArn,
            },
            {
              Effect: 'Allow',
              Action: [
                'kms:Decrypt',
                'kms:DescribeKey',
              ],
              Resource: kmsArn,
            },
          ],
        })
      ),
    }, { parent: this });

    // CloudWatch Log Group for ingestion Lambda
    const ingestionLogGroup = new aws.cloudwatch.LogGroup(`/aws/lambda/transaction-ingestion-${environmentSuffix}`, {
      name: `/aws/lambda/transaction-ingestion-${environmentSuffix}`,
      retentionInDays: 7,
      tags: { ...tags, Name: `/aws/lambda/transaction-ingestion-${environmentSuffix}` },
    }, { parent: this });

    // Transaction Ingestion Lambda
    const ingestionLambda = new aws.lambda.Function(`transaction-ingestion-${environmentSuffix}`, {
      name: `transaction-ingestion-${environmentSuffix}`,
      runtime: 'nodejs20.x',
      architectures: ['arm64'],
      handler: 'index.handler',
      role: ingestionRole.arn,
      code: new pulumi.asset.AssetArchive({
        'index.js': new pulumi.asset.StringAsset(`
exports.handler = async (event) => {
  const AWS = require('aws-sdk');
  const dynamodb = new AWS.DynamoDB.DocumentClient();
  const sqs = new AWS.SQS();

  const body = JSON.parse(event.body || '{}');
  const transactionId = body.transactionId || \`txn-\${Date.now()}\`;
  const timestamp = Date.now();

  // Store in DynamoDB
  await dynamodb.put({
    TableName: process.env.TABLE_NAME,
    Item: {
      transactionId,
      timestamp,
      amount: body.amount,
      userId: body.userId,
      status: 'pending',
      ...body,
    },
  }).promise();

  // Send to SQS for analysis
  await sqs.sendMessage({
    QueueUrl: process.env.QUEUE_URL,
    MessageBody: JSON.stringify({ transactionId, timestamp, ...body }),
  }).promise();

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Transaction received', transactionId }),
  };
};
        `),
      }),
      environment: {
        variables: {
          TABLE_NAME: fraudTable.name,
          QUEUE_URL: fraudAnalysisQueue.url,
        },
      },
      kmsKeyArn: kmsKey.arn,
      vpcConfig: {
        subnetIds: pulumi.output(privateSubnets).apply(subnets => subnets.map(s => s.id)),
        securityGroupIds: [lambdaSg.id],
      },
      reservedConcurrentExecutions: 50,
      timeout: 30,
      memorySize: 512,
      tags: { ...tags, Name: `transaction-ingestion-${environmentSuffix}` },
    }, { parent: this, dependsOn: [ingestionLogGroup] });

    // IAM Role for fraud-detector Lambda
    const detectorRole = new aws.iam.Role(`fraud-detector-role-${environmentSuffix}`, {
      name: `fraud-detector-role-${environmentSuffix}`,
      assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
        Service: 'lambda.amazonaws.com',
      }),
      tags: { ...tags, Name: `fraud-detector-role-${environmentSuffix}` },
    }, { parent: this });

    new aws.iam.RolePolicyAttachment(`detector-vpc-policy-${environmentSuffix}`, {
      role: detectorRole.name,
      policyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole',
    }, { parent: this });

    new aws.iam.RolePolicy(`detector-policy-${environmentSuffix}`, {
      role: detectorRole.id,
      policy: pulumi.all([fraudTable.arn, fraudAnalysisQueue.arn, alertQueue.arn, kmsKey.arn]).apply(([tableArn, analysisQueueArn, alertQueueArn, kmsArn]) =>
        JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'dynamodb:GetItem',
                'dynamodb:Query',
                'dynamodb:UpdateItem',
              ],
              Resource: tableArn,
            },
            {
              Effect: 'Allow',
              Action: [
                'sqs:ReceiveMessage',
                'sqs:DeleteMessage',
                'sqs:GetQueueAttributes',
              ],
              Resource: analysisQueueArn,
            },
            {
              Effect: 'Allow',
              Action: ['sqs:SendMessage'],
              Resource: alertQueueArn,
            },
            {
              Effect: 'Allow',
              Action: [
                'kms:Decrypt',
                'kms:DescribeKey',
              ],
              Resource: kmsArn,
            },
          ],
        })
      ),
    }, { parent: this });

    // CloudWatch Log Group for detector Lambda
    const detectorLogGroup = new aws.cloudwatch.LogGroup(`/aws/lambda/fraud-detector-${environmentSuffix}`, {
      name: `/aws/lambda/fraud-detector-${environmentSuffix}`,
      retentionInDays: 7,
      tags: { ...tags, Name: `/aws/lambda/fraud-detector-${environmentSuffix}` },
    }, { parent: this });

    // Fraud Detector Lambda
    const detectorLambda = new aws.lambda.Function(`fraud-detector-${environmentSuffix}`, {
      name: `fraud-detector-${environmentSuffix}`,
      runtime: 'nodejs20.x',
      architectures: ['arm64'],
      handler: 'index.handler',
      role: detectorRole.arn,
      code: new pulumi.asset.AssetArchive({
        'index.js': new pulumi.asset.StringAsset(`
exports.handler = async (event) => {
  const AWS = require('aws-sdk');
  const dynamodb = new AWS.DynamoDB.DocumentClient();
  const sqs = new AWS.SQS();

  // Process SQS messages
  for (const record of event.Records || []) {
    const transaction = JSON.parse(record.body);

    // Simple fraud detection logic
    const isFraudulent = transaction.amount > 10000;

    // Update DynamoDB
    await dynamodb.update({
      TableName: process.env.TABLE_NAME,
      Key: {
        transactionId: transaction.transactionId,
        timestamp: transaction.timestamp,
      },
      UpdateExpression: 'SET #status = :status, fraudScore = :score',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: {
        ':status': isFraudulent ? 'flagged' : 'approved',
        ':score': isFraudulent ? 0.9 : 0.1,
      },
    }).promise();

    // Send to alert queue if fraudulent
    if (isFraudulent) {
      await sqs.sendMessage({
        QueueUrl: process.env.ALERT_QUEUE_URL,
        MessageBody: JSON.stringify({
          ...transaction,
          fraudScore: 0.9,
          reason: 'High amount',
        }),
      }).promise();
    }
  }

  return { statusCode: 200, body: 'Processed' };
};
        `),
      }),
      environment: {
        variables: {
          TABLE_NAME: fraudTable.name,
          ALERT_QUEUE_URL: alertQueue.url,
        },
      },
      kmsKeyArn: kmsKey.arn,
      vpcConfig: {
        subnetIds: pulumi.output(privateSubnets).apply(subnets => subnets.map(s => s.id)),
        securityGroupIds: [lambdaSg.id],
      },
      reservedConcurrentExecutions: 30,
      timeout: 60,
      memorySize: 512,
      tags: { ...tags, Name: `fraud-detector-${environmentSuffix}` },
    }, { parent: this, dependsOn: [detectorLogGroup] });

    // Event source mapping for fraud detector
    new aws.lambda.EventSourceMapping(`fraud-detector-sqs-trigger-${environmentSuffix}`, {
      eventSourceArn: fraudAnalysisQueue.arn,
      functionName: detectorLambda.name,
      batchSize: 10,
      maximumBatchingWindowInSeconds: 5,
    }, { parent: this });

    // IAM Role for alert-dispatcher Lambda
    const alertRole = new aws.iam.Role(`alert-dispatcher-role-${environmentSuffix}`, {
      name: `alert-dispatcher-role-${environmentSuffix}`,
      assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
        Service: 'lambda.amazonaws.com',
      }),
      tags: { ...tags, Name: `alert-dispatcher-role-${environmentSuffix}` },
    }, { parent: this });

    new aws.iam.RolePolicyAttachment(`alert-vpc-policy-${environmentSuffix}`, {
      role: alertRole.name,
      policyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole',
    }, { parent: this });

    new aws.iam.RolePolicy(`alert-policy-${environmentSuffix}`, {
      role: alertRole.id,
      policy: pulumi.all([alertQueue.arn, fraudAlertsTopic.arn, kmsKey.arn]).apply(([queueArn, topicArn, kmsArn]) =>
        JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'sqs:ReceiveMessage',
                'sqs:DeleteMessage',
                'sqs:GetQueueAttributes',
              ],
              Resource: queueArn,
            },
            {
              Effect: 'Allow',
              Action: ['sns:Publish'],
              Resource: topicArn,
            },
            {
              Effect: 'Allow',
              Action: [
                'kms:Decrypt',
                'kms:DescribeKey',
              ],
              Resource: kmsArn,
            },
          ],
        })
      ),
    }, { parent: this });

    // CloudWatch Log Group for alert Lambda
    const alertLogGroup = new aws.cloudwatch.LogGroup(`/aws/lambda/alert-dispatcher-${environmentSuffix}`, {
      name: `/aws/lambda/alert-dispatcher-${environmentSuffix}`,
      retentionInDays: 7,
      tags: { ...tags, Name: `/aws/lambda/alert-dispatcher-${environmentSuffix}` },
    }, { parent: this });

    // Alert Dispatcher Lambda
    const alertLambda = new aws.lambda.Function(`alert-dispatcher-${environmentSuffix}`, {
      name: `alert-dispatcher-${environmentSuffix}`,
      runtime: 'nodejs20.x',
      architectures: ['arm64'],
      handler: 'index.handler',
      role: alertRole.arn,
      code: new pulumi.asset.AssetArchive({
        'index.js': new pulumi.asset.StringAsset(`
exports.handler = async (event) => {
  const AWS = require('aws-sdk');
  const sns = new AWS.SNS();

  // Process SQS messages
  for (const record of event.Records || []) {
    const alert = JSON.parse(record.body);

    // Send SNS notification
    await sns.publish({
      TopicArn: process.env.TOPIC_ARN,
      Subject: 'Fraud Alert',
      Message: JSON.stringify(alert, null, 2),
    }).promise();
  }

  return { statusCode: 200, body: 'Alerts sent' };
};
        `),
      }),
      environment: {
        variables: {
          TOPIC_ARN: fraudAlertsTopic.arn,
        },
      },
      kmsKeyArn: kmsKey.arn,
      vpcConfig: {
        subnetIds: pulumi.output(privateSubnets).apply(subnets => subnets.map(s => s.id)),
        securityGroupIds: [lambdaSg.id],
      },
      reservedConcurrentExecutions: 20,
      timeout: 30,
      memorySize: 256,
      tags: { ...tags, Name: `alert-dispatcher-${environmentSuffix}` },
    }, { parent: this, dependsOn: [alertLogGroup] });

    // Event source mapping for alert dispatcher
    new aws.lambda.EventSourceMapping(`alert-dispatcher-sqs-trigger-${environmentSuffix}`, {
      eventSourceArn: alertQueue.arn,
      functionName: alertLambda.name,
      batchSize: 10,
      maximumBatchingWindowInSeconds: 5,
    }, { parent: this });

    // EventBridge rule for batch processing
    const batchProcessingRule = new aws.cloudwatch.EventRule(`fraud-batch-rule-${environmentSuffix}`, {
      name: `fraud-batch-rule-${environmentSuffix}`,
      description: 'Trigger fraud detector every 5 minutes',
      scheduleExpression: 'rate(5 minutes)',
      tags: { ...tags, Name: `fraud-batch-rule-${environmentSuffix}` },
    }, { parent: this });

    new aws.lambda.Permission(`fraud-batch-permission-${environmentSuffix}`, {
      action: 'lambda:InvokeFunction',
      function: detectorLambda.name,
      principal: 'events.amazonaws.com',
      sourceArn: batchProcessingRule.arn,
    }, { parent: this });

    new aws.cloudwatch.EventTarget(`fraud-batch-target-${environmentSuffix}`, {
      rule: batchProcessingRule.name,
      arn: detectorLambda.arn,
    }, { parent: this });

    // API Gateway
    const api = new aws.apigateway.RestApi(`fraud-api-${environmentSuffix}`, {
      name: `fraud-api-${environmentSuffix}`,
      description: 'Fraud Detection API',
      tags: { ...tags, Name: `fraud-api-${environmentSuffix}` },
    }, { parent: this });

    const transactionsResource = new aws.apigateway.Resource(`transactions-resource-${environmentSuffix}`, {
      restApi: api.id,
      parentId: api.rootResourceId,
      pathPart: 'transactions',
    }, { parent: this });

    const postMethod = new aws.apigateway.Method(`post-method-${environmentSuffix}`, {
      restApi: api.id,
      resourceId: transactionsResource.id,
      httpMethod: 'POST',
      authorization: 'NONE',
      requestValidatorId: new aws.apigateway.RequestValidator(`request-validator-${environmentSuffix}`, {
        restApi: api.id,
        name: `request-validator-${environmentSuffix}`,
        validateRequestBody: true,
      }, { parent: this }).id,
    }, { parent: this });

    new aws.apigateway.Integration(`post-integration-${environmentSuffix}`, {
      restApi: api.id,
      resourceId: transactionsResource.id,
      httpMethod: postMethod.httpMethod,
      integrationHttpMethod: 'POST',
      type: 'AWS_PROXY',
      uri: ingestionLambda.invokeArn,
    }, { parent: this });

    new aws.lambda.Permission(`api-lambda-permission-${environmentSuffix}`, {
      action: 'lambda:InvokeFunction',
      function: ingestionLambda.name,
      principal: 'apigateway.amazonaws.com',
      sourceArn: pulumi.interpolate`${api.executionArn}/*/*`,
    }, { parent: this });

    const deployment = new aws.apigateway.Deployment(`api-deployment-${environmentSuffix}`, {
      restApi: api.id,
      triggers: {
        redeployment: pulumi.all([
          transactionsResource.id,
          postMethod.id,
        ]).apply(([resourceId, methodId]) =>
          JSON.stringify({ resourceId, methodId })
        ),
      },
    }, { parent: this, dependsOn: [postMethod] });

    const stage = new aws.apigateway.Stage(`api-stage-${environmentSuffix}`, {
      deployment: deployment.id,
      restApi: api.id,
      stageName: environmentSuffix,
      tags: { ...tags, Name: `api-stage-${environmentSuffix}` },
    }, { parent: this });

    // Stage throttling settings
    new aws.apigateway.MethodSettings(`method-settings-${environmentSuffix}`, {
      restApi: api.id,
      stageName: stage.stageName,
      methodPath: '*/*',
      settings: {
        throttlingBurstLimit: 1000,
        throttlingRateLimit: 1000,
      },
    }, { parent: this });

    // Outputs
    this.apiEndpoint = pulumi.interpolate`${api.id}.execute-api.${region}.amazonaws.com/${stage.stageName}/transactions`;
    this.tableArn = fraudTable.arn;

    this.registerOutputs({
      apiEndpoint: this.apiEndpoint,
      tableArn: this.tableArn,
      tableName: fraudTable.name,
      ingestionFunctionName: ingestionLambda.name,
      detectorFunctionName: detectorLambda.name,
      alertFunctionName: alertLambda.name,
      queueUrl: fraudAnalysisQueue.url,
      topicArn: fraudAlertsTopic.arn,
    });
  }
}
```

## File: bin/tap.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

const config = new pulumi.Config();

const environmentSuffix =
  process.env.ENVIRONMENT_SUFFIX || config.get('env') || 'dev';

const repository = config.get('repository') || 'unknown';
const commitAuthor = config.get('commitAuthor') || 'unknown';

const defaultTags = {
  Environment: environmentSuffix,
  Repository: repository,
  Author: commitAuthor,
};

const stack = new TapStack('pulumi-infra', {
  environmentSuffix,
  tags: defaultTags,
});

export const apiEndpoint = stack.apiEndpoint;
export const tableArn = stack.tableArn;
```

## Implementation Notes

This initial implementation provides:

1. **VPC with Private Subnets**: 3 AZs in us-east-2
2. **VPC Endpoints**: Gateway endpoint for DynamoDB, Interface endpoints for SQS and SNS
3. **DynamoDB Table**: fraud-transactions with PITR enabled
4. **Lambda Functions**: All three functions with ARM64, Node.js 20, VPC configuration
5. **SQS Queues**: With DLQs and proper retention
6. **API Gateway**: REST API with POST endpoint and throttling
7. **EventBridge**: 5-minute scheduled rule
8. **SNS Topic**: For fraud alerts
9. **IAM Roles**: Separate roles for each Lambda with least-privilege
10. **KMS Encryption**: Customer-managed key for Lambda environment variables
11. **CloudWatch Logs**: 7-day retention for all Lambdas

All resources follow the naming convention with environmentSuffix.