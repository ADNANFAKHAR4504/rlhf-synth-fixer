import { Construct } from 'constructs';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { Route } from '@cdktf/provider-aws/lib/route';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { VpcEndpoint } from '@cdktf/provider-aws/lib/vpc-endpoint';

export interface VpcStackProps {
  environmentSuffix: string;
}

export class VpcStack extends Construct {
  public readonly vpc: Vpc;
  public readonly privateSubnets: Subnet[];
  public readonly lambdaSecurityGroup: SecurityGroup;

  constructor(scope: Construct, id: string, props: VpcStackProps) {
    super(scope, id);

    const { environmentSuffix } = props;

    // Create VPC
    this.vpc = new Vpc(this, 'vpc', {
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `payment-vpc-${environmentSuffix}`,
      },
    });

    // Create private subnets in two AZs
    const privateSubnet1 = new Subnet(this, 'private_subnet_1', {
      vpcId: this.vpc.id,
      cidrBlock: '10.0.1.0/24',
      availabilityZone: 'us-east-1a',
      tags: {
        Name: `payment-private-subnet-1-${environmentSuffix}`,
      },
    });

    const privateSubnet2 = new Subnet(this, 'private_subnet_2', {
      vpcId: this.vpc.id,
      cidrBlock: '10.0.2.0/24',
      availabilityZone: 'us-east-1b',
      tags: {
        Name: `payment-private-subnet-2-${environmentSuffix}`,
      },
    });

    this.privateSubnets = [privateSubnet1, privateSubnet2];

    // Create public subnet for NAT Gateway (if needed)
    const publicSubnet = new Subnet(this, 'public_subnet', {
      vpcId: this.vpc.id,
      cidrBlock: '10.0.100.0/24',
      availabilityZone: 'us-east-1a',
      mapPublicIpOnLaunch: true,
      tags: {
        Name: `payment-public-subnet-${environmentSuffix}`,
      },
    });

    // Create Internet Gateway
    const igw = new InternetGateway(this, 'igw', {
      vpcId: this.vpc.id,
      tags: {
        Name: `payment-igw-${environmentSuffix}`,
      },
    });

    // Create route table for public subnet
    const publicRouteTable = new RouteTable(this, 'public_route_table', {
      vpcId: this.vpc.id,
      tags: {
        Name: `payment-public-rt-${environmentSuffix}`,
      },
    });

    new Route(this, 'public_route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.id,
    });

    new RouteTableAssociation(this, 'public_rta', {
      subnetId: publicSubnet.id,
      routeTableId: publicRouteTable.id,
    });

    // Create route table for private subnets
    const privateRouteTable = new RouteTable(this, 'private_route_table', {
      vpcId: this.vpc.id,
      tags: {
        Name: `payment-private-rt-${environmentSuffix}`,
      },
    });

    // Associate private subnets with private route table
    this.privateSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(this, `private_rta_${index}`, {
        subnetId: subnet.id,
        routeTableId: privateRouteTable.id,
      });
    });

    // Create VPC Endpoints for AWS services (avoid NAT Gateway costs)
    new VpcEndpoint(this, 'dynamodb_endpoint', {
      vpcId: this.vpc.id,
      serviceName: 'com.amazonaws.us-east-1.dynamodb',
      vpcEndpointType: 'Gateway',
      routeTableIds: [publicRouteTable.id, privateRouteTable.id],
      tags: {
        Name: `payment-dynamodb-endpoint-${environmentSuffix}`,
      },
    });

    new VpcEndpoint(this, 's3_endpoint', {
      vpcId: this.vpc.id,
      serviceName: 'com.amazonaws.us-east-1.s3',
      vpcEndpointType: 'Gateway',
      routeTableIds: [publicRouteTable.id, privateRouteTable.id],
      tags: {
        Name: `payment-s3-endpoint-${environmentSuffix}`,
      },
    });

    // Security group for Lambda functions
    this.lambdaSecurityGroup = new SecurityGroup(this, 'lambda_sg', {
      vpcId: this.vpc.id,
      name: `lambda-sg-${environmentSuffix}`,
      description: 'Security group for Lambda functions',
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
          description: 'Allow all outbound traffic',
        },
      ],
      tags: {
        Name: `lambda-sg-${environmentSuffix}`,
      },
    });
  }
}
