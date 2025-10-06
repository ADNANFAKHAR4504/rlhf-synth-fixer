import { Construct } from 'constructs';
import { TerraformOutput } from 'cdktf';
import { DynamodbTable } from '@cdktf/provider-aws/lib/dynamodb-table';
import { ApiGatewayRestApi } from '@cdktf/provider-aws/lib/api-gateway-rest-api';
import { ApiGatewayResource } from '@cdktf/provider-aws/lib/api-gateway-resource';
import { ApiGatewayMethod } from '@cdktf/provider-aws/lib/api-gateway-method';
import { ApiGatewayIntegration } from '@cdktf/provider-aws/lib/api-gateway-integration';
import { ApiGatewayDeployment } from '@cdktf/provider-aws/lib/api-gateway-deployment';
import { ApiGatewayStage } from '@cdktf/provider-aws/lib/api-gateway-stage';
import { ApiGatewayRequestValidator } from '@cdktf/provider-aws/lib/api-gateway-request-validator';
import { LambdaFunction } from '@cdktf/provider-aws/lib/lambda-function';
import { LambdaPermission } from '@cdktf/provider-aws/lib/lambda-permission';
import { LambdaEventSourceMapping } from '@cdktf/provider-aws/lib/lambda-event-source-mapping';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { SnsTopic } from '@cdktf/provider-aws/lib/sns-topic';
import { CloudwatchDashboard } from '@cdktf/provider-aws/lib/cloudwatch-dashboard';
import { CloudwatchMetricAlarm } from '@cdktf/provider-aws/lib/cloudwatch-metric-alarm';
import { CloudwatchEventRule } from '@cdktf/provider-aws/lib/cloudwatch-event-rule';
import { CloudwatchEventTarget } from '@cdktf/provider-aws/lib/cloudwatch-event-target';
import { DataArchiveFile } from '@cdktf/provider-archive/lib/data-archive-file';
import { ArchiveProvider } from '@cdktf/provider-archive/lib/provider';
import * as path from 'path';

interface LoyaltyProgramStackProps {
  environmentSuffix: string;
}

