1. tap.py

```py
#!/usr/bin/env python3
"""
Pulumi application entry point for the EC2 failure recovery infrastructure.

This module defines the core Pulumi stack and instantiates the EC2RecoveryStack with appropriate
configuration based on the deployment environment. It handles environment-specific settings,
tagging, and deployment configuration for AWS resources.

The stack created by this module uses environment suffixes to distinguish between
different deployment environments (development, staging, production, etc.).
"""
import os
import sys

import pulumi
from pulumi import Config, ResourceOptions

sys.path.append(os.path.join(os.path.dirname(__file__), 'lib'))
from tap_stack import EC2RecoveryStack

# Initialize Pulumi configuration
config = Config()

# Get environment suffix from config or fallback to 'dev'
environment_suffix = config.get('env') or 'dev'
STACK_NAME = f"EC2RecoveryStack{environment_suffix}"

repository_name = os.getenv('REPOSITORY', 'unknown')
commit_author = os.getenv('COMMIT_AUTHOR', 'unknown')

# Create a resource options object with default tags
default_tags = {
    'Environment': environment_suffix,
    'Repository': repository_name,
    'Author': commit_author,
}

# Create the EC2 recovery stack
stack = EC2RecoveryStack()

```

2. lib\_\_init\_\_.py

```py
# empty
```

3. lib\_\_main\_\_.py

```py
"""
Entry point for the EC2 failure recovery Pulumi program.
"""
from lib.tap_stack import stack


```

4. lib\tap_stack.py

```py
"""
Main Pulumi stack for EC2 failure recovery infrastructure.
Orchestrates all components and exports outputs for integration tests.
"""
import pulumi
import pulumi_aws as aws

from lib.infrastructure.cloudwatch import CloudWatchStack
from lib.infrastructure.cloudwatch_events import CloudWatchEventsStack
from lib.infrastructure.config import EC2RecoveryConfig
from lib.infrastructure.iam import IAMStack
from lib.infrastructure.lambda_function import LambdaStack
from lib.infrastructure.parameter_store import ParameterStoreStack
from lib.infrastructure.s3 import S3Stack
from lib.infrastructure.sns import SNSStack


class EC2RecoveryStack:
    """Main stack for EC2 failure recovery infrastructure."""

    def __init__(self):
        # Initialize configuration
        self.config = EC2RecoveryConfig()

        # Initialize all infrastructure components
        self.iam_stack = IAMStack(self.config)
        self.s3_stack = S3Stack(self.config)
        self.parameter_store_stack = ParameterStoreStack(self.config)
        self.sns_stack = SNSStack(self.config)
        self.cloudwatch_stack = CloudWatchStack(self.config)
        self.lambda_stack = LambdaStack(self.config, self.iam_stack.get_role_arn())
        self.cloudwatch_events_stack = CloudWatchEventsStack(
            self.config,
            self.lambda_stack.get_function_arn()
        )

        # Register outputs
        self._register_outputs()

    def _register_outputs(self):
        """Register all outputs for integration tests."""
        try:
            # Lambda function outputs
            pulumi.export("lambda_function_arn", self.lambda_stack.get_function_arn())
            pulumi.export("lambda_function_name", self.lambda_stack.get_function_name())

            # S3 bucket outputs
            pulumi.export("s3_bucket_name", self.s3_stack.get_bucket_name())
            pulumi.export("s3_bucket_arn", self.s3_stack.get_bucket_arn())

            # SNS topic outputs
            pulumi.export("sns_topic_arn", self.sns_stack.get_topic_arn())
            pulumi.export("sns_topic_name", self.sns_stack.get_topic_name())

            # CloudWatch log group outputs
            pulumi.export("cloudwatch_log_group_name", self.cloudwatch_stack.get_log_group_name())
            pulumi.export("cloudwatch_log_group_arn", self.cloudwatch_stack.get_log_group_arn())

            # CloudWatch Events outputs
            pulumi.export("event_rule_arn", self.cloudwatch_events_stack.get_event_rule_arn())
            pulumi.export("event_rule_name", self.cloudwatch_events_stack.get_event_rule_name())

            # IAM role outputs
            pulumi.export("iam_role_arn", self.iam_stack.get_role_arn())
            pulumi.export("iam_role_name", self.iam_stack.get_role_name())

            # Configuration outputs
            pulumi.export("environment", self.config.environment)
            pulumi.export("region", self.config.region)
            pulumi.export("project_name", self.config.project_name)
            pulumi.export("alert_email", self.config.alert_email)
            pulumi.export("max_retry_attempts", self.config.max_retry_attempts)
            pulumi.export("retry_interval_minutes", self.config.retry_interval_minutes)
            pulumi.export("monitoring_interval_minutes", self.config.monitoring_interval_minutes)

            # Parameter Store outputs
            pulumi.export("parameter_store_prefix", self.config.parameter_store_prefix)

        except Exception as e:
            # Gracefully handle test environments where pulumi.export may not be available
            print(f"Warning: Could not export outputs: {e}")


# Create the main stack
stack = EC2RecoveryStack()
```

