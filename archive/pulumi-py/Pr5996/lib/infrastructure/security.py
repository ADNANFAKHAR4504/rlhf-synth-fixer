"""
Security infrastructure module.

This module creates security groups with proper ingress/egress rules.
"""

import pulumi_aws as aws
from pulumi import Output


class SecurityStack:
    """
    Security stack that creates security groups.
    
    Creates:
    - EC2 security group with SSH access from specified CIDR
    - Proper egress rules
    """
    
    def __init__(self, config, provider_manager, vpc_id, parent=None):
        """
        Initialize the security stack.
        
        Args:
            config: InfraConfig instance
            provider_manager: AWSProviderManager instance
            vpc_id: VPC ID to create security groups in
            parent: Optional parent resource
        """
        self.config = config
        self.provider_manager = provider_manager
        self.vpc_id = vpc_id
        self.parent = parent
        
        # Create EC2 security group
        self.ec2_security_group = self._create_ec2_security_group()
    
    def _create_ec2_security_group(self) -> aws.ec2.SecurityGroup:
        """
        Create security group for EC2 instances.
        
        Allows SSH access from specified CIDR and all outbound traffic.
        
        Returns:
            Security group resource
        """
        security_group = aws.ec2.SecurityGroup(
            'ec2-security-group',
            vpc_id=self.vpc_id,
            description=f'Security group for {self.config.project_name} EC2 instances',
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol='tcp',
                    from_port=22,
                    to_port=22,
                    cidr_blocks=[self.config.ssh_allowed_cidr],
                    description='SSH access from specified CIDR'
                )
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol='-1',
                    from_port=0,
                    to_port=0,
                    cidr_blocks=['0.0.0.0/0'],
                    description='Allow all outbound traffic'
                )
            ],
            tags=self.config.get_tags_for_resource(
                'SecurityGroup',
                Name=self.config.get_resource_name('ec2-sg')
            ),
            opts=self.provider_manager.get_resource_options(parent=self.parent)
        )
        
        return security_group
    
    def get_ec2_security_group_id(self) -> Output[str]:
        """Get EC2 security group ID."""
        return self.ec2_security_group.id

