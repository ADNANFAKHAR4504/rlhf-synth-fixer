"""
Auto Scaling and EC2 compute resources.

This module creates Auto Scaling Groups with proper health checks
and addresses the recovery requirements.
"""

import base64
from typing import List

import pulumi
import pulumi_aws as aws
from pulumi import Output

from .config import Config


class ComputeStack:
    """
    Manages EC2 instances and Auto Scaling groups.
    
    Maintains instance count during rollback operations.
    """
    
    def __init__(
        self,
        config: Config,
        vpc_id: str,
        subnet_ids: List[str],
        instance_role: aws.iam.Role
    ):
        """
        Initialize compute stack.
        
        Args:
            config: Configuration object
            vpc_id: VPC ID
            subnet_ids: List of subnet IDs
            instance_role: IAM role for instances
        """
        self.config = config
        self.vpc_id = vpc_id
        self.subnet_ids = subnet_ids
        self.instance_role = instance_role
        
        self.security_group = self._create_security_group()
        self.instance_profile = self._create_instance_profile()
        self.launch_template = self._create_launch_template()
        self.asg = self._create_auto_scaling_group()
    
    def _create_security_group(self) -> aws.ec2.SecurityGroup:
        """Create security group for instances."""
        sg_name = self.config.get_resource_name('instance-sg')
        
        sg = aws.ec2.SecurityGroup(
            'instance-security-group',
            name=sg_name,
            description='Security group for application instances',
            vpc_id=self.vpc_id,
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol='tcp',
                    from_port=80,
                    to_port=80,
                    cidr_blocks=['10.0.0.0/8']
                ),
                aws.ec2.SecurityGroupIngressArgs(
                    protocol='tcp',
                    from_port=443,
                    to_port=443,
                    cidr_blocks=['10.0.0.0/8']
                )
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol='-1',
                    from_port=0,
                    to_port=0,
                    cidr_blocks=['0.0.0.0/0']
                )
            ],
            tags=self.config.get_tags({'Name': sg_name})
        )
        
        return sg
    
    def _create_instance_profile(self) -> aws.iam.InstanceProfile:
        """Create IAM instance profile."""
        profile_name = self.config.get_resource_name('instance-profile')
        
        profile = aws.iam.InstanceProfile(
            'instance-profile',
            name=profile_name,
            role=self.instance_role.name
        )
        
        return profile
    
    def _create_launch_template(self) -> aws.ec2.LaunchTemplate:
        """Create launch template for Auto Scaling."""
        template_name = self.config.get_resource_name('launch-template')
        
        # User data for CloudWatch agent
        user_data_script = """#!/bin/bash
yum update -y
yum install -y amazon-cloudwatch-agent
echo "Instance initialized"
"""
        user_data_encoded = base64.b64encode(user_data_script.encode()).decode()
        
        # Get latest Amazon Linux 2023 AMI (free tier eligible)
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
            ]
        )
        
        template = aws.ec2.LaunchTemplate(
            'launch-template',
            name_prefix=f"{template_name}-",
            image_id=ami.id,
            instance_type=self.config.instance_type,
            vpc_security_group_ids=[self.security_group.id],
            user_data=user_data_encoded,
            iam_instance_profile=aws.ec2.LaunchTemplateIamInstanceProfileArgs(
                arn=self.instance_profile.arn
            ),
            monitoring=aws.ec2.LaunchTemplateMonitoringArgs(
                enabled=True
            ),
            tag_specifications=[
                aws.ec2.LaunchTemplateTagSpecificationArgs(
                    resource_type='instance',
                    tags=self.config.get_tags({
                        'Name': f"{self.config.app_name}-instance",
                        'Application': self.config.app_name
                    })
                )
            ]
        )
        
        return template
    
    def _create_auto_scaling_group(self) -> aws.autoscaling.Group:
        """Create Auto Scaling group with health checks."""
        asg_name = self.config.get_resource_name('asg')
        
        asg = aws.autoscaling.Group(
            'autoscaling-group',
            name=asg_name,
            vpc_zone_identifiers=self.subnet_ids,
            min_size=self.config.min_instances,
            max_size=self.config.max_instances,
            desired_capacity=self.config.desired_capacity,
            health_check_type='EC2',
            health_check_grace_period=300,
            launch_template=aws.autoscaling.GroupLaunchTemplateArgs(
                id=self.launch_template.id,
                version='$Latest'
            ),
            enabled_metrics=[
                'GroupMinSize',
                'GroupMaxSize',
                'GroupDesiredCapacity',
                'GroupInServiceInstances',
                'GroupTotalInstances'
            ],
            tags=[
                aws.autoscaling.GroupTagArgs(
                    key='Name',
                    value=f"{asg_name}-instance",
                    propagate_at_launch=True
                ),
                aws.autoscaling.GroupTagArgs(
                    key='Application',
                    value=self.config.app_name,
                    propagate_at_launch=True
                ),
                aws.autoscaling.GroupTagArgs(
                    key='Environment',
                    value=self.config.environment_suffix,
                    propagate_at_launch=True
                )
            ]
        )
        
        return asg
    
    def get_asg_name(self) -> Output[str]:
        """
        Get Auto Scaling Group name.
        
        Returns:
            ASG name as Output[str]
        """
        return self.asg.name
    
    def get_asg_arn(self) -> Output[str]:
        """
        Get Auto Scaling Group ARN.
        
        Returns:
            ASG ARN as Output[str]
        """
        return self.asg.arn

