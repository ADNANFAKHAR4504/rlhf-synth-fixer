"""
EventBridge module for S3 event notifications.

This module creates EventBridge rules to trigger CodePipeline when
source code is uploaded to S3.
"""

import json
from typing import Dict

import pulumi
import pulumi_aws as aws
from pulumi import Output

from .aws_provider import AWSProviderManager
from .config import CICDConfig
from .s3 import S3Stack


class EventBridgeStack:
    """
    Manages EventBridge rules for S3 notifications.
    
    Creates EventBridge rules to trigger CodePipeline on S3 object
    creation events.
    """
    
    def __init__(
        self,
        config: CICDConfig,
        provider_manager: AWSProviderManager,
        s3_stack: S3Stack
    ):
        """
        Initialize the EventBridge stack.
        
        Args:
            config: CICDConfig instance
            provider_manager: AWSProviderManager instance
            s3_stack: S3Stack instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.s3_stack = s3_stack
        self.rules: Dict[str, aws.cloudwatch.EventRule] = {}
        self.targets: Dict[str, aws.cloudwatch.EventTarget] = {}
    
    def create_s3_trigger_rule(self, pipeline_arn: Output[str], pipeline_role_arn: Output[str]):
        """
        Create EventBridge rule to trigger pipeline on S3 changes.
        
        Args:
            pipeline_arn: ARN of the CodePipeline
            pipeline_role_arn: ARN of the CodePipeline role
        """
        rule_name = self.config.get_resource_name('s3-trigger')
        
        source_bucket_name = self.s3_stack.get_bucket_name('source')
        
        event_pattern = source_bucket_name.apply(
            lambda bucket_name: json.dumps({
                'source': ['aws.s3'],
                'detail-type': ['Object Created'],
                'detail': {
                    'bucket': {
                        'name': [bucket_name]
                    },
                    'object': {
                        'key': [{'prefix': self.config.source_object_key}]
                    }
                }
            })
        )
        
        rule = aws.cloudwatch.EventRule(
            's3-trigger-rule',
            name=rule_name,
            description='Trigger pipeline on S3 source code upload',
            event_pattern=event_pattern,
            tags={
                **self.config.get_common_tags(),
                'Name': rule_name,
                'Purpose': 'S3 to Pipeline trigger'
            },
            opts=self.provider_manager.get_resource_options()
        )
        
        target = aws.cloudwatch.EventTarget(
            's3-trigger-target',
            rule=rule.name,
            arn=pipeline_arn,
            role_arn=pipeline_role_arn,
            opts=self.provider_manager.get_resource_options(depends_on=[rule])
        )
        
        self.rules['s3-trigger'] = rule
        self.targets['s3-trigger'] = target
    
    def get_rule(self, rule_name: str) -> aws.cloudwatch.EventRule:
        """
        Get an EventBridge rule by name.
        
        Args:
            rule_name: Name of the rule
            
        Returns:
            EventRule resource
        """
        if rule_name not in self.rules:
            raise ValueError(f"Rule '{rule_name}' not found")
        return self.rules[rule_name]

