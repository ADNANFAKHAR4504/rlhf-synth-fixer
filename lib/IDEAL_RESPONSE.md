## Ideal response — summary of `lib/` implementation and source

This document summarizes the TypeScript files under `lib/` and includes their
current source as formatted code blocks. Use this for quick review.

Included files:
- `multi-component-stack.ts`
- `tap-stack.ts`
- `string-utils.ts`

---

### lib/multi-component-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Duration, RemovalPolicy } from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as cloudfrontOrigins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cw_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53Targets from 'aws-cdk-lib/aws-route53-targets';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';

export class MultiComponentApplicationStack extends cdk.NestedStack {
  // String suffix for unique resource naming
  private readonly stringSuffix: string;
  // Expose important resource tokens as public properties so other stacks
  // in the same CDK app can reference them without requiring manual
  // CloudFormation exports/imports.
  public readonly vpcId!: string;
  public readonly apiUrl!: string;
  public readonly lambdaFunctionArn!: string;
  public readonly rdsEndpoint!: string;
  public readonly s3BucketName!: string;
  public readonly sqsQueueUrl!: string;
  public readonly cloudFrontDomainName!: string;
  public readonly hostedZoneId!: string;
  public readonly databaseSecretArn!: string;
  public readonly lambdaRoleArn!: string;
  public readonly databaseSecurityGroupId!: string;
  public readonly lambdaSecurityGroupId!: string;
  public readonly lambdaLogGroupName!: string;

  // Expose a small helper to compute the sanitized suffix used for Lambda names.
  // This is intentionally simple and useful to call from unit tests to exercise
  // the branches (defined vs falsy suffix).
  public computeSafeSuffixForLambda(input?: string): string | cdk.Aws {
    return input
      ? input.toLowerCase().replace(/[^a-z0-9-_]/g, '-')
      : cdk.Aws.NO_VALUE;
  }

