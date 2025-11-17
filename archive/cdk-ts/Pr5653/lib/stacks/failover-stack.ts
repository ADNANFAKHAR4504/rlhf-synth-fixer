import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sns_subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as stepfunctions from 'aws-cdk-lib/aws-stepfunctions';
import * as stepfunctions_tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { Construct } from 'constructs';
import * as path from 'path';
import { AuroraGlobalStack } from './aurora-global-stack';

export interface FailoverStackProps extends cdk.StackProps {
  primaryStack: AuroraGlobalStack;
  secondaryStack: AuroraGlobalStack;
}

export class FailoverStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: FailoverStackProps) {
    super(scope, id, props);

    // Create SNS topic for notifications
    const alertTopic = new sns.Topic(this, 'AlertTopic', {
      displayName: 'Aurora DR Alerts',
      topicName: 'aurora-dr-alerts',
    });

    // Add PagerDuty integration
    alertTopic.addSubscription(
      new sns_subscriptions.UrlSubscription(
        process.env.PAGERDUTY_WEBHOOK_URL ||
          'https://events.pagerduty.com/integration/YOUR_KEY/enqueue'
      )
    );

    // Create hosted zone for failover routing
    const hostedZone = new route53.PrivateHostedZone(this, 'HostedZone', {
      zoneName: 'aurora-dr.internal',
      vpc: props.primaryStack.vpc,
    });

    // Associate secondary VPC with hosted zone
    hostedZone.addVpc(props.secondaryStack.vpc);

