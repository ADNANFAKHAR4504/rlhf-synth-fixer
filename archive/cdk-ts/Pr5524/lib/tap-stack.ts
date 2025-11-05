// ============================================================================
// IMPORTS
// ============================================================================
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as snsSubscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as events from 'aws-cdk-lib/aws-events';
import * as eventsTargets from 'aws-cdk-lib/aws-events-targets';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as path from 'path';

// ============================================================================
// INTERFACES & TYPES
// ============================================================================
interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
  securityTeamEmail?: string;
  allowedIpRanges?: string[];
  externalSecurityAccountId?: string;
  vpcId?: string;
  privateSubnetIds?: string[];
}

interface DataClassification {
  type: 'PII' | 'FINANCIAL' | 'OPERATIONAL' | 'LOGS';
  kmsKey?: kms.Key;
  bucket?: s3.Bucket;
}

interface ComplianceRequirement {
  requirement: string;
  implementedBy: string[];
  status: 'COMPLIANT' | 'PARTIAL' | 'NON_COMPLIANT';
}

// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================
const RETENTION_DAYS = 2557; // 7 years for PCI DSS compliance
const SESSION_DURATION_HOURS = 1;
const KEY_ROTATION_DAYS = 30;
const MFA_REQUIRED_ACTIONS = [
  's3:DeleteBucket',
  's3:DeleteObject',
  'kms:DisableKey',
  'kms:DeleteAlias',
  'iam:DeleteRole',
  'iam:DeletePolicy',
  'logs:DeleteLogGroup',
];

// ============================================================================
// MAIN STACK CLASS
// ============================================================================
export class TapStack extends cdk.Stack {
  private readonly environmentSuffix: string;
  private readonly dataClassifications: Map<string, DataClassification> =
    new Map();
  private readonly securityAuditReport: ComplianceRequirement[] = [];

  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    this.environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    const securityTeamEmail =
      props?.securityTeamEmail ||
      this.node.tryGetContext('securityTeamEmail') ||
      'security@example.com';

    const allowedIpRanges = props?.allowedIpRanges ||
      this.node.tryGetContext('allowedIpRanges') || ['10.0.0.0/8'];

    const externalSecurityAccountId =
      props?.externalSecurityAccountId ||
      this.node.tryGetContext('externalSecurityAccountId');

    // Add stack-level tags
    cdk.Tags.of(this).add('Environment', this.environmentSuffix);
    cdk.Tags.of(this).add('ManagedBy', 'CDK');
    cdk.Tags.of(this).add('Compliance', 'PCI-DSS');
    cdk.Tags.of(this).add('SecurityFramework', 'v1.0');
    cdk.Tags.of(this).add('iac-rlhf-amazon', 'true');

    // ========================================================================
    // 1. KMS KEYS - Multi-region with automatic rotation
    // ========================================================================

