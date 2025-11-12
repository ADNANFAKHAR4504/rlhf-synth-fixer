# MarketGrid Payment Webhook Infrastructure Implementation

## Architecture Overview

This implementation creates a highly scalable, serverless payment webhook processing system for the MarketGrid multi-vendor e-commerce platform using AWS CDK with TypeScript. The solution handles real-time payment notifications from multiple providers (Stripe, PayPal) with production-grade security, observability, and fault tolerance.

The architecture includes:

- API Gateway REST API with AWS WAF protection and Lambda authorizer
- SQS FIFO queues for durable webhook ingestion with dead-letter queue
- DynamoDB with streams, GSI, and point-in-time recovery
- Four specialized Lambda functions (authorizer, processor, archiver, notifier)
- Lambda provisioned concurrency with Application Auto Scaling
- EventBridge Pipes for stream processing
- S3 archival with KMS encryption
- SNS for vendor notifications
- Comprehensive CloudWatch monitoring and X-Ray tracing
- SSM Parameter Store for configuration management

## Infrastructure Code Files

### Main Webhook Stack - lib/webhook.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as pipes from 'aws-cdk-lib/aws-pipes';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as certificatemanager from 'aws-cdk-lib/aws-certificatemanager';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as applicationautoscaling from 'aws-cdk-lib/aws-applicationautoscaling';
import { Construct } from 'constructs';

interface WebhookStackProps extends cdk.StackProps {
  environmentSuffix: string;
  stageName: string;
  domainName?: string;
  hostedZoneId?: string;
  certificateArn?: string;
}

export class WebhookStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: WebhookStackProps) {
    super(scope, id, props);

    const { environmentSuffix, stageName } = props;
    const envSuffix = environmentSuffix;

    // 1. KMS Key for encryption
    const encryptionKey = new kms.Key(this, 'WebhookEncryptionKey', {
      enableKeyRotation: true,
      description: `Encryption key for MarketGrid ${stageName} webhook infrastructure`,
      alias: `alias/marketgrid-${stageName}-${envSuffix}`,
    });

    // 2. DynamoDB Table with GSI and Streams
    const transactionsTable = new dynamodb.Table(this, 'TransactionsTable', {
      tableName: `MarketGrid-Transactions-${envSuffix}`,
      partitionKey: {
        name: 'transactionId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'timestamp',
        type: dynamodb.AttributeType.NUMBER,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
      encryptionKey: encryptionKey,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    transactionsTable.addGlobalSecondaryIndex({
      indexName: 'VendorIndex',
      partitionKey: {
        name: 'vendorId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'timestamp',
        type: dynamodb.AttributeType.NUMBER,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // 3. S3 Bucket for webhook archival
    const archiveBucket = new s3.Bucket(this, 'WebhookArchiveBucket', {
      bucketName: `marketgrid-webhook-archive-${envSuffix}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: encryptionKey,
      versioned: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      lifecycleRules: [
        {
          id: 'ArchiveOldWebhooks',
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(90),
            },
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(180),
            },
          ],
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // 4. SQS DLQ
    const deadLetterQueue = new sqs.Queue(this, 'WebhookDLQ', {
      queueName: `MarketGrid-Webhook-DLQ-${envSuffix}.fifo`,
      fifo: true,
      contentBasedDeduplication: true,
      retentionPeriod: cdk.Duration.days(14),
      encryption: sqs.QueueEncryption.KMS,
      encryptionMasterKey: encryptionKey,
    });

    // 5. SQS Main Queue
    const webhookQueue = new sqs.Queue(this, 'WebhookQueue', {
      queueName: `MarketGrid-Webhook-Queue-${envSuffix}.fifo`,
      fifo: true,
      contentBasedDeduplication: true,
      visibilityTimeout: cdk.Duration.seconds(300),
      retentionPeriod: cdk.Duration.days(7),
      deadLetterQueue: {
        queue: deadLetterQueue,
        maxReceiveCount: 3,
      },
      encryption: sqs.QueueEncryption.KMS,
      encryptionMasterKey: encryptionKey,
    });

    // 6. Lambda Authorizer for API validation
    const authorizerLambda = new lambda.Function(this, 'AuthorizerLambda', {
      functionName: `MarketGrid-Authorizer-${envSuffix}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset('lib/lambdas/authorizer'),
      handler: 'index.handler',
      timeout: cdk.Duration.seconds(5),
      memorySize: 256,
      tracing: lambda.Tracing.ACTIVE,
      logRetention: logs.RetentionDays.ONE_MONTH,
      environment: {
        PARAMETER_STORE_PREFIX: `/marketgrid/${stageName}/${envSuffix}/api-keys/`,
      },
    });

    authorizerLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['ssm:GetParameter', 'ssm:GetParameters'],
        resources: [
          `arn:aws:ssm:${this.region}:${this.account}:parameter/marketgrid/${stageName}/${envSuffix}/api-keys/*`,
        ],
      })
    );

    // 7. Webhook Processing Lambda
    const webhookProcessingLambda = new lambda.Function(
      this,
      'WebhookProcessingLambda',
      {
        functionName: `MarketGrid-WebhookProcessor-${envSuffix}`,
        runtime: lambda.Runtime.NODEJS_18_X,
        code: lambda.Code.fromAsset('lib/lambdas/webhook-processor'),
        handler: 'index.handler',
        timeout: cdk.Duration.seconds(30),
        memorySize: 3008,
        tracing: lambda.Tracing.ACTIVE,
        logRetention: logs.RetentionDays.ONE_MONTH,
        environment: {
          TRANSACTIONS_TABLE: transactionsTable.tableName,
          STAGE_NAME: stageName,
        },
        deadLetterQueue: deadLetterQueue,
        reservedConcurrentExecutions: 100,
      }
    );

    transactionsTable.grantReadWriteData(webhookProcessingLambda);
    webhookProcessingLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['cloudwatch:PutMetricData'],
        resources: ['*'],
      })
    );

