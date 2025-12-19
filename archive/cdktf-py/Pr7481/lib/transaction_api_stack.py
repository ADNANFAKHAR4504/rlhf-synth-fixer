"""Transaction API Stack - Serverless API with Lambda, S3, and API Gateway"""

import json
from constructs import Construct
from cdktf import TerraformStack, TerraformVariable, TerraformOutput
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_versioning import (
    S3BucketVersioningA,
    S3BucketVersioningVersioningConfiguration
)
from cdktf_cdktf_provider_aws.s3_bucket_server_side_encryption_configuration import (
    S3BucketServerSideEncryptionConfigurationA,
    S3BucketServerSideEncryptionConfigurationRuleA,
    S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA
)
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy import IamRolePolicy
from cdktf_cdktf_provider_aws.lambda_function import LambdaFunction
from cdktf_cdktf_provider_aws.api_gateway_rest_api import ApiGatewayRestApi
from cdktf_cdktf_provider_aws.api_gateway_resource import ApiGatewayResource
from cdktf_cdktf_provider_aws.api_gateway_method import ApiGatewayMethod
from cdktf_cdktf_provider_aws.api_gateway_integration import ApiGatewayIntegration
from cdktf_cdktf_provider_aws.api_gateway_deployment import ApiGatewayDeployment
from cdktf_cdktf_provider_aws.api_gateway_stage import ApiGatewayStage
from cdktf_cdktf_provider_aws.lambda_permission import LambdaPermission
from cdktf_cdktf_provider_aws.data_aws_caller_identity import DataAwsCallerIdentity


