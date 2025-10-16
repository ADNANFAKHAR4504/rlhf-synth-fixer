"""
IAM roles and policies for the event processing pipeline.

This module creates least-privilege IAM roles for Lambda functions
and EventBridge components.
"""

from typing import Dict, List

import pulumi
from pulumi_aws import iam

from aws_provider import AWSProviderManager
from config import PipelineConfig


class IAMStack:
    """Creates IAM roles and policies for the event processing pipeline."""
    
    def __init__(self, config: PipelineConfig, provider_manager: AWSProviderManager):
        self.config = config
        self.provider_manager = provider_manager
        self.roles: Dict[str, iam.Role] = {}
        self.policies: Dict[str, iam.Policy] = {}
        
        self._create_lambda_execution_role()
        self._create_eventbridge_role()
        self._create_dynamodb_policies()
        self._create_cloudwatch_policies()
    
    def _create_lambda_execution_role(self):
        """Create IAM role for Lambda execution with least privilege."""
        for region in self.config.regions:
            role_name = self.config.get_resource_name('lambda-execution-role', region)
            
            assume_role_policy = {
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "lambda.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }
            
            self.roles[f'lambda-{region}'] = iam.Role(
                f"lambda-execution-role-{region}",
                name=role_name,
                assume_role_policy=assume_role_policy,
                tags=self.config.get_region_tags(region),
                opts=pulumi.ResourceOptions(provider=self.provider_manager.get_provider(region))
            )
            
            # Attach basic Lambda execution policy
            iam.RolePolicyAttachment(
                f"lambda-basic-execution-{region}",
                role=self.roles[f'lambda-{region}'].name,
                policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
                opts=pulumi.ResourceOptions(provider=self.provider_manager.get_provider(region))
            )
            
            # Attach X-Ray tracing policy
            iam.RolePolicyAttachment(
                f"lambda-xray-tracing-{region}",
                role=self.roles[f'lambda-{region}'].name,
                policy_arn="arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess",
                opts=pulumi.ResourceOptions(provider=self.provider_manager.get_provider(region))
            )
    
    def _create_eventbridge_role(self):
        """Create IAM role for EventBridge with least privilege."""
        for region in self.config.regions:
            role_name = self.config.get_resource_name('eventbridge-role', region)
            
            assume_role_policy = {
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "events.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }
            
            self.roles[f'eventbridge-{region}'] = iam.Role(
                f"eventbridge-role-{region}",
                name=role_name,
                assume_role_policy=assume_role_policy,
                tags=self.config.get_region_tags(region),
                opts=pulumi.ResourceOptions(provider=self.provider_manager.get_provider(region))
            )
    
    def _create_dynamodb_policies(self):
        """Create least-privilege DynamoDB policies."""
        for region in self.config.regions:
            # Get table ARNs for this region
            table_arn = f"arn:aws:dynamodb:{region}:*:table/{self.config.get_resource_name('trading-events', region)}"
            index_arn = f"arn:aws:dynamodb:{region}:*:table/{self.config.get_resource_name('trading-events', region)}/index/*"
            
            policy_document = {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "dynamodb:GetItem",
                            "dynamodb:PutItem",
                            "dynamodb:UpdateItem",
                            "dynamodb:DeleteItem",
                            "dynamodb:Query",
                            "dynamodb:Scan"
                        ],
                        "Resource": [table_arn, index_arn]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "dynamodb:DescribeTable",
                            "dynamodb:ListTables"
                        ],
                        "Resource": "*"
                    }
                ]
            }
            
            policy_name = self.config.get_resource_name('dynamodb-policy', region)
            
            self.policies[f'dynamodb-{region}'] = iam.Policy(
                f"dynamodb-policy-{region}",
                name=policy_name,
                description="Least privilege DynamoDB access for event processing",
                policy=policy_document,
                tags=self.config.get_region_tags(region),
                opts=pulumi.ResourceOptions(provider=self.provider_manager.get_provider(region))
            )
            
            # Attach to Lambda role
            iam.RolePolicyAttachment(
                f"lambda-dynamodb-policy-{region}",
                role=self.roles[f'lambda-{region}'].name,
                policy_arn=self.policies[f'dynamodb-{region}'].arn,
                opts=pulumi.ResourceOptions(provider=self.provider_manager.get_provider(region))
            )
    
    def _create_cloudwatch_policies(self):
        """Create CloudWatch policies for monitoring."""
        for region in self.config.regions:
            log_group_arn = f"arn:aws:logs:{region}:*:log-group:/aws/lambda/{self.config.get_resource_name('event-processor', region)}*"
            
            policy_document = {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "logs:CreateLogGroup",
                            "logs:CreateLogStream",
                            "logs:PutLogEvents",
                            "logs:DescribeLogStreams"
                        ],
                        "Resource": log_group_arn
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "cloudwatch:PutMetricData",
                            "cloudwatch:GetMetricStatistics",
                            "cloudwatch:ListMetrics"
                        ],
                        "Resource": "*"
                    }
                ]
            }
            
            policy_name = self.config.get_resource_name('cloudwatch-policy', region)
            
            self.policies[f'cloudwatch-{region}'] = iam.Policy(
                f"cloudwatch-policy-{region}",
                name=policy_name,
                description="CloudWatch access for Lambda functions",
                policy=policy_document,
                tags=self.config.get_region_tags(region),
                opts=pulumi.ResourceOptions(provider=self.provider_manager.get_provider(region))
            )
            
            # Attach to Lambda role
            iam.RolePolicyAttachment(
                f"lambda-cloudwatch-policy-{region}",
                role=self.roles[f'lambda-{region}'].name,
                policy_arn=self.policies[f'cloudwatch-{region}'].arn,
                opts=pulumi.ResourceOptions(provider=self.provider_manager.get_provider(region))
            )
    
    def get_lambda_role_arn(self, region: str) -> pulumi.Output[str]:
        """Get Lambda execution role ARN for a region."""
        return self.roles[f'lambda-{region}'].arn
    
    def get_eventbridge_role_arn(self, region: str) -> pulumi.Output[str]:
        """Get EventBridge role ARN for a region."""
        return self.roles[f'eventbridge-{region}'].arn
