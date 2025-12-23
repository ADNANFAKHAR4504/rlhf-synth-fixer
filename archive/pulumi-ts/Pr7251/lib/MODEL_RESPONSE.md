# Multi-Region Disaster Recovery Infrastructure

This implementation provides a comprehensive multi-region disaster recovery solution using Pulumi with TypeScript, spanning us-east-1 (primary) and us-west-2 (DR) regions.

## File: lib/types.ts

```typescript
import * as aws from "@pulumi/aws";

export interface NetworkConfig {
  cidr: string;
  availabilityZones: string[];
  environmentSuffix: string;
  region: string;
}

export interface RegionalInfrastructureProps {
  environmentSuffix: string;
  region: string;
  isPrimary: boolean;
  vpcCidr: string;
  globalClusterId?: aws.rds.GlobalCluster;
  peerVpcId?: string;
  peerRegion?: string;
  tags: { [key: string]: string };
}

export interface DatabaseConfig {
  engine: string;
  engineVersion: string;
  instanceClass: string;
  skipFinalSnapshot: boolean;
  deletionProtection: boolean;
}
```

## File: lib/networking.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import { NetworkConfig } from "./types";

export class NetworkingComponent extends pulumi.ComponentResource {
  public readonly vpc: aws.ec2.Vpc;
  public readonly privateSubnets: aws.ec2.Subnet[];
  public readonly publicSubnets: aws.ec2.Subnet[];
  public readonly internetGateway: aws.ec2.InternetGateway;
  public readonly natGateways: aws.ec2.NatGateway[];
  public readonly privateRouteTables: aws.ec2.RouteTable[];
  public readonly publicRouteTable: aws.ec2.RouteTable;
  public readonly securityGroup: aws.ec2.SecurityGroup;

