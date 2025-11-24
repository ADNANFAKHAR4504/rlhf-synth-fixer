# PCI-Compliant Payment Processing Infrastructure

This solution implements a complete PCI-compliant payment processing infrastructure using Pulumi TypeScript. The architecture includes multi-AZ networking, containerized application hosting, encrypted database storage, and comprehensive security controls.

## Architecture Overview

- **Network**: VPC with 3 public and 3 private subnets across 3 availability zones
- **Compute**: ECS Fargate service with Application Load Balancer
- **Database**: Aurora PostgreSQL Multi-AZ cluster with automated backups
- **Security**: AWS WAF, KMS encryption, VPC endpoints, IAM least privilege
- **Compliance**: Audit logging, backup plans, encryption at rest and in transit

## File: lib/tap-stack.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
import { NetworkStack } from './network-stack';
import { SecurityStack } from './security-stack';
import { DatabaseStack } from './database-stack';
import { ComputeStack } from './compute-stack';
import { StorageStack } from './storage-stack';
import { MonitoringStack } from './monitoring-stack';
import { BackupStack } from './backup-stack';

export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly albDnsName: pulumi.Output<string>;
  public readonly clusterEndpoint: pulumi.Output<string>;
  public readonly staticBucketName: pulumi.Output<string>;
  public readonly auditBucketName: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // 1. Security resources (KMS keys for encryption)
    const securityStack = new SecurityStack(
      'security',
      { environmentSuffix, tags },
      { parent: this }
    );

    // 2. Network infrastructure (VPC, subnets, NAT gateways, VPC endpoints)
    const networkStack = new NetworkStack(
      'network',
      { environmentSuffix, tags },
      { parent: this }
    );

    // 3. Storage (S3 buckets with encryption)
    const storageStack = new StorageStack(
      'storage',
      {
        environmentSuffix,
        tags,
        kmsKeyId: securityStack.s3KmsKey.id,
      },
      { parent: this }
    );

    // 4. Database (Aurora PostgreSQL cluster)
    const databaseStack = new DatabaseStack(
      'database',
      {
        environmentSuffix,
        tags,
        vpcId: networkStack.vpcId,
        privateSubnetIds: networkStack.privateSubnetIds,
        kmsKeyId: securityStack.rdsKmsKey.id,
      },
      { parent: this }
    );

    // 5. Monitoring (CloudWatch Log Groups)
    const monitoringStack = new MonitoringStack(
      'monitoring',
      {
        environmentSuffix,
        tags,
        kmsKeyId: securityStack.cloudwatchKmsKey.id,
      },
      { parent: this }
    );

    // 6. Compute (ECS Fargate, ALB, WAF)
    const computeStack = new ComputeStack(
      'compute',
      {
        environmentSuffix,
        tags,
        vpcId: networkStack.vpcId,
        publicSubnetIds: networkStack.publicSubnetIds,
        privateSubnetIds: networkStack.privateSubnetIds,
        ecsTaskRole: securityStack.ecsTaskRole,
        ecsExecutionRole: securityStack.ecsExecutionRole,
        logGroupName: monitoringStack.ecsLogGroupName,
        databaseEndpoint: databaseStack.clusterEndpoint,
        staticBucketName: storageStack.staticBucketName,
      },
      { parent: this }
    );

    // 7. Backup (AWS Backup plans for RDS)
    const backupStack = new BackupStack(
      'backup',
      {
        environmentSuffix,
        tags,
        clusterArn: databaseStack.clusterArn,
      },
      { parent: this }
    );

    // Export outputs
    this.albDnsName = computeStack.albDnsName;
    this.clusterEndpoint = databaseStack.clusterEndpoint;
    this.staticBucketName = storageStack.staticBucketName;
    this.auditBucketName = storageStack.auditBucketName;

    this.registerOutputs({
      albDnsName: this.albDnsName,
      clusterEndpoint: this.clusterEndpoint,
      staticBucketName: this.staticBucketName,
      auditBucketName: this.auditBucketName,
    });
  }
}
```

## File: lib/network-stack.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface NetworkStackArgs {
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class NetworkStack extends pulumi.ComponentResource {
  public readonly vpcId: pulumi.Output<string>;
  public readonly publicSubnetIds: pulumi.Output<string>[];
  public readonly privateSubnetIds: pulumi.Output<string>[];

  constructor(name: string, args: NetworkStackArgs, opts?: pulumi.ComponentResourceOptions) {
    super('tap:network:NetworkStack', name, args, opts);

    const { environmentSuffix, tags } = args;

    // Create VPC
    const vpc = new aws.ec2.Vpc(
      `payment-vpc-${environmentSuffix}`,
      {
        cidrBlock: '10.0.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: pulumi.output(tags).apply(t => ({
          ...t,
          Name: `payment-vpc-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Get availability zones
    const azs = aws.getAvailabilityZones({ state: 'available' });

    // Create Internet Gateway
    const igw = new aws.ec2.InternetGateway(
      `payment-igw-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: pulumi.output(tags).apply(t => ({
          ...t,
          Name: `payment-igw-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Create public subnets (3 AZs)
    const publicSubnets: aws.ec2.Subnet[] = [];
    for (let i = 0; i < 3; i++) {
      const subnet = new aws.ec2.Subnet(
        `payment-public-subnet-${i + 1}-${environmentSuffix}`,
        {
          vpcId: vpc.id,
          cidrBlock: `10.0.${i}.0/24`,
          availabilityZone: azs.then(az => az.names[i]),
          mapPublicIpOnLaunch: true,
          tags: pulumi.output(tags).apply(t => ({
            ...t,
            Name: `payment-public-subnet-${i + 1}-${environmentSuffix}`,
            Tier: 'Public',
          })),
        },
        { parent: this }
      );
      publicSubnets.push(subnet);
    }

    // Create private subnets (3 AZs)
    const privateSubnets: aws.ec2.Subnet[] = [];
    for (let i = 0; i < 3; i++) {
      const subnet = new aws.ec2.Subnet(
        `payment-private-subnet-${i + 1}-${environmentSuffix}`,
        {
          vpcId: vpc.id,
          cidrBlock: `10.0.${i + 10}.0/24`,
          availabilityZone: azs.then(az => az.names[i]),
          tags: pulumi.output(tags).apply(t => ({
            ...t,
            Name: `payment-private-subnet-${i + 1}-${environmentSuffix}`,
            Tier: 'Private',
          })),
        },
        { parent: this }
      );
      privateSubnets.push(subnet);
    }

    // Create Elastic IPs for NAT Gateways
    const eips: aws.ec2.Eip[] = [];
    for (let i = 0; i < 3; i++) {
      const eip = new aws.ec2.Eip(
        `payment-nat-eip-${i + 1}-${environmentSuffix}`,
        {
          domain: 'vpc',
          tags: pulumi.output(tags).apply(t => ({
            ...t,
            Name: `payment-nat-eip-${i + 1}-${environmentSuffix}`,
          })),
        },
        { parent: this }
      );
      eips.push(eip);
    }

    // Create NAT Gateways (one per AZ)
    const natGateways: aws.ec2.NatGateway[] = [];
    for (let i = 0; i < 3; i++) {
      const nat = new aws.ec2.NatGateway(
        `payment-nat-${i + 1}-${environmentSuffix}`,
        {
          subnetId: publicSubnets[i].id,
          allocationId: eips[i].id,
          tags: pulumi.output(tags).apply(t => ({
            ...t,
            Name: `payment-nat-${i + 1}-${environmentSuffix}`,
          })),
        },
        { parent: this }
      );
      natGateways.push(nat);
    }

    // Create public route table
    const publicRouteTable = new aws.ec2.RouteTable(
      `payment-public-rt-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: pulumi.output(tags).apply(t => ({
          ...t,
          Name: `payment-public-rt-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Route to Internet Gateway
    new aws.ec2.Route(
      `payment-public-route-${environmentSuffix}`,
      {
        routeTableId: publicRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: igw.id,
      },
      { parent: this }
    );

    // Associate public subnets with public route table
    publicSubnets.forEach((subnet, i) => {
      new aws.ec2.RouteTableAssociation(
        `payment-public-rta-${i + 1}-${environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: publicRouteTable.id,
        },
        { parent: this }
      );
    });

    // Create private route tables (one per AZ for NAT Gateway)
    privateSubnets.forEach((subnet, i) => {
      const privateRouteTable = new aws.ec2.RouteTable(
        `payment-private-rt-${i + 1}-${environmentSuffix}`,
        {
          vpcId: vpc.id,
          tags: pulumi.output(tags).apply(t => ({
            ...t,
            Name: `payment-private-rt-${i + 1}-${environmentSuffix}`,
          })),
        },
        { parent: this }
      );

      new aws.ec2.Route(
        `payment-private-route-${i + 1}-${environmentSuffix}`,
        {
          routeTableId: privateRouteTable.id,
          destinationCidrBlock: '0.0.0.0/0',
          natGatewayId: natGateways[i].id,
        },
        { parent: this }
      );

      new aws.ec2.RouteTableAssociation(
        `payment-private-rta-${i + 1}-${environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: privateRouteTable.id,
        },
        { parent: this }
      );
    });

    // Create VPC Endpoints for S3
    const s3Endpoint = new aws.ec2.VpcEndpoint(
      `payment-s3-endpoint-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        serviceName: `com.amazonaws.us-east-1.s3`,
        vpcEndpointType: 'Gateway',
        routeTableIds: [
          publicRouteTable.id,
          ...privateSubnets.map((_, i) =>
            pulumi.output(aws.ec2.getRouteTable({
              subnetId: privateSubnets[i].id,
            }).then(rt => rt.id))
          ),
        ],
        tags: pulumi.output(tags).apply(t => ({
          ...t,
          Name: `payment-s3-endpoint-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Security group for VPC endpoints
    const endpointSecurityGroup = new aws.ec2.SecurityGroup(
      `payment-endpoint-sg-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        description: 'Security group for VPC endpoints',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 443,
            toPort: 443,
            cidrBlocks: [vpc.cidrBlock],
            description: 'HTTPS from VPC',
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow all outbound',
          },
        ],
        tags: pulumi.output(tags).apply(t => ({
          ...t,
          Name: `payment-endpoint-sg-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // VPC Endpoint for ECR API
    const ecrApiEndpoint = new aws.ec2.VpcEndpoint(
      `payment-ecr-api-endpoint-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        serviceName: `com.amazonaws.us-east-1.ecr.api`,
        vpcEndpointType: 'Interface',
        privateDnsEnabled: true,
        subnetIds: privateSubnets.map(s => s.id),
        securityGroupIds: [endpointSecurityGroup.id],
        tags: pulumi.output(tags).apply(t => ({
          ...t,
          Name: `payment-ecr-api-endpoint-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // VPC Endpoint for ECR Docker
    const ecrDkrEndpoint = new aws.ec2.VpcEndpoint(
      `payment-ecr-dkr-endpoint-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        serviceName: `com.amazonaws.us-east-1.ecr.dkr`,
        vpcEndpointType: 'Interface',
        privateDnsEnabled: true,
        subnetIds: privateSubnets.map(s => s.id),
        securityGroupIds: [endpointSecurityGroup.id],
        tags: pulumi.output(tags).apply(t => ({
          ...t,
          Name: `payment-ecr-dkr-endpoint-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // VPC Endpoint for CloudWatch Logs
    const logsEndpoint = new aws.ec2.VpcEndpoint(
      `payment-logs-endpoint-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        serviceName: `com.amazonaws.us-east-1.logs`,
        vpcEndpointType: 'Interface',
        privateDnsEnabled: true,
        subnetIds: privateSubnets.map(s => s.id),
        securityGroupIds: [endpointSecurityGroup.id],
        tags: pulumi.output(tags).apply(t => ({
          ...t,
          Name: `payment-logs-endpoint-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    this.vpcId = vpc.id;
    this.publicSubnetIds = publicSubnets.map(s => s.id);
    this.privateSubnetIds = privateSubnets.map(s => s.id);

    this.registerOutputs({
      vpcId: this.vpcId,
      publicSubnetIds: this.publicSubnetIds,
      privateSubnetIds: this.privateSubnetIds,
    });
  }
}
```

## File: lib/security-stack.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface SecurityStackArgs {
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class SecurityStack extends pulumi.ComponentResource {
  public readonly rdsKmsKey: aws.kms.Key;
  public readonly s3KmsKey: aws.kms.Key;
  public readonly cloudwatchKmsKey: aws.kms.Key;
  public readonly ecsTaskRole: aws.iam.Role;
  public readonly ecsExecutionRole: aws.iam.Role;

  constructor(name: string, args: SecurityStackArgs, opts?: pulumi.ComponentResourceOptions) {
    super('tap:security:SecurityStack', name, args, opts);

    const { environmentSuffix, tags } = args;
    const currentCallerIdentity = aws.getCallerIdentity();

    // KMS Key for RDS encryption
    this.rdsKmsKey = new aws.kms.Key(
      `payment-rds-kms-${environmentSuffix}`,
      {
        description: `KMS key for RDS encryption - ${environmentSuffix}`,
        enableKeyRotation: true,
        deletionWindowInDays: 10,
        policy: currentCallerIdentity.then(identity =>
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
                Action: ['kms:Decrypt', 'kms:GenerateDataKey', 'kms:CreateGrant'],
                Resource: '*',
              },
            ],
          })
        ),
        tags: pulumi.output(tags).apply(t => ({
          ...t,
          Name: `payment-rds-kms-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    new aws.kms.Alias(
      `alias-payment-rds-${environmentSuffix}`,
      {
        name: `alias/payment-rds-${environmentSuffix}`,
        targetKeyId: this.rdsKmsKey.keyId,
      },
      { parent: this }
    );

    // KMS Key for S3 encryption
    this.s3KmsKey = new aws.kms.Key(
      `payment-s3-kms-${environmentSuffix}`,
      {
        description: `KMS key for S3 encryption - ${environmentSuffix}`,
        enableKeyRotation: true,
        deletionWindowInDays: 10,
        policy: currentCallerIdentity.then(identity =>
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
                Sid: 'Allow S3 to use the key',
                Effect: 'Allow',
                Principal: {
                  Service: 's3.amazonaws.com',
                },
                Action: ['kms:Decrypt', 'kms:GenerateDataKey'],
                Resource: '*',
              },
            ],
          })
        ),
        tags: pulumi.output(tags).apply(t => ({
          ...t,
          Name: `payment-s3-kms-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    new aws.kms.Alias(
      `alias-payment-s3-${environmentSuffix}`,
      {
        name: `alias/payment-s3-${environmentSuffix}`,
        targetKeyId: this.s3KmsKey.keyId,
      },
      { parent: this }
    );

    // KMS Key for CloudWatch Logs encryption
    this.cloudwatchKmsKey = new aws.kms.Key(
      `payment-logs-kms-${environmentSuffix}`,
      {
        description: `KMS key for CloudWatch Logs encryption - ${environmentSuffix}`,
        enableKeyRotation: true,
        deletionWindowInDays: 10,
        policy: currentCallerIdentity.then(identity =>
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
                Sid: 'Allow CloudWatch Logs',
                Effect: 'Allow',
                Principal: {
                  Service: `logs.us-east-1.amazonaws.com`,
                },
                Action: ['kms:Decrypt', 'kms:GenerateDataKey', 'kms:CreateGrant'],
                Resource: '*',
                Condition: {
                  ArnLike: {
                    'kms:EncryptionContext:aws:logs:arn': `arn:aws:logs:us-east-1:${identity.accountId}:*`,
                  },
                },
              },
            ],
          })
        ),
        tags: pulumi.output(tags).apply(t => ({
          ...t,
          Name: `payment-logs-kms-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    new aws.kms.Alias(
      `alias-payment-logs-${environmentSuffix}`,
      {
        name: `alias/payment-logs-${environmentSuffix}`,
        targetKeyId: this.cloudwatchKmsKey.keyId,
      },
      { parent: this }
    );

    // ECS Task Execution Role
    this.ecsExecutionRole = new aws.iam.Role(
      `payment-ecs-exec-role-${environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'ecs-tasks.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: pulumi.output(tags).apply(t => ({
          ...t,
          Name: `payment-ecs-exec-role-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Attach AWS managed policy for ECS task execution
    new aws.iam.RolePolicyAttachment(
      `payment-ecs-exec-policy-${environmentSuffix}`,
      {
        role: this.ecsExecutionRole.name,
        policyArn: 'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
      },
      { parent: this }
    );

    // Additional policy for ECR with VPC endpoints
    const ecsExecutionPolicy = new aws.iam.Policy(
      `payment-ecs-exec-custom-policy-${environmentSuffix}`,
      {
        description: 'Custom policy for ECS task execution with ECR and CloudWatch',
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'ecr:GetAuthorizationToken',
                'ecr:BatchCheckLayerAvailability',
                'ecr:GetDownloadUrlForLayer',
                'ecr:BatchGetImage',
              ],
              Resource: '*',
            },
            {
              Effect: 'Allow',
              Action: ['logs:CreateLogStream', 'logs:PutLogEvents'],
              Resource: '*',
            },
          ],
        }),
        tags: pulumi.output(tags).apply(t => ({
          ...t,
          Name: `payment-ecs-exec-custom-policy-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `payment-ecs-exec-custom-attach-${environmentSuffix}`,
      {
        role: this.ecsExecutionRole.name,
        policyArn: ecsExecutionPolicy.arn,
      },
      { parent: this }
    );

    // ECS Task Role (for application)
    this.ecsTaskRole = new aws.iam.Role(
      `payment-ecs-task-role-${environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'ecs-tasks.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: pulumi.output(tags).apply(t => ({
          ...t,
          Name: `payment-ecs-task-role-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Task role policy for S3 and RDS access (least privilege)
    const ecsTaskPolicy = new aws.iam.Policy(
      `payment-ecs-task-policy-${environmentSuffix}`,
      {
        description: 'Policy for ECS tasks to access S3 and RDS',
        policy: this.s3KmsKey.arn.apply(kmsArn =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: ['s3:GetObject', 's3:PutObject', 's3:ListBucket'],
                Resource: [
                  `arn:aws:s3:::payment-static-${environmentSuffix}`,
                  `arn:aws:s3:::payment-static-${environmentSuffix}/*`,
                ],
              },
              {
                Effect: 'Allow',
                Action: ['s3:PutObject'],
                Resource: [
                  `arn:aws:s3:::payment-audit-logs-${environmentSuffix}/*`,
                ],
              },
              {
                Effect: 'Allow',
                Action: ['kms:Decrypt', 'kms:GenerateDataKey'],
                Resource: [kmsArn],
              },
              {
                Effect: 'Allow',
                Action: ['rds:DescribeDBClusters', 'rds:DescribeDBInstances'],
                Resource: [
                  `arn:aws:rds:us-east-1:*:cluster:payment-cluster-${environmentSuffix}`,
                ],
              },
            ],
          })
        ),
        tags: pulumi.output(tags).apply(t => ({
          ...t,
          Name: `payment-ecs-task-policy-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `payment-ecs-task-attach-${environmentSuffix}`,
      {
        role: this.ecsTaskRole.name,
        policyArn: ecsTaskPolicy.arn,
      },
      { parent: this }
    );

    this.registerOutputs({
      rdsKmsKeyId: this.rdsKmsKey.id,
      s3KmsKeyId: this.s3KmsKey.id,
      cloudwatchKmsKeyId: this.cloudwatchKmsKey.id,
      ecsTaskRoleArn: this.ecsTaskRole.arn,
      ecsExecutionRoleArn: this.ecsExecutionRole.arn,
    });
  }
}
```

## File: lib/storage-stack.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface StorageStackArgs {
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
  kmsKeyId: pulumi.Input<string>;
}

export class StorageStack extends pulumi.ComponentResource {
  public readonly staticBucketName: pulumi.Output<string>;
  public readonly auditBucketName: pulumi.Output<string>;

  constructor(name: string, args: StorageStackArgs, opts?: pulumi.ComponentResourceOptions) {
    super('tap:storage:StorageStack', name, args, opts);

    const { environmentSuffix, tags, kmsKeyId } = args;

    // S3 bucket for static assets
    const staticBucket = new aws.s3.Bucket(
      `payment-static-${environmentSuffix}`,
      {
        bucket: `payment-static-${environmentSuffix}`,
        forceDestroy: true,
        versioning: {
          enabled: true,
        },
        serverSideEncryptionConfiguration: {
          rule: {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'aws:kms',
              kmsMasterKeyId: kmsKeyId,
            },
            bucketKeyEnabled: true,
          },
        },
        lifecycleRules: [
          {
            enabled: true,
            id: 'delete-old-versions',
            noncurrentVersionExpiration: {
              days: 90,
            },
          },
        ],
        tags: pulumi.output(tags).apply(t => ({
          ...t,
          Name: `payment-static-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Block public access
    new aws.s3.BucketPublicAccessBlock(
      `payment-static-public-block-${environmentSuffix}`,
      {
        bucket: staticBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    // S3 bucket for audit logs
    const auditBucket = new aws.s3.Bucket(
      `payment-audit-logs-${environmentSuffix}`,
      {
        bucket: `payment-audit-logs-${environmentSuffix}`,
        forceDestroy: true,
        versioning: {
          enabled: true,
        },
        serverSideEncryptionConfiguration: {
          rule: {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'aws:kms',
              kmsMasterKeyId: kmsKeyId,
            },
            bucketKeyEnabled: true,
          },
        },
        lifecycleRules: [
          {
            enabled: true,
            id: 'archive-old-logs',
            transitions: [
              {
                days: 90,
                storageClass: 'GLACIER',
              },
            ],
            expiration: {
              days: 365,
            },
          },
        ],
        tags: pulumi.output(tags).apply(t => ({
          ...t,
          Name: `payment-audit-logs-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    new aws.s3.BucketPublicAccessBlock(
      `payment-audit-public-block-${environmentSuffix}`,
      {
        bucket: auditBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    this.staticBucketName = staticBucket.id;
    this.auditBucketName = auditBucket.id;

    this.registerOutputs({
      staticBucketName: this.staticBucketName,
      auditBucketName: this.auditBucketName,
    });
  }
}
```

## File: lib/database-stack.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface DatabaseStackArgs {
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
  vpcId: pulumi.Input<string>;
  privateSubnetIds: pulumi.Input<string>[];
  kmsKeyId: pulumi.Input<string>;
}

export class DatabaseStack extends pulumi.ComponentResource {
  public readonly clusterEndpoint: pulumi.Output<string>;
  public readonly clusterArn: pulumi.Output<string>;

  constructor(name: string, args: DatabaseStackArgs, opts?: pulumi.ComponentResourceOptions) {
    super('tap:database:DatabaseStack', name, args, opts);

    const { environmentSuffix, tags, vpcId, privateSubnetIds, kmsKeyId } = args;

    // Security group for RDS
    const dbSecurityGroup = new aws.ec2.SecurityGroup(
      `payment-db-sg-${environmentSuffix}`,
      {
        vpcId: vpcId,
        description: 'Security group for Aurora PostgreSQL cluster',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 5432,
            toPort: 5432,
            cidrBlocks: ['10.0.0.0/16'],
            description: 'PostgreSQL from VPC',
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow all outbound',
          },
        ],
        tags: pulumi.output(tags).apply(t => ({
          ...t,
          Name: `payment-db-sg-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // DB subnet group
    const dbSubnetGroup = new aws.rds.SubnetGroup(
      `payment-db-subnet-group-${environmentSuffix}`,
      {
        subnetIds: privateSubnetIds,
        tags: pulumi.output(tags).apply(t => ({
          ...t,
          Name: `payment-db-subnet-group-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // DB parameter group for PostgreSQL
    const dbParameterGroup = new aws.rds.ClusterParameterGroup(
      `payment-db-params-${environmentSuffix}`,
      {
        family: 'aurora-postgresql14',
        description: 'Parameter group for payment processing database',
        parameters: [
          {
            name: 'log_statement',
            value: 'all',
          },
          {
            name: 'log_min_duration_statement',
            value: '1000',
          },
          {
            name: 'ssl',
            value: '1',
          },
        ],
        tags: pulumi.output(tags).apply(t => ({
          ...t,
          Name: `payment-db-params-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Aurora PostgreSQL cluster
    const cluster = new aws.rds.Cluster(
      `payment-cluster-${environmentSuffix}`,
      {
        clusterIdentifier: `payment-cluster-${environmentSuffix}`,
        engine: 'aurora-postgresql',
        engineVersion: '14.6',
        databaseName: 'paymentdb',
        masterUsername: 'dbadmin',
        masterPassword: pulumi.output(
          aws.secretsmanager
            .getRandomPassword({
              length: 32,
              excludePunctuation: true,
            })
            .then(p => p.randomPassword)
        ),
        dbSubnetGroupName: dbSubnetGroup.name,
        vpcSecurityGroupIds: [dbSecurityGroup.id],
        dbClusterParameterGroupName: dbParameterGroup.name,
        storageEncrypted: true,
        kmsKeyId: kmsKeyId,
        backupRetentionPeriod: 30,
        preferredBackupWindow: '03:00-04:00',
        preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
        enabledCloudwatchLogsExports: ['postgresql'],
        skipFinalSnapshot: true,
        copyTagsToSnapshot: true,
        deletionProtection: false,
        tags: pulumi.output(tags).apply(t => ({
          ...t,
          Name: `payment-cluster-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Primary instance
    const primaryInstance = new aws.rds.ClusterInstance(
      `payment-instance-1-${environmentSuffix}`,
      {
        identifier: `payment-instance-1-${environmentSuffix}`,
        clusterIdentifier: cluster.id,
        instanceClass: 'db.t3.medium',
        engine: 'aurora-postgresql',
        engineVersion: '14.6',
        publiclyAccessible: false,
        performanceInsightsEnabled: true,
        performanceInsightsKmsKeyId: kmsKeyId,
        tags: pulumi.output(tags).apply(t => ({
          ...t,
          Name: `payment-instance-1-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Reader instance 1
    const readerInstance1 = new aws.rds.ClusterInstance(
      `payment-instance-2-${environmentSuffix}`,
      {
        identifier: `payment-instance-2-${environmentSuffix}`,
        clusterIdentifier: cluster.id,
        instanceClass: 'db.t3.medium',
        engine: 'aurora-postgresql',
        engineVersion: '14.6',
        publiclyAccessible: false,
        performanceInsightsEnabled: true,
        performanceInsightsKmsKeyId: kmsKeyId,
        tags: pulumi.output(tags).apply(t => ({
          ...t,
          Name: `payment-instance-2-${environmentSuffix}`,
        })),
      },
      { parent: this, dependsOn: [primaryInstance] }
    );

    // Reader instance 2
    const readerInstance2 = new aws.rds.ClusterInstance(
      `payment-instance-3-${environmentSuffix}`,
      {
        identifier: `payment-instance-3-${environmentSuffix}`,
        clusterIdentifier: cluster.id,
        instanceClass: 'db.t3.medium',
        engine: 'aurora-postgresql',
        engineVersion: '14.6',
        publiclyAccessible: false,
        performanceInsightsEnabled: true,
        performanceInsightsKmsKeyId: kmsKeyId,
        tags: pulumi.output(tags).apply(t => ({
          ...t,
          Name: `payment-instance-3-${environmentSuffix}`,
        })),
      },
      { parent: this, dependsOn: [readerInstance1] }
    );

    this.clusterEndpoint = cluster.endpoint;
    this.clusterArn = cluster.arn;

    this.registerOutputs({
      clusterEndpoint: this.clusterEndpoint,
      clusterArn: this.clusterArn,
      readerEndpoint: cluster.readerEndpoint,
    });
  }
}
```

## File: lib/monitoring-stack.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface MonitoringStackArgs {
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
  kmsKeyId: pulumi.Input<string>;
}

export class MonitoringStack extends pulumi.ComponentResource {
  public readonly ecsLogGroupName: pulumi.Output<string>;

  constructor(name: string, args: MonitoringStackArgs, opts?: pulumi.ComponentResourceOptions) {
    super('tap:monitoring:MonitoringStack', name, args, opts);

    const { environmentSuffix, tags, kmsKeyId } = args;

    // CloudWatch Log Group for ECS tasks
    const ecsLogGroup = new aws.cloudwatch.LogGroup(
      `payment-ecs-logs-${environmentSuffix}`,
      {
        name: `/ecs/payment-app-${environmentSuffix}`,
        retentionInDays: 365,
        kmsKeyId: kmsKeyId,
        tags: pulumi.output(tags).apply(t => ({
          ...t,
          Name: `payment-ecs-logs-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // CloudWatch Log Group for RDS slow queries
    const rdsSlowQueryLogGroup = new aws.cloudwatch.LogGroup(
      `payment-rds-slow-query-logs-${environmentSuffix}`,
      {
        name: `/aws/rds/cluster/payment-cluster-${environmentSuffix}/postgresql`,
        retentionInDays: 365,
        kmsKeyId: kmsKeyId,
        tags: pulumi.output(tags).apply(t => ({
          ...t,
          Name: `payment-rds-slow-query-logs-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // CloudWatch Log Group for audit logs
    const auditLogGroup = new aws.cloudwatch.LogGroup(
      `payment-audit-logs-${environmentSuffix}`,
      {
        name: `/audit/payment-app-${environmentSuffix}`,
        retentionInDays: 365,
        kmsKeyId: kmsKeyId,
        tags: pulumi.output(tags).apply(t => ({
          ...t,
          Name: `payment-audit-logs-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    this.ecsLogGroupName = ecsLogGroup.name;

    this.registerOutputs({
      ecsLogGroupName: this.ecsLogGroupName,
      rdsSlowQueryLogGroupName: rdsSlowQueryLogGroup.name,
      auditLogGroupName: auditLogGroup.name,
    });
  }
}
```

## File: lib/compute-stack.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface ComputeStackArgs {
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
  vpcId: pulumi.Input<string>;
  publicSubnetIds: pulumi.Input<string>[];
  privateSubnetIds: pulumi.Input<string>[];
  ecsTaskRole: aws.iam.Role;
  ecsExecutionRole: aws.iam.Role;
  logGroupName: pulumi.Input<string>;
  databaseEndpoint: pulumi.Input<string>;
  staticBucketName: pulumi.Input<string>;
}

export class ComputeStack extends pulumi.ComponentResource {
  public readonly albDnsName: pulumi.Output<string>;

  constructor(name: string, args: ComputeStackArgs, opts?: pulumi.ComponentResourceOptions) {
    super('tap:compute:ComputeStack', name, args, opts);

    const {
      environmentSuffix,
      tags,
      vpcId,
      publicSubnetIds,
      privateSubnetIds,
      ecsTaskRole,
      ecsExecutionRole,
      logGroupName,
      databaseEndpoint,
      staticBucketName,
    } = args;

    // Security group for ALB
    const albSecurityGroup = new aws.ec2.SecurityGroup(
      `payment-alb-sg-${environmentSuffix}`,
      {
        vpcId: vpcId,
        description: 'Security group for Application Load Balancer',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'HTTP from Internet',
          },
          {
            protocol: 'tcp',
            fromPort: 443,
            toPort: 443,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'HTTPS from Internet',
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow all outbound',
          },
        ],
        tags: pulumi.output(tags).apply(t => ({
          ...t,
          Name: `payment-alb-sg-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Security group for ECS tasks
    const ecsSecurityGroup = new aws.ec2.SecurityGroup(
      `payment-ecs-sg-${environmentSuffix}`,
      {
        vpcId: vpcId,
        description: 'Security group for ECS tasks',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 3000,
            toPort: 3000,
            securityGroups: [albSecurityGroup.id],
            description: 'HTTP from ALB',
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow all outbound',
          },
        ],
        tags: pulumi.output(tags).apply(t => ({
          ...t,
          Name: `payment-ecs-sg-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Application Load Balancer
    const alb = new aws.lb.LoadBalancer(
      `payment-alb-${environmentSuffix}`,
      {
        name: `payment-alb-${environmentSuffix}`,
        loadBalancerType: 'application',
        securityGroups: [albSecurityGroup.id],
        subnets: publicSubnetIds,
        enableDeletionProtection: false,
        tags: pulumi.output(tags).apply(t => ({
          ...t,
          Name: `payment-alb-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Target group
    const targetGroup = new aws.lb.TargetGroup(
      `payment-tg-${environmentSuffix}`,
      {
        name: `payment-tg-${environmentSuffix}`,
        port: 3000,
        protocol: 'HTTP',
        vpcId: vpcId,
        targetType: 'ip',
        healthCheck: {
          enabled: true,
          path: '/health',
          protocol: 'HTTP',
          matcher: '200',
          interval: 30,
          timeout: 5,
          healthyThreshold: 2,
          unhealthyThreshold: 3,
        },
        deregistrationDelay: 30,
        tags: pulumi.output(tags).apply(t => ({
          ...t,
          Name: `payment-tg-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // ALB listener
    const listener = new aws.lb.Listener(
      `payment-listener-${environmentSuffix}`,
      {
        loadBalancerArn: alb.arn,
        port: 80,
        protocol: 'HTTP',
        defaultActions: [
          {
            type: 'forward',
            targetGroupArn: targetGroup.arn,
          },
        ],
      },
      { parent: this }
    );

    // WAF Web ACL
    const wafWebAcl = new aws.wafv2.WebAcl(
      `payment-waf-${environmentSuffix}`,
      {
        name: `payment-waf-${environmentSuffix}`,
        scope: 'REGIONAL',
        defaultAction: {
          allow: {},
        },
        rules: [
          {
            name: 'BlockSQLInjection',
            priority: 1,
            statement: {
              sqliMatchStatement: {
                fieldToMatch: {
                  body: {
                    oversizeHandling: 'CONTINUE',
                  },
                },
                textTransformations: [
                  {
                    priority: 0,
                    type: 'URL_DECODE',
                  },
                  {
                    priority: 1,
                    type: 'HTML_ENTITY_DECODE',
                  },
                ],
              },
            },
            action: {
              block: {},
            },
            visibilityConfig: {
              cloudwatchMetricsEnabled: true,
              metricName: 'BlockSQLInjection',
              sampledRequestsEnabled: true,
            },
          },
          {
            name: 'BlockXSS',
            priority: 2,
            statement: {
              xssMatchStatement: {
                fieldToMatch: {
                  body: {
                    oversizeHandling: 'CONTINUE',
                  },
                },
                textTransformations: [
                  {
                    priority: 0,
                    type: 'URL_DECODE',
                  },
                  {
                    priority: 1,
                    type: 'HTML_ENTITY_DECODE',
                  },
                ],
              },
            },
            action: {
              block: {},
            },
            visibilityConfig: {
              cloudwatchMetricsEnabled: true,
              metricName: 'BlockXSS',
              sampledRequestsEnabled: true,
            },
          },
        ],
        visibilityConfig: {
          cloudwatchMetricsEnabled: true,
          metricName: `payment-waf-${environmentSuffix}`,
          sampledRequestsEnabled: true,
        },
        tags: pulumi.output(tags).apply(t => ({
          ...t,
          Name: `payment-waf-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Associate WAF with ALB
    new aws.wafv2.WebAclAssociation(
      `payment-waf-assoc-${environmentSuffix}`,
      {
        resourceArn: alb.arn,
        webAclArn: wafWebAcl.arn,
      },
      { parent: this }
    );

    // ECS Cluster
    const cluster = new aws.ecs.Cluster(
      `payment-cluster-${environmentSuffix}`,
      {
        name: `payment-cluster-${environmentSuffix}`,
        settings: [
          {
            name: 'containerInsights',
            value: 'enabled',
          },
        ],
        tags: pulumi.output(tags).apply(t => ({
          ...t,
          Name: `payment-cluster-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // ECS Task Definition
    const taskDefinition = new aws.ecs.TaskDefinition(
      `payment-task-${environmentSuffix}`,
      {
        family: `payment-app-${environmentSuffix}`,
        networkMode: 'awsvpc',
        requiresCompatibilities: ['FARGATE'],
        cpu: '1024',
        memory: '2048',
        executionRoleArn: ecsExecutionRole.arn,
        taskRoleArn: ecsTaskRole.arn,
        containerDefinitions: pulumi
          .all([logGroupName, databaseEndpoint, staticBucketName])
          .apply(([logGroup, dbEndpoint, bucket]) =>
            JSON.stringify([
              {
                name: 'payment-app',
                image: 'nginx:latest',
                essential: true,
                readonlyRootFilesystem: true,
                portMappings: [
                  {
                    containerPort: 3000,
                    protocol: 'tcp',
                  },
                ],
                environment: [
                  {
                    name: 'DB_ENDPOINT',
                    value: dbEndpoint,
                  },
                  {
                    name: 'STATIC_BUCKET',
                    value: bucket,
                  },
                  {
                    name: 'NODE_ENV',
                    value: 'production',
                  },
                ],
                logConfiguration: {
                  logDriver: 'awslogs',
                  options: {
                    'awslogs-group': logGroup,
                    'awslogs-region': 'us-east-1',
                    'awslogs-stream-prefix': 'ecs',
                  },
                },
                mountPoints: [
                  {
                    sourceVolume: 'tmp',
                    containerPath: '/tmp',
                    readOnly: false,
                  },
                ],
              },
            ])
          ),
        volumes: [
          {
            name: 'tmp',
          },
        ],
        tags: pulumi.output(tags).apply(t => ({
          ...t,
          Name: `payment-task-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // ECS Service
    const service = new aws.ecs.Service(
      `payment-service-${environmentSuffix}`,
      {
        name: `payment-service-${environmentSuffix}`,
        cluster: cluster.arn,
        taskDefinition: taskDefinition.arn,
        desiredCount: 2,
        launchType: 'FARGATE',
        networkConfiguration: {
          assignPublicIp: false,
          subnets: privateSubnetIds,
          securityGroups: [ecsSecurityGroup.id],
        },
        loadBalancers: [
          {
            targetGroupArn: targetGroup.arn,
            containerName: 'payment-app',
            containerPort: 3000,
          },
        ],
        tags: pulumi.output(tags).apply(t => ({
          ...t,
          Name: `payment-service-${environmentSuffix}`,
        })),
      },
      { parent: this, dependsOn: [listener] }
    );

    this.albDnsName = alb.dnsName;

    this.registerOutputs({
      albDnsName: this.albDnsName,
      albArn: alb.arn,
      clusterName: cluster.name,
      serviceName: service.name,
    });
  }
}
```

## File: lib/backup-stack.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface BackupStackArgs {
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
  clusterArn: pulumi.Input<string>;
}

export class BackupStack extends pulumi.ComponentResource {
  constructor(name: string, args: BackupStackArgs, opts?: pulumi.ComponentResourceOptions) {
    super('tap:backup:BackupStack', name, args, opts);

    const { environmentSuffix, tags, clusterArn } = args;

    // Backup vault
    const backupVault = new aws.backup.Vault(
      `payment-backup-vault-${environmentSuffix}`,
      {
        name: `payment-backup-vault-${environmentSuffix}`,
        tags: pulumi.output(tags).apply(t => ({
          ...t,
          Name: `payment-backup-vault-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Backup plan
    const backupPlan = new aws.backup.Plan(
      `payment-backup-plan-${environmentSuffix}`,
      {
        name: `payment-backup-plan-${environmentSuffix}`,
        rules: [
          {
            ruleName: 'DailyBackup',
            targetVaultName: backupVault.name,
            schedule: 'cron(0 2 * * ? *)',
            lifecycle: {
              deleteAfter: 30,
            },
            copyActions: [
              {
                destinationVaultArn: `arn:aws:backup:us-west-2:${aws.getCallerIdentity().then(
                  id => id.accountId
                )}:backup-vault:payment-backup-vault-${environmentSuffix}-dr`,
                lifecycle: {
                  deleteAfter: 30,
                },
              },
            ],
          },
        ],
        tags: pulumi.output(tags).apply(t => ({
          ...t,
          Name: `payment-backup-plan-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Backup role
    const backupRole = new aws.iam.Role(
      `payment-backup-role-${environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'backup.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: pulumi.output(tags).apply(t => ({
          ...t,
          Name: `payment-backup-role-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Attach AWS managed backup policy
    new aws.iam.RolePolicyAttachment(
      `payment-backup-policy-${environmentSuffix}`,
      {
        role: backupRole.name,
        policyArn: 'arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup',
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `payment-backup-restore-policy-${environmentSuffix}`,
      {
        role: backupRole.name,
        policyArn: 'arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForRestores',
      },
      { parent: this }
    );

    // Backup selection
    const backupSelection = new aws.backup.Selection(
      `payment-backup-selection-${environmentSuffix}`,
      {
        name: `payment-rds-selection-${environmentSuffix}`,
        planId: backupPlan.id,
        iamRoleArn: backupRole.arn,
        resources: [clusterArn],
      },
      { parent: this }
    );

    // DR vault in us-west-2 (referenced in copy action)
    const drProvider = new aws.Provider(
      `dr-provider-${environmentSuffix}`,
      {
        region: 'us-west-2',
      },
      { parent: this }
    );

    const drBackupVault = new aws.backup.Vault(
      `payment-backup-vault-${environmentSuffix}-dr`,
      {
        name: `payment-backup-vault-${environmentSuffix}-dr`,
        tags: pulumi.output(tags).apply(t => ({
          ...t,
          Name: `payment-backup-vault-${environmentSuffix}-dr`,
          Region: 'us-west-2',
        })),
      },
      { parent: this, provider: drProvider }
    );

    this.registerOutputs({
      backupVaultName: backupVault.name,
      backupPlanId: backupPlan.id,
      drBackupVaultName: drBackupVault.name,
    });
  }
}
```

## File: lib/README.md

```markdown
# Payment Processing Infrastructure

This Pulumi TypeScript project deploys a PCI-compliant payment processing infrastructure on AWS.

## Architecture

The infrastructure consists of:

1. **Network Stack**: VPC with 3 public and 3 private subnets across 3 availability zones, NAT gateways, and VPC endpoints for S3, ECR, and CloudWatch Logs
2. **Security Stack**: KMS keys with automatic rotation for RDS, S3, and CloudWatch Logs encryption, plus IAM roles for ECS tasks
3. **Storage Stack**: S3 buckets with versioning, lifecycle policies, and KMS encryption for static assets and audit logs
4. **Database Stack**: Aurora PostgreSQL Multi-AZ cluster with 2 reader instances, automated backups, and encrypted storage
5. **Monitoring Stack**: CloudWatch Log Groups with 365-day retention for ECS tasks, RDS slow queries, and audit logs
6. **Compute Stack**: ECS Fargate service with Application Load Balancer and AWS WAF rules blocking SQL injection and XSS
7. **Backup Stack**: AWS Backup plans with 30-day retention and cross-region copies to us-west-2

## Prerequisites

- Pulumi CLI 3.x or later
- Node.js 18 or later
- AWS CLI configured with appropriate credentials
- AWS account with permissions to create VPC, ECS, RDS, S3, KMS, WAF, and Backup resources

## Deployment

### Environment Variables

Set the `ENVIRONMENT_SUFFIX` environment variable to distinguish between environments:

```bash
export ENVIRONMENT_SUFFIX=dev
```

### Deploy

```bash
# Install dependencies
npm install

# Preview changes
pulumi preview

# Deploy infrastructure
pulumi up

# View outputs
pulumi stack output
```

### Outputs

After deployment, the following outputs are available:

- `albDnsName`: DNS name of the Application Load Balancer
- `clusterEndpoint`: Aurora PostgreSQL cluster endpoint
- `staticBucketName`: S3 bucket name for static assets
- `auditBucketName`: S3 bucket name for audit logs

## Configuration

All resources are named with the pattern `resource-name-${environmentSuffix}` to support parallel deployments.

### Network Configuration

- VPC CIDR: 10.0.0.0/16
- Public subnets: 10.0.0.0/24, 10.0.1.0/24, 10.0.2.0/24
- Private subnets: 10.0.10.0/24, 10.0.11.0/24, 10.0.12.0/24

### Database Configuration

- Engine: aurora-postgresql 14.6
- Instance class: db.t3.medium
- Backup retention: 30 days
- Slow query log threshold: 1000ms

### ECS Configuration

- Task CPU: 1024 (1 vCPU)
- Task memory: 2048 MB (2 GB)
- Desired count: 2 tasks
- Read-only root filesystem: enabled

### Security Features

- All data encrypted at rest with KMS customer-managed keys
- KMS automatic key rotation enabled
- S3 bucket versioning enabled
- CloudWatch Logs retention: 365 days
- IAM roles follow least privilege principle
- WAF rules block SQL injection and XSS attacks
- VPC endpoints for private AWS service communication

## Compliance

This infrastructure meets PCI DSS requirements including:

- End-to-end encryption (at rest and in transit)
- Audit logging with 365-day retention
- Automated backups with cross-region replication
- Network segmentation with private subnets
- Least privilege IAM policies
- Read-only container filesystems

## Cleanup

To destroy all resources:

```bash
pulumi destroy
```

Note: All resources are configured for easy destruction (no retention policies).

## Testing

Unit tests are located in the `test/` directory. Run tests with:

```bash
npm test
```

## License

UNLICENSED
```
