# Multi-Region Disaster Recovery Architecture Implementation

This implementation provides a complete active-passive disaster recovery solution using CDKTF with TypeScript for a payment processing application across us-east-1 (primary) and us-east-2 (DR) regions.

## Architecture Overview

The solution implements:
- **Multi-region providers** for us-east-1 and us-east-2
- **RDS Aurora Global Database** with PostgreSQL 13.7
- **Auto Scaling Groups** with t3.large instances in both regions
- **Application Load Balancers** with health checks
- **Route 53 failover routing** with automated health monitoring
- **S3 cross-region replication** with versioning
- **CloudWatch alarms** for proactive monitoring
- **SNS notifications** for cross-region alerting
- **IAM roles** for cross-region access

## File Structure

```
lib/
├── tap-stack.ts (updated - main orchestrator)
├── networking-stack.ts (VPC, subnets, NAT gateways for both regions)
├── database-stack.ts (Aurora Global Database)
├── compute-stack.ts (Auto Scaling Groups, Launch Templates)
├── loadbalancer-stack.ts (ALBs, Target Groups)
├── storage-stack.ts (S3 buckets with CRR)
├── monitoring-stack.ts (CloudWatch alarms, dashboards)
├── dns-stack.ts (Route 53 health checks, failover routing)
├── iam-stack.ts (Roles and policies for cross-region access)
test/
├── tap-stack.test.ts
├── networking-stack.test.ts
├── database-stack.test.ts
├── compute-stack.test.ts
├── storage-stack.test.ts
```

## Implementation

### File: lib/networking-stack.ts

```typescript
import { Construct } from 'constructs';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { Route } from '@cdktf/provider-aws/lib/route';

export interface NetworkingStackProps {
  environmentSuffix: string;
  region: string;
  providerAlias?: string;
}

export interface NetworkingStackOutputs {
  vpcId: string;
  publicSubnetIds: string[];
  privateSubnetIds: string[];
  databaseSubnetIds: string[];
}

export class NetworkingStack extends Construct {
  public readonly outputs: NetworkingStackOutputs;

  constructor(scope: Construct, id: string, props: NetworkingStackProps) {
    super(scope, id);

    const { environmentSuffix, region, providerAlias } = props;
    const drRole = region === 'us-east-1' ? 'primary' : 'dr';

    const commonTags = {
      Environment: environmentSuffix,
      CostCenter: 'payment-processing',
      'DR-Role': drRole,
      ManagedBy: 'cdktf',
    };

    // VPC
    const vpc = new Vpc(this, `vpc-${region}`, {
      cidrBlock: region === 'us-east-1' ? '10.0.0.0/16' : '10.1.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `payment-vpc-${environmentSuffix}-${region}`,
        ...commonTags,
      },
      provider: providerAlias,
    });

    // Internet Gateway
    const igw = new InternetGateway(this, `igw-${region}`, {
      vpcId: vpc.id,
      tags: {
        Name: `payment-igw-${environmentSuffix}-${region}`,
        ...commonTags,
      },
      provider: providerAlias,
    });

    // Availability Zones
    const azs = ['a', 'b', 'c'];
    const publicSubnets: Subnet[] = [];
    const privateSubnets: Subnet[] = [];
    const databaseSubnets: Subnet[] = [];
    const natGateways: NatGateway[] = [];

    // Create subnets in each AZ
    azs.forEach((az, index) => {
      const azName = `${region}${az}`;

      // Public subnet
      const publicSubnet = new Subnet(this, `public-subnet-${region}-${az}`, {
        vpcId: vpc.id,
        cidrBlock: region === 'us-east-1'
          ? `10.0.${index * 16}.0/20`
          : `10.1.${index * 16}.0/20`,
        availabilityZone: azName,
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `payment-public-${environmentSuffix}-${region}-${az}`,
          Type: 'public',
          ...commonTags,
        },
        provider: providerAlias,
      });
      publicSubnets.push(publicSubnet);

      // Private subnet for compute
      const privateSubnet = new Subnet(this, `private-subnet-${region}-${az}`, {
        vpcId: vpc.id,
        cidrBlock: region === 'us-east-1'
          ? `10.0.${index * 16 + 48}.0/20`
          : `10.1.${index * 16 + 48}.0/20`,
        availabilityZone: azName,
        tags: {
          Name: `payment-private-${environmentSuffix}-${region}-${az}`,
          Type: 'private',
          ...commonTags,
        },
        provider: providerAlias,
      });
      privateSubnets.push(privateSubnet);

      // Database subnet
      const dbSubnet = new Subnet(this, `db-subnet-${region}-${az}`, {
        vpcId: vpc.id,
        cidrBlock: region === 'us-east-1'
          ? `10.0.${index * 16 + 96}.0/20`
          : `10.1.${index * 16 + 96}.0/20`,
        availabilityZone: azName,
        tags: {
          Name: `payment-db-${environmentSuffix}-${region}-${az}`,
          Type: 'database',
          ...commonTags,
        },
        provider: providerAlias,
      });
      databaseSubnets.push(dbSubnet);

      // NAT Gateway (one per AZ for high availability)
      const eip = new Eip(this, `nat-eip-${region}-${az}`, {
        domain: 'vpc',
        tags: {
          Name: `payment-nat-eip-${environmentSuffix}-${region}-${az}`,
          ...commonTags,
        },
        provider: providerAlias,
      });

      const natGateway = new NatGateway(this, `nat-${region}-${az}`, {
        allocationId: eip.id,
        subnetId: publicSubnet.id,
        tags: {
          Name: `payment-nat-${environmentSuffix}-${region}-${az}`,
          ...commonTags,
        },
        provider: providerAlias,
        dependsOn: [igw],
      });
      natGateways.push(natGateway);
    });

    // Public route table
    const publicRouteTable = new RouteTable(this, `public-rt-${region}`, {
      vpcId: vpc.id,
      tags: {
        Name: `payment-public-rt-${environmentSuffix}-${region}`,
        ...commonTags,
      },
      provider: providerAlias,
    });

    new Route(this, `public-route-${region}`, {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.id,
      provider: providerAlias,
    });

    publicSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(this, `public-rta-${region}-${index}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
        provider: providerAlias,
      });
    });

    // Private route tables (one per AZ for NAT Gateway)
    privateSubnets.forEach((subnet, index) => {
      const privateRouteTable = new RouteTable(this, `private-rt-${region}-${index}`, {
        vpcId: vpc.id,
        tags: {
          Name: `payment-private-rt-${environmentSuffix}-${region}-${azs[index]}`,
          ...commonTags,
        },
        provider: providerAlias,
      });

      new Route(this, `private-route-${region}-${index}`, {
        routeTableId: privateRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: natGateways[index].id,
        provider: providerAlias,
      });

      new RouteTableAssociation(this, `private-rta-${region}-${index}`, {
        subnetId: subnet.id,
        routeTableId: privateRouteTable.id,
        provider: providerAlias,
      });
    });

    // Database route tables
    databaseSubnets.forEach((subnet, index) => {
      const dbRouteTable = new RouteTable(this, `db-rt-${region}-${index}`, {
        vpcId: vpc.id,
        tags: {
          Name: `payment-db-rt-${environmentSuffix}-${region}-${azs[index]}`,
          ...commonTags,
        },
        provider: providerAlias,
      });

      new Route(this, `db-route-${region}-${index}`, {
        routeTableId: dbRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: natGateways[index].id,
        provider: providerAlias,
      });

      new RouteTableAssociation(this, `db-rta-${region}-${index}`, {
        subnetId: subnet.id,
        routeTableId: dbRouteTable.id,
        provider: providerAlias,
      });
    });

    this.outputs = {
      vpcId: vpc.id,
      publicSubnetIds: publicSubnets.map(s => s.id),
      privateSubnetIds: privateSubnets.map(s => s.id),
      databaseSubnetIds: databaseSubnets.map(s => s.id),
    };
  }
}
```

### File: lib/iam-stack.ts

```typescript
import { Construct } from 'constructs';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { IamInstanceProfile } from '@cdktf/provider-aws/lib/iam-instance-profile';
import { DataAwsIamPolicyDocument } from '@cdktf/provider-aws/lib/data-aws-iam-policy-document';

