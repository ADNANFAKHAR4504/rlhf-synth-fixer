I'll create a secure, region-agnostic AWS infrastructure using Pulumi with TypeScript. Here's a modular, production-ready solution:

## Project Structure

```
infrastructure/
├── index.ts
├── config/
│   └── index.ts
├── modules/
│   ├── kms/
│   │   └── index.ts
│   ├── iam/
│   │   └── index.ts
│   ├── vpc/
│   │   └── index.ts
│   ├── s3/
│   │   └── index.ts
│   ├── rds/
│   │   └── index.ts
│   └── ec2/
│       └── index.ts
└── utils/
    └── tags.ts
```

## Core Configuration

**config/index.ts**

```typescript
import * as pulumi from '@pulumi/pulumi';

const config = new pulumi.Config();

export interface InfraConfig {
  region: string;
  environment: string;
  owner: string;
  project: string;
  enablePublicIps: boolean;
  enableKeyPairs: boolean;
  vpcCidr: string;
  dbInstanceClass: string;
  ec2InstanceType: string;
}

export const infraConfig: InfraConfig = {
  region: config.require('region'),
  environment: config.require('environment'),
  owner: config.require('owner'),
  project: config.require('project'),
  enablePublicIps: config.getBoolean('enablePublicIps') ?? false,
  enableKeyPairs: config.getBoolean('enableKeyPairs') ?? false,
  vpcCidr: config.get('vpcCidr') ?? '10.0.0.0/16',
  dbInstanceClass: config.get('dbInstanceClass') ?? 'db.t3.micro',
  ec2InstanceType: config.get('ec2InstanceType') ?? 't3.micro',
};
```

**utils/tags.ts**

```typescript
import { infraConfig } from '../config';

export const defaultTags = {
  Environment: infraConfig.environment,
  Owner: infraConfig.owner,
  Project: infraConfig.project,
};

export function createTags(
  additionalTags: Record<string, string> = {}
): Record<string, string> {
  return {
    ...defaultTags,
    ...additionalTags,
  };
}
```

## KMS Module

**modules/kms/index.ts**

```typescript
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { createTags } from '../../utils/tags';

export interface KmsKeyArgs {
  description: string;
  alias: string;
  additionalTags?: Record<string, string>;
}

export class KmsKey extends pulumi.ComponentResource {
  public readonly key: aws.kms.Key;
  public readonly alias: aws.kms.Alias;

  constructor(
    name: string,
    args: KmsKeyArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:kms:Key', name, {}, opts);

    this.key = new aws.kms.Key(
      `${name}-key`,
      {
        description: args.description,
        enableKeyRotation: true,
        deletionWindowInDays: 7,
        tags: createTags({
          Name: `${name}-key`,
          ...args.additionalTags,
        }),
      },
      { parent: this }
    );

    this.alias = new aws.kms.Alias(
      `${name}-alias`,
      {
        name: `alias/${args.alias}`,
        targetKeyId: this.key.keyId,
      },
      { parent: this }
    );

    this.registerOutputs({
      keyId: this.key.keyId,
      keyArn: this.key.arn,
      aliasName: this.alias.name,
    });
  }
}
```

## IAM Module

**modules/iam/index.ts**

