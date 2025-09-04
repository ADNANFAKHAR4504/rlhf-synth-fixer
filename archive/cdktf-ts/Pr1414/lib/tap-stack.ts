import { dbInstance } from '@cdktf/provider-aws';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';
import { ElasticacheCluster } from '@cdktf/provider-aws/lib/elasticache-cluster';
import { ElasticacheSubnetGroup } from '@cdktf/provider-aws/lib/elasticache-subnet-group';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { VpcPeeringConnection } from '@cdktf/provider-aws/lib/vpc-peering-connection';
import { VpcPeeringConnectionAccepterA } from '@cdktf/provider-aws/lib/vpc-peering-connection-accepter';
import { RandomProvider } from '@cdktf/provider-random/lib/provider';
import { Password } from '@cdktf/provider-random/lib/password';
import { TerraformStack, TerraformOutput, Fn } from 'cdktf';
import { Construct } from 'constructs';

interface VpcConfig {
  region: string;
  cidrBlock: string;
  availabilityZones: string[];
}

interface VpcOutput {
  region: string;
  vpcId: string;
  cidrBlock: string;
  privateSubnetIds: string[];
  publicSubnetIds: string[];
  databaseSecurityGroupId: string;
  applicationSecurityGroupId: string;
}

export class MultiRegionStack extends TerraformStack {
  public readonly vpcOutputs: { [region: string]: VpcOutput } = {};

