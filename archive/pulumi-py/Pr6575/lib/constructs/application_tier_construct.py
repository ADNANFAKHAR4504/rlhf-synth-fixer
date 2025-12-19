"""Application Tier Construct - ALB, ASG, EC2 instances."""

from constructs import Construct
from cdktf import Fn
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.iam_instance_profile import IamInstanceProfile
from cdktf_cdktf_provider_aws.launch_template import LaunchTemplate, LaunchTemplateIamInstanceProfile
from cdktf_cdktf_provider_aws.lb import Lb
from cdktf_cdktf_provider_aws.lb_target_group import LbTargetGroup, LbTargetGroupHealthCheck
from cdktf_cdktf_provider_aws.lb_listener import LbListener, LbListenerDefaultAction
from cdktf_cdktf_provider_aws.autoscaling_group import AutoscalingGroup, AutoscalingGroupTag
from cdktf_cdktf_provider_aws.autoscaling_policy import (
    AutoscalingPolicy,
    AutoscalingPolicyTargetTrackingConfiguration,
    AutoscalingPolicyTargetTrackingConfigurationPredefinedMetricSpecification
)
from cdktf_cdktf_provider_aws.data_aws_ami import DataAwsAmi


class ApplicationTierConstruct(Construct):
    """Construct for Application Load Balancer and Auto Scaling Group."""

    def __init__(
        self,
        scope: Construct,
        id: str,
        environment_suffix: str,
        vpc_id: str,
        public_subnet_ids: list,
        private_subnet_ids: list,
        alb_security_group_id: str,
        ec2_security_group_id: str,
        rds_endpoint: str
    ):
        super().__init__(scope, id)

        # Get latest Amazon Linux 2 AMI
        ami = DataAwsAmi(
            self,
            "amazon_linux_2",
            most_recent=True,
            owners=["amazon"],
            filter=[
                {
                    "name": "name",
                    "values": ["amzn2-ami-hvm-*-x86_64-gp2"]
                },
                {
                    "name": "virtualization-type",
                    "values": ["hvm"]
                }
            ]
        )

        # IAM Role for EC2 instances
        ec2_role = IamRole(
            self,
            "ec2_role",
            name=f"payment-ec2-role-{environment_suffix}",
            assume_role_policy="""{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ec2.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}""",
            tags={
                "Name": f"payment-ec2-role-{environment_suffix}",
                "Environment": environment_suffix
            }
        )

        # Attach policies for EC2 instances
        IamRolePolicyAttachment(
            self,
            "ec2_ssm_policy",
            role=ec2_role.name,
            policy_arn="arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
        )

        IamRolePolicyAttachment(
            self,
            "ec2_cloudwatch_policy",
            role=ec2_role.name,
            policy_arn="arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
        )

        # Instance Profile
        instance_profile = IamInstanceProfile(
            self,
            "ec2_instance_profile",
            name=f"payment-ec2-profile-{environment_suffix}",
            role=ec2_role.name
        )

        # User data script for EC2 instances
        import base64
        user_data_script = f"""#!/bin/bash
yum update -y
yum install -y docker
systemctl start docker
systemctl enable docker
usermod -a -G docker ec2-user

# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
rpm -U ./amazon-cloudwatch-agent.rpm

# Pull and run payment processing application (placeholder)
docker run -d \\
  -p 8080:8080 \\
  -e DB_ENDPOINT={rds_endpoint} \\
  -e ENVIRONMENT={environment_suffix} \\
  --name payment-app \\
  nginx:latest

# Configure health check endpoint
echo "healthy" > /usr/share/nginx/html/health
"""

        # Base64 encode the user data
        user_data_encoded = base64.b64encode(user_data_script.encode('utf-8')).decode('utf-8')

        # Launch Template
        launch_template = LaunchTemplate(
            self,
            "launch_template",
            name=f"payment-launch-template-{environment_suffix}",
            description=f"Launch template for payment processing EC2 instances - {environment_suffix}",
            image_id=ami.id,
            instance_type="t3.medium",
            user_data=user_data_encoded,
            iam_instance_profile=LaunchTemplateIamInstanceProfile(
                arn=instance_profile.arn
            ),
            vpc_security_group_ids=[ec2_security_group_id],
            monitoring={"enabled": True},
            metadata_options={
                "http_endpoint": "enabled",
                "http_tokens": "required",  # IMDSv2
                "http_put_response_hop_limit": 1
            },
            tag_specifications=[
                {
                    "resource_type": "instance",
                    "tags": {
                        "Name": f"payment-ec2-{environment_suffix}",
                        "Environment": environment_suffix,
                        "ManagedBy": "ASG"
                    }
                }
            ]
        )

        # Application Load Balancer
        alb = Lb(
            self,
            "application_load_balancer",
            name=f"payment-alb-{environment_suffix}",
            load_balancer_type="application",
            security_groups=[alb_security_group_id],
            subnets=public_subnet_ids,
            enable_deletion_protection=False,
            enable_http2=True,
            enable_cross_zone_load_balancing=True,
            tags={
                "Name": f"payment-alb-{environment_suffix}",
                "Environment": environment_suffix
            }
        )

        # Target Group
        target_group = LbTargetGroup(
            self,
            "target_group",
            name=f"payment-tg-{environment_suffix}",
            port=8080,
            protocol="HTTP",
            vpc_id=vpc_id,
            target_type="instance",
            deregistration_delay="30",
            health_check=LbTargetGroupHealthCheck(
                enabled=True,
                healthy_threshold=2,
                unhealthy_threshold=3,
                timeout=5,
                interval=30,
                path="/health",
                protocol="HTTP",
                matcher="200"
            ),
            tags={
                "Name": f"payment-tg-{environment_suffix}",
                "Environment": environment_suffix
            }
        )

        # ALB Listener
        LbListener(
            self,
            "alb_listener",
            load_balancer_arn=alb.arn,
            port=80,
            protocol="HTTP",
            default_action=[
                LbListenerDefaultAction(
                    type="forward",
                    target_group_arn=target_group.arn
                )
            ]
        )

        # Auto Scaling Group
        asg = AutoscalingGroup(
            self,
            "auto_scaling_group",
            name=f"payment-asg-{environment_suffix}",
            min_size=3,
            max_size=9,
            desired_capacity=3,
            health_check_type="ELB",
            health_check_grace_period=300,
            vpc_zone_identifier=private_subnet_ids,
            target_group_arns=[target_group.arn],
            launch_template={
                "id": launch_template.id,
                "version": "$Latest"
            },
            enabled_metrics=[
                "GroupMinSize",
                "GroupMaxSize",
                "GroupDesiredCapacity",
                "GroupInServiceInstances",
                "GroupTotalInstances"
            ],
            tag=[
                AutoscalingGroupTag(
                    key="Name",
                    value=f"payment-asg-{environment_suffix}",
                    propagate_at_launch=True
                ),
                AutoscalingGroupTag(
                    key="Environment",
                    value=environment_suffix,
                    propagate_at_launch=True
                )
            ]
        )

        # Auto Scaling Policy - Target Tracking (CPU)
        AutoscalingPolicy(
            self,
            "cpu_scaling_policy",
            name=f"payment-cpu-scaling-{environment_suffix}",
            autoscaling_group_name=asg.name,
            policy_type="TargetTrackingScaling",
            target_tracking_configuration=AutoscalingPolicyTargetTrackingConfiguration(
                predefined_metric_specification=AutoscalingPolicyTargetTrackingConfigurationPredefinedMetricSpecification(
                    predefined_metric_type="ASGAverageCPUUtilization"
                ),
                target_value=70.0
            )
        )

        # Auto Scaling Policy - Target Tracking (ALB Request Count)
        # Note: Removed resource_label as it requires complex Terraform functions
        # The policy will work with the target group association
        AutoscalingPolicy(
            self,
            "request_count_scaling_policy",
            name=f"payment-request-scaling-{environment_suffix}",
            autoscaling_group_name=asg.name,
            policy_type="TargetTrackingScaling",
            target_tracking_configuration=AutoscalingPolicyTargetTrackingConfiguration(
                predefined_metric_specification=AutoscalingPolicyTargetTrackingConfigurationPredefinedMetricSpecification(
                    predefined_metric_type="ASGAverageNetworkIn"
                ),
                target_value=10000000.0  # 10MB
            )
        )

        # Store attributes
        self.alb_dns_name = alb.dns_name
        self.alb_arn = alb.arn
        self.alb_zone_id = alb.zone_id
        self.target_group_arn = target_group.arn
        self.asg_name = asg.name

