I'll create a comprehensive, production-grade CDK project that meets all your security requirements. This will be a modular, well-documented solution with strict security controls.

## Project Structure

```
secure-app-infrastructure/
├── bin/
│   └── secure-app.ts
├── lib/
│   ├── constructs/
│   │   ├── networking/
│   │   │   ├── vpc-construct.ts
│   │   │   └── security-groups-construct.ts
│   │   ├── security/
│   │   │   ├── iam-construct.ts
│   │   │   ├── kms-construct.ts
│   │   │   └── secrets-construct.ts
│   │   ├── storage/
│   │   │   └── s3-construct.ts
│   │   ├── compute/
│   │   │   └── ec2-construct.ts
│   │   ├── monitoring/
│   │   │   ├── cloudtrail-construct.ts
│   │   │   ├── config-construct.ts
│   │   │   └── flow-logs-construct.ts
│   │   └── application/
│   │       ├── alb-construct.ts
│   │       └── waf-construct.ts
│   ├── secure-app-stack.ts
│   └── config/
│       └── security-config.ts
├── package.json
├── tsconfig.json
├── cdk.json
└── README.md
```

## Core Files

### package.json

```json
{
  "name": "secure-app-infrastructure",
  "version": "1.0.0",
  "description": "Production-grade secure AWS infrastructure using CDK",
  "main": "lib/index.js",
  "scripts": {
    "build": "tsc",
    "watch": "tsc -w",
    "test": "jest",
    "cdk": "cdk",
    "deploy": "cdk deploy --require-approval never",
    "destroy": "cdk destroy",
    "synth": "cdk synth",
    "diff": "cdk diff"
  },
  "devDependencies": {
    "@types/jest": "^29.4.0",
    "@types/node": "18.14.6",
    "jest": "^29.5.0",
    "ts-jest": "^29.0.5",
    "typescript": "~4.9.5",
    "aws-cdk": "2.87.0"
  },
  "dependencies": {
    "aws-cdk-lib": "2.87.0",
    "constructs": "^10.0.0"
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
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "exclude": ["cdk.out"]
}
```

### cdk.json

```json
{
  "app": "npx ts-node --prefer-ts-exts bin/secure-app.ts",
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
    "@aws-cdk/core:target": "aws-cdk-lib",
    "@aws-cdk/core:enableStackNameDuplicates": true,
    "aws-cdk:enableDiffNoFail": true,
    "@aws-cdk/core:stackRelativeExports": true,
    "@aws-cdk/aws-rds:lowercaseDbIdentifier": true,
    "@aws-cdk/aws-lambda:recognizeVersionProps": true,
    "@aws-cdk/aws-cloudfront:defaultSecurityPolicyTLSv1.2_2021": true
  }
}
```

## Configuration

### lib/config/security-config.ts

```typescript
/**
 * Security configuration constants for the SecureApp infrastructure
 * These values define security boundaries and compliance requirements
 */
export class SecurityConfig {
  // Network security configuration
  public static readonly ALLOWED_SSH_CIDR = '10.0.0.0/8'; // Restrict to internal network only
  public static readonly VPC_CIDR = '10.0.0.0/16';
  public static readonly PRIVATE_SUBNET_CIDRS = ['10.0.1.0/24', '10.0.2.0/24'];
  public static readonly PUBLIC_SUBNET_CIDRS = [
    '10.0.101.0/24',
    '10.0.102.0/24',
  ];

  // Encryption and compliance
  public static readonly MINIMUM_TLS_VERSION = '1.2';
  public static readonly KMS_KEY_ROTATION_ENABLED = true;

  // Tagging standards
  public static readonly RESOURCE_PREFIX = 'SecureApp';
  public static readonly STANDARD_TAGS = {
    Project: 'SecureApp',
    Environment: 'Production',
    Owner: 'DevSecOps-Team',
    CostCenter: 'Engineering',
    Compliance: 'SOC2-PCI',
    BackupRequired: 'true',
    MonitoringLevel: 'High',
  };

  // Region configuration
  public static readonly PRIMARY_REGION = 'us-east-1';

  // Security monitoring
  public static readonly ENABLE_DETAILED_MONITORING = true;
  public static readonly LOG_RETENTION_DAYS = 365;
}
```

## Networking Constructs

### lib/constructs/networking/vpc-construct.ts

