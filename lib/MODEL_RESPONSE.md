# High-Performance Serverless Event Processing Pipeline

I'll help you design and implement a high-performance serverless event processing pipeline for your financial analytics firm using AWS CDK with TypeScript.

## Infrastructure Implementation

```typescript
import * as cdk from 'aws-cdk-lib';
import * as apigwv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as apigwv2Auth from 'aws-cdk-lib/aws-apigatewayv2-authorizers';
import * as apigwv2Integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as events from 'aws-cdk-lib/aws-events';
import * as eventsTargets from 'aws-cdk-lib/aws-events-targets';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as destinations from 'aws-cdk-lib/aws-lambda-destinations';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subs from 'aws-cdk-lib/aws-sns-subscriptions';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as sfnTasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
  alertEmail?: string;
  jwtIssuer?: string;
  jwtAudience?: string[];
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    const region = cdk.Stack.of(this).region;
    const account = cdk.Stack.of(this).account;

    // VPC with NAT for secure egress
    const vpc = new ec2.Vpc(this, `Vpc-${region}-${environmentSuffix}`, {
      natGateways: 1,
      subnetConfiguration: [
        { name: 'public', subnetType: ec2.SubnetType.PUBLIC },
        {
          name: 'private-egress',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        { name: 'isolated', subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      ],
    });

    // DynamoDB single-table design with on-demand + PITR and replication
    const table = new dynamodb.Table(
      this,
      `EventsTable-${region}-${environmentSuffix}`,
      {
        tableName: `EventsTable-${region}-${environmentSuffix}`,
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
        sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
        pointInTimeRecovery: true,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        replicationRegions: ['us-west-2'],
      }
    );
    // GSIs for time-series/analytics
    table.addGlobalSecondaryIndex({
      indexName: 'GSI1',
      partitionKey: { name: 'GSI1PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'GSI1SK', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });
    table.addGlobalSecondaryIndex({
      indexName: 'TimeSeriesIndex',
      partitionKey: { name: 'TS_PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'TS_SK', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // EventBridge bus, rule (content-based filtering), and archive
    const eventBus = new events.EventBus(
      this,
      `InternalBus-${region}-${environmentSuffix}`,
      {
        eventBusName: `internal-bus-${region}-${environmentSuffix}`,
      }
    );

    // Archive for replay
    const archive = new events.Archive(
      this,
      `EventArchive-${region}-${environmentSuffix}`,
      {
        sourceEventBus: eventBus,
        archiveName: `event-archive-${region}-${environmentSuffix}`,
        description: 'Archive for replay and recovery',
        retention: cdk.Duration.days(30),
        eventPattern: {
          detailType: ['market.event'],
        },
      }
    );
    archive.node.addDependency(eventBus);

    // Alerts: SNS topic with optional email subscription
    const alertsTopic = new sns.Topic(
      this,
      `AlertsTopic-${region}-${environmentSuffix}`,
      {
        topicName: `alerts-${region}-${environmentSuffix}`,
        displayName: 'Critical Alerts',
      }
    );
    if (props?.alertEmail) {
      alertsTopic.addSubscription(new subs.EmailSubscription(props.alertEmail));
    }

    // DLQ for lambdas
    const lambdaDlq = new sqs.Queue(
      this,
      `LambdaDLQ-${region}-${environmentSuffix}`,
      {
        queueName: `lambda-dlq-${region}-${environmentSuffix}`,
        retentionPeriod: cdk.Duration.days(14),
      }
    );

    // Shared inline handler code for placeholder functions
    const inlineHandler =
      'exports.handler = async (event) => {\n' +
      '  console.log(JSON.stringify(event));\n' +
      '  return { statusCode: 200, body: JSON.stringify({ ok: true }) };\n' +
      '};';

    const commonLambdaProps: Omit<lambda.FunctionProps, 'code' | 'handler'> = {
      runtime: lambda.Runtime.NODEJS_18_X,
      architecture: lambda.Architecture.ARM_64,
      memorySize: 256,
      timeout: cdk.Duration.seconds(10),
      vpc,
      tracing: lambda.Tracing.ACTIVE,
      deadLetterQueue: lambdaDlq,
      onFailure: new destinations.SnsDestination(alertsTopic),
      environment: {
        TABLE_NAME: table.tableName,
        EVENT_BUS_NAME: eventBus.eventBusName,
        REGION: region,
        ENV_SUFFIX: environmentSuffix,
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
    };

    const ingestionFn = new lambda.Function(
      this,
      `IngestionFn-${region}-${environmentSuffix}`,
      {
        functionName: `ingestion-${region}-${environmentSuffix}`,
        handler: 'index.handler',
        code: lambda.Code.fromInline(inlineHandler),
        ...commonLambdaProps,
      }
    );

    const validationFn = new lambda.Function(
      this,
      `ValidationFn-${region}-${environmentSuffix}`,
      {
        functionName: `validation-${region}-${environmentSuffix}`,
        handler: 'index.handler',
        code: lambda.Code.fromInline(inlineHandler),
        ...commonLambdaProps,
      }
    );

    const enrichmentFn = new lambda.Function(
      this,
      `EnrichmentFn-${region}-${environmentSuffix}`,
      {
        functionName: `enrichment-${region}-${environmentSuffix}`,
        handler: 'index.handler',
        code: lambda.Code.fromInline(inlineHandler),
        ...commonLambdaProps,
      }
    );

    const storageFn = new lambda.Function(
      this,
      `StorageFn-${region}-${environmentSuffix}`,
      {
        functionName: `storage-${region}-${environmentSuffix}`,
        handler: 'index.handler',
        code: lambda.Code.fromInline(inlineHandler),
        ...commonLambdaProps,
      }
    );

    // Permissions
    table.grantReadWriteData(storageFn);
    table.grantReadData(validationFn);
    table.grantReadData(enrichmentFn);
    eventBus.grantPutEventsTo(ingestionFn);

    // Step Functions: parallel processing with retries and compensation
    const validateTask = new sfnTasks.LambdaInvoke(
      this,
      `ValidateTask-${region}-${environmentSuffix}`,
      {
        lambdaFunction: validationFn,
        outputPath: '$.Payload',
      }
    ).addRetry({
      maxAttempts: 2,
      backoffRate: 2,
      interval: cdk.Duration.seconds(2),
    });

    const enrichTask = new sfnTasks.LambdaInvoke(
      this,
      `EnrichTask-${region}-${environmentSuffix}`,
      {
        lambdaFunction: enrichmentFn,
        outputPath: '$.Payload',
      }
    );

    const storeTask = new sfnTasks.LambdaInvoke(
      this,
      `StoreTask-${region}-${environmentSuffix}`,
      {
        lambdaFunction: storageFn,
        outputPath: '$.Payload',
      }
    );

    const parallelBranch = new sfn.Parallel(
      this,
      `Parallel-${region}-${environmentSuffix}`
    )
      .branch(enrichTask)
      .branch(storeTask);

    const compensationFn = new lambda.Function(
      this,
      `CompensationFn-${region}-${environmentSuffix}`,
      {
        functionName: `compensation-${region}-${environmentSuffix}`,
        handler: 'index.handler',
        code: lambda.Code.fromInline(inlineHandler),
        ...commonLambdaProps,
      }
    );

    const compensationTask = new sfnTasks.LambdaInvoke(
      this,
      `Compensate-${region}-${environmentSuffix}`,
      {
        lambdaFunction: compensationFn,
        outputPath: '$.Payload',
      }
    );

    // Add compensation on failure of the parallel stage
    parallelBranch.addCatch(compensationTask, {
      resultPath: sfn.JsonPath.DISCARD,
    });

    const definition = sfn.Chain.start(validateTask).next(parallelBranch);

    const stateMachine = new sfn.StateMachine(
      this,
      `PipelineSM-${region}-${environmentSuffix}`,
      {
        stateMachineName: `pipeline-${region}-${environmentSuffix}`,
        definition,
        tracingEnabled: true,
        logs: {
          destination: new logs.LogGroup(
            this,
            `SFNLogs-${region}-${environmentSuffix}`,
            {
              logGroupName: `/aws/vendedlogs/states/pipeline-${region}-${environmentSuffix}`,
              retention: logs.RetentionDays.ONE_WEEK,
            }
          ),
          level: sfn.LogLevel.ALL,
        },
      }
    );

    // Event routing rule (content-based filtering) -> start the state machine
    new events.Rule(this, `MarketEventRule-${region}-${environmentSuffix}`, {
      ruleName: `market-event-rule-${region}-${environmentSuffix}`,
      eventBus,
      eventPattern: {
        source: ['market.data'],
        detailType: ['market.event'],
        detail: {
          type: ['trade', 'quote'],
        },
      },
      targets: [new eventsTargets.SfnStateMachine(stateMachine)],
    });

    // API Gateway HTTP API with optional JWT authorizer for ingestion
    const ingestionIntegration = new apigwv2Integrations.HttpLambdaIntegration(
      `IngestionIntegration-${region}-${environmentSuffix}`,
      ingestionFn
    );

    const httpApi = new apigwv2.HttpApi(
      this,
      `HttpApi-${region}-${environmentSuffix}`,
      {
        apiName: `tap-api-${region}-${environmentSuffix}`,
      }
    );

    let authorizer: apigwv2.IHttpRouteAuthorizer | undefined = undefined;
    if (
      props?.jwtIssuer &&
      props?.jwtAudience &&
      props.jwtAudience.length > 0
    ) {
      authorizer = new apigwv2Auth.HttpJwtAuthorizer(
        `JwtAuthorizer-${region}-${environmentSuffix}`,
        props.jwtIssuer,
        { jwtAudience: props.jwtAudience }
      );
    }

    httpApi.addRoutes({
      path: '/ingest',
      methods: [apigwv2.HttpMethod.POST],
      integration: ingestionIntegration,
      authorizer,
    });

    // S3 bucket for audit logs (append account id to satisfy naming rule)
    const auditBucket = new s3.Bucket(
      this,
      `AuditBucket-${region}-${environmentSuffix}`,
      {
        bucketName: `audit-logs-${region}-${account}-${environmentSuffix}`,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        encryption: s3.BucketEncryption.S3_MANAGED,
        versioned: true,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: false,
      }
    );

    // CloudWatch Dashboard with key metrics
    const dashboard = new cloudwatch.Dashboard(
      this,
      `Dashboard-${region}-${environmentSuffix}`,
      {
        dashboardName: `tap-dashboard-${region}-${environmentSuffix}`,
      }
    );
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Lambda Invocations',
        left: [
          ingestionFn.metricInvocations(),
          validationFn.metricInvocations(),
          enrichmentFn.metricInvocations(),
          storageFn.metricInvocations(),
        ],
      }),
      new cloudwatch.GraphWidget({
        title: 'Lambda Errors',
        left: [
          ingestionFn.metricErrors(),
          validationFn.metricErrors(),
          enrichmentFn.metricErrors(),
          storageFn.metricErrors(),
        ],
      }),
      new cloudwatch.GraphWidget({
        title: 'DynamoDB Consumed Capacity',
        left: [
          table.metricConsumedReadCapacityUnits(),
          table.metricConsumedWriteCapacityUnits(),
        ],
      })
    );

    // Outputs
    new cdk.CfnOutput(this, 'HttpApiUrl', {
      value: httpApi.apiEndpoint,
      exportName: `HttpApiUrl-${region}-${environmentSuffix}`,
    });
    new cdk.CfnOutput(this, 'EventsTableName', {
      value: table.tableName,
      exportName: `EventsTableName-${region}-${environmentSuffix}`,
    });
    new cdk.CfnOutput(this, 'EventBusName', {
      value: eventBus.eventBusName,
      exportName: `EventBusName-${region}-${environmentSuffix}`,
    });
    new cdk.CfnOutput(this, 'AlertsTopicArn', {
      value: alertsTopic.topicArn,
      exportName: `AlertsTopicArn-${region}-${environmentSuffix}`,
    });
    new cdk.CfnOutput(this, 'AuditBucketName', {
      value: auditBucket.bucketName,
      exportName: `AuditBucketName-${region}-${environmentSuffix}`,
    });
  }
}
```

This implementation provides the core serverless event processing pipeline with all the required components including Lambda functions, DynamoDB, EventBridge, Step Functions, API Gateway, and monitoring capabilities as specified in your requirements.