  constructor(
    name: string,
    args: NetworkConfig,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super("custom:networking:NetworkingComponent", name, {}, opts);

    const tags = {
      Name: `${name}-${args.environmentSuffix}`,
      Environment: args.environmentSuffix,
      Region: args.region,
    };

    // Create VPC
    this.vpc = new aws.ec2.Vpc(
      `${name}-vpc`,
      {
        cidrBlock: args.cidr,
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: { ...tags, Name: `vpc-${args.environmentSuffix}` },
      },
      { parent: this }
    );

    // Create Internet Gateway
    this.internetGateway = new aws.ec2.InternetGateway(
      `${name}-igw`,
      {
        vpcId: this.vpc.id,
        tags: { ...tags, Name: `igw-${args.environmentSuffix}` },
      },
      { parent: this }
    );

    // Create public subnets
    this.publicSubnets = [];
    for (let i = 0; i < args.availabilityZones.length; i++) {
      const subnet = new aws.ec2.Subnet(
        `${name}-public-subnet-${i}`,
        {
          vpcId: this.vpc.id,
          cidrBlock: `${args.cidr.split(".").slice(0, 2).join(".")}.${i}.0/24`,
          availabilityZone: args.availabilityZones[i],
          mapPublicIpOnLaunch: true,
          tags: {
            ...tags,
            Name: `public-subnet-${i}-${args.environmentSuffix}`,
            Type: "public",
          },
        },
        { parent: this }
      );
      this.publicSubnets.push(subnet);
    }

    // Create private subnets
    this.privateSubnets = [];
    for (let i = 0; i < args.availabilityZones.length; i++) {
      const subnet = new aws.ec2.Subnet(
        `${name}-private-subnet-${i}`,
        {
          vpcId: this.vpc.id,
          cidrBlock: `${args.cidr.split(".").slice(0, 2).join(".")}.${i + 10}.0/24`,
          availabilityZone: args.availabilityZones[i],
          mapPublicIpOnLaunch: false,
          tags: {
            ...tags,
            Name: `private-subnet-${i}-${args.environmentSuffix}`,
            Type: "private",
          },
        },
        { parent: this }
      );
      this.privateSubnets.push(subnet);
    }

    // Create Elastic IPs for NAT Gateways
    const eips: aws.ec2.Eip[] = [];
    for (let i = 0; i < args.availabilityZones.length; i++) {
      const eip = new aws.ec2.Eip(
        `${name}-eip-${i}`,
        {
          domain: "vpc",
          tags: { ...tags, Name: `eip-${i}-${args.environmentSuffix}` },
        },
        { parent: this }
      );
      eips.push(eip);
    }

    // Create NAT Gateways
    this.natGateways = [];
    for (let i = 0; i < args.availabilityZones.length; i++) {
      const nat = new aws.ec2.NatGateway(
        `${name}-nat-${i}`,
        {
          allocationId: eips[i].id,
          subnetId: this.publicSubnets[i].id,
          tags: { ...tags, Name: `nat-${i}-${args.environmentSuffix}` },
        },
        { parent: this, dependsOn: [this.internetGateway] }
      );
      this.natGateways.push(nat);
    }

    // Create public route table
    this.publicRouteTable = new aws.ec2.RouteTable(
      `${name}-public-rt`,
      {
        vpcId: this.vpc.id,
        tags: { ...tags, Name: `public-rt-${args.environmentSuffix}` },
      },
      { parent: this }
    );

    new aws.ec2.Route(
      `${name}-public-route`,
      {
        routeTableId: this.publicRouteTable.id,
        destinationCidrBlock: "0.0.0.0/0",
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

    // Create private route tables (one per AZ)
    this.privateRouteTables = [];
    this.privateSubnets.forEach((subnet, i) => {
      const rt = new aws.ec2.RouteTable(
        `${name}-private-rt-${i}`,
        {
          vpcId: this.vpc.id,
          tags: { ...tags, Name: `private-rt-${i}-${args.environmentSuffix}` },
        },
        { parent: this }
      );

      new aws.ec2.Route(
        `${name}-private-route-${i}`,
        {
          routeTableId: rt.id,
          destinationCidrBlock: "0.0.0.0/0",
          natGatewayId: this.natGateways[i].id,
        },
        { parent: this }
      );

      new aws.ec2.RouteTableAssociation(
        `${name}-private-rta-${i}`,
        {
          subnetId: subnet.id,
          routeTableId: rt.id,
        },
        { parent: this }
      );

      this.privateRouteTables.push(rt);
    });

    // Create Security Group
    this.securityGroup = new aws.ec2.SecurityGroup(
      `${name}-sg`,
      {
        vpcId: this.vpc.id,
        description: "Security group for application resources",
        ingress: [
          {
            protocol: "tcp",
            fromPort: 443,
            toPort: 443,
            cidrBlocks: ["0.0.0.0/0"],
            description: "Allow HTTPS from anywhere",
          },
          {
            protocol: "tcp",
            fromPort: 5432,
            toPort: 5432,
            cidrBlocks: [args.cidr],
            description: "Allow PostgreSQL within VPC",
          },
        ],
        egress: [
          {
            protocol: "-1",
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ["0.0.0.0/0"],
            description: "Allow all outbound traffic",
          },
        ],
        tags: { ...tags, Name: `sg-${args.environmentSuffix}` },
      },
      { parent: this }
    );

    this.registerOutputs({
      vpcId: this.vpc.id,
      privateSubnetIds: pulumi.all(this.privateSubnets.map((s) => s.id)),
      publicSubnetIds: pulumi.all(this.publicSubnets.map((s) => s.id)),
      securityGroupId: this.securityGroup.id,
    });
  }
}
```

## File: lib/database.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import { DatabaseConfig } from "./types";

export class DatabaseComponent extends pulumi.ComponentResource {
  public readonly cluster: aws.rds.Cluster;
  public readonly clusterInstances: aws.rds.ClusterInstance[];
  public readonly subnetGroup: aws.rds.SubnetGroup;

  constructor(
    name: string,
    args: {
      environmentSuffix: string;
      region: string;
      isPrimary: boolean;
      globalClusterId?: pulumi.Output<string>;
      subnetIds: pulumi.Output<string>[];
      securityGroupIds: pulumi.Output<string>[];
      config: DatabaseConfig;
      tags: { [key: string]: string };
    },
    opts?: pulumi.ComponentResourceOptions
  ) {
    super("custom:database:DatabaseComponent", name, {}, opts);

    const tags = {
      ...args.tags,
      Name: `${name}-${args.environmentSuffix}`,
      Region: args.region,
      "DR-Role": args.isPrimary ? "primary" : "secondary",
    };

    // Create DB Subnet Group
    this.subnetGroup = new aws.rds.SubnetGroup(
      `${name}-subnet-group`,
      {
        subnetIds: args.subnetIds,
        tags: { ...tags, Name: `db-subnet-group-${args.environmentSuffix}` },
      },
      { parent: this }
    );

    // Create Aurora Cluster
    if (args.isPrimary) {
      this.cluster = new aws.rds.Cluster(
        `${name}-cluster`,
        {
          clusterIdentifier: `aurora-cluster-${args.environmentSuffix}`,
          engine: args.config.engine,
          engineVersion: args.config.engineVersion,
          databaseName: "healthcare",
          masterUsername: "admin",
          masterPassword: pulumi.secret("ChangeMe123456!"),
          dbSubnetGroupName: this.subnetGroup.name,
          vpcSecurityGroupIds: args.securityGroupIds,
          skipFinalSnapshot: args.config.skipFinalSnapshot,
          deletionProtection: args.config.deletionProtection,
          backupRetentionPeriod: 7,
          preferredBackupWindow: "03:00-04:00",
          globalClusterIdentifier: args.globalClusterId,
          tags: { ...tags, Name: `aurora-cluster-${args.environmentSuffix}` },
        },
        { parent: this }
      );
    } else {
      this.cluster = new aws.rds.Cluster(
        `${name}-cluster`,
        {
          clusterIdentifier: `aurora-cluster-${args.region}-${args.environmentSuffix}`,
          engine: args.config.engine,
          engineVersion: args.config.engineVersion,
          dbSubnetGroupName: this.subnetGroup.name,
          vpcSecurityGroupIds: args.securityGroupIds,
          skipFinalSnapshot: args.config.skipFinalSnapshot,
          deletionProtection: args.config.deletionProtection,
          globalClusterIdentifier: args.globalClusterId,
          tags: {
            ...tags,
            Name: `aurora-cluster-${args.region}-${args.environmentSuffix}`,
          },
        },
        { parent: this, dependsOn: opts?.dependsOn }
      );
    }

    // Create Cluster Instances
    this.clusterInstances = [];
    const instanceCount = args.isPrimary ? 2 : 1;
    for (let i = 0; i < instanceCount; i++) {
      const instance = new aws.rds.ClusterInstance(
        `${name}-instance-${i}`,
        {
          identifier: `aurora-instance-${args.region}-${i}-${args.environmentSuffix}`,
          clusterIdentifier: this.cluster.id,
          instanceClass: args.config.instanceClass,
          engine: args.config.engine,
          engineVersion: args.config.engineVersion,
          publiclyAccessible: false,
          tags: {
            ...tags,
            Name: `aurora-instance-${i}-${args.environmentSuffix}`,
          },
        },
        { parent: this, dependsOn: [this.cluster] }
      );
      this.clusterInstances.push(instance);
    }

    this.registerOutputs({
      clusterId: this.cluster.id,
      clusterEndpoint: this.cluster.endpoint,
      clusterReaderEndpoint: this.cluster.readerEndpoint,
    });
  }
}
```

## File: lib/compute.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

export class ComputeComponent extends pulumi.ComponentResource {
  public readonly lambdaFunction: aws.lambda.Function;
  public readonly lambdaRole: aws.iam.Role;
  public readonly alb: aws.lb.LoadBalancer;
  public readonly targetGroup: aws.lb.TargetGroup;
  public readonly listener: aws.lb.Listener;
  public readonly lambdaPermission: aws.lambda.Permission;

  constructor(
    name: string,
    args: {
      environmentSuffix: string;
      region: string;
      isPrimary: boolean;
      vpcId: pulumi.Output<string>;
      subnetIds: pulumi.Output<string>[];
      securityGroupId: pulumi.Output<string>;
      tags: { [key: string]: string };
    },
    opts?: pulumi.ComponentResourceOptions
  ) {
    super("custom:compute:ComputeComponent", name, {}, opts);

    const tags = {
      ...args.tags,
      Name: `${name}-${args.environmentSuffix}`,
      Region: args.region,
      "DR-Role": args.isPrimary ? "primary" : "secondary",
    };

    // Create IAM Role for Lambda
    this.lambdaRole = new aws.iam.Role(
      `${name}-lambda-role`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: "2012-10-17",
          Statement: [
            {
              Effect: "Allow",
              Principal: { Service: "lambda.amazonaws.com" },
              Action: "sts:AssumeRole",
            },
          ],
        }),
        tags: { ...tags, Name: `lambda-role-${args.environmentSuffix}` },
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `${name}-lambda-policy`,
      {
        role: this.lambdaRole.name,
        policyArn: "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `${name}-lambda-vpc-policy`,
      {
        role: this.lambdaRole.name,
        policyArn: "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole",
      },
      { parent: this }
    );

    // Create Lambda Function
    this.lambdaFunction = new aws.lambda.Function(
      `${name}-function`,
      {
        code: new pulumi.asset.AssetArchive({
          "index.js": new pulumi.asset.StringAsset(`
exports.handler = async (event) => {
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: "Healthcare API - ${args.region}",
      region: "${args.region}",
      isPrimary: ${args.isPrimary},
      timestamp: new Date().toISOString()
    })
  };
};
`),
        }),
        role: this.lambdaRole.arn,
        handler: "index.handler",
        runtime: "nodejs18.x",
        memorySize: 512,
        timeout: 30,
        vpcConfig: {
          subnetIds: args.subnetIds,
          securityGroupIds: [args.securityGroupId],
        },
        environment: {
          variables: {
            ENVIRONMENT: args.environmentSuffix,
            REGION: args.region,
            IS_PRIMARY: args.isPrimary.toString(),
          },
        },
        tags: { ...tags, Name: `lambda-function-${args.environmentSuffix}` },
      },
      { parent: this }
    );

    // Create Application Load Balancer
    this.alb = new aws.lb.LoadBalancer(
      `${name}-alb`,
      {
        loadBalancerType: "application",
        subnets: args.subnetIds,
        securityGroups: [args.securityGroupId],
        internal: false,
        tags: { ...tags, Name: `alb-${args.environmentSuffix}` },
      },
      { parent: this }
    );

    // Create Target Group
    this.targetGroup = new aws.lb.TargetGroup(
      `${name}-tg`,
      {
        targetType: "lambda",
        tags: { ...tags, Name: `tg-${args.environmentSuffix}` },
      },
      { parent: this }
    );

    // Attach Lambda to Target Group
    new aws.lb.TargetGroupAttachment(
      `${name}-tg-attachment`,
      {
        targetGroupArn: this.targetGroup.arn,
        targetId: this.lambdaFunction.arn,
      },
      { parent: this, dependsOn: [this.lambdaFunction, this.targetGroup] }
    );

    // Create Lambda Permission for ALB
    this.lambdaPermission = new aws.lambda.Permission(
      `${name}-lambda-permission`,
      {
        action: "lambda:InvokeFunction",
        function: this.lambdaFunction.name,
        principal: "elasticloadbalancing.amazonaws.com",
        sourceArn: this.targetGroup.arn,
      },
      { parent: this }
    );

    // Create Listener
    this.listener = new aws.lb.Listener(
      `${name}-listener`,
      {
        loadBalancerArn: this.alb.arn,
        port: 443,
        protocol: "HTTPS",
        sslPolicy: "ELBSecurityPolicy-2016-08",
        certificateArn: pulumi.output("arn:aws:acm:region:account:certificate/placeholder"),
        defaultActions: [
          {
            type: "forward",
            targetGroupArn: this.targetGroup.arn,
          },
        ],
      },
      { parent: this }
    );

    this.registerOutputs({
      functionArn: this.lambdaFunction.arn,
      albDnsName: this.alb.dnsName,
      albArn: this.alb.arn,
    });
  }
}
```

## File: lib/storage.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

export class StorageComponent extends pulumi.ComponentResource {
  public readonly bucket: aws.s3.Bucket;
  public readonly bucketVersioning: aws.s3.BucketVersioningV2;
  public readonly replicationConfig?: aws.s3.BucketReplicationConfig;

  constructor(
    name: string,
    args: {
      environmentSuffix: string;
      region: string;
      isPrimary: boolean;
      destinationBucketArn?: pulumi.Output<string>;
      replicationRoleArn?: pulumi.Output<string>;
      tags: { [key: string]: string };
    },
    opts?: pulumi.ComponentResourceOptions
  ) {
    super("custom:storage:StorageComponent", name, {}, opts);

    const tags = {
      ...args.tags,
      Name: `${name}-${args.environmentSuffix}`,
      Region: args.region,
      "DR-Role": args.isPrimary ? "primary" : "secondary",
    };

    // Create S3 Bucket
    this.bucket = new aws.s3.Bucket(
      `${name}-bucket`,
      {
        bucket: `healthcare-assets-${args.region}-${args.environmentSuffix}`,
        forceDestroy: true,
        tags: { ...tags, Name: `bucket-${args.region}-${args.environmentSuffix}` },
      },
      { parent: this }
    );

    // Enable Versioning
    this.bucketVersioning = new aws.s3.BucketVersioningV2(
      `${name}-versioning`,
      {
        bucket: this.bucket.id,
        versioningConfiguration: {
          status: "Enabled",
        },
      },
      { parent: this }
    );

    // Configure Replication (Primary only)
    if (args.isPrimary && args.destinationBucketArn && args.replicationRoleArn) {
      this.replicationConfig = new aws.s3.BucketReplicationConfig(
        `${name}-replication`,
        {
          bucket: this.bucket.id,
          role: args.replicationRoleArn,
          rules: [
            {
              id: "replicate-all",
              status: "Enabled",
              priority: 1,
              deleteMarkerReplication: {
                status: "Enabled",
              },
              filter: {},
              destination: {
                bucket: args.destinationBucketArn,
                replicationTime: {
                  status: "Enabled",
                  time: {
                    minutes: 15,
                  },
                },
                metrics: {
                  status: "Enabled",
                  eventThreshold: {
                    minutes: 15,
                  },
                },
              },
            },
          ],
        },
        { parent: this, dependsOn: [this.bucketVersioning] }
      );
    }

    // Lifecycle Rule
    new aws.s3.BucketLifecycleConfigurationV2(
      `${name}-lifecycle`,
      {
        bucket: this.bucket.id,
        rules: [
          {
            id: "transition-old-versions",
            status: "Enabled",
            noncurrentVersionTransitions: [
              {
                noncurrentDays: 30,
                storageClass: "STANDARD_IA",
              },
              {
                noncurrentDays: 90,
                storageClass: "GLACIER",
              },
            ],
          },
        ],
      },
      { parent: this }
    );

    this.registerOutputs({
      bucketName: this.bucket.id,
      bucketArn: this.bucket.arn,
    });
  }
}
```

## File: lib/regional-infrastructure.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import { NetworkingComponent } from "./networking";
import { DatabaseComponent } from "./database";
import { ComputeComponent } from "./compute";
import { StorageComponent } from "./storage";
import { RegionalInfrastructureProps } from "./types";

export class RegionalInfrastructure extends pulumi.ComponentResource {
  public readonly networking: NetworkingComponent;
  public readonly database: DatabaseComponent;
  public readonly compute: ComputeComponent;
  public readonly storage: StorageComponent;
  public readonly eventBus: aws.cloudwatch.EventBus;