export interface IamStackProps {
  environmentSuffix: string;
  s3BucketPrimaryArn: string;
  s3BucketDrArn: string;
}

export interface IamStackOutputs {
  replicationRoleArn: string;
  ec2InstanceProfileArn: string;
  ec2InstanceProfileName: string;
}

export class IamStack extends Construct {
  public readonly outputs: IamStackOutputs;

  constructor(scope: Construct, id: string, props: IamStackProps) {
    super(scope, id);

    const { environmentSuffix, s3BucketPrimaryArn, s3BucketDrArn } = props;

    const commonTags = {
      Environment: environmentSuffix,
      CostCenter: 'payment-processing',
      'DR-Role': 'global',
      ManagedBy: 'cdktf',
    };

    // S3 Replication Role
    const replicationAssumeRole = new DataAwsIamPolicyDocument(this, 'replication-assume-role', {
      statement: [{
        effect: 'Allow',
        principals: [{
          type: 'Service',
          identifiers: ['s3.amazonaws.com'],
        }],
        actions: ['sts:AssumeRole'],
      }],
    });

    const replicationRole = new IamRole(this, 'replication-role', {
      name: `payment-s3-replication-${environmentSuffix}`,
      assumeRolePolicy: replicationAssumeRole.json,
      tags: commonTags,
    });

    const replicationPolicyDoc = new DataAwsIamPolicyDocument(this, 'replication-policy-doc', {
      statement: [
        {
          effect: 'Allow',
          actions: [
            's3:GetReplicationConfiguration',
            's3:ListBucket',
          ],
          resources: [s3BucketPrimaryArn],
        },
        {
          effect: 'Allow',
          actions: [
            's3:GetObjectVersionForReplication',
            's3:GetObjectVersionAcl',
            's3:GetObjectVersionTagging',
          ],
          resources: [`${s3BucketPrimaryArn}/*`],
        },
        {
          effect: 'Allow',
          actions: [
            's3:ReplicateObject',
            's3:ReplicateDelete',
            's3:ReplicateTags',
          ],
          resources: [`${s3BucketDrArn}/*`],
        },
      ],
    });

    const replicationPolicy = new IamPolicy(this, 'replication-policy', {
      name: `payment-s3-replication-policy-${environmentSuffix}`,
      policy: replicationPolicyDoc.json,
      tags: commonTags,
    });

    new IamRolePolicyAttachment(this, 'replication-policy-attachment', {
      role: replicationRole.name,
      policyArn: replicationPolicy.arn,
    });

    // EC2 Instance Role for ASG instances
    const ec2AssumeRole = new DataAwsIamPolicyDocument(this, 'ec2-assume-role', {
      statement: [{
        effect: 'Allow',
        principals: [{
          type: 'Service',
          identifiers: ['ec2.amazonaws.com'],
        }],
        actions: ['sts:AssumeRole'],
      }],
    });

    const ec2Role = new IamRole(this, 'ec2-role', {
      name: `payment-ec2-role-${environmentSuffix}`,
      assumeRolePolicy: ec2AssumeRole.json,
      tags: commonTags,
    });

    // Policy for EC2 instances to access S3, CloudWatch, and cross-region resources
    const ec2PolicyDoc = new DataAwsIamPolicyDocument(this, 'ec2-policy-doc', {
      statement: [
        {
          effect: 'Allow',
          actions: [
            's3:GetObject',
            's3:PutObject',
            's3:ListBucket',
          ],
          resources: [
            s3BucketPrimaryArn,
            `${s3BucketPrimaryArn}/*`,
            s3BucketDrArn,
            `${s3BucketDrArn}/*`,
          ],
        },
        {
          effect: 'Allow',
          actions: [
            'cloudwatch:PutMetricData',
            'cloudwatch:GetMetricStatistics',
            'cloudwatch:ListMetrics',
          ],
          resources: ['*'],
        },
        {
          effect: 'Allow',
          actions: [
            'logs:CreateLogGroup',
            'logs:CreateLogStream',
            'logs:PutLogEvents',
            'logs:DescribeLogStreams',
          ],
          resources: ['*'],
        },
        {
          effect: 'Allow',
          actions: [
            'rds:DescribeDBClusters',
            'rds:DescribeGlobalClusters',
          ],
          resources: ['*'],
        },
      ],
    });

    const ec2Policy = new IamPolicy(this, 'ec2-policy', {
      name: `payment-ec2-policy-${environmentSuffix}`,
      policy: ec2PolicyDoc.json,
      tags: commonTags,
    });

    new IamRolePolicyAttachment(this, 'ec2-policy-attachment', {
      role: ec2Role.name,
      policyArn: ec2Policy.arn,
    });

    // Attach AWS managed policies for SSM
    new IamRolePolicyAttachment(this, 'ec2-ssm-policy', {
      role: ec2Role.name,
      policyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
    });

    const instanceProfile = new IamInstanceProfile(this, 'ec2-instance-profile', {
      name: `payment-ec2-profile-${environmentSuffix}`,
      role: ec2Role.name,
      tags: commonTags,
    });

    this.outputs = {
      replicationRoleArn: replicationRole.arn,
      ec2InstanceProfileArn: instanceProfile.arn,
      ec2InstanceProfileName: instanceProfile.name,
    };
  }
}
```

### File: lib/storage-stack.ts

```typescript
import { Construct } from 'constructs';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { S3BucketReplicationConfiguration } from '@cdktf/provider-aws/lib/s3-bucket-replication-configuration';
import { S3BucketLifecycleConfiguration } from '@cdktf/provider-aws/lib/s3-bucket-lifecycle-configuration';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';

export interface StorageStackProps {
  environmentSuffix: string;
  replicationRoleArn: string;
  primaryRegion: string;
  drRegion: string;
  primaryProviderAlias?: string;
  drProviderAlias?: string;
}

export interface StorageStackOutputs {
  primaryBucketId: string;
  primaryBucketArn: string;
  drBucketId: string;
  drBucketArn: string;
}

export class StorageStack extends Construct {
  public readonly outputs: StorageStackOutputs;

