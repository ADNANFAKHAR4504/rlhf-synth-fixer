import { Construct } from 'constructs';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';

interface SecurityConstructProps {
  environmentSuffix: string;
  vpcId: string;
}

export class SecurityConstruct extends Construct {
  public readonly webSecurityGroupId: string;
  public readonly appSecurityGroupId: string;
  public readonly dbSecurityGroupId: string;

  constructor(scope: Construct, id: string, props: SecurityConstructProps) {
    super(scope, id);

    const { environmentSuffix, vpcId } = props;

    // Web Tier Security Group
    const webSg = new SecurityGroup(this, 'WebSecurityGroup', {
      name: `payment-web-sg-${environmentSuffix}`,
      description: 'Security group for web tier - load balancers',
      vpcId: vpcId,
      tags: {
        Name: `payment-web-sg-${environmentSuffix}`,
        Environment: environmentSuffix,
        Project: 'PaymentProcessing',
        CostCenter: 'FinTech',
        Tier: 'Web',
      },
    });

    this.webSecurityGroupId = webSg.id;

    // Web SG Rules - Allow HTTPS from internet
    new SecurityGroupRule(this, 'WebIngressHTTPS', {
      type: 'ingress',
      fromPort: 443,
      toPort: 443,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: webSg.id,
      description: 'Allow HTTPS from internet',
    });

    // Web SG Rules - Allow HTTP from internet (redirect to HTTPS)
    new SecurityGroupRule(this, 'WebIngressHTTP', {
      type: 'ingress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: webSg.id,
      description: 'Allow HTTP from internet',
    });

    // Application Tier Security Group
    const appSg = new SecurityGroup(this, 'AppSecurityGroup', {
      name: `payment-app-sg-${environmentSuffix}`,
      description: 'Security group for application tier',
      vpcId: vpcId,
      tags: {
        Name: `payment-app-sg-${environmentSuffix}`,
        Environment: environmentSuffix,
        Project: 'PaymentProcessing',
        CostCenter: 'FinTech',
        Tier: 'Application',
      },
    });

    this.appSecurityGroupId = appSg.id;

    // App SG Rules - Allow traffic from web tier
    new SecurityGroupRule(this, 'AppIngressFromWeb', {
      type: 'ingress',
      fromPort: 8080,
      toPort: 8080,
      protocol: 'tcp',
      sourceSecurityGroupId: webSg.id,
      securityGroupId: appSg.id,
      description: 'Allow traffic from web tier',
    });

    // App SG Rules - Allow SSH from specific IP
    new SecurityGroupRule(this, 'AppIngressSSH', {
      type: 'ingress',
      fromPort: 22,
      toPort: 22,
      protocol: 'tcp',
      cidrBlocks: ['203.0.113.0/24'], // Replace with actual corporate IP
      securityGroupId: appSg.id,
      description: 'Allow SSH from corporate network',
    });

    // Database Tier Security Group
    const dbSg = new SecurityGroup(this, 'DBSecurityGroup', {
      name: `payment-db-sg-${environmentSuffix}`,
      description: 'Security group for database tier',
      vpcId: vpcId,
      tags: {
        Name: `payment-db-sg-${environmentSuffix}`,
        Environment: environmentSuffix,
        Project: 'PaymentProcessing',
        CostCenter: 'FinTech',
        Tier: 'Database',
      },
    });

    this.dbSecurityGroupId = dbSg.id;

    // DB SG Rules - Allow PostgreSQL from app tier
    new SecurityGroupRule(this, 'DBIngressFromApp', {
      type: 'ingress',
      fromPort: 5432,
      toPort: 5432,
      protocol: 'tcp',
      sourceSecurityGroupId: appSg.id,
      securityGroupId: dbSg.id,
      description: 'Allow PostgreSQL from application tier',
    });

    // Egress rules - Allow all outbound traffic for all security groups
    new SecurityGroupRule(this, 'WebEgressAll', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: webSg.id,
      description: 'Allow all outbound traffic',
    });

    new SecurityGroupRule(this, 'AppEgressAll', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: appSg.id,
      description: 'Allow all outbound traffic',
    });

    new SecurityGroupRule(this, 'DBEgressAll', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: dbSg.id,
      description: 'Allow all outbound traffic',
    });
  }
}
