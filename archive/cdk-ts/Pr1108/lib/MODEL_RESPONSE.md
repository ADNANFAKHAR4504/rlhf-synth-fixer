# AWS CDK Multi-Account Security Configuration with TypeScript

I'll create a comprehensive CDK TypeScript project that implements secure multi-account AWS infrastructure with proper IAM roles, MFA enforcement, KMS encryption, and complete test coverage.

## Project Structure

```
aws-security-cdk/
├── package.json
├── tsconfig.json
├── jest.config.js
├── cdk.json
├── bin/
│   └── aws-security-app.ts
├── lib/
│   ├── security-stack.ts
│   ├── constructs/
│   │   ├── iam-construct.ts
│   │   ├── kms-construct.ts
│   │   └── storage-construct.ts
│   └── utils/
│       └── naming.ts
├── test/
│   ├── unit/
│   │   ├── security-stack.test.ts
│   │   ├── iam-construct.test.ts
│   │   ├── kms-construct.test.ts
│   │   └── storage-construct.test.ts
│   └── integration/
│       └── integration.test.ts
└── README.md
```

## Core Implementation

### package.json

```json
{
  "name": "aws-security-cdk",
  "version": "1.0.0",
  "description": "Multi-account AWS security configuration with CDK TypeScript",
  "main": "lib/index.js",
  "scripts": {
    "build": "tsc",
    "watch": "tsc -w",
    "test": "jest",
    "test:coverage": "jest --coverage",
    "cdk": "cdk",
    "deploy": "cdk deploy",
    "destroy": "cdk destroy"
  },
  "dependencies": {
    "aws-cdk-lib": "^2.100.0",
    "constructs": "^10.3.0"
  },
  "devDependencies": {
    "@types/jest": "^29.5.5",
    "@types/node": "^20.6.3",
    "aws-cdk": "^2.100.0",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.1",
    "typescript": "^5.2.2"
  }
}
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["es2020"],
    "declaration": true,
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": false,
    "inlineSourceMap": true,
    "inlineSources": true,
    "experimentalDecorators": true,
    "strictPropertyInitialization": false,
    "typeRoots": ["./node_modules/@types"],
    "outDir": "lib",
    "rootDir": "."
  },
  "exclude": ["cdk.out", "node_modules"]
}
```

### jest.config.js

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  collectCoverageFrom: ['lib/**/*.ts', '!lib/**/*.d.ts', '!lib/**/*.test.ts'],
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
};
```

### cdk.json

```json
{
  "app": "npx ts-node --prefer-ts-exts bin/aws-security-app.ts",
  "watch": {
    "include": ["**"],
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
    "@aws-cdk/core:target-partitions": ["aws", "aws-cn"]
  }
}
```

### lib/utils/naming.ts

```typescript
/**
 * Utility functions for consistent resource naming following company standards
 * Format: <dept>-<env>-<purpose>
 */

export interface NamingConfig {
  department: string;
  environment: string;
  purpose: string;
}

export class NamingUtils {
  /**
   * Generate a standardized resource name
   * @param config - Naming configuration object
   * @returns Formatted resource name
   */
  static generateResourceName(config: NamingConfig): string {
    const { department, environment, purpose } = config;

    // Validate inputs
    this.validateNamingInput(department, 'department');
    this.validateNamingInput(environment, 'environment');
    this.validateNamingInput(purpose, 'purpose');

    return `${department.toLowerCase()}-${environment.toLowerCase()}-${purpose.toLowerCase()}`;
  }

  /**
   * Generate a KMS key alias
   * @param config - Naming configuration object
   * @returns KMS key alias
   */
  static generateKmsAlias(config: NamingConfig): string {
    return `alias/${this.generateResourceName(config)}-key`;
  }

  /**
   * Generate an IAM role name
   * @param config - Naming configuration object
   * @returns IAM role name
   */
  static generateRoleName(config: NamingConfig): string {
    return `${this.generateResourceName(config)}-role`;
  }