    // Health check Lambda
    const healthCheckLambda = new lambda.Function(this, 'HealthCheckLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset(
        path.join(__dirname, '../lambdas/health-check')
      ),
      handler: 'index.handler',
      vpc: props.primaryStack.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      timeout: cdk.Duration.seconds(30),
      environment: {
        PRIMARY_CLUSTER_ENDPOINT: props.primaryStack.clusterEndpoint,
        SECONDARY_CLUSTER_ENDPOINT: props.secondaryStack.clusterEndpoint,
        SECRET_ARN: props.primaryStack.secret.secretArn,
      },
    });

    // Grant necessary permissions
    props.primaryStack.secret.grantRead(healthCheckLambda);
    props.primaryStack.cluster.grantDataApiAccess(healthCheckLambda);

    // Failover orchestrator Lambda
    const failoverLambda = new lambda.Function(this, 'FailoverOrchestrator', {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset(
        path.join(__dirname, '../lambdas/failover-orchestrator')
      ),
      handler: 'index.handler',
      vpc: props.primaryStack.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      timeout: cdk.Duration.minutes(15),
      environment: {
        PRIMARY_REGION: props.primaryStack.region!,
        SECONDARY_REGION: props.secondaryStack.region!,
        GLOBAL_CLUSTER_ID: props.primaryStack.globalClusterIdentifier,
        SNS_TOPIC_ARN: alertTopic.topicArn,
        HOSTED_ZONE_ID: hostedZone.hostedZoneId,
      },
    });

    // Grant RDS permissions for failover
    failoverLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          'rds:FailoverGlobalCluster',
          'rds:DescribeGlobalClusters',
          'rds:DescribeDBClusters',
          'rds:ModifyGlobalCluster',
        ],
        resources: ['*'],
      })
    );

    // Grant Route53 permissions
    failoverLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['route53:ChangeResourceRecordSets', 'route53:GetChange'],
        resources: [hostedZone.hostedZoneArn, 'arn:aws:route53:::change/*'],
      })
    );

    alertTopic.grantPublish(failoverLambda);

    // Create Step Functions for failover workflow
    const validatePrimaryTask = new stepfunctions_tasks.LambdaInvoke(
      this,
      'ValidatePrimary',
      {
        lambdaFunction: healthCheckLambda,
        outputPath: '$.Payload',
      }
    );

    const promotionTask = new stepfunctions_tasks.LambdaInvoke(
      this,
      'PromoteSecondary',
      {
        lambdaFunction: failoverLambda,
        outputPath: '$.Payload',
      }
    );

    const notificationTask = new stepfunctions_tasks.SnsPublish(
      this,
      'NotifyFailover',
      {
        topic: alertTopic,
        message: stepfunctions.TaskInput.fromJsonPathAt('$'),
      }
    );

    const failoverStateMachine = new stepfunctions.StateMachine(
      this,
      'FailoverStateMachine',
      {
        definition: validatePrimaryTask.next(
          new stepfunctions.Choice(this, 'IsPrimaryHealthy?')
            .when(
              stepfunctions.Condition.booleanEquals('$.healthy', false),
              promotionTask.next(notificationTask)
            )
            .otherwise(new stepfunctions.Succeed(this, 'NoActionNeeded'))
        ),
        timeout: cdk.Duration.minutes(10),
      }
    );

    // Create composite alarm for failover
    const replicationLagAlarm = new cloudwatch.Alarm(
      this,
      'ReplicationLagAlarm',
      {
        metric: new cloudwatch.Metric({
          namespace: 'AWS/RDS',
          metricName: 'AuroraGlobalDBReplicationLag',
          dimensionsMap: {
            DBClusterIdentifier: props.primaryStack.cluster.clusterIdentifier,
          },
          statistic: 'Average',
        }),
        threshold: 5000, // 5 seconds in milliseconds
        evaluationPeriods: 2,
        datapointsToAlarm: 2,
      }
    );

    const primaryHealthAlarm = new cloudwatch.Alarm(
      this,
      'PrimaryHealthAlarm',
      {
        metric: new cloudwatch.Metric({
          namespace: 'AWS/Lambda',
          metricName: 'Errors',
          dimensionsMap: {
            FunctionName: healthCheckLambda.functionName,
          },
          statistic: 'Sum',
        }),
        threshold: 1,
        evaluationPeriods: 2,
        datapointsToAlarm: 2,
      }
    );

    const compositeAlarm = new cloudwatch.CompositeAlarm(
      this,
      'FailoverCompositeAlarm',
      {
        compositeAlarmName: 'aurora-dr-failover-trigger',
        alarmRule: cloudwatch.AlarmRule.anyOf(
          cloudwatch.AlarmRule.fromAlarm(
            replicationLagAlarm,
            cloudwatch.AlarmState.ALARM
          ),
          cloudwatch.AlarmRule.fromAlarm(
            primaryHealthAlarm,
            cloudwatch.AlarmState.ALARM
          )
        ),
        actionsEnabled: true,
      }
    );

    compositeAlarm.addAlarmAction(
      new cloudwatch_actions.LambdaAction(failoverLambda)
    );

    // Automated DR testing - runs every 30 days
    const drTestLambda = new lambda.Function(this, 'DRTestLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset(
        path.join(__dirname, '../lambdas/dr-testing')
      ),
      handler: 'index.handler',
      timeout: cdk.Duration.minutes(15),
      environment: {
        STATE_MACHINE_ARN: failoverStateMachine.stateMachineArn,
        SNS_TOPIC_ARN: alertTopic.topicArn,
      },
    });

    failoverStateMachine.grantStartExecution(drTestLambda);
    alertTopic.grantPublish(drTestLambda);

    // Schedule DR tests
    new events.Rule(this, 'DRTestSchedule', {
      schedule: events.Schedule.rate(cdk.Duration.days(30)),
      targets: [new targets.LambdaFunction(drTestLambda)],
    });

    // Create Route53 failover records
    new route53.CnameRecord(this, 'PrimaryRecord', {
      zone: hostedZone,
      recordName: 'aurora-writer',
      domainName: props.primaryStack.dbProxy.endpoint,
      ttl: cdk.Duration.seconds(60),
      setIdentifier: 'Primary',
      geoLocation: route53.GeoLocation.continent(
        route53.Continent.NORTH_AMERICA
      ),
    });

    new route53.CnameRecord(this, 'SecondaryRecord', {
      zone: hostedZone,
      recordName: 'aurora-writer',
      domainName: props.secondaryStack.dbProxy.endpoint,
      ttl: cdk.Duration.seconds(60),
      setIdentifier: 'Secondary',
      geoLocation: route53.GeoLocation.continent(
        route53.Continent.NORTH_AMERICA
      ),
    });

    // Outputs for integration tests
    new cdk.CfnOutput(this, 'StateMachineArnOutput', {
      value: failoverStateMachine.stateMachineArn,
      exportName: `${this.stackName}-StateMachineArn`,
      description:
        'Step Functions state machine ARN for failover orchestration',
    });

    new cdk.CfnOutput(this, 'AlertTopicArnOutput', {
      value: alertTopic.topicArn,
      exportName: `${this.stackName}-AlertTopicArn`,
      description: 'SNS topic ARN for DR alerts',
    });
  }
}
