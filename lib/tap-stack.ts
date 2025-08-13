import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export interface TapStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const { environmentSuffix } = props;

    // Create VPC with specified CIDR block
    const vpc = new ec2.Vpc(this, 'VPC', {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
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

    // Create public subnet 1 in us-east-1a with CIDR 10.0.1.0/24
    const publicSubnet1 = new ec2.CfnSubnet(this, 'PublicSubnet1', {
      availabilityZone: 'us-east-1a',
      vpcId: vpc.vpcId,
      cidrBlock: '10.0.1.0/24',
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

    // Create public subnet 2 in us-east-1b with CIDR 10.0.2.0/24
    const publicSubnet2 = new ec2.CfnSubnet(this, 'PublicSubnet2', {
      availabilityZone: 'us-east-1b',
      vpcId: vpc.vpcId,
      cidrBlock: '10.0.2.0/24',
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

    // Add dependencies
    defaultRoute.addDependsOn(igwAttachment);
    routeTableAssociation1.addDependsOn(publicSubnet1);
    routeTableAssociation2.addDependsOn(publicSubnet2);

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

    [publicSubnet1, publicSubnet2].forEach((subnet, index) => {
      new cdk.CfnOutput(this, `PublicSubnet${index + 1}Id`, {
        value: subnet.ref,
        description: `Public Subnet ${index + 1} ID`,
        exportName: `${environmentSuffix}-PublicSubnet-${index + 1}-ID`,
      });

      new cdk.CfnOutput(this, `PublicSubnet${index + 1}Az`, {
        value: subnet.availabilityZone!,
        description: `Public Subnet ${index + 1} Availability Zone`,
        exportName: `${environmentSuffix}-PublicSubnet-${index + 1}-AZ`,
      });
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
