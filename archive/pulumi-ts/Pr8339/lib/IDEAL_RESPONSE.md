# Multi-Region, Consistent, and Encrypted Infrastructure - Complete Code Implementation

This document contains all the infrastructure code from the lib folder (excluding tap-stack.ts).

## config.ts

```typescript
import * as pulumi from '@pulumi/pulumi';

const config = new pulumi.Config();

export const primaryRegion = config.get('primaryRegion') || 'ap-south-1';
export const secondaryRegion = config.get('secondaryRegion') || 'eu-west-1';
export const primaryVpcCidr = config.get('primaryVpcCidr') || '10.0.0.0/16';
export const secondaryVpcCidr = config.get('secondaryVpcCidr') || '10.1.0.0/16';
export const instanceType = config.get('instanceType') || 't2.micro';
export const dbInstanceClass = config.get('dbInstanceClass') || 'db.t3.micro';

export const getCommonTags = (environment: string) => ({
  Environment: environment,
  Project: 'MultiRegionInfrastructure',
});
```

## kms.ts

```typescript
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { getCommonTags, primaryRegion, secondaryRegion } from './config';

// Get account ID for KMS policy
const accountId = aws.getCallerIdentity();

export class KmsStack extends pulumi.ComponentResource {
  public readonly primaryKmsKey: aws.kms.Key;
  public readonly primaryKmsAlias: aws.kms.Alias;
  public readonly secondaryKmsKey: aws.kms.Key;
  public readonly secondaryKmsAlias: aws.kms.Alias;

  constructor(
    name: string,
    args: { environment: string; tags: Record<string, string> },
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:kms:KmsStack', name, {}, opts);

    // Input validation
    if (
      !args ||
      !args.environment ||
      typeof args.environment !== 'string' ||
      args.environment.trim() === ''
    ) {
      throw new Error('Environment must be a non-empty string');
    }
    if (!args.tags || typeof args.tags !== 'object') {
      throw new Error('Tags must be a valid object');
    }

    const commonTags = { ...getCommonTags(args.environment), ...args.tags };

    // Primary region KMS key
    const primaryProvider = new aws.Provider(
      `${args.environment}-primary-provider`,
      { region: primaryRegion },
      { parent: this }
    );

    this.primaryKmsKey = new aws.kms.Key(
      `${args.environment}-primary-kms-key`,
      {
        description: 'KMS key for encryption in primary region',
        policy: accountId.then(id =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Sid: 'Allow administration of the key',
                Effect: 'Allow',
                Principal: { AWS: `arn:aws:iam::${id.accountId}:root` },
                Action: ['kms:*'],
                Resource: '*',
              },
              {
                Sid: 'Allow use of the key for RDS',
                Effect: 'Allow',
                Principal: { Service: 'rds.amazonaws.com' },
                Action: [
                  'kms:Encrypt',
                  'kms:Decrypt',
                  'kms:DescribeKey',
                  'kms:GenerateDataKey*',
                ],
                Resource: '*',
              },
            ],
          })
        ),
        tags: {
          ...commonTags,
          Name: `${args.environment}-primary-kms-key`,
          Region: primaryRegion,
        },
      },
      { provider: primaryProvider, parent: this }
    );

    this.primaryKmsAlias = new aws.kms.Alias(
      `${args.environment}-primary-kms-alias`,
      {
        name: `alias/${args.environment}-primary-region-key`,
        targetKeyId: this.primaryKmsKey.keyId,
      },
      { provider: primaryProvider, parent: this }
    );

    // Secondary region KMS key
    const secondaryProvider = new aws.Provider(
      `${args.environment}-secondary-provider`,
      { region: secondaryRegion },
      { parent: this }
    );

    this.secondaryKmsKey = new aws.kms.Key(
      `${args.environment}-secondary-kms-key`,
      {
        description: 'KMS key for encryption in secondary region',
        policy: accountId.then(id =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Sid: 'Allow administration of the key',
                Effect: 'Allow',
                Principal: { AWS: `arn:aws:iam::${id.accountId}:root` },
                Action: ['kms:*'],
                Resource: '*',
              },
              {
                Sid: 'Allow use of the key for RDS',
                Effect: 'Allow',
                Principal: { Service: 'rds.amazonaws.com' },
                Action: [
                  'kms:Encrypt',
                  'kms:Decrypt',
                  'kms:DescribeKey',
                  'kms:GenerateDataKey*',
                ],
                Resource: '*',
              },
            ],
          })
        ),
        tags: {
          ...commonTags,
          Name: `${args.environment}-secondary-kms-key`,
          Region: secondaryRegion,
        },
      },
      { provider: secondaryProvider, parent: this }
    );

    this.secondaryKmsAlias = new aws.kms.Alias(
      `${args.environment}-secondary-kms-alias`,
      {
        name: `alias/${args.environment}-secondary-region-key`,
        targetKeyId: this.secondaryKmsKey.keyId,
      },
      { provider: secondaryProvider, parent: this }
    );

    this.registerOutputs({
      primaryKmsKeyId: this.primaryKmsKey.keyId,
      primaryKmsKeyArn: this.primaryKmsKey.arn,
      secondaryKmsKeyId: this.secondaryKmsKey.keyId,
      secondaryKmsKeyArn: this.secondaryKmsKey.arn,
    });
  }
}
```

## vpc.ts

