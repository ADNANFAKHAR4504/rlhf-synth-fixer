"""Compute infrastructure - Lambda functions"""

from constructs import Construct
from cdktf_cdktf_provider_aws.lambda_function import LambdaFunction, LambdaFunctionEnvironment, LambdaFunctionVpcConfig
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.iam_role_policy import IamRolePolicy
from cdktf_cdktf_provider_aws.lambda_permission import LambdaPermission
from cdktf_cdktf_provider_aws.data_aws_iam_policy_document import DataAwsIamPolicyDocument
import json


class ComputeStack(Construct):
    """Creates Lambda functions for payment processing"""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        region: str,
        environment_suffix: str,
        vpc,
        private_subnets,
        security_group,
        dynamodb_table,
        aurora_cluster
    ):
        super().__init__(scope, construct_id)

        self.region = region
        self.environment_suffix = environment_suffix

        # Lambda execution role
        lambda_role = IamRole(
            self,
            "lambda-role",
            name=f"dr-lambda-role-{region}-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "lambda.amazonaws.com"
                    },
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={
                "Name": f"dr-lambda-role-{region}-{environment_suffix}"
            }
        )

        # Attach basic execution policy
        IamRolePolicyAttachment(
            self,
            "lambda-basic-execution",
            role=lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        )

        # Attach VPC execution policy
        IamRolePolicyAttachment(
            self,
            "lambda-vpc-execution",
            role=lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
        )

        # Custom policy for DynamoDB and RDS access
        IamRolePolicy(
            self,
            "lambda-custom-policy",
            name="lambda-custom-policy",
            role=lambda_role.id,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "dynamodb:GetItem",
                            "dynamodb:PutItem",
                            "dynamodb:UpdateItem",
                            "dynamodb:Query",
                            "dynamodb:Scan"
                        ],
                        "Resource": [
                            dynamodb_table.arn,
                            f"{dynamodb_table.arn}/index/*"
                        ]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "rds:DescribeDBClusters",
                            "rds:DescribeDBInstances"
                        ],
                        "Resource": "*"
                    }
                ]
            })
        )

        # Payment Processor Lambda
        self.payment_processor_lambda = LambdaFunction(
            self,
            "payment-processor",
            function_name=f"dr-payment-processor-{region}-{environment_suffix}",
            runtime="python3.9",
            handler="index.handler",
            role=lambda_role.arn,
            filename="lambda/payment_processor.zip",
            source_code_hash="${filebase64sha256(\"lambda/payment_processor.zip\")}",
            timeout=30,
            memory_size=512,
            environment=LambdaFunctionEnvironment(
                variables={
                    "REGION": region,
                    "ENVIRONMENT_SUFFIX": environment_suffix,
                    "DYNAMODB_TABLE": dynamodb_table.name,
                    "AURORA_ENDPOINT": aurora_cluster.endpoint,
                    "DB_NAME": "payments"
                }
            ),
            vpc_config=LambdaFunctionVpcConfig(
                subnet_ids=[subnet.id for subnet in private_subnets],
                security_group_ids=[security_group.id]
            ),
            tags={
                "Name": f"dr-payment-processor-{region}-{environment_suffix}"
            }
        )

        # Health Check Lambda
        self.health_check_lambda = LambdaFunction(
            self,
            "health-check",
            function_name=f"dr-health-check-{region}-{environment_suffix}",
            runtime="python3.9",
            handler="index.handler",
            role=lambda_role.arn,
            filename="lambda/health_check.zip",
            source_code_hash="${filebase64sha256(\"lambda/health_check.zip\")}",
            timeout=10,
            memory_size=256,
            environment=LambdaFunctionEnvironment(
                variables={
                    "REGION": region,
                    "ENVIRONMENT_SUFFIX": environment_suffix
                }
            ),
            tags={
                "Name": f"dr-health-check-{region}-{environment_suffix}"
            }
        )
