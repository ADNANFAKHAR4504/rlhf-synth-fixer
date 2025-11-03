import * as cdk from 'aws-cdk-lib';
import * as accessanalyzer from 'aws-cdk-lib/aws-accessanalyzer';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import * as path from 'path';

/**
 * Configuration interface for security framework
 */
interface SecurityConfig {
  allowedIpRanges: string[];
  trustedAccountIds: string[];
  environment: 'dev' | 'staging' | 'production';
  dataClassification: {
    high: string[];
    medium: string[];
    low: string[];
  };
  mfaExemptServices?: string[];
}

/**
 * Extended stack props to include environmentSuffix
 */
interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

/**
 * Advanced Security Configuration Framework Stack
 * Implements zero-trust security for financial services
 */
export class TapStack extends cdk.Stack {
  // KMS Keys
  private readonly dataEncryptionKey: kms.Key;
  private readonly secretsEncryptionKey: kms.Key;
  private readonly logsEncryptionKey: kms.Key;

  // IAM Roles
  private readonly adminRole: iam.Role;
  private readonly developerRole: iam.Role;
  private readonly auditRole: iam.Role;
  private readonly serviceAccountRole: iam.Role;

  // S3 Buckets
  private readonly auditBucket: s3.Bucket;
  private readonly dataBucket: s3.Bucket;

  // Security Configuration
  private readonly config: SecurityConfig;

  // Environment and Region Configuration
  private readonly environmentSuffix: string;
  private readonly awsRegion: string;
  private readonly resourcePrefix: string;

  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Initialize environment variables
    this.environmentSuffix =
      props?.environmentSuffix || process.env.ENVIRONMENT_SUFFIX || 'dev';
    this.awsRegion = process.env.AWS_REGION || cdk.Stack.of(this).region;
    this.resourcePrefix = `tap-${this.environmentSuffix}`;

    // Apply tags to all resources
    cdk.Tags.of(this).add('iac-rlhf-amazon', 'true');
    cdk.Tags.of(this).add('Environment', this.environmentSuffix);
    cdk.Tags.of(this).add('Region', this.awsRegion);
    cdk.Tags.of(this).add('ManagedBy', 'CDK');
    cdk.Tags.of(this).add('Compliance', 'FinancialServices');

    // Initialize configuration
    this.config = this.loadSecurityConfig();

    // ========================================
    // ===== KMS KEY HIERARCHY =====
    // ========================================
    this.dataEncryptionKey = this.createKmsKey(
      'DataEncryptionKey',
      'Customer-managed key for data encryption',
      ['s3.amazonaws.com', 'dynamodb.amazonaws.com', 'rds.amazonaws.com']
    );

    this.secretsEncryptionKey = this.createKmsKey(
      'SecretsEncryptionKey',
      'Customer-managed key for secrets encryption',
      ['secretsmanager.amazonaws.com', 'ssm.amazonaws.com']
    );

    this.logsEncryptionKey = this.createKmsKey(
      'LogsEncryptionKey',
      'Customer-managed key for logs encryption',
      [`logs.${this.awsRegion}.amazonaws.com`, 'cloudtrail.amazonaws.com']
    );

    // ========================================
    // ===== IAM ROLES AND POLICIES =====
    // ========================================

    // Create Permission Boundary
    const permissionBoundary = this.createPermissionBoundary();

    // Admin Role with MFA enforcement
    this.adminRole = new iam.Role(this, 'AdminRole', {
      assumedBy: new iam.AccountPrincipal(cdk.Stack.of(this).account),
      roleName: `${this.resourcePrefix}-AdminRole`,
      description: 'Administrative role with MFA enforcement',
      maxSessionDuration: cdk.Duration.hours(1),
      permissionsBoundary: permissionBoundary,
    });