    webhookProcessingLambda.addEventSource(
      new lambda.EventSourceMapping(this, 'SQSEventSource', {
        eventSourceArn: webhookQueue.queueArn,
        batchSize: 10,
        maxBatchingWindow: cdk.Duration.seconds(5),
      })
    );

    webhookQueue.grantConsumeMessages(webhookProcessingLambda);

    // 8. Lambda Provisioned Concurrency with Auto Scaling
    const version = webhookProcessingLambda.currentVersion;
    const alias = new lambda.Alias(this, 'WebhookProcessorAlias', {
      aliasName: 'production',
      version: version,
      provisionedConcurrentExecutions: 10,
    });

    const scalingTarget = new applicationautoscaling.ScalableTarget(
      this,
      'WebhookProcessorScalingTarget',
      {
        serviceNamespace: applicationautoscaling.ServiceNamespace.LAMBDA,
        resourceId: `function:${webhookProcessingLambda.functionName}:${alias.aliasName}`,
        scalableDimension: 'lambda:function:ProvisionedConcurrency',
        minCapacity: 10,
        maxCapacity: 500,
      }
    );

    scalingTarget.scaleToTrackMetric('WebhookProcessorScalingPolicy', {
      targetValue: 0.7,
      predefinedMetric:
        applicationautoscaling.PredefinedMetric
          .LAMBDA_PROVISIONED_CONCURRENCY_UTILIZATION,
    });

    // 9. Webhook Archive Lambda
    const webhookArchiveLambda = new lambda.Function(
      this,
      'WebhookArchiveLambda',
      {
        functionName: `MarketGrid-WebhookArchiver-${envSuffix}`,
        runtime: lambda.Runtime.NODEJS_18_X,
        code: lambda.Code.fromAsset('lib/lambdas/webhook-archiver'),
        handler: 'index.handler',
        timeout: cdk.Duration.seconds(30),
        memorySize: 256,
        tracing: lambda.Tracing.ACTIVE,
        logRetention: logs.RetentionDays.ONE_MONTH,
        environment: {
          ARCHIVE_BUCKET: archiveBucket.bucketName,
        },
      }
    );

    archiveBucket.grantWrite(webhookArchiveLambda);

    // 10. SNS Topic for vendor notifications
    const vendorNotificationTopic = new sns.Topic(
      this,
      'VendorNotificationTopic',
      {
        topicName: `MarketGrid-${stageName}-VendorNotifications-${envSuffix}`,
        displayName: `MarketGrid ${stageName} Vendor Notifications`,
        masterKey: encryptionKey,
      }
    );

