import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export function createIAMRoles(
  environmentSuffix: string,
  tags: pulumi.Input<{ [key: string]: string }>,
  opts?: pulumi.ComponentResourceOptions
) {
  // IAM role for Lambda functions with least-privilege access
  const lambdaRole = new aws.iam.Role(
    `infra-lambda-role-e4-${environmentSuffix}`,
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
    `infra-metrics-policy-e4-${environmentSuffix}`,
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
    `infra-logs-policy-e4-${environmentSuffix}`,
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
    `infra-sns-policy-e4-${environmentSuffix}`,
    {
      role: lambdaRole.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['sns:Publish'],
            Resource: `arn:aws:sns:*:*:infra-alerts-*-e4-${environmentSuffix}`,
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