  /**
   * Generate an S3 bucket name (must be globally unique)
   * @param config - Naming configuration object
   * @param accountId - AWS account ID for uniqueness
   * @returns S3 bucket name
   */
  static generateBucketName(config: NamingConfig, accountId: string): string {
    return `${this.generateResourceName(config)}-${accountId}`;
  }

  private static validateNamingInput(value: string, fieldName: string): void {
    if (!value || value.trim().length === 0) {
      throw new Error(`${fieldName} cannot be empty`);
    }

    // Check for valid characters (alphanumeric and hyphens only)
    if (!/^[a-zA-Z0-9-]+$/.test(value)) {
      throw new Error(
        `${fieldName} can only contain alphanumeric characters and hyphens`
      );
    }
  }
}
```

### lib/constructs/kms-construct.ts

```typescript
import { Construct } from 'constructs';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as iam from 'aws-cdk-lib/aws-iam';
import { NamingUtils, NamingConfig } from '../utils/naming';

export interface KmsConstructProps {
  namingConfig: NamingConfig;
  authorizedRoles: iam.IRole[];
  accountId: string;
}

/**
 * KMS Construct for creating and managing encryption keys with proper access controls
 */
export class KmsConstruct extends Construct {
  public readonly kmsKey: kms.Key;
  public readonly keyAlias: kms.Alias;

  constructor(scope: Construct, id: string, props: KmsConstructProps) {
    super(scope, id);

    const { namingConfig, authorizedRoles, accountId } = props;

    // Create KMS key with restricted policy
    this.kmsKey = new kms.Key(this, 'EncryptionKey', {
      description: `Encryption key for ${NamingUtils.generateResourceName(namingConfig)}`,
      enableKeyRotation: true,
      keySpec: kms.KeySpec.SYMMETRIC_DEFAULT,
      keyUsage: kms.KeyUsage.ENCRYPT_DECRYPT,
      policy: this.createKmsKeyPolicy(accountId, authorizedRoles),
    });

    // Create alias for easier key reference
    this.keyAlias = new kms.Alias(this, 'EncryptionKeyAlias', {
      aliasName: NamingUtils.generateKmsAlias(namingConfig),
      targetKey: this.kmsKey,
    });

    // Add tags for compliance and management
    this.addResourceTags(namingConfig);
  }

  /**
   * Create a restrictive KMS key policy following least privilege principles
   */
  private createKmsKeyPolicy(
    accountId: string,
    authorizedRoles: iam.IRole[]
  ): iam.PolicyDocument {
    const statements: iam.PolicyStatement[] = [];

    // Root account administrative access (required for key management)
    statements.push(
      new iam.PolicyStatement({
        sid: 'EnableRootAccess',
        effect: iam.Effect.ALLOW,
        principals: [new iam.AccountRootPrincipal()],
        actions: ['kms:*'],
        resources: ['*'],
      })
    );

    // Authorized roles access for encrypt/decrypt operations
    if (authorizedRoles.length > 0) {
      statements.push(
        new iam.PolicyStatement({
          sid: 'AllowAuthorizedRolesAccess',
          effect: iam.Effect.ALLOW,
          principals: authorizedRoles,
          actions: [
            'kms:Decrypt',
            'kms:DescribeKey',
            'kms:Encrypt',
            'kms:GenerateDataKey*',
            'kms:ReEncrypt*',
          ],
          resources: ['*'],
        })
      );
    }

    // Allow AWS services to use the key for encryption
    statements.push(
      new iam.PolicyStatement({
        sid: 'AllowAWSServicesAccess',
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal('s3.amazonaws.com')],
        actions: [
          'kms:Decrypt',
          'kms:DescribeKey',
          'kms:Encrypt',
          'kms:GenerateDataKey*',
          'kms:ReEncrypt*',
        ],
        resources: ['*'],
        conditions: {
          StringEquals: {
            'kms:ViaService': [
              `s3.us-east-2.amazonaws.com`,
              `s3.us-west-2.amazonaws.com`,
              `rds.us-east-2.amazonaws.com`,
              `rds.us-west-2.amazonaws.com`,
            ],
          },
        },
      })
    );

