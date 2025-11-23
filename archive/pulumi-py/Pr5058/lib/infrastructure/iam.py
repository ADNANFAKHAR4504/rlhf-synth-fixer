"""
IAM roles and policies with least-privilege access.

This module creates IAM roles for Lambda functions with minimal
permissions required for their specific operations.
"""

import json

import pulumi
import pulumi_aws as aws

from .config import ServerlessConfig


class IAMStack(pulumi.ComponentResource):
    """
    Manages IAM roles and policies for Lambda functions.
    
    Creates separate roles for each Lambda function with only the
    permissions they need, following the principle of least privilege.
    """
    
    def __init__(
        self,
        config: ServerlessConfig,
        provider: aws.Provider,
        parent: pulumi.Resource = None
    ):
        """
        Initialize IAM stack.
        
        Args:
            config: ServerlessConfig instance
            provider: AWS provider instance
            parent: Parent Pulumi resource
        """
        super().__init__(
            "serverless:iam:IAMStack",
            config.get_resource_name("iam"),
            None,
            pulumi.ResourceOptions(parent=parent, provider=provider)
        )
        
        self.config = config
        self.provider = provider
        
        # Create IAM roles
        self.api_handler_role = self._create_api_handler_role()
        self.file_processor_role = self._create_file_processor_role()
        self.stream_processor_role = self._create_stream_processor_role()
        
        self.register_outputs({})
    
    def _create_api_handler_role(self) -> aws.iam.Role:
        """
        Create IAM role for API handler Lambda function.
        
        Permissions:
        - Write to CloudWatch Logs
        - Read/Write to DynamoDB
        - Publish to SNS
        
        Returns:
            IAM Role for API handler
        """
        role = aws.iam.Role(
            resource_name=self.config.get_resource_name("role-api-handler"),
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
            tags=self.config.get_common_tags(),
            opts=pulumi.ResourceOptions(parent=self, provider=self.provider)
        )
        
        return role
    
    def _create_file_processor_role(self) -> aws.iam.Role:
        """
        Create IAM role for file processor Lambda function.
        
        Permissions:
        - Write to CloudWatch Logs
        - Read from S3
        - Write to DynamoDB
        - Publish to SNS
        
        Returns:
            IAM Role for file processor
        """
        role = aws.iam.Role(
            resource_name=self.config.get_resource_name("role-file-processor"),
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
            tags=self.config.get_common_tags(),
            opts=pulumi.ResourceOptions(parent=self, provider=self.provider)
        )
        
        return role
    
    def _create_stream_processor_role(self) -> aws.iam.Role:
        """
        Create IAM role for stream processor Lambda function.
        
        Permissions:
        - Write to CloudWatch Logs
        - Read from DynamoDB Streams
        - Publish to SNS
        
        Returns:
            IAM Role for stream processor
        """
        role = aws.iam.Role(
            resource_name=self.config.get_resource_name("role-stream-processor"),
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
            tags=self.config.get_common_tags(),
            opts=pulumi.ResourceOptions(parent=self, provider=self.provider)
        )
        
        return role
    
    def attach_cloudwatch_logs_policy(
        self,
        role: aws.iam.Role,
        log_group_arn: pulumi.Output[str],
        policy_name_suffix: str
    ) -> None:
        """
        Attach CloudWatch Logs policy to a role with least-privilege access.
        
        Args:
            role: IAM role to attach policy to
            log_group_arn: ARN of the CloudWatch Log Group
            policy_name_suffix: Suffix for policy name
        """
        policy = aws.iam.Policy(
            resource_name=self.config.get_resource_name(f"policy-logs-{policy_name_suffix}"),
            description=f"CloudWatch Logs access for {policy_name_suffix}",
            policy=log_group_arn.apply(lambda arn: json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": [
                        "logs:CreateLogStream",
                        "logs:PutLogEvents"
                    ],
                    "Resource": [f"{arn}:*"]
                }]
            })),
            tags=self.config.get_common_tags(),
            opts=pulumi.ResourceOptions(parent=self, provider=self.provider)
        )
        
        aws.iam.RolePolicyAttachment(
            resource_name=self.config.get_resource_name(f"attachment-logs-{policy_name_suffix}"),
            role=role.name,
            policy_arn=policy.arn,
            opts=pulumi.ResourceOptions(parent=self, provider=self.provider)
        )
    
    def attach_dynamodb_policy(
        self,
        role: aws.iam.Role,
        table_arn: pulumi.Output[str],
        policy_name_suffix: str,
        read_only: bool = False
    ) -> None:
        """
        Attach DynamoDB policy to a role with least-privilege access.
        
        Args:
            role: IAM role to attach policy to
            table_arn: ARN of the DynamoDB table
            policy_name_suffix: Suffix for policy name
            read_only: If True, only grant read permissions
        """
        actions = [
            "dynamodb:GetItem",
            "dynamodb:Query",
            "dynamodb:Scan"
        ]
        
        if not read_only:
            actions.extend([
                "dynamodb:PutItem",
                "dynamodb:UpdateItem",
                "dynamodb:DeleteItem"
            ])
        
        policy = aws.iam.Policy(
            resource_name=self.config.get_resource_name(f"policy-dynamodb-{policy_name_suffix}"),
            description=f"DynamoDB access for {policy_name_suffix}",
            policy=table_arn.apply(lambda arn: json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": actions,
                    "Resource": [
                        arn,
                        f"{arn}/index/*"
                    ]
                }]
            })),
            tags=self.config.get_common_tags(),
            opts=pulumi.ResourceOptions(parent=self, provider=self.provider)
        )
        
        aws.iam.RolePolicyAttachment(
            resource_name=self.config.get_resource_name(f"attachment-dynamodb-{policy_name_suffix}"),
            role=role.name,
            policy_arn=policy.arn,
            opts=pulumi.ResourceOptions(parent=self, provider=self.provider)
        )
    
    def attach_dynamodb_streams_policy(
        self,
        role: aws.iam.Role,
        table_arn: pulumi.Output[str],
        policy_name_suffix: str
    ) -> None:
        """
        Attach DynamoDB Streams policy to a role.
        
        Args:
            role: IAM role to attach policy to
            table_arn: ARN of the DynamoDB table
            policy_name_suffix: Suffix for policy name
        """
        policy = aws.iam.Policy(
            resource_name=self.config.get_resource_name(f"policy-streams-{policy_name_suffix}"),
            description=f"DynamoDB Streams access for {policy_name_suffix}",
            policy=table_arn.apply(lambda arn: json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": [
                        "dynamodb:GetRecords",
                        "dynamodb:GetShardIterator",
                        "dynamodb:DescribeStream",
                        "dynamodb:ListStreams"
                    ],
                    "Resource": [f"{arn}/stream/*"]
                }]
            })),
            tags=self.config.get_common_tags(),
            opts=pulumi.ResourceOptions(parent=self, provider=self.provider)
        )
        
        aws.iam.RolePolicyAttachment(
            resource_name=self.config.get_resource_name(f"attachment-streams-{policy_name_suffix}"),
            role=role.name,
            policy_arn=policy.arn,
            opts=pulumi.ResourceOptions(parent=self, provider=self.provider)
        )
    
    def attach_s3_policy(
        self,
        role: aws.iam.Role,
        bucket_arn: pulumi.Output[str],
        policy_name_suffix: str,
        read_only: bool = True
    ) -> None:
        """
        Attach S3 policy to a role with least-privilege access.
        
        Args:
            role: IAM role to attach policy to
            bucket_arn: ARN of the S3 bucket
            policy_name_suffix: Suffix for policy name
            read_only: If True, only grant read permissions
        """
        actions = [
            "s3:GetObject",
            "s3:ListBucket"
        ]
        
        if not read_only:
            actions.extend([
                "s3:PutObject",
                "s3:DeleteObject"
            ])
        
        policy = aws.iam.Policy(
            resource_name=self.config.get_resource_name(f"policy-s3-{policy_name_suffix}"),
            description=f"S3 access for {policy_name_suffix}",
            policy=bucket_arn.apply(lambda arn: json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": actions,
                    "Resource": [
                        arn,
                        f"{arn}/*"
                    ]
                }]
            })),
            tags=self.config.get_common_tags(),
            opts=pulumi.ResourceOptions(parent=self, provider=self.provider)
        )
        
        aws.iam.RolePolicyAttachment(
            resource_name=self.config.get_resource_name(f"attachment-s3-{policy_name_suffix}"),
            role=role.name,
            policy_arn=policy.arn,
            opts=pulumi.ResourceOptions(parent=self, provider=self.provider)
        )
    
    def attach_sns_policy(
        self,
        role: aws.iam.Role,
        topic_arn: pulumi.Output[str],
        policy_name_suffix: str
    ) -> None:
        """
        Attach SNS policy to a role with least-privilege access.
        
        Args:
            role: IAM role to attach policy to
            topic_arn: ARN of the SNS topic
            policy_name_suffix: Suffix for policy name
        """
        policy = aws.iam.Policy(
            resource_name=self.config.get_resource_name(f"policy-sns-{policy_name_suffix}"),
            description=f"SNS access for {policy_name_suffix}",
            policy=topic_arn.apply(lambda arn: json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": ["sns:Publish"],
                    "Resource": [arn]
                }]
            })),
            tags=self.config.get_common_tags(),
            opts=pulumi.ResourceOptions(parent=self, provider=self.provider)
        )
        
        aws.iam.RolePolicyAttachment(
            resource_name=self.config.get_resource_name(f"attachment-sns-{policy_name_suffix}"),
            role=role.name,
            policy_arn=policy.arn,
            opts=pulumi.ResourceOptions(parent=self, provider=self.provider)
        )

