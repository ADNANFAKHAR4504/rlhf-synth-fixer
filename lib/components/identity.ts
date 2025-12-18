/**
 * Identity and Access Management Infrastructure Component
 * Handles IAM roles, policies, and instance profiles for AWS Elastic Beanstalk
 */

import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ComponentResource, ComponentResourceOptions } from '@pulumi/pulumi';

interface IdentityInfrastructureArgs {
  tags: Record<string, string>;
}

export class IdentityInfrastructure extends ComponentResource {
  private readonly tags: Record<string, string>;
  private readonly stack: string;

  public readonly ebServiceRole: aws.iam.Role;
  public readonly ebInstanceRole: aws.iam.Role;
  public readonly ebInstancePolicy: aws.iam.RolePolicy;
  public readonly ebInstanceProfile: aws.iam.InstanceProfile;
  public readonly autoscalingRole: aws.iam.Role;
  public readonly autoscalingPolicy: aws.iam.RolePolicy;

  constructor(
    name: string,
    args: IdentityInfrastructureArgs,
    opts?: ComponentResourceOptions
  ) {
    super('nova:infrastructure:Identity', name, {}, opts);

    this.tags = args.tags;
    this.stack = pulumi.getStack();

    this.ebServiceRole = this.createEbServiceRole();
    this.ebInstanceRole = this.createEbInstanceRole();
    this.ebInstancePolicy = this.createEbInstancePolicy();
    this.ebInstanceProfile = this.createEbInstanceProfile();
    this.autoscalingRole = this.createAutoscalingRole();
    this.autoscalingPolicy = this.createAutoscalingPolicy();

    this.registerOutputs({
      ebServiceRoleArn: this.ebServiceRole.arn,
      ebInstanceRoleArn: this.ebInstanceRole.arn,
      ebInstanceProfileName: this.ebInstanceProfile.name,
      autoscalingRoleArn: this.autoscalingRole.arn,
    });
  }

  /**
   * Create Elastic Beanstalk service role
   */
  private createEbServiceRole(): aws.iam.Role {
    return new aws.iam.Role(
      'eb-service-role',
      {
        name: `nova-eb-service-role-${this.stack}`,
        description: 'Service role for Elastic Beanstalk',
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { Service: 'elasticbeanstalk.amazonaws.com' },
              Action: 'sts:AssumeRole',
              Condition: {
                StringEquals: {
                  'sts:ExternalId': 'elasticbeanstalk',
                },
              },
            },
          ],
        }),
        managedPolicyArns: [
          'arn:aws:iam::aws:policy/service-role/AWSElasticBeanstalkEnhancedHealth',
          'arn:aws:iam::aws:policy/AWSElasticBeanstalkManagedUpdatesCustomerRolePolicy',
          'arn:aws:iam::aws:policy/service-role/AWSElasticBeanstalkService',
        ],
        tags: this.tags,
      },
      { parent: this }
    );
  }

  /**
   * Create EC2 instance role for Elastic Beanstalk instances
   */
  private createEbInstanceRole(): aws.iam.Role {
    return new aws.iam.Role(
      'eb-instance-role',
      {
        name: `nova-eb-instance-role-${this.stack}`,
        description: 'Instance role for Elastic Beanstalk EC2 instances',
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { Service: 'ec2.amazonaws.com' },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        managedPolicyArns: [
          'arn:aws:iam::aws:policy/AWSElasticBeanstalkWebTier',
          'arn:aws:iam::aws:policy/AWSElasticBeanstalkMulticontainerDocker',
          'arn:aws:iam::aws:policy/AWSElasticBeanstalkWorkerTier',
        ],
        tags: this.tags,
      },
      { parent: this }
    );
  }

  /**
   * Create additional policy for EB instance role
   */
  private createEbInstancePolicy(): aws.iam.RolePolicy {
    return new aws.iam.RolePolicy(
      'eb-instance-additional-policy',
      {
        role: this.ebInstanceRole.id,
        name: `NovaEBInstanceAdditionalPolicy-${this.stack}`,
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'cloudwatch:PutMetricData',
                'cloudwatch:GetMetricStatistics',
                'cloudwatch:ListMetrics',
                'ec2:DescribeInstanceStatus',
                'ec2:DescribeInstances',
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
                'logs:DescribeLogStreams',
                'logs:DescribeLogGroups',
              ],
              Resource: '*',
            },
            {
              Effect: 'Allow',
              Action: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
              Resource: 'arn:aws:s3:::elasticbeanstalk-*/*',
            },
            {
              Effect: 'Allow',
              Action: ['s3:ListBucket'],
              Resource: 'arn:aws:s3:::elasticbeanstalk-*',
            },
          ],
        }),
      },
      { parent: this }
    );
  }

  /**
   * Create instance profile for Elastic Beanstalk instances
   */
  private createEbInstanceProfile(): aws.iam.InstanceProfile {
    return new aws.iam.InstanceProfile(
      'eb-instance-profile',
      {
        name: `nova-eb-instance-profile-${this.stack}`,
        role: this.ebInstanceRole.name,
      },
      { parent: this }
    );
  }

  /**
   * Create Auto Scaling service role
   */
  private createAutoscalingRole(): aws.iam.Role {
    return new aws.iam.Role(
      'autoscaling-role',
      {
        name: `nova-autoscaling-role-${this.stack}`,
        description: 'Service role for Auto Scaling',
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { Service: 'autoscaling.amazonaws.com' },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        managedPolicyArns: [
          'arn:aws:iam::aws:policy/service-role/AutoScalingNotificationAccessRole',
        ],
        tags: this.tags,
      },
      { parent: this }
    );
  }

  /**
   * Create additional policy for Auto Scaling role
   */
  private createAutoscalingPolicy(): aws.iam.RolePolicy {
    return new aws.iam.RolePolicy(
      'autoscaling-additional-policy',
      {
        role: this.autoscalingRole.id,
        name: `NovaAutoScalingAdditionalPolicy-${this.stack}`,
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'ec2:DescribeInstances',
                'ec2:DescribeInstanceAttribute',
                'ec2:DescribeKeyPairs',
                'ec2:DescribeSecurityGroups',
                'ec2:DescribeSpotInstanceRequests',
                'ec2:DescribeSpotPriceHistory',
                'ec2:DescribeVpcClassicLink',
                'ec2:DescribeVpcs',
                'ec2:CreateTags',
                'elasticloadbalancing:DescribeLoadBalancers',
                'elasticloadbalancing:DescribeInstanceHealth',
                'elasticloadbalancing:RegisterInstancesWithLoadBalancer',
                'elasticloadbalancing:DeregisterInstancesFromLoadBalancer',
                'elasticloadbalancing:DescribeTargetGroups',
                'elasticloadbalancing:DescribeTargetHealth',
                'elasticloadbalancing:RegisterTargets',
                'elasticloadbalancing:DeregisterTargets',
              ],
              Resource: '*',
            },
          ],
        }),
      },
      { parent: this }
    );
  }

  // Property getters for accessing the resources
  public get ebServiceRoleArn(): pulumi.Output<string> {
    return this.ebServiceRole.arn;
  }

  public get ebInstanceRoleArn(): pulumi.Output<string> {
    return this.ebInstanceRole.arn;
  }

  public get ebInstanceProfileName(): pulumi.Output<string> {
    return this.ebInstanceProfile.name;
  }

  public get autoscalingRoleArn(): pulumi.Output<string> {
    return this.autoscalingRole.arn;
  }
}
