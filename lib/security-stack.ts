import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export interface SecurityStackArgs {
  vpcId: pulumi.Input<string>;
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class SecurityStack extends pulumi.ComponentResource {
  public readonly webSecurityGroup: aws.ec2.SecurityGroup;
  public readonly albSecurityGroup: aws.ec2.SecurityGroup;
  public readonly dbSecurityGroup: aws.ec2.SecurityGroup;

  constructor(
    name: string,
    args: SecurityStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('webapp:security:SecurityStack', name, args, opts);

    // ALB Security Group
    this.albSecurityGroup = new aws.ec2.SecurityGroup(
      `${name}-alb-sg`,
      {
        vpcId: args.vpcId,
        description: 'Security group for Application Load Balancer',
        ingress: [
          {
            description: 'HTTP',
            fromPort: 80,
            toPort: 80,
            protocol: 'tcp',
            cidrBlocks: ['0.0.0.0/0'],
          },
          {
            description: 'HTTPS',
            fromPort: 443,
            toPort: 443,
            protocol: 'tcp',
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],
        egress: [
          {
            fromPort: 0,
            toPort: 0,
            protocol: '-1',
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],
        tags: {
          ...args.tags,
          Name: `${name}-alb-sg-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Web Server Security Group
    this.webSecurityGroup = new aws.ec2.SecurityGroup(
      `${name}-web-sg`,
      {
        vpcId: args.vpcId,
        description: 'Security group for web servers',
        ingress: [
          {
            description: 'HTTP from ALB',
            fromPort: 80,
            toPort: 80,
            protocol: 'tcp',
            securityGroups: [this.albSecurityGroup.id],
          },
          {
            description: 'SSH',
            fromPort: 22,
            toPort: 22,
            protocol: 'tcp',
            cidrBlocks: ['10.0.0.0/16'], // Only from VPC
          },
        ],
        egress: [
          {
            fromPort: 0,
            toPort: 0,
            protocol: '-1',
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],
        tags: {
          ...args.tags,
          Name: `${name}-web-sg-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Database Security Group
    this.dbSecurityGroup = new aws.ec2.SecurityGroup(
      `${name}-db-sg`,
      {
        vpcId: args.vpcId,
        description: 'Security group for database',
        ingress: [
          {
            description: 'PostgreSQL',
            fromPort: 5432,
            toPort: 5432,
            protocol: 'tcp',
            securityGroups: [this.webSecurityGroup.id],
          },
        ],
        egress: [
          {
            fromPort: 0,
            toPort: 0,
            protocol: '-1',
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],
        tags: {
          ...args.tags,
          Name: `${name}-db-sg-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    this.registerOutputs({
      webSecurityGroupId: this.webSecurityGroup.id,
      albSecurityGroupId: this.albSecurityGroup.id,
      dbSecurityGroupId: this.dbSecurityGroup.id,
    });
  }
}
