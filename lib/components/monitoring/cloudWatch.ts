import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface CloudWatchLogGroupArgs {
  name: string;
  retentionInDays?: number;
  kmsKeyId?: pulumi.Input<string>;
  tags?: Record<string, string>;
}

export interface CloudWatchLogGroupResult {
  logGroup: aws.cloudwatch.LogGroup;
  logGroupName: pulumi.Output<string>;
  logGroupArn: pulumi.Output<string>;
}

export interface CloudWatchMetricAlarmArgs {
  name: string;
  comparisonOperator: string;
  evaluationPeriods: number;
  metricName: string;
  namespace: string;
  period: number;
  statistic: string;
  threshold: number;
  alarmDescription?: string;
  alarmActions?: pulumi.Input<string>[];
  okActions?: pulumi.Input<string>[];
  treatMissingData?: string;
  datapointsToAlarm?: number;
  dimensions?: Record<string, pulumi.Input<string>>;
  tags?: Record<string, string>;
}

export interface CloudWatchMetricAlarmResult {
  alarm: aws.cloudwatch.MetricAlarm;
  alarmArn: pulumi.Output<string>;
  alarmName: pulumi.Output<string>;
}

export interface CloudWatchDashboardArgs {
  name: string;
  dashboardBody: pulumi.Input<string>;
}

export interface ApplicationLogGroupsArgs {
  name: string;
  retentionInDays?: number;
  kmsKeyId?: pulumi.Input<string>;
  tags?: Record<string, string>;
}

export interface ApplicationLogGroupsResult {
  systemLogs: CloudWatchLogGroupResult;
  securityLogs: CloudWatchLogGroupResult;
  applicationLogs: CloudWatchLogGroupResult;
  accessLogs: CloudWatchLogGroupResult;
}

export class CloudWatchLogGroupComponent extends pulumi.ComponentResource {
  public readonly logGroup: aws.cloudwatch.LogGroup;
  public readonly logGroupName: pulumi.Output<string>;
  public readonly logGroupArn: pulumi.Output<string>;

  constructor(
    name: string,
    args: CloudWatchLogGroupArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('aws:cloudwatch:CloudWatchLogGroupComponent', name, {}, opts);

    const defaultTags = {
      Name: args.name,
      Environment: pulumi.getStack(),
      ManagedBy: 'Pulumi',
      Project: 'AWS-Nova-Model-Breaking',
      ...args.tags,
    };

    this.logGroup = new aws.cloudwatch.LogGroup(
      `${name}-log-group`,
      {
        name: args.name,
        retentionInDays: args.retentionInDays || 90,
        kmsKeyId: args.kmsKeyId,
        tags: defaultTags,
      },
      { parent: this }
    );

    this.logGroupName = this.logGroup.name;
    this.logGroupArn = this.logGroup.arn;

    this.registerOutputs({
      logGroup: this.logGroup,
      logGroupName: this.logGroupName,
      logGroupArn: this.logGroupArn,
    });
  }
}

export class CloudWatchMetricAlarmComponent extends pulumi.ComponentResource {
  public readonly alarm: aws.cloudwatch.MetricAlarm;
  public readonly alarmArn: pulumi.Output<string>;
  public readonly alarmName: pulumi.Output<string>;

  constructor(
    name: string,
    args: CloudWatchMetricAlarmArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('aws:cloudwatch:CloudWatchMetricAlarmComponent', name, {}, opts);

    const defaultTags = {
      Name: args.name,
      Environment: pulumi.getStack(),
      ManagedBy: 'Pulumi',
      Project: 'AWS-Nova-Model-Breaking',
      ...args.tags,
    };

    this.alarm = new aws.cloudwatch.MetricAlarm(
      `${name}-alarm`,
      {
        name: args.name,
        comparisonOperator: args.comparisonOperator,
        evaluationPeriods: args.evaluationPeriods,
        metricName: args.metricName,
        namespace: args.namespace,
        period: args.period,
        statistic: args.statistic,
        threshold: args.threshold,
        alarmDescription:
          args.alarmDescription || `Alarm for ${args.metricName}`,
        alarmActions: args.alarmActions,
        okActions: args.okActions,
        treatMissingData: args.treatMissingData || 'breaching',
        datapointsToAlarm: args.datapointsToAlarm,
        dimensions: args.dimensions,
        tags: defaultTags,
      },
      { parent: this }
    );

    this.alarmArn = this.alarm.arn;
    this.alarmName = this.alarm.name;

    this.registerOutputs({
      alarm: this.alarm,
      alarmArn: this.alarmArn,
      alarmName: this.alarmName,
    });
  }
}

export class CloudWatchDashboardComponent extends pulumi.ComponentResource {
  public readonly dashboard: aws.cloudwatch.Dashboard;
  public readonly dashboardArn: pulumi.Output<string>;