    return new iam.PolicyDocument({
      statements,
    });
  }

  /**
   * Add standardized tags to KMS resources
   */
  private addResourceTags(namingConfig: NamingConfig): void {
    const tags = {
      Department: namingConfig.department,
      Environment: namingConfig.environment,
      Purpose: namingConfig.purpose,
      ManagedBy: 'CDK',
      EncryptionCompliant: 'true',
    };

    Object.entries(tags).forEach(([key, value]) => {
      this.kmsKey.node.addMetadata(key, value);
    });
  }

  /**
   * Grant decrypt permissions to a principal
   */
  public grantDecrypt(grantee: iam.IPrincipal): iam.Grant {
    return this.kmsKey.grantDecrypt(grantee);
  }

  /**
   * Grant encrypt permissions to a principal
   */
  public grantEncrypt(grantee: iam.IPrincipal): iam.Grant {
    return this.kmsKey.grantEncrypt(grantee);
  }

  /**
   * Grant encrypt/decrypt permissions to a principal
   */
  public grantEncryptDecrypt(grantee: iam.IPrincipal): iam.Grant {
    return this.kmsKey.grantEncryptDecrypt(grantee);
  }
}
```

### lib/constructs/iam-construct.ts

```typescript
import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';
import { NamingUtils, NamingConfig } from '../utils/naming';

export interface IamConstructProps {
  namingConfig: NamingConfig;
  environment: 'dev' | 'prod';
}

/**
 * IAM Construct for creating roles and policies with least privilege principles
 */
export class IamConstruct extends Construct {
  public readonly applicationRole: iam.Role;
  public readonly mfaPolicy: iam.ManagedPolicy;

  constructor(scope: Construct, id: string, props: IamConstructProps) {
    super(scope, id);

    const { namingConfig, environment } = props;

    // Create MFA enforcement policy
    this.mfaPolicy = this.createMfaPolicy(namingConfig);

    // Create application role with least privilege
    this.applicationRole = this.createApplicationRole(
      namingConfig,
      environment
    );

    // Add tags for compliance
    this.addResourceTags(namingConfig);
  }

  /**
   * Create a policy that enforces MFA for all IAM users
   */
  private createMfaPolicy(namingConfig: NamingConfig): iam.ManagedPolicy {
    return new iam.ManagedPolicy(this, 'MfaPolicy', {
      managedPolicyName: `${NamingUtils.generateResourceName(namingConfig)}-mfa-policy`,
      description: 'Policy requiring MFA for all operations',
      statements: [
        // Allow users to manage their own MFA devices
        new iam.PolicyStatement({
          sid: 'AllowManageOwnMFA',
          effect: iam.Effect.ALLOW,
          actions: [
            'iam:CreateVirtualMFADevice',
            'iam:DeleteVirtualMFADevice',
            'iam:EnableMFADevice',
            'iam:ResyncMFADevice',
          ],
          resources: [
            'arn:aws:iam::*:mfa/${aws:username}',
            'arn:aws:iam::*:user/${aws:username}',
          ],
        }),
        // Allow users to list MFA devices
        new iam.PolicyStatement({
          sid: 'AllowListMFADevices',
          effect: iam.Effect.ALLOW,
          actions: ['iam:ListMFADevices', 'iam:ListVirtualMFADevices'],
          resources: ['*'],
        }),
        // Deny all actions if MFA is not present (except MFA management)
        new iam.PolicyStatement({
          sid: 'DenyAllExceptMFAManagementWithoutMFA',
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
        }),
      ],
    });
  }

