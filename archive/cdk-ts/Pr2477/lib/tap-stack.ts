import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  projectName: string;
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    const { projectName } = props;

    // Common tags for all resources
    const commonTags = {
      Environment: 'Production',
      Project: projectName,
      DeploymentDate: environmentSuffix,
    };

    // KMS Key for encryption
    const kmsKey = new kms.Key(this, 'EncryptionKey', {
      description: `${projectName} encryption key`,
      enableKeyRotation: true,
    });

    cdk.Tags.of(kmsKey).add('Name', `${projectName}-KMS-${environmentSuffix}`);
    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(kmsKey).add(key, value);
    });

    // S3 bucket for Lambda code deployment
    const codeBucket = new s3.Bucket(this, 'CodeBucket', {
      bucketName: `${projectName.toLowerCase()}-code-${environmentSuffix}-${this.account}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For demo purposes
    });

    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(codeBucket).add(key, value);
    });

    // S3 bucket for logs storage
    const logsBucket = new s3.Bucket(this, 'LogsBucket', {
      bucketName: `${projectName.toLowerCase()}-logs-${environmentSuffix}-${this.account}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      lifecycleRules: [
        {
          id: 'DeleteOldLogs',
          expiration: cdk.Duration.days(90),
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
          ],
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For demo purposes
    });

    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(logsBucket).add(key, value);
    });

    // Dead Letter Queue
    const deadLetterQueue = new sqs.Queue(this, 'DeadLetterQueue', {
      queueName: `${projectName}-DLQ-${environmentSuffix}`,
      encryption: sqs.QueueEncryption.KMS,
      encryptionMasterKey: kmsKey,
      retentionPeriod: cdk.Duration.days(14),
    });

    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(deadLetterQueue).add(key, value);
    });

    // IAM role for Lambda with least privilege
    const lambdaRole = new iam.Role(this, 'LambdaExecutionRole', {
      roleName: `${projectName}-Lambda-Role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AWSXRayDaemonWriteAccess'),
      ],
    });

    // Add permissions for DLQ and KMS
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['sqs:SendMessage', 'sqs:GetQueueAttributes'],
        resources: [deadLetterQueue.queueArn],
      })
    );

    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['kms:Decrypt', 'kms:GenerateDataKey'],
        resources: [kmsKey.keyArn],
      })
    );

    // Add permissions for logs bucket
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['s3:PutObject', 's3:PutObjectAcl'],
        resources: [`${logsBucket.bucketArn}/*`],
      })
    );

    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(lambdaRole).add(key, value);
    });

    // Create dedicated log group for Lambda (fixes deprecation)
    const lambdaLogGroup = new logs.LogGroup(this, 'ApiLambdaLogGroup', {
      logGroupName: `/aws/lambda/${projectName}-API-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(lambdaLogGroup).add(key, value);
    });

    // Lambda function (updated to use logGroup instead of logRetention)
    const apiFunction = new lambda.Function(this, 'ApiFunction', {
      functionName: `${projectName}-API-${environmentSuffix}`,
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'api-handler.lambda_handler',
      code: lambda.Code.fromAsset('lib/lambda'),
      memorySize: 512,
      timeout: cdk.Duration.seconds(30),
      role: lambdaRole,
      environment: {
        STAGE: 'production',
        LOGS_BUCKET: logsBucket.bucketName,
      },
      deadLetterQueue: deadLetterQueue,
      tracing: lambda.Tracing.ACTIVE,
      logGroup: lambdaLogGroup,
    });

    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(apiFunction).add(key, value);
    });

    // API Key for authentication
    const apiKey = new apigateway.ApiKey(this, 'ApiKey', {
      apiKeyName: `${projectName}-API-Key-${environmentSuffix}`,
      description: `API Key for ${projectName} Production API`,
    });

    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(apiKey).add(key, value);
    });

    // Usage Plan
    const usagePlan = new apigateway.UsagePlan(this, 'UsagePlan', {
      name: `${projectName}-Usage-Plan-${environmentSuffix}`,
      description: `Usage plan for ${projectName} API`,
      throttle: {
        rateLimit: 1000,
        burstLimit: 2000,
      },
      quota: {
        limit: 10000,
        period: apigateway.Period.DAY,
      },
    });

    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(usagePlan).add(key, value);
    });

    // WAF Web ACL
    const webAcl = new wafv2.CfnWebACL(this, 'ApiWebAcl', {
      name: `${projectName}-WAF-${environmentSuffix}`,
      scope: 'REGIONAL',
      defaultAction: { allow: {} },
      rules: [
        {
          name: 'RateLimitRule',
          priority: 1,
          statement: {
            rateBasedStatement: {
              limit: 2000,
              aggregateKeyType: 'IP',
            },
          },
          action: { block: {} },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'RateLimitRule',
          },
        },
        {
          name: 'AWSManagedRulesCommonRuleSet',
          priority: 2,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesCommonRuleSet',
            },
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'CommonRuleSetMetric',
          },
        },
        {
          name: 'AWSManagedRulesKnownBadInputsRuleSet',
          priority: 3,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesKnownBadInputsRuleSet',
            },
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'KnownBadInputsRuleSetMetric',
          },
        },
      ],
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: `${projectName}WebAcl`,
      },
    });

    // API Gateway with improved CORS and authentication
    const api = new apigateway.RestApi(this, 'ApiGateway', {
      restApiName: `${projectName}-API-${environmentSuffix}`,
      description: `${projectName} Production API`,
      endpointConfiguration: {
        types: [apigateway.EndpointType.REGIONAL],
      },
      defaultCorsPreflightOptions: {
        allowOrigins: ['https://yourdomain.com', 'https://app.yourdomain.com'],
        allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
          'X-Amz-Security-Token',
          'X-Amz-User-Agent',
        ],
        allowCredentials: true,
      },
      deployOptions: {
        stageName: 'prod',
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        metricsEnabled: true,
        tracingEnabled: true,
      },
      apiKeySourceType: apigateway.ApiKeySourceType.HEADER,
    });

    // Associate WAF with API Gateway
    new wafv2.CfnWebACLAssociation(this, 'WebAclAssociation', {
      resourceArn: `arn:aws:apigateway:${this.region}::/restapis/${api.restApiId}/stages/prod`,
      webAclArn: webAcl.attrArn,
    });

    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(api).add(key, value);
    });

    // Lambda integration with API Key requirement
    const lambdaIntegration = new apigateway.LambdaIntegration(apiFunction, {
      proxy: true,
    });

    // Add proxy resource with API Key requirement
    api.root.addProxy({
      defaultIntegration: lambdaIntegration,
      anyMethod: true,
      defaultMethodOptions: {
        apiKeyRequired: true,
      },
    });

    // Associate API Key with Usage Plan and API
    usagePlan.addApiKey(apiKey);
    usagePlan.addApiStage({
      api: api,
      stage: api.deploymentStage,
    });

    // CloudWatch Alarms
    const errorAlarm = new cloudwatch.Alarm(this, 'LambdaErrorAlarm', {
      alarmName: `${projectName}-Lambda-Errors-${environmentSuffix}`,
      alarmDescription: 'Lambda function error rate',
      metric: apiFunction.metricErrors({
        period: cdk.Duration.minutes(5),
      }),
      threshold: 5,
      evaluationPeriods: 2,
      comparisonOperator:
        cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
    });

    const throttleAlarm = new cloudwatch.Alarm(this, 'LambdaThrottleAlarm', {
      alarmName: `${projectName}-Lambda-Throttles-${environmentSuffix}`,
      alarmDescription: 'Lambda function throttle rate',
      metric: apiFunction.metricThrottles({
        period: cdk.Duration.minutes(5),
      }),
      threshold: 1,
      evaluationPeriods: 2,
      comparisonOperator:
        cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
    });

    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(errorAlarm).add(key, value);
      cdk.Tags.of(throttleAlarm).add(key, value);
    });

    // Outputs
    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: api.url,
      description: 'API Gateway URL',
    });

    new cdk.CfnOutput(this, 'ApiKeyId', {
      value: apiKey.keyId,
      description: 'API Key ID - retrieve value from AWS Console',
    });

    new cdk.CfnOutput(this, 'WAFWebAclArn', {
      value: webAcl.attrArn,
      description: 'WAF Web ACL ARN',
    });

    new cdk.CfnOutput(this, 'LambdaFunctionName', {
      value: apiFunction.functionName,
      description: 'Lambda Function Name',
    });

    new cdk.CfnOutput(this, 'CodeBucketName', {
      value: codeBucket.bucketName,
      description: 'S3 Bucket for Lambda Code',
    });

    new cdk.CfnOutput(this, 'LogsBucketName', {
      value: logsBucket.bucketName,
      description: 'S3 Bucket for Logs',
    });
  }
}
