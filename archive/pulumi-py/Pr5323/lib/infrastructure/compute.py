"""
Compute infrastructure module.

This module creates Launch Templates and Auto Scaling Groups
with health checks and scaling policies.
"""

from typing import List

import pulumi
import pulumi_aws as aws
from infrastructure.aws_provider import AWSProviderManager
from infrastructure.config import InfraConfig
from pulumi import Output, ResourceOptions


class ComputeStack:
    """
    Creates and manages EC2 compute resources including Launch Templates
    and Auto Scaling Groups.
    """
    
    def __init__(
        self,
        config: InfraConfig,
        provider_manager: AWSProviderManager,
        private_subnet_ids: List[Output[str]],
        security_group_id: Output[str],
        instance_profile_name: Output[str],
        instance_profile_arn: Output[str],
        instance_profile: aws.iam.InstanceProfile,
        parent: pulumi.ComponentResource
    ):
        """
        Initialize the compute stack.
        
        Args:
            config: Infrastructure configuration
            provider_manager: AWS provider manager
            private_subnet_ids: List of private subnet IDs
            security_group_id: Security group ID
            instance_profile_name: Instance profile name
            instance_profile_arn: Instance profile ARN
            instance_profile: Instance profile resource
            parent: Parent Pulumi component resource
        """
        self.config = config
        self.provider_manager = provider_manager
        self.private_subnet_ids = private_subnet_ids
        self.security_group_id = security_group_id
        self.instance_profile_name = instance_profile_name
        self.instance_profile_arn = instance_profile_arn
        self.instance_profile = instance_profile
        self.parent = parent
        
        # Get latest Amazon Linux 2023 AMI
        self.ami = self._get_latest_ami()
        
        # Get KMS key for EBS encryption
        self.ebs_kms_key = self._get_ebs_kms_key()
        
        # Create Launch Template
        self.launch_template = self._create_launch_template()
        
        # Create Auto Scaling Group
        self.auto_scaling_group = self._create_auto_scaling_group()
        
        # Create scaling policies
        self.scale_up_policy = self._create_scale_up_policy()
        self.scale_down_policy = self._create_scale_down_policy()
    
    def _get_latest_ami(self) -> aws.ec2.AwaitableGetAmiResult:
        """
        Get latest Amazon Linux 2023 AMI.
        
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
            opts=pulumi.InvokeOptions(provider=self.provider_manager.get_provider())
        )
        
        return ami
    
    def _get_ebs_kms_key(self) -> aws.kms.AwaitableGetAliasResult:
        """
        Get AWS managed KMS key for EBS encryption.
        
        Returns:
            KMS key data
        """
        kms_key = aws.kms.get_alias(
            name='alias/aws/ebs',
            opts=pulumi.InvokeOptions(provider=self.provider_manager.get_provider())
        )
        return kms_key
    
    def _create_launch_template(self) -> aws.ec2.LaunchTemplate:
        """
        Create Launch Template for EC2 instances.
        
        Returns:
            Launch Template
        """
        template_name = self.config.get_resource_name('launch-template')
        
        # User data script for EC2 initialization
        user_data = """#!/bin/bash
set -e

# Configure logging
exec > >(tee -a /var/log/user-data.log) 2>&1
echo "Starting user data script at $(date)"

# Update system packages
dnf update -y

# Install CloudWatch agent
dnf install -y amazon-cloudwatch-agent

# Install SSM agent (should be pre-installed on Amazon Linux 2023)
dnf install -y amazon-ssm-agent
systemctl enable amazon-ssm-agent
systemctl start amazon-ssm-agent

# Create a simple health check endpoint
cat > /var/www/html/health.html << 'EOF'
<!DOCTYPE html>
<html>
<head><title>Health Check</title></head>
<body><h1>OK</h1></body>
</html>
EOF

