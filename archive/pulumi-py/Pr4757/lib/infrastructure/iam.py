"""
IAM module for environment migration solution.

This module creates tightly-scoped IAM roles and policies following
the principle of least privilege.
"""

import json
from typing import Dict, List, Optional

import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions

from .aws_provider import AWSProviderManager
from .config import MigrationConfig


class IAMStack:
    """
    Manages IAM roles and policies for the migration solution.
    
    Creates least-privilege IAM roles for Lambda functions, with inline
    policies scoped to specific resources.
    """
    
    def __init__(self, config: MigrationConfig, provider_manager: AWSProviderManager):
        """
        Initialize IAM stack.
        
        Args:
            config: Migration configuration
            provider_manager: AWS provider manager
        """
        self.config = config
        self.provider_manager = provider_manager
        self.lambda_roles: Dict[str, aws.iam.Role] = {}
        self.validation_roles: Dict[str, aws.iam.Role] = {}
        
        # Create IAM roles for all regions
        self._create_lambda_roles()
        self._create_validation_roles()
    
    def _create_lambda_roles(self):
        """Create Lambda execution roles for all regions."""
        for region in self.config.all_regions:
            role_name = self.config.get_resource_name('lambda-role', region)
            provider = self.provider_manager.get_provider(region)
            
            # Create Lambda execution role
            role = aws.iam.Role(
                role_name,
                name=role_name,
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
                tags=self.config.get_region_tags(region),
                opts=ResourceOptions(provider=provider)
            )
            
            self.lambda_roles[region] = role
    
    def _create_validation_roles(self):
        """Create roles for validation Lambda functions."""
        for region in self.config.all_regions:
            role_name = self.config.get_resource_name('validation-role', region)
            provider = self.provider_manager.get_provider(region)
            
            role = aws.iam.Role(
                role_name,
                name=role_name,
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
                tags=self.config.get_region_tags(region),
                opts=ResourceOptions(provider=provider)
            )
            
            self.validation_roles[region] = role
    
    def attach_cloudwatch_logs_policy(self, role: aws.iam.Role, region: str, log_group_arns: List[Output[str]]):
        """
        Attach tightly-scoped CloudWatch Logs policy to a role.
        
        Args:
            role: IAM role to attach policy to
            region: AWS region
            log_group_arns: List of CloudWatch log group ARNs
        """
        if not log_group_arns:
            return
            
        provider = self.provider_manager.get_provider(region)
        policy_name = self.config.get_resource_name('logs-policy', region)
        
        def create_policy_doc(arns_list):
            # arns_list will be a list of resolved ARN values
            valid_arns = [str(arn) for arn in arns_list if arn]
            # AWS IAM requires at least one statement
            if not valid_arns:
                # Create a deny-all statement as placeholder (will never match)
                return json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [{
                        "Effect": "Deny",
                        "Action": "logs:*",
                        "Resource": "arn:aws:logs:*:*:*"
                    }]
                }, indent=2)
            return json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": [
                        "logs:CreateLogStream",
                        "logs:PutLogEvents"
                    ],
                    "Resource": valid_arns
                }]
            }, indent=2)
        
        # Combine all ARNs into a single Output containing a list
        combined_arns = Output.all(*log_group_arns)
        policy_document = combined_arns.apply(lambda arns: create_policy_doc(list(arns)))
        
        aws.iam.RolePolicy(
            policy_name,
            role=role.id,
            policy=policy_document,
            opts=ResourceOptions(provider=provider, parent=role)
        )
    
    def attach_s3_policy(self, role: aws.iam.Role, region: str, bucket_arns: List[Output[str]]):
        """
        Attach tightly-scoped S3 policy to a role.
        
        Args:
            role: IAM role to attach policy to
            region: AWS region
            bucket_arns: List of S3 bucket ARNs
        """
        if not bucket_arns:
            return
            
        provider = self.provider_manager.get_provider(region)
        policy_name = self.config.get_resource_name('s3-policy', region)
        
        def create_policy_doc(arns_list):
            # arns_list will be a list of resolved ARN values
            valid_arns = [str(arn) for arn in arns_list if arn]
            # AWS IAM requires at least one statement
            if not valid_arns:
                return json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [{
                        "Effect": "Deny",
                        "Action": "s3:*",
                        "Resource": "arn:aws:s3:::*"
                    }]
                }, indent=2)
                
            resources = []
            for arn in valid_arns:
                resources.append(arn)
                resources.append(f"{arn}/*")
            
            return json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": [
                        "s3:GetObject",
                        "s3:PutObject",
                        "s3:ListBucket",
                        "s3:GetObjectVersion",
                        "s3:GetBucketVersioning"
                    ],
                    "Resource": resources
                }]
            }, indent=2)
        
        combined_arns = Output.all(*bucket_arns)
        policy_document = combined_arns.apply(lambda arns: create_policy_doc(list(arns)))
        
        aws.iam.RolePolicy(
            policy_name,
            role=role.id,
            policy=policy_document,
            opts=ResourceOptions(provider=provider, parent=role)
        )
    
    def attach_ssm_policy(self, role: aws.iam.Role, region: str, parameter_arns: List[Output[str]]):
        """
        Attach tightly-scoped SSM Parameter Store policy to a role.
        
        Args:
            role: IAM role to attach policy to
            region: AWS region
            parameter_arns: List of SSM parameter ARNs
        """
        if not parameter_arns:
            return
            
        provider = self.provider_manager.get_provider(region)
        policy_name = self.config.get_resource_name('ssm-policy', region)
        
        def create_policy_doc(arns_list):
            # arns_list will be a list of resolved ARN values
            valid_arns = [str(arn) for arn in arns_list if arn]
            # AWS IAM requires at least one statement
            if not valid_arns:
                return json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [{
                        "Effect": "Deny",
                        "Action": "ssm:*",
                        "Resource": "arn:aws:ssm:*:*:*"
                    }]
                }, indent=2)
            return json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": [
                        "ssm:GetParameter",
                        "ssm:GetParameters",
                        "ssm:GetParametersByPath"
                    ],
                    "Resource": valid_arns
                }]
            }, indent=2)
        
        combined_arns = Output.all(*parameter_arns)
        policy_document = combined_arns.apply(lambda arns: create_policy_doc(list(arns)))
        
        aws.iam.RolePolicy(
            policy_name,
            role=role.id,
            policy=policy_document,
            opts=ResourceOptions(provider=provider, parent=role)
        )
    
    def attach_secrets_manager_policy(self, role: aws.iam.Role, region: str, secret_arns: List[Output[str]]):
        """
        Attach tightly-scoped Secrets Manager policy to a role.
        
        Args:
            role: IAM role to attach policy to
            region: AWS region
            secret_arns: List of Secrets Manager secret ARNs
        """
        provider = self.provider_manager.get_provider(region)
        policy_name = self.config.get_resource_name('secrets-policy', region)
        
        def create_policy_doc(*arns):
            return json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": [
                        "secretsmanager:GetSecretValue",
                        "secretsmanager:DescribeSecret"
                    ],
                    "Resource": list(arns)
                }]
            })
        
        policy_document = Output.all(*secret_arns).apply(create_policy_doc)
        
        aws.iam.RolePolicy(
            policy_name,
            role=role.id,
            policy=policy_document,
            opts=ResourceOptions(provider=provider, parent=role)
        )
    
    def attach_sns_publish_policy(self, role: aws.iam.Role, region: str, topic_arns: List[Output[str]]):
        """
        Attach tightly-scoped SNS publish policy to a role.
        
        Args:
            role: IAM role to attach policy to
            region: AWS region
            topic_arns: List of SNS topic ARNs
        """
        if not topic_arns:
            return
            
        provider = self.provider_manager.get_provider(region)
        policy_name = self.config.get_resource_name('sns-policy', region)
        
        def create_policy_doc(arns_list):
            # arns_list will be a list of resolved ARN values
            valid_arns = [str(arn) for arn in arns_list if arn]
            # AWS IAM requires at least one statement
            if not valid_arns:
                return json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [{
                        "Effect": "Deny",
                        "Action": "sns:*",
                        "Resource": "arn:aws:sns:*:*:*"
                    }]
                }, indent=2)
            return json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": [
                        "sns:Publish"
                    ],
                    "Resource": valid_arns
                }]
            }, indent=2)
        
        combined_arns = Output.all(*topic_arns)
        policy_document = combined_arns.apply(lambda arns: create_policy_doc(list(arns)))
        
        aws.iam.RolePolicy(
            policy_name,
            role=role.id,
            policy=policy_document,
            opts=ResourceOptions(provider=provider, parent=role)
        )
    
    def get_lambda_role(self, region: str) -> aws.iam.Role:
        """
        Get Lambda execution role for a region.
        
        Args:
            region: AWS region
            
        Returns:
            IAM role for Lambda execution
        """
        return self.lambda_roles[region]
    
    def get_lambda_role_arn(self, region: str) -> Output[str]:
        """
        Get Lambda execution role ARN for a region.
        
        Args:
            region: AWS region
            
        Returns:
            ARN of the IAM role
        """
        return self.lambda_roles[region].arn
    
    def get_validation_role(self, region: str) -> aws.iam.Role:
        """
        Get validation Lambda role for a region.
        
        Args:
            region: AWS region
            
        Returns:
            IAM role for validation Lambda
        """
        return self.validation_roles[region]
    
    def get_validation_role_arn(self, region: str) -> Output[str]:
        """
        Get validation Lambda role ARN for a region.
        
        Args:
            region: AWS region
            
        Returns:
            ARN of the validation IAM role
        """
        return self.validation_roles[region].arn