5. lib\infrastructure\_\_init\_\_.py

```py
"""
Infrastructure module for EC2 failure recovery.
"""
```

6. lib\infrastructure\\cloudwatch_events.py

```py
"""
CloudWatch Events module for EC2 failure recovery infrastructure.
Manages event rules and triggers for monitoring.
"""
import json
from typing import Any, Dict

import pulumi
import pulumi_aws as aws

from .config import EC2RecoveryConfig


class CloudWatchEventsStack:
    """CloudWatch Events resources for EC2 recovery monitoring."""

    def __init__(self, config: EC2RecoveryConfig, lambda_function_arn: pulumi.Output[str]):
        self.config = config
        self.lambda_function_arn = lambda_function_arn
        self.event_rule = self._create_event_rule()
        self.lambda_permission = self._create_lambda_permission()
        self.event_target = self._create_event_target()

    def _create_event_rule(self) -> aws.cloudwatch.EventRule:
        """Create CloudWatch Events rule for monitoring."""
        import random
        random_suffix = str(random.randint(1000, 9999))
        return aws.cloudwatch.EventRule(
            f"{self.config.get_tag_name('event-rule')}-{random_suffix}",
            name=self.config.event_rule_name,
            description="Trigger EC2 recovery monitoring every 10 minutes",
            schedule_expression=f"rate({self.config.monitoring_interval_minutes} minutes)",
            tags={
                "Name": self.config.get_tag_name("event-rule"),
                "Environment": self.config.environment,
                "Project": self.config.project_name,
                "Purpose": "EC2-Recovery-Monitoring"
            }
        )

    def _create_lambda_permission(self) -> aws.lambda_.Permission:
        """Create Lambda permission for CloudWatch Events."""
        import random
        random_suffix = str(random.randint(1000, 9999))
        return aws.lambda_.Permission(
            f"{self.config.get_tag_name('lambda-permission')}-{random_suffix}",
            statement_id="AllowExecutionFromCloudWatch",
            action="lambda:InvokeFunction",
            function=self.lambda_function_arn,
            principal="events.amazonaws.com",
            source_arn=self.event_rule.arn
        )

    def _create_event_target(self) -> aws.cloudwatch.EventTarget:
        """Create CloudWatch Events target for Lambda function."""
        import random
        random_suffix = str(random.randint(1000, 9999))
        return aws.cloudwatch.EventTarget(
            f"{self.config.get_tag_name('event-target')}-{random_suffix}",
            rule=self.event_rule.name,
            target_id="EC2RecoveryTarget",
            arn=self.lambda_function_arn,
            input=json.dumps({
                "source": "ec2-recovery-monitoring",
                "timestamp": "{{.Timestamp}}"
            })
        )

    def get_event_rule_arn(self) -> pulumi.Output[str]:
        """Get the CloudWatch Events rule ARN."""
        return self.event_rule.arn

    def get_event_rule_name(self) -> pulumi.Output[str]:
        """Get the CloudWatch Events rule name."""
        return self.event_rule.name

```

7. lib\infrastructure\cloudwatch.py