```typescript
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as logs from 'aws-cdk-lib/aws-logs';
import { SecurityConfig } from '../../config/security-config';

/**
 * VPC Construct that creates a highly secure, multi-AZ VPC with proper subnet isolation
 * Implements network segmentation with private subnets for sensitive workloads
 */
export class VpcConstruct extends Construct {
  public readonly vpc: ec2.Vpc;
  public readonly privateSubnets: ec2.ISubnet[];
  public readonly publicSubnets: ec2.ISubnet[];

  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Create VPC with strict network isolation
    this.vpc = new ec2.Vpc(this, `${SecurityConfig.RESOURCE_PREFIX}-VPC`, {
      ipAddresses: ec2.IpAddresses.cidr(SecurityConfig.VPC_CIDR),
      maxAzs: 2, // Multi-AZ for high availability

      // Define subnet configuration with proper isolation
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: `${SecurityConfig.RESOURCE_PREFIX}-Private`,
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 24,
          name: `${SecurityConfig.RESOURCE_PREFIX}-Public`,
          subnetType: ec2.SubnetType.PUBLIC,
        },
      ],

      // Enable DNS resolution and hostnames for secure internal communication
      enableDnsHostnames: true,
      enableDnsSupport: true,

      // NAT Gateway configuration for secure outbound internet access from private subnets
      natGateways: 2, // One per AZ for high availability
      natGatewayProvider: ec2.NatProvider.gateway({
        eipAllocationIds: [], // Will be auto-allocated
      }),
    });

    // Store subnet references for use by other constructs
    this.privateSubnets = this.vpc.privateSubnets;
    this.publicSubnets = this.vpc.publicSubnets;

    // Create VPC Flow Logs for comprehensive network monitoring and security auditing
    const flowLogsGroup = new logs.LogGroup(
      this,
      `${SecurityConfig.RESOURCE_PREFIX}-VPCFlowLogs`,
      {
        logGroupName: `/aws/vpc/${SecurityConfig.RESOURCE_PREFIX}-flowlogs`,
        retention: logs.RetentionDays.ONE_YEAR, // Long retention for compliance
      }
    );

    // Enable VPC Flow Logs to capture all network traffic for security analysis
    new ec2.FlowLog(this, `${SecurityConfig.RESOURCE_PREFIX}-VPCFlowLog`, {
      resourceType: ec2.FlowLogResourceType.fromVpc(this.vpc),
      destination: ec2.FlowLogDestination.toCloudWatchLogs(flowLogsGroup),
      trafficType: ec2.FlowLogTrafficType.ALL, // Capture all traffic (accepted, rejected, all)
    });

    // Apply security tags to all VPC resources
    Object.entries(SecurityConfig.STANDARD_TAGS).forEach(([key, value]) => {
      this.vpc.node.addMetadata(key, value);
    });
  }
}
```

### lib/constructs/networking/security-groups-construct.ts

