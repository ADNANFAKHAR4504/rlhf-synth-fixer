I'll create a comprehensive, production-ready CDKTF configuration for your multi-region AWS infrastructure. Here's the complete solution:

## 1. Common Types and Interfaces

**`types/common.ts`**

```typescript
export interface CommonTags {
  Environment: string;
  Owner: string;
  Project?: string;
  ManagedBy?: string;
}

export interface RegionConfig {
  region: string;
  vpcCidr: string;
  availabilityZones: string[];
}

export interface MultiRegionConfig {
  regions: RegionConfig[];
  tags: CommonTags;
}
```

## 2. Multi-Region Networking Construct

**`constructs/multi-region-networking-construct.ts`**

```typescript
import { Construct } from 'constructs';
import { TerraformOutput } from 'cdktf';
import {
  AwsProvider,
  Vpc,
  Subnet,
  InternetGateway,
  RouteTable,
  Route,
  RouteTableAssociation,
  VpcPeeringConnection,
  VpcPeeringConnectionAccepter,
  DataAwsCallerIdentity,
} from '@cdktf/provider-aws';
import { RegionConfig, CommonTags } from '../types/common';

export interface NetworkingConstructProps {
  regions: RegionConfig[];
  tags: CommonTags;
}

export interface VpcInfo {
  vpc: Vpc;
  publicSubnets: Subnet[];
  privateSubnets: Subnet[];
  provider: AwsProvider;
  region: string;
}

export class MultiRegionNetworkingConstruct extends Construct {
  public readonly vpcs: Map<string, VpcInfo> = new Map();
  public readonly providers: Map<string, AwsProvider> = new Map();

  constructor(scope: Construct, id: string, props: NetworkingConstructProps) {
    super(scope, id);

    // Create providers for each region
    props.regions.forEach(regionConfig => {
      const provider = new AwsProvider(this, `aws-${regionConfig.region}`, {
        region: regionConfig.region,
        alias: regionConfig.region,
      });
      this.providers.set(regionConfig.region, provider);
    });

    // Create VPCs in each region
    props.regions.forEach(regionConfig => {
      const vpcInfo = this.createVpc(regionConfig, props.tags);
      this.vpcs.set(regionConfig.region, vpcInfo);
    });

    // Create VPC peering connections
    this.createVpcPeeringConnections(props.regions, props.tags);

    // Output VPC information
    this.createOutputs();
  }

  private createVpc(regionConfig: RegionConfig, tags: CommonTags): VpcInfo {
    const provider = this.providers.get(regionConfig.region)!;

    // Create VPC
    const vpc = new Vpc(this, `vpc-${regionConfig.region}`, {
      cidrBlock: regionConfig.vpcCidr,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        ...tags,
        Name: `vpc-${regionConfig.region}`,
        Region: regionConfig.region,
      },
      provider,
    });

    // Create Internet Gateway
    const igw = new InternetGateway(this, `igw-${regionConfig.region}`, {
      vpcId: vpc.id,
      tags: {
        ...tags,
        Name: `igw-${regionConfig.region}`,
        Region: regionConfig.region,
      },
      provider,
    });

    // Create subnets
    const publicSubnets: Subnet[] = [];
    const privateSubnets: Subnet[] = [];

    regionConfig.availabilityZones.forEach((az, index) => {
      // Public subnet
      const publicSubnet = new Subnet(
        this,
        `public-subnet-${regionConfig.region}-${index}`,
        {
          vpcId: vpc.id,
          cidrBlock: this.calculateSubnetCidr(regionConfig.vpcCidr, index * 2),
          availabilityZone: az,
          mapPublicIpOnLaunch: true,
          tags: {
            ...tags,
            Name: `public-subnet-${regionConfig.region}-${az}`,
            Type: 'public',
            Region: regionConfig.region,
          },
          provider,
        }
      );
      publicSubnets.push(publicSubnet);

      // Private subnet
      const privateSubnet = new Subnet(
        this,
        `private-subnet-${regionConfig.region}-${index}`,
        {
          vpcId: vpc.id,
          cidrBlock: this.calculateSubnetCidr(
            regionConfig.vpcCidr,
            index * 2 + 1
          ),
          availabilityZone: az,
          tags: {
            ...tags,
            Name: `private-subnet-${regionConfig.region}-${az}`,
            Type: 'private',
            Region: regionConfig.region,
          },
          provider,
        }
      );
      privateSubnets.push(privateSubnet);
    });

    // Create route tables
    const publicRouteTable = new RouteTable(
      this,
      `public-rt-${regionConfig.region}`,
      {
        vpcId: vpc.id,
        tags: {
          ...tags,
          Name: `public-rt-${regionConfig.region}`,
          Type: 'public',
          Region: regionConfig.region,
        },
        provider,
      }
    );

    const privateRouteTable = new RouteTable(
      this,
      `private-rt-${regionConfig.region}`,
      {
        vpcId: vpc.id,
        tags: {
          ...tags,
          Name: `private-rt-${regionConfig.region}`,
          Type: 'private',
          Region: regionConfig.region,
        },
        provider,
      }
    );

    // Create routes
    new Route(this, `public-route-${regionConfig.region}`, {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.id,
      provider,
    });

    // Associate subnets with route tables
    publicSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(
        this,
        `public-rta-${regionConfig.region}-${index}`,
        {
          subnetId: subnet.id,
          routeTableId: publicRouteTable.id,
          provider,
        }
      );
    });

    privateSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(
        this,
        `private-rta-${regionConfig.region}-${index}`,
        {
          subnetId: subnet.id,
          routeTableId: privateRouteTable.id,
          provider,
        }
      );
    });

    return {
      vpc,
      publicSubnets,
      privateSubnets,
      provider,
      region: regionConfig.region,
    };
  }

  private createVpcPeeringConnections(
    regions: RegionConfig[],
    tags: CommonTags
  ): void {
    const callerIdentity = new DataAwsCallerIdentity(this, 'current', {
      provider: this.providers.get(regions[0].region),
    });

    // Create peering connections between all regions
    for (let i = 0; i < regions.length; i++) {
      for (let j = i + 1; j < regions.length; j++) {
        const region1 = regions[i];
        const region2 = regions[j];

        const vpc1 = this.vpcs.get(region1.region)!;
        const vpc2 = this.vpcs.get(region2.region)!;

        // Create peering connection from region1 to region2
        const peeringConnection = new VpcPeeringConnection(
          this,
          `peering-${region1.region}-${region2.region}`,
          {
            vpcId: vpc1.vpc.id,
            peerVpcId: vpc2.vpc.id,
            peerRegion: region2.region,
            peerOwnerId: callerIdentity.accountId,
            autoAccept: false,
            tags: {
              ...tags,
              Name: `peering-${region1.region}-${region2.region}`,
              Side: 'requester',
            },
            provider: vpc1.provider,
          }
        );

        // Accept peering connection in region2
        new VpcPeeringConnectionAccepter(
          this,
          `peering-accepter-${region1.region}-${region2.region}`,
          {
            vpcPeeringConnectionId: peeringConnection.id,
            autoAccept: true,
            tags: {
              ...tags,
              Name: `peering-accepter-${region1.region}-${region2.region}`,
              Side: 'accepter',
            },
            provider: vpc2.provider,
          }
        );

        // Add routes for peering in both directions
        this.addPeeringRoutes(vpc1, vpc2, peeringConnection);
        this.addPeeringRoutes(vpc2, vpc1, peeringConnection);
      }
    }
  }

  private addPeeringRoutes(
    sourceVpc: VpcInfo,
    targetVpc: VpcInfo,
    peeringConnection: VpcPeeringConnection
  ): void {
    // Add route in public route table
    const publicRouteTable = new RouteTable(
      this,
      `temp-public-rt-${sourceVpc.region}`,
      {
        vpcId: sourceVpc.vpc.id,
        provider: sourceVpc.provider,
      }
    );

    new Route(
      this,
      `peering-route-public-${sourceVpc.region}-${targetVpc.region}`,
      {
        routeTableId: publicRouteTable.id,
        destinationCidrBlock: targetVpc.vpc.cidrBlock,
        vpcPeeringConnectionId: peeringConnection.id,
        provider: sourceVpc.provider,
      }
    );

    // Add route in private route table
    const privateRouteTable = new RouteTable(
      this,
      `temp-private-rt-${sourceVpc.region}`,
      {
        vpcId: sourceVpc.vpc.id,
        provider: sourceVpc.provider,
      }
    );

    new Route(
      this,
      `peering-route-private-${sourceVpc.region}-${targetVpc.region}`,
      {
        routeTableId: privateRouteTable.id,
        destinationCidrBlock: targetVpc.vpc.cidrBlock,
        vpcPeeringConnectionId: peeringConnection.id,
        provider: sourceVpc.provider,
      }
    );
  }

  private calculateSubnetCidr(vpcCidr: string, subnetIndex: number): string {
    const [baseIp, prefixLength] = vpcCidr.split('/');
    const baseOctets = baseIp.split('.').map(Number);
    const newPrefixLength = parseInt(prefixLength) + 8;

    baseOctets[2] = subnetIndex;
    return `${baseOctets.join('.')}/${newPrefixLength}`;
  }

  private createOutputs(): void {
    this.vpcs.forEach((vpcInfo, region) => {
      new TerraformOutput(this, `vpc-id-${region}`, {
        value: vpcInfo.vpc.id,
        description: `VPC ID for ${region}`,
      });

      new TerraformOutput(this, `private-subnet-ids-${region}`, {
        value: vpcInfo.privateSubnets.map(subnet => subnet.id),
        description: `Private subnet IDs for ${region}`,
      });

      new TerraformOutput(this, `public-subnet-ids-${region}`, {
        value: vpcInfo.publicSubnets.map(subnet => subnet.id),
        description: `Public subnet IDs for ${region}`,
      });
    });
  }
}
```

