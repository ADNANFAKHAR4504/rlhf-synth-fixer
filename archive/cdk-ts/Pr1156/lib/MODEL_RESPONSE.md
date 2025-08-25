I'll create a comprehensive, production-grade CDK project for a financial services organization that meets all your security and compliance requirements. This solution will be modular, secure, and fully documented.

## Project Structure

```
financial-services-infrastructure/
├── bin/
│   └── financial-services-app.ts
├── lib/
│   ├── constructs/
│   │   ├── iam-construct.ts
│   │   ├── kms-construct.ts
│   │   ├── network-construct.ts
│   │   ├── security-construct.ts
│   │   ├── monitoring-construct.ts
│   │   └── database-construct.ts
│   ├── stacks/
│   │   └── financial-services-stack.ts
│   └── utils/
│       └── tagging.ts
├── package.json
├── tsconfig.json
├── cdk.json
└── README.md
```

## Core Files

### package.json

```json
{
  "name": "financial-services-infrastructure",
  "version": "1.0.0",
  "description": "Secure AWS infrastructure for financial services",
  "main": "lib/index.js",
  "scripts": {
    "build": "tsc",
    "watch": "tsc -w",
    "test": "jest",
    "cdk": "cdk",
    "deploy": "cdk deploy --require-approval never",
    "destroy": "cdk destroy",
    "synth": "cdk synth"
  },
  "devDependencies": {
    "@types/jest": "^29.4.0",
    "@types/node": "18.14.6",
    "jest": "^29.5.0",
    "ts-jest": "^29.0.5",
    "typescript": "~4.9.5"
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
    "lib": ["ES2020"],
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
    "skipLibCheck": true
  },
  "exclude": ["cdk.out"]
}
```

### cdk.json

```json
{
  "app": "npx ts-node --prefer-ts-exts bin/financial-services-app.ts",
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
    "@aws-cdk/core:target-partitions": ["aws", "aws-cn"],
    "@aws-cdk-containers/ecs-service-extensions:enableDefaultLogDriver": true,
    "@aws-cdk/aws-ec2:uniqueImdsv2TemplateName": true,
    "@aws-cdk/aws-ecs:arnFormatIncludesClusterName": true,
    "@aws-cdk/aws-iam:minimizePolicies": true,
    "@aws-cdk/core:validateSnapshotRemovalPolicy": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeyAliasStackSafeResourceName": true,
    "@aws-cdk/aws-s3:createDefaultLoggingPolicy": true,
    "@aws-cdk/aws-sns-subscriptions:restrictSqsDescryption": true,
    "@aws-cdk/aws-apigateway:disableCloudWatchRole": false,
    "@aws-cdk/core:enablePartitionLiterals": true,
    "@aws-cdk/aws-events:eventsTargetQueueSameAccount": true,
    "@aws-cdk/aws-iam:standardizedServicePrincipal": true,
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
    "@aws-cdk/aws-stepfunctions-tasks:enableLoggingConfiguration": true,
    "@aws-cdk/aws-ec2:restrictDefaultSecurityGroup": true,
    "@aws-cdk/aws-apigateway:requestValidatorUniqueId": true,
    "@aws-cdk/aws-kms:aliasNameRef": true,
    "@aws-cdk/aws-autoscaling:generateLaunchTemplateInsteadOfLaunchConfig": true,
    "@aws-cdk/core:includePrefixInUniqueNameGeneration": true,
    "@aws-cdk/aws-efs:denyAnonymousAccess": true,
    "@aws-cdk/aws-opensearchservice:enableLogging": true,
    "@aws-cdk/aws-s3:autoDeleteObjectsPolicy": true,
    "@aws-cdk/aws-ec2:vpnConnectionLogging": true,
    "@aws-cdk/aws-lambda:codeguruProfiler": true,
    "@aws-cdk/aws-opensearchservice:enforceHttps": true
  }
}
```

## Utility Classes

### lib/utils/tagging.ts

