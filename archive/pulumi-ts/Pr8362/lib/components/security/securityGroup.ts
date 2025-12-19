import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface SecurityGroupRuleConfig {
  type: 'ingress' | 'egress';
  fromPort: number;
  toPort: number;
  protocol: string;
  cidrBlocks?: string[];
  sourceSecurityGroupId?: pulumi.Input<string>;
  description?: string;
}

export interface SecurityGroupArgs {
  name: string;
  description: string;
  vpcId: pulumi.Input<string>;
  rules?: SecurityGroupRuleConfig[];
  tags?: Record<string, string>;
}

export interface SecurityGroupResult {
  securityGroup: aws.ec2.SecurityGroup;
  securityGroupId: pulumi.Output<string>;
  rules: aws.ec2.SecurityGroupRule[];
}

export interface WebSecurityGroupArgs {
  name: string;
  vpcId: pulumi.Input<string>;
  tags?: Record<string, string>;
}

export interface DatabaseSecurityGroupArgs {
  name: string;
  vpcId: pulumi.Input<string>;
  webSecurityGroupId: pulumi.Input<string>;
  databasePort?: number;
  tags?: Record<string, string>;
}

export interface ApplicationSecurityGroupArgs {
  name: string;
  vpcId: pulumi.Input<string>;
  albSecurityGroupId: pulumi.Input<string>;
  applicationPort?: number;
  tags?: Record<string, string>;
}

export class SecurityGroupComponent extends pulumi.ComponentResource {
  public readonly securityGroup: aws.ec2.SecurityGroup;
  public readonly securityGroupId: pulumi.Output<string>;
  public readonly rules: aws.ec2.SecurityGroupRule[];

  constructor(
    name: string,
    args: SecurityGroupArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('aws:security:SecurityGroupComponent', name, {}, opts);

    const defaultTags = {
      Name: args.name,
      Environment: pulumi.getStack(),
      ManagedBy: 'Pulumi',
      Project: 'AWS-Nova-Model-Breaking',
      ...args.tags,
    };

    this.securityGroup = new aws.ec2.SecurityGroup(
      `${name}-sg`,
      {
        name: args.name,
        description: args.description,
        vpcId: args.vpcId,
        tags: defaultTags,
      },
      { parent: this, provider: opts?.provider }
    );

    this.securityGroupId = this.securityGroup.id;
    this.rules = [];

    // Create security group rules
    if (args.rules) {
      args.rules.forEach((ruleConfig, index) => {
        const rule = new aws.ec2.SecurityGroupRule(
          `${name}-rule-${index}`,
          {
            type: ruleConfig.type,
            fromPort: ruleConfig.fromPort,
            toPort: ruleConfig.toPort,
            protocol: ruleConfig.protocol,
            cidrBlocks: ruleConfig.cidrBlocks,
            sourceSecurityGroupId: ruleConfig.sourceSecurityGroupId,
            securityGroupId: this.securityGroup.id,
            description:
              ruleConfig.description ||
              `${ruleConfig.type} rule for ${ruleConfig.protocol}:${ruleConfig.fromPort}-${ruleConfig.toPort}`,
          },
          { parent: this, provider: opts?.provider }
        );

        this.rules.push(rule);
      });
    }

    this.registerOutputs({
      securityGroup: this.securityGroup,
      securityGroupId: this.securityGroupId,
      rules: this.rules,
    });
  }
}

export class WebSecurityGroupComponent extends pulumi.ComponentResource {
  public readonly securityGroup: aws.ec2.SecurityGroup;
  public readonly securityGroupId: pulumi.Output<string>;
  public readonly rules: aws.ec2.SecurityGroupRule[];

  constructor(
    name: string,
    args: WebSecurityGroupArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('aws:security:WebSecurityGroupComponent', name, {}, opts);

    const securityGroupComponent = new SecurityGroupComponent(
      name,
      {
        name: args.name,
        description: 'Security group for web servers - HTTPS only',
        vpcId: args.vpcId,
        tags: args.tags,
        rules: [
          {
            type: 'ingress',
            fromPort: 443,
            toPort: 443,
            protocol: 'tcp',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'HTTPS inbound from internet',
          },
          {
            type: 'ingress',
            fromPort: 80,
            toPort: 80,
            protocol: 'tcp',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'HTTP inbound for redirect to HTTPS',
          },
          {
            type: 'egress',
            fromPort: 0,
            toPort: 65535,
            protocol: 'tcp',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'All outbound traffic',
          },
        ],
      },
      { parent: this, provider: opts?.provider }
    );

    this.securityGroup = securityGroupComponent.securityGroup;
    this.securityGroupId = securityGroupComponent.securityGroupId;
    this.rules = securityGroupComponent.rules;

    this.registerOutputs({
      securityGroup: this.securityGroup,
      securityGroupId: this.securityGroupId,
      rules: this.rules,
    });
  }
}

export class DatabaseSecurityGroupComponent extends pulumi.ComponentResource {
  public readonly securityGroup: aws.ec2.SecurityGroup;
  public readonly securityGroupId: pulumi.Output<string>;
  public readonly rules: aws.ec2.SecurityGroupRule[];

