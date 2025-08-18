import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { commonTags } from '../config/tags';
import { SecureCloudTrail } from '../modules/cloudtrail';
import { EnhancedCloudTrail } from '../modules/cloudtrail/enhanced-cloudtrail';
import {
  SecureIAMRole,
  createMFAEnforcedPolicy,
  createS3AccessPolicy,
} from '../modules/iam';
import { KMSKey } from '../modules/kms';
import { SecureS3Bucket } from '../modules/s3';
import { EnhancedSecureS3Bucket } from '../modules/s3/enhanced-s3';
import {
  SecurityPolicies,
  createRestrictedAuditPolicy,
  createTimeBasedS3AccessPolicy,
} from '../modules/security-policies';

export interface SecurityStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
  allowedIpRanges?: string[];
  enableEnhancedSecurity?: boolean;
}

export class SecurityStack extends pulumi.ComponentResource {
  // S3 Buckets
  public readonly primaryBucketName: pulumi.Output<string>;
  public readonly primaryBucketArn: pulumi.Output<string>;
  public readonly auditBucketName: pulumi.Output<string>;
  public readonly auditBucketArn: pulumi.Output<string>;

  // KMS Keys
  public readonly s3KmsKeyId: pulumi.Output<string>;
  public readonly s3KmsKeyArn: pulumi.Output<string>;
  public readonly cloudTrailKmsKeyId: pulumi.Output<string>;
  public readonly cloudTrailKmsKeyArn: pulumi.Output<string>;

  // IAM Roles
  public readonly dataAccessRoleArn: pulumi.Output<string>;
  public readonly auditRoleArn: pulumi.Output<string>;

  // CloudTrail properties
  public readonly cloudTrailArn: pulumi.Output<string>;
  public readonly cloudTrailLogGroupArn: pulumi.Output<string>;

  // Security Policies
  public readonly securityPolicyArn: pulumi.Output<string>;
  public readonly mfaEnforcementPolicyArn: pulumi.Output<string>;
  public readonly ec2LifecyclePolicyArn: pulumi.Output<string>;
  public readonly s3SecurityPolicyArn: pulumi.Output<string>;
  public readonly cloudTrailProtectionPolicyArn: pulumi.Output<string>;
  public readonly kmsProtectionPolicyArn: pulumi.Output<string>;

  // Region confirmation
  public readonly region: string;

