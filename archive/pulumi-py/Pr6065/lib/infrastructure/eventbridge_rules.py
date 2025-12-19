"""
EventBridge Rules infrastructure module.

Creates EventBridge rules for capturing AWS API calls for compliance auditing
with proper IAM permissions.
"""

import json

import pulumi
import pulumi_aws as aws
from pulumi import Output

from .aws_provider import AWSProviderManager
from .config import ObservabilityConfig


class EventBridgeRulesStack:
    """
    EventBridge Rules stack for compliance monitoring.
    
    Creates:
    - CloudTrail for AWS API auditing
    - S3 bucket for CloudTrail logs
    - EventBridge rules for compliance events
    - Proper IAM roles with permissions
    """
    
    def __init__(self, config: ObservabilityConfig, provider_manager: AWSProviderManager):
        """
        Initialize the EventBridge Rules stack.
        
        Args:
            config: Observability configuration
            provider_manager: AWS provider manager
        """
        self.config = config
        self.provider_manager = provider_manager
        self.trail_bucket = None
        self.eventbridge_log_group = None
        self.eventbridge_role = None
        
        # Create CloudTrail infrastructure
        self._create_cloudtrail()
        
        # Create EventBridge rules
        self._create_compliance_rules()
    
    def _create_cloudtrail(self) -> None:
        """Create CloudTrail for AWS API auditing."""
        # Create S3 bucket for CloudTrail logs
        bucket_name = self.config.get_normalized_resource_name('audit-trail')
        
        self.trail_bucket = aws.s3.Bucket(
            'cloudtrail-bucket',
            bucket=bucket_name,
            tags=self.config.get_tags_for_resource('S3Bucket', Purpose='CloudTrail'),
            opts=self.provider_manager.get_resource_options()
        )
        
        # Enable versioning
        aws.s3.BucketVersioning(
            'cloudtrail-bucket-versioning',
            bucket=self.trail_bucket.id,
            versioning_configuration=aws.s3.BucketVersioningVersioningConfigurationArgs(
                status='Enabled'
            ),
            opts=self.provider_manager.get_resource_options(depends_on=[self.trail_bucket])
        )
        
        # Configure server-side encryption
        aws.s3.BucketServerSideEncryptionConfiguration(
            'cloudtrail-bucket-encryption',
            bucket=self.trail_bucket.id,
            rules=[aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                    sse_algorithm='AES256'
                )
            )],
            opts=self.provider_manager.get_resource_options(depends_on=[self.trail_bucket])
        )
        
        # Configure lifecycle policy
        aws.s3.BucketLifecycleConfiguration(
            'cloudtrail-bucket-lifecycle',
            bucket=self.trail_bucket.id,
            rules=[
                aws.s3.BucketLifecycleConfigurationRuleArgs(
                    id='archive-old-logs',
                    status='Enabled',
                    transitions=[aws.s3.BucketLifecycleConfigurationRuleTransitionArgs(
                        days=30,
                        storage_class='GLACIER'
                    )],
                    expiration=aws.s3.BucketLifecycleConfigurationRuleExpirationArgs(
                        days=self.config.cloudtrail_retention_days
                    )
                )
            ],
            opts=self.provider_manager.get_resource_options(depends_on=[self.trail_bucket])
        )
        
        # Create bucket policy for CloudTrail
        bucket_policy = self.trail_bucket.arn.apply(lambda arn: json.dumps({
            'Version': '2012-10-17',
            'Statement': [
                {
                    'Sid': 'AWSCloudTrailAclCheck',
                    'Effect': 'Allow',
                    'Principal': {
                        'Service': 'cloudtrail.amazonaws.com'
                    },
                    'Action': 's3:GetBucketAcl',
                    'Resource': arn
                },
                {
                    'Sid': 'AWSCloudTrailWrite',
                    'Effect': 'Allow',
                    'Principal': {
                        'Service': 'cloudtrail.amazonaws.com'
                    },
                    'Action': 's3:PutObject',
                    'Resource': f'{arn}/*',
                    'Condition': {
                        'StringEquals': {
                            's3:x-amz-acl': 'bucket-owner-full-control'
                        }
                    }
                }
            ]
        }))
        
        aws.s3.BucketPolicy(
            'cloudtrail-bucket-policy',
            bucket=self.trail_bucket.id,
            policy=bucket_policy,
            opts=self.provider_manager.get_resource_options(depends_on=[self.trail_bucket])
        )
        
        # Create CloudTrail
        trail_name = self.config.get_resource_name('audit-trail')
        
        aws.cloudtrail.Trail(
            'payment-audit-trail',
            name=trail_name,
            s3_bucket_name=self.trail_bucket.id,
            include_global_service_events=True,
            is_multi_region_trail=True,
            enable_logging=True,
            event_selectors=[aws.cloudtrail.TrailEventSelectorArgs(
                read_write_type='All',
                include_management_events=True
            )],
            tags=self.config.get_tags_for_resource('CloudTrail', Purpose='Audit'),
            opts=self.provider_manager.get_resource_options(depends_on=[self.trail_bucket])
        )
    
    def _create_compliance_rules(self) -> None:
        """
        Create EventBridge rules for compliance monitoring.
        
        This addresses model failure #19 by creating proper IAM permissions
        for EventBridge to write to CloudWatch Logs.
        """
        # Create IAM role for EventBridge
        assume_role_policy = {
            'Version': '2012-10-17',
            'Statement': [{
                'Effect': 'Allow',
                'Principal': {
                    'Service': 'events.amazonaws.com'
                },
                'Action': 'sts:AssumeRole'
            }]
        }
        
        self.eventbridge_role = aws.iam.Role(
            'eventbridge-role',
            name=self.config.get_resource_name('eventbridge-role'),
            assume_role_policy=json.dumps(assume_role_policy),
            tags=self.config.get_tags_for_resource('IAMRole', Purpose='EventBridge'),
            opts=self.provider_manager.get_resource_options()
        )
        
        # Create log group for EventBridge
        self.eventbridge_log_group = aws.cloudwatch.LogGroup(
            'eventbridge-logs',
            name=f'/aws/events/{self.config.get_resource_name("compliance")}',
            retention_in_days=self.config.log_retention_days,
            tags=self.config.get_tags_for_resource('LogGroup', Purpose='EventBridge'),
            opts=self.provider_manager.get_resource_options()
        )
        
        # Create permissions policy for EventBridge to write to CloudWatch Logs
        logs_policy = Output.all(
            log_group_arn=self.eventbridge_log_group.arn,
            region=self.config.primary_region
        ).apply(lambda args: json.dumps({
            'Version': '2012-10-17',
            'Statement': [{
                'Effect': 'Allow',
                'Action': [
                    'logs:CreateLogStream',
                    'logs:PutLogEvents'
                ],
                'Resource': [
                    args['log_group_arn'],
                    f"{args['log_group_arn']}:*"
                ]
            }]
        }))
        
        aws.iam.RolePolicy(
            'eventbridge-logs-policy',
            role=self.eventbridge_role.id,
            policy=logs_policy,
            opts=self.provider_manager.get_resource_options(
                depends_on=[self.eventbridge_role, self.eventbridge_log_group]
            )
        )
        
        # Define compliance rules
        compliance_rules = [
            {
                'name': 'iam-changes',
                'description': 'Capture IAM permission changes',
                'pattern': {
                    'source': ['aws.iam'],
                    'detail-type': ['AWS API Call via CloudTrail'],
                    'detail': {
                        'eventName': [
                            'CreateUser',
                            'DeleteUser',
                            'AttachUserPolicy',
                            'DetachUserPolicy',
                            'CreateAccessKey',
                            'DeleteAccessKey'
                        ]
                    }
                }
            },
            {
                'name': 'security-group-changes',
                'description': 'Capture security group modifications',
                'pattern': {
                    'source': ['aws.ec2'],
                    'detail-type': ['AWS API Call via CloudTrail'],
                    'detail': {
                        'eventName': [
                            'AuthorizeSecurityGroupIngress',
                            'RevokeSecurityGroupIngress',
                            'AuthorizeSecurityGroupEgress',
                            'RevokeSecurityGroupEgress'
                        ]
                    }
                }
            },
            {
                'name': 'kms-key-usage',
                'description': 'Track KMS key usage for encryption',
                'pattern': {
                    'source': ['aws.kms'],
                    'detail-type': ['AWS API Call via CloudTrail'],
                    'detail': {
                        'eventName': [
                            'Decrypt',
                            'Encrypt',
                            'GenerateDataKey',
                            'CreateGrant',
                            'RevokeGrant'
                        ]
                    }
                }
            }
        ]
        
        # Create EventBridge rules
        for rule_config in compliance_rules:
            # EventBridge rule names have a 64 character limit
            rule_name = f'payment-{rule_config["name"]}-{self.config.environment_suffix}'[:64]
            
            rule = aws.cloudwatch.EventRule(
                f'eventbridge-rule-{rule_config["name"]}',
                name=rule_name,
                description=rule_config['description'],
                event_pattern=json.dumps(rule_config['pattern']),
                tags=self.config.get_tags_for_resource('EventRule', Compliance=self.config.compliance),
                opts=self.provider_manager.get_resource_options()
            )
            
            # Add CloudWatch Logs as target (no role_arn needed for CloudWatch Logs)
            aws.cloudwatch.EventTarget(
                f'eventbridge-target-{rule_config["name"]}',
                rule=rule.name,
                arn=self.eventbridge_log_group.arn,
                opts=self.provider_manager.get_resource_options(
                    depends_on=[rule, self.eventbridge_log_group]
                )
            )
    
    def get_trail_bucket_name(self) -> Output[str]:
        """
        Get the CloudTrail bucket name as Output.
        
        Returns:
            Bucket name as Output
        """
        return self.trail_bucket.bucket if self.trail_bucket else Output.from_input('')
    
    def get_eventbridge_log_group_name(self) -> Output[str]:
        """
        Get the EventBridge log group name as Output.
        
        Returns:
            Log group name as Output
        """
        return self.eventbridge_log_group.name if self.eventbridge_log_group else Output.from_input('')

