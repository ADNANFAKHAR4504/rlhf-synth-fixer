I'll help you create a production-ready CDKTF setup with modular architecture, remote state management, and enterprise-grade practices. Let me break this down into the required components.

## Project Structure

```
cdktf-infrastructure/
├── main.ts
├── cdktf.json
├── backend/
│   └── remote-state.ts
├── modules/
│   ├── networking/
│   │   └── index.ts
│   ├── compute/
│   │   └── index.ts
│   └── database/
│       └── index.ts
├── utils/
│   └── naming.ts
└── types/
    └── interfaces.ts
```

## 1. Core Types and Interfaces

**`types/interfaces.ts`**

```typescript
export interface BaseConfig {
  environment: string;
  project: string;
  region: string;
  tags?: Record<string, string>;
}

export interface NetworkingConfig extends BaseConfig {
  vpcCidr: string;
  publicSubnetCidrs: string[];
  privateSubnetCidrs: string[];
  availabilityZones: string[];
  enableNatGateway: boolean;
  enableVpcFlowLogs: boolean;
}

export interface ComputeConfig extends BaseConfig {
  instanceType: string;
  minSize: number;
  maxSize: number;
  desiredCapacity: number;
  keyPairName?: string;
  enableDetailedMonitoring: boolean;
  userData?: string;
  securityGroupIds: string[];
  subnetIds: string[];
}

export interface DatabaseConfig extends BaseConfig {
  engine: string;
  engineVersion: string;
  instanceClass: string;
  allocatedStorage: number;
  maxAllocatedStorage?: number;
  dbName: string;
  username: string;
  backupRetentionPeriod: number;
  backupWindow: string;
  maintenanceWindow: string;
  multiAz: boolean;
  storageEncrypted: boolean;
  subnetGroupName?: string;
  securityGroupIds: string[];
}

export interface RemoteStateConfig {
  bucketName: string;
  dynamoTableName: string;
  region: string;
  keyPrefix: string;
}
```

## 2. Naming Convention Utility

**`utils/naming.ts`**

```typescript
export class NamingConvention {
  private environment: string;
  private project: string;

  constructor(environment: string, project: string) {
    this.environment = environment.toLowerCase();
    this.project = project.toLowerCase();
  }

  public generateName(resourceType: string, uniqueId: string): string {
    return `${this.environment}-${this.project}-${resourceType}-${uniqueId}`;
  }

  public generateTags(
    additionalTags?: Record<string, string>
  ): Record<string, string> {
    const baseTags = {
      Environment: this.environment,
      Project: this.project,
      ManagedBy: 'CDKTF',
      CreatedAt: new Date().toISOString(),
    };

    return { ...baseTags, ...additionalTags };
  }
}
```

## 3. Remote State Backend

**`backend/remote-state.ts`**

```typescript
import { Construct } from 'constructs';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketVersioning } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { S3BucketEncryption } from '@cdktf/provider-aws/lib/s3-bucket-encryption';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { DynamodbTable } from '@cdktf/provider-aws/lib/dynamodb-table';
import { RemoteStateConfig } from '../types/interfaces';
import { NamingConvention } from '../utils/naming';

export class RemoteStateBackend extends Construct {
  public readonly bucket: S3Bucket;
  public readonly dynamoTable: DynamodbTable;

  constructor(scope: Construct, id: string, config: RemoteStateConfig) {
    super(scope, id);

    const naming = new NamingConvention(config.keyPrefix, 'terraform');

    // S3 Bucket for state storage
    this.bucket = new S3Bucket(this, 'state-bucket', {
      bucket: config.bucketName,
      tags: naming.generateTags({
        Purpose: 'terraform-state-storage',
      }),
      lifecycle: {
        preventDestroy: true,
      },
    });

    // Enable versioning
    new S3BucketVersioning(this, 'state-bucket-versioning', {
      bucket: this.bucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    });

    // Enable encryption
    new S3BucketEncryption(this, 'state-bucket-encryption', {
      bucket: this.bucket.id,
      serverSideEncryptionConfiguration: {
        rule: {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'AES256',
          },
          bucketKeyEnabled: true,
        },
      },
    });

    // Block public access
    new S3BucketPublicAccessBlock(this, 'state-bucket-pab', {
      bucket: this.bucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    // DynamoDB table for state locking
    this.dynamoTable = new DynamodbTable(this, 'state-lock-table', {
      name: config.dynamoTableName,
      billingMode: 'PAY_PER_REQUEST',
      hashKey: 'LockID',
      attribute: [
        {
          name: 'LockID',
          type: 'S',
        },
      ],
      tags: naming.generateTags({
        Purpose: 'terraform-state-locking',
      }),
      lifecycle: {
        preventDestroy: true,
      },
    });
  }
}
```

