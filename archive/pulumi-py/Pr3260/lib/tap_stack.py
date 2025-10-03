"""
TapStack class for bootstrapping S3-triggered Lambda infrastructure.
Provides the main entry point for Pulumi stack deployment.
"""

import pulumi
from infrastructure.main import create_infrastructure


class TapStackArgs:
    """Arguments for TapStack initialization."""
    def __init__(self, environment_suffix: str):
        self.environment_suffix = environment_suffix


class TapStack:
    """
    TapStack class for S3-triggered Lambda infrastructure.
    Bootstraps all infrastructure components and handles deployment.
    """
    
    def __init__(self, name: str, args: TapStackArgs):
        """Initialize the TapStack with all infrastructure components."""
        self.name = name
        self.args = args
        
        # Create the complete infrastructure
        self.infrastructure = create_infrastructure()
        
        # Register outputs
        self.register_outputs()
        
        # Validate deployment
        self.validate_deployment()
    
    def register_outputs(self):
        """Register Pulumi outputs for the stack."""
        
        # Lambda function outputs
        pulumi.export("lambda_function_name", self.infrastructure["lambda_function"].name)
        pulumi.export("lambda_function_arn", self.infrastructure["lambda_function"].arn)
        pulumi.export("lambda_function_invoke_arn", self.infrastructure["lambda_function"].invoke_arn)
        
        # S3 bucket outputs
        pulumi.export("input_bucket_name", self.infrastructure["storage"]["input_bucket"].bucket)
        pulumi.export("input_bucket_arn", self.infrastructure["storage"]["input_bucket"].arn)
        pulumi.export("output_bucket_name", self.infrastructure["storage"]["output_bucket"].bucket)
        pulumi.export("output_bucket_arn", self.infrastructure["storage"]["output_bucket"].arn)
        
        # IAM outputs
        pulumi.export("lambda_role_arn", self.infrastructure["iam"]["lambda_role"].arn)
        pulumi.export("s3_policy_arn", self.infrastructure["iam"]["s3_policy"].arn)
        pulumi.export("logs_policy_arn", self.infrastructure["iam"]["logs_policy"].arn)
        
        # Configuration outputs
        pulumi.export("environment", self.infrastructure["config"].environment_suffix)
        pulumi.export("region", self.infrastructure["config"].region)
        pulumi.export("lambda_timeout", self.infrastructure["config"].lambda_timeout)
        pulumi.export("lambda_memory", self.infrastructure["config"].lambda_memory)
        
        # Environment variables for Lambda
        pulumi.export("environment_variables", self.infrastructure["config"].get_environment_variables())
        
        # IP restrictions
        pulumi.export("allowed_ip_ranges", self.infrastructure["config"].get_allowed_ip_ranges())
        
        # Tags
        pulumi.export("tags", self.infrastructure["config"].get_tags())
    
    def validate_deployment(self):
        """Validate the deployment configuration."""
        
        config = self.infrastructure["config"]
        
        # Validate region enforcement
        if config.region != "us-east-1":
            raise ValueError("Deployment must be restricted to us-east-1 region")
        
        # Validate Lambda timeout
        if config.lambda_timeout > 300:
            raise ValueError("Lambda timeout cannot exceed 5 minutes (300 seconds)")
        
        # Validate IP ranges
        for ip_range in config.get_allowed_ip_ranges():
            if ip_range == "0.0.0.0/0":
                raise ValueError("IP range 0.0.0.0/0 is not allowed for security reasons")
        
        # Validate bucket names
        if not config.input_bucket_name or not config.output_bucket_name:
            raise ValueError("S3 bucket names must be specified")
        
        # Validate Lambda function name
        if not config.lambda_function_name:
            raise ValueError("Lambda function name must be specified")
        
        pulumi.log.info("Deployment validation passed")
    
    def get_infrastructure_summary(self) -> dict:
        """Get a summary of the deployed infrastructure."""
        
        return {
            "lambda_function": {
                "name": self.infrastructure["lambda_function"].name,
                "arn": self.infrastructure["lambda_function"].arn,
                "timeout": self.infrastructure["config"].lambda_timeout,
                "memory": self.infrastructure["config"].lambda_memory
            },
            "s3_buckets": {
                "input": {
                    "name": self.infrastructure["storage"]["input_bucket"].bucket,
                    "arn": self.infrastructure["storage"]["input_bucket"].arn
                },
                "output": {
                    "name": self.infrastructure["storage"]["output_bucket"].bucket,
                    "arn": self.infrastructure["storage"]["output_bucket"].arn
                }
            },
            "iam": {
                "lambda_role": self.infrastructure["iam"]["lambda_role"].arn,
                "s3_policy": self.infrastructure["iam"]["s3_policy"].arn,
                "logs_policy": self.infrastructure["iam"]["logs_policy"].arn
            },
            "configuration": {
                "environment": self.infrastructure["config"].environment_suffix,
                "region": self.infrastructure["config"].region,
                "ip_restrictions": self.infrastructure["config"].get_allowed_ip_ranges()
            }
        }


# Stack instance is created in tap.py