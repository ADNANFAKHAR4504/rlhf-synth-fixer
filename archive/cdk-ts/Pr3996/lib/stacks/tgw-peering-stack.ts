import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

interface TgwPeeringStackProps {
  primaryTgwId: string;
  primaryRegion: string;
  secondaryTgwId: string;
  secondaryRegion: string;
  environmentSuffix: string;
}

export class TgwPeeringStack extends Construct {
  public readonly peeringAttachment: ec2.CfnTransitGatewayPeeringAttachment;

  constructor(scope: Construct, id: string, props: TgwPeeringStackProps) {
    super(scope, id);

    const stack = cdk.Stack.of(this);

    // Create Transit Gateway Peering Attachment (only in primary region)
    if (stack.region === props.primaryRegion) {
      this.peeringAttachment = new ec2.CfnTransitGatewayPeeringAttachment(
        this,
        `TGWPeering${props.environmentSuffix}`,
        {
          transitGatewayId: props.primaryTgwId,
          peerTransitGatewayId: props.secondaryTgwId,
          peerRegion: props.secondaryRegion,
          peerAccountId: stack.account,
          tags: [
            {
              key: 'Name',
              value: `TradingPlatform-TGW-Peering-${props.primaryRegion}-${props.secondaryRegion}${props.environmentSuffix}`,
            },
          ],
        }
      );

      // Output the peering attachment ID
      new cdk.CfnOutput(
        this,
        `TGWPeeringAttachmentId${props.environmentSuffix}`,
        {
          value: this.peeringAttachment.ref,
          exportName: `TGWPeeringAttachmentId${props.environmentSuffix}`,
          description: 'Transit Gateway Peering Attachment ID',
        }
      );
    }
  }
}