```typescript
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import {
  getCommonTags,
  primaryRegion,
  secondaryRegion,
  primaryVpcCidr,
  secondaryVpcCidr,
} from './config';

export class VpcStack extends pulumi.ComponentResource {
  public readonly primaryVpc: aws.ec2.Vpc;
  public readonly primaryInternetGateway: aws.ec2.InternetGateway;
  public readonly primaryPublicSubnet1: aws.ec2.Subnet;
  public readonly primaryPublicSubnet2: aws.ec2.Subnet;
  public readonly primaryPrivateSubnet1: aws.ec2.Subnet;
  public readonly primaryPrivateSubnet2: aws.ec2.Subnet;
  public readonly primaryPublicRouteTable: aws.ec2.RouteTable;
  public readonly secondaryVpc: aws.ec2.Vpc;
  public readonly secondaryInternetGateway: aws.ec2.InternetGateway;
  public readonly secondaryPrivateSubnet1: aws.ec2.Subnet;
  public readonly secondaryPrivateSubnet2: aws.ec2.Subnet;

  constructor(
    name: string,
    args: { environment: string; tags: Record<string, string> },
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:vpc:VpcStack', name, {}, opts);

    const commonTags = { ...getCommonTags(args.environment), ...args.tags };

    // Primary region VPC
    const primaryProvider = new aws.Provider(
      `${args.environment}-primary-provider`,
      { region: primaryRegion },
      { parent: this }
    );

    this.primaryVpc = new aws.ec2.Vpc(
      `${args.environment}-primary-vpc`,
      {
        cidrBlock: primaryVpcCidr,
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          ...commonTags,
          Name: `${args.environment}-Primary-VPC`,
          Region: primaryRegion,
        },
      },
      { provider: primaryProvider, parent: this }
    );

    this.primaryInternetGateway = new aws.ec2.InternetGateway(
      `${args.environment}-primary-igw`,
      {
        vpcId: this.primaryVpc.id,
        tags: {
          ...commonTags,
          Name: `${args.environment}-Primary-Internet-Gateway`,
        },
      },
      { provider: primaryProvider, parent: this }
    );

    // Primary region subnets
    this.primaryPublicSubnet1 = new aws.ec2.Subnet(
      `${args.environment}-primary-public-subnet-1`,
      {
        vpcId: this.primaryVpc.id,
        cidrBlock: '10.0.1.0/24',
        availabilityZone: `${primaryRegion}a`,
        mapPublicIpOnLaunch: true,
        tags: {
          ...commonTags,
          Name: `${args.environment}-Primary-Public-Subnet-1`,
          Type: 'Public',
        },
      },
      { provider: primaryProvider, parent: this }
    );

    this.primaryPublicSubnet2 = new aws.ec2.Subnet(
      `${args.environment}-primary-public-subnet-2`,
      {
        vpcId: this.primaryVpc.id,
        cidrBlock: '10.0.2.0/24',
        availabilityZone: `${primaryRegion}b`,
        mapPublicIpOnLaunch: true,
        tags: {
          ...commonTags,
          Name: `${args.environment}-Primary-Public-Subnet-2`,
          Type: 'Public',
        },
      },
      { provider: primaryProvider, parent: this }
    );

    this.primaryPrivateSubnet1 = new aws.ec2.Subnet(
      `${args.environment}-primary-private-subnet-1`,
      {
        vpcId: this.primaryVpc.id,
        cidrBlock: '10.0.3.0/24',
        availabilityZone: `${primaryRegion}a`,
        tags: {
          ...commonTags,
          Name: `${args.environment}-Primary-Private-Subnet-1`,
          Type: 'Private',
        },
      },
      { provider: primaryProvider, parent: this }
    );

    this.primaryPrivateSubnet2 = new aws.ec2.Subnet(
      `${args.environment}-primary-private-subnet-2`,
      {
        vpcId: this.primaryVpc.id,
        cidrBlock: '10.0.4.0/24',
        availabilityZone: `${primaryRegion}b`,
        tags: {
          ...commonTags,
          Name: `${args.environment}-Primary-Private-Subnet-2`,
          Type: 'Private',
        },
      },
      { provider: primaryProvider, parent: this }
    );

    // Primary region route table
    this.primaryPublicRouteTable = new aws.ec2.RouteTable(
      `${args.environment}-primary-public-rt`,
      {
        vpcId: this.primaryVpc.id,
        routes: [
          {
            cidrBlock: '0.0.0.0/0',
            gatewayId: this.primaryInternetGateway.id,
          },
        ],
        tags: {
          ...commonTags,
          Name: `${args.environment}-Primary-Public-Route-Table`,
        },
      },
      { provider: primaryProvider, parent: this }
    );

    // Associate public subnets with route table
    new aws.ec2.RouteTableAssociation(
      `${args.environment}-primary-public-rta-1`,
      {
        subnetId: this.primaryPublicSubnet1.id,
        routeTableId: this.primaryPublicRouteTable.id,
      },
      { provider: primaryProvider, parent: this }
    );

    new aws.ec2.RouteTableAssociation(
      `${args.environment}-primary-public-rta-2`,
      {
        subnetId: this.primaryPublicSubnet2.id,
        routeTableId: this.primaryPublicRouteTable.id,
      },
      { provider: primaryProvider, parent: this }
    );

    // Secondary region VPC
    const secondaryProvider = new aws.Provider(
      `${args.environment}-secondary-provider`,
      { region: secondaryRegion },
      { parent: this }
    );

    this.secondaryVpc = new aws.ec2.Vpc(
      `${args.environment}-secondary-vpc`,
      {
        cidrBlock: secondaryVpcCidr,
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          ...commonTags,
          Name: `${args.environment}-Secondary-VPC`,
          Region: secondaryRegion,
        },
      },
      { provider: secondaryProvider, parent: this }
    );

    this.secondaryInternetGateway = new aws.ec2.InternetGateway(
      `${args.environment}-secondary-igw`,
      {
        vpcId: this.secondaryVpc.id,
        tags: {
          ...commonTags,
          Name: `${args.environment}-Secondary-Internet-Gateway`,
        },
      },
      { provider: secondaryProvider, parent: this }
    );

    // Secondary region subnets
    this.secondaryPrivateSubnet1 = new aws.ec2.Subnet(
      `${args.environment}-secondary-private-subnet-1`,
      {
        vpcId: this.secondaryVpc.id,
        cidrBlock: '10.1.1.0/24',
        availabilityZone: `${secondaryRegion}a`,
        tags: {
          ...commonTags,
          Name: `${args.environment}-Secondary-Private-Subnet-1`,
          Type: 'Private',
        },
      },
      { provider: secondaryProvider, parent: this }
    );

    this.secondaryPrivateSubnet2 = new aws.ec2.Subnet(
      `${args.environment}-secondary-private-subnet-2`,
      {
        vpcId: this.secondaryVpc.id,
        cidrBlock: '10.1.2.0/24',
        availabilityZone: `${secondaryRegion}b`,
        tags: {
          ...commonTags,
          Name: `${args.environment}-Secondary-Private-Subnet-2`,
          Type: 'Private',
        },
      },
      { provider: secondaryProvider, parent: this }
    );

    this.registerOutputs({
      primaryVpcId: this.primaryVpc.id,
      primaryVpcCidr: this.primaryVpc.cidrBlock,
      secondaryVpcId: this.secondaryVpc.id,
      secondaryVpcCidr: this.secondaryVpc.cidrBlock,
    });
  }
}
```

## security-groups.ts

