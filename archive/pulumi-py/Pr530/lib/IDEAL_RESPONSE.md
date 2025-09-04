# Infrastructure as Code - Pulumi Python Implementation

## __init__.py

```python

```

## tap_stack.py

```python
"""
Defines the AWS infrastructure for the web application using Pulumi.
"""
import base64
from collections import namedtuple

import pulumi
import pulumi_aws as aws

# This function now contains all your infrastructure logic.


def create_infrastructure():
  """Creates all AWS resources for the web application."""

  # A simple container to hold all created resources for testing.
  Infra = namedtuple(
      "Infra",
      [
          "alb_security_group",
          "ec2_security_group",
          "launch_template",
          "auto_scaling_group",
          "cpu_scaling_policy",
          "unhealthy_hosts_alarm",
      ],
  )

  # Configure the AWS provider to use us-east-1 region
  aws_provider = aws.Provider("aws-provider", region="us-east-1")

  # Get the default VPC. For production, creating a new VPC is recommended.
  default_vpc = aws.ec2.get_vpc(
      default=True, opts=pulumi.InvokeOptions(provider=aws_provider)
  )

  # Get all subnets in the default VPC.
  subnets = aws.ec2.get_subnets(
      filters=[aws.ec2.GetSubnetsFilterArgs(
          name="vpc-id", values=[default_vpc.id])],
      opts=pulumi.InvokeOptions(provider=aws_provider),
  )

  # Create a security group for the ALB to allow public HTTP traffic.
  alb_security_group = aws.ec2.SecurityGroup(
      "alb-security-group",
      description="Security group for Application Load Balancer",
      vpc_id=default_vpc.id,
      ingress=[
          aws.ec2.SecurityGroupIngressArgs(
              from_port=80, to_port=80, protocol="tcp", cidr_blocks=["0.0.0.0/0"]
          )
      ],
      egress=[
          aws.ec2.SecurityGroupEgressArgs(
              from_port=0, to_port=0, protocol="-1", cidr_blocks=["0.0.0.0/0"]
          )
      ],
      opts=pulumi.ResourceOptions(provider=aws_provider),
  )

  # Create a security group for EC2 instances to allow traffic only from the ALB.
  ec2_security_group = aws.ec2.SecurityGroup(
      "ec2-security-group",
      description="Security group for EC2 instances",
      vpc_id=default_vpc.id,
      ingress=[
          aws.ec2.SecurityGroupIngressArgs(
              from_port=80,
              to_port=80,
              protocol="tcp",
              security_groups=[alb_security_group.id],
          )
      ],
      egress=[
          aws.ec2.SecurityGroupEgressArgs(
              from_port=0, to_port=0, protocol="-1", cidr_blocks=["0.0.0.0/0"]
          )
      ],
      opts=pulumi.ResourceOptions(provider=aws_provider),
  )

  # Get the latest Amazon Linux 2 AMI.
  ami = aws.ec2.get_ami(
      most_recent=True,
      owners=["amazon"],
      filters=[
          aws.ec2.GetAmiFilterArgs(
              name="name", values=["amzn2-ami-hvm-*-x86_64-gp2"])
      ],
      opts=pulumi.InvokeOptions(provider=aws_provider),
  )

  # User data script to install and start a simple web server.
  user_data = """#!/bin/bash
    yum update -y
    yum install -y httpd
    systemctl start httpd
    systemctl enable httpd
    echo "<h1>Hello from $(hostname -f)</h1>" > /var/www/html/index.html
    """

  # Create IAM role for EC2 instances.
  ec2_role = aws.iam.Role(
      "ec2-role",
      assume_role_policy="""{
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": { "Service": "ec2.amazonaws.com" }
                }
            ]
        }""",
      opts=pulumi.ResourceOptions(provider=aws_provider),
  )

  # BEST PRACTICE: Attach a policy to allow management of the instances via SSM.
  ssm_policy_attachment = aws.iam.RolePolicyAttachment(
      "ssm-policy-attachment",
      role=ec2_role.name,
      policy_arn="arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore",
      opts=pulumi.ResourceOptions(provider=aws_provider),
  )

  instance_profile = aws.iam.InstanceProfile(
      "ec2-instance-profile",
      role=ec2_role.name,
      opts=pulumi.ResourceOptions(provider=aws_provider),
  )

  # Create a launch template for the Auto Scaling Group.
  launch_template = aws.ec2.LaunchTemplate(
      "web-launch-template",
      name_prefix="web-app-",
      image_id=ami.id,
      instance_type="t3.micro",
      vpc_security_group_ids=[ec2_security_group.id],
      user_data=base64.b64encode(user_data.encode("ascii")).decode("ascii"),
      iam_instance_profile=aws.ec2.LaunchTemplateIamInstanceProfileArgs(
          name=instance_profile.name
      ),
      tag_specifications=[
          aws.ec2.LaunchTemplateTagSpecificationArgs(
              resource_type="instance", tags={"Name": "web-app-instance"}
          )
      ],
      opts=pulumi.ResourceOptions(provider=aws_provider),
  )

  # Create an Application Load Balancer.
  alb = aws.lb.LoadBalancer(
      "web-alb",
      load_balancer_type="application",
      subnets=subnets.ids,
      security_groups=[alb_security_group.id],
      enable_deletion_protection=False,
      opts=pulumi.ResourceOptions(provider=aws_provider),
  )

  # Create a target group for the ALB.
  target_group = aws.lb.TargetGroup(
      "web-target-group",
      port=80,
      protocol="HTTP",
      vpc_id=default_vpc.id,
      health_check=aws.lb.TargetGroupHealthCheckArgs(
          enabled=True, healthy_threshold=2, path="/"
      ),
      opts=pulumi.ResourceOptions(provider=aws_provider),
  )

  # Create an ALB listener.
  listener = aws.lb.Listener(
      "web-listener",
      load_balancer_arn=alb.arn,
      port=80,
      protocol="HTTP",
      default_actions=[
          aws.lb.ListenerDefaultActionArgs(
              type="forward", target_group_arn=target_group.arn
          )
      ],
      opts=pulumi.ResourceOptions(provider=aws_provider),
  )

  # Create an Auto Scaling Group.
  auto_scaling_group = aws.autoscaling.Group(
      "web-asg",
      vpc_zone_identifiers=subnets.ids,
      target_group_arns=[target_group.arn],
      health_check_type="ELB",
      health_check_grace_period=300,
      min_size=1,
      max_size=3,
      desired_capacity=1,
      launch_template=aws.autoscaling.GroupLaunchTemplateArgs(
          id=launch_template.id, version="$Latest"
      ),
      tags=[
          aws.autoscaling.GroupTagArgs(
              key="Name", value="web-app-asg", propagate_at_launch=True
          )
      ],
      opts=pulumi.ResourceOptions(provider=aws_provider),
  )

  # Create a target tracking scaling policy.
  cpu_scaling_policy = aws.autoscaling.Policy(
      "cpu-target-tracking-policy",
      autoscaling_group_name=auto_scaling_group.name,
      policy_type="TargetTrackingScaling",
      target_tracking_configuration=aws.autoscaling.PolicyTargetTrackingConfigurationArgs(
          predefined_metric_specification=aws.autoscaling.PolicyTargetTrackingConfigurationPredefinedMetricSpecificationArgs(
              predefined_metric_type="ASGAverageCPUUtilization",
          ),
          target_value=50.0,
      ),
      opts=pulumi.ResourceOptions(provider=aws_provider),
  )

  # Create an SNS Topic without a hardcoded name to prevent CI/CD conflicts.
  sns_topic = aws.sns.Topic(
      "alert-topic", opts=pulumi.ResourceOptions(provider=aws_provider)
  )

  # Create a CloudWatch Alarm for unhealthy hosts.
  unhealthy_hosts_alarm = aws.cloudwatch.MetricAlarm(
      "unhealthy-hosts-alarm",
      comparison_operator="GreaterThanOrEqualToThreshold",
      evaluation_periods=2,
      metric_name="UnHealthyHostCount",
      namespace="AWS/ApplicationELB",
      period=60,
      statistic="Average",
      threshold=1,
      alarm_description="This metric monitors unhealthy hosts in the target group",
      alarm_actions=[sns_topic.arn],
      dimensions=pulumi.Output.all(alb.arn_suffix, target_group.arn_suffix).apply(
          lambda args: {
              "LoadBalancer": args[0],
              "TargetGroup": args[1],
          }
      ),
      opts=pulumi.ResourceOptions(provider=aws_provider),
  )

  # Export important values. These are now inside the function.
  pulumi.export("alb_dns_name", alb.dns_name)
  pulumi.export("alb_zone_id", alb.zone_id)
  pulumi.export("sns_topic_arn", sns_topic.arn)
  pulumi.export("auto_scaling_group_name", auto_scaling_group.name)
  pulumi.export("cpu_scaling_policy_name", cpu_scaling_policy.name)
  pulumi.export("unhealthy_alarm_name", unhealthy_hosts_alarm.name)

  # Return a tuple of resources for the unit tests to use.
  return Infra(
      alb_security_group=alb_security_group,
      ec2_security_group=ec2_security_group,
      launch_template=launch_template,
      auto_scaling_group=auto_scaling_group,
      cpu_scaling_policy=cpu_scaling_policy,
      unhealthy_hosts_alarm=unhealthy_hosts_alarm,
  )


# This block ensures that 'pulumi up' still works correctly by calling the function.
if __name__ == "__main__":
  create_infrastructure()
```
