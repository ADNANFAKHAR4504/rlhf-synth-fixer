import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as stepfunctions from 'aws-cdk-lib/aws-stepfunctions';
import * as sfnTasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as snsSubscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as emrServerless from 'aws-cdk-lib/aws-emrserverless';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import { Construct } from 'constructs';

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

    // 🔹 VPC Configuration
    const vpc = new ec2.Vpc(this, 'FraudAnalysisVPC', {
      maxAzs: 2,
      natGateways: 0,
      restrictDefaultSecurityGroup: false,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'PrivateSubnet',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    // 🔹 VPC Endpoints
    vpc.addGatewayEndpoint('S3Endpoint', {
      service: ec2.GatewayVpcEndpointAwsService.S3,
    });

    vpc.addGatewayEndpoint('DynamoDBEndpoint', {
      service: ec2.GatewayVpcEndpointAwsService.DYNAMODB,
    });

    // 🔹 Security Group for EMR
    const emrSecurityGroup = new ec2.SecurityGroup(this, 'EMRSecurityGroup', {
      vpc,
      description: 'Security group for EMR Serverless',
      allowAllOutbound: false,
    });

    // Allow HTTPS to VPC endpoints
    emrSecurityGroup.addEgressRule(
      ec2.Peer.ipv4(vpc.vpcCidrBlock),
      ec2.Port.tcp(443),
      'HTTPS to VPC endpoints'
    );

    // 🔹 S3 Buckets
    const rawTransactionsBucket = new s3.Bucket(this, 'RawTransactionsBucket', {
      bucketName: `fraud-analysis-raw-transactions-${this.account}-${environmentSuffix}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      lifecycleRules: [
        {
          id: 'MoveToGlacier',
          transitions: [
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(30),
            },
          ],
        },
      ],
      eventBridgeEnabled: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const processedDataBucket = new s3.Bucket(this, 'ProcessedDataBucket', {
      bucketName: `fraud-analysis-processed-data-${this.account}-${environmentSuffix}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      lifecycleRules: [
        {
          id: 'MoveToGlacier',
          transitions: [
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(30),
            },
          ],
        },
      ],
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const fraudReportsBucket = new s3.Bucket(this, 'FraudReportsBucket', {
      bucketName: `fraud-analysis-fraud-reports-${this.account}-${environmentSuffix}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      lifecycleRules: [
        {
          id: 'MoveToGlacier',
          transitions: [
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(30),
            },
          ],
        },
      ],
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // 🔹 DynamoDB Table
    const jobsTable = new dynamodb.Table(this, 'FraudAnalysisJobs', {
      tableName: `fraud-analysis-jobs-${environmentSuffix}`,
      partitionKey: { name: 'job_id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // 🔹 SNS Topic
    const notificationTopic = new sns.Topic(
      this,
      'FraudAnalysisNotifications',
      {
        topicName: `fraud-analysis-notifications-${environmentSuffix}`,
        displayName: 'Fraud Analysis Job Notifications',
      }
    );

    notificationTopic.addSubscription(
      new snsSubscriptions.EmailSubscription('fraud-alerts@example.com')
    );

    // 🔹 EMR Serverless
    const emrRole = new iam.Role(this, 'EMRServerlessRole', {
      assumedBy: new iam.ServicePrincipal('emr-serverless.amazonaws.com'),
      description: 'Role for EMR Serverless application',
    });

    emrRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          's3:GetObject',
          's3:ListBucket',
          's3:PutObject',
          's3:DeleteObject',
        ],
        resources: [
          rawTransactionsBucket.bucketArn,
          `${rawTransactionsBucket.bucketArn}/*`,
          processedDataBucket.bucketArn,
          `${processedDataBucket.bucketArn}/*`,
          fraudReportsBucket.bucketArn,
          `${fraudReportsBucket.bucketArn}/*`,
        ],
      })
    );

    emrRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'logs:CreateLogGroup',
          'logs:CreateLogStream',
          'logs:PutLogEvents',
        ],
        resources: ['*'],
      })
    );

    const emrApp = new emrServerless.CfnApplication(this, 'FraudAnalysisEMR', {
      name: `fraud-analysis-emr-${environmentSuffix}`,
      releaseLabel: 'emr-6.9.0',
      type: 'SPARK',
      maximumCapacity: {
        cpu: '100 vCPU',
        memory: '300 GB',
      },
      networkConfiguration: {
        subnetIds: vpc.selectSubnets({
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        }).subnetIds,
        securityGroupIds: [emrSecurityGroup.securityGroupId],
      },
      autoStartConfiguration: {
        enabled: false,
      },
      autoStopConfiguration: {
        enabled: true,
        idleTimeoutMinutes: 15,
      },
    });

    // 🔹 Lambda Validator Function
    const validatorRole = new iam.Role(this, 'ValidatorRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
    });

    validatorRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['s3:GetObject'],
        resources: [`${rawTransactionsBucket.bucketArn}/*`],
      })
    );

    validatorRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['dynamodb:PutItem'],
        resources: [jobsTable.tableArn],
      })
    );

    validatorRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['states:StartExecution'],
        resources: ['*'],
      })
    );

    const validatorFunction = new lambda.Function(this, 'ValidatorFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      architecture: lambda.Architecture.ARM_64,
      handler: 'index.handler',
      role: validatorRole,
      timeout: cdk.Duration.minutes(3),
      memorySize: 512,
      logRetention: logs.RetentionDays.ONE_WEEK,
      environment: {
        JOBS_TABLE: jobsTable.tableName,
        STATE_MACHINE_ARN: '', // Will be set after creating state machine
        BUCKET_NAME: rawTransactionsBucket.bucketName,
      },
      code: lambda.Code.fromInline(`
const AWS = require('aws-sdk');
const crypto = require('crypto');
const s3 = new AWS.S3();
const dynamodb = new AWS.DynamoDB.DocumentClient();
const stepfunctions = new AWS.StepFunctions();

exports.handler = async (event) => {
  try {
    const bucket = event.Records[0].s3.bucket.name;
    const key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\\+/g, ' '));
    const jobId = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    const inputFile = \`s3://\${bucket}/\${key}\`;
    
    // Validate file exists and is accessible
    await s3.headObject({ Bucket: bucket, Key: key }).promise();
    
    // Record job in DynamoDB
    await dynamodb.put({
      TableName: process.env.JOBS_TABLE,
      Item: {
        job_id: jobId,
        timestamp: timestamp,
        status: 'INITIATED',
        input_file: inputFile
      }
    }).promise();
    
    // Start Step Functions execution
    await stepfunctions.startExecution({
      stateMachineArn: process.env.STATE_MACHINE_ARN,
      name: \`fraud-analysis-\${jobId}\`,
      input: JSON.stringify({
        jobId,
        bucket,
        key,
        timestamp,
        input_file: inputFile
      })
    }).promise();
    
    return { statusCode: 200, body: JSON.stringify({ jobId }) };
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};
      `),
    });

    // 🔹 Step Functions State Machine
    const sfnRole = new iam.Role(this, 'StepFunctionsRole', {
      assumedBy: new iam.ServicePrincipal('states.amazonaws.com'),
    });

    sfnRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'emr-serverless:StartJobRun',
          'emr-serverless:GetJobRun',
          'emr-serverless:CancelJobRun',
        ],
        resources: [
          `arn:aws:emr-serverless:${this.region}:${this.account}:application/${emrApp.attrApplicationId}`,
          `arn:aws:emr-serverless:${this.region}:${this.account}:application/${emrApp.attrApplicationId}/jobruns/*`,
        ],
      })
    );

    sfnRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['dynamodb:UpdateItem'],
        resources: [jobsTable.tableArn],
      })
    );

    sfnRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['sns:Publish'],
        resources: [notificationTopic.topicArn],
      })
    );

    sfnRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['s3:GetObject', 's3:ListBucket'],
        resources: [
          processedDataBucket.bucketArn,
          `${processedDataBucket.bucketArn}/*`,
        ],
      })
    );

    sfnRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['iam:PassRole'],
        resources: [emrRole.roleArn],
      })
    );

    // Define Step Functions tasks
    const updateJobStarted = new sfnTasks.DynamoUpdateItem(
      this,
      'UpdateJobStarted',
      {
        table: jobsTable,
        key: {
          job_id: sfnTasks.DynamoAttributeValue.fromString(
            stepfunctions.JsonPath.stringAt('$.jobId')
          ),
          timestamp: sfnTasks.DynamoAttributeValue.fromString(
            stepfunctions.JsonPath.stringAt('$.timestamp')
          ),
        },
        updateExpression: 'SET #status = :status',
        expressionAttributeNames: {
          '#status': 'status',
        },
        expressionAttributeValues: {
          ':status': sfnTasks.DynamoAttributeValue.fromString('RUNNING'),
        },
      }
    );

    const submitEMRJob = new sfnTasks.CallAwsService(this, 'SubmitEMRJob', {
      service: 'emrserverless',
      action: 'startJobRun',
      parameters: {
        ApplicationId: emrApp.attrApplicationId,
        ExecutionRoleArn: emrRole.roleArn,
        Name: stepfunctions.JsonPath.stringAt('$.jobId'),
        ClientToken: stepfunctions.JsonPath.stringAt('$.jobId'),
        JobDriver: {
          SparkSubmit: {
            EntryPoint: 's3://fraud-analysis-scripts/fraud-detection.py',
            SparkSubmitParameters: stepfunctions.JsonPath.format(
              '--conf spark.executor.instances=10 --conf spark.executor.memory=8g --conf spark.executor.cores=4 --input {} --output {}',
              stepfunctions.JsonPath.stringAt('$.input_file'),
              stepfunctions.JsonPath.format(
                's3://{}/output/{}/',
                processedDataBucket.bucketName,
                stepfunctions.JsonPath.stringAt('$.jobId')
              )
            ),
          },
        },
      },
      iamResources: ['*'],
      resultPath: '$.emrJobResult',
    });

    const waitForJob = new stepfunctions.Wait(this, 'WaitForJob', {
      time: stepfunctions.WaitTime.duration(cdk.Duration.seconds(30)),
    });

    const getJobStatus = new sfnTasks.CallAwsService(this, 'GetJobStatus', {
      service: 'emrserverless',
      action: 'getJobRun',
      parameters: {
        ApplicationId: emrApp.attrApplicationId,
        JobRunId: stepfunctions.JsonPath.stringAt('$.emrJobResult.JobRunId'),
      },
      iamResources: ['*'],
      resultPath: '$.jobStatus',
    });

    const updateJobSuccess = new sfnTasks.DynamoUpdateItem(
      this,
      'UpdateJobSuccess',
      {
        table: jobsTable,
        key: {
          job_id: sfnTasks.DynamoAttributeValue.fromString(
            stepfunctions.JsonPath.stringAt('$.jobId')
          ),
          timestamp: sfnTasks.DynamoAttributeValue.fromString(
            stepfunctions.JsonPath.stringAt('$.timestamp')
          ),
        },
        updateExpression: 'SET #status = :status',
        expressionAttributeNames: {
          '#status': 'status',
        },
        expressionAttributeValues: {
          ':status': sfnTasks.DynamoAttributeValue.fromString('SUCCESS'),
        },
      }
    );

    const sendNotification = new sfnTasks.SnsPublish(this, 'SendNotification', {
      topic: notificationTopic,
      message: stepfunctions.TaskInput.fromObject({
        default: stepfunctions.JsonPath.format(
          'Fraud analysis job {} completed successfully. Results available at s3://{}/output/{}/',
          stepfunctions.JsonPath.stringAt('$.jobId'),
          processedDataBucket.bucketName,
          stepfunctions.JsonPath.stringAt('$.jobId')
        ),
      }),
      subject: stepfunctions.JsonPath.format(
        'Fraud Analysis Job {} Completed',
        stepfunctions.JsonPath.stringAt('$.jobId')
      ),
    });

    const updateJobFailed = new sfnTasks.DynamoUpdateItem(
      this,
      'UpdateJobFailed',
      {
        table: jobsTable,
        key: {
          job_id: sfnTasks.DynamoAttributeValue.fromString(
            stepfunctions.JsonPath.stringAt('$.jobId')
          ),
          timestamp: sfnTasks.DynamoAttributeValue.fromString(
            stepfunctions.JsonPath.stringAt('$.timestamp')
          ),
        },
        updateExpression: 'SET #status = :status',
        expressionAttributeNames: {
          '#status': 'status',
        },
        expressionAttributeValues: {
          ':status': sfnTasks.DynamoAttributeValue.fromString('FAILED'),
        },
      }
    );

    const sendFailureNotification = new sfnTasks.SnsPublish(
      this,
      'SendFailureNotification',
      {
        topic: notificationTopic,
        message: stepfunctions.TaskInput.fromObject({
          default: stepfunctions.JsonPath.format(
            'Fraud analysis job {} failed. Please check CloudWatch logs for details.',
            stepfunctions.JsonPath.stringAt('$.jobId')
          ),
        }),
        subject: stepfunctions.JsonPath.format(
          'Fraud Analysis Job {} Failed',
          stepfunctions.JsonPath.stringAt('$.jobId')
        ),
      }
    );

    const successChain = updateJobSuccess
      .next(sendNotification)
      .next(new stepfunctions.Succeed(this, 'JobSucceeded'));
    const failureChain = updateJobFailed.next(sendFailureNotification).next(
      new stepfunctions.Fail(this, 'JobFailed', {
        cause: 'EMR job failed or was cancelled',
      })
    );

    // Build the state machine definition with error handling
    const submitEMRJobWithCatch = submitEMRJob.addCatch(failureChain, {
      errors: ['States.ALL'],
      resultPath: '$.error',
    });

    const getJobStatusWithCatch = getJobStatus.addCatch(failureChain, {
      errors: ['States.ALL'],
      resultPath: '$.error',
    });

    // Create a polling loop: wait -> get status -> check -> (loop back or finish)
    const jobComplete = new stepfunctions.Choice(this, 'JobComplete')
      .when(
        stepfunctions.Condition.stringEquals(
          '$.jobStatus.JobRun.State',
          'SUCCESS'
        ),
        successChain
      )
      .when(
        stepfunctions.Condition.or(
          stepfunctions.Condition.stringEquals(
            '$.jobStatus.JobRun.State',
            'FAILED'
          ),
          stepfunctions.Condition.stringEquals(
            '$.jobStatus.JobRun.State',
            'CANCELLED'
          )
        ),
        failureChain
      )
      .otherwise(waitForJob);

    // Build the polling loop: wait -> get status -> check (loops back if not done)
    const pollingLoop = waitForJob
      .next(getJobStatusWithCatch)
      .next(jobComplete);

    // Main workflow: update job -> submit EMR -> start polling
    const workflow = updateJobStarted
      .next(submitEMRJobWithCatch)
      .next(pollingLoop);

    const stateMachine = new stepfunctions.StateMachine(
      this,
      'FraudAnalysisStateMachine',
      {
        definition: workflow,
        role: sfnRole,
        stateMachineName: `fraud-analysis-pipeline-${environmentSuffix}`,
        logs: {
          destination: new logs.LogGroup(this, 'StateMachineLogGroup', {
            retention: logs.RetentionDays.ONE_WEEK,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
          }),
          level: stepfunctions.LogLevel.ALL,
          includeExecutionData: true,
        },
      }
    );

    // Update Lambda environment variable with state machine ARN
    validatorFunction.addEnvironment(
      'STATE_MACHINE_ARN',
      stateMachine.stateMachineArn
    );

    // 🔹 EventBridge Rule
    const s3EventRule = new events.Rule(this, 'S3NewFileRule', {
      eventPattern: {
        source: ['aws.s3'],
        detailType: ['Object Created'],
        detail: {
          bucket: {
            name: [rawTransactionsBucket.bucketName],
          },
        },
      },
    });

    s3EventRule.addTarget(new targets.LambdaFunction(validatorFunction));

    // Add S3 notification to trigger Lambda
    rawTransactionsBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(validatorFunction)
    );

    // 🔹 CloudWatch Dashboard
    const dashboard = new cloudwatch.Dashboard(this, 'FraudAnalysisDashboard', {
      dashboardName: `fraud-analysis-pipeline-${environmentSuffix}`,
      defaultInterval: cdk.Duration.hours(1),
    });

    dashboard.addWidgets(
      new cloudwatch.TextWidget({
        markdown:
          '# Fraud Analysis Pipeline Dashboard\n## Real-time monitoring of EMR jobs, Lambda functions, and Step Functions',
        width: 24,
        height: 2,
      })
    );

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Lambda Function Metrics',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/Lambda',
            metricName: 'Invocations',
            dimensionsMap: { FunctionName: validatorFunction.functionName },
            statistic: 'Sum',
          }),
          new cloudwatch.Metric({
            namespace: 'AWS/Lambda',
            metricName: 'Errors',
            dimensionsMap: { FunctionName: validatorFunction.functionName },
            statistic: 'Sum',
          }),
        ],
        width: 12,
      }),
      new cloudwatch.GraphWidget({
        title: 'Lambda Duration',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/Lambda',
            metricName: 'Duration',
            dimensionsMap: { FunctionName: validatorFunction.functionName },
            statistic: 'Average',
          }),
        ],
        width: 12,
      })
    );

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Step Functions Executions',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/States',
            metricName: 'ExecutionsStarted',
            dimensionsMap: { StateMachineArn: stateMachine.stateMachineArn },
            statistic: 'Sum',
          }),
          new cloudwatch.Metric({
            namespace: 'AWS/States',
            metricName: 'ExecutionsSucceeded',
            dimensionsMap: { StateMachineArn: stateMachine.stateMachineArn },
            statistic: 'Sum',
          }),
          new cloudwatch.Metric({
            namespace: 'AWS/States',
            metricName: 'ExecutionsFailed',
            dimensionsMap: { StateMachineArn: stateMachine.stateMachineArn },
            statistic: 'Sum',
          }),
        ],
        width: 24,
      })
    );

    // 🔹 Outputs
    new cdk.CfnOutput(this, 'RawTransactionsBucketName', {
      value: rawTransactionsBucket.bucketName,
      description: 'S3 bucket for raw transaction files',
    });

    new cdk.CfnOutput(this, 'ProcessedDataBucketName', {
      value: processedDataBucket.bucketName,
      description: 'S3 bucket for processed fraud analysis results',
    });

    new cdk.CfnOutput(this, 'FraudReportsBucketName', {
      value: fraudReportsBucket.bucketName,
      description: 'S3 bucket for fraud reports',
    });

    new cdk.CfnOutput(this, 'EMRApplicationId', {
      value: emrApp.attrApplicationId,
      description: 'EMR Serverless application ID',
    });

    new cdk.CfnOutput(this, 'StateMachineArn', {
      value: stateMachine.stateMachineArn,
      description: 'Step Functions state machine ARN',
    });

    new cdk.CfnOutput(this, 'JobsTableName', {
      value: jobsTable.tableName,
      description: 'DynamoDB table for job tracking',
    });

    new cdk.CfnOutput(this, 'DashboardURL', {
      value: `https://console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${dashboard.dashboardName}`,
      description: 'CloudWatch Dashboard URL',
    });
  }
}
