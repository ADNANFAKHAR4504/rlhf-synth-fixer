import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

interface NetworkingStackProps {
  cidr: string;
  isMainRegion: boolean;
  environmentSuffix: string;
  remoteCidr?: string;
  peeringAttachmentId?: string;
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

    // Add routes for cross-region communication via Transit Gateway
    // Routes point to the remote VPC CIDR through the Transit Gateway
    if (props.remoteCidr) {
      // Add route to private subnets for remote region traffic
      this.vpc.privateSubnets.forEach((subnet, index) => {
        new ec2.CfnRoute(
          this,
          `TGWRoute-Private-${index}-${props.environmentSuffix}`,
          {
            routeTableId: subnet.routeTable.routeTableId,
            destinationCidrBlock: props.remoteCidr,
            transitGatewayId: this.transitGateway.ref,
          }
        );
      });

      // Add route to isolated subnets for remote region traffic
      this.vpc.isolatedSubnets.forEach((subnet, index) => {
        new ec2.CfnRoute(
          this,
          `TGWRoute-Isolated-${index}-${props.environmentSuffix}`,
          {
            routeTableId: subnet.routeTable.routeTableId,
            destinationCidrBlock: props.remoteCidr,
            transitGatewayId: this.transitGateway.ref,
          }
        );
      });
    }

    // Outputs for integration testing
    new cdk.CfnOutput(this, `VpcId${props.environmentSuffix}`, {
      value: this.vpc.vpcId,
      exportName: `VpcId-${stack.region}-${props.environmentSuffix}`,
      description: `VPC ID for ${stack.region}`,
    });

    new cdk.CfnOutput(this, `VpcCidr${props.environmentSuffix}`, {
      value: this.vpc.vpcCidrBlock,
      exportName: `VpcCidr-${stack.region}-${props.environmentSuffix}`,
      description: `VPC CIDR for ${stack.region}`,
    });

    new cdk.CfnOutput(this, `TransitGatewayId${props.environmentSuffix}`, {
      value: this.transitGateway.ref,
      exportName: `TransitGatewayId-${stack.region}-${props.environmentSuffix}`,
      description: `Transit Gateway ID for ${stack.region}`,
    });

    new cdk.CfnOutput(
      this,
      `TransitGatewayAttachmentId${props.environmentSuffix}`,
      {
        value: this.transitGatewayAttachment.ref,
        exportName: `TransitGatewayAttachmentId-${stack.region}-${props.environmentSuffix}`,
        description: `Transit Gateway Attachment ID for ${stack.region}`,
      }
    );

    new cdk.CfnOutput(this, `PublicSubnetIds${props.environmentSuffix}`, {
      value: cdk.Fn.join(
        ',',
        this.vpc.publicSubnets.map(s => s.subnetId)
      ),
      exportName: `PublicSubnetIds-${stack.region}-${props.environmentSuffix}`,
      description: `Public Subnet IDs for ${stack.region}`,
    });

    new cdk.CfnOutput(this, `PrivateSubnetIds${props.environmentSuffix}`, {
      value: cdk.Fn.join(
        ',',
        this.vpc.privateSubnets.map(s => s.subnetId)
      ),
      exportName: `PrivateSubnetIds-${stack.region}-${props.environmentSuffix}`,
      description: `Private Subnet IDs for ${stack.region}`,
    });

    new cdk.CfnOutput(this, `IsolatedSubnetIds${props.environmentSuffix}`, {
      value: cdk.Fn.join(
        ',',
        this.vpc.isolatedSubnets.map(s => s.subnetId)
      ),
      exportName: `IsolatedSubnetIds-${stack.region}-${props.environmentSuffix}`,
      description: `Isolated Subnet IDs for ${stack.region}`,
    });
  }
}
