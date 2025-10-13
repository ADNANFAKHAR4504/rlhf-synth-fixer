import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as events from 'aws-cdk-lib/aws-events';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as iam from 'aws-cdk-lib/aws-iam';

export interface GlobalEndpointStackProps extends cdk.StackProps {
  primaryRegion: string;
  secondaryRegion: string;
  eventBusArn: string;
  secondaryEventBusArn: string;
  environmentSuffix: string;
  eventBusName: string;
}

export class GlobalEndpointStack extends cdk.Stack {
  public readonly globalEndpoint: events.CfnEndpoint;
  public readonly healthCheck: route53.CfnHealthCheck;

  constructor(scope: Construct, id: string, props: GlobalEndpointStackProps) {
    super(scope, id, props);

    const suffix = props.environmentSuffix;

    // Create a CloudWatch alarm for the primary region's event bus
    // This alarm will be in ALARM state if the event bus is unhealthy
    const healthAlarm = new cloudwatch.Alarm(this, 'PrimaryRegionHealthAlarm', {
      alarmName: `eventbridge-primary-health-${suffix}`,
      alarmDescription:
        'Health check for EventBridge Global Endpoint primary region',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/Events',
        metricName: 'Invocations',
        dimensionsMap: {
          EventBusName: props.eventBusName,
        },
        statistic: 'Sum',
        period: cdk.Duration.minutes(1),
      }),
      threshold: 0,
      evaluationPeriods: 1,
      comparisonOperator:
        cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // Create a Route 53 health check that monitors the CloudWatch alarm
    this.healthCheck = new route53.CfnHealthCheck(
      this,
      'PrimaryRegionHealthCheck',
      {
        healthCheckConfig: {
          type: 'CLOUDWATCH_METRIC',
          alarmIdentifier: {
            name: healthAlarm.alarmName,
            region: props.primaryRegion,
          },
          insufficientDataHealthStatus: 'Healthy',
        },
      }
    );

    // Create IAM role for EventBridge Global Endpoint replication with inline policy
    const replicationRole = new iam.Role(this, 'ReplicationRole', {
      roleName: `eventbridge-replication-role-${suffix}`,
      assumedBy: new iam.ServicePrincipal('events.amazonaws.com'),
      description: 'IAM role for EventBridge Global Endpoint replication',
      inlinePolicies: {
        EventBridgeReplicationPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'events:PutEvents',
                'events:PutRule',
                'events:DeleteRule',
                'events:DescribeRule',
                'events:PutTargets',
                'events:RemoveTargets',
                'events:ListTargetsByRule',
              ],
              resources: ['*'],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['iam:PassRole'],
              resources: ['*'],
              conditions: {
                StringLike: {
                  'iam:PassedToService': 'events.amazonaws.com',
                },
              },
            }),
          ],
        }),
      },
    });

    // Create an EventBridge Global Endpoint
    this.globalEndpoint = new events.CfnEndpoint(
      this,
      'TradingGlobalEndpoint',
      {
        name: `trading-global-endpoint-${suffix}`,
        routingConfig: {
          failoverConfig: {
            primary: {
              healthCheck: cdk.Arn.format(
                {
                  service: 'route53',
                  region: '',
                  account: '',
                  resource: 'healthcheck',
                  resourceName: this.healthCheck.attrHealthCheckId,
                },
                this
              ),
            },
            secondary: {
              route: props.secondaryRegion,
            },
          },
        },
        replicationConfig: {
          state: 'ENABLED',
        },
        roleArn: replicationRole.roleArn,
        eventBuses: [
          {
            eventBusArn: props.eventBusArn,
          },
          {
            eventBusArn: props.secondaryEventBusArn,
          },
        ],
      }
    );

    // Outputs for integration testing
    new cdk.CfnOutput(this, 'GlobalEndpointUrl', {
      value: this.globalEndpoint.attrEndpointUrl,
      description: 'URL for the EventBridge Global Endpoint',
      exportName: `trading-global-endpoint-url-${suffix}`,
    });

    new cdk.CfnOutput(this, 'GlobalEndpointArn', {
      value: this.globalEndpoint.attrArn,
      description: 'ARN for the EventBridge Global Endpoint',
      exportName: `trading-global-endpoint-arn-${suffix}`,
    });

    new cdk.CfnOutput(this, 'GlobalEndpointName', {
      value: this.globalEndpoint.name!,
      description: 'Name of the EventBridge Global Endpoint',
      exportName: `trading-global-endpoint-name-${suffix}`,
    });

    new cdk.CfnOutput(this, 'GlobalEndpointId', {
      value: this.globalEndpoint.attrEndpointId,
      description: 'ID of the EventBridge Global Endpoint',
      exportName: `trading-global-endpoint-id-${suffix}`,
    });

    new cdk.CfnOutput(this, 'GlobalEndpointState', {
      value: this.globalEndpoint.attrState,
      description: 'State of the EventBridge Global Endpoint',
      exportName: `trading-global-endpoint-state-${suffix}`,
    });

    new cdk.CfnOutput(this, 'PrimaryRegion', {
      value: props.primaryRegion,
      description: 'Primary region for the Global Endpoint',
      exportName: `trading-global-endpoint-primary-region-${suffix}`,
    });

    new cdk.CfnOutput(this, 'SecondaryRegion', {
      value: props.secondaryRegion,
      description: 'Secondary region for the Global Endpoint',
      exportName: `trading-global-endpoint-secondary-region-${suffix}`,
    });

    new cdk.CfnOutput(this, 'ReplicationRoleArn', {
      value: replicationRole.roleArn,
      description: 'ARN of the IAM role for EventBridge replication',
      exportName: `trading-replication-role-arn-${suffix}`,
    });

    new cdk.CfnOutput(this, 'ReplicationRoleName', {
      value: replicationRole.roleName,
      description: 'Name of the IAM role for EventBridge replication',
      exportName: `trading-replication-role-name-${suffix}`,
    });

    new cdk.CfnOutput(this, 'HealthCheckId', {
      value: this.healthCheck.attrHealthCheckId,
      description: 'Route 53 Health Check ID for the primary region',
      exportName: `trading-health-check-id-${suffix}`,
    });

    new cdk.CfnOutput(this, 'HealthAlarmName', {
      value: healthAlarm.alarmName,
      description: 'CloudWatch Alarm name for primary region health',
      exportName: `trading-health-alarm-name-${suffix}`,
    });

    new cdk.CfnOutput(this, 'HealthAlarmArn', {
      value: healthAlarm.alarmArn,
      description: 'CloudWatch Alarm ARN for primary region health',
      exportName: `trading-health-alarm-arn-${suffix}`,
    });

    new cdk.CfnOutput(this, 'PrimaryEventBusArn', {
      value: props.eventBusArn,
      description: 'ARN of the primary EventBridge event bus',
      exportName: `trading-primary-event-bus-arn-${suffix}`,
    });

    new cdk.CfnOutput(this, 'SecondaryEventBusArn', {
      value: props.secondaryEventBusArn,
      description: 'ARN of the secondary EventBridge event bus',
      exportName: `trading-secondary-event-bus-arn-${suffix}`,
    });

    new cdk.CfnOutput(this, 'ReplicationState', {
      value: 'ENABLED',
      description: 'Replication state of the Global Endpoint',
      exportName: `trading-replication-state-${suffix}`,
    });
  }
}
