import { Construct } from 'constructs';
import { Ec2TransitGateway } from '@cdktf/provider-aws/lib/ec2-transit-gateway';
import { Ec2TransitGatewayVpcAttachment } from '@cdktf/provider-aws/lib/ec2-transit-gateway-vpc-attachment';

interface TransitGatewayConstructProps {
  environmentSuffix: string;
  vpcId: string;
  subnetIds: string[];
}

export class TransitGatewayConstruct extends Construct {
  public readonly transitGatewayId: string;
  public readonly vpcAttachmentId: string;

  constructor(
    scope: Construct,
    id: string,
    props: TransitGatewayConstructProps
  ) {
    super(scope, id);

    const { environmentSuffix, vpcId, subnetIds } = props;

    // Create Transit Gateway
    const transitGateway = new Ec2TransitGateway(this, 'TransitGateway', {
      description: 'Transit Gateway for multi-region connectivity',
      amazonSideAsn: 64512,
      defaultRouteTableAssociation: 'enable',
      defaultRouteTablePropagation: 'enable',
      dnsSupport: 'enable',
      vpnEcmpSupport: 'enable',
      tags: {
        Name: `payment-tgw-${environmentSuffix}`,
        Environment: environmentSuffix,
        Project: 'PaymentProcessing',
        CostCenter: 'FinTech',
      },
    });

    this.transitGatewayId = transitGateway.id;

    // Attach VPC to Transit Gateway
    const vpcAttachment = new Ec2TransitGatewayVpcAttachment(
      this,
      'VPCAttachment',
      {
        transitGatewayId: transitGateway.id,
        vpcId: vpcId,
        subnetIds: subnetIds,
        dnsSupport: 'enable',
        ipv6Support: 'disable',
        tags: {
          Name: `payment-tgw-attachment-${environmentSuffix}`,
          Environment: environmentSuffix,
          Project: 'PaymentProcessing',
          CostCenter: 'FinTech',
        },
      }
    );

    this.vpcAttachmentId = vpcAttachment.id;
  }
}
