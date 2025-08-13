// lib/ec2-stack.ts

import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { TerraformStack } from 'cdktf';
import { Construct } from 'constructs';

interface Ec2StackProps {
  environmentSuffix?: string;
  vpcId: string;
}

export class Ec2Stack extends TerraformStack {
  constructor(scope: Construct, id: string, props: Ec2StackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';

    // AWS Provider
    new AwsProvider(this, 'aws', {
      region: 'us-east-1', // or use a region from props
    });

    // EC2 Role
    new IamRole(this, 'prodEc2Role', {
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'ec2.amazonaws.com',
            },
          },
        ],
      }),
      tags: {
        Name: `prod-ec2-role-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // EC2 Instance
  }
}