```typescript
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { createTags } from '../../utils/tags';

export interface IamRoleArgs {
  assumeRolePolicy: pulumi.Input<string>;
  policies?: pulumi.Input<string>[];
  managedPolicyArns?: pulumi.Input<string>[];
  additionalTags?: Record<string, string>;
}

export class IamRole extends pulumi.ComponentResource {
  public readonly role: aws.iam.Role;
  public readonly instanceProfile?: aws.iam.InstanceProfile;

  constructor(
    name: string,
    args: IamRoleArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:iam:Role', name, {}, opts);

    this.role = new aws.iam.Role(
      `${name}-role`,
      {
        assumeRolePolicy: args.assumeRolePolicy,
        tags: createTags({
          Name: `${name}-role`,
          ...args.additionalTags,
        }),
      },
      { parent: this }
    );

    // Attach inline policies
    if (args.policies) {
      args.policies.forEach((policy, index) => {
        new aws.iam.RolePolicy(
          `${name}-policy-${index}`,
          {
            role: this.role.id,
            policy: policy,
          },
          { parent: this }
        );
      });
    }

    // Attach managed policies
    if (args.managedPolicyArns) {
      args.managedPolicyArns.forEach((policyArn, index) => {
        new aws.iam.RolePolicyAttachment(
          `${name}-attachment-${index}`,
          {
            role: this.role.name,
            policyArn: policyArn,
          },
          { parent: this }
        );
      });
    }

    // Create instance profile for EC2 roles
    if (args.assumeRolePolicy.toString().includes('ec2.amazonaws.com')) {
      this.instanceProfile = new aws.iam.InstanceProfile(
        `${name}-profile`,
        {
          role: this.role.name,
          tags: createTags({
            Name: `${name}-profile`,
            ...args.additionalTags,
          }),
        },
        { parent: this }
      );
    }

    this.registerOutputs({
      roleArn: this.role.arn,
      roleName: this.role.name,
      instanceProfileArn: this.instanceProfile?.arn,
    });
  }
}

// Pre-defined secure policies
export const ec2LoggingPolicy = JSON.stringify({
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
      Resource: 'arn:aws:logs:*:*:*',
    },
  ],
});

export const s3ReadOnlyPolicy = (bucketArn: pulumi.Input<string>) =>
  pulumi.interpolate`{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": [
          "s3:GetObject",
          "s3:GetObjectVersion"
        ],
        "Resource": "${bucketArn}/*"
      }
    ]
  }`;
```

## VPC Module

**modules/vpc/index.ts**