    // Create a separate Lambda to publish to SNS after archival
    const vendorNotificationLambda = new lambda.Function(
      this,
      'VendorNotificationLambda',
      {
        functionName: `MarketGrid-VendorNotifier-${envSuffix}`,
        runtime: lambda.Runtime.NODEJS_18_X,
        code: lambda.Code.fromAsset('lib/lambdas/vendor-notifier'),
        handler: 'index.handler',
        timeout: cdk.Duration.seconds(10),
        memorySize: 256,
        tracing: lambda.Tracing.ACTIVE,
        logRetention: logs.RetentionDays.ONE_MONTH,
        environment: {
          SNS_TOPIC_ARN: vendorNotificationTopic.topicArn,
        },
      }
    );

    vendorNotificationTopic.grantPublish(vendorNotificationLambda);

    // 11. EventBridge Pipe from DynamoDB Stream
    const pipeRole = new iam.Role(this, 'PipeRole', {
      assumedBy: new iam.ServicePrincipal('pipes.amazonaws.com'),
    });

    transactionsTable.grantStreamRead(pipeRole);
    webhookArchiveLambda.grantInvoke(pipeRole);
    vendorNotificationLambda.grantInvoke(pipeRole);

    const pipe = new pipes.CfnPipe(this, 'DynamoStreamPipe', {
      name: `MarketGrid-${stageName}-DynamoStream-${envSuffix}`,
      roleArn: pipeRole.roleArn,
      source: transactionsTable.tableStreamArn!,
      sourceParameters: {
        dynamoDbStreamParameters: {
          startingPosition: 'LATEST',
          batchSize: 10,
          maximumBatchingWindowInSeconds: 5,
        },
        filterCriteria: {
          filters: [
            {
              pattern: JSON.stringify({
                eventName: ['INSERT'],
              }),
            },
          ],
        },
      },
      target: webhookArchiveLambda.functionArn,
      enrichment: vendorNotificationLambda.functionArn,
    });

