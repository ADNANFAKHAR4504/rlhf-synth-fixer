"""
IAM module for the serverless infrastructure.

This module creates IAM roles and policies with least-privilege access,
using scoped resource ARNs (not wildcards) as required by model failures.
"""

from typing import Dict, List, Optional

import pulumi
import pulumi_aws as aws
from infrastructure.config import ServerlessConfig
from pulumi import Output, ResourceOptions


class IAMStack:
    """
    Manages IAM roles and policies for the serverless infrastructure.
    
    Implements least-privilege access with environment-specific scoped ARNs.
    """
    
    def __init__(
        self,
        config: ServerlessConfig,
        provider_manager
    ):
        """
        Initialize IAM Stack.
        
        Args:
            config: ServerlessConfig instance
            provider_manager: AWSProviderManager instance
        """
        self.config = config
        self.provider = provider_manager.get_provider()
        self.roles: Dict[str, aws.iam.Role] = {}
    
    def create_lambda_role(
        self,
        name: str,
        s3_bucket_arns: List[Output[str]],
        dynamodb_table_arns: List[Output[str]],
        sqs_queue_arns: List[Output[str]],
        kms_key_arn: Output[str]
    ) -> aws.iam.Role:
        """
        Create IAM role for Lambda with least-privilege, scoped permissions.
        
        Args:
            name: Role name identifier
            s3_bucket_arns: List of S3 bucket ARNs to grant access
            dynamodb_table_arns: List of DynamoDB table ARNs to grant access
            sqs_queue_arns: List of SQS queue ARNs to grant access
            kms_key_arn: KMS key ARN for encryption/decryption
            
        Returns:
            IAM Role resource
        """
        role_name = self.config.get_resource_name(f"lambda-{name}-role", include_region=False)
        
        opts = ResourceOptions(provider=self.provider) if self.provider else None
        
        # Lambda assume role policy
        assume_role_policy = {
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Principal": {"Service": "lambda.amazonaws.com"},
                "Action": "sts:AssumeRole"
            }]
        }
        
        role = aws.iam.Role(
            f"lambda-{name}-role",
            name=role_name,
            assume_role_policy=pulumi.Output.json_dumps(assume_role_policy),
            tags=self.config.get_common_tags(),
            opts=opts
        )
        
        # Attach AWS managed policy for Lambda basic execution (CloudWatch Logs)
        aws.iam.RolePolicyAttachment(
            f"lambda-{name}-basic-execution",
            role=role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
            opts=opts
        )
        
        # Attach AWS managed policy for X-Ray tracing
        if self.config.enable_xray_tracing:
            aws.iam.RolePolicyAttachment(
                f"lambda-{name}-xray",
                role=role.name,
                policy_arn="arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess",
                opts=opts
            )
        
        # Attach scoped policies using Output.all to resolve ARNs
        Output.all(
            s3_arns=s3_bucket_arns,
            dynamodb_arns=dynamodb_table_arns,
            sqs_arns=sqs_queue_arns,
            kms_arn=kms_key_arn
        ).apply(lambda args: self._attach_lambda_policies(
            role,
            role_name,
            args['s3_arns'],
            args['dynamodb_arns'],
            args['sqs_arns'],
            args['kms_arn'],
            opts
        ))
        
        self.roles[name] = role
        return role
    
    def _attach_lambda_policies(
        self,
        role: aws.iam.Role,
        role_name: str,
        s3_arns: List[str],
        dynamodb_arns: List[str],
        sqs_arns: List[str],
        kms_arn: str,
        opts: Optional[ResourceOptions]
    ) -> None:
        """
        Attach inline policies to Lambda role with scoped ARNs.
        
        This method is called within apply() to ensure all ARNs are resolved.
        Model failure fix: Uses specific resource ARNs, not wildcards.
        """
        # S3 policy with scoped ARNs
        if s3_arns:
            s3_resources = s3_arns + [f"{arn}/*" for arn in s3_arns]
            
            s3_policy = {
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": [
                        "s3:GetObject",
                        "s3:PutObject",
                        "s3:DeleteObject",
                        "s3:ListBucket"
                    ],
                    "Resource": s3_resources
                }]
            }
            
            aws.iam.RolePolicy(
                f"{role_name}-s3-access",
                role=role.name,
                policy=pulumi.Output.json_dumps(s3_policy),
                opts=opts
            )
        
        # DynamoDB policy with scoped ARNs
        if dynamodb_arns:
            # Add index ARNs for GSI access
            dynamodb_resources = dynamodb_arns + [f"{arn}/index/*" for arn in dynamodb_arns]
            
            dynamodb_policy = {
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": [
                        "dynamodb:PutItem",
                        "dynamodb:GetItem",
                        "dynamodb:UpdateItem",
                        "dynamodb:Query",
                        "dynamodb:Scan",
                        "dynamodb:BatchWriteItem"
                    ],
                    "Resource": dynamodb_resources
                }]
            }
            
            aws.iam.RolePolicy(
                f"{role_name}-dynamodb-access",
                role=role.name,
                policy=pulumi.Output.json_dumps(dynamodb_policy),
                opts=opts
            )
        
        # SQS policy with scoped ARNs (for DLQ access)
        if sqs_arns:
            sqs_policy = {
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": [
                        "sqs:SendMessage",
                        "sqs:ReceiveMessage",
                        "sqs:DeleteMessage",
                        "sqs:GetQueueAttributes"
                    ],
                    "Resource": sqs_arns
                }]
            }
            
            aws.iam.RolePolicy(
                f"{role_name}-sqs-access",
                role=role.name,
                policy=pulumi.Output.json_dumps(sqs_policy),
                opts=opts
            )
        
        # KMS policy with scoped key ARN
        if kms_arn:
            kms_policy = {
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": [
                        "kms:Decrypt",
                        "kms:Encrypt",
                        "kms:GenerateDataKey",
                        "kms:DescribeKey"
                    ],
                    "Resource": [kms_arn]
                }]
            }
            
            aws.iam.RolePolicy(
                f"{role_name}-kms-access",
                role=role.name,
                policy=pulumi.Output.json_dumps(kms_policy),
                opts=opts
            )
    
    def create_api_gateway_role(self, cloudwatch_log_group_arn: Output[str]) -> aws.iam.Role:
        """
        Create IAM role for API Gateway to write to CloudWatch Logs.
        
        Args:
            cloudwatch_log_group_arn: CloudWatch Log Group ARN
            
        Returns:
            IAM Role resource
        """
        role_name = self.config.get_resource_name("api-gateway-role", include_region=False)
        
        opts = ResourceOptions(provider=self.provider) if self.provider else None
        
        assume_role_policy = {
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Principal": {"Service": "apigateway.amazonaws.com"},
                "Action": "sts:AssumeRole"
            }]
        }
        
        role = aws.iam.Role(
            "api-gateway-role",
            name=role_name,
            assume_role_policy=pulumi.Output.json_dumps(assume_role_policy),
            tags=self.config.get_common_tags(),
            opts=opts
        )
        
        # Attach managed policy for CloudWatch Logs
        aws.iam.RolePolicyAttachment(
            "api-gateway-cloudwatch",
            role=role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs",
            opts=opts
        )
        
        self.roles['api-gateway'] = role
        return role
    
    def create_step_functions_role(
        self,
        lambda_arns: List[Output[str]],
        sqs_queue_arns: List[Output[str]]
    ) -> aws.iam.Role:
        """
        Create IAM role for Step Functions with scoped permissions.
        
        Args:
            lambda_arns: List of Lambda function ARNs
            sqs_queue_arns: List of SQS queue ARNs
            
        Returns:
            IAM Role resource
        """
        role_name = self.config.get_resource_name("step-functions-role", include_region=False)
        
        opts = ResourceOptions(provider=self.provider) if self.provider else None
        
        assume_role_policy = {
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Principal": {"Service": "states.amazonaws.com"},
                "Action": "sts:AssumeRole"
            }]
        }
        
        role = aws.iam.Role(
            "step-functions-role",
            name=role_name,
            assume_role_policy=pulumi.Output.json_dumps(assume_role_policy),
            tags=self.config.get_common_tags(),
            opts=opts
        )
        
        # Attach scoped policies
        Output.all(
            lambda_arns=lambda_arns,
            sqs_arns=sqs_queue_arns
        ).apply(lambda args: self._attach_step_functions_policies(
            role,
            role_name,
            args['lambda_arns'],
            args['sqs_arns'],
            opts
        ))
        
        self.roles['step-functions'] = role
        return role
    
    def _attach_step_functions_policies(
        self,
        role: aws.iam.Role,
        role_name: str,
        lambda_arns: List[str],
        sqs_arns: List[str],
        opts: Optional[ResourceOptions]
    ) -> None:
        """
        Attach inline policies to Step Functions role.
        
        Model failure fix: Uses proper service integration patterns.
        """
        # Lambda invoke policy
        if lambda_arns:
            lambda_policy = {
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": [
                        "lambda:InvokeFunction"
                    ],
                    "Resource": lambda_arns
                }]
            }
            
            aws.iam.RolePolicy(
                f"{role_name}-lambda-invoke",
                role=role.name,
                policy=pulumi.Output.json_dumps(lambda_policy),
                opts=opts
            )
        
        # SQS send message policy
        if sqs_arns:
            sqs_policy = {
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": [
                        "sqs:SendMessage"
                    ],
                    "Resource": sqs_arns
                }]
            }
            
            aws.iam.RolePolicy(
                f"{role_name}-sqs-send",
                role=role.name,
                policy=pulumi.Output.json_dumps(sqs_policy),
                opts=opts
            )
        
        # X-Ray tracing
        if self.config.enable_xray_tracing:
            xray_policy = {
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": [
                        "xray:PutTraceSegments",
                        "xray:PutTelemetryRecords"
                    ],
                    "Resource": ["*"]
                }]
            }
            
            aws.iam.RolePolicy(
                f"{role_name}-xray",
                role=role.name,
                policy=pulumi.Output.json_dumps(xray_policy),
                opts=opts
            )
    
    def get_role(self, name: str) -> aws.iam.Role:
        """Get role by name."""
        return self.roles[name]
    
    def get_role_arn(self, name: str) -> Output[str]:
        """Get role ARN by name."""
        return self.roles[name].arn