## 3. RDS Construct

**`constructs/rds-construct.ts`**

```typescript
import { Construct } from 'constructs';
import { TerraformOutput } from 'cdktf';
import {
  DbInstance,
  DbSubnetGroup,
  SecurityGroup,
  SecurityGroupRule,
  AwsProvider,
} from '@cdktf/provider-aws';
import { CommonTags } from '../types/common';

export interface RdsConstructProps {
  vpcId: string;
  privateSubnetIds: string[];
  region: string;
  provider: AwsProvider;
  tags: CommonTags;
  dbConfig?: {
    engine?: string;
    engineVersion?: string;
    instanceClass?: string;
    allocatedStorage?: number;
    dbName?: string;
    username?: string;
    backupRetentionPeriod?: number;
    multiAz?: boolean;
  };
}

export class RdsConstruct extends Construct {
  public readonly dbInstance: DbInstance;
  public readonly securityGroup: SecurityGroup;

  constructor(scope: Construct, id: string, props: RdsConstructProps) {
    super(scope, id);

    const dbConfig = {
      engine: 'postgres',
      engineVersion: '15.4',
      instanceClass: 'db.t3.micro',
      allocatedStorage: 20,
      dbName: 'appdb',
      username: 'dbadmin',
      backupRetentionPeriod: 7,
      multiAz: true,
      ...props.dbConfig,
    };

    // Create DB subnet group
    const dbSubnetGroup = new DbSubnetGroup(this, 'db-subnet-group', {
      name: `db-subnet-group-${props.region}`,
      subnetIds: props.privateSubnetIds,
      tags: {
        ...props.tags,
        Name: `db-subnet-group-${props.region}`,
        Region: props.region,
      },
      provider: props.provider,
    });

    // Create security group for RDS
    this.securityGroup = new SecurityGroup(this, 'rds-sg', {
      name: `rds-sg-${props.region}`,
      description: 'Security group for RDS instance',
      vpcId: props.vpcId,
      tags: {
        ...props.tags,
        Name: `rds-sg-${props.region}`,
        Region: props.region,
      },
      provider: props.provider,
    });

    // Allow PostgreSQL traffic from within VPC
    new SecurityGroupRule(this, 'rds-ingress', {
      type: 'ingress',
      fromPort: 5432,
      toPort: 5432,
      protocol: 'tcp',
      cidrBlocks: ['10.0.0.0/8'], // Adjust based on your VPC CIDR ranges
      securityGroupId: this.securityGroup.id,
      provider: props.provider,
    });

    // Allow all outbound traffic
    new SecurityGroupRule(this, 'rds-egress', {
      type: 'egress',
      fromPort: 0,
      toPort: 65535,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.securityGroup.id,
      provider: props.provider,
    });

    // Create RDS instance
    this.dbInstance = new DbInstance(this, 'db-instance', {
      identifier: `db-instance-${props.region}`,
      engine: dbConfig.engine,
      engineVersion: dbConfig.engineVersion,
      instanceClass: dbConfig.instanceClass,
      allocatedStorage: dbConfig.allocatedStorage,
      dbName: dbConfig.dbName,
      username: dbConfig.username,
      manageMainUserPassword: true, // Use AWS Secrets Manager
      dbSubnetGroupName: dbSubnetGroup.name,
      vpcSecurityGroupIds: [this.securityGroup.id],
      backupRetentionPeriod: dbConfig.backupRetentionPeriod,
      backupWindow: '03:00-04:00',
      maintenanceWindow: 'sun:04:00-sun:05:00',
      multiAz: dbConfig.multiAz,
      storageEncrypted: true,
      deletionProtection: true,
      skipFinalSnapshot: false,
      finalSnapshotIdentifier: `final-snapshot-${props.region}-${Date.now()}`,
      tags: {
        ...props.tags,
        Name: `db-instance-${props.region}`,
        Region: props.region,
      },
      provider: props.provider,
    });

    // Outputs
    new TerraformOutput(this, `rds-endpoint-${props.region}`, {
      value: this.dbInstance.endpoint,
      description: `RDS endpoint for ${props.region}`,
    });

    new TerraformOutput(this, `rds-arn-${props.region}`, {
      value: this.dbInstance.arn,
      description: `RDS ARN for ${props.region}`,
    });
  }
}
```