```typescript
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { SecurityConfig } from '../../config/security-config';

/**
 * Security Groups Construct implementing defense-in-depth network security
 * All rules follow the principle of least privilege with minimal required access
 */
export class SecurityGroupsConstruct extends Construct {
  public readonly webSecurityGroup: ec2.SecurityGroup;
  public readonly appSecurityGroup: ec2.SecurityGroup;
  public readonly databaseSecurityGroup: ec2.SecurityGroup;
  public readonly bastionSecurityGroup: ec2.SecurityGroup;
  public readonly albSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, vpc: ec2.IVpc) {
    super(scope, id);

    // ALB Security Group - Only allows HTTPS traffic from internet
    this.albSecurityGroup = new ec2.SecurityGroup(
      this,
      `${SecurityConfig.RESOURCE_PREFIX}-ALB-SG`,
      {
        vpc,
        description:
          'Security group for Application Load Balancer - HTTPS only',
        allowAllOutbound: false, // Explicit outbound rules only
      }
    );

    // Allow HTTPS inbound from internet (443)
    this.albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic from internet'
    );

    // Allow HTTP for health checks and redirects (will redirect to HTTPS)
    this.albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic for redirects to HTTPS'
    );

    // Web Tier Security Group - Only accepts traffic from ALB
    this.webSecurityGroup = new ec2.SecurityGroup(
      this,
      `${SecurityConfig.RESOURCE_PREFIX}-Web-SG`,
      {
        vpc,
        description:
          'Security group for web servers - accepts traffic only from ALB',
        allowAllOutbound: false,
      }
    );

    // Allow inbound HTTP from ALB only
    this.webSecurityGroup.addIngressRule(
      this.albSecurityGroup,
      ec2.Port.tcp(80),
      'Allow HTTP from ALB'
    );

    // Allow inbound HTTPS from ALB only
    this.webSecurityGroup.addIngressRule(
      this.albSecurityGroup,
      ec2.Port.tcp(443),
      'Allow HTTPS from ALB'
    );

    // Allow outbound HTTPS for package updates and external API calls
    this.webSecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS outbound for updates and APIs'
    );

    // Allow outbound HTTP for package repositories
    this.webSecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP outbound for package repositories'
    );

    // Application Tier Security Group - Only accepts traffic from Web tier
    this.appSecurityGroup = new ec2.SecurityGroup(
      this,
      `${SecurityConfig.RESOURCE_PREFIX}-App-SG`,
      {
        vpc,
        description:
          'Security group for application servers - accepts traffic only from web tier',
        allowAllOutbound: false,
      }
    );

    // Allow inbound from web tier on application port
    this.appSecurityGroup.addIngressRule(
      this.webSecurityGroup,
      ec2.Port.tcp(8080),
      'Allow application traffic from web tier'
    );

    // Allow outbound HTTPS for external services
    this.appSecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS outbound for external services'
    );

    // Database Security Group - Only accepts traffic from App tier
    this.databaseSecurityGroup = new ec2.SecurityGroup(
      this,
      `${SecurityConfig.RESOURCE_PREFIX}-DB-SG`,
      {
        vpc,
        description:
          'Security group for database servers - accepts traffic only from app tier',
        allowAllOutbound: false,
      }
    );

    // Allow inbound MySQL/Aurora from app tier only
    this.databaseSecurityGroup.addIngressRule(
      this.appSecurityGroup,
      ec2.Port.tcp(3306),
      'Allow MySQL access from application tier'
    );

    // Bastion Host Security Group - Highly restricted SSH access
    this.bastionSecurityGroup = new ec2.SecurityGroup(
      this,
      `${SecurityConfig.RESOURCE_PREFIX}-Bastion-SG`,
      {
        vpc,
        description: 'Security group for bastion host - restricted SSH access',
        allowAllOutbound: false,
      }
    );

    // Allow SSH only from specific CIDR block (corporate network)
    this.bastionSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(SecurityConfig.ALLOWED_SSH_CIDR),
      ec2.Port.tcp(22),
      'Allow SSH from corporate network only'
    );

    // Allow outbound SSH to private subnets for administration
    this.bastionSecurityGroup.addEgressRule(
      ec2.Peer.ipv4(SecurityConfig.VPC_CIDR),
      ec2.Port.tcp(22),
      'Allow SSH to private instances'
    );

    // Allow outbound HTTPS for updates
    this.bastionSecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS outbound for updates'
    );

    // Configure ALB outbound rules to web tier
    this.albSecurityGroup.addEgressRule(
      this.webSecurityGroup,
      ec2.Port.tcp(80),
      'Allow outbound HTTP to web tier'
    );

    this.albSecurityGroup.addEgressRule(
      this.webSecurityGroup,
      ec2.Port.tcp(443),
      'Allow outbound HTTPS to web tier'
    );

    // Configure App tier to Database tier communication
    this.appSecurityGroup.addEgressRule(
      this.databaseSecurityGroup,
      ec2.Port.tcp(3306),
      'Allow outbound MySQL to database tier'
    );

    // Apply security tags to all security groups
    const securityGroups = [
      this.webSecurityGroup,
      this.appSecurityGroup,
      this.databaseSecurityGroup,
      this.bastionSecurityGroup,
      this.albSecurityGroup,
    ];

    securityGroups.forEach(sg => {
      Object.entries(SecurityConfig.STANDARD_TAGS).forEach(([key, value]) => {
        sg.node.addMetadata(key, value);
      });
    });
  }
}
```

## Security Constructs

### lib/constructs/security/kms-construct.ts