```py
"""
CloudWatch module for EC2 failure recovery infrastructure.
Manages log groups and retention policies.
"""
from typing import Any, Dict

import pulumi
import pulumi_aws as aws

from .config import EC2RecoveryConfig


class CloudWatchStack:
    """CloudWatch resources for EC2 recovery logging."""

    def __init__(self, config: EC2RecoveryConfig):
        self.config = config
        self.log_group = self._create_log_group()
        self.log_stream = self._create_log_stream()

    def _create_log_group(self) -> aws.cloudwatch.LogGroup:
        """Create CloudWatch log group for Lambda function."""
        import random
        random_suffix = str(random.randint(1000, 9999))
        return aws.cloudwatch.LogGroup(
            f"{self.config.get_tag_name('lambda-log-group')}-{random_suffix}",
            name=self.config.cloudwatch_log_group_name,
            retention_in_days=30,
            tags={
                "Name": self.config.get_tag_name("lambda-log-group"),
                "Environment": self.config.environment,
                "Project": self.config.project_name,
                "Purpose": "EC2-Recovery-Logs"
            }
        )

    def _create_log_stream(self) -> aws.cloudwatch.LogStream:
        """Create CloudWatch log stream for Lambda function."""
        import random
        random_suffix = str(random.randint(1000, 9999))
        return aws.cloudwatch.LogStream(
            f"{self.config.get_tag_name('lambda-log-stream')}-{random_suffix}",
            name=f"{self.config.lambda_function_name}-stream",
            log_group_name=self.log_group.name
        )

    def get_log_group_name(self) -> pulumi.Output[str]:
        """Get the CloudWatch log group name."""
        return self.log_group.name

    def get_log_group_arn(self) -> pulumi.Output[str]:
        """Get the CloudWatch log group ARN."""
        return self.log_group.arn

```

8. lib\infrastructure\config.py

```py
"""
Configuration module for EC2 failure recovery infrastructure.
Centralizes environment variables and configuration management.
"""
import os
from typing import Optional

import pulumi


class EC2RecoveryConfig:
    """Configuration class for EC2 failure recovery infrastructure."""

    def __init__(self):
        # Environment variables with defaults
        self.environment = os.getenv('ENVIRONMENT', 'dev')
        self.environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', f'-{self.environment}')
        self.region = os.getenv('AWS_REGION', 'us-west-2')
        self.project_name = os.getenv('PROJECT_NAME', 'ec2-recovery')

        # Email for SNS notifications
        self.alert_email = os.getenv('ALERT_EMAIL', 'admin@example.com')

        # Retry configuration
        self.max_retry_attempts = int(os.getenv('MAX_RETRY_ATTEMPTS', '3'))
        self.retry_interval_minutes = int(os.getenv('RETRY_INTERVAL_MINUTES', '5'))
        self.monitoring_interval_minutes = int(os.getenv('MONITORING_INTERVAL_MINUTES', '10'))

        # Resource naming with timestamp for uniqueness and proper normalization
        import random
        import time
        timestamp = str(int(time.time()))[-6:]  # Last 6 digits of timestamp
        random_suffix = str(random.randint(1000, 9999))

        # Normalize project name to lowercase for AWS resource naming
        project_name_normalized = self.project_name.lower().replace('_', '-')
        environment_normalized = self.environment.lower()

        self.lambda_function_name = f"{project_name_normalized}-ec2-recovery-{environment_normalized}-{timestamp}-{random_suffix}"
        self.sns_topic_name = f"{project_name_normalized}-alerts-{environment_normalized}-{timestamp}-{random_suffix}"
        self.s3_bucket_name = f"{project_name_normalized}-state-{environment_normalized}-{timestamp}-{random_suffix}"
        self.parameter_store_prefix = f"/{project_name_normalized}/ec2-recovery-{environment_normalized}-{timestamp}-{random_suffix}"
        self.cloudwatch_log_group_name = f"/aws/lambda/{self.lambda_function_name}"
        self.iam_role_name = f"{project_name_normalized}-ec2-recovery-role-{environment_normalized}-{timestamp}-{random_suffix}"
        self.event_rule_name = f"{project_name_normalized}-ec2-monitoring-{environment_normalized}-{timestamp}-{random_suffix}"

        # Validate region - allow us-west-2 as default, but permit other regions for CI/CD
        if self.region not in ['us-west-2', 'us-east-1']:
            raise ValueError(f"Region must be us-west-2 or us-east-1, got {self.region}")

    def get_resource_name(self, resource_type: str, suffix: str = "") -> str:
        """Generate consistent resource names with environment suffix."""
        project_name_normalized = self.project_name.lower().replace('_', '-')
        environment_normalized = self.environment.lower()
        base_name = f"{project_name_normalized}-{resource_type}-{environment_normalized}"
        return f"{base_name}{suffix}" if suffix else base_name

    def get_parameter_name(self, key: str) -> str:
        """Generate Parameter Store parameter names."""
        return f"{self.parameter_store_prefix}/{key}"

    def get_s3_key(self, key: str) -> str:
        """Generate S3 object keys for state storage."""
        return f"ec2-recovery/{key}"

    def get_tag_name(self, resource_name: str) -> str:
        """Generate consistent tag names."""
        project_name_normalized = self.project_name.lower().replace('_', '-')
        environment_normalized = self.environment.lower()
        return f"{project_name_normalized}-{resource_name}-{environment_normalized}"

```