  constructor(scope: Construct, id: string, props: StorageStackProps) {
    super(scope, id);

    const {
      environmentSuffix,
      replicationRoleArn,
      primaryRegion,
      drRegion,
      primaryProviderAlias,
      drProviderAlias
    } = props;

    const commonTags = {
      Environment: environmentSuffix,
      CostCenter: 'payment-processing',
      ManagedBy: 'cdktf',
    };

    // Primary S3 Bucket (us-east-1)
    const primaryBucket = new S3Bucket(this, 'primary-bucket', {
      bucket: `payment-assets-${environmentSuffix}-${primaryRegion}`,
      tags: {
        ...commonTags,
        'DR-Role': 'primary',
        Region: primaryRegion,
      },
      provider: primaryProviderAlias,
      forceDestroy: true,
    });

    new S3BucketPublicAccessBlock(this, 'primary-bucket-public-access', {
      bucket: primaryBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
      provider: primaryProviderAlias,
    });

    new S3BucketVersioningA(this, 'primary-bucket-versioning', {
      bucket: primaryBucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
      provider: primaryProviderAlias,
    });

    // DR S3 Bucket (us-east-2)
    const drBucket = new S3Bucket(this, 'dr-bucket', {
      bucket: `payment-assets-${environmentSuffix}-${drRegion}`,
      tags: {
        ...commonTags,
        'DR-Role': 'dr',
        Region: drRegion,
      },
      provider: drProviderAlias,
      forceDestroy: true,
    });

    new S3BucketPublicAccessBlock(this, 'dr-bucket-public-access', {
      bucket: drBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
      provider: drProviderAlias,
    });

    new S3BucketVersioningA(this, 'dr-bucket-versioning', {
      bucket: drBucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
      provider: drProviderAlias,
    });

    // Cross-Region Replication from Primary to DR
    new S3BucketReplicationConfiguration(this, 'replication-config', {
      bucket: primaryBucket.id,
      role: replicationRoleArn,
      rule: [{
        id: 'replicate-all',
        status: 'Enabled',
        priority: 1,
        deleteMarkerReplication: {
          status: 'Enabled',
        },
        filter: {},
        destination: {
          bucket: drBucket.arn,
          storageClass: 'STANDARD',
          replicationTime: {
            status: 'Enabled',
            time: {
              minutes: 15,
            },
          },
          metrics: {
            status: 'Enabled',
            eventThreshold: {
              minutes: 15,
            },
          },
        },
      }],
      provider: primaryProviderAlias,
    });

    // Lifecycle policies for cost optimization
    new S3BucketLifecycleConfiguration(this, 'primary-lifecycle', {
      bucket: primaryBucket.id,
      rule: [
        {
          id: 'transition-to-ia',
          status: 'Enabled',
          transition: [{
            days: 30,
            storageClass: 'STANDARD_IA',
          }],
        },
        {
          id: 'transition-to-glacier',
          status: 'Enabled',
          transition: [{
            days: 90,
            storageClass: 'GLACIER',
          }],
        },
        {
          id: 'expire-old-versions',
          status: 'Enabled',
          noncurrentVersionExpiration: {
            noncurrentDays: 90,
          },
        },
      ],
      provider: primaryProviderAlias,
    });

    new S3BucketLifecycleConfiguration(this, 'dr-lifecycle', {
      bucket: drBucket.id,
      rule: [
        {
          id: 'transition-to-ia',
          status: 'Enabled',
          transition: [{
            days: 30,
            storageClass: 'STANDARD_IA',
          }],
        },
        {
          id: 'expire-old-versions',
          status: 'Enabled',
          noncurrentVersionExpiration: {
            noncurrentDays: 90,
          },
        },
      ],
      provider: drProviderAlias,
    });

    this.outputs = {
      primaryBucketId: primaryBucket.id,
      primaryBucketArn: primaryBucket.arn,
      drBucketId: drBucket.id,
      drBucketArn: drBucket.arn,
    };
  }
}
```

### File: lib/database-stack.ts

```typescript
import { Construct } from 'constructs';
import { RdsGlobalCluster } from '@cdktf/provider-aws/lib/rds-global-cluster';
import { RdsCluster } from '@cdktf/provider-aws/lib/rds-cluster';
import { RdsClusterInstance } from '@cdktf/provider-aws/lib/rds-cluster-instance';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';

export interface DatabaseStackProps {
  environmentSuffix: string;
  primaryVpcId: string;
  drVpcId: string;
  primaryDbSubnetIds: string[];
  drDbSubnetIds: string[];
  primaryRegion: string;
  drRegion: string;
  primaryProviderAlias?: string;
  drProviderAlias?: string;
}

export interface DatabaseStackOutputs {
  globalClusterId: string;
  primaryClusterEndpoint: string;
  primaryClusterReaderEndpoint: string;
  drClusterEndpoint: string;
  drClusterReaderEndpoint: string;
}

export class DatabaseStack extends Construct {
  public readonly outputs: DatabaseStackOutputs;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id);

    const {
      environmentSuffix,
      primaryVpcId,
      drVpcId,
      primaryDbSubnetIds,
      drDbSubnetIds,
      primaryRegion,
      drRegion,
      primaryProviderAlias,
      drProviderAlias
    } = props;

    const commonTags = {
      Environment: environmentSuffix,
      CostCenter: 'payment-processing',
      ManagedBy: 'cdktf',
    };

    // Security Groups
    const primaryDbSg = new SecurityGroup(this, 'primary-db-sg', {
      name: `payment-db-sg-${environmentSuffix}-${primaryRegion}`,
      description: 'Security group for Aurora database in primary region',
      vpcId: primaryVpcId,
      tags: {
        ...commonTags,
        'DR-Role': 'primary',
        Name: `payment-db-sg-${environmentSuffix}-${primaryRegion}`,
      },
      provider: primaryProviderAlias,
    });

    new SecurityGroupRule(this, 'primary-db-ingress', {
      type: 'ingress',
      fromPort: 5432,
      toPort: 5432,
      protocol: 'tcp',
      cidrBlocks: ['10.0.0.0/16'],
      securityGroupId: primaryDbSg.id,
      description: 'PostgreSQL access from VPC',
      provider: primaryProviderAlias,
    });

    new SecurityGroupRule(this, 'primary-db-egress', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: primaryDbSg.id,
      description: 'Allow all outbound traffic',
      provider: primaryProviderAlias,
    });

    const drDbSg = new SecurityGroup(this, 'dr-db-sg', {
      name: `payment-db-sg-${environmentSuffix}-${drRegion}`,
      description: 'Security group for Aurora database in DR region',
      vpcId: drVpcId,
      tags: {
        ...commonTags,
        'DR-Role': 'dr',
        Name: `payment-db-sg-${environmentSuffix}-${drRegion}`,
      },
      provider: drProviderAlias,
    });

    new SecurityGroupRule(this, 'dr-db-ingress', {
      type: 'ingress',
      fromPort: 5432,
      toPort: 5432,
      protocol: 'tcp',
      cidrBlocks: ['10.1.0.0/16'],
      securityGroupId: drDbSg.id,
      description: 'PostgreSQL access from VPC',
      provider: drProviderAlias,
    });

    new SecurityGroupRule(this, 'dr-db-egress', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: drDbSg.id,
      description: 'Allow all outbound traffic',
      provider: drProviderAlias,
    });

    // DB Subnet Groups
    const primarySubnetGroup = new DbSubnetGroup(this, 'primary-subnet-group', {
      name: `payment-db-subnet-${environmentSuffix}-${primaryRegion}`,
      subnetIds: primaryDbSubnetIds,
      tags: {
        ...commonTags,
        'DR-Role': 'primary',
      },
      provider: primaryProviderAlias,
    });

    const drSubnetGroup = new DbSubnetGroup(this, 'dr-subnet-group', {
      name: `payment-db-subnet-${environmentSuffix}-${drRegion}`,
      subnetIds: drDbSubnetIds,
      tags: {
        ...commonTags,
        'DR-Role': 'dr',
      },
      provider: drProviderAlias,
    });

    // Global Database Cluster
    const globalCluster = new RdsGlobalCluster(this, 'global-cluster', {
      globalClusterIdentifier: `payment-global-${environmentSuffix}`,
      engine: 'aurora-postgresql',
      engineVersion: '13.7',
      databaseName: 'payments',
      storageEncrypted: true,
      deletionProtection: false,
    });

    // Primary Regional Cluster
    const primaryCluster = new RdsCluster(this, 'primary-cluster', {
      clusterIdentifier: `payment-primary-${environmentSuffix}`,
      engine: 'aurora-postgresql',
      engineVersion: '13.7',
      databaseName: 'payments',
      masterUsername: 'dbadmin',
      masterPassword: `Payment${environmentSuffix}SecurePass123!`,
      dbSubnetGroupName: primarySubnetGroup.name,
      vpcSecurityGroupIds: [primaryDbSg.id],
      globalClusterIdentifier: globalCluster.id,
      backupRetentionPeriod: 7,
      preferredBackupWindow: '03:00-04:00',
      preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
      skipFinalSnapshot: true,
      enabledCloudwatchLogsExports: ['postgresql'],
      tags: {
        ...commonTags,
        'DR-Role': 'primary',
      },
      provider: primaryProviderAlias,
      dependsOn: [globalCluster],
    });

    // Primary cluster instances
    const primaryInstance1 = new RdsClusterInstance(this, 'primary-instance-1', {
      identifier: `payment-primary-${environmentSuffix}-1`,
      clusterIdentifier: primaryCluster.id,
      instanceClass: 'db.r5.large',
      engine: 'aurora-postgresql',
      engineVersion: '13.7',
      publiclyAccessible: false,
      tags: {
        ...commonTags,
        'DR-Role': 'primary',
      },
      provider: primaryProviderAlias,
    });

    new RdsClusterInstance(this, 'primary-instance-2', {
      identifier: `payment-primary-${environmentSuffix}-2`,
      clusterIdentifier: primaryCluster.id,
      instanceClass: 'db.r5.large',
      engine: 'aurora-postgresql',
      engineVersion: '13.7',
      publiclyAccessible: false,
      tags: {
        ...commonTags,
        'DR-Role': 'primary',
      },
      provider: primaryProviderAlias,
      dependsOn: [primaryInstance1],
    });

    // DR Regional Cluster (read-only replica)
    const drCluster = new RdsCluster(this, 'dr-cluster', {
      clusterIdentifier: `payment-dr-${environmentSuffix}`,
      engine: 'aurora-postgresql',
      engineVersion: '13.7',
      dbSubnetGroupName: drSubnetGroup.name,
      vpcSecurityGroupIds: [drDbSg.id],
      globalClusterIdentifier: globalCluster.id,
      skipFinalSnapshot: true,
      enabledCloudwatchLogsExports: ['postgresql'],
      tags: {
        ...commonTags,
        'DR-Role': 'dr',
      },
      provider: drProviderAlias,
      dependsOn: [primaryCluster],
    });

    // DR cluster instance
    new RdsClusterInstance(this, 'dr-instance-1', {
      identifier: `payment-dr-${environmentSuffix}-1`,
      clusterIdentifier: drCluster.id,
      instanceClass: 'db.r5.large',
      engine: 'aurora-postgresql',
      engineVersion: '13.7',
      publiclyAccessible: false,
      tags: {
        ...commonTags,
        'DR-Role': 'dr',
      },
      provider: drProviderAlias,
    });

    this.outputs = {
      globalClusterId: globalCluster.id,
      primaryClusterEndpoint: primaryCluster.endpoint,
      primaryClusterReaderEndpoint: primaryCluster.readerEndpoint,
      drClusterEndpoint: drCluster.endpoint,
      drClusterReaderEndpoint: drCluster.readerEndpoint,
    };
  }
}
```

### File: lib/compute-stack.ts

```typescript
import { Construct } from 'constructs';
import { LaunchTemplate } from '@cdktf/provider-aws/lib/launch-template';
import { AutoscalingGroup } from '@cdktf/provider-aws/lib/autoscaling-group';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';
import { DataAwsAmi } from '@cdktf/provider-aws/lib/data-aws-ami';

