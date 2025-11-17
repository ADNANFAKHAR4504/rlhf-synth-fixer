import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export interface VpcPeeringStackProps extends cdk.StackProps {
  environmentSuffix: string;
  sourceVpc: ec2.IVpc;
  targetVpc: ec2.IVpc;
  sourceVpcCidr: string;
  targetVpcCidr: string;
}

export class VpcPeeringStack extends cdk.Stack {
  public readonly peeringConnection: ec2.CfnVPCPeeringConnection;

  constructor(scope: Construct, id: string, props: VpcPeeringStackProps) {
    super(scope, id, props);

    const {
      environmentSuffix,
      sourceVpc,
      targetVpc,
      sourceVpcCidr,
      targetVpcCidr,
    } = props;

    // Create VPC Peering Connection
    this.peeringConnection = new ec2.CfnVPCPeeringConnection(
      this,
      `PeeringConnection-${environmentSuffix}`,
      {
        vpcId: sourceVpc.vpcId,
        peerVpcId: targetVpc.vpcId,
        tags: [
          {
            key: 'Name',
            value: `vpc-peering-${environmentSuffix}`,
          },
          {
            key: 'EnvironmentSuffix',
            value: environmentSuffix,
          },
        ],
      }
    );

    // Add routes in source VPC to target VPC
    sourceVpc.privateSubnets.forEach((subnet, index) => {
      new ec2.CfnRoute(this, `SourceRoute${index}-${environmentSuffix}`, {
        routeTableId: subnet.routeTable.routeTableId,
        destinationCidrBlock: targetVpcCidr,
        vpcPeeringConnectionId: this.peeringConnection.ref,
      });
    });

    // Add routes in target VPC to source VPC
    targetVpc.privateSubnets.forEach((subnet, index) => {
      new ec2.CfnRoute(this, `TargetRoute${index}-${environmentSuffix}`, {
        routeTableId: subnet.routeTable.routeTableId,
        destinationCidrBlock: sourceVpcCidr,
        vpcPeeringConnectionId: this.peeringConnection.ref,
      });
    });

    new cdk.CfnOutput(this, 'PeeringConnectionId', {
      value: this.peeringConnection.ref,
      description: 'VPC Peering Connection ID',
      exportName: `VpcPeeringId-${environmentSuffix}`,
    });
  }
}