  constructor(
    name: string,
    args: CloudWatchDashboardArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('aws:cloudwatch:CloudWatchDashboardComponent', name, {}, opts);

    this.dashboard = new aws.cloudwatch.Dashboard(
      `${name}-dashboard`,
      {
        dashboardName: args.name,
        dashboardBody: args.dashboardBody,
      },
      { parent: this }
    );

    this.dashboardArn = this.dashboard.dashboardArn;

    this.registerOutputs({
      dashboard: this.dashboard,
      dashboardArn: this.dashboardArn,
    });
  }
}

export class ApplicationLogGroupsComponent extends pulumi.ComponentResource {
  public readonly systemLogs: CloudWatchLogGroupResult;
  public readonly securityLogs: CloudWatchLogGroupResult;
  public readonly applicationLogs: CloudWatchLogGroupResult;
  public readonly accessLogs: CloudWatchLogGroupResult;

  constructor(
    name: string,
    args: ApplicationLogGroupsArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('aws:cloudwatch:ApplicationLogGroupsComponent', name, {}, opts);

    // System logs
    const systemLogsComponent = new CloudWatchLogGroupComponent(
      `${name}-system`,
      {
        name: `/aws/ec2/${args.name}/system-logs`,
        retentionInDays: args.retentionInDays || 90,
        kmsKeyId: args.kmsKeyId,
        tags: {
          ...args.tags,
          LogType: 'System',
        },
      },
      { parent: this }
    );

    this.systemLogs = {
      logGroup: systemLogsComponent.logGroup,
      logGroupName: systemLogsComponent.logGroupName,
      logGroupArn: systemLogsComponent.logGroupArn,
    };

    // Security logs
    const securityLogsComponent = new CloudWatchLogGroupComponent(
      `${name}-security`,
      {
        name: `/aws/ec2/${args.name}/security-logs`,
        retentionInDays: args.retentionInDays || 90,
        kmsKeyId: args.kmsKeyId,
        tags: {
          ...args.tags,
          LogType: 'Security',
        },
      },
      { parent: this }
    );

    this.securityLogs = {
      logGroup: securityLogsComponent.logGroup,
      logGroupName: securityLogsComponent.logGroupName,
      logGroupArn: securityLogsComponent.logGroupArn,
    };

    // Application logs
    const applicationLogsComponent = new CloudWatchLogGroupComponent(
      `${name}-application`,
      {
        name: `/aws/application/${args.name}/logs`,
        retentionInDays: args.retentionInDays || 90,
        kmsKeyId: args.kmsKeyId,
        tags: {
          ...args.tags,
          LogType: 'Application',
        },
      },
      { parent: this }
    );

    this.applicationLogs = {
      logGroup: applicationLogsComponent.logGroup,
      logGroupName: applicationLogsComponent.logGroupName,
      logGroupArn: applicationLogsComponent.logGroupArn,
    };

    // Access logs
    const accessLogsComponent = new CloudWatchLogGroupComponent(
      `${name}-access`,
      {
        name: `/aws/elasticloadbalancing/${args.name}/access-logs`,
        retentionInDays: args.retentionInDays || 90,
        kmsKeyId: args.kmsKeyId,
        tags: {
          ...args.tags,
          LogType: 'Access',
        },
      },
      { parent: this }
    );

    this.accessLogs = {
      logGroup: accessLogsComponent.logGroup,
      logGroupName: accessLogsComponent.logGroupName,
      logGroupArn: accessLogsComponent.logGroupArn,
    };

    this.registerOutputs({
      systemLogs: this.systemLogs,
      securityLogs: this.securityLogs,
      applicationLogs: this.applicationLogs,
      accessLogs: this.accessLogs,
    });
  }
}

export function createCloudWatchLogGroup(
  name: string,
  args: CloudWatchLogGroupArgs
): CloudWatchLogGroupResult {
  const logGroupComponent = new CloudWatchLogGroupComponent(name, args);
  return {
    logGroup: logGroupComponent.logGroup,
    logGroupName: logGroupComponent.logGroupName,
    logGroupArn: logGroupComponent.logGroupArn,
  };
}

export function createCloudWatchMetricAlarm(
  name: string,
  args: CloudWatchMetricAlarmArgs
): CloudWatchMetricAlarmResult {
  const alarmComponent = new CloudWatchMetricAlarmComponent(name, args);
  return {
    alarm: alarmComponent.alarm,
    alarmArn: alarmComponent.alarmArn,
    alarmName: alarmComponent.alarmName,
  };
}

export function createCloudWatchDashboard(
  name: string,
  args: CloudWatchDashboardArgs
): aws.cloudwatch.Dashboard {
  const dashboardComponent = new CloudWatchDashboardComponent(name, args);
  return dashboardComponent.dashboard;
}

export function createApplicationLogGroups(
  name: string,
  args: ApplicationLogGroupsArgs
): ApplicationLogGroupsResult {
  const appLogGroupsComponent = new ApplicationLogGroupsComponent(name, args);
  return {
    systemLogs: appLogGroupsComponent.systemLogs,
    securityLogs: appLogGroupsComponent.securityLogs,
    applicationLogs: appLogGroupsComponent.applicationLogs,
    accessLogs: appLogGroupsComponent.accessLogs,
  };
}
