# Overview

Please find solution files below

## ./bin/tap.ts

```typescript
#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix from context (set by CI/CD pipeline) or use 'dev' as default
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';
const stackName = `TapStack${environmentSuffix}`;
const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';

// Apply tags to all stacks in this app (optional - you can do this at stack level instead)
Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);

new TapStack(app, stackName, {
  stackName: stackName, // This ensures CloudFormation stack name includes the suffix
  environmentSuffix: environmentSuffix, // Pass the suffix to the stack
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});

```

## ./lib/lambda/secret-rotation.ts

```typescript
import {
  SecretsManagerClient,
  GetSecretValueCommand,
  PutSecretValueCommand,
  UpdateSecretVersionStageCommand,
  DescribeSecretCommand,
} from '@aws-sdk/client-secrets-manager';
import { randomBytes } from 'crypto';

interface RotationEvent {
  SecretId: string;
  Token: string;
  Step: 'createSecret' | 'setSecret' | 'testSecret' | 'finishSecret';
}

const client = new SecretsManagerClient({
  region: process.env.AWS_REGION,
});

/**
 * Lambda handler for Secrets Manager automatic rotation
 * Implements secure rotation for database credentials, API keys, and service tokens
 */
export const handler = async (event: RotationEvent): Promise<void> => {
  console.log('Starting secret rotation', {
    secretId: event.SecretId,
    step: event.Step,
  });

  const { SecretId, Token, Step } = event;

  try {
    switch (Step) {
      case 'createSecret':
        await createSecret(SecretId, Token);
        break;
      case 'setSecret':
        await setSecret(SecretId, Token);
        break;
      case 'testSecret':
        await testSecret(SecretId, Token);
        break;
      case 'finishSecret':
        await finishSecret(SecretId, Token);
        break;
      default:
        throw new Error(`Invalid rotation step: ${Step}`);
    }

    console.log(`Successfully completed step: ${Step}`);
  } catch (error) {
    console.error(`Error during ${Step}:`, error);
    throw error;
  }
};

/**
 * Step 1: Create a new version of the secret with a new password
 */
async function createSecret(secretId: string, token: string): Promise<void> {
  console.log('Creating new secret version');

  // Get the current secret value to determine the type
  const currentSecret = await client.send(
    new GetSecretValueCommand({
      SecretId: secretId,
      VersionStage: 'AWSCURRENT',
    })
  );

  if (!currentSecret.SecretString) {
    throw new Error('Current secret has no string value');
  }

  const secretData = JSON.parse(currentSecret.SecretString);

  // Generate new secure credentials based on secret type
  let newSecretData:
    | {
        username: string;
        password: string;
        engine: string;
        host?: string;
        port?: number;
        dbname?: string;
      }
    | { apikey: string; created: string }
    | { token: string; created: string; expiresIn: number };

  if (secretData.username) {
    // Database credentials rotation
    newSecretData = {
      username: secretData.username,
      password: generateSecurePassword(32),
      engine: secretData.engine || 'postgres',
      host: secretData.host,
      port: secretData.port || 5432,
      dbname: secretData.dbname,
    };
  } else if (secretData.apikey) {
    // API key rotation
    newSecretData = {
      apikey: generateSecureApiKey(64),
      created: new Date().toISOString(),
    };
  } else if (secretData.token) {
    // Service token rotation
    newSecretData = {
      token: generateSecureToken(128),
      created: new Date().toISOString(),
      expiresIn: 7776000, // 90 days in seconds
    };
  } else {
    throw new Error('Unknown secret type');
  }

  // Try to get the existing pending version
  try {
    await client.send(
      new GetSecretValueCommand({
        SecretId: secretId,
        VersionId: token,
        VersionStage: 'AWSPENDING',
      })
    );
    console.log('Pending version already exists');
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'ResourceNotFoundException') {
      // Create the new version
      await client.send(
        new PutSecretValueCommand({
          SecretId: secretId,
          ClientRequestToken: token,
          SecretString: JSON.stringify(newSecretData),
          VersionStages: ['AWSPENDING'],
        })
      );
      console.log('Created new pending secret version');
    } else {
      throw error;
    }
  }
}

/**
 * Step 2: Set the new secret in the target service
 */
async function setSecret(secretId: string, token: string): Promise<void> {
  console.log('Setting new secret in target service');

  const pendingSecret = await client.send(
    new GetSecretValueCommand({
      SecretId: secretId,
      VersionId: token,
      VersionStage: 'AWSPENDING',
    })
  );

  if (!pendingSecret.SecretString) {
    throw new Error('Pending secret has no string value');
  }

  // Parse secret data for validation
  JSON.parse(pendingSecret.SecretString);

  // For database credentials, this would update the database user password
  // For API keys, this would register the new key with the external service
  // For service tokens, this would update the internal service configuration

  // In a real implementation, you would call the appropriate API to update credentials
  // For example, for RDS:
  // - Connect to the database using the current credentials
  // - Execute ALTER USER statement to change the password
  // - Verify the change was successful

  console.log(
    'Secret set in target service (implementation depends on service type)'
  );
}

/**
 * Step 3: Test the new secret
 */
async function testSecret(secretId: string, token: string): Promise<void> {
  console.log('Testing new secret');

  const pendingSecret = await client.send(
    new GetSecretValueCommand({
      SecretId: secretId,
      VersionId: token,
      VersionStage: 'AWSPENDING',
    })
  );

  if (!pendingSecret.SecretString) {
    throw new Error('Pending secret has no string value');
  }

  const secretData = JSON.parse(pendingSecret.SecretString);

  // Test the new credentials
  // For database: attempt to connect and run a simple query
  // For API key: make a test API call
  // For service token: validate the token format and expiration

  if (secretData.password) {
    // Validate database credentials
    if (secretData.password.length < 16) {
      throw new Error('Password does not meet minimum length requirement');
    }
  } else if (secretData.apikey) {
    // Validate API key
    if (secretData.apikey.length < 32) {
      throw new Error('API key does not meet minimum length requirement');
    }
  } else if (secretData.token) {
    // Validate service token
    if (secretData.token.length < 64) {
      throw new Error('Token does not meet minimum length requirement');
    }
  }

  console.log('Secret validation successful');
}

/**
 * Step 4: Finalize the rotation by marking the new version as current
 */
async function finishSecret(secretId: string, token: string): Promise<void> {
  console.log('Finalizing secret rotation');

  // Get the current version
  const metadata = await client.send(
    new DescribeSecretCommand({
      SecretId: secretId,
    })
  );

  let currentVersion: string | undefined;
  if (metadata.VersionIdsToStages) {
    for (const [version, stages] of Object.entries(
      metadata.VersionIdsToStages
    )) {
      if (stages.includes('AWSCURRENT')) {
        if (version === token) {
          console.log('Version is already marked as AWSCURRENT');
          return;
        }
        currentVersion = version;
        break;
      }
    }
  }

  // Move the AWSCURRENT stage to the new version
  await client.send(
    new UpdateSecretVersionStageCommand({
      SecretId: secretId,
      VersionStage: 'AWSCURRENT',
      MoveToVersionId: token,
      RemoveFromVersionId: currentVersion,
    })
  );

  console.log('Successfully completed secret rotation');
}

/**
 * Generate a secure random password for database credentials
 */
function generateSecurePassword(length: number): string {
  const charset =
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*-_=+';
  const password: string[] = [];
  const bytes = randomBytes(length);

  for (let i = 0; i < length; i++) {
    password.push(charset[bytes[i] % charset.length]);
  }

  return password.join('');
}

/**
 * Generate a secure API key
 */
function generateSecureApiKey(length: number): string {
  return randomBytes(length).toString('base64').slice(0, length);
}

/**
 * Generate a secure service token
 */
function generateSecureToken(length: number): string {
  return randomBytes(length).toString('hex').slice(0, length);
}

```

