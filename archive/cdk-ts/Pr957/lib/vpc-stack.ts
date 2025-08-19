import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as vpclattice from 'aws-cdk-lib/aws-vpclattice';
import { Construct } from 'constructs';

interface VpcStackProps {
  environmentSuffix?: string;
}

export class VpcStack extends Construct {
  public readonly vpc: ec2.Vpc;
  public readonly serviceNetwork: vpclattice.CfnServiceNetwork;

  constructor(scope: Construct, id: string, props?: VpcStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';

    // Create VPC with CIDR block 10.0.0.0/16
    this.vpc = new ec2.Vpc(this, `NetworkVpc${environmentSuffix}`, {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 2,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: `PublicSubnet${environmentSuffix}`,
          subnetType: ec2.SubnetType.PUBLIC,
        },
      ],
      gatewayEndpoints: {
        S3: {
          service: ec2.GatewayVpcEndpointAwsService.S3,
        },
      },
    });

    // Create VPC Lattice Service Network for future service-to-service connectivity
    this.serviceNetwork = new vpclattice.CfnServiceNetwork(
      this,
      `ServiceNetwork${environmentSuffix}`,
      {
        name: `service-network-${environmentSuffix}`,
        authType: 'NONE',
      }
    );

    // Associate VPC with VPC Lattice Service Network
    new vpclattice.CfnServiceNetworkVpcAssociation(
      this,
      `ServiceNetworkVpcAssociation${environmentSuffix}`,
      {
        serviceNetworkIdentifier: this.serviceNetwork.attrId,
        vpcIdentifier: this.vpc.vpcId,
      }
    );

    // Create VPC Endpoints for AWS services (PrivateLink)
    const s3VpcEndpoint = new ec2.InterfaceVpcEndpoint(
      this,
      `S3VpcEndpoint${environmentSuffix}`,
      {
        vpc: this.vpc,
        service: ec2.InterfaceVpcEndpointAwsService.S3,
        subnets: {
          subnetType: ec2.SubnetType.PUBLIC,
        },
        privateDnsEnabled: true,
      }
    );

    const ec2VpcEndpoint = new ec2.InterfaceVpcEndpoint(
      this,
      `Ec2VpcEndpoint${environmentSuffix}`,
      {
        vpc: this.vpc,
        service: ec2.InterfaceVpcEndpointAwsService.EC2,
        subnets: {
          subnetType: ec2.SubnetType.PUBLIC,
        },
        privateDnsEnabled: true,
      }
    );

    // Add tags to resources
    cdk.Tags.of(this.vpc).add('Name', `NetworkVpc${environmentSuffix}`);
    cdk.Tags.of(this.serviceNetwork).add(
      'Name',
      `ServiceNetwork${environmentSuffix}`
    );
    cdk.Tags.of(s3VpcEndpoint).add('Name', `S3VpcEndpoint${environmentSuffix}`);
    cdk.Tags.of(ec2VpcEndpoint).add(
      'Name',
      `Ec2VpcEndpoint${environmentSuffix}`
    );

    // Output important values
    new cdk.CfnOutput(this, `VpcId${environmentSuffix}`, {
      value: this.vpc.vpcId,
      description: 'VPC ID',
      exportName: `VpcId${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, `PublicSubnetIds${environmentSuffix}`, {
      value: this.vpc.publicSubnets.map(subnet => subnet.subnetId).join(','),
      description: 'Public Subnet IDs',
      exportName: `PublicSubnetIds${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, `ServiceNetworkId${environmentSuffix}`, {
      value: this.serviceNetwork.attrId,
      description: 'VPC Lattice Service Network ID',
      exportName: `ServiceNetworkId${environmentSuffix}`,
    });
  }
}