  constructor(
    name: string,
    args: DatabaseSecurityGroupArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('aws:security:DatabaseSecurityGroupComponent', name, {}, opts);

    const databasePort = args.databasePort || 3306;

    const securityGroupComponent = new SecurityGroupComponent(
      name,
      {
        name: args.name,
        description: 'Security group for database servers',
        vpcId: args.vpcId,
        tags: args.tags,
        rules: [
          {
            type: 'ingress',
            fromPort: databasePort,
            toPort: databasePort,
            protocol: 'tcp',
            sourceSecurityGroupId: args.webSecurityGroupId,
            description: `Database access from web security group on port ${databasePort}`,
          },
          {
            type: 'egress',
            fromPort: 443,
            toPort: 443,
            protocol: 'tcp',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'HTTPS outbound for updates and patches',
          },
        ],
      },
      { parent: this, provider: opts?.provider }
    );

    this.securityGroup = securityGroupComponent.securityGroup;
    this.securityGroupId = securityGroupComponent.securityGroupId;
    this.rules = securityGroupComponent.rules;

    this.registerOutputs({
      securityGroup: this.securityGroup,
      securityGroupId: this.securityGroupId,
      rules: this.rules,
    });
  }
}

export class ApplicationSecurityGroupComponent
  extends pulumi.ComponentResource
{
  public readonly securityGroup: aws.ec2.SecurityGroup;
  public readonly securityGroupId: pulumi.Output<string>;
  public readonly rules: aws.ec2.SecurityGroupRule[];

  constructor(
    name: string,
    args: ApplicationSecurityGroupArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('aws:security:ApplicationSecurityGroupComponent', name, {}, opts);

    const applicationPort = args.applicationPort || 8080;

    const securityGroupComponent = new SecurityGroupComponent(
      name,
      {
        name: args.name,
        description: 'Security group for application servers',
        vpcId: args.vpcId,
        tags: args.tags,
        rules: [
          {
            type: 'ingress',
            fromPort: applicationPort,
            toPort: applicationPort,
            protocol: 'tcp',
            sourceSecurityGroupId: args.albSecurityGroupId,
            description: `Application access from ALB security group on port ${applicationPort}`,
          },
          {
            type: 'ingress',
            fromPort: 22,
            toPort: 22,
            protocol: 'tcp',
            cidrBlocks: ['10.0.0.0/8'],
            description: 'SSH access from private networks only',
          },
          {
            type: 'egress',
            fromPort: 0,
            toPort: 65535,
            protocol: 'tcp',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'All outbound traffic',
          },
          {
            type: 'egress',
            fromPort: 0,
            toPort: 65535,
            protocol: 'udp',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'All outbound UDP traffic',
          },
        ],
      },
      { parent: this, provider: opts?.provider }
    );

    this.securityGroup = securityGroupComponent.securityGroup;
    this.securityGroupId = securityGroupComponent.securityGroupId;
    this.rules = securityGroupComponent.rules;

    this.registerOutputs({
      securityGroup: this.securityGroup,
      securityGroupId: this.securityGroupId,
      rules: this.rules,
    });
  }
}

export function createSecurityGroup(
  name: string,
  args: SecurityGroupArgs,
  opts?: pulumi.ComponentResourceOptions
): SecurityGroupResult {
  const securityGroupComponent = new SecurityGroupComponent(name, args, opts);
  return {
    securityGroup: securityGroupComponent.securityGroup,
    securityGroupId: securityGroupComponent.securityGroupId,
    rules: securityGroupComponent.rules,
  };
}

export function createWebSecurityGroup(
  name: string,
  args: WebSecurityGroupArgs,
  opts?: pulumi.ComponentResourceOptions
): SecurityGroupResult {
  const webSecurityGroupComponent = new WebSecurityGroupComponent(
    name,
    args,
    opts
  );
  return {
    securityGroup: webSecurityGroupComponent.securityGroup,
    securityGroupId: webSecurityGroupComponent.securityGroupId,
    rules: webSecurityGroupComponent.rules,
  };
}

export function createDatabaseSecurityGroup(
  name: string,
  args: DatabaseSecurityGroupArgs,
  opts?: pulumi.ComponentResourceOptions
): SecurityGroupResult {
  const databaseSecurityGroupComponent = new DatabaseSecurityGroupComponent(
    name,
    args,
    opts
  );
  return {
    securityGroup: databaseSecurityGroupComponent.securityGroup,
    securityGroupId: databaseSecurityGroupComponent.securityGroupId,
    rules: databaseSecurityGroupComponent.rules,
  };
}

export function createApplicationSecurityGroup(
  name: string,
  args: ApplicationSecurityGroupArgs,
  opts?: pulumi.ComponentResourceOptions
): SecurityGroupResult {
  const applicationSecurityGroupComponent =
    new ApplicationSecurityGroupComponent(name, args, opts);
  return {
    securityGroup: applicationSecurityGroupComponent.securityGroup,
    securityGroupId: applicationSecurityGroupComponent.securityGroupId,
    rules: applicationSecurityGroupComponent.rules,
  };
}
