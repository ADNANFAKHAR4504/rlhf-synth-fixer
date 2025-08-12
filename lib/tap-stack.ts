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
    const publicSubnet1 = new ec2.PublicSubnet(this, 'PublicSubnet1', {
      availabilityZone: 'us-east-1a',
      vpcId: vpc.vpcId,
      cidrBlock: '10.0.1.0/24',
      mapPublicIpOnLaunch: true,
    });

    // Create public subnet 2 in us-east-1b with CIDR 10.0.2.0/24
    const publicSubnet2 = new ec2.PublicSubnet(this, 'PublicSubnet2', {
      availabilityZone: 'us-east-1b',
      vpcId: vpc.vpcId,
      cidrBlock: '10.0.2.0/24',
      mapPublicIpOnLaunch: true,
    });

    // Configure route tables for public subnets
    publicSubnet1.addRoute('DefaultRoute', {
      routerId: internetGateway.ref,
      routerType: ec2.RouterType.GATEWAY,
      destinationCidrBlock: '0.0.0.0/0',
    });

    publicSubnet2.addRoute('DefaultRoute', {
      routerId: internetGateway.ref,
      routerType: ec2.RouterType.GATEWAY,
      destinationCidrBlock: '0.0.0.0/0',
    });

    // Add dependency on IGW attachment
    publicSubnet1.node.addDependency(igwAttachment);
    publicSubnet2.node.addDependency(igwAttachment);

    const publicSubnets = [publicSubnet1, publicSubnet2];

    // Add tags to VPC
    cdk.Tags.of(vpc).add('Name', `${environmentSuffix}-VPC-Main`);
    cdk.Tags.of(vpc).add('Environment', environmentSuffix);

    // Tag the public subnets with proper naming
    publicSubnets.forEach((subnet, index) => {
      cdk.Tags.of(subnet).add(
        'Name',
        `${environmentSuffix}-PublicSubnet-${index + 1}`
      );
      cdk.Tags.of(subnet).add('Environment', environmentSuffix);
    });

    // Create VPC endpoints for enhanced private connectivity (future VPC Lattice preparation)
    const s3VpcEndpoint = new ec2.GatewayVpcEndpoint(this, 'S3Endpoint', {
      service: ec2.GatewayVpcEndpointAwsService.S3,
      vpc: vpc,
      subnets: [
        {
          subnets: publicSubnets,
        },
      ],
    });

    cdk.Tags.of(s3VpcEndpoint).add(
      'Name',
      `${environmentSuffix}-S3-VPCEndpoint`
    );
    cdk.Tags.of(s3VpcEndpoint).add('Environment', environmentSuffix);

    // Create DynamoDB VPC endpoint for enhanced connectivity
    const dynamoDBVpcEndpoint = new ec2.GatewayVpcEndpoint(
      this,
      'DynamoDBEndpoint',
      {
        service: ec2.GatewayVpcEndpointAwsService.DYNAMODB,
        vpc: vpc,
        subnets: [
          {
            subnets: publicSubnets,
          },
        ],
      }
    );

    cdk.Tags.of(dynamoDBVpcEndpoint).add(
      'Name',
      `${environmentSuffix}-DynamoDB-VPCEndpoint`
    );
    cdk.Tags.of(dynamoDBVpcEndpoint).add('Environment', environmentSuffix);

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

    publicSubnets.forEach((subnet, index) => {
      new cdk.CfnOutput(this, `PublicSubnet${index + 1}Id`, {
        value: subnet.subnetId,
        description: `Public Subnet ${index + 1} ID`,
        exportName: `${environmentSuffix}-PublicSubnet-${index + 1}-ID`,
      });

      new cdk.CfnOutput(this, `PublicSubnet${index + 1}Az`, {
        value: subnet.availabilityZone,
        description: `Public Subnet ${index + 1} Availability Zone`,
        exportName: `${environmentSuffix}-PublicSubnet-${index + 1}-AZ`,
      });
    });

    new cdk.CfnOutput(this, 'InternetGatewayId', {
      value: internetGateway.ref,
      description: 'Internet Gateway ID',
      exportName: `${environmentSuffix}-IGW-ID`,
    });
  }
}
