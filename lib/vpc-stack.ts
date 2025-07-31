import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { FlowLog } from '@cdktf/provider-aws/lib/flow-log';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicy } from '@cdktf/provider-aws/lib/iam-role-policy';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { TerraformStack } from 'cdktf';
import { Construct } from 'constructs';

export class VpcStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    new AwsProvider(this, 'aws', {
      region: 'us-east-1',
      defaultTags: [
        {
          tags: {
            Environment: 'Production',
          },
        },
      ],
    });

    const vpc = new Vpc(this, 'mainVpc', {
      cidrBlock: '10.0.0.0/16',
      tags: {
        Name: 'main-vpc',
        Environment: 'Production',
      },
    });

    // Create 2 public subnets across AZs
    const publicSubnets = Array.from({ length: 2 }).map(
      (_, index) =>
        new Subnet(this, `publicSubnet${index + 1}`, {
          vpcId: vpc.id,
          cidrBlock: `10.0.${index}.0/24`,
          availabilityZone: `us-east-1${String.fromCharCode(97 + index)}`, // a, b
          mapPublicIpOnLaunch: true,
          tags: {
            Name: `public-subnet-${index + 1}`,
            Environment: 'Production',
          },
        })
    );

    // Create 2 private subnets across AZs
    const privateSubnets = Array.from({ length: 2 }).map(
      (_, index) =>
        new Subnet(this, `privateSubnet${index + 1}`, {
          vpcId: vpc.id,
          cidrBlock: `10.0.${index + 2}.0/24`,
          availabilityZone: `us-east-1${String.fromCharCode(97 + index)}`, // a, b
          tags: {
            Name: `private-subnet-${index + 1}`,
            Environment: 'Production',
          },
        })
    );

    const igw = new InternetGateway(this, 'mainIgw', {
      vpcId: vpc.id,
      tags: {
        Name: 'main-igw',
        Environment: 'Production',
      },
    });

    const publicRouteTable = new RouteTable(this, 'publicRouteTable', {
      vpcId: vpc.id,
      route: [
        {
          cidrBlock: '0.0.0.0/0',
          gatewayId: igw.id,
        },
      ],
      tags: {
        Name: 'public-route-table',
        Environment: 'Production',
      },
    });

    publicSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(this, `publicRta${index + 1}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
      });
    });

    const eip = new Eip(this, 'natEip', {
      tags: {
        Name: 'nat-eip',
        Environment: 'Production',
      },
    });

    const natGateway = new NatGateway(this, 'natGateway', {
      subnetId: publicSubnets[0].id,
      allocationId: eip.id,
      tags: {
        Name: 'nat-gateway',
        Environment: 'Production',
      },
    });

    const privateRouteTable = new RouteTable(this, 'privateRouteTable', {
      vpcId: vpc.id,
      route: [
        {
          cidrBlock: '0.0.0.0/0',
          natGatewayId: natGateway.id,
        },
      ],
      tags: {
        Name: 'private-route-table',
        Environment: 'Production',
      },
    });

    privateSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(this, `privateRta${index + 1}`, {
        subnetId: subnet.id,
        routeTableId: privateRouteTable.id,
      });
    });

    const logGroup = new CloudwatchLogGroup(this, 'vpcFlowLogs', {
      name: '/aws/vpc/flow-logs',
      retentionInDays: 30,
      tags: {
        Name: 'vpc-flow-logs',
        Environment: 'Production',
      },
    });

    const iamRole = new IamRole(this, 'flowLogRole', {
      name: 'flow_log_role',
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
      tags: {
        Name: 'flow-log-role',
        Environment: 'Production',
      },
    });

    new IamRolePolicy(this, 'flowLogPolicy', {
      name: 'flow_log_policy',
      role: iamRole.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: [
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
              'logs:PutLogEvents',
              'logs:DescribeLogGroups',
              'logs:DescribeLogStreams',
            ],
            Effect: 'Allow',
            Resource: logGroup.arn,
          },
        ],
      }),
    });

    new FlowLog(this, 'vpcFlowLog', {
      iamRoleArn: iamRole.arn,
      logDestination: logGroup.arn,
      logDestinationType: 'cloud-watch-logs',
      trafficType: 'ALL',
      vpcId: vpc.id,
      tags: {
        Name: 'vpc-flow-log',
        Environment: 'Production',
      },
    });

    // ✅ Optional: Use privateSubnets somewhere to avoid lint error
    console.log(`Configured ${privateSubnets.length} private subnets`);
  }
}
