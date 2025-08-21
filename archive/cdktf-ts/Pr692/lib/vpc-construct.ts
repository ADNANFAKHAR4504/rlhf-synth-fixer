import * as aws from '@cdktf/provider-aws';
import { Construct } from 'constructs';

export type NatMode = 'single' | 'per-az' | 'none';

export interface VpcConstructProps {
  environment: string;
  region: string;
  vpcCidr: string;
  azs: string[];
  publicSubnetCidrs: string[];
  privateSubnetCidrs: string[];
  databaseSubnetCidrs: string[];
  commonTags: { [key: string]: string };
  /** Optional override. Defaults: production=per-az, others=single */
  natMode?: NatMode;
  resourceSuffix?: string;
}

export class VpcConstruct extends Construct {
  public readonly vpcId: string;
  public readonly publicSubnets: string[];
  public readonly privateSubnets: string[];
  public readonly databaseSubnets: string[];
  public readonly internetGatewayId: string;
  public readonly natGatewayIds: string[];

  constructor(scope: Construct, id: string, config: VpcConstructProps) {
    super(scope, id);

    const suffix = config.resourceSuffix ? `-${config.resourceSuffix}` : '';

    new aws.dataAwsRegion.DataAwsRegion(this, 'current');

    const mainVpc = new aws.vpc.Vpc(this, 'MainVpc', {
      cidrBlock: config.vpcCidr,
      enableDnsSupport: true,
      enableDnsHostnames: true,
      tags: { ...config.commonTags, Name: `${config.environment}-vpc` },
    });

    const igw = new aws.internetGateway.InternetGateway(this, 'IGW', {
      vpcId: mainVpc.id,
      tags: { ...config.commonTags, Name: `${config.environment}-igw` },
    });

    const publicSubnets = config.publicSubnetCidrs.map(
      (cidr, i) =>
        new aws.subnet.Subnet(this, `PublicSubnet${i}`, {
          vpcId: mainVpc.id,
          cidrBlock: cidr,
          availabilityZone: config.azs[i],
          mapPublicIpOnLaunch: true,
          tags: {
            ...config.commonTags,
            Name: `${config.environment}-public-subnet-${i + 1}`,
          },
        })
    );

    const privateSubnets = config.privateSubnetCidrs.map(
      (cidr, i) =>
        new aws.subnet.Subnet(this, `PrivateSubnet${i}`, {
          vpcId: mainVpc.id,
          cidrBlock: cidr,
          availabilityZone: config.azs[i],
          tags: {
            ...config.commonTags,
            Name: `${config.environment}-private-subnet-${i + 1}`,
          },
        })
    );

    const databaseSubnets = config.databaseSubnetCidrs.map(
      (cidr, i) =>
        new aws.subnet.Subnet(this, `DatabaseSubnet${i}`, {
          vpcId: mainVpc.id,
          cidrBlock: cidr,
          availabilityZone: config.azs[i],
          tags: {
            ...config.commonTags,
            Name: `${config.environment}-database-subnet-${i + 1}`,
          },
        })
    );

    // ── NAT strategy (quota-safe) ──────────────────────────────────────────────
    const natMode: NatMode =
      config.natMode ??
      (config.environment === 'production' ? 'per-az' : 'single');

    const natGatewayIds: string[] = [];

    if (natMode === 'single') {
      // One EIP + One NAT in first public subnet
      const eip = new aws.eip.Eip(this, 'NatEip0', {
        domain: 'vpc',
        tags: { ...config.commonTags, Name: `${config.environment}-nat-eip-1` },
      });

      const nat = new aws.natGateway.NatGateway(this, 'NatGateway0', {
        allocationId: eip.id,
        subnetId: publicSubnets[0].id,
        tags: {
          ...config.commonTags,
          Name: `${config.environment}-nat-gateway-1`,
        },
      });

      natGatewayIds.push(nat.id);
    } else if (natMode === 'per-az') {
      // One NAT per private subnet / AZ (will consume multiple EIPs)
      privateSubnets.forEach((_, i) => {
        const eip = new aws.eip.Eip(this, `NatEip${i}`, {
          domain: 'vpc',
          tags: {
            ...config.commonTags,
            Name: `${config.environment}-nat-eip-${i + 1}`,
          },
        });

        const nat = new aws.natGateway.NatGateway(this, `NatGateway${i}`, {
          allocationId: eip.id,
          subnetId: publicSubnets[i].id,
          tags: {
            ...config.commonTags,
            Name: `${config.environment}-nat-gateway-${i + 1}`,
          },
        });

        natGatewayIds.push(nat.id);
      });
    } else {
      // natMode === 'none' → no NAT/EIP
    }

    // ── Route tables ───────────────────────────────────────────────────────────
    // Public RT -> IGW
    const publicRt = new aws.routeTable.RouteTable(this, 'PublicRouteTable', {
      vpcId: mainVpc.id,
      route: [{ cidrBlock: '0.0.0.0/0', gatewayId: igw.id }],
      tags: { ...config.commonTags, Name: `${config.environment}-public-rt` },
    });

    publicSubnets.forEach((sub, i) => {
      new aws.routeTableAssociation.RouteTableAssociation(
        this,
        `PublicRTA${i}`,
        { routeTableId: publicRt.id, subnetId: sub.id }
      );
    });

    // Private RTs:
    if (natMode === 'per-az') {
      // One RT per private subnet to its NAT
      privateSubnets.forEach((sub, i) => {
        const rt = new aws.routeTable.RouteTable(
          this,
          `PrivateRouteTable${i}`,
          {
            vpcId: mainVpc.id,
            route: [
              { cidrBlock: '0.0.0.0/0', natGatewayId: natGatewayIds[i] ?? '' },
            ],
            tags: {
              ...config.commonTags,
              Name: `${config.environment}-private-rt-${i + 1}`,
            },
          }
        );

        new aws.routeTableAssociation.RouteTableAssociation(
          this,
          `PrivateRTA${i}`,
          { routeTableId: rt.id, subnetId: sub.id }
        );
      });
    } else if (natMode === 'single') {
      // One RT targeting the single NAT, associate to all private subnets
      const rt = new aws.routeTable.RouteTable(this, 'PrivateRouteTable', {
        vpcId: mainVpc.id,
        route:
          natGatewayIds.length > 0
            ? [{ cidrBlock: '0.0.0.0/0', natGatewayId: natGatewayIds[0] }]
            : [],
        tags: {
          ...config.commonTags,
          Name: `${config.environment}-private-rt`,
        },
      });

      privateSubnets.forEach((sub, i) => {
        new aws.routeTableAssociation.RouteTableAssociation(
          this,
          `PrivateRTA${i}`,
          { routeTableId: rt.id, subnetId: sub.id }
        );
      });
    } else {
      // natMode === 'none': create plain private RTs without 0.0.0.0/0
      privateSubnets.forEach((sub, i) => {
        const rt = new aws.routeTable.RouteTable(
          this,
          `PrivateRouteTable${i}`,
          {
            vpcId: mainVpc.id,
            tags: {
              ...config.commonTags,
              Name: `${config.environment}-private-rt-${i + 1}`,
            },
          }
        );
        new aws.routeTableAssociation.RouteTableAssociation(
          this,
          `PrivateRTA${i}`,
          { routeTableId: rt.id, subnetId: sub.id }
        );
      });
    }

    // ── VPC Flow Logs ──────────────────────────────────────────────────────────
    const flowLogGroup = new aws.cloudwatchLogGroup.CloudwatchLogGroup(
      this,
      'VpcFlowLogsGroup',
      {
        name: `/aws/vpc/${config.environment}-${id}-flow-logs${suffix}`,
        retentionInDays: config.environment === 'production' ? 365 : 30,
        tags: config.commonTags,
      }
    );

    const flowLogsRole = new aws.iamRole.IamRole(this, 'VpcFlowLogsRole', {
      name: `${config.environment}-${id}-vpc-flow-logs-role${suffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { Service: 'vpc-flow-logs.amazonaws.com' },
            Action: 'sts:AssumeRole',
          },
        ],
      }),
      tags: config.commonTags,
    });

    new aws.iamRolePolicy.IamRolePolicy(this, 'VpcFlowLogsPolicy', {
      name: `${config.environment}-vpc-flow-logs-policy`,
      role: flowLogsRole.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'logs:CreateLogStream',
              'logs:PutLogEvents',
              'logs:DescribeLogGroups',
              'logs:DescribeLogStreams',
            ],
            Resource: '*',
          },
        ],
      }),
    });

    new aws.flowLog.FlowLog(this, 'VpcFlowLog', {
      logDestination: flowLogGroup.arn,
      iamRoleArn: flowLogsRole.arn,
      trafficType: 'ALL',
      vpcId: mainVpc.id,
      tags: {
        ...config.commonTags,
        Name: `${config.environment}-vpc-flow-logs`,
      },
    } as aws.flowLog.FlowLogConfig);

    // Outputs
    this.vpcId = mainVpc.id;
    this.publicSubnets = publicSubnets.map(s => s.id);
    this.privateSubnets = privateSubnets.map(s => s.id);
    this.databaseSubnets = databaseSubnets.map(s => s.id);
    this.internetGatewayId = igw.id;
    this.natGatewayIds = natGatewayIds;
  }
}
