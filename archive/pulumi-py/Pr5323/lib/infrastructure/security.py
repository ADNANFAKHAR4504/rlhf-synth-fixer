"""
Security infrastructure module.

This module creates security groups with strict access controls
to minimize exposure and enforce least-privilege principles.
"""

import pulumi
import pulumi_aws as aws
from infrastructure.aws_provider import AWSProviderManager
from infrastructure.config import InfraConfig
from pulumi import Output, ResourceOptions


class SecurityStack:
    """
    Creates and manages security groups with strict access controls.
    """
    
    def __init__(
        self,
        config: InfraConfig,
        provider_manager: AWSProviderManager,
        vpc_id: Output[str],
        parent: pulumi.ComponentResource
    ):
        """
        Initialize the security stack.
        
        Args:
            config: Infrastructure configuration
            provider_manager: AWS provider manager
            vpc_id: VPC ID
            parent: Parent Pulumi component resource
        """
        self.config = config
        self.provider_manager = provider_manager
        self.vpc_id = vpc_id
        self.parent = parent
        
        # Create security groups
        self.ec2_security_group = self._create_ec2_security_group()
    
    def _create_ec2_security_group(self) -> aws.ec2.SecurityGroup:
        """
        Create security group for EC2 instances.
        
        Returns:
            EC2 Security Group
        """
        sg_name = self.config.get_resource_name('ec2-sg')
        
        security_group = aws.ec2.SecurityGroup(
            sg_name,
            name=sg_name,
            description='Security group for EC2 instances in Auto Scaling Group',
            vpc_id=self.vpc_id,
            tags={
                **self.config.get_tags_for_resource('SecurityGroup'),
                'Name': sg_name
            },
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                parent=self.parent
            )
        )
        
        # Ingress rule: Allow HTTP from within VPC only
        aws.ec2.SecurityGroupRule(
            f"{sg_name}-ingress-http",
            type='ingress',
            from_port=80,
            to_port=80,
            protocol='tcp',
            cidr_blocks=[self.config.vpc_cidr],
            security_group_id=security_group.id,
            description='Allow HTTP traffic from within VPC',
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                parent=security_group
            )
        )
        
        # Ingress rule: Allow HTTPS from within VPC only
        aws.ec2.SecurityGroupRule(
            f"{sg_name}-ingress-https",
            type='ingress',
            from_port=443,
            to_port=443,
            protocol='tcp',
            cidr_blocks=[self.config.vpc_cidr],
            security_group_id=security_group.id,
            description='Allow HTTPS traffic from within VPC',
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                parent=security_group
            )
        )
        
        # Egress rule: Allow all outbound traffic
        aws.ec2.SecurityGroupRule(
            f"{sg_name}-egress-all",
            type='egress',
            from_port=0,
            to_port=0,
            protocol='-1',
            cidr_blocks=['0.0.0.0/0'],
            security_group_id=security_group.id,
            description='Allow all outbound traffic',
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                parent=security_group
            )
        )
        
        return security_group
    
    # Getter methods
    
    def get_ec2_security_group_id(self) -> Output[str]:
        """Get EC2 security group ID."""
        return self.ec2_security_group.id