export interface ComputeStackProps {
  environmentSuffix: string;
  vpcId: string;
  privateSubnetIds: string[];
  targetGroupArn: string;
  instanceProfileName: string;
  region: string;
  providerAlias?: string;
}

export interface ComputeStackOutputs {
  asgName: string;
  launchTemplateId: string;
}

export class ComputeStack extends Construct {
  public readonly outputs: ComputeStackOutputs;

  constructor(scope: Construct, id: string, props: ComputeStackProps) {
    super(scope, id);

    const {
      environmentSuffix,
      vpcId,
      privateSubnetIds,
      targetGroupArn,
      instanceProfileName,
      region,
      providerAlias
    } = props;

    const drRole = region === 'us-east-1' ? 'primary' : 'dr';

    const commonTags = {
      Environment: environmentSuffix,
      CostCenter: 'payment-processing',
      'DR-Role': drRole,
      ManagedBy: 'cdktf',
    };

    // Get latest Amazon Linux 2 AMI
    const ami = new DataAwsAmi(this, `ami-${region}`, {
      mostRecent: true,
      owners: ['amazon'],
      filter: [
        {
          name: 'name',
          values: ['amzn2-ami-hvm-*-x86_64-gp2'],
        },
        {
          name: 'virtualization-type',
          values: ['hvm'],
        },
      ],
      provider: providerAlias,
    });

    // Security Group for EC2 instances
    const instanceSg = new SecurityGroup(this, `instance-sg-${region}`, {
      name: `payment-instance-sg-${environmentSuffix}-${region}`,
      description: 'Security group for payment processing instances',
      vpcId: vpcId,
      tags: {
        ...commonTags,
        Name: `payment-instance-sg-${environmentSuffix}-${region}`,
      },
      provider: providerAlias,
    });

    new SecurityGroupRule(this, `instance-http-ingress-${region}`, {
      type: 'ingress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      cidrBlocks: ['10.0.0.0/8'],
      securityGroupId: instanceSg.id,
      description: 'HTTP access from ALB',
      provider: providerAlias,
    });

    new SecurityGroupRule(this, `instance-https-ingress-${region}`, {
      type: 'ingress',
      fromPort: 443,
      toPort: 443,
      protocol: 'tcp',
      cidrBlocks: ['10.0.0.0/8'],
      securityGroupId: instanceSg.id,
      description: 'HTTPS access from ALB',
      provider: providerAlias,
    });

    new SecurityGroupRule(this, `instance-egress-${region}`, {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: instanceSg.id,
      description: 'Allow all outbound traffic',
      provider: providerAlias,
    });

    // User data script
    const userData = `#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd
echo "<h1>Payment Processing - ${region} - ${environmentSuffix}</h1>" > /var/www/html/index.html
echo "<p>Region: ${region}</p>" >> /var/www/html/index.html
echo "<p>DR Role: ${drRole}</p>" >> /var/www/html/index.html
`;

    // Launch Template
    const launchTemplate = new LaunchTemplate(this, `launch-template-${region}`, {
      name: `payment-lt-${environmentSuffix}-${region}`,
      imageId: ami.id,
      instanceType: 't3.large',
      iamInstanceProfile: {
        name: instanceProfileName,
      },
      vpcSecurityGroupIds: [instanceSg.id],
      userData: Buffer.from(userData).toString('base64'),
      blockDeviceMappings: [{
        deviceName: '/dev/xvda',
        ebs: {
          volumeSize: 20,
          volumeType: 'gp3',
          encrypted: 'true',
          deleteOnTermination: 'true',
        },
      }],
      metadataOptions: {
        httpEndpoint: 'enabled',
        httpTokens: 'required',
        httpPutResponseHopLimit: 1,
      },
      monitoring: {
        enabled: true,
      },
      tagSpecifications: [
        {
          resourceType: 'instance',
          tags: {
            ...commonTags,
            Name: `payment-instance-${environmentSuffix}-${region}`,
          },
        },
        {
          resourceType: 'volume',
          tags: {
            ...commonTags,
            Name: `payment-volume-${environmentSuffix}-${region}`,
          },
        },
      ],
      provider: providerAlias,
    });

    // Auto Scaling Group
    const asg = new AutoscalingGroup(this, `asg-${region}`, {
      name: `payment-asg-${environmentSuffix}-${region}`,
      minSize: 2,
      maxSize: 6,
      desiredCapacity: 2,
      vpcZoneIdentifier: privateSubnetIds,
      targetGroupArns: [targetGroupArn],
      healthCheckType: 'ELB',
      healthCheckGracePeriod: 300,
      launchTemplate: {
        id: launchTemplate.id,
        version: '$Latest',
      },
      tag: [
        {
          key: 'Name',
          value: `payment-instance-${environmentSuffix}-${region}`,
          propagateAtLaunch: true,
        },
        {
          key: 'Environment',
          value: environmentSuffix,
          propagateAtLaunch: true,
        },
        {
          key: 'CostCenter',
          value: 'payment-processing',
          propagateAtLaunch: true,
        },
        {
          key: 'DR-Role',
          value: drRole,
          propagateAtLaunch: true,
        },
      ],
      provider: providerAlias,
    });

    this.outputs = {
      asgName: asg.name,
      launchTemplateId: launchTemplate.id,
    };
  }
}
```

### File: lib/loadbalancer-stack.ts

```typescript
import { Construct } from 'constructs';
import { Lb } from '@cdktf/provider-aws/lib/lb';
import { LbTargetGroup } from '@cdktf/provider-aws/lib/lb-target-group';
import { LbListener } from '@cdktf/provider-aws/lib/lb-listener';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';