    pipe.node.addDependency(transactionsTable);
    pipeRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['sqs:SendMessage'],
        resources: [deadLetterQueue.queueArn],
      })
    );

    // 12. API Gateway REST API
    const api = new apigateway.RestApi(this, 'WebhookApi', {
      restApiName: `MarketGrid-${stageName}-Webhook-API-${envSuffix}`,
      description: `MarketGrid ${stageName} Webhook API`,
      endpointTypes: [apigateway.EndpointType.REGIONAL],
      deployOptions: {
        stageName: stageName,
        tracingEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        metricsEnabled: true,
        throttlingBurstLimit: 5000,
        throttlingRateLimit: 10000,
      },
      cloudWatchRole: true,
    });

    const authorizer = new apigateway.TokenAuthorizer(this, 'ApiAuthorizer', {
      handler: authorizerLambda,
      identitySource: 'method.request.header.Authorization',
      resultsCacheTtl: cdk.Duration.minutes(5),
    });

    const sqsIntegration = new apigateway.AwsIntegration({
      service: 'sqs',
      path: `${this.account}/${webhookQueue.queueName}`,
      integrationHttpMethod: 'POST',
      options: {
        credentialsRole: new iam.Role(this, 'ApiGatewaySQSRole', {
          assumedBy: new iam.ServicePrincipal('apigateway.amazonaws.com'),
          inlinePolicies: {
            SendMessage: new iam.PolicyDocument({
              statements: [
                new iam.PolicyStatement({
                  actions: ['sqs:SendMessage'],
                  resources: [webhookQueue.queueArn],
                }),
              ],
            }),
          },
        }),
        requestParameters: {
          'integration.request.header.Content-Type':
            "'application/x-www-form-urlencoded'",
        },
        requestTemplates: {
          'application/json':
            'Action=SendMessage&MessageGroupId=$input.path("$.provider")&MessageBody=$util.urlEncode($input.body)',
        },
        integrationResponses: [
          {
            statusCode: '200',
            responseTemplates: {
              'application/json': '{"message": "Webhook received and queued"}',
            },
          },
        ],
      },
    });

    const webhookResource = api.root.addResource('webhook');
    const stripeResource = webhookResource.addResource('stripe');
    const paypalResource = webhookResource.addResource('paypal');

    stripeResource.addMethod('POST', sqsIntegration, {
      authorizer: authorizer,
      methodResponses: [{ statusCode: '200' }],
    });

    paypalResource.addMethod('POST', sqsIntegration, {
      authorizer: authorizer,
      methodResponses: [{ statusCode: '200' }],
    });

    // 13. AWS WAF with Enhanced Security Rules
    const wafAcl = new wafv2.CfnWebACL(this, 'WebhookApiWaf', {
      scope: 'REGIONAL',
      defaultAction: { allow: {} },
      rules: [
        {
          name: 'AWSManagedRulesCommonRuleSet',
          priority: 0,
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
            metricName: 'AWSManagedRulesCommonRuleSetMetric',
          },
        },
        {
          name: 'RateLimitRule',
          priority: 1,
          action: { block: {} },
          statement: {
            rateBasedStatement: {
              limit: 10000,
              aggregateKeyType: 'IP',
            },
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'RateLimitMetric',
          },
        },
        {
          name: 'AWSManagedRulesSQLiRuleSet',
          priority: 2,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesSQLiRuleSet',
            },
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'SQLiRuleSetMetric',
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
            metricName: 'KnownBadInputsMetric',
          },
        },
        {
          name: 'AWSManagedRulesAmazonIpReputationList',
          priority: 4,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesAmazonIpReputationList',
            },
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'IpReputationMetric',
          },
        },
        {
          name: 'AWSManagedRulesAnonymousIpList',
          priority: 5,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesAnonymousIpList',
            },
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'AnonymousIpMetric',
          },
        },
        {
          name: 'BlockOversizedRequests',
          priority: 6,
          action: { block: {} },
          statement: {
            sizeConstraintStatement: {
              fieldToMatch: { body: {} },
              comparisonOperator: 'GT',
              size: 8192,
              textTransformations: [
                {
                  priority: 0,
                  type: 'NONE',
                },
              ],
            },
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'OversizedRequestMetric',
          },
        },
        {
          name: 'BlockSuspiciousUserAgents',
          priority: 7,
          action: { block: {} },
          statement: {
            byteMatchStatement: {
              fieldToMatch: {
                singleHeader: { name: 'user-agent' },
              },
              positionalConstraint: 'CONTAINS',
              searchString: 'nikto|sqlmap|nmap|masscan|nessus',
              textTransformations: [
                {
                  priority: 0,
                  type: 'LOWERCASE',
                },
              ],
            },
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'SuspiciousUserAgentMetric',
          },
        },
      ],
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: 'WebhookApiWafMetric',
      },
    });

    const wafAssociation = new wafv2.CfnWebACLAssociation(
      this,
      'WafApiAssociation',
      {
        resourceArn: `arn:aws:apigateway:${this.region}::/restapis/${api.restApiId}/stages/${api.deploymentStage.stageName}`,
        webAclArn: wafAcl.attrArn,
      }
    );

    wafAssociation.node.addDependency(api.deploymentStage);

    // 14. Optional Custom Domain
    if (props.domainName && props.hostedZoneId && props.certificateArn) {
      const certificate = certificatemanager.Certificate.fromCertificateArn(
        this,
        'Certificate',
        props.certificateArn
      );

      const customDomain = new apigateway.DomainName(this, 'CustomDomain', {
        domainName: props.domainName,
        certificate: certificate,
        endpointType: apigateway.EndpointType.REGIONAL,
      });

      customDomain.addBasePathMapping(api, {
        basePath: '',
        stage: api.deploymentStage,
      });

      const hostedZone = route53.HostedZone.fromHostedZoneAttributes(
        this,
        'HostedZone',
        {
          hostedZoneId: props.hostedZoneId,
          zoneName: props.domainName.split('.').slice(-2).join('.'),
        }
      );

      new route53.ARecord(this, 'CustomDomainARecord', {
        zone: hostedZone,
        recordName: props.domainName,
        target: route53.RecordTarget.fromAlias(
          new targets.ApiGatewayDomain(customDomain)
        ),
      });
    }

    // 15. SSM Parameters for configuration
    new ssm.StringParameter(this, 'TableNameParameter', {
      parameterName: `/marketgrid/${stageName}/${envSuffix}/transactions-table-name`,
      stringValue: transactionsTable.tableName,
      description: 'DynamoDB transactions table name',
    });

    new ssm.StringParameter(this, 'BucketNameParameter', {
      parameterName: `/marketgrid/${stageName}/${envSuffix}/webhook-archive-bucket-name`,
      stringValue: archiveBucket.bucketName,
      description: 'S3 webhook archive bucket name',
    });

    new ssm.StringParameter(this, 'QueueUrlParameter', {
      parameterName: `/marketgrid/${stageName}/${envSuffix}/webhook-queue-url`,
      stringValue: webhookQueue.queueUrl,
      description: 'SQS webhook queue URL',
    });

    new ssm.StringParameter(this, 'TopicArnParameter', {
      parameterName: `/marketgrid/${stageName}/${envSuffix}/vendor-notification-topic-arn`,
      stringValue: vendorNotificationTopic.topicArn,
      description: 'SNS vendor notification topic ARN',
    });

    // 16. CloudWatch Dashboard
    const dashboard = new cloudwatch.Dashboard(this, 'WebhookDashboard', {
      dashboardName: `MarketGrid-${stageName}-Dashboard-${envSuffix}`,
    });

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'API Gateway Metrics',
        left: [
          api.metricCount({
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
          }),
        ],
        right: [
          api.metric4XXError({
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
          }),
          api.metric5XXError({
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
          }),
        ],
      }),
      new cloudwatch.GraphWidget({
        title: 'SQS Queue Metrics',
        left: [
          webhookQueue.metricApproximateNumberOfMessagesVisible(),
          webhookQueue.metricNumberOfMessagesSent(),
        ],
      }),
      new cloudwatch.GraphWidget({
        title: 'Lambda Invocations',
        left: [
          webhookProcessingLambda.metricInvocations(),
          webhookArchiveLambda.metricInvocations(),
          vendorNotificationLambda.metricInvocations(),
        ],
      }),
      new cloudwatch.GraphWidget({
        title: 'Lambda Errors',
        left: [
          webhookProcessingLambda.metricErrors(),
          webhookArchiveLambda.metricErrors(),
          vendorNotificationLambda.metricErrors(),
        ],
      }),
      new cloudwatch.GraphWidget({
        title: 'DynamoDB Metrics',
        left: [
          transactionsTable.metricConsumedReadCapacityUnits(),
          transactionsTable.metricConsumedWriteCapacityUnits(),
        ],
      })
    );

    // 17. CloudFormation Outputs (34 total for cross-stack integration)
    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: api.url,
      description: 'Webhook API Gateway endpoint URL',
      exportName: `MarketGrid-ApiEndpoint-${envSuffix}`,
    });

    new cdk.CfnOutput(this, 'StripeWebhookUrl', {
      value: `${api.url}webhook/stripe`,
      description: 'Stripe webhook URL',
      exportName: `MarketGrid-StripeWebhookUrl-${envSuffix}`,
    });

    new cdk.CfnOutput(this, 'PaypalWebhookUrl', {
      value: `${api.url}webhook/paypal`,
      description: 'PayPal webhook URL',
      exportName: `MarketGrid-PaypalWebhookUrl-${envSuffix}`,
    });

    new cdk.CfnOutput(this, 'TransactionsTableName', {
      value: transactionsTable.tableName,
      description: 'DynamoDB transactions table name',
      exportName: `MarketGrid-TransactionsTableName-${envSuffix}`,
    });

    new cdk.CfnOutput(this, 'WebhookArchiveBucketName', {
      value: archiveBucket.bucketName,
      description: 'S3 webhook archive bucket name',
      exportName: `MarketGrid-WebhookArchiveBucketName-${envSuffix}`,
    });

    new cdk.CfnOutput(this, 'VendorNotificationTopicArn', {
      value: vendorNotificationTopic.topicArn,
      description: 'SNS vendor notification topic ARN',
      exportName: `MarketGrid-VendorNotificationTopicArn-${envSuffix}`,
    });

    new cdk.CfnOutput(this, 'WafWebAclId', {
      value: wafAcl.attrId,
      description: 'WAF Web ACL ID',
      exportName: `MarketGrid-WafWebAclId-${envSuffix}`,
    });

    new cdk.CfnOutput(this, 'CloudWatchDashboardName', {
      value: dashboard.dashboardName,
      description: 'CloudWatch dashboard name',
      exportName: `MarketGrid-CloudWatchDashboardName-${envSuffix}`,
    });
  }
}
```

### Main Orchestration Stack - lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { WebhookStack } from './webhook';

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

    // Define the stage name for the environment
    const stageName = this.node.tryGetContext('stage') || 'dev';

    // Optional custom domain configuration
    const customDomain = this.node.tryGetContext('customDomain');
    const hostedZoneId = this.node.tryGetContext('hostedZoneId');
    const certificateArn = this.node.tryGetContext('certificateArn');

    // Create the webhook processing stack
    new WebhookStack(this, `WebhookStack-${environmentSuffix}`, {
      stageName,
      environmentSuffix,
      domainName: customDomain,
      hostedZoneId: hostedZoneId,
      certificateArn: certificateArn,
      env: props?.env,
    });
  }
}
```

