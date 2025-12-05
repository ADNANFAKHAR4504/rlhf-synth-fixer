import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as path from 'path';

interface LambdaAnalysisArgs {
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
  analysisSchedule: string;
  reportSchedule: string;
  snsTopicArns: pulumi.Output<{
    critical: string;
    warning: string;
    info: string;
  }>;
  lambdaRoleArn: pulumi.Output<string>;
  monitoringRegions: string[];
}

export function createLambdaAnalysisFunctions(
  args: LambdaAnalysisArgs,
  opts?: pulumi.ComponentResourceOptions
) {
  // Lambda function for hourly metric analysis
  const metricAnalysisFunction = new aws.lambda.Function(
    `infra-metric-analysis-e4-${args.environmentSuffix}`,
    {
      runtime: 'python3.11',
      handler: 'metric_analysis.handler',
      role: args.lambdaRoleArn,
      code: new pulumi.asset.AssetArchive({
        '.': new pulumi.asset.FileArchive(
          path.join(__dirname, 'lambda', 'metric-analysis')
        ),
      }),
      timeout: 300,
      memorySize: 512,
      environment: {
        variables: {
          ENVIRONMENT_SUFFIX: args.environmentSuffix,
          SNS_TOPIC_CRITICAL: args.snsTopicArns.apply(arns => arns.critical),
          SNS_TOPIC_WARNING: args.snsTopicArns.apply(arns => arns.warning),
          SNS_TOPIC_INFO: args.snsTopicArns.apply(arns => arns.info),
          THRESHOLD_PERCENT: '80',
          MONITORING_REGIONS: args.monitoringRegions.join(','),
        },
      },
      tags: args.tags,
    },
    opts
  );

  // EventBridge rule for hourly execution
  const metricAnalysisRule = new aws.cloudwatch.EventRule(
    `infrastructure-metric-analysis-schedule-e4-${args.environmentSuffix}`,
    {
      scheduleExpression: args.analysisSchedule,
      description: 'Trigger infrastructure metric analysis every hour',
      tags: args.tags,
    },
    opts
  );

  new aws.cloudwatch.EventTarget(
    `infrastructure-metric-analysis-target-e4-${args.environmentSuffix}`,
    {
      rule: metricAnalysisRule.name,
      arn: metricAnalysisFunction.arn,
    },
    opts
  );

  new aws.lambda.Permission(
    `infrastructure-metric-analysis-permission-e4-${args.environmentSuffix}`,
    {
      action: 'lambda:InvokeFunction',
      function: metricAnalysisFunction.name,
      principal: 'events.amazonaws.com',
      sourceArn: metricAnalysisRule.arn,
    },
    opts
  );

  // Lambda function for weekly health reports
  const healthReportFunction = new aws.lambda.Function(
    `infra-health-report-e4-${args.environmentSuffix}`,
    {
      runtime: 'python3.11',
      handler: 'health_report.handler',
      role: args.lambdaRoleArn,
      code: new pulumi.asset.AssetArchive({
        '.': new pulumi.asset.FileArchive(
          path.join(__dirname, 'lambda', 'health-report')
        ),
      }),
      timeout: 300,
      memorySize: 512,
      environment: {
        variables: {
          ENVIRONMENT_SUFFIX: args.environmentSuffix,
          SNS_TOPIC_INFO: args.snsTopicArns.apply(arns => arns.info),
          MONITORING_REGIONS: args.monitoringRegions.join(','),
        },
      },
      tags: args.tags,
    },
    opts
  );

  // EventBridge rule for weekly execution
  const healthReportRule = new aws.cloudwatch.EventRule(
    `infrastructure-health-report-schedule-e4-${args.environmentSuffix}`,
    {
      scheduleExpression: args.reportSchedule,
      description: 'Generate weekly infrastructure health report',
      tags: args.tags,
    },
    opts
  );

  new aws.cloudwatch.EventTarget(
    `infrastructure-health-report-target-e4-${args.environmentSuffix}`,
    {
      rule: healthReportRule.name,
      arn: healthReportFunction.arn,
    },
    opts
  );

  new aws.lambda.Permission(
    `infrastructure-health-report-permission-e4-${args.environmentSuffix}`,
    {
      action: 'lambda:InvokeFunction',
      function: healthReportFunction.name,
      principal: 'events.amazonaws.com',
      sourceArn: healthReportRule.arn,
    },
    opts
  );

  return {
    functionArns: pulumi.output([
      metricAnalysisFunction.arn,
      healthReportFunction.arn,
    ]),
    metricAnalysisFunction,
    healthReportFunction,
  };
}
