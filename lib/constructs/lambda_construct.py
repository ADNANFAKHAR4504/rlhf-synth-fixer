from constructs import Construct
from cdktf_cdktf_provider_aws.lambda_function import LambdaFunction
from cdktf_cdktf_provider_aws.lambda_layer_version import LambdaLayerVersion
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.iam_policy import IamPolicy
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
import json
from typing import Dict, List, Optional


class ReusableLambdaConstruct(Construct):
    """
    Reusable Lambda construct pattern that reduces code duplication.
    Includes proper IAM roles, logging, error handling configuration, and ARM architecture.
    """

    def __init__(
        self,
        scope: Construct,
        id: str,
        function_name: str,
        handler: str,
        runtime: str,
        code_path: str,
        environment_suffix: str,
        environment_vars: Optional[Dict[str, str]] = None,
        timeout: int = 300,
        memory_size: int = 512,
        layers: Optional[List[str]] = None,
        policy_statements: Optional[List[Dict]] = None,
        log_retention_days: int = 7
    ):
        super().__init__(scope, id)

        self.function_name = f"{function_name}-{environment_suffix}"
        self.environment_suffix = environment_suffix

        # Create CloudWatch Log Group with retention policy
        self.log_group = CloudwatchLogGroup(
            self,
            f"{id}-log-group",
            name=f"/aws/lambda/{self.function_name}",
            retention_in_days=log_retention_days,
            tags={
                "Name": f"{self.function_name}-logs",
                "Environment": environment_suffix,
                "ManagedBy": "CDKTF",
                "CostCenter": "DataPipeline",
                "Project": "FinancialDataProcessing"
            }
        )

        # Create IAM role for Lambda
        assume_role_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "lambda.amazonaws.com"
                    },
                    "Action": "sts:AssumeRole"
                }
            ]
        }

        self.role = IamRole(
            self,
            f"{id}-role",
            name=f"{self.function_name}-role",
            assume_role_policy=json.dumps(assume_role_policy),
            tags={
                "Name": f"{self.function_name}-role",
                "Environment": environment_suffix,
                "ManagedBy": "CDKTF"
            }
        )

        # Attach basic Lambda execution policy
        IamRolePolicyAttachment(
            self,
            f"{id}-basic-execution",
            role=self.role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        )

        # Attach VPC execution policy for Lambda in VPC
        IamRolePolicyAttachment(
            self,
            f"{id}-vpc-execution",
            role=self.role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
        )

        # Create custom IAM policy if policy statements provided
        if policy_statements:
            custom_policy_document = {
                "Version": "2012-10-17",
                "Statement": policy_statements
            }

            custom_policy = IamPolicy(
                self,
                f"{id}-custom-policy",
                name=f"{self.function_name}-policy",
                policy=json.dumps(custom_policy_document),
                tags={
                    "Name": f"{self.function_name}-policy",
                    "Environment": environment_suffix
                }
            )

            IamRolePolicyAttachment(
                self,
                f"{id}-custom-policy-attachment",
                role=self.role.name,
                policy_arn=custom_policy.arn
            )

        # Prepare environment variables
        env_vars = environment_vars or {}
        env_vars["ENVIRONMENT"] = environment_suffix
        env_vars["LOG_LEVEL"] = "INFO"

        # Create Lambda function with ARM architecture (Graviton2)
        self.function = LambdaFunction(
            self,
            f"{id}-function",
            function_name=self.function_name,
            handler=handler,
            runtime=runtime,
            role=self.role.arn,
            filename=code_path,
            source_code_hash="${filebase64sha256(\"" + code_path + "\")}",
            timeout=timeout,
            memory_size=memory_size,
            layers=layers,
            architectures=["arm64"],  # Graviton2 for cost optimization
            environment={
                "variables": env_vars
            },
            tags={
                "Name": self.function_name,
                "Environment": environment_suffix,
                "ManagedBy": "CDKTF",
                "CostCenter": "DataPipeline",
                "Project": "FinancialDataProcessing",
                "Architecture": "ARM64"
            },
            depends_on=[self.log_group]
        )

    @property
    def function_arn(self) -> str:
        return self.function.arn

    @property
    def function_invoke_arn(self) -> str:
        return self.function.invoke_arn

    @property
    def role_arn(self) -> str:
        return self.role.arn