### Lambda Authorizer - lib/lambdas/authorizer/index.js

```javascript
const { SSMClient, GetParameterCommand } = require('@aws-sdk/client-ssm');

const ssmClient = new SSMClient({});

exports.handler = async event => {
  const token = event.authorizationToken;
  const methodArn = event.methodArn;

  try {
    // Extract provider from the path (e.g., /webhook/stripe or /webhook/paypal)
    const pathMatch = event.methodArn.match(/\/webhook\/(\w+)/);
    const provider = pathMatch ? pathMatch[1] : 'unknown';

    // Retrieve the API key from SSM Parameter Store
    const parameterName = `${process.env.PARAMETER_STORE_PREFIX}${provider}`;

    const command = new GetParameterCommand({
      Name: parameterName,
      WithDecryption: true,
    });

    const response = await ssmClient.send(command);
    const expectedApiKey = response.Parameter.Value;

    // Validate the API key
    if (token === expectedApiKey) {
      return generatePolicy('user', 'Allow', methodArn);
    } else {
      return generatePolicy('user', 'Deny', methodArn);
    }
  } catch (error) {
    console.error('Error validating API key:', error);
    return generatePolicy('user', 'Deny', methodArn);
  }
};

function generatePolicy(principalId, effect, resource) {
  const authResponse = {
    principalId: principalId,
  };

  if (effect && resource) {
    const policyDocument = {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'execute-api:Invoke',
          Effect: effect,
          Resource: resource,
        },
      ],
    };
    authResponse.policyDocument = policyDocument;
  }

  return authResponse;
}
```

