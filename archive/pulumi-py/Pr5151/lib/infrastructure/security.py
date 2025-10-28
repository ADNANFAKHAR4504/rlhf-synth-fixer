"""
Security infrastructure module.

This module creates security groups for EC2 instances with appropriate
ingress and egress rules.
"""
import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions

from .config import InfraConfig


class SecurityStack:
    """
    Creates and manages security groups for EC2 instances.
    
    Security groups allow:
    - Outbound internet access for updates and SSM
    - No inbound SSH (using SSM Session Manager instead)
    """
    
    def __init__(
        self,
        config: InfraConfig,
        vpc_id: Output[str],
        aws_provider: aws.Provider,
        parent: pulumi.ComponentResource = None
    ):
        """
        Initialize the security stack.
        
        Args:
            config: Infrastructure configuration
            vpc_id: VPC ID for security group (Output)
            aws_provider: AWS provider instance
            parent: Parent Pulumi component resource
        """
        self.config = config
        self.vpc_id = vpc_id
        self.aws_provider = aws_provider
        self.parent = parent
        
        # Create security group for EC2 instances
        self.ec2_security_group = self._create_ec2_security_group()
    
    def _create_ec2_security_group(self) -> aws.ec2.SecurityGroup:
        """
        Create security group for EC2 instances.
        
        Allows all outbound traffic for SSM and updates.
        No inbound rules needed as we use SSM Session Manager.
        
        Returns:
            Security Group resource
        """
        sg_name = self.config.get_resource_name('sg-ec2', include_region=False)
        
        security_group = aws.ec2.SecurityGroup(
            sg_name,
            name=sg_name,
            description=f"Security group for EC2 instances in {self.config.environment_suffix} environment",
            vpc_id=self.vpc_id,
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    description="Allow all outbound traffic",
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            tags=self.config.get_tags_for_resource('SecurityGroup', Name=sg_name),
            opts=ResourceOptions(
                provider=self.aws_provider,
                parent=self.parent
            )
        )
        
        return security_group
    
    def get_ec2_security_group_id(self) -> Output[str]:
        """Get EC2 security group ID."""
        return self.ec2_security_group.id

