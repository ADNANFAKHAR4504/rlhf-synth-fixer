import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';
import { createCloudWatchDashboards } from './cloudwatch-dashboards';
import { createLambdaAnalysisFunctions } from './lambda-analysis';
import { createCloudWatchAlarms } from './cloudwatch-alarms';
import { createSNSTopics } from './sns-topics';
import { createIAMRoles } from './iam-roles';
import { createLogsInsightsQueries } from './logs-insights';
import { createMetricFilters } from './metric-filters';

export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
  monitoringRegions?: string[];
  analysisSchedule?: string;
  reportSchedule?: string;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly dashboardUrls: pulumi.Output<string[]>;
  public readonly snsTopicArns: pulumi.Output<{
    critical: string;
    warning: string;
    info: string;
  }>;
  public readonly lambdaFunctionArns: pulumi.Output<string[]>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || { Environment: environmentSuffix };
    const monitoringRegions = args.monitoringRegions || [
      'us-east-1',
      'us-west-2',
    ];
    const analysisSchedule = args.analysisSchedule || 'rate(1 hour)';
    const reportSchedule = args.reportSchedule || 'rate(7 days)';

    // Create SNS topics for different severity levels
    const snsTopics = createSNSTopics(environmentSuffix, tags, {
      parent: this,
    });

    // Create IAM roles for Lambda functions
    const iamRoles = createIAMRoles(environmentSuffix, tags, { parent: this });

    // Create a shared application log group
    const appLogGroup = new aws.cloudwatch.LogGroup(
      `infra-app-logs-e4-${environmentSuffix}`,
      {
        name: `/infra/app-e4-${environmentSuffix}`,
        retentionInDays: 7,
        tags: tags,
      },
      { parent: this }
    );

    // Create Lambda functions for analysis
    const lambdaFunctions = createLambdaAnalysisFunctions(
      {
        environmentSuffix,
        tags,
        analysisSchedule,
        reportSchedule,
        snsTopicArns: snsTopics.topicArns,
        lambdaRoleArn: iamRoles.lambdaRoleArn,
        monitoringRegions,
      },
      { parent: this }
    );

    // Create CloudWatch dashboards
    const dashboards = createCloudWatchDashboards(
      {
        environmentSuffix,
        tags,
        monitoringRegions,
      },
      { parent: this }
    );

    // Create CloudWatch alarms
    createCloudWatchAlarms(
      {
        environmentSuffix,
        tags,
        snsTopicArns: snsTopics.topicArns,
      },
      { parent: this }
    );

    // Create CloudWatch Logs Insights queries
    createLogsInsightsQueries(environmentSuffix, appLogGroup, tags, {
      parent: this,
    });

    // Create metric filters
    createMetricFilters(environmentSuffix, appLogGroup, tags, {
      parent: this,
    });

    this.dashboardUrls = dashboards.dashboardUrls;
    this.snsTopicArns = snsTopics.topicArns;
    this.lambdaFunctionArns = lambdaFunctions.functionArns;

    this.registerOutputs({
      dashboardUrls: this.dashboardUrls,
      snsTopicArns: this.snsTopicArns,
      lambdaFunctionArns: this.lambdaFunctionArns,
      appLogGroupName: appLogGroup.name,
      lambdaRoleArn: iamRoles.lambdaRoleArn,
    });
  }
}
