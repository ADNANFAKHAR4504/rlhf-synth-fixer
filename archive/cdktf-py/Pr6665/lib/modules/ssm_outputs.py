"""Module for exporting outputs to SSM Parameter Store."""
from constructs import Construct
from cdktf_cdktf_provider_aws.ssm_parameter import SsmParameter
from typing import Dict
from .naming import NamingModule


class SsmOutputsModule(Construct):
    """Export infrastructure outputs to SSM Parameter Store."""

    def __init__(
        self,
        scope: Construct,
        id: str,
        naming: NamingModule,
        outputs: Dict[str, str]
    ):
        super().__init__(scope, id)

        # Create SSM parameters for each output
        for key, value in outputs.items():
            SsmParameter(
                self,
                f"ssm_{key}",
                name=naming.generate_unique_ssm_path(key),
                type="String",
                value=value,
                overwrite=True,  # Allow overwriting existing parameters for idempotency
                description=f"{key} for {naming.environment} environment",
                tags={
                    "Name": f"{naming.environment}-{key}",
                    "Environment": naming.environment,
                    "ManagedBy": "CDKTF"
                }
            )