```typescript
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { createTags } from '../../utils/tags';

export interface VpcArgs {
  cidrBlock: string;
  enableDnsHostnames?: boolean;
  enableDnsSupport?: boolean;
  additionalTags?: Record<string, string>;
}

export class Vpc extends pulumi.ComponentResource {
  public readonly vpc: aws.ec2.Vpc;
  public readonly privateSubnets: aws.ec2.Subnet[];
  public readonly publicSubnets: aws.ec2.Subnet[];
  public readonly internetGateway: aws.ec2.InternetGateway;
  public readonly natGateways: aws.ec2.NatGateway[];
  public readonly privateRouteTables: aws.ec2.RouteTable[];
  public readonly publicRouteTable: aws.ec2.RouteTable;

  constructor(
    name: string,
    args: VpcArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:vpc:Vpc', name, {}, opts);

    // VPC
    this.vpc = new aws.ec2.Vpc(
      `${name}-vpc`,
      {
        cidrBlock: args.cidrBlock,
        enableDnsHostnames: args.enableDnsHostnames ?? true,
        enableDnsSupport: args.enableDnsSupport ?? true,
        tags: createTags({
          Name: `${name}-vpc`,
          ...args.additionalTags,
        }),
      },
      { parent: this }
    );

    // Internet Gateway
    this.internetGateway = new aws.ec2.InternetGateway(
      `${name}-igw`,
      {
        vpcId: this.vpc.id,
        tags: createTags({
          Name: `${name}-igw`,
          ...args.additionalTags,
        }),
      },
      { parent: this }
    );

    // Get availability zones
    const availabilityZones = aws.getAvailabilityZones({
      state: 'available',
    });

    // Create subnets
    this.privateSubnets = [];
    this.publicSubnets = [];
    this.natGateways = [];
    this.privateRouteTables = [];

    availabilityZones.then(azs => {
      const azCount = Math.min(azs.names.length, 3); // Use up to 3 AZs

      for (let i = 0; i < azCount; i++) {
        const az = azs.names[i];

        // Public subnet
        const publicSubnet = new aws.ec2.Subnet(
          `${name}-public-${i}`,
          {
            vpcId: this.vpc.id,
            cidrBlock: `10.0.${i * 2 + 1}.0/24`,
            availabilityZone: az,
            mapPublicIpOnLaunch: false, // Explicitly disable auto-assign public IP
            tags: createTags({
              Name: `${name}-public-${i}`,
              Type: 'public',
              ...args.additionalTags,
            }),
          },
          { parent: this }
        );

        this.publicSubnets.push(publicSubnet);

        // Private subnet
        const privateSubnet = new aws.ec2.Subnet(
          `${name}-private-${i}`,
          {
            vpcId: this.vpc.id,
            cidrBlock: `10.0.${i * 2 + 2}.0/24`,
            availabilityZone: az,
            tags: createTags({
              Name: `${name}-private-${i}`,
              Type: 'private',
              ...args.additionalTags,
            }),
          },
          { parent: this }
        );

        this.privateSubnets.push(privateSubnet);

        // Elastic IP for NAT Gateway
        const eip = new aws.ec2.Eip(
          `${name}-nat-eip-${i}`,
          {
            domain: 'vpc',
            tags: createTags({
              Name: `${name}-nat-eip-${i}`,
              ...args.additionalTags,
            }),
          },
          { parent: this }
        );

        // NAT Gateway
        const natGateway = new aws.ec2.NatGateway(
          `${name}-nat-${i}`,
          {
            allocationId: eip.id,
            subnetId: publicSubnet.id,
            tags: createTags({
              Name: `${name}-nat-${i}`,
              ...args.additionalTags,
            }),
          },
          { parent: this }
        );

        this.natGateways.push(natGateway);

        // Private route table
        const privateRouteTable = new aws.ec2.RouteTable(
          `${name}-private-rt-${i}`,
          {
            vpcId: this.vpc.id,
            tags: createTags({
              Name: `${name}-private-rt-${i}`,
              ...args.additionalTags,
            }),
          },
          { parent: this }
        );

        new aws.ec2.Route(
          `${name}-private-route-${i}`,
          {
            routeTableId: privateRouteTable.id,
            destinationCidrBlock: '0.0.0.0/0',
            natGatewayId: natGateway.id,
          },
          { parent: this }
        );

        new aws.ec2.RouteTableAssociation(
          `${name}-private-rta-${i}`,
          {
            subnetId: privateSubnet.id,
            routeTableId: privateRouteTable.id,
          },
          { parent: this }
        );

        this.privateRouteTables.push(privateRouteTable);
      }
    });

    // Public route table
    this.publicRouteTable = new aws.ec2.RouteTable(
      `${name}-public-rt`,
      {
        vpcId: this.vpc.id,
        tags: createTags({
          Name: `${name}-public-rt`,
          ...args.additionalTags,
        }),
      },
      { parent: this }
    );

    new aws.ec2.Route(
      `${name}-public-route`,
      {
        routeTableId: this.publicRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: this.internetGateway.id,
      },
      { parent: this }
    );

    // Associate public subnets with public route table
    this.publicSubnets.forEach((subnet, i) => {
      new aws.ec2.RouteTableAssociation(
        `${name}-public-rta-${i}`,
        {
          subnetId: subnet.id,
          routeTableId: this.publicRouteTable.id,
        },
        { parent: this }
      );
    });

    this.registerOutputs({
      vpcId: this.vpc.id,
      vpcCidrBlock: this.vpc.cidrBlock,
      privateSubnetIds: this.privateSubnets.map(s => s.id),
      publicSubnetIds: this.publicSubnets.map(s => s.id),
    });
  }
}
```

## S3 Module

**modules/s3/index.ts**

