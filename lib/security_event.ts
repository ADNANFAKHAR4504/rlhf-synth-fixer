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
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as athena from 'aws-cdk-lib/aws-athena';
import * as glue from 'aws-cdk-lib/aws-glue';
import * as cloudtrail from 'aws-cdk-lib/aws-cloudtrail';
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
      domainName: `phi-security-analytics-${environmentSuffix}`,
      capacity: {
        masterNodes: 3,
        masterNodeInstanceType: 'r5.large.search',
        dataNodes: 2,
        dataNodeInstanceType: 'r5.xlarge.search',
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

    // ===== 5. Lambda Functions =====

    // Validator Lambda
    const validatorLambda = new lambda.Function(this, 'ValidatorFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'validator.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'lambda')),
      environment: {
        AUTHORIZATION_TABLE: authorizationTable.tableName,
        STEP_FUNCTION_ARN: '', // Will be set later
      },
      timeout: cdk.Duration.minutes(5),
      memorySize: 1024,
      tracing: lambda.Tracing.ACTIVE,
    });

    // Grant permissions to validator
    authorizationTable.grantReadData(validatorLambda);

    // Remediation Lambda
    const remediationLambda = new lambda.Function(this, 'RemediationFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'remediation.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'lambda')),
      timeout: cdk.Duration.minutes(5),
      memorySize: 512,
      tracing: lambda.Tracing.ACTIVE,
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
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'report-generator.handler',
        code: lambda.Code.fromAsset(path.join(__dirname, 'lambda')),
        environment: {
          ARCHIVE_BUCKET: archiveBucket.bucketName,
        },
        timeout: cdk.Duration.minutes(5),
        memorySize: 512,
        tracing: lambda.Tracing.ACTIVE,
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
      topicName: `phi-security-alerts-${environmentSuffix}`,
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
      name: `phi-audit-workgroup-${environmentSuffix}`,
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

    // Task 1: Athena Query
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
    );

    // Task 2: Macie Classification Job
    const macieJobTask = new stepfunctionsTasks.CallAwsService(
      this,
      'DataClassification',
      {
        service: 'macie2',
        action: 'createClassificationJob',
        parameters: {
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
    );

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

    // Task 4: Remediation
    const remediationTask = new stepfunctionsTasks.LambdaInvoke(
      this,
      'RemediateAccess',
      {
        lambdaFunction: remediationLambda,
        payload: stepfunctions.TaskInput.fromJsonPathAt('$'),
        resultPath: '$.remediationResult',
      }
    );

    // Task 5: Generate Report
    const reportTask = new stepfunctionsTasks.LambdaInvoke(
      this,
      'GenerateIncidentReport',
      {
        lambdaFunction: reportGeneratorLambda,
        payload: stepfunctions.TaskInput.fromJsonPathAt('$'),
        resultPath: '$.reportResult',
      }
    );

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

    // ===== 10. CloudWatch Alarms and Monitoring =====

    new cdk.aws_cloudwatch.Alarm(this, 'UnauthorizedAccessAlarm', {
      metric: stateMachine.metric('ExecutionsFailed'),
      threshold: 1,
      evaluationPeriods: 1,
      treatMissingData: cdk.aws_cloudwatch.TreatMissingData.NOT_BREACHING,
    });

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
  }
}
