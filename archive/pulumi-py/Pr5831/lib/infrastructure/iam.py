"""
IAM module for role and policy management.

This module creates IAM roles and policies with least-privilege access
for Lambda functions and other AWS services.
"""

import json
from typing import Dict, List, Optional

import pulumi_aws as aws
from pulumi import Output

from .aws_provider import AWSProviderManager
from .config import ServerlessProcessorConfig


class IAMStack:
    """
    Manages IAM roles and policies for the serverless processor.
    
    Creates least-privilege IAM roles for Lambda functions with scoped
    permissions to specific resources.
    """
    
    def __init__(
        self,
        config: ServerlessProcessorConfig,
        provider_manager: AWSProviderManager
    ):
        """
        Initialize the IAM stack.
        
        Args:
            config: ServerlessProcessorConfig instance
            provider_manager: AWSProviderManager instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.roles: Dict[str, aws.iam.Role] = {}
        self.policies: Dict[str, aws.iam.Policy] = {}
    
    def create_lambda_role(
        self,
        function_name: str,
        s3_bucket_arns: Optional[List[Output[str]]] = None,
        kms_key_arns: Optional[List[Output[str]]] = None,
        log_group_arn: Optional[Output[str]] = None
    ) -> aws.iam.Role:
        """
        Create an IAM role for a Lambda function with least-privilege permissions.
        
        Args:
            function_name: Name of the Lambda function
            s3_bucket_arns: List of S3 bucket ARNs to grant access to
            kms_key_arns: List of KMS key ARNs to grant access to
            log_group_arn: CloudWatch log group ARN for logging permissions
            
        Returns:
            Created IAM role
        """
        role_name = self.config.get_resource_name(f'{function_name}-role')
        
        assume_role_policy = {
            'Version': '2012-10-17',
            'Statement': [{
                'Effect': 'Allow',
                'Principal': {
                    'Service': 'lambda.amazonaws.com'
                },
                'Action': 'sts:AssumeRole'
            }]
        }
        
        role = aws.iam.Role(
            f'{function_name}-role',
            name=role_name,
            assume_role_policy=json.dumps(assume_role_policy),
            tags={
                **self.config.get_common_tags(),
                'Name': role_name,
                'Function': function_name
            },
            opts=self.provider_manager.get_resource_options()
        )
        
        policy_statements = []
        
        if log_group_arn:
            policy_statements.append(
                Output.all(log_group_arn).apply(lambda arns: {
                    'Effect': 'Allow',
                    'Action': [
                        'logs:CreateLogStream',
                        'logs:PutLogEvents'
                    ],
                    'Resource': [arns[0], f'{arns[0]}:*']
                })
            )
        
        if s3_bucket_arns:
            policy_statements.append(
                Output.all(*s3_bucket_arns).apply(lambda arns: {
                    'Effect': 'Allow',
                    'Action': [
                        's3:PutObject',
                        's3:GetObject',
                        's3:ListBucket'
                    ],
                    'Resource': [arn for arn in arns] + [f'{arn}/*' for arn in arns]
                })
            )
        
        if kms_key_arns:
            policy_statements.append(
                Output.all(*kms_key_arns).apply(lambda arns: {
                    'Effect': 'Allow',
                    'Action': [
                        'kms:Decrypt',
                        'kms:Encrypt',
                        'kms:GenerateDataKey',
                        'kms:DescribeKey'
                    ],
                    'Resource': list(arns)
                })
            )
        
        if self.config.enable_xray_tracing:
            policy_statements.append({
                'Effect': 'Allow',
                'Action': [
                    'xray:PutTraceSegments',
                    'xray:PutTelemetryRecords'
                ],
                'Resource': '*'
            })
        
        if policy_statements:
            policy_document = Output.all(*policy_statements).apply(
                lambda statements: json.dumps({
                    'Version': '2012-10-17',
                    'Statement': statements
                })
            )
            
            policy_name = self.config.get_resource_name(f'{function_name}-policy')
            
            policy = aws.iam.Policy(
                f'{function_name}-policy',
                name=policy_name,
                policy=policy_document,
                tags={
                    **self.config.get_common_tags(),
                    'Name': policy_name,
                    'Function': function_name
                },
                opts=self.provider_manager.get_resource_options()
            )
            
            aws.iam.RolePolicyAttachment(
                f'{function_name}-policy-attachment',
                role=role.name,
                policy_arn=policy.arn,
                opts=self.provider_manager.get_resource_options()
            )
            
            self.policies[function_name] = policy
        
        self.roles[function_name] = role
        return role
    
    def get_role_arn(self, function_name: str) -> Output[str]:
        """
        Get IAM role ARN.
        
        Args:
            function_name: Name of the function
            
        Returns:
            Role ARN as Output
        """
        return self.roles[function_name].arn
    
    def get_role_name(self, function_name: str) -> Output[str]:
        """
        Get IAM role name.
        
        Args:
            function_name: Name of the function
            
        Returns:
            Role name as Output
        """
        return self.roles[function_name].name

