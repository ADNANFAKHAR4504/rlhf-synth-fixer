import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

interface DashboardArgs {
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
  monitoringRegions: string[];
}

export function createCloudWatchDashboards(
  args: DashboardArgs,
  opts?: pulumi.ComponentResourceOptions
) {
  const dashboards: aws.cloudwatch.Dashboard[] = [];
  const dashboardUrls: pulumi.Output<string>[] = [];

  // Create a dashboard for each region
  args.monitoringRegions.forEach(region => {
    const dashboard = new aws.cloudwatch.Dashboard(
      `infra-mon-e4-${region}-${args.environmentSuffix}`,
      {
        dashboardName: `infra-mon-e4-${region}-${args.environmentSuffix}`,
        dashboardBody: JSON.stringify({
          widgets: [
            {
              type: 'metric',
              properties: {
                metrics: [
                  ['AWS/EC2', 'CPUUtilization', { stat: 'Average', region }],
                ],
                period: 300,
                stat: 'Average',
                region,
                title: 'EC2 CPU Utilization',
                yAxis: { left: { min: 0, max: 100 } },
              },
            },
            {
              type: 'metric',
              properties: {
                metrics: [
                  ['CWAgent', 'mem_used_percent', { stat: 'Average', region }],
                ],
                period: 300,
                stat: 'Average',
                region,
                title: 'EC2 Memory Utilization',
                yAxis: { left: { min: 0, max: 100 } },
              },
            },
            {
              type: 'metric',
              properties: {
                metrics: [
                  ['AWS/EC2', 'NetworkIn', { stat: 'Sum', region }],
                  ['AWS/EC2', 'NetworkOut', { stat: 'Sum', region }],
                ],
                period: 300,
                stat: 'Sum',
                region,
                title: 'EC2 Network Traffic',
              },
            },
            {
              type: 'metric',
              properties: {
                metrics: [
                  [
                    'AWS/RDS',
                    'DatabaseConnections',
                    { stat: 'Average', region },
                  ],
                ],
                period: 300,
                stat: 'Average',
                region,
                title: 'RDS Database Connections',
              },
            },
            {
              type: 'metric',
              properties: {
                metrics: [
                  ['AWS/ApiGateway', 'Latency', { stat: 'Average', region }],
                ],
                period: 300,
                stat: 'Average',
                region,
                title: 'API Gateway Latency',
              },
            },
            {
              type: 'metric',
              properties: {
                metrics: [['AWS/Lambda', 'Errors', { stat: 'Sum', region }]],
                period: 300,
                stat: 'Sum',
                region,
                title: 'Lambda Errors',
              },
            },
          ],
        }),
      },
      opts
    );

    dashboards.push(dashboard);

    // Generate dashboard URL
    const dashboardUrl = pulumi.interpolate`https://console.aws.amazon.com/cloudwatch/home?region=${region}#dashboards:name=${dashboard.dashboardName}`;
    dashboardUrls.push(dashboardUrl);
  });

  return {
    dashboards,
    dashboardUrls: pulumi.all(dashboardUrls),
  };
}
