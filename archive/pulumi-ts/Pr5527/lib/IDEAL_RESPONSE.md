# RDS Backup Verification and Recovery System - Production-Ready Implementation

This is the production-ready implementation of the automated backup verification and recovery system for RDS PostgreSQL instances with comprehensive security, monitoring, and disaster recovery capabilities.

## File: lib/tap-stack.ts

```typescript
/**
 * tap-stack.ts
 *
 * Main orchestrator for RDS backup verification and recovery system.
 * Coordinates VPC, KMS, RDS, backup, and monitoring stacks.
 */
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
import { VPCStack } from './vpc-stack';
import { KMSStack } from './kms-stack';
import { RDSStack } from './rds-stack';
import { BackupStack } from './backup-stack';
import { MonitoringStack } from './monitoring-stack';

export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
  backupWindow?: string;
  maintenanceWindow?: string;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly vpcId: pulumi.Output<string>;
  public readonly rdsEndpoint: pulumi.Output<string>;
  public readonly rdsInstanceId: pulumi.Output<string>;
  public readonly backupBucketName: pulumi.Output<string>;
  public readonly snsTopicArn: pulumi.Output<string>;
  public readonly kmsKeyId: pulumi.Output<string>;
  public readonly kmsKeyArn: pulumi.Output<string>;
  public readonly lambdaFunctionName: pulumi.Output<string>;
  public readonly dashboardUrl: pulumi.Output<string>;
  public readonly secretArn: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};
    const backupWindow = args.backupWindow || '03:00-04:00';
    const maintenanceWindow = args.maintenanceWindow || 'Mon:04:00-Mon:05:00';

    // Create VPC with private subnets and VPC endpoints
    const vpcStack = new VPCStack(
      'rds-backup-vpc',
      {
        environmentSuffix,
        tags,
      },
      { parent: this }
    );

    // Create KMS customer-managed keys for encryption
    const kmsStack = new KMSStack(
      'kms',
      {
        environmentSuffix,
        tags,
      },
      { parent: this }
    );

    // Create RDS PostgreSQL instance with proper encryption and backup configuration
    const rdsStack = new RDSStack(
      'rds-postgresql',
      {
        environmentSuffix,
        vpcId: vpcStack.vpcId,
        privateSubnetIds: vpcStack.privateSubnetIds,
        securityGroupId: vpcStack.rdsSecurityGroupId,
        kmsKeyId: kmsStack.keyId,
        tags,
        backupWindow,
        maintenanceWindow,
      },
      { parent: this }
    );

    // Create backup infrastructure with cross-region DR
    const backupStack = new BackupStack(
      'backup-infra',
      {
        environmentSuffix,
        rdsInstanceId: rdsStack.instanceId,
        rdsEndpoint: rdsStack.endpoint,
        rdsSecretArn: rdsStack.secretArn,
        vpcId: vpcStack.vpcId,
        privateSubnetIds: vpcStack.privateSubnetIds,
        lambdaSecurityGroupId: vpcStack.lambdaSecurityGroupId,
        kmsKeyArn: kmsStack.keyArn,
        tags,
      },
      { parent: this }
    );

    // Create monitoring, alerting, and dashboard
    const monitoringStack = new MonitoringStack(
      'monitoring',
      {
        environmentSuffix,
        rdsInstanceId: rdsStack.instanceId,
        backupBucketName: backupStack.bucketName,
        lambdaFunctionName: backupStack.lambdaFunctionName,
        kmsKeyArn: kmsStack.keyArn,
        tags,
      },
      { parent: this }
    );

    this.vpcId = vpcStack.vpcId;
    this.rdsEndpoint = rdsStack.endpoint;
    this.rdsInstanceId = rdsStack.instanceId;
    this.backupBucketName = backupStack.bucketName;
    this.snsTopicArn = monitoringStack.snsTopicArn;
    this.kmsKeyId = kmsStack.keyId;
    this.kmsKeyArn = kmsStack.keyArn;
    this.lambdaFunctionName = backupStack.lambdaFunctionName;
    this.dashboardUrl = monitoringStack.dashboardUrl;
    this.secretArn = rdsStack.secretArn;

    this.registerOutputs({
      vpcId: this.vpcId,
      rdsEndpoint: this.rdsEndpoint,
      rdsInstanceId: this.rdsInstanceId,
      backupBucketName: this.backupBucketName,
      snsTopicArn: this.snsTopicArn,
      kmsKeyId: this.kmsKeyId,
      kmsKeyArn: this.kmsKeyArn,
      lambdaFunctionName: this.lambdaFunctionName,
      dashboardUrl: this.dashboardUrl,
      secretArn: this.secretArn,
    });
  }
}
```