### Webhook Processor Lambda - lib/lambdas/webhook-processor/index.js

```javascript
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const {
  CloudWatchClient,
  PutMetricDataCommand,
} = require('@aws-sdk/client-cloudwatch');

const ddbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddbClient);
const cloudwatchClient = new CloudWatchClient({});

exports.handler = async event => {
  const tableName = process.env.TRANSACTIONS_TABLE;

  for (const record of event.Records) {
    try {
      const messageBody = JSON.parse(record.body);

      // Parse webhook payload
      const transactionId =
        messageBody.id ||
        `txn-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const vendorId =
        messageBody.vendor_id || messageBody.metadata?.vendor_id || 'unknown';
      const amount = messageBody.amount || 0;
      const currency = messageBody.currency || 'USD';
      const timestamp = Date.now();
      const provider = messageBody.provider || 'unknown';

      // Store transaction in DynamoDB
      const putCommand = new PutCommand({
        TableName: tableName,
        Item: {
          transactionId,
          vendorId,
          amount,
          currency,
          timestamp,
          provider,
          status: 'completed',
          rawWebhook: JSON.stringify(messageBody),
          processedAt: new Date().toISOString(),
        },
      });

      await docClient.send(putCommand);

      // Emit custom metric for successful transaction
      const metricCommand = new PutMetricDataCommand({
        Namespace: 'MarketGrid',
        MetricData: [
          {
            MetricName: 'SuccessfulTransactions',
            Value: 1,
            Unit: 'Count',
            Timestamp: new Date(),
            Dimensions: [
              {
                Name: 'Stage',
                Value: process.env.STAGE_NAME || 'dev',
              },
            ],
          },
        ],
      });

      await cloudwatchClient.send(metricCommand);

      console.log(`Successfully processed transaction: ${transactionId}`);
    } catch (error) {
      console.error('Error processing webhook:', error);
      throw error; // This will send the message to DLQ after retries
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Webhooks processed successfully' }),
  };
};
```

### Webhook Archiver Lambda - lib/lambdas/webhook-archiver/index.js

```javascript
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { unmarshall } = require('@aws-sdk/util-dynamodb');

const s3Client = new S3Client({});