9. lib\infrastructure\iam.py

```py
"""
IAM module for EC2 failure recovery infrastructure.
Implements least-privilege policies for all required services.
"""
from typing import Any, Dict

import pulumi
import pulumi_aws as aws

from .config import EC2RecoveryConfig


class IAMStack:
    """IAM resources for EC2 failure recovery."""

    def __init__(self, config: EC2RecoveryConfig):
        self.config = config
        self.role = self._create_lambda_role()
        self.policy = self._create_lambda_policy()
        self.role_policy_attachment = self._attach_policy_to_role()

    def _create_lambda_role(self) -> aws.iam.Role:
        """Create IAM role for Lambda function with least-privilege permissions."""
        import random
        random_suffix = str(random.randint(1000, 9999))
        return aws.iam.Role(
            f"{self.config.get_tag_name('lambda-role')}-{random_suffix}",
            name=self.config.iam_role_name,
            assume_role_policy=pulumi.Output.from_input({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "lambda.amazonaws.com"
                    }
                }]
            }),
            tags={
                "Name": self.config.get_tag_name("lambda-role"),
                "Environment": self.config.environment,
                "Project": self.config.project_name,
                "Purpose": "EC2-Recovery"
            }
        )

    def _create_lambda_policy(self) -> aws.iam.Policy:
        """Create IAM policy with least-privilege permissions for EC2 recovery."""
        import random
        random_suffix = str(random.randint(1000, 9999))
        return aws.iam.Policy(
            f"{self.config.get_tag_name('lambda-policy')}-{random_suffix}",
            name=f"{self.config.project_name}-ec2-recovery-policy{self.config.environment_suffix}-{random_suffix}",
            policy=pulumi.Output.from_input({
                "Version": "2012-10-17",
                "Statement": [
                    # CloudWatch Logs permissions
                    {
                        "Effect": "Allow",
                        "Action": [
                            "logs:CreateLogGroup",
                            "logs:CreateLogStream",
                            "logs:PutLogEvents"
                        ],
                        "Resource": f"arn:aws:logs:{self.config.region}:*:log-group:{self.config.cloudwatch_log_group_name}*"
                    },
                    # EC2 permissions - restricted to tagged instances only
                    {
                        "Effect": "Allow",
                        "Action": [
                            "ec2:DescribeInstances",
                            "ec2:DescribeInstanceStatus",
                            "ec2:StartInstances",
                            "ec2:StopInstances"
                        ],
                        "Resource": "*",
                        "Condition": {
                            "StringEquals": {
                                "ec2:ResourceTag/Auto-Recover": "true"
                            }
                        }
                    },
                    # S3 permissions - restricted to specific bucket and prefix
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:GetObject",
                            "s3:PutObject",
                            "s3:DeleteObject"
                        ],
                        "Resource": f"arn:aws:s3:::{self.config.s3_bucket_name}/ec2-recovery/*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:ListBucket"
                        ],
                        "Resource": f"arn:aws:s3:::{self.config.s3_bucket_name}"
                    },
                    # Parameter Store permissions - restricted to specific parameters
                    {
                        "Effect": "Allow",
                        "Action": [
                            "ssm:GetParameter",
                            "ssm:GetParameters",
                            "ssm:GetParametersByPath"
                        ],
                        "Resource": f"arn:aws:ssm:{self.config.region}:*:parameter{self.config.parameter_store_prefix}/*"
                    },
                    # SNS permissions - restricted to specific topic
                    {
                        "Effect": "Allow",
                        "Action": [
                            "sns:Publish"
                        ],
                        "Resource": f"arn:aws:sns:{self.config.region}:*:{self.config.sns_topic_name}"
                    }
                ]
            }),
            tags={
                "Name": self.config.get_tag_name("lambda-policy"),
                "Environment": self.config.environment,
                "Project": self.config.project_name,
                "Purpose": "EC2-Recovery"
            }
        )

    def _attach_policy_to_role(self) -> aws.iam.RolePolicyAttachment:
        """Attach the policy to the Lambda role."""
        import random
        random_suffix = str(random.randint(1000, 9999))
        return aws.iam.RolePolicyAttachment(
            f"{self.config.get_tag_name('lambda-policy-attachment')}-{random_suffix}",
            role=self.role.name,
            policy_arn=self.policy.arn
        )

    def get_role_arn(self) -> pulumi.Output[str]:
        """Get the IAM role ARN."""
        return self.role.arn

    def get_role_name(self) -> pulumi.Output[str]:
        """Get the IAM role name."""
        return self.role.name

```

