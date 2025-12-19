import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';

interface SecurityStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class SecurityStack extends cdk.Stack {
  public readonly encryptionKey: kms.Key;
  public readonly auditRole: iam.Role;
  public readonly operationsRole: iam.Role;

  constructor(scope: Construct, id: string, props: SecurityStackProps) {
    super(scope, id, props);

    const region = props.env?.region || 'us-east-1';
    const regionSuffix = region.replace(/-/g, '');

    // KMS key for encryption at rest with automatic rotation
    this.encryptionKey = new kms.Key(this, 'EncryptionKey', {
      description: `KMS key for encryption at rest - ${props.environmentSuffix}`,
      enableKeyRotation: true,
      rotationPeriod: cdk.Duration.days(90),
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      pendingWindow: cdk.Duration.days(7),
    });

    this.encryptionKey.addAlias(
      `alias/security-compliance-${props.environmentSuffix}-${regionSuffix}`
    );

    // Grant CloudWatch Logs permission to use the KMS key
    this.encryptionKey.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'Allow CloudWatch Logs',
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal(`logs.${region}.amazonaws.com`)],
        actions: [
          'kms:Encrypt',
          'kms:Decrypt',
          'kms:ReEncrypt*',
          'kms:GenerateDataKey*',
          'kms:CreateGrant',
          'kms:DescribeKey',
        ],
        resources: ['*'],
        conditions: {
          ArnLike: {
            'kms:EncryptionContext:aws:logs:arn': `arn:aws:logs:${region}:${cdk.Stack.of(this).account}:log-group:*`,
          },
        },
      })
    );

    // IAM role with session duration limits and least privilege for audit operations
    this.auditRole = new iam.Role(this, 'AuditRole', {
      roleName: `security-audit-role-${props.environmentSuffix}-${regionSuffix}`,
      assumedBy: new iam.AccountPrincipal(cdk.Stack.of(this).account),
      maxSessionDuration: cdk.Duration.hours(1),
      description: 'Role for audit operations with limited session duration',
    });

    // Attach read-only policies for audit
    this.auditRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('SecurityAudit')
    );
    this.auditRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('ReadOnlyAccess')
    );

    // Add explicit deny statements for sensitive operations
    this.auditRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.DENY,
        actions: [
          'iam:CreateUser',
          'iam:DeleteUser',
          'iam:CreateAccessKey',
          'iam:DeleteAccessKey',
          'iam:AttachUserPolicy',
          'iam:DetachUserPolicy',
          'kms:ScheduleKeyDeletion',
          'kms:DeleteAlias',
          's3:DeleteBucket',
          'rds:DeleteDBInstance',
          'rds:DeleteDBCluster',
        ],
        resources: ['*'],
      })
    );

    // IAM role for operations with MFA requirement for sensitive operations
    this.operationsRole = new iam.Role(this, 'OperationsRole', {
      roleName: `security-ops-role-${props.environmentSuffix}-${regionSuffix}`,
      assumedBy: new iam.AccountPrincipal(cdk.Stack.of(this).account),
      maxSessionDuration: cdk.Duration.hours(2),
      description:
        'Role for operations with MFA requirement for sensitive actions',
    });

    // Grant KMS key usage
    this.encryptionKey.grantEncryptDecrypt(this.operationsRole);

    // Add policy with MFA requirement for sensitive operations
    this.operationsRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'rds:ModifyDBInstance',
          'rds:ModifyDBCluster',
          'kms:CreateGrant',
          'kms:RevokeGrant',
          's3:PutBucketPolicy',
          's3:DeleteBucketPolicy',
        ],
        resources: ['*'],
        conditions: {
          Bool: {
            'aws:MultiFactorAuthPresent': 'true',
          },
          NumericLessThan: {
            'aws:MultiFactorAuthAge': '3600', // MFA must be within 1 hour
          },
        },
      })
    );

    // Explicit deny for destructive operations without MFA
    this.operationsRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.DENY,
        actions: [
          'iam:DeleteUser',
          'iam:DeleteRole',
          'iam:DeletePolicy',
          'kms:ScheduleKeyDeletion',
          'rds:DeleteDBInstance',
          'rds:DeleteDBCluster',
          's3:DeleteBucket',
        ],
        resources: ['*'],
        conditions: {
          BoolIfExists: {
            'aws:MultiFactorAuthPresent': 'false',
          },
        },
      })
    );

    // Apply tags
    cdk.Tags.of(this).add('DataClassification', 'Confidential');
    cdk.Tags.of(this).add('Environment', props.environmentSuffix);
    cdk.Tags.of(this).add('Owner', 'security-team');

    // Outputs
    new cdk.CfnOutput(this, 'KMSKeyId', {
      value: this.encryptionKey.keyId,
      description: 'KMS Key ID for encryption',
      exportName: `${props.environmentSuffix}-kms-key-id`,
    });

    new cdk.CfnOutput(this, 'KMSKeyArn', {
      value: this.encryptionKey.keyArn,
      description: 'KMS Key ARN for encryption',
      exportName: `${props.environmentSuffix}-kms-key-arn`,
    });
  }
}
