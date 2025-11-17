"""Compliance infrastructure including IAM roles and SSM parameters."""
from cdktf import TerraformOutput
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy import IamRolePolicy
from cdktf_cdktf_provider_aws.ssm_parameter import SsmParameter
from constructs import Construct
import json


class ComplianceStack(Construct):
    """Creates IAM roles and SSM parameters with compliance controls."""

    def __init__(
        self,
        scope: Construct,
        id: str,
        environment_suffix: str,
        kms_key_arn: str,
        account_id: str,
        **kwargs
    ):
        super().__init__(scope, id, **kwargs)

        self.environment_suffix = environment_suffix
        self.kms_key_arn = kms_key_arn
        self.account_id = account_id

        # Create IAM role with session limits and external ID
        self._create_iam_roles()

        # Create SSM parameters
        self._create_ssm_parameters()

    def _create_iam_roles(self):
        """Create IAM roles with 1-hour session limits and external ID requirements."""
        # Application role with session limits
        assume_role_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "ec2.amazonaws.com"
                    },
                    "Action": "sts:AssumeRole",
                    "Condition": {
                        "StringEquals": {
                            "sts:ExternalId": f"payment-processing-{self.environment_suffix}"
                        }
                    }
                }
            ]
        }

        self.app_role = IamRole(
            self,
            "app_role",
            name=f"payment-app-role-{self.environment_suffix}",
            assume_role_policy=json.dumps(assume_role_policy),
            max_session_duration=3600,  # 1 hour
            tags={
                "Name": f"payment-app-role-{self.environment_suffix}",
                "CostCenter": "payment-processing",
                "DataClassification": "confidential",
                "ComplianceScope": "pci-dss-level-1"
            }
        )

        # Least privilege policy for application
        app_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "s3:GetObject",
                        "s3:PutObject"
                    ],
                    "Resource": f"arn:aws:s3:::payment-audit-logs-{self.environment_suffix}/*"
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "kms:Decrypt",
                        "kms:GenerateDataKey"
                    ],
                    "Resource": self.kms_key_arn
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "logs:CreateLogStream",
                        "logs:PutLogEvents"
                    ],
                    "Resource": (
                        f"arn:aws:logs:us-east-1:*:log-group:"
                        f"/aws/payment/application-{self.environment_suffix}:*"
                    )
                }
            ]
        }

        IamRolePolicy(
            self,
            "app_role_policy",
            name=f"payment-app-policy-{self.environment_suffix}",
            role=self.app_role.name,
            policy=json.dumps(app_policy)
        )

        # Audit role with session limits
        audit_assume_role_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {
                        "AWS": f"arn:aws:iam::{self.account_id}:root"
                    },
                    "Action": "sts:AssumeRole",
                    "Condition": {
                        "StringEquals": {
                            "sts:ExternalId": f"audit-{self.environment_suffix}"
                        }
                    }
                }
            ]
        }

        self.audit_role = IamRole(
            self,
            "audit_role",
            name=f"payment-audit-role-{self.environment_suffix}",
            assume_role_policy=json.dumps(audit_assume_role_policy),
            max_session_duration=3600,  # 1 hour
            tags={
                "Name": f"payment-audit-role-{self.environment_suffix}",
                "CostCenter": "payment-processing",
                "DataClassification": "confidential",
                "ComplianceScope": "pci-dss-level-1"
            }
        )

        # Read-only audit policy
        audit_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "s3:GetObject",
                        "s3:ListBucket"
                    ],
                    "Resource": [
                        f"arn:aws:s3:::payment-audit-logs-{self.environment_suffix}",
                        f"arn:aws:s3:::payment-audit-logs-{self.environment_suffix}/*"
                    ]
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "logs:FilterLogEvents",
                        "logs:GetLogEvents"
                    ],
                    "Resource": f"arn:aws:logs:us-east-1:*:log-group:/aws/payment/*-{self.environment_suffix}:*"
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "kms:Decrypt"
                    ],
                    "Resource": self.kms_key_arn
                }
            ]
        }

        IamRolePolicy(
            self,
            "audit_role_policy",
            name=f"payment-audit-policy-{self.environment_suffix}",
            role=self.audit_role.name,
            policy=json.dumps(audit_policy)
        )

        # Outputs
        TerraformOutput(
            self,
            "app_role_arn",
            value=self.app_role.arn,
            description="Application IAM role ARN"
        )

        TerraformOutput(
            self,
            "audit_role_arn",
            value=self.audit_role.arn,
            description="Audit IAM role ARN"
        )

    def _create_ssm_parameters(self):
        """Create Systems Manager parameters with KMS encryption."""
        # Application configuration parameter
        self.app_config_param = SsmParameter(
            self,
            "app_config_param",
            name=f"/payment/app/config-{self.environment_suffix}",
            type="SecureString",
            value=json.dumps({
                "environment": f"payment-{self.environment_suffix}",
                "log_level": "INFO",
                "compliance_mode": "pci-dss-level-1"
            }),
            key_id=self.kms_key_arn,
            tags={
                "Name": f"payment-app-config-{self.environment_suffix}",
                "CostCenter": "payment-processing",
                "DataClassification": "confidential",
                "ComplianceScope": "pci-dss-level-1"
            }
        )

        # Database configuration parameter
        self.db_config_param = SsmParameter(
            self,
            "db_config_param",
            name=f"/payment/db/config-{self.environment_suffix}",
            type="SecureString",
            value=json.dumps({
                "retention_days": 2555,
                "backup_enabled": True,
                "encryption_enabled": True
            }),
            key_id=self.kms_key_arn,
            tags={
                "Name": f"payment-db-config-{self.environment_suffix}",
                "CostCenter": "payment-processing",
                "DataClassification": "confidential",
                "ComplianceScope": "pci-dss-level-1"
            }
        )

        # Outputs
        TerraformOutput(
            self,
            "app_config_param_name",
            value=self.app_config_param.name,
            description="Application configuration parameter name"
        )
