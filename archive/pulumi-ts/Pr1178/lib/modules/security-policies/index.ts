import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { commonTags } from '../../config/tags';

export interface SecurityPoliciesArgs {
  environmentSuffix?: string;
  tags?: Record<string, string>;
}

export class SecurityPolicies extends pulumi.ComponentResource {
  public readonly mfaEnforcementPolicy: aws.iam.Policy;
  public readonly ec2LifecyclePolicy: aws.iam.Policy;
  public readonly s3DenyInsecurePolicy: aws.iam.Policy;
  public readonly cloudTrailProtectionPolicy: aws.iam.Policy;
  public readonly kmsKeyProtectionPolicy: aws.iam.Policy;

  constructor(
    name: string,
    args?: SecurityPoliciesArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:security:SecurityPolicies', name, args, opts);

    const environmentSuffix = args?.environmentSuffix || 'dev';
    const tags = { ...commonTags, ...args?.tags };

    // Enhanced MFA enforcement policy for ALL sensitive actions
    this.mfaEnforcementPolicy = new aws.iam.Policy(
      `${name}-mfa-enforcement`,
      {
        name: `MFAEnforcementPolicy-${environmentSuffix}`,
        description: 'Enforces MFA for all sensitive AWS operations',
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Sid: 'DenySensitiveActionsWithoutMFA',
              Effect: 'Deny',
              Action: [
                'iam:DeleteRole',
                'iam:DeleteUser',
                's3:DeleteBucket',
                'kms:ScheduleKeyDeletion',
              ],
              Resource: '*',
              Condition: {
                Bool: {
                  'aws:MultiFactorAuthPresent': 'false',
                },
              },
            },
            {
              Sid: 'DenyRootAccountUsage',
              Effect: 'Deny',
              Action: '*',
              Resource: '*',
              Condition: {
                StringEquals: {
                  'aws:userid': 'root',
                },
              },
            },
          ],
        }),
        tags,
      },
      { parent: this }
    );

    // Conditional EC2 instance lifecycle policy
    this.ec2LifecyclePolicy = new aws.iam.Policy(
      `${name}-ec2-lifecycle`,
      {
        name: `EC2LifecyclePolicy-${environmentSuffix}`,
        description:
          'Conditional restrictions for EC2 instance lifecycle operations',
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Sid: 'DenyProductionInstanceTermination',
              Effect: 'Deny',
              Action: 'ec2:TerminateInstances',
              Resource: '*',
              Condition: {
                StringLike: {
                  'ec2:ResourceTag/Environment': 'prod*',
                },
              },
            },
            {
              Sid: 'AllowNonProductionOperations',
              Effect: 'Allow',
              Action: ['ec2:StopInstances', 'ec2:StartInstances'],
              Resource: '*',
            },
          ],
        }),
        tags,
      },
      { parent: this }
    );

    // S3 security enforcement policy
    this.s3DenyInsecurePolicy = new aws.iam.Policy(
      `${name}-s3-security`,
      {
        name: `S3SecurityPolicy-${environmentSuffix}`,
        description: 'Enforces secure S3 operations only',
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Sid: 'DenyInsecureTransport',
              Effect: 'Deny',
              Action: 's3:*',
              Resource: ['arn:aws:s3:::*', 'arn:aws:s3:::*/*'],
              Condition: {
                Bool: {
                  'aws:SecureTransport': 'false',
                },
              },
            },
            {
              Sid: 'DenyUnencryptedUploads',
              Effect: 'Deny',
              Action: 's3:PutObject',
              Resource: 'arn:aws:s3:::*/*',
              Condition: {
                StringNotEquals: {
                  's3:x-amz-server-side-encryption': 'aws:kms',
                },
              },
            },
          ],
        }),
        tags,
      },
      { parent: this }
    );

    // CloudTrail protection policy
    this.cloudTrailProtectionPolicy = new aws.iam.Policy(
      `${name}-cloudtrail-protection`,
      {
        name: `CloudTrailProtectionPolicy-${environmentSuffix}`,
        description: 'Protects CloudTrail from unauthorized modifications',
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Sid: 'DenyCloudTrailDisabling',
              Effect: 'Deny',
              Action: ['cloudtrail:StopLogging', 'cloudtrail:DeleteTrail'],
              Resource: '*',
            },
          ],
        }),
        tags,
      },
      { parent: this }
    );

    // KMS key protection policy
    this.kmsKeyProtectionPolicy = new aws.iam.Policy(
      `${name}-kms-protection`,
      {
        name: `KMSKeyProtectionPolicy-${environmentSuffix}`,
        description: 'Protects KMS keys from unauthorized access and deletion',
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Sid: 'DenyKMSKeyDeletion',
              Effect: 'Deny',
              Action: ['kms:ScheduleKeyDeletion', 'kms:DisableKey'],
              Resource: '*',
            },
          ],
        }),
        tags,
      },
      { parent: this }
    );

    this.registerOutputs({
      mfaEnforcementPolicyArn: this.mfaEnforcementPolicy.arn,
      ec2LifecyclePolicyArn: this.ec2LifecyclePolicy.arn,
      s3DenyInsecurePolicyArn: this.s3DenyInsecurePolicy.arn,
      cloudTrailProtectionPolicyArn: this.cloudTrailProtectionPolicy.arn,
      kmsKeyProtectionPolicyArn: this.kmsKeyProtectionPolicy.arn,
    });
  }
}

