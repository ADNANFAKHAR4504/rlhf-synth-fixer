import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';

export interface IamStackArgs {
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class IamStack extends pulumi.ComponentResource {
  public readonly instanceRole: pulumi.Output<string>;
  public readonly instanceProfile: pulumi.Output<string>;

  constructor(name: string, args: IamStackArgs, opts?: ResourceOptions) {
    super('tap:stack:IamStack', name, args, opts);

    const { environmentSuffix, tags } = args;

    // Create IAM role for EC2 to use Systems Manager Session Manager
    const ec2Role = new aws.iam.Role(
      `tap-ec2-role-${environmentSuffix}`,
      {
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
        tags: tags,
      },
      { parent: this }
    );

    // Attach the Systems Manager managed policy for Session Manager
    new aws.iam.RolePolicyAttachment(
      `tap-ssm-policy-${environmentSuffix}`,
      {
        role: ec2Role.name,
        policyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
      },
      { parent: this }
    );

    // Create instance profile for the EC2 role
    const instanceProfile = new aws.iam.InstanceProfile(
      `tap-instance-profile-${environmentSuffix}`,
      {
        role: ec2Role.name,
        tags: tags,
      },
      { parent: this }
    );

    this.instanceRole = ec2Role.arn;
    this.instanceProfile = instanceProfile.name;

    this.registerOutputs({
      instanceRole: this.instanceRole,
      instanceProfile: this.instanceProfile,
    });
  }
}
