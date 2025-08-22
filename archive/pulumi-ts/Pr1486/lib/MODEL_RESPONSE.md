I'll provide a comprehensive Pulumi TypeScript solution that meets all your requirements. Here's the modular, production-ready infrastructure code:

## Project Structure

```
src/
├── index.ts
├── components/
│   ├── vpc.ts
│   ├── rds.ts
│   ├── s3.ts
│   └── iam.ts
├── config/
│   └── types.ts
└── utils/
    └── naming.ts
```

## Configuration Types

**src/config/types.ts**

```typescript
export interface InfrastructureConfig {
  region: string;
  availabilityZones: string[];
  vpcCidr: string;
  publicSubnetCidrs: string[];
  privateSubnetCidrs: string[];
  rdsConfig: {
    instanceClass: string;
    allocatedStorage: number;
    engine: string;
    engineVersion: string;
    dbName: string;
    username: string;
  };
  s3Config: {
    lifecyclePolicies: {
      transitionToIa: number;
      transitionToGlacier: number;
      expiration: number;
    };
  };
  tags: Record<string, string>;
}
```

## Utility Functions

**src/utils/naming.ts**

```typescript
export function createResourceName(
  baseName: string,
  region: string,
  environment: string
): string {
  return `${baseName}-${environment}-${region}`;
}

export function createTags(
  baseTags: Record<string, string>,
  region: string
): Record<string, string> {
  return {
    ...baseTags,
    Region: region,
    ManagedBy: 'Pulumi',
  };
}
```

## VPC Component

**src/components/vpc.ts**

