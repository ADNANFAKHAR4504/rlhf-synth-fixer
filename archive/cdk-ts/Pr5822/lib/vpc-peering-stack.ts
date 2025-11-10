import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export interface VPCPeeringStackProps extends cdk.StackProps {
  environment: string;
}

export class VPCPeeringStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: VPCPeeringStackProps) {
    super(scope, id, props);

    // Import VPC IDs
    const primaryVpcId = cdk.Fn.importValue(
      `VPCId-us-east-1-${props.environment}`
    );
    const secondaryVpcId = cdk.Fn.importValue(
      `VPCId-us-west-2-${props.environment}`
    );

    // Create VPC Peering Connection
    const peeringConnection = new ec2.CfnVPCPeeringConnection(
      this,
      'CrossRegionPeering',
      {
        vpcId: primaryVpcId,
        peerVpcId: secondaryVpcId,
        peerRegion: 'us-west-2',
        tags: [
          {
            key: 'Name',
            value: 'DR-VPC-Peering',
          },
          {
            key: 'Environment',
            value: props.environment,
          },
        ],
      }
    );

    new cdk.CfnOutput(this, 'PeeringConnectionId', {
      value: peeringConnection.ref,
      exportName: `PeeringConnectionId-${props.environment}`,
    });
  }
}
