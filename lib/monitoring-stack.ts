import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import * as path from 'path';

export interface MonitoringStackProps extends cdk.NestedStackProps {
  environmentSuffix: string;
  isPrimary: boolean;
  primaryRegion: string;
  drRegion: string;
  vpc: ec2.Vpc;
  database: rds.DatabaseInstance;
  readReplica?: rds.DatabaseInstanceReadReplica;
}

export class MonitoringStack extends cdk.NestedStack {
  public readonly alarmTopic: sns.Topic;
  public readonly replicationLagFunction?: lambda.Function;

  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id, props);

    const {
      environmentSuffix,
      isPrimary,
      primaryRegion,
      drRegion,
      vpc,
      database,
      readReplica,
    } = props;
    const currentRegion = isPrimary ? primaryRegion : drRegion;

    // SNS Topic for alarms
    this.alarmTopic = new sns.Topic(this, 'AlarmTopic', {
      topicName: `postgres-dr-alarms-${environmentSuffix}-${currentRegion}`,
      displayName: `PostgreSQL DR Alarms for ${currentRegion}`,
    });

    // CloudWatch Alarms for primary database
    // CPU Utilization
    const cpuAlarm = new cloudwatch.Alarm(this, 'DatabaseCPUAlarm', {
      alarmName: `postgres-dr-cpu-${environmentSuffix}-${currentRegion}`,
      metric: database.metricCPUUtilization(),
      threshold: 80,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    cpuAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(this.alarmTopic)
    );

    // Free Storage Space
    const storageAlarm = new cloudwatch.Alarm(this, 'DatabaseStorageAlarm', {
      alarmName: `postgres-dr-storage-${environmentSuffix}-${currentRegion}`,
      metric: database.metricFreeStorageSpace(),
      threshold: 10 * 1024 * 1024 * 1024, // 10 GB
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    storageAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(this.alarmTopic)
    );

    // Database Connections
    const connectionsAlarm = new cloudwatch.Alarm(
      this,
      'DatabaseConnectionsAlarm',
      {
        alarmName: `postgres-dr-connections-${environmentSuffix}-${currentRegion}`,
        metric: database.metricDatabaseConnections(),
        threshold: 80,
        evaluationPeriods: 2,
        datapointsToAlarm: 2,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );
    connectionsAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(this.alarmTopic)
    );

    // Read Latency
    const readLatencyAlarm = new cloudwatch.Alarm(
      this,
      'DatabaseReadLatencyAlarm',
      {
        alarmName: `postgres-dr-read-latency-${environmentSuffix}-${currentRegion}`,
        metric: database.metric('ReadLatency', {
          statistic: 'Average',
          period: cdk.Duration.minutes(5),
        }),
        threshold: 0.1, // 100ms
        evaluationPeriods: 2,
        datapointsToAlarm: 2,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );
    readLatencyAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(this.alarmTopic));

    // Write Latency
    const writeLatencyAlarm = new cloudwatch.Alarm(
      this,
      'DatabaseWriteLatencyAlarm',
      {
        alarmName: `postgres-dr-write-latency-${environmentSuffix}-${currentRegion}`,
        metric: database.metric('WriteLatency', {
          statistic: 'Average',
          period: cdk.Duration.minutes(5),
        }),
        threshold: 0.1, // 100ms
        evaluationPeriods: 2,
        datapointsToAlarm: 2,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );
    writeLatencyAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(this.alarmTopic));

    // Composite Alarm - Critical database issues
    const compositeAlarm = new cloudwatch.CompositeAlarm(
      this,
      'DatabaseCompositeAlarm',
      {
        compositeAlarmName: `postgres-dr-composite-${environmentSuffix}-${currentRegion}`,
        alarmDescription: 'Composite alarm for critical database issues',
        alarmRule: cloudwatch.AlarmRule.anyOf(
          cloudwatch.AlarmRule.fromAlarm(cpuAlarm, cloudwatch.AlarmState.ALARM),
          cloudwatch.AlarmRule.fromAlarm(
            storageAlarm,
            cloudwatch.AlarmState.ALARM
          ),
          cloudwatch.AlarmRule.allOf(
            cloudwatch.AlarmRule.fromAlarm(
              readLatencyAlarm,
              cloudwatch.AlarmState.ALARM
            ),
            cloudwatch.AlarmRule.fromAlarm(
              writeLatencyAlarm,
              cloudwatch.AlarmState.ALARM
            )
          )
        ),
      }
    );
    compositeAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(this.alarmTopic));

    // Lambda function for replication lag monitoring (only if read replica exists)
    if (readReplica && isPrimary) {
      // IAM role for Lambda
      const lambdaRole = new iam.Role(this, 'ReplicationLagMonitorRole', {
        roleName: `replication-lag-monitor-${environmentSuffix}-${currentRegion}`,
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
        description: 'Role for replication lag monitoring Lambda',
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AWSLambdaVPCAccessExecutionRole'
          ),
        ],
      });

      // Add permissions for RDS and CloudWatch
      lambdaRole.addToPolicy(
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'rds:DescribeDBInstances',
            'rds:DescribeDBClusters',
            'cloudwatch:PutMetricData',
          ],
          resources: ['*'],
        })
      );

      // Add permissions for SNS
      lambdaRole.addToPolicy(
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ['sns:Publish'],
          resources: [this.alarmTopic.topicArn],
        })
      );

      // Lambda function
      this.replicationLagFunction = new nodejs.NodejsFunction(
        this,
        'ReplicationLagMonitor',
        {
          functionName: `replication-lag-monitor-${environmentSuffix}-${currentRegion}`,
          runtime: lambda.Runtime.NODEJS_18_X,
          entry: path.join(__dirname, 'lambda', 'replication-lag-monitor.ts'),
          handler: 'handler',
          timeout: cdk.Duration.minutes(5),
          memorySize: 256,
          vpc: vpc,
          vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
          role: lambdaRole,
          environment: {
            PRIMARY_DB_IDENTIFIER: database.instanceIdentifier,
            REPLICA_DB_IDENTIFIER: readReplica.instanceIdentifier,
            SNS_TOPIC_ARN: this.alarmTopic.topicArn,
            ENVIRONMENT_SUFFIX: environmentSuffix,
          },
          bundling: {
            externalModules: [],
            minify: true,
            sourceMap: true,
          },
        }
      );

      // EventBridge rule to trigger Lambda every 5 minutes
      const rule = new events.Rule(this, 'ReplicationLagMonitorRule', {
        ruleName: `replication-lag-monitor-${environmentSuffix}-${currentRegion}`,
        schedule: events.Schedule.rate(cdk.Duration.minutes(5)),
        description: 'Trigger replication lag monitor every 5 minutes',
      });

      rule.addTarget(new targets.LambdaFunction(this.replicationLagFunction));

      // CloudWatch alarm for custom replication lag metric
      const replicationLagAlarm = new cloudwatch.Alarm(
        this,
        'ReplicationLagAlarm',
        {
          alarmName: `postgres-dr-replication-lag-${environmentSuffix}-${currentRegion}`,
          metric: new cloudwatch.Metric({
            namespace: 'PostgreSQL/DR',
            metricName: 'ReplicationLag',
            dimensionsMap: {
              DBInstanceIdentifier: readReplica.instanceIdentifier,
              EnvironmentSuffix: environmentSuffix,
            },
            statistic: 'Average',
            period: cdk.Duration.minutes(5),
          }),
          threshold: 300, // 5 minutes
          evaluationPeriods: 2,
          datapointsToAlarm: 2,
          comparisonOperator:
            cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
          treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
          alarmDescription: 'Alert when replication lag exceeds 5 minutes',
        }
      );
      replicationLagAlarm.addAlarmAction(
        new cloudwatch_actions.SnsAction(this.alarmTopic)
      );

      // Output Lambda function ARN
      new cdk.CfnOutput(this, 'ReplicationLagFunctionArn', {
        value: this.replicationLagFunction.functionArn,
        description: 'Replication lag monitor Lambda function ARN',
      });
    }

    // Outputs
    new cdk.CfnOutput(this, 'AlarmTopicArn', {
      value: this.alarmTopic.topicArn,
      description: `Alarm topic ARN for ${currentRegion}`,
    });

    new cdk.CfnOutput(this, 'CompositeAlarmName', {
      value: compositeAlarm.alarmName,
      description: `Composite alarm name for ${currentRegion}`,
    });

    // Tags
    cdk.Tags.of(this.alarmTopic).add(
      'Name',
      `postgres-dr-alarms-${environmentSuffix}-${currentRegion}`
    );
    cdk.Tags.of(this.alarmTopic).add('Region', currentRegion);
    cdk.Tags.of(this.alarmTopic).add('Purpose', 'PostgreSQL-DR-Monitoring');
  }
}