10. lib\infrastructure\lambda_function.py

```py
"""
Lambda function module for EC2 failure recovery infrastructure.
Implements the core recovery logic with proper retry mechanisms.
"""
from typing import Any, Dict

import pulumi
import pulumi_aws as aws

from .config import EC2RecoveryConfig


class LambdaStack:
    """Lambda function for EC2 recovery."""

    def __init__(self, config: EC2RecoveryConfig, iam_role_arn: pulumi.Output[str]):
        self.config = config
        self.iam_role_arn = iam_role_arn
        self.function = self._create_lambda_function()

    def _create_lambda_function(self) -> aws.lambda_.Function:
        """Create Lambda function for EC2 recovery."""
        import random
        random_suffix = str(random.randint(1000, 9999))
        return aws.lambda_.Function(
            f"{self.config.get_tag_name('lambda-function')}-{random_suffix}",
            name=self.config.lambda_function_name,
            runtime="python3.11",
            handler="index.lambda_handler",
            role=self.iam_role_arn,
            timeout=300,  # 5 minutes timeout
            memory_size=256,
            code=pulumi.AssetArchive({
                "index.py": pulumi.StringAsset(self._get_lambda_code())
            }),
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    "S3_BUCKET": self.config.s3_bucket_name,
                    "SNS_TOPIC_ARN": f"arn:aws:sns:{self.config.region}:*:{self.config.sns_topic_name}",
                    "PARAMETER_PREFIX": self.config.parameter_store_prefix,
                    "MAX_RETRY_ATTEMPTS": str(self.config.max_retry_attempts),
                    "RETRY_INTERVAL_MINUTES": str(self.config.retry_interval_minutes)
                }
            ),
            tags={
                "Name": self.config.get_tag_name("lambda-function"),
                "Environment": self.config.environment,
                "Project": self.config.project_name,
                "Purpose": "EC2-Recovery"
            }
        )

    def _get_lambda_code(self) -> str:
        """Get the Lambda function code."""
        return '''
import json
import boto3
import os
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import logging

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
ec2_client = boto3.client('ec2')
s3_client = boto3.client('s3')
sns_client = boto3.client('sns')
ssm_client = boto3.client('ssm')

def lambda_handler(event, context):
    """Main Lambda handler for EC2 recovery."""
    try:
        logger.info("Starting EC2 recovery process")

        # Get configuration from Parameter Store
        config = get_configuration()

        # Get instances that need recovery
        instances_to_recover = get_instances_to_recover()

        if not instances_to_recover:
            logger.info("No instances need recovery")
            return {"statusCode": 200, "body": "No instances need recovery"}

        # Process each instance
        results = []
        for instance in instances_to_recover:
            result = process_instance_recovery(instance, config)
            results.append(result)

        logger.info(f"Recovery process completed. Results: {results}")
        return {"statusCode": 200, "body": json.dumps(results)}

    except Exception as e:
        logger.error(f"Error in EC2 recovery process: {str(e)}")
        send_alert(f"EC2 Recovery Error: {str(e)}")
        raise

def get_configuration() -> Dict:
    """Get configuration from Parameter Store."""
    try:
        parameter_prefix = os.environ['PARAMETER_PREFIX']
        response = ssm_client.get_parameters_by_path(
            Path=parameter_prefix,
            Recursive=True,
            WithDecryption=True
        )

        config = {}
        for param in response['Parameters']:
            key = param['Name'].split('/')[-1]
            config[key] = param['Value']

        return config
    except Exception as e:
        logger.error(f"Error getting configuration: {str(e)}")
        raise

def get_instances_to_recover() -> List[Dict]:
    """Get EC2 instances that need recovery."""
    try:
        # Get all instances with Auto-Recover tag
        response = ec2_client.describe_instances(
            Filters=[
                {'Name': 'tag:Auto-Recover', 'Values': ['true']},
                {'Name': 'instance-state-name', 'Values': ['stopped']}
            ]
        )

        instances = []
        for reservation in response['Reservations']:
            for instance in reservation['Instances']:
                instances.append(instance)

        logger.info(f"Found {len(instances)} instances to recover")
        return instances

    except Exception as e:
        logger.error(f"Error getting instances: {str(e)}")
        raise

def process_instance_recovery(instance: Dict, config: Dict) -> Dict:
    """Process recovery for a single instance."""
    instance_id = instance['InstanceId']
    logger.info(f"Processing recovery for instance {instance_id}")

    try:
        # Check if instance is already being processed
        if is_instance_being_processed(instance_id):
            logger.info(f"Instance {instance_id} is already being processed")
            return {"instance_id": instance_id, "status": "already_processing"}

        # Mark instance as being processed
        mark_instance_processing(instance_id)

        # Attempt to start the instance
        result = start_instance(instance_id)

        if result['success']:
            logger.info(f"Successfully started instance {instance_id}")
            clear_instance_processing(instance_id)
            return {"instance_id": instance_id, "status": "started"}
        else:
            logger.warning(f"Failed to start instance {instance_id}: {result['error']}")
            # Check retry count and handle accordingly
            retry_count = get_retry_count(instance_id)
            max_retries = int(config.get('max_retry_attempts', '3'))

            if retry_count < max_retries:
                increment_retry_count(instance_id)
                logger.info(f"Incremented retry count for instance {instance_id}")
                return {"instance_id": instance_id, "status": "retry_scheduled"}
            else:
                logger.error(f"Instance {instance_id} exceeded max retry attempts")
                send_alert(f"Instance {instance_id} failed to start after {max_retries} attempts")
                clear_instance_processing(instance_id)
                return {"instance_id": instance_id, "status": "failed"}

    except Exception as e:
        logger.error(f"Error processing instance {instance_id}: {str(e)}")
        clear_instance_processing(instance_id)
        return {"instance_id": instance_id, "status": "error", "error": str(e)}

def is_instance_being_processed(instance_id: str) -> bool:
    """Check if instance is currently being processed."""
    try:
        s3_bucket = os.environ['S3_BUCKET']
        key = f"ec2-recovery/processing/{instance_id}"

        response = s3_client.head_object(Bucket=s3_bucket, Key=key)
        return True
    except:
        return False

def mark_instance_processing(instance_id: str):
    """Mark instance as being processed."""
    try:
        s3_bucket = os.environ['S3_BUCKET']
        key = f"ec2-recovery/processing/{instance_id}"

        s3_client.put_object(
            Bucket=s3_bucket,
            Key=key,
            Body=json.dumps({"timestamp": datetime.utcnow().isoformat()})
        )
    except Exception as e:
        logger.error(f"Error marking instance {instance_id} as processing: {str(e)}")

def clear_instance_processing(instance_id: str):
    """Clear instance processing status."""
    try:
        s3_bucket = os.environ['S3_BUCKET']
        key = f"ec2-recovery/processing/{instance_id}"

        s3_client.delete_object(Bucket=s3_bucket, Key=key)
    except Exception as e:
        logger.error(f"Error clearing instance {instance_id} processing status: {str(e)}")

def get_retry_count(instance_id: str) -> int:
    """Get retry count for instance."""
    try:
        s3_bucket = os.environ['S3_BUCKET']
        key = f"ec2-recovery/retry/{instance_id}"

        response = s3_client.get_object(Bucket=s3_bucket, Key=key)
        data = json.loads(response['Body'].read())
        return data.get('count', 0)
    except:
        return 0

def increment_retry_count(instance_id: str):
    """Increment retry count for instance."""
    try:
        s3_bucket = os.environ['S3_BUCKET']
        key = f"ec2-recovery/retry/{instance_id}"

        current_count = get_retry_count(instance_id)
        s3_client.put_object(
            Bucket=s3_bucket,
            Key=key,
            Body=json.dumps({"count": current_count + 1})
        )
    except Exception as e:
        logger.error(f"Error incrementing retry count for instance {instance_id}: {str(e)}")

def start_instance(instance_id: str) -> Dict:
    """Start an EC2 instance."""
    try:
        response = ec2_client.start_instances(InstanceIds=[instance_id])

        if response['StartingInstances']:
            return {"success": True, "message": "Instance start initiated"}
        else:
            return {"success": False, "error": "No instances were started"}

    except Exception as e:
        return {"success": False, "error": str(e)}

def send_alert(message: str):
    """Send alert via SNS."""
    try:
        sns_topic_arn = os.environ['SNS_TOPIC_ARN']

        sns_client.publish(
            TopicArn=sns_topic_arn,
            Message=message,
            Subject="EC2 Recovery Alert"
        )

        logger.info(f"Alert sent: {message}")
    except Exception as e:
        logger.error(f"Error sending alert: {str(e)}")
'''

    def get_function_arn(self) -> pulumi.Output[str]:
        """Get the Lambda function ARN."""
        return self.function.arn

    def get_function_name(self) -> pulumi.Output[str]:
        """Get the Lambda function name."""
        return self.function.name

```