```typescript
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { createResourceName, createTags } from '../utils/naming';

export interface VpcComponentArgs {
  config: {
    vpcCidr: string;
    availabilityZones: string[];
    publicSubnetCidrs: string[];
    privateSubnetCidrs: string[];
    tags: Record<string, string>;
  };
  region: string;
  environment: string;
  provider: aws.Provider;
}

export class VpcComponent extends pulumi.ComponentResource {
  public readonly vpc: aws.ec2.Vpc;
  public readonly publicSubnets: aws.ec2.Subnet[];
  public readonly privateSubnets: aws.ec2.Subnet[];
  public readonly internetGateway: aws.ec2.InternetGateway;
  public readonly natGateways: aws.ec2.NatGateway[];
  public readonly publicRouteTable: aws.ec2.RouteTable;
  public readonly privateRouteTables: aws.ec2.RouteTable[];
  public readonly dbSubnetGroup: aws.rds.SubnetGroup;

  constructor(
    name: string,
    args: VpcComponentArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:infrastructure:VpcComponent', name, {}, opts);

    const { config, region, environment, provider } = args;
    const resourceTags = createTags(config.tags, region);

    // VPC
    this.vpc = new aws.ec2.Vpc(
      createResourceName('vpc', region, environment),
      {
        cidrBlock: config.vpcCidr,
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          ...resourceTags,
          Name: createResourceName('vpc', region, environment),
        },
      },
      { provider, parent: this }
    );

    // Internet Gateway
    this.internetGateway = new aws.ec2.InternetGateway(
      createResourceName('igw', region, environment),
      {
        vpcId: this.vpc.id,
        tags: {
          ...resourceTags,
          Name: createResourceName('igw', region, environment),
        },
      },
      { provider, parent: this }
    );

    // Public Subnets
    this.publicSubnets = config.publicSubnetCidrs.map((cidr, index) => {
      return new aws.ec2.Subnet(
        createResourceName(`public-subnet-${index + 1}`, region, environment),
        {
          vpcId: this.vpc.id,
          cidrBlock: cidr,
          availabilityZone: config.availabilityZones[index],
          mapPublicIpOnLaunch: true,
          tags: {
            ...resourceTags,
            Name: createResourceName(
              `public-subnet-${index + 1}`,
              region,
              environment
            ),
            Type: 'Public',
          },
        },
        { provider, parent: this }
      );
    });

    // Private Subnets
    this.privateSubnets = config.privateSubnetCidrs.map((cidr, index) => {
      return new aws.ec2.Subnet(
        createResourceName(`private-subnet-${index + 1}`, region, environment),
        {
          vpcId: this.vpc.id,
          cidrBlock: cidr,
          availabilityZone: config.availabilityZones[index],
          tags: {
            ...resourceTags,
            Name: createResourceName(
              `private-subnet-${index + 1}`,
              region,
              environment
            ),
            Type: 'Private',
          },
        },
        { provider, parent: this }
      );
    });

    // Elastic IPs for NAT Gateways
    const eips = this.publicSubnets.map((_, index) => {
      return new aws.ec2.Eip(
        createResourceName(`nat-eip-${index + 1}`, region, environment),
        {
          domain: 'vpc',
          tags: {
            ...resourceTags,
            Name: createResourceName(
              `nat-eip-${index + 1}`,
              region,
              environment
            ),
          },
        },
        { provider, parent: this, dependsOn: [this.internetGateway] }
      );
    });

    // NAT Gateways
    this.natGateways = this.publicSubnets.map((subnet, index) => {
      return new aws.ec2.NatGateway(
        createResourceName(`nat-gateway-${index + 1}`, region, environment),
        {
          allocationId: eips[index].id,
          subnetId: subnet.id,
          tags: {
            ...resourceTags,
            Name: createResourceName(
              `nat-gateway-${index + 1}`,
              region,
              environment
            ),
          },
        },
        { provider, parent: this, dependsOn: [this.internetGateway] }
      );
    });

    // Public Route Table
    this.publicRouteTable = new aws.ec2.RouteTable(
      createResourceName('public-rt', region, environment),
      {
        vpcId: this.vpc.id,
        tags: {
          ...resourceTags,
          Name: createResourceName('public-rt', region, environment),
        },
      },
      { provider, parent: this }
    );

    // Public Route
    new aws.ec2.Route(
      createResourceName('public-route', region, environment),
      {
        routeTableId: this.publicRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: this.internetGateway.id,
      },
      { provider, parent: this }
    );

    // Associate public subnets with public route table
    this.publicSubnets.forEach((subnet, index) => {
      new aws.ec2.RouteTableAssociation(
        createResourceName(`public-rta-${index + 1}`, region, environment),
        {
          subnetId: subnet.id,
          routeTableId: this.publicRouteTable.id,
        },
        { provider, parent: this }
      );
    });

    // Private Route Tables
    this.privateRouteTables = this.privateSubnets.map((subnet, index) => {
      const routeTable = new aws.ec2.RouteTable(
        createResourceName(`private-rt-${index + 1}`, region, environment),
        {
          vpcId: this.vpc.id,
          tags: {
            ...resourceTags,
            Name: createResourceName(
              `private-rt-${index + 1}`,
              region,
              environment
            ),
          },
        },
        { provider, parent: this }
      );

      // Private Route to NAT Gateway
      new aws.ec2.Route(
        createResourceName(`private-route-${index + 1}`, region, environment),
        {
          routeTableId: routeTable.id,
          destinationCidrBlock: '0.0.0.0/0',
          natGatewayId: this.natGateways[index].id,
        },
        { provider, parent: this }
      );

      // Associate private subnet with private route table
      new aws.ec2.RouteTableAssociation(
        createResourceName(`private-rta-${index + 1}`, region, environment),
        {
          subnetId: subnet.id,
          routeTableId: routeTable.id,
        },
        { provider, parent: this }
      );

      return routeTable;
    });

    // DB Subnet Group
    this.dbSubnetGroup = new aws.rds.SubnetGroup(
      createResourceName('db-subnet-group', region, environment),
      {
        subnetIds: this.privateSubnets.map(subnet => subnet.id),
        tags: {
          ...resourceTags,
          Name: createResourceName('db-subnet-group', region, environment),
        },
      },
      { provider, parent: this }
    );
  }
}
```

## IAM Component

**src/components/iam.ts**

