import { Construct } from 'constructs';
import { VpcPeeringConnection } from '@cdktf/provider-aws/lib/vpc-peering-connection';
import { Route } from '@cdktf/provider-aws/lib/route';

export interface VpcPeeringConstructProps {
  vpcId: string;
  peerVpcId: string;
  peerAccountId: string;
  environment: string;
  sourceRouteTableIds?: string[];
  peerRouteTableIds?: string[];
  peerVpcCidrBlock?: string;
  sourceVpcCidrBlock?: string;
}

export class VpcPeeringConstruct extends Construct {
  public readonly peeringConnection: VpcPeeringConnection;

  constructor(scope: Construct, id: string, props: VpcPeeringConstructProps) {
    super(scope, id);

    const {
      vpcId,
      peerVpcId,
      peerAccountId,
      environment,
      sourceRouteTableIds = [],
      peerRouteTableIds = [],
      peerVpcCidrBlock,
      sourceVpcCidrBlock,
    } = props;

    // Create VPC Peering Connection
    this.peeringConnection = new VpcPeeringConnection(this, 'peering', {
      vpcId: vpcId,
      peerVpcId: peerVpcId,
      peerOwnerId: peerAccountId,
      autoAccept: false,
      tags: {
        Name: `vpc-peering-${environment}`,
        Environment: environment,
        Team: 'platform-engineering',
        CostCenter: 'infrastructure',
      },
    });

    // Add routes in source VPC to peer VPC
    if (peerVpcCidrBlock && sourceRouteTableIds.length > 0) {
      sourceRouteTableIds.forEach((routeTableId, index) => {
        new Route(this, `peering-route-src-${index}`, {
          routeTableId: routeTableId,
          destinationCidrBlock: peerVpcCidrBlock,
          vpcPeeringConnectionId: this.peeringConnection.id,
        });
      });
    }

    // Add routes in peer VPC to source VPC (if route table IDs provided)
    // Note: This would typically be done in the peer account's stack
    if (sourceVpcCidrBlock && peerRouteTableIds.length > 0) {
      peerRouteTableIds.forEach((routeTableId, index) => {
        new Route(this, `peering-route-dst-${index}`, {
          routeTableId: routeTableId,
          destinationCidrBlock: sourceVpcCidrBlock,
          vpcPeeringConnectionId: this.peeringConnection.id,
        });
      });
    }
  }
}
