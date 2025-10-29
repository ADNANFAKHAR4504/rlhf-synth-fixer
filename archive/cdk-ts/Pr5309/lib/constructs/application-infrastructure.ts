import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';
import path from 'path';
import { getRemovalPolicy, PipelineConfig } from '../config/pipeline-config';

export interface ApplicationInfrastructureProps {
  config: PipelineConfig;
  kmsKey: kms.Key;
  alarmTopic: sns.Topic;
}

export class ApplicationInfrastructure extends Construct {
  public readonly lambdaFunction: lambda.Function;
  public readonly api: apigateway.RestApi;
  public readonly lambdaAlias: lambda.Alias;
  public readonly deadLetterQueue: sqs.Queue;

  constructor(
    scope: Construct,
    id: string,
    props: ApplicationInfrastructureProps
  ) {
    super(scope, id);

    const { config, kmsKey, alarmTopic } = props;

    // Lambda execution role
    const lambdaRole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: `Lambda execution role for ${config.prefix}`,
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
    });

    // Grant Parameter Store access
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'ssm:GetParameter',
          'ssm:GetParameters',
          'ssm:GetParametersByPath',
        ],
        resources: [
          `arn:aws:ssm:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:parameter/${config.prefix}/*`,
        ],
      })
    );

    // Grant KMS access
    kmsKey.grantDecrypt(lambdaRole);

    // Dead Letter Queue for failed Lambda invocations
    this.deadLetterQueue = new sqs.Queue(this, 'DeadLetterQueue', {
      queueName: `${config.prefix}-dlq`,
      encryption: sqs.QueueEncryption.KMS,
      encryptionMasterKey: kmsKey,
      retentionPeriod: cdk.Duration.days(14),
      removalPolicy: getRemovalPolicy(config.environmentSuffix),
    });

    // Grant Lambda permission to send messages to DLQ
    this.deadLetterQueue.grantSendMessages(lambdaRole);

    // Lambda log group
    const logGroup = new logs.LogGroup(this, 'LambdaLogGroup', {
      logGroupName: `/aws/lambda/${config.prefix}-function`,
      retention: logs.RetentionDays.ONE_MONTH,
      encryptionKey: kmsKey,
      removalPolicy: getRemovalPolicy(config.environmentSuffix),
    });

    // Lambda function
    this.lambdaFunction = new lambda.Function(this, 'HonoFunction', {
      functionName: `${config.prefix}-function`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../app'), {
        bundling: {
          image: lambda.Runtime.NODEJS_20_X.bundlingImage,
          command: [
            'bash',
            '-c',
            [
              'npm install --include=dev --cache /tmp/.npm --no-audit --no-fund',
              'npm run build',
              'cp -r dist/* /asset-output/',
              'npm install --omit=dev --cache /tmp/.npm --no-audit --no-fund', // reinstall only prod deps
              'cp -r node_modules /asset-output/',
              'cp package*.json /asset-output/',
            ].join(' && '),
          ],
          environment: {
            npm_config_cache: '/tmp/.npm',
          },
        },
      }),
      role: lambdaRole,
      timeout: cdk.Duration.seconds(config.lambdaTimeout || 30),
      memorySize: config.lambdaMemorySize || 512,
      environment: {
        NODE_ENV: config.environmentSuffix,
        PARAMETER_PREFIX: `/${config.prefix}`,
        LOG_LEVEL: 'INFO',
      },
      logGroup,
      tracing: lambda.Tracing.ACTIVE,
      reservedConcurrentExecutions:
        config.environmentSuffix === 'prod' ? 100 : 2,
      environmentEncryption: kmsKey,
      deadLetterQueue: this.deadLetterQueue,
      deadLetterQueueEnabled: true,
      maxEventAge: cdk.Duration.hours(6),
      retryAttempts: 2,
    });

    // Lambda version and alias for zero-downtime deployments
    const version = this.lambdaFunction.currentVersion;
    const isProduction = config.environmentSuffix
      .toLowerCase()
      .includes('prod');

    // Add provisioned concurrency for production to eliminate cold starts
    this.lambdaAlias = new lambda.Alias(this, 'LiveAlias', {
      aliasName: 'live',
      version,
      // Provisioned concurrency from config (only for production by default)
      // Note: This adds cost but improves latency significantly
      provisionedConcurrentExecutions: config.provisionedConcurrency,
    });

    // Environment-based throttling configuration
    const throttlingBurstLimit = isProduction ? 1000 : 100;
    const throttlingRateLimit = isProduction ? 500 : 50;

    // API Gateway
    this.api = new apigateway.RestApi(this, 'HonoApi', {
      restApiName: `${config.prefix}-api`,
      description: `API Gateway for ${config.prefix}`,
      deployOptions: {
        stageName: config.environmentSuffix,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        tracingEnabled: true,
        metricsEnabled: true,
        throttlingBurstLimit,
        throttlingRateLimit,
      },
      // Restrict CORS to specific origins in production
      defaultCorsPreflightOptions: {
        allowOrigins: isProduction
          ? apigateway.Cors.ALL_ORIGINS // TODO: Replace with specific allowed origins
          : apigateway.Cors.ALL_ORIGINS, // Allow all in dev/test for ease of development
        allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowHeaders: [
          'Content-Type',
          'Authorization',
          'X-Amz-Date',
          'X-Api-Key',
        ],
        maxAge: cdk.Duration.days(1),
      },
      // Request validation (basic - can be enhanced with model validation)
      // API key usage can be enabled per method if needed
    });

    // Add request validator (basic validation)
    new apigateway.RequestValidator(this, 'RequestValidator', {
      restApi: this.api,
      requestValidatorName: `${config.prefix}-api-request-validator`,
      validateRequestBody: true,
      validateRequestParameters: false, // Enable if query params validation needed
    });

    // API Gateway access logs (S3 export can be added if needed)
    // Note: Access logs require additional configuration and S3 bucket

    // Lambda integration
    const integration = new apigateway.LambdaIntegration(this.lambdaAlias, {
      requestTemplates: {
        'application/json': '{ "statusCode": "200" }',
      },
    });

    // API routes
    this.api.root.addMethod('ANY', integration);
    this.api.root.addProxy({
      defaultIntegration: integration,
      anyMethod: true,
    });

    // CloudWatch alarms
    new cloudwatch.Alarm(this, 'LambdaErrorAlarm', {
      alarmName: `${config.prefix}-lambda-errors`,
      metric: this.lambdaFunction.metricErrors(),
      threshold: 10,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'Lambda function error rate is too high',
    }).addAlarmAction(new cloudwatchActions.SnsAction(alarmTopic));

    new cloudwatch.Alarm(this, 'ApiGateway4xxAlarm', {
      alarmName: `${config.prefix}-api-4xx-errors`,
      metric: this.api.metricClientError(),
      threshold: 50,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'API Gateway 4xx error rate is too high',
    }).addAlarmAction(new cloudwatchActions.SnsAction(alarmTopic));

    new cloudwatch.Alarm(this, 'ApiGateway5xxAlarm', {
      alarmName: `${config.prefix}-api-5xx-errors`,
      metric: this.api.metricServerError(),
      threshold: 10,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'API Gateway 5xx error rate is too high',
    }).addAlarmAction(new cloudwatchActions.SnsAction(alarmTopic));
  }
}
