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
        import random
        import time
        timestamp = str(int(time.time()))[-6:]
        random_suffix = str(random.randint(1000, 9999))
        
        return aws.Provider(
            f"aws-provider-{timestamp}-{random_suffix}",
            region=self.config.region
        )
    
    def get_provider(self) -> aws.Provider:
        """Get the AWS provider instance."""
        return self.provider
