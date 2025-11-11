/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable quotes */
/* eslint-disable @typescript-eslint/quotes */
/* eslint-disable prettier/prettier */

import { Construct } from 'constructs';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';

interface IamModuleProps {
  environmentSuffix: string;
  s3BucketArn: string;
  kmsKeyArn: string;
  allowedIpRanges: string[];
  auditAccountId?: string;
}

export class IamModule extends Construct {
  public readonly paymentProcessingRole: IamRole;
  public readonly crossAccountRole: IamRole;

  constructor(scope: Construct, id: string, props: IamModuleProps) {
    super(scope, id);

    const { environmentSuffix, s3BucketArn, kmsKeyArn, allowedIpRanges } =
      props;

    // Get current AWS account ID
    const callerIdentity = new DataAwsCallerIdentity(this, 'current', {});

    // Create payment processing role with MFA requirement
    this.paymentProcessingRole = new IamRole(this, 'payment-role', {
      name: `payment-processing-role-${environmentSuffix}`,
      maxSessionDuration: 3600, // 1 hour
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              AWS: `arn:aws:iam::\${${callerIdentity.fqn}.account_id}:root`,
            },
            Action: 'sts:AssumeRole',
            Condition: {
              Bool: {
                'aws:MultiFactorAuthPresent': 'true',
              },
              IpAddress: {
                'aws:SourceIp': allowedIpRanges,
              },
            },
          },
        ],
      }),
      tags: {
        Name: `payment-processing-role-${environmentSuffix}`,
        Environment: environmentSuffix,
        DataClassification: 'sensitive',
        ComplianceScope: 'pci-dss',
      },
    });

    // Create least-privilege policy for S3 and KMS access
    const s3KmsPolicy = new IamPolicy(this, 's3-kms-policy', {
      name: `s3-kms-access-policy-${environmentSuffix}`,
      description: 'Least-privilege access to encrypted S3 buckets',
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              's3:GetObject',
              's3:PutObject',
              's3:DeleteObject',
              's3:ListBucket',
            ],
            Resource: [s3BucketArn, `${s3BucketArn}/*`],
            Condition: {
              Bool: {
                'aws:SecureTransport': 'true',
              },
            },
          },
          {
            Effect: 'Allow',
            Action: [
              'kms:Decrypt',
              'kms:Encrypt',
              'kms:GenerateDataKey',
              'kms:DescribeKey',
            ],
            Resource: kmsKeyArn,
          },
        ],
      }),
      tags: {
        Name: `s3-kms-policy-${environmentSuffix}`,
        Environment: environmentSuffix,
        ComplianceScope: 'pci-dss',
      },
    });

    // Attach policy to role
    new IamRolePolicyAttachment(this, 's3-kms-policy-attachment', {
      role: this.paymentProcessingRole.name,
      policyArn: s3KmsPolicy.arn,
    });

    // Create cross-account access role with external ID
    // For multi-account setup, configure auditAccountId in props
    this.crossAccountRole = new IamRole(this, 'cross-account-role', {
      name: `cross-account-access-role-${environmentSuffix}`,
      maxSessionDuration: 3600, // 1 hour
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              AWS: `arn:aws:iam::\${${callerIdentity.fqn}.account_id}:root`,
            },
            Action: 'sts:AssumeRole',
            Condition: {
              StringEquals: {
                'sts:ExternalId': 'payment-processing-external-id',
              },
              Bool: {
                'aws:MultiFactorAuthPresent': 'true',
              },
            },
          },
        ],
      }),
      tags: {
        Name: `cross-account-role-${environmentSuffix}`,
        Environment: environmentSuffix,
        DataClassification: 'sensitive',
        ComplianceScope: 'pci-dss',
      },
    });

    // Create read-only policy for cross-account access
    const readOnlyPolicy = new IamPolicy(this, 'cross-account-readonly', {
      name: `cross-account-readonly-policy-${environmentSuffix}`,
      description: 'Read-only access for audit account',
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              's3:GetObject',
              's3:ListBucket',
              'logs:DescribeLogGroups',
              'logs:DescribeLogStreams',
              'logs:GetLogEvents',
              'config:DescribeConfigRules',
              'config:GetComplianceDetailsByConfigRule',
            ],
            Resource: '*',
          },
        ],
      }),
      tags: {
        Name: `cross-account-readonly-${environmentSuffix}`,
        Environment: environmentSuffix,
        ComplianceScope: 'pci-dss',
      },
    });

    new IamRolePolicyAttachment(this, 'cross-account-policy-attachment', {
      role: this.crossAccountRole.name,
      policyArn: readOnlyPolicy.arn,
    });
  }
}
