import { Construct } from 'constructs';
import {
  securityGroup,
  securityGroupRule,
  iamRole,
  iamRolePolicy,
  iamInstanceProfile,
  dataAwsIamPolicyDocument,
  ssmParameter,
  wafv2WebAcl,
  wafv2IpSet,
} from '@cdktf/provider-aws/lib';
import { AppConfig } from '../config/variables';

export interface SecurityProps {
  config: AppConfig;
  vpcId: string;
}

export class SecurityConstruct extends Construct {
  public readonly albSecurityGroup: securityGroup.SecurityGroup;
  public readonly ec2SecurityGroup: securityGroup.SecurityGroup;
  public readonly rdsSecurityGroup: securityGroup.SecurityGroup;
  public readonly ec2Role: iamRole.IamRole;
  public readonly ec2InstanceProfile: iamInstanceProfile.IamInstanceProfile;
  public readonly webAcl: wafv2WebAcl.Wafv2WebAcl;

  constructor(scope: Construct, id: string, props: SecurityProps) {
    super(scope, id);

    const { config, vpcId } = props;

    this.albSecurityGroup = new securityGroup.SecurityGroup(this, 'alb-sg', {
      name: `${config.projectName}-${config.environment}-alb-sg`,
      description: 'Security group for Application Load Balancer',
      vpcId: vpcId,
      tags: {
        ...config.tags,
        Name: `${config.projectName}-alb-sg`,
      },
    });

    new securityGroupRule.SecurityGroupRule(this, 'alb-http-ingress', {
      type: 'ingress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.albSecurityGroup.id,
      description: 'Allow HTTP traffic from internet',
    });

    new securityGroupRule.SecurityGroupRule(this, 'alb-https-ingress', {
      type: 'ingress',
      fromPort: 443,
      toPort: 443,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.albSecurityGroup.id,
      description: 'Allow HTTPS traffic from internet',
    });

    new securityGroupRule.SecurityGroupRule(this, 'alb-egress', {
      type: 'egress',
      fromPort: 0,
      toPort: 65535,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.albSecurityGroup.id,
      description: 'Allow all outbound traffic',
    });

    this.ec2SecurityGroup = new securityGroup.SecurityGroup(this, 'ec2-sg', {
      name: `${config.projectName}-${config.environment}-ec2-sg`,
      description: 'Security group for EC2 instances',
      vpcId: vpcId,
      tags: {
        ...config.tags,
        Name: `${config.projectName}-ec2-sg`,
      },
    });

    new securityGroupRule.SecurityGroupRule(this, 'ec2-alb-ingress', {
      type: 'ingress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      sourceSecurityGroupId: this.albSecurityGroup.id,
      securityGroupId: this.ec2SecurityGroup.id,
      description: 'Allow HTTP traffic from ALB',
    });

    new securityGroupRule.SecurityGroupRule(this, 'ec2-ssh-ingress', {
      type: 'ingress',
      fromPort: 22,
      toPort: 22,
      protocol: 'tcp',
      cidrBlocks: ['10.0.0.0/16'],
      securityGroupId: this.ec2SecurityGroup.id,
      description: 'Allow SSH from VPC',
    });

    new securityGroupRule.SecurityGroupRule(this, 'ec2-egress', {
      type: 'egress',
      fromPort: 0,
      toPort: 65535,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.ec2SecurityGroup.id,
      description: 'Allow all outbound traffic',
    });

    this.rdsSecurityGroup = new securityGroup.SecurityGroup(this, 'rds-sg', {
      name: `${config.projectName}-${config.environment}-rds-sg`,
      description: 'Security group for RDS database',
      vpcId: vpcId,
      tags: {
        ...config.tags,
        Name: `${config.projectName}-rds-sg`,
      },
    });

    new securityGroupRule.SecurityGroupRule(this, 'rds-ec2-ingress', {
      type: 'ingress',
      fromPort: 5432,
      toPort: 5432,
      protocol: 'tcp',
      sourceSecurityGroupId: this.ec2SecurityGroup.id,
      securityGroupId: this.rdsSecurityGroup.id,
      description: 'Allow PostgreSQL access from EC2 instances',
    });

    this.ec2Role = new iamRole.IamRole(this, 'ec2-role', {
      name: `${config.projectName}-${config.environment}-ec2-role`,
      assumeRolePolicy: new dataAwsIamPolicyDocument.DataAwsIamPolicyDocument(
        this,
        'ec2-assume-role-policy',
        {
          statement: [
            {
              actions: ['sts:AssumeRole'],
              principals: [
                {
                  type: 'Service',
                  identifiers: ['ec2.amazonaws.com'],
                },
              ],
            },
          ],
        }
      ).json,
      tags: config.tags,
    });

    new iamRolePolicy.IamRolePolicy(this, 'ec2-policy', {
      name: `${config.projectName}-${config.environment}-ec2-policy`,
      role: this.ec2Role.id,
      policy: new dataAwsIamPolicyDocument.DataAwsIamPolicyDocument(
        this,
        'ec2-policy-document',
        {
          statement: [
            {
              actions: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
              resources: [
                `arn:aws:s3:::${config.projectName}-${config.environment}-logs-*/*`,
              ],
            },
            {
              actions: ['s3:ListBucket'],
              resources: [
                `arn:aws:s3:::${config.projectName}-${config.environment}-logs-*`,
              ],
            },
            {
              actions: [
                'ssm:GetParameter',
                'ssm:GetParameters',
                'ssm:GetParametersByPath',
              ],
              resources: [
                `arn:aws:ssm:${config.region}:*:parameter/${config.projectName}/*`,
              ],
            },
            {
              actions: [
                'cloudwatch:PutMetricData',
                'logs:PutLogEvents',
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
              ],
              resources: ['*'],
            },
          ],
        }
      ).json,
    });

    this.ec2InstanceProfile = new iamInstanceProfile.IamInstanceProfile(
      this,
      'ec2-instance-profile',
      {
        name: `${config.projectName}-${config.environment}-ec2-instance-profile`,
        role: this.ec2Role.name,
        tags: config.tags,
      }
    );

    new ssmParameter.SsmParameter(this, 'db-host', {
      name: `/${config.projectName}/database/host`,
      type: 'String',
      value: 'placeholder',
      description: 'Database host endpoint',
      tags: config.tags,
    });

    new ssmParameter.SsmParameter(this, 'db-name', {
      name: `/${config.projectName}/database/name`,
      type: 'String',
      value: 'webapp',
      description: 'Database name',
      tags: config.tags,
    });

    new ssmParameter.SsmParameter(this, 'db-username', {
      name: `/${config.projectName}/database/username`,
      type: 'SecureString',
      value: 'webapp_user',
      description: 'Database username',
      tags: config.tags,
    });

    new ssmParameter.SsmParameter(this, 'db-password', {
      name: `/${config.projectName}/database/password`,
      type: 'SecureString',
      value: 'ChangeMe123!',
      description: 'Database password',
      tags: config.tags,
    });

    const ipSet = new wafv2IpSet.Wafv2IpSet(this, 'blocked-ips', {
      name: `${config.projectName}-${config.environment}-blocked-ips`,
      scope: 'REGIONAL',
      ipAddressVersion: 'IPV4',
      addresses: ['192.0.2.44/32'],
      description: 'Blocked IP addresses',
      tags: config.tags,
    });

    this.webAcl = new wafv2WebAcl.Wafv2WebAcl(this, 'web-acl', {
      name: `${config.projectName}-${config.environment}-web-acl`,
      scope: 'REGIONAL',
      description: 'WAF Web ACL for application protection',
      defaultAction: {
        allow: {},
      },
      rule: [
        {
          name: 'BlockedIPs',
          priority: 1,
          action: {
            block: {},
          },
          statement: {
            ipSetReferenceStatement: {
              arn: ipSet.arn,
            },
          },
          visibilityConfig: {
            cloudwatchMetricsEnabled: true,
            metricName: 'BlockedIPsRule',
            sampledRequestsEnabled: true,
          },
        },
        {
          name: 'AWSManagedRulesCommonRuleSet',
          priority: 2,
          overrideAction: {
            none: {},
          },
          statement: {
            managedRuleGroupStatement: {
              name: 'AWSManagedRulesCommonRuleSet',
              vendorName: 'AWS',
            },
          },
          visibilityConfig: {
            cloudwatchMetricsEnabled: true,
            metricName: 'CommonRuleSetMetric',
            sampledRequestsEnabled: true,
          },
        },
        {
          name: 'AWSManagedRulesKnownBadInputsRuleSet',
          priority: 3,
          overrideAction: {
            none: {},
          },
          statement: {
            managedRuleGroupStatement: {
              name: 'AWSManagedRulesKnownBadInputsRuleSet',
              vendorName: 'AWS',
            },
          },
          visibilityConfig: {
            cloudwatchMetricsEnabled: true,
            metricName: 'KnownBadInputsRuleSetMetric',
            sampledRequestsEnabled: true,
          },
        },
        {
          name: 'AWSManagedRulesSQLiRuleSet',
          priority: 4,
          overrideAction: {
            none: {},
          },
          statement: {
            managedRuleGroupStatement: {
              name: 'AWSManagedRulesSQLiRuleSet',
              vendorName: 'AWS',
            },
          },
          visibilityConfig: {
            cloudwatchMetricsEnabled: true,
            metricName: 'SQLiRuleSetMetric',
            sampledRequestsEnabled: true,
          },
        },
      ],
      tags: config.tags,
      visibilityConfig: {
        cloudwatchMetricsEnabled: true,
        metricName: `${config.projectName}WebAcl`,
        sampledRequestsEnabled: true,
      },
    });

    this.webAcl.addOverride('rule.0.statement.ip_set_reference_statement', {
      arn: ipSet.arn,
    });
    this.webAcl.addOverride(
      'rule.0.statement.ipSetReferenceStatement',
      undefined
    );

    this.webAcl.addOverride('rule.1.statement.managed_rule_group_statement', {
      name: 'AWSManagedRulesCommonRuleSet',
      vendor_name: 'AWS',
    });
    this.webAcl.addOverride(
      'rule.1.statement.managedRuleGroupStatement',
      undefined
    );

    this.webAcl.addOverride('rule.2.statement.managed_rule_group_statement', {
      name: 'AWSManagedRulesKnownBadInputsRuleSet',
      vendor_name: 'AWS',
    });
    this.webAcl.addOverride(
      'rule.2.statement.managedRuleGroupStatement',
      undefined
    );

    this.webAcl.addOverride('rule.3.statement.managed_rule_group_statement', {
      name: 'AWSManagedRulesSQLiRuleSet',
      vendor_name: 'AWS',
    });
    this.webAcl.addOverride(
      'rule.3.statement.managedRuleGroupStatement',
      undefined
    );
  }
}