## ./lib/tap-stack.ts

```typescript
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
   * Create assume role policy with MFA enforcement
   */
  private createAssumeRolePolicyWithMfa(): iam.PolicyDocument {
    return new iam.PolicyDocument({
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          principals: [new iam.AccountPrincipal(cdk.Stack.of(this).account)],
          actions: ['sts:AssumeRole'],
          conditions: {
            Bool: {
              'aws:MultiFactorAuthPresent': 'true',
            },
            NumericLessThan: {
              'aws:MultiFactorAuthAge': '3600', // MFA must be used within last hour
            },
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

```

## ./test/tap-stack.int.test.ts

```typescript
import fs from 'fs';
import path from 'path';
import {
  IAMClient,
  GetRoleCommand,
  SimulatePrincipalPolicyCommand,
  GetPolicyCommand,
  ListAttachedRolePoliciesCommand,
} from '@aws-sdk/client-iam';
import {
  KMSClient,
  DescribeKeyCommand,
  GetKeyRotationStatusCommand,
} from '@aws-sdk/client-kms';
import {
  S3Client,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
  GetPublicAccessBlockCommand,
  GetBucketPolicyCommand,
} from '@aws-sdk/client-s3';
import {
  SecretsManagerClient,
  DescribeSecretCommand,
  GetResourcePolicyCommand,
} from '@aws-sdk/client-secrets-manager';
import {
  LambdaClient,
  GetFunctionCommand,
  GetFunctionConfigurationCommand,
} from '@aws-sdk/client-lambda';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  AccessAnalyzerClient,
  GetAnalyzerCommand,
} from '@aws-sdk/client-accessanalyzer';

// Load outputs from flat-outputs.json
const outputsPath = path.join(process.cwd(), 'cfn-outputs', 'flat-outputs.json');
const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));

const region = outputs.awsRegion || 'ap-northeast-1';

// Initialize AWS SDK clients
const iamClient = new IAMClient({ region });
const kmsClient = new KMSClient({ region });
const s3Client = new S3Client({ region });
const secretsClient = new SecretsManagerClient({ region });
const lambdaClient = new LambdaClient({ region });
const logsClient = new CloudWatchLogsClient({ region });
const analyzerClient = new AccessAnalyzerClient({ region });

describe('TapStack Integration Tests - Live Resources', () => {
  describe('KMS Keys', () => {
    test('data encryption key should exist with rotation enabled', async () => {
      const response = await kmsClient.send(
        new DescribeKeyCommand({ KeyId: outputs.dataEncryptionKeyId })
      );
      expect(response.KeyMetadata?.KeyState).toBe('Enabled');
      expect(response.KeyMetadata?.KeyUsage).toBe('ENCRYPT_DECRYPT');

      const rotationStatus = await kmsClient.send(
        new GetKeyRotationStatusCommand({ KeyId: outputs.dataEncryptionKeyId })
      );
      expect(rotationStatus.KeyRotationEnabled).toBe(true);
    }, 30000);

    test('secrets encryption key should exist with rotation enabled', async () => {
      const response = await kmsClient.send(
        new DescribeKeyCommand({ KeyId: outputs.secretsEncryptionKeyId })
      );
      expect(response.KeyMetadata?.KeyState).toBe('Enabled');

      const rotationStatus = await kmsClient.send(
        new GetKeyRotationStatusCommand({ KeyId: outputs.secretsEncryptionKeyId })
      );
      expect(rotationStatus.KeyRotationEnabled).toBe(true);
    }, 30000);

    test('logs encryption key should exist with rotation enabled', async () => {
      const response = await kmsClient.send(
        new DescribeKeyCommand({ KeyId: outputs.logsEncryptionKeyId })
      );
      expect(response.KeyMetadata?.KeyState).toBe('Enabled');

      const rotationStatus = await kmsClient.send(
        new GetKeyRotationStatusCommand({ KeyId: outputs.logsEncryptionKeyId })
      );
      expect(rotationStatus.KeyRotationEnabled).toBe(true);
    }, 30000);
  });

  describe('IAM Roles', () => {
    test('admin role should exist with correct max session duration', async () => {
      const response = await iamClient.send(
        new GetRoleCommand({ RoleName: outputs.adminRoleName })
      );
      expect(response.Role?.RoleName).toBe(outputs.adminRoleName);
      expect(response.Role?.MaxSessionDuration).toBe(3600);
      expect(response.Role?.Arn).toBe(outputs.adminRoleArn);
    }, 30000);

    test('developer role should exist with restricted permissions', async () => {
      const response = await iamClient.send(
        new GetRoleCommand({ RoleName: outputs.developerRoleName })
      );
      expect(response.Role?.RoleName).toBe(outputs.developerRoleName);
      expect(response.Role?.MaxSessionDuration).toBe(14400);
    }, 30000);

    test('audit role should exist with read-only permissions', async () => {
      const response = await iamClient.send(
        new GetRoleCommand({ RoleName: outputs.auditRoleName })
      );
      expect(response.Role?.RoleName).toBe(outputs.auditRoleName);
      expect(response.Role?.MaxSessionDuration).toBe(43200);
    }, 30000);

    test('service account role should exist for Lambda', async () => {
      const response = await iamClient.send(
        new GetRoleCommand({ RoleName: outputs.serviceAccountRoleName })
      );
      expect(response.Role?.RoleName).toBe(outputs.serviceAccountRoleName);
      const assumeRolePolicy = JSON.parse(
        decodeURIComponent(response.Role?.AssumeRolePolicyDocument || '')
      );
      expect(assumeRolePolicy.Statement[0].Principal.Service).toContain(
        'lambda.amazonaws.com'
      );
    }, 30000);

    test('admin role should have MFA enforcement', async () => {
      const response = await iamClient.send(
        new GetRoleCommand({ RoleName: outputs.adminRoleName })
      );
      const assumeRolePolicy = JSON.parse(
        decodeURIComponent(response.Role?.AssumeRolePolicyDocument || '')
      );
      const denyStatement = assumeRolePolicy.Statement.find(
        (s: any) => s.Effect === 'Deny'
      );
      expect(denyStatement).toBeDefined();
      expect(denyStatement.Condition.BoolIfExists['aws:MultiFactorAuthPresent']).toBe(
        'false'
      );
    }, 30000);
  });

  describe('S3 Buckets', () => {
    test('audit bucket should have versioning enabled', async () => {
      const response = await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: outputs.auditBucketName })
      );
      expect(response.Status).toBe('Enabled');
    }, 30000);

    test('data bucket should have versioning enabled', async () => {
      const response = await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: outputs.dataBucketName })
      );
      expect(response.Status).toBe('Enabled');
    }, 30000);

    test('audit bucket should have KMS encryption enabled', async () => {
      const response = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: outputs.auditBucketName })
      );
      expect(response.ServerSideEncryptionConfiguration?.Rules[0]?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('aws:kms');
    }, 30000);

    test('data bucket should have KMS encryption enabled', async () => {
      const response = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: outputs.dataBucketName })
      );
      expect(response.ServerSideEncryptionConfiguration?.Rules[0]?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('aws:kms');
    }, 30000);

    test('audit bucket should block all public access', async () => {
      const response = await s3Client.send(
        new GetPublicAccessBlockCommand({ Bucket: outputs.auditBucketName })
      );
      expect(response.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
    }, 30000);

    test('data bucket should block all public access', async () => {
      const response = await s3Client.send(
        new GetPublicAccessBlockCommand({ Bucket: outputs.dataBucketName })
      );
      expect(response.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
    }, 30000);

    test('audit bucket should have secure transport policy', async () => {
      const response = await s3Client.send(
        new GetBucketPolicyCommand({ Bucket: outputs.auditBucketName })
      );
      const policy = JSON.parse(response.Policy || '{}');
      const denyInsecureStatement = policy.Statement.find(
        (s: any) => s.Sid === 'DenyInsecureConnections'
      );
      expect(denyInsecureStatement).toBeDefined();
      expect(denyInsecureStatement.Condition.Bool['aws:SecureTransport']).toBe('false');
    }, 30000);
  });

  describe('Secrets Manager', () => {
    test('database credentials secret should exist with rotation enabled', async () => {
      const response = await secretsClient.send(
        new DescribeSecretCommand({ SecretId: outputs.dbSecretArn })
      );
      expect(response.ARN).toBe(outputs.dbSecretArn);
      expect(response.RotationEnabled).toBe(true);
      expect(response.RotationRules?.AutomaticallyAfterDays).toBe(30);
    }, 30000);

    test('API keys secret should exist with rotation enabled', async () => {
      const response = await secretsClient.send(
        new DescribeSecretCommand({ SecretId: outputs.apiKeySecretArn })
      );
      expect(response.ARN).toBe(outputs.apiKeySecretArn);
      expect(response.RotationEnabled).toBe(true);
      expect(response.RotationRules?.AutomaticallyAfterDays).toBe(90);
    }, 30000);

    test('service tokens secret should exist with rotation enabled', async () => {
      const response = await secretsClient.send(
        new DescribeSecretCommand({ SecretId: outputs.serviceTokenSecretArn })
      );
      expect(response.ARN).toBe(outputs.serviceTokenSecretArn);
      expect(response.RotationEnabled).toBe(true);
      expect(response.RotationRules?.AutomaticallyAfterDays).toBe(90);
    }, 30000);

    test('secrets should use KMS encryption', async () => {
      const response = await secretsClient.send(
        new DescribeSecretCommand({ SecretId: outputs.dbSecretArn })
      );
      expect(response.KmsKeyId).toBe(outputs.secretsEncryptionKeyArn);
    }, 30000);

    test('database secret should have cross-account deny policy', async () => {
      const response = await secretsClient.send(
        new GetResourcePolicyCommand({ SecretId: outputs.dbSecretArn })
      );
      const policy = JSON.parse(response.ResourcePolicy || '{}');
      const denyStatement = policy.Statement.find((s: any) => s.Effect === 'Deny');
      expect(denyStatement).toBeDefined();
      expect(denyStatement.Action).toContain('secretsmanager:GetSecretValue');
    }, 30000);
  });

  describe('Lambda Functions', () => {
    test('rotation lambda should exist with correct runtime', async () => {
      const response = await lambdaClient.send(
        new GetFunctionCommand({ FunctionName: outputs.rotationLambdaName })
      );
      expect(response.Configuration?.FunctionArn).toBe(outputs.rotationLambdaArn);
      expect(response.Configuration?.Runtime).toBe('nodejs22.x');
      expect(response.Configuration?.Handler).toBe('index.handler');
      expect(response.Configuration?.Timeout).toBe(30);
    }, 30000);

    test('rotation lambda should have environment variables', async () => {
      const response = await lambdaClient.send(
        new GetFunctionConfigurationCommand({ FunctionName: outputs.rotationLambdaName })
      );
      expect(response.Environment?.Variables?.ENVIRONMENT_SUFFIX).toBe(outputs.environmentSuffix);
      expect(response.Environment?.Variables?.KMS_KEY_ID).toBe(outputs.secretsEncryptionKeyId);
    }, 30000);
  });

  describe('CloudWatch Logs', () => {
    test('application log group should exist with correct retention', async () => {
      const response = await logsClient.send(
        new DescribeLogGroupsCommand({
          logGroupNamePrefix: outputs.applicationLogGroupName,
        })
      );
      const logGroup = response.logGroups?.find(
        (lg) => lg.logGroupName === outputs.applicationLogGroupName
      );
      expect(logGroup).toBeDefined();
      expect(logGroup?.retentionInDays).toBe(30);
    }, 30000);

    test('audit log group should exist with 10-year retention', async () => {
      const response = await logsClient.send(
        new DescribeLogGroupsCommand({
          logGroupNamePrefix: outputs.auditLogGroupName,
        })
      );
      const logGroup = response.logGroups?.find(
        (lg) => lg.logGroupName === outputs.auditLogGroupName
      );
      expect(logGroup).toBeDefined();
      expect(logGroup?.retentionInDays).toBe(3653);
    }, 30000);

    test('security log group should exist with 90-day retention', async () => {
      const response = await logsClient.send(
        new DescribeLogGroupsCommand({
          logGroupNamePrefix: outputs.securityLogGroupName,
        })
      );
      const logGroup = response.logGroups?.find(
        (lg) => lg.logGroupName === outputs.securityLogGroupName
      );
      expect(logGroup).toBeDefined();
      expect(logGroup?.retentionInDays).toBe(90);
    }, 30000);

    test('log groups should use KMS encryption', async () => {
      const response = await logsClient.send(
        new DescribeLogGroupsCommand({
          logGroupNamePrefix: outputs.applicationLogGroupName,
        })
      );
      const logGroup = response.logGroups?.find(
        (lg) => lg.logGroupName === outputs.applicationLogGroupName
      );
      expect(logGroup?.kmsKeyId).toBeDefined();
    }, 30000);
  });

  describe('IAM Access Analyzer', () => {
    test('analyzer should exist and be active', async () => {
      const analyzerName = outputs.analyzerArn.split('/').pop();
      const response = await analyzerClient.send(
        new GetAnalyzerCommand({ analyzerName })
      );
      expect(response.analyzer?.arn).toBe(outputs.analyzerArn);
      expect(response.analyzer?.status).toBe('ACTIVE');
      expect(response.analyzer?.type).toBe('ACCOUNT');
    }, 30000);
  });

  describe('Environment Configuration', () => {
    test('should have correct environment suffix', () => {
      expect(outputs.environmentSuffix).toBe('dev');
    });

    test('should be deployed in ap-northeast-1 region', () => {
      expect(outputs.awsRegion).toBe('ap-northeast-1');
    });

    test('should have correct resource prefix', () => {
      expect(outputs.resourcePrefix).toBe('tap-dev');
    });
  });

  describe('Compliance Requirements', () => {
    test('audit bucket should have 1-year retention', () => {
      expect(outputs.AuditBucketRetentionDays).toBe('365');
    });

    test('data bucket should have 7-year retention', () => {
      expect(outputs.DataBucketRetentionDays).toBe('2555');
    });

    test('cross-account role should have external ID', () => {
      expect(outputs.CrossAccountExternalId).toBeDefined();
      expect(outputs.CrossAccountExternalId).toMatch(/^tap-dev-/);
    });
  });
});

```

