import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
// import * as logs from 'aws-cdk-lib/aws-logs';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

export class LogRetentionConstruct extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // S3 bucket for log archives - use unique name with tapstack-envsuffix format
    const stack = cdk.Stack.of(this);
    // Get environment suffix from CDK context, similar to tap-stack.ts logic
    let envSuffix =
      stack.node.tryGetContext('environmentSuffix') ||
      process.env.ENVIRONMENT_SUFFIX ||
      'dev';

    // Sanitize envSuffix to handle bash syntax and invalid characters, then convert to lowercase
    // Handle bash variable syntax ${VAR:-default} by extracting the default value
    envSuffix = envSuffix
      .replace(/\$\{[^:]+:-(.+?)\}/g, '$1') // Extract default value from ${VAR:-default}
      .replace(/\$\{[^}]+\}/g, '') // Remove any remaining ${VAR} patterns without defaults
      .replace(/:/g, '') // Remove colons
      .replace(/[^a-zA-Z0-9-]/g, '') // Remove other invalid chars, keep hyphens
      .toLowerCase();

    // Ensure we have a valid suffix
    if (!envSuffix || envSuffix.trim() === '') {
      envSuffix = 'dev';
    }

    // Get unique resource suffix to prevent conflicts
    const uniqueResourceSuffix =
      stack.node.tryGetContext('uniqueResourceSuffix') || 'default';

    const stackName = `tapstack-${envSuffix}-${uniqueResourceSuffix}`;
    const bucketName = `logs-${stackName}`;

    const logArchiveBucket = new s3.Bucket(this, 'LogArchiveBucket', {
      bucketName,
      lifecycleRules: [
        {
          id: 'ArchiveOldLogs',
          transitions: [
            {
              transitionAfter: cdk.Duration.days(90),
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
            },
            {
              transitionAfter: cdk.Duration.days(365),
              storageClass: s3.StorageClass.GLACIER,
            },
          ],
          expiration: cdk.Duration.days(2555), // 7 years for compliance
        },
      ],
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      // autoDeleteObjects disabled for LocalStack compatibility
      // autoDeleteObjects: true,
    });

    // Create IAM role for CloudWatch Logs to export to S3
    const exportRole = new iam.Role(this, 'LogExportRole', {
      assumedBy: new iam.ServicePrincipal('logs.amazonaws.com'),
      inlinePolicies: {
        ExportPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions: ['s3:PutObject', 's3:GetObject', 's3:ListBucket'],
              resources: [
                logArchiveBucket.bucketArn,
                `${logArchiveBucket.bucketArn}/*`,
              ],
            }),
          ],
        }),
      },
    });
    // Mark as intentionally used for ESLint
    void exportRole;

    // Lambda function for automated log export (simplified for example)
    const exportFunction = new lambda.Function(this, 'LogExporter', {
      functionName: `log-exporter-${uniqueResourceSuffix}`,
      runtime: lambda.Runtime.PYTHON_3_11,
      architecture: lambda.Architecture.ARM_64,
      handler: 'index.handler',
      timeout: cdk.Duration.minutes(5),
      code: lambda.Code.fromInline(`
import boto3
import json
from datetime import datetime, timedelta

logs_client = boto3.client('logs')

def handler(event, context):
    # Export logs from yesterday
    yesterday = datetime.now() - timedelta(days=1)
    start_time = int(yesterday.replace(hour=0, minute=0, second=0).timestamp() * 1000)
    end_time = int(yesterday.replace(hour=23, minute=59, second=59).timestamp() * 1000)

    log_groups = [
        '/aws/application/payment-platform',
        '/aws/apigateway/payment-api'
    ]

    for log_group in log_groups:
        try:
            response = logs_client.create_export_task(
                logGroupName=log_group,
                fromTime=start_time,
                to=end_time,
                destination='${logArchiveBucket.bucketName}',
                destinationPrefix=f'logs/{log_group.strip("/")}/{yesterday.strftime("%Y/%m/%d")}'
            )
            print(f'Started export task {response["taskId"]} for {log_group}')
        except Exception as e:
            print(f'Error exporting {log_group}: {str(e)}')

    return {
        'statusCode': 200,
        'body': json.dumps('Log export initiated')
    }
      `),
      environment: {
        BUCKET_NAME: logArchiveBucket.bucketName,
      },
    });

    // Grant permissions to export logs
    exportFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['logs:CreateExportTask', 'logs:DescribeLogGroups'],
        resources: ['*'],
      })
    );

    // Schedule daily log exports at 1 AM UTC
    const exportRule = new events.Rule(this, 'DailyExportRule', {
      schedule: events.Schedule.cron({
        minute: '0',
        hour: '1',
      }),
    });
    exportRule.addTarget(new targets.LambdaFunction(exportFunction));
  }
}