  /**
   * Create application role with environment-specific permissions
   */
  private createApplicationRole(
    namingConfig: NamingConfig,
    environment: string
  ): iam.Role {
    const role = new iam.Role(this, 'ApplicationRole', {
      roleName: NamingUtils.generateRoleName(namingConfig),
      description: `Application role for ${environment} environment`,
      assumedBy: new iam.CompositePrincipal(
        new iam.ServicePrincipal('ec2.amazonaws.com'),
        new iam.ServicePrincipal('lambda.amazonaws.com')
      ),
      maxSessionDuration:
        environment === 'prod'
          ? // Production: shorter session duration for security
            3600 // 1 hour
          : // Development: longer session for convenience
            14400, // 4 hours
    });

    // Add environment-specific policies
    this.addEnvironmentSpecificPolicies(role, environment, namingConfig);

    return role;
  }

  /**
   * Add environment-specific policies to the role
   */
  private addEnvironmentSpecificPolicies(
    role: iam.Role,
    environment: string,
    namingConfig: NamingConfig
  ): void {
    if (environment === 'dev') {
      // Development environment: more permissive for development tasks
      role.addToPolicy(
        new iam.PolicyStatement({
          sid: 'DevEnvironmentAccess',
          effect: iam.Effect.ALLOW,
          actions: [
            's3:GetObject',
            's3:PutObject',
            's3:DeleteObject',
            'logs:CreateLogGroup',
            'logs:CreateLogStream',
            'logs:PutLogEvents',
            'cloudwatch:PutMetricData',
          ],
          resources: [
            `arn:aws:s3:::*${namingConfig.department}-dev-*`,
            `arn:aws:s3:::*${namingConfig.department}-dev-*/*`,
            'arn:aws:logs:*:*:log-group:/aws/lambda/*',
            'arn:aws:logs:*:*:log-group:/aws/lambda/*:*',
            'arn:aws:cloudwatch:*:*:metric/*',
          ],
        })
      );
    } else {
      // Production environment: strict least privilege
      role.addToPolicy(
        new iam.PolicyStatement({
          sid: 'ProdEnvironmentAccess',
          effect: iam.Effect.ALLOW,
          actions: [
            's3:GetObject',
            'logs:CreateLogStream',
            'logs:PutLogEvents',
            'cloudwatch:PutMetricData',
          ],
          resources: [
            `arn:aws:s3:::*${namingConfig.department}-prod-*/*`,
            'arn:aws:logs:*:*:log-group:/aws/lambda/*:*',
            'arn:aws:cloudwatch:*:*:metric/*',
          ],
        })
      );
    }

    // Common policies for both environments
    role.addToPolicy(
      new iam.PolicyStatement({
        sid: 'CommonAccess',
        effect: iam.Effect.ALLOW,
        actions: ['kms:Decrypt', 'kms:GenerateDataKey'],
        resources: ['*'],
        conditions: {
          StringEquals: {
            'kms:ViaService': [
              's3.us-east-2.amazonaws.com',
              's3.us-west-2.amazonaws.com',
            ],
          },
        },
      })
    );
  }

  /**
   * Add standardized tags to IAM resources
   */
  private addResourceTags(namingConfig: NamingConfig): void {
    const tags = {
      Department: namingConfig.department,
      Environment: namingConfig.environment,
      Purpose: namingConfig.purpose,
      ManagedBy: 'CDK',
      SecurityCompliant: 'true',
    };

    Object.entries(tags).forEach(([key, value]) => {
      this.applicationRole.node.addMetadata(key, value);
      this.mfaPolicy.node.addMetadata(key, value);
    });
  }

  /**
   * Create an IAM user with MFA enforcement
   */
  public createUserWithMfa(userName: string): iam.User {
    const user = new iam.User(this, `User-${userName}`, {
      userName: `${NamingUtils.generateResourceName(this.node.tryGetContext('namingConfig'))}-${userName}`,
      managedPolicies: [this.mfaPolicy],
    });

    return user;
  }
}
```

### lib/constructs/storage-construct.ts

```typescript
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as kms from 'aws-cdk-lib/aws-kms';
import { RemovalPolicy } from 'aws-cdk-lib';
import { NamingUtils, NamingConfig } from '../utils/naming';

export interface StorageConstructProps {
  namingConfig: NamingConfig;
  kmsKey: kms.IKey;
  vpc: ec2.IVpc;
  accountId: string;
}

