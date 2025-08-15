// Security construct for production
import { IamInstanceProfile } from '@cdktf/provider-aws/lib/iam-instance-profile';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';
import { Construct } from 'constructs';

interface SecurityConstructProps {
  vpcId: string;
  publicSubnetIds: string[];
  privateSubnetIds: string[];
}

export class SecurityConstruct extends Construct {
  public readonly ec2SecurityGroupId: string;
  public readonly rdsSecurityGroupId: string;
  public readonly loadBalancerSecurityGroupId: string;
  public readonly instanceProfile: string;

  constructor(scope: Construct, id: string, props: SecurityConstructProps) {
    super(scope, id);

    // Load Balancer Security Group
    const lbSecurityGroup = new SecurityGroup(this, 'lb-security-group', {
      name: 'production-lb-sg',
      description: 'Security group for production load balancer',
      vpcId: props.vpcId,
      tags: {
        Name: 'production-lb-sg',
        Environment: 'production',
      },
    });
    new SecurityGroupRule(this, 'lb-ingress-https', {
      type: 'ingress',
      fromPort: 443,
      toPort: 443,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: lbSecurityGroup.id,
    });
    new SecurityGroupRule(this, 'lb-egress-all', {
      type: 'egress',
      fromPort: 0,
      toPort: 65535,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: lbSecurityGroup.id,
    });
    this.loadBalancerSecurityGroupId = lbSecurityGroup.id;

    // EC2 Security Group
    const ec2SecurityGroup = new SecurityGroup(this, 'ec2-security-group', {
      name: 'production-ec2-sg',
      description: 'Security group for production EC2 instances',
      vpcId: props.vpcId,
      tags: {
        Name: 'production-ec2-sg',
        Environment: 'production',
      },
    });
    new SecurityGroupRule(this, 'ec2-ingress-ssh', {
      type: 'ingress',
      fromPort: 22,
      toPort: 22,
      protocol: 'tcp',
      cidrBlocks: ['10.0.0.0/16'],
      securityGroupId: ec2SecurityGroup.id,
    });
    new SecurityGroupRule(this, 'ec2-ingress-https', {
      type: 'ingress',
      fromPort: 443,
      toPort: 443,
      protocol: 'tcp',
      sourceSecurityGroupId: lbSecurityGroup.id,
      securityGroupId: ec2SecurityGroup.id,
    });
    new SecurityGroupRule(this, 'ec2-egress-all', {
      type: 'egress',
      fromPort: 0,
      toPort: 65535,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: ec2SecurityGroup.id,
    });
    this.ec2SecurityGroupId = ec2SecurityGroup.id;

    // RDS Security Group
    const rdsSecurityGroup = new SecurityGroup(this, 'rds-security-group', {
      name: 'production-rds-sg',
      description: 'Security group for production RDS instances',
      vpcId: props.vpcId,
      tags: {
        Name: 'production-rds-sg',
        Environment: 'production',
      },
    });
    new SecurityGroupRule(this, 'rds-ingress-mysql', {
      type: 'ingress',
      fromPort: 3306,
      toPort: 3306,
      protocol: 'tcp',
      sourceSecurityGroupId: ec2SecurityGroup.id,
      securityGroupId: rdsSecurityGroup.id,
    });
    this.rdsSecurityGroupId = rdsSecurityGroup.id;

    // IAM Role for EC2 instances
    const ec2Role = new IamRole(this, 'ec2-role', {
      name: 'production-ec2-role',
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'ec2.amazonaws.com',
            },
          },
        ],
      }),
      tags: {
        Name: 'production-ec2-role',
        Environment: 'production',
      },
    });

    // CloudWatch Logs Policy
    const cloudWatchLogsPolicy = new IamPolicy(this, 'cloudwatch-logs-policy', {
      name: 'production-cloudwatch-logs-policy',
      description: 'Policy for EC2 instances to write to CloudWatch Logs',
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
              'logs:PutLogEvents',
              'logs:DescribeLogStreams',
            ],
            Resource: 'arn:aws:logs:us-west-2:*:*',
          },
          {
            Effect: 'Allow',
            Action: [
              'cloudwatch:PutMetricData',
              'ec2:DescribeVolumes',
              'ec2:DescribeTags',
            ],
            Resource: '*',
          },
        ],
      }),
      tags: {
        Name: 'production-cloudwatch-logs-policy',
        Environment: 'production',
      },
    });

    // Attach policies to role
    new IamRolePolicyAttachment(this, 'ec2-ssm-policy', {
      role: ec2Role.name,
      policyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
    });
    new IamRolePolicyAttachment(this, 'ec2-cloudwatch-policy', {
      role: ec2Role.name,
      policyArn: cloudWatchLogsPolicy.arn,
    });

    // Instance Profile
    const instanceProfile = new IamInstanceProfile(
      this,
      'ec2-instance-profile',
      {
        name: 'production-ec2-instance-profile',
        role: ec2Role.name,
        tags: {
          Name: 'production-ec2-instance-profile',
          Environment: 'production',
        },
      }
    );
    this.instanceProfile = instanceProfile.name;
  }
}
