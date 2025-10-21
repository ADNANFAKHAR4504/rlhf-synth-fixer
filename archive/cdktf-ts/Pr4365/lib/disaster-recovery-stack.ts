import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { CloudwatchMetricAlarm } from '@cdktf/provider-aws/lib/cloudwatch-metric-alarm';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicy } from '@cdktf/provider-aws/lib/iam-role-policy';
import { LambdaFunction } from '@cdktf/provider-aws/lib/lambda-function';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { Route53HealthCheck } from '@cdktf/provider-aws/lib/route53-health-check';
import { SsmParameter } from '@cdktf/provider-aws/lib/ssm-parameter';
import { AssetType, TerraformAsset } from 'cdktf';
import { Construct } from 'constructs';
import * as path from 'path';

interface DisasterRecoveryStackProps {
  environmentSuffix: string;
  primaryRegion: string;
  secondaryRegion: string;
  primaryProvider: AwsProvider;
  secondaryProvider: AwsProvider;
  primaryDatabaseId: string;
  replicaDatabaseId: string;
  snsTopicArn: string;
}

export class DisasterRecoveryStack extends Construct {
  constructor(scope: Construct, id: string, props: DisasterRecoveryStackProps) {
    super(scope, id);

    const {
      environmentSuffix,
      primaryRegion,
      secondaryRegion,
      primaryProvider,
      primaryDatabaseId,
      replicaDatabaseId,
      snsTopicArn,
    } = props;

    // Note: secondaryProvider from props available if needed for future DR resources

    // SSM Parameters for configuration
    new SsmParameter(this, 'primary-db-param', {
      provider: primaryProvider,
      name: `/healthcare/${environmentSuffix}/database/primary-id`,
      type: 'String',
      value: primaryDatabaseId,
      description: 'Primary database cluster identifier',
      tags: {
        Name: `primary-db-param-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    new SsmParameter(this, 'secondary-db-param', {
      provider: primaryProvider,
      name: `/healthcare/${environmentSuffix}/database/replica-id`,
      type: 'String',
      value: replicaDatabaseId,
      description: 'Secondary database cluster identifier',
      tags: {
        Name: `secondary-db-param-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // Lambda execution role
    const lambdaRole = new IamRole(this, 'lambda-role', {
      provider: primaryProvider,
      name: `healthcare-dr-lambda-role-${environmentSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Service: 'lambda.amazonaws.com',
            },
            Action: 'sts:AssumeRole',
          },
        ],
      }),
      tags: {
        Name: `healthcare-dr-lambda-role-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    new IamRolePolicy(this, 'lambda-policy', {
      provider: primaryProvider,
      name: `healthcare-dr-lambda-policy-${environmentSuffix}`,
      role: lambdaRole.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
              'logs:PutLogEvents',
            ],
            Resource: 'arn:aws:logs:*:*:*',
          },
          {
            Effect: 'Allow',
            Action: [
              'rds:DescribeDBClusters',
              'rds:PromoteReadReplica',
              'rds:ModifyDBCluster',
            ],
            Resource: '*',
          },
          {
            Effect: 'Allow',
            Action: ['sns:Publish'],
            Resource: [snsTopicArn],
          },
          {
            Effect: 'Allow',
            Action: ['ssm:GetParameter', 'ssm:GetParameters'],
            Resource: `arn:aws:ssm:${primaryRegion}:*:parameter/healthcare/${environmentSuffix}/*`,
          },
        ],
      }),
    });

    // Lambda function asset
    const lambdaAsset = new TerraformAsset(this, 'lambda-asset', {
      path: path.resolve(__dirname, 'lambda'),
      type: AssetType.ARCHIVE,
    });

    // CloudWatch Log Group for Lambda
    new CloudwatchLogGroup(this, 'lambda-log-group', {
      provider: primaryProvider,
      name: `/aws/lambda/healthcare-failover-${environmentSuffix}`,
      retentionInDays: 30,
      tags: {
        Name: `lambda-logs-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // Failover Lambda function
    const failoverFunction = new LambdaFunction(this, 'failover-function', {
      provider: primaryProvider,
      functionName: `healthcare-failover-${environmentSuffix}`,
      role: lambdaRole.arn,
      handler: 'failover-handler.handler',
      runtime: 'nodejs18.x',
      timeout: 300,
      memorySize: 256,
      filename: lambdaAsset.path,
      sourceCodeHash: lambdaAsset.assetHash,
      environment: {
        variables: {
          ENVIRONMENT_SUFFIX: environmentSuffix,
          PRIMARY_REGION: primaryRegion,
          SECONDARY_REGION: secondaryRegion,
          SNS_TOPIC_ARN: snsTopicArn,
        },
      },
      tags: {
        Name: `healthcare-failover-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // CloudWatch Alarms for monitoring
    new CloudwatchMetricAlarm(this, 'db-cpu-alarm', {
      provider: primaryProvider,
      alarmName: `healthcare-db-cpu-${environmentSuffix}`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'CPUUtilization',
      namespace: 'AWS/RDS',
      period: 300,
      statistic: 'Average',
      threshold: 80,
      alarmDescription: 'Database CPU utilization too high',
      alarmActions: [snsTopicArn],
      dimensions: {
        DBClusterIdentifier: primaryDatabaseId,
      },
      tags: {
        Name: `db-cpu-alarm-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    new CloudwatchMetricAlarm(this, 'db-connection-alarm', {
      provider: primaryProvider,
      alarmName: `healthcare-db-connections-${environmentSuffix}`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'DatabaseConnections',
      namespace: 'AWS/RDS',
      period: 300,
      statistic: 'Average',
      threshold: 80,
      alarmDescription: 'Database connections too high',
      alarmActions: [snsTopicArn],
      dimensions: {
        DBClusterIdentifier: primaryDatabaseId,
      },
      tags: {
        Name: `db-connections-alarm-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    const replicationLagAlarm = new CloudwatchMetricAlarm(
      this,
      'replication-lag-alarm',
      {
        provider: primaryProvider,
        alarmName: `healthcare-replication-lag-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'AuroraGlobalDBReplicationLag',
        namespace: 'AWS/RDS',
        period: 60,
        statistic: 'Average',
        threshold: 900000, // 15 minutes in milliseconds
        alarmDescription: 'Replication lag exceeds RPO',
        alarmActions: [snsTopicArn, failoverFunction.arn],
        dimensions: {
          DBClusterIdentifier: primaryDatabaseId,
        },
        tags: {
          Name: `replication-lag-alarm-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      }
    );

    // Route53 Health Check for primary database based on replication lag alarm
    new Route53HealthCheck(this, 'primary-health-check', {
      provider: primaryProvider,
      type: 'CLOUDWATCH_METRIC',
      cloudwatchAlarmName: replicationLagAlarm.alarmName,
      cloudwatchAlarmRegion: primaryRegion,
      insufficientDataHealthStatus: 'Unhealthy',
      tags: {
        Name: `healthcare-health-check-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });
  }
}
