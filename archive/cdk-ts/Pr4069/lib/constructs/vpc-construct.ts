import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import { IVpcConfig } from '../config/environment-config';

export interface VpcConstructProps {
  environment: string;
  config: IVpcConfig;
}

export class VpcConstruct extends Construct {
  public readonly vpc: ec2.Vpc;
  public readonly vpcPeering?: ec2.CfnVPCPeeringConnection;

  constructor(scope: Construct, id: string, props: VpcConstructProps) {
    super(scope, id);

    this.vpc = new ec2.Vpc(this, 'VPC', {
      maxAzs: props.config.maxAzs,
      natGateways: 1,
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
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    if (props.config.enableVpcPeering && props.config.peeringVpcId) {
      this.vpcPeering = new ec2.CfnVPCPeeringConnection(this, 'VPCPeering', {
        vpcId: this.vpc.vpcId,
        peerVpcId: props.config.peeringVpcId,
        peerRegion: props.config.peeringRegion,
      });

      cdk.Tags.of(this.vpcPeering).add(
        'Name',
        `${props.environment}-vpc-peering`
      );
    }

    cdk.Tags.of(this.vpc).add('Name', `${props.environment}-vpc`);
  }
}