## 4. Networking Module

**`modules/networking/index.ts`**

```typescript
import { Construct } from 'constructs';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { FlowLog } from '@cdktf/provider-aws/lib/flow-log';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { NetworkingConfig } from '../../types/interfaces';
import { NamingConvention } from '../../utils/naming';

export class NetworkingModule extends Construct {
  public readonly vpc: Vpc;
  public readonly publicSubnets: Subnet[];
  public readonly privateSubnets: Subnet[];
  public readonly internetGateway: InternetGateway;
  public readonly natGateways: NatGateway[];

  constructor(scope: Construct, id: string, config: NetworkingConfig) {
    super(scope, id);

    const naming = new NamingConvention(config.environment, config.project);

    // VPC
    this.vpc = new Vpc(this, 'vpc', {
      cidrBlock: config.vpcCidr,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: naming.generateTags({
        Name: naming.generateName('vpc', '001'),
        Type: 'networking',
      }),
      lifecycle: {
        preventDestroy: true,
      },
    });

    // Internet Gateway
    this.internetGateway = new InternetGateway(this, 'igw', {
      vpcId: this.vpc.id,
      tags: naming.generateTags({
        Name: naming.generateName('igw', '001'),
      }),
    });

    // Public Subnets
    this.publicSubnets = config.publicSubnetCidrs.map((cidr, index) => {
      return new Subnet(this, `public-subnet-${index}`, {
        vpcId: this.vpc.id,
        cidrBlock: cidr,
        availabilityZone: config.availabilityZones[index],
        mapPublicIpOnLaunch: true,
        tags: naming.generateTags({
          Name: naming.generateName(
            'subnet-public',
            `${index + 1}`.padStart(3, '0')
          ),
          Type: 'public',
        }),
      });
    });

    // Private Subnets
    this.privateSubnets = config.privateSubnetCidrs.map((cidr, index) => {
      return new Subnet(this, `private-subnet-${index}`, {
        vpcId: this.vpc.id,
        cidrBlock: cidr,
        availabilityZone: config.availabilityZones[index],
        tags: naming.generateTags({
          Name: naming.generateName(
            'subnet-private',
            `${index + 1}`.padStart(3, '0')
          ),
          Type: 'private',
        }),
      });
    });

    // NAT Gateways (if enabled)
    this.natGateways = [];
    if (config.enableNatGateway) {
      this.natGateways = this.publicSubnets.map((subnet, index) => {
        const eip = new Eip(this, `nat-eip-${index}`, {
          domain: 'vpc',
          tags: naming.generateTags({
            Name: naming.generateName(
              'eip-nat',
              `${index + 1}`.padStart(3, '0')
            ),
          }),
        });

        return new NatGateway(this, `nat-gateway-${index}`, {
          allocationId: eip.id,
          subnetId: subnet.id,
          tags: naming.generateTags({
            Name: naming.generateName('nat', `${index + 1}`.padStart(3, '0')),
          }),
        });
      });
    }

    // Route Tables
    const publicRouteTable = new RouteTable(this, 'public-rt', {
      vpcId: this.vpc.id,
      tags: naming.generateTags({
        Name: naming.generateName('rt-public', '001'),
        Type: 'public',
      }),
    });

    // Public route to Internet Gateway
    new Route(this, 'public-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: this.internetGateway.id,
    });

    // Associate public subnets with public route table
    this.publicSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(this, `public-rt-association-${index}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
      });
    });

    // Private route tables (one per AZ if NAT gateways are enabled)
    if (config.enableNatGateway && this.natGateways.length > 0) {
      this.privateSubnets.forEach((subnet, index) => {
        const privateRouteTable = new RouteTable(this, `private-rt-${index}`, {
          vpcId: this.vpc.id,
          tags: naming.generateTags({
            Name: naming.generateName(
              'rt-private',
              `${index + 1}`.padStart(3, '0')
            ),
            Type: 'private',
          }),
        });

        // Route to NAT Gateway
        new Route(this, `private-route-${index}`, {
          routeTableId: privateRouteTable.id,
          destinationCidrBlock: '0.0.0.0/0',
          natGatewayId: this.natGateways[index].id,
        });

        // Associate private subnet with private route table
        new RouteTableAssociation(this, `private-rt-association-${index}`, {
          subnetId: subnet.id,
          routeTableId: privateRouteTable.id,
        });
      });
    }

    // VPC Flow Logs (if enabled)
    if (config.enableVpcFlowLogs) {
      const flowLogRole = new IamRole(this, 'flow-log-role', {
        name: naming.generateName('role-flowlog', '001'),
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
        tags: naming.generateTags(),
      });

      new IamRolePolicyAttachment(this, 'flow-log-policy', {
        role: flowLogRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/VPCFlowLogsDeliveryRolePolicy',
      });

      const flowLogGroup = new CloudwatchLogGroup(this, 'flow-log-group', {
        name: naming.generateName('log-group-vpc', '001'),
        retentionInDays: 14,
        tags: naming.generateTags(),
      });

      new FlowLog(this, 'vpc-flow-log', {
        iamRoleArn: flowLogRole.arn,
        logDestination: flowLogGroup.arn,
        resourceId: this.vpc.id,
        resourceType: 'VPC',
        trafficType: 'ALL',
        tags: naming.generateTags({
          Name: naming.generateName('flowlog-vpc', '001'),
        }),
      });
    }
  }
}
```

## 5. Compute Module

**`modules/compute/index.ts`**

```typescript
import { Construct } from 'constructs';
import { LaunchTemplate } from '@cdktf/provider-aws/lib/launch-template';
import { AutoscalingGroup } from '@cdktf/provider-aws/lib/autoscaling-group';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';
import { DataAwsAmi } from '@cdktf/provider-aws/lib/data-aws-ami';
import { ComputeConfig } from '../../types/interfaces';
import { NamingConvention } from '../../utils/naming';