11. lib\infrastructure\parameter_store.py

```py
"""
Parameter Store module for EC2 failure recovery infrastructure.
Manages sensitive configuration data using SecureString parameters.
"""
from typing import Any, Dict

import pulumi
import pulumi_aws as aws

from .config import EC2RecoveryConfig


class ParameterStoreStack:
    """Parameter Store resources for EC2 recovery configuration."""

    def __init__(self, config: EC2RecoveryConfig):
        self.config = config
        self.parameters = self._create_parameters()

    def _create_parameters(self) -> Dict[str, aws.ssm.Parameter]:
        """Create Parameter Store parameters for configuration."""
        parameters = {}

        # Email configuration
        import random
        random_suffix = str(random.randint(1000, 9999))
        parameters['alert_email'] = aws.ssm.Parameter(
            f"{self.config.get_tag_name('alert-email-param')}-{random_suffix}",
            name=self.config.get_parameter_name("alert-email"),
            type="String",
            value=self.config.alert_email,
            description="Email address for EC2 recovery alerts",
            tags={
                "Name": self.config.get_tag_name("alert-email-param"),
                "Environment": self.config.environment,
                "Project": self.config.project_name,
                "Purpose": "EC2-Recovery"
            }
        )

        # Retry configuration
        parameters['max_retry_attempts'] = aws.ssm.Parameter(
            f"{self.config.get_tag_name('max-retry-param')}-{random_suffix}",
            name=self.config.get_parameter_name("max-retry-attempts"),
            type="String",
            value=str(self.config.max_retry_attempts),
            description="Maximum number of retry attempts for EC2 recovery",
            tags={
                "Name": self.config.get_tag_name("max-retry-param"),
                "Environment": self.config.environment,
                "Project": self.config.project_name,
                "Purpose": "EC2-Recovery"
            }
        )

        # Retry interval
        parameters['retry_interval_minutes'] = aws.ssm.Parameter(
            f"{self.config.get_tag_name('retry-interval-param')}-{random_suffix}",
            name=self.config.get_parameter_name("retry-interval-minutes"),
            type="String",
            value=str(self.config.retry_interval_minutes),
            description="Retry interval in minutes for EC2 recovery",
            tags={
                "Name": self.config.get_tag_name("retry-interval-param"),
                "Environment": self.config.environment,
                "Project": self.config.project_name,
                "Purpose": "EC2-Recovery"
            }
        )

        # S3 bucket name
        parameters['s3_bucket_name'] = aws.ssm.Parameter(
            f"{self.config.get_tag_name('s3-bucket-param')}-{random_suffix}",
            name=self.config.get_parameter_name("s3-bucket-name"),
            type="String",
            value=self.config.s3_bucket_name,
            description="S3 bucket name for EC2 recovery state storage",
            tags={
                "Name": self.config.get_tag_name("s3-bucket-param"),
                "Environment": self.config.environment,
                "Project": self.config.project_name,
                "Purpose": "EC2-Recovery"
            }
        )

        # SNS topic name
        parameters['sns_topic_arn'] = aws.ssm.Parameter(
            f"{self.config.get_tag_name('sns-topic-param')}-{random_suffix}",
            name=self.config.get_parameter_name("sns-topic-arn"),
            type="String",
            value=f"arn:aws:sns:{self.config.region}:*:{self.config.sns_topic_name}",
            description="SNS topic ARN for EC2 recovery alerts",
            tags={
                "Name": self.config.get_tag_name("sns-topic-param"),
                "Environment": self.config.environment,
                "Project": self.config.project_name,
                "Purpose": "EC2-Recovery"
            }
        )

        return parameters

    def get_parameter_name(self, key: str) -> str:
        """Get the full parameter name for a given key."""
        return self.config.get_parameter_name(key)

    def get_parameter_arn(self, key: str) -> str:
        """Get the parameter ARN for a given key."""
        return f"arn:aws:ssm:{self.config.region}:*:parameter{self.config.get_parameter_name(key)}"

```

