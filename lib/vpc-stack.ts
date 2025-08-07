import {
  cloudwatchLogGroup,
  dataAwsRegion,
  eip,
  flowLog,
  iamRole,
  iamRolePolicy,
  internetGateway,
  natGateway,
  routeTable,
  routeTableAssociation,
  subnet,
  vpc
} from '@cdktf/provider-aws';
import { Fn, TerraformOutput, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';

interface VpcStackConfig {
  environment: string;
  region: string;
  vpcCidr: string;
  azs: string[];
  publicSubnetCidrs: string[];
  privateSubnetCidrs: string[];
  databaseSubnetCidrs: string[];
  commonTags: { [key: string]: string };
}

export class VpcStack extends TerraformStack {
  public readonly vpcId: string;
  public readonly publicSubnets: string[];
  public readonly privateSubnets: string[];
  public readonly databaseSubnets: string[];
  public readonly internetGatewayId: string;
  public readonly natGatewayIds: string[];

  constructor(scope: Construct, id: string, config: VpcStackConfig) {
    super(scope, id);

    new dataAwsRegion.DataAwsRegion(this, 'current');

    const mainVpc = new vpc.Vpc(this, 'MainVpc', {
      cidrBlock: config.vpcCidr,
      enableDnsSupport: true,
      enableDnsHostnames: true,
      tags: {
        ...config.commonTags,
        Name: `${config.environment}-vpc`,
      },
    });

    const igw = new internetGateway.InternetGateway(this, 'IGW', {
      vpcId: mainVpc.id,
      tags: {
        ...config.commonTags,
        Name: `${config.environment}-igw`,
      },
    });

    const publicSubnets = config.publicSubnetCidrs.map((cidr, i) => {
      return new subnet.Subnet(this, `PublicSubnet${i}`, {
        vpcId: mainVpc.id,
        cidrBlock: cidr,
        availabilityZone: Fn.element(config.azs, i),
        mapPublicIpOnLaunch: true,
        tags: {
          ...config.commonTags,
          Name: `${config.environment}-public-subnet-${i + 1}`,
        },
      });
    });

    const privateSubnets = config.privateSubnetCidrs.map((cidr, i) => {
      return new subnet.Subnet(this, `PrivateSubnet${i}`, {
        vpcId: mainVpc.id,
        cidrBlock: cidr,
        availabilityZone: Fn.element(config.azs, i),
        tags: {
          ...config.commonTags,
          Name: `${config.environment}-private-subnet-${i + 1}`,
        },
      });
    });

    const databaseSubnets = config.databaseSubnetCidrs.map((cidr, i) => {
      return new subnet.Subnet(this, `DatabaseSubnet${i}`, {
        vpcId: mainVpc.id,
        cidrBlock: cidr,
        availabilityZone: Fn.element(config.azs, i),
        tags: {
          ...config.commonTags,
          Name: `${config.environment}-database-subnet-${i + 1}`,
        },
      });
    });

    const eips = privateSubnets.map((_, i) => {
      return new eip.Eip(this, `NatEip${i}`, {
        domain: 'vpc',
        tags: {
          ...config.commonTags,
          Name: `${config.environment}-nat-eip-${i + 1}`,
        },
      });
    });

    const natGateways = privateSubnets.map((_, i) => {
      return new natGateway.NatGateway(this, `NatGateway${i}`, {
        allocationId: eips[i].id,
        subnetId: publicSubnets[i].id,
        tags: {
          ...config.commonTags,
          Name: `${config.environment}-nat-gateway-${i + 1}`,
        },
      });
    });

    const publicRT = new routeTable.RouteTable(this, 'PublicRT', {
      vpcId: mainVpc.id,
      route: [
        {
          cidrBlock: '0.0.0.0/0',
          gatewayId: igw.id,
        },
      ],
      tags: {
        ...config.commonTags,
        Name: `${config.environment}-public-rt`,
      },
    });

    publicSubnets.forEach((s, i) => {
      new routeTableAssociation.RouteTableAssociation(this, `PublicRTA${i}`, {
        subnetId: s.id,
        routeTableId: publicRT.id,
      });
    });

    privateSubnets.forEach((s, i) => {
      const rt = new routeTable.RouteTable(this, `PrivateRT${i}`, {
        vpcId: mainVpc.id,
        route: [
          {
            cidrBlock: '0.0.0.0/0',
            natGatewayId: natGateways[i].id,
          },
        ],
        tags: {
          ...config.commonTags,
          Name: `${config.environment}-private-rt-${i + 1}`,
        },
      });

      new routeTableAssociation.RouteTableAssociation(this, `PrivateRTA${i}`, {
        subnetId: s.id,
        routeTableId: rt.id,
      });
    });

    const dbRT = new routeTable.RouteTable(this, 'DatabaseRT', {
      vpcId: mainVpc.id,
      tags: {
        ...config.commonTags,
        Name: `${config.environment}-database-rt`,
      },
    });

    databaseSubnets.forEach((s, i) => {
      new routeTableAssociation.RouteTableAssociation(this, `DatabaseRTA${i}`, {
        subnetId: s.id,
        routeTableId: dbRT.id,
      });
    });

    const logGroup = new cloudwatchLogGroup.CloudwatchLogGroup(
      this,
      'VpcFlowLogGroup',
      {
        name: `/aws/vpc/flowlogs/${config.environment}`,
        retentionInDays: config.environment === 'production' ? 365 : 30,
        tags: config.commonTags,
      }
    );

    const flowLogRole = new iamRole.IamRole(this, 'VpcFlowLogRole', {
      name: `${config.environment}-vpc-flow-log-role`,
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
      tags: config.commonTags,
    });

    new iamRolePolicy.IamRolePolicy(this, 'VpcFlowLogPolicy', {
      name: `${config.environment}-vpc-flow-log-policy`,
      role: flowLogRole.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'logs:CreateLogGroup',
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

    new flowLog.FlowLog(this, 'VpcFlowLog', {
      iamRoleArn: flowLogRole.arn,
      logDestination: logGroup.arn,
      trafficType: 'ALL',
      vpcId: mainVpc.id,
    });

    this.vpcId = mainVpc.id;
    this.publicSubnets = publicSubnets.map(s => s.id);
    this.privateSubnets = privateSubnets.map(s => s.id);
    this.databaseSubnets = databaseSubnets.map(s => s.id);
    this.internetGatewayId = igw.id;
    this.natGatewayIds = natGateways.map(n => n.id);

    new TerraformOutput(this, 'vpc_id', { value: this.vpcId });
    new TerraformOutput(this, 'public_subnet_ids', {
      value: this.publicSubnets,
    });
    new TerraformOutput(this, 'private_subnet_ids', {
      value: this.privateSubnets,
    });
    new TerraformOutput(this, 'database_subnet_ids', {
      value: this.databaseSubnets,
    });
    new TerraformOutput(this, 'internet_gateway_id', {
      value: this.internetGatewayId,
    });
    new TerraformOutput(this, 'nat_gateway_ids', { value: this.natGatewayIds });
  }
}
