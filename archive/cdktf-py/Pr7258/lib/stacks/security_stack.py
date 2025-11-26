"""Security Stack - Secrets Manager, WAF, and Security Groups."""

from typing import Dict, List, Any
from cdktf import Fn
from constructs import Construct
from cdktf_cdktf_provider_aws.secretsmanager_secret import SecretsmanagerSecret
from cdktf_cdktf_provider_aws.secretsmanager_secret_version import SecretsmanagerSecretVersion
from cdktf_cdktf_provider_aws.secretsmanager_secret_rotation import SecretsmanagerSecretRotation
from cdktf_cdktf_provider_aws.wafv2_web_acl import Wafv2WebAcl, Wafv2WebAclRule
from cdktf_cdktf_provider_aws.security_group import SecurityGroup, SecurityGroupIngress, SecurityGroupEgress
from cdktf_cdktf_provider_aws.security_group_rule import SecurityGroupRule
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.lambda_function import LambdaFunction
from cdktf_cdktf_provider_aws.lambda_permission import LambdaPermission


class SecurityConstruct(Construct):
    """Security Construct with Secrets Manager, WAF, and Security Groups."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        vpc_id: str,
        **kwargs: Any
    ) -> None:
        """Initialize Security construct.

        Args:
            scope: CDK construct scope
            construct_id: Unique identifier for the construct
            environment_suffix: Environment suffix for resource naming
            vpc_id: VPC ID for security groups
            **kwargs: Additional keyword arguments
        """
        super().__init__(scope, construct_id)

        self.environment_suffix = environment_suffix
        self.vpc_id = vpc_id

        # Create Secrets Manager secret for database credentials
        self.db_secret = SecretsmanagerSecret(
            self,
            f"db-secret-{environment_suffix}",
            name=f"payment-db-credentials-{environment_suffix}",
            description="Database credentials for payment processing system",
            recovery_window_in_days=0,  # Allow immediate deletion for testing
            tags={
                "Name": f"payment-db-secret-{environment_suffix}",
                "Environment": environment_suffix,
                "Project": "payment-migration"
            }
        )

        # Store initial secret value (JSON format)
        initial_secret = Fn.jsonencode({
            "username": "dbadmin",
            "password": "TempPassword123!ChangeMe",
            "engine": "postgres",
            "host": "placeholder",
            "port": 5432,
            "dbname": "payments"
        })

        SecretsmanagerSecretVersion(
            self,
            f"db-secret-version-{environment_suffix}",
            secret_id=self.db_secret.id,
            secret_string=initial_secret
        )

        # IAM role for secret rotation Lambda
        rotation_role = IamRole(
            self,
            f"rotation-role-{environment_suffix}",
            name=f"payment-rotation-role-{environment_suffix}",
            assume_role_policy=Fn.jsonencode({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "lambda.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={
                "Name": f"payment-rotation-role-{environment_suffix}",
                "Environment": environment_suffix
            }
        )

        IamRolePolicyAttachment(
            self,
            f"rotation-policy-{environment_suffix}",
            role=rotation_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        )

        # Create WAF Web ACL
        self.web_acl = Wafv2WebAcl(
            self,
            f"waf-acl-{environment_suffix}",
            name=f"payment-waf-{environment_suffix}",
            description="WAF rules for payment processing API",
            scope="REGIONAL",
            default_action={"allow": {}},
            rule=[
                Wafv2WebAclRule(
                    name="RateLimitRule",
                    priority=1,
                    action={"block": {}},
                    statement={
                        "rate_based_statement": {
                            "limit": 1000,
                            "aggregate_key_type": "IP"
                        }
                    },
                    visibility_config={
                        "cloudwatch_metrics_enabled": True,
                        "metric_name": "RateLimitRule",
                        "sampled_requests_enabled": True
                    }
                ),
                Wafv2WebAclRule(
                    name="SQLInjectionRule",
                    priority=2,
                    action={"block": {}},
                    statement={
                        "sqli_match_statement": {
                            "field_to_match": {
                                "body": {
                                    "oversize_handling": "CONTINUE"
                                }
                            },
                            "text_transformation": [{
                                "priority": 0,
                                "type": "URL_DECODE"
                            }]
                        }
                    },
                    visibility_config={
                        "cloudwatch_metrics_enabled": True,
                        "metric_name": "SQLInjectionRule",
                        "sampled_requests_enabled": True
                    }
                )
            ],
            visibility_config={
                "cloudwatch_metrics_enabled": True,
                "metric_name": f"payment-waf-{environment_suffix}",
                "sampled_requests_enabled": True
            },
            tags={
                "Name": f"payment-waf-{environment_suffix}",
                "Environment": environment_suffix
            }
        )

        # Security Group for ALB
        self.alb_sg = SecurityGroup(
            self,
            f"alb-sg-{environment_suffix}",
            name=f"payment-alb-sg-{environment_suffix}",
            description="Security group for Application Load Balancer",
            vpc_id=vpc_id,
            ingress=[
                SecurityGroupIngress(
                    from_port=443,
                    to_port=443,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"],
                    description="HTTPS from anywhere"
                ),
                SecurityGroupIngress(
                    from_port=80,
                    to_port=80,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"],
                    description="HTTP from anywhere"
                )
            ],
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound traffic"
                )
            ],
            tags={
                "Name": f"payment-alb-sg-{environment_suffix}",
                "Environment": environment_suffix
            }
        )

        # Security Group for Lambda functions
        self.lambda_sg = SecurityGroup(
            self,
            f"lambda-sg-{environment_suffix}",
            name=f"payment-lambda-sg-{environment_suffix}",
            description="Security group for Lambda functions",
            vpc_id=vpc_id,
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound traffic"
                )
            ],
            tags={
                "Name": f"payment-lambda-sg-{environment_suffix}",
                "Environment": environment_suffix
            }
        )

        # Security Group for RDS
        self.rds_sg = SecurityGroup(
            self,
            f"rds-sg-{environment_suffix}",
            name=f"payment-rds-sg-{environment_suffix}",
            description="Security group for Aurora PostgreSQL cluster",
            vpc_id=vpc_id,
            ingress=[
                SecurityGroupIngress(
                    from_port=5432,
                    to_port=5432,
                    protocol="tcp",
                    security_groups=[],  # Will be updated after creation
                    description="PostgreSQL from Lambda"
                )
            ],
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound traffic"
                )
            ],
            tags={
                "Name": f"payment-rds-sg-{environment_suffix}",
                "Environment": environment_suffix
            }
        )

        # Add ingress rule to RDS SG allowing Lambda SG
        SecurityGroupRule(
            self,
            f"rds-ingress-lambda-{environment_suffix}",
            type="ingress",
            from_port=5432,
            to_port=5432,
            protocol="tcp",
            security_group_id=self.rds_sg.id,
            source_security_group_id=self.lambda_sg.id,
            description="PostgreSQL from Lambda"
        )

        # Security Group for DMS
        self.dms_sg = SecurityGroup(
            self,
            f"dms-sg-{environment_suffix}",
            name=f"payment-dms-sg-{environment_suffix}",
            description="Security group for DMS replication instance",
            vpc_id=vpc_id,
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound traffic"
                )
            ],
            tags={
                "Name": f"payment-dms-sg-{environment_suffix}",
                "Environment": environment_suffix
            }
        )

        # Add ingress rule to RDS SG allowing DMS SG
        SecurityGroupRule(
            self,
            f"rds-ingress-dms-{environment_suffix}",
            type="ingress",
            from_port=5432,
            to_port=5432,
            protocol="tcp",
            security_group_id=self.rds_sg.id,
            source_security_group_id=self.dms_sg.id,
            description="PostgreSQL from DMS"
        )

    def get_db_secret_arn(self) -> str:
        """Get database secret ARN."""
        return self.db_secret.arn

    def get_web_acl_arn(self) -> str:
        """Get WAF Web ACL ARN."""
        return self.web_acl.arn

    def get_alb_sg_id(self) -> str:
        """Get ALB security group ID."""
        return self.alb_sg.id

    def get_lambda_sg_id(self) -> str:
        """Get Lambda security group ID."""
        return self.lambda_sg.id

    def get_rds_sg_id(self) -> str:
        """Get RDS security group ID."""
        return self.rds_sg.id

    def get_dms_sg_id(self) -> str:
        """Get DMS security group ID."""
        return self.dms_sg.id
