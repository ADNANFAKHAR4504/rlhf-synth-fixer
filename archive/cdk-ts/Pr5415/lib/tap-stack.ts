import * as cdk from 'aws-cdk-lib';
import { Duration, RemovalPolicy, Tags } from 'aws-cdk-lib';
import * as apigwv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as apigwv2_auth from 'aws-cdk-lib/aws-apigatewayv2-authorizers';
import * as apigwv2_int from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cw_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as codedeploy from 'aws-cdk-lib/aws-codedeploy';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sns from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';
import * as fs from 'fs';
import * as path from 'path';

// ? Import your stacks here
// import { MyStack } from './my-stack';

/**
 * README-style quick guide (high-level)
 * - Deployment: run `cdk synth` then `cdk deploy -c environmentSuffix=<env>`
 * - Target: ≤ $3,000/mo via: ARM Graviton2, single Lambda, on-demand DynamoDB, 7-day logs, S3 Glacier lifecycle.
 * - Validation: Compare pre/post Lambda GB-sec, DDB RCU/WCU spend, S3 storage+glacier, CW Logs. Billing: Cost Explorer filtered by tags.
 * - CloudWatch Insights (95th percentile memory):
 *   In Logs Insights for the Lambda log group, run a memory usage query and capture the 95th percentile. Plug result into `lambda95pMemMb` below.
 * - Rollback: CodeDeploy canary + alarms. If errors/latency exceed threshold post-deploy, traffic shifts back automatically; see deployment group in console.
 */
interface TapStackProps extends cdk.StackProps {
  // Cost allocation tags (required)
  project: string;
  service: string;
  environment: string; // e.g., dev|staging|prod

  // Optional metadata tags
  team?: string;
  costCenter?: string;

  // Suffix added to resource names; also appended with region
  environmentSuffix?: string;

  // Lambda memory right-sizing (95th percentile from CW Insights)
  lambda95pMemMb?: number; // default safe value used if not provided

  // Reserved concurrency to smooth cold starts and cap spend
  lambdaReservedConcurrency?: number; // e.g., 50

  // HTTP API auth selection
  apiAuthType?: 'NONE' | 'IAM' | 'JWT';
  jwtIssuer?: string;
  jwtAudience?: string[];

  // S3 archive lifecycle
  glacierTransitionDays?: number; // default 90
  archiveRetentionDays?: number; // e.g., 1095 (3 years)

  // Alarm thresholds
  lambdaThrottleThreshold?: number; // count in 5m
  lambdaErrorsThreshold?: number; // count in 5m
  ddbThrottledRequestsThreshold?: number; // count in 5m
  p90DurationMsBaseline?: number; // baseline; alarm at > 1.1x baseline

  // Lambda Layer configuration
  layerAssetPath?: string; // directory containing layer content; default 'lib/lambda-layer'
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

    const region = cdk.Stack.of(this).region;
    const account = cdk.Stack.of(this).account;

    // Apply cost allocation tags globally
    if (props) {
      Tags.of(this).add('Project', props.project);
      Tags.of(this).add('Service', props.service);
      Tags.of(this).add('Environment', props.environment);
      if (props.team) Tags.of(this).add('Team', props.team);
      if (props.costCenter) Tags.of(this).add('CostCenter', props.costCenter);
    }

    // Helper to append region and env suffix
    const name = (base: string) => `${base}-${region}-${environmentSuffix}`;
    // S3 buckets additionally append account id for global uniqueness
    const s3Name = (base: string) =>
      `${base}-${account}-${region}-${environmentSuffix}`;

