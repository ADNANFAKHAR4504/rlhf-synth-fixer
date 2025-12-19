import { Construct } from 'constructs';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { CloudwatchDashboard } from '@cdktf/provider-aws/lib/cloudwatch-dashboard';

export interface MonitoringConstructProps {
  environmentSuffix: string;
  primaryProvider: AwsProvider;
  primaryLambdaName: string;
  secondaryLambdaName: string;
  primaryStateMachineName: string;
  secondaryStateMachineName: string;
  dynamoTableName: string;
  healthCheckId: string;
}

export class MonitoringConstruct extends Construct {
  constructor(scope: Construct, id: string, props: MonitoringConstructProps) {
    super(scope, id);

    const {
      environmentSuffix,
      primaryProvider,
      dynamoTableName,
      healthCheckId,
    } = props;

    // Cross-Region CloudWatch Dashboard
    const dashboardBody = JSON.stringify({
      widgets: [
        {
          type: 'metric',
          properties: {
            metrics: [
              [
                'AWS/Lambda',
                'Invocations',
                {
                  stat: 'Sum',
                  region: 'us-east-1',
                  label: 'Primary Lambda Invocations',
                },
              ],
              [
                'AWS/Lambda',
                'Invocations',
                {
                  stat: 'Sum',
                  region: 'us-east-2',
                  label: 'Secondary Lambda Invocations',
                },
              ],
            ],
            period: 300,
            stat: 'Sum',
            region: 'us-east-1',
            title: 'Lambda Invocations - Both Regions',
            yAxis: {
              left: {
                min: 0,
              },
            },
          },
        },
        {
          type: 'metric',
          properties: {
            metrics: [
              [
                'AWS/Lambda',
                'Errors',
                {
                  stat: 'Sum',
                  region: 'us-east-1',
                  label: 'Primary Lambda Errors',
                },
              ],
              [
                'AWS/Lambda',
                'Errors',
                {
                  stat: 'Sum',
                  region: 'us-east-2',
                  label: 'Secondary Lambda Errors',
                },
              ],
            ],
            period: 300,
            stat: 'Sum',
            region: 'us-east-1',
            title: 'Lambda Errors - Both Regions',
            yAxis: {
              left: {
                min: 0,
              },
            },
          },
        },
        {
          type: 'metric',
          properties: {
            metrics: [
              [
                'AWS/States',
                'ExecutionsStarted',
                {
                  stat: 'Sum',
                  region: 'us-east-1',
                  label: 'Primary Step Functions Started',
                },
              ],
              [
                'AWS/States',
                'ExecutionsStarted',
                {
                  stat: 'Sum',
                  region: 'us-east-2',
                  label: 'Secondary Step Functions Started',
                },
              ],
            ],
            period: 300,
            stat: 'Sum',
            region: 'us-east-1',
            title: 'Step Functions Executions - Both Regions',
            yAxis: {
              left: {
                min: 0,
              },
            },
          },
        },
        {
          type: 'metric',
          properties: {
            metrics: [
              [
                'AWS/States',
                'ExecutionsFailed',
                {
                  stat: 'Sum',
                  region: 'us-east-1',
                  label: 'Primary Step Functions Failed',
                },
              ],
              [
                'AWS/States',
                'ExecutionsFailed',
                {
                  stat: 'Sum',
                  region: 'us-east-2',
                  label: 'Secondary Step Functions Failed',
                },
              ],
            ],
            period: 300,
            stat: 'Sum',
            region: 'us-east-1',
            title: 'Step Functions Failures - Both Regions',
            yAxis: {
              left: {
                min: 0,
              },
            },
          },
        },
        {
          type: 'metric',
          properties: {
            metrics: [
              [
                'AWS/DynamoDB',
                'ConsumedReadCapacityUnits',
                'TableName',
                dynamoTableName,
                {
                  stat: 'Sum',
                  region: 'us-east-1',
                  label: 'Read Capacity',
                },
              ],
              [
                'AWS/DynamoDB',
                'ConsumedWriteCapacityUnits',
                'TableName',
                dynamoTableName,
                {
                  stat: 'Sum',
                  region: 'us-east-1',
                  label: 'Write Capacity',
                },
              ],
            ],
            period: 300,
            stat: 'Sum',
            region: 'us-east-1',
            title: 'DynamoDB Capacity',
            yAxis: {
              left: {
                min: 0,
              },
            },
          },
        },
        {
          type: 'metric',
          properties: {
            metrics: [
              [
                'AWS/Route53',
                'HealthCheckStatus',
                'HealthCheckId',
                healthCheckId,
                { stat: 'Minimum', label: 'Health Check Status' },
              ],
            ],
            period: 60,
            stat: 'Minimum',
            region: 'us-east-1',
            title: 'Route 53 Health Check Status',
            yAxis: {
              left: {
                min: 0,
                max: 1,
              },
            },
          },
        },
        {
          type: 'metric',
          properties: {
            metrics: [
              [
                'AWS/RDS',
                'CPUUtilization',
                {
                  stat: 'Average',
                  region: 'us-east-1',
                  label: 'Primary Aurora CPU',
                },
              ],
              [
                'AWS/RDS',
                'CPUUtilization',
                {
                  stat: 'Average',
                  region: 'us-east-2',
                  label: 'Secondary Aurora CPU',
                },
              ],
            ],
            period: 300,
            stat: 'Average',
            region: 'us-east-1',
            title: 'Aurora CPU Utilization - Both Regions',
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
              [
                'AWS/RDS',
                'DatabaseConnections',
                {
                  stat: 'Average',
                  region: 'us-east-1',
                  label: 'Primary Aurora Connections',
                },
              ],
              [
                'AWS/RDS',
                'DatabaseConnections',
                {
                  stat: 'Average',
                  region: 'us-east-2',
                  label: 'Secondary Aurora Connections',
                },
              ],
            ],
            period: 300,
            stat: 'Average',
            region: 'us-east-1',
            title: 'Aurora Connections - Both Regions',
            yAxis: {
              left: {
                min: 0,
              },
            },
          },
        },
      ],
    });

    new CloudwatchDashboard(this, 'MultiRegionDashboard', {
      provider: primaryProvider,
      dashboardName: `dr-multi-region-dashboard-${environmentSuffix}`,
      dashboardBody: dashboardBody,
    });
  }
}