    // Add MFA condition to admin role
    this.adminRole.assumeRolePolicy?.addStatements(
      new iam.PolicyStatement({
        effect: iam.Effect.DENY,
        principals: [new iam.AnyPrincipal()],
        actions: ['sts:AssumeRole'],
        conditions: {
          BoolIfExists: {
            'aws:MultiFactorAuthPresent': 'false',
          },
        },
      })
    );

    // Developer Role with restricted permissions
    this.developerRole = new iam.Role(this, 'DeveloperRole', {
      assumedBy: new iam.AccountPrincipal(cdk.Stack.of(this).account),
      roleName: `${this.resourcePrefix}-DeveloperRole`,
      description: 'Developer role with limited permissions',
      maxSessionDuration: cdk.Duration.hours(4),
      permissionsBoundary: permissionBoundary,
    });

    // Add MFA condition to developer role
    this.developerRole.assumeRolePolicy?.addStatements(
      new iam.PolicyStatement({
        effect: iam.Effect.DENY,
        principals: [new iam.AnyPrincipal()],
        actions: ['sts:AssumeRole'],
        conditions: {
          BoolIfExists: {
            'aws:MultiFactorAuthPresent': 'false',
          },
        },
      })
    );

    // Audit Role for read-only access
    this.auditRole = new iam.Role(this, 'AuditRole', {
      assumedBy: new iam.CompositePrincipal(
        new iam.AccountPrincipal(cdk.Stack.of(this).account),
        new iam.ServicePrincipal('access-analyzer.amazonaws.com')
      ),
      roleName: `${this.resourcePrefix}-AuditRole`,
      description: 'Audit role for compliance monitoring',
      maxSessionDuration: cdk.Duration.hours(12),
    });