  constructor(scope: Construct, id: string) {
    super(scope, id);

    new RandomProvider(this, 'random');

    const uniqueSuffix = Fn.substr(Fn.uuid(), 0, 8);

    const commonTags = {
      Environment: 'production-v4',
      Owner: 'devops-team',
      Project: 'MultiRegionInfra',
    };

    const vpcConfigurations: VpcConfig[] = [
      {
        region: 'eu-central-1',
        cidrBlock: '10.0.0.0/16',
        availabilityZones: ['eu-central-1a', 'eu-central-1b'],
      },
      {
        region: 'us-west-2',
        cidrBlock: '10.1.0.0/16',
        availabilityZones: ['us-west-2a', 'us-west-2b'],
      },
      {
        region: 'us-east-2',
        cidrBlock: '10.2.0.0/16',
        availabilityZones: ['us-east-2a', 'us-east-2b'],
      },
    ];

    const providers: { [region: string]: AwsProvider } = {};
    for (const vpcConfig of vpcConfigurations) {
      const alias = vpcConfig.region.replace(/-/g, '');
      providers[vpcConfig.region] = new AwsProvider(this, `provider-${alias}`, {
        region: vpcConfig.region,
        alias: alias,
      });
    }

    const allVpcCidrBlocks = vpcConfigurations.map(vc => vc.cidrBlock);
    const vpcs: { [region: string]: Vpc } = {};
    const privateRouteTables: { [region: string]: RouteTable[] } = {};

    const dbPassword = new Password(this, 'DbPassword', {
      length: 16,
      special: true,
      overrideSpecial: '_-.',
    });

    for (const vpcConfig of vpcConfigurations) {
      const provider = providers[vpcConfig.region];
      const regionAlias = vpcConfig.region.replace(/-/g, '');

      const vpc = new Vpc(this, `vpc-${vpcConfig.region}`, {
        provider: provider,
        cidrBlock: vpcConfig.cidrBlock,
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          Name: `${commonTags.Environment}-${vpcConfig.region}-vpc`,
          ...commonTags,
        },
      });
      vpcs[vpcConfig.region] = vpc;

      const igw = new InternetGateway(this, `igw-${vpcConfig.region}`, {
        provider: provider,
        vpcId: vpc.id,
        tags: {
          Name: `${commonTags.Environment}-${vpcConfig.region}-igw`,
          ...commonTags,
        },
      });
      const publicRt = new RouteTable(this, `public-rt-${vpcConfig.region}`, {
        provider: provider,
        vpcId: vpc.id,
        tags: {
          Name: `${commonTags.Environment}-${vpcConfig.region}-public-rt`,
          ...commonTags,
        },
      });
      new Route(this, `default-public-route-${vpcConfig.region}`, {
        provider: provider,
        routeTableId: publicRt.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: igw.id,
      });

      const privateSubnets: Subnet[] = [];
      const publicSubnets: Subnet[] = [];
      privateRouteTables[vpcConfig.region] = [];

      for (let i = 0; i < vpcConfig.availabilityZones.length; i++) {
        const az = vpcConfig.availabilityZones[i];
        const baseCidr = vpcConfig.cidrBlock.split('.').slice(0, 2).join('.');
        const publicCidr = `${baseCidr}.${i * 2}.0/24`;
        const privateCidr = `${baseCidr}.${i * 2 + 1}.0/24`;

        const publicSubnet = new Subnet(
          this,
          `public-subnet-${regionAlias}-${i}`,
          {
            provider: provider,
            vpcId: vpc.id,
            cidrBlock: publicCidr,
            availabilityZone: az,
            mapPublicIpOnLaunch: true,
            tags: {
              Name: `${commonTags.Environment}-${vpcConfig.region}-public-subnet-${az}`,
              ...commonTags,
            },
          }
        );
        publicSubnets.push(publicSubnet);
        new RouteTableAssociation(this, `public-rt-assoc-${regionAlias}-${i}`, {
          provider: provider,
          subnetId: publicSubnet.id,
          routeTableId: publicRt.id,
        });

        const privateSubnet = new Subnet(
          this,
          `private-subnet-${regionAlias}-${i}`,
          {
            provider: provider,
            vpcId: vpc.id,
            cidrBlock: privateCidr,
            availabilityZone: az,
            mapPublicIpOnLaunch: false,
            tags: {
              Name: `${commonTags.Environment}-${vpcConfig.region}-private-subnet-${az}`,
              ...commonTags,
            },
          }
        );
        privateSubnets.push(privateSubnet);

        const privateRt = new RouteTable(
          this,
          `private-rt-${regionAlias}-${i}`,
          {
            provider: provider,
            vpcId: vpc.id,
            tags: {
              Name: `${commonTags.Environment}-${vpcConfig.region}-private-rt-${az}`,
              ...commonTags,
            },
          }
        );
        new RouteTableAssociation(
          this,
          `private-rt-assoc-${regionAlias}-${i}`,
          {
            provider: provider,
            subnetId: privateSubnet.id,
            routeTableId: privateRt.id,
          }
        );
        privateRouteTables[vpcConfig.region].push(privateRt);
      }

      const dbIngressRules = allVpcCidrBlocks.flatMap(cidr => [
        {
          description: `Allow PostgreSQL from VPC ${cidr}`,
          fromPort: 5432,
          toPort: 5432,
          protocol: 'tcp',
          cidrBlocks: [cidr],
        },
        {
          description: `Allow Redis from VPC ${cidr}`,
          fromPort: 6379,
          toPort: 6379,
          protocol: 'tcp',
          cidrBlocks: [cidr],
        },
      ]);

      const dbSg = new SecurityGroup(this, `db-sg-${vpcConfig.region}`, {
        provider: provider,
        vpcId: vpc.id,
        name: `${commonTags.Environment}-${vpcConfig.region}-db-sg-${uniqueSuffix}`,
        description: 'Security group for database and caching services',
        ingress: dbIngressRules,
        egress: [
          { fromPort: 0, toPort: 0, protocol: '-1', cidrBlocks: ['0.0.0.0/0'] },
        ],
        tags: {
          Name: `${commonTags.Environment}-${vpcConfig.region}-db-sg`,
          ...commonTags,
        },
      });

      const appSg = new SecurityGroup(this, `app-sg-${vpcConfig.region}`, {
        provider: provider,
        vpcId: vpc.id,
        name: `${commonTags.Environment}-${vpcConfig.region}-app-sg-${uniqueSuffix}`,
        description: 'Security group for application instances',
        ingress: [],
        egress: [
          { fromPort: 0, toPort: 0, protocol: '-1', cidrBlocks: ['0.0.0.0/0'] },
        ],
        tags: {
          Name: `${commonTags.Environment}-${vpcConfig.region}-app-sg`,
          ...commonTags,
        },
      });

      this.vpcOutputs[vpcConfig.region] = {
        region: vpcConfig.region,
        vpcId: vpc.id,
        cidrBlock: vpc.cidrBlock,
        privateSubnetIds: privateSubnets.map(s => s.id),
        publicSubnetIds: publicSubnets.map(s => s.id),
        databaseSecurityGroupId: dbSg.id,
        applicationSecurityGroupId: appSg.id,
      };
    }