```typescript
import { Tags } from 'aws-cdk-lib';
import { IConstruct } from 'constructs';

/**
 * Standard tagging utility for financial services compliance
 * Ensures consistent tagging across all resources for governance and cost allocation
 */
export class TaggingUtils {
  /**
   * Apply standard tags to a construct and all its children
   * @param construct - The construct to tag
   * @param environment - Environment (prod, staging, dev)
   * @param service - Service name (web, api, database)
   * @param owner - Team or individual responsible
   * @param project - Project identifier
   * @param additionalTags - Any additional custom tags
   */
  public static applyStandardTags(
    construct: IConstruct,
    environment: string,
    service: string,
    owner: string,
    project: string,
    additionalTags?: Record<string, string>
  ): void {
    // Standard tags required for financial services compliance
    const standardTags = {
      Environment: environment,
      Service: service,
      Owner: owner,
      Project: project,
      ManagedBy: 'CDK',
      ComplianceLevel: 'Financial-Services',
      DataClassification: 'Confidential',
      BackupRequired: 'true',
      MonitoringEnabled: 'true',
      ...additionalTags,
    };

    // Apply tags to the construct
    Object.entries(standardTags).forEach(([key, value]) => {
      Tags.of(construct).add(key, value);
    });
  }

  /**
   * Generate resource name following naming convention
   * @param environment - Environment identifier
   * @param service - Service identifier
   * @param resource - Resource type
   * @param suffix - Optional suffix
   */
  public static generateResourceName(
    environment: string,
    service: string,
    resource: string,
    suffix?: string
  ): string {
    const baseName = `${environment}-${service}-${resource}`;
    return suffix ? `${baseName}-${suffix}` : baseName;
  }
}
```

## Construct Classes

### lib/constructs/kms-construct.ts

```typescript
import { Construct } from 'constructs';
import { Key, KeyUsage, KeySpec } from 'aws-cdk-lib/aws-kms';
import { RemovalPolicy } from 'aws-cdk-lib';
import { TaggingUtils } from '../utils/tagging';

export interface KmsConstructProps {
  environment: string;
  service: string;
  owner: string;
  project: string;
}

/**
 * KMS Construct for managing encryption keys
 * Creates customer-managed KMS keys for encryption at rest
 * Follows financial services compliance requirements
 */
export class KmsConstruct extends Construct {
  public readonly dataEncryptionKey: Key;
  public readonly logEncryptionKey: Key;
  public readonly databaseEncryptionKey: Key;

  constructor(scope: Construct, id: string, props: KmsConstructProps) {
    super(scope, id);

    // KMS Key for general data encryption (S3, EBS, etc.)
    this.dataEncryptionKey = new Key(this, 'DataEncryptionKey', {
      description: 'KMS key for encrypting sensitive data at rest',
      keyUsage: KeyUsage.ENCRYPT_DECRYPT,
      keySpec: KeySpec.SYMMETRIC_DEFAULT,
      enableKeyRotation: true, // Automatic key rotation for compliance
      removalPolicy: RemovalPolicy.RETAIN, // Prevent accidental deletion
      alias: TaggingUtils.generateResourceName(
        props.environment,
        props.service,
        'data-key'
      ),
    });

    // KMS Key for CloudTrail and CloudWatch logs encryption
    this.logEncryptionKey = new Key(this, 'LogEncryptionKey', {
      description: 'KMS key for encrypting audit and application logs',
      keyUsage: KeyUsage.ENCRYPT_DECRYPT,
      keySpec: KeySpec.SYMMETRIC_DEFAULT,
      enableKeyRotation: true,
      removalPolicy: RemovalPolicy.RETAIN,
      alias: TaggingUtils.generateResourceName(
        props.environment,
        props.service,
        'log-key'
      ),
    });

    // KMS Key for database encryption
    this.databaseEncryptionKey = new Key(this, 'DatabaseEncryptionKey', {
      description: 'KMS key for encrypting database storage and backups',
      keyUsage: KeyUsage.ENCRYPT_DECRYPT,
      keySpec: KeySpec.SYMMETRIC_DEFAULT,
      enableKeyRotation: true,
      removalPolicy: RemovalPolicy.RETAIN,
      alias: TaggingUtils.generateResourceName(
        props.environment,
        props.service,
        'db-key'
      ),
    });

    // Apply standard tags to all KMS keys
    TaggingUtils.applyStandardTags(
      this.dataEncryptionKey,
      props.environment,
      props.service,
      props.owner,
      props.project,
      { ResourceType: 'KMS-DataKey' }
    );

    TaggingUtils.applyStandardTags(
      this.logEncryptionKey,
      props.environment,
      props.service,
      props.owner,
      props.project,
      { ResourceType: 'KMS-LogKey' }
    );

    TaggingUtils.applyStandardTags(
      this.databaseEncryptionKey,
      props.environment,
      props.service,
      props.owner,
      props.project,
      { ResourceType: 'KMS-DatabaseKey' }
    );
  }
}
```

