import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { getCommonTags, primaryRegion, secondaryRegion } from './config';
import { VpcStack } from './vpc';

export class SecurityGroupsStack extends pulumi.ComponentResource {
  public readonly primaryAlbSecurityGroup: aws.ec2.SecurityGroup;
  public readonly primaryAppSecurityGroup: aws.ec2.SecurityGroup;
  public readonly primaryDbSecurityGroup: aws.ec2.SecurityGroup;
  public readonly secondaryDbSecurityGroup: aws.ec2.SecurityGroup;

  constructor(
    name: string,
    args: {
      environment: string;
      tags: Record<string, string>;
      vpcStack: VpcStack;
    },
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:security:SecurityGroupsStack', name, {}, opts);

    const commonTags = { ...getCommonTags(args.environment), ...args.tags };

    const primaryProvider = new aws.Provider(
      `${args.environment}-primary-provider`,
      { region: primaryRegion },
      { parent: this }
    );
    const secondaryProvider = new aws.Provider(
      `${args.environment}-secondary-provider`,
      { region: secondaryRegion },
      { parent: this }
    );

    // Primary region security groups
    this.primaryAlbSecurityGroup = new aws.ec2.SecurityGroup(
      `${args.environment}-primary-alb-sg`,
      {
        name: `${args.environment}-primary-alb-security-group`,
        description: 'Security group for Application Load Balancer',
        vpcId: args.vpcStack.primaryVpc.id,
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
            description: 'Allow HTTP traffic for redirect to HTTPS',
          },
        ],
        egress: [
          {
            protocol: 'tcp',
            fromPort: 8080,
            toPort: 8080,
            cidrBlocks: ['10.0.0.0/16'],
            description: 'Allow traffic to application instances',
          },
          {
            protocol: 'tcp',
            fromPort: 443,
            toPort: 443,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow HTTPS outbound for health checks',
          },
        ],
        tags: {
          ...commonTags,
          Name: `${args.environment}-Primary-ALB-Security-Group`,
        },
      },
      { provider: primaryProvider, parent: this }
    );

    this.primaryAppSecurityGroup = new aws.ec2.SecurityGroup(
      `${args.environment}-primary-app-sg`,
      {
        name: `${args.environment}-primary-app-security-group`,
        description: 'Security group for application instances',
        vpcId: args.vpcStack.primaryVpc.id,
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 8080,
            toPort: 8080,
            securityGroups: [this.primaryAlbSecurityGroup.id],
            description: 'Allow traffic from ALB',
          },
        ],
        egress: [
          {
            protocol: 'tcp',
            fromPort: 3306,
            toPort: 3306,
            cidrBlocks: ['10.0.3.0/24', '10.0.4.0/24'],
            description: 'Allow MySQL traffic to RDS subnets only',
          },
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow HTTP outbound for package updates',
          },
          {
            protocol: 'tcp',
            fromPort: 443,
            toPort: 443,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow HTTPS outbound for package updates',
          },
          {
            protocol: 'tcp',
            fromPort: 53,
            toPort: 53,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow DNS queries',
          },
          {
            protocol: 'udp',
            fromPort: 53,
            toPort: 53,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow DNS queries',
          },
        ],
        tags: {
          ...commonTags,
          Name: `${args.environment}-Primary-App-Security-Group`,
        },
      },
      { provider: primaryProvider, parent: this }
    );

    this.primaryDbSecurityGroup = new aws.ec2.SecurityGroup(
      `${args.environment}-primary-db-sg`,
      {
        name: `${args.environment}-primary-db-security-group`,
        description: 'Security group for RDS database',
        vpcId: args.vpcStack.primaryVpc.id,
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 3306,
            toPort: 3306,
            securityGroups: [this.primaryAppSecurityGroup.id],
            description: 'Allow MySQL traffic from application instances',
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: -1,
            toPort: -1,
            cidrBlocks: [],
            description: 'Deny all outbound traffic by default',
          },
        ],
        tags: {
          ...commonTags,
          Name: `${args.environment}-Primary-DB-Security-Group`,
        },
      },
      { provider: primaryProvider, parent: this }
    );

    // Secondary region security group for RDS read replica
    this.secondaryDbSecurityGroup = new aws.ec2.SecurityGroup(
      `${args.environment}-secondary-db-sg`,
      {
        name: `${args.environment}-secondary-db-security-group`,
        description: 'Security group for RDS read replica',
        vpcId: args.vpcStack.secondaryVpc.id,
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 3306,
            toPort: 3306,
            cidrBlocks: ['10.1.0.0/16'],
            description: 'Allow MySQL traffic within VPC',
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: -1,
            toPort: -1,
            cidrBlocks: [],
            description: 'Deny all outbound traffic by default',
          },
        ],
        tags: {
          ...commonTags,
          Name: `${args.environment}-Secondary-DB-Security-Group`,
        },
      },
      { provider: secondaryProvider, parent: this }
    );

    this.registerOutputs({});
  }
}
