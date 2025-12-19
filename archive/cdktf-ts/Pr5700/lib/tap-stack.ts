import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { DynamodbTable } from '@cdktf/provider-aws/lib/dynamodb-table';
import { SqsQueue } from '@cdktf/provider-aws/lib/sqs-queue';
import { LambdaFunction } from '@cdktf/provider-aws/lib/lambda-function';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { ApiGatewayRestApi } from '@cdktf/provider-aws/lib/api-gateway-rest-api';
import { ApiGatewayResource } from '@cdktf/provider-aws/lib/api-gateway-resource';
import { ApiGatewayMethod } from '@cdktf/provider-aws/lib/api-gateway-method';
import { ApiGatewayIntegration } from '@cdktf/provider-aws/lib/api-gateway-integration';
import { ApiGatewayDeployment } from '@cdktf/provider-aws/lib/api-gateway-deployment';
import { ApiGatewayStage } from '@cdktf/provider-aws/lib/api-gateway-stage';
import { ApiGatewayMethodSettings } from '@cdktf/provider-aws/lib/api-gateway-method-settings';
import { LambdaPermission } from '@cdktf/provider-aws/lib/lambda-permission';
import { LambdaEventSourceMapping } from '@cdktf/provider-aws/lib/lambda-event-source-mapping';
import { CloudwatchMetricAlarm } from '@cdktf/provider-aws/lib/cloudwatch-metric-alarm';
import { Fn, ITerraformDependable } from 'cdktf';
import * as path from 'path';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
}

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';

    // Use AWS_REGION_OVERRIDE if set, otherwise use props or default to ap-southeast-1
    const AWS_REGION_OVERRIDE = process.env.AWS_REGION_OVERRIDE;
    const awsRegion = AWS_REGION_OVERRIDE
      ? AWS_REGION_OVERRIDE
      : props?.awsRegion || 'ap-southeast-1';

    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    const defaultTags = props?.defaultTags ? [props.defaultTags] : [];

    // Configure AWS Provider
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    // Get current AWS account information
    const current = new DataAwsCallerIdentity(this, 'current');

    // Configure S3 Backend with native state locking
    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });

    // S3 Bucket for processed webhook results
    // Use account ID in bucket name to ensure global uniqueness and prevent conflicts on redeployment
    const resultsBucket = new S3Bucket(
      this,
      `webhook-results-${environmentSuffix}`,
      {
        bucket: `webhook-results-${environmentSuffix}-${current.accountId}`,
        tags: {
          Environment: 'Production',
          Team: 'Platform',
        },
      }
    );

    // Enable versioning on S3 bucket
    new S3BucketVersioningA(
      this,
      `webhook-results-versioning-${environmentSuffix}`,
      {
        bucket: resultsBucket.id,
        versioningConfiguration: {
          status: 'Enabled',
        },
      }
    );

    // DynamoDB Table for webhook metadata
    const webhookTable = new DynamodbTable(
      this,
      `webhook-table-${environmentSuffix}`,
      {
        name: `webhook-table-${environmentSuffix}`,
        billingMode: 'PAY_PER_REQUEST',
        hashKey: 'webhookId',
        attribute: [
          {
            name: 'webhookId',
            type: 'S',
          },
        ],
        ttl: {
          enabled: true,
          attributeName: 'expiryTime',
        },
        tags: {
          Environment: 'Production',
          Team: 'Platform',
        },
      }
    );

    // Dead Letter Queue for failed messages
    const dlq = new SqsQueue(this, `webhook-dlq-${environmentSuffix}`, {
      name: `webhook-dlq-${environmentSuffix}`,
      messageRetentionSeconds: 1209600, // 14 days
      tags: {
        Environment: 'Production',
        Team: 'Platform',
      },
    });

    // Main SQS Queue for webhook processing
    const webhookQueue = new SqsQueue(
      this,
      `webhook-queue-${environmentSuffix}`,
      {
        name: `webhook-queue-${environmentSuffix}`,
        visibilityTimeoutSeconds: 180, // 6 times the Lambda timeout (30 * 6)
        redrivePolicy: JSON.stringify({
          deadLetterTargetArn: dlq.arn,
          maxReceiveCount: 3,
        }),
        tags: {
          Environment: 'Production',
          Team: 'Platform',
        },
      }
    );

    // IAM Role for Webhook Validator Lambda
    const validatorRole = new IamRole(
      this,
      `webhook-validator-role-${environmentSuffix}`,
      {
        name: `webhook-validator-role-${environmentSuffix}`,
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
              Effect: 'Allow',
            },
          ],
        }),
        tags: {
          Environment: 'Production',
          Team: 'Platform',
        },
      }
    );

    // Attach basic Lambda execution policy
    new IamRolePolicyAttachment(
      this,
      `validator-basic-execution-${environmentSuffix}`,
      {
        role: validatorRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      }
    );

    // Attach X-Ray write access
    new IamRolePolicyAttachment(
      this,
      `validator-xray-access-${environmentSuffix}`,
      {
        role: validatorRole.name,
        policyArn: 'arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess',
      }
    );

    // IAM Policy for DynamoDB and SQS access
    const validatorPolicy = new IamPolicy(
      this,
      `validator-policy-${environmentSuffix}`,
      {
        name: `webhook-validator-policy-${environmentSuffix}`,
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'dynamodb:PutItem',
                'dynamodb:GetItem',
                'dynamodb:Query',
              ],
              Resource: webhookTable.arn,
            },
            {
              Effect: 'Allow',
              Action: ['sqs:SendMessage'],
              Resource: webhookQueue.arn,
            },
          ],
        }),
        tags: {
          Environment: 'Production',
          Team: 'Platform',
        },
      }
    );

    new IamRolePolicyAttachment(
      this,
      `validator-policy-attachment-${environmentSuffix}`,
      {
        role: validatorRole.name,
        policyArn: validatorPolicy.arn,
      }
    );

    // Lambda function for webhook validation
    // Use path.resolve to reference lib directory from project root
    const lambdaBasePath = path.resolve(process.cwd(), 'lib', 'lambda');
    const validatorLambda = new LambdaFunction(
      this,
      `webhook-validator-${environmentSuffix}`,
      {
        functionName: `webhook-validator-${environmentSuffix}`,
        runtime: 'nodejs18.x',
        handler: 'index.handler',
        memorySize: 512,
        timeout: 30,
        role: validatorRole.arn,
        filename: path.join(lambdaBasePath, 'validator.zip'),
        sourceCodeHash: Fn.filebase64sha256(
          path.join(lambdaBasePath, 'validator.zip')
        ),
        environment: {
          variables: {
            TABLE_NAME: webhookTable.name,
            QUEUE_URL: webhookQueue.url,
          },
        },
        tracingConfig: {
          mode: 'Active',
        },
        tags: {
          Environment: 'Production',
          Team: 'Platform',
        },
      }
    );

    // IAM Role for Webhook Processor Lambda
    const processorRole = new IamRole(
      this,
      `webhook-processor-role-${environmentSuffix}`,
      {
        name: `webhook-processor-role-${environmentSuffix}`,
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
              Effect: 'Allow',
            },
          ],
        }),
        tags: {
          Environment: 'Production',
          Team: 'Platform',
        },
      }
    );

    // Attach basic Lambda execution policy
    new IamRolePolicyAttachment(
      this,
      `processor-basic-execution-${environmentSuffix}`,
      {
        role: processorRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      }
    );

    // Attach X-Ray write access
    new IamRolePolicyAttachment(
      this,
      `processor-xray-access-${environmentSuffix}`,
      {
        role: processorRole.name,
        policyArn: 'arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess',
      }
    );

    // IAM Policy for S3 and SQS access
    const processorPolicy = new IamPolicy(
      this,
      `processor-policy-${environmentSuffix}`,
      {
        name: `webhook-processor-policy-${environmentSuffix}`,
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: ['s3:PutObject', 's3:PutObjectAcl'],
              Resource: `${resultsBucket.arn}/*`,
            },
            {
              Effect: 'Allow',
              Action: [
                'sqs:ReceiveMessage',
                'sqs:DeleteMessage',
                'sqs:GetQueueAttributes',
              ],
              Resource: webhookQueue.arn,
            },
            {
              Effect: 'Allow',
              Action: ['dynamodb:UpdateItem', 'dynamodb:GetItem'],
              Resource: webhookTable.arn,
            },
          ],
        }),
        tags: {
          Environment: 'Production',
          Team: 'Platform',
        },
      }
    );

    new IamRolePolicyAttachment(
      this,
      `processor-policy-attachment-${environmentSuffix}`,
      {
        role: processorRole.name,
        policyArn: processorPolicy.arn,
      }
    );

    // Lambda function for webhook processing
    const processorLambda = new LambdaFunction(
      this,
      `webhook-processor-${environmentSuffix}`,
      {
        functionName: `webhook-processor-${environmentSuffix}`,
        runtime: 'nodejs18.x',
        handler: 'index.handler',
        memorySize: 512,
        timeout: 30,
        role: processorRole.arn,
        filename: path.join(lambdaBasePath, 'processor.zip'),
        sourceCodeHash: Fn.filebase64sha256(
          path.join(lambdaBasePath, 'processor.zip')
        ),
        environment: {
          variables: {
            BUCKET_NAME: resultsBucket.bucket,
            TABLE_NAME: webhookTable.name,
          },
        },
        tracingConfig: {
          mode: 'Active',
        },
        tags: {
          Environment: 'Production',
          Team: 'Platform',
        },
      }
    );

    // Event source mapping from SQS to processor Lambda
    // Add lifecycle configuration to handle updates properly on redeployment
    new LambdaEventSourceMapping(
      this,
      `processor-event-source-${environmentSuffix}`,
      {
        eventSourceArn: webhookQueue.arn,
        functionName: processorLambda.functionName,
        batchSize: 10,
        lifecycle: {
          createBeforeDestroy: true,
        },
      }
    );

    // API Gateway REST API
    const api = new ApiGatewayRestApi(
      this,
      `webhook-api-${environmentSuffix}`,
      {
        name: `webhook-api-${environmentSuffix}`,
        description: 'Webhook Processing API',
        endpointConfiguration: {
          types: ['REGIONAL'],
        },
        tags: {
          Environment: 'Production',
          Team: 'Platform',
        },
      }
    );

    // API Gateway Resource for /webhooks
    const webhooksResource = new ApiGatewayResource(
      this,
      `webhooks-resource-${environmentSuffix}`,
      {
        restApiId: api.id,
        parentId: api.rootResourceId,
        pathPart: 'webhooks',
      }
    );

    // POST method for webhook submission
    const postMethod = new ApiGatewayMethod(
      this,
      `webhooks-post-method-${environmentSuffix}`,
      {
        restApiId: api.id,
        resourceId: webhooksResource.id,
        httpMethod: 'POST',
        authorization: 'NONE',
      }
    );

    // Integration for POST method
    const postIntegration = new ApiGatewayIntegration(
      this,
      `webhooks-post-integration-${environmentSuffix}`,
      {
        restApiId: api.id,
        resourceId: webhooksResource.id,
        httpMethod: postMethod.httpMethod,
        integrationHttpMethod: 'POST',
        type: 'AWS_PROXY',
        uri: validatorLambda.invokeArn,
      }
    );

    // GET method for webhook status
    const getMethod = new ApiGatewayMethod(
      this,
      `webhooks-get-method-${environmentSuffix}`,
      {
        restApiId: api.id,
        resourceId: webhooksResource.id,
        httpMethod: 'GET',
        authorization: 'NONE',
      }
    );

    // Integration for GET method
    const getIntegration = new ApiGatewayIntegration(
      this,
      `webhooks-get-integration-${environmentSuffix}`,
      {
        restApiId: api.id,
        resourceId: webhooksResource.id,
        httpMethod: getMethod.httpMethod,
        integrationHttpMethod: 'POST',
        type: 'AWS_PROXY',
        uri: validatorLambda.invokeArn,
      }
    );

    // Lambda permission for API Gateway to invoke validator
    // Use unique statementId per environment to prevent conflicts on redeployment
    new LambdaPermission(this, `api-lambda-permission-${environmentSuffix}`, {
      statementId: `AllowAPIGatewayInvoke-${environmentSuffix}`,
      action: 'lambda:InvokeFunction',
      functionName: validatorLambda.functionName,
      principal: 'apigateway.amazonaws.com',
      sourceArn: `${api.executionArn}/*/*`,
    });

    // API Gateway Deployment
    // Add triggers to force redeployment when methods or integrations change
    // This prevents conflicts when redeploying after successful initial deployment
    const deployment = new ApiGatewayDeployment(
      this,
      `api-deployment-${environmentSuffix}`,
      {
        restApiId: api.id,
        dependsOn: [
          postMethod,
          getMethod,
          postIntegration,
          getIntegration,
        ] as ITerraformDependable[],
        triggers: {
          // Force redeployment when integrations change
          // Concatenated IDs will change when resources change, triggering new deployment
          redeployment: Fn.join('-', [
            postMethod.id,
            getMethod.id,
            postIntegration.id,
            getIntegration.id,
          ]),
        },
        lifecycle: {
          createBeforeDestroy: true,
        },
      }
    );

    // API Gateway Stage
    const stage = new ApiGatewayStage(this, `api-stage-${environmentSuffix}`, {
      deploymentId: deployment.id,
      restApiId: api.id,
      stageName: 'prod',
      xrayTracingEnabled: true,
      tags: {
        Environment: 'Production',
        Team: 'Platform',
      },
    });

    // API Gateway Method Settings for throttling
    new ApiGatewayMethodSettings(
      this,
      `api-method-settings-${environmentSuffix}`,
      {
        restApiId: api.id,
        stageName: stage.stageName,
        methodPath: '*/*',
        settings: {
          throttlingBurstLimit: 100,
          throttlingRateLimit: 100,
        },
      }
    );

    // CloudWatch Alarm for Validator Lambda errors (error rate > 1%)
    new CloudwatchMetricAlarm(
      this,
      `validator-error-alarm-${environmentSuffix}`,
      {
        alarmName: `webhook-validator-errors-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        threshold: 1.0,
        alarmDescription: 'Alert when validator Lambda error rate exceeds 1%',
        metricQuery: [
          {
            id: 'errors',
            metric: {
              metricName: 'Errors',
              namespace: 'AWS/Lambda',
              period: 60,
              stat: 'Sum',
              dimensions: {
                FunctionName: validatorLambda.functionName,
              },
            },
            returnData: false,
          },
          {
            id: 'invocations',
            metric: {
              metricName: 'Invocations',
              namespace: 'AWS/Lambda',
              period: 60,
              stat: 'Sum',
              dimensions: {
                FunctionName: validatorLambda.functionName,
              },
            },
            returnData: false,
          },
          {
            id: 'error_rate',
            expression: 'IF(invocations > 0, (errors / invocations) * 100, 0)',
            label: 'Error Rate (%)',
            returnData: true,
          },
        ],
        tags: {
          Environment: 'Production',
          Team: 'Platform',
        },
      }
    );

    // CloudWatch Alarm for Processor Lambda errors (error rate > 1%)
    new CloudwatchMetricAlarm(
      this,
      `processor-error-alarm-${environmentSuffix}`,
      {
        alarmName: `webhook-processor-errors-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        threshold: 1.0,
        alarmDescription: 'Alert when processor Lambda error rate exceeds 1%',
        metricQuery: [
          {
            id: 'errors',
            metric: {
              metricName: 'Errors',
              namespace: 'AWS/Lambda',
              period: 60,
              stat: 'Sum',
              dimensions: {
                FunctionName: processorLambda.functionName,
              },
            },
            returnData: false,
          },
          {
            id: 'invocations',
            metric: {
              metricName: 'Invocations',
              namespace: 'AWS/Lambda',
              period: 60,
              stat: 'Sum',
              dimensions: {
                FunctionName: processorLambda.functionName,
              },
            },
            returnData: false,
          },
          {
            id: 'error_rate',
            expression: 'IF(invocations > 0, (errors / invocations) * 100, 0)',
            label: 'Error Rate (%)',
            returnData: true,
          },
        ],
        tags: {
          Environment: 'Production',
          Team: 'Platform',
        },
      }
    );

    // Outputs
    new TerraformOutput(this, 'api-endpoint', {
      value: `https://${api.id}.execute-api.${awsRegion}.amazonaws.com/${stage.stageName}/webhooks`,
      description: 'API Gateway endpoint URL for webhooks',
    });

    new TerraformOutput(this, 'webhook-table-name', {
      value: webhookTable.name,
      description: 'DynamoDB table name for webhook metadata',
    });

    new TerraformOutput(this, 'results-bucket-name', {
      value: resultsBucket.bucket,
      description: 'S3 bucket name for processed webhook results',
    });

    new TerraformOutput(this, 'queue-url', {
      value: webhookQueue.url,
      description: 'SQS queue URL for webhook processing',
    });

    new TerraformOutput(this, 'validator-lambda-arn', {
      value: validatorLambda.arn,
      description: 'ARN of webhook validator Lambda function',
    });

    new TerraformOutput(this, 'processor-lambda-arn', {
      value: processorLambda.arn,
      description: 'ARN of webhook processor Lambda function',
    });

    new TerraformOutput(this, 'aws-account-id', {
      value: current.accountId,
      description: 'Current AWS Account ID',
    });
  }
}
