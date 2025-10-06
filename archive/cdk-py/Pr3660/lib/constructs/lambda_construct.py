from aws_cdk import (
    aws_lambda as lambda_,
    aws_iam as iam,
    aws_logs as logs,
    aws_ssm as ssm,
    Duration,
)
from aws_cdk.aws_lambda_python_alpha import PythonLayerVersion
from constructs import Construct
import os
import subprocess


def is_docker_available() -> bool:
    """Check if Docker is available and running"""
    try:
        result = subprocess.run(
            ["docker", "info"], 
            capture_output=True, 
            text=True, 
            timeout=5
        )
        return result.returncode == 0
    except (subprocess.TimeoutExpired, FileNotFoundError, OSError):
        return False


class LambdaConstruct(Construct):
    def __init__(
        self,
        scope: Construct,
        id: str,
        table,
        env_name: str,
        **kwargs
    ) -> None:
        super().__init__(scope, id, **kwargs)

        self.functions = {}

        # Create shared layer for common dependencies (skip in test mode or if Docker unavailable)
        shared_layer = None
        skip_layer = os.environ.get('CDK_TEST_MODE') or not is_docker_available()
        
        if not skip_layer:
            shared_layer = PythonLayerVersion(
                self,
                "SharedLayer",
                entry="lib/lambda/layer",
                compatible_runtimes=[lambda_.Runtime.PYTHON_3_11],
                description="Shared utilities and dependencies"
            )
        elif not is_docker_available():
            print("⚠️  Docker not available - skipping Lambda layer creation")
            print("   Lambda functions will run without the shared layer")

        # Lambda execution role with least privilege
        lambda_role = iam.Role(
            self,
            "LambdaExecutionRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaBasicExecutionRole"
                )
            ]
        )

        # Add DynamoDB permissions
        table.grant_read_write_data(lambda_role)

        # Add Parameter Store read permissions
        lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=["ssm:GetParameter", "ssm:GetParameters"],
                resources=[f"arn:aws:ssm:*:*:parameter/inventory/{env_name}/*"]
            )
        )

        # Store configuration in Parameter Store
        api_config = ssm.StringParameter(
            self,
            "ApiConfig",
            parameter_name=f"/inventory/{env_name}/config",
            string_value='{"max_items_per_page": 50, "default_page_size": 20}',
            description=f"API configuration for {env_name} environment"
        )

        # Common environment variables
        common_env = {
            "TABLE_NAME": table.table_name,
            "ENVIRONMENT": env_name,
            "CONFIG_PARAMETER": api_config.parameter_name,
            "LOG_LEVEL": "INFO" if env_name == "prod" else "DEBUG"
        }

        # Define Lambda functions
        lambda_configs = {
            "create_item": {
                "handler": "create_item.handler",
                "timeout": Duration.seconds(10),
                "memory": 256,
                "reserved_concurrent": 10 if env_name == "prod" else None
            },
            "get_item": {
                "handler": "get_item.handler",
                "timeout": Duration.seconds(5),
                "memory": 256,
                "reserved_concurrent": 20 if env_name == "prod" else None
            },
            "update_item": {
                "handler": "update_item.handler",
                "timeout": Duration.seconds(10),
                "memory": 256,
                "reserved_concurrent": 10 if env_name == "prod" else None
            },
            "delete_item": {
                "handler": "delete_item.handler",
                "timeout": Duration.seconds(5),
                "memory": 256,
                "reserved_concurrent": 5 if env_name == "prod" else None
            },
            "list_items": {
                "handler": "list_items.handler",
                "timeout": Duration.seconds(10),
                "memory": 512,
                "reserved_concurrent": 15 if env_name == "prod" else None
            }
        }

        # Create Lambda functions
        for func_name, config in lambda_configs.items():
            function = lambda_.Function(
                self,
                f"{func_name.replace('_', '-').title()}Function",
                function_name=f"inventory-{env_name}-{func_name.replace('_', '-')}",
                runtime=lambda_.Runtime.PYTHON_3_11,
                code=lambda_.Code.from_asset("lib/lambda/handlers"),
                handler=config["handler"],
                timeout=config["timeout"],
                memory_size=config["memory"],
                environment=common_env,
                role=lambda_role,
                layers=[shared_layer] if shared_layer else [],
                log_retention=logs.RetentionDays.ONE_WEEK if env_name == "dev" else logs.RetentionDays.ONE_MONTH,
                tracing=lambda_.Tracing.ACTIVE,
                reserved_concurrent_executions=config.get("reserved_concurrent")
            )

            self.functions[func_name] = function
