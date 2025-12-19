import * as cdk from 'aws-cdk-lib';
import { NestedStack, NestedStackProps } from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

interface NetworkingStackProps extends NestedStackProps {
  environmentSuffix?: string;
}

export class NetworkingStack extends NestedStack {
  public readonly vpc: ec2.Vpc;

  constructor(scope: Construct, id: string, _props?: NetworkingStackProps) {
    super(scope, id, _props);

    // Create VPC with simplified configuration to avoid EIP limits
    this.vpc = new ec2.Vpc(this, 'TrainingVPC', {
      ipAddresses: ec2.IpAddresses.cidr('10.220.0.0/16'),
      maxAzs: 2,
      natGateways: 0, // Use 0 NAT gateways to avoid EIP limit
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED, // No NAT gateway needed
        },
      ],
    });

    // S3 VPC Endpoint
    this.vpc.addGatewayEndpoint('S3Endpoint', {
      service: ec2.GatewayVpcEndpointAwsService.S3,
      subnets: [{ subnetType: ec2.SubnetType.PRIVATE_ISOLATED }],
    });

    // SageMaker VPC Endpoints
    this.vpc.addInterfaceEndpoint('SageMakerAPIEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.SAGEMAKER_API,
      subnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
    });

    this.vpc.addInterfaceEndpoint('SageMakerRuntimeEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.SAGEMAKER_RUNTIME,
      subnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
    });

    // ECR VPC Endpoints
    this.vpc.addInterfaceEndpoint('ECREndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.ECR,
      subnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
    });

    this.vpc.addInterfaceEndpoint('ECRDockerEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.ECR_DOCKER,
      subnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
    });

    // Outputs
    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      description: 'VPC ID',
    });

    new cdk.CfnOutput(this, 'PrivateSubnetIds', {
      value: this.vpc.isolatedSubnets.map(subnet => subnet.subnetId).join(','),
      description: 'Private subnet IDs',
    });
  }
}
