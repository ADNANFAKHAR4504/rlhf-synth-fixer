import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface SecurityStackArgs {
  environmentSuffix: string;
  vpcId: pulumi.Input<string>;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class SecurityStack extends pulumi.ComponentResource {
  public readonly albSecurityGroup: aws.ec2.SecurityGroup;
  public readonly instanceSecurityGroup: aws.ec2.SecurityGroup;

  constructor(
    name: string,
    args: SecurityStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:security:SecurityStack', name, args, opts);

    // ALB Security Group
    this.albSecurityGroup = new aws.ec2.SecurityGroup(
      `alb-sg-${args.environmentSuffix}`,
      {
        vpcId: args.vpcId,
        description: 'Security group for Application Load Balancer',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 443,
            toPort: 443,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow HTTPS traffic from internet',
          },
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow HTTP traffic from internet',
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow all outbound traffic',
          },
        ],
        tags: {
          ...pulumi.output(args.tags).apply(t => t),
          Name: `alb-sg-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Instance Security Group
    this.instanceSecurityGroup = new aws.ec2.SecurityGroup(
      `instance-sg-${args.environmentSuffix}`,
      {
        vpcId: args.vpcId,
        description: 'Security group for EC2 instances',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 443,
            toPort: 443,
            securityGroups: [this.albSecurityGroup.id],
            description: 'Allow HTTPS traffic from ALB',
          },
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            securityGroups: [this.albSecurityGroup.id],
            description: 'Allow HTTP traffic from ALB for health checks',
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow all outbound traffic',
          },
        ],
        tags: {
          ...pulumi.output(args.tags).apply(t => t),
          Name: `instance-sg-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    this.registerOutputs({
      albSecurityGroupId: this.albSecurityGroup.id,
      instanceSecurityGroupId: this.instanceSecurityGroup.id,
    });
  }
}