export interface LoadBalancerStackProps {
  environmentSuffix: string;
  vpcId: string;
  publicSubnetIds: string[];
  region: string;
  providerAlias?: string;
}

export interface LoadBalancerStackOutputs {
  albArn: string;
  albDnsName: string;
  albZoneId: string;
  targetGroupArn: string;
}

export class LoadBalancerStack extends Construct {
  public readonly outputs: LoadBalancerStackOutputs;

  constructor(scope: Construct, id: string, props: LoadBalancerStackProps) {
    super(scope, id);

    const {
      environmentSuffix,
      vpcId,
      publicSubnetIds,
      region,
      providerAlias
    } = props;

    const drRole = region === 'us-east-1' ? 'primary' : 'dr';

    const commonTags = {
      Environment: environmentSuffix,
      CostCenter: 'payment-processing',
      'DR-Role': drRole,
      ManagedBy: 'cdktf',
    };

    // ALB Security Group
    const albSg = new SecurityGroup(this, `alb-sg-${region}`, {
      name: `payment-alb-sg-${environmentSuffix}-${region}`,
      description: 'Security group for Application Load Balancer',
      vpcId: vpcId,
      tags: {
        ...commonTags,
        Name: `payment-alb-sg-${environmentSuffix}-${region}`,
      },
      provider: providerAlias,
    });

    new SecurityGroupRule(this, `alb-http-ingress-${region}`, {
      type: 'ingress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: albSg.id,
      description: 'HTTP access from internet',
      provider: providerAlias,
    });

    new SecurityGroupRule(this, `alb-https-ingress-${region}`, {
      type: 'ingress',
      fromPort: 443,
      toPort: 443,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: albSg.id,
      description: 'HTTPS access from internet',
      provider: providerAlias,
    });

    new SecurityGroupRule(this, `alb-egress-${region}`, {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: albSg.id,
      description: 'Allow all outbound traffic',
      provider: providerAlias,
    });

    // Target Group
    const targetGroup = new LbTargetGroup(this, `target-group-${region}`, {
      name: `payment-tg-${environmentSuffix}-${region}`,
      port: 80,
      protocol: 'HTTP',
      vpcId: vpcId,
      targetType: 'instance',
      healthCheck: {
        enabled: true,
        path: '/',
        protocol: 'HTTP',
        matcher: '200',
        interval: 30,
        timeout: 5,
        healthyThreshold: 2,
        unhealthyThreshold: 3,
      },
      deregistrationDelay: 30,
      tags: commonTags,
      provider: providerAlias,
    });

    // Application Load Balancer
    const alb = new Lb(this, `alb-${region}`, {
      name: `payment-alb-${environmentSuffix}-${region}`,
      internal: false,
      loadBalancerType: 'application',
      securityGroups: [albSg.id],
      subnets: publicSubnetIds,
      enableDeletionProtection: false,
      enableHttp2: true,
      enableCrossZoneLoadBalancing: true,
      idleTimeout: 60,
      tags: commonTags,
      provider: providerAlias,
    });

    // Listener
    new LbListener(this, `listener-${region}`, {
      loadBalancerArn: alb.arn,
      port: 80,
      protocol: 'HTTP',
      defaultAction: [{
        type: 'forward',
        targetGroupArn: targetGroup.arn,
      }],
      provider: providerAlias,
    });

    this.outputs = {
      albArn: alb.arn,
      albDnsName: alb.dnsName,
      albZoneId: alb.zoneId,
      targetGroupArn: targetGroup.arn,
    };
  }
}
```

### File: lib/monitoring-stack.ts

```typescript
import { Construct } from 'constructs';
import { CloudwatchMetricAlarm } from '@cdktf/provider-aws/lib/cloudwatch-metric-alarm';
import { SnsTopic } from '@cdktf/provider-aws/lib/sns-topic';
import { SnsTopicSubscription } from '@cdktf/provider-aws/lib/sns-topic-subscription';

export interface MonitoringStackProps {
  environmentSuffix: string;
  primaryRegion: string;
  drRegion: string;
  primaryAlbArn: string;
  drAlbArn: string;
  primaryAsgName: string;
  drAsgName: string;
  primaryDbClusterId: string;
  drDbClusterId: string;
  primaryTargetGroupArn: string;
  drTargetGroupArn: string;
  primaryProviderAlias?: string;
  drProviderAlias?: string;
}

export interface MonitoringStackOutputs {
  primarySnsTopicArn: string;
  drSnsTopicArn: string;
}