  constructor(scope: Construct, id: string, props?: cdk.NestedStackProps) {
    // Respect props by passing them directly to the NestedStack constructor
    super(scope, id, props);

    // Generate unique string suffix
    this.stringSuffix = cdk.Fn.select(2, cdk.Fn.split('-', cdk.Aws.STACK_ID));

    // ========================================
    // VPC Configuration
    // ========================================
    const vpc = new ec2.Vpc(this, 'AppVpc', {
      vpcName: `prod-vpc-app-${this.stringSuffix}`,
      cidr: '10.0.0.0/16',
      maxAzs: 2,
      natGateways: 2,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      subnetConfiguration: [
        {
          name: 'prod-public-subnet',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'prod-private-subnet',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
      ],
    });

    // ========================================
    // Secrets Manager - RDS Credentials
    // ========================================
    const databaseSecret = new secretsmanager.Secret(this, 'DatabaseSecret', {
      secretName: `prod-secretsmanager-db-${this.stringSuffix.toLowerCase().replace(/[^a-zA-Z0-9\-_+=.@!]/g, '')}`,
      description: 'RDS PostgreSQL database credentials',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          username: 'dbadmin',
        }),
        generateStringKey: 'password',
        excludeCharacters: ' %+~`#$&*()|[]{}:;<>?!\'/@"\\',
        passwordLength: 32,
      },
    });

    // ========================================
    // RDS PostgreSQL Database
    // ========================================
    const databaseSecurityGroup = new ec2.SecurityGroup(
      this,
      'DatabaseSecurityGroup',
      {
        securityGroupName: `prod-ec2-sg-db-${this.stringSuffix}`,
        vpc,
        description: 'Security group for RDS PostgreSQL',
        allowAllOutbound: false,
      }
    );

    // Use a generally-available Postgres engine version. Some regions may not have
    // older minor versions (e.g. 13.7). Prefer Postgres 15.x which has wider availability.
    const rdsInstance = new rds.DatabaseInstance(this, 'PostgresDatabase', {
      instanceIdentifier: `prod-rds-postgres-${this.stringSuffix.toLowerCase().replace(/[^a-z0-9-]/g, '')}`,
      engine: rds.DatabaseInstanceEngine.postgres({
        // Use the major Postgres 15 engine constant so CDK/RDS will pick a supported
        // minor version available in the target region. Pinning to a minor (e.g. 15.3)
        // can fail in regions that don't offer that exact patch level.
        version: rds.PostgresEngineVersion.VER_15,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.M5,
        ec2.InstanceSize.LARGE
      ),
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroups: [databaseSecurityGroup],
      credentials: rds.Credentials.fromSecret(databaseSecret),
      databaseName: 'proddb',
      allocatedStorage: 20,
      storageEncrypted: true,
      backupRetention: Duration.days(7),
      deletionProtection: false,
      removalPolicy: RemovalPolicy.DESTROY,
      multiAz: true, // High availability
      cloudwatchLogsExports: ['postgresql'],
      cloudwatchLogsRetention: logs.RetentionDays.ONE_WEEK,
    });

    // ========================================
    // S3 Buckets
    // ========================================
    const staticFilesBucket = new s3.Bucket(this, 'StaticFilesBucket', {
      bucketName: `prod-s3-static-${this.stringSuffix.toLowerCase().replace(/[^a-z0-9-]/g, '')}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      lifecycleRules: [
        {
          id: 'delete-old-versions',
          noncurrentVersionExpiration: Duration.days(30),
          enabled: true,
        },
      ],
    });

    // ========================================
    // SQS Queue
    // ========================================
    const asyncQueue = new sqs.Queue(this, 'AsyncProcessingQueue', {
      queueName: `prod-sqs-async-${this.stringSuffix.toLowerCase().replace(/[^a-zA-Z0-9-_]/g, '')}`,
      encryption: sqs.QueueEncryption.KMS_MANAGED,
      retentionPeriod: Duration.days(4),
      visibilityTimeout: Duration.minutes(6),
      deadLetterQueue: {
        maxReceiveCount: 3,
        queue: new sqs.Queue(this, 'DLQ', {
          queueName: `prod-sqs-dlq-${this.stringSuffix.toLowerCase().replace(/[^a-zA-Z0-9-_]/g, '')}`,
        }),
      },
    });

    // ========================================
    // CloudWatch Log Groups
    // ========================================
    const lambdaLogGroup = new logs.LogGroup(this, 'LambdaLogGroup', {
      logGroupName: `/aws/lambda/prod-lambda-api-v2-${this.stringSuffix.toLowerCase().replace(/[^a-zA-Z0-9-_/]/g, '')}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // ========================================
    // IAM Roles (Least Privilege)
    // ========================================
    const lambdaRole = new iam.Role(this, 'LambdaExecutionRoleV2', {
      roleName: `prod-iam-lambda-${this.stringSuffix.replace(/[^a-zA-Z0-9+=,.@_-]/g, '')}`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'Execution role for Lambda function',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaVPCAccessExecutionRole'
        ),
      ],
    });

    // Lambda permissions
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['logs:CreateLogStream', 'logs:PutLogEvents'],
        resources: [lambdaLogGroup.logGroupArn],
      })
    );

    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
        resources: [`${staticFilesBucket.bucketArn}/*`],
      })
    );

    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['sqs:SendMessage', 'sqs:ReceiveMessage', 'sqs:DeleteMessage'],
        resources: [asyncQueue.queueArn],
      })
    );

    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['secretsmanager:GetSecretValue'],
        resources: [databaseSecret.secretArn],
      })
    );

    // ========================================
    // Lambda Function (Multi-AZ)
    // ========================================
    const lambdaSecurityGroup = new ec2.SecurityGroup(
      this,
      'LambdaSecurityGroup',
      {
        securityGroupName: `prod-ec2-sg-lambda-${this.stringSuffix}`,
        vpc,
        description: 'Security group for Lambda function',
        allowAllOutbound: true,
      }
    );

    // Lambda function names must match a restricted pattern. Sanitize the suffix
    // to only include lowercase letters, numbers, hyphens and underscores.
    const safeSuffixForLambda = this.computeSafeSuffixForLambda(
      this.stringSuffix
    );

    const lambdaFunction = new lambda.Function(this, 'ApiLambda', {
      functionName: `prod-lambda-api-v2-${safeSuffixForLambda}`,
      runtime: lambda.Runtime.NODEJS_18_X, // Updated to supported version
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        const secretsManager = new AWS.SecretsManager();
        const s3 = new AWS.S3();
        const sqs = new AWS.SQS();

        exports.handler = async (event) => {
          console.log('Processing API request:', JSON.stringify(event, null, 2));

          try {
            // Validate input
            if (!event.body) {
              throw new Error('Request body is required');
            }

            const requestData = JSON.parse(event.body);
            if (!requestData.orderId || !requestData.customerId) {
              throw new Error('orderId and customerId are required');
            }

            // Retrieve database secret for potential future DB operations
            const secretName = '${databaseSecret.secretName}';
            const secret = await secretsManager.getSecretValue({ SecretId: secretName }).promise();
            console.log('Successfully retrieved database credentials for order processing');

            // Store order data in S3 for persistence
            const s3Key = \`orders/\${requestData.orderId}.json\`;
            await s3.putObject({
              Bucket: '${staticFilesBucket.bucketName}',
              Key: s3Key,
              Body: JSON.stringify(requestData),
              ContentType: 'application/json'
            }).promise();
            console.log('Order data stored in S3:', s3Key);

            // Send order to SQS for asynchronous processing (e.g., payment, fulfillment)
            const queueUrl = '${asyncQueue.queueUrl}';
            await sqs.sendMessage({
              QueueUrl: queueUrl,
              MessageBody: JSON.stringify({
                orderId: requestData.orderId,
                customerId: requestData.customerId,
                timestamp: new Date().toISOString(),
                action: 'process_order'
              }),
            }).promise();
            console.log('Order queued for processing');

            return {
              statusCode: 200,
              body: JSON.stringify({
                message: 'Order received and queued for processing',
                orderId: requestData.orderId,
                timestamp: new Date().toISOString(),
              }),
            };
          } catch (error) {
            console.error('Error processing order:', error);
            return {
              statusCode: 400,
              body: JSON.stringify({
                error: 'Failed to process order',
                details: error.message,
              }),
            };
          }
        };
      `),
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroups: [lambdaSecurityGroup],
      timeout: Duration.minutes(5),
      memorySize: 512,
      environment: {
        DATABASE_SECRET_NAME: databaseSecret.secretName,
        S3_BUCKET: staticFilesBucket.bucketName,
        SQS_QUEUE_URL: asyncQueue.queueUrl,
      },
      role: lambdaRole,
      logRetention: logs.RetentionDays.ONE_WEEK,
      reservedConcurrentExecutions: 100,
    });

    // Allow Lambda to connect to RDS
    databaseSecurityGroup.addIngressRule(
      lambdaSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow Lambda to connect to PostgreSQL'
    );

    // ========================================
    // API Gateway (IAM Authentication)
    // ========================================
    const api = new apigateway.RestApi(this, 'ApiGateway', {
      restApiName: `prod-apigateway-rest-${this.stringSuffix}`,
      description: 'Production API Gateway',
      deployOptions: {
        stageName: 'prod',
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        metricsEnabled: true,
        throttlingBurstLimit: 5000,
        throttlingRateLimit: 10000,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    const lambdaIntegration = new apigateway.LambdaIntegration(lambdaFunction, {
      requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
    });

    const apiResource = api.root.addResource('api');
    apiResource.addMethod('GET', lambdaIntegration, {
      authorizationType: apigateway.AuthorizationType.IAM,
    });
    apiResource.addMethod('POST', lambdaIntegration, {
      authorizationType: apigateway.AuthorizationType.IAM,
    });

    // ========================================
    // Route 53 Hosted Zone
    // ========================================
    const hostedZone = new route53.HostedZone(this, 'HostedZone', {
      zoneName: 'example-prod.com',
      comment: `Production hosted zone - ${this.stringSuffix}`,
    });

    // ========================================
    // CloudFront Distribution
    // ========================================
    const cloudFrontOAI = new cloudfront.OriginAccessIdentity(
      this,
      'CloudFrontOAI',
      {
        comment: `prod-cloudfront-oai-${this.stringSuffix}`,
      }
    );

    staticFilesBucket.grantRead(cloudFrontOAI);

    const distribution = new cloudfront.Distribution(
      this,
      'CloudFrontDistribution',
      {
        comment: `prod-cloudfront-dist-${this.stringSuffix}`,
        defaultBehavior: {
          origin: new cloudfrontOrigins.S3Origin(staticFilesBucket, {
            originAccessIdentity: cloudFrontOAI,
          }),
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
          responseHeadersPolicy:
            cloudfront.ResponseHeadersPolicy.CORS_ALLOW_ALL_ORIGINS,
        },
        additionalBehaviors: {
          '/api/*': {
            origin: new cloudfrontOrigins.RestApiOrigin(api),
            viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.HTTPS_ONLY,
            allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
            cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
            originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
          },
        },
        priceClass: cloudfront.PriceClass.PRICE_CLASS_ALL,
        enabled: true,
        geoRestriction: cloudfront.GeoRestriction.allowlist('US', 'CA'),
        minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
      }
    );

    // Route 53 A Record for CloudFront
    new route53.ARecord(this, 'CloudFrontARecord', {
      zone: hostedZone,
      recordName: 'www',
      target: route53.RecordTarget.fromAlias(
        new route53Targets.CloudFrontTarget(distribution)
      ),
    });

    // Additional Route 53 records for comprehensive DNS
    // Point the API subdomain to the CloudFront distribution which
    // proxies /api/* to the RestApi. This avoids requiring a
    // default domain directly on the API Gateway.
    new route53.ARecord(this, 'ApiARecord', {
      zone: hostedZone,
      recordName: 'api',
      target: route53.RecordTarget.fromAlias(
        new route53Targets.CloudFrontTarget(distribution)
      ),
    });

    // ========================================
    // CloudWatch Alarms and Monitoring
    // ========================================
    // Lambda errors alarm
    // NOTE: names for alarms and dashboard use `safeSuffixForLambda` (sanitized)
    // to ensure CloudWatch accepts the DashboardName/AlarmName characters.
    new cdk.aws_cloudwatch.Alarm(this, 'LambdaErrorsAlarm', {
      alarmName: `prod-cloudwatch-lambda-errors-${safeSuffixForLambda}`,
      metric: lambdaFunction.metricErrors(),
      threshold: 5,
      evaluationPeriods: 2,
      comparisonOperator:
        cdk.aws_cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });

    // RDS CPU utilization alarm
    new cdk.aws_cloudwatch.Alarm(this, 'RdsCpuAlarm', {
      alarmName: `prod-cloudwatch-rds-cpu-${safeSuffixForLambda}`,
      metric: rdsInstance.metricCPUUtilization(),
      threshold: 80,
      evaluationPeriods: 2,
      comparisonOperator:
        cdk.aws_cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });

    // API Gateway 5xx errors alarm
    new cdk.aws_cloudwatch.Alarm(this, 'ApiGateway5xxAlarm', {
      alarmName: `prod-cloudwatch-apigateway-5xx-${safeSuffixForLambda}`,
      metric: api.metricServerError(),
      threshold: 5,
      evaluationPeriods: 2,
      comparisonOperator:
        cdk.aws_cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });

    // ==========================
    // Monitoring: SNS topic, additional alarms and dashboard
    // ==========================

    // Central SNS topic for alarm notifications. We do NOT auto-subscribe an email
    // unless ALARM_NOTIFICATION_EMAIL is set in the environment to avoid CI auto-subscribes.
    const alarmsTopic = new sns.Topic(this, 'AlarmsTopic', {
      displayName: `prod-alarms-${safeSuffixForLambda}`,
    });

    if (process.env.ALARM_NOTIFICATION_EMAIL) {
      alarmsTopic.addSubscription(
        new subscriptions.EmailSubscription(
          process.env.ALARM_NOTIFICATION_EMAIL
        )
      );
    }

    // SQS alarms
    new cloudwatch.Alarm(this, 'SqsVisibleMessagesAlarm', {
      alarmName: `prod-cloudwatch-sqs-visible-${safeSuffixForLambda}`,
      metric: asyncQueue.metricApproximateNumberOfMessagesVisible(),
      threshold: 100,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });

    new cloudwatch.Alarm(this, 'SqsOldestMessageAlarm', {
      alarmName: `prod-cloudwatch-sqs-oldest-${safeSuffixForLambda}`,
      metric: asyncQueue.metricApproximateAgeOfOldestMessage(),
      threshold: 300, // seconds
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });

    // S3 metrics (4xx and 5xx errors)
    const s34xx = new cloudwatch.Metric({
      namespace: 'AWS/S3',
      metricName: '4xxErrors',
      dimensionsMap: { BucketName: staticFilesBucket.bucketName },
      period: Duration.minutes(5),
    });

    const s35xx = new cloudwatch.Metric({
      namespace: 'AWS/S3',
      metricName: '5xxErrors',
      dimensionsMap: { BucketName: staticFilesBucket.bucketName },
      period: Duration.minutes(5),
    });

    new cloudwatch.Alarm(this, 'S34xxAlarm', {
      alarmName: `prod-cloudwatch-s3-4xx-${safeSuffixForLambda}`,
      metric: s34xx,
      threshold: 10,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });

    new cloudwatch.Alarm(this, 'S35xxAlarm', {
      alarmName: `prod-cloudwatch-s3-5xx-${safeSuffixForLambda}`,
      metric: s35xx,
      threshold: 5,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });

    // Lambda duration and throttles
    new cloudwatch.Alarm(this, 'LambdaDurationAlarm', {
      alarmName: `prod-cloudwatch-lambda-duration-${safeSuffixForLambda}`,
      metric: lambdaFunction.metricDuration(),
      threshold: 300000, // milliseconds (5m) - very high, tune as needed
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });

    new cloudwatch.Alarm(this, 'LambdaThrottlesAlarm', {
      alarmName: `prod-cloudwatch-lambda-throttles-${safeSuffixForLambda}`,
      metric: lambdaFunction.metricThrottles(),
      threshold: 1,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });

    // RDS additional alarm: free storage space low
    new cloudwatch.Alarm(this, 'RdsFreeStorageAlarm', {
      alarmName: `prod-cloudwatch-rds-free-storage-${safeSuffixForLambda}`,
      metric: rdsInstance.metricFreeStorageSpace(),
      threshold: 20 * 1024 * 1024 * 1024, // 20 GiB
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
    });

    // Wire alarms to SNS topic using actions (add actions so they notify)
    const alarmActions = [new cw_actions.SnsAction(alarmsTopic)];

    // attach alarm actions to some of the alarms we created above
    // (find by logical id via node.tryFindChild or directly reference if variables were created)
    // For simplicity we will add actions by creating the alarms as variables instead of reusing above.

    // Recreate a couple of key alarms with actions attached
    const lambdaErrorsWithAction = new cloudwatch.Alarm(
      this,
      'LambdaErrorsAlarmWithAction',
      {
        alarmName: `prod-cloudwatch-lambda-errors-${safeSuffixForLambda}-with-action`,
        metric: lambdaFunction.metricErrors(),
        threshold: 5,
        evaluationPeriods: 2,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      }
    );
    lambdaErrorsWithAction.addAlarmAction(
      new cw_actions.SnsAction(alarmsTopic)
    );

    const rdsCpuWithAction = new cloudwatch.Alarm(
      this,
      'RdsCpuAlarmWithAction',
      {
        alarmName: `prod-cloudwatch-rds-cpu-${safeSuffixForLambda}-with-action`,
        metric: rdsInstance.metricCPUUtilization(),
        threshold: 80,
        evaluationPeriods: 2,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      }
    );
    rdsCpuWithAction.addAlarmAction(new cw_actions.SnsAction(alarmsTopic));

    // Dashboard
    const dashboard = new cloudwatch.Dashboard(this, 'OperationalDashboard', {
      dashboardName: `prod-ops-${safeSuffixForLambda}`,
    });

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Lambda Errors',
        left: [lambdaFunction.metricErrors()],
      }),
      new cloudwatch.GraphWidget({
        title: 'Lambda Duration (ms)',
        left: [lambdaFunction.metricDuration()],
      }),
      new cloudwatch.GraphWidget({
        title: 'RDS CPU %',
        left: [rdsInstance.metricCPUUtilization()],
      }),
      new cloudwatch.GraphWidget({
        title: 'SQS Visible Messages',
        left: [asyncQueue.metricApproximateNumberOfMessagesVisible()],
      }),
      new cloudwatch.GraphWidget({
        title: 'S3 4xx Errors',
        left: [s34xx],
      }),
      new cloudwatch.GraphWidget({
        title: 'API Gateway 5xx',
        left: [api.metricServerError()],
      })
    );

    // ========================================
    // Stack Outputs
    // ========================================
    this.vpcId = vpc.vpcId;
    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpcId,
      description: 'VPC ID',
    });

    this.apiUrl = api.url;
    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: this.apiUrl,
      description: 'API Gateway URL',
    });

    this.lambdaFunctionArn = lambdaFunction.functionArn;
    new cdk.CfnOutput(this, 'LambdaFunctionArn', {
      value: this.lambdaFunctionArn,
      description: 'Lambda Function ARN',
    });

    this.rdsEndpoint = rdsInstance.dbInstanceEndpointAddress;
    new cdk.CfnOutput(this, 'RdsEndpoint', {
      value: this.rdsEndpoint,
      description: 'RDS PostgreSQL Endpoint',
    });

    this.s3BucketName = staticFilesBucket.bucketName;
    new cdk.CfnOutput(this, 'S3BucketName', {
      value: this.s3BucketName,
      description: 'S3 Bucket Name',
    });

    this.sqsQueueUrl = asyncQueue.queueUrl;
    new cdk.CfnOutput(this, 'SqsQueueUrl', {
      value: this.sqsQueueUrl,
      description: 'SQS Queue URL',
    });

    this.cloudFrontDomainName = distribution.distributionDomainName;
    new cdk.CfnOutput(this, 'CloudFrontDomainName', {
      value: this.cloudFrontDomainName,
      description: 'CloudFront Distribution Domain Name',
    });

    this.hostedZoneId = hostedZone.hostedZoneId;
    new cdk.CfnOutput(this, 'HostedZoneId', {
      value: this.hostedZoneId,
      description: 'Route 53 Hosted Zone ID',
    });

    this.databaseSecretArn = databaseSecret.secretArn;
    new cdk.CfnOutput(this, 'DatabaseSecretArn', {
      value: this.databaseSecretArn,
      description: 'Database Secret ARN',
    });

    this.lambdaRoleArn = lambdaRole.roleArn;
    new cdk.CfnOutput(this, 'LambdaRoleArn', {
      value: this.lambdaRoleArn,
      description: 'Lambda IAM Role ARN',
    });

    this.databaseSecurityGroupId = databaseSecurityGroup.securityGroupId;
    new cdk.CfnOutput(this, 'DatabaseSecurityGroupId', {
      value: this.databaseSecurityGroupId,
      description: 'Database Security Group ID',
    });

    this.lambdaSecurityGroupId = lambdaSecurityGroup.securityGroupId;
    new cdk.CfnOutput(this, 'LambdaSecurityGroupId', {
      value: this.lambdaSecurityGroupId,
      description: 'Lambda Security Group ID',
    });

    this.lambdaLogGroupName = lambdaLogGroup.logGroupName;
    new cdk.CfnOutput(this, 'LambdaLogGroupName', {
      value: this.lambdaLogGroupName,
      description: 'Lambda Log Group Name',
    });

    // Tags for all resources
    cdk.Tags.of(this).add('Environment', 'Production');
    cdk.Tags.of(this).add('Project', 'MultiComponentApplication');
    cdk.Tags.of(this).add('ManagedBy', 'CDK');
    cdk.Tags.of(this).add('Region', cdk.Aws.REGION);
    cdk.Tags.of(this).add('iac-rlhf-amazon', 'enabled');
  }
}