## 4. ElastiCache Construct

**`constructs/elasticache-construct.ts`**

```typescript
import { Construct } from 'constructs';
import { TerraformOutput } from 'cdktf';
import {
  ElasticacheReplicationGroup,
  ElasticacheSubnetGroup,
  SecurityGroup,
  SecurityGroupRule,
  AwsProvider,
} from '@cdktf/provider-aws';
import { CommonTags } from '../types/common';

export interface ElastiCacheConstructProps {
  vpcId: string;
  privateSubnetIds: string[];
  region: string;
  provider: AwsProvider;
  tags: CommonTags;
  cacheConfig?: {
    nodeType?: string;
    numCacheNodes?: number;
    parameterGroupName?: string;
    port?: number;
    engineVersion?: string;
  };
}

export class ElastiCacheConstruct extends Construct {
  public readonly replicationGroup: ElasticacheReplicationGroup;
  public readonly securityGroup: SecurityGroup;

  constructor(scope: Construct, id: string, props: ElastiCacheConstructProps) {
    super(scope, id);

    const cacheConfig = {
      nodeType: 'cache.t3.micro',
      numCacheNodes: 2,
      parameterGroupName: 'default.redis7',
      port: 6379,
      engineVersion: '7.0',
      ...props.cacheConfig,
    };

    // Create ElastiCache subnet group
    const cacheSubnetGroup = new ElasticacheSubnetGroup(
      this,
      'cache-subnet-group',
      {
        name: `cache-subnet-group-${props.region}`,
        subnetIds: props.privateSubnetIds,
        tags: {
          ...props.tags,
          Name: `cache-subnet-group-${props.region}`,
          Region: props.region,
        },
        provider: props.provider,
      }
    );

    // Create security group for ElastiCache
    this.securityGroup = new SecurityGroup(this, 'elasticache-sg', {
      name: `elasticache-sg-${props.region}`,
      description: 'Security group for ElastiCache cluster',
      vpcId: props.vpcId,
      tags: {
        ...props.tags,
        Name: `elasticache-sg-${props.region}`,
        Region: props.region,
      },
      provider: props.provider,
    });

    // Allow Redis traffic from within VPC
    new SecurityGroupRule(this, 'elasticache-ingress', {
      type: 'ingress',
      fromPort: cacheConfig.port,
      toPort: cacheConfig.port,
      protocol: 'tcp',
      cidrBlocks: ['10.0.0.0/8'], // Adjust based on your VPC CIDR ranges
      securityGroupId: this.securityGroup.id,
      provider: props.provider,
    });

    // Allow all outbound traffic
    new SecurityGroupRule(this, 'elasticache-egress', {
      type: 'egress',
      fromPort: 0,
      toPort: 65535,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.securityGroup.id,
      provider: props.provider,
    });

    // Create ElastiCache replication group
    this.replicationGroup = new ElasticacheReplicationGroup(
      this,
      'cache-replication-group',
      {
        replicationGroupId: `cache-rg-${props.region}`,
        description: `Redis cluster for ${props.region}`,
        nodeType: cacheConfig.nodeType,
        numCacheClusters: cacheConfig.numCacheNodes,
        parameterGroupName: cacheConfig.parameterGroupName,
        port: cacheConfig.port,
        subnetGroupName: cacheSubnetGroup.name,
        securityGroupIds: [this.securityGroup.id],
        atRestEncryptionEnabled: true,
        transitEncryptionEnabled: true,
        automaticFailoverEnabled: cacheConfig.numCacheNodes > 1,
        multiAzEnabled: cacheConfig.numCacheNodes > 1,
        engine: 'redis',
        engineVersion: cacheConfig.engineVersion,
        maintenanceWindow: 'sun:05:00-sun:06:00',
        snapshotRetentionLimit: 5,
        snapshotWindow: '03:00-05:00',
        tags: {
          ...props.tags,
          Name: `cache-rg-${props.region}`,
          Region: props.region,
        },
        provider: props.provider,
      }
    );

    // Outputs
    new TerraformOutput(this, `elasticache-endpoint-${props.region}`, {
      value: this.replicationGroup.configurationEndpointAddress,
      description: `ElastiCache configuration endpoint for ${props.region}`,
    });

    new TerraformOutput(this, `elasticache-primary-endpoint-${props.region}`, {
      value: this.replicationGroup.primaryEndpointAddress,
      description: `ElastiCache primary endpoint for ${props.region}`,
    });
  }
}
```

