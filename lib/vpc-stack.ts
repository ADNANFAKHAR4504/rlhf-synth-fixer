// lib/vpc-stack.ts

import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { TerraformStack } from 'cdktf';
import { Construct } from 'constructs';

interface VpcStackProps {
  environmentSuffix?: string;
}

export class VpcStack extends TerraformStack {
  public readonly vpcId: string;
  public readonly subnetIds: string[];

  constructor(scope: Construct, id: string, props?: VpcStackProps) {
    super(scope, id);

    new AwsProvider(this, 'aws', {
      region: 'us-east-1', // or pass region from props
    });

    const environmentSuffix = props?.environmentSuffix || 'dev';

    // VPC
    const vpc = new Vpc(this, 'prodVpc', {
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `prod-vpc-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    this.vpcId = vpc.id;

    // Private Subnets
    const privateSubnet1 = new Subnet(this, 'prodPrivateSubnet1', {
      vpcId: vpc.id,
      cidrBlock: '10.0.1.0/24',
      availabilityZone: 'us-east-1a',
      tags: {
        Name: `prod-private-subnet-1-${environmentSuffix}`,
        Environment: environmentSuffix,
        Type: 'private',
      },
    });

    const privateSubnet2 = new Subnet(this, 'prodPrivateSubnet2', {
      vpcId: vpc.id,
      cidrBlock: '10.0.2.0/24',
      availabilityZone: 'us-east-1b',
      tags: {
        Name: `prod-private-subnet-2-${environmentSuffix}`,
        Environment: environmentSuffix,
        Type: 'private',
      },
    });

    this.subnetIds = [privateSubnet1.id, privateSubnet2.id];
  }
}
