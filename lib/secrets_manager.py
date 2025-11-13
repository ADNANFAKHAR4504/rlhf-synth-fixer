from constructs import Construct
from cdktf_cdktf_provider_aws.secretsmanager_secret import SecretsmanagerSecret
from cdktf_cdktf_provider_aws.secretsmanager_secret_version import SecretsmanagerSecretVersion
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_policy import IamPolicy
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.data_aws_iam_policy_document import DataAwsIamPolicyDocument
import json


class SecretsManagerConstruct(Construct):
    def __init__(self, scope: Construct, id: str, environment_suffix: str,
                 oidc_provider_arn: str, oidc_provider_url: str, kms_key_arn: str):
        super().__init__(scope, id)

        # Extract OIDC provider ID
        oidc_provider_id = oidc_provider_url.replace("https://", "")

        # Create sample secrets for multi-tenant environment
        self.secrets = {}
        for tenant in ["tenant-a", "tenant-b", "tenant-c"]:
            secret = SecretsmanagerSecret(self, f"secret-{tenant}",
                name=f"eks/{tenant}/{environment_suffix}/config",
                description=f"Configuration secrets for {tenant}",
                kms_key_id=kms_key_arn,
                recovery_window_in_days=0,  # Immediate deletion for testing
                tags={"Name": f"eks-{tenant}-secret-{environment_suffix}", "Tenant": tenant}
            )

            # Create initial version with placeholder data
            SecretsmanagerSecretVersion(self, f"secret-version-{tenant}",
                secret_id=secret.id,
                secret_string=json.dumps({
                    "database_url": f"postgres://example-{tenant}.rds.amazonaws.com:5432",
                    "api_key": "placeholder-key",
                    "tenant": tenant
                })
            )

            self.secrets[tenant] = secret

        # IRSA Role for External Secrets Operator
        external_secrets_assume_role = DataAwsIamPolicyDocument(self, "external-secrets-assume",
            statement=[{
                "effect": "Allow",
                "principals": [{
                    "type": "Federated",
                    "identifiers": [oidc_provider_arn]
                }],
                "actions": ["sts:AssumeRoleWithWebIdentity"],
                "condition": [{
                    "test": "StringEquals",
                    "variable": f"{oidc_provider_id}:sub",
                    "values": ["system:serviceaccount:external-secrets:external-secrets-sa"]
                }]
            }]
        )

        self.external_secrets_role = IamRole(self, "external-secrets-role",
            name=f"eks-external-secrets-{environment_suffix}",
            assume_role_policy=external_secrets_assume_role.json
        )

        # Policy for accessing Secrets Manager
        secrets_policy = IamPolicy(self, "external-secrets-policy",
            name=f"eks-external-secrets-policy-{environment_suffix}",
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "secretsmanager:GetSecretValue",
                            "secretsmanager:DescribeSecret",
                            "secretsmanager:ListSecrets"
                        ],
                        "Resource": [s.arn for s in self.secrets.values()]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "kms:Decrypt",
                            "kms:DescribeKey"
                        ],
                        "Resource": kms_key_arn
                    }
                ]
            })
        )

        IamRolePolicyAttachment(self, "external-secrets-policy-attach",
            role=self.external_secrets_role.name,
            policy_arn=secrets_policy.arn
        )

    @property
    def external_secrets_role_arn(self):
        return self.external_secrets_role.arn
