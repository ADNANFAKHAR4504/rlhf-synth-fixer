from typing import Dict
import json
from constructs import Construct


class ZeroTrustCompliance(Construct):
    """
    Provides SCP policy documents for Zero Trust compliance.

    Note: SCPs are applied at the AWS Organizations level, not via CDKTF.
    This construct provides the policy documents for manual application.
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
    ):
        super().__init__(scope, construct_id)

        self.environment_suffix = environment_suffix

        # Generate SCP policy documents
        self.prevent_security_service_disable_scp = self._create_prevent_disable_scp()
        self.require_encryption_scp = self._create_require_encryption_scp()
        self.prevent_public_access_scp = self._create_prevent_public_access_scp()

    def _create_prevent_disable_scp(self) -> Dict:
        """SCP to prevent disabling security services"""

        policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Sid": "PreventSecurityServiceDisable",
                    "Effect": "Deny",
                    "Action": [
                        "cloudtrail:StopLogging",
                        "cloudtrail:DeleteTrail",
                        "config:DeleteConfigRule",
                        "config:DeleteConfigurationRecorder",
                        "config:DeleteDeliveryChannel",
                        "config:StopConfigurationRecorder",
                        "guardduty:DeleteDetector",
                        "guardduty:DeleteMembers",
                        "guardduty:DisassociateFromMasterAccount",
                        "guardduty:DisassociateMembers",
                        "guardduty:StopMonitoringMembers",
                        "securityhub:DeleteInvitations",
                        "securityhub:DisableSecurityHub",
                        "securityhub:DisassociateFromMasterAccount",
                        "securityhub:DeleteMembers",
                        "securityhub:DisassociateMembers",
                    ],
                    "Resource": "*",
                    "Condition": {
                        "StringNotEquals": {
                            "aws:PrincipalOrgID": "o-PLACEHOLDER"  # Replace with actual org ID
                        }
                    }
                }
            ]
        }

        return policy

    def _create_require_encryption_scp(self) -> Dict:
        """SCP to require encryption for data at rest"""

        policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Sid": "RequireS3Encryption",
                    "Effect": "Deny",
                    "Action": "s3:PutObject",
                    "Resource": "*",
                    "Condition": {
                        "StringNotEquals": {
                            "s3:x-amz-server-side-encryption": [
                                "AES256",
                                "aws:kms"
                            ]
                        }
                    }
                },
                {
                    "Sid": "RequireEBSEncryption",
                    "Effect": "Deny",
                    "Action": "ec2:RunInstances",
                    "Resource": "arn:aws:ec2:*:*:volume/*",
                    "Condition": {
                        "Bool": {
                            "ec2:Encrypted": "false"
                        }
                    }
                },
                {
                    "Sid": "RequireRDSEncryption",
                    "Effect": "Deny",
                    "Action": [
                        "rds:CreateDBInstance",
                        "rds:CreateDBCluster"
                    ],
                    "Resource": "*",
                    "Condition": {
                        "Bool": {
                            "rds:StorageEncrypted": "false"
                        }
                    }
                }
            ]
        }

        return policy

    def _create_prevent_public_access_scp(self) -> Dict:
        """SCP to prevent public access to resources"""

        policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Sid": "PreventPublicS3Buckets",
                    "Effect": "Deny",
                    "Action": [
                        "s3:PutBucketPublicAccessBlock",
                        "s3:DeleteBucketPublicAccessBlock"
                    ],
                    "Resource": "*",
                    "Condition": {
                        "Bool": {
                            "s3:BlockPublicAcls": "false",
                            "s3:BlockPublicPolicy": "false",
                            "s3:IgnorePublicAcls": "false",
                            "s3:RestrictPublicBuckets": "false"
                        }
                    }
                },
                {
                    "Sid": "PreventPublicRDS",
                    "Effect": "Deny",
                    "Action": [
                        "rds:CreateDBInstance",
                        "rds:ModifyDBInstance"
                    ],
                    "Resource": "*",
                    "Condition": {
                        "Bool": {
                            "rds:PubliclyAccessible": "true"
                        }
                    }
                }
            ]
        }

        return policy