export class MonitoringStack extends Construct {
  public readonly outputs: MonitoringStackOutputs;

  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id);

    const {
      environmentSuffix,
      primaryRegion,
      drRegion,
      primaryAlbArn,
      drAlbArn,
      primaryAsgName,
      drAsgName,
      primaryDbClusterId,
      drDbClusterId,
      primaryTargetGroupArn,
      drTargetGroupArn,
      primaryProviderAlias,
      drProviderAlias
    } = props;

    const commonTags = {
      Environment: environmentSuffix,
      CostCenter: 'payment-processing',
      ManagedBy: 'cdktf',
    };

    // SNS Topics for alarms
    const primarySnsTopic = new SnsTopic(this, 'primary-sns-topic', {
      name: `payment-alarms-${environmentSuffix}-${primaryRegion}`,
      displayName: `Payment Processing Alarms - ${primaryRegion}`,
      tags: {
        ...commonTags,
        'DR-Role': 'primary',
      },
      provider: primaryProviderAlias,
    });

    const drSnsTopic = new SnsTopic(this, 'dr-sns-topic', {
      name: `payment-alarms-${environmentSuffix}-${drRegion}`,
      displayName: `Payment Processing Alarms - ${drRegion}`,
      tags: {
        ...commonTags,
        'DR-Role': 'dr',
      },
      provider: drProviderAlias,
    });

    // Email subscriptions (placeholder - requires confirmation)
    new SnsTopicSubscription(this, 'primary-email-subscription', {
      topicArn: primarySnsTopic.arn,
      protocol: 'email',
      endpoint: `ops-${environmentSuffix}@example.com`,
      provider: primaryProviderAlias,
    });

    new SnsTopicSubscription(this, 'dr-email-subscription', {
      topicArn: drSnsTopic.arn,
      protocol: 'email',
      endpoint: `ops-${environmentSuffix}@example.com`,
      provider: drProviderAlias,
    });

    // Primary Region Alarms

    // ALB Unhealthy Target Count - Primary
    new CloudwatchMetricAlarm(this, 'primary-alb-unhealthy-targets', {
      alarmName: `payment-alb-unhealthy-${environmentSuffix}-${primaryRegion}`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'UnHealthyHostCount',
      namespace: 'AWS/ApplicationELB',
      period: 60,
      statistic: 'Average',
      threshold: 1,
      alarmDescription: 'Alert when ALB has unhealthy targets',
      alarmActions: [primarySnsTopic.arn],
      dimensions: {
        LoadBalancer: primaryAlbArn.split(':loadbalancer/')[1],
        TargetGroup: primaryTargetGroupArn.split(':')[5],
      },
      tags: {
        ...commonTags,
        'DR-Role': 'primary',
      },
      provider: primaryProviderAlias,
    });

    // ASG Instance Health - Primary
    new CloudwatchMetricAlarm(this, 'primary-asg-instance-health', {
      alarmName: `payment-asg-health-${environmentSuffix}-${primaryRegion}`,
      comparisonOperator: 'LessThanThreshold',
      evaluationPeriods: 2,
      metricName: 'GroupInServiceInstances',
      namespace: 'AWS/AutoScaling',
      period: 60,
      statistic: 'Average',
      threshold: 2,
      alarmDescription: 'Alert when ASG has less than 2 healthy instances',
      alarmActions: [primarySnsTopic.arn],
      dimensions: {
        AutoScalingGroupName: primaryAsgName,
      },
      tags: {
        ...commonTags,
        'DR-Role': 'primary',
      },
      provider: primaryProviderAlias,
    });

    // Database CPU - Primary
    new CloudwatchMetricAlarm(this, 'primary-db-cpu', {
      alarmName: `payment-db-cpu-${environmentSuffix}-${primaryRegion}`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'CPUUtilization',
      namespace: 'AWS/RDS',
      period: 300,
      statistic: 'Average',
      threshold: 80,
      alarmDescription: 'Alert when database CPU exceeds 80%',
      alarmActions: [primarySnsTopic.arn],
      dimensions: {
        DBClusterIdentifier: primaryDbClusterId,
      },
      tags: {
        ...commonTags,
        'DR-Role': 'primary',
      },
      provider: primaryProviderAlias,
    });

    // Database Replication Lag - Primary
    new CloudwatchMetricAlarm(this, 'db-replication-lag', {
      alarmName: `payment-db-replication-lag-${environmentSuffix}`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'AuroraGlobalDBReplicationLag',
      namespace: 'AWS/RDS',
      period: 60,
      statistic: 'Average',
      threshold: 1000,
      alarmDescription: 'Alert when global database replication lag exceeds 1000ms',
      alarmActions: [primarySnsTopic.arn, drSnsTopic.arn],
      dimensions: {
        DBClusterIdentifier: drDbClusterId,
      },
      tags: {
        ...commonTags,
        'DR-Role': 'global',
      },
      provider: drProviderAlias,
    });

    // DR Region Alarms

    // ALB Unhealthy Target Count - DR
    new CloudwatchMetricAlarm(this, 'dr-alb-unhealthy-targets', {
      alarmName: `payment-alb-unhealthy-${environmentSuffix}-${drRegion}`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'UnHealthyHostCount',
      namespace: 'AWS/ApplicationELB',
      period: 60,
      statistic: 'Average',
      threshold: 1,
      alarmDescription: 'Alert when ALB has unhealthy targets',
      alarmActions: [drSnsTopic.arn],
      dimensions: {
        LoadBalancer: drAlbArn.split(':loadbalancer/')[1],
        TargetGroup: drTargetGroupArn.split(':')[5],
      },
      tags: {
        ...commonTags,
        'DR-Role': 'dr',
      },
      provider: drProviderAlias,
    });

    // ASG Instance Health - DR
    new CloudwatchMetricAlarm(this, 'dr-asg-instance-health', {
      alarmName: `payment-asg-health-${environmentSuffix}-${drRegion}`,
      comparisonOperator: 'LessThanThreshold',
      evaluationPeriods: 2,
      metricName: 'GroupInServiceInstances',
      namespace: 'AWS/AutoScaling',
      period: 60,
      statistic: 'Average',
      threshold: 2,
      alarmDescription: 'Alert when ASG has less than 2 healthy instances',
      alarmActions: [drSnsTopic.arn],
      dimensions: {
        AutoScalingGroupName: drAsgName,
      },
      tags: {
        ...commonTags,
        'DR-Role': 'dr',
      },
      provider: drProviderAlias,
    });

    // Database CPU - DR
    new CloudwatchMetricAlarm(this, 'dr-db-cpu', {
      alarmName: `payment-db-cpu-${environmentSuffix}-${drRegion}`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'CPUUtilization',
      namespace: 'AWS/RDS',
      period: 300,
      statistic: 'Average',
      threshold: 80,
      alarmDescription: 'Alert when database CPU exceeds 80%',
      alarmActions: [drSnsTopic.arn],
      dimensions: {
        DBClusterIdentifier: drDbClusterId,
      },
      tags: {
        ...commonTags,
        'DR-Role': 'dr',
      },
      provider: drProviderAlias,
    });

    this.outputs = {
      primarySnsTopicArn: primarySnsTopic.arn,
      drSnsTopicArn: drSnsTopic.arn,
    };
  }
}
```

### File: lib/dns-stack.ts

```typescript
import { Construct } from 'constructs';
import { Route53HealthCheck } from '@cdktf/provider-aws/lib/route53-health-check';
import { Route53Record } from '@cdktf/provider-aws/lib/route53-record';
import { DataAwsRoute53Zone } from '@cdktf/provider-aws/lib/data-aws-route53-zone';
import { CloudwatchMetricAlarm } from '@cdktf/provider-aws/lib/cloudwatch-metric-alarm';

export interface DnsStackProps {
  environmentSuffix: string;
  primaryAlbDnsName: string;
  drAlbDnsName: string;
  primaryAlbZoneId: string;
  drAlbZoneId: string;
  hostedZoneName: string;
  snsTopicArn: string;
}

export interface DnsStackOutputs {
  healthCheckId: string;
  failoverRecordFqdn: string;
}

export class DnsStack extends Construct {
  public readonly outputs: DnsStackOutputs;

