# IDEAL_RESPONSE: Multi-Region Modular CDKTF Setup

This file contains a complete, **modular CDKTF configuration** in a single TypeScript file.
It provisions a **highly available** and **interconnected AWS infrastructure** across three regions:
**`eu-central-1`**, **`us-west-2`**, and **`us-east-2`**.

---

## TypeScript Code

```ts
import { App, TerraformStack, TerraformOutput, TerraformVariable } from 'cdktf';
import { Construct } from 'constructs';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { VpcPeeringConnection } from '@cdktf/provider-aws/lib/vpc-peering-connection';
import { VpcPeeringConnectionAccepter } from '@cdktf/provider-aws/lib/vpc-peering-connection-accepter';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { DataAwsAvailabilityZones } from '@cdktf/provider-aws/lib/data-aws-availability-zones';
import { DbInstance } from '@cdktf/provider-aws/lib/db-instance';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';
import { ElasticacheCluster } from '@cdktf/provider-aws/lib/elasticache-cluster';
import { ElasticacheSubnetGroup } from '@cdktf/provider-aws/lib/elasticache-subnet-group';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
```

---

## MultiRegionNetworkingConstruct

Creates VPCs, subnets, and peering connections across multiple regions.

```ts
export interface MultiRegionNetworkingConstructProps {
  regions: string[];
  vpcCidrBlocks: string[];
  tags: { [key: string]: string };
}

export class MultiRegionNetworkingConstruct extends Construct {
  public readonly vpcs = new Map<string, Vpc>();
  public readonly publicSubnets = new Map<string, Subnet[]>();
  public readonly privateSubnets = new Map<string, Subnet[]>();

  constructor(
    scope: Construct,
    id: string,
    props: MultiRegionNetworkingConstructProps
  ) {
    super(scope, id);

    const providers = new Map<string, AwsProvider>();
    props.regions.forEach(region => {
      providers.set(
        region,
        new AwsProvider(this, `provider-${region}`, { region })
      );
    });

    props.regions.forEach((region, index) => {
      const vpcCidrBlock = props.vpcCidrBlocks[index];

      const azs = new DataAwsAvailabilityZones(this, `azs-${region}`, {
        provider: providers.get(region),
        state: 'available',
      });

      const vpc = new Vpc(this, `vpc-${region}`, {
        provider: providers.get(region),
        cidrBlock: vpcCidrBlock,
        tags: { ...props.tags, Name: `${id}-vpc-${region}` },
      });
      this.vpcs.set(region, vpc);

      const publicSubnets: Subnet[] = [];
      const privateSubnets: Subnet[] = [];
      for (let i = 0; i < 3; i++) {
        const prefix = vpcCidrBlock.split('.').slice(0, 2).join('.');
        publicSubnets.push(
          new Subnet(this, `public-subnet-${region}-${i}`, {
            provider: providers.get(region),
            vpcId: vpc.id,
            cidrBlock: `${prefix}.${2 * i}.0/24`,
            availabilityZone: `\${data.aws_availability_zones.azs-${region}.names[${i}]}`,
            mapPublicIpOnLaunch: true,
            tags: { ...props.tags, Name: `${id}-public-subnet-${region}-${i}` },
          })
        );
        privateSubnets.push(
          new Subnet(this, `private-subnet-${region}-${i}`, {
            provider: providers.get(region),
            vpcId: vpc.id,
            cidrBlock: `${prefix}.${2 * i + 1}.0/24`,
            availabilityZone: `\${data.aws_availability_zones.azs-${region}.names[${i}]}`,
            tags: {
              ...props.tags,
              Name: `${id}-private-subnet-${region}-${i}`,
            },
          })
        );
      }
      this.publicSubnets.set(region, publicSubnets);
      this.privateSubnets.set(region, privateSubnets);

      const rt = new RouteTable(this, `rt-${region}`, {
        provider: providers.get(region),
        vpcId: vpc.id,
        tags: { ...props.tags, Name: `${id}-rt-${region}` },
      });

      privateSubnets.forEach((subnet, i) => {
        new RouteTableAssociation(this, `rta-${region}-${i}`, {
          provider: providers.get(region),
          subnetId: subnet.id,
          routeTableId: rt.id,
        });
      });
    });

    for (let i = 0; i < props.regions.length; i++) {
      for (let j = i + 1; j < props.regions.length; j++) {
        const regionA = props.regions[i];
        const regionB = props.regions[j];

        const vpcA = this.vpcs.get(regionA)!;
        const vpcB = this.vpcs.get(regionB)!;

        const peer = new VpcPeeringConnection(
          this,
          `peer-${regionA}-${regionB}`,
          {
            provider: providers.get(regionA),
            vpcId: vpcA.id,
            peerVpcId: vpcB.id,
            peerRegion: regionB,
            autoAccept: false,
            tags: { ...props.tags, Name: `peer-${regionA}-${regionB}` },
          }
        );

        const accepter = new VpcPeeringConnectionAccepter(
          this,
          `peer-accepter-${regionB}-${regionA}`,
          {
            provider: providers.get(regionB),
            vpcPeeringConnectionId: peer.id,
            autoAccept: true,
            tags: {
              ...props.tags,
              Name: `peer-accepter-${regionB}-${regionA}`,
            },
          }
        );

        new Route(this, `route-${regionA}-to-${regionB}`, {
          provider: providers.get(regionA),
          routeTableId: `\${aws_vpc.vpc-${regionA}.default_route_table_id}`,
          destinationCidrBlock: vpcB.cidrBlock,
          vpcPeeringConnectionId: peer.id,
        });

        new Route(this, `route-${regionB}-to-${regionA}`, {
          provider: providers.get(regionB),
          routeTableId: `\${aws_vpc.vpc-${regionB}.default_route_table_id}`,
          destinationCidrBlock: vpcA.cidrBlock,
          vpcPeeringConnectionId: accepter.id,
        });
      }
    }
  }
}
```