## 5. Main Stack

**`main.ts`**

```typescript
import { Construct } from 'constructs';
import { App, TerraformStack } from 'cdktf';
import { MultiRegionNetworkingConstruct } from './constructs/multi-region-networking-construct';
import { RdsConstruct } from './constructs/rds-construct';
import { ElastiCacheConstruct } from './constructs/elasticache-construct';
import { MultiRegionConfig } from './types/common';

class MultiRegionInfrastructureStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Configuration
    const config: MultiRegionConfig = {
      regions: [
        {
          region: 'eu-central-1',
          vpcCidr: '10.1.0.0/16',
          availabilityZones: [
            'eu-central-1a',
            'eu-central-1b',
            'eu-central-1c',
          ],
        },
        {
          region: 'us-west-2',
          vpcCidr: '10.2.0.0/16',
          availabilityZones: ['us-west-2a', 'us-west-2b', 'us-west-2c'],
        },
        {
          region: 'us-east-2',
          vpcCidr: '10.3.0.0/16',
          availabilityZones: ['us-east-2a', 'us-east-2b', 'us-east-2c'],
        },
      ],
      tags: {
        Environment: 'prod',
        Owner: 'devops-team',
        Project: 'multi-region-infrastructure',
        ManagedBy: 'cdktf',
      },
    };

    // Create networking infrastructure
    const networking = new MultiRegionNetworkingConstruct(this, 'networking', {
      regions: config.regions,
      tags: config.tags,
    });

    // Create RDS instances in each region
    config.regions.forEach(regionConfig => {
      const vpcInfo = networking.vpcs.get(regionConfig.region)!;

      new RdsConstruct(this, `rds-${regionConfig.region}`, {
        vpcId: vpcInfo.vpc.id,
        privateSubnetIds: vpcInfo.privateSubnets.map(subnet => subnet.id),
        region: regionConfig.region,
        provider: vpcInfo.provider,
        tags: config.tags,
        dbConfig: {
          engine: 'postgres',
          engineVersion: '15.4',
          instanceClass: 'db.r6g.large', // Production-ready instance
          allocatedStorage: 100,
          dbName: 'proddb',
          username: 'dbadmin',
          backupRetentionPeriod: 30,
          multiAz: true,
        },
      });

      // Create ElastiCache clusters in each region
      new ElastiCacheConstruct(this, `elasticache-${regionConfig.region}`, {
        vpcId: vpcInfo.vpc.id,
        privateSubnetIds: vpcInfo.privateSubnets.map(subnet => subnet.id),
        region: regionConfig.region,
        provider: vpcInfo.provider,
        tags: config.tags,
        cacheConfig: {
          nodeType: 'cache.r6g.large', // Production-ready instance
          numCacheNodes: 3, // High availability
          parameterGroupName: 'default.redis7',
          port: 6379,
          engineVersion: '7.0',
        },
      });
    });
  }
}

const app = new App();
new MultiRegionInfrastructureStack(app, 'multi-region-infrastructure');
app.synth();
```

