// lib/ec2-stack.ts

import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { Construct } from 'constructs';

interface Ec2StackProps {
  environmentSuffix?: string;
  vpcId?: string;
}

export class Ec2Stack extends Construct {
  constructor(scope: Construct, id: string, props?: Ec2StackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';

    // EC2 Role (example, add EC2 instance as needed)
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

    // You can add EC2 instance resource here if needed
  }
}
