import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export interface VpcPeeringStackProps extends cdk.StackProps {
  environmentSuffix: string;
  primaryVpcId: string;
  secondaryVpcId: string;
  primaryRegion: string;
  secondaryRegion: string;
  primaryVpcCidr: string;
  secondaryVpcCidr: string;
}

export class VpcPeeringStack extends cdk.Stack {
  public readonly peeringConnection: ec2.CfnVPCPeeringConnection;

  constructor(scope: Construct, id: string, props: VpcPeeringStackProps) {
    super(scope, id, props);

    this.peeringConnection = new ec2.CfnVPCPeeringConnection(
      this,
      `VpcPeering-${props.environmentSuffix}`,
      {
        vpcId: props.primaryVpcId,
        peerVpcId: props.secondaryVpcId,
        peerRegion: props.secondaryRegion,
      }
    );

    new cdk.CfnOutput(this, 'PeeringConnectionId', {
      value: this.peeringConnection.ref,
      description: 'VPC Peering Connection ID',
      exportName: `peering-connection-${props.environmentSuffix}`,
    });
  }
}