```typescript
import { Construct } from 'constructs';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as iam from 'aws-cdk-lib/aws-iam';
import { SecurityConfig } from '../../config/security-config';

/**
 * KMS Construct for managing encryption keys with automatic rotation
 * Implements encryption at rest for all sensitive data stores
 */
export class KmsConstruct extends Construct {
  public readonly s3Key: kms.Key;
  public readonly secretsKey: kms.Key;
  public readonly cloudTrailKey: kms.Key;
  public readonly efsKey: kms.Key;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    // S3 Encryption Key - For all S3 buckets containing sensitive data
    this.s3Key = new kms.Key(this, `${SecurityConfig.RESOURCE_PREFIX}-S3-Key`, {
      description: 'KMS key for S3 bucket encryption',
      enableKeyRotation: SecurityConfig.KMS_KEY_ROTATION_ENABLED,
      keySpec: kms.KeySpec.SYMMETRIC_DEFAULT,
      keyUsage: kms.KeyUsage.ENCRYPT_DECRYPT,

      // Key policy following least privilege principle
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
            sid: 'Allow S3 Service',
            effect: iam.Effect.ALLOW,
            principals: [new iam.ServicePrincipal('s3.amazonaws.com')],
            actions: [
              'kms:Decrypt',
              'kms:GenerateDataKey',
              'kms:ReEncrypt*',
              'kms:CreateGrant',
              'kms:DescribeKey',
            ],
            resources: ['*'],
          }),
        ],
      }),
    });

    // Secrets Manager Encryption Key
    this.secretsKey = new kms.Key(
      this,
      `${SecurityConfig.RESOURCE_PREFIX}-Secrets-Key`,
      {
        description: 'KMS key for AWS Secrets Manager encryption',
        enableKeyRotation: SecurityConfig.KMS_KEY_ROTATION_ENABLED,
        keySpec: kms.KeySpec.SYMMETRIC_DEFAULT,
        keyUsage: kms.KeyUsage.ENCRYPT_DECRYPT,

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
              sid: 'Allow Secrets Manager Service',
              effect: iam.Effect.ALLOW,
              principals: [
                new iam.ServicePrincipal('secretsmanager.amazonaws.com'),
              ],
              actions: [
                'kms:Decrypt',
                'kms:GenerateDataKey',
                'kms:ReEncrypt*',
                'kms:CreateGrant',
                'kms:DescribeKey',
              ],
              resources: ['*'],
            }),
          ],
        }),
      }
    );

    // CloudTrail Encryption Key
    this.cloudTrailKey = new kms.Key(
      this,
      `${SecurityConfig.RESOURCE_PREFIX}-CloudTrail-Key`,
      {
        description: 'KMS key for CloudTrail log encryption',
        enableKeyRotation: SecurityConfig.KMS_KEY_ROTATION_ENABLED,
        keySpec: kms.KeySpec.SYMMETRIC_DEFAULT,
        keyUsage: kms.KeyUsage.ENCRYPT_DECRYPT,

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
              sid: 'Allow CloudTrail Service',
              effect: iam.Effect.ALLOW,
              principals: [
                new iam.ServicePrincipal('cloudtrail.amazonaws.com'),
              ],
              actions: [
                'kms:GenerateDataKey*',
                'kms:DescribeKey',
                'kms:Encrypt',
                'kms:ReEncrypt*',
                'kms:Decrypt',
              ],
              resources: ['*'],
            }),
          ],
        }),
      }
    );

    // EFS Encryption Key
    this.efsKey = new kms.Key(
      this,
      `${SecurityConfig.RESOURCE_PREFIX}-EFS-Key`,
      {
        description: 'KMS key for EFS encryption',
        enableKeyRotation: SecurityConfig.KMS_KEY_ROTATION_ENABLED,
        keySpec: kms.KeySpec.SYMMETRIC_DEFAULT,
        keyUsage: kms.KeyUsage.ENCRYPT_DECRYPT,
      }
    );

    // Create aliases for easier key management
    new kms.Alias(this, `${SecurityConfig.RESOURCE_PREFIX}-S3-Key-Alias`, {
      aliasName: `alias/${SecurityConfig.RESOURCE_PREFIX}-s3-key`,
      targetKey: this.s3Key,
    });

    new kms.Alias(this, `${SecurityConfig.RESOURCE_PREFIX}-Secrets-Key-Alias`, {
      aliasName: `alias/${SecurityConfig.RESOURCE_PREFIX}-secrets-key`,
      targetKey: this.secretsKey,
    });

    new kms.Alias(
      this,
      `${SecurityConfig.RESOURCE_PREFIX}-CloudTrail-Key-Alias`,
      {
        aliasName: `alias/${SecurityConfig.RESOURCE_PREFIX}-cloudtrail-key`,
        targetKey: this.cloudTrailKey,
      }
    );

    new kms.Alias(this, `${SecurityConfig.RESOURCE_PREFIX}-EFS-Key-Alias`, {
      aliasName: `alias/${SecurityConfig.RESOURCE_PREFIX}-efs-key`,
      targetKey: this.efsKey,
    });
  }
}
```

