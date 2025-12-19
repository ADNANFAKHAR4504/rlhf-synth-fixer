"""tap_stack.py
This module defines the TapStack class, which serves as the main CDK stack for
the disaster recovery infrastructure project.
It orchestrates the instantiation of nested stacks for VPC, KMS, Secrets Manager,
EFS, and RDS with Multi-AZ deployment.
"""

from typing import Optional

import aws_cdk as cdk
from aws_cdk import Tags
from constructs import Construct

# Import nested stacks
from lib.vpc_stack import VPCStack
from lib.kms_stack import KMSStack
from lib.secrets_stack import SecretsStack
from lib.efs_stack import EFSStack
from lib.rds_stack import RDSStack


class TapStackProps(cdk.StackProps):
    """
    TapStackProps defines the properties for the TapStack CDK stack.

    Args:
        environment_suffix (Optional[str]): An optional suffix to identify the
        deployment environment (e.g., 'dev', 'prod').
        **kwargs: Additional keyword arguments passed to the base cdk.StackProps.

    Attributes:
        environment_suffix (Optional[str]): Stores the environment suffix for the stack.
    """

    def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix


class TapStack(cdk.Stack):
    """
    Represents the main CDK stack for the Disaster Recovery infrastructure project.

    This stack orchestrates nested stacks for:
    - VPC with Multi-AZ configuration
    - KMS keys for encryption
    - Secrets Manager for database credentials
    - EFS for transaction log storage
    - RDS Multi-AZ database with automated failover

    The stack ensures high availability with RPO < 1 hour and RTO < 15 minutes,
    and complies with FedRAMP Moderate security controls.

    Args:
        scope (Construct): The parent construct.
        construct_id (str): The unique identifier for this stack.
        props (Optional[TapStackProps]): Optional properties for configuring the
          stack, including environment suffix.
        **kwargs: Additional keyword arguments passed to the CDK Stack.

    Attributes:
        environment_suffix (str): The environment suffix used for resource naming and configuration.
        vpc_stack (VPCStack): The VPC nested stack.
        kms_stack (KMSStack): The KMS nested stack.
        secrets_stack (SecretsStack): The Secrets Manager nested stack.
        efs_stack (EFSStack): The EFS nested stack.
        rds_stack (RDSStack): The RDS nested stack.
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: Optional[TapStackProps] = None,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        # Get environment suffix from props, context, or use 'dev' as default
        environment_suffix = (
            props.environment_suffix if props else None
        ) or self.node.try_get_context('environmentSuffix') or 'dev'

        self.environment_suffix = environment_suffix

        # Add tags to the stack
        Tags.of(self).add("Project", "DisasterRecovery")
        Tags.of(self).add("Environment", environment_suffix)
        Tags.of(self).add("ManagedBy", "CDK")
        Tags.of(self).add("Compliance", "FedRAMP-Moderate")

        # Create VPC Stack
        self.vpc_stack = VPCStack(
            self,
            f"VPCStack-{environment_suffix}",
            environment_suffix=environment_suffix,
        )

        # Create KMS Stack
        self.kms_stack = KMSStack(
            self,
            f"KMSStack-{environment_suffix}",
            environment_suffix=environment_suffix,
        )

        # Create Secrets Manager Stack
        self.secrets_stack = SecretsStack(
            self,
            f"SecretsStack-{environment_suffix}",
            environment_suffix=environment_suffix,
            kms_key=self.kms_stack.secrets_key,
        )

        # Create EFS Stack
        self.efs_stack = EFSStack(
            self,
            f"EFSStack-{environment_suffix}",
            environment_suffix=environment_suffix,
            vpc=self.vpc_stack.vpc,
            security_group=self.vpc_stack.efs_security_group,
            kms_key=self.kms_stack.efs_key,
        )

        # Create RDS Stack
        self.rds_stack = RDSStack(
            self,
            f"RDSStack-{environment_suffix}",
            environment_suffix=environment_suffix,
            vpc=self.vpc_stack.vpc,
            security_group=self.vpc_stack.rds_security_group,
            db_secret=self.secrets_stack.db_secret,
            kms_key=self.kms_stack.rds_key,
        )

        # Dependencies are implicit through constructor parameters
        # KMS keys passed to secrets, EFS, and RDS
        # VPC and security groups passed to EFS and RDS
        # Secret passed to RDS

        # Stack outputs
        cdk.CfnOutput(
            self,
            "StackName",
            value=self.stack_name,
            description="Name of the main stack",
        )

        cdk.CfnOutput(
            self,
            "EnvironmentSuffix",
            value=environment_suffix,
            description="Environment suffix for this deployment",
        )

        cdk.CfnOutput(
            self,
            "VPCId",
            value=self.vpc_stack.vpc.vpc_id,
            description="VPC ID",
        )

        cdk.CfnOutput(
            self,
            "DatabaseEndpoint",
            value=self.rds_stack.database.db_instance_endpoint_address,
            description="RDS Database Endpoint",
        )

        cdk.CfnOutput(
            self,
            "DatabaseSecretArn",
            value=self.secrets_stack.db_secret.secret_arn,
            description="ARN of the database credentials secret",
        )

        cdk.CfnOutput(
            self,
            "EFSFileSystemId",
            value=self.efs_stack.file_system.file_system_id,
            description="EFS File System ID",
        )
