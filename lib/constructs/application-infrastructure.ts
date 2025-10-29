import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as sns from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';
import path from 'path';
import { PipelineConfig } from '../config/pipeline-config';

export interface ApplicationInfrastructureProps {
  config: PipelineConfig;
  kmsKey: kms.Key;
  alarmTopic: sns.Topic;
}

export class ApplicationInfrastructure extends Construct {
  public readonly lambdaFunction: lambda.Function;
  public readonly api: apigateway.RestApi;
  public readonly lambdaAlias: lambda.Alias;

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

    // Lambda log group
    const logGroup = new logs.LogGroup(this, 'LambdaLogGroup', {
      logGroupName: `/aws/lambda/${config.prefix}-function`,
      retention: logs.RetentionDays.ONE_MONTH,
      encryptionKey: kmsKey,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Lambda function
    this.lambdaFunction = new lambda.Function(this, 'HonoFunction', {
      functionName: `${config.prefix}-function`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      // initialize the lambda function with the code from the app/src directory
      code: lambda.Code.fromAsset(path.join(__dirname, '../app/src')),
      role: lambdaRole,
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
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
    });

    // Lambda version and alias for zero-downtime deployments
    const version = this.lambdaFunction.currentVersion;
    this.lambdaAlias = new lambda.Alias(this, 'LiveAlias', {
      aliasName: 'live',
      version,
    });

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
        throttlingBurstLimit: 1000,
        throttlingRateLimit: 500,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization'],
      },
    });

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
