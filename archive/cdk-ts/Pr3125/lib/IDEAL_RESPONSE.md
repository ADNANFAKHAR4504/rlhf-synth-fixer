## lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ServerlessStack } from './serverless-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Instantiate ServerlessStack as nested stack
    new ServerlessStack(this, `ServerlessStack-${environmentSuffix}`, {
      environmentSuffix: environmentSuffix,
    });
  }
}
```

## lib/serverless-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cloudtrail from 'aws-cdk-lib/aws-cloudtrail';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { DynamoEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

interface ServerlessStackProps {
  environmentSuffix: string;
}

export class ServerlessStack extends cdk.NestedStack {
  constructor(scope: Construct, id: string, props: ServerlessStackProps) {
    super(scope, id);

    const { environmentSuffix } = props;

    // Default tags for all resources
    cdk.Tags.of(this).add('project', 'serverless-app');

    // VPC Configuration
    const vpc = new ec2.Vpc(this, 'AppVpc', {
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        {
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
      ],
    });

    // S3 Bucket with encryption and lifecycle policy
    const appBucket = new s3.Bucket(this, 'AppBucket', {
      bucketName: `app-bucket-${this.account}-${this.region}-${environmentSuffix}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      lifecycleRules: [
        {
          id: 'move-to-ia',
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
          ],
        },
      ],
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // DynamoDB Table with streams
    const appTable = new dynamodb.Table(this, 'AppTable', {
      tableName: `AppTable-${environmentSuffix}`,
      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      stream: dynamodb.StreamViewType.NEW_IMAGE,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // SQS Queue for DynamoDB streams
    const streamQueue = new sqs.Queue(this, 'StreamQueue', {
      queueName: `stream-queue-${environmentSuffix}`,
      encryption: sqs.QueueEncryption.SQS_MANAGED,
      retentionPeriod: cdk.Duration.days(14),
    });

    // Systems Manager Parameter
    const configParam = new ssm.StringParameter(this, 'ConfigParameter', {
      parameterName: `/serverless-app-${environmentSuffix}/config`,
      stringValue: JSON.stringify({
        apiVersion: '1.0',
        features: {
          caching: true,
          logging: 'verbose',
        },
      }),
    });

    // Secrets Manager Secret
    const appSecret = new secretsmanager.Secret(this, 'AppSecret', {
      secretName: `app-secret-${environmentSuffix}`,
      description: 'Application secrets',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          username: 'admin',
        }),
        generateStringKey: 'password',
        excludeCharacters: ' %+~`#$&*()|[]{}:;<>?!\'/@"\\',
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Lambda Function Role with least-privilege permissions
    const lambdaRole = new iam.Role(this, 'LambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaVPCAccessExecutionRole'
        ),
      ],
    });

    // Grant permissions to Lambda role
    appTable.grantReadWriteData(lambdaRole);
    appBucket.grantReadWrite(lambdaRole);
    configParam.grantRead(lambdaRole);
    appSecret.grantRead(lambdaRole);

    // Lambda Function
    const appFunction = new lambda.Function(this, 'AppFunction', {
      functionName: `app-function-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lib/lambdas/app-function'),
      vpc: vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      environment: {
        TABLE_NAME: appTable.tableName,
        BUCKET_NAME: appBucket.bucketName,
        CONFIG_PARAM_NAME: configParam.parameterName,
        SECRET_ARN: appSecret.secretArn,
      },
      role: lambdaRole,
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    // Create alias without provisioned concurrency (removed due to deployment issues)
    // Provisioned concurrency requires the function version to be fully stabilized
    // which doesn't work well with CDK's currentVersion in initial deployment
    const version = appFunction.currentVersion;
    const alias = new lambda.Alias(this, 'AppFunctionAlias', {
      aliasName: 'production',
      version: version,
      // provisionedConcurrentExecutions removed - can be added manually after initial deployment
    });

    // Note: Auto-scaling for provisioned concurrency removed since provisioned concurrency is disabled
    // The function will use on-demand concurrency scaling instead

    // CloudWatch logging for API Gateway completely disabled
    // Requires account-level CloudWatch Logs role ARN configuration
    // Can be enabled after setting up the role in AWS account settings

    // API Gateway with CORS (logging disabled)
    const api = new apigateway.RestApi(this, 'AppApi', {
      restApiName: `ServerlessAppAPI-${environmentSuffix}`,
      // All CloudWatch logging disabled - requires account setup
      // deployOptions: {
      //   accessLogDestination: new apigateway.LogGroupLogDestination(apiLogGroup),
      //   accessLogFormat: apigateway.AccessLogFormat.jsonWithStandardFields(),
      //   loggingLevel: apigateway.MethodLoggingLevel.INFO,
      //   dataTraceEnabled: true,
      // },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization'],
        maxAge: cdk.Duration.hours(1),
      },
    });

    // API Gateway Lambda integration
    const integration = new apigateway.LambdaIntegration(alias);

    // API endpoints
    const items = api.root.addResource('items');
    items.addMethod('GET', integration);
    items.addMethod('POST', integration);

    // DynamoDB Stream to SQS
    const streamFunction = new lambda.Function(this, 'StreamFunction', {
      functionName: `stream-function-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lib/lambdas/stream-function'),
      environment: {
        QUEUE_URL: streamQueue.queueUrl,
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    streamQueue.grantSendMessages(streamFunction);

    streamFunction.addEventSource(
      new DynamoEventSource(appTable, {
        startingPosition: lambda.StartingPosition.TRIM_HORIZON,
        batchSize: 10,
        maxBatchingWindow: cdk.Duration.minutes(2),
      })
    );

    // CloudWatch Alarms for DynamoDB
    new cloudwatch.Alarm(this, 'DynamoDBThrottleAlarm', {
      alarmName: `dynamodb-throttle-${environmentSuffix}`,
      metric: appTable.metricUserErrors(),
      threshold: 5,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'DynamoDB user errors alarm',
    });

    new cloudwatch.Alarm(this, 'DynamoDBConsumedReadAlarm', {
      alarmName: `dynamodb-read-capacity-${environmentSuffix}`,
      metric: appTable.metricConsumedReadCapacityUnits(),
      threshold: 80,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'DynamoDB consumed read capacity units alarm',
    });

    // S3 Bucket for CloudTrail logs
    const trailBucket = new s3.Bucket(this, 'TrailBucket', {
      bucketName: `trail-bucket-${this.account}-${this.region}-${environmentSuffix}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // CloudTrail for auditing
    const trail = new cloudtrail.Trail(this, 'AppTrail', {
      trailName: `app-trail-${environmentSuffix}`,
      bucket: trailBucket,
      isMultiRegionTrail: false,
      includeGlobalServiceEvents: false,
      managementEvents: cloudtrail.ReadWriteType.ALL,
    });

    // Log DynamoDB data events using L1 construct
    const cfnTrail = trail.node.defaultChild as cloudtrail.CfnTrail;
    cfnTrail.eventSelectors = [
      {
        readWriteType: 'All',
        includeManagementEvents: false,
        dataResources: [
          {
            type: 'AWS::DynamoDB::Table',
            values: [appTable.tableArn],
          },
        ],
      },
    ];

    // Outputs
    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: api.url,
      description: 'API Gateway endpoint URL',
    });

    new cdk.CfnOutput(this, 'TableName', {
      value: appTable.tableName,
      description: 'DynamoDB table name',
    });

    new cdk.CfnOutput(this, 'BucketName', {
      value: appBucket.bucketName,
      description: 'S3 bucket name',
    });

    new cdk.CfnOutput(this, 'QueueUrl', {
      value: streamQueue.queueUrl,
      description: 'SQS queue URL',
    });

    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID',
    });

    new cdk.CfnOutput(this, 'FunctionName', {
      value: appFunction.functionName,
      description: 'Lambda function name',
    });
  }
}
```

## lib/lambda/app-function/index.mjs
```mjs

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { S3Client } from '@aws-sdk/client-s3';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const dynamoClient = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(dynamoClient);
const s3 = new S3Client({});
const ssm = new SSMClient({});
const secretsManager = new SecretsManagerClient({});

export const handler = async (event) => {
  try {
    // Get config from Parameter Store
    const paramResult = await ssm.send(new GetParameterCommand({
      Name: process.env.CONFIG_PARAM_NAME,
    }));

    // Get secret from Secrets Manager
    const secretResult = await secretsManager.send(new GetSecretValueCommand({
      SecretId: process.env.SECRET_ARN,
    }));

    // Example DynamoDB operation
    const item = {
      id: Date.now().toString(),
      data: JSON.parse(event.body || '{}'),
      timestamp: new Date().toISOString(),
    };

    await dynamodb.send(new PutCommand({
      TableName: process.env.TABLE_NAME,
      Item: item,
    }));

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      },
      body: JSON.stringify({
        message: 'Success',
        itemId: item.id,
      }),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
```

## lib/lambdas/stream-function/index.mjs
```

import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';

const sqs = new SQSClient({});

export const handler = async (event) => {
  const queueUrl = process.env.QUEUE_URL;

  for (const record of event.Records) {
    if (record.eventName === 'INSERT') {
      await sqs.send(new SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify(record.dynamodb.NewImage),
      }));
    }
  }
};
```
