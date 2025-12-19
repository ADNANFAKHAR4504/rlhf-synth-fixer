import { Construct } from 'constructs';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { DbInstance } from '@cdktf/provider-aws/lib/db-instance';
import { ElasticacheServerlessCache } from '@cdktf/provider-aws/lib/elasticache-serverless-cache';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';
import { LaunchTemplate } from '@cdktf/provider-aws/lib/launch-template';
import { AutoscalingGroup } from '@cdktf/provider-aws/lib/autoscaling-group';
import { Alb } from '@cdktf/provider-aws/lib/alb';
import { AlbTargetGroup } from '@cdktf/provider-aws/lib/alb-target-group';
import { AlbListener } from '@cdktf/provider-aws/lib/alb-listener';
import { DataAwsAmi } from '@cdktf/provider-aws/lib/data-aws-ami';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { IamInstanceProfile } from '@cdktf/provider-aws/lib/iam-instance-profile';

interface ComputeStackProps {
  vpc: Vpc;
  publicSubnets: Subnet[];
  privateSubnets: Subnet[];
  database: DbInstance;
  cache: ElasticacheServerlessCache;
  region: string;
  environmentSuffix: string;
}

export class ComputeStack extends Construct {
  public readonly alb: Alb;
  public readonly asg: AutoscalingGroup;

  constructor(scope: Construct, id: string, props: ComputeStackProps) {
    super(scope, id);

    const ec2SecurityGroup = new SecurityGroup(this, 'ec2-sg', {
      vpcId: props.vpc.id,
      description: 'Security group for EC2 instances',
      tags: {
        Name: 'portfolio-ec2-sg',
      },
    });

    const albSecurityGroup = new SecurityGroup(this, 'alb-sg', {
      vpcId: props.vpc.id,
      description: 'Security group for ALB',
      tags: {
        Name: 'portfolio-alb-sg',
      },
    });

    new SecurityGroupRule(this, 'alb-http-ingress', {
      type: 'ingress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      securityGroupId: albSecurityGroup.id,
      cidrBlocks: ['0.0.0.0/0'],
    });

    new SecurityGroupRule(this, 'alb-https-ingress', {
      type: 'ingress',
      fromPort: 443,
      toPort: 443,
      protocol: 'tcp',
      securityGroupId: albSecurityGroup.id,
      cidrBlocks: ['0.0.0.0/0'],
    });

    new SecurityGroupRule(this, 'alb-egress', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      securityGroupId: albSecurityGroup.id,
      cidrBlocks: ['0.0.0.0/0'],
    });

    new SecurityGroupRule(this, 'ec2-alb-ingress', {
      type: 'ingress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      securityGroupId: ec2SecurityGroup.id,
      sourceSecurityGroupId: albSecurityGroup.id,
    });

    new SecurityGroupRule(this, 'ec2-egress', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      securityGroupId: ec2SecurityGroup.id,
      cidrBlocks: ['0.0.0.0/0'],
    });

    const ec2Role = new IamRole(this, 'ec2-role', {
      name: `portfolio-ec2-role-${props.environmentSuffix}`,
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
    });

    new IamRolePolicyAttachment(this, 'ec2-ssm-policy', {
      role: ec2Role.name,
      policyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
    });

    const instanceProfile = new IamInstanceProfile(this, 'ec2-profile', {
      name: `portfolio-ec2-profile-${props.environmentSuffix}`,
      role: ec2Role.name,
    });

    const ami = new DataAwsAmi(this, 'amazon-linux-2', {
      mostRecent: true,
      owners: ['amazon'],
      filter: [
        {
          name: 'name',
          values: ['amzn2-ami-hvm-*-x86_64-gp2'],
        },
        {
          name: 'virtualization-type',
          values: ['hvm'],
        },
      ],
    });

    const userDataScript = `#!/bin/bash
yum update -y
yum install -y amazon-cloudwatch-agent
amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s
echo "Portfolio tracking app initialization complete"`;

    const launchTemplate = new LaunchTemplate(this, 'lt', {
      name: `portfolio-lt-${props.environmentSuffix}`,
      imageId: ami.id,
      instanceType: 't3.medium',
      vpcSecurityGroupIds: [ec2SecurityGroup.id],
      iamInstanceProfile: {
        name: instanceProfile.name,
      },
      userData: Buffer.from(userDataScript).toString('base64'),
      tagSpecifications: [
        {
          resourceType: 'instance',
          tags: {
            Name: 'portfolio-app-instance',
          },
        },
      ],
    });

    const targetGroup = new AlbTargetGroup(this, 'tg', {
      name: `portfolio-tg-${props.environmentSuffix}`,
      port: 80,
      protocol: 'HTTP',
      vpcId: props.vpc.id,
      targetType: 'instance',
      healthCheck: {
        enabled: true,
        path: '/health',
        port: '80',
        protocol: 'HTTP',
        healthyThreshold: 2,
        unhealthyThreshold: 2,
        timeout: 5,
        interval: 30,
      },
      stickiness: {
        type: 'lb_cookie',
        enabled: true,
        cookieDuration: 86400,
      },
      tags: {
        Name: 'portfolio-tg',
      },
    });

    this.asg = new AutoscalingGroup(this, 'asg', {
      name: `portfolio-asg-${props.environmentSuffix}`,
      minSize: 2,
      maxSize: 6,
      desiredCapacity: 2,
      launchTemplate: {
        id: launchTemplate.id,
        version: '$Latest',
      },
      vpcZoneIdentifier: props.privateSubnets.map(subnet => subnet.id),
      targetGroupArns: [targetGroup.arn],
      healthCheckType: 'ELB',
      healthCheckGracePeriod: 300,
      tag: [
        {
          key: 'Name',
          value: 'portfolio-asg-instance',
          propagateAtLaunch: true,
        },
      ],
    });

    this.alb = new Alb(this, 'alb', {
      name: `portfolio-alb-${props.environmentSuffix}`,
      internal: false,
      loadBalancerType: 'application',
      securityGroups: [albSecurityGroup.id],
      subnets: props.publicSubnets.map(subnet => subnet.id),
      enableHttp2: true,
      enableCrossZoneLoadBalancing: true,
      tags: {
        Name: 'portfolio-alb',
      },
    });

    new AlbListener(this, 'alb-listener', {
      loadBalancerArn: this.alb.arn,
      port: 80,
      protocol: 'HTTP',
      defaultAction: [
        {
          type: 'forward',
          targetGroupArn: targetGroup.arn,
        },
      ],
    });
  }
}
