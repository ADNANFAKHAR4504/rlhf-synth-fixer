import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';
import { Construct } from 'constructs';

interface SecurityProps {
  vpcId: string;
  environment: string;
  region: string;
  allowedCidr: string;
  tags: { [key: string]: string };
}

export class Security extends Construct {
  public readonly webSg: SecurityGroup;
  public readonly appSg: SecurityGroup;
  public readonly dbSg: SecurityGroup;

  constructor(scope: Construct, id: string, props: SecurityProps) {
    super(scope, id);

    // Web SG: Only allow HTTP/HTTPS from known IPs
    this.webSg = new SecurityGroup(this, 'WebSG', {
      vpcId: props.vpcId,
      name: `${props.environment}-${props.region}-web-sg`,
      description: 'Web tier SG',
      tags: {
        ...props.tags,
        Name: `${props.environment}-${props.region}-web-sg`,
        Tier: 'web',
      },
    });

    new SecurityGroupRule(this, 'WebHTTP', {
      type: 'ingress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      cidrBlocks: [props.allowedCidr],
      securityGroupId: this.webSg.id,
      description: 'Allow HTTP from known IP',
    });

    new SecurityGroupRule(this, 'WebHTTPS', {
      type: 'ingress',
      fromPort: 443,
      toPort: 443,
      protocol: 'tcp',
      cidrBlocks: [props.allowedCidr],
      securityGroupId: this.webSg.id,
      description: 'Allow HTTPS from known IP',
    });

    // App SG: Only allow traffic from web SG
    this.appSg = new SecurityGroup(this, 'AppSG', {
      vpcId: props.vpcId,
      name: `${props.environment}-${props.region}-app-sg`,
      description: 'App tier SG',
      tags: {
        ...props.tags,
        Name: `${props.environment}-${props.region}-app-sg`,
        Tier: 'app',
      },
    });

    new SecurityGroupRule(this, 'AppIngress', {
      type: 'ingress',
      fromPort: 8080,
      toPort: 8080,
      protocol: 'tcp',
      sourceSecurityGroupId: this.webSg.id,
      securityGroupId: this.appSg.id,
      description: 'Allow traffic from web SG',
    });

    // DB SG: Only allow traffic from app SG
    this.dbSg = new SecurityGroup(this, 'DbSG', {
      vpcId: props.vpcId,
      name: `${props.environment}-${props.region}-db-sg`,
      description: 'DB tier SG',
      tags: {
        ...props.tags,
        Name: `${props.environment}-${props.region}-db-sg`,
        Tier: 'db',
      },
    });

    new SecurityGroupRule(this, 'DbIngress', {
      type: 'ingress',
      fromPort: 3306,
      toPort: 3306,
      protocol: 'tcp',
      sourceSecurityGroupId: this.appSg.id,
      securityGroupId: this.dbSg.id,
      description: 'Allow MySQL from app SG',
    });

    // All SGs: Default deny all other inbound, allow all outbound
    [this.webSg, this.appSg, this.dbSg].forEach((sg, i) => {
      new SecurityGroupRule(this, `Egress${i}`, {
        type: 'egress',
        fromPort: 0,
        toPort: 0,
        protocol: '-1',
        cidrBlocks: ['0.0.0.0/0'],
        securityGroupId: sg.id,
        description: 'Allow all outbound',
      });
    });
  }
}
