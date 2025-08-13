import { aws_ec2 as ec2, Tags } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export interface WebVpcProps {
  stage: string;
}

export class WebVpc extends Construct {
  public readonly vpc: ec2.Vpc;

  constructor(scope: Construct, id: string, props: WebVpcProps) {
    super(scope, id);

    this.vpc = new ec2.Vpc(this, 'Vpc', {
      vpcName: `${props.stage}-${scope.node.tryGetContext('aws:region') || 'region'}-web-vpc`,
      maxAzs: 2,
      natGateways: 0,
      subnetConfiguration: [
        {
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
      ],
    });

    Tags.of(this.vpc).add('Stage', props.stage);
    Tags.of(this.vpc).add('Component', 'web-vpc');
  }
}
