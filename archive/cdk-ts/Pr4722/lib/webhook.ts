import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as pipes from 'aws-cdk-lib/aws-pipes';
import * as appscaling from 'aws-cdk-lib/aws-applicationautoscaling';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import {
  SqsEventSource,
  DynamoEventSource,
} from 'aws-cdk-lib/aws-lambda-event-sources';

export interface WebhookStackProps extends cdk.StackProps {
  stageName: string;
  environmentSuffix: string;
  domainName?: string;
  hostedZoneId?: string;
  certificateArn?: string;
}

export class WebhookStack extends cdk.Stack {
  public readonly apiGateway: apigateway.RestApi;
  public readonly transactionsTable: dynamodb.Table;
  public readonly vendorNotificationTopic: sns.Topic;

  constructor(scope: Construct, id: string, props: WebhookStackProps) {
    super(scope, id, props);

    const stageName = props.stageName;
    const envSuffix = props.environmentSuffix;

    // 1. KMS Key for encryption
    const encryptionKey = new kms.Key(this, 'EncryptionKey', {
      enableKeyRotation: true,
      description: `MarketGrid ${stageName} encryption key`,
      alias: `alias/marketgrid-${stageName}-${envSuffix}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // 2. DynamoDB Table with GSI for vendor queries
    const transactionsTable = new dynamodb.Table(this, 'TransactionsTable', {
      tableName: `MarketGrid-Transactions-${envSuffix}`,
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      partitionKey: {
        name: 'transactionId',
        type: dynamodb.AttributeType.STRING,
      },
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
      encryptionKey: encryptionKey,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
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

    this.transactionsTable = transactionsTable;

    // Store table name in SSM Parameter Store
    new ssm.StringParameter(this, 'TransactionsTableNameParam', {
      parameterName: `/marketgrid/${stageName}/${envSuffix}/transactions-table-name`,
      stringValue: transactionsTable.tableName,
    });

    // 3. S3 Bucket for webhook archival
    const webhookArchiveBucket = new s3.Bucket(this, 'WebhookArchiveBucket', {
      bucketName: `marketgrid-webhook-archive-${envSuffix}`.toLowerCase(),
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: encryptionKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      lifecycleRules: [
        {
          id: 'ArchiveOldWebhooks',
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

    // Store bucket name in SSM
    new ssm.StringParameter(this, 'WebhookArchiveBucketNameParam', {
      parameterName: `/marketgrid/${stageName}/${envSuffix}/webhook-archive-bucket-name`,
      stringValue: webhookArchiveBucket.bucketName,
    });

    // 4. Dead Letter Queue for failed processing
    const webhookDlq = new sqs.Queue(this, 'WebhookDLQ', {
      queueName: `MarketGrid-Webhook-DLQ-${envSuffix}.fifo`,
      fifo: true,
      contentBasedDeduplication: true,
      visibilityTimeout: cdk.Duration.seconds(300),
      retentionPeriod: cdk.Duration.days(14),
      encryption: sqs.QueueEncryption.KMS,
      encryptionMasterKey: encryptionKey,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // 5. Main SQS FIFO Queue for webhook ingestion
    const webhookQueue = new sqs.Queue(this, 'WebhookQueue', {
      queueName: `MarketGrid-Webhook-Queue-${envSuffix}.fifo`,
      fifo: true,
      contentBasedDeduplication: true,
      visibilityTimeout: cdk.Duration.seconds(300),
      retentionPeriod: cdk.Duration.days(7),
      encryption: sqs.QueueEncryption.KMS,
      encryptionMasterKey: encryptionKey,
      deadLetterQueue: {
        maxReceiveCount: 3,
        queue: webhookDlq,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Store queue URL in SSM
    new ssm.StringParameter(this, 'WebhookQueueUrlParam', {
      parameterName: `/marketgrid/${stageName}/${envSuffix}/webhook-queue-url`,
      stringValue: webhookQueue.queueUrl,
    });

    // 6. Lambda Authorizer for API validation
    const authorizerLambda = new lambda.Function(this, 'AuthorizerLambda', {
      functionName: `MarketGrid-Authorizer-${envSuffix}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset('lib/lambdas/authorizer'),
      handler: 'index.handler',
      memorySize: 256,
      timeout: cdk.Duration.seconds(5),
      environment: {
        PARAMETER_STORE_PREFIX: `/marketgrid/${stageName}/${envSuffix}/api-keys/`,
      },
      tracing: lambda.Tracing.ACTIVE,
      logRetention: logs.RetentionDays.ONE_MONTH,
    });

    // Grant SSM parameter access to authorizer
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
        memorySize: 3008,
        timeout: cdk.Duration.seconds(30),
        environment: {
          TRANSACTIONS_TABLE: transactionsTable.tableName,
        },
        tracing: lambda.Tracing.ACTIVE,
        logRetention: logs.RetentionDays.ONE_MONTH,
      }
    );

    // Grant DynamoDB permissions
    transactionsTable.grantReadWriteData(webhookProcessingLambda);

    // Grant CloudWatch Metrics permissions
    webhookProcessingLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['cloudwatch:PutMetricData'],
        resources: ['*'],
      })
    );

    // Configure SQS as event source (FIFO queues don't support maxBatchingWindow)
    webhookProcessingLambda.addEventSource(
      new SqsEventSource(webhookQueue, {
        batchSize: 10,
      })
    );

    // 8. Provisioned Concurrency and Auto-scaling
    const version = webhookProcessingLambda.currentVersion;
    const provisionedAlias = new lambda.Alias(this, 'WebhookProcessingAlias', {
      aliasName: 'production',
      version,
      provisionedConcurrentExecutions: 10,
    });

    // Create scalable target - must wait for alias to be created
    const scalableTarget = new appscaling.ScalableTarget(
      this,
      'WebhookProcessingScaling',
      {
        serviceNamespace: appscaling.ServiceNamespace.LAMBDA,
        resourceId: `function:${webhookProcessingLambda.functionName}:${provisionedAlias.aliasName}`,
        minCapacity: 10,
        maxCapacity: 500,
        scalableDimension: 'lambda:function:ProvisionedConcurrency',
      }
    );

    // Ensure scalable target waits for alias to be created
    scalableTarget.node.addDependency(provisionedAlias);

    // Add scaling policy
    scalableTarget.scaleToTrackMetric('ConcurrencyUtilizationScaling', {
      targetValue: 0.7,
      predefinedMetric:
        appscaling.PredefinedMetric.LAMBDA_PROVISIONED_CONCURRENCY_UTILIZATION,
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
        memorySize: 256,
        timeout: cdk.Duration.seconds(30),
        environment: {
          ARCHIVE_BUCKET: webhookArchiveBucket.bucketName,
        },
        tracing: lambda.Tracing.ACTIVE,
        logRetention: logs.RetentionDays.ONE_MONTH,
      }
    );

    // Grant S3 write permissions
    webhookArchiveBucket.grantWrite(webhookArchiveLambda);

    // 10. SNS Topic for Vendor Notifications
    const vendorNotificationTopic = new sns.Topic(
      this,
      'VendorNotificationTopic',
      {
        topicName: `MarketGrid-${stageName}-VendorNotifications-${envSuffix}`,
        displayName: `MarketGrid ${stageName} Vendor Notifications`,
        masterKey: encryptionKey,
      }
    );

    this.vendorNotificationTopic = vendorNotificationTopic;

    // Store SNS topic ARN in SSM
    new ssm.StringParameter(this, 'VendorNotificationTopicArnParam', {
      parameterName: `/marketgrid/${stageName}/${envSuffix}/vendor-notification-topic-arn`,
      stringValue: vendorNotificationTopic.topicArn,
    });

    // 11. EventBridge Pipe from DynamoDB Stream to Lambda and SNS
    const pipeRole = new iam.Role(this, 'DynamoDbToPipeRole', {
      assumedBy: new iam.ServicePrincipal('pipes.amazonaws.com'),
    });

    // Grant necessary permissions for the pipe
    transactionsTable.grantStreamRead(pipeRole);
    webhookArchiveLambda.grantInvoke(pipeRole);
    vendorNotificationTopic.grantPublish(pipeRole);

    // Create the EventBridge Pipe - target is Lambda
    // Note: DLQ removed as EventBridge Pipes don't support FIFO queues as DLQ
    new pipes.CfnPipe(this, 'DynamoDbStreamPipe', {
      name: `MarketGrid-${stageName}-DynamoStream-${envSuffix}`,
      roleArn: pipeRole.roleArn,
      source: transactionsTable.tableStreamArn!,
      sourceParameters: {
        dynamoDbStreamParameters: {
          startingPosition: 'LATEST',
          batchSize: 10,
          maximumBatchingWindowInSeconds: 5,
          onPartialBatchItemFailure: 'AUTOMATIC_BISECT',
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
      targetParameters: {
        lambdaFunctionParameters: {
          invocationType: 'FIRE_AND_FORGET',
        },
      },
    });

    // Create a separate Lambda to publish to SNS after archival
    const vendorNotificationLambda = new lambda.Function(
      this,
      'VendorNotificationLambda',
      {
        functionName: `MarketGrid-VendorNotifier-${envSuffix}`,
        runtime: lambda.Runtime.NODEJS_18_X,
        code: lambda.Code.fromAsset('lib/lambdas/vendor-notifier'),
        handler: 'index.handler',
        memorySize: 256,
        timeout: cdk.Duration.seconds(10),
        environment: {
          SNS_TOPIC_ARN: vendorNotificationTopic.topicArn,
        },
        tracing: lambda.Tracing.ACTIVE,
        logRetention: logs.RetentionDays.ONE_MONTH,
      }
    );

    vendorNotificationTopic.grantPublish(vendorNotificationLambda);
    transactionsTable.grantStreamRead(vendorNotificationLambda);

    vendorNotificationLambda.addEventSource(
      new DynamoEventSource(transactionsTable, {
        startingPosition: lambda.StartingPosition.LATEST,
        batchSize: 10,
        maxBatchingWindow: cdk.Duration.seconds(5),
        filters: [
          lambda.FilterCriteria.filter({
            eventName: lambda.FilterRule.isEqual('INSERT'),
          }),
        ],
      })
    );

    // 12. API Gateway REST API
    const api = new apigateway.RestApi(this, 'WebhookApi', {
      restApiName: `MarketGrid-${stageName}-Webhook-API-${envSuffix}`,
      description: 'API for receiving payment webhooks',
      endpointTypes: [apigateway.EndpointType.REGIONAL],
      deployOptions: {
        stageName: stageName,
        tracingEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: false,
        metricsEnabled: true,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    this.apiGateway = api;

    // Create Lambda authorizer
    const lambdaAuthorizer = new apigateway.TokenAuthorizer(
      this,
      'ApiKeyAuthorizer',
      {
        handler: authorizerLambda,
        identitySource: 'method.request.header.X-API-Key',
      }
    );

    // Create API Gateway to SQS role
    const apiGatewayRole = new iam.Role(this, 'ApiGatewayToSqsRole', {
      assumedBy: new iam.ServicePrincipal('apigateway.amazonaws.com'),
    });

    webhookQueue.grantSendMessages(apiGatewayRole);

    // Create webhook resource paths
    const webhookResource = api.root.addResource('webhook');
    const stripeResource = webhookResource.addResource('stripe');
    const paypalResource = webhookResource.addResource('paypal');

    // Helper function to create integration
    const createIntegration = (
      resource: apigateway.Resource,
      provider: string
    ) => {
      resource.addMethod(
        'POST',
        new apigateway.AwsIntegration({
          service: 'sqs',
          path: `${this.account}/${webhookQueue.queueName}`,
          integrationHttpMethod: 'POST',
          options: {
            credentialsRole: apiGatewayRole,
            requestParameters: {
              'integration.request.header.Content-Type':
                "'application/x-www-form-urlencoded'",
            },
            requestTemplates: {
              'application/json': `Action=SendMessage&MessageGroupId=${provider}-webhooks&MessageBody=$util.urlEncode($input.body)`,
            },
            integrationResponses: [
              {
                statusCode: '200',
                responseTemplates: {
                  'application/json': JSON.stringify({ received: true }),
                },
              },
              {
                selectionPattern: '4\\d{2}',
                statusCode: '400',
                responseTemplates: {
                  'application/json': JSON.stringify({
                    received: false,
                    error: 'Bad request',
                  }),
                },
              },
              {
                selectionPattern: '5\\d{2}',
                statusCode: '500',
                responseTemplates: {
                  'application/json': JSON.stringify({
                    received: false,
                    error: 'Internal server error',
                  }),
                },
              },
            ],
          },
        }),
        {
          authorizer: lambdaAuthorizer,
          authorizationType: apigateway.AuthorizationType.CUSTOM,
          methodResponses: [
            { statusCode: '200' },
            { statusCode: '400' },
            { statusCode: '500' },
          ],
        }
      );
    };

    createIntegration(stripeResource, 'stripe');
    createIntegration(paypalResource, 'paypal');

    // 13. AWS WAF with Enhanced Security Rules
    const wafAcl = new wafv2.CfnWebACL(this, 'WebhookApiWaf', {
      defaultAction: { allow: {} },
      scope: 'REGIONAL',
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: `MarketGrid-${stageName}-WAF-${envSuffix}`,
        sampledRequestsEnabled: true,
      },
      rules: [
        // Rule 0: AWS Managed Rules - Common Rule Set (OWASP Top 10)
        {
          name: 'AWSManagedRulesCommonRuleSet',
          priority: 0,
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesCommonRuleSet',
            },
          },
          overrideAction: { none: {} },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: `MarketGrid-${stageName}-CommonRules-${envSuffix}`,
            sampledRequestsEnabled: true,
          },
        },
        // Rule 1: Rate Limiting - 10,000 requests per 5 minutes per IP
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
            cloudWatchMetricsEnabled: true,
            metricName: `MarketGrid-${stageName}-RateLimit-${envSuffix}`,
            sampledRequestsEnabled: true,
          },
        },
        // Rule 2: SQL Injection Protection
        {
          name: 'AWSManagedRulesSQLiRuleSet',
          priority: 2,
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesSQLiRuleSet',
            },
          },
          overrideAction: { none: {} },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: `MarketGrid-${stageName}-SQLi-${envSuffix}`,
            sampledRequestsEnabled: true,
          },
        },
        // Rule 3: Known Bad Inputs Protection
        {
          name: 'AWSManagedRulesKnownBadInputsRuleSet',
          priority: 3,
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesKnownBadInputsRuleSet',
            },
          },
          overrideAction: { none: {} },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: `MarketGrid-${stageName}-BadInputs-${envSuffix}`,
            sampledRequestsEnabled: true,
          },
        },
        // Rule 4: Amazon IP Reputation List
        {
          name: 'AWSManagedRulesAmazonIpReputationList',
          priority: 4,
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesAmazonIpReputationList',
            },
          },
          overrideAction: { none: {} },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: `MarketGrid-${stageName}-IpReputation-${envSuffix}`,
            sampledRequestsEnabled: true,
          },
        },
        // Rule 5: Anonymous IP List (Blocks VPNs, proxies, Tor)
        {
          name: 'AWSManagedRulesAnonymousIpList',
          priority: 5,
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesAnonymousIpList',
            },
          },
          overrideAction: { none: {} },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: `MarketGrid-${stageName}-AnonymousIp-${envSuffix}`,
            sampledRequestsEnabled: true,
          },
        },
        // Rule 6: Block Requests with Oversized Body (> 8KB for webhooks)
        {
          name: 'BlockOversizedRequests',
          priority: 6,
          action: { block: {} },
          statement: {
            sizeConstraintStatement: {
              fieldToMatch: { body: {} },
              comparisonOperator: 'GT',
              size: 8192, // 8KB limit for webhook payloads
              textTransformations: [
                {
                  priority: 0,
                  type: 'NONE',
                },
              ],
            },
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: `MarketGrid-${stageName}-OversizedBody-${envSuffix}`,
            sampledRequestsEnabled: true,
          },
        },
        // Rule 7: Block requests with suspicious User-Agent strings
        {
          name: 'BlockSuspiciousUserAgents',
          priority: 7,
          action: { block: {} },
          statement: {
            orStatement: {
              statements: [
                {
                  byteMatchStatement: {
                    fieldToMatch: {
                      singleHeader: { name: 'user-agent' },
                    },
                    positionalConstraint: 'CONTAINS',
                    searchString: 'nikto',
                    textTransformations: [
                      {
                        priority: 0,
                        type: 'LOWERCASE',
                      },
                    ],
                  },
                },
                {
                  byteMatchStatement: {
                    fieldToMatch: {
                      singleHeader: { name: 'user-agent' },
                    },
                    positionalConstraint: 'CONTAINS',
                    searchString: 'sqlmap',
                    textTransformations: [
                      {
                        priority: 0,
                        type: 'LOWERCASE',
                      },
                    ],
                  },
                },
                {
                  byteMatchStatement: {
                    fieldToMatch: {
                      singleHeader: { name: 'user-agent' },
                    },
                    positionalConstraint: 'CONTAINS',
                    searchString: 'nmap',
                    textTransformations: [
                      {
                        priority: 0,
                        type: 'LOWERCASE',
                      },
                    ],
                  },
                },
              ],
            },
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: `MarketGrid-${stageName}-SuspiciousUA-${envSuffix}`,
            sampledRequestsEnabled: true,
          },
        },
      ],
    });

    // Associate WAF with API Gateway - add dependency on deployment stage
    const wafAssociation = new wafv2.CfnWebACLAssociation(
      this,
      'WafApiAssociation',
      {
        resourceArn: `arn:aws:apigateway:${this.region}::/restapis/${api.restApiId}/stages/${stageName}`,
        webAclArn: wafAcl.attrArn,
      }
    );

    // Ensure WAF association waits for API Gateway deployment to complete
    if (api.deploymentStage.node.defaultChild) {
      wafAssociation.addDependency(
        api.deploymentStage.node.defaultChild as cdk.CfnResource
      );
    }

    // 14. Custom domain (optional)
    if (props.domainName && props.hostedZoneId && props.certificateArn) {
      const certificate = acm.Certificate.fromCertificateArn(
        this,
        'ApiCertificate',
        props.certificateArn
      );

      const domain = new apigateway.DomainName(this, 'ApiCustomDomain', {
        domainName: props.domainName,
        certificate,
        endpointType: apigateway.EndpointType.REGIONAL,
        securityPolicy: apigateway.SecurityPolicy.TLS_1_2,
      });

      new apigateway.BasePathMapping(this, 'ApiPathMapping', {
        domainName: domain,
        restApi: api,
        stage: api.deploymentStage,
      });

      const zone = route53.HostedZone.fromHostedZoneAttributes(
        this,
        'HostedZone',
        {
          hostedZoneId: props.hostedZoneId,
          zoneName: props.domainName.split('.').slice(1).join('.'),
        }
      );

      new route53.ARecord(this, 'ApiDomainRecord', {
        zone,
        recordName: props.domainName.split('.')[0],
        target: route53.RecordTarget.fromAlias(
          new targets.ApiGatewayDomain(domain)
        ),
      });
    }

    // 15. CloudWatch Dashboard
    const dashboard = new cloudwatch.Dashboard(this, 'MarketGridDashboard', {
      dashboardName: `MarketGrid-${stageName}-Dashboard-${envSuffix}`,
    });

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'API Gateway Requests',
        left: [api.metricCount()],
      }),
      new cloudwatch.GraphWidget({
        title: 'API Gateway Latency',
        left: [api.metricLatency()],
      }),
      new cloudwatch.GraphWidget({
        title: 'SQS Queue Depth',
        left: [webhookQueue.metricApproximateNumberOfMessagesVisible()],
      }),
      new cloudwatch.GraphWidget({
        title: 'Lambda Invocations',
        left: [
          webhookProcessingLambda.metricInvocations(),
          webhookArchiveLambda.metricInvocations(),
        ],
      }),
      new cloudwatch.GraphWidget({
        title: 'Lambda Errors',
        left: [
          webhookProcessingLambda.metricErrors(),
          webhookArchiveLambda.metricErrors(),
        ],
      }),
      new cloudwatch.GraphWidget({
        title: 'DLQ Messages',
        left: [webhookDlq.metricApproximateNumberOfMessagesVisible()],
      })
    );

    // Custom metric for successful transactions
    const successfulTransactionsMetric = new cloudwatch.Metric({
      namespace: 'MarketGrid',
      metricName: 'SuccessfulTransactions',
      dimensionsMap: { Stage: stageName },
      statistic: 'Sum',
      period: cdk.Duration.minutes(1),
    });

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Successful Transactions',
        left: [successfulTransactionsMetric],
      })
    );

    // Outputs for Integration Testing

    // API Gateway Outputs
    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: api.url,
      description: 'Webhook API Gateway endpoint URL',
      exportName: `MarketGrid-ApiEndpoint-${envSuffix}`,
    });

    new cdk.CfnOutput(this, 'ApiGatewayId', {
      value: api.restApiId,
      description: 'API Gateway REST API ID',
      exportName: `MarketGrid-ApiGatewayId-${envSuffix}`,
    });

    new cdk.CfnOutput(this, 'ApiGatewayStageName', {
      value: stageName,
      description: 'API Gateway stage name',
      exportName: `MarketGrid-ApiStageName-${envSuffix}`,
    });

    new cdk.CfnOutput(this, 'StripeWebhookUrl', {
      value: `${api.url}webhook/stripe`,
      description: 'Stripe webhook endpoint URL',
      exportName: `MarketGrid-StripeWebhookUrl-${envSuffix}`,
    });

    new cdk.CfnOutput(this, 'PaypalWebhookUrl', {
      value: `${api.url}webhook/paypal`,
      description: 'PayPal webhook endpoint URL',
      exportName: `MarketGrid-PaypalWebhookUrl-${envSuffix}`,
    });

    // Lambda Outputs
    new cdk.CfnOutput(this, 'AuthorizerLambdaArn', {
      value: authorizerLambda.functionArn,
      description: 'Lambda Authorizer function ARN',
      exportName: `MarketGrid-AuthorizerLambdaArn-${envSuffix}`,
    });

    new cdk.CfnOutput(this, 'AuthorizerLambdaName', {
      value: authorizerLambda.functionName,
      description: 'Lambda Authorizer function name',
      exportName: `MarketGrid-AuthorizerLambdaName-${envSuffix}`,
    });

    new cdk.CfnOutput(this, 'WebhookProcessingLambdaArn', {
      value: webhookProcessingLambda.functionArn,
      description: 'Webhook Processing Lambda function ARN',
      exportName: `MarketGrid-WebhookProcessingLambdaArn-${envSuffix}`,
    });

    new cdk.CfnOutput(this, 'WebhookProcessingLambdaName', {
      value: webhookProcessingLambda.functionName,
      description: 'Webhook Processing Lambda function name',
      exportName: `MarketGrid-WebhookProcessingLambdaName-${envSuffix}`,
    });

    new cdk.CfnOutput(this, 'WebhookArchiveLambdaArn', {
      value: webhookArchiveLambda.functionArn,
      description: 'Webhook Archive Lambda function ARN',
      exportName: `MarketGrid-WebhookArchiveLambdaArn-${envSuffix}`,
    });

    new cdk.CfnOutput(this, 'WebhookArchiveLambdaName', {
      value: webhookArchiveLambda.functionName,
      description: 'Webhook Archive Lambda function name',
      exportName: `MarketGrid-WebhookArchiveLambdaName-${envSuffix}`,
    });

    new cdk.CfnOutput(this, 'VendorNotificationLambdaArn', {
      value: vendorNotificationLambda.functionArn,
      description: 'Vendor Notification Lambda function ARN',
      exportName: `MarketGrid-VendorNotificationLambdaArn-${envSuffix}`,
    });

    new cdk.CfnOutput(this, 'VendorNotificationLambdaName', {
      value: vendorNotificationLambda.functionName,
      description: 'Vendor Notification Lambda function name',
      exportName: `MarketGrid-VendorNotificationLambdaName-${envSuffix}`,
    });

    // SQS Queue Outputs
    new cdk.CfnOutput(this, 'WebhookQueueUrl', {
      value: webhookQueue.queueUrl,
      description: 'Main webhook SQS FIFO queue URL',
      exportName: `MarketGrid-WebhookQueueUrl-${envSuffix}`,
    });

    new cdk.CfnOutput(this, 'WebhookQueueArn', {
      value: webhookQueue.queueArn,
      description: 'Main webhook SQS FIFO queue ARN',
      exportName: `MarketGrid-WebhookQueueArn-${envSuffix}`,
    });

    new cdk.CfnOutput(this, 'WebhookQueueName', {
      value: webhookQueue.queueName,
      description: 'Main webhook SQS FIFO queue name',
      exportName: `MarketGrid-WebhookQueueName-${envSuffix}`,
    });

    new cdk.CfnOutput(this, 'WebhookDlqUrl', {
      value: webhookDlq.queueUrl,
      description: 'Webhook DLQ SQS FIFO queue URL',
      exportName: `MarketGrid-WebhookDlqUrl-${envSuffix}`,
    });

    new cdk.CfnOutput(this, 'WebhookDlqArn', {
      value: webhookDlq.queueArn,
      description: 'Webhook DLQ SQS FIFO queue ARN',
      exportName: `MarketGrid-WebhookDlqArn-${envSuffix}`,
    });

    // DynamoDB Outputs
    new cdk.CfnOutput(this, 'TransactionsTableName', {
      value: transactionsTable.tableName,
      description: 'DynamoDB transactions table name',
      exportName: `MarketGrid-TransactionsTableName-${envSuffix}`,
    });

    new cdk.CfnOutput(this, 'TransactionsTableArn', {
      value: transactionsTable.tableArn,
      description: 'DynamoDB transactions table ARN',
      exportName: `MarketGrid-TransactionsTableArn-${envSuffix}`,
    });

    new cdk.CfnOutput(this, 'TransactionsTableStreamArn', {
      value: transactionsTable.tableStreamArn!,
      description: 'DynamoDB transactions table stream ARN',
      exportName: `MarketGrid-TransactionsTableStreamArn-${envSuffix}`,
    });

    new cdk.CfnOutput(this, 'VendorIndexName', {
      value: 'VendorIndex',
      description: 'DynamoDB GSI name for vendor queries',
      exportName: `MarketGrid-VendorIndexName-${envSuffix}`,
    });

    // S3 Outputs
    new cdk.CfnOutput(this, 'WebhookArchiveBucketName', {
      value: webhookArchiveBucket.bucketName,
      description: 'S3 bucket name for webhook archival',
      exportName: `MarketGrid-WebhookArchiveBucketName-${envSuffix}`,
    });

    new cdk.CfnOutput(this, 'WebhookArchiveBucketArn', {
      value: webhookArchiveBucket.bucketArn,
      description: 'S3 bucket ARN for webhook archival',
      exportName: `MarketGrid-WebhookArchiveBucketArn-${envSuffix}`,
    });

    // SNS Outputs
    new cdk.CfnOutput(this, 'VendorNotificationTopicArn', {
      value: vendorNotificationTopic.topicArn,
      description: 'SNS topic ARN for vendor notifications',
      exportName: `MarketGrid-VendorNotificationTopicArn-${envSuffix}`,
    });

    new cdk.CfnOutput(this, 'VendorNotificationTopicName', {
      value: vendorNotificationTopic.topicName,
      description: 'SNS topic name for vendor notifications',
      exportName: `MarketGrid-VendorNotificationTopicName-${envSuffix}`,
    });

    // KMS Outputs
    new cdk.CfnOutput(this, 'EncryptionKeyId', {
      value: encryptionKey.keyId,
      description: 'KMS key ID for encryption',
      exportName: `MarketGrid-EncryptionKeyId-${envSuffix}`,
    });

    new cdk.CfnOutput(this, 'EncryptionKeyArn', {
      value: encryptionKey.keyArn,
      description: 'KMS key ARN for encryption',
      exportName: `MarketGrid-EncryptionKeyArn-${envSuffix}`,
    });

    // SSM Parameter Outputs
    new cdk.CfnOutput(this, 'ApiKeyParameterPrefix', {
      value: `/marketgrid/${stageName}/${envSuffix}/api-keys/`,
      description: 'SSM Parameter Store prefix for API keys',
      exportName: `MarketGrid-ApiKeyParameterPrefix-${envSuffix}`,
    });

    new cdk.CfnOutput(this, 'StripeApiKeyParameter', {
      value: `/marketgrid/${stageName}/${envSuffix}/api-keys/stripe`,
      description: 'SSM Parameter name for Stripe API key',
      exportName: `MarketGrid-StripeApiKeyParameter-${envSuffix}`,
    });

    new cdk.CfnOutput(this, 'PaypalApiKeyParameter', {
      value: `/marketgrid/${stageName}/${envSuffix}/api-keys/paypal`,
      description: 'SSM Parameter name for PayPal API key',
      exportName: `MarketGrid-PaypalApiKeyParameter-${envSuffix}`,
    });

    // WAF Outputs
    new cdk.CfnOutput(this, 'WafWebAclArn', {
      value: wafAcl.attrArn,
      description: 'WAF WebACL ARN protecting the API Gateway',
      exportName: `MarketGrid-WafWebAclArn-${envSuffix}`,
    });

    new cdk.CfnOutput(this, 'WafWebAclId', {
      value: wafAcl.attrId,
      description: 'WAF WebACL ID',
      exportName: `MarketGrid-WafWebAclId-${envSuffix}`,
    });

    // CloudWatch Outputs
    new cdk.CfnOutput(this, 'CloudWatchDashboardName', {
      value: dashboard.dashboardName,
      description: 'CloudWatch Dashboard name',
      exportName: `MarketGrid-CloudWatchDashboardName-${envSuffix}`,
    });

    // Region Output
    new cdk.CfnOutput(this, 'DeploymentRegion', {
      value: this.region,
      description: 'AWS region where resources are deployed',
      exportName: `MarketGrid-DeploymentRegion-${envSuffix}`,
    });
  }
}