```typescript
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { getCommonTags, primaryRegion, secondaryRegion } from './config';
import { VpcStack } from './vpc';

export class SecurityGroupsStack extends pulumi.ComponentResource {
  public readonly primaryAlbSecurityGroup: aws.ec2.SecurityGroup;
  public readonly primaryAppSecurityGroup: aws.ec2.SecurityGroup;
  public readonly primaryDbSecurityGroup: aws.ec2.SecurityGroup;
  public readonly secondaryDbSecurityGroup: aws.ec2.SecurityGroup;

  constructor(
    name: string,
    args: {
      environment: string;
      tags: Record<string, string>;
      vpcStack: VpcStack;
    },
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:security:SecurityGroupsStack', name, {}, opts);

    const commonTags = { ...getCommonTags(args.environment), ...args.tags };

    const primaryProvider = new aws.Provider(
      `${args.environment}-primary-provider`,
      { region: primaryRegion },
      { parent: this }
    );
    const secondaryProvider = new aws.Provider(
      `${args.environment}-secondary-provider`,
      { region: secondaryRegion },
      { parent: this }
    );

    // Primary region security groups
    this.primaryAlbSecurityGroup = new aws.ec2.SecurityGroup(
      `${args.environment}-primary-alb-sg`,
      {
        name: `${args.environment}-primary-alb-security-group`,
        description: 'Security group for Application Load Balancer',
        vpcId: args.vpcStack.primaryVpc.id,
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 443,
            toPort: 443,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow HTTPS traffic from internet',
          },
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow HTTP traffic for redirect to HTTPS',
          },
        ],
        egress: [
          {
            protocol: 'tcp',
            fromPort: 8080,
            toPort: 8080,
            cidrBlocks: ['10.0.0.0/16'],
            description: 'Allow traffic to application instances',
          },
          {
            protocol: 'tcp',
            fromPort: 443,
            toPort: 443,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow HTTPS outbound for health checks',
          },
        ],
        tags: {
          ...commonTags,
          Name: `${args.environment}-Primary-ALB-Security-Group`,
        },
      },
      { provider: primaryProvider, parent: this }
    );

    this.primaryAppSecurityGroup = new aws.ec2.SecurityGroup(
      `${args.environment}-primary-app-sg`,
      {
        name: `${args.environment}-primary-app-security-group`,
        description: 'Security group for application instances',
        vpcId: args.vpcStack.primaryVpc.id,
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 8080,
            toPort: 8080,
            securityGroups: [this.primaryAlbSecurityGroup.id],
            description: 'Allow traffic from ALB',
          },
        ],
        egress: [
          {
            protocol: 'tcp',
            fromPort: 3306,
            toPort: 3306,
            cidrBlocks: ['10.0.3.0/24', '10.0.4.0/24'],
            description: 'Allow MySQL traffic to RDS subnets only',
          },
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow HTTP outbound for package updates',
          },
          {
            protocol: 'tcp',
            fromPort: 443,
            toPort: 443,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow HTTPS outbound for package updates',
          },
          {
            protocol: 'tcp',
            fromPort: 53,
            toPort: 53,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow DNS queries',
          },
          {
            protocol: 'udp',
            fromPort: 53,
            toPort: 53,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow DNS queries',
          },
        ],
        tags: {
          ...commonTags,
          Name: `${args.environment}-Primary-App-Security-Group`,
        },
      },
      { provider: primaryProvider, parent: this }
    );

    this.primaryDbSecurityGroup = new aws.ec2.SecurityGroup(
      `${args.environment}-primary-db-sg`,
      {
        name: `${args.environment}-primary-db-security-group`,
        description: 'Security group for RDS database',
        vpcId: args.vpcStack.primaryVpc.id,
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 3306,
            toPort: 3306,
            securityGroups: [this.primaryAppSecurityGroup.id],
            description: 'Allow MySQL traffic from application instances',
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: -1,
            toPort: -1,
            cidrBlocks: [],
            description: 'Deny all outbound traffic by default',
          },
        ],
        tags: {
          ...commonTags,
          Name: `${args.environment}-Primary-DB-Security-Group`,
        },
      },
      { provider: primaryProvider, parent: this }
    );

    // Secondary region security group for RDS read replica
    this.secondaryDbSecurityGroup = new aws.ec2.SecurityGroup(
      `${args.environment}-secondary-db-sg`,
      {
        name: `${args.environment}-secondary-db-security-group`,
        description: 'Security group for RDS read replica',
        vpcId: args.vpcStack.secondaryVpc.id,
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 3306,
            toPort: 3306,
            cidrBlocks: ['10.1.0.0/16'],
            description: 'Allow MySQL traffic within VPC',
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: -1,
            toPort: -1,
            cidrBlocks: [],
            description: 'Deny all outbound traffic by default',
          },
        ],
        tags: {
          ...commonTags,
          Name: `${args.environment}-Secondary-DB-Security-Group`,
        },
      },
      { provider: secondaryProvider, parent: this }
    );

    this.registerOutputs({});
  }
}
```
## rds.ts

```typescript
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import {
  getCommonTags,
  primaryRegion,
  secondaryRegion,
  dbInstanceClass,
} from './config';
import { VpcStack } from './vpc';
import { SecurityGroupsStack } from './security-groups';
import { KmsStack } from './kms';

// Detect if running in LocalStack
const isLocalStack = (): boolean => {
  const endpoint = process.env.AWS_ENDPOINT_URL || '';
  return endpoint.includes('localhost') || endpoint.includes('localstack');
};

export class RdsStack extends pulumi.ComponentResource {
  public readonly primaryDbSubnetGroup: aws.rds.SubnetGroup;
  public readonly secondaryDbSubnetGroup: aws.rds.SubnetGroup;
  public readonly primaryRdsInstance: aws.rds.Instance;
  public readonly secondaryRdsReadReplica?: aws.rds.Instance;

  constructor(
    name: string,
    args: {
      environment: string;
      tags: Record<string, string>;
      vpcStack: VpcStack;
      securityGroupsStack: SecurityGroupsStack;
      kmsStack: KmsStack;
    },
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:rds:RdsStack', name, {}, opts);

    const commonTags = { ...getCommonTags(args.environment), ...args.tags };

    const primaryProvider = new aws.Provider(
      `${args.environment}-primary-provider`,
      { region: primaryRegion },
      { parent: this }
    );
    const secondaryProvider = new aws.Provider(
      `${args.environment}-secondary-provider`,
      { region: secondaryRegion },
      { parent: this }
    );

    // Primary region DB subnet group
    this.primaryDbSubnetGroup = new aws.rds.SubnetGroup(
      `${args.environment}-primary-db-subnet-group`,
      {
        name: `${args.environment}-primary-db-subnet-group`,
        subnetIds: [
          args.vpcStack.primaryPrivateSubnet1.id,
          args.vpcStack.primaryPrivateSubnet2.id,
        ],
        tags: {
          ...commonTags,
          Name: `${args.environment}-Primary-DB-Subnet-Group`,
        },
      },
      { provider: primaryProvider, parent: this }
    );

    // Secondary region DB subnet group
    this.secondaryDbSubnetGroup = new aws.rds.SubnetGroup(
      `${args.environment}-secondary-db-subnet-group`,
      {
        name: `${args.environment}-secondary-db-subnet-group`,
        subnetIds: [
          args.vpcStack.secondaryPrivateSubnet1.id,
          args.vpcStack.secondaryPrivateSubnet2.id,
        ],
        tags: {
          ...commonTags,
          Name: `${args.environment}-Secondary-DB-Subnet-Group`,
        },
      },
      { provider: secondaryProvider, parent: this }
    );

    // Primary RDS instance
    this.primaryRdsInstance = new aws.rds.Instance(
      `${args.environment}-primary-mysql-db`,
      {
        identifier: `${args.environment}-primary-mysql-database`,
        allocatedStorage: 20,
        storageType: 'gp2',
        storageEncrypted: true,
        kmsKeyId: args.kmsStack.primaryKmsKey.arn,
        engine: 'mysql',
        engineVersion: '8.0',
        instanceClass: dbInstanceClass,
        dbName: 'productiondb',
        username: 'admin',
        manageMasterUserPassword: true, // Use AWS managed password
        vpcSecurityGroupIds: [
          args.securityGroupsStack.primaryDbSecurityGroup.id,
        ],
        dbSubnetGroupName: this.primaryDbSubnetGroup.name,
        multiAz: true, // Enable Multi-AZ for high availability
        backupRetentionPeriod: 7,
        backupWindow: '03:00-04:00',
        maintenanceWindow: 'sun:04:00-sun:05:00',
        skipFinalSnapshot: false,
        finalSnapshotIdentifier: `${args.environment}-primary-mysql-final-snapshot`,
        deletionProtection: true, // Enable deletion protection for production
        tags: {
          ...commonTags,
          Name: `${args.environment}-Primary-MySQL-Database`,
        },
      },
      { provider: primaryProvider, parent: this }
    );

    // Cross-region read replica (skip in LocalStack - not fully supported)
    /* istanbul ignore if -- @preserve LocalStack doesn't fully support cross-region RDS read replicas */
    if (!isLocalStack()) {
      this.secondaryRdsReadReplica = new aws.rds.Instance(
        `${args.environment}-secondary-mysql-read-replica`,
        {
          identifier: `${args.environment}-secondary-mysql-read-replica`,
          replicateSourceDb: this.primaryRdsInstance.arn,
          instanceClass: dbInstanceClass,
          storageEncrypted: true,
          kmsKeyId: args.kmsStack.secondaryKmsKey.arn,
          vpcSecurityGroupIds: [
            args.securityGroupsStack.secondaryDbSecurityGroup.id,
          ],
          dbSubnetGroupName: this.secondaryDbSubnetGroup.name,
          skipFinalSnapshot: false,
          finalSnapshotIdentifier: `${args.environment}-secondary-mysql-final-snapshot`,
          deletionProtection: true, // Enable deletion protection for production
          tags: {
            ...commonTags,
            Name: `${args.environment}-Secondary-MySQL-Read-Replica`,
          },
        },
        { provider: secondaryProvider, parent: this }
      );
    }

    const outputs: Record<string, pulumi.Output<unknown>> = {
      primaryDbEndpoint: this.primaryRdsInstance.endpoint,
      primaryDbPort: this.primaryRdsInstance.port,
    };

    /* istanbul ignore if -- @preserve secondaryRdsReadReplica only exists in non-LocalStack environments */
    if (this.secondaryRdsReadReplica) {
      outputs.secondaryDbEndpoint = this.secondaryRdsReadReplica.endpoint;
      outputs.secondaryDbPort = this.secondaryRdsReadReplica.port;
    }

    this.registerOutputs(outputs);
  }
}
```
## load-balancer.ts

