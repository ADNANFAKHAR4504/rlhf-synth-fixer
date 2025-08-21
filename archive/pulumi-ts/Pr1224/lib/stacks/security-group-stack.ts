/**
 * security-group-stack.ts
 *
 * This module defines the SecurityGroupStack component for creating
 * security groups with minimal and necessary access rules.
 */
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';

export interface SecurityGroupStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
  vpcId: pulumi.Input<string>;
}

export class SecurityGroupStack extends pulumi.ComponentResource {
  public readonly webSecurityGroupId: pulumi.Output<string>;
  public readonly appSecurityGroupId: pulumi.Output<string>;
  public readonly dbSecurityGroupId: pulumi.Output<string>;

  constructor(
    name: string,
    args: SecurityGroupStackArgs,
    opts?: ResourceOptions
  ) {
    super('tap:security:SecurityGroupStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // Web tier security group
    const webSecurityGroup = new aws.ec2.SecurityGroup(
      `tap-web-sg-${environmentSuffix}`,
      {
        name: `tap-web-sg-${environmentSuffix}`,
        description: 'Security group for web tier',
        vpcId: args.vpcId,
        ingress: [
          {
            fromPort: 443,
            toPort: 443,
            protocol: 'tcp',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'HTTPS from anywhere',
          },
          {
            fromPort: 80,
            toPort: 80,
            protocol: 'tcp',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'HTTP from anywhere',
          },
        ],
        egress: [
          {
            fromPort: 443,
            toPort: 443,
            protocol: 'tcp',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'HTTPS outbound for updates and API calls',
          },
          {
            fromPort: 80,
            toPort: 80,
            protocol: 'tcp',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'HTTP outbound for package updates',
          },
          {
            fromPort: 53,
            toPort: 53,
            protocol: 'udp',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'DNS resolution',
          },
        ],
        tags: {
          Name: `tap-web-sg-${environmentSuffix}`,
          Tier: 'web',
          ...tags,
        },
      },
      { parent: this }
    );

    // Application tier security group
    const appSecurityGroup = new aws.ec2.SecurityGroup(
      `tap-app-sg-${environmentSuffix}`,
      {
        name: `tap-app-sg-${environmentSuffix}`,
        description: 'Security group for application tier',
        vpcId: args.vpcId,
        ingress: [
          {
            fromPort: 8080,
            toPort: 8080,
            protocol: 'tcp',
            securityGroups: [webSecurityGroup.id],
            description: 'App port from web tier',
          },
        ],
        egress: [
          {
            fromPort: 443,
            toPort: 443,
            protocol: 'tcp',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'HTTPS outbound for updates',
          },
          {
            fromPort: 53,
            toPort: 53,
            protocol: 'udp',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'DNS resolution',
          },
        ],
        tags: {
          Name: `tap-app-sg-${environmentSuffix}`,
          Tier: 'application',
          ...tags,
        },
      },
      { parent: this }
    );

    // Database tier security group
    const dbSecurityGroup = new aws.ec2.SecurityGroup(
      `tap-db-sg-${environmentSuffix}`,
      {
        name: `tap-db-sg-${environmentSuffix}`,
        description: 'Security group for database tier',
        vpcId: args.vpcId,
        ingress: [
          {
            fromPort: 3306,
            toPort: 3306,
            protocol: 'tcp',
            securityGroups: [appSecurityGroup.id],
            description: 'MySQL from app tier',
          },
        ],
        egress: [
          {
            fromPort: 443,
            toPort: 443,
            protocol: 'tcp',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'HTTPS outbound for security updates only',
          },
          {
            fromPort: 53,
            toPort: 53,
            protocol: 'udp',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'DNS resolution',
          },
        ],
        tags: {
          Name: `tap-db-sg-${environmentSuffix}`,
          Tier: 'database',
          ...tags,
        },
      },
      { parent: this }
    );

    this.webSecurityGroupId = webSecurityGroup.id;
    this.appSecurityGroupId = appSecurityGroup.id;
    this.dbSecurityGroupId = dbSecurityGroup.id;

    this.registerOutputs({
      webSecurityGroupId: this.webSecurityGroupId,
      appSecurityGroupId: this.appSecurityGroupId,
      dbSecurityGroupId: this.dbSecurityGroupId,
    });
  }
}
