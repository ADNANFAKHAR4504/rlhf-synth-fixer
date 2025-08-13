import { AutoscalingGroup } from '@cdktf/provider-aws/lib/autoscaling-group';
import { AutoscalingPolicy } from '@cdktf/provider-aws/lib/autoscaling-policy';
import { DataAwsSsmParameter } from '@cdktf/provider-aws/lib/data-aws-ssm-parameter';
import { IamInstanceProfile } from '@cdktf/provider-aws/lib/iam-instance-profile';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicy } from '@cdktf/provider-aws/lib/iam-role-policy';
import { LaunchTemplate } from '@cdktf/provider-aws/lib/launch-template';
import { Lb } from '@cdktf/provider-aws/lib/lb';
import { LbListener } from '@cdktf/provider-aws/lib/lb-listener';
import { LbTargetGroup } from '@cdktf/provider-aws/lib/lb-target-group';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { Fn, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';
import { name } from './utils/naming';

export interface ComputeProps {
  provider: AwsProvider;
  environment: string;
  region: string;
  vpcId: string;
  publicSubnets: string[];
  privateSubnets: string[];
  albSgId: string;
  appSgId: string;
  instanceType?: string;
  desiredCapacity?: number;
  minSize?: number;
  maxSize?: number;
  acmCertArn?: string;
}

export class Compute extends Construct {
  public readonly albDns: string;
  public readonly albZoneId: string; // Add this property
  public readonly asgName: string;
  public readonly tgArn: string;

  // Newly added props for Monitoring integration
  public readonly scaleUpPolicyArn: string;
  public readonly scaleDownPolicyArn: string;
  public readonly albTargetGroupName: string;

  constructor(scope: Construct, id: string, props: ComputeProps) {
    super(scope, id);

    const env = props.environment;
    const region = props.region;

    // IAM Role for EC2 with SSM + CW Agent
    const ec2Role = new IamRole(this, 'ec2Role', {
      name: name(env, 'ec2-role', region),
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: { Service: 'ec2.amazonaws.com' },
          },
        ],
      }),
      provider: props.provider,
    });

    new IamRolePolicy(this, 'ec2Policy', {
      name: name(env, 'ec2-cw-ssm-policy', region),
      role: ec2Role.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'ssm:DescribeAssociation',
              'ssm:GetDeployablePatchSnapshotForInstance',
              'ssm:GetDocument',
              'ssm:DescribeDocument',
              'ssm:GetParameters',
              'ssm:ListAssociations',
              'ssm:ListInstanceAssociations',
              'ssm:UpdateInstanceInformation',
              'ec2messages:AcknowledgeMessage',
              'ec2messages:DeleteMessage',
              'ec2messages:FailMessage',
              'ec2messages:GetEndpoint',
              'ec2messages:GetMessages',
              'ec2messages:SendReply',
              'cloudwatch:PutMetricData',
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
              'logs:PutLogEvents',
            ],
            Resource: '*',
          },
        ],
      }),
      provider: props.provider,
    });

    const ec2Profile = new IamInstanceProfile(this, 'ec2Profile', {
      name: name(env, 'ec2-profile', region),
      role: ec2Role.name,
      provider: props.provider,
    });

    // SSM Parameter for AL2023 AMI
    const ssmAmi = new DataAwsSsmParameter(this, 'amiParam', {
      name: '/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64',
      provider: props.provider,
    });

    // ALB
    const alb = new Lb(this, 'alb', {
      name: name(env, 'alb', region),
      internal: false,
      loadBalancerType: 'application',
      securityGroups: [props.albSgId],
      subnets: props.publicSubnets,
      provider: props.provider,
    });

    // Save the DNS and ZoneId
    this.albDns = alb.dnsName;
    this.albZoneId = alb.zoneId; // Ensure the ALB Zone ID is also saved

    // Target Group
    const tg = new LbTargetGroup(this, 'tg', {
      name: name(env, 'tg', region),
      port: 80,
      protocol: 'HTTP',
      vpcId: props.vpcId,
      healthCheck: {
        path: '/',
        protocol: 'HTTP',
      },
      provider: props.provider,
    });

    // Save target group name for monitoring
    this.albTargetGroupName = tg.name;

    // Create HTTPS listener only if a cert was provided
    if (props.acmCertArn && props.acmCertArn.trim().length > 0) {
      new LbListener(this, 'httpsListener', {
        loadBalancerArn: alb.arn,
        port: 443,
        protocol: 'HTTPS',
        certificateArn: props.acmCertArn,
        defaultAction: [
          {
            type: 'forward',
            targetGroupArn: tg.arn,
          },
        ],
      });
    }

    // Launch Template with CW Agent + SSM Agent
    const userData = Fn.base64encode(`#!/bin/bash
yum update -y
yum install -y amazon-cloudwatch-agent
systemctl enable amazon-cloudwatch-agent
systemctl start amazon-cloudwatch-agent
`);

    const lt = new LaunchTemplate(this, 'lt', {
      namePrefix: name(env, 'lt', region),
      imageId: ssmAmi.value,
      instanceType: props.instanceType || 't3.micro',
      vpcSecurityGroupIds: [props.appSgId],
      iamInstanceProfile: { name: ec2Profile.name },
      userData,
      provider: props.provider,
    });

    // ASG
    const asg = new AutoscalingGroup(this, 'asg', {
      name: name(env, 'asg', region),
      minSize: props.minSize ?? 1,
      maxSize: props.maxSize ?? 3,
      desiredCapacity: props.desiredCapacity ?? 1,
      vpcZoneIdentifier: props.privateSubnets,
      launchTemplate: { id: lt.id, version: '$Latest' },
      targetGroupArns: [tg.arn],
      provider: props.provider,
    });

    // Scale policies
    const scaleUpPolicy = new AutoscalingPolicy(this, 'scaleUp', {
      name: name(env, 'scale-up', region),
      scalingAdjustment: 1,
      adjustmentType: 'ChangeInCapacity',
      cooldown: 300,
      autoscalingGroupName: asg.name,
      provider: props.provider,
    });

    const scaleDownPolicy = new AutoscalingPolicy(this, 'scaleDown', {
      name: name(env, 'scale-down', region),
      scalingAdjustment: -1,
      adjustmentType: 'ChangeInCapacity',
      cooldown: 300,
      autoscalingGroupName: asg.name,
      provider: props.provider,
    });

    // Save ARNs for monitoring
    this.scaleUpPolicyArn = scaleUpPolicy.arn;
    this.scaleDownPolicyArn = scaleDownPolicy.arn;

    // Expose DNS, ASG name, TG ARN
    new TerraformOutput(this, 'alb_dns', { value: this.albDns });
    new TerraformOutput(this, 'alb_zone_id', { value: this.albZoneId }); // Add output for ALB Zone ID
    new TerraformOutput(this, 'asg_name', { value: asg.name });
  }
}
