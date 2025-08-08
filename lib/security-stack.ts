import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';
import { TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';

export interface SecurityStackOutputs {
  webSgId: string;
  appSgId: string;
  dbSgId: string;
}

interface SecurityStackProps {
  vpcId: string;
  vpcCidr: string;
  environmentSuffix?: string;
  projectName?: string;
}

export class SecurityStack extends Construct {
  public readonly outputs: SecurityStackOutputs;

  constructor(scope: Construct, id: string, props: SecurityStackProps) {
    super(scope, id);

    const environment = props.environmentSuffix || 'dev';
    const projectName = props.projectName || 'myproject';
    const { vpcId, vpcCidr } = props;

    const commonTags = {
      Environment: environment,
      Project: projectName,
      ManagedBy: 'Terraform',
    };

    // === Web SG
    const webSg = new SecurityGroup(this, 'web_sg', {
      vpcId: vpcId,
      tags: {
        ...commonTags,
        Name: `${projectName}-${environment}-web-sg`,
      },
      lifecycle: {
        createBeforeDestroy: true,
      },
    });

    new SecurityGroupRule(this, 'web_http', {
      type: 'ingress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: webSg.id,
    });

    new SecurityGroupRule(this, 'web_https', {
      type: 'ingress',
      fromPort: 443,
      toPort: 443,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: webSg.id,
    });

    // Web egress: Allow HTTPS to external services (e.g., package repos, APIs)
    new SecurityGroupRule(this, 'web_egress_https', {
      type: 'egress',
      fromPort: 443,
      toPort: 443,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: webSg.id,
    });

    // Web egress: Allow HTTP for package downloads and redirects
    new SecurityGroupRule(this, 'web_egress_http', {
      type: 'egress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: webSg.id,
    });

    // === App SG
    const appSg = new SecurityGroup(this, 'app_sg', {
      vpcId: vpcId,
      tags: {
        ...commonTags,
        Name: `${projectName}-${environment}-app-sg`,
      },
      lifecycle: {
        createBeforeDestroy: true,
      },
    });

    new SecurityGroupRule(this, 'app_http_from_web', {
      type: 'ingress',
      fromPort: 8080,
      toPort: 8080,
      protocol: 'tcp',
      sourceSecurityGroupId: webSg.id,
      securityGroupId: appSg.id,
    });

    new SecurityGroupRule(this, 'app_ssh', {
      type: 'ingress',
      fromPort: 22,
      toPort: 22,
      protocol: 'tcp',
      cidrBlocks: [vpcCidr],
      securityGroupId: appSg.id,
    });

    // App egress: Allow HTTPS for external API calls and package downloads
    new SecurityGroupRule(this, 'app_egress_https', {
      type: 'egress',
      fromPort: 443,
      toPort: 443,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: appSg.id,
    });

    // App egress: Allow HTTP for package repositories
    new SecurityGroupRule(this, 'app_egress_http', {
      type: 'egress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: appSg.id,
    });

    // === DB SG
    const dbSg = new SecurityGroup(this, 'db_sg', {
      vpcId: vpcId,
      tags: {
        ...commonTags,
        Name: `${projectName}-${environment}-db-sg`,
      },
      lifecycle: {
        createBeforeDestroy: true,
      },
    });

    new SecurityGroupRule(this, 'db_mysql_from_app', {
      type: 'ingress',
      fromPort: 3306,
      toPort: 3306,
      protocol: 'tcp',
      sourceSecurityGroupId: appSg.id,
      securityGroupId: dbSg.id,
    });

    new SecurityGroupRule(this, 'db_pgsql_from_app', {
      type: 'ingress',
      fromPort: 5432,
      toPort: 5432,
      protocol: 'tcp',
      sourceSecurityGroupId: appSg.id,
      securityGroupId: dbSg.id,
    });

    new SecurityGroupRule(this, 'db_egress', {
      type: 'egress',
      fromPort: 443,
      toPort: 443,
      protocol: 'tcp',
      cidrBlocks: [vpcCidr], // keep DB traffic inside VPC unless needed
      securityGroupId: dbSg.id,
    });

    // === Outputs for Terraform CLI
    new TerraformOutput(this, 'web_security_group_id', {
      value: webSg.id,
    });

    new TerraformOutput(this, 'app_security_group_id', {
      value: appSg.id,
    });

    new TerraformOutput(this, 'db_security_group_id', {
      value: dbSg.id,
    });

    // === Cross-Security-Group Rules (defined after all SGs exist)
    
    // Web egress: Allow communication to app tier
    new SecurityGroupRule(this, 'web_egress_to_app', {
      type: 'egress',
      fromPort: 8080,
      toPort: 8080,
      protocol: 'tcp',
      sourceSecurityGroupId: appSg.id,
      securityGroupId: webSg.id,
    });

    // App egress: Allow communication to database
    new SecurityGroupRule(this, 'app_egress_to_db_mysql', {
      type: 'egress',
      fromPort: 3306,
      toPort: 3306,
      protocol: 'tcp',
      sourceSecurityGroupId: dbSg.id,
      securityGroupId: appSg.id,
    });

    new SecurityGroupRule(this, 'app_egress_to_db_pgsql', {
      type: 'egress',
      fromPort: 5432,
      toPort: 5432,
      protocol: 'tcp',
      sourceSecurityGroupId: dbSg.id,
      securityGroupId: appSg.id,
    });

    // === Expose internal outputs for other stacks
    this.outputs = {
      webSgId: webSg.id,
      appSgId: appSg.id,
      dbSgId: dbSg.id,
    };
  }
}
