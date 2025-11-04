/* eslint-disable @typescript-eslint/no-unused-vars */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as path from 'path';

export interface HealthDashboardStackArgs {
  environmentSuffix: string;
  snsTopicArn: pulumi.Input<string>;
  vpcSubnetIds: pulumi.Input<string>[];
  vpcSecurityGroupIds: pulumi.Input<string>[];
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class HealthDashboardStack extends pulumi.ComponentResource {
  constructor(
    name: string,
    args: HealthDashboardStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:operations:HealthDashboard', name, args, opts);

    const suffix = args.environmentSuffix;
    const tags = args.tags;

    // IAM role for Health Dashboard Lambda
    const lambdaRole = new aws.iam.Role(
      `health-lambda-role-${suffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
            },
          ],
        }),
        tags: tags,
      },
      { parent: this }
    );

    const lambdaPolicy = new aws.iam.RolePolicy(
      `health-lambda-policy-${suffix}`,
      {
        role: lambdaRole.id,
        policy: pulumi.all([args.snsTopicArn]).apply(([topicArn]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: [
                  'health:DescribeEvents',
                  'health:DescribeEventDetails',
                  'health:DescribeAffectedEntities',
                ],
                Resource: '*',
              },
              {
                Effect: 'Allow',
                Action: ['sns:Publish'],
                Resource: topicArn,
              },
              {
                Effect: 'Allow',
                Action: [
                  'logs:CreateLogGroup',
                  'logs:CreateLogStream',
                  'logs:PutLogEvents',
                ],
                Resource: 'arn:aws:logs:*:*:*',
              },
              {
                Effect: 'Allow',
                Action: [
                  'ec2:CreateNetworkInterface',
                  'ec2:DescribeNetworkInterfaces',
                  'ec2:DeleteNetworkInterface',
                ],
                Resource: '*',
              },
            ],
          })
        ),
      },
      { parent: this }
    );

    // Lambda function for Health Dashboard monitoring
    const healthLambda = new aws.lambda.Function(
      `health-monitor-${suffix}`,
      {
        name: `health-monitor-${suffix}`,
        runtime: 'nodejs18.x',
        handler: 'index.handler',
        role: lambdaRole.arn,
        timeout: 60,
        memorySize: 256,
        environment: {
          variables: {
            SNS_TOPIC_ARN: args.snsTopicArn,
          },
        },
        vpcConfig: {
          subnetIds: args.vpcSubnetIds,
          securityGroupIds: args.vpcSecurityGroupIds,
        },
        code: new pulumi.asset.AssetArchive({
          '.': new pulumi.asset.FileArchive(
            path.join(__dirname, 'lambda/functions/health-monitor')
          ),
        }),
        tags: tags,
      },
      { parent: this, dependsOn: [lambdaPolicy] }
    );

    // EventBridge rule for Health events
    const healthRule = new aws.cloudwatch.EventRule(
      `health-events-${suffix}`,
      {
        name: `health-events-${suffix}`,
        description: 'Trigger on AWS Health events',
        eventPattern: JSON.stringify({
          source: ['aws.health'],
        }),
        tags: tags,
      },
      { parent: this }
    );

    const _healthTarget = new aws.cloudwatch.EventTarget(
      `health-target-${suffix}`,
      {
        rule: healthRule.name,
        arn: healthLambda.arn,
      },
      { parent: this }
    );

    const _healthPermission = new aws.lambda.Permission(
      `health-permission-${suffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: healthLambda.name,
        principal: 'events.amazonaws.com',
        sourceArn: healthRule.arn,
      },
      { parent: this }
    );

    this.registerOutputs({});
  }
}
