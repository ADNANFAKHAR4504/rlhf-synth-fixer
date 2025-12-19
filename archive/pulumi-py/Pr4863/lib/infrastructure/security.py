"""
Security infrastructure module.

This module creates security groups with least-privilege access rules
for ALB and application instances.
"""
import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions

from .config import InfraConfig


class SecurityStack:
    """
    Creates and manages security groups for ALB and application instances.
    """
    
    def __init__(
        self,
        config: InfraConfig,
        vpc_id: Output[str],
        parent: pulumi.ComponentResource
    ):
        """
        Initialize the security stack.
        
        Args:
            config: Infrastructure configuration
            vpc_id: VPC ID
            parent: Parent Pulumi component resource
        """
        self.config = config
        self.vpc_id = vpc_id
        self.parent = parent
        
        # Create security groups
        self.alb_security_group = self._create_alb_security_group()
        self.app_security_group = self._create_app_security_group()
    
    def _create_alb_security_group(self) -> aws.ec2.SecurityGroup:
        """
        Create security group for Application Load Balancer.
        Allows HTTP and HTTPS from internet.
        
        Returns:
            Security Group resource
        """
        sg_name = self.config.get_resource_name('sg-alb')
        
        security_group = aws.ec2.SecurityGroup(
            sg_name,
            name=sg_name,
            description='Security group for Application Load Balancer',
            vpc_id=self.vpc_id,
            tags=self.config.get_tags_for_resource('SecurityGroup', Name=sg_name),
            opts=ResourceOptions(parent=self.parent)
        )
        
        # Ingress rule - HTTP
        aws.ec2.SecurityGroupRule(
            f"{sg_name}-ingress-http",
            type='ingress',
            security_group_id=security_group.id,
            protocol='tcp',
            from_port=80,
            to_port=80,
            cidr_blocks=['0.0.0.0/0'],
            description='Allow HTTP from internet',
            opts=ResourceOptions(parent=security_group)
        )
        
        # Ingress rule - HTTPS
        aws.ec2.SecurityGroupRule(
            f"{sg_name}-ingress-https",
            type='ingress',
            security_group_id=security_group.id,
            protocol='tcp',
            from_port=443,
            to_port=443,
            cidr_blocks=['0.0.0.0/0'],
            description='Allow HTTPS from internet',
            opts=ResourceOptions(parent=security_group)
        )
        
        # Egress rule - Allow all outbound
        aws.ec2.SecurityGroupRule(
            f"{sg_name}-egress-all",
            type='egress',
            security_group_id=security_group.id,
            protocol='-1',
            from_port=0,
            to_port=0,
            cidr_blocks=['0.0.0.0/0'],
            description='Allow all outbound traffic',
            opts=ResourceOptions(parent=security_group)
        )
        
        return security_group
    
    def _create_app_security_group(self) -> aws.ec2.SecurityGroup:
        """
        Create security group for application instances.
        Only allows traffic from ALB security group.
        
        Returns:
            Security Group resource
        """
        sg_name = self.config.get_resource_name('sg-app')
        
        security_group = aws.ec2.SecurityGroup(
            sg_name,
            name=sg_name,
            description='Security group for application instances',
            vpc_id=self.vpc_id,
            tags=self.config.get_tags_for_resource('SecurityGroup', Name=sg_name),
            opts=ResourceOptions(parent=self.parent)
        )
        
        # Ingress rule - HTTP from ALB only
        aws.ec2.SecurityGroupRule(
            f"{sg_name}-ingress-alb",
            type='ingress',
            security_group_id=security_group.id,
            protocol='tcp',
            from_port=80,
            to_port=80,
            source_security_group_id=self.alb_security_group.id,
            description='Allow HTTP from ALB only',
            opts=ResourceOptions(parent=security_group)
        )
        
        # Egress rule - Allow all outbound
        aws.ec2.SecurityGroupRule(
            f"{sg_name}-egress-all",
            type='egress',
            security_group_id=security_group.id,
            protocol='-1',
            from_port=0,
            to_port=0,
            cidr_blocks=['0.0.0.0/0'],
            description='Allow all outbound traffic',
            opts=ResourceOptions(parent=security_group)
        )
        
        return security_group
    
    def get_alb_security_group_id(self) -> Output[str]:
        """Get ALB security group ID."""
        return self.alb_security_group.id
    
    def get_app_security_group_id(self) -> Output[str]:
        """Get application security group ID."""
        return self.app_security_group.id

