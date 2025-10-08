import { Construct } from 'constructs';
import { CloudwatchDashboard } from '@cdktf/provider-aws/lib/cloudwatch-dashboard';
import { AutoscalingGroup } from '@cdktf/provider-aws/lib/autoscaling-group';
import { Alb } from '@cdktf/provider-aws/lib/alb';
import { DbInstance } from '@cdktf/provider-aws/lib/db-instance';

interface MonitoringStackProps {
  asg: AutoscalingGroup;
  alb: Alb;
  database: DbInstance;
  region: string;
  environmentSuffix: string;
}

export class MonitoringStack extends Construct {
  public readonly dashboard: CloudwatchDashboard;

  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id);

    const dashboardBody = {
      widgets: [
        {
          type: 'metric',
          properties: {
            metrics: [
              [
                'AWS/EC2',
                'CPUUtilization',
                { stat: 'Average', label: 'EC2 CPU Usage' },
              ],
              ['.', '.', { stat: 'Maximum', label: 'EC2 CPU Max' }],
            ],
            period: 300,
            stat: 'Average',
            region: props.region,
            title: 'EC2 CPU Utilization',
            yAxis: {
              left: {
                min: 0,
                max: 100,
              },
            },
          },
        },
        {
          type: 'metric',
          properties: {
            metrics: [
              ['AWS/ApplicationELB', 'TargetResponseTime', { stat: 'Average' }],
              [
                'AWS/ApplicationELB',
                'RequestCount',
                { stat: 'Sum', yAxis: 'right' },
              ],
            ],
            period: 300,
            stat: 'Average',
            region: props.region,
            title: 'ALB Metrics',
          },
        },
        {
          type: 'metric',
          properties: {
            metrics: [
              ['AWS/RDS', 'DatabaseConnections', { stat: 'Average' }],
              [
                'AWS/RDS',
                'CPUUtilization',
                { stat: 'Average', yAxis: 'right' },
              ],
            ],
            period: 300,
            stat: 'Average',
            region: props.region,
            title: 'RDS Performance',
          },
        },
        {
          type: 'metric',
          properties: {
            metrics: [
              ['AWS/AutoScaling', 'GroupDesiredCapacity', { stat: 'Average' }],
              [
                'AWS/AutoScaling',
                'GroupInServiceInstances',
                { stat: 'Average' },
              ],
            ],
            period: 300,
            stat: 'Average',
            region: props.region,
            title: 'Auto Scaling Group',
          },
        },
      ],
    };

    this.dashboard = new CloudwatchDashboard(this, 'portfolio-dashboard', {
      dashboardName: 'portfolio-tracking-metrics',
      dashboardBody: JSON.stringify(dashboardBody),
    });
  }
}