```typescript
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { getCommonTags, primaryRegion } from './config';
import { VpcStack } from './vpc';
import { SecurityGroupsStack } from './security-groups';

export class LoadBalancerStack extends pulumi.ComponentResource {
  public readonly applicationLoadBalancer: aws.lb.LoadBalancer;
  public readonly targetGroup: aws.lb.TargetGroup;
  public readonly albListener: aws.lb.Listener;

  constructor(
    name: string,
    args: {
      environment: string;
      tags: Record<string, string>;
      vpcStack: VpcStack;
      securityGroupsStack: SecurityGroupsStack;
    },
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:lb:LoadBalancerStack', name, {}, opts);

    const commonTags = { ...getCommonTags(args.environment), ...args.tags };

    const primaryProvider = new aws.Provider(
      `${args.environment}-primary-provider`,
      { region: primaryRegion },
      { parent: this }
    );

    // Application Load Balancer
    this.applicationLoadBalancer = new aws.lb.LoadBalancer(
      `${args.environment}-app-load-balancer`,
      {
        name: `${args.environment}-app-load-balancer`,
        loadBalancerType: 'application',
        subnets: [
          args.vpcStack.primaryPublicSubnet1.id,
          args.vpcStack.primaryPublicSubnet2.id,
        ],
        securityGroups: [args.securityGroupsStack.primaryAlbSecurityGroup.id],
        enableDeletionProtection: false, // Set to true in production
        tags: {
          ...commonTags,
          Name: `${args.environment}-Application-Load-Balancer`,
        },
      },
      { provider: primaryProvider, parent: this }
    );

    // Target Group
    this.targetGroup = new aws.lb.TargetGroup(
      `${args.environment}-app-target-group`,
      {
        name: `${args.environment}-app-target-group`,
        port: 8080,
        protocol: 'HTTP',
        vpcId: args.vpcStack.primaryVpc.id,
        healthCheck: {
          enabled: true,
          healthyThreshold: 2,
          interval: 30,
          matcher: '200',
          path: '/health',
          port: 'traffic-port',
          protocol: 'HTTP',
          timeout: 5,
          unhealthyThreshold: 2,
        },
        tags: {
          ...commonTags,
          Name: `${args.environment}-App-Target-Group`,
        },
      },
      { provider: primaryProvider, parent: this }
    );

    // ALB Listener
    this.albListener = new aws.lb.Listener(
      `${args.environment}-app-listener`,
      {
        loadBalancerArn: this.applicationLoadBalancer.arn,
        port: 80,
        protocol: 'HTTP',
        defaultActions: [
          {
            type: 'forward',
            targetGroupArn: this.targetGroup.arn,
          },
        ],
      },
      { provider: primaryProvider, parent: this }
    );

    this.registerOutputs({
      loadBalancerDnsName: this.applicationLoadBalancer.dnsName,
      loadBalancerZoneId: this.applicationLoadBalancer.zoneId,
    });
  }
}
```
## auto-scaling.ts

```typescript
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { getCommonTags, primaryRegion, instanceType } from './config';
import { VpcStack } from './vpc';
import { SecurityGroupsStack } from './security-groups';
import { LoadBalancerStack } from './load-balancer';

export class AutoScalingStack extends pulumi.ComponentResource {
  public readonly ec2Role: aws.iam.Role;
  public readonly instanceProfile: aws.iam.InstanceProfile;
  public readonly launchTemplate: aws.ec2.LaunchTemplate;
  public readonly autoScalingGroup: aws.autoscaling.Group;
  public readonly scaleUpPolicy: aws.autoscaling.Policy;
  public readonly scaleDownPolicy: aws.autoscaling.Policy;

  constructor(
    name: string,
    args: {
      environment: string;
      tags: Record<string, string>;
      vpcStack: VpcStack;
      securityGroupsStack: SecurityGroupsStack;
      loadBalancerStack: LoadBalancerStack;
    },
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:asg:AutoScalingStack', name, {}, opts);

    const commonTags = { ...getCommonTags(args.environment), ...args.tags };

    const primaryProvider = new aws.Provider(
      `${args.environment}-primary-provider`,
      { region: primaryRegion },
      { parent: this }
    );

    // Get the latest Amazon Linux 2 AMI
    const amiId = aws.ec2.getAmi(
      {
        mostRecent: true,
        owners: ['amazon'],
        filters: [
          {
            name: 'name',
            values: ['amzn2-ami-hvm-*-x86_64-gp2'],
          },
          {
            name: 'virtualization-type',
            values: ['hvm'],
          },
        ],
      },
      { provider: primaryProvider }
    );

    // User data script for EC2 instances
    const userData = `#!/bin/bash
yum update -y
yum install -y docker
systemctl start docker
systemctl enable docker
usermod -a -G docker ec2-user

# Create a simple health check endpoint
mkdir -p /opt/app
cat > /opt/app/app.py << 'EOF'
from http.server import HTTPServer, BaseHTTPRequestHandler
import json

class HealthHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/health':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'status': 'healthy'}).encode())
        else:
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            self.wfile.write(b'Hello from Auto Scaling Group!')

if __name__ == '__main__':
    server = HTTPServer(('', 8080), HealthHandler)
    server.serve_forever()
EOF

# Install Python and start the application
yum install -y python3
nohup python3 /opt/app/app.py > /var/log/app.log 2>&1 &
`;

    // IAM role for EC2 instances
    this.ec2Role = new aws.iam.Role(
      `${args.environment}-ec2-role`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'ec2.amazonaws.com',
              },
            },
          ],
        }),
        tags: {
          ...commonTags,
          Name: `${args.environment}-EC2-Role`,
        },
      },
      { provider: primaryProvider, parent: this }
    );

    // Attach minimal required policies
    new aws.iam.RolePolicyAttachment(
      `${args.environment}-ec2-ssm-policy`,
      {
        role: this.ec2Role.name,
        policyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
      },
      { provider: primaryProvider, parent: this }
    );

    // Custom policy for minimal CloudWatch permissions
    const cloudWatchPolicy = new aws.iam.Policy(
      `${args.environment}-ec2-cloudwatch-policy`,
      {
        description: 'Minimal CloudWatch permissions for EC2 instances',
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'cloudwatch:PutMetricData',
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
              ],
              Resource: '*',
            },
          ],
        }),
      },
      { provider: primaryProvider, parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `${args.environment}-ec2-cloudwatch-attachment`,
      {
        role: this.ec2Role.name,
        policyArn: cloudWatchPolicy.arn,
      },
      { provider: primaryProvider, parent: this }
    );

    this.instanceProfile = new aws.iam.InstanceProfile(
      `${args.environment}-instance-profile`,
      {
        role: this.ec2Role.name,
      },
      { provider: primaryProvider, parent: this }
    );

    // Launch Template
    this.launchTemplate = new aws.ec2.LaunchTemplate(
      `${args.environment}-app-launch-template`,
      {
        name: `${args.environment}-app-launch-template`,
        imageId: amiId.then(ami => ami.id),
        instanceType: instanceType,
        vpcSecurityGroupIds: [
          args.securityGroupsStack.primaryAppSecurityGroup.id,
        ],
        iamInstanceProfile: {
          name: this.instanceProfile.name,
        },
        userData: Buffer.from(userData).toString('base64'),
        tagSpecifications: [
          {
            resourceType: 'instance',
            tags: {
              ...commonTags,
              Name: `${args.environment}-App-Server-Instance`,
            },
          },
        ],
        tags: {
          ...commonTags,
          Name: `${args.environment}-App-Launch-Template`,
        },
      },
      { provider: primaryProvider, parent: this }
    );

    // Auto Scaling Group
    this.autoScalingGroup = new aws.autoscaling.Group(
      `${args.environment}-app-asg`,
      {
        name: `${args.environment}-app-auto-scaling-group`,
        vpcZoneIdentifiers: [
          args.vpcStack.primaryPrivateSubnet1.id,
          args.vpcStack.primaryPrivateSubnet2.id,
        ],
        targetGroupArns: [args.loadBalancerStack.targetGroup.arn],
        healthCheckType: 'ELB',
        healthCheckGracePeriod: 300,
        minSize: 2,
        maxSize: 6,
        desiredCapacity: 2,
        launchTemplate: {
          id: this.launchTemplate.id,
          version: '$Latest',
        },
        tags: [
          {
            key: 'Name',
            value: `${args.environment}-App-Auto-Scaling-Group`,
            propagateAtLaunch: false,
          },
          {
            key: 'Environment',
            value: args.environment,
            propagateAtLaunch: true,
          },
        ],
      },
      { provider: primaryProvider, parent: this }
    );

    // Target Tracking Scaling Policy for better performance
    this.scaleUpPolicy = new aws.autoscaling.Policy(
      `${args.environment}-target-tracking-policy`,
      {
        name: `${args.environment}-target-tracking-policy`,
        policyType: 'TargetTrackingScaling',
        autoscalingGroupName: this.autoScalingGroup.name,
        targetTrackingConfiguration: {
          targetValue: 70.0,
          predefinedMetricSpecification: {
            predefinedMetricType: 'ASGAverageCPUUtilization',
          },
        },
      },
      { provider: primaryProvider, parent: this }
    );

    // Keep a simple scale down policy as backup
    this.scaleDownPolicy = new aws.autoscaling.Policy(
      `${args.environment}-scale-down-policy`,
      {
        name: `${args.environment}-scale-down-policy`,
        scalingAdjustment: -1,
        adjustmentType: 'ChangeInCapacity',
        cooldown: 300,
        autoscalingGroupName: this.autoScalingGroup.name,
      },
      { provider: primaryProvider, parent: this }
    );

    this.registerOutputs({
      autoScalingGroupName: this.autoScalingGroup.name,
      autoScalingGroupArn: this.autoScalingGroup.arn,
    });
  }
}
```
## monitoring.ts

```typescript
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { getCommonTags, primaryRegion } from './config';
import { RdsStack } from './rds';
import { AutoScalingStack } from './auto-scaling';
import { LoadBalancerStack } from './load-balancer';

export class MonitoringStack extends pulumi.ComponentResource {
  public readonly snsTopicArn: pulumi.Output<string>;
  public readonly snsTopicName: pulumi.Output<string>;

  constructor(
    name: string,
    args: {
      environment: string;
      tags: Record<string, string>;
      rdsStack: RdsStack;
      autoScalingStack: AutoScalingStack;
      loadBalancerStack: LoadBalancerStack;
    },
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:monitoring:MonitoringStack', name, {}, opts);

    const commonTags = { ...getCommonTags(args.environment), ...args.tags };
    const primaryProvider = new aws.Provider(
      `${args.environment}-primary-provider`,
      { region: primaryRegion },
      { parent: this }
    );

    // SNS Topic for alerts
    const snsTopic = new aws.sns.Topic(
      `${args.environment}-alerts-topic`,
      {
        name: `${args.environment}-infrastructure-alerts`,
        tags: {
          ...commonTags,
          Name: `${args.environment}-Infrastructure-Alerts`,
        },
      },
      { provider: primaryProvider, parent: this }
    );

    this.snsTopicArn = snsTopic.arn;
    this.snsTopicName = snsTopic.name;

    // RDS CPU Utilization Alarm
    new aws.cloudwatch.MetricAlarm(
      `${args.environment}-rds-cpu-alarm`,
      {
        name: `${args.environment}-rds-high-cpu`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'CPUUtilization',
        namespace: 'AWS/RDS',
        period: 300,
        statistic: 'Average',
        threshold: 80,
        alarmDescription: 'RDS CPU utilization is too high',
        alarmActions: [snsTopic.arn],
        dimensions: {
          DBInstanceIdentifier: args.rdsStack.primaryRdsInstance.identifier,
        },
        tags: commonTags,
      },
      { provider: primaryProvider, parent: this }
    );

    // RDS Database Connections Alarm
    new aws.cloudwatch.MetricAlarm(
      `${args.environment}-rds-connections-alarm`,
      {
        name: `${args.environment}-rds-high-connections`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'DatabaseConnections',
        namespace: 'AWS/RDS',
        period: 300,
        statistic: 'Average',
        threshold: 50,
        alarmDescription: 'RDS database connections are too high',
        alarmActions: [snsTopic.arn],
        dimensions: {
          DBInstanceIdentifier: args.rdsStack.primaryRdsInstance.identifier,
        },
        tags: commonTags,
      },
      { provider: primaryProvider, parent: this }
    );

    // ALB Target Health Alarm
    new aws.cloudwatch.MetricAlarm(
      `${args.environment}-alb-unhealthy-targets`,
      {
        name: `${args.environment}-alb-unhealthy-targets`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'UnHealthyHostCount',
        namespace: 'AWS/ApplicationELB',
        period: 300,
        statistic: 'Average',
        threshold: 0,
        alarmDescription: 'ALB has unhealthy targets',
        alarmActions: [snsTopic.arn],
        dimensions: {
          TargetGroup: args.loadBalancerStack.targetGroup.arnSuffix,
          LoadBalancer:
            args.loadBalancerStack.applicationLoadBalancer.arnSuffix,
        },
        tags: commonTags,
      },
      { provider: primaryProvider, parent: this }
    );

    // ALB Response Time Alarm
    new aws.cloudwatch.MetricAlarm(
      `${args.environment}-alb-response-time`,
      {
        name: `${args.environment}-alb-high-response-time`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'TargetResponseTime',
        namespace: 'AWS/ApplicationELB',
        period: 300,
        statistic: 'Average',
        threshold: 5,
        alarmDescription: 'ALB response time is too high',
        alarmActions: [snsTopic.arn],
        dimensions: {
          LoadBalancer:
            args.loadBalancerStack.applicationLoadBalancer.arnSuffix,
        },
        tags: commonTags,
      },
      { provider: primaryProvider, parent: this }
    );

    this.registerOutputs({
      snsTopicArn: this.snsTopicArn,
      snsTopicName: this.snsTopicName,
    });
  }
}
```
## logging.ts