class TransactionApiStack(TerraformStack):
    """Transaction Processing API Infrastructure Stack"""

    def __init__(self, scope: Construct, stack_id: str):
        super().__init__(scope, stack_id)

        # Provider - use us-west-2 to match CI/CD environment
        AwsProvider(self, "AWS", region="us-west-2")

        # Get AWS account ID
        current = DataAwsCallerIdentity(self, "current")

        # Variable for unique resource naming (must be short to fit AWS naming limits)
        env_suffix = TerraformVariable(
            self,
            "environmentSuffix",
            type="string",
            description="Unique suffix for resource naming to avoid conflicts",
            default="dev"
        )

        # S3 Bucket for transaction files with unique name
        transaction_bucket = S3Bucket(
            self,
            "TransactionBucket",
            bucket=f"transaction-files-{env_suffix.string_value}",
            tags={"Name": "Transaction Files Bucket", "Environment": "dev"}
        )

        # Enable versioning on S3 bucket
        S3BucketVersioningA(
            self,
            "TransactionBucketVersioning",
            bucket=transaction_bucket.id,
            versioning_configuration=S3BucketVersioningVersioningConfiguration(
                status="Enabled"
            )
        )

        # Enable encryption on S3 bucket
        S3BucketServerSideEncryptionConfigurationA(
            self,
            "TransactionBucketEncryption",
            bucket=transaction_bucket.id,
            rule=[
                S3BucketServerSideEncryptionConfigurationRuleA(
                    apply_server_side_encryption_by_default=(
                        S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA(
                            sse_algorithm="AES256"
                        )
                    )
                )
            ]
        )

        # IAM Role for Lambda functions
        lambda_role = IamRole(
            self,
            "LambdaExecutionRole",
            name=f"transaction-api-lambda-role-{env_suffix.string_value}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "lambda.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={"Name": "Transaction API Lambda Role"}
        )

        # IAM Policy for Lambda to access S3 and CloudWatch Logs
        IamRolePolicy(
            self,
            "LambdaS3Policy",
            role=lambda_role.id,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:GetObject",
                            "s3:PutObject",
                            "s3:DeleteObject",
                            "s3:ListBucket"
                        ],
                        "Resource": [
                            transaction_bucket.arn,
                            f"{transaction_bucket.arn}/*"
                        ]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "logs:CreateLogGroup",
                            "logs:CreateLogStream",
                            "logs:PutLogEvents"
                        ],
                        "Resource": "arn:aws:logs:*:*:*"
                    }
                ]
            })
        )

        # Lambda Function: Upload Handler (ZIP package with inline code)
        upload_handler_code = """
import json
import boto3
import os
from datetime import datetime

s3_client = boto3.client('s3')
bucket_name = os.environ['BUCKET_NAME']

def handler(event, context):
    try:
        body = json.loads(event.get('body', '{}'))
        transaction_id = body.get('transactionId', f"txn-{datetime.now().timestamp()}")
        file_content = body.get('fileContent', '')

        # Upload to S3
        s3_client.put_object(
            Bucket=bucket_name,
            Key=f"uploads/{transaction_id}.json",
            Body=file_content,
            ContentType='application/json'
        )

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'File uploaded successfully',
                'transactionId': transaction_id
            })
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
"""

        upload_lambda = LambdaFunction(
            self,
            "UploadHandler",
            function_name=f"transaction-upload-handler-{env_suffix.string_value}",
            role=lambda_role.arn,
            handler="lambda_upload.handler",
            runtime="python3.9",
            architectures=["arm64"],
            memory_size=256,
            timeout=30,
            environment={"variables": {"BUCKET_NAME": transaction_bucket.id}},
            source_code_hash="${filebase64sha256(\"lib/lambda_upload.zip\")}",
            filename="lib/lambda_upload.zip",
            tags={"Name": "Upload Handler"}
        )

        # Lambda Function: Process Handler (ZIP package with inline code)
        process_handler_code = """
import json
import boto3
import os

s3_client = boto3.client('s3')
bucket_name = os.environ['BUCKET_NAME']

def handler(event, context):
    try:
        transaction_id = event['pathParameters']['transactionId']

        # Get file from S3
        response = s3_client.get_object(
            Bucket=bucket_name,
            Key=f"uploads/{transaction_id}.json"
        )
        file_content = response['Body'].read().decode('utf-8')

        # Process transaction (simple example)
        transaction_data = json.loads(file_content)
        processed_data = {
            'transactionId': transaction_id,
            'status': 'processed',
            'data': transaction_data
        }

        # Save processed result
        s3_client.put_object(
            Bucket=bucket_name,
            Key=f"processed/{transaction_id}.json",
            Body=json.dumps(processed_data),
            ContentType='application/json'
        )

        return {
            'statusCode': 200,
            'body': json.dumps(processed_data)
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
"""

        process_lambda = LambdaFunction(
            self,
            "ProcessHandler",
            function_name=f"transaction-process-handler-{env_suffix.string_value}",
            role=lambda_role.arn,
            handler="lambda_process.handler",
            runtime="python3.9",
            architectures=["arm64"],
            memory_size=256,
            timeout=60,
            environment={"variables": {"BUCKET_NAME": transaction_bucket.id}},
            source_code_hash="${filebase64sha256(\"lib/lambda_process.zip\")}",
            filename="lib/lambda_process.zip",
            tags={"Name": "Process Handler"}
        )

        # Lambda Function: Status Handler (ZIP package with inline code)
        status_handler_code = """
import json
import boto3
import os

s3_client = boto3.client('s3')
bucket_name = os.environ['BUCKET_NAME']

def handler(event, context):
    try:
        transaction_id = event['pathParameters']['transactionId']

        # Check if processed file exists
        try:
            response = s3_client.get_object(
                Bucket=bucket_name,
                Key=f"processed/{transaction_id}.json"
            )
            status_data = json.loads(response['Body'].read().decode('utf-8'))
            return {
                'statusCode': 200,
                'body': json.dumps(status_data)
            }
        except s3_client.exceptions.NoSuchKey:
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'transactionId': transaction_id,
                    'status': 'pending'
                })
            }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
"""

        status_lambda = LambdaFunction(
            self,
            "StatusHandler",
            function_name=f"transaction-status-handler-{env_suffix.string_value}",
            role=lambda_role.arn,
            handler="lambda_status.handler",
            runtime="python3.9",
            architectures=["arm64"],
            memory_size=256,
            timeout=30,
            environment={"variables": {"BUCKET_NAME": transaction_bucket.id}},
            source_code_hash="${filebase64sha256(\"lib/lambda_status.zip\")}",
            filename="lib/lambda_status.zip",
            tags={"Name": "Status Handler"}
        )

        # API Gateway REST API
        api = ApiGatewayRestApi(
            self,
            "TransactionApi",
            name=f"transaction-api-{env_suffix.string_value}",
            description="Transaction Processing API",
            endpoint_configuration={"types": ["REGIONAL"]}
        )

        # API Gateway Resources
        upload_resource = ApiGatewayResource(
            self,
            "UploadResource",
            rest_api_id=api.id,
            parent_id=api.root_resource_id,
            path_part="upload"
        )

        process_resource = ApiGatewayResource(
            self,
            "ProcessResource",
            rest_api_id=api.id,
            parent_id=api.root_resource_id,
            path_part="process"
        )

        process_id_resource = ApiGatewayResource(
            self,
            "ProcessIdResource",
            rest_api_id=api.id,
            parent_id=process_resource.id,
            path_part="{transactionId}"
        )

        status_resource = ApiGatewayResource(
            self,
            "StatusResource",
            rest_api_id=api.id,
            parent_id=api.root_resource_id,
            path_part="status"
        )

        status_id_resource = ApiGatewayResource(
            self,
            "StatusIdResource",
            rest_api_id=api.id,
            parent_id=status_resource.id,
            path_part="{transactionId}"
        )

        # API Gateway Methods
        upload_method = ApiGatewayMethod(
            self,
            "UploadMethod",
            rest_api_id=api.id,
            resource_id=upload_resource.id,
            http_method="POST",
            authorization="NONE"
        )

        process_method = ApiGatewayMethod(
            self,
            "ProcessMethod",
            rest_api_id=api.id,
            resource_id=process_id_resource.id,
            http_method="GET",
            authorization="NONE"
        )

        status_method = ApiGatewayMethod(
            self,
            "StatusMethod",
            rest_api_id=api.id,
            resource_id=status_id_resource.id,
            http_method="GET",
            authorization="NONE"
        )

        # API Gateway Integrations with explicit depends_on
        upload_integration = ApiGatewayIntegration(
            self,
            "UploadIntegration",
            rest_api_id=api.id,
            resource_id=upload_resource.id,
            http_method=upload_method.http_method,
            integration_http_method="POST",
            type="AWS_PROXY",
            uri=upload_lambda.invoke_arn,
            depends_on=[upload_method, upload_lambda]
        )

        process_integration = ApiGatewayIntegration(
            self,
            "ProcessIntegration",
            rest_api_id=api.id,
            resource_id=process_id_resource.id,
            http_method=process_method.http_method,
            integration_http_method="POST",
            type="AWS_PROXY",
            uri=process_lambda.invoke_arn,
            depends_on=[process_method, process_lambda]
        )

        status_integration = ApiGatewayIntegration(
            self,
            "StatusIntegration",
            rest_api_id=api.id,
            resource_id=status_id_resource.id,
            http_method=status_method.http_method,
            integration_http_method="POST",
            type="AWS_PROXY",
            uri=status_lambda.invoke_arn,
            depends_on=[status_method, status_lambda]
        )

        # Lambda Permissions for API Gateway
        LambdaPermission(
            self,
            "UploadLambdaPermission",
            statement_id="AllowExecutionFromAPIGateway",
            action="lambda:InvokeFunction",
            function_name=upload_lambda.function_name,
            principal="apigateway.amazonaws.com",
            source_arn=f"{api.execution_arn}/*/*"
        )

        LambdaPermission(
            self,
            "ProcessLambdaPermission",
            statement_id="AllowExecutionFromAPIGateway",
            action="lambda:InvokeFunction",
            function_name=process_lambda.function_name,
            principal="apigateway.amazonaws.com",
            source_arn=f"{api.execution_arn}/*/*"
        )

        LambdaPermission(
            self,
            "StatusLambdaPermission",
            statement_id="AllowExecutionFromAPIGateway",
            action="lambda:InvokeFunction",
            function_name=status_lambda.function_name,
            principal="apigateway.amazonaws.com",
            source_arn=f"{api.execution_arn}/*/*"
        )

        # API Gateway Deployment
        deployment = ApiGatewayDeployment(
            self,
            "ApiDeployment",
            rest_api_id=api.id,
            depends_on=[
                upload_integration,
                process_integration,
                status_integration
            ],
            lifecycle={"create_before_destroy": True}
        )

        # API Gateway Stage
        stage = ApiGatewayStage(
            self,
            "ApiStage",
            deployment_id=deployment.id,
            rest_api_id=api.id,
            stage_name="dev"
        )

        # Outputs
        TerraformOutput(
            self,
            "api_endpoint",
            value=stage.invoke_url,
            description="API Gateway endpoint URL"
        )

        TerraformOutput(
            self,
            "bucket_name",
            value=transaction_bucket.id,
            description="S3 bucket name for transaction files"
        )

        TerraformOutput(
            self,
            "upload_lambda_arn",
            value=upload_lambda.arn,
            description="Upload Lambda function ARN"
        )

        TerraformOutput(
            self,
            "process_lambda_arn",
            value=process_lambda.arn,
            description="Process Lambda function ARN"
        )

        TerraformOutput(
            self,
            "status_lambda_arn",
            value=status_lambda.arn,
            description="Status Lambda function ARN"
        )
