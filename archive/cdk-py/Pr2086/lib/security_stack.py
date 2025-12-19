"""Security Stack with IAM roles and Security Groups."""

from aws_cdk import (
    NestedStack,
    aws_iam as iam,
    aws_ec2 as ec2,
)
from constructs import Construct


class SecurityStack(NestedStack):
    """Creates security groups and IAM roles for the web application."""
    
    def __init__(self, scope: Construct, construct_id: str, vpc: ec2.Vpc, environment_suffix: str = "dev", **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)
        self.environment_suffix = environment_suffix
        
        self.vpc = vpc
        
        # Create security groups
        self._create_security_groups()
        
        # Create IAM roles
        self._create_iam_roles()
    
    def _create_security_groups(self):
        """Create security groups for different tiers."""
        
        # ALB Security Group
        self.alb_security_group = ec2.SecurityGroup(
            self, "prod-alb-sg",
            vpc=self.vpc,
            description="Security group for Application Load Balancer",
            allow_all_outbound=True,
        )
        
        self.alb_security_group.add_ingress_rule(
            peer=ec2.Peer.any_ipv4(),
            connection=ec2.Port.tcp(80),
            description="Allow HTTP traffic"
        )
        
        self.alb_security_group.add_ingress_rule(
            peer=ec2.Peer.any_ipv4(),
            connection=ec2.Port.tcp(443),
            description="Allow HTTPS traffic"
        )
        
        # Web Server Security Group
        self.web_security_group = ec2.SecurityGroup(
            self, "prod-web-sg",
            vpc=self.vpc,
            description="Security group for web servers",
            allow_all_outbound=True,
        )
        
        self.web_security_group.add_ingress_rule(
            peer=self.alb_security_group,
            connection=ec2.Port.tcp(80),
            description="Allow traffic from ALB"
        )
        
        self.web_security_group.add_ingress_rule(
            peer=ec2.Peer.any_ipv4(),
            connection=ec2.Port.tcp(22),
            description="Allow SSH access"
        )
        
        # Database Security Group
        self.db_security_group = ec2.SecurityGroup(
            self, "prod-db-sg",
            vpc=self.vpc,
            description="Security group for RDS database",
            allow_all_outbound=False,
        )
        
        self.db_security_group.add_ingress_rule(
            peer=self.web_security_group,
            connection=ec2.Port.tcp(3306),
            description="Allow MySQL access from web servers"
        )
    
    def _create_iam_roles(self):
        """Create IAM roles with least privilege principle."""
        
        # EC2 Instance Role
        self.ec2_role = iam.Role(
            self, "prod-ec2-role",
            assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "AmazonSSMManagedInstanceCore"
                ),
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "CloudWatchAgentServerPolicy"
                ),
            ],
        )
        
        # Add custom policy for S3 access
        self.ec2_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "s3:GetObject",
                    "s3:PutObject",
                    "s3:DeleteObject",
                ],
                resources=[
                    "arn:aws:s3:::prod-static-assets/*",
                ],
            )
        )
        
        self.instance_profile = iam.InstanceProfile(
            self, "prod-ec2-instance-profile",
            role=self.ec2_role,
        )