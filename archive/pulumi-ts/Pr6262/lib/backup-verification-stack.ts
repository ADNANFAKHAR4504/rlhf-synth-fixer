import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface BackupVerificationStackArgs {
  environmentSuffix: string;
  databaseClusterArn: pulumi.Output<string>;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class BackupVerificationStack extends pulumi.ComponentResource {
  constructor(
    name: string,
    args: BackupVerificationStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:backup:BackupVerificationStack', name, args, opts);

    const { environmentSuffix, databaseClusterArn, tags } = args;

    // Lambda Execution Role
    const lambdaRole = new aws.iam.Role(
      `payment-backup-lambda-role-${environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
            },
          ],
        }),
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `payment-backup-lambda-role-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `payment-backup-lambda-policy-${environmentSuffix}`,
      {
        role: lambdaRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      },
      { parent: this }
    );

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _lambdaPolicy = new aws.iam.RolePolicy(
      `payment-backup-lambda-custom-policy-${environmentSuffix}`,
      {
        role: lambdaRole.id,
        policy: pulumi.all([databaseClusterArn]).apply(([_clusterArn]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: [
                  'rds:DescribeDBClusterSnapshots',
                  'rds:DescribeDBSnapshots',
                ],
                Resource: '*',
              },
              {
                Effect: 'Allow',
                Action: ['sns:Publish'],
                Resource: '*',
              },
            ],
          })
        ),
      },
      { parent: this }
    );

    // SNS Topic for Backup Alerts
    const backupAlarmTopic = new aws.sns.Topic(
      `payment-backup-alarms-${environmentSuffix}`,
      {
        name: `payment-backup-alarms-${environmentSuffix}`,
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `payment-backup-alarms-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Lambda Function for Backup Verification
    const backupVerificationLambda = new aws.lambda.Function(
      `payment-backup-verify-${environmentSuffix}`,
      {
        name: `payment-backup-verify-${environmentSuffix}`,
        runtime: 'python3.11',
        handler: 'index.handler',
        role: lambdaRole.arn,
        timeout: 300,
        environment: {
          variables: {
            CLUSTER_ARN: databaseClusterArn,
            SNS_TOPIC_ARN: backupAlarmTopic.arn,
            ENVIRONMENT: environmentSuffix,
          },
        },
        code: new pulumi.asset.AssetArchive({
          'index.py': new pulumi.asset.StringAsset(`
import os
import json
import boto3
from datetime import datetime, timedelta

rds = boto3.client('rds')
sns = boto3.client('sns')

def handler(event, context):
    cluster_arn = os.environ['CLUSTER_ARN']
    sns_topic = os.environ['SNS_TOPIC_ARN']
    environment = os.environ['ENVIRONMENT']

    # Extract cluster identifier from ARN
    cluster_id = cluster_arn.split(':')[-1]

    try:
        # Get recent snapshots
        response = rds.describe_db_cluster_snapshots(
            DBClusterIdentifier=cluster_id,
            SnapshotType='automated',
            MaxRecords=20
        )

        snapshots = response['DBClusterSnapshots']

        if not snapshots:
            message = f"No automated backups found for cluster {cluster_id}"
            print(message)
            sns.publish(
                TopicArn=sns_topic,
                Subject=f"Backup Verification FAILED - {environment}",
                Message=message
            )
            return {
                'statusCode': 500,
                'body': json.dumps(message)
            }

        # Check if latest backup is recent (within 24 hours)
        latest_snapshot = max(snapshots, key=lambda x: x['SnapshotCreateTime'])
        snapshot_age = datetime.now(latest_snapshot['SnapshotCreateTime'].tzinfo) - latest_snapshot['SnapshotCreateTime']

        if snapshot_age > timedelta(hours=25):
            message = f"Latest backup is too old: {snapshot_age.days} days, {snapshot_age.seconds // 3600} hours"
            print(message)
            sns.publish(
                TopicArn=sns_topic,
                Subject=f"Backup Verification FAILED - {environment}",
                Message=message
            )
            return {
                'statusCode': 500,
                'body': json.dumps(message)
            }

        # Verify backup is encrypted
        if not latest_snapshot.get('StorageEncrypted', False):
            message = f"Latest backup is not encrypted!"
            print(message)
            sns.publish(
                TopicArn=sns_topic,
                Subject=f"Backup Verification FAILED - {environment}",
                Message=message
            )
            return {
                'statusCode': 500,
                'body': json.dumps(message)
            }

        # All checks passed
        message = f"Backup verification successful. Latest snapshot: {latest_snapshot['DBClusterSnapshotIdentifier']}, Age: {snapshot_age.seconds // 3600} hours"
        print(message)

        return {
            'statusCode': 200,
            'body': json.dumps(message)
        }

    except Exception as e:
        error_message = f"Error verifying backups: {str(e)}"
        print(error_message)
        sns.publish(
            TopicArn=sns_topic,
            Subject=f"Backup Verification ERROR - {environment}",
            Message=error_message
        )
        return {
            'statusCode': 500,
            'body': json.dumps(error_message)
        }
`),
        }),
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `payment-backup-verify-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // EventBridge Rule for Daily Execution
    const dailyScheduleRule = new aws.cloudwatch.EventRule(
      `payment-backup-schedule-${environmentSuffix}`,
      {
        name: `payment-backup-schedule-${environmentSuffix}`,
        description: 'Daily schedule for backup verification',
        scheduleExpression: 'cron(0 6 * * ? *)', // Daily at 6 AM UTC
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `payment-backup-schedule-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _eventTarget = new aws.cloudwatch.EventTarget(
      `payment-backup-target-${environmentSuffix}`,
      {
        rule: dailyScheduleRule.name,
        arn: backupVerificationLambda.arn,
      },
      { parent: this }
    );

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _lambdaPermission = new aws.lambda.Permission(
      `payment-backup-lambda-permission-${environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: backupVerificationLambda.name,
        principal: 'events.amazonaws.com',
        sourceArn: dailyScheduleRule.arn,
      },
      { parent: this }
    );

    this.registerOutputs({
      lambdaArn: backupVerificationLambda.arn,
      snsTopicArn: backupAlarmTopic.arn,
    });
  }
}
