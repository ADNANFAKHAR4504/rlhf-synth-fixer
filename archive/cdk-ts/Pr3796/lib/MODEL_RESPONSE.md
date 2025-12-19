# Bug Tracking System with EventBridge Pipes and Amazon Bedrock

Here's the enhanced bug tracking system infrastructure code with EventBridge Pipes for improved event routing and Amazon Bedrock for AI-powered bug analysis.

## lib/tap-stack.ts

```typescript
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
    });

    // DynamoDB table for bug reports with streams enabled
    const bugsTable = new dynamodb.Table(this, 'BugsTable', {
      tableName: `bug-reports-${environmentSuffix}`,
      partitionKey: { name: 'bugId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
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

    // Lambda function for processing bug reports with Comprehend and Bedrock
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
      logRetention: logs.RetentionDays.ONE_WEEK,
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
          `arn:aws:bedrock:us-west-2::foundation-model/anthropic.claude-3-haiku-20240307-v1:0`,
          `arn:aws:bedrock:us-west-2::foundation-model/anthropic.claude-3-sonnet-20240229-v1:0`,
        ],
      })
    );

    // Grant DynamoDB permissions
    bugsTable.grantReadWriteData(processBugLambda);

    // Grant S3 permissions
    attachmentsBucket.grantReadWrite(processBugLambda);

    // Lambda function for triaging bugs in Step Functions
    const triageBugLambda = new lambda.Function(this, 'TriageBugFunction', {
      functionName: `triage-bug-${environmentSuffix}`,
      runtime: lambda.Runtime.PYTHON_3_10,
      handler: 'index.lambda_handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'lambda', 'triage-bug')),
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      environment: {
        BUGS_TABLE_NAME: bugsTable.tableName,
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    bugsTable.grantReadWriteData(triageBugLambda);

    // Lambda function for assigning bugs to developers
    const assignBugLambda = new lambda.Function(this, 'AssignBugFunction', {
      functionName: `assign-bug-${environmentSuffix}`,
      runtime: lambda.Runtime.PYTHON_3_10,
      handler: 'index.lambda_handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'lambda', 'assign-bug')),
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      environment: {
        BUGS_TABLE_NAME: bugsTable.tableName,
        NOTIFICATION_TOPIC_ARN: notificationTopic.topicArn,
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    bugsTable.grantReadWriteData(assignBugLambda);
    notificationTopic.grantPublish(assignBugLambda);

    // Lambda function for batch processing low priority bugs
    const batchProcessLambda = new lambda.Function(
      this,
      'BatchProcessFunction',
      {
        functionName: `batch-process-${environmentSuffix}`,
        runtime: lambda.Runtime.PYTHON_3_10,
        handler: 'index.lambda_handler',
        code: lambda.Code.fromAsset(
          path.join(__dirname, 'lambda', 'batch-process')
        ),
        timeout: cdk.Duration.seconds(60),
        memorySize: 512,
        environment: {
          BUGS_TABLE_NAME: bugsTable.tableName,
        },
        logRetention: logs.RetentionDays.ONE_WEEK,
      }
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
    const bugPipe = new pipes.CfnPipe(this, 'BugEventPipe', {
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
    });

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
```

## lib/lambda/process-bug/index.py

