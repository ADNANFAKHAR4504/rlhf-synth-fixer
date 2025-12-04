/**
 * BigDataPipeline Stack (tap-stack.ts)
 * AWS CDK v2 TypeScript implementation of a financial transaction data pipeline
 *
 * This stack deploys a complete big data processing pipeline with:
 * - S3 buckets for raw/processed/failed data
 * - AWS Glue ETL jobs and crawlers
 * - Athena for ad-hoc queries
 * - CloudWatch monitoring and SNS alerting
 * - EventBridge triggers and DLQ handling
 */

import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as glue from 'aws-cdk-lib/aws-glue';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as athena from 'aws-cdk-lib/aws-athena';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import { Duration, RemovalPolicy } from 'aws-cdk-lib';

// Configuration block - modify these values as needed for different environments
export const config = {
  region: 'us-east-1',
  glueJobSettings: {
    workerType: 'G.1X',
    numberOfWorkers: 2,
    timeout: 120, // minutes
    maxRetries: 1,
    pythonVersion: '3',
    glueVersion: '4.0',
  },
  crawlerSchedule: 'cron(0 2 * * ? *)', // 2 AM UTC daily (within 2-5 AM window)
  athenaScanLimitBytes: 5368709120, // 5 GB in bytes
  lifecycleDays: {
    intelligentTiering: 30,
    glacier: 90,
  },
  slaThresholdHours: 2,
};

export interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  // Public properties for outputs
  public readonly rawDataBucket: s3.Bucket;
  public readonly processedDataBucket: s3.Bucket;
  public readonly failedRecordsBucket: s3.Bucket;
  public readonly glueScriptsBucket: s3.Bucket;
  public readonly athenaResultsBucket: s3.Bucket;
  public readonly glueDatabase: glue.CfnDatabase;
  public readonly glueTable: glue.CfnTable;
  public readonly glueEtlJob: glue.CfnJob;
  public readonly glueCrawler: glue.CfnCrawler;
  public readonly athenaWorkgroup: athena.CfnWorkGroup;
  public readonly alertTopic: sns.Topic;
  public readonly dlqQueue: sqs.Queue;
  public readonly s3TriggerRule: events.Rule;
  public readonly dashboard: cloudwatch.Dashboard;
  public readonly vpc: ec2.Vpc;
  public readonly dataEncryptionKey: kms.Key;

  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const nameSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // KMS key for encryption at rest
    this.dataEncryptionKey = new kms.Key(this, 'DataEncryptionKey', {
      alias: `fin-kms-data-${nameSuffix}`,
      description: 'KMS key for big data pipeline encryption',
      enableKeyRotation: true,
      removalPolicy: RemovalPolicy.DESTROY,
      pendingWindow: Duration.days(7),
    });

    // VPC for Glue jobs with private subnets
    this.vpc = new ec2.Vpc(this, 'PipelineVPC', {
      vpcName: `fin-vpc-pipeline-${nameSuffix}`,
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'private-glue',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 24,
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
      ],
    });

    // VPC endpoints for S3 and Glue (traffic stays on AWS backbone)
    new ec2.GatewayVpcEndpoint(this, 'S3Endpoint', {
      vpc: this.vpc,
      service: ec2.GatewayVpcEndpointAwsService.S3,
    });

    new ec2.InterfaceVpcEndpoint(this, 'GlueEndpoint', {
      vpc: this.vpc,
      service: ec2.InterfaceVpcEndpointAwsService.GLUE,
      subnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
    });

    // Security group for Glue jobs (restricted)
    const glueSecurityGroup = new ec2.SecurityGroup(this, 'GlueSecurityGroup', {
      vpc: this.vpc,
      securityGroupName: `fin-sg-glue-${nameSuffix}`,
      description: 'Security group for Glue ETL jobs',
      allowAllOutbound: false,
    });

    // Allow HTTPS traffic for AWS services
    glueSecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS for AWS services'
    );

    // Allow internal communication for Glue
    glueSecurityGroup.addIngressRule(
      glueSecurityGroup,
      ec2.Port.allTraffic(),
      'Allow internal Glue communication'
    );

    // S3 Bucket 1: Raw Data Ingestion
    this.rawDataBucket = new s3.Bucket(this, 'RawDataBucket', {
      bucketName: `fin-s3-raw-${nameSuffix}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: this.dataEncryptionKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      enforceSSL: true,
      eventBridgeEnabled: true, // Enable EventBridge notifications
      lifecycleRules: [
        {
          id: 'intelligent-tiering',
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.INTELLIGENT_TIERING,
              transitionAfter: Duration.days(
                config.lifecycleDays.intelligentTiering
              ),
            },
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: Duration.days(config.lifecycleDays.glacier),
            },
          ],
        },
      ],
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // S3 Bucket 2: Processed Data
    this.processedDataBucket = new s3.Bucket(this, 'ProcessedDataBucket', {
      bucketName: `fin-s3-processed-${nameSuffix}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: this.dataEncryptionKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      enforceSSL: true,
      lifecycleRules: [
        {
          id: 'intelligent-tiering',
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.INTELLIGENT_TIERING,
              transitionAfter: Duration.days(
                config.lifecycleDays.intelligentTiering
              ),
            },
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: Duration.days(config.lifecycleDays.glacier),
            },
          ],
        },
      ],
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // S3 Bucket 3: Failed Records
    this.failedRecordsBucket = new s3.Bucket(this, 'FailedRecordsBucket', {
      bucketName: `fin-s3-failed-${nameSuffix}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: this.dataEncryptionKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      enforceSSL: true,
      lifecycleRules: [
        {
          id: 'delete-old-failures',
          enabled: true,
          expiration: Duration.days(365),
        },
      ],
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // S3 bucket for Glue job scripts
    this.glueScriptsBucket = new s3.Bucket(this, 'GlueScriptsBucket', {
      bucketName: `fin-s3-glue-scripts-${nameSuffix}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: this.dataEncryptionKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // S3 bucket for Athena query results
    this.athenaResultsBucket = new s3.Bucket(this, 'AthenaResultsBucket', {
      bucketName: `fin-s3-athena-results-${nameSuffix}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: this.dataEncryptionKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      lifecycleRules: [
        {
          id: 'delete-old-results',
          enabled: true,
          expiration: Duration.days(7),
        },
      ],
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Dead Letter Queue for failed records
    this.dlqQueue = new sqs.Queue(this, 'DLQueue', {
      queueName: `fin-sqs-dlq-${nameSuffix}`,
      encryption: sqs.QueueEncryption.KMS_MANAGED,
      retentionPeriod: Duration.days(14),
      visibilityTimeout: Duration.minutes(15),
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // SNS Topic for alerts
    this.alertTopic = new sns.Topic(this, 'AlertTopic', {
      topicName: `fin-sns-alerts-${nameSuffix}`,
      masterKey: this.dataEncryptionKey,
    });

    // IAM Role for Glue ETL Jobs (least privilege)
    const glueEtlRole = new iam.Role(this, 'GlueETLRole', {
      roleName: `fin-iam-glue-etl-${nameSuffix}`,
      assumedBy: new iam.ServicePrincipal('glue.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSGlueServiceRole'
        ),
      ],
    });

    // IAM Role for Glue Crawlers (separate role for least privilege)
    const glueCrawlerRole = new iam.Role(this, 'GlueCrawlerRole', {
      roleName: `fin-iam-glue-crawler-${nameSuffix}`,
      assumedBy: new iam.ServicePrincipal('glue.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSGlueServiceRole'
        ),
      ],
    });

    // IAM Role for Athena Queries (separate role for least privilege)
    const athenaQueryRole = new iam.Role(this, 'AthenaQueryRole', {
      roleName: `fin-iam-athena-query-${nameSuffix}`,
      assumedBy: new iam.ServicePrincipal('athena.amazonaws.com'),
    });

    // Grant permissions to roles
    this.rawDataBucket.grantRead(glueEtlRole);
    this.rawDataBucket.grantRead(glueCrawlerRole);
    this.processedDataBucket.grantReadWrite(glueEtlRole);
    this.processedDataBucket.grantRead(glueCrawlerRole);
    this.processedDataBucket.grantRead(athenaQueryRole);
    this.failedRecordsBucket.grantReadWrite(glueEtlRole);
    this.glueScriptsBucket.grantRead(glueEtlRole);
    this.athenaResultsBucket.grantReadWrite(athenaQueryRole);
    this.dlqQueue.grantSendMessages(glueEtlRole);
    this.dataEncryptionKey.grantEncryptDecrypt(glueEtlRole);
    this.dataEncryptionKey.grantEncryptDecrypt(glueCrawlerRole);
    this.dataEncryptionKey.grantEncryptDecrypt(athenaQueryRole);

    // Glue Database
    this.glueDatabase = new glue.CfnDatabase(this, 'GlueDatabase', {
      catalogId: this.account,
      databaseInput: {
        name: `fin_glue_db_${nameSuffix}`,
        description: 'Financial transaction data lake database',
      },
    });

    // Glue Table Schema for transaction data
    this.glueTable = new glue.CfnTable(this, 'TransactionTable', {
      catalogId: this.account,
      databaseName: this.glueDatabase.ref,
      tableInput: {
        name: `fin_glue_transactions_${nameSuffix}`,
        description: 'Financial transactions table',
        storageDescriptor: {
          location: `s3://${this.processedDataBucket.bucketName}/transactions/`,
          inputFormat:
            'org.apache.hadoop.hive.ql.io.parquet.MapredParquetInputFormat',
          outputFormat:
            'org.apache.hadoop.hive.ql.io.parquet.MapredParquetOutputFormat',
          serdeInfo: {
            serializationLibrary:
              'org.apache.hadoop.hive.ql.io.parquet.serde.ParquetHiveSerDe',
          },
          columns: [
            { name: 'transaction_id', type: 'string' },
            { name: 'customer_id', type: 'string' },
            { name: 'amount', type: 'decimal(10,2)' },
            { name: 'timestamp', type: 'timestamp' },
            { name: 'merchant_id', type: 'string' },
            { name: 'transaction_type', type: 'string' },
            { name: 'status', type: 'string' },
          ],
          compressed: true,
          storedAsSubDirectories: false,
        },
        partitionKeys: [
          { name: 'date', type: 'string' },
          { name: 'transaction_type_partition', type: 'string' },
        ],
        tableType: 'EXTERNAL_TABLE',
      },
    });

    // PySpark ETL Script content
    const etlScriptContent = `
import sys
from awsglue.transforms import *
from awsglue.utils import getResolvedOptions
from pyspark.context import SparkContext
from awsglue.context import GlueContext
from awsglue.job import Job
from pyspark.sql.functions import col, to_timestamp, date_format
from pyspark.sql.types import DecimalType
import boto3
from datetime import datetime

# Initialize Glue context
args = getResolvedOptions(sys.argv, ['JOB_NAME', 'raw_bucket', 'processed_bucket', 
                                      'failed_bucket', 'dlq_url'])
sc = SparkContext()
glueContext = GlueContext(sc)
spark = glueContext.spark_session
job = Job(glueContext)
job.init(args['JOB_NAME'], args)

# Configure Spark for Parquet with Snappy compression
spark.conf.set("spark.sql.parquet.compression.codec", "snappy")

try:
    # Read CSV data from raw bucket
    raw_path = f"s3://{args['raw_bucket']}/"
    df = spark.read.option("header", "true").csv(raw_path)
    
    # Data validation: amount > 0 and valid timestamp
    df_valid = df.filter(col("amount").cast(DecimalType(10, 2)) > 0)
    df_valid = df_valid.withColumn("timestamp", 
                                   to_timestamp(col("timestamp"), "yyyy-MM-dd HH:mm:ss"))
    df_valid = df_valid.filter(col("timestamp").isNotNull())
    
    # Add partitioning columns (by date and transaction_type)
    df_valid = df_valid.withColumn("date", date_format(col("timestamp"), "yyyy-MM-dd"))
    df_valid = df_valid.withColumn("transaction_type_partition", col("transaction_type"))
    
    # Identify failed records (validation failures)
    df_failed = df.filter(
        (col("amount").cast(DecimalType(10, 2)) <= 0) | 
        col("amount").isNull() | 
        col("timestamp").isNull()
    )
    
    # Write valid records to processed bucket in Parquet format with Snappy compression
    processed_path = f"s3://{args['processed_bucket']}/transactions/"
    df_valid.write.mode("append") \\
           .partitionBy("date", "transaction_type_partition") \\
           .parquet(processed_path)
    
    # Write failed records to failed bucket
    if df_failed.count() > 0:
        failed_path = f"s3://{args['failed_bucket']}/failed_{datetime.now().strftime('%Y%m%d%H%M%S')}/"
        df_failed.write.mode("overwrite").csv(failed_path, header=True)
        
        # Send failed record count to DLQ
        sqs = boto3.client('sqs')
        message = f"Failed records: {df_failed.count()} at {datetime.now()}"
        sqs.send_message(QueueUrl=args['dlq_url'], MessageBody=message)
    
    print(f"Processed records: {df_valid.count()}")
    print(f"Failed records: {df_failed.count()}")
    
except Exception as e:
    print(f"Error in ETL job: {str(e)}")
    raise e
finally:
    job.commit()
`;

    // Upload ETL script to S3
    const etlScriptUpload = new s3deploy.BucketDeployment(
      this,
      'ETLScriptUpload',
      {
        sources: [s3deploy.Source.data('etl_script.py', etlScriptContent)],
        destinationBucket: this.glueScriptsBucket,
        destinationKeyPrefix: 'scripts/',
      }
    );

    // Glue ETL Job (PySpark-based)
    this.glueEtlJob = new glue.CfnJob(this, 'GlueETLJob', {
      name: `fin-glue-etl-job-${nameSuffix}`,
      role: glueEtlRole.roleArn,
      command: {
        name: 'glueetl',
        scriptLocation: `s3://${this.glueScriptsBucket.bucketName}/scripts/etl_script.py`,
        pythonVersion: config.glueJobSettings.pythonVersion,
      },
      defaultArguments: {
        '--enable-metrics': 'true',
        '--enable-continuous-cloudwatch-log': 'true',
        '--enable-spark-ui': 'true',
        '--spark-event-logs-path': `s3://${this.glueScriptsBucket.bucketName}/spark-logs/`,
        '--raw_bucket': this.rawDataBucket.bucketName,
        '--processed_bucket': this.processedDataBucket.bucketName,
        '--failed_bucket': this.failedRecordsBucket.bucketName,
        '--dlq_url': this.dlqQueue.queueUrl,
        '--TempDir': `s3://${this.glueScriptsBucket.bucketName}/temp/`,
      },
      executionProperty: {
        maxConcurrentRuns: 2,
      },
      glueVersion: config.glueJobSettings.glueVersion,
      maxRetries: config.glueJobSettings.maxRetries,
      timeout: config.glueJobSettings.timeout,
      numberOfWorkers: config.glueJobSettings.numberOfWorkers,
      workerType: config.glueJobSettings.workerType,
    });

    this.glueEtlJob.node.addDependency(etlScriptUpload);

    // Glue Crawler (runs during off-peak hours 2-5 AM UTC)
    this.glueCrawler = new glue.CfnCrawler(this, 'GlueCrawler', {
      name: `fin-glue-crawler-${nameSuffix}`,
      role: glueCrawlerRole.roleArn,
      databaseName: this.glueDatabase.ref,
      targets: {
        s3Targets: [
          {
            path: `s3://${this.processedDataBucket.bucketName}/transactions/`,
          },
        ],
      },
      schedule: {
        scheduleExpression: config.crawlerSchedule,
      },
      schemaChangePolicy: {
        updateBehavior: 'UPDATE_IN_DATABASE',
        deleteBehavior: 'LOG',
      },
      configuration: JSON.stringify({
        Version: 1.0,
        CrawlerOutput: {
          Partitions: { AddOrUpdateBehavior: 'InheritFromTable' },
        },
      }),
    });

    // Athena Workgroup with 5GB scan limit
    this.athenaWorkgroup = new athena.CfnWorkGroup(this, 'AthenaWorkgroup', {
      name: `fin-athena-workgroup-${nameSuffix}`,
      description:
        'Athena workgroup for financial data queries with cost limits',
      workGroupConfiguration: {
        resultConfiguration: {
          outputLocation: `s3://${this.athenaResultsBucket.bucketName}/results/`,
          encryptionConfiguration: {
            encryptionOption: 'SSE_KMS',
            kmsKey: this.dataEncryptionKey.keyArn,
          },
        },
        bytesScannedCutoffPerQuery: config.athenaScanLimitBytes, // 5GB limit
        enforceWorkGroupConfiguration: true,
        publishCloudWatchMetricsEnabled: true,
      },
    });

    // Lambda function to trigger Glue job from EventBridge
    const glueJobTriggerFunction = new lambda.Function(
      this,
      'GlueJobTriggerFunction',
      {
        functionName: `fin-lambda-glue-trigger-${nameSuffix}`,
        runtime: lambda.Runtime.PYTHON_3_12,
        handler: 'index.handler',
        code: lambda.Code.fromInline(`
import boto3
import json
import os

def handler(event, context):
    glue = boto3.client('glue')
    job_name = os.environ['GLUE_JOB_NAME']
    
    try:
        response = glue.start_job_run(JobName=job_name)
        return {
            'statusCode': 200,
            'body': json.dumps(f"Started Glue job run: {response['JobRunId']}")
        }
    except Exception as e:
        print(f"Error starting Glue job: {str(e)}")
        raise e
`),
        environment: {
          GLUE_JOB_NAME: this.glueEtlJob.name!,
        },
        timeout: Duration.minutes(1),
      }
    );

    glueJobTriggerFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['glue:StartJobRun'],
        resources: [
          `arn:aws:glue:${this.region}:${this.account}:job/${this.glueEtlJob.name}`,
        ],
      })
    );

    // EventBridge Rule to trigger Glue ETL job when new files arrive in raw S3 bucket
    this.s3TriggerRule = new events.Rule(this, 'S3TriggerRule', {
      ruleName: `fin-eventbridge-s3-trigger-${nameSuffix}`,
      description:
        'Trigger Glue ETL job when new files arrive in raw S3 bucket',
      eventPattern: {
        source: ['aws.s3'],
        detailType: ['Object Created'],
        detail: {
          bucket: {
            name: [this.rawDataBucket.bucketName],
          },
        },
      },
    });

    this.s3TriggerRule.addTarget(
      new targets.LambdaFunction(glueJobTriggerFunction)
    );

    // CloudWatch Dashboard
    this.dashboard = new cloudwatch.Dashboard(this, 'PipelineDashboard', {
      dashboardName: `fin-cw-dashboard-${nameSuffix}`,
      defaultInterval: Duration.hours(12),
    });

    // Glue job metrics
    const glueJobSuccessMetric = new cloudwatch.Metric({
      namespace: 'AWS/Glue',
      metricName: 'glue.driver.aggregate.numCompletedStages',
      dimensionsMap: {
        JobName: this.glueEtlJob.name!,
        Type: 'count',
      },
      statistic: 'Sum',
      period: Duration.hours(1),
    });

    const glueJobDurationMetric = new cloudwatch.Metric({
      namespace: 'AWS/Glue',
      metricName: 'glue.driver.aggregate.elapsedTime',
      dimensionsMap: {
        JobName: this.glueEtlJob.name!,
        Type: 'gauge',
      },
      statistic: 'Average',
      period: Duration.hours(1),
    });

    const dataVolumeMetric = new cloudwatch.Metric({
      namespace: 'AWS/S3',
      metricName: 'BucketSizeBytes',
      dimensionsMap: {
        BucketName: this.processedDataBucket.bucketName,
        StorageType: 'StandardStorage',
      },
      statistic: 'Average',
      period: Duration.days(1),
    });

    // Add widgets to dashboard
    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Glue Job Success Rate',
        left: [glueJobSuccessMetric],
        width: 8,
        height: 6,
      }),
      new cloudwatch.GraphWidget({
        title: 'Glue Job Duration',
        left: [glueJobDurationMetric],
        width: 8,
        height: 6,
      }),
      new cloudwatch.GraphWidget({
        title: 'Processed Data Volume',
        left: [dataVolumeMetric],
        width: 8,
        height: 6,
      })
    );

    // CloudWatch Alarm for SLA breach (job > 2 hours)
    const slaBreachAlarm = new cloudwatch.Alarm(this, 'SLABreachAlarm', {
      alarmName: `fin-cw-alarm-sla-breach-${nameSuffix}`,
      metric: glueJobDurationMetric,
      threshold: config.slaThresholdHours * 60 * 60 * 1000, // Convert hours to milliseconds
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    slaBreachAlarm.addAlarmAction({
      bind: () => ({
        alarmActionArn: this.alertTopic.topicArn,
      }),
    });

    // CloudWatch Alarm for job failures
    const jobFailureAlarm = new cloudwatch.Alarm(this, 'JobFailureAlarm', {
      alarmName: `fin-cw-alarm-job-failure-${nameSuffix}`,
      metric: new cloudwatch.Metric({
        namespace: 'AWS/Glue',
        metricName: 'glue.driver.aggregate.numFailedTasks',
        dimensionsMap: {
          JobName: this.glueEtlJob.name!,
          Type: 'count',
        },
        statistic: 'Sum',
        period: Duration.hours(1),
      }),
      threshold: 1,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    jobFailureAlarm.addAlarmAction({
      bind: () => ({
        alarmActionArn: this.alertTopic.topicArn,
      }),
    });

    // Stack Outputs
    new cdk.CfnOutput(this, 'RawDataBucketName', {
      value: this.rawDataBucket.bucketName,
      description: 'S3 bucket for raw data ingestion',
      exportName: `RawDataBucketName-${nameSuffix}`,
    });

    new cdk.CfnOutput(this, 'ProcessedDataBucketName', {
      value: this.processedDataBucket.bucketName,
      description: 'S3 bucket for processed data',
      exportName: `ProcessedDataBucketName-${nameSuffix}`,
    });

    new cdk.CfnOutput(this, 'FailedRecordsBucketName', {
      value: this.failedRecordsBucket.bucketName,
      description: 'S3 bucket for failed records',
      exportName: `FailedRecordsBucketName-${nameSuffix}`,
    });

    new cdk.CfnOutput(this, 'GlueDatabaseName', {
      value: this.glueDatabase.ref,
      description: 'Glue database name',
      exportName: `GlueDatabaseName-${nameSuffix}`,
    });

    new cdk.CfnOutput(this, 'GlueTableName', {
      value: this.glueTable.ref,
      description: 'Glue table name',
      exportName: `GlueTableName-${nameSuffix}`,
    });

    new cdk.CfnOutput(this, 'GlueJobName', {
      value: this.glueEtlJob.name!,
      description: 'Glue ETL job name',
      exportName: `GlueJobName-${nameSuffix}`,
    });

    new cdk.CfnOutput(this, 'GlueCrawlerName', {
      value: this.glueCrawler.name!,
      description: 'Glue crawler name',
      exportName: `GlueCrawlerName-${nameSuffix}`,
    });

    new cdk.CfnOutput(this, 'AthenaWorkgroupName', {
      value: this.athenaWorkgroup.name,
      description: 'Athena workgroup name',
      exportName: `AthenaWorkgroupName-${nameSuffix}`,
    });

    new cdk.CfnOutput(this, 'CloudWatchDashboardURL', {
      value: `https://console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${this.dashboard.dashboardName}`,
      description: 'CloudWatch dashboard URL',
      exportName: `CloudWatchDashboardURL-${nameSuffix}`,
    });

    new cdk.CfnOutput(this, 'DLQueueURL', {
      value: this.dlqQueue.queueUrl,
      description: 'Dead letter queue URL',
      exportName: `DLQueueURL-${nameSuffix}`,
    });

    new cdk.CfnOutput(this, 'SNSTopicARN', {
      value: this.alertTopic.topicArn,
      description: 'SNS alert topic ARN',
      exportName: `SNSTopicARN-${nameSuffix}`,
    });

    new cdk.CfnOutput(this, 'EventBridgeRuleARN', {
      value: this.s3TriggerRule.ruleArn,
      description: 'EventBridge rule ARN for S3 triggers',
      exportName: `EventBridgeRuleARN-${nameSuffix}`,
    });

    new cdk.CfnOutput(this, 'GlueScriptsBucketName', {
      value: this.glueScriptsBucket.bucketName,
      description: 'S3 bucket for Glue scripts',
      exportName: `GlueScriptsBucketName-${nameSuffix}`,
    });

    new cdk.CfnOutput(this, 'AthenaResultsBucketName', {
      value: this.athenaResultsBucket.bucketName,
      description: 'S3 bucket for Athena query results',
      exportName: `AthenaResultsBucketName-${nameSuffix}`,
    });
  }
}
