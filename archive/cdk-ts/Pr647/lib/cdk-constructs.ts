import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as vpclattice from 'aws-cdk-lib/aws-vpclattice';
import { Construct } from 'constructs';

interface CdkServiceNetworkProps {
  vpc: ec2.Vpc;
  environmentSuffix: string;
}

export class CdkServiceNetworkConstruct extends Construct {
  public readonly serviceNetwork: vpclattice.CfnServiceNetwork;

  constructor(scope: Construct, id: string, props: CdkServiceNetworkProps) {
    super(scope, id);

    // Create VPC Lattice Service Network for advanced service networking
    this.serviceNetwork = new vpclattice.CfnServiceNetwork(
      this,
      `cdk-service-network-${props.environmentSuffix}`,
      {
        name: `cdk-service-network-${props.environmentSuffix}`,
        authType: 'AWS_IAM',
      }
    );

    // Associate VPC with Service Network
    new vpclattice.CfnServiceNetworkVpcAssociation(
      this,
      `cdk-vpc-association-${props.environmentSuffix}`,
      {
        serviceNetworkIdentifier: this.serviceNetwork.attrId,
        vpcIdentifier: props.vpc.vpcId,
      }
    );

    // Add tags
    cdk.Tags.of(this.serviceNetwork).add(
      'Name',
      `cdk-service-network-${props.environmentSuffix}`
    );
    cdk.Tags.of(this.serviceNetwork).add(
      'Environment',
      props.environmentSuffix
    );
  }
}
