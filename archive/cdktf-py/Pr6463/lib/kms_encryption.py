from constructs import Construct
from cdktf_cdktf_provider_aws.kms_key import KmsKey
from cdktf_cdktf_provider_aws.kms_alias import KmsAlias
from cdktf_cdktf_provider_aws.data_aws_caller_identity import DataAwsCallerIdentity
import json


class KmsEncryptionConstruct(Construct):
    def __init__(self, scope: Construct, id: str, environment_suffix: str, region: str = "us-east-1"):
        super().__init__(scope, id)

        # Get current account ID
        current = DataAwsCallerIdentity(self, "current")
        self.region = region

        # KMS Key for EKS Cluster Encryption
        self.cluster_key = KmsKey(self, f"cluster-key",
            description=f"KMS key for EKS cluster secrets encryption - {environment_suffix}",
            enable_key_rotation=True,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": "Enable IAM User Permissions",
                        "Effect": "Allow",
                        "Principal": {
                            "AWS": f"arn:aws:iam::{current.account_id}:root"
                        },
                        "Action": "kms:*",
                        "Resource": "*"
                    },
                    {
                        "Sid": "Allow EKS Service",
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "eks.amazonaws.com"
                        },
                        "Action": [
                            "kms:Decrypt",
                            "kms:DescribeKey",
                            "kms:Encrypt",
                            "kms:GenerateDataKey",
                            "kms:ReEncrypt*"
                        ],
                        "Resource": "*"
                    }
                ]
            }),
            tags={"Name": f"eks-cluster-kms-{environment_suffix}"}
        )

        KmsAlias(self, f"cluster-key-alias",
            name=f"alias/eks-cluster-{environment_suffix}",
            target_key_id=self.cluster_key.id
        )

        # KMS Keys for Tenant Namespaces
        self.tenant_keys = {}
        for tenant in ["tenant-a", "tenant-b", "tenant-c"]:
            key = KmsKey(self, f"tenant-key-{tenant}",
                description=f"KMS key for {tenant} namespace - {environment_suffix}",
                enable_key_rotation=True,
                tags={"Name": f"eks-{tenant}-kms-{environment_suffix}"}
            )
            self.tenant_keys[tenant] = key

            KmsAlias(self, f"tenant-key-alias-{tenant}",
                name=f"alias/eks-{tenant}-{environment_suffix}",
                target_key_id=key.id
            )

        # CloudWatch Logs KMS Key
        self.logs_key = KmsKey(self, f"logs-key",
            description=f"KMS key for CloudWatch Logs encryption",
            enable_key_rotation=True,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": "Enable IAM User Permissions",
                        "Effect": "Allow",
                        "Principal": {
                            "AWS": f"arn:aws:iam::{current.account_id}:root"
                        },
                        "Action": "kms:*",
                        "Resource": "*"
                    },
                    {
                        "Sid": "Allow CloudWatch Logs",
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "logs.amazonaws.com"
                        },
                        "Action": [
                            "kms:Encrypt",
                            "kms:Decrypt",
                            "kms:ReEncrypt*",
                            "kms:GenerateDataKey*",
                            "kms:CreateGrant",
                            "kms:DescribeKey"
                        ],
                        "Resource": "*",
                        "Condition": {
                            "ArnLike": {
                                "kms:EncryptionContext:aws:logs:arn": f"arn:aws:logs:{self.region}:{current.account_id}:*"
                            }
                        }
                    }
                ]
            }),
            tags={"Name": f"eks-logs-kms-{environment_suffix}"}
        )

    @property
    def cluster_key_arn(self):
        return self.cluster_key.arn

    @property
    def logs_key_arn(self):
        return self.logs_key.arn