export class LoyaltyProgramStack extends Construct {
  constructor(scope: Construct, id: string, props: LoyaltyProgramStackProps) {
    super(scope, id);

    new ArchiveProvider(this, 'archive-provider');

    // DynamoDB Table for Members
    const membersTable = new DynamodbTable(this, 'members-table', {
      name: `loyalty-members-${props.environmentSuffix}`,
      billingMode: 'PAY_PER_REQUEST',
      hashKey: 'memberId',
      rangeKey: 'transactionId',
      streamEnabled: true,
      streamViewType: 'NEW_AND_OLD_IMAGES',
      attribute: [
        {
          name: 'memberId',
          type: 'S',
        },
        {
          name: 'transactionId',
          type: 'S',
        },
        {
          name: 'email',
          type: 'S',
        },
      ],
      globalSecondaryIndex: [
        {
          name: 'email-index',
          hashKey: 'email',
          projectionType: 'ALL',
        },
      ],
      pointInTimeRecovery: {
        enabled: true,
      },
      serverSideEncryption: {
        enabled: true,
      },
      tags: {
        Name: `loyalty-members-${props.environmentSuffix}`,
      },
    });

    // SNS Topic for Notifications
    const notificationTopic = new SnsTopic(this, 'notification-topic', {
      name: `loyalty-notifications-${props.environmentSuffix}`,
      displayName: 'Loyalty Program Notifications',
      kmsMasterKeyId: 'alias/aws/sns',
      tags: {
        Name: `loyalty-notifications-${props.environmentSuffix}`,
      },
    });

    // IAM Role for Point Calculation Lambda
    const pointCalcLambdaRole = new IamRole(this, 'point-calc-lambda-role', {
      name: `loyalty-point-calc-lambda-${props.environmentSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'lambda.amazonaws.com',
            },
          },
        ],
      }),
    });

    // IAM Policy for Point Calculation Lambda
    const pointCalcPolicy = new IamPolicy(this, 'point-calc-policy', {
      name: `loyalty-point-calc-${props.environmentSuffix}`,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'dynamodb:GetItem',
              'dynamodb:PutItem',
              'dynamodb:UpdateItem',
              'dynamodb:Query',
              'dynamodb:TransactWriteItems',
            ],
            Resource: [membersTable.arn, `${membersTable.arn}/index/*`],
          },
          {
            Effect: 'Allow',
            Action: ['sns:Publish'],
            Resource: notificationTopic.arn,
          },
          {
            Effect: 'Allow',
            Action: [
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
              'logs:PutLogEvents',
            ],
            Resource: 'arn:aws:logs:*:*:*',
          },
        ],
      }),
    });

    new IamRolePolicyAttachment(this, 'point-calc-policy-attachment', {
      role: pointCalcLambdaRole.name,
      policyArn: pointCalcPolicy.arn,
    });

    // Package Lambda Functions
    const pointCalcLambdaAsset = new DataArchiveFile(
      this,
      'point-calc-lambda-zip',
      {
        type: 'zip',
        outputPath: 'point-calc-lambda.zip',
        sourceDir: path.join(__dirname, 'lambda', 'point-calc'),
      }
    );

    // Point Calculation Lambda
    const pointCalcLambda = new LambdaFunction(this, 'point-calc-lambda', {
      functionName: `loyalty-point-calc-${props.environmentSuffix}`,
      role: pointCalcLambdaRole.arn,
      handler: 'index.handler',
      runtime: 'nodejs20.x',
      filename: pointCalcLambdaAsset.outputPath,
      sourceCodeHash: pointCalcLambdaAsset.outputBase64Sha256,
      timeout: 30,
      memorySize: 256,
      environment: {
        variables: {
          LOYALTY_TABLE_NAME: membersTable.name,
          SNS_TOPIC_ARN: notificationTopic.arn,
        },
      },
    });

    // IAM Role for Stream Processing Lambda
    const streamProcessorRole = new IamRole(this, 'stream-processor-role', {
      name: `loyalty-stream-processor-${props.environmentSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'lambda.amazonaws.com',
            },
          },
        ],
      }),
    });

    // IAM Policy for Stream Processing Lambda
    const streamProcessorPolicy = new IamPolicy(
      this,
      'stream-processor-policy',
      {
        name: `loyalty-stream-processor-${props.environmentSuffix}`,
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'dynamodb:DescribeStream',
                'dynamodb:GetRecords',
                'dynamodb:GetShardIterator',
                'dynamodb:ListStreams',
              ],
              Resource: `${membersTable.arn}/stream/*`,
            },
            {
              Effect: 'Allow',
              Action: ['sns:Publish'],
              Resource: notificationTopic.arn,
            },
            {
              Effect: 'Allow',
              Action: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
              ],
              Resource: 'arn:aws:logs:*:*:*',
            },
          ],
        }),
      }
    );

    new IamRolePolicyAttachment(this, 'stream-processor-policy-attachment', {
      role: streamProcessorRole.name,
      policyArn: streamProcessorPolicy.arn,
    });

    // Stream Processing Lambda Asset
    const streamProcessorLambdaAsset = new DataArchiveFile(
      this,
      'stream-processor-lambda-zip',
      {
        type: 'zip',
        outputPath: 'stream-processor-lambda.zip',
        sourceDir: path.join(__dirname, 'lambda', 'stream-processor'),
      }
    );

    // Stream Processing Lambda
    const streamProcessorLambda = new LambdaFunction(
      this,
      'stream-processor-lambda',
      {
        functionName: `loyalty-stream-processor-${props.environmentSuffix}`,
        role: streamProcessorRole.arn,
        handler: 'index.handler',
        runtime: 'nodejs20.x',
        filename: streamProcessorLambdaAsset.outputPath,
        sourceCodeHash: streamProcessorLambdaAsset.outputBase64Sha256,
        timeout: 60,
        memorySize: 256,
        environment: {
          variables: {
            LOYALTY_TABLE_NAME: membersTable.name,
            SNS_TOPIC_ARN: notificationTopic.arn,
          },
        },
      }
    );

    // DynamoDB Stream Event Source Mapping
    new LambdaEventSourceMapping(this, 'stream-event-mapping', {
      eventSourceArn: membersTable.streamArn!,
      functionName: streamProcessorLambda.arn,
      startingPosition: 'LATEST',
      maximumBatchingWindowInSeconds: 5,
      parallelizationFactor: 10,
      maximumRetryAttempts: 3,
    });

    // API Gateway
    const api = new ApiGatewayRestApi(this, 'loyalty-api', {
      name: `loyalty-api-${props.environmentSuffix}`,
      description: 'Loyalty Program API',
      endpointConfiguration: {
        types: ['REGIONAL'],
      },
    });

    // Request Validator
    const requestValidator = new ApiGatewayRequestValidator(
      this,
      'request-validator',
      {
        restApiId: api.id,
        name: 'request-validator',
        validateRequestBody: true,
        validateRequestParameters: true,
      }
    );

    // API Resources
    const transactionsResource = new ApiGatewayResource(
      this,
      'transactions-resource',
      {
        restApiId: api.id,
        parentId: api.rootResourceId,
        pathPart: 'transactions',
      }
    );

    // API Method
    const transactionMethod = new ApiGatewayMethod(this, 'transaction-method', {
      restApiId: api.id,
      resourceId: transactionsResource.id,
      httpMethod: 'POST',
      authorization: 'NONE',
      requestValidatorId: requestValidator.id,
    });

    // API Integration
    new ApiGatewayIntegration(this, 'transaction-integration', {
      restApiId: api.id,
      resourceId: transactionsResource.id,
      httpMethod: transactionMethod.httpMethod,
      integrationHttpMethod: 'POST',
      type: 'AWS_PROXY',
      uri: pointCalcLambda.invokeArn,
    });

    // Lambda Permission for API Gateway
    new LambdaPermission(this, 'api-lambda-permission', {
      statementId: 'AllowAPIGatewayInvoke',
      action: 'lambda:InvokeFunction',
      functionName: pointCalcLambda.functionName,
      principal: 'apigateway.amazonaws.com',
      sourceArn: `${api.executionArn}/*/*`,
    });

    // API Deployment
    const deployment = new ApiGatewayDeployment(this, 'api-deployment', {
      restApiId: api.id,
      dependsOn: [transactionMethod],
    });

    // API Stage with Throttling
    new ApiGatewayStage(this, 'api-stage', {
      deploymentId: deployment.id,
      restApiId: api.id,
      stageName: props.environmentSuffix,
    });

    // EventBridge Rule for Periodic Tier Review
    const tierReviewRule = new CloudwatchEventRule(this, 'tier-review-rule', {
      name: `loyalty-tier-review-${props.environmentSuffix}`,
      description: 'Periodic tier review for loyalty members',
      scheduleExpression: 'rate(1 day)',
    });

    new CloudwatchEventTarget(this, 'tier-review-target', {
      rule: tierReviewRule.name,
      arn: streamProcessorLambda.arn,
    });

    new LambdaPermission(this, 'eventbridge-lambda-permission', {
      statementId: 'AllowEventBridgeInvoke',
      action: 'lambda:InvokeFunction',
      functionName: streamProcessorLambda.functionName,
      principal: 'events.amazonaws.com',
      sourceArn: tierReviewRule.arn,
    });

    // CloudWatch Alarms
    new CloudwatchMetricAlarm(this, 'high-transaction-volume-alarm', {
      alarmName: `loyalty-high-transactions-${props.environmentSuffix}`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'Invocations',
      namespace: 'AWS/Lambda',
      period: 300,
      statistic: 'Sum',
      threshold: 1000,
      alarmDescription: 'Alert when transaction volume is high',
      dimensions: {
        FunctionName: pointCalcLambda.functionName,
      },
    });

    new CloudwatchMetricAlarm(this, 'failed-transactions-alarm', {
      alarmName: `loyalty-failed-transactions-${props.environmentSuffix}`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 1,
      metricName: 'Errors',
      namespace: 'AWS/Lambda',
      period: 300,
      statistic: 'Sum',
      threshold: 10,
      alarmDescription: 'Alert when transactions are failing',
      dimensions: {
        FunctionName: pointCalcLambda.functionName,
      },
    });

    // CloudWatch Dashboard
    new CloudwatchDashboard(this, 'loyalty-dashboard', {
      dashboardName: `loyalty-metrics-${props.environmentSuffix}`,
      dashboardBody: JSON.stringify({
        widgets: [
          {
            type: 'metric',
            properties: {
              metrics: [
                [
                  'AWS/Lambda',
                  'Invocations',
                  { stat: 'Sum', label: 'Total Transactions' },
                ],
                ['.', 'Errors', { stat: 'Sum', label: 'Failed Transactions' }],
                ['.', 'Duration', { stat: 'Average', label: 'Avg Duration' }],
              ],
              view: 'timeSeries',
              stacked: false,
              region: 'us-west-2',
              title: 'Transaction Metrics',
              period: 300,
            },
          },
          {
            type: 'metric',
            properties: {
              metrics: [
                ['AWS/DynamoDB', 'UserErrors', { stat: 'Sum' }],
                ['.', 'SystemErrors', { stat: 'Sum' }],
                ['.', 'ConsumedReadCapacityUnits', { stat: 'Sum' }],
                ['.', 'ConsumedWriteCapacityUnits', { stat: 'Sum' }],
              ],
              view: 'timeSeries',
              stacked: false,
              region: 'us-west-2',
              title: 'DynamoDB Metrics',
              period: 300,
            },
          },
        ],
      }),
    });

    // Outputs
    new TerraformOutput(this, 'members-table-name', {
      value: membersTable.name,
      description: 'DynamoDB table name for loyalty members',
    });

    new TerraformOutput(this, 'members-table-arn', {
      value: membersTable.arn,
      description: 'DynamoDB table ARN for loyalty members',
    });

    new TerraformOutput(this, 'api-endpoint', {
      value: `${api.id}.execute-api.${api.region}.amazonaws.com/${props.environmentSuffix}`,
      description: 'API Gateway endpoint',
    });

    new TerraformOutput(this, 'api-url', {
      value: `https://${api.id}.execute-api.${api.region}.amazonaws.com/${props.environmentSuffix}/transactions`,
      description: 'Full API URL for transactions endpoint',
    });

    new TerraformOutput(this, 'point-calc-lambda-name', {
      value: pointCalcLambda.functionName,
      description: 'Point calculation Lambda function name',
    });

    new TerraformOutput(this, 'point-calc-lambda-arn', {
      value: pointCalcLambda.arn,
      description: 'Point calculation Lambda function ARN',
    });

    new TerraformOutput(this, 'stream-processor-lambda-name', {
      value: streamProcessorLambda.functionName,
      description: 'Stream processor Lambda function name',
    });

    new TerraformOutput(this, 'stream-processor-lambda-arn', {
      value: streamProcessorLambda.arn,
      description: 'Stream processor Lambda function ARN',
    });

    new TerraformOutput(this, 'notification-topic-arn', {
      value: notificationTopic.arn,
      description: 'SNS topic ARN for notifications',
    });

    new TerraformOutput(this, 'dashboard-name', {
      value: `loyalty-metrics-${props.environmentSuffix}`,
      description: 'CloudWatch dashboard name',
    });
  }
}
