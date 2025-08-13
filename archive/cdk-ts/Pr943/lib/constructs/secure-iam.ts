import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export interface SecureIAMProps {
  userName: string;
  roleName: string;
  s3BucketArns: string[];
  rdsResourceArns?: string[];
}

export class SecureIAM extends Construct {
  public readonly user: iam.User;
  public readonly role: iam.Role;
  public readonly logGroup: logs.LogGroup;

  constructor(scope: Construct, id: string, props: SecureIAMProps) {
    super(scope, id);

    // Create CloudWatch Log Group for IAM role logging
    this.logGroup = new logs.LogGroup(this, 'IAMRoleLogGroup', {
      logGroupName: `/aws/iam/roles/${props.roleName}`,
      retention: logs.RetentionDays.ONE_YEAR,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Create IAM role with least privilege
    this.role = new iam.Role(this, 'SecureRole', {
      roleName: props.roleName,
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'Secure role with least privilege access',
      maxSessionDuration: cdk.Duration.hours(1),
    });

    // Add CloudTrail logging policy for the role
    const cloudTrailLoggingPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents',
        'logs:DescribeLogStreams',
      ],
      resources: [this.logGroup.logGroupArn],
    });

    // Create least privilege S3 policy
    const s3Policy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        's3:GetObject',
        's3:PutObject',
        's3:DeleteObject',
        's3:GetObjectVersion',
        's3:ListBucket',
      ],
      resources: [
        ...props.s3BucketArns,
        ...props.s3BucketArns.map(arn => `${arn}/*`),
      ],
      conditions: {
        Bool: {
          'aws:SecureTransport': 'true',
        },
      },
    });

    // Add RDS policy if RDS resources are provided
    let rdsPolicy: iam.PolicyStatement | undefined;
    if (props.rdsResourceArns && props.rdsResourceArns.length > 0) {
      rdsPolicy = new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'rds:DescribeDBInstances',
          'rds:DescribeDBClusters',
          'rds-db:connect',
        ],
        resources: props.rdsResourceArns,
      });
    }

    // Attach policies to role
    this.role.addToPolicy(cloudTrailLoggingPolicy);
    this.role.addToPolicy(s3Policy);
    if (rdsPolicy) {
      this.role.addToPolicy(rdsPolicy);
    }

    // Create IAM user with MFA requirement
    this.user = new iam.User(this, 'SecureUser', {
      userName: props.userName,
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('IAMUserChangePassword'),
      ],
    });

    // Policy requiring MFA for all actions
    const mfaPolicy = new iam.Policy(this, 'MFARequiredPolicy', {
      policyName: 'RequireMFAPolicy',
      statements: [
        new iam.PolicyStatement({
          sid: 'AllowViewAccountInfo',
          effect: iam.Effect.ALLOW,
          actions: [
            'iam:GetAccountPasswordPolicy',
            'iam:ListVirtualMFADevices',
            'iam:GetUser',
            'iam:ListMFADevices',
          ],
          resources: ['*'],
        }),
        new iam.PolicyStatement({
          sid: 'AllowManageOwnPasswords',
          effect: iam.Effect.ALLOW,
          actions: ['iam:ChangePassword', 'iam:GetUser'],
          resources: ['arn:aws:iam::*:user/${aws:username}'],
        }),
        new iam.PolicyStatement({
          sid: 'AllowManageOwnMFA',
          effect: iam.Effect.ALLOW,
          actions: [
            'iam:CreateVirtualMFADevice',
            'iam:DeleteVirtualMFADevice',
            'iam:EnableMFADevice',
            'iam:ListMFADevices',
            'iam:ResyncMFADevice',
          ],
          resources: [
            'arn:aws:iam::*:mfa/${aws:username}',
            'arn:aws:iam::*:user/${aws:username}',
          ],
        }),
        new iam.PolicyStatement({
          sid: 'DenyAllExceptUnlessSignedInWithMFA',
          effect: iam.Effect.DENY,
          notActions: [
            'iam:CreateVirtualMFADevice',
            'iam:EnableMFADevice',
            'iam:GetUser',
            'iam:ListMFADevices',
            'iam:ListVirtualMFADevices',
            'iam:ResyncMFADevice',
            'sts:GetSessionToken',
            'iam:ChangePassword',
          ],
          resources: ['*'],
          conditions: {
            BoolIfExists: {
              'aws:MultiFactorAuthPresent': 'false',
            },
          },
        }),
      ],
    });

    this.user.attachInlinePolicy(mfaPolicy);
  }
}
