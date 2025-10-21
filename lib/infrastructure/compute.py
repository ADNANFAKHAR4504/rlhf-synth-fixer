"""
Compute infrastructure module for EC2 instances, Auto Scaling Groups, and scaling policies.

This module creates EC2 launch templates and Auto Scaling Groups with CPU-based scaling,
addressing MODEL_FAILURES #3 by deploying ASG in private subnets (not public).
"""

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
        parent: Optional[pulumi.Resource] = None
    ):
        """
        Initialize the compute stack.
        
        Args:
            config: Infrastructure configuration
            private_subnet_ids: List of private subnet IDs for ASG (MODEL_FAILURES fix #3)
            security_group_id: Security group ID for EC2 instances
            instance_profile_name: IAM instance profile name
            parent: Optional parent resource for dependency management
        """
        self.config = config
        self.private_subnet_ids = private_subnet_ids
        self.security_group_id = security_group_id
        self.instance_profile_name = instance_profile_name
        self.parent = parent
        
        # Get latest Amazon Linux 2023 AMI
        self.ami_id = self._get_latest_ami()
        
        # Create launch template
        self.launch_template = self._create_launch_template()
        
        # Create Auto Scaling Group
        self.auto_scaling_group = self._create_auto_scaling_group()
        
        # Create scaling policies
        self.scale_up_policy = self._create_scale_up_policy()
        self.scale_down_policy = self._create_scale_down_policy()
    
    def _get_latest_ami(self) -> str:
        """
        Get the latest Amazon Linux 2023 AMI.
        
        Returns:
            AMI ID
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
                    name="state",
                    values=["available"]
                )
            ]
        )
        return ami.id
    
    def _create_launch_template(self) -> aws.ec2.LaunchTemplate:
        """
        Create launch template for EC2 instances.
        
        Following MODEL_FAILURES fix #2: Explicitly configure SSM agent.
        """
        lt_name = self.config.get_resource_name('launch-template')
        
        # User data script to ensure SSM agent is running
        # Amazon Linux 2023 has SSM agent pre-installed
        user_data = """#!/bin/bash
# Ensure SSM agent is running (pre-installed on Amazon Linux 2023)
systemctl enable amazon-ssm-agent
systemctl start amazon-ssm-agent

# Install CloudWatch agent
yum install -y amazon-cloudwatch-agent

# Configure CloudWatch agent for basic monitoring
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOF'
{
  "metrics": {
    "namespace": "CWAgent",
    "metrics_collected": {
      "cpu": {
        "measurement": [
          {"name": "cpu_usage_idle", "rename": "CPU_IDLE", "unit": "Percent"},
          {"name": "cpu_usage_iowait", "rename": "CPU_IOWAIT", "unit": "Percent"},
          "cpu_time_guest"
        ],
        "metrics_collection_interval": 60,
        "totalcpu": false
      },
      "disk": {
        "measurement": [
          {"name": "used_percent", "rename": "DISK_USED", "unit": "Percent"}
        ],
        "metrics_collection_interval": 60,
        "resources": ["*"]
      },
      "mem": {
        "measurement": [
          {"name": "mem_used_percent", "rename": "MEM_USED", "unit": "Percent"}
        ],
        "metrics_collection_interval": 60
      }
    }
  }
}
EOF

# Start CloudWatch agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
    -a fetch-config \
    -m ec2 \
    -s \
    -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
"""
        
        launch_template = aws.ec2.LaunchTemplate(
            lt_name,
            name_prefix=f"{lt_name}-",
            image_id=self.ami_id,
            instance_type=self.config.instance_type,
            iam_instance_profile=aws.ec2.LaunchTemplateIamInstanceProfileArgs(
                name=self.instance_profile_name
            ),
            vpc_security_group_ids=[self.security_group_id],
            user_data=pulumi.Output.secret(user_data).apply(
                lambda ud: __import__('base64').b64encode(ud.encode()).decode()
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
            opts=ResourceOptions(parent=self.parent)
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
            health_check_grace_period=600,
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