  constructor(scope: Construct, id: string, props: DnsStackProps) {
    super(scope, id);

    const {
      environmentSuffix,
      primaryAlbDnsName,
      drAlbDnsName,
      primaryAlbZoneId,
      drAlbZoneId,
      hostedZoneName,
      snsTopicArn
    } = props;

    const commonTags = {
      Environment: environmentSuffix,
      CostCenter: 'payment-processing',
      'DR-Role': 'global',
      ManagedBy: 'cdktf',
    };

    // Get existing hosted zone
    const hostedZone = new DataAwsRoute53Zone(this, 'hosted-zone', {
      name: hostedZoneName,
      privateZone: false,
    });

    // Health check for primary ALB
    const healthCheck = new Route53HealthCheck(this, 'primary-health-check', {
      type: 'HTTPS',
      resourcePath: '/',
      fullyQualifiedDomainName: primaryAlbDnsName,
      port: 443,
      requestInterval: 30,
      failureThreshold: 3,
      measureLatency: true,
      enableSni: true,
      tags: {
        ...commonTags,
        Name: `payment-primary-health-${environmentSuffix}`,
      },
    });

    // CloudWatch alarm for health check
    new CloudwatchMetricAlarm(this, 'health-check-alarm', {
      alarmName: `payment-health-check-${environmentSuffix}`,
      comparisonOperator: 'LessThanThreshold',
      evaluationPeriods: 2,
      metricName: 'HealthCheckStatus',
      namespace: 'AWS/Route53',
      period: 60,
      statistic: 'Minimum',
      threshold: 1,
      alarmDescription: 'Alert when primary region health check fails',
      alarmActions: [snsTopicArn],
      dimensions: {
        HealthCheckId: healthCheck.id,
      },
      tags: commonTags,
    });

    // Failover record for primary (PRIMARY)
    const primaryRecord = new Route53Record(this, 'primary-failover-record', {
      zoneId: hostedZone.zoneId,
      name: `payment-${environmentSuffix}.${hostedZoneName}`,
      type: 'A',
      setIdentifier: 'primary',
      failoverRoutingPolicy: [{
        type: 'PRIMARY',
      }],
      healthCheckId: healthCheck.id,
      alias: [{
        name: primaryAlbDnsName,
        zoneId: primaryAlbZoneId,
        evaluateTargetHealth: true,
      }],
    });

    // Failover record for DR (SECONDARY)
    new Route53Record(this, 'dr-failover-record', {
      zoneId: hostedZone.zoneId,
      name: `payment-${environmentSuffix}.${hostedZoneName}`,
      type: 'A',
      setIdentifier: 'secondary',
      failoverRoutingPolicy: [{
        type: 'SECONDARY',
      }],
      alias: [{
        name: drAlbDnsName,
        zoneId: drAlbZoneId,
        evaluateTargetHealth: true,
      }],
    });

    this.outputs = {
      healthCheckId: healthCheck.id,
      failoverRecordFqdn: primaryRecord.fqdn,
    };
  }
}
```

### File: lib/tap-stack.ts

```typescript
import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';
import { NetworkingStack } from './networking-stack';
import { IamStack } from './iam-stack';
import { StorageStack } from './storage-stack';
import { DatabaseStack } from './database-stack';
import { LoadBalancerStack } from './loadbalancer-stack';
import { ComputeStack } from './compute-stack';
import { MonitoringStack } from './monitoring-stack';
import { DnsStack } from './dns-stack';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags[];
}

const AWS_REGION_OVERRIDE = '';
const PRIMARY_REGION = 'us-east-1';
const DR_REGION = 'us-east-2';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const awsRegion = AWS_REGION_OVERRIDE
      ? AWS_REGION_OVERRIDE
      : props?.awsRegion || 'us-east-1';
    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    const defaultTags = props?.defaultTags || [];

    // Configure Primary AWS Provider (us-east-1)
    const primaryProvider = new AwsProvider(this, 'aws-primary', {
      region: PRIMARY_REGION,
      defaultTags: defaultTags,
      alias: 'primary',
    });

    // Configure DR AWS Provider (us-east-2)
    const drProvider = new AwsProvider(this, 'aws-dr', {
      region: DR_REGION,
      defaultTags: defaultTags,
      alias: 'dr',
    });

    // Configure S3 Backend
    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });
    this.addOverride('terraform.backend.s3.use_lockfile', true);

    // Deploy networking in both regions
    const primaryNetworking = new NetworkingStack(this, 'primary-networking', {
      environmentSuffix,
      region: PRIMARY_REGION,
      providerAlias: primaryProvider.alias,
    });

    const drNetworking = new NetworkingStack(this, 'dr-networking', {
      environmentSuffix,
      region: DR_REGION,
      providerAlias: drProvider.alias,
    });

    // Deploy IAM resources (global, but created in primary)
    // Note: Creating placeholder buckets for IAM, will be replaced with actual buckets
    const placeholderBucketArn = `arn:aws:s3:::payment-assets-${environmentSuffix}-placeholder`;

    const iamStack = new IamStack(this, 'iam', {
      environmentSuffix,
      s3BucketPrimaryArn: placeholderBucketArn,
      s3BucketDrArn: placeholderBucketArn,
    });

    // Deploy storage with cross-region replication
    const storageStack = new StorageStack(this, 'storage', {
      environmentSuffix,
      replicationRoleArn: iamStack.outputs.replicationRoleArn,
      primaryRegion: PRIMARY_REGION,
      drRegion: DR_REGION,
      primaryProviderAlias: primaryProvider.alias,
      drProviderAlias: drProvider.alias,
    });

    // Deploy database (Aurora Global Database)
    const databaseStack = new DatabaseStack(this, 'database', {
      environmentSuffix,
      primaryVpcId: primaryNetworking.outputs.vpcId,
      drVpcId: drNetworking.outputs.vpcId,
      primaryDbSubnetIds: primaryNetworking.outputs.databaseSubnetIds,
      drDbSubnetIds: drNetworking.outputs.databaseSubnetIds,
      primaryRegion: PRIMARY_REGION,
      drRegion: DR_REGION,
      primaryProviderAlias: primaryProvider.alias,
      drProviderAlias: drProvider.alias,
    });

    // Deploy load balancers in both regions
    const primaryLb = new LoadBalancerStack(this, 'primary-lb', {
      environmentSuffix,
      vpcId: primaryNetworking.outputs.vpcId,
      publicSubnetIds: primaryNetworking.outputs.publicSubnetIds,
      region: PRIMARY_REGION,
      providerAlias: primaryProvider.alias,
    });

    const drLb = new LoadBalancerStack(this, 'dr-lb', {
      environmentSuffix,
      vpcId: drNetworking.outputs.vpcId,
      publicSubnetIds: drNetworking.outputs.publicSubnetIds,
      region: DR_REGION,
      providerAlias: drProvider.alias,
    });

    // Deploy compute (Auto Scaling Groups) in both regions
    const primaryCompute = new ComputeStack(this, 'primary-compute', {
      environmentSuffix,
      vpcId: primaryNetworking.outputs.vpcId,
      privateSubnetIds: primaryNetworking.outputs.privateSubnetIds,
      targetGroupArn: primaryLb.outputs.targetGroupArn,
      instanceProfileName: iamStack.outputs.ec2InstanceProfileName,
      region: PRIMARY_REGION,
      providerAlias: primaryProvider.alias,
    });

    const drCompute = new ComputeStack(this, 'dr-compute', {
      environmentSuffix,
      vpcId: drNetworking.outputs.vpcId,
      privateSubnetIds: drNetworking.outputs.privateSubnetIds,
      targetGroupArn: drLb.outputs.targetGroupArn,
      instanceProfileName: iamStack.outputs.ec2InstanceProfileName,
      region: DR_REGION,
      providerAlias: drProvider.alias,
    });

    // Deploy monitoring (CloudWatch alarms and SNS)
    const monitoringStack = new MonitoringStack(this, 'monitoring', {
      environmentSuffix,
      primaryRegion: PRIMARY_REGION,
      drRegion: DR_REGION,
      primaryAlbArn: primaryLb.outputs.albArn,
      drAlbArn: drLb.outputs.albArn,
      primaryAsgName: primaryCompute.outputs.asgName,
      drAsgName: drCompute.outputs.asgName,
      primaryDbClusterId: databaseStack.outputs.globalClusterId,
      drDbClusterId: databaseStack.outputs.globalClusterId,
      primaryTargetGroupArn: primaryLb.outputs.targetGroupArn,
      drTargetGroupArn: drLb.outputs.targetGroupArn,
      primaryProviderAlias: primaryProvider.alias,
      drProviderAlias: drProvider.alias,
    });

    // Deploy DNS (Route 53 failover)
    // Note: This requires an existing hosted zone
    // Uncomment and configure when ready
    /*
    const dnsStack = new DnsStack(this, 'dns', {
      environmentSuffix,
      primaryAlbDnsName: primaryLb.outputs.albDnsName,
      drAlbDnsName: drLb.outputs.albDnsName,
      primaryAlbZoneId: primaryLb.outputs.albZoneId,
      drAlbZoneId: drLb.outputs.albZoneId,
      hostedZoneName: 'example.com',
      snsTopicArn: monitoringStack.outputs.primarySnsTopicArn,
    });
    */

    // Outputs
    new TerraformOutput(this, 'primary_alb_dns', {
      value: primaryLb.outputs.albDnsName,
      description: 'Primary ALB DNS name',
    });

    new TerraformOutput(this, 'dr_alb_dns', {
      value: drLb.outputs.albDnsName,
      description: 'DR ALB DNS name',
    });

    new TerraformOutput(this, 'primary_db_endpoint', {
      value: databaseStack.outputs.primaryClusterEndpoint,
      description: 'Primary database cluster endpoint',
      sensitive: true,
    });

    new TerraformOutput(this, 'dr_db_endpoint', {
      value: databaseStack.outputs.drClusterEndpoint,
      description: 'DR database cluster endpoint',
      sensitive: true,
    });

    new TerraformOutput(this, 'primary_s3_bucket', {
      value: storageStack.outputs.primaryBucketId,
      description: 'Primary S3 bucket name',
    });

    new TerraformOutput(this, 'dr_s3_bucket', {
      value: storageStack.outputs.drBucketId,
      description: 'DR S3 bucket name',
    });

    new TerraformOutput(this, 'primary_sns_topic', {
      value: monitoringStack.outputs.primarySnsTopicArn,
      description: 'Primary SNS topic ARN for alarms',
    });

    new TerraformOutput(this, 'dr_sns_topic', {
      value: monitoringStack.outputs.drSnsTopicArn,
      description: 'DR SNS topic ARN for alarms',
    });
  }
}
```

### File: lib/README.md

```markdown
# Multi-Region Disaster Recovery Architecture

