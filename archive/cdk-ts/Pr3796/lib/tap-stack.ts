import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as pipes from 'aws-cdk-lib/aws-pipes';
import * as path from 'path';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // S3 Bucket for attachments
    const attachmentsBucket = new s3.Bucket(this, 'BugAttachmentsBucket', {
      bucketName: `bug-attachments-${this.account}-${environmentSuffix}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      lifecycleRules: [
        {
          expiration: cdk.Duration.days(90),
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
          ],
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      enforceSSL: true,
    });

    // DynamoDB table for bug reports with streams enabled
    const bugsTable = new dynamodb.Table(this, 'BugsTable', {
      tableName: `bug-reports-${environmentSuffix}`,
      partitionKey: { name: 'bugId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: true,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      timeToLiveAttribute: 'ttl',
    });

    // Add GSI for querying by priority
    bugsTable.addGlobalSecondaryIndex({
      indexName: 'PriorityIndex',
      partitionKey: { name: 'priority', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
    });

    // Add GSI for querying by status
    bugsTable.addGlobalSecondaryIndex({
      indexName: 'StatusIndex',
      partitionKey: { name: 'status', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
    });

    // SNS Topic for developer notifications
    const notificationTopic = new sns.Topic(
      this,
      'DeveloperNotificationTopic',
      {
        topicName: `bug-notifications-${environmentSuffix}`,
        displayName: 'Bug Assignment Notifications',
      }
    );

    // Lambda function for processing bug reports with Comprehend
    const processBugLogGroup = new logs.LogGroup(this, 'ProcessBugLogGroup', {
      logGroupName: `/aws/lambda/process-bug-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const processBugLambda = new lambda.Function(this, 'ProcessBugFunction', {
      functionName: `process-bug-${environmentSuffix}`,
      runtime: lambda.Runtime.PYTHON_3_10,
      handler: 'index.lambda_handler',
      code: lambda.Code.fromAsset(
        path.join(__dirname, 'lambda', 'process-bug')
      ),
      timeout: cdk.Duration.seconds(60),
      memorySize: 512,
      environment: {
        BUGS_TABLE_NAME: bugsTable.tableName,
        ATTACHMENTS_BUCKET: attachmentsBucket.bucketName,
        AWS_REGION_NAME: this.region,
        BEDROCK_REGION: 'us-west-2',
      },
      logGroup: processBugLogGroup,
    });

    // Grant Comprehend permissions
    processBugLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          'comprehend:DetectSentiment',
          'comprehend:DetectTargetedSentiment',
          'comprehend:DetectEntities',
        ],
        resources: ['*'],
      })
    );

    // Grant Bedrock permissions for cross-region access
    processBugLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          'bedrock:InvokeModel',
          'bedrock:InvokeModelWithResponseStream',
        ],
        resources: [
          'arn:aws:bedrock:us-west-2::foundation-model/anthropic.claude-3-haiku-20240307-v1:0',
          'arn:aws:bedrock:us-west-2::foundation-model/anthropic.claude-3-sonnet-20240229-v1:0',
        ],
      })
    );

    // Grant DynamoDB permissions
    bugsTable.grantReadWriteData(processBugLambda);

    // Grant S3 permissions
    attachmentsBucket.grantReadWrite(processBugLambda);

    // Method to create Lambda functions with consistent configuration
    const createLambdaFunction = (
      id: string,
      functionName: string,
      codePath: string,
      env: Record<string, string>,
      timeout = 30,
      memorySize = 256
    ) => {
      const logGroup = new logs.LogGroup(this, `${id}LogGroup`, {
        logGroupName: `/aws/lambda/${functionName}`,
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      });

      return new lambda.Function(this, id, {
        functionName: functionName,
        runtime: lambda.Runtime.PYTHON_3_10,
        handler: 'index.lambda_handler',
        code: lambda.Code.fromAsset(codePath),
        timeout: cdk.Duration.seconds(timeout),
        memorySize: memorySize,
        environment: env,
        logGroup: logGroup,
      });
    };

    // Lambda function for triaging bugs in Step Functions
    const triageBugLambda = createLambdaFunction(
      'TriageBugFunction',
      `triage-bug-${environmentSuffix}`,
      path.join(__dirname, 'lambda', 'triage-bug'),
      {
        BUGS_TABLE_NAME: bugsTable.tableName,
      }
    );

    bugsTable.grantReadWriteData(triageBugLambda);

    // Lambda function for assigning bugs to developers
    const assignBugLambda = createLambdaFunction(
      'AssignBugFunction',
      `assign-bug-${environmentSuffix}`,
      path.join(__dirname, 'lambda', 'assign-bug'),
      {
        BUGS_TABLE_NAME: bugsTable.tableName,
        NOTIFICATION_TOPIC_ARN: notificationTopic.topicArn,
      }
    );

    bugsTable.grantReadWriteData(assignBugLambda);
    notificationTopic.grantPublish(assignBugLambda);

    // Lambda function for batch processing low priority bugs
    const batchProcessLambda = createLambdaFunction(
      'BatchProcessFunction',
      `batch-process-${environmentSuffix}`,
      path.join(__dirname, 'lambda', 'batch-process'),
      {
        BUGS_TABLE_NAME: bugsTable.tableName,
      },
      60,
      512
    );

    bugsTable.grantReadWriteData(batchProcessLambda);

    // Step Functions state machine for bug triage workflow
    const triageTask = new tasks.LambdaInvoke(this, 'TriageBugTask', {
      lambdaFunction: triageBugLambda,
      outputPath: '$.Payload',
    });

    const assignHighPriorityTask = new tasks.LambdaInvoke(
      this,
      'AssignHighPriority',
      {
        lambdaFunction: assignBugLambda,
        payload: sfn.TaskInput.fromObject({
          bugId: sfn.JsonPath.stringAt('$.bugId'),
          priority: sfn.JsonPath.stringAt('$.priority'),
          assignTo: 'senior-dev-team',
        }),
        outputPath: '$.Payload',
      }
    );

    const assignMediumPriorityTask = new tasks.LambdaInvoke(
      this,
      'AssignMediumPriority',
      {
        lambdaFunction: assignBugLambda,
        payload: sfn.TaskInput.fromObject({
          bugId: sfn.JsonPath.stringAt('$.bugId'),
          priority: sfn.JsonPath.stringAt('$.priority'),
          assignTo: 'regular-dev-team',
        }),
        outputPath: '$.Payload',
      }
    );

    const batchProcessTask = new tasks.LambdaInvoke(
      this,
      'BatchProcessLowPriority',
      {
        lambdaFunction: batchProcessLambda,
        payload: sfn.TaskInput.fromObject({
          bugId: sfn.JsonPath.stringAt('$.bugId'),
          priority: sfn.JsonPath.stringAt('$.priority'),
        }),
        outputPath: '$.Payload',
      }
    );

    const successState = new sfn.Succeed(this, 'BugTriaged');

    const priorityChoice = new sfn.Choice(this, 'CheckPriority')
      .when(
        sfn.Condition.stringEquals('$.priority', 'high'),
        assignHighPriorityTask
      )
      .when(
        sfn.Condition.stringEquals('$.priority', 'medium'),
        assignMediumPriorityTask
      )
      .when(sfn.Condition.stringEquals('$.priority', 'low'), batchProcessTask)
      .otherwise(assignMediumPriorityTask);

    assignHighPriorityTask.next(successState);
    assignMediumPriorityTask.next(successState);
    batchProcessTask.next(successState);

    const definition = triageTask.next(priorityChoice);

    const stateMachine = new sfn.StateMachine(this, 'BugTriageStateMachine', {
      stateMachineName: `bug-triage-${environmentSuffix}`,
      definitionBody: sfn.DefinitionBody.fromChainable(definition),
      timeout: cdk.Duration.minutes(5),
      tracingEnabled: true,
      logs: {
        destination: new logs.LogGroup(this, 'StateMachineLogGroup', {
          logGroupName: `/aws/stepfunctions/bug-triage-${environmentSuffix}`,
          retention: logs.RetentionDays.ONE_WEEK,
          removalPolicy: cdk.RemovalPolicy.DESTROY,
        }),
        level: sfn.LogLevel.ALL,
      },
    });

    // EventBridge Event Bus for bug events
    const bugEventBus = new events.EventBus(this, 'BugEventBus', {
      eventBusName: `bug-events-${environmentSuffix}`,
    });

    // EventBridge Rule to trigger Step Functions
    const triageRule = new events.Rule(this, 'BugTriageRule', {
      eventBus: bugEventBus,
      eventPattern: {
        source: ['bug-tracking.dynamodb'],
        detailType: ['Bug Created'],
        detail: {
          status: ['new'],
        },
      },
      ruleName: `bug-triage-rule-${environmentSuffix}`,
    });

    triageRule.addTarget(
      new targets.SfnStateMachine(stateMachine, {
        input: events.RuleTargetInput.fromObject({
          bugId: events.EventField.fromPath('$.detail.bugId'),
        }),
      })
    );

    // IAM Role for EventBridge Pipes
    const pipeRole = new iam.Role(this, 'EventBridgePipeRole', {
      assumedBy: new iam.ServicePrincipal('pipes.amazonaws.com'),
      description: 'Role for EventBridge Pipe to read from DynamoDB Stream',
    });

    // Grant read access to DynamoDB Stream
    pipeRole.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          'dynamodb:DescribeStream',
          'dynamodb:GetRecords',
          'dynamodb:GetShardIterator',
          'dynamodb:ListStreams',
        ],
        resources: [bugsTable.tableStreamArn!],
      })
    );

    // Grant permission to put events to EventBridge
    pipeRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['events:PutEvents'],
        resources: [bugEventBus.eventBusArn],
      })
    );

    // EventBridge Pipe connecting DynamoDB Stream to EventBridge
    const bugPipeProps = {
      name: `bug-stream-pipe-${environmentSuffix}`,
      roleArn: pipeRole.roleArn,
      source: bugsTable.tableStreamArn!,
      target: bugEventBus.eventBusArn,
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
                dynamodb: {
                  NewImage: {
                    status: {
                      S: ['new'],
                    },
                  },
                },
              }),
            },
          ],
        },
      },
      targetParameters: {
        eventBridgeEventBusParameters: {
          detailType: 'Bug Created',
          source: 'bug-tracking.dynamodb',
        },
      },
      description: 'Pipe to route new bug events from DynamoDB to EventBridge',
    };

    // Only create the bugPipe AFTER the role and other resources are created
    const bugPipe = new pipes.CfnPipe(this, 'BugEventPipe', bugPipeProps);

    // Override the attachment bucket with explicit dependency removal
    attachmentsBucket.node.addDependency(bugPipe);

    // API Gateway REST API
    const api = new apigateway.RestApi(this, 'BugTrackingAPI', {
      restApiName: `bug-tracking-api-${environmentSuffix}`,
      description: 'API for bug tracking system',
      deployOptions: {
        stageName: environmentSuffix,
        tracingEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        metricsEnabled: true,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    // API Gateway integration with Lambda
    const bugIntegration = new apigateway.LambdaIntegration(processBugLambda, {
      proxy: true,
    });

    const bugsResource = api.root.addResource('bugs');
    bugsResource.addMethod('POST', bugIntegration);
    bugsResource.addMethod('GET', bugIntegration);

    const bugResource = bugsResource.addResource('{bugId}');
    bugResource.addMethod('GET', bugIntegration);
    bugResource.addMethod('PUT', bugIntegration);

    // CloudWatch Dashboard
    const dashboard = new cloudwatch.Dashboard(this, 'BugTrackingDashboard', {
      dashboardName: `bug-tracking-${environmentSuffix}`,
    });

    // API Gateway metrics
    const apiRequestMetric = api.metricCount({
      statistic: 'sum',
      period: cdk.Duration.minutes(5),
    });

    const api4xxMetric = api.metricClientError({
      statistic: 'sum',
      period: cdk.Duration.minutes(5),
    });

    const api5xxMetric = api.metricServerError({
      statistic: 'sum',
      period: cdk.Duration.minutes(5),
    });

    const apiLatencyMetric = api.metricLatency({
      statistic: 'avg',
      period: cdk.Duration.minutes(5),
    });

    // Lambda metrics
    const processBugErrorMetric = processBugLambda.metricErrors({
      statistic: 'sum',
      period: cdk.Duration.minutes(5),
    });

    const processBugDurationMetric = processBugLambda.metricDuration({
      statistic: 'avg',
      period: cdk.Duration.minutes(5),
    });

    // Step Functions metrics
    const stateMachineExecutionMetric = stateMachine.metricStarted({
      statistic: 'sum',
      period: cdk.Duration.minutes(5),
    });

    const stateMachineFailedMetric = stateMachine.metricFailed({
      statistic: 'sum',
      period: cdk.Duration.minutes(5),
    });

    // Add widgets to dashboard
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'API Request Count',
        left: [apiRequestMetric],
      })
    );

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'API Errors',
        left: [api4xxMetric, api5xxMetric],
      })
    );

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'API Latency',
        left: [apiLatencyMetric],
      })
    );

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Lambda Processing',
        left: [processBugErrorMetric],
        right: [processBugDurationMetric],
      })
    );

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'State Machine Executions',
        left: [stateMachineExecutionMetric, stateMachineFailedMetric],
      })
    );

    // IAM Role for team access
    const teamAccessRole = new iam.Role(this, 'TeamAccessRole', {
      roleName: `bug-tracking-team-access-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'Role for team members to access bug tracking system',
    });

    // Grant read access to bugs table
    bugsTable.grantReadData(teamAccessRole);

    // Grant read access to attachments bucket
    attachmentsBucket.grantRead(teamAccessRole);

    // Grant permissions to view CloudWatch logs
    teamAccessRole.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          'logs:DescribeLogGroups',
          'logs:DescribeLogStreams',
          'logs:GetLogEvents',
        ],
        resources: [
          `arn:aws:logs:${this.region}:${this.account}:log-group:/aws/lambda/*`,
          `arn:aws:logs:${this.region}:${this.account}:log-group:/aws/stepfunctions/*`,
        ],
      })
    );

    // Stack Outputs
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'Bug Tracking API URL',
      exportName: `BugTrackingApiUrl-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'BugsTableName', {
      value: bugsTable.tableName,
      description: 'DynamoDB Bugs Table Name',
      exportName: `BugsTableName-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'AttachmentsBucketName', {
      value: attachmentsBucket.bucketName,
      description: 'S3 Attachments Bucket Name',
      exportName: `AttachmentsBucketName-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'NotificationTopicArn', {
      value: notificationTopic.topicArn,
      description: 'SNS Notification Topic ARN',
      exportName: `NotificationTopicArn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'StateMachineArn', {
      value: stateMachine.stateMachineArn,
      description: 'Step Functions State Machine ARN',
      exportName: `StateMachineArn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DashboardName', {
      value: dashboard.dashboardName,
      description: 'CloudWatch Dashboard Name',
      exportName: `DashboardName-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'EventBusName', {
      value: bugEventBus.eventBusName,
      description: 'EventBridge Event Bus Name',
      exportName: `EventBusName-${environmentSuffix}`,
    });
  }
}