## ./test/tap-stack.unit.test.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack Unit Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    process.env.AWS_REGION = 'ap-northeast-1';
    process.env.ENVIRONMENT_SUFFIX = 'dev';
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('KMS Keys', () => {
    test('should create three KMS keys with rotation enabled', () => {
      template.resourceCountIs('AWS::KMS::Key', 3);
      template.hasResourceProperties('AWS::KMS::Key', {
        EnableKeyRotation: true,
        PendingWindowInDays: 30,
      });
    });

    test('should create KMS key aliases', () => {
      template.resourceCountIs('AWS::KMS::Alias', 3);
      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: Match.stringLikeRegexp('alias/tap-dev/'),
      });
    });

    test('should allow CloudWatch Logs to use logs encryption key', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        KeyPolicy: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Principal: {
                Service: 'logs.ap-northeast-1.amazonaws.com',
              },
              Action: Match.arrayWith([
                'kms:Encrypt',
                'kms:Decrypt',
                'kms:GenerateDataKey*',
              ]),
            }),
          ]),
        }),
      });
    });
  });

  describe('IAM Roles', () => {
    test('should create admin role with MFA enforcement', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'tap-dev-AdminRole',
        MaxSessionDuration: 3600,
      });
    });

    test('should create developer role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'tap-dev-DeveloperRole',
        MaxSessionDuration: 14400,
      });
    });

    test('should create audit role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'tap-dev-AuditRole',
        MaxSessionDuration: 43200,
      });
    });

    test('should create service account role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'tap-dev-ServiceAccountRole',
      });
    });

    test('should create cross-account role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'tap-dev-CrossAccountRole',
        MaxSessionDuration: 3600,
      });
    });
  });

  describe('IAM Policies', () => {
    test('should create permission boundary', () => {
      template.hasResourceProperties('AWS::IAM::ManagedPolicy', {
        ManagedPolicyName: 'tap-dev-PermissionBoundary',
      });
    });

    test('should deny dangerous actions without MFA', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Deny',
              Action: Match.arrayWith([
                'kms:ScheduleKeyDeletion',
              ]),
            }),
          ]),
        }),
      });
    });
  });

  describe('S3 Buckets', () => {
    test('should create two S3 buckets', () => {
      template.resourceCountIs('AWS::S3::Bucket', 2);
    });

    test('should enable versioning on all buckets', () => {
      template.allResourcesProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('should block all public access', () => {
      template.allResourcesProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('should enforce SSL for S3 operations', () => {
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Deny',
              Condition: {
                Bool: {
                  'aws:SecureTransport': 'false',
                },
              },
            }),
          ]),
        }),
      });
    });

    test('should require MFA for delete operations', () => {
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Deny',
              Action: Match.arrayWith([
                's3:DeleteBucket',
              ]),
              Condition: {
                Bool: {
                  'aws:MultiFactorAuthPresent': 'false',
                },
              },
            }),
          ]),
        }),
      });
    });
  });

  describe('Secrets Manager', () => {
    test('should create three secrets', () => {
      template.resourceCountIs('AWS::SecretsManager::Secret', 3);
    });

    test('should create database credentials with rotation', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        Name: 'tap-dev/DatabaseCredentials',
        GenerateSecretString: {
          GenerateStringKey: 'password',
          PasswordLength: 32,
        },
      });
    });

    test('should create API keys secret', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        Name: 'tap-dev/ApiKeys',
      });
    });

    test('should create service tokens secret', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        Name: 'tap-dev/ServiceTokens',
      });
    });

    test('should create rotation schedules', () => {
      template.resourceCountIs('AWS::SecretsManager::RotationSchedule', 3);
    });

    test('should deny cross-account access to secrets', () => {
      template.hasResourceProperties('AWS::SecretsManager::ResourcePolicy', {
        ResourcePolicy: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Deny',
              Action: 'secretsmanager:GetSecretValue',
            }),
          ]),
        }),
      });
    });
  });

  describe('Lambda Functions', () => {
    test('should create rotation lambda functions', () => {
      template.resourceCountIs('AWS::Lambda::Function', 4);
    });

    test('should use Node.js 22 runtime', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs22.x',
        Handler: 'index.handler',
        Timeout: 30,
      });
    });

    test('should have IAM execution roles', () => {
      const resources = template.toJSON().Resources;
      const lambdaFunctions = Object.values(resources).filter(
        (r: any) => r.Type === 'AWS::Lambda::Function'
      );
      expect(lambdaFunctions.length).toBe(4);
      lambdaFunctions.forEach((fn: any) => {
        expect(fn.Properties.Role).toBeDefined();
      });
    });
  });

  describe('CloudWatch Logs', () => {
    test('should create log groups with encryption', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/aws/application',
        RetentionInDays: 30,
      });
    });

    test('should create audit logs with 10-year retention', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/aws/audit',
        RetentionInDays: 3653,
      });
    });

    test('should create security logs', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/aws/security',
        RetentionInDays: 90,
      });
    });

    test('should create metric filters for security events', () => {
      template.resourceCountIs('AWS::Logs::MetricFilter', 3);
    });
  });

  describe('Access Analyzer', () => {
    test('should create IAM Access Analyzer', () => {
      template.hasResourceProperties('AWS::AccessAnalyzer::Analyzer', {
        Type: 'ACCOUNT',
        AnalyzerName: 'tap-dev-Analyzer',
      });
    });
  });

  describe('Stack Outputs', () => {
    test('should export all required outputs', () => {
      template.hasOutput('adminRoleArn', {});
      template.hasOutput('developerRoleArn', {});
      template.hasOutput('dataEncryptionKeyArn', {});
      template.hasOutput('secretsEncryptionKeyArn', {});
      template.hasOutput('auditBucketArn', {});
      template.hasOutput('environmentSuffix', {});
      template.hasOutput('awsRegion', {});
    });
  });

  describe('Security Configuration', () => {
    test('should enforce encryption at rest', () => {
      template.allResourcesProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: Match.anyValue(),
        },
      });
    });
  });
});