### lib/constructs/network-construct.ts

```typescript
import { Construct } from 'constructs';
import {
  Vpc,
  SubnetType,
  SecurityGroup,
  Port,
  Peer,
  FlowLog,
  FlowLogDestination,
  FlowLogTrafficType,
  NatProvider,
  InterfaceVpcEndpoint,
  InterfaceVpcEndpointAwsService,
  GatewayVpcEndpoint,
  GatewayVpcEndpointAwsService,
} from 'aws-cdk-lib/aws-ec2';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { RemovalPolicy } from 'aws-cdk-lib';
import { Key } from 'aws-cdk-lib/aws-kms';
import { TaggingUtils } from '../utils/tagging';

export interface NetworkConstructProps {
  environment: string;
  service: string;
  owner: string;
  project: string;
  logEncryptionKey: Key;
}

/**
 * Network Construct for VPC and security group configuration
 * Creates a secure, multi-AZ VPC with private subnets for sensitive workloads
 * Implements network segmentation and least-privilege access controls
 */
export class NetworkConstruct extends Construct {
  public readonly vpc: Vpc;
  public readonly webSecurityGroup: SecurityGroup;
  public readonly appSecurityGroup: SecurityGroup;
  public readonly databaseSecurityGroup: SecurityGroup;
  public readonly lambdaSecurityGroup: SecurityGroup;

  constructor(scope: Construct, id: string, props: NetworkConstructProps) {
    super(scope, id);

    // Create VPC with private and public subnets across multiple AZs
    this.vpc = new Vpc(this, 'SecureVpc', {
      maxAzs: 3, // Multi-AZ deployment for high availability
      cidr: '10.0.0.0/16',
      natGateways: 2, // NAT Gateways in multiple AZs for redundancy
      natGatewayProvider: NatProvider.gateway(),
      subnetConfiguration: [
        {
          name: 'Public',
          subnetType: SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'Private',
          subnetType: SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
        {
          name: 'Isolated',
          subnetType: SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // VPC Flow Logs for network monitoring and compliance
    const flowLogGroup = new LogGroup(this, 'VpcFlowLogGroup', {
      logGroupName: `/aws/vpc/flowlogs/${TaggingUtils.generateResourceName(
        props.environment,
        props.service,
        'vpc'
      )}`,
      retention: RetentionDays.ONE_YEAR, // Retain logs for compliance
      encryptionKey: props.logEncryptionKey,
      removalPolicy: RemovalPolicy.RETAIN,
    });

    new FlowLog(this, 'VpcFlowLog', {
      resourceType: FlowLog.fromVpc(this.vpc),
      destination: FlowLogDestination.toCloudWatchLogs(flowLogGroup),
      trafficType: FlowLogTrafficType.ALL,
    });

    // VPC Endpoints for secure AWS service communication
    this.createVpcEndpoints();

    // Security Groups with least-privilege access
    this.createSecurityGroups(props);

    // Apply standard tags
    TaggingUtils.applyStandardTags(
      this.vpc,
      props.environment,
      props.service,
      props.owner,
      props.project,
      { ResourceType: 'VPC' }
    );
  }

  /**
   * Create VPC endpoints to avoid internet traffic for AWS services
   */
  private createVpcEndpoints(): void {
    // Interface endpoints for AWS services
    const interfaceServices = [
      InterfaceVpcEndpointAwsService.EC2,
      InterfaceVpcEndpointAwsService.ECS,
      InterfaceVpcEndpointAwsService.ECR,
      InterfaceVpcEndpointAwsService.ECR_DOCKER,
      InterfaceVpcEndpointAwsService.LAMBDA,
      InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
      InterfaceVpcEndpointAwsService.KMS,
      InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS,
      InterfaceVpcEndpointAwsService.CLOUDWATCH_MONITORING,
    ];

    interfaceServices.forEach((service, index) => {
      new InterfaceVpcEndpoint(this, `InterfaceEndpoint${index}`, {
        vpc: this.vpc,
        service,
        privateDnsEnabled: true,
        subnets: {
          subnetType: SubnetType.PRIVATE_WITH_EGRESS,
        },
      });
    });

    // Gateway endpoints for S3 and DynamoDB
    new GatewayVpcEndpoint(this, 'S3Endpoint', {
      vpc: this.vpc,
      service: GatewayVpcEndpointAwsService.S3,
    });

    new GatewayVpcEndpoint(this, 'DynamoDbEndpoint', {
      vpc: this.vpc,
      service: GatewayVpcEndpointAwsService.DYNAMODB,
    });
  }

  /**
   * Create security groups with restrictive rules
   */
  private createSecurityGroups(props: NetworkConstructProps): void {
    // Web tier security group (ALB/CloudFront)
    this.webSecurityGroup = new SecurityGroup(this, 'WebSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for web tier (load balancers)',
      allowAllOutbound: false, // Explicit outbound rules only
    });

    // Allow HTTPS inbound from internet (443 only)
    this.webSecurityGroup.addIngressRule(
      Peer.anyIpv4(),
      Port.tcp(443),
      'HTTPS from internet'
    );

    // Allow HTTP inbound for redirect to HTTPS
    this.webSecurityGroup.addIngressRule(
      Peer.anyIpv4(),
      Port.tcp(80),
      'HTTP redirect to HTTPS'
    );

    // Application tier security group
    this.appSecurityGroup = new SecurityGroup(this, 'AppSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for application tier',
      allowAllOutbound: false,
    });

    // Allow inbound from web tier only
    this.appSecurityGroup.addIngressRule(
      this.webSecurityGroup,
      Port.tcp(8080),
      'HTTP from web tier'
    );

    // Database security group
    this.databaseSecurityGroup = new SecurityGroup(
      this,
      'DatabaseSecurityGroup',
      {
        vpc: this.vpc,
        description: 'Security group for database tier',
        allowAllOutbound: false,
      }
    );

    // Allow database access only from application tier
    this.databaseSecurityGroup.addIngressRule(
      this.appSecurityGroup,
      Port.tcp(5432), // PostgreSQL
      'Database access from app tier'
    );

    this.databaseSecurityGroup.addIngressRule(
      this.appSecurityGroup,
      Port.tcp(3306), // MySQL
      'Database access from app tier'
    );

    // Lambda security group for serverless functions
    this.lambdaSecurityGroup = new SecurityGroup(this, 'LambdaSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for Lambda functions',
      allowAllOutbound: false,
    });

    // Allow Lambda to access database
    this.lambdaSecurityGroup.addEgressRule(
      this.databaseSecurityGroup,
      Port.tcp(5432),
      'Lambda to database'
    );

    // Allow HTTPS outbound for AWS API calls
    this.lambdaSecurityGroup.addEgressRule(
      Peer.anyIpv4(),
      Port.tcp(443),
      'HTTPS for AWS APIs'
    );

    // Outbound rules for web security group
    this.webSecurityGroup.addEgressRule(
      this.appSecurityGroup,
      Port.tcp(8080),
      'To application tier'
    );

    // Outbound rules for app security group
    this.appSecurityGroup.addEgressRule(
      this.databaseSecurityGroup,
      Port.tcp(5432),
      'To database'
    );

    this.appSecurityGroup.addEgressRule(
      this.databaseSecurityGroup,
      Port.tcp(3306),
      'To database'
    );

    this.appSecurityGroup.addEgressRule(
      Peer.anyIpv4(),
      Port.tcp(443),
      'HTTPS for external APIs'
    );

    // Apply tags to security groups
    const securityGroups = [
      { sg: this.webSecurityGroup, type: 'Web' },
      { sg: this.appSecurityGroup, type: 'App' },
      { sg: this.databaseSecurityGroup, type: 'Database' },
      { sg: this.lambdaSecurityGroup, type: 'Lambda' },
    ];

    securityGroups.forEach(({ sg, type }) => {
      TaggingUtils.applyStandardTags(
        sg,
        props.environment,
        props.service,
        props.owner,
        props.project,
        { ResourceType: `SecurityGroup-${type}` }
      );
    });
  }
}
```

