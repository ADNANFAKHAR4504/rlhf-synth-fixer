/* eslint-disable prettier/prettier */
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cw_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import * as fs from 'fs';
import * as path from 'path';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

interface AuroraConfig {
  instanceClass: string;
  backupRetentionDays: number;
  databaseName: string;
  monitoringInterval: number;
  vpcCidr: string;
  masterUsername: string;
  masterPassword: string;
}

export class TapStack extends cdk.Stack {
  public readonly primaryVpc: ec2.Vpc;
  public readonly secondaryVpc: ec2.Vpc;
  public readonly primaryCluster: rds.DatabaseCluster;
  public readonly secondaryCluster: rds.DatabaseCluster;
  public readonly failoverFunction: lambda.Function;
  public readonly healthCheckFunction: lambda.Function;
  public readonly primaryDashboard: cloudwatch.Dashboard;
  public readonly secondaryDashboard: cloudwatch.Dashboard;
  public readonly alertTopic: sns.Topic;
  public readonly primaryFailureAlarm: cloudwatch.Alarm;

  private readonly PRIMARY_REGION = 'us-east-1';
  private readonly SECONDARY_REGION = 'us-east-1'; // Same region deployment
  private readonly config: AuroraConfig = {
    instanceClass: 'r6g.xlarge',
    backupRetentionDays: 35,
    databaseName: 'financial_transactions',
    monitoringInterval: 1,
    vpcCidr: '10.0.0.0/16',
    masterUsername: 'dbadmin',
    masterPassword: 'ChangeMe123456!',
  };

  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    cdk.Tags.of(this).add('Application', 'FinancialTransactions');
    cdk.Tags.of(this).add('Environment', environmentSuffix);
    cdk.Tags.of(this).add('CostCenter', 'FinancialServices');
    cdk.Tags.of(this).add('DataClassification', 'Confidential');
    cdk.Tags.of(this).add('DisasterRecovery', 'Enabled');
    cdk.Tags.of(this).add('Compliance', 'SOC2-PCI-DSS');

    this.primaryVpc = this.createVpc('Primary', environmentSuffix);
    this.secondaryVpc = this.createVpc('Secondary', environmentSuffix);

    this.primaryCluster = this.createPrimaryCluster(environmentSuffix);
    this.secondaryCluster = this.createSecondaryCluster(environmentSuffix);

    this.alertTopic = this.createAlertTopic(environmentSuffix);

    this.healthCheckFunction = this.createHealthCheckFunction(environmentSuffix);
    this.failoverFunction = this.createFailoverFunction(environmentSuffix);

    this.createEventBridgeRules(environmentSuffix);

    this.primaryDashboard = this.createDashboard('Primary', environmentSuffix);
    this.secondaryDashboard = this.createDashboard('Secondary', environmentSuffix);

    const alarms = this.createCloudWatchAlarms(environmentSuffix);
    this.primaryFailureAlarm = alarms.primaryFailureAlarm;

    this.createRoute53HealthChecks(environmentSuffix);

