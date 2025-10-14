import pulumi
import pulumi_aws as aws

from .config import WebAppConfig


class AWSProviderStack:
    """AWS Provider configuration with proper region enforcement."""
    
    def __init__(self, config: WebAppConfig):
        self.config = config
        self.provider = self._create_aws_provider()
    
    def _create_aws_provider(self) -> aws.Provider:
        """Create AWS provider with explicit region enforcement."""
        return aws.Provider(
            "aws-provider-461889-2857",
            region=self.config.region
        )
    
    def get_provider(self) -> aws.Provider:
        """Get the AWS provider instance."""
        return self.provider
