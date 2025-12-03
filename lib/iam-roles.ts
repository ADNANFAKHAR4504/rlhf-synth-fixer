import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export function createIAMRoles(
  environmentSuffix: string,
  tags: pulumi.Input<{ [key: string]: string }>,
  opts?: pulumi.ComponentResourceOptions
) {
  // IAM role for Lambda functions with least-privilege access
  const lambdaRole = new aws.iam.Role(
    `infrastructure-analysis-lambda-role-${environmentSuffix}`,
    {
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { Service: 'lambda.amazonaws.com' },
            Action: 'sts:AssumeRole',
          },
        ],
      }),
      tags: tags,
    },
    opts
  );

  // Policy for CloudWatch Metrics read access
  new aws.iam.RolePolicy(
    `infrastructure-analysis-metrics-policy-${environmentSuffix}`,
    {
      role: lambdaRole.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'cloudwatch:GetMetricData',
              'cloudwatch:GetMetricStatistics',
              'cloudwatch:ListMetrics',
              'cloudwatch:DescribeAlarms',
              'cloudwatch:DescribeAlarmsForMetric',
            ],
            Resource: '*',
          },
          {
            Effect: 'Allow',
            Action: [
              'ec2:DescribeInstances',
              'ec2:DescribeRegions',
              'rds:DescribeDBInstances',
              'rds:DescribeDBClusters',
              'apigateway:GET',
            ],
            Resource: '*',
          },
        ],
      }),
    },
    opts
  );

  // Policy for CloudWatch Logs
  new aws.iam.RolePolicy(
    `infrastructure-analysis-logs-policy-${environmentSuffix}`,
    {
      role: lambdaRole.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
              'logs:PutLogEvents',
              'logs:StartQuery',
              'logs:GetQueryResults',
              'logs:FilterLogEvents',
            ],
            Resource: '*',
          },
        ],
      }),
    },
    opts
  );

  // Policy for SNS publish
  new aws.iam.RolePolicy(
    `infrastructure-analysis-sns-policy-${environmentSuffix}`,
    {
      role: lambdaRole.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['sns:Publish'],
            Resource: `arn:aws:sns:*:*:infrastructure-alerts-*-${environmentSuffix}`,
          },
        ],
      }),
    },
    opts
  );

  return {
    lambdaRoleArn: lambdaRole.arn,
    lambdaRole: lambdaRole,
  };
}