```typescript
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { createTags } from '../../utils/tags';

export interface S3BucketArgs {
  kmsKeyId: pulumi.Input<string>;
  versioning?: boolean;
  lifecycleRules?: aws.s3.BucketLifecycleConfigurationRule[];
  additionalTags?: Record<string, string>;
}

export class S3Bucket extends pulumi.ComponentResource {
  public readonly bucket: aws.s3.Bucket;
  public readonly bucketPublicAccessBlock: aws.s3.BucketPublicAccessBlock;

  constructor(
    name: string,
    args: S3BucketArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:s3:Bucket', name, {}, opts);

    this.bucket = new aws.s3.Bucket(
      `${name}-bucket`,
      {
        tags: createTags({
          Name: `${name}-bucket`,
          ...args.additionalTags,
        }),
      },
      { parent: this }
    );

    // Block all public access
    this.bucketPublicAccessBlock = new aws.s3.BucketPublicAccessBlock(
      `${name}-pab`,
      {
        bucket: this.bucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    // Server-side encryption
    new aws.s3.BucketServerSideEncryptionConfiguration(
      `${name}-encryption`,
      {
        bucket: this.bucket.id,
        rules: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'aws:kms',
              kmsMasterKeyId: args.kmsKeyId,
            },
            bucketKeyEnabled: true,
          },
        ],
      },
      { parent: this }
    );

    // Versioning
    new aws.s3.BucketVersioning(
      `${name}-versioning`,
      {
        bucket: this.bucket.id,
        versioningConfiguration: {
          status: args.versioning !== false ? 'Enabled' : 'Suspended',
        },
      },
      { parent: this }
    );

    // Lifecycle configuration
    if (args.lifecycleRules) {
      new aws.s3.BucketLifecycleConfiguration(
        `${name}-lifecycle`,
        {
          bucket: this.bucket.id,
          rules: args.lifecycleRules,
        },
        { parent: this }
      );
    }

    // Logging
    new aws.s3.BucketLogging(
      `${name}-logging`,
      {
        bucket: this.bucket.id,
        targetBucket: this.bucket.id,
        targetPrefix: 'access-logs/',
      },
      { parent: this }
    );

    // Notification configuration for CloudTrail
    new aws.s3.BucketNotification(
      `${name}-notification`,
      {
        bucket: this.bucket.id,
      },
      { parent: this }
    );

    this.registerOutputs({
      bucketName: this.bucket.id,
      bucketArn: this.bucket.arn,
      bucketDomainName: this.bucket.bucketDomainName,
    });
  }
}
```

## RDS Module

**modules/rds/index.ts**

```typescript
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { createTags } from '../../utils/tags';

export interface RdsInstanceArgs {
  instanceClass: string;
  engine: string;
  engineVersion: string;
  allocatedStorage: number;
  dbName: string;
  username: string;
  password: pulumi.Input<string>;
  vpcSecurityGroupIds: pulumi.Input<string>[];
  subnetGroupName: pulumi.Input<string>;
  kmsKeyId: pulumi.Input<string>;
  backupRetentionPeriod?: number;
  backupWindow?: string;
  maintenanceWindow?: string;
  additionalTags?: Record<string, string>;
}

export class RdsInstance extends pulumi.ComponentResource {
  public readonly instance: aws.rds.Instance;
  public readonly subnetGroup: aws.rds.SubnetGroup;

  constructor(
    name: string,
    args: RdsInstanceArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:rds:Instance', name, {}, opts);

    this.instance = new aws.rds.Instance(
      `${name}-db`,
      {
        identifier: `${name}-db`,
        instanceClass: args.instanceClass,
        engine: args.engine,
        engineVersion: args.engineVersion,
        allocatedStorage: args.allocatedStorage,
        storageType: 'gp3',
        storageEncrypted: true,
        kmsKeyId: args.kmsKeyId,

        dbName: args.dbName,
        username: args.username,
        password: args.password,

        vpcSecurityGroupIds: args.vpcSecurityGroupIds,
        dbSubnetGroupName: args.subnetGroupName,

        backupRetentionPeriod: args.backupRetentionPeriod ?? 7,
        backupWindow: args.backupWindow ?? '03:00-04:00',
        maintenanceWindow: args.maintenanceWindow ?? 'sun:04:00-sun:05:00',

        skipFinalSnapshot: false,
        finalSnapshotIdentifier: `${name}-final-snapshot`,
        deleteAutomatedBackups: false,

        enabledCloudwatchLogsExports: ['error', 'general', 'slowquery'],
        monitoringInterval: 60,
        monitoringRoleArn: this.createMonitoringRole().arn,

        performanceInsightsEnabled: true,
        performanceInsightsKmsKeyId: args.kmsKeyId,
        performanceInsightsRetentionPeriod: 7,

        tags: createTags({
          Name: `${name}-db`,
          ...args.additionalTags,
        }),
      },
      { parent: this }
    );

    this.registerOutputs({
      instanceId: this.instance.id,
      instanceArn: this.instance.arn,
      instanceEndpoint: this.instance.endpoint,
      instancePort: this.instance.port,
    });
  }

  private createMonitoringRole(): aws.iam.Role {
    const role = new aws.iam.Role(
      `${this.getResource().name}-monitoring-role`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'monitoring.rds.amazonaws.com',
              },
            },
          ],
        }),
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `${this.getResource().name}-monitoring-attachment`,
      {
        role: role.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole',
      },
      { parent: this }
    );

    return role;
  }
}

export function createDbSubnetGroup(
  name: string,
  subnetIds: pulumi.Input<string>[],
  tags?: Record<string, string>,
  parent?: pulumi.Resource
): aws.rds.SubnetGroup {
  return new aws.rds.SubnetGroup(
    `${name}-subnet-group`,
    {
      subnetIds: subnetIds,
      tags: createTags({
        Name: `${name}-subnet-group`,
        ...tags,
      }),
    },
    { parent }
  );
}
```