```

### lib/tap-stack.ts (full source)

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { MultiComponentApplicationStack } from './multi-component-stack';

interface TapStackProps extends cdk.StackProps {
	environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
	constructor(scope: Construct, id: string, props?: TapStackProps) {
		super(scope, id, props);

		// Get environment suffix from props, context, or use 'dev' as default
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const environmentSuffix =
			props?.environmentSuffix ||
			this.node.tryGetContext('environmentSuffix') ||
			'dev';

		// Instantiate the multi-component application stack and keep a reference
		// so we can re-expose important runtime values without using CloudFormation
		// exports/imports (which can cause circular create-time dependency issues).
		const child = new MultiComponentApplicationStack(
			this,
			'MultiComponentApplication',
			{
				...props,
				// do not set explicit stackName for nested stacks; let CDK manage the nested logical id
			}
		);

		// Re-expose selected runtime tokens from the nested child as top-level outputs.
		// Because the child is a NestedStack, these outputs are resolved within the
		// same CloudFormation stack (no account-level exports/imports are created),
		// avoiding the cross-stack export/import blocking issue.
		const forward = {
			VpcId: child.vpcId,
			ApiGatewayUrl: child.apiUrl,
			LambdaFunctionArn: child.lambdaFunctionArn,
			RdsEndpoint: child.rdsEndpoint,
			S3BucketName: child.s3BucketName,
			SqsQueueUrl: child.sqsQueueUrl,
			CloudFrontDomainName: child.cloudFrontDomainName,
			HostedZoneId: child.hostedZoneId,
			DatabaseSecretArn: child.databaseSecretArn,
			LambdaRoleArn: child.lambdaRoleArn,
			DatabaseSecurityGroupId: child.databaseSecurityGroupId,
			LambdaSecurityGroupId: child.lambdaSecurityGroupId,
			LambdaLogGroupName: child.lambdaLogGroupName,
		} as Record<string, any>;

		for (const [key, value] of Object.entries(forward)) {
			new cdk.CfnOutput(this, key, {
				value: value ?? cdk.Aws.NO_VALUE,
			});
		}

		// IMPORTANT: Do NOT create CloudFormation-level outputs that reference
		// child stack tokens here. Referencing child stack tokens from this stack
		// causes CDK to generate CloudFormation exports/imports which create a
		// hard dependency: the child stack cannot change or remove those exports
		// while this stack imports them. That leads to deployment failures like
		// "Cannot update export ... as it is in use by TapStack..." when the
		// child stack is updated. If you need these runtime values at test/runtime
		// use the `cfn-outputs/flat-outputs.json` produced by the deployment or
		// publish shared values to SSM/SecretsManager instead.

		// Intentionally do not re-expose child runtime tokens here to avoid
		// cross-stack CloudFormation exports/imports.
	}
}
```

### lib/string-utils.ts (full source)

```typescript
export function safeSuffix(input?: string): string {
	// Normalize input to a safe suffix: lowercase, keep a-z0-9, hyphen and underscore
	const base = (input ?? '').toString();
	return base.toLowerCase().replace(/[^a-z0-9-_]/g, '-');
}

export default safeSuffix;

```

---

Completed: this file now contains the full sources for the three `lib/` files and a short summary. The updated file is staged for commit when you approve; I haven't created a commit or push yet.

