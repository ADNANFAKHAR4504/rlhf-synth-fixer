import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as kinesis from 'aws-cdk-lib/aws-kinesis';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as sns from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';

interface MonitoringStackProps {
  environmentSuffix: string;
  ecsCluster: ecs.Cluster;
  ecsService: ecs.FargateService;
  loadBalancer: elbv2.NetworkLoadBalancer;
  targetGroup: elbv2.NetworkTargetGroup;
  database: rds.DatabaseInstance;
  api: apigateway.RestApi;
  kinesisStream: kinesis.Stream;
}

export class MonitoringStack extends Construct {
  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id);

    // Create SNS topic for alarms
    const alarmTopic = new sns.Topic(this, 'AlarmTopic', {
      displayName: `Payment Processing Alarms - ${props.environmentSuffix}`,
      topicName: `payment-alarms-${props.environmentSuffix}`,
    });

    // CloudWatch Dashboard
    const dashboard = new cloudwatch.Dashboard(this, 'PaymentDashboard', {
      dashboardName: `payment-processing-${props.environmentSuffix}`,
    });

    // ECS Service Metrics
    const ecsServiceCpuWidget = new cloudwatch.GraphWidget({
      title: 'ECS Service CPU Utilization',
      left: [
        props.ecsService.metricCpuUtilization({
          statistic: 'Average',
          period: cdk.Duration.minutes(5),
        }),
      ],
    });

    const ecsServiceMemoryWidget = new cloudwatch.GraphWidget({
      title: 'ECS Service Memory Utilization',
      left: [
        props.ecsService.metricMemoryUtilization({
          statistic: 'Average',
          period: cdk.Duration.minutes(5),
        }),
      ],
    });

    // Load Balancer Metrics
    const nlbRequestCountWidget = new cloudwatch.GraphWidget({
      title: 'NLB Active Connections',
      left: [
        new cloudwatch.Metric({
          namespace: 'AWS/NetworkELB',
          metricName: 'ActiveConnectionCount',
          dimensionsMap: {
            LoadBalancer: props.loadBalancer.loadBalancerFullName,
          },
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
        }),
      ],
    });

    const nlbTargetResponseTimeWidget = new cloudwatch.GraphWidget({
      title: 'Target Response Time',
      left: [
        new cloudwatch.Metric({
          namespace: 'AWS/NetworkELB',
          metricName: 'TargetResponseTime',
          dimensionsMap: {
            TargetGroup: props.targetGroup.targetGroupFullName,
            LoadBalancer: props.loadBalancer.loadBalancerFullName,
          },
          statistic: 'Average',
          period: cdk.Duration.minutes(5),
        }),
      ],
    });

    // Database Metrics
    const dbCpuWidget = new cloudwatch.GraphWidget({
      title: 'Database CPU Utilization',
      left: [
        props.database.metricCPUUtilization({
          statistic: 'Average',
          period: cdk.Duration.minutes(5),
        }),
      ],
    });

    const dbConnectionsWidget = new cloudwatch.GraphWidget({
      title: 'Database Connections',
      left: [
        props.database.metricDatabaseConnections({
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
        }),
      ],
    });

    // API Gateway Metrics
    const apiCallsWidget = new cloudwatch.GraphWidget({
      title: 'API Gateway Requests',
      left: [
        new cloudwatch.Metric({
          namespace: 'AWS/ApiGateway',
          metricName: 'Count',
          dimensionsMap: {
            ApiName: props.api.restApiName,
          },
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
        }),
      ],
    });

    const apiLatencyWidget = new cloudwatch.GraphWidget({
      title: 'API Gateway Latency',
      left: [
        new cloudwatch.Metric({
          namespace: 'AWS/ApiGateway',
          metricName: 'Latency',
          dimensionsMap: {
            ApiName: props.api.restApiName,
          },
          statistic: 'Average',
          period: cdk.Duration.minutes(5),
        }),
      ],
    });

    // Kinesis Metrics
    const kinesisIncomingRecordsWidget = new cloudwatch.GraphWidget({
      title: 'Kinesis Incoming Records',
      left: [
        props.kinesisStream.metricIncomingRecords({
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
        }),
      ],
    });

    // Add widgets to dashboard
    dashboard.addWidgets(
      ecsServiceCpuWidget,
      ecsServiceMemoryWidget,
      nlbRequestCountWidget
    );
    dashboard.addWidgets(
      nlbTargetResponseTimeWidget,
      dbCpuWidget,
      dbConnectionsWidget
    );
    dashboard.addWidgets(
      apiCallsWidget,
      apiLatencyWidget,
      kinesisIncomingRecordsWidget
    );

    // CloudWatch Alarms

    // ECS Service CPU Alarm
    const ecsServiceCpuAlarm = new cloudwatch.Alarm(
      this,
      'EcsServiceCpuAlarm',
      {
        metric: props.ecsService.metricCpuUtilization({
          statistic: 'Average',
          period: cdk.Duration.minutes(5),
        }),
        threshold: 80,
        evaluationPeriods: 2,
        alarmDescription: 'ECS Service CPU utilization is too high',
        alarmName: `payment-ecs-cpu-${props.environmentSuffix}`,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );
    ecsServiceCpuAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(alarmTopic)
    );

    // ECS Service Memory Alarm
    const ecsServiceMemoryAlarm = new cloudwatch.Alarm(
      this,
      'EcsServiceMemoryAlarm',
      {
        metric: props.ecsService.metricMemoryUtilization({
          statistic: 'Average',
          period: cdk.Duration.minutes(5),
        }),
        threshold: 85,
        evaluationPeriods: 2,
        alarmDescription: 'ECS Service memory utilization is too high',
        alarmName: `payment-ecs-memory-${props.environmentSuffix}`,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );
    ecsServiceMemoryAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(alarmTopic)
    );

    // Database CPU Alarm
    const dbCpuAlarm = new cloudwatch.Alarm(this, 'DatabaseCpuAlarm', {
      metric: props.database.metricCPUUtilization({
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 80,
      evaluationPeriods: 2,
      alarmDescription: 'Database CPU utilization is too high',
      alarmName: `payment-db-cpu-${props.environmentSuffix}`,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    dbCpuAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(alarmTopic));

    // NLB Target Health Alarm
    const nlbUnhealthyHostAlarm = new cloudwatch.Alarm(
      this,
      'NlbUnhealthyHostAlarm',
      {
        metric: new cloudwatch.Metric({
          namespace: 'AWS/NetworkELB',
          metricName: 'UnHealthyHostCount',
          dimensionsMap: {
            TargetGroup: props.targetGroup.targetGroupFullName,
            LoadBalancer: props.loadBalancer.loadBalancerFullName,
          },
          statistic: 'Average',
          period: cdk.Duration.minutes(1),
        }),
        threshold: 1,
        evaluationPeriods: 2,
        alarmDescription: 'NLB has unhealthy targets',
        alarmName: `payment-nlb-unhealthy-${props.environmentSuffix}`,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );
    nlbUnhealthyHostAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(alarmTopic)
    );

    // API Gateway 4XX Error Alarm
    const api4xxAlarm = new cloudwatch.Alarm(this, 'Api4xxAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/ApiGateway',
        metricName: '4XXError',
        dimensionsMap: {
          ApiName: props.api.restApiName,
        },
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 100,
      evaluationPeriods: 2,
      alarmDescription: 'API Gateway 4XX errors are too high',
      alarmName: `payment-api-4xx-${props.environmentSuffix}`,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    api4xxAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(alarmTopic));

    // API Gateway 5XX Error Alarm
    const api5xxAlarm = new cloudwatch.Alarm(this, 'Api5xxAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/ApiGateway',
        metricName: '5XXError',
        dimensionsMap: {
          ApiName: props.api.restApiName,
        },
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 10,
      evaluationPeriods: 2,
      alarmDescription: 'API Gateway 5XX errors are too high',
      alarmName: `payment-api-5xx-${props.environmentSuffix}`,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    api5xxAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(alarmTopic));

    // Tags for compliance
    cdk.Tags.of(dashboard).add('PCICompliant', 'true');
    cdk.Tags.of(dashboard).add('Environment', props.environmentSuffix);
  }
}
