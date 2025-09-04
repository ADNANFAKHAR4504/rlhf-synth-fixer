import { aws_ec2 as ec2, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { AppVpc } from '../constructs/vpc';
import { name } from '../naming';

export interface VpcProps extends StackProps {
  dept: string;
  envName: string;
  purpose: string;
}

export class VpcStack extends Stack {
  public readonly vpc: ec2.Vpc;
  constructor(scope: Construct, id: string, props: VpcProps) {
    super(scope, id, props);
    if (!props || typeof props !== 'object') {
      throw new Error('Props are required for VpcStack');
    }
    if (
      !props.dept ||
      typeof props.dept !== 'string' ||
      props.dept.trim() === ''
    ) {
      throw new Error('dept is required for VpcStack');
    }
    if (
      !props.envName ||
      typeof props.envName !== 'string' ||
      props.envName.trim() === ''
    ) {
      throw new Error('envName is required for VpcStack');
    }
    if (
      !props.purpose ||
      typeof props.purpose !== 'string' ||
      props.purpose.trim() === ''
    ) {
      throw new Error('purpose is required for VpcStack');
    }
    this.vpc = new AppVpc(
      this,
      'Vpc',
      name(props.dept, props.envName, `${props.purpose}-vpc`)
    ).vpc;
  }
}
