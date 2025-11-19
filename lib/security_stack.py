"""security_stack.py
Security resources: KMS keys, Secrets Manager, and Security Groups.
"""

import aws_cdk as cdk
from constructs import Construct
from aws_cdk import (
    aws_ec2 as ec2, aws_kms as kms, aws_secretsmanager as secretsmanager,
    NestedStack, RemovalPolicy
)


class SecurityStackProps:
    """Properties for SecurityStack."""
    def __init__(self, environment_suffix: str, vpc: ec2.Vpc):
        self.environment_suffix = environment_suffix
        self.vpc = vpc


class SecurityStack(NestedStack):
    """Creates KMS keys, secrets, and security groups."""

    def __init__(self, scope: Construct, construct_id: str, props: SecurityStackProps, **kwargs):
        super().__init__(scope, construct_id, **kwargs)

        env_suffix = props.environment_suffix

        # KMS key
        self.kms_key = kms.Key(
            self, f"PaymentProcessingKey{env_suffix}",
            description=f"KMS key for payment processing system {env_suffix}",
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.DESTROY
        )

        # Database secret
        self.db_secret = secretsmanager.Secret(
            self, f"DatabaseSecret{env_suffix}",
            secret_name=f"payment-processing-db-secret-{env_suffix}",
            generate_secret_string=secretsmanager.SecretStringGenerator(
                secret_string_template='{"username": "dbadmin"}',
                generate_string_key="password",
                exclude_characters='/@" \\\'',
                password_length=32
            ),
            encryption_key=self.kms_key,
            removal_policy=RemovalPolicy.DESTROY
        )

        # API secret
        self.api_secret = secretsmanager.Secret(
            self, f"APISecret{env_suffix}",
            secret_name=f"payment-processing-api-secret-{env_suffix}",
            generate_secret_string=secretsmanager.SecretStringGenerator(
                secret_string_template='{"api_key": "placeholder"}',
                generate_string_key="secret_key",
                exclude_characters='/@" \\\'',
                password_length=64
            ),
            encryption_key=self.kms_key,
            removal_policy=RemovalPolicy.DESTROY
        )

        # ALB Security Group
        self.alb_security_group = ec2.SecurityGroup(
            self, f"ALBSecurityGroup{env_suffix}",
            vpc=props.vpc,
            description=f"Security group for ALB {env_suffix}",
            security_group_name=f"payment-alb-sg-{env_suffix}",
            allow_all_outbound=True
        )
        self.alb_security_group.add_ingress_rule(ec2.Peer.any_ipv4(), ec2.Port.tcp(80), "HTTP")
        self.alb_security_group.add_ingress_rule(ec2.Peer.any_ipv4(), ec2.Port.tcp(443), "HTTPS")

        # ECS Security Group
        self.ecs_security_group = ec2.SecurityGroup(
            self, f"ECSSecurityGroup{env_suffix}",
            vpc=props.vpc,
            description=f"Security group for ECS tasks {env_suffix}",
            security_group_name=f"payment-ecs-sg-{env_suffix}",
            allow_all_outbound=True
        )
        self.ecs_security_group.add_ingress_rule(self.alb_security_group, ec2.Port.all_tcp(), "From ALB")
        self.ecs_security_group.add_ingress_rule(self.ecs_security_group, ec2.Port.all_tcp(), "Inter-service")

        # Database Security Group
        self.database_security_group = ec2.SecurityGroup(
            self, f"DatabaseSecurityGroup{env_suffix}",
            vpc=props.vpc,
            description=f"Security group for database {env_suffix}",
            security_group_name=f"payment-db-sg-{env_suffix}",
            allow_all_outbound=False
        )
        self.database_security_group.add_ingress_rule(self.ecs_security_group, ec2.Port.tcp(5432), "PostgreSQL from ECS")

        cdk.CfnOutput(self, f"KMSKeyId{env_suffix}", value=self.kms_key.key_id)