    // Lambda Layer (shared dependencies). Provide directory with layer content (e.g., nodejs/node_modules)
    const layerAssetPath = props?.layerAssetPath ?? 'lib/lambda-layer';
    const resolvedLayerPath = path.resolve(layerAssetPath);
    const layerExists = fs.existsSync(resolvedLayerPath);
    const layerHasFiles =
      layerExists && fs.readdirSync(resolvedLayerPath).length > 0;
    let sharedLayer: lambda.ILayerVersion | undefined;
    if (layerHasFiles) {
      sharedLayer = new lambda.LayerVersion(this, 'SharedDepsLayer', {
        layerVersionName: name('shared-deps-layer'),
        code: lambda.Code.fromAsset(layerAssetPath),
        compatibleRuntimes: [lambda.Runtime.NODEJS_16_X],
        description: 'Shared dependencies for consolidated Lambda',
        removalPolicy: RemovalPolicy.RETAIN,
      });
    }

    // DynamoDB — on-demand with partitioning guidance and conditional PITR
    const transactionsTable = new dynamodb.Table(this, 'TransactionsTable', {
      tableName: name('transactions'),
      partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'sk', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecovery: (props?.environment || 'dev') === 'prod',
      removalPolicy: RemovalPolicy.RETAIN,
    });

    // S3 archive bucket with lifecycle and access logging
    const accessLogsBucket = new s3.Bucket(this, 'AccessLogsBucket', {
      bucketName: s3Name('access-logs'),
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: RemovalPolicy.RETAIN,
      versioned: false,
    });