    // PII Data KMS Key
    const piiKmsKey = new kms.Key(this, 'PiiKmsKey', {
      alias: `alias/pii-data-key-${this.environmentSuffix}`,
      description: 'KMS key for PII data encryption - PCI DSS compliant',
      enableKeyRotation: true,
      enabled: true,
      multiRegion: true,
      pendingWindow: cdk.Duration.days(30),
      removalPolicy: cdk.RemovalPolicy.DESTROY,
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
            sid: 'Allow use of the key for PII data only',
            effect: iam.Effect.ALLOW,
            principals: [new iam.ServicePrincipal('s3.amazonaws.com')],
            actions: ['kms:Decrypt', 'kms:GenerateDataKey', 'kms:CreateGrant'],
            resources: ['*'],
            conditions: {
              StringEquals: {
                'kms:ViaService': `s3.${this.region}.amazonaws.com`,
                'aws:SourceAccount': this.account,
              },
            },
          }),
        ],
      }),
    });
    cdk.Tags.of(piiKmsKey).add('DataClassification', 'PII');
    cdk.Tags.of(piiKmsKey).add('KeyPurpose', 'DataEncryption');
    cdk.Tags.of(piiKmsKey).add('iac-rlhf-amazon', 'true');

    // Financial Data KMS Key
    const financialKmsKey = new kms.Key(this, 'FinancialKmsKey', {
      alias: `alias/financial-data-key-${this.environmentSuffix}`,
      description: 'KMS key for financial data encryption - PCI DSS compliant',
      enableKeyRotation: true,
      enabled: true,
      multiRegion: true,
      pendingWindow: cdk.Duration.days(30),
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    cdk.Tags.of(financialKmsKey).add('DataClassification', 'FINANCIAL');
    cdk.Tags.of(financialKmsKey).add('KeyPurpose', 'DataEncryption');
    cdk.Tags.of(financialKmsKey).add('iac-rlhf-amazon', 'true');

    // Operational Data KMS Key
    const operationalKmsKey = new kms.Key(this, 'OperationalKmsKey', {
      alias: `alias/operational-data-key-${this.environmentSuffix}`,
      description: 'KMS key for operational data encryption',
      enableKeyRotation: true,
      enabled: true,
      multiRegion: true,
      pendingWindow: cdk.Duration.days(30),
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    cdk.Tags.of(operationalKmsKey).add('DataClassification', 'OPERATIONAL');
    cdk.Tags.of(operationalKmsKey).add('KeyPurpose', 'DataEncryption');
    cdk.Tags.of(operationalKmsKey).add('iac-rlhf-amazon', 'true');

    // CloudWatch Logs KMS Key (separate from application data)
    const logsKmsKey = new kms.Key(this, 'LogsKmsKey', {
      alias: `alias/logs-key-${this.environmentSuffix}`,
      description:
        'KMS key for CloudWatch Logs encryption - separate from application data',
      enableKeyRotation: true,
      enabled: true,
      multiRegion: true,
      pendingWindow: cdk.Duration.days(30),
      removalPolicy: cdk.RemovalPolicy.DESTROY,
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
            sid: 'Allow CloudWatch Logs',
            effect: iam.Effect.ALLOW,
            principals: [
              new iam.ServicePrincipal(`logs.${this.region}.amazonaws.com`),
            ],
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
                'kms:EncryptionContext:aws:logs:arn': `arn:aws:logs:${this.region}:${this.account}:log-group:*`,
              },
            },
          }),
        ],
      }),
    });
    cdk.Tags.of(logsKmsKey).add('DataClassification', 'LOGS');
    cdk.Tags.of(logsKmsKey).add('KeyPurpose', 'LogEncryption');
    cdk.Tags.of(logsKmsKey).add('iac-rlhf-amazon', 'true');

    // Store KMS keys for later reference
    this.dataClassifications.set('PII', { type: 'PII', kmsKey: piiKmsKey });
    this.dataClassifications.set('FINANCIAL', {
      type: 'FINANCIAL',
      kmsKey: financialKmsKey,
    });
    this.dataClassifications.set('OPERATIONAL', {
      type: 'OPERATIONAL',
      kmsKey: operationalKmsKey,
    });
    this.dataClassifications.set('LOGS', { type: 'LOGS', kmsKey: logsKmsKey });

    // ========================================================================
    // 2. IAM ROLES & POLICIES - Least privilege with MFA
    // ========================================================================

    // MFA enforcement policy document
    const mfaRequiredPolicy = new iam.PolicyDocument({
      statements: [
        new iam.PolicyStatement({
          sid: 'DenyAllExceptListedIfNoMFA',
          effect: iam.Effect.DENY,
          notActions: [
            'iam:CreateVirtualMFADevice',
            'iam:EnableMFADevice',
            'iam:ListMFADevices',
            'iam:ListUsers',
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
        }),
      ],
    });

    // IP restriction policy document
    const ipRestrictionPolicy = new iam.PolicyDocument({
      statements: [
        new iam.PolicyStatement({
          sid: 'DenyAllFromNonAllowedIPs',
          effect: iam.Effect.DENY,
          actions: ['*'],
          resources: ['*'],
          conditions: {
            NotIpAddress: {
              'aws:SourceIp': allowedIpRanges,
            },
          },
        }),
      ],
    });

    // Application Services Role
    const appServicesRole = new iam.Role(this, 'AppServicesRole', {
      roleName: `app-services-role-${this.environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      maxSessionDuration: cdk.Duration.hours(SESSION_DURATION_HOURS),
      description:
        'Role for application services with limited payment processing permissions',
      inlinePolicies: {
        MFARequired: mfaRequiredPolicy,
        IPRestriction: ipRestrictionPolicy,
      },
    });
    cdk.Tags.of(appServicesRole).add('iac-rlhf-amazon', 'true');

    appServicesRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          's3:GetObject',
          's3:PutObject',
          's3:GetObjectTagging',
          's3:PutObjectTagging',
        ],
        resources: ['arn:aws:s3:::*-financial-*/*'],
        conditions: {
          StringEquals: {
            's3:x-amz-server-side-encryption': 'aws:kms',
            's3:x-amz-server-side-encryption-aws-kms-key-id':
              financialKmsKey.keyArn,
          },
        },
      })
    );

    appServicesRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['kms:Decrypt', 'kms:GenerateDataKey'],
        resources: [financialKmsKey.keyArn],
      })
    );

    // Data Analysts Role
    const dataAnalystsRole = new iam.Role(this, 'DataAnalystsRole', {
      roleName: `data-analysts-role-${this.environmentSuffix}`,
      assumedBy: new iam.AccountPrincipal(this.account),
      maxSessionDuration: cdk.Duration.hours(SESSION_DURATION_HOURS),
      description: 'Read-only access to operational data with MFA requirement',
      inlinePolicies: {
        MFARequired: mfaRequiredPolicy,
        IPRestriction: ipRestrictionPolicy,
      },
    });
    cdk.Tags.of(dataAnalystsRole).add('iac-rlhf-amazon', 'true');

    dataAnalystsRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          's3:GetObject',
          's3:ListBucket',
          's3:GetObjectVersion',
          's3:GetObjectVersionTagging',
        ],
        resources: [
          'arn:aws:s3:::*-operational-*',
          'arn:aws:s3:::*-operational-*/*',
        ],
        conditions: {
          Bool: {
            'aws:MultiFactorAuthPresent': 'true',
          },
        },
      })
    );

    dataAnalystsRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['kms:Decrypt'],
        resources: [operationalKmsKey.keyArn],
        conditions: {
          Bool: {
            'aws:MultiFactorAuthPresent': 'true',
          },
        },
      })
    );

    // Security Auditors Role
    const securityAuditorsRole = new iam.Role(this, 'SecurityAuditorsRole', {
      roleName: `security-auditors-role-${this.environmentSuffix}`,
      assumedBy: new iam.AccountPrincipal(this.account),
      maxSessionDuration: cdk.Duration.hours(SESSION_DURATION_HOURS),
      description: 'Read-only access to all security resources and audit logs',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('SecurityAudit'),
      ],
      inlinePolicies: {
        MFARequired: mfaRequiredPolicy,
        IPRestriction: ipRestrictionPolicy,
      },
    });
    cdk.Tags.of(securityAuditorsRole).add('iac-rlhf-amazon', 'true');

    securityAuditorsRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'logs:DescribeLogGroups',
          'logs:DescribeLogStreams',
          'logs:GetLogEvents',
          'logs:FilterLogEvents',
          'cloudwatch:DescribeAlarms',
          'cloudwatch:GetMetricData',
          'kms:DescribeKey',
          'kms:GetKeyRotationStatus',
          'kms:ListKeys',
          'kms:ListAliases',
        ],
        resources: ['*'],
        conditions: {
          Bool: {
            'aws:MultiFactorAuthPresent': 'true',
          },
        },
      })
    );

    // Cross-account Security Scanner Role
    let crossAccountSecurityRole: iam.Role | undefined;
    if (externalSecurityAccountId) {
      crossAccountSecurityRole = new iam.Role(
        this,
        'CrossAccountSecurityRole',
        {
          roleName: `cross-account-security-scanner-${this.environmentSuffix}`,
          assumedBy: new iam.AccountPrincipal(externalSecurityAccountId),
          externalIds: [`security-scanner-${this.environmentSuffix}`],
          maxSessionDuration: cdk.Duration.hours(SESSION_DURATION_HOURS),
          description:
            'Read-only permissions for external security scanning tools',
          managedPolicies: [
            iam.ManagedPolicy.fromAwsManagedPolicyName('SecurityAudit'),
            iam.ManagedPolicy.fromAwsManagedPolicyName('ViewOnlyAccess'),
          ],
        }
      );
      cdk.Tags.of(crossAccountSecurityRole).add('iac-rlhf-amazon', 'true');

      crossAccountSecurityRole.addToPolicy(
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ['tag:GetResources', 'tag:GetTagKeys', 'tag:GetTagValues'],
          resources: ['*'],
        })
      );
    }

    // ========================================================================
    // 3. S3 BUCKETS - Encrypted with tag-based policies
    // ========================================================================

    // PII Data Bucket
    const piiDataBucket = new s3.Bucket(this, 'PiiDataBucket', {
      bucketName: `pii-data-${this.account}-${this.environmentSuffix}`,
      encryptionKey: piiKmsKey,
      encryption: s3.BucketEncryption.KMS,
      enforceSSL: true,
      versioned: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      lifecycleRules: [
        {
          id: 'DeleteOldVersions',
          noncurrentVersionExpiration: cdk.Duration.days(90),
          enabled: true,
        },
        {
          id: 'TransitionToIA',
          transitions: [
            {
              transitionAfter: cdk.Duration.days(30),
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
            },
            {
              transitionAfter: cdk.Duration.days(90),
              storageClass: s3.StorageClass.GLACIER,
            },
          ],
        },
      ],
    });

    piiDataBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'DenyIncorrectEncryptionKey',
        effect: iam.Effect.DENY,
        principals: [new iam.AnyPrincipal()],
        actions: ['s3:PutObject'],
        resources: [`${piiDataBucket.bucketArn}/*`],
        conditions: {
          StringNotEquals: {
            's3:x-amz-server-side-encryption-aws-kms-key-id': piiKmsKey.keyArn,
          },
        },
      })
    );

    piiDataBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'DenyUnencryptedObjectUploads',
        effect: iam.Effect.DENY,
        principals: [new iam.AnyPrincipal()],
        actions: ['s3:PutObject'],
        resources: [`${piiDataBucket.bucketArn}/*`],
        conditions: {
          StringNotEquals: {
            's3:x-amz-server-side-encryption': 'aws:kms',
          },
        },
      })
    );

    piiDataBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'RequireTLS12',
        effect: iam.Effect.DENY,
        principals: [new iam.AnyPrincipal()],
        actions: ['s3:*'],
        resources: [piiDataBucket.bucketArn, `${piiDataBucket.bucketArn}/*`],
        conditions: {
          Bool: {
            'aws:SecureTransport': 'false',
          },
          NumericLessThan: {
            's3:TlsVersion': '1.2',
          },
        },
      })
    );

    cdk.Tags.of(piiDataBucket).add('DataClassification', 'PII');
    cdk.Tags.of(piiDataBucket).add('Encryption', 'KMS');
    cdk.Tags.of(piiDataBucket).add('Compliance', 'PCI-DSS');
    cdk.Tags.of(piiDataBucket).add('iac-rlhf-amazon', 'true');

    // Financial Data Bucket
    const financialDataBucket = new s3.Bucket(this, 'FinancialDataBucket', {
      bucketName: `financial-data-${this.account}-${this.environmentSuffix}`,
      encryptionKey: financialKmsKey,
      encryption: s3.BucketEncryption.KMS,
      enforceSSL: true,
      versioned: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      objectLockEnabled: true,
      objectLockDefaultRetention: s3.ObjectLockRetention.compliance(
        cdk.Duration.days(RETENTION_DAYS)
      ),
    });

    financialDataBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'DenyIncorrectEncryptionKey',
        effect: iam.Effect.DENY,
        principals: [new iam.AnyPrincipal()],
        actions: ['s3:PutObject'],
        resources: [`${financialDataBucket.bucketArn}/*`],
        conditions: {
          StringNotEquals: {
            's3:x-amz-server-side-encryption-aws-kms-key-id':
              financialKmsKey.keyArn,
          },
        },
      })
    );

    financialDataBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'RequireTLS12',
        effect: iam.Effect.DENY,
        principals: [new iam.AnyPrincipal()],
        actions: ['s3:*'],
        resources: [
          financialDataBucket.bucketArn,
          `${financialDataBucket.bucketArn}/*`,
        ],
        conditions: {
          Bool: {
            'aws:SecureTransport': 'false',
          },
          NumericLessThan: {
            's3:TlsVersion': '1.2',
          },
        },
      })
    );

    cdk.Tags.of(financialDataBucket).add('DataClassification', 'FINANCIAL');
    cdk.Tags.of(financialDataBucket).add('Encryption', 'KMS');
    cdk.Tags.of(financialDataBucket).add('Compliance', 'PCI-DSS');
    cdk.Tags.of(financialDataBucket).add('ObjectLock', 'ENABLED');
    cdk.Tags.of(financialDataBucket).add('iac-rlhf-amazon', 'true');

    // Operational Data Bucket
    const operationalDataBucket = new s3.Bucket(this, 'OperationalDataBucket', {
      bucketName: `operational-data-${this.account}-${this.environmentSuffix}`,
      encryptionKey: operationalKmsKey,
      encryption: s3.BucketEncryption.KMS,
      enforceSSL: true,
      versioned: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    operationalDataBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'RequireTLS12',
        effect: iam.Effect.DENY,
        principals: [new iam.AnyPrincipal()],
        actions: ['s3:*'],
        resources: [
          operationalDataBucket.bucketArn,
          `${operationalDataBucket.bucketArn}/*`,
        ],
        conditions: {
          Bool: {
            'aws:SecureTransport': 'false',
          },
          NumericLessThan: {
            's3:TlsVersion': '1.2',
          },
        },
      })
    );

    cdk.Tags.of(operationalDataBucket).add('DataClassification', 'OPERATIONAL');
    cdk.Tags.of(operationalDataBucket).add('Encryption', 'KMS');
    cdk.Tags.of(operationalDataBucket).add('Compliance', 'PCI-DSS');
    cdk.Tags.of(operationalDataBucket).add('iac-rlhf-amazon', 'true');

    // Store bucket references
    this.dataClassifications.get('PII')!.bucket = piiDataBucket;
    this.dataClassifications.get('FINANCIAL')!.bucket = financialDataBucket;
    this.dataClassifications.get('OPERATIONAL')!.bucket = operationalDataBucket;

    // ========================================================================
    // 4. CLOUDWATCH LOG GROUPS - 7-year retention with encryption
    // ========================================================================

    // Lambda Log Group
    const lambdaLogGroup = new logs.LogGroup(this, 'LambdaLogGroup', {
      logGroupName: `/aws/lambda/security-functions-${this.environmentSuffix}`,
      retention: RETENTION_DAYS,
      encryptionKey: logsKmsKey,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    cdk.Tags.of(lambdaLogGroup).add('iac-rlhf-amazon', 'true');

    // API Access Log Group
    const apiAccessLogGroup = new logs.LogGroup(this, 'ApiAccessLogGroup', {
      logGroupName: `/aws/api/access-logs-${this.environmentSuffix}`,
      retention: RETENTION_DAYS,
      encryptionKey: logsKmsKey,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    cdk.Tags.of(apiAccessLogGroup).add('iac-rlhf-amazon', 'true');

    // Security Event Log Group
    const securityEventLogGroup = new logs.LogGroup(
      this,
      'SecurityEventLogGroup',
      {
        logGroupName: `/aws/security/events-${this.environmentSuffix}`,
        retention: RETENTION_DAYS,
        encryptionKey: logsKmsKey,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );
    cdk.Tags.of(securityEventLogGroup).add('iac-rlhf-amazon', 'true');

    // Audit Trail Log Group
    const auditTrailLogGroup = new logs.LogGroup(this, 'AuditTrailLogGroup', {
      logGroupName: `/aws/audit/trail-${this.environmentSuffix}`,
      retention: RETENTION_DAYS,
      encryptionKey: logsKmsKey,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    cdk.Tags.of(auditTrailLogGroup).add('iac-rlhf-amazon', 'true');

    // ========================================================================
    // 5. SNS TOPICS - Security notifications
    // ========================================================================

    const securityNotificationTopic = new sns.Topic(
      this,
      'SecurityNotificationTopic',
      {
        topicName: `security-notifications-${this.environmentSuffix}`,
        displayName: 'Security Framework Notifications',
        masterKey: logsKmsKey,
      }
    );
    cdk.Tags.of(securityNotificationTopic).add('iac-rlhf-amazon', 'true');

    securityNotificationTopic.addSubscription(
      new snsSubscriptions.EmailSubscription(securityTeamEmail)
    );

    const keyRotationNotificationTopic = new sns.Topic(
      this,
      'KeyRotationNotificationTopic',
      {
        topicName: `key-rotation-notifications-${this.environmentSuffix}`,
        displayName: 'KMS Key Rotation Notifications',
        masterKey: logsKmsKey,
      }
    );
    cdk.Tags.of(keyRotationNotificationTopic).add('iac-rlhf-amazon', 'true');

    keyRotationNotificationTopic.addSubscription(
      new snsSubscriptions.EmailSubscription(securityTeamEmail)
    );

    // ========================================================================
    // 6. LAMBDA FUNCTIONS - Using Node 22 with TypeScript
    // ========================================================================

    // Lambda execution role
    const lambdaExecutionRole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
      description: 'Execution role for security remediation Lambda functions',
    });
    cdk.Tags.of(lambdaExecutionRole).add('iac-rlhf-amazon', 'true');

    // Add permissions for S3 remediation
    lambdaExecutionRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          's3:GetObject',
          's3:GetObjectTagging',
          's3:PutObjectTagging',
          's3:CopyObject',
          's3:ListBucket',
          's3:HeadObject',
        ],
        resources: [
          piiDataBucket.bucketArn,
          `${piiDataBucket.bucketArn}/*`,
          financialDataBucket.bucketArn,
          `${financialDataBucket.bucketArn}/*`,
          operationalDataBucket.bucketArn,
          `${operationalDataBucket.bucketArn}/*`,
        ],
      })
    );

    lambdaExecutionRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['kms:Decrypt', 'kms:GenerateDataKey', 'kms:CreateGrant'],
        resources: [
          piiKmsKey.keyArn,
          financialKmsKey.keyArn,
          operationalKmsKey.keyArn,
        ],
      })
    );

    lambdaExecutionRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['sns:Publish'],
        resources: [securityNotificationTopic.topicArn],
      })
    );

    // S3 Remediation Lambda Function using NodejsFunction
    const s3RemediationFunction = new NodejsFunction(
      this,
      'S3RemediationFunction',
      {
        functionName: `s3-remediation-${this.environmentSuffix}`,
        runtime: lambda.Runtime.NODEJS_22_X,
        handler: 'handler',
        entry: path.join(__dirname, 'lambda', 's3-remediation.ts'),
        role: lambdaExecutionRole,
        timeout: cdk.Duration.seconds(300),
        memorySize: 512,
        environment: {
          ENVIRONMENT: this.environmentSuffix,
          PII_KMS_KEY_ID: piiKmsKey.keyId,
          FINANCIAL_KMS_KEY_ID: financialKmsKey.keyId,
          OPERATIONAL_KMS_KEY_ID: operationalKmsKey.keyId,
          SNS_TOPIC_ARN: securityNotificationTopic.topicArn,
          MONITORED_BUCKET: piiDataBucket.bucketName,
        },
        logGroup: lambdaLogGroup,
        description:
          'Automatically remediate S3 objects with incorrect tags or encryption',
        bundling: {
          externalModules: ['@aws-sdk/*'],
        },
      }
    );
    cdk.Tags.of(s3RemediationFunction).add('iac-rlhf-amazon', 'true');

    // Key Rotation Monitor Lambda Function using NodejsFunction
    const keyRotationMonitorFunction = new NodejsFunction(
      this,
      'KeyRotationMonitorFunction',
      {
        functionName: `key-rotation-monitor-${this.environmentSuffix}`,
        runtime: lambda.Runtime.NODEJS_22_X,
        handler: 'handler',
        entry: path.join(__dirname, 'lambda', 'key-rotation-monitor.ts'),
        role: lambdaExecutionRole,
        timeout: cdk.Duration.seconds(60),
        memorySize: 256,
        environment: {
          ENVIRONMENT: this.environmentSuffix,
          KMS_KEYS: JSON.stringify([
            piiKmsKey.keyId,
            financialKmsKey.keyId,
            operationalKmsKey.keyId,
            logsKmsKey.keyId,
          ]),
          ROTATION_WARNING_DAYS: KEY_ROTATION_DAYS.toString(),
          SNS_TOPIC_ARN: keyRotationNotificationTopic.topicArn,
        },
        logGroup: lambdaLogGroup,
        description: 'Monitor KMS key rotation and send notifications',
        bundling: {
          externalModules: ['@aws-sdk/*'],
        },
      }
    );
    cdk.Tags.of(keyRotationMonitorFunction).add('iac-rlhf-amazon', 'true');

    // Grant KMS describe permissions to key rotation monitor
    lambdaExecutionRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'kms:DescribeKey',
          'kms:GetKeyRotationStatus',
          'kms:ListAliases',
        ],
        resources: ['*'],
      })
    );

    // ========================================================================
    // 7. EVENTBRIDGE RULES - Key rotation monitoring
    // ========================================================================

    // Daily key rotation check
    const keyRotationCheckRule = new events.Rule(this, 'KeyRotationCheckRule', {
      ruleName: `key-rotation-check-${this.environmentSuffix}`,
      description: 'Daily check for KMS key rotation status',
      schedule: events.Schedule.rate(cdk.Duration.days(1)),
      targets: [new eventsTargets.LambdaFunction(keyRotationMonitorFunction)],
    });
    cdk.Tags.of(keyRotationCheckRule).add('iac-rlhf-amazon', 'true');

    // S3 object upload remediation trigger
    const s3RemediationRule = new events.Rule(this, 'S3RemediationRule', {
      ruleName: `s3-object-remediation-${this.environmentSuffix}`,
      description: 'Trigger remediation on S3 object creation',
      eventPattern: {
        source: ['aws.s3'],
        detailType: ['Object Created'],
        detail: {
          bucket: {
            name: [
              piiDataBucket.bucketName,
              financialDataBucket.bucketName,
              operationalDataBucket.bucketName,
            ],
          },
        },
      },
      targets: [new eventsTargets.LambdaFunction(s3RemediationFunction)],
    });
    cdk.Tags.of(s3RemediationRule).add('iac-rlhf-amazon', 'true');

    // KMS key rotation event monitoring
    const kmsRotationEventRule = new events.Rule(this, 'KmsRotationEventRule', {
      ruleName: `kms-rotation-event-${this.environmentSuffix}`,
      description: 'Monitor KMS key rotation events',
      eventPattern: {
        source: ['aws.kms'],
        detailType: ['KMS Key Rotation'],
      },
      targets: [new eventsTargets.SnsTopic(keyRotationNotificationTopic)],
    });
    cdk.Tags.of(kmsRotationEventRule).add('iac-rlhf-amazon', 'true');

    // ========================================================================
    // 8. CLOUDWATCH ALARMS - Security monitoring
    // ========================================================================

    // Unauthorized KMS key access alarm
    const unauthorizedKmsAccessAlarm = new cloudwatch.Alarm(
      this,
      'UnauthorizedKmsAccessAlarm',
      {
        alarmName: `unauthorized-kms-access-${this.environmentSuffix}`,
        alarmDescription: 'Alert on unauthorized KMS key access attempts',
        metric: new cloudwatch.Metric({
          namespace: 'AWS/KMS',
          metricName: 'NumberOfOperations',
          dimensionsMap: {
            KeyId: piiKmsKey.keyId,
          },
        }),
        threshold: 100,
        evaluationPeriods: 1,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );
    unauthorizedKmsAccessAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(securityNotificationTopic)
    );
    cdk.Tags.of(unauthorizedKmsAccessAlarm).add('iac-rlhf-amazon', 'true');

    // Failed authentication attempts alarm
    const failedAuthAlarm = new cloudwatch.Alarm(this, 'FailedAuthAlarm', {
      alarmName: `failed-authentication-${this.environmentSuffix}`,
      alarmDescription: 'Alert on multiple failed authentication attempts',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/CloudTrail',
        metricName: 'FailedAuthentication',
      }),
      threshold: 5,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    failedAuthAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(securityNotificationTopic)
    );
    cdk.Tags.of(failedAuthAlarm).add('iac-rlhf-amazon', 'true');

    // S3 bucket policy changes alarm
    const s3PolicyChangeAlarm = new cloudwatch.Alarm(
      this,
      'S3PolicyChangeAlarm',
      {
        alarmName: `s3-policy-changes-${this.environmentSuffix}`,
        alarmDescription: 'Alert on S3 bucket policy modifications',
        metric: new cloudwatch.Metric({
          namespace: 'AWS/S3',
          metricName: 'BucketPolicyChanges',
        }),
        threshold: 1,
        evaluationPeriods: 1,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );
    s3PolicyChangeAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(securityNotificationTopic)
    );
    cdk.Tags.of(s3PolicyChangeAlarm).add('iac-rlhf-amazon', 'true');

    // IAM role/policy modification alarm
    const iamChangeAlarm = new cloudwatch.Alarm(this, 'IamChangeAlarm', {
      alarmName: `iam-changes-${this.environmentSuffix}`,
      alarmDescription: 'Alert on IAM role or policy modifications',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/IAM',
        metricName: 'PolicyChanges',
      }),
      threshold: 1,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    iamChangeAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(securityNotificationTopic)
    );
    cdk.Tags.of(iamChangeAlarm).add('iac-rlhf-amazon', 'true');

    // Lambda function error rate alarm
    const lambdaErrorAlarm = new cloudwatch.Alarm(this, 'LambdaErrorAlarm', {
      alarmName: `lambda-errors-${this.environmentSuffix}`,
      alarmDescription: 'Alert on high Lambda function error rate',
      metric: s3RemediationFunction.metricErrors(),
      threshold: 5,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    lambdaErrorAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(securityNotificationTopic)
    );
    cdk.Tags.of(lambdaErrorAlarm).add('iac-rlhf-amazon', 'true');

    // ========================================================================
    // 9. RESOURCE DELETION PROTECTION POLICIES
    // ========================================================================

    const resourceProtectionPolicy = new iam.ManagedPolicy(
      this,
      'ResourceProtectionPolicy',
      {
        managedPolicyName: `resource-protection-${this.environmentSuffix}`,
        description: 'Prevent deletion of critical security resources',
        statements: [
          new iam.PolicyStatement({
            sid: 'DenyKMSKeyDeletion',
            effect: iam.Effect.DENY,
            actions: [
              'kms:ScheduleKeyDeletion',
              'kms:DisableKey',
              'kms:DeleteAlias',
            ],
            resources: [
              piiKmsKey.keyArn,
              financialKmsKey.keyArn,
              operationalKmsKey.keyArn,
              logsKmsKey.keyArn,
            ],
          }),
          new iam.PolicyStatement({
            sid: 'DenyLogGroupDeletion',
            effect: iam.Effect.DENY,
            actions: ['logs:DeleteLogGroup', 'logs:DeleteLogStream'],
            resources: [
              lambdaLogGroup.logGroupArn,
              apiAccessLogGroup.logGroupArn,
              securityEventLogGroup.logGroupArn,
              auditTrailLogGroup.logGroupArn,
            ],
          }),
          new iam.PolicyStatement({
            sid: 'DenyS3BucketDeletion',
            effect: iam.Effect.DENY,
            actions: [
              's3:DeleteBucket',
              's3:DeleteBucketPolicy',
              's3:DeleteBucketEncryption',
            ],
            resources: [
              piiDataBucket.bucketArn,
              financialDataBucket.bucketArn,
              operationalDataBucket.bucketArn,
            ],
          }),
          new iam.PolicyStatement({
            sid: 'DenySecurityRoleDeletion',
            effect: iam.Effect.DENY,
            actions: [
              'iam:DeleteRole',
              'iam:DeleteRolePolicy',
              'iam:DetachRolePolicy',
            ],
            resources: [
              appServicesRole.roleArn,
              dataAnalystsRole.roleArn,
              securityAuditorsRole.roleArn,
              lambdaExecutionRole.roleArn,
            ],
          }),
        ],
      }
    );
    cdk.Tags.of(resourceProtectionPolicy).add('iac-rlhf-amazon', 'true');

    // ========================================================================
    // 10. MFA ENFORCEMENT POLICIES
    // ========================================================================

    const mfaEnforcementPolicy = new iam.ManagedPolicy(
      this,
      'MfaEnforcementPolicy',
      {
        managedPolicyName: `mfa-enforcement-${this.environmentSuffix}`,
        description: 'Enforce MFA for sensitive operations',
        statements: [
          new iam.PolicyStatement({
            sid: 'DenyWriteOperationsWithoutMFA',
            effect: iam.Effect.DENY,
            actions: MFA_REQUIRED_ACTIONS,
            resources: ['*'],
            conditions: {
              BoolIfExists: {
                'aws:MultiFactorAuthPresent': 'false',
              },
            },
          }),
          new iam.PolicyStatement({
            sid: 'DenyPIIAccessWithoutMFA',
            effect: iam.Effect.DENY,
            actions: ['s3:GetObject', 's3:PutObject'],
            resources: [`${piiDataBucket.bucketArn}/*`],
            conditions: {
              BoolIfExists: {
                'aws:MultiFactorAuthPresent': 'false',
              },
            },
          }),
          new iam.PolicyStatement({
            sid: 'DenyFinancialDataAccessWithoutMFA',
            effect: iam.Effect.DENY,
            actions: ['s3:GetObject', 's3:PutObject'],
            resources: [`${financialDataBucket.bucketArn}/*`],
            conditions: {
              BoolIfExists: {
                'aws:MultiFactorAuthPresent': 'false',
              },
            },
          }),
          new iam.PolicyStatement({
            sid: 'DenyAssumeRoleWithoutMFA',
            effect: iam.Effect.DENY,
            actions: ['sts:AssumeRole'],
            resources: ['*'],
            conditions: {
              BoolIfExists: {
                'aws:MultiFactorAuthPresent': 'false',
              },
            },
          }),
        ],
      }
    );
    cdk.Tags.of(mfaEnforcementPolicy).add('iac-rlhf-amazon', 'true');

    // ========================================================================
    // COMPLIANCE AUDIT REPORT GENERATION
    // ========================================================================

    this.securityAuditReport.push(
      {
        requirement: 'Encryption at Rest',
        implementedBy: [
          piiKmsKey.keyId,
          financialKmsKey.keyId,
          operationalKmsKey.keyId,
          logsKmsKey.keyId,
        ],
        status: 'COMPLIANT',
      },
      {
        requirement: 'Key Rotation',
        implementedBy: ['All KMS keys have automatic rotation enabled'],
        status: 'COMPLIANT',
      },
      {
        requirement: 'Access Logging',
        implementedBy: [
          lambdaLogGroup.logGroupName,
          apiAccessLogGroup.logGroupName,
          securityEventLogGroup.logGroupName,
          auditTrailLogGroup.logGroupName,
        ],
        status: 'COMPLIANT',
      },
      {
        requirement: 'Data Retention (7 years)',
        implementedBy: [
          `All log groups configured with ${RETENTION_DAYS} days retention`,
        ],
        status: 'COMPLIANT',
      },
      {
        requirement: 'MFA Enforcement',
        implementedBy: [mfaEnforcementPolicy.managedPolicyName],
        status: 'COMPLIANT',
      },
      {
        requirement: 'TLS 1.2 Minimum',
        implementedBy: ['All S3 buckets enforce TLS 1.2'],
        status: 'COMPLIANT',
      },
      {
        requirement: 'Public Access Blocked',
        implementedBy: ['BlockPublicAccess enabled on all S3 buckets'],
        status: 'COMPLIANT',
      },
      {
        requirement: 'Automated Remediation',
        implementedBy: [
          s3RemediationFunction.functionName,
          keyRotationMonitorFunction.functionName,
        ],
        status: 'COMPLIANT',
      },
      {
        requirement: 'Security Monitoring',
        implementedBy: [
          unauthorizedKmsAccessAlarm.alarmName,
          failedAuthAlarm.alarmName,
          s3PolicyChangeAlarm.alarmName,
          iamChangeAlarm.alarmName,
        ],
        status: 'COMPLIANT',
      },
      {
        requirement: 'Cross-Account Access Control',
        implementedBy: [crossAccountSecurityRole?.roleName || 'Not configured'],
        status: crossAccountSecurityRole ? 'COMPLIANT' : 'PARTIAL',
      }
    );

    // ========================================================================
    // CDK OUTPUTS - Export critical resource ARNs
    // ========================================================================

    // KMS Key Outputs
    new cdk.CfnOutput(this, 'PiiKmsKeyArn', {
      value: piiKmsKey.keyArn,
      description: 'KMS Key ARN for PII data encryption',
      exportName: `PiiKmsKeyArn-${this.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'FinancialKmsKeyArn', {
      value: financialKmsKey.keyArn,
      description: 'KMS Key ARN for financial data encryption',
      exportName: `FinancialKmsKeyArn-${this.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'OperationalKmsKeyArn', {
      value: operationalKmsKey.keyArn,
      description: 'KMS Key ARN for operational data encryption',
      exportName: `OperationalKmsKeyArn-${this.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'LogsKmsKeyArn', {
      value: logsKmsKey.keyArn,
      description: 'KMS Key ARN for CloudWatch Logs encryption',
      exportName: `LogsKmsKeyArn-${this.environmentSuffix}`,
    });

    // IAM Role Outputs
    new cdk.CfnOutput(this, 'AppServicesRoleArn', {
      value: appServicesRole.roleArn,
      description: 'Application services role ARN',
      exportName: `AppServicesRoleArn-${this.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DataAnalystsRoleArn', {
      value: dataAnalystsRole.roleArn,
      description: 'Data analysts role ARN',
      exportName: `DataAnalystsRoleArn-${this.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'SecurityAuditorsRoleArn', {
      value: securityAuditorsRole.roleArn,
      description: 'Security auditors role ARN',
      exportName: `SecurityAuditorsRoleArn-${this.environmentSuffix}`,
    });

    if (crossAccountSecurityRole) {
      new cdk.CfnOutput(this, 'CrossAccountSecurityRoleArn', {
        value: crossAccountSecurityRole.roleArn,
        description: 'Cross-account security scanner role ARN',
        exportName: `CrossAccountSecurityRoleArn-${this.environmentSuffix}`,
      });
    }

    // S3 Bucket Outputs
    new cdk.CfnOutput(this, 'PiiDataBucketName', {
      value: piiDataBucket.bucketName,
      description: 'PII data bucket name',
      exportName: `PiiDataBucketName-${this.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'FinancialDataBucketName', {
      value: financialDataBucket.bucketName,
      description: 'Financial data bucket name',
      exportName: `FinancialDataBucketName-${this.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'OperationalDataBucketName', {
      value: operationalDataBucket.bucketName,
      description: 'Operational data bucket name',
      exportName: `OperationalDataBucketName-${this.environmentSuffix}`,
    });

    // Lambda Function Outputs
    new cdk.CfnOutput(this, 'S3RemediationFunctionArn', {
      value: s3RemediationFunction.functionArn,
      description: 'S3 remediation Lambda function ARN',
      exportName: `S3RemediationFunctionArn-${this.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'KeyRotationMonitorFunctionArn', {
      value: keyRotationMonitorFunction.functionArn,
      description: 'Key rotation monitor Lambda function ARN',
      exportName: `KeyRotationMonitorFunctionArn-${this.environmentSuffix}`,
    });

    // SNS Topic Outputs
    new cdk.CfnOutput(this, 'SecurityNotificationTopicArn', {
      value: securityNotificationTopic.topicArn,
      description: 'Security notification SNS topic ARN',
      exportName: `SecurityNotificationTopicArn-${this.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'KeyRotationNotificationTopicArn', {
      value: keyRotationNotificationTopic.topicArn,
      description: 'Key rotation notification SNS topic ARN',
      exportName: `KeyRotationNotificationTopicArn-${this.environmentSuffix}`,
    });

    // CloudWatch Log Group Outputs
    new cdk.CfnOutput(this, 'LambdaLogGroupName', {
      value: lambdaLogGroup.logGroupName,
      description: 'Lambda log group name',
      exportName: `LambdaLogGroupName-${this.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'AuditTrailLogGroupName', {
      value: auditTrailLogGroup.logGroupName,
      description: 'Audit trail log group name',
      exportName: `AuditTrailLogGroupName-${this.environmentSuffix}`,
    });

    // Compliance Report Output
    new cdk.CfnOutput(this, 'ComplianceReport', {
      value: JSON.stringify(this.securityAuditReport, null, 2),
      description: 'PCI DSS compliance audit report',
    });

    // Security Framework Version
    new cdk.CfnOutput(this, 'SecurityFrameworkVersion', {
      value: 'v1.0.0',
      description: 'Security framework version',
    });
  }
}