```python
import json
import os
import boto3
import logging
from datetime import datetime
import uuid
from decimal import Decimal

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
comprehend = boto3.client('comprehend')
bedrock_runtime = boto3.client('bedrock-runtime', region_name='us-west-2')
s3 = boto3.client('s3')

# Environment variables
BUGS_TABLE_NAME = os.environ['BUGS_TABLE_NAME']
ATTACHMENTS_BUCKET = os.environ['ATTACHMENTS_BUCKET']
AWS_REGION_NAME = os.environ.get('AWS_REGION_NAME', 'us-west-1')
BEDROCK_REGION = os.environ.get('BEDROCK_REGION', 'us-west-2')

bugs_table = dynamodb.Table(BUGS_TABLE_NAME)


def lambda_handler(event, context):
    """
    Process incoming bug reports and classify severity using AWS Comprehend and Bedrock
    """
    try:
        logger.info(f"Received event: {json.dumps(event)}")

        http_method = event.get('httpMethod', '')
        path = event.get('path', '')

        if http_method == 'POST' and path == '/bugs':
            return handle_create_bug(event)
        elif http_method == 'GET' and path == '/bugs':
            return handle_list_bugs(event)
        elif http_method == 'GET' and '/bugs/' in path:
            return handle_get_bug(event)
        elif http_method == 'PUT' and '/bugs/' in path:
            return handle_update_bug(event)
        else:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Unsupported operation'})
            }

    except Exception as e:
        logger.error(f"Error processing request: {str(e)}", exc_info=True)
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Internal server error', 'message': str(e)})
        }


def handle_create_bug(event):
    """Create a new bug report with AI-powered analysis"""
    try:
        body = json.loads(event.get('body', '{}'))

        # Validate required fields
        if not body.get('title') or not body.get('description'):
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Title and description are required'})
            }

        bug_id = str(uuid.uuid4())
        timestamp = datetime.utcnow().isoformat()

        # Use Comprehend Targeted Sentiment to analyze the bug report
        description = body['description']
        priority = classify_bug_severity(description)

        # Use Bedrock to perform AI-powered bug analysis
        ai_analysis = analyze_bug_with_bedrock(body['title'], description)

        # Create bug item
        bug_item = {
            'bugId': bug_id,
            'timestamp': timestamp,
            'title': body['title'],
            'description': description,
            'priority': priority,
            'status': 'new',
            'reporter': body.get('reporter', 'unknown'),
            'tags': body.get('tags', []),
            'createdAt': timestamp,
            'updatedAt': timestamp,
            'aiAnalysis': ai_analysis
        }

        # Store in DynamoDB
        bugs_table.put_item(Item=bug_item)

        logger.info(f"Created bug {bug_id} with priority {priority}")

        return {
            'statusCode': 201,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({
                'bugId': bug_id,
                'priority': priority,
                'status': 'new',
                'aiAnalysis': ai_analysis,
                'message': 'Bug report created successfully'
            })
        }

    except Exception as e:
        logger.error(f"Error creating bug: {str(e)}", exc_info=True)
        raise


def handle_list_bugs(event):
    """List all bugs with optional filtering"""
    try:
        query_params = event.get('queryStringParameters') or {}
        priority = query_params.get('priority')
        status = query_params.get('status')

        if priority:
            # Query using PriorityIndex
            response = bugs_table.query(
                IndexName='PriorityIndex',
                KeyConditionExpression='priority = :priority',
                ExpressionAttributeValues={':priority': priority},
                Limit=100
            )
        elif status:
            # Query using StatusIndex
            response = bugs_table.query(
                IndexName='StatusIndex',
                KeyConditionExpression='#status = :status',
                ExpressionAttributeNames={'#status': 'status'},
                ExpressionAttributeValues={':status': status},
                Limit=100
            )
        else:
            # Scan for all bugs (limited)
            response = bugs_table.scan(Limit=100)

        items = response.get('Items', [])

        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({
                'bugs': items,
                'count': len(items)
            }, default=decimal_default)
        }

    except Exception as e:
        logger.error(f"Error listing bugs: {str(e)}", exc_info=True)
        raise


def handle_get_bug(event):
    """Get a specific bug by ID"""
    try:
        bug_id = event['pathParameters']['bugId']

        # Query for bug
        response = bugs_table.query(
            KeyConditionExpression='bugId = :bugId',
            ExpressionAttributeValues={':bugId': bug_id},
            Limit=1
        )

        items = response.get('Items', [])

        if not items:
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Bug not found'})
            }

        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps(items[0], default=decimal_default)
        }

    except Exception as e:
        logger.error(f"Error getting bug: {str(e)}", exc_info=True)
        raise


def handle_update_bug(event):
    """Update an existing bug"""
    try:
        bug_id = event['pathParameters']['bugId']
        body = json.loads(event.get('body', '{}'))

        # First, get the existing bug to get its timestamp
        response = bugs_table.query(
            KeyConditionExpression='bugId = :bugId',
            ExpressionAttributeValues={':bugId': bug_id},
            Limit=1
        )

        items = response.get('Items', [])

        if not items:
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Bug not found'})
            }

        existing_bug = items[0]
        timestamp = existing_bug['timestamp']

        # Update fields
        update_expression = 'SET updatedAt = :updatedAt'
        expression_values = {':updatedAt': datetime.utcnow().isoformat()}

        if 'status' in body:
            update_expression += ', #status = :status'
            expression_values[':status'] = body['status']

        if 'assignedTo' in body:
            update_expression += ', assignedTo = :assignedTo'
            expression_values[':assignedTo'] = body['assignedTo']

        # Update the bug
        update_params = {
            'Key': {'bugId': bug_id, 'timestamp': timestamp},
            'UpdateExpression': update_expression,
            'ExpressionAttributeValues': expression_values,
            'ReturnValues': 'ALL_NEW'
        }

        if '#status' in update_expression:
            update_params['ExpressionAttributeNames'] = {'#status': 'status'}

        response = bugs_table.update_item(**update_params)

        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({
                'bug': response['Attributes'],
                'message': 'Bug updated successfully'
            }, default=decimal_default)
        }

    except Exception as e:
        logger.error(f"Error updating bug: {str(e)}", exc_info=True)
        raise


def classify_bug_severity(description):
    """
    Use AWS Comprehend Targeted Sentiment to classify bug severity
    """
    try:
        # Use Targeted Sentiment to analyze sentiment towards specific entities
        response = comprehend.detect_targeted_sentiment(
            Text=description[:5000],  # Comprehend has a 5000 byte limit
            LanguageCode='en'
        )

        entities = response.get('Entities', [])

        # Calculate average sentiment score
        negative_count = 0
        total_mentions = 0

        for entity in entities:
            mentions = entity.get('Mentions', [])
            for mention in mentions:
                sentiment_score = mention.get('MentionSentiment', {})
                total_mentions += 1

                # Check if sentiment is negative
                if sentiment_score.get('Sentiment') == 'NEGATIVE':
                    negative_count += 1

        # Determine priority based on negative sentiment
        if total_mentions > 0:
            negative_ratio = negative_count / total_mentions

            if negative_ratio >= 0.6:
                return 'high'
            elif negative_ratio >= 0.3:
                return 'medium'
            else:
                return 'low'

        # Fallback: use general sentiment analysis
        sentiment_response = comprehend.detect_sentiment(
            Text=description[:5000],
            LanguageCode='en'
        )

        sentiment = sentiment_response.get('Sentiment')

        if sentiment == 'NEGATIVE':
            return 'high'
        elif sentiment == 'MIXED':
            return 'medium'
        else:
            return 'low'

    except Exception as e:
        logger.warning(f"Error classifying severity with Comprehend: {str(e)}")
        # Default to medium priority if classification fails
        return 'medium'


def analyze_bug_with_bedrock(title, description):
    """
    Use Amazon Bedrock to perform AI-powered bug analysis
    """
    try:
        prompt = f"""Analyze this bug report and provide the following information:

Bug Title: {title}
Bug Description: {description}

Please provide:
1. Bug Category (choose one: UI, Backend, Database, Security, Network, Performance, Integration, Other)
2. Potential Root Causes (list 2-3 likely causes)
3. Key Technical Entities (extract technical terms, APIs, services, components mentioned)
4. Suggested Investigation Steps (list 2-3 specific steps)

Format your response as JSON with these fields: category, rootCauses (array), technicalEntities (array), investigationSteps (array)."""

        request_body = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 1000,
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "temperature": 0.3,
        }

        response = bedrock_runtime.invoke_model(
            modelId='anthropic.claude-3-haiku-20240307-v1:0',
            body=json.dumps(request_body)
        )

        response_body = json.loads(response['body'].read())
        ai_response = response_body['content'][0]['text']

        # Try to parse JSON response
        try:
            # Find JSON content between curly braces
            start_idx = ai_response.find('{')
            end_idx = ai_response.rfind('}') + 1
            if start_idx != -1 and end_idx > start_idx:
                json_str = ai_response[start_idx:end_idx]
                analysis = json.loads(json_str)
            else:
                # Fallback if JSON parsing fails
                analysis = {
                    'category': 'Other',
                    'rootCauses': ['Unable to determine - see raw analysis'],
                    'technicalEntities': [],
                    'investigationSteps': ['Review the bug description', 'Check logs', 'Reproduce the issue'],
                    'rawAnalysis': ai_response
                }
        except json.JSONDecodeError:
            # Fallback if JSON parsing fails
            analysis = {
                'category': 'Other',
                'rootCauses': ['Unable to determine - see raw analysis'],
                'technicalEntities': [],
                'investigationSteps': ['Review the bug description', 'Check logs', 'Reproduce the issue'],
                'rawAnalysis': ai_response
            }

        logger.info(f"Bedrock analysis completed: {analysis.get('category', 'Unknown')}")
        return analysis

    except Exception as e:
        logger.warning(f"Error analyzing bug with Bedrock: {str(e)}")
        # Return default analysis if Bedrock fails
        return {
            'category': 'Other',
            'rootCauses': ['Analysis unavailable'],
            'technicalEntities': [],
            'investigationSteps': ['Manual investigation required'],
            'error': str(e)
        }


def decimal_default(obj):
    """JSON serializer for Decimal objects"""
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError
```

