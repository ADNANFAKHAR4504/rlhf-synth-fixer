/**
 * security-group-stack.ts
 *
 * This module defines the Security Group stack for EC2 network security.
 * Creates a restrictive security group allowing only HTTP/HTTPS from specific IP range.
 */
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';

export interface SecurityGroupStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
  vpcId: pulumi.Input<string>;
  allowedCidr: string;
}

export interface SecurityGroupStackOutputs {
  securityGroupId: pulumi.Output<string>;
  securityGroupArn: pulumi.Output<string>;
}

export class SecurityGroupStack extends pulumi.ComponentResource {
  public readonly securityGroupId: pulumi.Output<string>;
  public readonly securityGroupArn: pulumi.Output<string>;

  constructor(
    name: string,
    args: SecurityGroupStackArgs,
    opts?: ResourceOptions
  ) {
    super('tap:security:SecurityGroupStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // Create security group with restrictive rules
    const webServerSecurityGroup = new aws.ec2.SecurityGroup(
      `tap-web-server-sg-${environmentSuffix}`,
      {
        name: `tap-web-server-sg-${environmentSuffix}`,
        description: `Security group for TAP web server - ${environmentSuffix} environment`,
        vpcId: args.vpcId,

        // Ingress rules - only allow HTTP and HTTPS from specific IP range
        ingress: [
          {
            description: 'HTTP access from restricted IP range',
            fromPort: 80,
            toPort: 80,
            protocol: 'tcp',
            cidrBlocks: [args.allowedCidr],
          },
          {
            description: 'HTTPS access from restricted IP range',
            fromPort: 443,
            toPort: 443,
            protocol: 'tcp',
            cidrBlocks: [args.allowedCidr],
          },
        ],

        // Egress rules - allow all outbound traffic (common practice for updates, etc.)
        egress: [
          {
            description: 'All outbound traffic',
            fromPort: 0,
            toPort: 0,
            protocol: '-1',
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],

        tags: {
          Name: `tap-web-server-sg-${environmentSuffix}`,
          Purpose: 'WebServerSecurity',
          AllowedCIDR: args.allowedCidr,
          ...tags,
        },
      },
      { parent: this }
    );

    this.securityGroupId = webServerSecurityGroup.id;
    this.securityGroupArn = webServerSecurityGroup.arn;

    this.registerOutputs({
      securityGroupId: this.securityGroupId,
      securityGroupArn: this.securityGroupArn,
    });
  }
}
