import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

// Define the arguments for the MonitoringInfrastructure component
interface MonitoringInfrastructureArgs {
  instanceIds: pulumi.Input<pulumi.Input<string>[]>;
  environment: pulumi.Input<string>;
  region: pulumi.Input<string>;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class MonitoringInfrastructure extends pulumi.ComponentResource {
  public readonly dashboard: aws.cloudwatch.Dashboard;
  public readonly dashboardName: pulumi.Output<string>;

  constructor(
    name: string,
    args: MonitoringInfrastructureArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:components:MonitoringInfrastructure', name, args, opts);

    // A simple CloudWatch Dashboard for the EC2 instances
    const dashboardNameStr = `${name}-dashboard`;

    const dashboardBody = pulumi.output(args.instanceIds).apply(ids => {
      if (ids && ids.length > 0) {
        return JSON.stringify({
          widgets: [
            {
              type: 'metric',
              x: 0,
              y: 0,
              width: 12,
              height: 6,
              properties: {
                metrics: [['AWS/EC2', 'CPUUtilization', 'InstanceId', ids[0]]],
                period: 300,
                stat: 'Average',
                region: args.region,
                title: 'EC2 CPU Utilization',
              },
            },
          ],
        });
      } else {
        return JSON.stringify({
          widgets: [
            {
              type: 'text',
              x: 0,
              y: 0,
              width: 12,
              height: 2,
              properties: {
                markdown: '### No instances found to monitor.',
              },
            },
          ],
        });
      }
    });

    this.dashboard = new aws.cloudwatch.Dashboard(
      `${name}-dashboard`,
      {
        dashboardName: dashboardNameStr,
        dashboardBody: dashboardBody,
      },
      { parent: this }
    );

    // Export key outputs
    this.dashboardName = this.dashboard.dashboardName;
    this.registerOutputs({
      dashboardName: this.dashboardName,
    });
  }
}