  constructor(
    name: string,
    args: RegionalInfrastructureProps,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super("custom:regional:RegionalInfrastructure", name, {}, opts);

    const provider = new aws.Provider(
      `${name}-provider`,
      { region: args.region },
      { parent: this }
    );

    const providerOpts = { parent: this, provider };

    // Create Networking
    this.networking = new NetworkingComponent(
      `${name}-networking`,
      {
        cidr: args.vpcCidr,
        availabilityZones: [
          `${args.region}a`,
          `${args.region}b`,
          `${args.region}c`,
        ],
        environmentSuffix: args.environmentSuffix,
        region: args.region,
      },
      providerOpts
    );

    // Create Database
    this.database = new DatabaseComponent(
      `${name}-database`,
      {
        environmentSuffix: args.environmentSuffix,
        region: args.region,
        isPrimary: args.isPrimary,
        globalClusterId: args.globalClusterId?.id,
        subnetIds: this.networking.privateSubnets.map((s) => s.id),
        securityGroupIds: [this.networking.securityGroup.id],
        config: {
          engine: "aurora-postgresql",
          engineVersion: "15.4",
          instanceClass: "db.r5.large",
          skipFinalSnapshot: true,
          deletionProtection: false,
        },
        tags: args.tags,
      },
      { ...providerOpts, dependsOn: [this.networking] }
    );

    // Create Compute
    this.compute = new ComputeComponent(
      `${name}-compute`,
      {
        environmentSuffix: args.environmentSuffix,
        region: args.region,
        isPrimary: args.isPrimary,
        vpcId: this.networking.vpc.id,
        subnetIds: this.networking.publicSubnets.map((s) => s.id),
        securityGroupId: this.networking.securityGroup.id,
        tags: args.tags,
      },
      { ...providerOpts, dependsOn: [this.networking] }
    );

    // Create Storage
    this.storage = new StorageComponent(
      `${name}-storage`,
      {
        environmentSuffix: args.environmentSuffix,
        region: args.region,
        isPrimary: args.isPrimary,
        tags: args.tags,
      },
      providerOpts
    );

    // Create EventBridge Bus
    this.eventBus = new aws.cloudwatch.EventBus(
      `${name}-event-bus`,
      {
        name: `healthcare-events-${args.region}-${args.environmentSuffix}`,
        tags: {
          ...args.tags,
          Name: `event-bus-${args.region}-${args.environmentSuffix}`,
        },
      },
      providerOpts
    );

    // Add VPC Peering Route (if peer VPC provided)
    if (args.peerVpcId && args.peerRegion) {
      this.networking.privateRouteTables.forEach((rt, i) => {
        new aws.ec2.Route(
          `${name}-peer-route-${i}`,
          {
            routeTableId: rt.id,
            destinationCidrBlock: args.isPrimary ? "10.1.0.0/16" : "10.0.0.0/16",
            vpcPeeringConnectionId: args.peerVpcId!,
          },
          providerOpts
        );
      });
    }

    this.registerOutputs({
      vpcId: this.networking.vpc.id,
      albDnsName: this.compute.alb.dnsName,
      bucketName: this.storage.bucket.id,
      dbClusterEndpoint: this.database.cluster.endpoint,
      eventBusName: this.eventBus.name,
    });
  }
}
```

## File: lib/tap-stack.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import { RegionalInfrastructure } from "./regional-infrastructure";

const config = new pulumi.Config();
const environmentSuffix = config.require("environmentSuffix");

const tags = {
  Environment: environmentSuffix,
  ManagedBy: "Pulumi",
  Project: "HealthcareDR",
};

// Create Global Database Cluster
const globalCluster = new aws.rds.GlobalCluster("global-cluster", {
  globalClusterIdentifier: `global-healthcare-${environmentSuffix}`,
  engine: "aurora-postgresql",
  engineVersion: "15.4",
  databaseName: "healthcare",
  deletionProtection: false,
});

// Create Primary Infrastructure (us-east-1)
const primaryInfra = new RegionalInfrastructure("primary", {
  environmentSuffix,
  region: "us-east-1",
  isPrimary: true,
  vpcCidr: "10.0.0.0/16",
  globalClusterId: globalCluster,
  tags: { ...tags, "DR-Role": "primary" },
});

// Create DR Infrastructure (us-west-2)
const drInfra = new RegionalInfrastructure(
  "dr",
  {
    environmentSuffix,
    region: "us-west-2",
    isPrimary: false,
    vpcCidr: "10.1.0.0/16",
    globalClusterId: globalCluster,
    tags: { ...tags, "DR-Role": "secondary" },
  },
  { dependsOn: [primaryInfra] }
);

// Create VPC Peering Connection
const vpcPeering = new aws.ec2.VpcPeeringConnection("vpc-peering", {
  vpcId: primaryInfra.networking.vpc.id,
  peerVpcId: drInfra.networking.vpc.id,
  peerRegion: "us-west-2",
  autoAccept: false,
  tags: { ...tags, Name: `vpc-peering-${environmentSuffix}` },
});

// Accept VPC Peering in us-west-2
const drProvider = new aws.Provider("dr-provider", { region: "us-west-2" });
const peeringAccepter = new aws.ec2.VpcPeeringConnectionAccepter(
  "peering-accepter",
  {
    vpcPeeringConnectionId: vpcPeering.id,
    autoAccept: true,
    tags: { ...tags, Name: `vpc-peering-accepter-${environmentSuffix}` },
  },
  { provider: drProvider }
);

// Create S3 Replication Role
const replicationRole = new aws.iam.Role("replication-role", {
  assumeRolePolicy: JSON.stringify({
    Version: "2012-10-17",
    Statement: [
      {
        Effect: "Allow",
        Principal: { Service: "s3.amazonaws.com" },
        Action: "sts:AssumeRole",
      },
    ],
  }),
  tags: { ...tags, Name: `s3-replication-role-${environmentSuffix}` },
});

new aws.iam.RolePolicy("replication-policy", {
  role: replicationRole.id,
  policy: pulumi
    .all([primaryInfra.storage.bucket.arn, drInfra.storage.bucket.arn])
    .apply(([sourceArn, destArn]) =>
      JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Action: ["s3:GetReplicationConfiguration", "s3:ListBucket"],
            Resource: sourceArn,
          },
          {
            Effect: "Allow",
            Action: [
              "s3:GetObjectVersionForReplication",
              "s3:GetObjectVersionAcl",
            ],
            Resource: `${sourceArn}/*`,
          },
          {
            Effect: "Allow",
            Action: [
              "s3:ReplicateObject",
              "s3:ReplicateDelete",
              "s3:ReplicateTags",
            ],
            Resource: `${destArn}/*`,
          },
        ],
      })
    ),
});

// Configure S3 Replication
const primaryStorage = new aws.s3.BucketReplicationConfig(
  "primary-replication",
  {
    bucket: primaryInfra.storage.bucket.id,
    role: replicationRole.arn,
    rules: [
      {
        id: "replicate-all",
        status: "Enabled",
        priority: 1,
        deleteMarkerReplication: { status: "Enabled" },
        filter: {},
        destination: {
          bucket: drInfra.storage.bucket.arn,
          replicationTime: {
            status: "Enabled",
            time: { minutes: 15 },
          },
          metrics: {
            status: "Enabled",
            eventThreshold: { minutes: 15 },
          },
        },
      },
    ],
  },
  {
    dependsOn: [
      primaryInfra.storage.bucketVersioning,
      drInfra.storage.bucketVersioning,
    ],
  }
);

// Create Route53 Hosted Zone
const hostedZone = new aws.route53.Zone("hosted-zone", {
  name: `healthcare-${environmentSuffix}.example.com`,
  tags: { ...tags, Name: `hosted-zone-${environmentSuffix}` },
});

// Create Health Checks
const primaryHealthCheck = new aws.route53.HealthCheck("primary-health-check", {
  type: "HTTPS",
  resourcePath: "/health",
  fqdn: primaryInfra.compute.alb.dnsName,
  port: 443,
  requestInterval: 30,
  failureThreshold: 3,
  tags: { ...tags, Name: `primary-health-check-${environmentSuffix}` },
});

const drHealthCheck = new aws.route53.HealthCheck("dr-health-check", {
  type: "HTTPS",
  resourcePath: "/health",
  fqdn: drInfra.compute.alb.dnsName,
  port: 443,
  requestInterval: 30,
  failureThreshold: 3,
  tags: { ...tags, Name: `dr-health-check-${environmentSuffix}` },
});

// Create Route53 Records with Failover
const primaryRecord = new aws.route53.Record("primary-record", {
  zoneId: hostedZone.zoneId,
  name: `api.healthcare-${environmentSuffix}.example.com`,
  type: "CNAME",
  ttl: 60,
  records: [primaryInfra.compute.alb.dnsName],
  setIdentifier: "primary",
  failoverRoutingPolicies: [{ type: "PRIMARY" }],
  healthCheckId: primaryHealthCheck.id,
});

const drRecord = new aws.route53.Record("dr-record", {
  zoneId: hostedZone.zoneId,
  name: `api.healthcare-${environmentSuffix}.example.com`,
  type: "CNAME",
  ttl: 60,
  records: [drInfra.compute.alb.dnsName],
  setIdentifier: "secondary",
  failoverRoutingPolicies: [{ type: "SECONDARY" }],
  healthCheckId: drHealthCheck.id,
});

// Create EventBridge Cross-Region Rule (Primary to DR)
const primaryEventRule = new aws.cloudwatch.EventRule("primary-event-rule", {
  name: `forward-to-dr-${environmentSuffix}`,
  eventBusName: primaryInfra.eventBus.name,
  eventPattern: JSON.stringify({
    source: ["healthcare.application"],
    "detail-type": ["Patient Data Event"],
  }),
  tags: { ...tags, Name: `event-rule-primary-${environmentSuffix}` },
});

const drEventBusTarget = new aws.cloudwatch.EventTarget("dr-event-target", {
  rule: primaryEventRule.name,
  eventBusName: primaryInfra.eventBus.name,
  arn: drInfra.eventBus.arn,
  roleArn: new aws.iam.Role("event-role", {
    assumeRolePolicy: JSON.stringify({
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Principal: { Service: "events.amazonaws.com" },
          Action: "sts:AssumeRole",
        },
      ],
    }),
    inlinePolicies: [
      {
        name: "PutEvents",
        policy: drInfra.eventBus.arn.apply((arn) =>
          JSON.stringify({
            Version: "2012-10-17",
            Statement: [
              {
                Effect: "Allow",
                Action: "events:PutEvents",
                Resource: arn,
              },
            ],
          })
        ),
      },
    ],
    tags: { ...tags, Name: `event-role-${environmentSuffix}` },
  }).arn,
});

// Create CloudWatch Dashboard
const dashboard = new aws.cloudwatch.Dashboard("dashboard", {
  dashboardName: `healthcare-dr-${environmentSuffix}`,
  dashboardBody: pulumi
    .all([
      primaryInfra.compute.alb.arn,
      drInfra.compute.alb.arn,
      primaryInfra.compute.lambdaFunction.name,
      drInfra.compute.lambdaFunction.name,
    ])
    .apply(([primaryAlbArn, drAlbArn, primaryLambda, drLambda]) =>
      JSON.stringify({
        widgets: [
          {
            type: "metric",
            properties: {
              metrics: [
                [
                  "AWS/ApplicationELB",
                  "RequestCount",
                  { stat: "Sum", label: "Primary ALB Requests" },
                ],
                [
                  "...",
                  { stat: "Sum", label: "DR ALB Requests", region: "us-west-2" },
                ],
              ],
              period: 300,
              stat: "Sum",
              region: "us-east-1",
              title: "ALB Request Counts",
            },
          },
          {
            type: "metric",
            properties: {
              metrics: [
                [
                  "AWS/Lambda",
                  "Invocations",
                  { dimensions: { FunctionName: primaryLambda } },
                ],
                [
                  "...",
                  {
                    dimensions: { FunctionName: drLambda },
                    region: "us-west-2",
                  },
                ],
              ],
              period: 300,
              stat: "Sum",
              region: "us-east-1",
              title: "Lambda Invocations",
            },
          },
        ],
      })
    ),
});

// Exports
export const globalClusterId = globalCluster.id;
export const primaryEndpoint = pulumi.interpolate`https://api.healthcare-${environmentSuffix}.example.com`;
export const failoverEndpoint = pulumi.interpolate`https://${drInfra.compute.alb.dnsName}`;
export const primaryVpcId = primaryInfra.networking.vpc.id;
export const drVpcId = drInfra.networking.vpc.id;
export const vpcPeeringConnectionId = vpcPeering.id;
export const primaryBucketName = primaryInfra.storage.bucket.id;
export const drBucketName = drInfra.storage.bucket.id;
export const route53ZoneId = hostedZone.zoneId;
export const dashboardUrl = pulumi.interpolate`https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=${dashboard.dashboardName}`;
export const primaryDbEndpoint = primaryInfra.database.cluster.endpoint;
export const drDbEndpoint = drInfra.database.cluster.endpoint;
```

## File: lib/README.md

```markdown
# Multi-Region Disaster Recovery Infrastructure

This Pulumi TypeScript program implements a comprehensive multi-region disaster recovery infrastructure for a healthcare SaaS platform spanning us-east-1 (primary) and us-west-2 (DR) regions.

## Architecture Overview

- **Aurora Global Database**: Cross-region PostgreSQL replication
- **Multi-Region Compute**: Lambda functions behind ALBs in both regions
- **DNS Failover**: Route53 health checks with automatic failover
- **Storage Replication**: S3 cross-region replication with versioning
- **Event Distribution**: EventBridge cross-region event forwarding
- **Monitoring**: CloudWatch dashboard with multi-region metrics
- **Network**: VPC peering between regions

## Prerequisites

- Pulumi CLI 3.x
- Node.js 16+
- AWS credentials configured
- TypeScript 4.x

## Configuration

Set the environment suffix:

```bash
pulumi config set environmentSuffix <your-suffix>
```

## Deployment

```bash
npm install
pulumi up
```

## Outputs

- `primaryEndpoint`: Primary API endpoint URL
- `failoverEndpoint`: Failover API endpoint URL
- `globalClusterId`: Aurora Global Database cluster ID
- `dashboardUrl`: CloudWatch dashboard URL
- `vpcPeeringConnectionId`: VPC peering connection ID

## Testing Failover

1. Monitor health checks in Route53
2. Simulate primary region failure
3. Verify automatic traffic redirection to DR region
4. Check data replication status

## Cleanup

```bash
pulumi destroy
```

## Architecture Decisions

- **ComponentResource Pattern**: Modular, reusable components
- **Aurora Global Database**: 15-minute RPO/RTO requirements
- **VPC Peering**: Cross-region private connectivity
- **S3 Replication Time Control**: 15-minute SLA for replication
- **Route53 Health Checks**: 90-120 second failover time
```
