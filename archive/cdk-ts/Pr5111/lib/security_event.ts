import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as kinesisfirehose from 'aws-cdk-lib/aws-kinesisfirehose';
import * as opensearch from 'aws-cdk-lib/aws-opensearchservice';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as stepfunctions from 'aws-cdk-lib/aws-stepfunctions';
import * as stepfunctionsTasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as snsSubscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as athena from 'aws-cdk-lib/aws-athena';
import * as glue from 'aws-cdk-lib/aws-glue';
import * as cloudtrail from 'aws-cdk-lib/aws-cloudtrail';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import { Construct } from 'constructs';
import * as path from 'path';

interface SecurityEventStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class SecurityEventStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: SecurityEventStackProps) {
    super(scope, id, props);

    const environmentSuffix = props?.environmentSuffix || 'dev';

    // ===== 1. S3 Buckets =====

    // Main PHI data bucket
    const phiDataBucket = new s3.Bucket(this, 'PHIDataBucket', {
      bucketName: `phi-data-bucket-${this.account}-${this.region}-${environmentSuffix}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Archive bucket with Object Lock for compliance
    const archiveBucket = new s3.Bucket(this, 'ArchiveBucket', {
      bucketName: `phi-compliance-archive-${this.account}-${this.region}-${environmentSuffix}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: true,
      objectLockEnabled: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // CloudTrail logs bucket
    const cloudtrailBucket = new s3.Bucket(this, 'CloudTrailBucket', {
      bucketName: `cloudtrail-logs-${this.account}-${this.region}-${environmentSuffix}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      lifecycleRules: [
        {
          id: 'archive-old-logs',
          transitions: [
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(90),
            },
          ],
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Enable server access logging on PHI bucket
    phiDataBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        actions: ['s3:*'],
        resources: [phiDataBucket.bucketArn, `${phiDataBucket.bucketArn}/*`],
        principals: [new iam.ServicePrincipal('logging.s3.amazonaws.com')],
      })
    );

    // ===== 2. CloudTrail for Data Events =====
    // Note: S3 access logs have 15-60min delay. For real-time, we use CloudTrail data events

    const trail = new cloudtrail.Trail(this, 'PHIAccessTrail', {
      bucket: cloudtrailBucket,
      encryptionKey: undefined, // Use default S3 encryption
      isMultiRegionTrail: false,
      includeGlobalServiceEvents: false,
      enableFileValidation: true,
    });

    // Add S3 data events for PHI bucket
    trail.addS3EventSelector(
      [
        {
          bucket: phiDataBucket,
          objectPrefix: '',
        },
      ],
      {
        readWriteType: cloudtrail.ReadWriteType.ALL,
        includeManagementEvents: false,
      }
    );

    // ===== 3. DynamoDB Authorization Store =====

    const authorizationTable = new dynamodb.Table(this, 'AuthorizationStore', {
      tableName: `phi-authorization-store-${environmentSuffix}`,
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'resourcePath', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: true,
      },
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Add GSI for querying by resource
    authorizationTable.addGlobalSecondaryIndex({
      indexName: 'resource-index',
      partitionKey: {
        name: 'resourcePath',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // ===== 4. OpenSearch Domain =====

    const openSearchDomain = new opensearch.Domain(this, 'SecurityAnalytics', {
      version: opensearch.EngineVersion.OPENSEARCH_2_11,
      domainName: `phi-sec-${environmentSuffix}`,
      capacity: {
        masterNodes: 3,
        masterNodeInstanceType: 'r5.large.search',
        dataNodes: 2,
        dataNodeInstanceType: 'r5.xlarge.search',
        multiAzWithStandbyEnabled: false,
      },
      zoneAwareness: {
        enabled: true,
        availabilityZoneCount: 2,
      },
      ebs: {
        volumeSize: 100,
        volumeType: cdk.aws_ec2.EbsDeviceVolumeType.GP3,
      },
      nodeToNodeEncryption: true,
      encryptionAtRest: { enabled: true },
      enforceHttps: true,
      logging: {
        slowSearchLogEnabled: true,
        appLogEnabled: true,
        slowIndexLogEnabled: true,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // ===== 5. Lambda Functions with Dead Letter Queues =====

    // DLQ for Validator Lambda
    const validatorDLQ = new sqs.Queue(this, 'ValidatorDLQ', {
      queueName: `validator-dlq-${environmentSuffix}`,
      retentionPeriod: cdk.Duration.days(14),
      encryption: sqs.QueueEncryption.SQS_MANAGED,
    });

    // DLQ for Remediation Lambda
    const remediationDLQ = new sqs.Queue(this, 'RemediationDLQ', {
      queueName: `remediation-dlq-${environmentSuffix}`,
      retentionPeriod: cdk.Duration.days(14),
      encryption: sqs.QueueEncryption.SQS_MANAGED,
    });

    // DLQ for Report Generator Lambda
    const reportDLQ = new sqs.Queue(this, 'ReportDLQ', {
      queueName: `report-dlq-${environmentSuffix}`,
      retentionPeriod: cdk.Duration.days(14),
      encryption: sqs.QueueEncryption.SQS_MANAGED,
    });

    // Validator Lambda
    const validatorLambda = new lambda.Function(this, 'ValidatorFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'validator.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'lambda')),
      environment: {
        AUTHORIZATION_TABLE: authorizationTable.tableName,
        STEP_FUNCTION_ARN: '', // Will be set later
      },
      timeout: cdk.Duration.minutes(5),
      memorySize: 1024,
      tracing: lambda.Tracing.ACTIVE,
      insightsVersion: lambda.LambdaInsightsVersion.VERSION_1_0_229_0,
      deadLetterQueue: validatorDLQ,
      deadLetterQueueEnabled: true,
    });

    // Grant permissions to validator
    authorizationTable.grantReadData(validatorLambda);

    // Remediation Lambda
    const remediationLambda = new lambda.Function(this, 'RemediationFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'remediation.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'lambda')),
      timeout: cdk.Duration.minutes(5),
      memorySize: 512,
      tracing: lambda.Tracing.ACTIVE,
      insightsVersion: lambda.LambdaInsightsVersion.VERSION_1_0_229_0,
      deadLetterQueue: remediationDLQ,
      deadLetterQueueEnabled: true,
    });

    // Grant IAM permissions to remediation Lambda
    remediationLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          'iam:AttachUserPolicy',
          'iam:PutUserPolicy',
          'iam:ListAttachedUserPolicies',
        ],
        resources: ['arn:aws:iam::*:user/*'],
      })
    );

    // Report Generator Lambda
    const reportGeneratorLambda = new lambda.Function(
      this,
      'ReportGeneratorFunction',
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: 'report-generator.handler',
        code: lambda.Code.fromAsset(path.join(__dirname, 'lambda')),
        environment: {
          ARCHIVE_BUCKET: archiveBucket.bucketName,
        },
        timeout: cdk.Duration.minutes(5),
        memorySize: 512,
        tracing: lambda.Tracing.ACTIVE,
        insightsVersion: lambda.LambdaInsightsVersion.VERSION_1_0_229_0,
        deadLetterQueue: reportDLQ,
        deadLetterQueueEnabled: true,
      }
    );

    archiveBucket.grantWrite(reportGeneratorLambda);

    // ===== 6. Kinesis Firehose =====

    // IAM role for Firehose
    const firehoseRole = new iam.Role(this, 'FirehoseRole', {
      assumedBy: new iam.ServicePrincipal('firehose.amazonaws.com'),
    });

    // Create Firehose delivery stream
    const deliveryStream = new kinesisfirehose.CfnDeliveryStream(
      this,
      'LogDeliveryStream',
      {
        deliveryStreamName: `phi-access-logs-stream-${environmentSuffix}`,
        deliveryStreamType: 'DirectPut',
        extendedS3DestinationConfiguration: {
          bucketArn: archiveBucket.bucketArn,
          prefix:
            'access-logs/year=!{timestamp:yyyy}/month=!{timestamp:MM}/day=!{timestamp:dd}/',
          errorOutputPrefix: 'error-logs/',
          compressionFormat: 'GZIP',
          roleArn: firehoseRole.roleArn,
          processingConfiguration: {
            enabled: true,
            processors: [
              {
                type: 'Lambda',
                parameters: [
                  {
                    parameterName: 'LambdaArn',
                    parameterValue: validatorLambda.functionArn,
                  },
                ],
              },
            ],
          },
          dataFormatConversionConfiguration: {
            enabled: false,
          },
        },
      }
    );

    // Grant permissions to Firehose
    archiveBucket.grantWrite(firehoseRole);
    openSearchDomain.grantWrite(firehoseRole);
    validatorLambda.grantInvoke(firehoseRole);

    // ===== 7. SNS Topic for Alerts =====

    const securityAlertTopic = new sns.Topic(this, 'SecurityAlertTopic', {
      topicName: `phi-alerts-${environmentSuffix}`,
    });

    // Add email subscription (replace with your security team email)
    securityAlertTopic.addSubscription(
      new snsSubscriptions.EmailSubscription('security-team@company.com')
    );

    // ===== 8. Athena Setup =====

    // Create Glue database for CloudTrail logs
    const glueDatabase = new glue.CfnDatabase(this, 'CloudTrailDatabase', {
      catalogId: this.account,
      databaseInput: {
        name: `cloudtrail_audit_db_${environmentSuffix}`,
        description: 'Database for CloudTrail audit queries',
      },
    });

    // Athena workgroup
    const athenaWorkgroup = new athena.CfnWorkGroup(this, 'AuditWorkgroup', {
      name: `phi-audit-${environmentSuffix}`,
      workGroupConfiguration: {
        resultConfiguration: {
          outputLocation: `s3://${archiveBucket.bucketName}/athena-results/`,
          encryptionConfiguration: {
            encryptionOption: 'SSE_S3',
          },
        },
      },
    });

    // ===== 9. Step Functions Workflow =====

    // Task 1: Athena Query with retry policy
    const athenaQueryTask = new stepfunctionsTasks.AthenaStartQueryExecution(
      this,
      'DeepAuditQuery',
      {
        queryString: stepfunctions.JsonPath.format(
          `SELECT * FROM cloudtrail_logs
         WHERE useridentity.principalid = '{}'
         AND eventtime > date_add('day', -90, current_date)
         ORDER BY eventtime DESC`,
          stepfunctions.JsonPath.stringAt('$.userId')
        ),
        queryExecutionContext: {
          databaseName: glueDatabase.ref,
        },
        workGroup: athenaWorkgroup.name,
        resultConfiguration: {
          outputLocation: {
            bucketName: archiveBucket.bucketName,
            objectKey: 'athena-results/',
          },
        },
        integrationPattern: stepfunctions.IntegrationPattern.RUN_JOB,
      }
    ).addRetry({
      errors: ['States.TaskFailed', 'States.Timeout'],
      interval: cdk.Duration.seconds(2),
      maxAttempts: 3,
      backoffRate: 2.0,
    });

    // Task 2: Macie Classification Job with retry policy
    const macieJobTask = new stepfunctionsTasks.CallAwsService(
      this,
      'DataClassification',
      {
        service: 'macie2',
        action: 'createClassificationJob',
        parameters: {
          ClientToken: stepfunctions.JsonPath.stringAt('$$.Execution.Name'),
          Name: stepfunctions.JsonPath.format(
            'PHI-Classification-{}',
            stepfunctions.JsonPath.stringAt('$$.Execution.Name')
          ),
          JobType: 'ONE_TIME',
          S3JobDefinition: {
            BucketDefinitions: [
              {
                AccountId: this.account,
                Buckets: [phiDataBucket.bucketName],
              },
            ],
          },
        },
        iamResources: ['*'],
      }
    ).addRetry({
      errors: ['States.TaskFailed', 'Macie2.ThrottlingException'],
      interval: cdk.Duration.seconds(3),
      maxAttempts: 3,
      backoffRate: 2.5,
    });

    // Task 3: SNS Alert
    const snsAlertTask = new stepfunctionsTasks.SnsPublish(
      this,
      'AlertSecurityTeam',
      {
        topic: securityAlertTopic,
        message: stepfunctions.TaskInput.fromObject({
          default: stepfunctions.JsonPath.format(
            'CRITICAL: Unauthorized PHI access detected!\nUser: {}\nResource: {}\nTime: {}\nAction: IMMEDIATE REMEDIATION INITIATED',
            stepfunctions.JsonPath.stringAt('$.userId'),
            stepfunctions.JsonPath.stringAt('$.objectKey'),
            stepfunctions.JsonPath.stringAt('$.timestamp')
          ),
        }),
        subject: 'HIPAA Violation Alert - Immediate Action Required',
      }
    );

    // Task 4: Remediation with retry policy
    const remediationTask = new stepfunctionsTasks.LambdaInvoke(
      this,
      'RemediateAccess',
      {
        lambdaFunction: remediationLambda,
        payload: stepfunctions.TaskInput.fromJsonPathAt('$'),
        resultPath: '$.remediationResult',
      }
    ).addRetry({
      errors: [
        'States.TaskFailed',
        'Lambda.ServiceException',
        'Lambda.TooManyRequestsException',
      ],
      interval: cdk.Duration.seconds(1),
      maxAttempts: 3,
      backoffRate: 2.0,
    });

    // Task 5: Generate Report with retry policy
    const reportTask = new stepfunctionsTasks.LambdaInvoke(
      this,
      'GenerateIncidentReport',
      {
        lambdaFunction: reportGeneratorLambda,
        payload: stepfunctions.TaskInput.fromJsonPathAt('$'),
        resultPath: '$.reportResult',
      }
    ).addRetry({
      errors: ['States.TaskFailed', 'Lambda.ServiceException'],
      interval: cdk.Duration.seconds(2),
      maxAttempts: 3,
      backoffRate: 2.0,
    });

    // Build the parallel execution
    const parallelTasks = new stepfunctions.Parallel(
      this,
      'ParallelInvestigation'
    );
    parallelTasks.branch(athenaQueryTask);
    parallelTasks.branch(macieJobTask);

    // Build the workflow
    const definition = parallelTasks
      .next(snsAlertTask)
      .next(remediationTask)
      .next(reportTask);

    const stateMachine = new stepfunctions.StateMachine(
      this,
      'IncidentResponseWorkflow',
      {
        definitionBody: stepfunctions.DefinitionBody.fromChainable(definition),
        timeout: cdk.Duration.minutes(30),
        tracingEnabled: true,
        logs: {
          destination: new logs.LogGroup(this, 'StepFunctionsLogs', {
            retention: logs.RetentionDays.ONE_YEAR,
          }),
          level: stepfunctions.LogLevel.ALL,
          includeExecutionData: true,
        },
      }
    );

    // Grant Step Functions permissions
    athenaWorkgroup.node.defaultChild?.node.addDependency(stateMachine);
    archiveBucket.grantReadWrite(stateMachine);
    cloudtrailBucket.grantRead(stateMachine);

    // Update validator Lambda environment
    validatorLambda.addEnvironment(
      'STEP_FUNCTION_ARN',
      stateMachine.stateMachineArn
    );
    stateMachine.grantStartExecution(validatorLambda);

    // ===== 10. CloudWatch Dashboards and Alarms =====

    // Create comprehensive monitoring dashboard
    const dashboard = new cloudwatch.Dashboard(
      this,
      'HIPAAComplianceDashboard',
      {
        dashboardName: `hipaa-compliance-${environmentSuffix}`,
      }
    );

    // Add Step Functions metrics
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Step Functions Executions',
        left: [
          stateMachine.metricStarted({
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
          }),
          stateMachine.metricSucceeded({
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
          }),
          stateMachine.metricFailed({
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
          }),
        ],
        width: 12,
      }),
      new cloudwatch.GraphWidget({
        title: 'Step Functions Execution Duration',
        left: [
          stateMachine.metric('ExecutionTime', {
            statistic: 'Average',
            period: cdk.Duration.minutes(5),
          }),
        ],
        width: 12,
      })
    );

    // Add Lambda metrics
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Lambda Errors',
        left: [
          validatorLambda.metricErrors({
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
          }),
          remediationLambda.metricErrors({
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
          }),
          reportGeneratorLambda.metricErrors({
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
          }),
        ],
        width: 12,
      }),
      new cloudwatch.GraphWidget({
        title: 'Lambda Duration',
        left: [
          validatorLambda.metricDuration({
            statistic: 'Average',
            period: cdk.Duration.minutes(5),
          }),
          remediationLambda.metricDuration({
            statistic: 'Average',
            period: cdk.Duration.minutes(5),
          }),
          reportGeneratorLambda.metricDuration({
            statistic: 'Average',
            period: cdk.Duration.minutes(5),
          }),
        ],
        width: 12,
      })
    );

    // Add DLQ metrics
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Dead Letter Queue Messages',
        left: [
          validatorDLQ.metricApproximateNumberOfMessagesVisible(),
          remediationDLQ.metricApproximateNumberOfMessagesVisible(),
          reportDLQ.metricApproximateNumberOfMessagesVisible(),
        ],
        width: 12,
      }),
      new cloudwatch.SingleValueWidget({
        title: 'OpenSearch Cluster Health',
        metrics: [
          new cloudwatch.Metric({
            namespace: 'AWS/ES',
            metricName: 'ClusterStatus.red',
            dimensionsMap: {
              DomainName: openSearchDomain.domainName,
              ClientId: this.account,
            },
            statistic: 'Maximum',
          }),
        ],
        width: 12,
      })
    );

    // CloudWatch Alarms

    // Alarm for Step Functions failures
    const stateMachineFailureAlarm = new cloudwatch.Alarm(
      this,
      'StateMachineFailureAlarm',
      {
        metric: stateMachine.metricFailed({
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
        }),
        threshold: 1,
        evaluationPeriods: 1,
        alarmDescription: 'Alert when incident response workflow fails',
        actionsEnabled: true,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );
    stateMachineFailureAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(securityAlertTopic)
    );

    // Alarm for Lambda errors
    const validatorErrorAlarm = new cloudwatch.Alarm(
      this,
      'ValidatorLambdaErrorAlarm',
      {
        metric: validatorLambda.metricErrors({
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
        }),
        threshold: 5,
        evaluationPeriods: 2,
        alarmDescription: 'Alert when validator Lambda has high error rate',
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );
    validatorErrorAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(securityAlertTopic)
    );

    // Alarm for Firehose delivery failures
    const firehoseFailureAlarm = new cloudwatch.Alarm(
      this,
      'FirehoseDeliveryFailureAlarm',
      {
        metric: new cloudwatch.Metric({
          namespace: 'AWS/Firehose',
          metricName: 'DeliveryToS3.DataFreshness',
          dimensionsMap: {
            DeliveryStreamName: deliveryStream.ref,
          },
          statistic: 'Maximum',
          period: cdk.Duration.minutes(5),
        }),
        threshold: 900, // 15 minutes
        evaluationPeriods: 1,
        alarmDescription: 'Alert when Firehose delivery is delayed',
        treatMissingData: cloudwatch.TreatMissingData.BREACHING,
      }
    );
    firehoseFailureAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(securityAlertTopic)
    );

    // Alarm for OpenSearch cluster red status
    const openSearchRedAlarm = new cloudwatch.Alarm(
      this,
      'OpenSearchRedAlarm',
      {
        metric: new cloudwatch.Metric({
          namespace: 'AWS/ES',
          metricName: 'ClusterStatus.red',
          dimensionsMap: {
            DomainName: openSearchDomain.domainName,
            ClientId: this.account,
          },
          statistic: 'Maximum',
          period: cdk.Duration.minutes(1),
        }),
        threshold: 1,
        evaluationPeriods: 1,
        alarmDescription: 'Alert when OpenSearch cluster status is red',
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );
    openSearchRedAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(securityAlertTopic)
    );

    // Alarm for DynamoDB throttling
    const dynamoThrottleAlarm = new cloudwatch.Alarm(
      this,
      'DynamoDBThrottleAlarm',
      {
        metric: new cloudwatch.Metric({
          namespace: 'AWS/DynamoDB',
          metricName: 'UserErrors',
          dimensionsMap: {
            TableName: authorizationTable.tableName,
          },
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
        }),
        threshold: 10,
        evaluationPeriods: 2,
        alarmDescription: 'Alert when DynamoDB table is throttling requests',
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );
    dynamoThrottleAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(securityAlertTopic)
    );

    // Alarm for DLQ messages
    const dlqAlarm = new cloudwatch.Alarm(this, 'DeadLetterQueueAlarm', {
      metric: validatorDLQ.metricApproximateNumberOfMessagesVisible(),
      threshold: 1,
      evaluationPeriods: 1,
      alarmDescription: 'Alert when messages appear in Dead Letter Queue',
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    dlqAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(securityAlertTopic)
    );

    // ===== Output Important Values =====

    new cdk.CfnOutput(this, 'PHIBucketName', {
      value: phiDataBucket.bucketName,
      description: 'Name of the PHI data bucket',
    });

    new cdk.CfnOutput(this, 'FirehoseStreamName', {
      value: deliveryStream.ref,
      description: 'Name of the Kinesis Firehose delivery stream',
    });

    new cdk.CfnOutput(this, 'OpenSearchDomainEndpoint', {
      value: openSearchDomain.domainEndpoint,
      description: 'OpenSearch domain endpoint for security dashboards',
    });

    new cdk.CfnOutput(this, 'StateMachineArn', {
      value: stateMachine.stateMachineArn,
      description: 'ARN of the incident response workflow',
    });

    new cdk.CfnOutput(this, 'ArchiveBucketName', {
      value: archiveBucket.bucketName,
      description: 'Name of the compliance archive bucket',
    });

    new cdk.CfnOutput(this, 'CloudTrailBucketName', {
      value: cloudtrailBucket.bucketName,
      description: 'Name of the CloudTrail logs bucket',
    });

    new cdk.CfnOutput(this, 'DynamoDBTableName', {
      value: authorizationTable.tableName,
      description: 'Name of the authorization store DynamoDB table',
    });

    new cdk.CfnOutput(this, 'ValidatorLambdaArn', {
      value: validatorLambda.functionArn,
      description: 'ARN of the validator Lambda function',
    });

    new cdk.CfnOutput(this, 'RemediationLambdaArn', {
      value: remediationLambda.functionArn,
      description: 'ARN of the remediation Lambda function',
    });

    new cdk.CfnOutput(this, 'ReportGeneratorLambdaArn', {
      value: reportGeneratorLambda.functionArn,
      description: 'ARN of the report generator Lambda function',
    });

    new cdk.CfnOutput(this, 'SNSTopicArn', {
      value: securityAlertTopic.topicArn,
      description: 'ARN of the security alert SNS topic',
    });

    new cdk.CfnOutput(this, 'CloudTrailArn', {
      value: trail.trailArn,
      description: 'ARN of the CloudTrail trail',
    });

    new cdk.CfnOutput(this, 'AthenaWorkgroupName', {
      value: athenaWorkgroup.name!,
      description: 'Name of the Athena workgroup for audit queries',
    });

    new cdk.CfnOutput(this, 'GlueDatabaseName', {
      value: glueDatabase.ref,
      description: 'Name of the Glue database for CloudTrail logs',
    });

    new cdk.CfnOutput(this, 'OpenSearchDomainName', {
      value: openSearchDomain.domainName,
      description: 'Name of the OpenSearch domain',
    });

    new cdk.CfnOutput(this, 'OpenSearchDomainArn', {
      value: openSearchDomain.domainArn,
      description: 'ARN of the OpenSearch domain',
    });

    new cdk.CfnOutput(this, 'PHIBucketArn', {
      value: phiDataBucket.bucketArn,
      description: 'ARN of the PHI data bucket',
    });

    new cdk.CfnOutput(this, 'RegionDeployed', {
      value: this.region,
      description: 'AWS region where resources are deployed',
    });

    new cdk.CfnOutput(this, 'EnvironmentSuffix', {
      value: environmentSuffix,
      description: 'Environment suffix for this deployment',
    });

    new cdk.CfnOutput(this, 'ValidatorDLQUrl', {
      value: validatorDLQ.queueUrl,
      description: 'URL of the validator Lambda dead letter queue',
    });

    new cdk.CfnOutput(this, 'RemediationDLQUrl', {
      value: remediationDLQ.queueUrl,
      description: 'URL of the remediation Lambda dead letter queue',
    });

    new cdk.CfnOutput(this, 'ReportDLQUrl', {
      value: reportDLQ.queueUrl,
      description: 'URL of the report generator Lambda dead letter queue',
    });

    new cdk.CfnOutput(this, 'CloudWatchDashboardName', {
      value: dashboard.dashboardName,
      description: 'Name of the CloudWatch monitoring dashboard',
    });

    new cdk.CfnOutput(this, 'CloudWatchDashboardURL', {
      value: `https://console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${dashboard.dashboardName}`,
      description: 'URL to access the CloudWatch monitoring dashboard',
    });
  }
}