## lib/lambda/triage-bug/index.py

```python
import json
import os
import boto3
import logging
from datetime import datetime

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')

# Environment variables
BUGS_TABLE_NAME = os.environ['BUGS_TABLE_NAME']
bugs_table = dynamodb.Table(BUGS_TABLE_NAME)


def lambda_handler(event, context):
    """
    Triage bug and prepare for assignment
    """
    try:
        logger.info(f"Triaging bug: {json.dumps(event)}")

        bug_id = event.get('bugId')

        if not bug_id:
            return {
                'statusCode': 400,
                'error': 'Bug ID is required'
            }

        # Get bug from DynamoDB
        response = bugs_table.query(
            KeyConditionExpression='bugId = :bugId',
            ExpressionAttributeValues={':bugId': bug_id},
            Limit=1
        )

        items = response.get('Items', [])

        if not items:
            return {
                'statusCode': 404,
                'error': 'Bug not found'
            }

        bug = items[0]
        priority = bug.get('priority', 'medium')

        # Update bug status to 'triaging'
        bugs_table.update_item(
            Key={'bugId': bug_id, 'timestamp': bug['timestamp']},
            UpdateExpression='SET #status = :status, updatedAt = :updatedAt',
            ExpressionAttributeNames={'#status': 'status'},
            ExpressionAttributeValues={
                ':status': 'triaging',
                ':updatedAt': datetime.utcnow().isoformat()
            }
        )

        logger.info(f"Bug {bug_id} triaged with priority {priority}")

        return {
            'bugId': bug_id,
            'priority': priority,
            'title': bug.get('title'),
            'description': bug.get('description'),
            'status': 'triaging'
        }

    except Exception as e:
        logger.error(f"Error triaging bug: {str(e)}", exc_info=True)
        return {
            'statusCode': 500,
            'error': str(e)
        }
```