export class ComputeModule extends Construct {
  public readonly launchTemplate: LaunchTemplate;
  public readonly autoScalingGroup: AutoscalingGroup;
  public readonly securityGroup: SecurityGroup;

  constructor(scope: Construct, id: string, config: ComputeConfig) {
    super(scope, id);

    const naming = new NamingConvention(config.environment, config.project);

    // Get latest Amazon Linux 2 AMI
    const ami = new DataAwsAmi(this, 'amazon-linux', {
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
    });

    // Security Group
    this.securityGroup = new SecurityGroup(this, 'compute-sg', {
      name: naming.generateName('sg-compute', '001'),
      description: 'Security group for compute instances',
      vpcId: config.securityGroupIds[0], // Assuming VPC ID is passed
      tags: naming.generateTags({
        Name: naming.generateName('sg-compute', '001'),
      }),
    });

    // Allow HTTP traffic
    new SecurityGroupRule(this, 'allow-http', {
      type: 'ingress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.securityGroup.id,
    });

    // Allow HTTPS traffic
    new SecurityGroupRule(this, 'allow-https', {
      type: 'ingress',
      fromPort: 443,
      toPort: 443,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.securityGroup.id,
    });

    // Allow SSH (restrict to specific CIDR in production)
    new SecurityGroupRule(this, 'allow-ssh', {
      type: 'ingress',
      fromPort: 22,
      toPort: 22,
      protocol: 'tcp',
      cidrBlocks: ['10.0.0.0/8'], // Restrict to private networks
      securityGroupId: this.securityGroup.id,
    });

    // Allow all outbound traffic
    new SecurityGroupRule(this, 'allow-all-outbound', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.securityGroup.id,
    });