```typescript
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { createResourceName, createTags } from '../utils/naming';

export interface IamComponentArgs {
  region: string;
  environment: string;
  s3BucketArn: pulumi.Input<string>;
  rdsInstanceArn: pulumi.Input<string>;
  kmsKeyArn: pulumi.Input<string>;
  tags: Record<string, string>;
  provider: aws.Provider;
}

export class IamComponent extends pulumi.ComponentResource {
  public readonly applicationRole: aws.iam.Role;
  public readonly applicationInstanceProfile: aws.iam.InstanceProfile;

  constructor(
    name: string,
    args: IamComponentArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:infrastructure:IamComponent', name, {}, opts);

    const {
      region,
      environment,
      s3BucketArn,
      rdsInstanceArn,
      kmsKeyArn,
      tags,
      provider,
    } = args;
    const resourceTags = createTags(tags, region);

    // Application Role Trust Policy
    const trustPolicy = {
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
    };

    // Application Role
    this.applicationRole = new aws.iam.Role(
      createResourceName('app-role', region, environment),
      {
        assumeRolePolicy: JSON.stringify(trustPolicy),
        tags: resourceTags,
      },
      { provider, parent: this }
    );

    // S3 Access Policy
    const s3Policy = new aws.iam.Policy(
      createResourceName('s3-access-policy', region, environment),
      {
        policy: pulumi.all([s3BucketArn]).apply(([bucketArn]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
                Resource: `${bucketArn}/*`,
              },
              {
                Effect: 'Allow',
                Action: ['s3:ListBucket'],
                Resource: bucketArn,
              },
            ],
          })
        ),
        tags: resourceTags,
      },
      { provider, parent: this }
    );

    // KMS Access Policy
    const kmsPolicy = new aws.iam.Policy(
      createResourceName('kms-access-policy', region, environment),
      {
        policy: pulumi.all([kmsKeyArn]).apply(([keyArn]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: ['kms:Decrypt', 'kms:DescribeKey'],
                Resource: keyArn,
              },
            ],
          })
        ),
        tags: resourceTags,
      },
      { provider, parent: this }
    );

    // CloudWatch Logs Policy
    const cloudWatchPolicy = new aws.iam.Policy(
      createResourceName('cloudwatch-policy', region, environment),
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
                'logs:DescribeLogStreams',
              ],
              Resource: `arn:aws:logs:${region}:*:log-group:/aws/application/${environment}/*`,
            },
          ],
        }),
        tags: resourceTags,
      },
      { provider, parent: this }
    );

    // Attach policies to role
    new aws.iam.RolePolicyAttachment(
      createResourceName('s3-policy-attachment', region, environment),
      {
        role: this.applicationRole.name,
        policyArn: s3Policy.arn,
      },
      { provider, parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      createResourceName('kms-policy-attachment', region, environment),
      {
        role: this.applicationRole.name,
        policyArn: kmsPolicy.arn,
      },
      { provider, parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      createResourceName('cloudwatch-policy-attachment', region, environment),
      {
        role: this.applicationRole.name,
        policyArn: cloudWatchPolicy.arn,
      },
      { provider, parent: this }
    );

    // Instance Profile
    this.applicationInstanceProfile = new aws.iam.InstanceProfile(
      createResourceName('app-instance-profile', region, environment),
      {
        role: this.applicationRole.name,
        tags: resourceTags,
      },
      { provider, parent: this }
    );
  }
}
```

## S3 Component

**src/components/s3.ts**

```typescript
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { createResourceName, createTags } from '../utils/naming';

export interface S3ComponentArgs {
  region: string;
  environment: string;
  kmsKeyId: pulumi.Input<string>;
  lifecyclePolicies: {
    transitionToIa: number;
    transitionToGlacier: number;
    expiration: number;
  };
  tags: Record<string, string>;
  provider: aws.Provider;
}

export class S3Component extends pulumi.ComponentResource {
  public readonly bucket: aws.s3.Bucket;
  public readonly bucketArn: pulumi.Output<string>;

  constructor(
    name: string,
    args: S3ComponentArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:infrastructure:S3Component', name, {}, opts);

    const { region, environment, kmsKeyId, lifecyclePolicies, tags, provider } =
      args;
    const resourceTags = createTags(tags, region);
    const bucketName = createResourceName('app-logs', region, environment);

    // S3 Bucket
    this.bucket = new aws.s3.Bucket(
      bucketName,
      {
        bucket: bucketName,
        tags: resourceTags,
      },
      { provider, parent: this }
    );

    this.bucketArn = this.bucket.arn;

    // Block Public Access
    new aws.s3.BucketPublicAccessBlock(
      createResourceName('bucket-pab', region, environment),
      {
        bucket: this.bucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { provider, parent: this }
    );

    // Server-side Encryption
    new aws.s3.BucketServerSideEncryptionConfiguration(
      createResourceName('bucket-encryption', region, environment),
      {
        bucket: this.bucket.id,
        rules: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'aws:kms',
              kmsMasterKeyId: kmsKeyId,
            },
            bucketKeyEnabled: true,
          },
        ],
      },
      { provider, parent: this }
    );

    // Lifecycle Configuration
    new aws.s3.BucketLifecycleConfiguration(
      createResourceName('bucket-lifecycle', region, environment),
      {
        bucket: this.bucket.id,
        rules: [
          {
            id: 'log-lifecycle',
            status: 'Enabled',
            transitions: [
              {
                days: lifecyclePolicies.transitionToIa,
                storageClass: 'STANDARD_IA',
              },
              {
                days: lifecyclePolicies.transitionToGlacier,
                storageClass: 'GLACIER',
              },
            ],
            expiration: {
              days: lifecyclePolicies.expiration,
            },
          },
        ],
      },
      { provider, parent: this }
    );

    // Versioning
    new aws.s3.BucketVersioning(
      createResourceName('bucket-versioning', region, environment),
      {
        bucket: this.bucket.id,
        versioningConfiguration: {
          status: 'Enabled',
        },
      },
      { provider, parent: this }
    );
  }
}
```

## RDS Component

**src/components/rds.ts**

```typescript
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { createResourceName, createTags } from '../utils/naming';

export interface RdsComponentArgs {
  region: string;
  environment: string;
  vpcId: pulumi.Input<string>;
  dbSubnetGroupName: pulumi.Input<string>;
  kmsKeyId: pulumi.Input<string>;
  rdsConfig: {
    instanceClass: string;
    allocatedStorage: number;
    engine: string;
    engineVersion: string;
    dbName: string;
    username: string;
  };
  tags: Record<string, string>;
  provider: aws.Provider;
}

export class RdsComponent extends pulumi.ComponentResource {
  public readonly instance: aws.rds.Instance;
  public readonly securityGroup: aws.ec2.SecurityGroup;
  public readonly instanceArn: pulumi.Output<string>;

  constructor(
    name: string,
    args: RdsComponentArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:infrastructure:RdsComponent', name, {}, opts);

    const {
      region,
      environment,
      vpcId,
      dbSubnetGroupName,
      kmsKeyId,
      rdsConfig,
      tags,
      provider,
    } = args;
    const resourceTags = createTags(tags, region);

    // Generate random password
    const dbPassword = new aws.secretsmanager.Secret(
      createResourceName('db-password', region, environment),
      {
        description: 'RDS instance password',
        generateSecretString: {
          length: 32,
          excludeCharacters: '"@/\\',
        },
        tags: resourceTags,
      },
      { provider, parent: this }
    );

    // Security Group for RDS
    this.securityGroup = new aws.ec2.SecurityGroup(
      createResourceName('rds-sg', region, environment),
      {
        namePrefix: createResourceName('rds-sg', region, environment),
        vpcId: vpcId,
        description: 'Security group for RDS instance',
        ingress: [
          {
            fromPort: 3306,
            toPort: 3306,
            protocol: 'tcp',
            cidrBlocks: ['10.0.0.0/8'], // Restrict to VPC CIDR range
            description: 'MySQL access from VPC',
          },
        ],
        egress: [
          {
            fromPort: 0,
            toPort: 0,
            protocol: '-1',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'All outbound traffic',
          },
        ],
        tags: {
          ...resourceTags,
          Name: createResourceName('rds-sg', region, environment),
        },
      },
      { provider, parent: this }
    );

    // Parameter Group
    const parameterGroup = new aws.rds.ParameterGroup(
      createResourceName('db-params', region, environment),
      {
        family: `${rdsConfig.engine}${rdsConfig.engineVersion.split('.')[0]}.${
          rdsConfig.engineVersion.split('.')[1]
        }`,
        description: `Parameter group for ${rdsConfig.engine}`,
        parameters: [
          {
            name: 'innodb_buffer_pool_size',
            value: '{DBInstanceClassMemory*3/4}',
          },
        ],
        tags: resourceTags,
      },
      { provider, parent: this }
    );

    // RDS Instance
    this.instance = new aws.rds.Instance(
      createResourceName('db-instance', region, environment),
      {
        identifier: createResourceName('db-instance', region, environment),
        engine: rdsConfig.engine,
        engineVersion: rdsConfig.engineVersion,
        instanceClass: rdsConfig.instanceClass,
        allocatedStorage: rdsConfig.allocatedStorage,
        storageType: 'gp3',
        storageEncrypted: true,
        kmsKeyId: kmsKeyId,

        dbName: rdsConfig.dbName,
        username: rdsConfig.username,
        password: dbPassword.id,

        dbSubnetGroupName: dbSubnetGroupName,
        vpcSecurityGroupIds: [this.securityGroup.id],
        parameterGroupName: parameterGroup.name,

        // Backup Configuration
        backupRetentionPeriod: 7,
        backupWindow: '03:00-04:00',
        maintenanceWindow: 'sun:04:00-sun:05:00',

        // Security
        deletionProtection: true,
        skipFinalSnapshot: false,
        finalSnapshotIdentifier: pulumi.interpolate`${createResourceName(
          'db-final-snapshot',
          region,
          environment
        )}-${Date.now()}`,

        // Monitoring
        monitoringInterval: 60,
        performanceInsightsEnabled: true,
        performanceInsightsKmsKeyId: kmsKeyId,

        tags: {
          ...resourceTags,
          Name: createResourceName('db-instance', region, environment),
        },
      },
      { provider, parent: this }
    );

    this.instanceArn = this.instance.arn;
  }
}
```

## Main Infrastructure

**src/index.ts**

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { InfrastructureConfig } from './config/types';
import { VpcComponent } from './components/vpc';
import { RdsComponent } from './components/rds';
import { S3Component } from './components/s3';
import { IamComponent } from './components/iam';
import { createResourceName, createTags } from './utils/naming';

// Get configuration
const config = new pulumi.Config();
const environment = pulumi.getStack();
const region = config.require('region');

const infrastructureConfig: InfrastructureConfig = {
  region,
  availabilityZones: config.requireObject<string[]>('availabilityZones'),
  vpcCidr: config.require('vpcCidr'),
  publicSubnetCidrs: config.requireObject<string[]>('publicSubnetCidrs'),
  privateSubnetCidrs: config.requireObject<string[]>('privateSubnetCidrs'),
  rdsConfig: config.requireObject('rdsConfig'),
  s3Config: config.requireObject('s3Config'),
  tags: config.getObject<Record<string, string>>('tags') || {},
};

// Create region-specific provider
const provider = new aws.Provider('regional-provider', {
  region: region,
  defaultTags: {
    tags: createTags(infrastructureConfig.tags, region),
  },
});

// KMS Key for encryption
const kmsKey = new aws.kms.Key(
  createResourceName('app-key', region, environment),
  {
    description: `KMS key for ${environment} environment in ${region}`,
    enableKeyRotation: true,
    tags: createTags(infrastructureConfig.tags, region),
  },
  { provider }
);

const kmsAlias = new aws.kms.Alias(
  createResourceName('app-key-alias', region, environment),
  {
    name: `alias/${createResourceName('app-key', region, environment)}`,
    targetKeyId: kmsKey.keyId,
  },
  { provider }
);

// VPC Component
const vpc = new VpcComponent(
  'vpc',
  {
    config: {
      vpcCidr: infrastructureConfig.vpcCidr,
      availabilityZones: infrastructureConfig.availabilityZones,
      publicSubnetCidrs: infrastructureConfig.publicSubnetCidrs,
      privateSubnetCidrs: infrastructureConfig.privateSubnetCidrs,
      tags: infrastructureConfig.tags,
    },
    region,
    environment,
    provider,
  },
  { provider }
);

// S3 Component
const s3 = new S3Component(
  's3',
  {
    region,
    environment,
    kmsKeyId: kmsKey.keyId,
    lifecyclePolicies: infrastructureConfig.s3Config.lifecyclePolicies,
    tags: infrastructureConfig.tags,
    provider,
  },
  { provider }
);

// RDS Component
const rds = new RdsComponent(
  'rds',
  {
    region,
    environment,
    vpcId: vpc.vpc.id,
    dbSubnetGroupName: vpc.dbSubnetGroup.name,
    kmsKeyId: kmsKey.keyId,
    rdsConfig: infrastructureConfig.rdsConfig,
    tags: infrastructureConfig.tags,
    provider,
  },
  { provider }
);

// IAM Component
const iam = new IamComponent(
  'iam',
  {
    region,
    environment,
    s3BucketArn: s3.bucketArn,
    rdsInstanceArn: rds.instanceArn,
    kmsKeyArn: kmsKey.arn,
    tags: infrastructureConfig.tags,
    provider,
  },
  { provider }
);

// Exports
export const vpcId = vpc.vpc.id;
export const publicSubnetIds = vpc.publicSubnets.map(subnet => subnet.id);
export const privateSubnetIds = vpc.privateSubnets.map(subnet => subnet.id);
export const rdsEndpoint = rds.instance.endpoint;
export const s3BucketName = s3.bucket.bucket;
export const applicationRoleArn = iam.applicationRole.arn;
export const kmsKeyId = kmsKey.keyId;
```

## Configuration Files

**Pulumi.dev-us-east-1.yaml**

```yaml
config:
  aws:region: us-east-1
  infrastructure:region: us-east-1
  infrastructure:availabilityZones:
    - us-east-1a
    - us-east-1b
  infrastructure:vpcCidr: 10.0.0.0/16
  infrastructure:publicSubnetCidrs:
    - 10.0.1.0/24
    - 10.0.2.0/24
  infrastructure:privateSubnetCidrs:
    - 10.0.10.0/24
    - 10.0.20.0/24
  infrastructure:rdsConfig:
    instanceClass: db.t3.micro
    allocatedStorage: 20
    engine: mysql
    engineVersion: '8.0'
    dbName: appdb
    username: admin
  infrastructure:s3Config:
    lifecyclePolicies:
      transitionToIa: 30
      transitionToGlacier: 90
      expiration: 365
  infrastructure:tags:
    Environment: dev
    Project: MyApp
    Owner: DevTeam
```

**Pulumi.dev-us-west-2.yaml**

```yaml
config:
  aws:region: us-west-2
  infrastructure:region: us-west-2
  infrastructure:availabilityZones:
    - us-west-2a
    - us-west-2b
  infrastructure:vpcCidr: 10.1.0.0/16
  infrastructure:publicSubnetCidrs:
    - 10.1.1.0/24
    - 10.1.2.0/24
  infrastructure:privateSubnetCidrs:
    - 10.1.10.0/24
    - 10.1.20.0/24
  infrastructure:rdsConfig:
    instanceClass: db.t3.micro
    allocatedStorage: 20
    engine: mysql
    engineVersion: '8.0'
    dbName: appdb
    username: admin
  infrastructure:s3Config:
    lifecyclePolicies:
      transitionToIa: 30
      transitionToGlacier: 90
      expiration: 365
  infrastructure:tags:
    Environment: dev
    Project: MyApp
    Owner: DevTeam
```

## Package.json

```json
{
  "name": "multi-region-infrastructure",
  "version": "1.0.0",
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0"
  },
  "dependencies": {
    "@pulumi/pulumi": "^3.0.0",
    "@pulumi/aws": "^6.0.0"
  }
}
```

## Deployment Commands

```bash
# Deploy to US East 1
pulumi stack init dev-us-east-1
pulumi config set aws:region us-east-1
pulumi up

# Deploy to US West 2
pulumi stack init dev-us-west-2
pulumi config set aws:region us-west-2
pulumi up
```

## Key Features

1. **Multi-Region Support**: Each stack uses region-specific providers and configurations
2. **Security Best Practices**:
   - KMS encryption for all storage
   - Least privilege IAM policies
   - Private subnets for databases
   - Security groups with restricted access
3. **High Availability**: Resources distributed across multiple AZs
4. **Scalability**: Component-based architecture for easy extension
5. **Maintainability**: Clear separation of concerns and reusable components
6. **Production-Ready**: Includes backup policies, monitoring, and proper tagging

This infrastructure follows AWS Well-Architected Framework principles and can be easily deployed across multiple regions with different configurations.