/**
 * Storage Construct for creating encrypted S3 buckets and RDS databases
 */
export class StorageConstruct extends Construct {
  public readonly s3Bucket: s3.Bucket;
  public readonly rdsInstance: rds.DatabaseInstance;

  constructor(scope: Construct, id: string, props: StorageConstructProps) {
    super(scope, id);

    const { namingConfig, kmsKey, vpc, accountId } = props;

    // Create encrypted S3 bucket
    this.s3Bucket = this.createEncryptedS3Bucket(
      namingConfig,
      kmsKey,
      accountId
    );

    // Create encrypted RDS instance
    this.rdsInstance = this.createEncryptedRdsInstance(
      namingConfig,
      kmsKey,
      vpc
    );

    // Add tags for compliance
    this.addResourceTags(namingConfig);
  }

  /**
   * Create an S3 bucket with KMS encryption and security best practices
   */
  private createEncryptedS3Bucket(
    namingConfig: NamingConfig,
    kmsKey: kms.IKey,
    accountId: string
  ): s3.Bucket {
    const bucketName = NamingUtils.generateBucketName(namingConfig, accountId);

    return new s3.Bucket(this, 'EncryptedBucket', {
      bucketName,
      // Encryption configuration
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      bucketKeyEnabled: true,

      // Security configurations
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      enforceSSL: true,

      // Lifecycle and retention
      lifecycleRules: [
        {
          id: 'DeleteIncompleteMultipartUploads',
          abortIncompleteMultipartUploadAfter: 7, // days
          enabled: true,
        },
        {
          id: 'TransitionToIA',
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: 30, // days
            },
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: 90, // days
            },
          ],
          enabled: true,
        },
      ],

      // Removal policy based on environment
      removalPolicy:
        namingConfig.environment === 'prod'
          ? RemovalPolicy.RETAIN
          : RemovalPolicy.DESTROY,

      // Notifications and logging
      eventBridgeEnabled: true,
      serverAccessLogsPrefix: 'access-logs/',
    });
  }

  /**
   * Create an RDS instance with KMS encryption
   */
  private createEncryptedRdsInstance(
    namingConfig: NamingConfig,
    kmsKey: kms.IKey,
    vpc: ec2.IVpc
  ): rds.DatabaseInstance {
    // Create subnet group for RDS
    const subnetGroup = new rds.SubnetGroup(this, 'RdsSubnetGroup', {
      description: `Subnet group for ${NamingUtils.generateResourceName(namingConfig)} RDS`,
      vpc,
      subnetGroupName: `${NamingUtils.generateResourceName(namingConfig)}-subnet-group`,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
    });

    // Create security group for RDS
    const securityGroup = new ec2.SecurityGroup(this, 'RdsSecurityGroup', {
      vpc,
      description: `Security group for ${NamingUtils.generateResourceName(namingConfig)} RDS`,
      securityGroupName: `${NamingUtils.generateResourceName(namingConfig)}-rds-sg`,
    });

    // Only allow connections from within VPC
    securityGroup.addIngressRule(
      ec2.Peer.ipv4(vpc.vpcCidrBlock),
      ec2.Port.tcp(5432),
      'Allow PostgreSQL access from VPC'
    );

    return new rds.DatabaseInstance(this, 'EncryptedDatabase', {
      instanceIdentifier: `${NamingUtils.generateResourceName(namingConfig)}-db`,
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15_4,
      }),
      instanceType:
        namingConfig.environment === 'prod'
          ? ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MEDIUM)
          : ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),

      // Encryption configuration
      storageEncrypted: true,
      storageEncryptionKey: kmsKey,

      // Network configuration
      vpc,
      subnetGroup,
      securityGroups: [securityGroup],

      // Security configurations
      backupRetention: namingConfig.environment === 'prod' ? 30 : 7, // days
      deleteAutomatedBackups: false,
      deletionProtection: namingConfig.environment === 'prod',

      // Monitoring and logging
      monitoringInterval: 60, // seconds
      enablePerformanceInsights: true,
      performanceInsightEncryptionKey: kmsKey,
      cloudwatchLogsExports: ['postgresql'],

      // Maintenance
      autoMinorVersionUpgrade: true,
      allowMajorVersionUpgrade: false,

      // Removal policy
      removalPolicy:
        namingConfig.environment === 'prod'
          ? RemovalPolicy.RETAIN
          : RemovalPolicy.DESTROY,
    });
  }

  /**
   * Add standardized tags to storage resources
   */
  private addResourceTags(namingConfig: NamingConfig): void {
    const tags = {
      Department: namingConfig.department,
      Environment: namingConfig.environment,
      Purpose: namingConfig.purpose,
      ManagedBy: 'CDK',
      EncryptionCompliant: 'true',
      BackupEnabled: 'true',
    };

    Object.entries(tags).forEach(([key, value]) => {
      this.s3Bucket.node.addMetadata(key, value);
      this.rdsInstance.node.addMetadata(key, value);
    });
  }

  /**
   * Get the S3 bucket ARN
   */
  public getBucketArn(): string {
    return this.s3Bucket.bucketArn;
  }

  /**
   * Get the RDS instance endpoint
   */
  public getDatabaseEndpoint(): string {
    return this.rdsInstance.instanceEndpoint.hostname;
  }
}
```

### lib/security-stack.ts

```typescript
import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { IamConstruct } from './constructs/iam-construct';
import { KmsConstruct } from './constructs/kms-construct';
import { StorageConstruct } from './constructs/storage-construct';
import { NamingConfig } from './utils/naming';

