// lib/vpc-stack.ts

import { Eip } from '@cdktf/provider-aws/lib/eip';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Construct } from 'constructs';

interface VpcStackProps {
  environmentSuffix?: string;
}

export class VpcStack extends Construct {
  public readonly vpcId: string;
  public readonly subnetIds: string[];
  public readonly ec2SgId: string;
  public readonly lambdaSgId: string;
  public readonly rdsSgId: string;

  constructor(scope: Construct, id: string, props?: VpcStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';

    // VPC
    const vpc = new Vpc(this, 'prodVpc', {
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `prod-vpc-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    this.vpcId = vpc.id;

    const awsRegion = process.env.AWS_REGION || 'us-west-2';

    // Private Subnets
    const privateSubnet1 = new Subnet(this, 'prodPrivateSubnet1', {
      vpcId: vpc.id,
      cidrBlock: '10.0.1.0/24',
      availabilityZone: `${awsRegion}a`, // <-- Use region variable
      tags: {
        Name: `prod-private-subnet-1-${environmentSuffix}`,
        Environment: environmentSuffix,
        Type: 'private',
      },
    });

    const privateSubnet2 = new Subnet(this, 'prodPrivateSubnet2', {
      vpcId: vpc.id,
      cidrBlock: '10.0.2.0/24',
      availabilityZone: `${awsRegion}b`, // <-- Use region variable
      tags: {
        Name: `prod-private-subnet-2-${environmentSuffix}`,
        Environment: environmentSuffix,
        Type: 'private',
      },
    });

    this.subnetIds = [privateSubnet1.id, privateSubnet2.id];

    // IGW
    const igw = new InternetGateway(this, 'prodIgw', {
      vpcId: vpc.id,
      tags: { Name: `prod-igw-${environmentSuffix}` },
    });

    // EIP for NAT
    const natEip = new Eip(this, 'prodNatEip', {
      // No 'vpc' property needed
      tags: { Name: `prod-nat-eip-${environmentSuffix}` },
    });

    // NAT Gateway
    const natGw = new NatGateway(this, 'prodNatGw', {
      allocationId: natEip.id,
      subnetId: privateSubnet1.id, // Use a public subnet for NAT
      tags: { Name: `prod-natgw-${environmentSuffix}` },
    });

    // Route Tables
    const publicRt = new RouteTable(this, 'prodPublicRt', { vpcId: vpc.id });
    new Route(this, 'prodPublicRoute', {
      routeTableId: publicRt.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.id,
    });

    // Attach public route table to public subnet
    // ...add association...

    const privateRt = new RouteTable(this, 'prodPrivateRt', { vpcId: vpc.id });
    new Route(this, 'prodPrivateRoute', {
      routeTableId: privateRt.id,
      destinationCidrBlock: '0.0.0.0/0',
      natGatewayId: natGw.id,
    });

    // Attach private route table to private subnets
    // ...add association...

    // EC2 Security Group
    const ec2Sg = new SecurityGroup(this, 'prodEc2Sg', {
      vpcId: vpc.id,
      description: 'EC2 security group',
      ingress: [
        {
          fromPort: 22,
          toPort: 22,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'],
        }, // SSH example
      ],
      egress: [
        { fromPort: 0, toPort: 0, protocol: '-1', cidrBlocks: ['0.0.0.0/0'] },
      ],
      tags: {
        Name: `prod-ec2-sg-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });
    this.ec2SgId = ec2Sg.id;

    // Lambda Security Group
    const lambdaSg = new SecurityGroup(this, 'prodLambdaSg', {
      vpcId: vpc.id,
      description: 'Lambda security group',
      ingress: [
        // Restrict as needed
      ],
      egress: [
        { fromPort: 0, toPort: 0, protocol: '-1', cidrBlocks: ['0.0.0.0/0'] },
      ],
      tags: {
        Name: `prod-lambda-sg-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });
    this.lambdaSgId = lambdaSg.id;

    // RDS Security Group
    const rdsSg = new SecurityGroup(this, 'prodRdsSg', {
      vpcId: vpc.id,
      description: 'RDS security group',
      ingress: [
        // Allow only from Lambda/EC2 SGs
        {
          fromPort: 3306,
          toPort: 3306,
          protocol: 'tcp',
          securityGroups: [lambdaSg.id, ec2Sg.id],
        },
      ],
      egress: [
        { fromPort: 0, toPort: 0, protocol: '-1', cidrBlocks: ['0.0.0.0/0'] },
      ],
      tags: {
        Name: `prod-rds-sg-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });
    this.rdsSgId = rdsSg.id;
  }
}
