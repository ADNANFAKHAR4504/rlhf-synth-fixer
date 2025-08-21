import * as ec2 from 'aws-cdk-lib/aws-ec2';

export interface EnvironmentConfig {
  name: string;
  vpcCidr: string;
  instanceType: ec2.InstanceType;
  publicSubnetCidrs: string[];
  privateSubnetCidrs: string[];
}
