from constructs import Construct
from cdktf_cdktf_provider_aws.iam_openid_connect_provider import IamOpenidConnectProvider
from cdktf_cdktf_provider_aws.data_aws_iam_policy_document import DataAwsIamPolicyDocument
from cdktf import Fn


class OidcProvider(Construct):
    def __init__(self, scope: Construct, id: str, *,  # pylint: disable=redefined-builtin
                 environment_suffix: str, cluster_oidc_issuer_url: str):
        super().__init__(scope, id)

        # Extract OIDC issuer without https://
        oidc_issuer = Fn.replace(cluster_oidc_issuer_url, "https://", "")

        # OIDC Provider for IRSA
        self.oidc_provider = IamOpenidConnectProvider(self, "oidc_provider",
            url=cluster_oidc_issuer_url,
            client_id_list=["sts.amazonaws.com"],
            thumbprint_list=[
                "9e99a48a9960b14926bb7f3b02e22da2b0ab7280"  # Root CA thumbprint for EKS
            ],
            tags={
                "Name": f"eks-oidc-provider-{environment_suffix}",
                "Environment": environment_suffix
            }
        )

    @property
    def oidc_provider_arn(self) -> str:
        return self.oidc_provider.arn

    @property
    def oidc_provider_url(self) -> str:
        return self.oidc_provider.url