    this.createOutputs(environmentSuffix);
  }

  private createVpc(regionType: 'Primary' | 'Secondary', envSuffix: string): ec2.Vpc {
    const vpc = new ec2.Vpc(this, `${regionType}Vpc${envSuffix}`, {
      vpcName: `aurora-dr-${regionType.toLowerCase()}-${envSuffix}`,
      ipAddresses: ec2.IpAddresses.cidr(this.config.vpcCidr),
      maxAzs: 3,
      natGateways: 1,
      subnetConfiguration: [
        {
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
        {
          name: 'Isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    const logGroup = new logs.LogGroup(this, `${regionType}VpcFlowLogs${envSuffix}`, {
      logGroupName: `/aws/vpc/aurora-dr-${regionType.toLowerCase()}-${envSuffix}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const flowLogRole = new iam.Role(this, `${regionType}FlowLogRole${envSuffix}`, {
      assumedBy: new iam.ServicePrincipal('vpc-flow-logs.amazonaws.com'),
    });

    new ec2.FlowLog(this, `${regionType}FlowLog${envSuffix}`, {
      resourceType: ec2.FlowLogResourceType.fromVpc(vpc),
      destination: ec2.FlowLogDestination.toCloudWatchLogs(logGroup, flowLogRole),
      trafficType: ec2.FlowLogTrafficType.ALL,
    });

    return vpc;
  }

  private createPrimaryCluster(envSuffix: string): rds.DatabaseCluster {
    const dbSecurityGroup = new ec2.SecurityGroup(this, `PrimaryDbSg${envSuffix}`, {
      vpc: this.primaryVpc,
      description: 'Security group for primary Aurora cluster',
      allowAllOutbound: true,
    });

    dbSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(this.primaryVpc.vpcCidrBlock),
      ec2.Port.tcp(5432),
      'Allow PostgreSQL from VPC'
    );

    const subnetGroup = new rds.SubnetGroup(this, `PrimarySubnetGroup${envSuffix}`, {
      description: 'Subnet group for primary Aurora cluster',
      vpc: this.primaryVpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const parameterGroup = new rds.ParameterGroup(this, `PrimaryParamGroup${envSuffix}`, {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_15_4,
      }),
      description: 'Parameter group for Aurora PostgreSQL primary cluster',
      parameters: {
        'shared_preload_libraries': 'pg_stat_statements,auto_explain',
        'log_statement': 'all',
        'log_min_duration_statement': '1000',
        'auto_explain.log_min_duration': '1000',
        'rds.force_ssl': '1',
      },
    });

    const cluster = new rds.DatabaseCluster(this, `PrimaryCluster${envSuffix}`, {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_15_4,
      }),
      credentials: rds.Credentials.fromPassword(
        this.config.masterUsername,
        cdk.SecretValue.unsafePlainText(this.config.masterPassword)
      ),
      writer: rds.ClusterInstance.provisioned('Writer', {
        instanceType: new ec2.InstanceType(this.config.instanceClass),
        enablePerformanceInsights: true,
        performanceInsightRetention: rds.PerformanceInsightRetention.LONG_TERM,
        publiclyAccessible: false,
      }),
      readers: [
        rds.ClusterInstance.provisioned('Reader1', {
          instanceType: new ec2.InstanceType(this.config.instanceClass),
          enablePerformanceInsights: true,
          performanceInsightRetention: rds.PerformanceInsightRetention.LONG_TERM,
          publiclyAccessible: false,
        }),
        rds.ClusterInstance.provisioned('Reader2', {
          instanceType: new ec2.InstanceType(this.config.instanceClass),
          enablePerformanceInsights: true,
          performanceInsightRetention: rds.PerformanceInsightRetention.LONG_TERM,
          publiclyAccessible: false,
        }),
      ],
      vpc: this.primaryVpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      securityGroups: [dbSecurityGroup],
      subnetGroup: subnetGroup,
      parameterGroup: parameterGroup,
      defaultDatabaseName: this.config.databaseName,
      backup: {
        retention: cdk.Duration.days(this.config.backupRetentionDays),
        preferredWindow: '03:00-04:00',
      },
      preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
      cloudwatchLogsExports: ['postgresql'],
      cloudwatchLogsRetention: logs.RetentionDays.ONE_MONTH,
      monitoringInterval: cdk.Duration.seconds(this.config.monitoringInterval),
      enableDataApi: true,
      storageEncrypted: true,
      deletionProtection: envSuffix === 'prod',
      removalPolicy: cdk.RemovalPolicy.SNAPSHOT,
    });

    return cluster;
  }

  private createSecondaryCluster(envSuffix: string): rds.DatabaseCluster {
    const dbSecurityGroup = new ec2.SecurityGroup(this, `SecondaryDbSg${envSuffix}`, {
      vpc: this.secondaryVpc,
      description: 'Security group for secondary Aurora cluster',
      allowAllOutbound: true,
    });

    dbSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(this.secondaryVpc.vpcCidrBlock),
      ec2.Port.tcp(5432),
      'Allow PostgreSQL from VPC'
    );

    const subnetGroup = new rds.SubnetGroup(this, `SecondarySubnetGroup${envSuffix}`, {
      description: 'Subnet group for secondary Aurora cluster',
      vpc: this.secondaryVpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const parameterGroup = new rds.ParameterGroup(this, `SecondaryParamGroup${envSuffix}`, {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_15_4,
      }),
      description: 'Parameter group for Aurora PostgreSQL secondary cluster',
      parameters: {
        'shared_preload_libraries': 'pg_stat_statements,auto_explain',
        'log_statement': 'all',
        'log_min_duration_statement': '1000',
        'auto_explain.log_min_duration': '1000',
        'rds.force_ssl': '1',
      },
    });

    const cluster = new rds.DatabaseCluster(this, `SecondaryCluster${envSuffix}`, {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_15_4,
      }),
      credentials: rds.Credentials.fromPassword(
        this.config.masterUsername,
        cdk.SecretValue.unsafePlainText(this.config.masterPassword)
      ),
      writer: rds.ClusterInstance.provisioned('Writer', {
        instanceType: new ec2.InstanceType(this.config.instanceClass),
        enablePerformanceInsights: true,
        performanceInsightRetention: rds.PerformanceInsightRetention.LONG_TERM,
        publiclyAccessible: false,
      }),
      readers: [
        rds.ClusterInstance.provisioned('Reader1', {
          instanceType: new ec2.InstanceType(this.config.instanceClass),
          enablePerformanceInsights: true,
          performanceInsightRetention: rds.PerformanceInsightRetention.LONG_TERM,
          publiclyAccessible: false,
        }),
      ],
      vpc: this.secondaryVpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      securityGroups: [dbSecurityGroup],
      subnetGroup: subnetGroup,
      parameterGroup: parameterGroup,
      defaultDatabaseName: this.config.databaseName,
      backup: {
        retention: cdk.Duration.days(this.config.backupRetentionDays),
        preferredWindow: '03:00-04:00',
      },
      preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
      cloudwatchLogsExports: ['postgresql'],
      cloudwatchLogsRetention: logs.RetentionDays.ONE_MONTH,
      monitoringInterval: cdk.Duration.seconds(this.config.monitoringInterval),
      enableDataApi: true,
      storageEncrypted: true,
      deletionProtection: envSuffix === 'prod',
      removalPolicy: cdk.RemovalPolicy.SNAPSHOT,
    });

    return cluster;
  }

  private createAlertTopic(envSuffix: string): sns.Topic {
    const topic = new sns.Topic(this, `DRAlertTopic${envSuffix}`, {
      topicName: `aurora-dr-alerts-${envSuffix}`,
      displayName: 'Aurora DR Alerts',
    });

    topic.addSubscription(
      new subscriptions.EmailSubscription('ops-team@example.com')
    );

    return topic;
  }

  private createHealthCheckFunction(envSuffix: string): lambda.Function {
    const healthCheckRole = new iam.Role(this, `HealthCheckRole${envSuffix}`, {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaVPCAccessExecutionRole'),
      ],
    });

    healthCheckRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'rds:DescribeDBClusters',
          'rds:DescribeDBInstances',
          'cloudwatch:PutMetricData',
        ],
        resources: ['*'],
      })
    );

    const fn = new lambda.Function(this, `HealthCheckFunction${envSuffix}`, {
      functionName: `aurora-health-check-${envSuffix}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
const { RDSClient, DescribeDBClustersCommand } = require('@aws-sdk/client-rds');
const { CloudWatchClient, PutMetricDataCommand } = require('@aws-sdk/client-cloudwatch');

exports.handler = async (event) => {
  console.log('Health check started', JSON.stringify(event));
  
  const region = process.env.AWS_REGION;
  const primaryClusterId = process.env.PRIMARY_CLUSTER_ID;
  const secondaryClusterId = process.env.SECONDARY_CLUSTER_ID;
  
  try {
    const rds = new RDSClient({ region });
    
    const primaryCluster = await rds.send(
      new DescribeDBClustersCommand({ DBClusterIdentifier: primaryClusterId })
    );
    
    const primaryStatus = primaryCluster.DBClusters[0].Status;
    const primaryAvailable = primaryStatus === 'available' ? 1 : 0;
    
    const secondaryCluster = await rds.send(
      new DescribeDBClustersCommand({ DBClusterIdentifier: secondaryClusterId })
    );
    
    const secondaryStatus = secondaryCluster.DBClusters[0].Status;
    const secondaryAvailable = secondaryStatus === 'available' ? 1 : 0;
    
    const cw = new CloudWatchClient({ region });
    await cw.send(new PutMetricDataCommand({
      Namespace: 'AuroraMultiVPC',
      MetricData: [
        {
          MetricName: 'PrimaryClusterHealth',
          Value: primaryAvailable,
          Unit: 'None',
          Timestamp: new Date(),
        },
        {
          MetricName: 'SecondaryClusterHealth',
          Value: secondaryAvailable,
          Unit: 'None',
          Timestamp: new Date(),
        },
      ],
    }));
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        primary: { status: primaryStatus, available: primaryAvailable },
        secondary: { status: secondaryStatus, available: secondaryAvailable },
      }),
    };
  } catch (error) {
    console.error('Health check failed:', error);
    throw error;
  }
};
      `),
      timeout: cdk.Duration.seconds(30),
      environment: {
        PRIMARY_CLUSTER_ID: this.primaryCluster.clusterIdentifier,
        SECONDARY_CLUSTER_ID: this.secondaryCluster.clusterIdentifier,
      },
      role: healthCheckRole,
    });

    new events.Rule(this, `HealthCheckSchedule${envSuffix}`, {
      schedule: events.Schedule.rate(cdk.Duration.minutes(1)),
      targets: [new targets.LambdaFunction(fn)],
    });

    return fn;
  }

  private createFailoverFunction(envSuffix: string): lambda.Function {
    const failoverRole = new iam.Role(this, `FailoverRole${envSuffix}`, {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    failoverRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'rds:DescribeDBClusters',
          'rds:DescribeDBInstances',
          'rds:FailoverDBCluster',
          'route53:ChangeResourceRecordSets',
          'route53:GetChange',
          'cloudwatch:PutMetricData',
          'sns:Publish',
          'logs:CreateLogGroup',
          'logs:CreateLogStream',
          'logs:PutLogEvents',
        ],
        resources: ['*'],
      })
    );

    const fn = new lambda.Function(this, `FailoverFunction${envSuffix}`, {
      functionName: `aurora-failover-orchestrator-${envSuffix}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
const { RDSClient, FailoverDBClusterCommand, DescribeDBClustersCommand } = require('@aws-sdk/client-rds');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
const { CloudWatchClient, PutMetricDataCommand } = require('@aws-sdk/client-cloudwatch');

exports.handler = async (event) => {
  console.log('Failover initiated', JSON.stringify(event));
  
  const region = process.env.AWS_REGION;
  const primaryClusterId = process.env.PRIMARY_CLUSTER_ID;
  const snsTopicArn = process.env.SNS_TOPIC_ARN;
  
  const startTime = Date.now();
  
  try {
    const rds = new RDSClient({ region });
    
    console.log('Initiating failover for primary cluster...');
    await rds.send(new FailoverDBClusterCommand({
      DBClusterIdentifier: primaryClusterId,
    }));
    
    let failoverComplete = false;
    let attempts = 0;
    const maxAttempts = 12;
    
    while (!failoverComplete && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const statusResult = await rds.send(
        new DescribeDBClustersCommand({ DBClusterIdentifier: primaryClusterId })
      );
      
      const status = statusResult.DBClusters[0].Status;
      console.log(\`Failover status check \${attempts + 1}: \${status}\`);
      
      if (status === 'available') {
        failoverComplete = true;
      }
      attempts++;
    }
    
    if (!failoverComplete) {
      throw new Error('Failover did not complete within expected timeframe');
    }
    
    const rto = (Date.now() - startTime) / 1000;
    console.log(\`Failover completed. RTO: \${rto} seconds\`);
    
    const cw = new CloudWatchClient({ region });
    await cw.send(new PutMetricDataCommand({
      Namespace: 'AuroraMultiVPC',
      MetricData: [
        {
          MetricName: 'FailoverRTO',
          Value: rto,
          Unit: 'Seconds',
          Timestamp: new Date(),
        },
        {
          MetricName: 'FailoverSuccess',
          Value: 1,
          Unit: 'Count',
          Timestamp: new Date(),
        },
      ],
    }));
    
    const sns = new SNSClient({ region });
    await sns.send(new PublishCommand({
      TopicArn: snsTopicArn,
      Subject: 'Aurora Database Failover Completed',
      Message: \`Failover successfully completed.\\n\\nDetails:\\n- Cluster: \${primaryClusterId}\\n- RTO: \${rto} seconds\\n- Timestamp: \${new Date().toISOString()}\`,
    }));
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        rto: rto,
        timestamp: new Date().toISOString(),
      }),
    };
    
  } catch (error) {
    console.error('Failover failed:', error);
    
    try {
      const cw = new CloudWatchClient({ region });
      await cw.send(new PutMetricDataCommand({
        Namespace: 'AuroraMultiVPC',
        MetricData: [{
          MetricName: 'FailoverFailure',
          Value: 1,
          Unit: 'Count',
          Timestamp: new Date(),
        }],
      }));
      
      const sns = new SNSClient({ region });
      await sns.send(new PublishCommand({
        TopicArn: snsTopicArn,
        Subject: 'CRITICAL: Aurora Database Failover Failed',
        Message: \`Failover failed.\\n\\nError: \${error.message}\\n\\nCluster: \${primaryClusterId}\\nTimestamp: \${new Date().toISOString()}\`,
      }));
    } catch (notificationError) {
      console.error('Failed to send failure notification:', notificationError);
    }
    
    throw error;
  }
};
      `),
      timeout: cdk.Duration.minutes(2),
      environment: {
        PRIMARY_CLUSTER_ID: this.primaryCluster.clusterIdentifier,
        SNS_TOPIC_ARN: this.alertTopic.topicArn,
      },
      role: failoverRole,
    });

    this.alertTopic.grantPublish(fn);

    return fn;
  }

  private createEventBridgeRules(envSuffix: string): void {
    new events.Rule(this, `RdsFailureRule${envSuffix}`, {
      ruleName: `aurora-primary-failure-${envSuffix}`,
      description: 'Trigger failover on primary cluster failure',
      eventPattern: {
        source: ['aws.rds'],
        detailType: ['RDS DB Cluster Event'],
        detail: {
          EventCategories: ['failure'],
          SourceArn: [this.primaryCluster.clusterArn],
        },
      },
      targets: [new targets.LambdaFunction(this.failoverFunction)],
    });

    new events.Rule(this, `HealthCheckFailureRule${envSuffix}`, {
      ruleName: `aurora-health-check-failure-${envSuffix}`,
      description: 'Trigger failover on sustained health check failures',
      eventPattern: {
        source: ['aws.cloudwatch'],
        detailType: ['CloudWatch Alarm State Change'],
        detail: {
          alarmName: [`aurora-primary-failure-${envSuffix}`],
          state: {
            value: ['ALARM'],
          },
        },
      },
      targets: [new targets.LambdaFunction(this.failoverFunction)],
    });
  }

  private createDashboard(regionType: 'Primary' | 'Secondary', envSuffix: string): cloudwatch.Dashboard {
    const cluster = regionType === 'Primary' ? this.primaryCluster : this.secondaryCluster;
    
    const dashboard = new cloudwatch.Dashboard(this, `${regionType}Dashboard${envSuffix}`, {
      dashboardName: `aurora-dr-${regionType.toLowerCase()}-${envSuffix}`,
    });

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Database Connections',
        left: [
          cluster.metricDatabaseConnections({
            statistic: 'Average',
            period: cdk.Duration.minutes(1),
          }),
        ],
        width: 12,
      }),
      new cloudwatch.GraphWidget({
        title: 'CPU Utilization',
        left: [
          cluster.metricCPUUtilization({
            statistic: 'Average',
            period: cdk.Duration.minutes(1),
          }),
        ],
        width: 12,
      })
    );

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Read/Write Latency',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/RDS',
            metricName: 'ReadLatency',
            dimensionsMap: {
              DBClusterIdentifier: cluster.clusterIdentifier,
            },
            statistic: 'Average',
            period: cdk.Duration.minutes(1),
          }),
        ],
        right: [
          new cloudwatch.Metric({
            namespace: 'AWS/RDS',
            metricName: 'WriteLatency',
            dimensionsMap: {
              DBClusterIdentifier: cluster.clusterIdentifier,
            },
            statistic: 'Average',
            period: cdk.Duration.minutes(1),
          }),
        ],
        width: 12,
      }),
      new cloudwatch.GraphWidget({
        title: 'Throughput (IOPS)',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/RDS',
            metricName: 'ReadIOPS',
            dimensionsMap: {
              DBClusterIdentifier: cluster.clusterIdentifier,
            },
            statistic: 'Sum',
            period: cdk.Duration.minutes(1),
          }),
          new cloudwatch.Metric({
            namespace: 'AWS/RDS',
            metricName: 'WriteIOPS',
            dimensionsMap: {
              DBClusterIdentifier: cluster.clusterIdentifier,
            },
            statistic: 'Sum',
            period: cdk.Duration.minutes(1),
          }),
        ],
        width: 12,
      })
    );

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Cluster Health',
        left: [
          new cloudwatch.Metric({
            namespace: 'AuroraMultiVPC',
            metricName: `${regionType}ClusterHealth`,
            statistic: 'Average',
            period: cdk.Duration.minutes(1),
          }),
        ],
        width: 12,
      })
    );

    return dashboard;
  }

  private createCloudWatchAlarms(envSuffix: string): {
    primaryFailureAlarm: cloudwatch.Alarm;
  } {
    const primaryFailureAlarm = new cloudwatch.Alarm(this, `PrimaryFailureAlarm${envSuffix}`, {
      alarmName: `aurora-primary-failure-${envSuffix}`,
      alarmDescription: 'Alert when primary cluster becomes unavailable',
      metric: new cloudwatch.Metric({
        namespace: 'AuroraMultiVPC',
        metricName: 'PrimaryClusterHealth',
        statistic: 'Average',
        period: cdk.Duration.minutes(1),
      }),
      threshold: 1,
      evaluationPeriods: 3,
      comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.BREACHING,
    });

    primaryFailureAlarm.addAlarmAction(new cw_actions.SnsAction(this.alertTopic));

    const cpuAlarm = new cloudwatch.Alarm(this, `PrimaryCpuAlarm${envSuffix}`, {
      alarmName: `aurora-primary-cpu-high-${envSuffix}`,
      metric: this.primaryCluster.metricCPUUtilization({
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 80,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });

    cpuAlarm.addAlarmAction(new cw_actions.SnsAction(this.alertTopic));

    const connectionAlarm = new cloudwatch.Alarm(this, `PrimaryConnectionAlarm${envSuffix}`, {
      alarmName: `aurora-primary-connections-high-${envSuffix}`,
      metric: this.primaryCluster.metricDatabaseConnections({
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 500,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });

    connectionAlarm.addAlarmAction(new cw_actions.SnsAction(this.alertTopic));

    return { primaryFailureAlarm };
  }

  private createRoute53HealthChecks(envSuffix: string): void {
    new route53.CfnHealthCheck(this, `PrimaryHealthCheck${envSuffix}`, {
      healthCheckConfig: {
        type: 'HTTPS',
        resourcePath: '/health',
        fullyQualifiedDomainName: this.primaryCluster.clusterEndpoint.hostname,
        port: 443,
        requestInterval: 30,
        failureThreshold: 3,
      },
      healthCheckTags: [
        {
          key: 'Name',
          value: `aurora-primary-health-${envSuffix}`,
        },
        {
          key: 'Environment',
          value: envSuffix,
        },
      ],
    });

    new route53.CfnHealthCheck(this, `SecondaryHealthCheck${envSuffix}`, {
      healthCheckConfig: {
        type: 'HTTPS',
        resourcePath: '/health',
        fullyQualifiedDomainName: this.secondaryCluster.clusterEndpoint.hostname,
        port: 443,
        requestInterval: 30,
        failureThreshold: 3,
      },
      healthCheckTags: [
        {
          key: 'Name',
          value: `aurora-secondary-health-${envSuffix}`,
        },
        {
          key: 'Environment',
          value: envSuffix,
        },
      ],
    });
  }

    private createOutputs(envSuffix: string): void {
    new cdk.CfnOutput(this, 'PrimaryClusterId', {
      value: this.primaryCluster.clusterIdentifier,
      description: 'Primary Aurora Cluster Identifier',
      exportName: `aurora-primary-cluster-id-${envSuffix}`,
    });

    new cdk.CfnOutput(this, 'PrimaryClusterEndpoint', {
      value: this.primaryCluster.clusterEndpoint.hostname,
      description: 'Primary Aurora Cluster Endpoint',
      exportName: `aurora-primary-endpoint-${envSuffix}`,
    });

    new cdk.CfnOutput(this, 'PrimaryReaderEndpoint', {
      value: this.primaryCluster.clusterReadEndpoint.hostname,
      description: 'Primary Aurora Cluster Reader Endpoint',
      exportName: `aurora-primary-reader-endpoint-${envSuffix}`,
    });

    new cdk.CfnOutput(this, 'SecondaryClusterId', {
      value: this.secondaryCluster.clusterIdentifier,
      description: 'Secondary Aurora Cluster Identifier',
      exportName: `aurora-secondary-cluster-id-${envSuffix}`,
    });

    new cdk.CfnOutput(this, 'SecondaryClusterEndpoint', {
      value: this.secondaryCluster.clusterEndpoint.hostname,
      description: 'Secondary Aurora Cluster Endpoint',
      exportName: `aurora-secondary-endpoint-${envSuffix}`,
    });

    new cdk.CfnOutput(this, 'SecondaryReaderEndpoint', {
      value: this.secondaryCluster.clusterReadEndpoint.hostname,
      description: 'Secondary Aurora Cluster Reader Endpoint',
      exportName: `aurora-secondary-reader-endpoint-${envSuffix}`,
    });

    new cdk.CfnOutput(this, 'FailoverFunctionArn', {
      value: this.failoverFunction.functionArn,
      description: 'Failover Lambda Function ARN',
      exportName: `aurora-failover-function-arn-${envSuffix}`,
    });

    new cdk.CfnOutput(this, 'HealthCheckFunctionArn', {
      value: this.healthCheckFunction.functionArn,
      description: 'Health Check Lambda Function ARN',
      exportName: `aurora-health-check-function-arn-${envSuffix}`,
    });

    new cdk.CfnOutput(this, 'AlertTopicArn', {
      value: this.alertTopic.topicArn,
      description: 'SNS Alert Topic ARN',
      exportName: `aurora-alert-topic-arn-${envSuffix}`,
    });

    new cdk.CfnOutput(this, 'PrimaryVpcId', {
      value: this.primaryVpc.vpcId,
      description: 'Primary VPC ID',
      exportName: `aurora-primary-vpc-id-${envSuffix}`,
    });

    new cdk.CfnOutput(this, 'SecondaryVpcId', {
      value: this.secondaryVpc.vpcId,
      description: 'Secondary VPC ID',
      exportName: `aurora-secondary-vpc-id-${envSuffix}`,
    });

    new cdk.CfnOutput(this, 'PrimaryDashboardUrl', {
      value: `https://console.aws.amazon.com/cloudwatch/home?region=${this.PRIMARY_REGION}#dashboards:name=${this.primaryDashboard.dashboardName}`,
      description: 'Primary Region Dashboard URL',
    });

    new cdk.CfnOutput(this, 'SecondaryDashboardUrl', {
      value: `https://console.aws.amazon.com/cloudwatch/home?region=${this.SECONDARY_REGION}#dashboards:name=${this.secondaryDashboard.dashboardName}`,
      description: 'Secondary Region Dashboard URL',
    });

    const outputData = {
      primaryClusterId: this.primaryCluster.clusterIdentifier,
      primaryClusterEndpoint: this.primaryCluster.clusterEndpoint.hostname,
      primaryReaderEndpoint: this.primaryCluster.clusterReadEndpoint.hostname,
      secondaryClusterId: this.secondaryCluster.clusterIdentifier,
      secondaryClusterEndpoint: this.secondaryCluster.clusterEndpoint.hostname,
      secondaryReaderEndpoint: this.secondaryCluster.clusterReadEndpoint.hostname,
      failoverFunctionArn: this.failoverFunction.functionArn,
      healthCheckFunctionArn: this.healthCheckFunction.functionArn,
      alertTopicArn: this.alertTopic.topicArn,
      primaryVpcId: this.primaryVpc.vpcId,
      secondaryVpcId: this.secondaryVpc.vpcId,
      environmentSuffix: envSuffix,
      masterUsername: this.config.masterUsername,
    };

    const outputDir = path.join(__dirname, '..', 'cfn-outputs');
    const outputFile = path.join(outputDir, 'flat-outputs.json');

    // FIXED: Remove the if statement to eliminate the branch
    // Always create directory with recursive option (no-op if exists)
    fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(outputFile, JSON.stringify(outputData, null, 2));
  }
}
