import * as aws from '@cdktf/provider-aws';
import { Construct } from 'constructs';

export interface VpcConstructProps {
  environment: string;
  region: string;
  vpcCidr: string;
  azs: string[];
  publicSubnetCidrs: string[];
  privateSubnetCidrs: string[];
  databaseSubnetCidrs: string[];
  commonTags: { [key: string]: string };
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

    new aws.dataAwsRegion.DataAwsRegion(this, 'current');

    const mainVpc = new aws.vpc.Vpc(this, 'MainVpc', {
      cidrBlock: config.vpcCidr,
      enableDnsSupport: true,
      enableDnsHostnames: true,
      tags: {
        ...config.commonTags,
        Name: `${config.environment}-vpc`,
      },
    });

    const igw = new aws.internetGateway.InternetGateway(this, 'IGW', {
      vpcId: mainVpc.id,
      tags: {
        ...config.commonTags,
        Name: `${config.environment}-igw`,
      },
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

    const eips = privateSubnets.map(
      (_, i) =>
        new aws.eip.Eip(this, `NatEip${i}`, {
          domain: 'vpc',
          tags: {
            ...config.commonTags,
            Name: `${config.environment}-nat-eip-${i + 1}`,
          },
        })
    );

    const natGateways = privateSubnets.map(
      (_, i) =>
        new aws.natGateway.NatGateway(this, `NatGateway${i}`, {
          allocationId: eips[i].id,
          subnetId: publicSubnets[i].id,
          tags: {
            ...config.commonTags,
            Name: `${config.environment}-nat-gateway-${i + 1}`,
          },
        })
    );

    // ── Route tables ───────────────────────────────────────────────────────────
    // Public: single RT with default route to IGW, associate to all public subnets
    const publicRt = new aws.routeTable.RouteTable(this, 'PublicRouteTable', {
      vpcId: mainVpc.id,
      route: [{ cidrBlock: '0.0.0.0/0', gatewayId: igw.id }],
      tags: { ...config.commonTags, Name: `${config.environment}-public-rt` },
    });

    publicSubnets.forEach((sub, i) => {
      new aws.routeTableAssociation.RouteTableAssociation(
        this,
        `PublicRTA${i}`,
        {
          routeTableId: publicRt.id,
          subnetId: sub.id,
        }
      );
    });

    // Private: one RT per private subnet -> route to matching NAT GW
    privateSubnets.forEach((sub, i) => {
      const rt = new aws.routeTable.RouteTable(this, `PrivateRouteTable${i}`, {
        vpcId: mainVpc.id,
        route: [{ cidrBlock: '0.0.0.0/0', natGatewayId: natGateways[i].id }],
        tags: {
          ...config.commonTags,
          Name: `${config.environment}-private-rt-${i + 1}`,
        },
      });

      new aws.routeTableAssociation.RouteTableAssociation(
        this,
        `PrivateRTA${i}`,
        {
          routeTableId: rt.id,
          subnetId: sub.id,
        }
      );
    });

    // ── VPC Flow Logs to CloudWatch ────────────────────────────────────────────
    const flowLogGroup = new aws.cloudwatchLogGroup.CloudwatchLogGroup(
      this,
      'VpcFlowLogsGroup',
      {
        name: `/aws/vpc/${config.environment}-flow-logs`,
        retentionInDays: config.environment === 'production' ? 365 : 30,
        tags: config.commonTags,
      }
    );

    const flowLogsRole = new aws.iamRole.IamRole(this, 'VpcFlowLogsRole', {
      name: `${config.environment}-vpc-flow-logs-role`,
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

    // VPC Flow Logs (most compatible args)
    new aws.flowLog.FlowLog(this, 'VpcFlowLog', {
      // send to CloudWatch Logs by pointing at the Log Group ARN directly
      logDestination: flowLogGroup.arn,
      iamRoleArn: flowLogsRole.arn, // role that allows delivery to CWL
      trafficType: 'ALL',
      vpcId: mainVpc.id,
      tags: {
        ...config.commonTags,
        Name: `${config.environment}-vpc-flow-logs`,
      },
    } as any);

    // Output props for wiring
    this.vpcId = mainVpc.id;
    this.publicSubnets = publicSubnets.map(s => s.id);
    this.privateSubnets = privateSubnets.map(s => s.id);
    this.databaseSubnets = databaseSubnets.map(s => s.id);
    this.internetGatewayId = igw.id;
    this.natGatewayIds = natGateways.map(n => n.id);
  }
}