## lib/lambda/assign-bug/index.py

```python
import json
import os
import boto3
import logging
from datetime import datetime

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
sns = boto3.client('sns')

# Environment variables
BUGS_TABLE_NAME = os.environ['BUGS_TABLE_NAME']
NOTIFICATION_TOPIC_ARN = os.environ['NOTIFICATION_TOPIC_ARN']

bugs_table = dynamodb.Table(BUGS_TABLE_NAME)


def lambda_handler(event, context):
    """
    Assign bug to a developer team and send notification
    """
    try:
        logger.info(f"Assigning bug: {json.dumps(event)}")

        bug_id = event.get('bugId')
        priority = event.get('priority', 'medium')
        assign_to = event.get('assignTo', 'regular-dev-team')

        if not bug_id:
            return {
                'statusCode': 400,
                'error': 'Bug ID is required'
            }

        # Get bug from DynamoDB
        response = bugs_table.query(
            KeyConditionExpression='bugId = :bugId',
            ExpressionAttributeValues={':bugId': bug_id},
            Limit=1
        )

        items = response.get('Items', [])

        if not items:
            return {
                'statusCode': 404,
                'error': 'Bug not found'
            }

        bug = items[0]

        # Update bug with assignment
        bugs_table.update_item(
            Key={'bugId': bug_id, 'timestamp': bug['timestamp']},
            UpdateExpression='SET #status = :status, assignedTo = :assignedTo, updatedAt = :updatedAt',
            ExpressionAttributeNames={'#status': 'status'},
            ExpressionAttributeValues={
                ':status': 'assigned',
                ':assignedTo': assign_to,
                ':updatedAt': datetime.utcnow().isoformat()
            }
        )

        # Send SNS notification
        message = f"""
Bug Assigned: {bug.get('title', 'No title')}
Bug ID: {bug_id}
Priority: {priority}
Assigned To: {assign_to}
Description: {bug.get('description', 'No description')[:200]}...

Please investigate and resolve this issue.
        """

        sns.publish(
            TopicArn=NOTIFICATION_TOPIC_ARN,
            Subject=f"Bug Assigned [{priority.upper()}]: {bug.get('title', 'No title')[:50]}",
            Message=message
        )

        logger.info(f"Bug {bug_id} assigned to {assign_to}")

        return {
            'bugId': bug_id,
            'priority': priority,
            'assignedTo': assign_to,
            'status': 'assigned',
            'message': 'Bug assigned successfully'
        }

    except Exception as e:
        logger.error(f"Error assigning bug: {str(e)}", exc_info=True)
        return {
            'statusCode': 500,
            'error': str(e)
        }
```

