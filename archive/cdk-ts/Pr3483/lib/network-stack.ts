import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as vpclattice from 'aws-cdk-lib/aws-vpclattice';
import { Construct } from 'constructs';

interface NetworkStackProps {
  vpcCidr: string;
  environmentSuffix: string;
}

export class NetworkStack extends Construct {
  public readonly vpc: ec2.Vpc;
  public readonly serviceNetwork: vpclattice.CfnServiceNetwork;

  constructor(scope: Construct, id: string, props: NetworkStackProps) {
    super(scope, id);

    // VPC Configuration
    this.vpc = new ec2.Vpc(this, 'WikiVPC', {
      ipAddresses: ec2.IpAddresses.cidr(props.vpcCidr),
      maxAzs: 2,
      natGateways: 2,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 24,
          name: 'Database',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // VPC Lattice Service Network
    this.serviceNetwork = new vpclattice.CfnServiceNetwork(
      this,
      'WikiServiceNetwork',
      {
        name: `wiki-service-network-${props.environmentSuffix}`,
        authType: 'AWS_IAM',
        tags: [
          {
            key: 'Environment',
            value: props.environmentSuffix,
          },
        ],
      }
    );

    // Associate VPC with Service Network
    new vpclattice.CfnServiceNetworkVpcAssociation(this, 'VpcAssociation', {
      serviceNetworkIdentifier: this.serviceNetwork.attrArn,
      vpcIdentifier: this.vpc.vpcId,
      securityGroupIds: [
        new ec2.SecurityGroup(this, 'LatticeSecurityGroup', {
          vpc: this.vpc,
          description: 'Security group for VPC Lattice',
          allowAllOutbound: true,
        }).securityGroupId,
      ],
    });

    // Tags
    cdk.Tags.of(this.vpc).add('Name', `WikiVPC-${props.environmentSuffix}`);
    cdk.Tags.of(this.vpc).add('Environment', props.environmentSuffix);
  }
}
