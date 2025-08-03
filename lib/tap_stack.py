"""
Production-ready serverless S3 to Lambda trigger infrastructure.
This script deploys a complete serverless architecture on AWS using Pulumi.
"""

import json
import pulumi
import pulumi_aws as aws
from pulumi import Output
from typing import Dict, Any


class TapStackArgs:
    """Arguments for TapStack configuration."""
    def __init__(self, environment_suffix: str = 'dev'):
        self.environment_suffix = environment_suffix


class TapStack(pulumi.ComponentResource):
    """
    TapStack that creates serverless S3 to Lambda trigger infrastructure.
    """
    
    def __init__(self, name: str, args: TapStackArgs, opts: pulumi.ResourceOptions = None):
        super().__init__('tap:index:TapStack', name, {}, opts)
        
        # Create S3 bucket with versioning
        self.bucket = self._create_s3_bucket()
        
        # Create IAM role for Lambda
        self.lambda_role = self._create_lambda_role()
        
        # Create IAM policy with least privilege permissions
        self.lambda_policy = self._create_lambda_policy(self.bucket.arn)
        
        # Attach policy to role
        aws.iam.RolePolicyAttachment(
            "lambda-policy-attachment",
            role=self.lambda_role.name,
            policy_arn=self.lambda_policy.arn,
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        # Create Lambda function
        self.lambda_function = self._create_lambda_function(self.lambda_role.arn)
        
        # Setup S3 to Lambda trigger
        self._setup_s3_lambda_trigger(self.bucket, self.lambda_function)
        
        # Export important resource ARNs
        self.bucket_arn = self.bucket.arn
        self.bucket_name = self.bucket.id
        self.lambda_function_arn = self.lambda_function.arn
        self.lambda_function_name = self.lambda_function.name
        self.lambda_role_arn = self.lambda_role.arn
        
        self.register_outputs({
            'bucket_arn': self.bucket_arn,
            'bucket_name': self.bucket_name,
            'lambda_function_arn': self.lambda_function_arn,
            'lambda_function_name': self.lambda_function_name,
            'lambda_role_arn': self.lambda_role_arn,
            'test_command': self.bucket.id.apply(
                lambda name: f"aws s3 cp test-file.txt s3://{name}/ --region us-east-1"
            )
        })


    def _create_lambda_role(self) -> aws.iam.Role:
        """
        Create IAM role for Lambda function with least privilege principle.
        
        Returns:
            aws.iam.Role: The created IAM role for Lambda
        """
        # Define the trust policy for Lambda service
        lambda_assume_role_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "lambda.amazonaws.com"
                    }
                }
            ]
        }
        
        # Create the IAM role
        lambda_role = aws.iam.Role(
            "lambda-execution-role",
            assume_role_policy=json.dumps(lambda_assume_role_policy),
            description="IAM role for S3-triggered Lambda function",
            tags={
                "Environment": "production",
                "Project": "serverless-s3-lambda",
                "ManagedBy": "Pulumi"
            },
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        return lambda_role


    def _create_lambda_policy(self, bucket_arn: Output[str]) -> aws.iam.Policy:
        """
        Create IAM policy with minimal required permissions.
        
        Args:
            bucket_arn: ARN of the S3 bucket to grant read access
            
        Returns:
            aws.iam.Policy: The created IAM policy
        """
        # Define policy with least privilege permissions
        lambda_policy_document = bucket_arn.apply(
            lambda arn: json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "logs:CreateLogGroup",
                            "logs:CreateLogStream",
                            "logs:PutLogEvents"
                        ],
                        "Resource": "arn:aws:logs:*:*:*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:GetObject",
                            "s3:GetObjectVersion"
                        ],
                        "Resource": f"{arn}/*"
                    }
                ]
            })
        )
        
        # Create the IAM policy
        lambda_policy = aws.iam.Policy(
            "lambda-s3-policy",
            policy=lambda_policy_document,
            description="Policy for Lambda function to access S3 and CloudWatch Logs",
            tags={
                "Environment": "production",
                "Project": "serverless-s3-lambda",
                "ManagedBy": "Pulumi"
            },
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        return lambda_policy


    def _create_s3_bucket(self) -> aws.s3.BucketV2:
        """
        Create S3 bucket with versioning enabled and proper configuration.
        
        Returns:
            aws.s3.BucketV2: The created S3 bucket
        """
        # Create S3 bucket with descriptive name
        bucket = aws.s3.BucketV2(
            "serverless-trigger-bucket",
            tags={
                "Environment": "production",
                "Project": "serverless-s3-lambda",
                "Purpose": "Lambda trigger source",
                "ManagedBy": "Pulumi"
            },
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        # Enable versioning on the bucket
        aws.s3.BucketVersioningV2(
            "bucket-versioning",
            bucket=bucket.id,
            versioning_configuration=aws.s3.BucketVersioningV2VersioningConfigurationArgs(
                status="Enabled"
            ),
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        # Configure server-side encryption
        aws.s3.BucketServerSideEncryptionConfigurationV2(
            "bucket-encryption",
            bucket=bucket.id,
            rules=[
                aws.s3.BucketServerSideEncryptionConfigurationV2RuleArgs(
                    apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs(
                        sse_algorithm="AES256"
                    )
                )
            ],
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        # Block public access for security
        aws.s3.BucketPublicAccessBlock(
            "bucket-public-access-block",
            bucket=bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        return bucket


    def _create_lambda_function(self, role_arn: Output[str]) -> aws.lambda_.Function:
        """
        Create Lambda function with proper configuration.
        
        Args:
            role_arn: ARN of the IAM role for the Lambda function
            
        Returns:
            aws.lambda_.Function: The created Lambda function
        """
        # Create deployment package from local code
        lambda_function = aws.lambda_.Function(
            "s3-processor-lambda",
            runtime="python3.9",
            code=pulumi.AssetArchive({
                ".": pulumi.FileArchive("./lambda_code")
            }),
            handler="main.lambda_handler",
            role=role_arn,
            timeout=300,  # 5 minutes
            memory_size=256,  # MB
            description="Lambda function to process S3 events",
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    "LOG_LEVEL": "INFO",
                    "ENVIRONMENT": "production"
                }
            ),
            tags={
                "Environment": "production",
                "Project": "serverless-s3-lambda",
                "ManagedBy": "Pulumi"
            },
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        return lambda_function


    def _setup_s3_lambda_trigger(self, bucket: aws.s3.BucketV2, lambda_function: aws.lambda_.Function) -> None:
        """
        Configure S3 bucket to trigger Lambda function on object creation.
        
        Args:
            bucket: The S3 bucket to configure
            lambda_function: The Lambda function to trigger
        """
        # Grant S3 permission to invoke the Lambda function
        lambda_permission = aws.lambda_.Permission(
            "s3-invoke-lambda-permission",
            action="lambda:InvokeFunction",
            function=lambda_function.name,
            principal="s3.amazonaws.com",
            source_arn=bucket.arn.apply(lambda arn: f"{arn}/*"),
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        # Configure S3 bucket notification to trigger Lambda
        aws.s3.BucketNotification(
            "s3-lambda-notification",
            bucket=bucket.id,
            lambda_functions=[
                aws.s3.BucketNotificationLambdaFunctionArgs(
                    lambda_function_arn=lambda_function.arn,
                    events=["s3:ObjectCreated:*"],
                    filter_prefix="",  # Process all objects
                    filter_suffix=""   # No suffix filter
                )
            ],
            opts=pulumi.ResourceOptions(depends_on=[lambda_permission], parent=self)
        )


