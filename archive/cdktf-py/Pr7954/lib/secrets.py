from constructs import Construct
from cdktf_cdktf_provider_aws.secretsmanager_secret import SecretsmanagerSecret
from cdktf_cdktf_provider_aws.secretsmanager_secret_version import SecretsmanagerSecretVersion
import json


class SecretsConstruct(Construct):
    """Secrets management construct for database credentials.
    
    Note: Lambda-based secret rotation is not implemented to avoid zip file dependencies.
    In production, consider using AWS-managed rotation or a container-based solution.
    """
    def __init__(self, scope: Construct, id: str, environment_suffix: str, database, security, vpc):
        super().__init__(scope, id)

        # Secret for database credentials
        self.db_secret = SecretsmanagerSecret(self, "db_secret",
            name=f"financial-db-credentials-{environment_suffix}",
            description="Database credentials for financial transaction platform",
            kms_key_id=security.kms_key.arn,
            recovery_window_in_days=0,  # Set to 0 for test environments (immediate deletion)
            tags={
                "Name": f"financial-db-credentials-{environment_suffix}",
                "Environment": f"{environment_suffix}",
                "Application": "financial-transaction-platform",
                "CostCenter": "engineering"
            }
        )

        # Initial secret value
        secret_value = {
            "username": "admin",
            "password": "ChangeMe123456!",
            "engine": "mysql",
            "host": database.cluster.endpoint,
            "port": 3306,
            "dbname": "financialdb"
        }

        SecretsmanagerSecretVersion(self, "db_secret_version",
            secret_id=self.db_secret.id,
            secret_string=json.dumps(secret_value)
        )
