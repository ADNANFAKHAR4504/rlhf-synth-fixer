"""
Security infrastructure module for security groups and network access control.

This module creates security groups with restricted access following the principle
of least privilege, specifically for EC2 instances accessed via AWS Systems Manager.
"""

from typing import Optional

import pulumi
import pulumi_aws as aws
from infrastructure.config import InfraConfig
from pulumi import Output, ResourceOptions


class SecurityStack:
    """
    Manages security groups for the infrastructure.
    
    Creates security groups with restricted access:
    - EC2 security group with SSM access restricted to authorized IPs
    - Proper egress rules for outbound traffic
    """
    
    def __init__(
        self,
        config: InfraConfig,
        vpc_id: Output[str],
        parent: Optional[pulumi.Resource] = None
    ):
        """
        Initialize the security stack.
        
        Args:
            config: Infrastructure configuration
            vpc_id: VPC ID where security groups will be created
            parent: Optional parent resource for dependency management
        """
        self.config = config
        self.vpc_id = vpc_id
        self.parent = parent
        
        # Create security groups
        self.ec2_security_group = self._create_ec2_security_group()
    
    def _create_ec2_security_group(self) -> aws.ec2.SecurityGroup:
        """
        Create security group for EC2 instances with restricted access.
        
         Restrict access to authorized IPs only.
        """
        sg_name = self.config.get_resource_name('ec2-sg')
        
        # Create ingress rules for authorized IP ranges only
        ingress_rules = []
        for ip_range in self.config.authorized_ip_ranges:
            ingress_rules.append(
                aws.ec2.SecurityGroupIngressArgs(
                    description=f"HTTPS for SSM from {ip_range}",
                    from_port=443,
                    to_port=443,
                    protocol="tcp",
                    cidr_blocks=[ip_range]
                )
            )
        
        security_group = aws.ec2.SecurityGroup(
            sg_name,
            name=sg_name,
            description="Security group for EC2 instances with SSM access",
            vpc_id=self.vpc_id,
            ingress=ingress_rules,
            egress=[
                # Allow all outbound traffic for updates, SSM, and application needs
                aws.ec2.SecurityGroupEgressArgs(
                    description="Allow all outbound traffic",
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            tags={
                **self.config.get_common_tags(),
                'Name': sg_name
            },
            opts=ResourceOptions(parent=self.parent)
        )
        
        return security_group
    
    # Getter methods for outputs
    def get_ec2_security_group_id(self) -> Output[str]:
        """Get EC2 security group ID."""
        return self.ec2_security_group.id