## EC2 Module

**modules/ec2/index.ts**

```typescript
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { createTags } from '../../utils/tags';

export interface Ec2InstanceArgs {
  instanceType: string;
  subnetId: pulumi.Input<string>;
  vpcSecurityGroupIds: pulumi.Input<string>[];
  iamInstanceProfile?: pulumi.Input<string>;
  userData?: pulumi.Input<string>;
  keyName?: pulumi.Input<string>;
  associatePublicIpAddress?: boolean;
  rootVolumeSize?: number;
  rootVolumeType?: string;
  kmsKeyId: pulumi.Input<string>;
  additionalTags?: Record<string, string>;
}

export class Ec2Instance extends pulumi.ComponentResource {
  public readonly instance: aws.ec2.Instance;

  constructor(
    name: string,
    args: Ec2InstanceArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:ec2:Instance', name, {}, opts);

    // Get latest Amazon Linux 2 AMI
    const ami = aws.ec2.getAmi({
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
    });

    this.instance = new aws.ec2.Instance(
      `${name}-instance`,
      {
        instanceType: args.instanceType,
        ami: ami.then(a => a.id),
        subnetId: args.subnetId,
        vpcSecurityGroupIds: args.vpcSecurityGroupIds,
        iamInstanceProfile: args.iamInstanceProfile,
        userData: args.userData,
        keyName: args.keyName,
        associatePublicIpAddress: args.associatePublicIpAddress ?? false,

        rootBlockDevice: {
          volumeType: args.rootVolumeType ?? 'gp3',
          volumeSize: args.rootVolumeSize ?? 20,
          encrypted: true,
          kmsKeyId: args.kmsKeyId,
          deleteOnTermination: true,
        },

        metadataOptions: {
          httpEndpoint: 'enabled',
          httpTokens: 'required',
          httpPutResponseHopLimit: 1,
          instanceMetadataTags: 'enabled',
        },

        monitoring: true,

        tags: createTags({
          Name: `${name}-instance`,
          ...args.additionalTags,
        }),

        volumeTags: createTags({
          Name: `${name}-instance-volume`,
          ...args.additionalTags,
        }),
      },
      { parent: this }
    );

    this.registerOutputs({
      instanceId: this.instance.id,
      instanceArn: this.instance.arn,
      privateIp: this.instance.privateIp,
      publicIp: this.instance.publicIp,
    });
  }
}

export function createSecurityGroup(
  name: string,
  vpcId: pulumi.Input<string>,
  rules: {
    ingress?: aws.ec2.SecurityGroupIngressArgs[];
    egress?: aws.ec2.SecurityGroupEgressArgs[];
  },
  tags?: Record<string, string>,
  parent?: pulumi.Resource
): aws.ec2.SecurityGroup {
  return new aws.ec2.SecurityGroup(
    `${name}-sg`,
    {
      vpcId: vpcId,
      description: `Security group for ${name}`,
      ingress: rules.ingress ?? [],
      egress: rules.egress ?? [
        {
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
        },
      ],
      tags: createTags({
        Name: `${name}-sg`,
        ...tags,
      }),
    },
    { parent }
  );
}
```

## Main Infrastructure

**index.ts**