12. lib\infrastructure\sns.py

```py
"""
SNS module for EC2 failure recovery infrastructure.
Manages alert notifications with email subscription handling.
"""
from typing import Any, Dict

import pulumi
import pulumi_aws as aws

from .config import EC2RecoveryConfig


class SNSStack:
    """SNS resources for EC2 recovery alerts."""

    def __init__(self, config: EC2RecoveryConfig):
        self.config = config
        self.topic = self._create_alert_topic()
        self.email_subscription = self._create_email_subscription()

    def _create_alert_topic(self) -> aws.sns.Topic:
        """Create SNS topic for EC2 recovery alerts."""
        import random
        random_suffix = str(random.randint(1000, 9999))
        return aws.sns.Topic(
            f"{self.config.get_tag_name('alert-topic')}-{random_suffix}",
            name=self.config.sns_topic_name,
            tags={
                "Name": self.config.get_tag_name("alert-topic"),
                "Environment": self.config.environment,
                "Project": self.config.project_name,
                "Purpose": "EC2-Recovery-Alerts"
            }
        )

    def _create_email_subscription(self) -> aws.sns.TopicSubscription:
        """Create email subscription for alerts."""
        import random
        random_suffix = str(random.randint(1000, 9999))
        return aws.sns.TopicSubscription(
            f"{self.config.get_tag_name('email-subscription')}-{random_suffix}",
            topic=self.topic.arn,
            protocol="email",
            endpoint=self.config.alert_email
        )

    def get_topic_arn(self) -> pulumi.Output[str]:
        """Get the SNS topic ARN."""
        return self.topic.arn

    def get_topic_name(self) -> pulumi.Output[str]:
        """Get the SNS topic name."""
        return self.topic.name

```

