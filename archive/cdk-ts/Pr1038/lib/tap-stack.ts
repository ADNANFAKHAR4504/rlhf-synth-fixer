import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as vpclattice from 'aws-cdk-lib/aws-vpclattice';
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

    // Create VPC with specified CIDR block
    const vpc = new ec2.Vpc(this, 'MainVpc', {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 2,
      subnetConfiguration: [
        {
          name: 'PublicSubnet',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
      createInternetGateway: true,
    });

    // Create a VPC Lattice Service Network for future application connectivity
    const serviceNetwork = new vpclattice.CfnServiceNetwork(
      this,
      'ServiceNetwork',
      {
        name: `service-network-${environmentSuffix}`,
        authType: 'AWS_IAM',
      }
    );

    // Associate VPC with the service network for future use
    new vpclattice.CfnServiceNetworkVpcAssociation(
      this,
      'ServiceNetworkVpcAssociation',
      {
        serviceNetworkIdentifier: serviceNetwork.attrId,
        vpcIdentifier: vpc.vpcId,
      }
    );

    // Create VPC Endpoints for S3 and DynamoDB (cost optimization)
    const s3GatewayEndpoint = vpc.addGatewayEndpoint('S3GatewayEndpoint', {
      service: ec2.GatewayVpcEndpointAwsService.S3,
      subnets: [{ subnetType: ec2.SubnetType.PUBLIC }],
    });

    const dynamoGatewayEndpoint = vpc.addGatewayEndpoint(
      'DynamoGatewayEndpoint',
      {
        service: ec2.GatewayVpcEndpointAwsService.DYNAMODB,
        subnets: [{ subnetType: ec2.SubnetType.PUBLIC }],
      }
    );

    // Output important information
    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID for the main VPC',
    });

    new cdk.CfnOutput(this, 'VpcCidr', {
      value: vpc.vpcCidrBlock,
      description: 'CIDR block for the VPC',
    });

    new cdk.CfnOutput(this, 'PublicSubnetIds', {
      value: vpc.publicSubnets.map(subnet => subnet.subnetId).join(','),
      description: 'Public subnet IDs',
    });

    new cdk.CfnOutput(this, 'AvailabilityZones', {
      value: vpc.availabilityZones.join(','),
      description: 'Availability zones used',
    });

    new cdk.CfnOutput(this, 'InternetGatewayId', {
      value: vpc.internetGatewayId!,
      description: 'Internet Gateway ID',
    });

    new cdk.CfnOutput(this, 'ServiceNetworkId', {
      value: serviceNetwork.attrId,
      description:
        'VPC Lattice Service Network ID for future application connectivity',
    });

    new cdk.CfnOutput(this, 'S3EndpointId', {
      value: s3GatewayEndpoint.vpcEndpointId,
      description: 'S3 Gateway Endpoint ID for cost-optimized S3 access',
    });

    new cdk.CfnOutput(this, 'DynamoEndpointId', {
      value: dynamoGatewayEndpoint.vpcEndpointId,
      description:
        'DynamoDB Gateway Endpoint ID for cost-optimized DynamoDB access',
    });
  }
}
