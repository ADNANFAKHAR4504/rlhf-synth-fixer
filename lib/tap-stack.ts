import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { AlarmsConstruct } from './constructs/alarms-construct';
import { AlertingConstruct } from './constructs/alerting-construct';
import { AuditConstruct } from './constructs/audit-construct';
import { DashboardConstruct } from './constructs/dashboard-construct';
import { SchedulingConstruct } from './constructs/scheduling-construct';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Create audit infrastructure first (DynamoDB table for logging)
    const audit = new AuditConstruct(this, 'Audit', {
      environmentSuffix,
    });

    // Create alerting infrastructure (SNS topics and Lambda logger)
    const alerting = new AlertingConstruct(this, 'Alerting', {
      environmentSuffix,
      emailAddresses: ['ops-team@example.com'], // Default email
      auditTable: audit.table,
    });

    // Create alarms for CloudWatch metrics
    const alarms = new AlarmsConstruct(this, 'Alarms', {
      environmentSuffix,
      alarmTopic: alerting.alarmTopic,
    });

    // Create dashboard for monitoring visualization
    const dashboard = new DashboardConstruct(this, 'Dashboard', {
      environmentSuffix,
      alarms: alarms.getAllAlarms(),
    });

    // Create EventBridge scheduling for automated reports and health checks
    new SchedulingConstruct(this, 'Scheduling', {
      environmentSuffix,
      reportTopic: alerting.reportTopic,
      auditTable: audit.table,
    });

    // Main stack outputs
    new cdk.CfnOutput(this, 'DashboardURL', {
      value: `https://console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${dashboard.dashboard.dashboardName}`,
      description: 'CloudWatch Dashboard URL',
      exportName: `${this.stackName}-DashboardURL-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'MonitoringSystemStatus', {
      value: 'Active',
      description: 'Status of the monitoring system',
      exportName: `${this.stackName}-MonitoringSystemStatus-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'TotalAlarmsCreated', {
      value: alarms.getAllAlarms().length.toString(),
      description: 'Total number of CloudWatch alarms created',
      exportName: `${this.stackName}-TotalAlarmsCreated-${environmentSuffix}`,
    });

    // Add tags to all resources
    cdk.Tags.of(this).add('Project', 'CloudWatch-Monitoring');
    cdk.Tags.of(this).add('Environment', environmentSuffix);
    cdk.Tags.of(this).add('ManagedBy', 'CDK');
  }
}
