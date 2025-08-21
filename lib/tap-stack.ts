// lib/tap-stack.ts
import * as cdk from 'aws-cdk-lib';
import {
  aws_cloudwatch as cloudwatch,
  aws_iam as iam,
  aws_logs as logs,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';

export interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}
export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const region = cdk.Stack.of(this).region;
    const envSuffix =
      (props?.environmentSuffix ?? this.node.tryGetContext('environmentSuffix')) ??
      'prod';
    const auditLogGroup = new logs.LogGroup(this, 'IamAuditLogGroup', {
      logGroupName: `/secure/iam/audit/${region}/${envSuffix}`,
      retention: logs.RetentionDays.ONE_MONTH,
      // Keep logs by default in production; safe for tests as well.
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });
    const lambdaAuditRole = new iam.Role(this, 'LambdaIamAuditRole', {
      roleName: `LambdaIamAuditRole-${region}-${envSuffix}`.slice(0, 64),
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description:
        'Least-privilege: Lambda can write only to the dedicated audit Log Group.',
      inlinePolicies: {
        LogsWriteOnly: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              sid: 'CreateStreamPutEvents',
              effect: iam.Effect.ALLOW,
              actions: ['logs:CreateLogStream', 'logs:PutLogEvents'],
              resources: [`${auditLogGroup.logGroupArn}:*`],
            }),
            new iam.PolicyStatement({
              sid: 'DescribeLogStreams',
              effect: iam.Effect.ALLOW,
              actions: ['logs:DescribeLogStreams'],
              resources: [auditLogGroup.logGroupArn],
            }),
          ],
        }),
      },
    });
    const ec2EmptyRole = new iam.Role(this, 'Ec2EmptyRole', {
      roleName: `Ec2EmptyRole-${region}-${envSuffix}`.slice(0, 64),
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description:
        'Baseline EC2 role with no permissions; attach only the exact actions required.',
    });
    new cdk.CfnOutput(this, 'LambdaIamAuditRoleArn', {
      value: lambdaAuditRole.roleArn,
      exportName: `LambdaIamAuditRoleArn-${region}-${envSuffix}`,
    });
    new cdk.CfnOutput(this, 'Ec2EmptyRoleArn', {
      value: ec2EmptyRole.roleArn,
      exportName: `Ec2EmptyRoleArn-${region}-${envSuffix}`,
    });
    new cdk.CfnOutput(this, 'AuditLogGroupName', {
      value: auditLogGroup.logGroupName,
      exportName: `AuditLogGroupName-${region}-${envSuffix}`,
    });
    const rollbackAlarm = new cloudwatch.Alarm(this, 'RollbackGuardAlarm', {
      alarmName: `RollbackGuardAlarm-${region}-${envSuffix}`,
      metric: new cloudwatch.Metric({
        namespace: 'CDK/Guard',
        metricName: 'AlwaysZero',
        statistic: 'Maximum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 1, // never reached
      evaluationPeriods: 1,
      comparisonOperator:
        cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    // Minimal nested template body – just enough to carry RollbackConfiguration
    const nestedTemplateBody =
      "AWSTemplateFormatVersion: '2010-09-09'\n" +
      "Description: 'Nested stack solely to carry RollbackConfiguration (no resources)'\n" +
      'Resources: {}';
    // Low-level resource so we can attach RollbackConfiguration
    const rollbackNested = new cdk.CfnResource(this, 'RollbackNestedStack', {
      type: 'AWS::CloudFormation::Stack',
      properties: {
        TemplateBody: nestedTemplateBody,
        TimeoutInMinutes: 10,
        RollbackConfiguration: {
          MonitoringTimeInMinutes: 10,
          RollbackTriggers: [
            {
              Arn: rollbackAlarm.alarmArn,
              Type: 'AWS::CloudWatch::Alarm',
            },
          ],
        },
        Tags: [
          { Key: 'ProjectName', Value: 'IaC - AWS Nova Model Breaking' },
          { Key: 'Purpose', Value: 'Rollback-Guard' },
          { Key: 'Region', Value: region },
          { Key: 'Env', Value: envSuffix },
        ],
      },
    });
    rollbackNested.addDependency(rollbackAlarm.node.defaultChild as cdk.CfnResource);
    // Nice template description for traceability
    this.templateOptions.description =
      'TapStack: least-privilege IAM roles + rollback configuration via nested stack .';
  }
}