    // Launch Template
    this.launchTemplate = new LaunchTemplate(this, 'launch-template', {
      name: naming.generateName('lt-compute', '001'),
      imageId: ami.id,
      instanceType: config.instanceType,
      keyName: config.keyPairName,
      userData: config.userData
        ? Buffer.from(config.userData).toString('base64')
        : undefined,

      monitoring: {
        enabled: config.enableDetailedMonitoring,
      },

      vpcSecurityGroupIds: [this.securityGroup.id, ...config.securityGroupIds],

      tagSpecifications: [
        {
          resourceType: 'instance',
          tags: naming.generateTags({
            Name: naming.generateName('instance', '001'),
          }),
        },
        {
          resourceType: 'volume',
          tags: naming.generateTags({
            Name: naming.generateName('volume', '001'),
          }),
        },
      ],

      lifecycle: {
        createBeforeDestroy: true,
      },
    });

    // Auto Scaling Group
    this.autoScalingGroup = new AutoscalingGroup(this, 'asg', {
      name: naming.generateName('asg-compute', '001'),
      minSize: config.minSize,
      maxSize: config.maxSize,
      desiredCapacity: config.desiredCapacity,
      vpcZoneIdentifier: config.subnetIds,

      launchTemplate: {
        id: this.launchTemplate.id,
        version: '$Latest',
      },

      healthCheckType: 'EC2',
      healthCheckGracePeriod: 300,

      tag: [
        {
          key: 'Name',
          value: naming.generateName('asg-compute', '001'),
          propagateAtLaunch: false,
        },
        ...Object.entries(naming.generateTags()).map(([key, value]) => ({
          key,
          value,
          propagateAtLaunch: true,
        })),
      ],

      lifecycle: {
        createBeforeDestroy: true,
        ignoreChanges: ['desired_capacity'],
      },
    });
  }
}
```

## 6. Database Module

**`modules/database/index.ts`**

```typescript
import { Construct } from 'constructs';
import { DbInstance } from '@cdktf/provider-aws/lib/db-instance';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';
import { DbParameterGroup } from '@cdktf/provider-aws/lib/db-parameter-group';
import { RandomPassword } from '@cdktf/provider-random/lib/password';
import { SecretsmanagerSecret } from '@cdktf/provider-aws/lib/secretsmanager-secret';
import { SecretsmanagerSecretVersion } from '@cdktf/provider-aws/lib/secretsmanager-secret-version';
import { DatabaseConfig } from '../../types/interfaces';
import { NamingConvention } from '../../utils/naming';

export class DatabaseModule extends Construct {
  public readonly dbInstance: DbInstance;
  public readonly dbSubnetGroup: DbSubnetGroup;
  public readonly securityGroup: SecurityGroup;
  public readonly secret: SecretsmanagerSecret;