## 6. Package Configuration

**`package.json`** (for reference):

```json
{
  "name": "multi-region-cdktf-infrastructure",
  "version": "1.0.0",
  "main": "main.ts",
  "scripts": {
    "get": "cdktf get",
    "build": "tsc",
    "synth": "cdktf synth",
    "compile": "tsc --pretty",
    "watch": "tsc -w",
    "test": "jest",
    "deploy": "cdktf deploy",
    "destroy": "cdktf destroy"
  },
  "devDependencies": {
    "@types/jest": "^29.5.5",
    "@types/node": "^20.6.2",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.1",
    "ts-node": "^10.9.1",
    "typescript": "^5.2.2"
  },
  "dependencies": {
    "@cdktf/provider-aws": "^19.0.0",
    "cdktf": "^0.18.0",
    "constructs": "^10.3.0"
  }
}
```

## Key Features

### **Modular Architecture**

- Separate constructs for networking, RDS, and ElastiCache
- Reusable components with well-defined interfaces
- Clean separation of concerns

### **Multi-Region Setup**

- VPCs in `eu-central-1`, `us-west-2`, and `us-east-2`
- Full mesh VPC peering between all regions
- Region-specific providers and resources

### **Production-Ready Security**

- Security groups with least-privilege access
- Encryption at rest and in transit for databases
- Private subnets for database resources
- Secrets management via AWS Secrets Manager

### **Comprehensive Tagging**

- Consistent tagging across all resources
- Environment, Owner, Project, and Region tags
- Easy resource identification and cost tracking

### **High Availability**

- Multi-AZ deployments for RDS and ElastiCache
- Multiple availability zones per region
- Automatic failover capabilities

### **Easy Deployment**

```bash
# Initialize and deploy
npm install
cdktf get
cdktf synth
cdktf plan
cdktf deploy
```

This configuration provides a robust, scalable, and production-ready multi-region infrastructure that can be easily customized and extended based on your specific requirements.