export interface SecurityStackProps extends StackProps {
  namingConfig: NamingConfig;
  environment: 'dev' | 'prod';
  accountId: string;
}

/**
 * Main security stack that orchestrates all security constructs
 */
export class SecurityStack extends Stack {
  public readonly iamConstruct: IamConstruct;
  public readonly kmsConstruct: KmsConstruct;
  public readonly storageConstruct: StorageConstruct;
  public readonly vpc: ec2.Vpc;

  constructor(scope: Construct, id: string, props: SecurityStackProps) {
    super(scope, id, props);

    const { namingConfig, environment, accountId } = props;

    // Create VPC for network isolation
    this.vpc = this.createVpc(namingConfig);

    // Create IAM construct with least privilege roles
    this.iamConstruct = new IamConstruct(this, 'IamConstruct', {
      namingConfig,
      environment,
    });

    // Create KMS construct for encryption
    this.kmsConstruct = new KmsConstruct(this, 'KmsConstruct', {
      namingConfig,
      authorizedRoles: [this.iamConstruct.applicationRole],
      accountId,
    });

    // Create storage construct with encryption
    this.storageConstruct = new StorageConstruct(this, 'StorageConstruct', {
      namingConfig,
      kmsKey: this.kmsConstruct.kmsKey,
      vpc: this.vpc,
      accountId,
    });

    // Grant necessary permissions
    this.setupPermissions();
  }

  /**
   * Create VPC with proper network segmentation
   */
  private createVpc(namingConfig: NamingConfig): ec2.Vpc {
    return new ec2.Vpc(this, 'SecurityVpc', {
      maxAzs: 2,
      natGateways: namingConfig.environment === 'prod' ? 2 : 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 28,
          name: 'Isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });
  }

  /**
   * Setup cross-construct permissions
   */
  private setupPermissions(): void {
    // Grant application role access to S3 bucket
    this.storageConstruct.s3Bucket.grantReadWrite(
      this.iamConstruct.applicationRole
    );

    // Grant KMS permissions to application role
    this.kmsConstruct.grantEncryptDecrypt(
      this.iamConstruct.applicationRole
    );
  }

  /**
   * Get stack outputs for reference
   */
  public getStackOutputs(): Record<string, string> {
    return {
      vpcId: this.vpc.vpcId,
      applicationRoleArn: this.iamConstruct.applicationRole.roleArn,
      kmsKeyId: this.kmsConstruct.kmsKey.keyId,
      k
```