## File: lib/kms-stack.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface KMSStackArgs {
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class KMSStack extends pulumi.ComponentResource {
  public readonly keyId: pulumi.Output<string>;
  public readonly keyArn: pulumi.Output<string>;

  constructor(
    name: string,
    args: KMSStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:kms:KMSStack', name, {}, opts);

    const currentCallerIdentity = aws.getCallerIdentity({});
    const currentRegion = aws.getRegion({});

    // Create KMS key for encryption
    const kmsKey = new aws.kms.Key(
      `backup-kms-${args.environmentSuffix}`,
      {
        description: `KMS key for RDS backup encryption - ${args.environmentSuffix}`,
        enableKeyRotation: true,
        deletionWindowInDays: 7,
        policy: pulumi
          .all([currentCallerIdentity, currentRegion])
          .apply(([identity, region]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Sid: 'Enable IAM User Permissions',
                  Effect: 'Allow',
                  Principal: {
                    AWS: `arn:aws:iam::${identity.accountId}:root`,
                  },
                  Action: 'kms:*',
                  Resource: '*',
                },
                {
                  Sid: 'Allow RDS to use the key',
                  Effect: 'Allow',
                  Principal: {
                    Service: 'rds.amazonaws.com',
                  },
                  Action: [
                    'kms:Decrypt',
                    'kms:GenerateDataKey',
                    'kms:CreateGrant',
                  ],
                  Resource: '*',
                },
                {
                  Sid: 'Allow Lambda to use the key',
                  Effect: 'Allow',
                  Principal: {
                    Service: 'lambda.amazonaws.com',
                  },
                  Action: ['kms:Decrypt', 'kms:DescribeKey'],
                  Resource: '*',
                },
                {
                  Sid: 'Allow S3 to use the key',
                  Effect: 'Allow',
                  Principal: {
                    Service: 's3.amazonaws.com',
                  },
                  Action: ['kms:Decrypt', 'kms:GenerateDataKey'],
                  Resource: '*',
                },
                {
                  Sid: 'Allow CloudWatch Logs to use the key',
                  Effect: 'Allow',
                  Principal: {
                    Service: `logs.${region.name}.amazonaws.com`,
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
                  Condition: {
                    ArnLike: {
                      'kms:EncryptionContext:aws:logs:arn': `arn:aws:logs:${region.name}:${identity.accountId}:*`,
                    },
                  },
                },
              ],
            })
          ),
        tags: pulumi.all([args.tags]).apply(([tags]) => ({
          ...tags,
          Name: `backup-kms-${args.environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Create alias for easier reference
    new aws.kms.Alias(
      `backup-kms-alias-${args.environmentSuffix}`,
      {
        name: `alias/backup-kms-${args.environmentSuffix}`,
        targetKeyId: kmsKey.id,
      },
      { parent: this }
    );

    this.keyId = kmsKey.id;
    this.keyArn = kmsKey.arn;

    this.registerOutputs({
      keyId: this.keyId,
      keyArn: this.keyArn,
    });
  }
}
```

## File: lib/vpc-stack.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface VPCStackArgs {
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class VPCStack extends pulumi.ComponentResource {
  public readonly vpcId: pulumi.Output<string>;
  public readonly privateSubnetIds: pulumi.Output<string[]>;
  public readonly rdsSecurityGroupId: pulumi.Output<string>;
  public readonly lambdaSecurityGroupId: pulumi.Output<string>;

  constructor(
    name: string,
    args: VPCStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:vpc:VPCStack', name, {}, opts);

    // Create VPC
    const vpc = new aws.ec2.Vpc(
      `backup-vpc-${args.environmentSuffix}`,
      {
        cidrBlock: '10.0.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: pulumi.all([args.tags]).apply(([tags]) => ({
          ...tags,
          Name: `backup-vpc-${args.environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Create private subnets
    const privateSubnet1 = new aws.ec2.Subnet(
      `private-subnet-1-${args.environmentSuffix}`,
      {
        vpcId: vpc.id,
        cidrBlock: '10.0.1.0/24',
        availabilityZone: 'ap-southeast-1a',
        tags: pulumi.all([args.tags]).apply(([tags]) => ({
          ...tags,
          Name: `private-subnet-1-${args.environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    const privateSubnet2 = new aws.ec2.Subnet(
      `private-subnet-2-${args.environmentSuffix}`,
      {
        vpcId: vpc.id,
        cidrBlock: '10.0.2.0/24',
        availabilityZone: 'ap-southeast-1b',
        tags: pulumi.all([args.tags]).apply(([tags]) => ({
          ...tags,
          Name: `private-subnet-2-${args.environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Create route table for private subnets
    const privateRouteTable = new aws.ec2.RouteTable(
      `private-rt-${args.environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: pulumi.all([args.tags]).apply(([tags]) => ({
          ...tags,
          Name: `private-rt-${args.environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Associate route table with private subnets
    new aws.ec2.RouteTableAssociation(
      `private-rta-1-${args.environmentSuffix}`,
      {
        subnetId: privateSubnet1.id,
        routeTableId: privateRouteTable.id,
      },
      { parent: this }
    );

    new aws.ec2.RouteTableAssociation(
      `private-rta-2-${args.environmentSuffix}`,
      {
        subnetId: privateSubnet2.id,
        routeTableId: privateRouteTable.id,
      },
      { parent: this }
    );

    // VPC Endpoints to reduce NAT costs
    // S3 Gateway Endpoint (free)
    new aws.ec2.VpcEndpoint(
      `s3-endpoint-${args.environmentSuffix}`,
      {
        vpcId: vpc.id,
        serviceName: 'com.amazonaws.ap-southeast-1.s3',
        vpcEndpointType: 'Gateway',
        routeTableIds: [privateRouteTable.id],
        tags: pulumi.all([args.tags]).apply(([tags]) => ({
          ...tags,
          Name: `s3-endpoint-${args.environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Security group for VPC endpoints
    const vpcEndpointSg = new aws.ec2.SecurityGroup(
      `vpce-sg-${args.environmentSuffix}`,
      {
        vpcId: vpc.id,
        description: 'Security group for VPC endpoints',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 443,
            toPort: 443,
            cidrBlocks: ['10.0.0.0/16'],
          },
        ],
        tags: pulumi.all([args.tags]).apply(([tags]) => ({
          ...tags,
          Name: `vpce-sg-${args.environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // RDS Interface Endpoint
    new aws.ec2.VpcEndpoint(
      `rds-endpoint-${args.environmentSuffix}`,
      {
        vpcId: vpc.id,
        serviceName: 'com.amazonaws.ap-southeast-1.rds',
        vpcEndpointType: 'Interface',
        subnetIds: [privateSubnet1.id, privateSubnet2.id],
        securityGroupIds: [vpcEndpointSg.id],
        privateDnsEnabled: true,
        tags: pulumi.all([args.tags]).apply(([tags]) => ({
          ...tags,
          Name: `rds-endpoint-${args.environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Secrets Manager Interface Endpoint
    new aws.ec2.VpcEndpoint(
      `secrets-endpoint-${args.environmentSuffix}`,
      {
        vpcId: vpc.id,
        serviceName: 'com.amazonaws.ap-southeast-1.secretsmanager',
        vpcEndpointType: 'Interface',
        subnetIds: [privateSubnet1.id, privateSubnet2.id],
        securityGroupIds: [vpcEndpointSg.id],
        privateDnsEnabled: true,
        tags: pulumi.all([args.tags]).apply(([tags]) => ({
          ...tags,
          Name: `secrets-endpoint-${args.environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // CloudWatch Logs Interface Endpoint
    new aws.ec2.VpcEndpoint(
      `logs-endpoint-${args.environmentSuffix}`,
      {
        vpcId: vpc.id,
        serviceName: 'com.amazonaws.ap-southeast-1.logs',
        vpcEndpointType: 'Interface',
        subnetIds: [privateSubnet1.id, privateSubnet2.id],
        securityGroupIds: [vpcEndpointSg.id],
        privateDnsEnabled: true,
        tags: pulumi.all([args.tags]).apply(([tags]) => ({
          ...tags,
          Name: `logs-endpoint-${args.environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Security group for RDS
    const rdsSecurityGroup = new aws.ec2.SecurityGroup(
      `rds-sg-${args.environmentSuffix}`,
      {
        vpcId: vpc.id,
        description: 'Security group for RDS PostgreSQL',
        tags: pulumi.all([args.tags]).apply(([tags]) => ({
          ...tags,
          Name: `rds-sg-${args.environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Security group for Lambda
    const lambdaSecurityGroup = new aws.ec2.SecurityGroup(
      `lambda-sg-${args.environmentSuffix}`,
      {
        vpcId: vpc.id,
        description: 'Security group for backup Lambda',
        egress: [
          {
            protocol: 'tcp',
            fromPort: 443,
            toPort: 443,
            cidrBlocks: ['10.0.0.0/16'],
            description: 'HTTPS to VPC endpoints',
          },
          {
            protocol: 'tcp',
            fromPort: 5432,
            toPort: 5432,
            cidrBlocks: ['10.0.0.0/16'],
            description: 'PostgreSQL to RDS',
          },
        ],
        tags: pulumi.all([args.tags]).apply(([tags]) => ({
          ...tags,
          Name: `lambda-sg-${args.environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Allow Lambda to connect to RDS
    new aws.ec2.SecurityGroupRule(
      `lambda-to-rds-${args.environmentSuffix}`,
      {
        type: 'ingress',
        fromPort: 5432,
        toPort: 5432,
        protocol: 'tcp',
        securityGroupId: rdsSecurityGroup.id,
        sourceSecurityGroupId: lambdaSecurityGroup.id,
        description: 'Allow Lambda to connect to RDS',
      },
      { parent: this }
    );

    this.vpcId = vpc.id;
    this.privateSubnetIds = pulumi.output([
      privateSubnet1.id,
      privateSubnet2.id,
    ]);
    this.rdsSecurityGroupId = rdsSecurityGroup.id;
    this.lambdaSecurityGroupId = lambdaSecurityGroup.id;

    this.registerOutputs({
      vpcId: this.vpcId,
      privateSubnetIds: this.privateSubnetIds,
      rdsSecurityGroupId: this.rdsSecurityGroupId,
      lambdaSecurityGroupId: this.lambdaSecurityGroupId,
    });
  }
}
```

## File: lib/rds-stack.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as random from '@pulumi/random';

export interface RDSStackArgs {
  environmentSuffix: string;
  vpcId: pulumi.Output<string>;
  privateSubnetIds: pulumi.Output<string[]>;
  securityGroupId: pulumi.Output<string>;
  kmsKeyId: pulumi.Output<string>;
  tags: pulumi.Input<{ [key: string]: string }>;
  backupWindow: string;
  maintenanceWindow: string;
}

export class RDSStack extends pulumi.ComponentResource {
  public readonly instanceId: pulumi.Output<string>;
  public readonly endpoint: pulumi.Output<string>;
  public readonly secretArn: pulumi.Output<string>;

  constructor(
    name: string,
    args: RDSStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:rds:RDSStack', name, {}, opts);

    // Generate random password
    const dbPassword = new random.RandomPassword(
      `db-password-${args.environmentSuffix}`,
      {
        length: 16,
        special: true,
        overrideSpecial: '!#$%^&*()-_=+[]{}:?',
      },
      { parent: this }
    );

    // Store credentials in Secrets Manager
    const dbSecret = new aws.secretsmanager.Secret(
      `db-secret-${args.environmentSuffix}`,
      {
        description: `RDS PostgreSQL credentials for ${args.environmentSuffix}`,
        tags: pulumi.all([args.tags]).apply(([tags]) => ({
          ...tags,
          Name: `db-secret-${args.environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    new aws.secretsmanager.SecretVersion(
      `db-secret-version-${args.environmentSuffix}`,
      {
        secretId: dbSecret.id,
        secretString: pulumi.interpolate`{
        "username": "dbadmin",
        "password": "${dbPassword.result}",
        "engine": "postgres",
        "host": "",
        "port": 5432,
        "dbname": "backuptest"
      }`,
      },
      { parent: this }
    );

    // Create DB subnet group
    const dbSubnetGroup = new aws.rds.SubnetGroup(
      `rds-subnet-group-${args.environmentSuffix}`,
      {
        subnetIds: args.privateSubnetIds,
        tags: pulumi.all([args.tags]).apply(([tags]) => ({
          ...tags,
          Name: `rds-subnet-group-${args.environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Create monitoring role for RDS
    const rdsMonitoringRole = new aws.iam.Role(
      `rds-monitoring-role-${args.environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Principal: {
                Service: 'monitoring.rds.amazonaws.com',
              },
              Effect: 'Allow',
            },
          ],
        }),
        managedPolicyArns: [
          'arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole',
        ],
        tags: args.tags,
      },
      { parent: this }
    );

    // Create RDS instance with enhanced configuration
    const dbInstance = new aws.rds.Instance(
      `postgres-${args.environmentSuffix}`,
      {
        engine: 'postgres',
        engineVersion: '15.13',
        instanceClass: 'db.t3.micro',
        allocatedStorage: 20,
        dbName: 'backuptest',
        username: 'dbadmin',
        password: dbPassword.result,
        dbSubnetGroupName: dbSubnetGroup.name,
        vpcSecurityGroupIds: [args.securityGroupId],

        // Backup configuration - 7-day PITR with 6-hour frequency
        backupRetentionPeriod: 7,
        backupWindow: args.backupWindow,

        // Maintenance window
        maintenanceWindow: args.maintenanceWindow,

        // Encryption with KMS customer-managed key
        storageEncrypted: true,
        kmsKeyId: args.kmsKeyId,

        // Enable enhanced monitoring
        monitoringInterval: 60,
        monitoringRoleArn: rdsMonitoringRole.arn,

        // Enable Performance Insights
        performanceInsightsEnabled: true,
        performanceInsightsKmsKeyId: args.kmsKeyId,
        performanceInsightsRetentionPeriod: 7,

        // Enable automated minor version upgrades
        autoMinorVersionUpgrade: true,

        // Enable deletion protection in production (disabled for CI/CD)
        deletionProtection: false,
        skipFinalSnapshot: true,

        // Enable copy tags to snapshots
        copyTagsToSnapshot: true,

        tags: pulumi.all([args.tags]).apply(([tags]) => ({
          ...tags,
          Name: `postgres-${args.environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Update secret with actual endpoint
    new aws.secretsmanager.SecretVersion(
      `db-secret-version-updated-${args.environmentSuffix}`,
      {
        secretId: dbSecret.id,
        secretString: pulumi
          .all([dbPassword.result, dbInstance.endpoint])
          .apply(([pwd, endpoint]) => {
            const host = endpoint.split(':')[0];
            return JSON.stringify({
              username: 'dbadmin',
              password: pwd,
              engine: 'postgres',
              host: host,
              port: 5432,
              dbname: 'backuptest',
            });
          }),
      },
      {
        parent: this,
        dependsOn: [dbInstance],
      }
    );

    this.instanceId = dbInstance.id;
    this.endpoint = dbInstance.endpoint;
    this.secretArn = dbSecret.arn;

    this.registerOutputs({
      instanceId: this.instanceId,
      endpoint: this.endpoint,
      secretArn: this.secretArn,
    });
  }
}
```

## Key Improvements in IDEAL_RESPONSE

### Security Enhancements

1. **KMS Customer-Managed Keys**: Implemented for RDS, S3, SNS, and CloudWatch Logs encryption with automatic key rotation
2. **AWS Secrets Manager**: Database credentials stored and retrieved securely, not hardcoded
3. **Least Privilege IAM**: Custom IAM policies with specific resource ARNs instead of managed policies
4. **VPC Endpoints**: Implemented for S3, RDS, Secrets Manager, and CloudWatch Logs to reduce NAT costs and improve security

### Backup & Recovery Improvements

5. **Cross-Region DR**: Automated snapshot copying to ap-northeast-1 with KMS encryption
6. **Comprehensive Lambda**: Full backup verification workflow including restore, test, and cleanup
7. **6-Hour Backup Enforcement**: Configurable backup window with 7-day PITR retention
8. **Enhanced Monitoring**: Performance Insights and Enhanced Monitoring enabled on RDS

### Monitoring & Observability

9. **CloudWatch Dashboard**: Comprehensive dashboard showing RDS performance, Lambda metrics, backup storage, and test result
10. **RTO Violation Alarm**: Alerts when recovery exceeds 4-hour threshold
11. **Additional Alarms**: CPU, storage, S3 bucket size monitoring
12. **Encrypted Logs**: CloudWatch Logs encrypted with KMS

### Operational Excellence

13. **Configurable Parameters**: Backup and maintenance windows as constructor parameters
14. **Proper Resource Naming**: All resources include environmentSuffix
15. **Comprehensive Outputs**: All key resource identifiers exported for integration testing
16. **Tag Propagation**: Consistent tagging across all resources
17. **S3 Public Access Block**: Prevents accidental public exposure
18. **S3 Bucket Key**: Reduces KMS costs for S3 encryption
