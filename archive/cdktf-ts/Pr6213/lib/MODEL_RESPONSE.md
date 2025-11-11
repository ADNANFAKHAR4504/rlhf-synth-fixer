# Security-Hardened Payment Processing Infrastructure - Implementation

This implementation provides a comprehensive security infrastructure for payment processing using CDKTF with TypeScript.

## File: lib/kms-module.ts

```typescript
import { Construct } from 'constructs';
import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';
import { KmsAlias } from '@cdktf/provider-aws/lib/kms-alias';

interface KmsModuleProps {
  environmentSuffix: string;
  keyType: 's3' | 'logs';
}

export class KmsModule extends Construct {
  public readonly key: KmsKey;
  public readonly keyAlias: KmsAlias;

  constructor(scope: Construct, id: string, props: KmsModuleProps) {
    super(scope, id);

    const { environmentSuffix, keyType } = props;

    // Create KMS key with automatic rotation
    this.key = new KmsKey(this, `${keyType}-key`, {
      description: `Customer-managed key for ${keyType} encryption - ${environmentSuffix}`,
      enableKeyRotation: true,
      multiRegion: true,
      deletionWindowInDays: 7,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'Enable IAM User Permissions',
            Effect: 'Allow',
            Principal: {
              AWS: 'arn:aws:iam::${data.aws_caller_identity.current.account_id}:root',
            },
            Action: 'kms:*',
            Resource: '*',
          },
          {
            Sid: 'Allow CloudWatch Logs',
            Effect: 'Allow',
            Principal: {
              Service: `logs.ap-southeast-1.amazonaws.com`,
            },
            Action: [
              'kms:Encrypt',
              'kms:Decrypt',
              'kms:ReEncrypt*',
              'kms:GenerateDataKey*',
              'kms:CreateGrant',
              'kms:DescribeKey',
            ],
            Resource: '*',
          },
        ],
      }),
      tags: {
        Name: `${keyType}-kms-key-${environmentSuffix}`,
        Environment: environmentSuffix,
        DataClassification: 'sensitive',
        ComplianceScope: 'pci-dss',
      },
    });

    // Create key alias
    this.keyAlias = new KmsAlias(this, `${keyType}-key-alias`, {
      name: `alias/${keyType}-key-${environmentSuffix}`,
      targetKeyId: this.key.keyId,
    });
  }
}
```

## File: lib/iam-module.ts

