import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicy } from '@cdktf/provider-aws/lib/iam-role-policy';
import { Construct } from 'constructs';

interface IAMProps {
  environment: string;
  region: string;
  tags: { [key: string]: string };
}

export class IAM extends Construct {
  public readonly role: IamRole;

  constructor(scope: Construct, id: string, props: IAMProps) {
    super(scope, id);

    this.role = new IamRole(this, 'Role', {
      name: `${props.environment}-${props.region}-ec2-role`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { Service: 'ec2.amazonaws.com' },
            Action: 'sts:AssumeRole',
          },
        ],
      }),
      tags: {
        ...props.tags,
        Name: `${props.environment}-${props.region}-ec2-role`,
      },
    });

    new IamRolePolicy(this, 'Policy', {
      name: `${props.environment}-${props.region}-ec2-policy`,
      role: this.role.name,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['ec2:DescribeInstances'],
            Resource: '*',
          },
        ],
      }),
    });
  }
}
