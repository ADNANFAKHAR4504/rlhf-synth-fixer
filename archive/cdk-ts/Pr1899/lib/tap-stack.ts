import * as cdk from 'aws-cdk-lib';
import { aws_iam as iam, aws_logs as logs } from 'aws-cdk-lib';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix =
      props?.environmentSuffix ??
      this.node.tryGetContext('environmentSuffix') ??
      'dev';

    const accountId = cdk.Stack.of(this).account;
    const currentRegion = cdk.Stack.of(this).region;

    // === IAM audit log group (scoped, least privilege targets) ===
    const auditLogGroupName = `/corp/iam/audit/${environmentSuffix}/${currentRegion}`;
    const auditLogGroup = new logs.LogGroup(this, 'IamAuditLogGroup', {
      logGroupName: auditLogGroupName,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Common ARNs used in inline policies (no resource-wide wildcards)
    const logsGroupArn = `arn:${cdk.Aws.PARTITION}:logs:${currentRegion}:${accountId}:log-group:${auditLogGroupName}`;
    const logsStreamArn = `${logsGroupArn}:log-stream:*`;
    const ssmParamPathPrefix = `/corp/iam/${environmentSuffix}/${currentRegion}/`;
    const ssmParamArn = `arn:${cdk.Aws.PARTITION}:ssm:${currentRegion}:${accountId}:parameter${ssmParamPathPrefix}*`;

    // === Application service role (EC2) with least privilege ===
    const appServiceRole = new iam.Role(this, 'AppServiceRole', {
      roleName: `corp-app-service-role-${environmentSuffix}-${currentRegion}`,
      description:
        'Least-privilege role for EC2-based services to read scoped SSM params and write to an audit log group',
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      maxSessionDuration: cdk.Duration.hours(1),
    });

    // Inline policy: write only to the dedicated audit log group
    appServiceRole.attachInlinePolicy(
      new iam.Policy(this, 'AppLogsPolicy', {
        policyName: `corp-app-logs-${environmentSuffix}-${currentRegion}`,
        statements: [
          new iam.PolicyStatement({
            sid: 'WriteToAuditLogGroup',
            effect: iam.Effect.ALLOW,
            actions: ['logs:CreateLogStream', 'logs:PutLogEvents'],
            resources: [logsStreamArn],
          }),
          new iam.PolicyStatement({
            sid: 'CreateGroupIfMissing',
            effect: iam.Effect.ALLOW,
            actions: ['logs:CreateLogGroup', 'logs:DescribeLogStreams'],
            resources: [logsGroupArn],
          }),
        ],
      })
    );

    // Inline policy: read only specific SSM Parameter path
    appServiceRole.attachInlinePolicy(
      new iam.Policy(this, 'AppSsmReadPolicy', {
        policyName: `corp-app-ssm-read-${environmentSuffix}-${currentRegion}`,
        statements: [
          new iam.PolicyStatement({
            sid: 'ReadScopedParameters',
            effect: iam.Effect.ALLOW,
            actions: ['ssm:GetParameter', 'ssm:GetParameters'],
            resources: [ssmParamArn],
          }),
        ],
      })
    );

    // === Lambda execution role with minimal permissions ===
    const lambdaExecRole = new iam.Role(this, 'LambdaExecutionRole', {
      roleName: `corp-lambda-exec-role-${environmentSuffix}-${currentRegion}`,
      description:
        'Least-privilege role for Lambda to write logs to the audit group and read scoped SSM params',
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      maxSessionDuration: cdk.Duration.hours(1),
    });

    lambdaExecRole.attachInlinePolicy(
      new iam.Policy(this, 'LambdaLogsPolicy', {
        policyName: `corp-lambda-logs-${environmentSuffix}-${currentRegion}`,
        statements: [
          new iam.PolicyStatement({
            sid: 'WriteToAuditLogGroup',
            effect: iam.Effect.ALLOW,
            actions: ['logs:CreateLogStream', 'logs:PutLogEvents'],
            resources: [logsStreamArn],
          }),
          new iam.PolicyStatement({
            sid: 'CreateGroupIfMissing',
            effect: iam.Effect.ALLOW,
            actions: ['logs:CreateLogGroup', 'logs:DescribeLogStreams'],
            resources: [logsGroupArn],
          }),
        ],
      })
    );

    lambdaExecRole.attachInlinePolicy(
      new iam.Policy(this, 'LambdaSsmReadPolicy', {
        policyName: `corp-lambda-ssm-read-${environmentSuffix}-${currentRegion}`,
        statements: [
          new iam.PolicyStatement({
            sid: 'ReadScopedParameters',
            effect: iam.Effect.ALLOW,
            actions: ['ssm:GetParameter', 'ssm:GetParameters'],
            resources: [ssmParamArn],
          }),
        ],
      })
    );

    // === Optional guardrails: deny destructive IAM ops unless MFA ===
    // This applies ONLY to these roles themselves (no broad impact).
    const selfProtection = new iam.Policy(this, 'SelfProtection', {
      policyName: `corp-iam-self-protect-${environmentSuffix}-${currentRegion}`,
      statements: [
        new iam.PolicyStatement({
          sid: 'DenyDeleteOrDetachWithoutMFA',
          effect: iam.Effect.DENY,
          actions: [
            'iam:DeleteRole',
            'iam:DeleteRolePolicy',
            'iam:DetachRolePolicy',
            'iam:PutRolePolicy',
            'iam:AttachRolePolicy',
          ],
          resources: [appServiceRole.roleArn, lambdaExecRole.roleArn],
          conditions: {
            Bool: { 'aws:MultiFactorAuthPresent': 'false' },
          },
        }),
      ],
    });
    appServiceRole.attachInlinePolicy(selfProtection);
    lambdaExecRole.attachInlinePolicy(selfProtection);
    // === Outputs ===
    new cdk.CfnOutput(this, 'AuditLogGroupName', {
      value: auditLogGroup.logGroupName,
      exportName: `corp-iam-audit-loggroup-${environmentSuffix}-${currentRegion}`,
    });
    new cdk.CfnOutput(this, 'AppServiceRoleArn', {
      value: appServiceRole.roleArn,
      exportName: `corp-app-role-${environmentSuffix}-${currentRegion}`,
    });
    new cdk.CfnOutput(this, 'LambdaExecutionRoleArn', {
      value: lambdaExecRole.roleArn,
      exportName: `corp-lambda-role-${environmentSuffix}-${currentRegion}`,
    });
  }
}