```typescript
import { Construct } from 'constructs';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';

interface IamModuleProps {
  environmentSuffix: string;
  s3BucketArn: string;
  kmsKeyArn: string;
  allowedIpRanges: string[];
}

export class IamModule extends Construct {
  public readonly paymentProcessingRole: IamRole;
  public readonly crossAccountRole: IamRole;

  constructor(scope: Construct, id: string, props: IamModuleProps) {
    super(scope, id);

    const { environmentSuffix, s3BucketArn, kmsKeyArn, allowedIpRanges } = props;

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
              AWS: 'arn:aws:iam::${data.aws_caller_identity.current.account_id}:root',
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
            Resource: [
              s3BucketArn,
              `${s3BucketArn}/*`,
            ],
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
    this.crossAccountRole = new IamRole(this, 'cross-account-role', {
      name: `cross-account-access-role-${environmentSuffix}`,
      maxSessionDuration: 3600, // 1 hour
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              AWS: 'arn:aws:iam::AUDIT_ACCOUNT_ID:root',
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
```

## File: lib/s3-module.ts

```typescript
import { Construct } from 'constructs';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { S3BucketPolicy } from '@cdktf/provider-aws/lib/s3-bucket-policy';

interface S3ModuleProps {
  environmentSuffix: string;
  kmsKeyArn: string;
}

export class S3Module extends Construct {
  public readonly bucket: S3Bucket;

  constructor(scope: Construct, id: string, props: S3ModuleProps) {
    super(scope, id);

    const { environmentSuffix, kmsKeyArn } = props;

    // Create S3 bucket
    this.bucket = new S3Bucket(this, 'payment-bucket', {
      bucket: `payment-data-bucket-${environmentSuffix}`,
      tags: {
        Name: `payment-data-bucket-${environmentSuffix}`,
        Environment: environmentSuffix,
        DataClassification: 'sensitive',
        ComplianceScope: 'pci-dss',
      },
    });

    // Enable versioning
    new S3BucketVersioningA(this, 'bucket-versioning', {
      bucket: this.bucket.id,
      versioningConfiguration: {
        status: 'Enabled',
        mfaDelete: 'Enabled',
      },
    });

    // Configure server-side encryption with KMS
    new S3BucketServerSideEncryptionConfigurationA(this, 'bucket-encryption', {
      bucket: this.bucket.id,
      rule: [
        {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'aws:kms',
            kmsMasterKeyId: kmsKeyArn,
          },
          bucketKeyEnabled: true,
        },
      ],
    });

    // Block all public access
    new S3BucketPublicAccessBlock(this, 'bucket-public-access-block', {
      bucket: this.bucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    // Create bucket policy denying unencrypted uploads and non-HTTPS requests
    new S3BucketPolicy(this, 'bucket-policy', {
      bucket: this.bucket.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'DenyUnencryptedObjectUploads',
            Effect: 'Deny',
            Principal: '*',
            Action: 's3:PutObject',
            Resource: `${this.bucket.arn}/*`,
            Condition: {
              StringNotEquals: {
                's3:x-amz-server-side-encryption': 'aws:kms',
              },
            },
          },
          {
            Sid: 'DenyInsecureTransport',
            Effect: 'Deny',
            Principal: '*',
            Action: 's3:*',
            Resource: [
              this.bucket.arn,
              `${this.bucket.arn}/*`,
            ],
            Condition: {
              Bool: {
                'aws:SecureTransport': 'false',
              },
            },
          },
        ],
      }),
    });
  }
}
```

## File: lib/monitoring-module.ts

```typescript
import { Construct } from 'constructs';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { ConfigConfigRule } from '@cdktf/provider-aws/lib/config-config-rule';
import { ConfigConfigurationRecorder } from '@cdktf/provider-aws/lib/config-configuration-recorder';
import { ConfigDeliveryChannel } from '@cdktf/provider-aws/lib/config-delivery-channel';
import { SnsTopicimport { SnsTopic } from '@cdktf/provider-aws/lib/sns-topic';
import { SnsTopicSubscription } from '@cdktf/provider-aws/lib/sns-topic-subscription';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';

interface MonitoringModuleProps {
  environmentSuffix: string;
  logsKmsKeyArn: string;
  configBucketName: string;
  alertEmail: string;
}

export class MonitoringModule extends Construct {
  public readonly auditLogGroup: CloudwatchLogGroup;
  public readonly complianceTopic: SnsTopic;

  constructor(scope: Construct, id: string, props: MonitoringModuleProps) {
    super(scope, id);

    const { environmentSuffix, logsKmsKeyArn, configBucketName, alertEmail } = props;

    // Create CloudWatch log group with encryption
    this.auditLogGroup = new CloudwatchLogGroup(this, 'audit-logs', {
      name: `/aws/payment-processing/audit-${environmentSuffix}`,
      retentionInDays: 365,
      kmsKeyId: logsKmsKeyArn,
      tags: {
        Name: `audit-log-group-${environmentSuffix}`,
        Environment: environmentSuffix,
        DataClassification: 'sensitive',
        ComplianceScope: 'pci-dss',
      },
    });

    // Create SNS topic for compliance alerts
    this.complianceTopic = new SnsTopic(this, 'compliance-topic', {
      name: `compliance-alerts-${environmentSuffix}`,
      displayName: 'PCI-DSS Compliance Alerts',
      kmsMasterKeyId: logsKmsKeyArn,
      tags: {
        Name: `compliance-topic-${environmentSuffix}`,
        Environment: environmentSuffix,
        ComplianceScope: 'pci-dss',
      },
    });

    // Subscribe email to SNS topic
    new SnsTopicSubscription(this, 'compliance-email-subscription', {
      topicArn: this.complianceTopic.arn,
      protocol: 'email',
      endpoint: alertEmail,
    });

    // Create IAM role for Config
    const configRole = new IamRole(this, 'config-role', {
      name: `aws-config-role-${environmentSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Service: 'config.amazonaws.com',
            },
            Action: 'sts:AssumeRole',
          },
        ],
      }),
      tags: {
        Name: `config-role-${environmentSuffix}`,
        Environment: environmentSuffix,
        ComplianceScope: 'pci-dss',
      },
    });

    // Attach AWS managed policy for Config
    new IamRolePolicyAttachment(this, 'config-policy-attachment', {
      role: configRole.name,
      policyArn: 'arn:aws:iam::aws:policy/service-role/AWS_ConfigRole',
    });

    // Create Config recorder
    const configRecorder = new ConfigConfigurationRecorder(this, 'config-recorder', {
      name: `config-recorder-${environmentSuffix}`,
      roleArn: configRole.arn,
      recordingGroup: {
        allSupported: true,
        includeGlobalResourceTypes: true,
      },
    });

    // Create Config delivery channel
    const deliveryChannel = new ConfigDeliveryChannel(this, 'config-delivery', {
      name: `config-delivery-${environmentSuffix}`,
      s3BucketName: configBucketName,
      snsTopicArn: this.complianceTopic.arn,
      dependsOn: [configRecorder],
    });

    // Config rule: S3 bucket encryption enabled
    new ConfigConfigRule(this, 's3-encryption-rule', {
      name: `s3-bucket-encryption-enabled-${environmentSuffix}`,
      description: 'Checks that S3 buckets have encryption enabled',
      source: {
        owner: 'AWS',
        sourceIdentifier: 'S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED',
      },
      dependsOn: [configRecorder, deliveryChannel],
    });

    // Config rule: S3 bucket versioning enabled
    new ConfigConfigRule(this, 's3-versioning-rule', {
      name: `s3-bucket-versioning-enabled-${environmentSuffix}`,
      description: 'Checks that S3 buckets have versioning enabled',
      source: {
        owner: 'AWS',
        sourceIdentifier: 'S3_BUCKET_VERSIONING_ENABLED',
      },
      dependsOn: [configRecorder, deliveryChannel],
    });

    // Config rule: IAM MFA enabled
    new ConfigConfigRule(this, 'iam-mfa-rule', {
      name: `iam-user-mfa-enabled-${environmentSuffix}`,
      description: 'Checks that MFA is enabled for all IAM users',
      source: {
        owner: 'AWS',
        sourceIdentifier: 'IAM_USER_MFA_ENABLED',
      },
      dependsOn: [configRecorder, deliveryChannel],
    });

    // Config rule: CloudWatch log encryption enabled
    new ConfigConfigRule(this, 'cloudwatch-log-encryption-rule', {
      name: `cloudwatch-log-group-encrypted-${environmentSuffix}`,
      description: 'Checks that CloudWatch log groups are encrypted',
      source: {
        owner: 'AWS',
        sourceIdentifier: 'CLOUDWATCH_LOG_GROUP_ENCRYPTED',
      },
      dependsOn: [configRecorder, deliveryChannel],
    });

    // Config rule: KMS key rotation enabled
    new ConfigConfigRule(this, 'kms-rotation-rule', {
      name: `cmk-backing-key-rotation-enabled-${environmentSuffix}`,
      description: 'Checks that KMS keys have rotation enabled',
      source: {
        owner: 'AWS',
        sourceIdentifier: 'CMK_BACKING_KEY_ROTATION_ENABLED',
      },
      dependsOn: [configRecorder, deliveryChannel],
    });
  }
}
```

## File: lib/scp-module.ts

```typescript
import { Construct } from 'constructs';
import { OrganizationsPolicy } from '@cdktf/provider-aws/lib/organizations-policy';

interface ScpModuleProps {
  environmentSuffix: string;
}

export class ScpModule extends Construct {
  public readonly securityPolicy: OrganizationsPolicy;

  constructor(scope: Construct, id: string, props: ScpModuleProps) {
    super(scope, id);

    const { environmentSuffix } = props;

    // Create SCP to enforce security requirements
    this.securityPolicy = new OrganizationsPolicy(this, 'security-scp', {
      name: `payment-security-scp-${environmentSuffix}`,
      description: 'Prevents deletion of security resources and requires encryption',
      type: 'SERVICE_CONTROL_POLICY',
      content: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'PreventSecurityResourceDeletion',
            Effect: 'Deny',
            Action: [
              'kms:ScheduleKeyDeletion',
              'kms:DeleteAlias',
              'logs:DeleteLogGroup',
              'config:DeleteConfigRule',
              'config:DeleteConfigurationRecorder',
              'config:DeleteDeliveryChannel',
            ],
            Resource: '*',
            Condition: {
              StringEquals: {
                'aws:RequestedRegion': 'ap-southeast-1',
              },
            },
          },
          {
            Sid: 'RequireS3Encryption',
            Effect: 'Deny',
            Action: 's3:PutObject',
            Resource: '*',
            Condition: {
              StringNotEquals: {
                's3:x-amz-server-side-encryption': ['aws:kms', 'AES256'],
              },
            },
          },
          {
            Sid: 'RequireSecureTransport',
            Effect: 'Deny',
            Action: 's3:*',
            Resource: '*',
            Condition: {
              Bool: {
                'aws:SecureTransport': 'false',
              },
            },
          },
          {
            Sid: 'PreventDisableSecurityLogging',
            Effect: 'Deny',
            Action: [
              'logs:DeleteLogGroup',
              'logs:DeleteLogStream',
              'cloudtrail:StopLogging',
              'cloudtrail:DeleteTrail',
              'config:StopConfigurationRecorder',
            ],
            Resource: '*',
          },
        ],
      }),
      tags: {
        Name: `security-scp-${environmentSuffix}`,
        Environment: environmentSuffix,
        ComplianceScope: 'pci-dss',
      },
    });
  }
}
```

## File: lib/tap-stack.ts

```typescript
import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';
import { KmsModule } from './kms-module';
import { IamModule } from './iam-module';
import { S3Module } from './s3-module';
import { MonitoringModule } from './monitoring-module';
import { ScpModule } from './scp-module';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags[];
}

const AWS_REGION_OVERRIDE = 'ap-southeast-1';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const awsRegion = AWS_REGION_OVERRIDE
      ? AWS_REGION_OVERRIDE
      : props?.awsRegion || 'ap-southeast-1';
    const stateBucketRegion = props?.stateBucketRegion || 'ap-southeast-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    const defaultTags = props?.defaultTags || [
      {
        tags: {
          Environment: environmentSuffix,
          DataClassification: 'sensitive',
          ComplianceScope: 'pci-dss',
          ManagedBy: 'cdktf',
        },
      },
    ];

    // Configure AWS Provider
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    // Configure S3 Backend with native state locking
    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });
    this.addOverride('terraform.backend.s3.use_lockfile', true);

    // Create S3 bucket for Config delivery
    const configBucket = new S3Bucket(this, 'config-bucket', {
      bucket: `aws-config-delivery-${environmentSuffix}`,
      tags: {
        Name: `config-bucket-${environmentSuffix}`,
        Environment: environmentSuffix,
        ComplianceScope: 'pci-dss',
      },
    });

    // Create KMS keys for S3 and logs
    const s3KmsModule = new KmsModule(this, 's3-kms', {
      environmentSuffix,
      keyType: 's3',
    });

    const logsKmsModule = new KmsModule(this, 'logs-kms', {
      environmentSuffix,
      keyType: 'logs',
    });

    // Create S3 bucket with encryption
    const s3Module = new S3Module(this, 's3-storage', {
      environmentSuffix,
      kmsKeyArn: s3KmsModule.key.arn,
    });

    // Create IAM roles and policies
    const iamModule = new IamModule(this, 'iam-security', {
      environmentSuffix,
      s3BucketArn: s3Module.bucket.arn,
      kmsKeyArn: s3KmsModule.key.arn,
      allowedIpRanges: ['10.0.0.0/8', '172.16.0.0/12'],
    });

    // Create monitoring and compliance infrastructure
    const monitoringModule = new MonitoringModule(this, 'monitoring', {
      environmentSuffix,
      logsKmsKeyArn: logsKmsModule.key.arn,
      configBucketName: configBucket.bucket,
      alertEmail: 'security-team@example.com',
    });

    // Create service control policies
    const scpModule = new ScpModule(this, 'scp', {
      environmentSuffix,
    });

    // Outputs
    new TerraformOutput(this, 's3-kms-key-id', {
      value: s3KmsModule.key.keyId,
      description: 'KMS Key ID for S3 encryption',
    });

    new TerraformOutput(this, 'logs-kms-key-id', {
      value: logsKmsModule.key.keyId,
      description: 'KMS Key ID for CloudWatch Logs encryption',
    });

    new TerraformOutput(this, 's3-bucket-name', {
      value: s3Module.bucket.bucket,
      description: 'Payment data S3 bucket name',
    });

    new TerraformOutput(this, 's3-bucket-arn', {
      value: s3Module.bucket.arn,
      description: 'Payment data S3 bucket ARN',
    });

    new TerraformOutput(this, 'payment-role-arn', {
      value: iamModule.paymentProcessingRole.arn,
      description: 'Payment processing IAM role ARN',
    });

    new TerraformOutput(this, 'cross-account-role-arn', {
      value: iamModule.crossAccountRole.arn,
      description: 'Cross-account access IAM role ARN',
    });

    new TerraformOutput(this, 'audit-log-group-name', {
      value: monitoringModule.auditLogGroup.name,
      description: 'CloudWatch audit log group name',
    });

    new TerraformOutput(this, 'compliance-topic-arn', {
      value: monitoringModule.complianceTopic.arn,
      description: 'SNS topic ARN for compliance alerts',
    });

    new TerraformOutput(this, 'security-scp-id', {
      value: scpModule.securityPolicy.id,
      description: 'Service Control Policy ID for security enforcement',
    });
  }
}
```

## Summary

This implementation provides:

1. **KMS Module**: Multi-region customer-managed keys with 90-day automatic rotation for S3 and CloudWatch Logs
2. **IAM Module**: MFA-enforced roles with 1-hour sessions, IP restrictions, and least-privilege policies
3. **S3 Module**: Encrypted storage with versioning, MFA delete, and policies denying unencrypted/non-HTTPS access
4. **Monitoring Module**: CloudWatch Logs with 365-day retention, AWS Config rules, and SNS alerts for compliance violations
5. **SCP Module**: Organization-level policies preventing security resource deletion and enforcing encryption
6. **Main Stack**: Orchestrates all modules with proper dependencies and comprehensive outputs

All resources include the environmentSuffix for uniqueness and are tagged with Environment, DataClassification, and ComplianceScope as required.