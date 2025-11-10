"""Compute infrastructure components including Lambda and API Gateway."""
from typing import Dict, List, Optional
import json
import pulumi
import pulumi_aws as aws
from pulumi import ComponentResource, ResourceOptions, Output, FileArchive


class ComputeStack(ComponentResource):
    """ComponentResource for compute infrastructure."""

    def __init__(
        self,
        name: str,
        environment: str,
        environment_suffix: str,
        vpc_id: Output[str],
        private_subnet_ids: List[Output[str]],
        lambda_security_group_id: Output[str],
        dynamodb_table_name: Output[str],
        dynamodb_table_arn: Output[str],
        rds_endpoint: Output[str],
        tags: Dict[str, str],
        opts: Optional[ResourceOptions] = None,
    ):
        super().__init__("custom:compute:ComputeStack", name, {}, opts)

        # Create IAM role for Lambda
        self.lambda_role = aws.iam.Role(
            f"lambda-role-{environment}-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {"Service": "lambda.amazonaws.com"},
                }],
            }),
            tags=tags,
            opts=ResourceOptions(parent=self),
        )

        # Attach basic Lambda execution policy
        self.lambda_basic_policy_attachment = aws.iam.RolePolicyAttachment(
            f"lambda-basic-{environment}",
            role=self.lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole",
            opts=ResourceOptions(parent=self),
        )

        # Create inline policy for DynamoDB access
        self.lambda_dynamodb_policy = aws.iam.RolePolicy(
            f"lambda-dynamodb-{environment}",
            role=self.lambda_role.id,
            policy=dynamodb_table_arn.apply(lambda arn: json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": [
                        "dynamodb:PutItem",
                        "dynamodb:GetItem",
                        "dynamodb:Query",
                        "dynamodb:Scan",
                        "dynamodb:UpdateItem",
                    ],
                    "Resource": arn,
                }],
            })),
            opts=ResourceOptions(parent=self),
        )

        # Create CloudWatch Log Group for Lambda
        self.lambda_log_group = aws.cloudwatch.LogGroup(
            f"lambda-logs-{environment}-{environment_suffix}",
            name=f"/aws/lambda/payment-processor-{environment}-{environment_suffix}",
            retention_in_days=7,
            tags=tags,
            opts=ResourceOptions(parent=self),
        )

        # Create Lambda function
        self.lambda_function = aws.lambda_.Function(
            f"payment-processor-{environment}-{environment_suffix}",
            name=f"payment-processor-{environment}-{environment_suffix}",
            runtime="python3.11",
            handler="payment_processor.handler",
            role=self.lambda_role.arn,
            code=FileArchive("./lambda"),
            timeout=30,
            memory_size=256,
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    "ENVIRONMENT": environment,
                    "DYNAMODB_TABLE": dynamodb_table_name,
                    "RDS_ENDPOINT": rds_endpoint,
                },
            ),
            vpc_config=aws.lambda_.FunctionVpcConfigArgs(
                subnet_ids=private_subnet_ids,
                security_group_ids=[lambda_security_group_id],
            ),
            tags=tags,
            opts=ResourceOptions(parent=self, depends_on=[self.lambda_log_group]),
        )

        # Create API Gateway REST API
        self.api = aws.apigateway.RestApi(
            f"payment-api-{environment}-{environment_suffix}",
            name=f"payment-api-{environment}-{environment_suffix}",
            description=f"Payment processing API for {environment}",
            endpoint_configuration=aws.apigateway.RestApiEndpointConfigurationArgs(
                types="REGIONAL",
            ),
            tags=tags,
            opts=ResourceOptions(parent=self),
        )

        # Create API Gateway resource
        self.api_resource = aws.apigateway.Resource(
            f"payment-resource-{environment}",
            rest_api=self.api.id,
            parent_id=self.api.root_resource_id,
            path_part="payments",
            opts=ResourceOptions(parent=self),
        )

        # Create API Gateway method with IAM authorization
        self.api_method = aws.apigateway.Method(
            f"payment-method-{environment}",
            rest_api=self.api.id,
            resource_id=self.api_resource.id,
            http_method="POST",
            authorization="AWS_IAM",
            opts=ResourceOptions(parent=self),
        )

        # Create Lambda integration
        self.api_integration = aws.apigateway.Integration(
            f"payment-integration-{environment}",
            rest_api=self.api.id,
            resource_id=self.api_resource.id,
            http_method=self.api_method.http_method,
            integration_http_method="POST",
            type="AWS_PROXY",
            uri=self.lambda_function.invoke_arn,
            opts=ResourceOptions(parent=self),
        )

        # Grant API Gateway permission to invoke Lambda
        self.lambda_permission = aws.lambda_.Permission(
            f"api-lambda-permission-{environment}",
            action="lambda:InvokeFunction",
            function=self.lambda_function.name,
            principal="apigateway.amazonaws.com",
            source_arn=self.api.execution_arn.apply(lambda arn: f"{arn}/*/*"),
            opts=ResourceOptions(parent=self),
        )

        # Create API Gateway deployment
        self.api_deployment = aws.apigateway.Deployment(
            f"payment-deployment-{environment}",
            rest_api=self.api.id,
            opts=ResourceOptions(
                parent=self,
                depends_on=[self.api_integration],
            ),
        )

        # Create API Gateway stage
        self.api_stage = aws.apigateway.Stage(
            f"payment-stage-{environment}",
            rest_api=self.api.id,
            deployment=self.api_deployment.id,
            stage_name=environment,
            tags=tags,
            opts=ResourceOptions(parent=self),
        )

        # Create CloudWatch Log Group for API Gateway
        self.api_log_group = aws.cloudwatch.LogGroup(
            f"api-logs-{environment}-{environment_suffix}",
            name=f"/aws/apigateway/payment-api-{environment}",
            retention_in_days=7,
            tags=tags,
            opts=ResourceOptions(parent=self),
        )

        # Expose outputs
        self.api_gateway_url = self.api_stage.invoke_url.apply(
            lambda url: f"{url}/payments"
        )
        self.lambda_function_name = self.lambda_function.name

        self.register_outputs({
            "api_gateway_url": self.api_gateway_url,
            "lambda_function_name": self.lambda_function_name,
        })