### lib/constructs/iam-construct.ts

```typescript
import { Construct } from 'constructs';
import {
  Role,
  ServicePrincipal,
  PolicyStatement,
  Effect,
  ManagedPolicy,
  PolicyDocument,
  AccountPasswordPolicy,
  User,
  Group,
} from 'aws-cdk-lib/aws-iam';
import { Key } from 'aws-cdk-lib/aws-kms';
import { TaggingUtils } from '../utils/tagging';

export interface IamConstructProps {
  environment: string;
  service: string;
  owner: string;
  project: string;
  kmsKeys: {
    dataKey: Key;
    logKey: Key;
    databaseKey: Key;
  };
}

/**
 * IAM Construct for managing roles, policies, and access controls
 * Implements least-privilege access and financial services compliance
 */
export class IamConstruct extends Construct {
  public readonly lambdaExecutionRole: Role;
  public readonly ec2InstanceRole: Role;
  public readonly rdsRole: Role;
  public readonly cloudTrailRole: Role;

  constructor(scope: Construct, id: string, props: IamConstructProps) {
    super(scope, id);

    // Set up account password policy for compliance
    this.createPasswordPolicy();

    // Create service roles with least privilege
    this.createServiceRoles(props);

    // Apply standard tags
    this.applyTags(props);
  }

  /**
   * Create account password policy enforcing strong passwords and MFA
   */
  private createPasswordPolicy(): void {
    new AccountPasswordPolicy(this, 'PasswordPolicy', {
      minimumPasswordLength: 14,
      requireUppercaseCharacters: true,
      requireLowercaseCharacters: true,
      requireNumbers: true,
      requireSymbols: true,
      allowUsersToChangePassword: true,
      maxPasswordAge: 90, // 90-day password rotation
      passwordReusePrevention: 12, // Prevent reuse of last 12 passwords
      hardExpiry: true,
    });
  }

  /**
   * Create service roles with minimal required permissions
   */
  private createServiceRoles(props: IamConstructProps): void {
    // Lambda execution role with VPC and KMS permissions
    this.lambdaExecutionRole = new Role(this, 'LambdaExecutionRole', {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
      description: 'Execution role for Lambda functions with VPC access',
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaVPCAccessExecutionRole'
        ),
      ],
      inlinePolicies: {
        KMSAccess: new PolicyDocument({
          statements: [
            new PolicyStatement({
              effect: Effect.ALLOW,
              actions: [
                'kms:Decrypt',
                'kms:DescribeKey',
                'kms:GenerateDataKey',
              ],
              resources: [
                props.kmsKeys.dataKey.keyArn,
                props.kmsKeys.logKey.keyArn,
              ],
            }),
          ],
        }),
        SecretsManagerAccess: new PolicyDocument({
          statements: [
            new PolicyStatement({
              effect: Effect.ALLOW,
              actions: ['secretsmanager:GetSecretValue'],
              resources: ['*'],
              conditions: {
                StringEquals: {
                  'secretsmanager:ResourceTag/Environment': props.environment,
                },
              },
            }),
          ],
        }),
        CloudWatchLogs: new PolicyDocument({
          statements: [
            new PolicyStatement({
              effect: Effect.ALLOW,
              actions: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
              ],
              resources: [
                `arn:aws:logs:*:*:log-group:/aws/lambda/${props.environment}-*`,
              ],
            }),
          ],
        }),
      },
    });

    // EC2 instance role for application servers
    this.ec2InstanceRole = new Role(this, 'EC2InstanceRole', {
      assumedBy: new ServicePrincipal('ec2.amazonaws.com'),
      description: 'Role for EC2 instances running application workloads',
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName('CloudWatchAgentServerPolicy'),
      ],
      inlinePolicies: {
        S3Access: new PolicyDocument({
          statements: [
            new PolicyStatement({
              effect: Effect.ALLOW,
              actions: ['s3:GetObject', 's3:PutObject'],
              resources: [
                `arn:aws:s3:::${props.environment}-${props.service}-*/*`,
              ],
            }),
          ],
        }),
        KMSAccess: new PolicyDocument({
          statements: [
            new PolicyStatement({
              effect: Effect.ALLOW,
              actions: ['kms:Decrypt', 'kms:GenerateDataKey'],
              resources: [props.kmsKeys.dataKey.keyArn],
            }),
          ],
        }),
      },
    });

    // RDS enhanced monitoring role
    this.rdsRole = new Role(this, 'RDSRole', {
      assumedBy: new ServicePrincipal('monitoring.rds.amazonaws.com'),
      description: 'Role for RDS enhanced monitoring',
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AmazonRDSEnhancedMonitoringRole'
        ),
      ],
    });

    // CloudTrail role for logging to CloudWatch
    this.cloudTrailRole = new Role(this, 'CloudTrailRole', {
      assumedBy: new ServicePrincipal('cloudtrail.amazonaws.com'),
      description: 'Role for CloudTrail to write logs to CloudWatch',
      inlinePolicies: {
        CloudWatchLogsPolicy: new PolicyDocument({
          statements: [
            new PolicyStatement({
              effect: Effect.ALLOW,
              actions: [
                'logs:PutLogEvents',
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
              ],
              resources: ['*'],
            }),
          ],
        }),
      },
    });
  }

  /**
   * Apply standard tags to all IAM resources
   */
  private applyTags(props: IamConstructProps): void {
    const roles = [
      { role: this.lambdaExecutionRole, type: 'Lambda' },
      { role: this.ec2InstanceRole, type: 'EC2' },
      { role: this.rdsRole, type: 'RDS' },
      { role: this.cloudTrailRole, type: 'CloudTrail' },
    ];

    roles.forEach(({ role, type }) => {
      TaggingUtils.applyStandardTags(
        role,
        props.environment,
        props.service,
        props.owner,
        props.project,
        { ResourceType: `IAM-Role-${type}` }
      );
    });
  }

  /**
   * Create a managed policy for cross-account access (if needed)
   */
  public createCrossAccountPolicy(trustedAccountIds: string[]): ManagedPolicy {
    return new ManagedPolicy(this, 'CrossAccountPolicy', {
      description: 'Policy for secure cross-account access',
      statements: [
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: ['sts:AssumeRole'],
          resources: trustedAccountIds.map(
            accountId => `arn:aws:iam::${accountId}:role/*`
          ),
          conditions: {
            Bool: {
              'aws:MultiFactorAuthPresent': 'true',
            },
            NumericLessThan: {
              'aws:MultiFactorAuthAge': '3600', // 1 hour
            },
          },
        }),
      ],
    });
  }
}
```

### lib/constructs/monitoring-construct.ts

```typescript
import { Construct } from 'constructs';
import {
  Trail,
  EventType,
  ReadWriteType,
} from 'aws-cdk-lib/aws-cloudtrail';
import {
  LogGroup,
  RetentionDays,
  MetricFilter,
  FilterPattern,
} from 'aws-cdk-lib/aws-logs';
import {
  Bucket,
  BucketEncryption,
  BlockPublicAccess,
  BucketAccessControl,
} from 'aws-cdk-lib/aws-s3';
import {
  Alarm,
  Metric,
  ComparisonOperator,
  TreatMissingData,
} from 'aws-cdk-lib/aws-cloudwatch';
import { Topic } from 'aws-cdk-lib/aws-sns';
import { EmailSubscription } from 'aws-cdk-lib/aws-sns-subscriptions';
import { Key } from 'aws-cdk-lib/aws-kms';
import { Role } from 'aws-cdk-lib/aws-iam';
import { RemovalPolicy } from 'aws-cdk-lib';
import { TaggingUtils } from '../utils/tagging';

export interface MonitoringConstructProps {
  environment: string;
  service: string;
  owner: string;
  project: string;
  logEncryptionKey
```