### lib/constructs/security/iam-construct.ts

```typescript
import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import { SecurityConfig } from '../../config/security-config';

/**
 * IAM Construct implementing least privilege access principles
 * Creates roles and policies with minimal required permissions
 */
export class IamConstruct extends Construct {
  public readonly ec2Role: iam.Role;
  public readonly cloudTrailRole: iam.Role;
  public readonly configRole: iam.Role;
  public readonly applicationRole: iam.Role;

  constructor(
    scope: Construct,
    id: string,
    kmsKeys: {
      s3Key: kms.Key;
      secretsKey: kms.Key;
      cloudTrailKey: kms.Key;
    }
  ) {
    super(scope, id);

    // EC2 Instance Role with minimal required permissions
    this.ec2Role = new iam.Role(
      this,
      `${SecurityConfig.RESOURCE_PREFIX}-EC2-Role`,
      {
        assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
        description: 'IAM role for EC2 instances with least privilege access',

        // Attach AWS managed policies for basic functionality
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'CloudWatchAgentServerPolicy'
          ),
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'AmazonSSMManagedInstanceCore'
          ), // For Systems Manager
        ],

        // Custom inline policy for specific application needs
        inlinePolicies: {
          [`${SecurityConfig.RESOURCE_PREFIX}-EC2-Policy`]:
            new iam.PolicyDocument({
              statements: [
                // Allow reading from specific S3 buckets only
                new iam.PolicyStatement({
                  effect: iam.Effect.ALLOW,
                  actions: ['s3:GetObject', 's3:GetObjectVersion'],
                  resources: [
                    `arn:aws:s3:::${SecurityConfig.RESOURCE_PREFIX.toLowerCase()}-*/*`,
                  ],
                }),

                // Allow decryption of application-specific KMS keys
                new iam.PolicyStatement({
                  effect: iam.Effect.ALLOW,
                  actions: [
                    'kms:Decrypt',
                    'kms:GenerateDataKey',
                    'kms:DescribeKey',
                  ],
                  resources: [kmsKeys.s3Key.keyArn, kmsKeys.secretsKey.keyArn],
                }),

                // Allow reading specific secrets
                new iam.PolicyStatement({
                  effect: iam.Effect.ALLOW,
                  actions: [
                    'secretsmanager:GetSecretValue',
                    'secretsmanager:DescribeSecret',
                  ],
                  resources: [
                    `arn:aws:secretsmanager:${SecurityConfig.PRIMARY_REGION}:*:secret:${SecurityConfig.RESOURCE_PREFIX}/*`,
                  ],
                }),
              ],
            }),
        },
      }
    );

    // Application-specific role for Lambda functions or containers
    this.applicationRole = new iam.Role(
      this,
      `${SecurityConfig.RESOURCE_PREFIX}-App-Role`,
      {
        assumedBy: new iam.CompositePrincipal(
          new iam.ServicePrincipal('lambda.amazonaws.com'),
          new iam.ServicePrincipal('ecs-tasks.amazonaws.com')
        ),
        description:
          'IAM role for application services with restricted permissions',

        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AWSLambdaVPCAccessExecutionRole'
          ),
        ],

        inlinePolicies: {
          [`${SecurityConfig.RESOURCE_PREFIX}-App-Policy`]:
            new iam.PolicyDocument({
              statements: [
                // Restricted S3 access
                new iam.PolicyStatement({
                  effect: iam.Effect.ALLOW,
                  actions: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
                  resources: [
                    `arn:aws:s3:::${SecurityConfig.RESOURCE_PREFIX.toLowerCase()}-app-data/*`,
                  ],
                }),

                // CloudWatch Logs access
                new iam.PolicyStatement({
                  effect: iam.Effect.ALLOW,
                  actions: [
                    'logs:CreateLogGroup',
                    'logs:CreateLogStream',
                    'logs:PutLogEvents',
                  ],
                  resources: [
                    `arn:aws:logs:${SecurityConfig.PRIMARY_REGION}:*:log-group:/aws/lambda/${SecurityConfig.RESOURCE_PREFIX}*`,
                  ],
                }),
              ],
            }),
        },
      }
    );

    // CloudTrail Service Role
    this.cloudTrailRole = new iam.Role(
      this,
      `${SecurityConfig.RESOURCE_PREFIX}-CloudTrail-Role`,
      {
        assumedBy: new iam.ServicePrincipal('cloudtrail.amazonaws.com'),
        description: 'IAM role for CloudTrail service',

        inlinePolicies: {
          [`${SecurityConfig.RESOURCE_PREFIX}-CloudTrail-Policy`]:
            new iam.PolicyDocument({
              statements: [
                new iam.PolicyStatement({
                  effect: iam.Effect.ALLOW,
                  actions: [
                    's3:PutObject',
                    's3:GetBucketAcl',
                    's3:PutBucketAcl',
                  ],
                  resources: [
                    `arn:aws:s3:::${SecurityConfig.RESOURCE_PREFIX.toLowerCase()}-cloudtrail-logs`,
                    `arn:aws:s3:::${SecurityConfig.RESOURCE_PREFIX.toLowerCase()}-cloudtrail-logs/*`,
                  ],
                }),
                new iam.PolicyStatement({
                  effect: iam.Effect.ALLOW,
                  actions: ['kms:GenerateDataKey*', 'kms:DescribeKey'],
                  resources: [kmsKeys.cloudTrailKey.keyArn],
                }),
              ],
            }),
        },
      }
    );

    // AWS Config Service Role
    this.configRole = new iam.Role(
      this,
      `${SecurityConfig.RESOURCE_PREFIX}-Config-Role`,
      {
        assumedBy: new iam.ServicePrincipal('config.amazonaws.com'),
        description: 'IAM role for AWS Config service',

        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/ConfigRole'),
        ],

        inlinePolicies: {
          [`${SecurityConfig.RESOURCE_PREFIX}-Config-Policy`]:
            new iam.PolicyDocument({
              statements: [
                new iam.PolicyStatement({
                  effect: iam.Effect.ALLOW,
                  actions: [
                    's3:GetBucketAcl',
                    's3:ListBucket',
                    's3:GetBucketLocation',
                    's3:PutObject',
                    's3:GetBucketVersioning',
                  ],
                  resources: [
                    `arn:aws:s3:::${SecurityConfig.RESOURCE_PREFIX.toLowerCase()}-config-logs`,
                    `arn:aws:s3:::${SecurityConfig.RESOURCE_PREFIX.toLowerCase()}-config-logs/*`,
                  ],
                }),
              ],
            }),
        },
      }
    );

    // Create instance profile for EC2
    new iam.InstanceProfile(
      this,
      `${SecurityConfig.RESOURCE_PREFIX}-EC2-InstanceProfile`,
      {
        role: this.ec2Role,
        instanceProfileName: `${SecurityConfig.RESOURCE_PREFIX}-EC2-InstanceProfile`,
      }
    );

    // Apply tags to all IAM resources
    const roles = [
      this.ec2Role,
      this.applicationRole,
      this.cloudTrailRole,
      this.configRole,
    ];
    roles.forEach(role => {
      Object.entries(SecurityConfig.STANDARD_TAGS).forEach(([key, value]) => {
        role.node.addMetadata(key, value);
      });
    });
  }
}
```

### lib/constructs/security/secrets-construct.ts

```typescript
import { Construct } from 'constructs';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as rds from 'aws-cdk-lib/aws-rds';
import { SecurityConfig } from '../../config/security-config';

/**
 * Secrets Manager Construct for secure storage and retrieval of sensitive data
 * All secrets are encrypted using customer-managed KMS keys
 */
export class SecretsConstruct extends Construct {
  public readonly databaseSecret: secretsmanager.Secret;
  public readonly apiKeySecret: secretsmanager
```
