from constructs import Construct
from cdktf_cdktf_provider_aws.kms_key import KmsKey
from cdktf_cdktf_provider_aws.kms_alias import KmsAlias


class KmsEncryption(Construct):
    def __init__(self, scope: Construct, id: str, environment_suffix: str):  # pylint: disable=redefined-builtin
        super().__init__(scope, id)

        # KMS Key for EKS secrets encryption
        self.kms_key = KmsKey(self, "eks_kms_key",
            description=f"KMS key for EKS secrets encryption - {environment_suffix}",
            enable_key_rotation=True,
            deletion_window_in_days=10,
            tags={
                "Name": f"eks-kms-key-{environment_suffix}",
                "Environment": environment_suffix,
                "ManagedBy": "CDKTF"
            }
        )

        # KMS Alias for easier reference
        KmsAlias(self, "eks_kms_alias",
            name=f"alias/eks-{environment_suffix}",
            target_key_id=self.kms_key.key_id
        )

    @property
    def kms_key_arn(self) -> str:
        return self.kms_key.arn
