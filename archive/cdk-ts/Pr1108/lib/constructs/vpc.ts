import { aws_ec2 as ec2 } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class AppVpc extends Construct {
  public readonly vpc: ec2.Vpc;
  constructor(scope: Construct, id: string, name: string) {
    super(scope, id);
    if (!name || typeof name !== 'string' || name.trim() === '') {
      throw new Error('VPC name is required for AppVpc');
    }
    this.vpc = new ec2.Vpc(this, 'Vpc', {
      vpcName: name,
      maxAzs: 2,
      natGateways: 0,
      subnetConfiguration: [
        {
          name: 'isolated-a',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
        {
          name: 'isolated-b',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
    });
  }
}
