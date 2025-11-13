"""
SNS Topics infrastructure module.

Creates SNS topics for alert routing with email and Slack webhook endpoints.
"""

import json
from typing import Dict

import pulumi
import pulumi_aws as aws
from pulumi import Output

from .aws_provider import AWSProviderManager
from .config import ObservabilityConfig


class SNSTopicsStack:
    """
    SNS Topics stack for alert notifications.
    
    Creates topics for different severity levels and configures
    subscriptions for email and Slack notifications.
    """
    
    def __init__(self, config: ObservabilityConfig, provider_manager: AWSProviderManager):
        """
        Initialize the SNS Topics stack.
        
        Args:
            config: Observability configuration
            provider_manager: AWS provider manager
        """
        self.config = config
        self.provider_manager = provider_manager
        self.topics: Dict[str, aws.sns.Topic] = {}
        self.slack_lambda = None
        self.slack_lambda_role = None
        
        # Create SNS topics
        self._create_topics()
        
        # Create email subscriptions
        self._create_email_subscriptions()
        
        # Create Slack integration if webhook URL is provided
        if self.config.slack_webhook_url:
            self._create_slack_integration()
    
    def _create_topics(self) -> None:
        """Create SNS topics for different alert severities."""
        severities = ['critical', 'warning', 'info']
        
        for severity in severities:
            topic_name = self.config.get_resource_name(f'alerts-{severity}')
            
            self.topics[severity] = aws.sns.Topic(
                f'sns-topic-{severity}',
                name=topic_name,
                display_name=f'Payment System {severity.capitalize()} Alerts',
                kms_master_key_id='alias/aws/sns',
                tags=self.config.get_tags_for_resource(
                    'SNSTopic',
                    Severity=severity.capitalize()
                ),
                opts=self.provider_manager.get_resource_options()
            )
    
    def _create_email_subscriptions(self) -> None:
        """Create email subscriptions for critical alerts."""
        if self.config.alert_email and self.config.alert_email != 'alerts@example.com':
            aws.sns.TopicSubscription(
                'email-subscription-critical',
                topic=self.topics['critical'].arn,
                protocol='email',
                endpoint=self.config.alert_email,
                opts=self.provider_manager.get_resource_options(
                    depends_on=[self.topics['critical']]
                )
            )
    
    def _create_slack_integration(self) -> None:
        """Create Lambda function for Slack notifications."""
        # Create IAM role for Lambda
        assume_role_policy = {
            'Version': '2012-10-17',
            'Statement': [{
                'Action': 'sts:AssumeRole',
                'Effect': 'Allow',
                'Principal': {
                    'Service': 'lambda.amazonaws.com'
                }
            }]
        }
        
        self.slack_lambda_role = aws.iam.Role(
            'slack-lambda-role',
            name=self.config.get_resource_name('slack-lambda-role'),
            assume_role_policy=json.dumps(assume_role_policy),
            tags=self.config.get_tags_for_resource('IAMRole', Purpose='SlackNotifications'),
            opts=self.provider_manager.get_resource_options()
        )
        
        # Attach basic execution policy
        aws.iam.RolePolicyAttachment(
            'slack-lambda-policy',
            role=self.slack_lambda_role.name,
            policy_arn='arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
            opts=self.provider_manager.get_resource_options(depends_on=[self.slack_lambda_role])
        )
        
        # Lambda function code
        lambda_code = f"""
import json
import urllib3
import os

def handler(event, context):
    http = urllib3.PoolManager()
    slack_url = os.environ['SLACK_WEBHOOK_URL']
    
    for record in event['Records']:
        message = json.loads(record['Sns']['Message'])
        
        slack_message = {{
            "text": "*Payment System Alert*",
            "attachments": [{{
                "color": "danger" if "ALARM" in str(message) else "warning",
                "fields": [
                    {{"title": "Alert", "value": message.get('AlarmName', 'Unknown'), "short": True}},
                    {{"title": "Description", "value": message.get('AlarmDescription', 'No description'), "short": False}},
                    {{"title": "Reason", "value": message.get('NewStateReason', 'Unknown reason'), "short": False}}
                ]
            }}]
        }}
        
        response = http.request(
            'POST',
            slack_url,
            body=json.dumps(slack_message).encode('utf-8'),
            headers={{'Content-Type': 'application/json'}}
        )
    
    return {{'statusCode': 200}}
"""
        
        # Create Lambda function
        self.slack_lambda = aws.lambda_.Function(
            'slack-notification-lambda',
            name=self.config.get_resource_name('slack-notifications'),
            runtime='python3.11',
            handler='index.handler',
            role=self.slack_lambda_role.arn,
            code=pulumi.AssetArchive({
                'index.py': pulumi.StringAsset(lambda_code)
            }),
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    'SLACK_WEBHOOK_URL': self.config.slack_webhook_url
                }
            ),
            timeout=30,
            tags=self.config.get_tags_for_resource('Lambda', Purpose='SlackNotifications'),
            opts=self.provider_manager.get_resource_options(depends_on=[self.slack_lambda_role])
        )
        
        # Grant SNS permission to invoke Lambda (use ARN, not name)
        aws.lambda_.Permission(
            'sns-lambda-permission',
            action='lambda:InvokeFunction',
            function=self.slack_lambda.arn,  # Use ARN instead of name
            principal='sns.amazonaws.com',
            source_arn=self.topics['critical'].arn,
            opts=self.provider_manager.get_resource_options(
                depends_on=[self.slack_lambda, self.topics['critical']]
            )
        )
        
        # Subscribe Lambda to critical topic
        aws.sns.TopicSubscription(
            'slack-subscription-critical',
            topic=self.topics['critical'].arn,
            protocol='lambda',
            endpoint=self.slack_lambda.arn,
            opts=self.provider_manager.get_resource_options(
                depends_on=[self.slack_lambda, self.topics['critical']]
            )
        )
    
    def get_topic_arn(self, severity: str) -> Output[str]:
        """
        Get SNS topic ARN by severity.
        
        Args:
            severity: Topic severity (critical, warning, info)
            
        Returns:
            Topic ARN as Output
        """
        topic = self.topics.get(severity)
        return topic.arn if topic else Output.from_input('')
    
    def get_all_topic_arns(self) -> Dict[str, Output[str]]:
        """
        Get all SNS topic ARNs.
        
        Returns:
            Dictionary of topic ARNs
        """
        return {name: topic.arn for name, topic in self.topics.items()}

