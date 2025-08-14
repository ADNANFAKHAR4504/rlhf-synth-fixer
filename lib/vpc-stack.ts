// lib/vpc-stack.ts

import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Construct } from 'constructs';

interface VpcStackProps {
  environmentSuffix?: string;
}

export class VpcStack extends Construct {
  public readonly vpcId: string;
  public readonly subnetIds: string[];

  constructor(scope: Construct, id: string, props?: VpcStackProps) {
    super(scope, id);

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

    const awsRegion = process.env.AWS_REGION || 'us-west-2';

    // Private Subnets
    const privateSubnet1 = new Subnet(this, 'prodPrivateSubnet1', {
      vpcId: vpc.id,
      cidrBlock: '10.0.1.0/24',
      availabilityZone: `${awsRegion}a`, // <-- Use region variable
      tags: {
        Name: `prod-private-subnet-1-${environmentSuffix}`,
        Environment: environmentSuffix,
        Type: 'private',
      },
    });

    const privateSubnet2 = new Subnet(this, 'prodPrivateSubnet2', {
      vpcId: vpc.id,
      cidrBlock: '10.0.2.0/24',
      availabilityZone: `${awsRegion}b`, // <-- Use region variable
      tags: {
        Name: `prod-private-subnet-2-${environmentSuffix}`,
        Environment: environmentSuffix,
        Type: 'private',
      },
    });

    this.subnetIds = [privateSubnet1.id, privateSubnet2.id];
  }
}