  constructor(
    name: string,
    args?: SecurityStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:security:SecurityStack', name, args, opts);

    const environmentSuffix = args?.environmentSuffix || 'dev';
    const tags = args?.tags || {};
    const allowedIpRanges = args?.allowedIpRanges || ['203.0.113.0/24'];
    const enableEnhancedSecurity = args?.enableEnhancedSecurity ?? true;

    // Configure AWS provider for us-east-1
    const provider = new aws.Provider(
      'aws-provider',
      {
        region: 'us-east-1',
      },
      { parent: this }
    );

    // Get account ID for IAM role policies
    const accountId = aws.getCallerIdentity().then(id => id.accountId);

    // Create enhanced security policies
    const securityPolicies = new SecurityPolicies(
      `tap-security-policies-${environmentSuffix}`,
      {
        environmentSuffix,
        tags: commonTags,
      },
      { parent: this, provider }
    );

    // Create KMS keys for encryption
    const s3KmsKey = new KMSKey(
      `s3-encryption-${environmentSuffix}`,
      {
        description: `KMS key for S3 bucket encryption - ${environmentSuffix} environment`,
        tags: {
          Purpose: 'S3 Encryption',
          Environment: environmentSuffix,
        },
      },
      { parent: this, provider }
    );

    const cloudTrailKmsKey = new KMSKey(
      `cloudtrail-encryption-${environmentSuffix}`,
      {
        description: `KMS key for CloudTrail log encryption - ${environmentSuffix} environment`,
        tags: {
          Purpose: 'CloudTrail Encryption',
          Environment: environmentSuffix,
        },
      },
      { parent: this, provider }
    );

    // Create secure S3 buckets with enhanced security
    let primaryBucket: SecureS3Bucket | EnhancedSecureS3Bucket;
    let auditBucket: SecureS3Bucket | EnhancedSecureS3Bucket;

    if (enableEnhancedSecurity) {
      primaryBucket = new EnhancedSecureS3Bucket(
        `tap-primary-storage-${environmentSuffix}`,
        {
          bucketName: `tap-primary-storage-${environmentSuffix}`,
          kmsKeyId: s3KmsKey.key.keyId,
          allowedIpRanges,
          enableAccessLogging: true,
          enableNotifications: false,
          enableObjectLock: true,
          enableBucketPolicy: true,
          lifecycleRules: [
            {
              id: 'transition-to-ia',
              status: 'Enabled',
              transitions: [
                {
                  days: 30,
                  storageClass: 'STANDARD_IA',
                },
                {
                  days: 90,
                  storageClass: 'GLACIER',
                },
                {
                  days: 365,
                  storageClass: 'DEEP_ARCHIVE',
                },
              ],
            },
          ],
          tags: {
            Purpose: 'Primary data storage with enhanced security',
            Environment: environmentSuffix,
          },
        },
        { parent: this, provider }
      );

      auditBucket = new EnhancedSecureS3Bucket(
        `tap-audit-logs-${environmentSuffix}`,
        {
          bucketName: `tap-audit-logs-${environmentSuffix}`,
          kmsKeyId: cloudTrailKmsKey.key.arn,
          allowedIpRanges,
          enableAccessLogging: true,
          enableObjectLock: true,
          enableBucketPolicy: true,
          tags: {
            Purpose: 'Audit and compliance logs with enhanced security',
            Environment: environmentSuffix,
          },
        },
        { parent: this, provider }
      );
    } else {
      primaryBucket = new SecureS3Bucket(
        `tap-primary-storage-${environmentSuffix}`,
        {
          bucketName: `tap-primary-storage-${environmentSuffix}`,
          kmsKeyId: s3KmsKey.key.keyId,
          enableBucketPolicy: true,
          enableAccessLogging: true,
          lifecycleRules: [
            {
              id: 'transition-to-ia',
              status: 'Enabled',
              transitions: [
                {
                  days: 30,
                  storageClass: 'STANDARD_IA',
                },
                {
                  days: 90,
                  storageClass: 'GLACIER',
                },
                {
                  days: 365,
                  storageClass: 'DEEP_ARCHIVE',
                },
              ],
            },
          ],
          tags: {
            Purpose: 'Primary data storage',
            Environment: environmentSuffix,
          },
        },
        { parent: this, provider }
      );

      auditBucket = new SecureS3Bucket(
        `tap-audit-logs-${environmentSuffix}`,
        {
          bucketName: `tap-audit-logs-${environmentSuffix}`,
          kmsKeyId: cloudTrailKmsKey.key.arn,
          enableBucketPolicy: true,
          enableAccessLogging: true,
          tags: {
            Purpose: 'Audit and compliance logs',
            Environment: environmentSuffix,
          },
        },
        { parent: this, provider }
      );
    }

    // Create IAM roles with enhanced least privilege and MFA enforcement
    const dataAccessRole = new SecureIAMRole(
      `tap-data-access-${environmentSuffix}`,
      {
        assumeRolePolicy: pulumi.all([accountId]).apply(([accountId]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Action: 'sts:AssumeRole',
                Effect: 'Allow',
                Principal: {
                  AWS: `arn:aws:iam::${accountId}:root`,
                },
                Condition: {
                  Bool: {
                    'aws:MultiFactorAuthPresent': 'true',
                  },
                  StringEquals: {
                    'aws:RequestedRegion': 'us-east-1',
                  },
                  IpAddress: {
                    'aws:SourceIp': allowedIpRanges,
                  },
                },
              },
            ],
          })
        ),
        roleName: `tap-data-access-role-${environmentSuffix}`,
        policies: enableEnhancedSecurity
          ? [
              createTimeBasedS3AccessPolicy(primaryBucket.bucket.arn),
              createMFAEnforcedPolicy(),
            ]
          : [
              createS3AccessPolicy(primaryBucket.bucket.arn),
              createMFAEnforcedPolicy(),
            ],
        managedPolicyArns: [],
        requireMFA: true,
        tags: {
          Purpose:
            'Data access with enhanced MFA enforcement and time restrictions',
          Environment: environmentSuffix,
        },
      },
      { parent: this, provider }
    );

    const auditRole = new SecureIAMRole(
      `tap-audit-access-${environmentSuffix}`,
      {
        assumeRolePolicy: pulumi.all([accountId]).apply(([accountId]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Action: 'sts:AssumeRole',
                Effect: 'Allow',
                Principal: {
                  AWS: `arn:aws:iam::${accountId}:root`,
                },
                Condition: {
                  Bool: {
                    'aws:MultiFactorAuthPresent': 'true',
                  },
                  StringEquals: {
                    'aws:RequestedRegion': 'us-east-1',
                  },
                  IpAddress: {
                    'aws:SourceIp': allowedIpRanges,
                  },
                },
              },
            ],
          })
        ),
        roleName: `tap-audit-access-role-${environmentSuffix}`,
        policies: enableEnhancedSecurity
          ? [
              createRestrictedAuditPolicy(
                auditBucket.bucket.arn,
                allowedIpRanges
              ),
            ]
          : [
              pulumi.interpolate`{
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Action": [
                "s3:GetObject",
                "s3:ListBucket"
              ],
              "Resource": [
                "${auditBucket.bucket.arn}",
                "${auditBucket.bucket.arn}/*"
              ]
            },
            {
              "Effect": "Allow",
              "Action": [
                "cloudtrail:LookupEvents",
                "cloudtrail:GetTrailStatus"
              ],
              "Resource": "*"
            }
          ]
        }`,
            ],
        managedPolicyArns: ['arn:aws:iam::aws:policy/ReadOnlyAccess'],
        requireMFA: true,
        tags: {
          Purpose: 'Audit log access with IP and time restrictions',
          Environment: environmentSuffix,
        },
      },
      { parent: this, provider }
    );

    // Create CloudTrail for comprehensive logging
    let cloudTrail: SecureCloudTrail | EnhancedCloudTrail;

    if (enableEnhancedSecurity) {
      cloudTrail = new EnhancedCloudTrail(
        `tap-security-audit-${environmentSuffix}`,
        {
          trailName: `tap-security-audit-trail-${environmentSuffix}`,
          s3BucketName: auditBucket.bucket.id,
          kmsKeyId: cloudTrailKmsKey.key.arn,
          includeGlobalServiceEvents: true,
          isMultiRegionTrail: true,
          enableLogFileValidation: true,
          enableInsightSelectors: true,
          tags: {
            Purpose:
              'Enhanced security audit and compliance with anomaly detection',
            Environment: environmentSuffix,
          },
        },
        { parent: this, provider }
      );
    } else {
      cloudTrail = new SecureCloudTrail(
        `tap-security-audit-${environmentSuffix}`,
        {
          trailName: `tap-security-audit-trail-${environmentSuffix}`,
          s3BucketName: auditBucket.bucket.id,
          kmsKeyId: cloudTrailKmsKey.key.arn,
          includeGlobalServiceEvents: true,
          isMultiRegionTrail: true,
          enableLogFileValidation: true,
          tags: {
            Purpose: 'Security audit and compliance',
            Environment: environmentSuffix,
          },
        },
        { parent: this, provider }
      );
    }

    // Create additional security policies with enhanced controls
    const securityPolicy = new aws.iam.Policy(
      `tap-security-baseline-${environmentSuffix}`,
      {
        name: `SecurityBaseline-${environmentSuffix}`,
        description:
          'Enhanced baseline security policy with comprehensive MFA requirements',
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Sid: 'RequireMFAForAllSensitiveActions',
              Effect: 'Deny',
              Action: [
                'iam:CreateRole',
                'iam:DeleteRole',
                'iam:AttachRolePolicy',
                'iam:DetachRolePolicy',
                'iam:PutRolePolicy',
                'iam:DeleteRolePolicy',
                's3:DeleteBucket',
                's3:PutBucketPolicy',
                'kms:ScheduleKeyDeletion',
                'kms:DisableKey',
                'cloudtrail:DeleteTrail',
                'cloudtrail:StopLogging',
              ],
              Resource: '*',
              Condition: {
                BoolIfExists: {
                  'aws:MultiFactorAuthPresent': 'false',
                },
              },
            },
            {
              Sid: 'RestrictToUSEast1Only',
              Effect: 'Deny',
              Action: '*',
              Resource: '*',
              Condition: {
                StringNotEquals: {
                  'aws:RequestedRegion': 'us-east-1',
                },
              },
            },
            {
              Sid: 'RequireEncryptedStorage',
              Effect: 'Deny',
              Action: [
                's3:PutObject',
                'ebs:CreateVolume',
                'rds:CreateDBInstance',
              ],
              Resource: '*',
              Condition: {
                Bool: {
                  'aws:SecureTransport': 'false',
                },
              },
            },
          ],
        }),
        tags: { ...commonTags, ...tags },
      },
      { parent: this, provider }
    );

    // Assign outputs
    this.primaryBucketName = primaryBucket.bucket.id;
    this.primaryBucketArn = primaryBucket.bucket.arn;
    this.auditBucketName = auditBucket.bucket.id;
    this.auditBucketArn = auditBucket.bucket.arn;
    this.s3KmsKeyId = s3KmsKey.key.keyId;
    this.s3KmsKeyArn = s3KmsKey.key.arn;
    this.cloudTrailKmsKeyId = cloudTrailKmsKey.key.keyId;
    this.cloudTrailKmsKeyArn = cloudTrailKmsKey.key.arn;
    this.dataAccessRoleArn = dataAccessRole.role.arn;
    this.auditRoleArn = auditRole.role.arn;
    // CloudTrail outputs
    this.cloudTrailArn = cloudTrail.trail.arn;
    this.cloudTrailLogGroupArn = cloudTrail.logGroup.arn;
    this.securityPolicyArn = securityPolicy.arn;
    this.mfaEnforcementPolicyArn = securityPolicies.mfaEnforcementPolicy.arn;
    this.ec2LifecyclePolicyArn = securityPolicies.ec2LifecyclePolicy.arn;
    this.s3SecurityPolicyArn = securityPolicies.s3DenyInsecurePolicy.arn;
    this.cloudTrailProtectionPolicyArn =
      securityPolicies.cloudTrailProtectionPolicy.arn;
    this.kmsProtectionPolicyArn = securityPolicies.kmsKeyProtectionPolicy.arn;
    this.region = 'us-east-1';

    // Register the outputs of this component
    this.registerOutputs({
      primaryBucketName: this.primaryBucketName,
      primaryBucketArn: this.primaryBucketArn,
      auditBucketName: this.auditBucketName,
      auditBucketArn: this.auditBucketArn,
      s3KmsKeyId: this.s3KmsKeyId,
      s3KmsKeyArn: this.s3KmsKeyArn,
      cloudTrailKmsKeyId: this.cloudTrailKmsKeyId,
      cloudTrailKmsKeyArn: this.cloudTrailKmsKeyArn,
      dataAccessRoleArn: this.dataAccessRoleArn,
      auditRoleArn: this.auditRoleArn,
      // CloudTrail outputs
      cloudTrailArn: this.cloudTrailArn,
      cloudTrailLogGroupArn: this.cloudTrailLogGroupArn,
      securityPolicyArn: this.securityPolicyArn,
      mfaEnforcementPolicyArn: this.mfaEnforcementPolicyArn,
      ec2LifecyclePolicyArn: this.ec2LifecyclePolicyArn,
      s3SecurityPolicyArn: this.s3SecurityPolicyArn,
      cloudTrailProtectionPolicyArn: this.cloudTrailProtectionPolicyArn,
      kmsProtectionPolicyArn: this.kmsProtectionPolicyArn,
      region: this.region,
    });
  }
}
