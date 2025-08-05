import { Construct } from 'constructs';
import {
  securityGroup,
  securityGroupRule,
  kmsKey,
  kmsAlias,
  iamRole,
  iamRolePolicy,
  iamInstanceProfile,
  dataAwsIamPolicyDocument,
} from '@cdktf/provider-aws/lib';
import { NamingConvention } from '../utils/naming';

export interface SecurityConstructProps {
  vpcId: string;
  environment: string;
  naming: NamingConvention;
}

export class SecurityConstruct extends Construct {
  public webSecurityGroup: securityGroup.SecurityGroup;
  public appSecurityGroup: securityGroup.SecurityGroup;
  public dbSecurityGroup: securityGroup.SecurityGroup;
  public kmsKey: kmsKey.KmsKey;
  public ec2Role: iamRole.IamRole;
  public instanceProfile: iamInstanceProfile.IamInstanceProfile;

  constructor(scope: Construct, id: string, props: SecurityConstructProps) {
    super(scope, id);

    const { vpcId, naming } = props;

    this.createSecurityGroups(vpcId, naming);
    this.createKmsKey(naming);
    this.createIamRoles(naming);
  }

  private createSecurityGroups(vpcId: string, naming: NamingConvention) {
    // Web Security Group (ALB)
    this.webSecurityGroup = new securityGroup.SecurityGroup(this, 'web-sg', {
      name: naming.resource('sg', 'web'),
      description: 'Security group for web tier (ALB)',
      vpcId: vpcId,
      tags: naming.tag({ Name: naming.resource('sg', 'web') }),
    });

    new securityGroupRule.SecurityGroupRule(this, 'web-sg-ingress-http', {
      type: 'ingress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.webSecurityGroup.id,
    });

    new securityGroupRule.SecurityGroupRule(this, 'web-sg-ingress-https', {
      type: 'ingress',
      fromPort: 443,
      toPort: 443,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.webSecurityGroup.id,
    });

    new securityGroupRule.SecurityGroupRule(this, 'web-sg-egress', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.webSecurityGroup.id,
    });

    // Application Security Group (EC2)
    this.appSecurityGroup = new securityGroup.SecurityGroup(this, 'app-sg', {
      name: naming.resource('sg', 'app'),
      description: 'Security group for application tier (EC2)',
      vpcId: vpcId,
      tags: naming.tag({ Name: naming.resource('sg', 'app') }),
    });

    new securityGroupRule.SecurityGroupRule(this, 'app-sg-ingress-http', {
      type: 'ingress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      sourceSecurityGroupId: this.webSecurityGroup.id,
      securityGroupId: this.appSecurityGroup.id,
    });

    new securityGroupRule.SecurityGroupRule(this, 'app-sg-ingress-ssh', {
      type: 'ingress',
      fromPort: 22,
      toPort: 22,
      protocol: 'tcp',
      cidrBlocks: ['10.0.0.0/8'],
      securityGroupId: this.appSecurityGroup.id,
    });

    new securityGroupRule.SecurityGroupRule(this, 'app-sg-egress', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.appSecurityGroup.id,
    });

    // Database Security Group (RDS)
    this.dbSecurityGroup = new securityGroup.SecurityGroup(this, 'db-sg', {
      name: naming.resource('sg', 'db'),
      description: 'Security group for database tier (RDS)',
      vpcId: vpcId,
      tags: naming.tag({ Name: naming.resource('sg', 'db') }),
    });

    new securityGroupRule.SecurityGroupRule(this, 'db-sg-ingress-mysql', {
      type: 'ingress',
      fromPort: 3306,
      toPort: 3306,
      protocol: 'tcp',
      sourceSecurityGroupId: this.appSecurityGroup.id,
      securityGroupId: this.dbSecurityGroup.id,
    });

    new securityGroupRule.SecurityGroupRule(this, 'db-sg-egress', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.dbSecurityGroup.id,
    });
  }

  private createKmsKey(naming: NamingConvention) {
    const keyPolicy = new dataAwsIamPolicyDocument.DataAwsIamPolicyDocument(this, 'kms-key-policy', {
      statement: [
        {
          sid: 'Enable IAM User Permissions',
          effect: 'Allow',
          principals: [
            {
              type: 'AWS',
              identifiers: [
                'arn:aws:iam::${data.aws_caller_identity.current.account_id}:root',
              ],
            },
          ],
          actions: ['kms:*'],
          resources: ['*'],
        },
      ],
    });

    this.kmsKey = new kmsKey.KmsKey(this, 'kms-key', {
      description: `KMS key for ${naming.resource('', 'encryption')}`,
      policy: keyPolicy.json,
      tags: naming.tag({ Name: naming.resource('kms', 'key') }),
    });

    new kmsAlias.KmsAlias(this, 'kms-alias', {
      name: `alias/${naming.resource('', 'key')}`,
      targetKeyId: this.kmsKey.keyId,
    });
  }

  private createIamRoles(naming: NamingConvention) {
    const assumeRolePolicy = new dataAwsIamPolicyDocument.DataAwsIamPolicyDocument(
      this,
      'ec2-assume-role-policy',
      {
        statement: [
          {
            actions: ['sts:AssumeRole'],
            effect: 'Allow',
            principals: [
              {
                type: 'Service',
                identifiers: ['ec2.amazonaws.com'],
              },
            ],
          },
        ],
      }
    );

    this.ec2Role = new iamRole.IamRole(this, 'ec2-role', {
      name: naming.resource('role', 'ec2'),
      assumeRolePolicy: assumeRolePolicy.json,
      tags: naming.tag({ Name: naming.resource('role', 'ec2') }),
    });

    const ec2Policy = new dataAwsIamPolicyDocument.DataAwsIamPolicyDocument(this, 'ec2-policy', {
      statement: [
        {
          effect: 'Allow',
          actions: [
            'cloudwatch:PutMetricData',
            'ec2:DescribeVolumes',
            'ec2:DescribeTags',
            'logs:PutLogEvents',
            'logs:CreateLogGroup',
            'logs:CreateLogStream',
          ],
          resources: ['*'],
        },
      ],
    });

    new iamRolePolicy.IamRolePolicy(this, 'ec2-role-policy', {
      name: naming.resource('policy', 'ec2'),
      role: this.ec2Role.id,
      policy: ec2Policy.json,
    });

    this.instanceProfile = new iamInstanceProfile.IamInstanceProfile(
      this,
      'ec2-instance-profile',
      {
        name: naming.resource('profile', 'ec2'),
        role: this.ec2Role.name,
      }
    );
  }
}