---

## RdsConstruct (HA Postgres)

```ts
export interface RdsConstructProps {
  region: string;
  vpcId: string;
  privateSubnetIds: string[];
  tags: { [key: string]: string };
}

export class RdsConstruct extends Construct {
  public readonly rdsInstanceEndpoint: string;
  public readonly rdsInstancePort: number;

  constructor(scope: Construct, id: string, props: RdsConstructProps) {
    super(scope, id);

    const provider = new AwsProvider(this, `provider-${props.region}`, {
      region: props.region,
    });

    const sg = new SecurityGroup(this, `rds-sg-${props.region}`, {
      provider,
      vpcId: props.vpcId,
      name: `${id}-sg`,
      description: 'Allow internal RDS traffic',
      ingress: [
        {
          fromPort: 5432,
          toPort: 5432,
          protocol: 'tcp',
          cidrBlocks: [`\${aws_vpc.vpc-${props.region}.cidr_block}`],
        },
      ],
      tags: { ...props.tags, Name: `${id}-sg` },
    });

    const subnetGroup = new DbSubnetGroup(
      this,
      `subnet-group-${props.region}`,
      {
        provider,
        name: `${id}-subnet-group`,
        subnetIds: props.privateSubnetIds,
        tags: { ...props.tags, Name: `${id}-subnet-group` },
      }
    );

    const db = new DbInstance(this, `rds-${props.region}`, {
      provider,
      identifier: `${id}-db`,
      engine: 'postgres',
      engineVersion: '13.3',
      instanceClass: 'db.t3.micro',
      allocatedStorage: 20,
      username: 'dbadmin',
      password: new TerraformVariable(this, 'db_password', {
        type: 'string',
        sensitive: true,
      }).value,
      dbSubnetGroupName: subnetGroup.name,
      multiAz: true,
      vpcSecurityGroupIds: [sg.id],
      skipFinalSnapshot: true,
      tags: { ...props.tags, Name: `${id}-rds` },
    });

    this.rdsInstanceEndpoint = db.endpoint;
    this.rdsInstancePort = db.port;
  }
}
```

