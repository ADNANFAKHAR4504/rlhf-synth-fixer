"""
IAM module for least-privilege roles and policies.

This module creates IAM roles with scoped permissions for Lambda functions,
Step Functions, and SNS. All policies use specific resource ARNs instead of wildcards.
"""

import json

import pulumi_aws as aws
from pulumi import Output

from .aws_provider import AWSProviderManager
from .config import FileUploadConfig


class IAMStack:
    """
    Manages IAM roles and policies with least-privilege principles.
    
    Creates IAM roles with:
    - Scoped resource ARNs (no wildcards)
    - Proper Output handling for policy documents
    - Separate policies for different services
    """
    
    def __init__(
        self,
        config: FileUploadConfig,
        provider_manager: AWSProviderManager
    ):
        """
        Initialize the IAM stack.
        
        Args:
            config: FileUploadConfig instance
            provider_manager: AWSProviderManager instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.roles = {}
        self.policies = {}
    
    def create_lambda_role(
        self,
        function_name: str,
        log_group_arn: Output[str] = None,
        s3_bucket_arns: list = None,
        dynamodb_table_arns: list = None,
        kms_key_arns: list = None,
        sns_topic_arns: list = None,
        dlq_arn: Output[str] = None,
        enable_xray: bool = True
    ) -> aws.iam.Role:
        """
        Create an IAM role for a Lambda function with least-privilege permissions.
        
        Args:
            function_name: Name of the Lambda function
            log_group_arn: CloudWatch Logs group ARN
            s3_bucket_arns: List of S3 bucket ARNs
            dynamodb_table_arns: List of DynamoDB table ARNs
            kms_key_arns: List of KMS key ARNs
            sns_topic_arns: List of SNS topic ARNs
            dlq_arn: Dead letter queue ARN
            enable_xray: Whether to enable X-Ray tracing
            
        Returns:
            IAM Role resource
        """
        role_name = f'{function_name}-role'
        resource_name = self.config.get_resource_name(role_name)
        
        assume_role_policy = {
            'Version': '2012-10-17',
            'Statement': [{
                'Action': 'sts:AssumeRole',
                'Principal': {
                    'Service': 'lambda.amazonaws.com'
                },
                'Effect': 'Allow'
            }]
        }
        
        role = aws.iam.Role(
            role_name,
            name=resource_name,
            assume_role_policy=json.dumps(assume_role_policy),
            tags={
                **self.config.get_common_tags(),
                'Name': resource_name,
                'Purpose': f'Lambda execution role for {function_name}'
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
                        's3:GetObject',
                        's3:PutObject',
                        's3:ListBucket'
                    ],
                    'Resource': [arn for arn in arns] + [f'{arn}/*' for arn in arns]
                })
            )
        
        if dynamodb_table_arns:
            policy_statements.append(
                Output.all(*dynamodb_table_arns).apply(lambda arns: {
                    'Effect': 'Allow',
                    'Action': [
                        'dynamodb:PutItem',
                        'dynamodb:GetItem',
                        'dynamodb:UpdateItem',
                        'dynamodb:Query',
                        'dynamodb:Scan'
                    ],
                    'Resource': list(arns)
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
        
        if sns_topic_arns:
            policy_statements.append(
                Output.all(*sns_topic_arns).apply(lambda arns: {
                    'Effect': 'Allow',
                    'Action': [
                        'sns:Publish'
                    ],
                    'Resource': list(arns)
                })
            )
        
        if dlq_arn:
            policy_statements.append(
                Output.all(dlq_arn).apply(lambda arns: {
                    'Effect': 'Allow',
                    'Action': [
                        'sqs:SendMessage',
                        'sqs:GetQueueAttributes'
                    ],
                    'Resource': [arns[0]]
                })
            )
        
        if enable_xray:
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
            
            policy_name = f'{function_name}-policy'
            policy_resource_name = self.config.get_resource_name(policy_name)
            
            policy = aws.iam.Policy(
                policy_name,
                name=policy_resource_name,
                policy=policy_document,
                tags={
                    **self.config.get_common_tags(),
                    'Name': policy_resource_name
                },
                opts=self.provider_manager.get_resource_options()
            )
            
            aws.iam.RolePolicyAttachment(
                f'{function_name}-policy-attachment',
                role=role.name,
                policy_arn=policy.arn,
                opts=self.provider_manager.get_resource_options(depends_on=[role, policy])
            )
            
            self.policies[policy_name] = policy
        
        self.roles[role_name] = role
        return role
    
    def create_step_functions_role(
        self,
        workflow_name: str,
        lambda_arns: list = None,
        log_group_arn: Output[str] = None
    ) -> aws.iam.Role:
        """
        Create an IAM role for Step Functions with least-privilege permissions.
        
        Args:
            workflow_name: Name of the Step Functions workflow
            lambda_arns: List of Lambda function ARNs to invoke
            log_group_arn: CloudWatch Logs group ARN
            
        Returns:
            IAM Role resource
        """
        role_name = f'{workflow_name}-role'
        resource_name = self.config.get_resource_name(role_name)
        
        assume_role_policy = {
            'Version': '2012-10-17',
            'Statement': [{
                'Action': 'sts:AssumeRole',
                'Principal': {
                    'Service': 'states.amazonaws.com'
                },
                'Effect': 'Allow'
            }]
        }
        
        role = aws.iam.Role(
            role_name,
            name=resource_name,
            assume_role_policy=json.dumps(assume_role_policy),
            tags={
                **self.config.get_common_tags(),
                'Name': resource_name,
                'Purpose': f'Step Functions execution role for {workflow_name}'
            },
            opts=self.provider_manager.get_resource_options()
        )
        
        policy_statements = []
        
        if lambda_arns:
            policy_statements.append(
                Output.all(*lambda_arns).apply(lambda arns: {
                    'Effect': 'Allow',
                    'Action': [
                        'lambda:InvokeFunction'
                    ],
                    'Resource': list(arns)
                })
            )
        
        if log_group_arn:
            policy_statements.append(
                Output.all(log_group_arn).apply(lambda arns: {
                    'Effect': 'Allow',
                    'Action': [
                        'logs:CreateLogDelivery',
                        'logs:GetLogDelivery',
                        'logs:UpdateLogDelivery',
                        'logs:DeleteLogDelivery',
                        'logs:ListLogDeliveries',
                        'logs:PutResourcePolicy',
                        'logs:DescribeResourcePolicies',
                        'logs:DescribeLogGroups'
                    ],
                    'Resource': '*'
                })
            )
        
        if self.config.enable_xray_tracing:
            policy_statements.append({
                'Effect': 'Allow',
                'Action': [
                    'xray:PutTraceSegments',
                    'xray:PutTelemetryRecords',
                    'xray:GetSamplingRules',
                    'xray:GetSamplingTargets'
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
            
            policy_name = f'{workflow_name}-policy'
            policy_resource_name = self.config.get_resource_name(policy_name)
            
            policy = aws.iam.Policy(
                policy_name,
                name=policy_resource_name,
                policy=policy_document,
                tags={
                    **self.config.get_common_tags(),
                    'Name': policy_resource_name
                },
                opts=self.provider_manager.get_resource_options()
            )
            
            aws.iam.RolePolicyAttachment(
                f'{workflow_name}-policy-attachment',
                role=role.name,
                policy_arn=policy.arn,
                opts=self.provider_manager.get_resource_options(depends_on=[role, policy])
            )
            
            self.policies[policy_name] = policy
        
        self.roles[role_name] = role
        return role
    
    def get_role(self, role_name: str) -> aws.iam.Role:
        """
        Get an IAM role by name.
        
        Args:
            role_name: Name of the role
            
        Returns:
            IAM Role resource
        """
        return self.roles.get(role_name)