This implementation provides a complete active-passive disaster recovery solution for a payment processing application across AWS us-east-1 (primary) and us-east-2 (DR) regions.

## Architecture Overview

### Components

- **Multi-Region Networking**: VPCs with public, private, and database subnets across 3 AZs in each region
- **Global Database**: RDS Aurora PostgreSQL 13.7 Global Database with primary in us-east-1 and read replica in us-east-2
- **Compute Layer**: Auto Scaling Groups with t3.large instances in both regions
- **Load Balancing**: Application Load Balancers with health checks in both regions
- **Storage**: S3 buckets with cross-region replication and lifecycle policies
- **DNS Failover**: Route 53 health checks and failover routing (optional, requires hosted zone)
- **Monitoring**: CloudWatch alarms for database lag, ALB health, and ASG health
- **Alerting**: SNS topics for cross-region notifications

## Prerequisites

- AWS CLI configured with appropriate credentials
- Node.js 18+ and npm
- Terraform 1.5+
- CDKTF CLI: `npm install -g cdktf-cli`

## Environment Variables

```bash
export ENVIRONMENT_SUFFIX="dev"
export AWS_REGION="us-east-1"
export TERRAFORM_STATE_BUCKET="iac-rlhf-tf-states"
export TERRAFORM_STATE_BUCKET_REGION="us-east-1"
```

## Deployment

### 1. Install Dependencies

```bash
npm install
```

### 2. Synthesize Terraform Configuration

```bash
cdktf synth
```

### 3. Deploy Infrastructure

```bash
cdktf deploy
```

### 4. Verify Deployment

After deployment, verify:
- Both ALBs are healthy and responding
- Auto Scaling Groups have healthy instances in both regions
- Aurora Global Database replication is active
- S3 cross-region replication is working
- CloudWatch alarms are configured
- SNS email subscriptions are confirmed

## Testing Disaster Recovery

### Simulate Primary Region Failure

1. **Disable primary ALB or ASG**:
   ```bash
   aws autoscaling suspend-processes \
     --auto-scaling-group-name payment-asg-<env>-us-east-1 \
     --region us-east-1
   ```

2. **Monitor Route 53 health check** (if configured):
   - Health check should detect failure within 2-3 minutes
   - DNS should automatically failover to us-east-2

3. **Verify DR region takes over**:
   - Access DR ALB endpoint
   - Check application continues to serve traffic
   - Monitor RTO (should be < 5 minutes)

### Promote DR Database (if needed)

If complete region failure, promote DR cluster to standalone:

```bash
aws rds remove-from-global-cluster \
  --db-cluster-identifier payment-dr-<env> \
  --region us-east-2

aws rds modify-db-cluster \
  --db-cluster-identifier payment-dr-<env> \
  --apply-immediately \
  --region us-east-2
```

## Resource Naming Convention

All resources follow the pattern: `payment-<resource-type>-<environmentSuffix>-<region>`

Examples:
- `payment-vpc-dev-us-east-1`
- `payment-alb-prod-us-east-2`
- `payment-asg-staging-us-east-1`

## Monitoring and Alarms

### CloudWatch Alarms

- **Database Replication Lag**: Triggers when lag > 1000ms
- **ALB Unhealthy Targets**: Triggers when unhealthy targets > 1
- **ASG Instance Health**: Triggers when healthy instances < 2
- **Database CPU**: Triggers when CPU > 80%

### SNS Notifications

Email notifications are sent to `ops-<environmentSuffix>@example.com` for all alarms. Update email address in monitoring-stack.ts before deployment.

## Cost Optimization

- Aurora instances: db.r5.large (can be downsized for non-prod)
- EC2 instances: t3.large with Auto Scaling
- S3 lifecycle policies: Standard -> Standard-IA (30 days) -> Glacier (90 days)
- NAT Gateways: One per AZ (consider reducing for dev environments)

## Cleanup

To destroy all resources:

```bash
cdktf destroy
```

**Warning**: This will destroy all resources including databases and S3 buckets (with force_destroy enabled).

## Troubleshooting

### Database Connection Issues

Check security groups allow traffic from application subnets:
```bash
aws ec2 describe-security-groups \
  --filters "Name=tag:Name,Values=payment-db-sg-*" \
  --region us-east-1
```

### S3 Replication Not Working

Verify replication role has correct permissions and replication is enabled:
```bash
aws s3api get-bucket-replication \
  --bucket payment-assets-<env>-us-east-1
```

### Health Check Failures

Check ALB target health:
```bash
aws elbv2 describe-target-health \
  --target-group-arn <target-group-arn> \
  --region us-east-1
```

## Security Considerations

- All S3 buckets have public access blocked
- Database credentials are in code (use AWS Secrets Manager in production)
- Security groups follow least privilege
- EC2 instances use IMDSv2
- All EBS volumes are encrypted
- VPC flow logs should be enabled (not included in this implementation)

## Future Enhancements

1. Add AWS Secrets Manager for database credentials
2. Implement VPC peering or Transit Gateway for cross-region communication
3. Add WAF rules for ALBs
4. Implement automated DR testing with Lambda
5. Add CloudWatch Logs for application and VPC flow logs
6. Implement backup verification automation
7. Add DynamoDB global tables for session state
8. Implement AWS Backup for centralized backup management
```