```typescript
import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import { infraConfig } from "./config";
import { KmsKey } from "./modules/kms";
import { IamRole, ec2LoggingPolicy } from "./modules/iam";
import { Vpc } from "./modules/vpc";
import { S3Bucket } from "./modules/s3";
import { RdsInstance, createDbSubnetGroup } from "./modules/rds";
import { Ec2Instance, createSecurityGroup } from "./modules/ec2";
import { createTags } from "./utils/tags";

// Configure AWS provider for the specified region
const provider = new aws.Provider("aws-provider", {
  region: infraConfig.region,
});

// KMS Keys
const mainKmsKey = new KmsKey("main", {
  description: "Main KMS key for encryption",
  alias: `${infraConfig.project}-${infraConfig.environment}-main`,
}, { provider });

const rdsKmsKey = new KmsKey("rds", {
  description: "KMS key for RDS encryption",
  alias: `${infraConfig.project}-${infraConfig.environment}-rds`,
}, { provider });

// VPC
const vpc = new Vpc("main", {
  cidrBlock: infraConfig.vpcCidr,
}, { provider });

// IAM Roles
const ec2Role = new IamRole("ec2", {
  assumeRolePolicy: JSON.stringify({
    Version: "2012-10-17",
    Statement: [{
      Action: "sts:AssumeRole",
      Effect: "Allow",
      Principal: {
        Service: "ec2.amazonaws.com",
      },
    }],
  }),
  policies: [ec2LoggingPolicy],
  managedPolicyArns: ["arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"],
}, { provider });

// S3 Buckets
const dataBucket = new S3Bucket("data", {
  kmsKeyId: mainKmsKey.key.arn,
  lifecycleRules: [{
    id: "transition-to-ia",
    status: "Enabled",
    transitions: [{
      days: 30,
      storageClass: "STANDARD_IA",
    }],
  }],
}, { provider });

const logsBucket = new S3Bucket("logs", {
  kmsKeyId: mainKmsKey.key.arn,
  lifecycleRules: [{
    id: "delete-old-logs",
    status: "Enabled",
    expiration: {
      days: 90,
    },
  }],
}, { provider });

// Security Groups
const webSecurityGroup = createSecurityGroup("web", vpc.vpc.id, {
  ingress: [
    {
      fromPort: 443,
      toPort: 443,
      protocol: "tcp",
      cidrBlocks: ["0.0.0.0/0"],
      description: "HTTPS from anywhere",
    },
    {
      fromPort: 80,
      toPort: 80,
      protocol: "tcp",
      cidrBlocks: ["0.0.0.0/0"],
      description: "HTTP from anywhere",
    },
  ],
}, undefined, { provider });

const appSecurityGroup = createSecurityGroup("app", vpc.vpc.id, {
  ingress: [
    {
      fromPort: 8080,
      toPort: 8080,
      protocol: "tcp",
      sourceSecurityGroupId: webSecurityGroup.id,
      description: "App port from web tier",
    },
  ],
}, undefined, { provider });

const dbSecurityGroup = createSecurityGroup("db", vpc.vpc.id, {
  ingress: [
    {
      fromPort: 3306,
      toPort: 3306,
      protocol: "tcp",
      sourceSecurityGroupId: appSecurityGroup.id,
      description: "MySQL from app tier",
    },
  ],
}, undefined, { provider });

// RDS
const dbSubnetGroup = createDbSubnetGroup(
  "main",
  vpc.privateSubnets.map(subnet => subnet.id),
  undefined,
  { provider }
);

const database = new RdsInstance("main", {
  instanceClass: infraConfig.dbInstanceClass,
  engine: "mysql",
  engineVersion: "8.0",
  allocatedStorage: 20,
  dbName: "maindb",
  username: "admin",
  password: pulumi.secret("changeme123!"), // Use Pulumi secrets in production
  vpcSecurityGroupIds: [dbSecurityGroup.id],
  subnetGroupName: dbSubnetGroup.name,
  kmsKeyId: rdsKmsKey.key.arn,
}, { provider });

// EC2 Instances
const webInstance = new Ec2Instance("web", {
  instanceType: infraConfig.ec2InstanceType,
  subnetId: vpc.privateSubnets[0].id, // Private subnet
  vpcSecurityGroupIds: [webSecurityGroup.id],
  iamInstanceProfile: ec2Role.instanceProfile?.name,
  kmsKeyId: mainKmsKey.key.arn,
  keyName: infraConfig.enableKeyPairs ? "my-key-pair" : undefined,
  userData: pulumi.interpolate`#!/bin/bash
yum update -y
yum install -y amazon-cloudwatch-agent
# Configure CloudWatch agent
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOF'
{
  "logs
```