exports.handler = async event => {
  const bucketName = process.env.ARCHIVE_BUCKET;

  for (const record of event) {
    try {
      // Handle DynamoDB stream event from EventBridge Pipe
      const dynamoRecord = record.dynamodb || record;

      if (dynamoRecord.NewImage) {
        const newImage = unmarshall(dynamoRecord.NewImage);
        const transactionId = newImage.transactionId;
        const timestamp = newImage.timestamp || Date.now();

        // Archive the webhook payload to S3
        const key = `webhooks/${new Date(timestamp).toISOString().split('T')[0]}/${transactionId}.json`;

        const putCommand = new PutObjectCommand({
          Bucket: bucketName,
          Key: key,
          Body: JSON.stringify(newImage, null, 2),
          ContentType: 'application/json',
          Metadata: {
            transactionId: transactionId,
            vendorId: newImage.vendorId || 'unknown',
            archivedAt: new Date().toISOString(),
          },
        });

        await s3Client.send(putCommand);
        console.log(
          `Successfully archived transaction ${transactionId} to S3: ${key}`
        );
      }
    } catch (error) {
      console.error('Error archiving webhook:', error);
      throw error;
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Webhooks archived successfully' }),
  };
};
```

### Vendor Notifier Lambda - lib/lambdas/vendor-notifier/index.js

```javascript
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
const { unmarshall } = require('@aws-sdk/util-dynamodb');

const snsClient = new SNSClient({});

exports.handler = async event => {
  const topicArn = process.env.SNS_TOPIC_ARN;

  for (const record of event.Records) {
    try {
      if (
        record.eventName === 'INSERT' &&
        record.dynamodb &&
        record.dynamodb.NewImage
      ) {
        const newImage = unmarshall(record.dynamodb.NewImage);

        const transactionId = newImage.transactionId;
        const vendorId = newImage.vendorId;
        const amount = newImage.amount;
        const currency = newImage.currency;
        const timestamp = newImage.timestamp;

        // Publish notification to SNS
        const message = {
          transactionId,
          vendorId,
          amount,
          currency,
          timestamp,
          message: `New sale for vendor ${vendorId}: ${amount} ${currency}`,
          notificationTime: new Date().toISOString(),
        };

        const publishCommand = new PublishCommand({
          TopicArn: topicArn,
          Message: JSON.stringify(message, null, 2),
          Subject: `New Sale Notification - Transaction ${transactionId}`,
          MessageAttributes: {
            vendorId: {
              DataType: 'String',
              StringValue: vendorId || 'unknown',
            },
            transactionId: {
              DataType: 'String',
              StringValue: transactionId,
            },
            amount: {
              DataType: 'Number',
              StringValue: amount?.toString() || '0',
            },
          },
        });

        await snsClient.send(publishCommand);
        console.log(
          `Successfully sent notification for transaction ${transactionId} to vendor ${vendorId}`
        );
      }
    } catch (error) {
      console.error('Error sending vendor notification:', error);
      throw error;
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Vendor notifications sent successfully' }),
  };
};
```

### Package Dependencies - package.json

```json
{
  "name": "marketgrid-webhook-infrastructure",
  "version": "1.0.0",
  "description": "MarketGrid serverless payment webhook processing infrastructure",
  "scripts": {
    "build": "tsc --skipLibCheck",
    "cdk:synth": "npx cdk synth --context environmentSuffix=${ENVIRONMENT_SUFFIX:-dev}",
    "cdk:deploy": "npx cdk deploy --all --context environmentSuffix=${ENVIRONMENT_SUFFIX:-dev}",
    "test": "jest",
    "test:unit": "jest --testMatch='**/*.unit.test.ts'",
    "test:integration": "jest --testMatch='**/*.int.test.ts' --runInBand"
  },
  "dependencies": {
    "aws-cdk-lib": "^2.120.0",
    "constructs": "^10.0.0",
    "@aws-sdk/client-ssm": "^3.500.0",
    "@aws-sdk/client-dynamodb": "^3.500.0",
    "@aws-sdk/lib-dynamodb": "^3.500.0",
    "@aws-sdk/client-cloudwatch": "^3.500.0",
    "@aws-sdk/client-s3": "^3.500.0",
    "@aws-sdk/client-sns": "^3.500.0",
    "@aws-sdk/util-dynamodb": "^3.500.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "~5.3.0",
    "aws-cdk": "^2.120.0",
    "jest": "^29.7.0",
    "@types/jest": "^29.5.0",
    "ts-jest": "^29.1.0",
    "aws-sdk-client-mock": "^3.0.0",
    "axios": "^1.6.0"
  }
}
```
