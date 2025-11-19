import * as cdk from 'aws-cdk-lib';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface FailoverStackProps extends cdk.NestedStackProps {
  environmentSuffix: string;
  primaryRegion: string;
  drRegion: string;
  primaryDatabase: rds.DatabaseInstance;
  alarmTopic: sns.Topic;
}

export class FailoverStack extends cdk.NestedStack {
  public readonly hostedZone?: route53.IHostedZone;

  constructor(scope: Construct, id: string, props: FailoverStackProps) {
    super(scope, id, props);

    const {
      environmentSuffix,
      primaryRegion,
      drRegion,
      primaryDatabase,
      alarmTopic,
    } = props;

    // Note: Route53 hosted zone creation requires a domain name
    // In a real implementation, you would either:
    // 1. Import an existing hosted zone
    // 2. Create a private hosted zone
    // 3. Use Route53 health checks with public hosted zone

    // For this example, we'll create health checks and EventBridge rules for failover orchestration

    // IAM role for failover Lambda
    const failoverLambdaRole = new iam.Role(this, 'FailoverLambdaRole', {
      roleName: `postgres-dr-failover-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'Role for PostgreSQL failover orchestration',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
    });

    // Add permissions for RDS failover operations
    failoverLambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'rds:PromoteReadReplica',
          'rds:DescribeDBInstances',
          'rds:ModifyDBInstance',
          'rds:RebootDBInstance',
        ],
        resources: ['*'],
      })
    );

    // Add permissions for SNS
    failoverLambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['sns:Publish'],
        resources: [alarmTopic.topicArn],
      })
    );

    // Add permissions for CloudWatch
    failoverLambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'cloudwatch:DescribeAlarms',
          'cloudwatch:GetMetricStatistics',
        ],
        resources: ['*'],
      })
    );

    // Lambda function for failover orchestration
    const failoverFunction = new lambda.Function(this, 'FailoverFunction', {
      functionName: `postgres-dr-failover-${environmentSuffix}`,
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'index.handler',
      role: failoverLambdaRole,
      timeout: cdk.Duration.minutes(15),
      memorySize: 512,
      environment: {
        PRIMARY_DB_IDENTIFIER: primaryDatabase.instanceIdentifier,
        PRIMARY_REGION: primaryRegion,
        DR_REGION: drRegion,
        SNS_TOPIC_ARN: alarmTopic.topicArn,
        ENVIRONMENT_SUFFIX: environmentSuffix,
      },
      code: lambda.Code.fromInline(`
import json
import boto3
import os
from datetime import datetime

rds_primary = boto3.client('rds', region_name=os.environ['PRIMARY_REGION'])
rds_dr = boto3.client('rds', region_name=os.environ['DR_REGION'])
sns = boto3.client('sns')

def handler(event, context):
    print(f"Failover event received: {json.dumps(event)}")

    primary_db = os.environ['PRIMARY_DB_IDENTIFIER']
    dr_region = os.environ['DR_REGION']
    sns_topic = os.environ['SNS_TOPIC_ARN']
    env_suffix = os.environ['ENVIRONMENT_SUFFIX']

    try:
        # Check if this is a genuine failover trigger
        if 'source' in event and event['source'] == 'aws.cloudwatch':
            alarm_name = event['detail']['alarmName']
            state = event['detail']['state']['value']

            print(f"CloudWatch Alarm: {alarm_name}, State: {state}")

            # Only proceed with failover if composite alarm is in ALARM state
            if 'composite' in alarm_name.lower() and state == 'ALARM':
                # Get current primary database status
                primary_status = rds_primary.describe_db_instances(
                    DBInstanceIdentifier=primary_db
                )

                db_status = primary_status['DBInstances'][0]['DBInstanceStatus']
                print(f"Primary database status: {db_status}")

                # Send notification about potential failover
                message = f"""
FAILOVER ALERT - Action Required

Primary Database Status: {db_status}
Alarm: {alarm_name}
Environment: {env_suffix}
Time: {datetime.utcnow().isoformat()}

The failover orchestration Lambda has been triggered due to critical alarms.
Manual intervention is recommended before promoting the DR replica.

Steps for manual failover:
1. Verify primary database is truly unavailable
2. Check replication lag on DR replica
3. Promote DR replica: aws rds promote-read-replica --db-instance-identifier <replica-id> --region {dr_region}
4. Update application endpoints to point to DR region
5. Monitor new primary database health

This is an automated notification. Manual verification is required before failover.
"""

                sns.publish(
                    TopicArn=sns_topic,
                    Subject=f'[{env_suffix}] PostgreSQL Failover Alert - Manual Action Required',
                    Message=message
                )

                return {
                    'statusCode': 200,
                    'body': json.dumps({
                        'message': 'Failover notification sent',
                        'primaryStatus': db_status,
                        'requiresManualAction': True
                    })
                }

        # For other event types, just log
        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'Event logged, no action taken'})
        }

    except Exception as e:
        error_msg = f"Error in failover orchestration: {str(e)}"
        print(error_msg)

        # Send error notification
        sns.publish(
            TopicArn=sns_topic,
            Subject=f'[{env_suffix}] PostgreSQL Failover Error',
            Message=error_msg
        )

        raise
`),
    });

    // EventBridge rule to trigger failover Lambda on CloudWatch alarms
    const failoverRule = new events.Rule(this, 'FailoverRule', {
      ruleName: `postgres-dr-failover-rule-${environmentSuffix}`,
      description: 'Trigger failover orchestration on critical alarms',
      eventPattern: {
        source: ['aws.cloudwatch'],
        detailType: ['CloudWatch Alarm State Change'],
        detail: {
          alarmName: [
            {
              prefix: `postgres-dr-composite-${environmentSuffix}`,
            },
          ],
          state: {
            value: ['ALARM'],
          },
        },
      },
    });

    failoverRule.addTarget(new targets.LambdaFunction(failoverFunction));

    // Also send alarm state changes to SNS
    failoverRule.addTarget(new targets.SnsTopic(alarmTopic));

    // EventBridge rule for RDS events
    const rdsEventRule = new events.Rule(this, 'RdsEventRule', {
      ruleName: `postgres-dr-rds-events-${environmentSuffix}`,
      description: 'Monitor RDS events for failover scenarios',
      eventPattern: {
        source: ['aws.rds'],
        detailType: ['RDS DB Instance Event'],
        detail: {
          EventCategories: ['failover', 'failure', 'recovery'],
        },
      },
    });

    rdsEventRule.addTarget(new targets.SnsTopic(alarmTopic));
    rdsEventRule.addTarget(new targets.LambdaFunction(failoverFunction));

    // Outputs
    new cdk.CfnOutput(this, 'FailoverFunctionArn', {
      value: failoverFunction.functionArn,
      description: 'Failover orchestration Lambda function ARN',
    });

    new cdk.CfnOutput(this, 'FailoverRuleName', {
      value: failoverRule.ruleName,
      description: 'EventBridge failover rule name',
    });

    new cdk.CfnOutput(this, 'RdsEventRuleName', {
      value: rdsEventRule.ruleName,
      description: 'EventBridge RDS event rule name',
    });

    // Tags
    cdk.Tags.of(failoverFunction).add(
      'Name',
      `postgres-dr-failover-${environmentSuffix}`
    );
    cdk.Tags.of(failoverFunction).add('Purpose', 'PostgreSQL-DR-Failover');
  }
}