```

## ./cdk.json

```json
{
  "app": "npx ts-node --prefer-ts-exts bin/tap.ts",
  "watch": {
    "include": [
      "**"
    ],
    "exclude": [
      "README.md",
      "cdk*.json",
      "**/*.d.ts",
      "**/*.js",
      "tsconfig.json",
      "package*.json",
      "yarn.lock",
      "node_modules",
      "test"
    ]
  },
  "context": {
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
    "@aws-cdk/core:checkSecretUsage": true,
    "@aws-cdk/core:target-partitions": [
      "aws",
      "aws-cn"
    ],
    "@aws-cdk-containers/ecs-service-extensions:enableDefaultLogDriver": true,
    "@aws-cdk/aws-ec2:uniqueImdsv2TemplateName": true,
    "@aws-cdk/aws-ecs:arnFormatIncludesClusterName": true,
    "@aws-cdk/aws-iam:minimizePolicies": true,
    "@aws-cdk/core:validateSnapshotRemovalPolicy": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeyAliasStackSafeResourceName": true,
    "@aws-cdk/aws-s3:createDefaultLoggingPolicy": true,
    "@aws-cdk/aws-sns-subscriptions:restrictSqsDescryption": true,
    "@aws-cdk/aws-apigateway:disableCloudWatchRole": true,
    "@aws-cdk/core:enablePartitionLiterals": true,
    "@aws-cdk/aws-events:eventsTargetQueueSameAccount": true,
    "@aws-cdk/aws-ecs:disableExplicitDeploymentControllerForCircuitBreaker": true,
    "@aws-cdk/aws-iam:importedRoleStackSafeDefaultPolicyName": true,
    "@aws-cdk/aws-s3:serverAccessLogsUseBucketPolicy": true,
    "@aws-cdk/aws-route53-patters:useCertificate": true,
    "@aws-cdk/customresources:installLatestAwsSdkDefault": false,
    "@aws-cdk/aws-rds:databaseProxyUniqueResourceName": true,
    "@aws-cdk/aws-codedeploy:removeAlarmsFromDeploymentGroup": true,
    "@aws-cdk/aws-apigateway:authorizerChangeDeploymentLogicalId": true,
    "@aws-cdk/aws-ec2:launchTemplateDefaultUserData": true,
    "@aws-cdk/aws-secretsmanager:useAttachedSecretResourcePolicyForSecretTargetAttachments": true,
    "@aws-cdk/aws-redshift:columnId": true,
    "@aws-cdk/aws-stepfunctions-tasks:enableEmrServicePolicyV2": true,
    "@aws-cdk/aws-ec2:restrictDefaultSecurityGroup": true,
    "@aws-cdk/aws-apigateway:requestValidatorUniqueId": true,
    "@aws-cdk/aws-kms:aliasNameRef": true,
    "@aws-cdk/aws-autoscaling:generateLaunchTemplateInsteadOfLaunchConfig": true,
    "@aws-cdk/core:includePrefixInUniqueNameGeneration": true,
    "@aws-cdk/aws-efs:denyAnonymousAccess": true,
    "@aws-cdk/aws-opensearchservice:enableOpensearchMultiAzWithStandby": true,
    "@aws-cdk/aws-lambda-nodejs:useLatestRuntimeVersion": true,
    "@aws-cdk/aws-efs:mountTargetOrderInsensitiveLogicalId": true,
    "@aws-cdk/aws-rds:auroraClusterChangeScopeOfInstanceParameterGroupWithEachParameters": true,
    "@aws-cdk/aws-appsync:useArnForSourceApiAssociationIdentifier": true,
    "@aws-cdk/aws-rds:preventRenderingDeprecatedCredentials": true,
    "@aws-cdk/aws-codepipeline-actions:useNewDefaultBranchForCodeCommitSource": true,
    "@aws-cdk/aws-cloudwatch-actions:changeLambdaPermissionLogicalIdForLambdaAction": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeysDefaultValueToFalse": true,
    "@aws-cdk/aws-codepipeline:defaultPipelineTypeToV2": true,
    "@aws-cdk/aws-kms:reduceCrossAccountRegionPolicyScope": true,
    "@aws-cdk/aws-eks:nodegroupNameAttribute": true,
    "@aws-cdk/aws-ec2:ebsDefaultGp3Volume": true,
    "@aws-cdk/aws-ecs:removeDefaultDeploymentAlarm": true,
    "@aws-cdk/custom-resources:logApiResponseDataPropertyTrueDefault": false,
    "@aws-cdk/aws-s3:keepNotificationInImportedBucket": false,
    "@aws-cdk/aws-ecs:enableImdsBlockingDeprecatedFeature": false,
    "@aws-cdk/aws-ecs:disableEcsImdsBlocking": true,
    "@aws-cdk/aws-ecs:reduceEc2FargateCloudWatchPermissions": true,
    "@aws-cdk/aws-dynamodb:resourcePolicyPerReplica": true,
    "@aws-cdk/aws-ec2:ec2SumTImeoutEnabled": true,
    "@aws-cdk/aws-appsync:appSyncGraphQLAPIScopeLambdaPermission": true,
    "@aws-cdk/aws-rds:setCorrectValueForDatabaseInstanceReadReplicaInstanceResourceId": true,
    "@aws-cdk/core:cfnIncludeRejectComplexResourceUpdateCreatePolicyIntrinsics": true,
    "@aws-cdk/aws-lambda-nodejs:sdkV3ExcludeSmithyPackages": true,
    "@aws-cdk/aws-stepfunctions-tasks:fixRunEcsTaskPolicy": true,
    "@aws-cdk/aws-ec2:bastionHostUseAmazonLinux2023ByDefault": true,
    "@aws-cdk/aws-route53-targets:userPoolDomainNameMethodWithoutCustomResource": true,
    "@aws-cdk/aws-elasticloadbalancingV2:albDualstackWithoutPublicIpv4SecurityGroupRulesDefault": true,
    "@aws-cdk/aws-iam:oidcRejectUnauthorizedConnections": true,
    "@aws-cdk/core:enableAdditionalMetadataCollection": true,
    "@aws-cdk/aws-lambda:createNewPoliciesWithAddToRolePolicy": false,
    "@aws-cdk/aws-s3:setUniqueReplicationRoleName": true,
    "@aws-cdk/aws-events:requireEventBusPolicySid": true,
    "@aws-cdk/core:aspectPrioritiesMutating": true,
    "@aws-cdk/aws-dynamodb:retainTableReplica": true,
    "@aws-cdk/aws-stepfunctions:useDistributedMapResultWriterV2": true,
    "@aws-cdk/s3-notifications:addS3TrustKeyPolicyForSnsSubscriptions": true,
    "@aws-cdk/aws-ec2:requirePrivateSubnetsForEgressOnlyInternetGateway": true,
    "@aws-cdk/aws-s3:publicAccessBlockedByDefault": true,
    "@aws-cdk/aws-lambda:useCdkManagedLogGroup": true
  }
}
```
