"""IAM roles and policies with Zero Trust principles"""
from typing import Dict, Any
import json
from constructs import Construct
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy import IamRolePolicy
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment


class ZeroTrustIam(Construct):
    """
    Creates IAM roles with Zero Trust security principles.

    This construct implements:
    - Cross-account access roles with external ID and MFA enforcement
    - Least-privilege permissions
    - Session-based temporary credentials
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        account_id: str,
    ):
        super().__init__(scope, construct_id)

        self.environment_suffix = environment_suffix
        self.account_id = account_id

        # Create cross-account access role with MFA and external ID
        self.cross_account_role = self._create_cross_account_role()

        # Create security audit role
        self.security_audit_role = self._create_security_audit_role()

        # Create session manager role for EC2
        self.session_manager_role = self._create_session_manager_role()

    def _create_cross_account_role(self) -> IamRole:
        """Create cross-account access role with MFA and external ID requirements"""

        # Trust policy with MFA and external ID enforcement
        assume_role_policy = {
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
                            "sts:ExternalId": "zero-trust-external-id"
                        },
                        "Bool": {
                            "aws:MultiFactorAuthPresent": "true"
                        }
                    }
                }
            ]
        }

        role = IamRole(
            self,
            "cross_account_role",
            name=f"zero-trust-cross-account-{self.environment_suffix}",
            description="Cross-account access role with MFA and external ID",
            assume_role_policy=json.dumps(assume_role_policy),
            max_session_duration=3600,  # 1 hour session limit
            tags={
                "Name": f"zero-trust-cross-account-{self.environment_suffix}",
                "Environment": self.environment_suffix,
            },
        )

        # Attach least-privilege policy
        policy_document = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Sid": "ReadOnlyAccess",
                    "Effect": "Allow",
                    "Action": [
                        "ec2:Describe*",
                        "s3:List*",
                        "s3:Get*",
                        "rds:Describe*",
                        "cloudwatch:Get*",
                        "cloudwatch:List*",
                        "logs:Get*",
                        "logs:Describe*",
                    ],
                    "Resource": "*"
                }
            ]
        }

        IamRolePolicy(
            self,
            "cross_account_policy",
            name=f"zero-trust-cross-account-policy-{self.environment_suffix}",
            role=role.id,
            policy=json.dumps(policy_document),
        )

        return role

    def _create_security_audit_role(self) -> IamRole:
        """Create security audit role for compliance monitoring"""

        assume_role_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {
                        "Service": [
                            "config.amazonaws.com",
                            "securityhub.amazonaws.com",
                        ]
                    },
                    "Action": "sts:AssumeRole"
                }
            ]
        }

        role = IamRole(
            self,
            "security_audit_role",
            name=f"zero-trust-security-audit-{self.environment_suffix}",
            description="Security audit role for compliance services",
            assume_role_policy=json.dumps(assume_role_policy),
            tags={
                "Name": f"zero-trust-security-audit-{self.environment_suffix}",
                "Environment": self.environment_suffix,
            },
        )

        # Attach AWS managed policy for Config
        IamRolePolicyAttachment(
            self,
            "config_role_attachment",
            role=role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWS_ConfigRole",
        )

        # Attach Security Hub managed policy
        IamRolePolicyAttachment(
            self,
            "security_hub_attachment",
            role=role.name,
            policy_arn="arn:aws:iam::aws:policy/AWSSecurityHubReadOnlyAccess",
        )

        return role

    def _create_session_manager_role(self) -> IamRole:
        """Create IAM role for Systems Manager Session Manager"""

        assume_role_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "ec2.amazonaws.com"
                    },
                    "Action": "sts:AssumeRole"
                }
            ]
        }

        role = IamRole(
            self,
            "session_manager_role",
            name=f"zero-trust-session-manager-{self.environment_suffix}",
            description="IAM role for EC2 instances with Session Manager access",
            assume_role_policy=json.dumps(assume_role_policy),
            tags={
                "Name": f"zero-trust-session-manager-{self.environment_suffix}",
                "Environment": self.environment_suffix,
            },
        )

        # Attach managed policy for Session Manager
        IamRolePolicyAttachment(
            self,
            "ssm_managed_instance_core",
            role=role.name,
            policy_arn="arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore",
        )

        return role