## lib/lambda/batch-process/index.py

```python
import json
import os
import boto3
import logging
from datetime import datetime

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')

# Environment variables
BUGS_TABLE_NAME = os.environ['BUGS_TABLE_NAME']
bugs_table = dynamodb.Table(BUGS_TABLE_NAME)


def lambda_handler(event, context):
    """
    Batch process low priority bugs
    """
    try:
        logger.info(f"Batch processing bug: {json.dumps(event)}")

        bug_id = event.get('bugId')
        priority = event.get('priority', 'low')

        if not bug_id:
            return {
                'statusCode': 400,
                'error': 'Bug ID is required'
            }

        # Get bug from DynamoDB
        response = bugs_table.query(
            KeyConditionExpression='bugId = :bugId',
            ExpressionAttributeValues={':bugId': bug_id},
            Limit=1
        )

        items = response.get('Items', [])

        if not items:
            return {
                'statusCode': 404,
                'error': 'Bug not found'
            }

        bug = items[0]

        # Update bug status to 'batched'
        bugs_table.update_item(
            Key={'bugId': bug_id, 'timestamp': bug['timestamp']},
            UpdateExpression='SET #status = :status, updatedAt = :updatedAt',
            ExpressionAttributeNames={'#status': 'status'},
            ExpressionAttributeValues={
                ':status': 'batched',
                ':updatedAt': datetime.utcnow().isoformat()
            }
        )

        logger.info(f"Bug {bug_id} added to batch processing queue")

        return {
            'bugId': bug_id,
            'priority': priority,
            'status': 'batched',
            'message': 'Bug added to batch processing queue'
        }

    except Exception as e:
        logger.error(f"Error batch processing bug: {str(e)}", exc_info=True)
        return {
            'statusCode': 500,
            'error': str(e)
        }
```

The infrastructure is now enhanced with two recent AWS features:

1. **EventBridge Pipes**: Replaces the direct Lambda DynamoDB Stream trigger with a more sophisticated event routing mechanism. The pipe filters only INSERT events with status='new' and routes them to EventBridge, which then triggers Step Functions. This provides better decoupling and filtering capabilities.

2. **Amazon Bedrock**: Added AI-powered bug analysis using Claude 3 Haiku model. The system now automatically categorizes bugs, suggests root causes, extracts technical entities, and provides investigation steps. This enhances bug triage with intelligent insights.

Key enhancements:
- EventBridge Pipes for advanced event filtering and routing
- EventBridge Event Bus for centralized event management
- Amazon Bedrock integration for AI-powered bug analysis
- Cross-region Bedrock calls (us-west-2) from us-west-1 Lambda
- Enhanced bug data model with AI analysis results
- Removed direct DynamoDB Streams Lambda trigger in favor of EventBridge Pipes
- Maintained all existing functionality while adding new capabilities