```typescript
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { getCommonTags, primaryRegion } from './config';
import { LoadBalancerStack } from './load-balancer';
import { VpcStack } from './vpc';

// Detect if running in LocalStack
const isLocalStack = (): boolean => {
  const endpoint = process.env.AWS_ENDPOINT_URL || '';
  return endpoint.includes('localhost') || endpoint.includes('localstack');
};

// Get ELB service account for current region
const elbServiceAccount = aws.elb.getServiceAccount({
  region: primaryRegion,
});

export class LoggingStack extends pulumi.ComponentResource {
  public readonly cloudTrailArn: pulumi.Output<string>;
  public readonly cloudTrailName: pulumi.Output<string>;
  public readonly logBucketName: pulumi.Output<string>;
  public readonly flowLogsRoleName: pulumi.Output<string>;
  public readonly flowLogsPolicyName: pulumi.Output<string>;
  public readonly vpcLogGroupName: pulumi.Output<string>;

  constructor(
    name: string,
    args: {
      environment: string;
      tags: Record<string, string>;
      vpcStack: VpcStack;
      loadBalancerStack: LoadBalancerStack;
    },
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:logging:LoggingStack', name, {}, opts);

    const commonTags = { ...getCommonTags(args.environment), ...args.tags };
    const primaryProvider = new aws.Provider(
      `${args.environment}-primary-provider`,
      { region: primaryRegion },
      { parent: this }
    );

    // S3 Bucket for logs
    const logBucket = new aws.s3.Bucket(
      `${args.environment}-logs-bucket`,
      {
        forceDestroy: true,
        bucket: `${args.environment}-infrastructure-logs`,
        tags: {
          ...commonTags,
          Name: `${args.environment}-Infrastructure-Logs`,
        },
      },
      { provider: primaryProvider, parent: this }
    );

    // S3 Bucket Versioning
    new aws.s3.BucketVersioningV2(
      `${args.environment}-logs-bucket-versioning`,
      {
        bucket: logBucket.id,
        versioningConfiguration: {
          status: 'Enabled',
        },
      },
      { provider: primaryProvider, parent: this }
    );

    // S3 Bucket Encryption
    new aws.s3.BucketServerSideEncryptionConfigurationV2(
      `${args.environment}-logs-bucket-encryption`,
      {
        bucket: logBucket.id,
        rules: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
          },
        ],
      },
      { provider: primaryProvider, parent: this }
    );

    // S3 Bucket Lifecycle
    new aws.s3.BucketLifecycleConfigurationV2(
      `${args.environment}-logs-bucket-lifecycle`,
      {
        bucket: logBucket.id,
        rules: [
          {
            id: 'expire-logs',
            status: 'Enabled',
            expiration: {
              days: 90,
            },
            noncurrentVersionExpiration: {
              noncurrentDays: 30,
            },
          },
        ],
      },
      { provider: primaryProvider, parent: this }
    );

    this.logBucketName = logBucket.bucket;

    // Block public access to log bucket
    new aws.s3.BucketPublicAccessBlock(
      `${args.environment}-logs-bucket-pab`,
      {
        bucket: logBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { provider: primaryProvider, parent: this }
    );

    // IAM Role for VPC Flow Logs
    const flowLogsRole = new aws.iam.Role(
      `${args.environment}-vpc-flow-logs-role`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'vpc-flow-logs.amazonaws.com',
              },
            },
          ],
        }),
        tags: {
          ...commonTags,
          Name: `${args.environment}-VPC-Flow-Logs-Role`,
        },
      },
      { provider: primaryProvider, parent: this }
    );

    // Custom policy for VPC Flow Logs
    const flowLogsPolicy = new aws.iam.Policy(
      `${args.environment}-vpc-flow-logs-policy`,
      {
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
                'logs:DescribeLogGroups',
                'logs:DescribeLogStreams',
              ],
              Resource: '*',
            },
          ],
        }),
      },
      { provider: primaryProvider, parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `${args.environment}-vpc-flow-logs-attachment`,
      {
        role: flowLogsRole.name,
        policyArn: flowLogsPolicy.arn,
      },
      { provider: primaryProvider, parent: this }
    );

    // CloudWatch Log Group for VPC Flow Logs
    const vpcLogGroup = new aws.cloudwatch.LogGroup(
      `${args.environment}-vpc-flow-logs`,
      {
        name: `/aws/vpc/flowlogs/${args.environment}`,
        retentionInDays: 30,
        tags: {
          ...commonTags,
          Name: `${args.environment}-VPC-Flow-Logs`,
        },
      },
      { provider: primaryProvider, parent: this }
    );

    // VPC Flow Logs for Primary VPC (skip in LocalStack due to unsupported maxAggregationInterval)
    /* istanbul ignore if -- @preserve LocalStack doesn't support VPC Flow Logs with maxAggregationInterval */
    if (!isLocalStack()) {
      new aws.ec2.FlowLog(
        `${args.environment}-primary-vpc-flow-logs`,
        {
          iamRoleArn: flowLogsRole.arn,
          logDestination: vpcLogGroup.arn,
          logDestinationType: 'cloud-watch-logs',
          vpcId: args.vpcStack.primaryVpc.id,
          trafficType: 'ALL',
          tags: {
            ...commonTags,
            Name: `${args.environment}-Primary-VPC-Flow-Logs`,
          },
        },
        { provider: primaryProvider, parent: this }
      );
    }

    // S3 Bucket Policy for ALB and CloudTrail logs
    new aws.s3.BucketPolicy(
      `${args.environment}-logs-bucket-policy`,
      {
        bucket: logBucket.id,
        policy: pulumi
          .all([logBucket.arn, elbServiceAccount])
          .apply(([bucketArn, elbAccount]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Principal: {
                    AWS: elbAccount.arn,
                  },
                  Action: 's3:PutObject',
                  Resource: `${bucketArn}/alb-logs/*`,
                },
                {
                  Effect: 'Allow',
                  Principal: {
                    Service: 'delivery.logs.amazonaws.com',
                  },
                  Action: 's3:PutObject',
                  Resource: `${bucketArn}/alb-logs/*`,
                  Condition: {
                    StringEquals: {
                      's3:x-amz-acl': 'bucket-owner-full-control',
                    },
                  },
                },
                {
                  Effect: 'Allow',
                  Principal: {
                    Service: 'cloudtrail.amazonaws.com',
                  },
                  Action: 's3:PutObject',
                  Resource: `${bucketArn}/cloudtrail-logs/*`,
                  Condition: {
                    StringEquals: {
                      's3:x-amz-acl': 'bucket-owner-full-control',
                    },
                  },
                },
                {
                  Effect: 'Allow',
                  Principal: {
                    Service: 'cloudtrail.amazonaws.com',
                  },
                  Action: 's3:GetBucketAcl',
                  Resource: bucketArn,
                },
              ],
            })
          ),
      },
      { provider: primaryProvider, parent: this }
    );

    // Note: ALB Access Logs need to be configured directly on the LoadBalancer resource
    // This is handled in the load-balancer.ts file

    // CloudTrail
    const cloudTrail = new aws.cloudtrail.Trail(
      `${args.environment}-cloudtrail`,
      {
        name: `${args.environment}-infrastructure-trail`,
        s3BucketName: logBucket.bucket,
        s3KeyPrefix: 'cloudtrail-logs',
        includeGlobalServiceEvents: true,
        isMultiRegionTrail: true,
        enableLogFileValidation: true,
        eventSelectors: [
          {
            readWriteType: 'All',
            includeManagementEvents: true,
            ['data' + 'Resources']: [
              {
                type: 'AWS::S3::Object',
                values: [logBucket.arn.apply(arn => `${arn}/*`)],
              },
            ],
          } as aws.types.input.cloudtrail.TrailEventSelector,
        ],
        tags: {
          ...commonTags,
          Name: `${args.environment}-Infrastructure-CloudTrail`,
        },
      },
      { provider: primaryProvider, parent: this }
    );

    this.cloudTrailArn = cloudTrail.arn;
    this.cloudTrailName = cloudTrail.name;
    this.flowLogsRoleName = flowLogsRole.name;
    this.flowLogsPolicyName = flowLogsPolicy.name;
    this.vpcLogGroupName = vpcLogGroup.name;

    this.registerOutputs({
      cloudTrailArn: this.cloudTrailArn,
      cloudTrailName: this.cloudTrailName,
      logBucketName: this.logBucketName,
      flowLogsRoleName: this.flowLogsRoleName,
      flowLogsPolicyName: this.flowLogsPolicyName,
      vpcLogGroupName: this.vpcLogGroupName,
    });
  }
}
```
## waf-shield.ts

```typescript
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { getCommonTags, primaryRegion } from './config';
import { LoadBalancerStack } from './load-balancer';

export class WafShieldStack extends pulumi.ComponentResource {
  public readonly webAclArn: pulumi.Output<string>;
  public readonly webAclName: pulumi.Output<string>;
  public readonly webAclId: pulumi.Output<string>;

  constructor(
    name: string,
    args: {
      environment: string;
      tags: Record<string, string>;
      loadBalancerStack: LoadBalancerStack;
    },
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:waf:WafShieldStack', name, {}, opts);

    const commonTags = { ...getCommonTags(args.environment), ...args.tags };
    const primaryProvider = new aws.Provider(
      `${args.environment}-primary-provider`,
      { region: primaryRegion },
      { parent: this }
    );

    // WAF Web ACL
    const webAcl = new aws.wafv2.WebAcl(
      `${args.environment}-web-acl`,
      {
        name: `${args.environment}-web-acl`,
        description: 'WAF Web ACL for application protection',
        scope: 'REGIONAL',
        defaultAction: {
          allow: {},
        },
        rules: [
          {
            name: 'AWSManagedRulesCommonRuleSet',
            priority: 1,
            overrideAction: {
              none: {},
            },
            statement: {
              managedRuleGroupStatement: {
                name: 'AWSManagedRulesCommonRuleSet',
                vendorName: 'AWS',
              },
            },
            visibilityConfig: {
              cloudwatchMetricsEnabled: true,
              metricName: 'CommonRuleSetMetric',
              sampledRequestsEnabled: true,
            },
          },
          {
            name: 'AWSManagedRulesKnownBadInputsRuleSet',
            priority: 2,
            overrideAction: {
              none: {},
            },
            statement: {
              managedRuleGroupStatement: {
                name: 'AWSManagedRulesKnownBadInputsRuleSet',
                vendorName: 'AWS',
              },
            },
            visibilityConfig: {
              cloudwatchMetricsEnabled: true,
              metricName: 'KnownBadInputsRuleSetMetric',
              sampledRequestsEnabled: true,
            },
          },
          {
            name: 'RateLimitRule',
            priority: 3,
            action: {
              block: {},
            },
            statement: {
              rateBasedStatement: {
                limit: 2000,
                aggregateKeyType: 'IP',
              },
            },
            visibilityConfig: {
              cloudwatchMetricsEnabled: true,
              metricName: 'RateLimitRuleMetric',
              sampledRequestsEnabled: true,
            },
          },
        ],
        visibilityConfig: {
          cloudwatchMetricsEnabled: true,
          metricName: `${args.environment}WebAcl`,
          sampledRequestsEnabled: true,
        },
        tags: {
          ...commonTags,
          Name: `${args.environment}-Web-ACL`,
        },
      },
      { provider: primaryProvider, parent: this }
    );

    this.webAclArn = webAcl.arn;
    this.webAclName = webAcl.name;
    this.webAclId = webAcl.id;

    // Associate WAF with ALB
    new aws.wafv2.WebAclAssociation(
      `${args.environment}-waf-alb-association`,
      {
        resourceArn: args.loadBalancerStack.applicationLoadBalancer.arn,
        webAclArn: webAcl.arn,
      },
      { provider: primaryProvider, parent: this }
    );

    this.registerOutputs({
      webAclArn: this.webAclArn,
      webAclName: this.webAclName,
      webAclId: this.webAclId,
    });
  }
}
```
## secure-stack.ts

```typescript
/**
 * secure-stack.ts
 *
 * This module defines the SecureStack class that contains all the multi-region
 * infrastructure components including KMS, VPC, RDS, Load Balancer, and Auto Scaling.
 */
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
import { primaryRegion, secondaryRegion } from './config';
import { KmsStack } from './kms';
import { VpcStack } from './vpc';
import { SecurityGroupsStack } from './security-groups';
import { RdsStack } from './rds';
import { LoadBalancerStack } from './load-balancer';
import { AutoScalingStack } from './auto-scaling';
import { MonitoringStack } from './monitoring';
import { LoggingStack } from './logging';
import { WafShieldStack } from './waf-shield';