echo "User data script completed at $(date)"
"""
        
        launch_template = aws.ec2.LaunchTemplate(
            template_name,
            name=template_name,
            image_id=self.ami.id,
            instance_type=self.config.instance_type,
            user_data=pulumi.Output.secret(user_data).apply(
                lambda s: __import__('base64').b64encode(s.encode()).decode()
            ),
            iam_instance_profile=aws.ec2.LaunchTemplateIamInstanceProfileArgs(
                arn=self.instance_profile_arn
            ),
            vpc_security_group_ids=[self.security_group_id],
            block_device_mappings=[
                aws.ec2.LaunchTemplateBlockDeviceMappingArgs(
                    device_name='/dev/xvda',
                    ebs=aws.ec2.LaunchTemplateBlockDeviceMappingEbsArgs(
                        volume_size=30,
                        volume_type='gp3',
                        encrypted=True,
                        kms_key_id=self.ebs_kms_key.target_key_arn,
                        delete_on_termination=True
                    )
                )
            ],
            metadata_options=aws.ec2.LaunchTemplateMetadataOptionsArgs(
                http_endpoint='enabled',
                http_tokens='required',
                http_put_response_hop_limit=1
            ),
            monitoring=aws.ec2.LaunchTemplateMonitoringArgs(
                enabled=True
            ),
            tag_specifications=[
                aws.ec2.LaunchTemplateTagSpecificationArgs(
                    resource_type='instance',
                    tags={
                        **self.config.get_tags_for_resource('EC2-Instance'),
                        'Name': self.config.get_resource_name('ec2-instance')
                    }
                ),
                aws.ec2.LaunchTemplateTagSpecificationArgs(
                    resource_type='volume',
                    tags={
                        **self.config.get_tags_for_resource('EBS-Volume'),
                        'Name': self.config.get_resource_name('ebs-volume')
                    }
                )
            ],
            tags={
                **self.config.get_tags_for_resource('LaunchTemplate'),
                'Name': template_name
            },
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                parent=self.parent,
                depends_on=[self.instance_profile]
            )
        )
        
        return launch_template
    
    def _create_auto_scaling_group(self) -> aws.autoscaling.Group:
        """
        Create Auto Scaling Group.
        
        Returns:
            Auto Scaling Group
        """
        asg_name = self.config.get_resource_name('asg')
        
        auto_scaling_group = aws.autoscaling.Group(
            asg_name,
            name=asg_name,
            min_size=self.config.asg_min_size,
            max_size=self.config.asg_max_size,
            desired_capacity=self.config.asg_desired_capacity,
            health_check_grace_period=self.config.health_check_grace_period,
            health_check_type=self.config.health_check_type,
            vpc_zone_identifiers=self.private_subnet_ids,
            launch_template=aws.autoscaling.GroupLaunchTemplateArgs(
                id=self.launch_template.id,
                version='$Latest'
            ),
            tags=[
                aws.autoscaling.GroupTagArgs(
                    key=key,
                    value=value,
                    propagate_at_launch=True
                )
                for key, value in {
                    **self.config.get_tags_for_resource('AutoScalingGroup'),
                    'Name': asg_name
                }.items()
            ],
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                parent=self.launch_template,
                depends_on=[self.launch_template]
            )
        )
        
        return auto_scaling_group
    
    def _create_scale_up_policy(self) -> aws.autoscaling.Policy:
        """
        Create scale-up policy for Auto Scaling Group.
        
        Returns:
            Scaling Policy
        """
        policy_name = self.config.get_resource_name('scale-up-policy')
        
        policy = aws.autoscaling.Policy(
            policy_name,
            name=policy_name,
            autoscaling_group_name=self.auto_scaling_group.name,
            adjustment_type='ChangeInCapacity',
            scaling_adjustment=1,
            cooldown=300,
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                parent=self.auto_scaling_group
            )
        )
        
        return policy
    
    def _create_scale_down_policy(self) -> aws.autoscaling.Policy:
        """
        Create scale-down policy for Auto Scaling Group.
        
        Returns:
            Scaling Policy
        """
        policy_name = self.config.get_resource_name('scale-down-policy')
        
        policy = aws.autoscaling.Policy(
            policy_name,
            name=policy_name,
            autoscaling_group_name=self.auto_scaling_group.name,
            adjustment_type='ChangeInCapacity',
            scaling_adjustment=-1,
            cooldown=300,
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                parent=self.auto_scaling_group
            )
        )
        
        return policy
    
    # Getter methods
    
    def get_launch_template_id(self) -> Output[str]:
        """Get Launch Template ID."""
        return self.launch_template.id
    
    def get_auto_scaling_group_name(self) -> Output[str]:
        """Get Auto Scaling Group name."""
        return self.auto_scaling_group.name
    
    def get_auto_scaling_group_arn(self) -> Output[str]:
        """Get Auto Scaling Group ARN."""
        return self.auto_scaling_group.arn
    
    def get_scale_up_policy_arn(self) -> Output[str]:
        """Get scale-up policy ARN."""
        return self.scale_up_policy.arn
    
    def get_scale_down_policy_arn(self) -> Output[str]:
        """Get scale-down policy ARN."""
        return self.scale_down_policy.arn
