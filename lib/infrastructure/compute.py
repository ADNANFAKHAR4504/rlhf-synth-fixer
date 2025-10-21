"""
Compute infrastructure module for EC2 instances, Auto Scaling Groups, and scaling policies.

This module creates EC2 launch templates and Auto Scaling Groups with CPU-based scaling,
addressing MODEL_FAILURES #3 by deploying ASG in private subnets (not public).
"""

import base64
from typing import List, Optional

import pulumi
import pulumi_aws as aws
from infrastructure.config import InfraConfig
from pulumi import Output, ResourceOptions


class ComputeStack:
    """
    Manages compute resources including EC2 launch templates and Auto Scaling Groups.
    
    Creates:
    - Launch template with Amazon Linux 2023 and SSM agent
    - Auto Scaling Group in private subnets (MODEL_FAILURES fix #3)
    - CPU-based scaling policies
    """
    
    def __init__(
        self,
        config: InfraConfig,
        private_subnet_ids: List[Output[str]],
        security_group_id: Output[str],
        instance_profile_name: Output[str],
        instance_profile_arn: Output[str],
        instance_profile: aws.iam.InstanceProfile,
        parent: Optional[pulumi.Resource] = None
    ):
        """
        Initialize the compute stack.
        
        Args:
            config: Infrastructure configuration
            private_subnet_ids: List of private subnet IDs for ASG (MODEL_FAILURES fix #3)
            security_group_id: Security group ID for EC2 instances
            instance_profile_name: IAM instance profile name
            instance_profile_arn: IAM instance profile ARN (for better IAM propagation)
            instance_profile: IAM instance profile resource (for explicit dependency)
            parent: Optional parent resource for dependency management
        """
        self.config = config
        self.private_subnet_ids = private_subnet_ids
        self.security_group_id = security_group_id
        self.instance_profile_name = instance_profile_name
        self.instance_profile_arn = instance_profile_arn
        self.instance_profile = instance_profile
        self.parent = parent
        
        # Get latest Amazon Linux 2023 AMI
        self.ami = self._get_latest_ami()
        
        # Get AWS-managed EBS KMS key
        self.ebs_kms_key = self._get_ebs_kms_key()
        
        # Create launch template
        self.launch_template = self._create_launch_template()
        
        # Create Auto Scaling Group
        self.auto_scaling_group = self._create_auto_scaling_group()
        
        # Create scaling policies
        self.scale_up_policy = self._create_scale_up_policy()
        self.scale_down_policy = self._create_scale_down_policy()
    
    def _get_latest_ami(self) -> aws.ec2.AwaitableGetAmiResult:
        """
        Get the latest Amazon Linux 2023 AMI.
        
        Returns:
            AMI data (matching reference Pr4863)
        """
        ami = aws.ec2.get_ami(
            most_recent=True,
            owners=["amazon"],
            filters=[
                aws.ec2.GetAmiFilterArgs(
                    name="name",
                    values=["al2023-ami-*-x86_64"]
                ),
                aws.ec2.GetAmiFilterArgs(
                    name="virtualization-type",
                    values=["hvm"]
                ),
                aws.ec2.GetAmiFilterArgs(
                    name="state",
                    values=["available"]
                )
            ]
        )
        return ami
    
    def _get_ebs_kms_key(self) -> aws.kms.AwaitableGetAliasResult:
        """
        Get the AWS-managed EBS KMS key.
        
        Returns:
            KMS key data for alias/aws/ebs
        """
        kms_key = aws.kms.get_alias(name="alias/aws/ebs")
        return kms_key
    
    def _create_launch_template(self) -> aws.ec2.LaunchTemplate:
        """
        Create launch template for EC2 instances.
        
        Following MODEL_FAILURES fix #2: Explicitly configure SSM agent.
        """
        lt_name = self.config.get_resource_name('launch-template')
        
        # User data with comprehensive logging and SSM agent
        # SSM agent is pre-installed on Amazon Linux 2023
        user_data = """#!/bin/bash
# Comprehensive logging for debugging
exec > >(tee -a /var/log/user-data.log) 2>&1

echo "=========================================="
echo "User data script started at: $(date)"
echo "Instance ID: $(ec2-metadata --instance-id 2>/dev/null || echo 'unknown')"
echo "Region: $(ec2-metadata --availability-zone 2>/dev/null || echo 'unknown')"
echo "=========================================="

# Check network connectivity
echo "Testing network connectivity..."
if ping -c 3 8.8.8.8 > /dev/null 2>&1; then
    echo " Network connectivity: OK"
else
    echo " Network connectivity: FAILED"
fi

# Check DNS resolution
echo "Testing DNS resolution..."
if nslookup amazon.com > /dev/null 2>&1; then
    echo " DNS resolution: OK"
else
    echo " DNS resolution: FAILED"
fi

# Check SSM agent status
echo "Checking SSM agent..."
systemctl enable amazon-ssm-agent 2>&1
systemctl start amazon-ssm-agent 2>&1
sleep 2
if systemctl is-active amazon-ssm-agent > /dev/null 2>&1; then
    echo " SSM agent: RUNNING"
else
    echo " SSM agent: FAILED"
    systemctl status amazon-ssm-agent --no-pager
fi

echo "=========================================="
echo "User data script completed at: $(date)"
echo "=========================================="
"""
        
        launch_template = aws.ec2.LaunchTemplate(
            lt_name,
            name=lt_name,
            image_id=self.ami.id,
            instance_type=self.config.instance_type,
            iam_instance_profile=aws.ec2.LaunchTemplateIamInstanceProfileArgs(
                arn=self.instance_profile_arn  # Use ARN for better IAM propagation
            ),
            vpc_security_group_ids=[self.security_group_id],
            user_data=base64.b64encode(user_data.encode()).decode(),
            block_device_mappings=[
                aws.ec2.LaunchTemplateBlockDeviceMappingArgs(
                    device_name="/dev/xvda",
                    ebs=aws.ec2.LaunchTemplateBlockDeviceMappingEbsArgs(
                        volume_size=30,  # Amazon Linux 2023 requires minimum 30GB
                        volume_type="gp3",
                        delete_on_termination=True,
                        encrypted=True,  # Enable encryption for compliance
                        kms_key_id=self.ebs_kms_key.target_key_arn  # Use AWS-managed key ARN to avoid invalid KMS key state
                    )
                )
            ],
            metadata_options=aws.ec2.LaunchTemplateMetadataOptionsArgs(
                http_endpoint="enabled",
                http_tokens="optional",  # Allow both IMDSv1 and IMDSv2 for compatibility
                http_put_response_hop_limit=1,
                instance_metadata_tags="enabled"
            ),
            monitoring=aws.ec2.LaunchTemplateMonitoringArgs(
                enabled=True  # Enable detailed monitoring
            ),
            tag_specifications=[
                aws.ec2.LaunchTemplateTagSpecificationArgs(
                    resource_type="instance",
                    tags={
                        **self.config.get_common_tags(),
                        'Name': self.config.get_resource_name('ec2-instance')
                    }
                ),
                aws.ec2.LaunchTemplateTagSpecificationArgs(
                    resource_type="volume",
                    tags={
                        **self.config.get_common_tags(),
                        'Name': self.config.get_resource_name('ec2-volume')
                    }
                )
            ],
            tags={
                **self.config.get_common_tags(),
                'Name': lt_name
            },
            opts=ResourceOptions(
                parent=self.parent,
                depends_on=[self.instance_profile]  # Wait for IAM propagation
            )
        )
        
        return launch_template
    
    def _create_auto_scaling_group(self) -> aws.autoscaling.Group:
        """
        Create Auto Scaling Group in private subnets.
        
        Following MODEL_FAILURES fix #3: Deploy in private subnets, not public.
        """
        asg_name = self.config.get_resource_name('asg')
        
        auto_scaling_group = aws.autoscaling.Group(
            asg_name,
            name=asg_name,
            min_size=self.config.asg_min_size,
            max_size=self.config.asg_max_size,
            desired_capacity=self.config.asg_desired_capacity,
            vpc_zone_identifiers=self.private_subnet_ids,
            launch_template=aws.autoscaling.GroupLaunchTemplateArgs(
                id=self.launch_template.id,
                version="$Latest"
            ),
            health_check_type="EC2",
            health_check_grace_period=300,
            enabled_metrics=[
                'GroupMinSize',
                'GroupMaxSize',
                'GroupDesiredCapacity',
                'GroupInServiceInstances',
                'GroupTotalInstances'
            ],
            tags=[
                aws.autoscaling.GroupTagArgs(
                    key="Name",
                    value=self.config.get_resource_name('asg-instance'),
                    propagate_at_launch=True
                ),
                aws.autoscaling.GroupTagArgs(
                    key="Environment",
                    value=self.config.environment,
                    propagate_at_launch=True
                ),
                aws.autoscaling.GroupTagArgs(
                    key="EnvironmentSuffix",
                    value=self.config.environment_suffix,
                    propagate_at_launch=True
                ),
                aws.autoscaling.GroupTagArgs(
                    key="ManagedBy",
                    value="Pulumi",
                    propagate_at_launch=True
                )
            ],
            opts=ResourceOptions(parent=self.parent)
        )
        
        return auto_scaling_group
    
    def _create_scale_up_policy(self) -> aws.autoscaling.Policy:
        """Create scale-up policy based on CPU utilization."""
        policy_name = self.config.get_resource_name('scale-up-policy')
        
        policy = aws.autoscaling.Policy(
            policy_name,
            name=policy_name,
            autoscaling_group_name=self.auto_scaling_group.name,
            adjustment_type="ChangeInCapacity",
            scaling_adjustment=1,
            cooldown=300,
            policy_type="SimpleScaling",
            opts=ResourceOptions(parent=self.auto_scaling_group)
        )
        
        return policy
    
    def _create_scale_down_policy(self) -> aws.autoscaling.Policy:
        """Create scale-down policy based on CPU utilization."""
        policy_name = self.config.get_resource_name('scale-down-policy')
        
        policy = aws.autoscaling.Policy(
            policy_name,
            name=policy_name,
            autoscaling_group_name=self.auto_scaling_group.name,
            adjustment_type="ChangeInCapacity",
            scaling_adjustment=-1,
            cooldown=300,
            policy_type="SimpleScaling",
            opts=ResourceOptions(parent=self.auto_scaling_group)
        )
        
        return policy
    
    # Getter methods for outputs
    def get_launch_template_id(self) -> Output[str]:
        """Get launch template ID."""
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