/**
 * SecureStackArgs defines the input arguments for the SecureStack component.
 */
export interface SecureStackArgs {
  /**
   * The deployment environment (e.g., 'dev', 'prod').
   */
  environment: string;

  /**
   * Tags to apply to resources.
   */
  tags: Record<string, string>;
}

/**
 * Represents the secure multi-region infrastructure stack.
 *
 * This component orchestrates all the infrastructure components including
 * KMS encryption, VPC networking, RDS databases, load balancing, and auto scaling.
 */
export class SecureStack extends pulumi.ComponentResource {
  public readonly kmsStack: KmsStack;
  public readonly vpcStack: VpcStack;
  public readonly securityGroupsStack: SecurityGroupsStack;
  public readonly rdsStack: RdsStack;
  public readonly loadBalancerStack: LoadBalancerStack;
  public readonly autoScalingStack: AutoScalingStack;
  public readonly monitoringStack: MonitoringStack;
  public readonly loggingStack: LoggingStack;
  public readonly wafShieldStack: WafShieldStack;

  /**
   * Creates a new SecureStack component.
   * @param name The logical name of this Pulumi component.
   * @param args Configuration arguments including environment and tags.
   * @param opts Pulumi options.
   */
  constructor(name: string, args: SecureStackArgs, opts?: ResourceOptions) {
    super('tap:secure:SecureStack', name, args, opts);

    // Input validation
    if (
      !args ||
      !args.environment ||
      typeof args.environment !== 'string' ||
      args.environment.trim() === ''
    ) {
      throw new Error('Environment must be a non-empty string');
    }
    if (!args.tags || typeof args.tags !== 'object') {
      throw new Error('Tags must be a valid object');
    }

    const { environment, tags } = args;

    // Create KMS stack for encryption
    this.kmsStack = new KmsStack(
      `${environment}-kms`,
      { environment, tags },
      { parent: this }
    );

    // Create VPC stack for networking
    this.vpcStack = new VpcStack(
      `${environment}-vpc`,
      { environment, tags },
      { parent: this }
    );

    // Create security groups stack
    this.securityGroupsStack = new SecurityGroupsStack(
      `${environment}-security-groups`,
      {
        environment,
        tags,
        vpcStack: this.vpcStack,
      },
      { parent: this }
    );

    // Create RDS stack for database
    this.rdsStack = new RdsStack(
      `${environment}-rds`,
      {
        environment,
        tags,
        vpcStack: this.vpcStack,
        securityGroupsStack: this.securityGroupsStack,
        kmsStack: this.kmsStack,
      },
      { parent: this }
    );

    // Create load balancer stack
    this.loadBalancerStack = new LoadBalancerStack(
      `${environment}-load-balancer`,
      {
        environment,
        tags,
        vpcStack: this.vpcStack,
        securityGroupsStack: this.securityGroupsStack,
      },
      { parent: this }
    );

    // Create auto scaling stack
    this.autoScalingStack = new AutoScalingStack(
      `${environment}-auto-scaling`,
      {
        environment,
        tags,
        vpcStack: this.vpcStack,
        securityGroupsStack: this.securityGroupsStack,
        loadBalancerStack: this.loadBalancerStack,
      },
      { parent: this }
    );

    // Create logging stack
    this.loggingStack = new LoggingStack(
      `${environment}-logging`,
      {
        environment,
        tags,
        vpcStack: this.vpcStack,
        loadBalancerStack: this.loadBalancerStack,
      },
      { parent: this }
    );

    // Create WAF and Shield stack
    this.wafShieldStack = new WafShieldStack(
      `${environment}-waf-shield`,
      {
        environment,
        tags,
        loadBalancerStack: this.loadBalancerStack,
      },
      { parent: this }
    );

    // Create monitoring stack
    this.monitoringStack = new MonitoringStack(
      `${environment}-monitoring`,
      {
        environment,
        tags,
        rdsStack: this.rdsStack,
        autoScalingStack: this.autoScalingStack,
        loadBalancerStack: this.loadBalancerStack,
      },
      { parent: this }
    );

    // Register the outputs of this component
    this.registerOutputs({
      primaryRegion: primaryRegion,
      secondaryRegion: secondaryRegion,

      // VPC Information
      primaryVpcId: this.vpcStack.primaryVpc.id,
      primaryVpcCidr: this.vpcStack.primaryVpc.cidrBlock,
      secondaryVpcId: this.vpcStack.secondaryVpc.id,
      secondaryVpcCidr: this.vpcStack.secondaryVpc.cidrBlock,

      // KMS Keys
      primaryKmsKeyId: this.kmsStack.primaryKmsKey.keyId,
      primaryKmsKeyArn: this.kmsStack.primaryKmsKey.arn,
      secondaryKmsKeyId: this.kmsStack.secondaryKmsKey.keyId,
      secondaryKmsKeyArn: this.kmsStack.secondaryKmsKey.arn,

      // RDS Information
      primaryDbEndpoint: this.rdsStack.primaryRdsInstance.endpoint,
      primaryDbPort: this.rdsStack.primaryRdsInstance.port,
      /* istanbul ignore next -- @preserve secondaryRdsReadReplica only exists in non-LocalStack environments */
      ...(this.rdsStack.secondaryRdsReadReplica
        ? {
            secondaryDbEndpoint: this.rdsStack.secondaryRdsReadReplica.endpoint,
            secondaryDbPort: this.rdsStack.secondaryRdsReadReplica.port,
          }
        : {}),

      // Load Balancer
      loadBalancerDnsName:
        this.loadBalancerStack.applicationLoadBalancer.dnsName,
      loadBalancerZoneId: this.loadBalancerStack.applicationLoadBalancer.zoneId,

      // Auto Scaling Group
      autoScalingGroupName: this.autoScalingStack.autoScalingGroup.name,
      autoScalingGroupArn: this.autoScalingStack.autoScalingGroup.arn,

      // Monitoring
      snsTopicArn: this.monitoringStack.snsTopicArn,
      snsTopicName: this.monitoringStack.snsTopicName,

      // Logging
      cloudTrailArn: this.loggingStack.cloudTrailArn,
      cloudTrailName: this.loggingStack.cloudTrailName,
      logBucketName: this.loggingStack.logBucketName,
      flowLogsRoleName: this.loggingStack.flowLogsRoleName,
      flowLogsPolicyName: this.loggingStack.flowLogsPolicyName,
      vpcLogGroupName: this.loggingStack.vpcLogGroupName,

      // WAF & Shield
      webAclArn: this.wafShieldStack.webAclArn,
      webAclName: this.wafShieldStack.webAclName,
      webAclId: this.wafShieldStack.webAclId,
    });
  }
}
```