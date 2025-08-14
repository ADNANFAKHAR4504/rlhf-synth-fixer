import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export interface TapStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class TapStack extends cdk.Stack {
  private getCidrRanges(environmentSuffix: string) {
    // Generate unique CIDR ranges based on environment to avoid conflicts
    let baseCidr = '10.0.0.0/16';
    let subnet1Cidr = '10.0.1.0/24';
    let subnet2Cidr = '10.0.2.0/24';

    if (environmentSuffix === 'staging') {
      baseCidr = '10.1.0.0/16';
      subnet1Cidr = '10.1.1.0/24';
      subnet2Cidr = '10.1.2.0/24';
    } else if (environmentSuffix === 'prod') {
      baseCidr = '10.2.0.0/16';
      subnet1Cidr = '10.2.1.0/24';
      subnet2Cidr = '10.2.2.0/24';
    }

    return {
      vpcCidr: baseCidr,
      subnet1Cidr,
      subnet2Cidr,
    };
  }

  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const { environmentSuffix } = props;
    const cidrRanges = this.getCidrRanges(environmentSuffix);

    // Create VPC with specified CIDR block
    const vpc = new ec2.Vpc(this, 'VPC', {
      ipAddresses: ec2.IpAddresses.cidr(cidrRanges.vpcCidr),
      availabilityZones: ['us-east-1a', 'us-east-1b'],
      subnetConfiguration: [], // We'll create subnets manually with specific CIDRs
      enableDnsHostnames: true,
      enableDnsSupport: true,
      natGateways: 0, // No NAT gateways for public-only setup
    });

    // Create Internet Gateway and attach to VPC
    const internetGateway = new ec2.CfnInternetGateway(
      this,
      'InternetGateway',
      {
        tags: [
          {
            key: 'Name',
            value: `${environmentSuffix}-IGW-Main`,
          },
          {
            key: 'Environment',
            value: environmentSuffix,
          },
        ],
      }
    );

    const igwAttachment = new ec2.CfnVPCGatewayAttachment(
      this,
      'IGWAttachment',
      {
        vpcId: vpc.vpcId,
        internetGatewayId: internetGateway.ref,
      }
    );

    // Create public subnet 1 in us-east-1a with explicit CfnSubnet construct
    const publicSubnet1 = new ec2.CfnSubnet(this, 'PublicSubnet1', {
      availabilityZone: 'us-east-1a',
      vpcId: vpc.vpcId,
      cidrBlock: cidrRanges.subnet1Cidr,
      mapPublicIpOnLaunch: true,
      tags: [
        {
          key: 'Name',
          value: `${environmentSuffix}-PublicSubnet-1`,
        },
        {
          key: 'Environment',
          value: environmentSuffix,
        },
      ],
    });

    // Create public subnet 2 in us-east-1b with explicit CfnSubnet construct
    const publicSubnet2 = new ec2.CfnSubnet(this, 'PublicSubnet2', {
      availabilityZone: 'us-east-1b',
      vpcId: vpc.vpcId,
      cidrBlock: cidrRanges.subnet2Cidr,
      mapPublicIpOnLaunch: true,
      tags: [
        {
          key: 'Name',
          value: `${environmentSuffix}-PublicSubnet-2`,
        },
        {
          key: 'Environment',
          value: environmentSuffix,
        },
      ],
    });

    // Create route table for public subnets
    const publicRouteTable = new ec2.CfnRouteTable(this, 'PublicRouteTable', {
      vpcId: vpc.vpcId,
      tags: [
        {
          key: 'Name',
          value: `${environmentSuffix}-PublicRouteTable`,
        },
        {
          key: 'Environment',
          value: environmentSuffix,
        },
      ],
    });

    // Add default route to internet gateway
    const defaultRoute = new ec2.CfnRoute(this, 'DefaultRoute', {
      routeTableId: publicRouteTable.ref,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: internetGateway.ref,
    });

    // Associate route table with subnet 1
    const routeTableAssociation1 = new ec2.CfnSubnetRouteTableAssociation(
      this,
      'RouteTableAssociation1',
      {
        subnetId: publicSubnet1.ref,
        routeTableId: publicRouteTable.ref,
      }
    );

    // Associate route table with subnet 2
    const routeTableAssociation2 = new ec2.CfnSubnetRouteTableAssociation(
      this,
      'RouteTableAssociation2',
      {
        subnetId: publicSubnet2.ref,
        routeTableId: publicRouteTable.ref,
      }
    );

    // Add explicit dependencies for better resource management
    defaultRoute.addDependency(igwAttachment);
    routeTableAssociation1.addDependency(publicRouteTable);
    routeTableAssociation2.addDependency(publicRouteTable);

    // Add tags to VPC
    cdk.Tags.of(vpc).add('Name', `${environmentSuffix}-VPC-Main`);
    cdk.Tags.of(vpc).add('Environment', environmentSuffix);

    // Create VPC endpoints for enhanced private connectivity (future VPC Lattice preparation)
    const s3VpcEndpoint = new ec2.CfnVPCEndpoint(this, 'S3Endpoint', {
      serviceName: 'com.amazonaws.us-east-1.s3',
      vpcId: vpc.vpcId,
      vpcEndpointType: 'Gateway',
      routeTableIds: [publicRouteTable.ref],
      tags: [
        {
          key: 'Name',
          value: `${environmentSuffix}-S3-VPCEndpoint`,
        },
        {
          key: 'Environment',
          value: environmentSuffix,
        },
      ],
    });

    // Create DynamoDB VPC endpoint for enhanced connectivity
    const dynamoDBVpcEndpoint = new ec2.CfnVPCEndpoint(
      this,
      'DynamoDBEndpoint',
      {
        serviceName: 'com.amazonaws.us-east-1.dynamodb',
        vpcId: vpc.vpcId,
        vpcEndpointType: 'Gateway',
        routeTableIds: [publicRouteTable.ref],
        tags: [
          {
            key: 'Name',
            value: `${environmentSuffix}-DynamoDB-VPCEndpoint`,
          },
          {
            key: 'Environment',
            value: environmentSuffix,
          },
        ],
      }
    );

    // Add dependencies for VPC endpoints
    s3VpcEndpoint.addDependency(publicRouteTable);
    dynamoDBVpcEndpoint.addDependency(publicRouteTable);

    // Output important resources
    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID',
      exportName: `${environmentSuffix}-VPC-ID`,
    });

    new cdk.CfnOutput(this, 'VpcCidr', {
      value: vpc.vpcCidrBlock,
      description: 'VPC CIDR Block',
      exportName: `${environmentSuffix}-VPC-CIDR`,
    });

    // Output subnet information
    new cdk.CfnOutput(this, 'PublicSubnet1Id', {
      value: publicSubnet1.ref,
      description: 'Public Subnet 1 ID',
      exportName: `${environmentSuffix}-PublicSubnet-1-ID`,
    });

    new cdk.CfnOutput(this, 'PublicSubnet1Az', {
      value: publicSubnet1.availabilityZone!,
      description: 'Public Subnet 1 Availability Zone',
      exportName: `${environmentSuffix}-PublicSubnet-1-AZ`,
    });

    new cdk.CfnOutput(this, 'PublicSubnet2Id', {
      value: publicSubnet2.ref,
      description: 'Public Subnet 2 ID',
      exportName: `${environmentSuffix}-PublicSubnet-2-ID`,
    });

    new cdk.CfnOutput(this, 'PublicSubnet2Az', {
      value: publicSubnet2.availabilityZone!,
      description: 'Public Subnet 2 Availability Zone',
      exportName: `${environmentSuffix}-PublicSubnet-2-AZ`,
    });

    new cdk.CfnOutput(this, 'InternetGatewayId', {
      value: internetGateway.ref,
      description: 'Internet Gateway ID',
      exportName: `${environmentSuffix}-IGW-ID`,
    });

    // Add VPC endpoint outputs
    new cdk.CfnOutput(this, 'S3VpcEndpointId', {
      value: s3VpcEndpoint.ref,
      description: 'S3 VPC Endpoint ID',
      exportName: `${environmentSuffix}-S3-VPCEndpoint-ID`,
    });

    new cdk.CfnOutput(this, 'DynamoDBVpcEndpointId', {
      value: dynamoDBVpcEndpoint.ref,
      description: 'DynamoDB VPC Endpoint ID',
      exportName: `${environmentSuffix}-DynamoDB-VPCEndpoint-ID`,
    });
  }
}
