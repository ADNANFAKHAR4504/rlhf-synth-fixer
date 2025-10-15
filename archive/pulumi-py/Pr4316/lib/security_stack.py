"""
Security Stack - Security groups and KMS encryption keys.

This module creates security groups for network access control and
KMS keys for encryption at rest, following PCI-DSS security requirements.
"""

from typing import Optional
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions


class SecurityStackArgs:
    """
    Arguments for Security Stack.

    Args:
        environment_suffix: Environment identifier for resource naming
        vpc_id: VPC ID where security groups will be created
    """
    def __init__(
        self,
        environment_suffix: str,
        vpc_id: pulumi.Output
    ):
        self.environment_suffix = environment_suffix
        self.vpc_id = vpc_id


class SecurityStack(pulumi.ComponentResource):
    """
    Security Component Resource for access control and encryption.

    Creates:
    - KMS keys for RDS encryption with automatic rotation
    - Security group for ECS tasks
    - Security group for RDS database
    - Least privilege security rules
    """

    def __init__(
        self,
        name: str,
        args: SecurityStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('custom:security:SecurityStack', name, None, opts)

        # PCI-DSS Requirement: Encryption key management with rotation
        self.rds_kms_key = aws.kms.Key(
            f"rds-kms-key-{args.environment_suffix}",
            description=f"KMS key for RDS encryption - {args.environment_suffix}",
            enable_key_rotation=True,
            tags={
                "Name": f"rds-kms-key-{args.environment_suffix}",
                "Environment": args.environment_suffix,
                "Purpose": "rds-encryption",
            },
            opts=ResourceOptions(parent=self)
        )

        self.rds_kms_key_alias = aws.kms.Alias(
            f"rds-kms-alias-{args.environment_suffix}",
            name=f"alias/rds-{args.environment_suffix}",
            target_key_id=self.rds_kms_key.key_id,
            opts=ResourceOptions(parent=self)
        )

        # Security group for ECS tasks
        # PCI-DSS Requirement: Network segmentation and access control
        self.ecs_security_group = aws.ec2.SecurityGroup(
            f"ecs-sg-{args.environment_suffix}",
            name=f"ecs-sg-{args.environment_suffix}",
            description="Security group for ECS payment processor tasks",
            vpc_id=args.vpc_id,
            # Egress rules - allow outbound to RDS and AWS services
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound traffic for AWS service communication",
                )
            ],
            tags={
                "Name": f"ecs-sg-{args.environment_suffix}",
                "Environment": args.environment_suffix,
                "Service": "ecs-tasks",
            },
            opts=ResourceOptions(parent=self)
        )

        # Security group for RDS
        # PCI-DSS Requirement: Database access restricted to application tier only
        self.rds_security_group = aws.ec2.SecurityGroup(
            f"rds-sg-{args.environment_suffix}",
            name=f"rds-sg-{args.environment_suffix}",
            description="Security group for RDS payment database",
            vpc_id=args.vpc_id,
            tags={
                "Name": f"rds-sg-{args.environment_suffix}",
                "Environment": args.environment_suffix,
                "Service": "rds",
            },
            opts=ResourceOptions(parent=self)
        )

        # Ingress rule for RDS - only allow traffic from ECS security group
        # PCI-DSS Requirement: Least privilege access to cardholder data
        self.rds_ingress_rule = aws.ec2.SecurityGroupRule(
            f"rds-ingress-from-ecs-{args.environment_suffix}",
            type="ingress",
            from_port=5432,
            to_port=5432,
            protocol="tcp",
            security_group_id=self.rds_security_group.id,
            source_security_group_id=self.ecs_security_group.id,
            description="Allow PostgreSQL access from ECS tasks only",
            opts=ResourceOptions(parent=self)
        )

        # Register outputs
        self.register_outputs({
            "rds_kms_key_id": self.rds_kms_key.key_id,
            "rds_kms_key_arn": self.rds_kms_key.arn,
            "ecs_security_group_id": self.ecs_security_group.id,
            "rds_security_group_id": self.rds_security_group.id,
        })
