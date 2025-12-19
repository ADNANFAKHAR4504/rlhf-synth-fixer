import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Detect if running in LocalStack
    const isLocalStack =
      process.env.AWS_ENDPOINT_URL?.includes('localhost') ||
      process.env.AWS_ENDPOINT_URL?.includes('4566');

    // Create VPC with specified CIDR block
    const vpc = new ec2.CfnVPC(this, `${environmentSuffix}-vpc`, {
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: [
        { key: 'Name', value: `${environmentSuffix}-vpc` },
        { key: 'Environment', value: environmentSuffix },
      ],
    });

    // Apply RemovalPolicy.DESTROY for LocalStack (easier cleanup)
    if (isLocalStack) {
      vpc.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);
    }

    // Create Internet Gateway
    const igw = new ec2.CfnInternetGateway(this, `${environmentSuffix}-igw`, {
      tags: [
        { key: 'Name', value: `${environmentSuffix}-igw` },
        { key: 'Environment', value: environmentSuffix },
      ],
    });

    // Attach Internet Gateway to VPC
    new ec2.CfnVPCGatewayAttachment(this, `${environmentSuffix}-igw-attach`, {
      vpcId: vpc.ref,
      internetGatewayId: igw.ref,
    });

    // Create public subnet with exact CIDR 10.0.1.0/24
    const publicSubnet = new ec2.CfnSubnet(
      this,
      `${environmentSuffix}-public-subnet`,
      {
        vpcId: vpc.ref,
        cidrBlock: '10.0.1.0/24',
        availabilityZone: cdk.Stack.of(this).availabilityZones[0],
        mapPublicIpOnLaunch: true,
        tags: [
          { key: 'Name', value: `${environmentSuffix}-public-subnet` },
          { key: 'Environment', value: environmentSuffix },
          { key: 'aws-cdk:subnet-type', value: 'Public' },
        ],
      }
    );

    // Create private subnet with exact CIDR 10.0.2.0/24
    const privateSubnet = new ec2.CfnSubnet(
      this,
      `${environmentSuffix}-private-subnet`,
      {
        vpcId: vpc.ref,
        cidrBlock: '10.0.2.0/24',
        availabilityZone: cdk.Stack.of(this).availabilityZones[0],
        mapPublicIpOnLaunch: false,
        tags: [
          { key: 'Name', value: `${environmentSuffix}-private-subnet` },
          { key: 'Environment', value: environmentSuffix },
          { key: 'aws-cdk:subnet-type', value: 'Isolated' },
        ],
      }
    );

    // Create route table for public subnet
    const publicRouteTable = new ec2.CfnRouteTable(
      this,
      `${environmentSuffix}-public-rt`,
      {
        vpcId: vpc.ref,
        tags: [
          { key: 'Name', value: `${environmentSuffix}-public-rt` },
          { key: 'Environment', value: environmentSuffix },
        ],
      }
    );

    // Create route table for private subnet
    const privateRouteTable = new ec2.CfnRouteTable(
      this,
      `${environmentSuffix}-private-rt`,
      {
        vpcId: vpc.ref,
        tags: [
          { key: 'Name', value: `${environmentSuffix}-private-rt` },
          { key: 'Environment', value: environmentSuffix },
        ],
      }
    );

    // Associate public subnet with public route table
    new ec2.CfnSubnetRouteTableAssociation(
      this,
      `${environmentSuffix}-public-rta`,
      {
        subnetId: publicSubnet.ref,
        routeTableId: publicRouteTable.ref,
      }
    );

    // Associate private subnet with private route table
    new ec2.CfnSubnetRouteTableAssociation(
      this,
      `${environmentSuffix}-private-rta`,
      {
        subnetId: privateSubnet.ref,
        routeTableId: privateRouteTable.ref,
      }
    );

    // Add route to Internet Gateway for public subnet
    new ec2.CfnRoute(this, `${environmentSuffix}-public-route`, {
      routeTableId: publicRouteTable.ref,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.ref,
    });

    // Output important information
    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.ref,
      description: 'VPC ID',
      exportName: `${environmentSuffix}-vpc-id`,
    });

    new cdk.CfnOutput(this, 'PublicSubnetId', {
      value: publicSubnet.ref,
      description: 'Public Subnet ID',
      exportName: `${environmentSuffix}-public-subnet-id`,
    });

    new cdk.CfnOutput(this, 'PrivateSubnetId', {
      value: privateSubnet.ref,
      description: 'Private Subnet ID',
      exportName: `${environmentSuffix}-private-subnet-id`,
    });

    new cdk.CfnOutput(this, 'PublicSubnetCidr', {
      value: '10.0.1.0/24',
      description: 'Public Subnet CIDR Block',
      exportName: `${environmentSuffix}-public-subnet-cidr`,
    });

    new cdk.CfnOutput(this, 'PrivateSubnetCidr', {
      value: '10.0.2.0/24',
      description: 'Private Subnet CIDR Block',
      exportName: `${environmentSuffix}-private-subnet-cidr`,
    });

    new cdk.CfnOutput(this, 'InternetGatewayId', {
      value: igw.ref,
      description: 'Internet Gateway ID',
      exportName: `${environmentSuffix}-igw-id`,
    });
  }
}