13. lib\infrastructure\s3.py

```py
"""
S3 module for EC2 failure recovery infrastructure.
Provides state storage with proper locking mechanisms.
"""
from typing import Any, Dict

import pulumi
import pulumi_aws as aws

from .config import EC2RecoveryConfig


class S3Stack:
    """S3 resources for EC2 recovery state storage."""

    def __init__(self, config: EC2RecoveryConfig):
        self.config = config
        self.bucket = self._create_state_bucket()
        # Removed bucket policy due to Block Public Access settings

    def _create_state_bucket(self) -> aws.s3.Bucket:
        """Create S3 bucket for storing EC2 recovery state."""
        import random
        random_suffix = str(random.randint(1000, 9999))
        return aws.s3.Bucket(
            f"{self.config.get_tag_name('state-bucket')}-{random_suffix}",
            bucket=self.config.s3_bucket_name,
            tags={
                "Name": self.config.get_tag_name("state-bucket"),
                "Environment": self.config.environment,
                "Project": self.config.project_name,
                "Purpose": "EC2-Recovery-State"
            }
        )

    def _create_bucket_policy(self) -> aws.s3.BucketPolicy:
        """Create bucket policy for secure access."""
        import random
        random_suffix = str(random.randint(1000, 9999))
        return aws.s3.BucketPolicy(
            f"{self.config.get_tag_name('bucket-policy')}-{random_suffix}",
            bucket=self.bucket.id,
            policy=pulumi.Output.from_input({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": {
                            "AWS": "*"
                        },
                        "Action": [
                            "s3:GetObject",
                            "s3:PutObject",
                            "s3:DeleteObject"
                        ],
                        "Resource": f"arn:aws:s3:::{self.config.s3_bucket_name}/ec2-recovery/*",
                        "Condition": {
                            "StringEquals": {
                                "aws:PrincipalTag/Auto-Recover": "true"
                            }
                        }
                    },
                    {
                        "Effect": "Allow",
                        "Principal": {
                            "AWS": "*"
                        },
                        "Action": [
                            "s3:ListBucket"
                        ],
                        "Resource": f"arn:aws:s3:::{self.config.s3_bucket_name}",
                        "Condition": {
                            "StringEquals": {
                                "aws:PrincipalTag/Auto-Recover": "true"
                            }
                        }
                    }
                ]
            })
        )

    def get_bucket_name(self) -> pulumi.Output[str]:
        """Get the S3 bucket name."""
        return self.bucket.id

    def get_bucket_arn(self) -> pulumi.Output[str]:
        """Get the S3 bucket ARN."""
        return self.bucket.arn

```
