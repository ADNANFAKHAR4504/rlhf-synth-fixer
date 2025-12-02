import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface Ec2StackArgs {
  environmentSuffix: string;
  vpcId: pulumi.Input<string>;
  privateSubnetIds: pulumi.Input<string[]>;
  tags?: { [key: string]: string };
}

export class Ec2Stack extends pulumi.ComponentResource {
  public readonly instances: aws.ec2.Instance[];
  public readonly securityGroup: aws.ec2.SecurityGroup;

  constructor(
    name: string,
    args: Ec2StackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:ec2:Ec2Stack', name, {}, opts);

    const { environmentSuffix, vpcId, privateSubnetIds, tags = {} } = args;

    // Create security group for EC2 instances
    this.securityGroup = new aws.ec2.SecurityGroup(
      `ec2-sg-${environmentSuffix}`,
      {
        vpcId: vpcId,
        description: 'Security group for compliance-monitored EC2 instances',
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],
        tags: {
          ...tags,
          Name: `ec2-sg-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Get latest Amazon Linux 2 AMI
    const ami = aws.ec2.getAmiOutput({
      mostRecent: true,
      owners: ['amazon'],
      filters: [
        {
          name: 'name',
          values: ['amzn2-ami-hvm-*-x86_64-gp2'],
        },
      ],
    });

    // Create IAM role for EC2 instances (for SSM)
    const ec2Role = new aws.iam.Role(
      `ec2-role-${environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Principal: {
                Service: 'ec2.amazonaws.com',
              },
              Effect: 'Allow',
            },
          ],
        }),
        tags: {
          ...tags,
          Name: `ec2-role-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Attach SSM managed policy
    new aws.iam.RolePolicyAttachment(
      `ec2-ssm-policy-${environmentSuffix}`,
      {
        role: ec2Role.name,
        policyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
      },
      { parent: this }
    );

    // Create instance profile
    const instanceProfile = new aws.iam.InstanceProfile(
      `ec2-profile-${environmentSuffix}`,
      {
        role: ec2Role.name,
        tags: {
          ...tags,
          Name: `ec2-profile-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create EC2 instances - create outside of apply() to avoid async issues
    this.instances = [];
    const subnetIdsOutput = pulumi.output(privateSubnetIds);

    for (let i = 0; i < 2; i++) {
      const instance = new aws.ec2.Instance(
        `instance-${i}-${environmentSuffix}`,
        {
          ami: ami.id,
          instanceType: 't3.micro',
          subnetId: subnetIdsOutput.apply(ids => ids[i % ids.length]),
          vpcSecurityGroupIds: [this.securityGroup.id],
          iamInstanceProfile: instanceProfile.name,
          tags: {
            ...tags,
            Name: `instance-${i}-${environmentSuffix}`,
            Environment: 'production',
            Owner: 'compliance-team',
            CostCenter: 'engineering',
          },
        },
        { parent: this }
      );
      this.instances.push(instance);
    }

    this.registerOutputs({
      instanceIds: pulumi.all(this.instances.map(i => i.id)),
      securityGroupId: this.securityGroup.id,
    });
  }
}