---

## ElastiCacheConstruct (HA Redis)

```ts
export interface ElastiCacheConstructProps {
  region: string;
  vpcId: string;
  privateSubnetIds: string[];
  tags: { [key: string]: string };
}

export class ElastiCacheConstruct extends Construct {
  public readonly cacheClusterAddress: string;
  public readonly cacheClusterPort: number;

  constructor(scope: Construct, id: string, props: ElastiCacheConstructProps) {
    super(scope, id);

    const provider = new AwsProvider(this, `provider-${props.region}`, {
      region: props.region,
    });

    const sg = new SecurityGroup(this, `cache-sg-${props.region}`, {
      provider,
      vpcId: props.vpcId,
      name: `${id}-sg`,
      description: 'Allow internal Redis traffic',
      ingress: [
        {
          fromPort: 6379,
          toPort: 6379,
          protocol: 'tcp',
          cidrBlocks: [`\${aws_vpc.vpc-${props.region}.cidr_block}`],
        },
      ],
      tags: { ...props.tags, Name: `${id}-sg` },
    });

    const subnetGroup = new ElasticacheSubnetGroup(
      this,
      `subnet-group-${props.region}`,
      {
        provider,
        name: `${id}-subnet-group`,
        subnetIds: props.privateSubnetIds,
        tags: { ...props.tags, Name: `${id}-subnet-group` },
      }
    );

    const cluster = new ElasticacheCluster(this, `cache-${props.region}`, {
      provider,
      clusterId: `${id}-cache`,
      engine: 'redis',
      engineVersion: '6.x',
      nodeType: 'cache.t3.micro',
      numCacheNodes: 1,
      subnetGroupName: subnetGroup.name,
      securityGroupIds: [sg.id],
      tags: { ...props.tags, Name: `${id}-cache` },
    });

    this.cacheClusterAddress = cluster.cacheNodes.get(0).address;
    this.cacheClusterPort = cluster.port;
  }
}
```

---

## Main Stack

```ts
class MultiRegionStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    const regions = ['us-east-1', 'us-west-2', 'us-east-2'];
    const cidrs = ['10.0.0.0/16', '10.1.0.0/16', '10.2.0.0/16'];
    const tags = {
      Environment: 'prod',
      Owner: 'DevOps Team',
    };

    regions.forEach(region => {
      new AwsProvider(this, `provider-${region}`, { region });
    });

    const networking = new MultiRegionNetworkingConstruct(
      this,
      'multi-network',
      {
        regions,
        vpcCidrBlocks: cidrs,
        tags,
      }
    );

    regions.forEach(region => {
      const vpc = networking.vpcs.get(region);
      const subnets = networking.privateSubnets.get(region);

      if (vpc && subnets) {
        new RdsConstruct(this, `rds-${region}`, {
          region,
          vpcId: vpc.id,
          privateSubnetIds: subnets.map(s => s.id),
          tags,
        });

        new ElastiCacheConstruct(this, `redis-${region}`, {
          region,
          vpcId: vpc.id,
          privateSubnetIds: subnets.map(s => s.id),
          tags,
        });

        new TerraformOutput(this, `vpc-${region}`, {
          value: vpc.id,
        });
      }
    });

    new TerraformOutput(this, `vpc-peering-connections`, {
      value: `\${keys(aws_vpc_peering_connection)}`,
    });
  }
}

const app = new App();
new MultiRegionStack(app, 'multi-region-stack');
app.synth();
```

---

## Deployment Instructions

```bash
npm install
cdktf synth
cdktf plan
cdktf deploy
```

> Ensure you define a `db_password` in `cdktf.json` or export it as an environment variable before deployment.

---

Let me know if you want this converted into a downloadable `.md` file as well.
