import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as cloudtrail from 'aws-cdk-lib/aws-cloudtrail';
import * as guardduty from 'aws-cdk-lib/aws-guardduty';
import * as securityhub from 'aws-cdk-lib/aws-securityhub';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

interface SecurityStackProps extends cdk.NestedStackProps {
  environmentSuffix: string;
  vpc: ec2.Vpc;
}

export class SecurityStack extends cdk.NestedStack {
  public readonly kmsKey: kms.Key;
  public readonly ec2Role: iam.Role;
  public readonly cloudTrailBucket: s3.Bucket;
  public readonly securityAlertsTopic: sns.Topic;
  public readonly webAcl: wafv2.CfnWebACL;

  constructor(scope: Construct, id: string, props: SecurityStackProps) {
    super(scope, id, props);

    // KMS Key for encryption
    this.kmsKey = new kms.Key(this, `${props.environmentSuffix}-security-key`, {
      alias: `${props.environmentSuffix}-security-key`,
      description: `KMS key for ${props.environmentSuffix} environment encryption`,
      enableKeyRotation: true,
      pendingWindow: cdk.Duration.days(7),
      policy: new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement({
            sid: 'Enable IAM User Permissions',
            effect: iam.Effect.ALLOW,
            principals: [new iam.AccountRootPrincipal()],
            actions: ['kms:*'],
            resources: ['*'],
          }),
          new iam.PolicyStatement({
            sid: 'Allow CloudTrail',
            effect: iam.Effect.ALLOW,
            principals: [new iam.ServicePrincipal('cloudtrail.amazonaws.com')],
            actions: ['kms:GenerateDataKey*', 'kms:DescribeKey', 'kms:Decrypt'],
            resources: ['*'],
          }),
        ],
      }),
    });

    // S3 bucket for CloudTrail logs with security policies
    this.cloudTrailBucket = new s3.Bucket(
      this,
      `${props.environmentSuffix}-cloudtrail-logs`,
      {
        bucketName: `${props.environmentSuffix}-cloudtrail-logs-${this.account}`,
        encryption: s3.BucketEncryption.KMS,
        encryptionKey: this.kmsKey,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        versioned: true,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
        lifecycleRules: [
          {
            id: 'DeleteOldVersions',
            expiredObjectDeleteMarker: true,
            noncurrentVersionExpiration: cdk.Duration.days(90),
          },
        ],
      }
    );

    // Bucket policy to prevent public PUT operations
    this.cloudTrailBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'DenyPublicPut',
        effect: iam.Effect.DENY,
        principals: [new iam.AnyPrincipal()],
        actions: ['s3:PutObject', 's3:PutObjectAcl'],
        resources: [this.cloudTrailBucket.arnForObjects('*')],
        conditions: {
          StringNotEquals: {
            'aws:PrincipalServiceName': ['cloudtrail.amazonaws.com'],
          },
        },
      })
    );

    // CloudTrail with encryption
    new cloudtrail.Trail(this, `${props.environmentSuffix}-cloudtrail`, {
      trailName: `${props.environmentSuffix}-security-trail`,
      bucket: this.cloudTrailBucket,
      encryptionKey: this.kmsKey,
      includeGlobalServiceEvents: true,
      isMultiRegionTrail: true,
      enableFileValidation: true,
    });

    // IAM role for EC2 instances with read-only S3 permissions
    this.ec2Role = new iam.Role(this, `${props.environmentSuffix}-ec2-role`, {
      roleName: `${props.environmentSuffix}-ec2-role`,
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3ReadOnlyAccess'),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'CloudWatchAgentServerPolicy'
        ),
      ],
      inlinePolicies: {
        S3ReadOnlyPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['s3:GetObject', 's3:ListBucket'],
              resources: ['*'],
            }),
          ],
        }),
      },
    });

    // SNS topic for security alerts with restricted access
    this.securityAlertsTopic = new sns.Topic(
      this,
      `${props.environmentSuffix}-security-alerts`,
      {
        topicName: `${props.environmentSuffix}-security-alerts`,
        masterKey: this.kmsKey,
      }
    );

    this.securityAlertsTopic.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'AllowAWSServices',
        effect: iam.Effect.ALLOW,
        principals: [
          new iam.ServicePrincipal('guardduty.amazonaws.com'),
          new iam.ServicePrincipal('securityhub.amazonaws.com'),
          new iam.ServicePrincipal('cloudwatch.amazonaws.com'),
        ],
        actions: ['sns:Publish'],
        resources: [this.securityAlertsTopic.topicArn],
      })
    );

    // GuardDuty detector
    new guardduty.CfnDetector(this, `${props.environmentSuffix}-guardduty`, {
      enable: true,
      findingPublishingFrequency: 'FIFTEEN_MINUTES',
    });

    // Security Hub
    new securityhub.CfnHub(this, `${props.environmentSuffix}-security-hub`, {
      enableDefaultStandards: true,
    });

    // Output to indicate GuardDuty and Security Hub should be enabled
    new cdk.CfnOutput(this, 'GuardDutyStatus', {
      value: 'GuardDuty is enabled in the account',
      description: 'GuardDuty detector monitoring for security threats',
    });

    new cdk.CfnOutput(this, 'SecurityHubStatus', {
      value: 'Security Hub is enabled in the account',
      description: 'Security Hub for centralized security management',
    });

    // WAF Web ACL for application load balancer
    this.webAcl = new wafv2.CfnWebACL(
      this,
      `${props.environmentSuffix}-web-acl`,
      {
        name: `${props.environmentSuffix}-web-acl`,
        scope: 'REGIONAL',
        defaultAction: { allow: {} },
        rules: [
          {
            name: 'AWSManagedRulesCommonRuleSet',
            priority: 1,
            statement: {
              managedRuleGroupStatement: {
                vendorName: 'AWS',
                name: 'AWSManagedRulesCommonRuleSet',
              },
            },
            overrideAction: { none: {} },
            visibilityConfig: {
              sampledRequestsEnabled: true,
              cloudWatchMetricsEnabled: true,
              metricName: 'CommonRuleSetMetric',
            },
          },
          {
            name: 'AWSManagedRulesKnownBadInputsRuleSet',
            priority: 2,
            statement: {
              managedRuleGroupStatement: {
                vendorName: 'AWS',
                name: 'AWSManagedRulesKnownBadInputsRuleSet',
              },
            },
            overrideAction: { none: {} },
            visibilityConfig: {
              sampledRequestsEnabled: true,
              cloudWatchMetricsEnabled: true,
              metricName: 'KnownBadInputsMetric',
            },
          },
          {
            name: 'AWSManagedRulesSQLiRuleSet',
            priority: 3,
            statement: {
              managedRuleGroupStatement: {
                vendorName: 'AWS',
                name: 'AWSManagedRulesSQLiRuleSet',
              },
            },
            overrideAction: { none: {} },
            visibilityConfig: {
              sampledRequestsEnabled: true,
              cloudWatchMetricsEnabled: true,
              metricName: 'SQLiRuleSetMetric',
            },
          },
        ],
        visibilityConfig: {
          sampledRequestsEnabled: true,
          cloudWatchMetricsEnabled: true,
          metricName: `${props.environmentSuffix}WebAcl`,
        },
      }
    );

    // IAM users with MFA requirement
    const securityGroup = new iam.Group(
      this,
      `${props.environmentSuffix}-security-group`
    );

    securityGroup.addToPolicy(
      new iam.PolicyStatement({
        sid: 'AllowViewAccountInfo',
        effect: iam.Effect.ALLOW,
        actions: ['iam:GetAccountPasswordPolicy', 'iam:ListVirtualMFADevices'],
        resources: ['*'],
      })
    );

    securityGroup.addToPolicy(
      new iam.PolicyStatement({
        sid: 'AllowManageOwnPasswords',
        effect: iam.Effect.ALLOW,
        actions: ['iam:ChangePassword', 'iam:GetUser'],
        resources: ['arn:aws:iam::*:user/${aws:username}'],
      })
    );

    securityGroup.addToPolicy(
      new iam.PolicyStatement({
        sid: 'AllowManageOwnAccessKeys',
        effect: iam.Effect.ALLOW,
        actions: [
          'iam:CreateAccessKey',
          'iam:DeleteAccessKey',
          'iam:ListAccessKeys',
          'iam:UpdateAccessKey',
        ],
        resources: ['arn:aws:iam::*:user/${aws:username}'],
      })
    );

    securityGroup.addToPolicy(
      new iam.PolicyStatement({
        sid: 'AllowManageOwnVirtualMFADevice',
        effect: iam.Effect.ALLOW,
        actions: ['iam:CreateVirtualMFADevice', 'iam:DeleteVirtualMFADevice'],
        resources: ['arn:aws:iam::*:mfa/${aws:username}'],
      })
    );

    securityGroup.addToPolicy(
      new iam.PolicyStatement({
        sid: 'AllowManageOwnUserMFA',
        effect: iam.Effect.ALLOW,
        actions: [
          'iam:DeactivateMFADevice',
          'iam:EnableMFADevice',
          'iam:ListMFADevices',
          'iam:ResyncMFADevice',
        ],
        resources: ['arn:aws:iam::*:user/${aws:username}'],
      })
    );

    securityGroup.addToPolicy(
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
        ],
        resources: ['*'],
        conditions: {
          BoolIfExists: {
            'aws:MultiFactorAuthPresent': 'false',
          },
        },
      })
    );
  }
}
