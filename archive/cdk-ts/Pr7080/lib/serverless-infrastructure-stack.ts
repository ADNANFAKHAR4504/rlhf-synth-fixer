import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cw_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';
import * as path from 'path';

export interface ServerlessInfrastructureStackProps extends cdk.StackProps {
  readonly envSuffix?: string; // optional environment suffix (e.g., dev, prod)
}

function sanitizeName(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 63);
}

export class ServerlessInfrastructureStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    props?: ServerlessInfrastructureStackProps
  ) {
    super(scope, id, props);

    cdk.Tags.of(this).add('iac-rlhf-amazon', 'true');

    const envName = (props && props.envSuffix) || process.env.ENV || 'dev';
    const ts = Date.now().toString().slice(-6);
    const resourceSuffix = sanitizeName(`${envName}-${ts}`);

    // KMS key for encryption-at-rest
    const kmsKey = new kms.Key(this, 'EncryptionKey', {
      alias: `alias/${sanitizeName(`${this.stackName}-key-${resourceSuffix}`)}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      enableKeyRotation: true,
    });

    // DynamoDB table encrypted with CMK
    const dynamoTable = new dynamodb.Table(this, 'ApplicationTable', {
      tableName: `application-table-${resourceSuffix}`,
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
      encryptionKey: kmsKey,
    });

    // S3 bucket for API logs, encrypted with same CMK
    const logsBucket = new s3.Bucket(this, 'ApiLogsBucket', {
      bucketName: sanitizeName(`api-logs-${resourceSuffix}`),
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      lifecycleRules: [{ expiration: cdk.Duration.days(30) }],
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    // Configuration in SSM
    const configParameter = new ssm.StringParameter(this, 'ConfigParameter', {
      parameterName: `/application/config-${resourceSuffix}`,
      stringValue: JSON.stringify({ apiVersion: '1.0', environment: envName }),
      description: 'Application configuration parameter',
      tier: ssm.ParameterTier.STANDARD,
    });

    // Dead-letter queue
    const deadLetterQueue = new sqs.Queue(this, 'LambdaDeadLetterQueue', {
      queueName: `lambda-dlq-${resourceSuffix}`,
      retentionPeriod: cdk.Duration.days(14),
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Lambda role (scoped)
    const lambdaRole = new iam.Role(this, 'LambdaExecutionRole', {
      roleName: `lambda-execution-role-${resourceSuffix}`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'Scoped execution role for application Lambda',
    });

    // Minimal logging permission
    lambdaRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        'service-role/AWSLambdaBasicExecutionRole'
      )
    );

    // X-Ray permissions: attach AWS managed policy for daemon write access
    // This avoids adding a broad PolicyStatement with Resource ['*'] and
    // relies on AWS managed policy which follows least-privilege for X-Ray
    // daemon telemetry writes.
    lambdaRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('AWSXRayDaemonWriteAccess')
    );

    // Lambda function
    const lambdaFunctionName = sanitizeName(
      `${this.stackName}-application-function-${resourceSuffix}`
    );
    // NodejsFunction bundling is potentially expensive and may invoke
    // `npm ci` during asset staging; require explicit opt-in via
    // USE_NODEJS_BUNDLER to avoid synth failures in environments where
    // the repository lockfile and handler package.json are out of sync.
    // This keeps bundling opt-in and avoids touching files outside `lib/`.
    const useBundler =
      process.env.USE_NODEJS_BUNDLER === '1' ||
      process.env.USE_NODEJS_BUNDLER === 'true';
    let lambdaFunction: lambda.Function;
    if (useBundler) {
      const nodefn = new NodejsFunction(this, 'ApplicationFunction', {
        functionName: lambdaFunctionName,
        runtime: lambda.Runtime.NODEJS_18_X,
        entry: path.join(__dirname, 'lambda-handler', 'index.js'),
        handler: 'handler',
        role: lambdaRole,
        environment: {
          TABLE_NAME: dynamoTable.tableName,
          CONFIG_PARAMETER_NAME: configParameter.parameterName,
          ENV: envName,
        },
        deadLetterQueue: deadLetterQueue,
        deadLetterQueueEnabled: true,
        tracing: lambda.Tracing.ACTIVE,
        timeout: cdk.Duration.seconds(30),
        memorySize: 256,
        bundling: {
          // Bundle only the runtime modules we explicitly use in the handler.
          // We avoid bundling the legacy aws-sdk v2 which is provided by the
          // Lambda runtime to prevent conflicts. Use AWS SDK v3 modular
          // packages if the handler depends on them and needs bundling.
          nodeModules: [
            '@aws-sdk/client-ssm',
            '@aws-sdk/client-dynamodb',
            '@aws-sdk/lib-dynamodb',
            'uuid',
          ],
        },
      });
      // NodejsFunction is a specialized construct but is a subclass of Function
      lambdaFunction = nodefn as unknown as lambda.Function;
    } else {
      lambdaFunction = new lambda.Function(this, 'ApplicationFunction', {
        functionName: lambdaFunctionName,
        runtime: lambda.Runtime.NODEJS_18_X,
        code: lambda.Code.fromAsset(path.join(__dirname, 'lambda-handler')),
        handler: 'index.handler',
        role: lambdaRole,
        environment: {
          TABLE_NAME: dynamoTable.tableName,
          CONFIG_PARAMETER_NAME: configParameter.parameterName,
          ENV: envName,
        },
        deadLetterQueue: deadLetterQueue,
        deadLetterQueueEnabled: true,
        tracing: lambda.Tracing.ACTIVE,
        timeout: cdk.Duration.seconds(30),
        memorySize: 256,
      });
    }

    // Grants
    dynamoTable.grantReadWriteData(lambdaFunction);
    deadLetterQueue.grantSendMessages(lambdaFunction);
    configParameter.grantRead(lambdaFunction);

    // SNS alarms topic
    const alarmTopic = new sns.Topic(this, 'AlarmTopic', {
      topicName: `application-alarms-${resourceSuffix}`,
      displayName: `Application Alarms ${resourceSuffix}`,
    });
    const alertEmail = process.env.EMAIL_ALERT_TOPIC_ADDRESS;
    if (alertEmail)
      alarmTopic.addSubscription(
        new subscriptions.EmailSubscription(alertEmail)
      );

    // CloudWatch alarms
    const lambdaErrorsAlarm = new cloudwatch.Alarm(this, 'LambdaErrorsAlarm', {
      metric: lambdaFunction.metricErrors(),
      threshold: 1,
      evaluationPeriods: 1,
      alarmDescription: 'Lambda function reports errors',
    });
    lambdaErrorsAlarm.addAlarmAction(new cw_actions.SnsAction(alarmTopic));

    const lambdaDurationAlarm = new cloudwatch.Alarm(
      this,
      'LambdaDurationAlarm',
      {
        metric: lambdaFunction.metricDuration(),
        threshold: 5000,
        evaluationPeriods: 1,
        alarmDescription: 'Lambda duration exceeds 5 seconds',
      }
    );
    lambdaDurationAlarm.addAlarmAction(new cw_actions.SnsAction(alarmTopic));

    // API log group
    const apiLogGroup = new logs.LogGroup(this, 'ApiGatewayLogGroup', {
      logGroupName: `/aws/apigateway/application-api-${resourceSuffix}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // API Gateway CloudWatch role (account-level, created once per account/region)
    const apiGatewayCloudWatchRole = new iam.Role(
      this,
      'ApiGatewayCloudWatchRole',
      {
        assumedBy: new iam.ServicePrincipal('apigateway.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AmazonAPIGatewayPushToCloudWatchLogs'
          ),
        ],
      }
    );

    // Set the account-level CloudWatch role for API Gateway
    const cfnAccount = new apigateway.CfnAccount(this, 'ApiGatewayAccount', {
      cloudWatchRoleArn: apiGatewayCloudWatchRole.roleArn,
    });

    // API Gateway
    const api = new apigateway.RestApi(this, 'ApplicationApi', {
      restApiName: `application-api-${resourceSuffix}`,
      deployOptions: {
        stageName: 'prod',
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        tracingEnabled: true,
        accessLogDestination: new apigateway.LogGroupLogDestination(
          apiLogGroup
        ),
        accessLogFormat: apigateway.AccessLogFormat.jsonWithStandardFields(),
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    // Ensure API Gateway account configuration is created before the API
    api.node.addDependency(cfnAccount);

    const lambdaIntegration = new apigateway.LambdaIntegration(lambdaFunction, {
      proxy: true,
    });
    const apiResource = api.root.addResource('items');
    ['GET', 'POST', 'PUT', 'DELETE'].forEach(m =>
      apiResource.addMethod(m, lambdaIntegration)
    );

    // API 5XX alarm
    const api5xxMetric = api.metricServerError({
      period: cdk.Duration.minutes(1),
    });
    const api5xxAlarm = new cloudwatch.Alarm(this, 'Api5xxAlarm', {
      metric: api5xxMetric,
      threshold: 1,
      evaluationPeriods: 1,
      alarmDescription: 'API Gateway 5XX errors detected',
    });
    api5xxAlarm.addAlarmAction(new cw_actions.SnsAction(alarmTopic));

    // Outputs
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url ?? 'unknown',
      description: 'API endpoint URL',
      exportName: `api-url-${resourceSuffix}`,
    });

    // Backwards-compatible logical id expected by tests
    new cdk.CfnOutput(this, 'ApiEndpointUrl', {
      value: api.url ?? 'unknown',
      description: 'API endpoint URL (legacy logical id)',
    });

    new cdk.CfnOutput(this, 'DynamoTableName', {
      value: dynamoTable.tableName,
      description: 'DynamoDB table name',
      exportName: `dynamo-table-name-${resourceSuffix}`,
    });

    new cdk.CfnOutput(this, 'LogsBucketName', {
      value: logsBucket.bucketName,
      description: 'S3 bucket for API logs',
      exportName: `logs-bucket-name-${resourceSuffix}`,
    });

    new cdk.CfnOutput(this, 'LambdaFunctionName', {
      value: lambdaFunction.functionName,
      description: 'Lambda function name',
      exportName: `lambda-function-name-${resourceSuffix}`,
    });

    new cdk.CfnOutput(this, 'LambdaFunctionArn', {
      value: lambdaFunction.functionArn,
      description: 'Lambda function ARN',
    });

    new cdk.CfnOutput(this, 'DeadLetterQueueUrl', {
      value: deadLetterQueue.queueUrl,
      description: 'Dead-letter queue URL',
      exportName: `dlq-url-${resourceSuffix}`,
    });

    new cdk.CfnOutput(this, 'ConfigParameterName', {
      value: configParameter.parameterName,
      description: 'SSM Parameter Store parameter name',
      exportName: `config-param-name-${resourceSuffix}`,
    });

    new cdk.CfnOutput(this, 'KmsKeyId', {
      value: kmsKey.keyId,
      description: 'KMS key ID for encryption',
      exportName: `kms-key-id-${resourceSuffix}`,
    });

    new cdk.CfnOutput(this, 'AlarmTopicArn', {
      value: alarmTopic.topicArn,
      description: 'SNS topic ARN for alarms',
      exportName: `alarm-topic-arn-${resourceSuffix}`,
    });

    new cdk.CfnOutput(this, 'Region', {
      value: this.region,
      description: 'AWS region',
    });
  }
}
// Duplicate block removed — original top-level imports and ServerlessInfrastructureStack implementation (first occurrence) are retained above.
