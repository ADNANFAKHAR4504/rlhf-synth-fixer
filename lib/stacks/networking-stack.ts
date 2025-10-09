import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

interface NetworkingStackProps {
  cidr: string;
  isMainRegion: boolean;
  environmentSuffix: string;
}

export class NetworkingStack extends Construct {
  public readonly vpc: ec2.Vpc;
  public readonly transitGateway: ec2.CfnTransitGateway;
  public readonly transitGatewayAttachment: ec2.CfnTransitGatewayAttachment;

  constructor(scope: Construct, id: string, props: NetworkingStackProps) {
    super(scope, id);

    const stack = cdk.Stack.of(this);

    // Create VPC with public, private, and isolated subnets
    this.vpc = new ec2.Vpc(this, `VPC${props.environmentSuffix}`, {
      ipAddresses: ec2.IpAddresses.cidr(props.cidr),
      maxAzs: 3,
      subnetConfiguration: [
        {
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
        {
          name: 'Isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
    });

    // Create Transit Gateway
    this.transitGateway = new ec2.CfnTransitGateway(
      this,
      `TransitGateway${props.environmentSuffix}`,
      {
        amazonSideAsn: props.isMainRegion ? 64512 : 64513,
        autoAcceptSharedAttachments: 'enable',
        defaultRouteTableAssociation: 'enable',
        defaultRouteTablePropagation: 'enable',
        description: `Transit Gateway for ${stack.region}`,
        tags: [
          {
            key: 'Name',
            value: `TradingPlatform-TGW-${stack.region}${props.environmentSuffix}`,
          },
        ],
      }
    );

    // Attach VPC to Transit Gateway
    const privateSubnetIds = this.vpc.privateSubnets.map(
      subnet => subnet.subnetId
    );

    this.transitGatewayAttachment = new ec2.CfnTransitGatewayAttachment(
      this,
      `TGWAttachment${props.environmentSuffix}`,
      {
        transitGatewayId: this.transitGateway.ref,
        vpcId: this.vpc.vpcId,
        subnetIds: privateSubnetIds,
        tags: [
          {
            key: 'Name',
            value: `TradingPlatform-TGW-Attachment-${stack.region}${props.environmentSuffix}`,
          },
        ],
      }
    );

    // Add routes from private subnets to Transit Gateway for cross-region communication
    this.vpc.privateSubnets.forEach((subnet, index) => {
      new ec2.CfnRoute(this, `TGWRoute${index}${props.environmentSuffix}`, {
        routeTableId: subnet.routeTable.routeTableId,
        destinationCidrBlock: props.isMainRegion
          ? '172.16.0.0/16'
          : '10.0.0.0/16',
        transitGatewayId: this.transitGateway.ref,
      });
    });
  }
}
