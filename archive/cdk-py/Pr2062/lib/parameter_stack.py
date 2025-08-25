from aws_cdk import (
    Stack,
    aws_ssm as ssm,
)
from constructs import Construct

class ParameterStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, 
                 environment_suffix: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Create parameter store entries for environment variables
        ssm.StringParameter(
            self, f"ApiKeyParameter{environment_suffix}",
            parameter_name=f"/webapp/{environment_suffix.lower()}/api-key-primary-1",
            string_value="your-api-key-here",  # Replace with actual value
            description=f"API Key for web application - {environment_suffix}"
        )

        ssm.StringParameter(
            self, f"DbPasswordParameter{environment_suffix}",
            parameter_name=f"/webapp/{environment_suffix.lower()}/db-password-primary-1",
            string_value="your-db-password-here",  # Replace with actual value
            description=f"Database password for web application - {environment_suffix}"
        )

        # Additional configuration parameters
        ssm.StringParameter(
            self, f"AppConfigParameter{environment_suffix}",
            parameter_name=f"/webapp/{environment_suffix.lower()}/app-config-primary-1",
            string_value='{"debug": false, "log_level": "info"}',
            description=f"Application configuration - {environment_suffix}"
        )