    for (let i = 0; i < vpcConfigurations.length; i++) {
      for (let j = i + 1; j < vpcConfigurations.length; j++) {
        const requesterVpcConfig = vpcConfigurations[i];
        const accepterVpcConfig = vpcConfigurations[j];
        const peeringConnection = new VpcPeeringConnection(
          this,
          `peering-${requesterVpcConfig.region}-to-${accepterVpcConfig.region}`,
          {
            provider: providers[requesterVpcConfig.region],
            vpcId: vpcs[requesterVpcConfig.region].id,
            peerVpcId: vpcs[accepterVpcConfig.region].id,
            peerRegion: accepterVpcConfig.region,
            autoAccept: false,
            tags: {
              Name: `${commonTags.Environment}-peering-${requesterVpcConfig.region}-to-${accepterVpcConfig.region}`,
              ...commonTags,
            },
          }
        );
        new VpcPeeringConnectionAccepterA(
          this,
          `accepter-${accepterVpcConfig.region}-from-${requesterVpcConfig.region}`,
          {
            provider: providers[accepterVpcConfig.region],
            vpcPeeringConnectionId: peeringConnection.id,
            autoAccept: true,
            tags: {
              Name: `${commonTags.Environment}-peering-accepter-${accepterVpcConfig.region}-from-${requesterVpcConfig.region}`,
              ...commonTags,
            },
          }
        );
        privateRouteTables[requesterVpcConfig.region].forEach((rt, index) => {
          new Route(
            this,
            `priv-route-${requesterVpcConfig.region}-to-${accepterVpcConfig.region}-${index}`,
            {
              provider: providers[requesterVpcConfig.region],
              routeTableId: rt.id,
              destinationCidrBlock: accepterVpcConfig.cidrBlock,
              vpcPeeringConnectionId: peeringConnection.id,
            }
          );
        });
        privateRouteTables[accepterVpcConfig.region].forEach((rt, index) => {
          new Route(
            this,
            `priv-route-${accepterVpcConfig.region}-to-${requesterVpcConfig.region}-${index}`,
            {
              provider: providers[accepterVpcConfig.region],
              routeTableId: rt.id,
              destinationCidrBlock: requesterVpcConfig.cidrBlock,
              vpcPeeringConnectionId: peeringConnection.id,
            }
          );
        });
      }
    }

    for (const vpcConfig of vpcConfigurations) {
      const region = vpcConfig.region;
      const vpcOutput = this.vpcOutputs[region];
      const provider = providers[region];

      const rdsDbSubnetGroup = new DbSubnetGroup(
        this,
        `db-subnet-group-${region}`,
        {
          provider: provider,
          subnetIds: vpcOutput.privateSubnetIds,
          tags: {
            Name: `${commonTags.Environment}-${region}-db-subnet-group`,
            ...commonTags,
          },
        }
      );

      const rdsIdentifier = `${commonTags.Environment}-maindb-${region.replace(/-/g, '')}-${uniqueSuffix}`;

      const rdsLogGroup = new CloudwatchLogGroup(
        this,
        `rds-log-group-${region}`,
        {
          provider: provider,
          name: `/aws/rds/instance/${rdsIdentifier}/postgresql`,
          retentionInDays: 7,
        }
      );

      const rdsInstance = new dbInstance.DbInstance(
        this,
        `rds-instance-${region}`,
        {
          provider: provider,
          allocatedStorage: 20,
          dbSubnetGroupName: rdsDbSubnetGroup.name,
          engine: 'postgres',
          engineVersion: '14',
          instanceClass: 'db.t3.micro',
          identifier: rdsIdentifier,
          username: 'testInfraUser',
          password: dbPassword.result,
          publiclyAccessible: false,
          skipFinalSnapshot: true,
          multiAz: true,
          vpcSecurityGroupIds: [vpcOutput.databaseSecurityGroupId],
          enabledCloudwatchLogsExports: ['postgresql', 'upgrade'],
          tags: {
            Name: `${commonTags.Environment}-${region}-rds-instance`,
            ...commonTags,
          },
          dependsOn: [rdsLogGroup],
        }
      );

      const elasticacheSubnetGroup = new ElasticacheSubnetGroup(
        this,
        `elasticache-subnet-group-${region}`,
        {
          provider: provider,
          name: `${commonTags.Environment}-${region}-elasticache-subnet-group-${uniqueSuffix}`,
          subnetIds: vpcOutput.privateSubnetIds,
          tags: {
            Name: `${commonTags.Environment}-${region}-elasticache-subnet-group`,
            ...commonTags,
          },
        }
      );

      // FIX: Assign the created resource to a constant.
      const elasticacheCluster = new ElasticacheCluster(
        this,
        `elasticache-cluster-${region}`,
        {
          provider: provider,
          clusterId: `${commonTags.Environment}-redis-cluster-${region}-${uniqueSuffix}`,
          engine: 'redis',
          nodeType: 'cache.t3.micro',
          numCacheNodes: 1,
          port: 6379,
          parameterGroupName: 'default.redis6.x',
          engineVersion: '6.x',
          subnetGroupName: elasticacheSubnetGroup.name,
          securityGroupIds: [vpcOutput.databaseSecurityGroupId],
          tags: {
            Name: `${commonTags.Environment}-${region}-elasticache-cluster`,
            ...commonTags,
          },
        }
      );

      new TerraformOutput(this, `rds-endpoint-${region}`, {
        value: rdsInstance.endpoint,
      });
      new TerraformOutput(this, `elasticache-endpoint-${region}`, {
        value: elasticacheCluster.cacheNodes.get(0).address,
      });
      new TerraformOutput(this, `db-sg-id-${region}`, {
        value: vpcOutput.databaseSecurityGroupId,
      });
      new TerraformOutput(this, `app-sg-id-${region}`, {
        value: vpcOutput.applicationSecurityGroupId,
      });
    }
  }
}
