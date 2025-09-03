import { Construct } from 'constructs';
import {
  vpc,
  subnet,
  internetGateway,
  natGateway,
  eip,
  routeTable,
  route,
  routeTableAssociation,
  flowLog,
  cloudwatchLogGroup,
  iamRole,
  iamRolePolicy,
  dataAwsIamPolicyDocument,
} from '@cdktf/provider-aws/lib';
import { AppConfig } from '../config/variables';

export interface NetworkingProps {
  config: AppConfig;
}

export class NetworkingConstruct extends Construct {
  public readonly vpc: vpc.Vpc;
  public readonly publicSubnets: subnet.Subnet[];
  public readonly privateSubnets: subnet.Subnet[];
  public readonly dbSubnets: subnet.Subnet[];
  public readonly internetGateway: internetGateway.InternetGateway;
  public readonly natGateways: natGateway.NatGateway[];

  constructor(scope: Construct, id: string, props: NetworkingProps) {
    super(scope, id);

    const { config } = props;

    this.vpc = new vpc.Vpc(this, 'vpc', {
      cidrBlock: config.vpcCidr,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        ...config.tags,
        Name: `${config.projectName}-vpc`,
      },
    });

    this.internetGateway = new internetGateway.InternetGateway(this, 'igw', {
      vpcId: this.vpc.id,
      tags: {
        ...config.tags,
        Name: `${config.projectName}-igw`,
      },
    });

    this.publicSubnets = config.publicSubnetCidrs.map((cidr, index) => {
      return new subnet.Subnet(this, `public-subnet-${index}`, {
        vpcId: this.vpc.id,
        cidrBlock: cidr,
        availabilityZone: config.availabilityZones[index],
        mapPublicIpOnLaunch: true,
        tags: {
          ...config.tags,
          Name: `${config.projectName}-public-subnet-${index + 1}`,
          Type: 'Public',
        },
      });
    });

    this.privateSubnets = config.privateSubnetCidrs.map((cidr, index) => {
      return new subnet.Subnet(this, `private-subnet-${index}`, {
        vpcId: this.vpc.id,
        cidrBlock: cidr,
        availabilityZone: config.availabilityZones[index],
        tags: {
          ...config.tags,
          Name: `${config.projectName}-private-subnet-${index + 1}`,
          Type: 'Private',
        },
      });
    });

    this.dbSubnets = config.dbSubnetCidrs.map((cidr, index) => {
      return new subnet.Subnet(this, `db-subnet-${index}`, {
        vpcId: this.vpc.id,
        cidrBlock: cidr,
        availabilityZone: config.availabilityZones[index],
        tags: {
          ...config.tags,
          Name: `${config.projectName}-db-subnet-${index + 1}`,
          Type: 'Database',
        },
      });
    });

    // Create only 1 NAT Gateway in first AZ for cost optimization
    const natEip = new eip.Eip(this, 'nat-eip-0', {
      domain: 'vpc',
      tags: {
        ...config.tags,
        Name: `${config.projectName}-nat-eip`,
      },
    });

    const natGw = new natGateway.NatGateway(this, 'nat-gateway-0', {
      allocationId: natEip.id,
      subnetId: this.publicSubnets[0].id,
      tags: {
        ...config.tags,
        Name: `${config.projectName}-nat-gateway`,
      },
    });

    this.natGateways = [natGw]; // Single NAT gateway for all private subnets

    const publicRouteTable = new routeTable.RouteTable(this, 'public-rt', {
      vpcId: this.vpc.id,
      tags: {
        ...config.tags,
        Name: `${config.projectName}-public-rt`,
      },
    });

    new route.Route(this, 'public-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: this.internetGateway.id,
    });

    this.publicSubnets.forEach((subnet, index) => {
      new routeTableAssociation.RouteTableAssociation(
        this,
        `public-rt-association-${index}`,
        {
          subnetId: subnet.id,
          routeTableId: publicRouteTable.id,
        }
      );
    });

    this.privateSubnets.forEach((subnet, index) => {
      const privateRouteTable = new routeTable.RouteTable(
        this,
        `private-rt-${index}`,
        {
          vpcId: this.vpc.id,
          tags: {
            ...config.tags,
            Name: `${config.projectName}-private-rt-${index + 1}`,
          },
        }
      );

      new route.Route(this, `private-route-${index}`, {
        routeTableId: privateRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: natGw.id,
      });

      new routeTableAssociation.RouteTableAssociation(
        this,
        `private-rt-association-${index}`,
        {
          subnetId: subnet.id,
          routeTableId: privateRouteTable.id,
        }
      );
    });

    const dbRouteTable = new routeTable.RouteTable(this, 'db-rt', {
      vpcId: this.vpc.id,
      tags: {
        ...config.tags,
        Name: `${config.projectName}-db-rt`,
      },
    });

    this.dbSubnets.forEach((subnet, index) => {
      new routeTableAssociation.RouteTableAssociation(
        this,
        `db-rt-association-${index}`,
        {
          subnetId: subnet.id,
          routeTableId: dbRouteTable.id,
        }
      );
    });

    const flowLogGroup = new cloudwatchLogGroup.CloudwatchLogGroup(
      this,
      'vpc-flow-log-group',
      {
        name: `/aws/vpc/flowlogs/${config.projectName}`,
        retentionInDays: 30,
        tags: config.tags,
      }
    );

    const flowLogRole = new iamRole.IamRole(this, 'vpc-flow-log-role', {
      name: `${config.projectName}-${config.environment}-vpc-flow-log-role`,
      assumeRolePolicy: new dataAwsIamPolicyDocument.DataAwsIamPolicyDocument(
        this,
        'vpc-flow-log-assume-role-policy',
        {
          statement: [
            {
              actions: ['sts:AssumeRole'],
              principals: [
                {
                  type: 'Service',
                  identifiers: ['vpc-flow-logs.amazonaws.com'],
                },
              ],
            },
          ],
        }
      ).json,
      tags: config.tags,
    });

    new iamRolePolicy.IamRolePolicy(this, 'vpc-flow-log-policy', {
      name: `${config.projectName}-${config.environment}-vpc-flow-log-policy`,
      role: flowLogRole.id,
      policy: new dataAwsIamPolicyDocument.DataAwsIamPolicyDocument(
        this,
        'vpc-flow-log-policy-document',
        {
          statement: [
            {
              actions: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
                'logs:DescribeLogGroups',
                'logs:DescribeLogStreams',
              ],
              resources: ['*'],
            },
          ],
        }
      ).json,
    });

    new flowLog.FlowLog(this, 'vpc-flow-log', {
      iamRoleArn: flowLogRole.arn,
      logDestination: flowLogGroup.arn,
      vpcId: this.vpc.id,
      trafficType: 'ALL',
      tags: config.tags,
    });
  }
}
