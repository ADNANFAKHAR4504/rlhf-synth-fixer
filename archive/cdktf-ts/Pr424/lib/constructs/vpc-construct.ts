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
import { NetworkConfig } from '../config/environments';
import { NamingConvention } from '../utils/naming';

export interface VpcConstructProps {
  config: NetworkConfig;
  naming: NamingConvention;
}

export class VpcConstruct extends Construct {
  public vpc: vpc.Vpc;
  public publicSubnets: subnet.Subnet[];
  public privateSubnets: subnet.Subnet[];
  public databaseSubnets: subnet.Subnet[];
  public internetGateway: internetGateway.InternetGateway;
  public natGateways: natGateway.NatGateway[];

  constructor(scope: Construct, id: string, props: VpcConstructProps) {
    super(scope, id);

    const { config, naming } = props;

    // VPC
    this.vpc = new vpc.Vpc(this, 'vpc', {
      cidrBlock: config.vpcCidr,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: naming.tag({ Name: naming.resource('vpc', 'main') }),
    });

    // Internet Gateway
    this.internetGateway = new internetGateway.InternetGateway(this, 'igw', {
      vpcId: this.vpc.id,
      tags: naming.tag({ Name: naming.resource('igw', 'main') }),
    });

    // Public Subnets
    this.publicSubnets = config.subnets.public.map(
      (cidr, index) =>
        new subnet.Subnet(this, `public-subnet-${index}`, {
          vpcId: this.vpc.id,
          cidrBlock: cidr,
          availabilityZone: config.availabilityZones[index],
          mapPublicIpOnLaunch: true,
          tags: naming.tag({
            Name: naming.resource('subnet', `public-${index + 1}`),
            Type: 'Public',
          }),
        })
    );

    // Private Subnets
    this.privateSubnets = config.subnets.private.map(
      (cidr, index) =>
        new subnet.Subnet(this, `private-subnet-${index}`, {
          vpcId: this.vpc.id,
          cidrBlock: cidr,
          availabilityZone: config.availabilityZones[index],
          tags: naming.tag({
            Name: naming.resource('subnet', `private-${index + 1}`),
            Type: 'Private',
          }),
        })
    );

    // Database Subnets
    this.databaseSubnets = config.subnets.database.map(
      (cidr, index) =>
        new subnet.Subnet(this, `database-subnet-${index}`, {
          vpcId: this.vpc.id,
          cidrBlock: cidr,
          availabilityZone: config.availabilityZones[index],
          tags: naming.tag({
            Name: naming.resource('subnet', `database-${index + 1}`),
            Type: 'Database',
          }),
        })
    );

    // NAT Gateways
    this.natGateways = this.publicSubnets.map((subnet, index) => {
      const elasticIp = new eip.Eip(this, `nat-eip-${index}`, {
        domain: 'vpc',
        tags: naming.tag({ Name: naming.resource('eip', `nat-${index + 1}`) }),
      });

      return new natGateway.NatGateway(this, `nat-gateway-${index}`, {
        allocationId: elasticIp.id,
        subnetId: subnet.id,
        tags: naming.tag({
          Name: naming.resource('nat', `gateway-${index + 1}`),
        }),
      });
    });

    // Route Tables
    this.createRouteTables(naming);
    this.createVpcFlowLogs(naming);
  }

  private createRouteTables(naming: NamingConvention) {
    // Public Route Table
    const publicRouteTable = new routeTable.RouteTable(this, 'public-rt', {
      vpcId: this.vpc.id,
      tags: naming.tag({ Name: naming.resource('rt', 'public') }),
    });

    new route.Route(this, 'public-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: this.internetGateway.id,
    });

    this.publicSubnets.forEach((subnet, index) => {
      new routeTableAssociation.RouteTableAssociation(
        this,
        `public-rta-${index}`,
        {
          subnetId: subnet.id,
          routeTableId: publicRouteTable.id,
        }
      );
    });

    // Private Route Tables
    this.privateSubnets.forEach((subnet, index) => {
      const privateRouteTable = new routeTable.RouteTable(
        this,
        `private-rt-${index}`,
        {
          vpcId: this.vpc.id,
          tags: naming.tag({
            Name: naming.resource('rt', `private-${index + 1}`),
          }),
        }
      );

      new route.Route(this, `private-route-${index}`, {
        routeTableId: privateRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: this.natGateways[index].id,
      });

      new routeTableAssociation.RouteTableAssociation(
        this,
        `private-rta-${index}`,
        {
          subnetId: subnet.id,
          routeTableId: privateRouteTable.id,
        }
      );
    });

    // Database Route Table
    const databaseRouteTable = new routeTable.RouteTable(this, 'database-rt', {
      vpcId: this.vpc.id,
      tags: naming.tag({ Name: naming.resource('rt', 'database') }),
    });

    this.databaseSubnets.forEach((subnet, index) => {
      new routeTableAssociation.RouteTableAssociation(
        this,
        `database-rta-${index}`,
        {
          subnetId: subnet.id,
          routeTableId: databaseRouteTable.id,
        }
      );
    });
  }

  private createVpcFlowLogs(naming: NamingConvention) {
    // Create IAM role for VPC Flow Logs
    const flowLogAssumeRolePolicy =
      new dataAwsIamPolicyDocument.DataAwsIamPolicyDocument(
        this,
        'flow-log-assume-role-policy',
        {
          statement: [
            {
              actions: ['sts:AssumeRole'],
              effect: 'Allow',
              principals: [
                {
                  type: 'Service',
                  identifiers: ['vpc-flow-logs.amazonaws.com'],
                },
              ],
            },
          ],
        }
      );

    const flowLogRole = new iamRole.IamRole(this, 'flow-log-role', {
      name: naming.resource('role', 'vpc-flow-logs'),
      assumeRolePolicy: flowLogAssumeRolePolicy.json,
      tags: naming.tag({ Name: naming.resource('role', 'vpc-flow-logs') }),
    });

    const flowLogPolicy = new dataAwsIamPolicyDocument.DataAwsIamPolicyDocument(
      this,
      'flow-log-policy',
      {
        statement: [
          {
            effect: 'Allow',
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
    );

    new iamRolePolicy.IamRolePolicy(this, 'flow-log-role-policy', {
      name: naming.resource('policy', 'vpc-flow-logs'),
      role: flowLogRole.id,
      policy: flowLogPolicy.json,
    });

    const logGroup = new cloudwatchLogGroup.CloudwatchLogGroup(
      this,
      'vpc-flow-logs',
      {
        name: naming.resource('log-group', 'vpc-flow-logs'),
        retentionInDays: 14,
        tags: naming.tag(),
      }
    );

    new flowLog.FlowLog(this, 'vpc-flow-log', {
      vpcId: this.vpc.id,
      trafficType: 'ALL',
      logDestination: logGroup.arn,
      logDestinationType: 'cloud-watch-logs',
      iamRoleArn: flowLogRole.arn,
      tags: naming.tag({ Name: naming.resource('flow-log', 'vpc') }),
    });
  }
}
