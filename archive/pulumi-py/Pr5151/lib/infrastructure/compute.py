"""
Compute infrastructure module.

This module creates Launch Templates and Auto Scaling Groups for
highly-available EC2 instances with SSM Session Manager enabled.
"""
import base64
from typing import List

import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions

from .config import InfraConfig


class ComputeStack:
    """
    Creates and manages EC2 Launch Templates and Auto Scaling Groups
    for highly-available application deployment with SSM access.
    """
    
    def __init__(
        self,
        config: InfraConfig,
        subnet_ids: Output[List[str]],
        security_group_id: Output[str],
        instance_profile_arn: Output[str],
        aws_provider: aws.Provider,
        parent: pulumi.ComponentResource = None
    ):
        """
        Initialize the compute stack.
        
        Args:
            config: Infrastructure configuration
            subnet_ids: List of subnet IDs for ASG instances
            security_group_id: Security group ID for instances
            instance_profile_arn: IAM instance profile ARN
            aws_provider: AWS provider instance
            parent: Parent Pulumi component resource
        """
        self.config = config
        self.subnet_ids = subnet_ids
        self.security_group_id = security_group_id
        self.instance_profile_arn = instance_profile_arn
        self.aws_provider = aws_provider
        self.parent = parent
        
        # Get latest Amazon Linux 2023 AMI
        self.ami = self._get_ami()
        
        # Get KMS key for EBS encryption
        self.ebs_kms_key = self._get_ebs_kms_key()
        
        # Create Launch Template
        self.launch_template = self._create_launch_template()
        
        # Create Auto Scaling Group
        self.auto_scaling_group = self._create_auto_scaling_group()
        
        # Create Scaling Policies
        self.scale_up_policy = self._create_scale_up_policy()
        self.scale_down_policy = self._create_scale_down_policy()
        
        # Create CloudWatch Alarms for scaling
        self.high_cpu_alarm = self._create_high_cpu_alarm()
        self.low_cpu_alarm = self._create_low_cpu_alarm()
    
    def _get_ami(self) -> aws.ec2.AwaitableGetAmiResult:
        """
        Get the latest Amazon Linux 2023 AMI.
        
        Returns:
            AMI data
        """
        ami = aws.ec2.get_ami(
            most_recent=True,
            owners=['amazon'],
            filters=[
                aws.ec2.GetAmiFilterArgs(
                    name='name',
                    values=['al2023-ami-*-x86_64']
                ),
                aws.ec2.GetAmiFilterArgs(
                    name='virtualization-type',
                    values=['hvm']
                )
            ],
            opts=pulumi.InvokeOptions(provider=self.aws_provider)
        )
        
        return ami
    
    def _get_ebs_kms_key(self) -> aws.kms.AwaitableGetAliasResult:
        """
        Get AWS managed KMS key for EBS encryption.
        
        Returns:
            KMS key alias data
        """
        return aws.kms.get_alias(
            name="alias/aws/ebs",
            opts=pulumi.InvokeOptions(provider=self.aws_provider)
        )
    
    def _get_user_data(self) -> str:
        """
        Generate user data script for EC2 instances.
        
        Ensures SSM agent is enabled and running, and AWS CLI is installed.
        
        Returns:
            User data script (Pulumi handles base64 encoding)
        """
        user_data_script = f"""#!/bin/bash
set -e

# Log all output for debugging
exec > >(tee -a /var/log/user-data.log) 2>&1

echo "Starting user data script at $(date)"

# Ensure SSM agent is running (pre-installed on Amazon Linux 2023)
systemctl enable amazon-ssm-agent
systemctl start amazon-ssm-agent
echo "SSM agent enabled and started"

# Install AWS CLI v2 (not pre-installed on Amazon Linux 2023)
if ! command -v aws &> /dev/null; then
    echo "Installing AWS CLI v2..."
    curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "/tmp/awscliv2.zip"
    unzip -q /tmp/awscliv2.zip -d /tmp
    /tmp/aws/install
    rm -rf /tmp/awscliv2.zip /tmp/aws
    echo "AWS CLI v2 installed successfully"
else
    echo "AWS CLI already installed"
fi

# Verify AWS CLI installation
aws --version

# Signal that instance is ready
echo "Instance ready at $(date)" > /var/log/user-data-complete.log
echo "User data script completed successfully at $(date)"
"""
        
        return user_data_script
    
    def _create_launch_template(self) -> aws.ec2.LaunchTemplate:
        """
        Create Launch Template for Auto Scaling Group.
        
        Returns:
            Launch Template resource
        """
        lt_name = self.config.get_resource_name('launch-template', include_region=False)
        
        launch_template = aws.ec2.LaunchTemplate(
            lt_name,
            name=lt_name,
            image_id=self.ami.id,
            instance_type=self.config.instance_type,
            user_data=base64.b64encode(self._get_user_data().encode()).decode(),
            iam_instance_profile=aws.ec2.LaunchTemplateIamInstanceProfileArgs(
                arn=self.instance_profile_arn
            ),
            vpc_security_group_ids=[self.security_group_id],
            block_device_mappings=[
                aws.ec2.LaunchTemplateBlockDeviceMappingArgs(
                    device_name="/dev/xvda",
                    ebs=aws.ec2.LaunchTemplateBlockDeviceMappingEbsArgs(
                        volume_size=30,
                        volume_type="gp3",
                        encrypted=True,
                        kms_key_id=self.ebs_kms_key.target_key_arn,
                        delete_on_termination=True
                    )
                )
            ],
            metadata_options=aws.ec2.LaunchTemplateMetadataOptionsArgs(
                http_endpoint="enabled",
                http_tokens="required",
                http_put_response_hop_limit=1
            ),
            monitoring=aws.ec2.LaunchTemplateMonitoringArgs(
                enabled=True
            ),
            tag_specifications=[
                aws.ec2.LaunchTemplateTagSpecificationArgs(
                    resource_type="instance",
                    tags=self.config.get_tags_for_resource('EC2Instance', Name=f"{lt_name}-instance")
                ),
                aws.ec2.LaunchTemplateTagSpecificationArgs(
                    resource_type="volume",
                    tags=self.config.get_tags_for_resource('EBSVolume', Name=f"{lt_name}-volume")
                )
            ],
            tags=self.config.get_tags_for_resource('LaunchTemplate', Name=lt_name),
            opts=ResourceOptions(
                provider=self.aws_provider,
                parent=self.parent
            )
        )
        
        return launch_template
    
    def _create_auto_scaling_group(self) -> aws.autoscaling.Group:
        """
        Create Auto Scaling Group.
        
        Returns:
            Auto Scaling Group resource
        """
        asg_name = self.config.get_resource_name('asg', include_region=False)
        
        asg = aws.autoscaling.Group(
            asg_name,
            name=asg_name,
            min_size=self.config.asg_min_size,
            max_size=self.config.asg_max_size,
            desired_capacity=self.config.asg_desired_capacity,
            health_check_grace_period=self.config.health_check_grace_period,
            health_check_type=self.config.health_check_type,
            vpc_zone_identifiers=self.subnet_ids,
            launch_template=aws.autoscaling.GroupLaunchTemplateArgs(
                id=self.launch_template.id,
                version="$Latest"
            ),
            enabled_metrics=[
                "GroupMinSize",
                "GroupMaxSize",
                "GroupDesiredCapacity",
                "GroupInServiceInstances",
                "GroupTotalInstances"
            ],
            tags=[
                aws.autoscaling.GroupTagArgs(
                    key=key,
                    value=value,
                    propagate_at_launch=True
                )
                for key, value in self.config.get_tags_for_resource('AutoScalingGroup', Name=asg_name).items()
            ],
            opts=ResourceOptions(
                provider=self.aws_provider,
                parent=self.parent,
                depends_on=[self.launch_template]
            )
        )
        
        return asg
    
    def _create_scale_up_policy(self) -> aws.autoscaling.Policy:
        """
        Create scale-up policy for ASG.
        
        Returns:
            Scaling policy resource
        """
        policy_name = self.config.get_resource_name('policy-scale-up', include_region=False)
        
        policy = aws.autoscaling.Policy(
            policy_name,
            name=policy_name,
            autoscaling_group_name=self.auto_scaling_group.name,
            adjustment_type="ChangeInCapacity",
            scaling_adjustment=self.config.scale_up_adjustment,
            cooldown=300,
            opts=ResourceOptions(
                provider=self.aws_provider,
                parent=self.parent,
                depends_on=[self.auto_scaling_group]
            )
        )
        
        return policy
    
    def _create_scale_down_policy(self) -> aws.autoscaling.Policy:
        """
        Create scale-down policy for ASG.
        
        Returns:
            Scaling policy resource
        """
        policy_name = self.config.get_resource_name('policy-scale-down', include_region=False)
        
        policy = aws.autoscaling.Policy(
            policy_name,
            name=policy_name,
            autoscaling_group_name=self.auto_scaling_group.name,
            adjustment_type="ChangeInCapacity",
            scaling_adjustment=self.config.scale_down_adjustment,
            cooldown=300,
            opts=ResourceOptions(
                provider=self.aws_provider,
                parent=self.parent,
                depends_on=[self.auto_scaling_group]
            )
        )
        
        return policy
    
    def _create_high_cpu_alarm(self) -> aws.cloudwatch.MetricAlarm:
        """
        Create CloudWatch alarm for high CPU utilization.
        
        Triggers scale-up policy when CPU > threshold.
        
        Returns:
            CloudWatch alarm resource
        """
        alarm_name = self.config.get_resource_name('alarm-cpu-high', include_region=False)
        
        alarm = aws.cloudwatch.MetricAlarm(
            alarm_name,
            name=alarm_name,
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=self.config.alarm_evaluation_periods,
            metric_name="CPUUtilization",
            namespace="AWS/EC2",
            period=self.config.alarm_period,
            statistic="Average",
            threshold=self.config.scale_up_cpu_threshold,
            alarm_description=f"Triggers scale-up when CPU exceeds {self.config.scale_up_cpu_threshold}%",
            alarm_actions=[self.scale_up_policy.arn],
            dimensions={
                "AutoScalingGroupName": self.auto_scaling_group.name
            },
            tags=self.config.get_tags_for_resource('CloudWatchAlarm', Name=alarm_name),
            opts=ResourceOptions(
                provider=self.aws_provider,
                parent=self.parent,
                depends_on=[self.auto_scaling_group, self.scale_up_policy]
            )
        )
        
        return alarm
    
    def _create_low_cpu_alarm(self) -> aws.cloudwatch.MetricAlarm:
        """
        Create CloudWatch alarm for low CPU utilization.
        
        Triggers scale-down policy when CPU < threshold.
        
        Returns:
            CloudWatch alarm resource
        """
        alarm_name = self.config.get_resource_name('alarm-cpu-low', include_region=False)
        
        alarm = aws.cloudwatch.MetricAlarm(
            alarm_name,
            name=alarm_name,
            comparison_operator="LessThanThreshold",
            evaluation_periods=self.config.alarm_evaluation_periods,
            metric_name="CPUUtilization",
            namespace="AWS/EC2",
            period=self.config.alarm_period,
            statistic="Average",
            threshold=self.config.scale_down_cpu_threshold,
            alarm_description=f"Triggers scale-down when CPU falls below {self.config.scale_down_cpu_threshold}%",
            alarm_actions=[self.scale_down_policy.arn],
            dimensions={
                "AutoScalingGroupName": self.auto_scaling_group.name
            },
            tags=self.config.get_tags_for_resource('CloudWatchAlarm', Name=alarm_name),
            opts=ResourceOptions(
                provider=self.aws_provider,
                parent=self.parent,
                depends_on=[self.auto_scaling_group, self.scale_down_policy]
            )
        )
        
        return alarm
    
    def get_auto_scaling_group_name(self) -> Output[str]:
        """Get Auto Scaling Group name."""
        return self.auto_scaling_group.name
    
    def get_auto_scaling_group_arn(self) -> Output[str]:
        """Get Auto Scaling Group ARN."""
        return self.auto_scaling_group.arn
    
    def get_launch_template_id(self) -> Output[str]:
        """Get Launch Template ID."""
        return self.launch_template.id