  constructor(
    scope: Construct,
    id: string,
    config: DatabaseConfig,
    subnetIds: string[],
    vpcId: string
  ) {
    super(scope, id);

    const naming = new NamingConvention(config.environment, config.project);

    // Generate random password
    const dbPassword = new RandomPassword(this, 'db-password', {
      length: 32,
      special: true,
      overrideSpecial: '!#$%&*()-_=+[]{}<>:?',
    });

    // Store password in Secrets Manager
    this.secret = new SecretsmanagerSecret(this, 'db-secret', {
      name: naming.generateName('secret-db', '001'),
      description: `Database credentials for ${config.dbName}`,
      tags: naming.generateTags(),
    });

    new SecretsmanagerSecretVersion(this, 'db-secret-version', {
      secretId: this.secret.id,
      secretString: JSON.stringify({
        username: config.username,
        password: dbPassword.result,
        engine: config.engine,
        host: '', // Will be updated after RDS creation
        port: config.engine === 'postgres' ? 5432 : 3306,
        dbname: config.dbName,
      }),
    });

    // DB Subnet Group
    this.dbSubnetGroup = new DbSubnetGroup(this, 'db-subnet-group', {
      name: naming.generateName('db-subnet-group', '001'),
      subnetIds: subnetIds,
      tags: naming.generateTags({
        Name: naming.generateName('db-subnet-group', '001'),
      }),
    });

    // Security Group for RDS
    this.securityGroup = new SecurityGroup(this, 'db-sg', {
      name: naming.generateName('sg-db', '001'),
      description: 'Security group for RDS database',
      vpcId: vpcId,
      tags: naming.generateTags({
        Name: naming.generateName('sg-db', '001'),
      }),
    });

    // Allow database traffic from application security groups
    config.securityGroupIds.forEach((sgId, index) => {
      new SecurityGroupRule(this, `allow-db-from-app-${index}`, {
        type: 'ingress',
        fromPort: config.engine === 'postgres' ? 5432 : 3306,
        toPort: config.engine === 'postgres' ? 5432 : 3306,
        protocol: 'tcp',
        sourceSecurityGroupId: sgId,
        securityGroupId: this.securityGroup.id,
      });
    });

    // DB Parameter Group
    const parameterGroup = new DbParameterGroup(this, 'db-parameter-group', {
      family:
        config.engine === 'postgres'
          ? `postgres${config.engineVersion.split('.')[0]}`
          : `mysql${config.engineVersion.split('.')[0]}.${config.engineVersion.split('.')[1]}`,
      name: naming.generateName('db-param-group', '001'),
      description: `Parameter group for ${config.engine} ${config.engineVersion}`,
      tags: naming.generateTags(),
    });

    // RDS Instance
    this.dbInstance = new DbInstance(this, 'db-instance', {
      identifier: naming.generateName('db', '001'),
      engine: config.engine,
      engineVersion: config.engineVersion,
      instanceClass: config.instanceClass,
      allocatedStorage: config.allocatedStorage,
      maxAllocatedStorage: config.maxAllocatedStorage,

      dbName: config.dbName,
      username: config.username,
      password: dbPassword.result,

      dbSubnetGroupName: this.dbSubnetGroup.name,
      vpcSecurityGroupIds: [this.securityGroup.id],
      parameterGroupName: parameterGroup.name,

      backupRetentionPeriod: config.backupRetentionPeriod,
      backupWindow: config.backupWindow,
      maintenanceWindow: config.maintenanceWindow,

      multiAz: config.multiAz,
      storageEncrypted: config.storageEncrypted,

      skipFinalSnapshot: false,
      finalSnapshotIdentifier: `${naming.generateName('db', '001')}-final-snapshot-${Math.floor(Date.now() / 1000)}`,

      deletionProtection: true,

      tags: naming.generateTags({
        Name: naming.generateName('db', '001'),
        Engine: config.engine,
      }),

      lifecycle: {
        preventDestroy: true,
        ignoreChanges: ['password', 'final_snapshot_identifier'],
      },
    });
  }
}
```

## 7. Main Stack

**`main.ts`**

```typescript
import { Construct } from 'constructs';
import { App, TerraformStack, S3Backend } from 'cdktf';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { RandomProvider } from '@cdktf/provider-random/lib/provider';

import { NetworkingModule } from './modules/networking';
import { ComputeModule } from './modules/compute';
import { DatabaseModule } from './modules/database';
import { RemoteStateBackend } from './backend/remote-state';

import {
  NetworkingConfig,
  ComputeConfig,
  DatabaseConfig,
  RemoteStateConfig,
} from './types/interfaces';

class InfrastructureStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    const environment = process.env.ENVIRONMENT || 'dev';
    const project = process.env.PROJECT || 'myapp';
    const region = process.env.AWS_REGION || 'us-west-2';

    // Configure providers
    new AwsProvider(this, 'AWS', {
      region: region,
      defaultTags: {
        tags: {
          Environment: environment,
          Project: project,
          ManagedBy: 'CDKTF',
        },
      },
    });

    new RandomProvider(this, 'random');

    // Configure remote state backend
    new S3Backend(this, {
      bucket: `${project}-terraform-state-${environment}`,
      key: `${environment}/terraform.tfstate`,
      region: region,
      dynamodbTable: `${project}-terraform-locks-${environment}`,
      encrypt: true,
    });

    // Networking Configuration
    const networkingConfig: NetworkingConfig = {
      environment,
      project,
      region,
      vpcCidr: '10.0.0.0/16',
      publicSubnetCidrs: ['10.0.1.0/24', '10.0.2.0/24'],
      privateSubnetCidrs: ['10.0.10.0/24', '10.0.20.0/24'],
      availabilityZones: [`${region}a`, `${region}b`],
      enableNatGateway: environment === 'prod',
      enableVpcFlowLogs: true,
    };

    // Create networking infrastructure
    const networking = new NetworkingModule(
      this,
      'networking',
      networkingConfig
    );

    // Compute Configuration
    const computeConfig: ComputeConfig = {
      environment,
      project,
      region,
      instanceType: environment === 'prod' ? 'm5.large' : 't3.micro',
      minSize: 1,
      maxSize: environment === 'prod' ? 10 : 3,
      desiredCapacity: environment === 'prod' ? 2 : 1,
      enableDetailedMonitoring: environment === 'prod',
      securityGroupIds: [], // Will be populated with networking security groups if needed
      subnetIds: networking.privateSubnets.map(subnet => subnet.id),
      userData: `#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd
echo "<h1>Hello from ${environment}</h1>" > /var/www/html/index.html`,
    };

    // Create compute infrastructure
    const compute = new ComputeModule(this, 'compute', computeConfig);

    // Database Configuration
    const databaseConfig: DatabaseConfig = {
      environment,
      project,
      region,
      engine: 'postgres',
      engineVersion: '14.9',
      instanceClass: environment === 'prod' ? 'db.t3.medium' : 'db.t3.micro',
      allocatedStorage: 20,
      maxAllocatedStorage: environment === 'prod' ? 100 : 50,
      dbName: `${project}db`,
      username: 'dbadmin',
      backupRetentionPeriod: environment === 'prod' ? 7 : 1,
      backupWindow: '03:00-04:00',
      maintenanceWindow: 'sun:04:00-sun:05:00',
      multiAz: environment === 'prod',
      storageEncrypted: true,
      securityGroupIds: [compute.securityGroup.id],
    };

    // Create database infrastructure
    const database = new DatabaseModule(
      this,
      'database',
      databaseConfig,
      networking.privateSubnets.map(subnet => subnet.id),
      networking.vpc.id
    );
  }
}

// Separate stack for remote state infrastructure (run this first)
class RemoteStateStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    const environment = process.env.ENVIRONMENT || 'dev';
    const project = process.env.PROJECT || 'myapp';
    const region = process.env.AWS_REGION || 'us-west-2';

    new AwsProvider(this, 'AWS', {
      region: region,
    });

    const remoteStateConfig: RemoteStateConfig = {
      bucketName: `${project}-terraform-state-${environment}`,
      dynamoTableName: `${project}-terraform-locks-${environment}`,
      region: region,
      keyPrefix: environment,
    };

    new RemoteStateBackend(this, 'remote-state', remoteStateConfig);
  }
}

const app = new App();

// First deploy the remote state infrastructure
new RemoteStateStack(app, 'remote-state');

// Then deploy the main infrastructure
new InfrastructureStack(app, 'infrastructure');

app.synth();
```