// Enhanced least privilege S3 policy with time-based access
export function createTimeBasedS3AccessPolicy(
  bucketArn: pulumi.Input<string>,
  allowedHours: string[] = [
    '09',
    '10',
    '11',
    '12',
    '13',
    '14',
    '15',
    '16',
    '17',
  ]
): pulumi.Output<string> {
  return pulumi.interpolate`{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": [
          "s3:GetObject"
        ],
        "Resource": "${bucketArn}/*",
        "Condition": {
          "DateGreaterThan": {
            "aws:TokenIssueTime": "2024-01-01T00:00:00Z"
          },
          "StringLike": {
            "aws:RequestedRegion": "us-east-1"
          }
        }
      },
      {
        "Effect": "Allow",
        "Action": [
          "s3:PutObject"
        ],
        "Resource": "${bucketArn}/*",
        "Condition": {
          "StringEquals": {
            "s3:x-amz-server-side-encryption": "aws:kms"
          },
          "StringLike": {
            "aws:RequestedRegion": "us-east-1"
          },
          "ForAllValues:StringEquals": {
            "aws:RequestedHour": ${JSON.stringify(allowedHours)}
          }
        }
      },
      {
        "Effect": "Allow",
        "Action": [
          "s3:ListBucket"
        ],
        "Resource": "${bucketArn}",
        "Condition": {
          "StringLike": {
            "aws:RequestedRegion": "us-east-1"
          }
        }
      },
      {
        "Effect": "Deny",
        "Action": [
          "s3:DeleteObject",
          "s3:DeleteObjectVersion"
        ],
        "Resource": "${bucketArn}/*"
      }
    ]
  }`;
}

// Read-only audit access policy with IP restrictions
export function createRestrictedAuditPolicy(
  auditBucketArn: pulumi.Input<string>,
  allowedIpRanges: string[] = ['203.0.113.0/24']
): pulumi.Output<string> {
  return pulumi.interpolate`{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": [
          "s3:GetObject",
          "s3:ListBucket"
        ],
        "Resource": [
          "${auditBucketArn}",
          "${auditBucketArn}/*"
        ],
        "Condition": {
          "IpAddress": {
            "aws:SourceIp": ${JSON.stringify(allowedIpRanges)}
          },
          "StringLike": {
            "aws:RequestedRegion": "us-east-1"
          }
        }
      },
      {
        "Effect": "Allow",
        "Action": [
          "cloudtrail:LookupEvents"
        ],
        "Resource": "*",
        "Condition": {
          "IpAddress": {
            "aws:SourceIp": ${JSON.stringify(allowedIpRanges)}
          },
          "StringLike": {
            "aws:RequestedRegion": "us-east-1"
          }
        }
      },
      {
        "Effect": "Deny",
        "NotAction": [
          "s3:GetObject",
          "s3:ListBucket",
          "cloudtrail:LookupEvents",
          "cloudtrail:GetTrailStatus"
        ],
        "Resource": "*"
      }
    ]
  }`;
}
