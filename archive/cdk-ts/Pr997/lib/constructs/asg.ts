import { aws_autoscaling as autoscaling, aws_ec2 as ec2 } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export interface WebAsgProps {
  vpc: ec2.IVpc;
  launchTemplate: ec2.ILaunchTemplate;
}

export class WebAsg extends Construct {
  public readonly asg: autoscaling.AutoScalingGroup;

  constructor(scope: Construct, id: string, props: WebAsgProps) {
    super(scope, id);

    this.asg = new autoscaling.AutoScalingGroup(this, 'Asg', {
      vpc: props.vpc,
      minCapacity: 2,
      maxCapacity: 5,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      launchTemplate: props.launchTemplate,
    });
  }
}