    const archiveBucket = new s3.Bucket(this, 'ArchiveBucket', {
      bucketName: s3Name('txn-archive'),
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      serverAccessLogsBucket: accessLogsBucket,
      serverAccessLogsPrefix: 'archive/',
      lifecycleRules: [
        {
          transitions: [
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: Duration.days(
                props?.glacierTransitionDays ?? 90
              ),
            },
          ],
          expiration: props?.archiveRetentionDays
            ? Duration.days(props.archiveRetentionDays)
            : undefined,
        },
      ],
      removalPolicy: RemovalPolicy.RETAIN,
      versioned: false,
    });

    // Consolidated Lambda function (single entry point)
    const consolidatedFn = new nodejs.NodejsFunction(this, 'ConsolidatedFn', {
      functionName: name('consolidated-handler'),
      // Using Node.js 16 to rely on built-in AWS SDK v2 per warning acknowledgement
      runtime: lambda.Runtime.NODEJS_16_X,
      architecture: lambda.Architecture.ARM_64,
      entry: 'lib/lambda/index.js', // JavaScript entry relying on AWS SDK v2 in runtime
      handler: 'handler',
      memorySize: props?.lambda95pMemMb ?? 1536, // replace with 95th percentile from CW Insights
      timeout: Duration.seconds(30),
      bundling: {
        minify: true,
        sourcesContent: false,
      },
      layers: sharedLayer ? [sharedLayer] : [],
      environment: {
        NODE_OPTIONS: '--enable-source-maps',
        DDB_TABLE_NAME: transactionsTable.tableName,
        ARCHIVE_BUCKET: archiveBucket.bucketName,
        ENVIRONMENT: props?.environment || environmentSuffix,
      },
      logRetention: logs.RetentionDays.ONE_WEEK, // 7-day retention
      reservedConcurrentExecutions: props?.lambdaReservedConcurrency,
    });

    // Least-privilege grants for Lambda (no explicit role name used)
    transactionsTable.grantReadWriteData(consolidatedFn);
    archiveBucket.grantReadWrite(consolidatedFn);
    accessLogsBucket.grantWrite(consolidatedFn);
    consolidatedFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          'logs:CreateLogStream',
          'logs:PutLogEvents',
          'logs:CreateLogGroup',
          'cloudwatch:PutMetricData',
        ],
        resources: ['*'],
      })
    );

    // HTTP API with routes, default stage, and access logging
    const apiAccessLogGroup = new logs.LogGroup(this, 'HttpApiAccessLogs', {
      logGroupName: `/aws/apigwv2/${name('http-api')}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const httpApi = new apigwv2.HttpApi(this, 'HttpApi', {
      apiName: name('http-api'),
      createDefaultStage: true,
      corsPreflight: {
        allowOrigins: ['*'],
        allowMethods: [apigwv2.CorsHttpMethod.ANY],
      },
    });

    // Default stage access logs
    const defaultStage = httpApi.defaultStage?.node
      .defaultChild as apigwv2.CfnStage;
    if (defaultStage) {
      defaultStage.accessLogSettings = {
        destinationArn: apiAccessLogGroup.logGroupArn,
        format: JSON.stringify({
          requestId: '$context.requestId',
          httpMethod: '$context.httpMethod',
          path: '$context.path',
          status: '$context.status',
          responseLength: '$context.responseLength',
        }),
      };
    }

    const lambdaIntegration = new apigwv2_int.HttpLambdaIntegration(
      'ConsolidatedIntegration',
      consolidatedFn
    );

    // Optional authorizer
    let authorizer: apigwv2.IHttpRouteAuthorizer | undefined;
    const authType = props?.apiAuthType ?? 'NONE';
    if (authType === 'JWT' && props?.jwtIssuer && props?.jwtAudience?.length) {
      authorizer = new apigwv2_auth.HttpJwtAuthorizer(
        'JwtAuthorizer',
        props.jwtIssuer,
        { jwtAudience: props.jwtAudience }
      );
    }

    // Legacy-compatible routes directed to the same Lambda
    const routes: { path: string; method: apigwv2.HttpMethod }[] = [
      { path: '/v1/transactions', method: apigwv2.HttpMethod.POST },
      { path: '/v1/transactions/{id}', method: apigwv2.HttpMethod.GET },
      { path: '/v1/transactions/{id}', method: apigwv2.HttpMethod.PUT },
      { path: '/v1/transactions/{id}', method: apigwv2.HttpMethod.DELETE },
      { path: '/v1/users/{id}/transactions', method: apigwv2.HttpMethod.GET },
    ];
    for (const r of routes) {
      httpApi.addRoutes({
        path: r.path,
        methods: [r.method],
        integration: lambdaIntegration,
        authorizer: authorizer,
      });
    }

    // If IAM auth is selected, ensure all routes require AWS_IAM
    if (authType === 'IAM') {
      for (const child of httpApi.node.children) {
        const cfn = child.node.defaultChild as apigwv2.CfnRoute | undefined;
        if (cfn && cfn.cfnResourceType === 'AWS::ApiGatewayV2::Route') {
          cfn.authorizationType = 'AWS_IAM';
        }
      }
    }

    // CloudWatch Alarms + SNS topic
    const alarmTopic = new sns.Topic(this, 'AlarmTopic', {
      topicName: name('ops-alarms'),
      displayName: 'Ops Alarms (subscribe recipients in console)',
    });

    const throttlesAlarm = new cloudwatch.Alarm(this, 'LambdaThrottlesAlarm', {
      alarmName: name('lambda-throttles'),
      metric: consolidatedFn.metricThrottles({ period: Duration.minutes(5) }),
      threshold: props?.lambdaThrottleThreshold ?? 1,
      evaluationPeriods: 1,
      comparisonOperator:
        cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    throttlesAlarm.addAlarmAction(new cw_actions.SnsAction(alarmTopic));

    // Mandatory Lambda Errors alarm
    const errorsAlarm = new cloudwatch.Alarm(this, 'LambdaErrorsAlarm', {
      alarmName: name('lambda-errors'),
      metric: consolidatedFn.metricErrors({ period: Duration.minutes(5) }),
      threshold: props?.lambdaErrorsThreshold ?? 1,
      evaluationPeriods: 1,
      comparisonOperator:
        cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    errorsAlarm.addAlarmAction(new cw_actions.SnsAction(alarmTopic));

    const ddbThrottleAlarm = new cloudwatch.Alarm(
      this,
      'DdbThrottledReqAlarm',
      {
        alarmName: name('ddb-throttled'),
        metric: transactionsTable.metricThrottledRequests({
          period: Duration.minutes(5),
        }),
        threshold: props?.ddbThrottledRequestsThreshold ?? 1,
        evaluationPeriods: 1,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );
    ddbThrottleAlarm.addAlarmAction(new cw_actions.SnsAction(alarmTopic));

    // Mandatory p90 latency alarm (> 1.1x baseline)
    const p90Duration = consolidatedFn.metricDuration({
      period: Duration.minutes(5),
      statistic: 'p90',
    });
    const p90BaselineMs = props?.p90DurationMsBaseline ?? 1000; // default 1s baseline if not provided
    const p90Threshold = Math.ceil(p90BaselineMs * 1.1);
    const p90LatencyAlarm = new cloudwatch.Alarm(
      this,
      'LambdaP90LatencyAlarm',
      {
        alarmName: name('lambda-p90-latency'),
        metric: p90Duration,
        threshold: p90Threshold,
        evaluationPeriods: 1,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );
    p90LatencyAlarm.addAlarmAction(new cw_actions.SnsAction(alarmTopic));

    // Minimal CloudWatch dashboard
    const dashboard = new cloudwatch.Dashboard(this, 'OpsDashboard', {
      dashboardName: name('ops-dashboard'),
    });
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Lambda Invocations & Errors',
        left: [consolidatedFn.metricInvocations()],
        right: [consolidatedFn.metricErrors()],
      }),
      new cloudwatch.GraphWidget({
        title: 'Lambda Duration p90',
        left: [p90Duration],
      }),
      new cloudwatch.GraphWidget({
        title: 'DDB Throttled Requests',
        left: [transactionsTable.metricThrottledRequests()],
      })
    );

    // Automated rollback via CodeDeploy Canary + alarms
    const version = consolidatedFn.currentVersion;
    const alias = new lambda.Alias(this, 'LiveAlias', {
      aliasName: 'live',
      version,
    });
    new codedeploy.LambdaDeploymentGroup(this, 'DeploymentGroup', {
      alias,
      deploymentGroupName: name('lambda-dg'),
      deploymentConfig:
        codedeploy.LambdaDeploymentConfig.CANARY_10PERCENT_5MINUTES,
      alarms: [throttlesAlarm, errorsAlarm, p90LatencyAlarm, ddbThrottleAlarm],
      autoRollback: {
        failedDeployment: true,
        stoppedDeployment: true,
        deploymentInAlarm: true,
      },
    });

    // Note on DynamoDB log retention: DDB does not create CW log groups. We set 7-day retention for Lambda and HTTP API access logs.

    // Outputs
    new cdk.CfnOutput(this, 'HttpApiEndpoint', {
      value: httpApi.apiEndpoint,
      description: 'HTTP API base endpoint',
    });
    new cdk.CfnOutput(this, 'ArchiveBucketName', {
      value: archiveBucket.bucketName,
      description: 'S3 archive bucket name',
    });
    new cdk.CfnOutput(this, 'TransactionsTableName', {
      value: transactionsTable.tableName,
      description: 'DynamoDB transactions table name',
    });
    new cdk.CfnOutput(this, 'AlarmTopicArn', {
      value: alarmTopic.topicArn,
      description: 'SNS topic ARN for alarms',
    });
    const dashboardUrl = `https://${region}.console.aws.amazon.com/cloudwatch/home?region=${region}#dashboards:name=${name('ops-dashboard')}`;
    new cdk.CfnOutput(this, 'DashboardUrl', {
      value: dashboardUrl,
      description: 'CloudWatch dashboard URL',
    });
    new cdk.CfnOutput(this, 'StackName', {
      value: this.stackName,
      description: 'Main CloudFormation stack name',
    });

    /*
     * Implementation tips & notes
     * - Lambda handler multiplexer: create `lambda/index.ts` that inspects APIGW v2 event path/method and routes internally.
     * - Memory right-sizing: use CW Logs Insights to compute p95 memory; set `lambda95pMemMb` accordingly.
     * - Reserved concurrency: derived from CW ConcurrentExecutions peak. Use a value that limits cold-start spikes within budget.
     * - Partition key: composite `pk` like `<hashPrefix>#<entity>` and `sk` like `<timestamp>#<id>` to spread load.
     * - API migration: add more routes or base-path mappings as needed; IAM/JWT can be enabled without breaking clients.
     */
  }
}
