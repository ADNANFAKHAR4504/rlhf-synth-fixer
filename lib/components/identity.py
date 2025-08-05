"""
Identity and Access Management Infrastructure Component
Handles IAM roles, policies, and instance profiles for GovCloud compliance
"""

from typing import Optional
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions
import json

class IdentityInfrastructure(pulumi.ComponentResource):
  def __init__(self, 
               name: str,
               tags: dict,
               opts: Optional[ResourceOptions] = None):
    super().__init__('nova:infrastructure:Identity', name, None, opts)

    self.tags = tags

    self._create_eb_service_role()
    self._create_eb_instance_role()
    self._create_eb_instance_profile()
    self._create_autoscaling_role()

    # Register outputs
    self.register_outputs({
      'eb_service_role_arn': self.eb_service_role.arn,
      'eb_instance_role_arn': self.eb_instance_role.arn,
      'eb_instance_profile_name': self.eb_instance_profile.name,
      'autoscaling_role_arn': self.autoscaling_role.arn
    })

  def _create_eb_service_role(self):
    """Create Elastic Beanstalk service role with GovCloud policy ARNs"""
    self.eb_service_role = aws.iam.Role(
      "eb-service-role",
      name="nova-eb-service-role",
      description="Service role for Elastic Beanstalk in GovCloud",
      assume_role_policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
          "Effect": "Allow",
          "Principal": {"Service": "elasticbeanstalk.amazonaws.com"},
          "Action": "sts:AssumeRole",
          "Condition": {
            "StringEquals": {
              "sts:ExternalId": "elasticbeanstalk"
            }
          }
        }]
      }),
      managed_policy_arns=[
        "arn:aws-us-gov:iam::aws:policy/service-role/AWSElasticBeanstalkEnhancedHealth",
        "arn:aws-us-gov:iam::aws:policy/AWSElasticBeanstalkManagedUpdatesCustomerRolePolicy",
        "arn:aws-us-gov:iam::aws:policy/service-role/AWSElasticBeanstalkService"
      ],
      tags=self.tags,
      opts=ResourceOptions(parent=self)
    )

  def _create_eb_instance_role(self):
    """Create EC2 instance role for Elastic Beanstalk instances"""
    self.eb_instance_role = aws.iam.Role(
      "eb-instance-role",
      name="nova-eb-instance-role",
      description="Instance role for Elastic Beanstalk EC2 instances in GovCloud",
      assume_role_policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
          "Effect": "Allow",
          "Principal": {"Service": "ec2.amazonaws.com"},
          "Action": "sts:AssumeRole"
        }]
      }),
      managed_policy_arns=[
        "arn:aws-us-gov:iam::aws:policy/AWSElasticBeanstalkWebTier",
        "arn:aws-us-gov:iam::aws:policy/AWSElasticBeanstalkMulticontainerDocker",
        "arn:aws-us-gov:iam::aws:policy/AWSElasticBeanstalkWorkerTier"
      ],
      tags=self.tags,
      opts=ResourceOptions(parent=self)
    )

    # Additional policy for enhanced monitoring and CloudWatch access
    self.eb_instance_policy = aws.iam.RolePolicy(
      "eb-instance-additional-policy",
      role=self.eb_instance_role.id,
      name="NovaEBInstanceAdditionalPolicy",
      policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [
          {
            "Effect": "Allow",
            "Action": [
              "cloudwatch:PutMetricData",
              "cloudwatch:GetMetricStatistics",
              "cloudwatch:ListMetrics",
              "ec2:DescribeInstanceStatus",
              "ec2:DescribeInstances",
              "logs:CreateLogGroup",
              "logs:CreateLogStream",
              "logs:PutLogEvents",
              "logs:DescribeLogStreams",
              "logs:DescribeLogGroups"
            ],
            "Resource": "*"
          },
          {
            "Effect": "Allow",
            "Action": [
              "s3:GetObject",
              "s3:PutObject",
              "s3:DeleteObject"
            ],
            "Resource": "arn:aws-us-gov:s3:::elasticbeanstalk-*/*"
          },
          {
            "Effect": "Allow",
            "Action": [
              "s3:ListBucket"
            ],
            "Resource": "arn:aws-us-gov:s3:::elasticbeanstalk-*"
          }
        ]
      }),
      opts=ResourceOptions(parent=self)
    )

  def _create_eb_instance_profile(self):
    """Create instance profile for Elastic Beanstalk instances"""
    self.eb_instance_profile = aws.iam.InstanceProfile(
      "eb-instance-profile",
      name="nova-eb-instance-profile",
      role=self.eb_instance_role.name,
      opts=ResourceOptions(parent=self)
    )

  def _create_autoscaling_role(self):
    """Create Auto Scaling service role"""
    self.autoscaling_role = aws.iam.Role(
      "autoscaling-role",
      name="nova-autoscaling-role",
      description="Service role for Auto Scaling in GovCloud",
      assume_role_policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
          "Effect": "Allow",
          "Principal": {"Service": "autoscaling.amazonaws.com"},
          "Action": "sts:AssumeRole"
        }]
      }),
      managed_policy_arns=[
        "arn:aws-us-gov:iam::aws:policy/service-role/AutoScalingNotificationAccessRole"
      ],
      tags=self.tags,
      opts=ResourceOptions(parent=self)
    )

    # Additional auto scaling policy for enhanced capabilities
    self.autoscaling_policy = aws.iam.RolePolicy(
      "autoscaling-additional-policy",
      role=self.autoscaling_role.id,
      name="NovaAutoScalingAdditionalPolicy",
      policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [
          {
            "Effect": "Allow",
            "Action": [
              "ec2:DescribeInstances",
              "ec2:DescribeInstanceAttribute",
              "ec2:DescribeKeyPairs",
              "ec2:DescribeSecurityGroups",
              "ec2:DescribeSpotInstanceRequests",
              "ec2:DescribeSpotPriceHistory",
              "ec2:DescribeVpcClassicLink",
              "ec2:DescribeVpcs",
              "ec2:CreateTags",
              "elasticloadbalancing:DescribeLoadBalancers",
              "elasticloadbalancing:DescribeInstanceHealth",
              "elasticloadbalancing:RegisterInstancesWithLoadBalancer",
              "elasticloadbalancing:DeregisterInstancesFromLoadBalancer",
              "elasticloadbalancing:DescribeTargetGroups",
              "elasticloadbalancing:DescribeTargetHealth",
              "elasticloadbalancing:RegisterTargets",
              "elasticloadbalancing:DeregisterTargets"
            ],
            "Resource": "*"
          }
        ]
      }),
      opts=ResourceOptions(parent=self)
    )