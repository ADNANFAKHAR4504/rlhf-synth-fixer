import { Construct } from 'constructs';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { Route } from '@cdktf/provider-aws/lib/route';
import { DataAwsAvailabilityZones } from '@cdktf/provider-aws/lib/data-aws-availability-zones';
import { FlowLog } from '@cdktf/provider-aws/lib/flow-log';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicy } from '@cdktf/provider-aws/lib/iam-role-policy';

export interface VpcConstructProps {
  environmentName: string;
  cidrBase: number;
  environmentSuffix: string;
}

export class VpcConstruct extends Construct {
  public readonly vpcId: string;

  public readonly publicSubnetIds: string[];

  public readonly privateSubnetIds: string[];

  constructor(scope: Construct, id: string, props: VpcConstructProps) {
    super(scope, id);

    const azs = new DataAwsAvailabilityZones(this, 'azs', {
      state: 'available',
    });

    // VPC
    const vpc = new Vpc(this, 'vpc', {
      cidrBlock: `10.${props.cidrBase}.0.0/16`,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `vpc-${props.environmentName}-${props.environmentSuffix}`,
        Environment: props.environmentName,
        ManagedBy: 'cdktf',
      },
    });

    this.vpcId = vpc.id;

    // Internet Gateway
    const igw = new InternetGateway(this, 'igw', {
      vpcId: vpc.id,
      tags: {
        Name: `igw-${props.environmentName}-${props.environmentSuffix}`,
        Environment: props.environmentName,
      },
    });

    // Public Subnets - 3 AZs
    const publicSubnets: Subnet[] = [];
    for (let i = 0; i < 3; i++) {
      const subnet = new Subnet(this, `public-subnet-${i}`, {
        vpcId: vpc.id,
        cidrBlock: `10.${props.cidrBase}.${i}.0/24`,
        availabilityZone: `\${${azs.fqn}.names[${i}]}`,
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `public-subnet-${i}-${props.environmentName}-${props.environmentSuffix}`,
          Environment: props.environmentName,
          Type: 'public',
        },
      });
      publicSubnets.push(subnet);
    }

    // Private Subnets - 3 AZs
    const privateSubnets: Subnet[] = [];
    for (let i = 0; i < 3; i++) {
      const subnet = new Subnet(this, `private-subnet-${i}`, {
        vpcId: vpc.id,
        cidrBlock: `10.${props.cidrBase}.${i + 10}.0/24`,
        availabilityZone: `\${${azs.fqn}.names[${i}]}`,
        tags: {
          Name: `private-subnet-${i}-${props.environmentName}-${props.environmentSuffix}`,
          Environment: props.environmentName,
          Type: 'private',
        },
      });
      privateSubnets.push(subnet);
    }

    // NAT Gateways - one per AZ for high availability
    const natGateways: NatGateway[] = [];
    for (let i = 0; i < 3; i++) {
      const eip = new Eip(this, `nat-eip-${i}`, {
        domain: 'vpc',
        tags: {
          Name: `nat-eip-${i}-${props.environmentName}-${props.environmentSuffix}`,
          Environment: props.environmentName,
        },
      });

      const nat = new NatGateway(this, `nat-${i}`, {
        allocationId: eip.id,
        subnetId: publicSubnets[i].id,
        tags: {
          Name: `nat-${i}-${props.environmentName}-${props.environmentSuffix}`,
          Environment: props.environmentName,
        },
      });
      natGateways.push(nat);
    }

    // Public Route Table
    const publicRouteTable = new RouteTable(this, 'public-rt', {
      vpcId: vpc.id,
      tags: {
        Name: `public-rt-${props.environmentName}-${props.environmentSuffix}`,
        Environment: props.environmentName,
      },
    });

    new Route(this, 'public-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.id,
    });

    publicSubnets.forEach((subnet, i) => {
      new RouteTableAssociation(this, `public-rta-${i}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
      });
    });

    // Private Route Tables - one per AZ with NAT Gateway
    privateSubnets.forEach((subnet, i) => {
      const privateRouteTable = new RouteTable(this, `private-rt-${i}`, {
        vpcId: vpc.id,
        tags: {
          Name: `private-rt-${i}-${props.environmentName}-${props.environmentSuffix}`,
          Environment: props.environmentName,
        },
      });

      new Route(this, `private-route-${i}`, {
        routeTableId: privateRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: natGateways[i].id,
      });

      new RouteTableAssociation(this, `private-rta-${i}`, {
        subnetId: subnet.id,
        routeTableId: privateRouteTable.id,
      });
    });

    this.publicSubnetIds = publicSubnets.map(s => s.id);
    this.privateSubnetIds = privateSubnets.map(s => s.id);

    // VPC Flow Logs - CloudWatch Logs destination
    const flowLogGroup = new CloudwatchLogGroup(this, 'flow-log-group', {
      name: `/aws/vpc/flowlogs/${props.environmentName}-${props.environmentSuffix}`,
      retentionInDays: 7,
      tags: {
        Name: `vpc-flow-logs-${props.environmentName}-${props.environmentSuffix}`,
        Environment: props.environmentName,
      },
    });

    // IAM Role for VPC Flow Logs
    const flowLogRole = new IamRole(this, 'flow-log-role', {
      name: `vpc-flow-log-role-${props.environmentName}-${props.environmentSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Service: 'vpc-flow-logs.amazonaws.com',
            },
            Action: 'sts:AssumeRole',
          },
        ],
      }),
      tags: {
        Environment: props.environmentName,
      },
    });

    // IAM Policy for Flow Logs to write to CloudWatch
    new IamRolePolicy(this, 'flow-log-policy', {
      name: `vpc-flow-log-policy-${props.environmentName}-${props.environmentSuffix}`,
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

    // VPC Flow Log
    new FlowLog(this, 'flow-log', {
      vpcId: vpc.id,
      trafficType: 'ALL',
      logDestinationType: 'cloud-watch-logs',
      logDestination: flowLogGroup.arn,
      iamRoleArn: flowLogRole.arn,
      tags: {
        Name: `vpc-flow-log-${props.environmentName}-${props.environmentSuffix}`,
        Environment: props.environmentName,
      },
    });
  }
}