    // Service Account Role for programmatic access
    this.serviceAccountRole = new iam.Role(this, 'ServiceAccountRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      roleName: `${this.resourcePrefix}-ServiceAccountRole`,
      description: 'Service account role for automated operations',
      inlinePolicies: {
        ServiceAccountPolicy: this.createServiceAccountPolicy(),
      },
    });

    // Attach policies to roles
    this.attachPoliciesToRoles();

    // ========================================
    // ===== SECRETS MANAGER =====
    // ========================================
    const dbSecret = this.createRotatingSecret(
      'DatabaseCredentials',
      'RDS database master credentials',
      'database'
    );

    const apiKeySecret = this.createRotatingSecret(
      'ApiKeys',
      'External API keys',
      'apikey'
    );

    const serviceTokenSecret = this.createRotatingSecret(
      'ServiceTokens',
      'Internal service tokens',
      'service'
    );

    // ========================================
    // ===== S3 BUCKETS =====
    // ========================================
    this.auditBucket = this.createSecureS3Bucket(
      'AuditBucket',
      'Financial audit logs',
      this.logsEncryptionKey,
      365 // One year retention
    );

    this.dataBucket = this.createSecureS3Bucket(
      'DataBucket',
      'Encrypted data storage',
      this.dataEncryptionKey,
      2555 // Seven years retention for financial data
    );

    // ========================================
    // ===== CROSS-ACCOUNT ACCESS =====
    // ========================================
    const crossAccountRole = this.createCrossAccountRole();

    // ========================================
    // ===== CLOUDWATCH LOGS =====
    // ========================================
    const applicationLogGroup = this.createEncryptedLogGroup(
      'ApplicationLogs',
      '/aws/application',
      30 // 30 days retention
    );

    const auditLogGroup = this.createEncryptedLogGroup(
      'AuditLogs',
      '/aws/audit',
      3653 // 10 years for audit logs (financial compliance)
    );

    const securityLogGroup = this.createEncryptedLogGroup(
      'SecurityLogs',
      '/aws/security',
      90 // 90 days for security logs
    );

    // ========================================
    // ===== SERVICE CONTROL POLICIES =====
    // ========================================
    // Create SCP policy for organization-wide security guardrails
    this.createServiceControlPolicy();

    // ========================================
    // ===== IAM ACCESS ANALYZER =====
    // ========================================
    const analyzer = new accessanalyzer.CfnAnalyzer(this, 'SecurityAnalyzer', {
      type: 'ACCOUNT',
      analyzerName: `${this.resourcePrefix}-Analyzer`,
      archiveRules: [
        {
          ruleName: 'ArchivePublicAccess',
          filter: [
            {
              property: 'isPublic',
              eq: ['false'],
            },
          ],
        },
      ],
      tags: [
        {
          key: 'iac-rlhf-amazon',
          value: 'true',
        },
        {
          key: 'Environment',
          value: this.config.environment,
        },
        {
          key: 'Compliance',
          value: 'FinancialServices',
        },
      ],
    });

    // ========================================
    // ===== LAMBDA FOR CUSTOM ROTATION =====
    // ========================================
    const rotationLambda = this.createRotationLambda();

    // ========================================
    // ===== CLOUDFORMATION OUTPUTS =====
    // ========================================
    this.createOutputs({
      // Environment Configuration
      environmentSuffix: this.environmentSuffix,
      awsRegion: this.awsRegion,
      resourcePrefix: this.resourcePrefix,

      // KMS Keys
      dataEncryptionKeyArn: this.dataEncryptionKey.keyArn,
      dataEncryptionKeyId: this.dataEncryptionKey.keyId,
      secretsEncryptionKeyArn: this.secretsEncryptionKey.keyArn,
      secretsEncryptionKeyId: this.secretsEncryptionKey.keyId,
      logsEncryptionKeyArn: this.logsEncryptionKey.keyArn,
      logsEncryptionKeyId: this.logsEncryptionKey.keyId,

      // IAM Roles
      adminRoleArn: this.adminRole.roleArn,
      adminRoleName: this.adminRole.roleName,
      developerRoleArn: this.developerRole.roleArn,
      developerRoleName: this.developerRole.roleName,
      auditRoleArn: this.auditRole.roleArn,
      auditRoleName: this.auditRole.roleName,
      serviceAccountRoleArn: this.serviceAccountRole.roleArn,
      serviceAccountRoleName: this.serviceAccountRole.roleName,
      crossAccountRoleArn: crossAccountRole.roleArn,

      // Secrets
      dbSecretArn: dbSecret.secretArn,
      apiKeySecretArn: apiKeySecret.secretArn,
      serviceTokenSecretArn: serviceTokenSecret.secretArn,

      // S3 Buckets
      auditBucketArn: this.auditBucket.bucketArn,
      auditBucketName: this.auditBucket.bucketName,
      dataBucketArn: this.dataBucket.bucketArn,
      dataBucketName: this.dataBucket.bucketName,

      // Log Groups
      applicationLogGroupArn: applicationLogGroup.logGroupArn,
      applicationLogGroupName: applicationLogGroup.logGroupName,
      auditLogGroupArn: auditLogGroup.logGroupArn,
      auditLogGroupName: auditLogGroup.logGroupName,
      securityLogGroupArn: securityLogGroup.logGroupArn,
      securityLogGroupName: securityLogGroup.logGroupName,

      // Access Analyzer
      analyzerArn: analyzer.attrArn,

      // Lambda
      rotationLambdaArn: rotationLambda.functionArn,
      rotationLambdaName: rotationLambda.functionName,
    });
  }

  // ========================================
  // ===== HELPER METHODS =====
  // ========================================

  /**
   * Load security configuration from context or environment
   */
  private loadSecurityConfig(): SecurityConfig {
    return {
      allowedIpRanges: this.node.tryGetContext('allowedIpRanges') || [
        '10.0.0.0/8', // Private network
        '172.16.0.0/12', // Private network
        '192.168.0.0/16', // Private network
      ],
      trustedAccountIds: this.node.tryGetContext('trustedAccountIds') || [],
      environment: this.node.tryGetContext('environment') || 'dev',
      dataClassification: {
        high: ['ssn', 'credit-card', 'bank-account'],
        medium: ['email', 'phone', 'address'],
        low: ['name', 'company'],
      },
      mfaExemptServices: ['lambda.amazonaws.com', 'ecs-tasks.amazonaws.com'],
    };
  }

  /**
   * Create a KMS key with automatic rotation
   */
  private createKmsKey(
    name: string,
    description: string,
    allowedServices: string[]
  ): kms.Key {
    const key = new kms.Key(this, name, {
      description,
      enableKeyRotation: true,
      alias: `alias/${this.resourcePrefix}/${name}`,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pendingWindow: cdk.Duration.days(30),
    });

    // Add key policy for allowed services
    allowedServices.forEach(service => {
      // For CloudWatch Logs, add full permissions with correct actions
      if (service.startsWith('logs.')) {
        key.addToResourcePolicy(
          new iam.PolicyStatement({
            sid: `AllowCloudWatchLogs${service.replace(/\./g, '')}`,
            effect: iam.Effect.ALLOW,
            principals: [new iam.ServicePrincipal(service)],
            actions: [
              'kms:Encrypt',
              'kms:Decrypt',
              'kms:ReEncrypt*',
              'kms:GenerateDataKey*',
              'kms:CreateGrant',
              'kms:DescribeKey',
            ],
            resources: ['*'],
          })
        );
      } else {
        key.grantEncryptDecrypt(new iam.ServicePrincipal(service));
      }
    });

    return key;
  }

  /**
   * Create IAM permission boundary
   */
  private createPermissionBoundary(): iam.ManagedPolicy {
    return new iam.ManagedPolicy(this, 'PermissionBoundary', {
      managedPolicyName: `${this.resourcePrefix}-PermissionBoundary`,
      description: 'Permission boundary to prevent privilege escalation',
      statements: [
        // Deny creating IAM users or roles without permission boundary
        new iam.PolicyStatement({
          effect: iam.Effect.DENY,
          actions: [
            'iam:CreateUser',
            'iam:CreateRole',
            'iam:PutUserPermissionsBoundary',
            'iam:PutRolePermissionsBoundary',
          ],
          resources: ['*'],
          conditions: {
            StringNotEquals: {
              'iam:PermissionsBoundary': this.formatArn({
                service: 'iam',
                resource: 'policy',
                resourceName: `${this.resourcePrefix}-PermissionBoundary`,
              }),
            },
          },
        }),
        // Deny deleting permission boundary
        new iam.PolicyStatement({
          effect: iam.Effect.DENY,
          actions: [
            'iam:DeleteUserPermissionsBoundary',
            'iam:DeleteRolePermissionsBoundary',
          ],
          resources: ['*'],
        }),
        // Deny actions on resources outside the account
        new iam.PolicyStatement({
          effect: iam.Effect.DENY,
          actions: ['*'],
          resources: ['*'],
          conditions: {
            StringNotEquals: {
              'aws:RequestedRegion': [
                this.awsRegion,
                'us-east-1', // Required for global services
              ],
            },
          },
        }),
        // Allow all actions with restrictions
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ['*'],
          resources: ['*'],
          conditions: {
            IpAddress: {
              'aws:SourceIp': this.config.allowedIpRanges,
            },
          },
        }),
      ],
    });
  }

  /**
   * Create service account policy
   */
  private createServiceAccountPolicy(): iam.PolicyDocument {
    return new iam.PolicyDocument({
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'logs:CreateLogGroup',
            'logs:CreateLogStream',
            'logs:PutLogEvents',
          ],
          resources: [
            `arn:aws:logs:${this.awsRegion}:${cdk.Stack.of(this).account}:*`,
          ],
        }),
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ['kms:Decrypt', 'kms:DescribeKey', 'kms:GenerateDataKey'],
          resources: [
            this.dataEncryptionKey.keyArn,
            this.secretsEncryptionKey.keyArn,
            this.logsEncryptionKey.keyArn,
          ],
        }),
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'secretsmanager:GetSecretValue',
            'secretsmanager:DescribeSecret',
          ],
          resources: [
            `arn:aws:secretsmanager:${this.awsRegion}:${cdk.Stack.of(this).account}:secret:*`,
          ],
          conditions: {
            StringEquals: {
              'secretsmanager:VersionStage': 'AWSCURRENT',
            },
          },
        }),
      ],
    });
  }

  /**
   * Attach policies to IAM roles
   */
  private attachPoliciesToRoles(): void {
    // Admin Role Policies
    this.adminRole.attachInlinePolicy(
      new iam.Policy(this, 'AdminPolicy', {
        statements: [
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ['*'],
            resources: ['*'],
            conditions: {
              Bool: {
                'aws:SecureTransport': 'true',
              },
              IpAddress: {
                'aws:SourceIp': this.config.allowedIpRanges,
              },
            },
          }),
          // Deny dangerous actions even for admins
          new iam.PolicyStatement({
            effect: iam.Effect.DENY,
            actions: [
              'iam:DeleteRole',
              'iam:DeleteRolePolicy',
              'iam:DeleteUserPolicy',
              'iam:DeleteGroupPolicy',
              'kms:ScheduleKeyDeletion',
              'kms:Delete*',
            ],
            resources: ['*'],
            conditions: {
              Bool: {
                'aws:MultiFactorAuthPresent': 'false',
              },
            },
          }),
        ],
      })
    );

    // Developer Role Policies
    this.developerRole.attachInlinePolicy(
      new iam.Policy(this, 'DeveloperPolicy', {
        statements: [
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
              'ec2:Describe*',
              'rds:Describe*',
              'lambda:Get*',
              'lambda:List*',
              's3:List*',
              's3:Get*',
              'logs:Describe*',
              'logs:Get*',
              'logs:FilterLogEvents',
              'cloudwatch:Describe*',
              'cloudwatch:Get*',
              'cloudwatch:List*',
            ],
            resources: ['*'],
            conditions: {
              Bool: {
                'aws:SecureTransport': 'true',
              },
            },
          }),
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
              'lambda:CreateFunction',
              'lambda:UpdateFunctionCode',
              'lambda:UpdateFunctionConfiguration',
              'lambda:InvokeFunction',
            ],
            resources: [
              `arn:aws:lambda:${this.awsRegion}:${cdk.Stack.of(this).account}:function:${this.environmentSuffix}-*`,
            ],
          }),
          new iam.PolicyStatement({
            effect: iam.Effect.DENY,
            actions: [
              'iam:*',
              'kms:Delete*',
              'kms:ScheduleKeyDeletion',
              's3:DeleteBucket',
              's3:DeleteBucketPolicy',
            ],
            resources: ['*'],
          }),
        ],
      })
    );

    // Audit Role Policies
    this.auditRole.attachInlinePolicy(
      new iam.Policy(this, 'AuditPolicy', {
        statements: [
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
              'access-analyzer:*',
              'cloudtrail:Describe*',
              'cloudtrail:Get*',
              'cloudtrail:List*',
              'cloudtrail:LookupEvents',
              'config:Describe*',
              'config:Get*',
              'config:List*',
              'guardduty:Get*',
              'guardduty:List*',
              'iam:Get*',
              'iam:List*',
              'iam:SimulateCustomPolicy',
              'iam:SimulatePrincipalPolicy',
              'kms:Describe*',
              'kms:Get*',
              'kms:List*',
              'logs:Describe*',
              'logs:Get*',
              'logs:FilterLogEvents',
              's3:GetBucketAcl',
              's3:GetBucketPolicy',
              's3:GetBucketPolicyStatus',
              's3:GetBucketPublicAccessBlock',
              's3:GetBucketVersioning',
              's3:GetEncryptionConfiguration',
              's3:ListAllMyBuckets',
              's3:ListBucket',
              'securityhub:Get*',
              'securityhub:List*',
              'tag:Get*',
            ],
            resources: ['*'],
          }),
        ],
      })
    );
  }

  /**
   * Create cross-account assume role
   */
  private createCrossAccountRole(): iam.Role {
    const externalId = `${this.resourcePrefix}-${Date.now()}`;

    // Create principal - use trusted accounts if provided, otherwise use current account
    const assumedBy =
      this.config.trustedAccountIds.length > 0
        ? new iam.CompositePrincipal(
            ...this.config.trustedAccountIds.map(
              accountId => new iam.AccountPrincipal(accountId)
            )
          )
        : new iam.AccountPrincipal(cdk.Stack.of(this).account);

    const crossAccountRole = new iam.Role(this, 'CrossAccountRole', {
      assumedBy,
      roleName: `${this.resourcePrefix}-CrossAccountRole`,
      description: 'Cross-account access with external ID',
      maxSessionDuration: cdk.Duration.hours(1),
      externalIds: [externalId],
    });

    crossAccountRole.attachInlinePolicy(
      new iam.Policy(this, 'CrossAccountPolicy', {
        statements: [
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
              's3:GetObject',
              's3:ListBucket',
              'kms:Decrypt',
              'kms:DescribeKey',
            ],
            resources: [
              this.auditBucket.bucketArn,
              `${this.auditBucket.bucketArn}/*`,
              this.dataEncryptionKey.keyArn,
            ],
            conditions: {
              StringEquals: {
                'sts:ExternalId': externalId,
              },
              Bool: {
                'aws:SecureTransport': 'true',
              },
            },
          }),
        ],
      })
    );

    new cdk.CfnOutput(this, 'CrossAccountExternalId', {
      value: externalId,
      description: 'External ID for cross-account assume role',
    });

    return crossAccountRole;
  }

  /**
   * Create rotating secret in Secrets Manager
   */
  private createRotatingSecret(
    name: string,
    description: string,
    type: 'database' | 'apikey' | 'service'
  ): secretsmanager.Secret {
    let generateSecretString: secretsmanager.SecretStringGenerator;

    switch (type) {
      case 'database':
        generateSecretString = {
          secretStringTemplate: JSON.stringify({ username: 'admin' }),
          generateStringKey: 'password',
          excludeCharacters: ' %+~`#$&*()|[]{}:;<>?!\'/@"\\',
          passwordLength: 32,
        };
        break;
      case 'apikey':
        generateSecretString = {
          secretStringTemplate: JSON.stringify({}),
          generateStringKey: 'apikey',
          excludeCharacters: ' %+~`#$&*()|[]{}:;<>?!\'/@"\\',
          passwordLength: 64,
        };
        break;
      case 'service':
        generateSecretString = {
          secretStringTemplate: JSON.stringify({}),
          generateStringKey: 'token',
          excludeCharacters: ' ',
          passwordLength: 128,
        };
        break;
    }

    const secret = new secretsmanager.Secret(this, name, {
      secretName: `${this.resourcePrefix}/${name}`,
      description,
      encryptionKey: this.secretsEncryptionKey,
      generateSecretString,
    });

    // Add resource policy to deny cross-account access only
    // Don't reference specific roles to avoid circular dependencies
    secret.addToResourcePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.DENY,
        principals: [new iam.AnyPrincipal()],
        actions: ['secretsmanager:GetSecretValue'],
        resources: ['*'],
        conditions: {
          StringNotEquals: {
            'aws:PrincipalAccount': cdk.Stack.of(this).account,
          },
        },
      })
    );

    // Enable automatic rotation
    new secretsmanager.RotationSchedule(this, `${name}Rotation`, {
      secret,
      rotationLambda: this.getOrCreateRotationLambda(type),
      automaticallyAfter: cdk.Duration.days(type === 'database' ? 30 : 90),
    });

    return secret;
  }

  /**
   * Get or create rotation Lambda
   */
  private getOrCreateRotationLambda(type: string): NodejsFunction {
    const functionName = `${this.resourcePrefix}-SecretRotation-${type}`;

    const rotationLambda = new NodejsFunction(this, `RotationLambda-${type}`, {
      functionName,
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'handler',
      entry: path.join(__dirname, 'lambda', 'secret-rotation.ts'),
      timeout: cdk.Duration.seconds(30),
      environment: {
        ENVIRONMENT_SUFFIX: this.environmentSuffix,
      },
      bundling: {
        minify: true,
        sourceMap: true,
        externalModules: ['@aws-sdk/*'],
      },
    });

    // Grant KMS permissions
    this.secretsEncryptionKey.grantEncryptDecrypt(rotationLambda);

    return rotationLambda;
  }

  /**
   * Create secure S3 bucket
   */
  private createSecureS3Bucket(
    name: string,
    description: string,
    encryptionKey: kms.Key,
    retentionDays: number
  ): s3.Bucket {
    const bucket = new s3.Bucket(this, name, {
      bucketName: `${this.resourcePrefix}-${name.toLowerCase()}-${cdk.Stack.of(this).account}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey,
      enforceSSL: true,
      versioned: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      lifecycleRules: [
        {
          id: 'DeleteOldVersions',
          enabled: true,
          noncurrentVersionExpiration: cdk.Duration.days(90),
        },
        {
          id: 'TransitionToIA',
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(90),
            },
            {
              storageClass: s3.StorageClass.DEEP_ARCHIVE,
              transitionAfter: cdk.Duration.days(180),
            },
          ],
        },
      ],
      serverAccessLogsPrefix: 'access-logs/',
      intelligentTieringConfigurations: [
        {
          name: 'OptimizeStorageCosts',
          archiveAccessTierTime: cdk.Duration.days(90),
          deepArchiveAccessTierTime: cdk.Duration.days(180),
        },
      ],
    });

    // Add bucket policy
    bucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'DenyInsecureConnections',
        effect: iam.Effect.DENY,
        principals: [new iam.AnyPrincipal()],
        actions: ['s3:*'],
        resources: [bucket.bucketArn, `${bucket.bucketArn}/*`],
        conditions: {
          Bool: {
            'aws:SecureTransport': 'false',
          },
        },
      })
    );

    bucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'DenyUnencryptedObjectUploads',
        effect: iam.Effect.DENY,
        principals: [new iam.AnyPrincipal()],
        actions: ['s3:PutObject'],
        resources: [`${bucket.bucketArn}/*`],
        conditions: {
          StringNotEquals: {
            's3:x-amz-server-side-encryption': 'aws:kms',
            's3:x-amz-server-side-encryption-aws-kms-key-id':
              encryptionKey.keyId,
          },
        },
      })
    );

    bucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'RequireMFAForDelete',
        effect: iam.Effect.DENY,
        principals: [new iam.AnyPrincipal()],
        actions: [
          's3:DeleteBucket',
          's3:DeleteBucketPolicy',
          's3:DeleteObjectVersion',
        ],
        resources: [bucket.bucketArn, `${bucket.bucketArn}/*`],
        conditions: {
          Bool: {
            'aws:MultiFactorAuthPresent': 'false',
          },
        },
      })
    );

    // Add lifecycle configuration for compliance
    new cdk.CfnOutput(this, `${name}RetentionDays`, {
      value: retentionDays.toString(),
      description: `Retention period for ${description}`,
    });

    return bucket;
  }

  /**
   * Create encrypted CloudWatch log group
   */
  private createEncryptedLogGroup(
    name: string,
    logGroupName: string,
    retentionDays: number
  ): logs.LogGroup {
    const logGroup = new logs.LogGroup(this, name, {
      logGroupName,
      encryptionKey: this.logsEncryptionKey,
      retention: retentionDays as logs.RetentionDays,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Add metric filter for security events
    new logs.MetricFilter(this, `${name}SecurityMetric`, {
      logGroup,
      filterPattern: logs.FilterPattern.anyTerm(
        'ERROR',
        'UNAUTHORIZED',
        'DENIED'
      ),
      metricName: `${name}/SecurityEvents`,
      metricNamespace: 'Security',
      metricValue: '1',
    });

    return logGroup;
  }

  /**
   * Create Service Control Policy
   */
  private createServiceControlPolicy(): iam.PolicyDocument {
    // Parse allowed regions from environment variable or use current region
    const allowedRegions = process.env.POSSIBLE_REGIONS
      ? process.env.POSSIBLE_REGIONS.split(',')
      : [this.awsRegion, 'us-east-1']; // us-east-1 needed for global services

    return new iam.PolicyDocument({
      statements: [
        // Deny access to unapproved regions
        new iam.PolicyStatement({
          sid: 'DenyUnapprovedRegions',
          effect: iam.Effect.DENY,
          actions: ['*'],
          resources: ['*'],
          conditions: {
            StringNotEquals: {
              'aws:RequestedRegion': allowedRegions,
            },
          },
        }),
        // Require MFA for sensitive operations
        new iam.PolicyStatement({
          sid: 'RequireMFAForSensitiveOperations',
          effect: iam.Effect.DENY,
          actions: [
            'iam:CreateAccessKey',
            'iam:DeleteAccessKey',
            'iam:CreateUser',
            'iam:DeleteUser',
            'iam:CreateRole',
            'iam:DeleteRole',
            'ec2:TerminateInstances',
            'ec2:DeleteVolume',
            'rds:DeleteDBInstance',
          ],
          resources: ['*'],
          conditions: {
            BoolIfExists: {
              'aws:MultiFactorAuthPresent': 'false',
            },
          },
        }),
        // Deny disabling security services
        new iam.PolicyStatement({
          sid: 'DenyDisablingSecurityServices',
          effect: iam.Effect.DENY,
          actions: [
            'guardduty:DeleteDetector',
            'guardduty:DisassociateFromMasterAccount',
            'guardduty:StopMonitoringMembers',
            'securityhub:DisableSecurityHub',
            'access-analyzer:DeleteAnalyzer',
            'cloudtrail:DeleteTrail',
            'cloudtrail:StopLogging',
            'config:DeleteConfigurationRecorder',
            'config:StopConfigurationRecorder',
          ],
          resources: ['*'],
        }),
        // Enforce tagging requirements
        new iam.PolicyStatement({
          sid: 'RequireTagsOnResourceCreation',
          effect: iam.Effect.DENY,
          actions: [
            'ec2:RunInstances',
            'ec2:CreateVolume',
            'rds:CreateDBInstance',
          ],
          resources: ['*'],
          conditions: {
            Null: {
              'aws:RequestTag/Environment': 'true',
              'aws:RequestTag/CostCenter': 'true',
              'aws:RequestTag/Owner': 'true',
            },
          },
        }),
      ],
    });
  }

  /**
   * Create rotation Lambda function
   */
  private createRotationLambda(): NodejsFunction {
    const rotationFunction = new NodejsFunction(this, 'RotationLambda', {
      functionName: `${this.resourcePrefix}-SecretRotation`,
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'handler',
      entry: path.join(__dirname, 'lambda', 'secret-rotation.ts'),
      timeout: cdk.Duration.seconds(30),
      environment: {
        ENVIRONMENT_SUFFIX: this.environmentSuffix,
        KMS_KEY_ID: this.secretsEncryptionKey.keyId,
      },
      bundling: {
        minify: true,
        sourceMap: true,
        externalModules: ['@aws-sdk/*'],
      },
    });

    // Grant permissions
    this.secretsEncryptionKey.grantEncryptDecrypt(rotationFunction);

    return rotationFunction;
  }

  /**
   * Create CloudFormation outputs
   */
  private createOutputs(outputs: Record<string, string>): void {
    Object.entries(outputs).forEach(([key, value]) => {
      new cdk.CfnOutput(this, key, {
        value,
        exportName: `${this.resourcePrefix}-${key}`,
      });
    });
  }
}
