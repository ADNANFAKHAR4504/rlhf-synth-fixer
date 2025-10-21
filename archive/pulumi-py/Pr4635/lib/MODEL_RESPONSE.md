#### `requirements.txt`

```txt
pulumi>=3.0.0
pulumi-aws>=6.0.0
pulumi-awsx>=2.0.0
boto3>=1.26.0
pydantic>=2.0.0
```

#### `config/settings.py`

```python
"""Configuration management for HA solution."""
from typing import Dict, List, Optional
from pydantic import BaseModel, Field
import pulumi
import pulumi_aws as aws


class HAConfig(BaseModel):
    """High Availability configuration model."""

    app_name: str = Field(default="ha-webapp")
    environment: str = Field(default="production")
    primary_region: str = Field(default="us-east-1")
    secondary_regions: List[str] = Field(default_factory=lambda: ["us-west-2"])

    # Recovery settings
    recovery_timeout_minutes: int = Field(default=15)
    health_check_interval_seconds: int = Field(default=60)
    failure_threshold: int = Field(default=3)

    # Auto Scaling settings
    min_instances: int = Field(default=2)
    max_instances: int = Field(default=10)
    desired_capacity: int = Field(default=4)

    # Monitoring settings
    log_retention_days: int = Field(default=30)
    metric_namespace: str = Field(default="HA/WebApp")

    # Cost optimization
    cleanup_unused_resources: bool = Field(default=True)
    resource_ttl_hours: int = Field(default=24)

    class Config:
        """Pydantic config."""
        arbitrary_types_allowed = True


class ParameterStoreManager:
    """Manages configuration via AWS Systems Manager Parameter Store."""

    def __init__(self, prefix: str = "/ha-webapp"):
        self.prefix = prefix
        self.parameters: Dict[str, aws.ssm.Parameter] = {}

    def create_parameter(
        self,
        name: str,
        value: str,
        description: str = "",
        secure: bool = False
    ) -> aws.ssm.Parameter:
        """Create or update a parameter in Parameter Store."""
        param_name = f"{self.prefix}/{name}"

        param = aws.ssm.Parameter(
            f"param-{name}",
            name=param_name,
            type="SecureString" if secure else "String",
            value=value,
            description=description,
            tags={
                "ManagedBy": "Pulumi",
                "Environment": pulumi.get_stack(),
                "Purpose": "HAConfiguration"
            }
        )

        self.parameters[name] = param
        return param

    def get_parameter_value(self, name: str) -> pulumi.Output:
        """Retrieve parameter value."""
        if name in self.parameters:
            return self.parameters[name].value

        param = aws.ssm.get_parameter(
            name=f"{self.prefix}/{name}",
            with_decryption=True
        )
        return pulumi.Output.from_input(param.value)


# Initialize configuration
config = HAConfig()
param_store = ParameterStoreManager()
```

#### `infrastructure/iam.py`

```python
"""IAM roles and policies for least privilege access."""
import json
import pulumi
import pulumi_aws as aws
from typing import Dict, List


class IAMManager:
    """Manages IAM roles with least privilege principles."""

    def __init__(self, app_name: str):
        self.app_name = app_name
        self.roles: Dict[str, aws.iam.Role] = {}
        self.policies: Dict[str, aws.iam.Policy] = {}

    def create_rollback_role(self) -> aws.iam.Role:
        """Create IAM role for rollback operations."""

        # Trust policy for Lambda
        assume_role_policy = json.dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Principal": {"Service": "lambda.amazonaws.com"},
                "Action": "sts:AssumeRole"
            }]
        })

        role = aws.iam.Role(
            f"{self.app_name}-rollback-role",
            assume_role_policy=assume_role_policy,
            description="Role for automated rollback operations",
            tags={"Purpose": "RollbackAutomation"}
        )

        # Rollback policy with minimal required permissions
        rollback_policy = aws.iam.Policy(
            f"{self.app_name}-rollback-policy",
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": "AutoScalingOperations",
                        "Effect": "Allow",
                        "Action": [
                            "autoscaling:UpdateAutoScalingGroup",
                            "autoscaling:SetDesiredCapacity",
                            "autoscaling:DescribeAutoScalingGroups",
                            "autoscaling:DescribeAutoScalingInstances"
                        ],
                        "Resource": "*"
                    },
                    {
                        "Sid": "EC2Operations",
                        "Effect": "Allow",
                        "Action": [
                            "ec2:DescribeInstances",
                            "ec2:DescribeInstanceStatus",
                            "ec2:TerminateInstances",
                            "ec2:RunInstances",
                            "ec2:CreateTags"
                        ],
                        "Resource": "*"
                    },
                    {
                        "Sid": "CloudFormationOperations",
                        "Effect": "Allow",
                        "Action": [
                            "cloudformation:DescribeStacks",
                            "cloudformation:UpdateStack",
                            "cloudformation:CancelUpdateStack"
                        ],
                        "Resource": "*"
                    },
                    {
                        "Sid": "SSMParameterAccess",
                        "Effect": "Allow",
                        "Action": [
                            "ssm:GetParameter",
                            "ssm:GetParameters",
                            "ssm:PutParameter"
                        ],
                        "Resource": f"arn:aws:ssm:*:*:parameter/ha-webapp/*"
                    },
                    {
                        "Sid": "S3StateAccess",
                        "Effect": "Allow",
                        "Action": [
                            "s3:GetObject",
                            "s3:PutObject",
                            "s3:ListBucket"
                        ],
                        "Resource": [
                            f"arn:aws:s3:::*-infrastructure-state/*",
                            f"arn:aws:s3:::*-infrastructure-state"
                        ]
                    },
                    {
                        "Sid": "CloudWatchLogs",
                        "Effect": "Allow",
                        "Action": [
                            "logs:CreateLogGroup",
                            "logs:CreateLogStream",
                            "logs:PutLogEvents"
                        ],
                        "Resource": "arn:aws:logs:*:*:*"
                    },
                    {
                        "Sid": "SNSPublish",
                        "Effect": "Allow",
                        "Action": [
                            "sns:Publish"
                        ],
                        "Resource": "*"
                    }
                ]
            })
        )

        # Attach policy to role
        aws.iam.RolePolicyAttachment(
            f"{self.app_name}-rollback-policy-attachment",
            role=role.name,
            policy_arn=rollback_policy.arn
        )

        self.roles["rollback"] = role
        return role

    def create_monitoring_role(self) -> aws.iam.Role:
        """Create IAM role for monitoring operations."""

        assume_role_policy = json.dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Principal": {"Service": "lambda.amazonaws.com"},
                "Action": "sts:AssumeRole"
            }]
        })

        role = aws.iam.Role(
            f"{self.app_name}-monitoring-role",
            assume_role_policy=assume_role_policy,
            description="Role for health monitoring",
            tags={"Purpose": "Monitoring"}
        )

        monitoring_policy = aws.iam.Policy(
            f"{self.app_name}-monitoring-policy",
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": "CloudWatchMetrics",
                        "Effect": "Allow",
                        "Action": [
                            "cloudwatch:PutMetricData",
                            "cloudwatch:GetMetricData",
                            "cloudwatch:ListMetrics"
                        ],
                        "Resource": "*"
                    },
                    {
                        "Sid": "EC2ReadOnly",
                        "Effect": "Allow",
                        "Action": [
                            "ec2:DescribeInstances",
                            "ec2:DescribeInstanceStatus"
                        ],
                        "Resource": "*"
                    },
                    {
                        "Sid": "ELBReadOnly",
                        "Effect": "Allow",
                        "Action": [
                            "elasticloadbalancing:DescribeLoadBalancers",
                            "elasticloadbalancing:DescribeTargetHealth"
                        ],
                        "Resource": "*"
                    },
                    {
                        "Sid": "LogsAccess",
                        "Effect": "Allow",
                        "Action": [
                            "logs:CreateLogGroup",
                            "logs:CreateLogStream",
                            "logs:PutLogEvents"
                        ],
                        "Resource": "arn:aws:logs:*:*:*"
                    }
                ]
            })
        )

        aws.iam.RolePolicyAttachment(
            f"{self.app_name}-monitoring-policy-attachment",
            role=role.name,
            policy_arn=monitoring_policy.arn
        )

        self.roles["monitoring"] = role
        return role
```

#### `recovery/state_manager.py`

```python
"""Infrastructure state management for rollback capabilities."""
import json
import hashlib
from datetime import datetime, timezone
from typing import Dict, Optional, Any
import pulumi
import pulumi_aws as aws
from pulumi import Output


class StateManager:
    """Manages infrastructure state versioning and rollback."""

    def __init__(self, app_name: str, state_bucket: aws.s3.Bucket):
        self.app_name = app_name
        self.state_bucket = state_bucket
        self.current_state_key = f"{app_name}/current-state.json"
        self.state_history_prefix = f"{app_name}/history/"

    def save_state(self, state_data: Dict[str, Any]) -> aws.s3.BucketObject:
        """Save current infrastructure state with versioning."""

        # Add metadata
        state_data["timestamp"] = datetime.now(timezone.utc).isoformat()
        state_data["stack"] = pulumi.get_stack()
        state_data["project"] = pulumi.get_project()

        # Calculate state hash for comparison
        state_json = json.dumps(state_data, sort_keys=True)
        state_hash = hashlib.sha256(state_json.encode()).hexdigest()
        state_data["hash"] = state_hash

        # Save to history with timestamp
        history_key = f"{self.state_history_prefix}{state_data['timestamp']}-{state_hash[:8]}.json"
        history_object = aws.s3.BucketObject(
            f"state-history-{state_hash[:8]}",
            bucket=self.state_bucket.bucket,
            key=history_key,
            content=json.dumps(state_data, indent=2),
            content_type="application/json",
            server_side_encryption="AES256",
            tags={
                "Type": "StateHistory",
                "Hash": state_hash[:8]
            }
        )

        # Update current state
        current_object = aws.s3.BucketObject(
            "state-current",
            bucket=self.state_bucket.bucket,
            key=self.current_state_key,
            content=json.dumps(state_data, indent=2),
            content_type="application/json",
            server_side_encryption="AES256",
            tags={
                "Type": "CurrentState",
                "LastUpdated": state_data["timestamp"]
            }
        )

        return current_object

    def create_state_snapshot(
        self,
        asg: aws.autoscaling.Group,
        instances: list,
        health_status: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Create a snapshot of current infrastructure state."""

        return {
            "autoscaling": {
                "name": asg.name,
                "min_size": asg.min_size,
                "max_size": asg.max_size,
                "desired_capacity": asg.desired_capacity,
                "health_check_type": asg.health_check_type,
                "health_check_grace_period": asg.health_check_grace_period
            },
            "instances": [
                {
                    "id": inst.id if hasattr(inst, 'id') else None,
                    "type": inst.instance_type if hasattr(inst, 'instance_type') else None,
                    "state": inst.state if hasattr(inst, 'state') else None,
                    "private_ip": inst.private_ip if hasattr(inst, 'private_ip') else None
                }
                for inst in instances
            ],
            "health": health_status,
            "metadata": {
                "app_name": self.app_name,
                "environment": pulumi.get_stack()
            }
        }
```

#### `recovery/rollback_orchestrator.py`

```python
"""Orchestrates automated rollback operations."""
import json
from typing import Dict, Any, Optional
import pulumi
import pulumi_aws as aws
from pulumi import Output


class RollbackOrchestrator:
    """Manages rollback operations and recovery procedures."""

    def __init__(
        self,
        app_name: str,
        sns_topic: aws.sns.Topic,
        state_manager: 'StateManager'
    ):
        self.app_name = app_name
        self.sns_topic = sns_topic
        self.state_manager = state_manager
        self.rollback_in_progress = False

    def create_rollback_lambda(
        self,
        role: aws.iam.Role,
        state_bucket: aws.s3.Bucket
    ) -> aws.lambda_.Function:
        """Create Lambda function for rollback orchestration."""

        # Lambda code for rollback handling
        lambda_code = """
import json
import boto3
import os
from datetime import datetime

def handler(event, context):
    '''
    Orchestrates infrastructure rollback to last known good state.
    '''

    # Initialize AWS clients
    s3 = boto3.client('s3')
    autoscaling = boto3.client('autoscaling')
    sns = boto3.client('sns')
    ssm = boto3.client('ssm')

    state_bucket = os.environ['STATE_BUCKET']
    sns_topic_arn = os.environ['SNS_TOPIC_ARN']
    app_name = os.environ['APP_NAME']

    try:
        # Step 1: Retrieve last valid state
        response = s3.get_object(
            Bucket=state_bucket,
            Key=f"{app_name}/current-state.json"
        )
        last_state = json.loads(response['Body'].read())

        # Step 2: Validate state integrity
        if 'autoscaling' not in last_state:
            raise ValueError("Invalid state: missing autoscaling configuration")

        # Step 3: Restore Auto Scaling configuration
        asg_config = last_state['autoscaling']

        # Update ASG to previous configuration
        autoscaling.update_auto_scaling_group(
            AutoScalingGroupName=asg_config['name'],
            MinSize=asg_config['min_size'],
            MaxSize=asg_config['max_size'],
            DesiredCapacity=asg_config['desired_capacity']
        )

        # Step 4: Wait for instances to stabilize
        waiter = autoscaling.get_waiter('group_in_service')
        waiter.wait(
            AutoScalingGroupNames=[asg_config['name']],
            WaiterConfig={'Delay': 30, 'MaxAttempts': 20}
        )

        # Step 5: Update recovery status in Parameter Store
        ssm.put_parameter(
            Name=f'/ha-webapp/last-rollback',
            Value=json.dumps({
                'timestamp': datetime.utcnow().isoformat(),
                'status': 'success',
                'restored_state_hash': last_state.get('hash', 'unknown')
            }),
            Type='String',
            Overwrite=True
        )

        # Step 6: Send success notification
        sns.publish(
            TopicArn=sns_topic_arn,
            Subject='[SUCCESS] Infrastructure Rollback Complete',
            Message=json.dumps({
                'status': 'success',
                'timestamp': datetime.utcnow().isoformat(),
                'restored_capacity': asg_config['desired_capacity'],
                'state_hash': last_state.get('hash', 'unknown')
            }, indent=2)
        )

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Rollback completed successfully',
                'restored_state': asg_config
            })
        }

    except Exception as e:
        # Log error and send failure notification
        error_message = str(e)

        sns.publish(
            TopicArn=sns_topic_arn,
            Subject='[FAILURE] Infrastructure Rollback Failed',
            Message=json.dumps({
                'status': 'failed',
                'error': error_message,
                'timestamp': datetime.utcnow().isoformat()
            }, indent=2)
        )

        raise
"""

        # Create Lambda function
        lambda_func = aws.lambda_.Function(
            f"{self.app_name}-rollback-handler",
            role=role.arn,
            runtime="python3.11",
            handler="index.handler",
            code=pulumi.AssetArchive({
                "index.py": pulumi.StringAsset(lambda_code)
            }),
            timeout=900,  # 15 minutes timeout
            memory_size=512,
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    "STATE_BUCKET": state_bucket.bucket,
                    "SNS_TOPIC_ARN": self.sns_topic.arn,
                    "APP_NAME": self.app_name
                }
            ),
            description="Orchestrates infrastructure rollback operations",
            tags={
                "Purpose": "Rollback",
                "ManagedBy": "Pulumi"
            }
        )

        return lambda_func

    def create_health_monitor_lambda(
        self,
        role: aws.iam.Role
    ) -> aws.lambda_.Function:
        """Create Lambda for continuous health monitoring."""

        lambda_code = """
import json
import boto3
import os
from datetime import datetime

def handler(event, context):
    '''
    Monitors infrastructure health and triggers rollback if needed.
    '''

    ec2 = boto3.client('ec2')
    elb = boto3.client('elbv2')
    cloudwatch = boto3.client('cloudwatch')
    lambda_client = boto3.client('lambda')

    app_name = os.environ['APP_NAME']
    rollback_function = os.environ['ROLLBACK_FUNCTION_ARN']
    failure_threshold = int(os.environ.get('FAILURE_THRESHOLD', '3'))

    try:
        # Check EC2 instance health
        instances = ec2.describe_instances(
            Filters=[
                {'Name': 'tag:Application', 'Values': [app_name]},
                {'Name': 'instance-state-name', 'Values': ['running']}
            ]
        )

        unhealthy_count = 0
        total_instances = 0

        for reservation in instances['Reservations']:
            for instance in reservation['Instances']:
                total_instances += 1

                # Check instance status
                status = ec2.describe_instance_status(
                    InstanceIds=[instance['InstanceId']]
                )

                if status['InstanceStatuses']:
                    instance_status = status['InstanceStatuses'][0]
                    if (instance_status['InstanceStatus']['Status'] != 'ok' or
                        instance_status['SystemStatus']['Status'] != 'ok'):
                        unhealthy_count += 1

        # Calculate health percentage
        if total_instances > 0:
            health_percentage = ((total_instances - unhealthy_count) / total_instances) * 100
        else:
            health_percentage = 0

        # Push metrics to CloudWatch
        cloudwatch.put_metric_data(
            Namespace='HA/WebApp',
            MetricData=[
                {
                    'MetricName': 'HealthPercentage',
                    'Value': health_percentage,
                    'Unit': 'Percent',
                    'Timestamp': datetime.utcnow()
                },
                {
                    'MetricName': 'UnhealthyInstances',
                    'Value': unhealthy_count,
                    'Unit': 'Count',
                    'Timestamp': datetime.utcnow()
                }
            ]
        )

        # Trigger rollback if health is below threshold
        if unhealthy_count >= failure_threshold and total_instances > 0:
            lambda_client.invoke(
                FunctionName=rollback_function,
                InvocationType='Event',
                Payload=json.dumps({
                    'trigger': 'health_check_failure',
                    'unhealthy_count': unhealthy_count,
                    'total_instances': total_instances,
                    'health_percentage': health_percentage
                })
            )

            return {
                'statusCode': 200,
                'body': json.dumps({
                    'action': 'rollback_triggered',
                    'reason': f'Health check failed: {unhealthy_count}/{total_instances} unhealthy'
                })
            }

        return {
            'statusCode': 200,
            'body': json.dumps({
                'status': 'healthy',
                'health_percentage': health_percentage,
                'unhealthy_count': unhealthy_count,
                'total_instances': total_instances
            })
        }

    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
"""

        lambda_func = aws.lambda_.Function(
            f"{self.app_name}-health-monitor",
            role=role.arn,
            runtime="python3.11",
            handler="index.handler",
            code=pulumi.AssetArchive({
                "index.py": pulumi.StringAsset(lambda_code)
            }),
            timeout=60,
            memory_size=256,
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    "APP_NAME": self.app_name,
                    "ROLLBACK_FUNCTION_ARN": "",  # Will be updated after rollback lambda creation
                    "FAILURE_THRESHOLD": "3"
                }
            ),
            description="Monitors infrastructure health",
            tags={
                "Purpose": "HealthMonitoring",
                "ManagedBy": "Pulumi"
            }
        )

        return lambda_func
```

#### `infrastructure/monitoring.py`

```python
"""CloudWatch monitoring and alerting configuration."""
import pulumi
import pulumi_aws as aws
from typing import List, Dict, Any


class MonitoringStack:
    """Configures comprehensive monitoring and alerting."""

    def __init__(self, app_name: str, sns_topic: aws.sns.Topic):
        self.app_name = app_name
        self.sns_topic = sns_topic
        self.log_group = self.create_log_group()
        self.dashboard = self.create_dashboard()
        self.alarms = {}

    def create_log_group(self) -> aws.cloudwatch.LogGroup:
        """Create centralized log group."""
        return aws.cloudwatch.LogGroup(
            f"{self.app_name}-logs",
            retention_in_days=30,
            kms_key_id="alias/aws/logs",
            tags={
                "Application": self.app_name,
                "Purpose": "CentralizedLogging"
            }
        )

    def create_dashboard(self) -> aws.cloudwatch.Dashboard:
        """Create CloudWatch dashboard for monitoring."""

        dashboard_body = {
            "widgets": [
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["HA/WebApp", "HealthPercentage", {"stat": "Average"}],
                            [".", "UnhealthyInstances", {"stat": "Sum"}],
                            ["AWS/EC2", "CPUUtilization", {"stat": "Average"}],
                            ["AWS/EC2", "NetworkIn", {"stat": "Sum"}],
                            ["AWS/EC2", "NetworkOut", {"stat": "Sum"}]
                        ],
                        "period": 300,
                        "stat": "Average",
                        "region": "us-east-1",
                        "title": "Infrastructure Health"
                    }
                },
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/Lambda", "Invocations", {"stat": "Sum"}],
                            [".", "Errors", {"stat": "Sum"}],
                            [".", "Duration", {"stat": "Average"}]
                        ],
                        "period": 300,
                        "stat": "Average",
                        "region": "us-east-1",
                        "title": "Lambda Functions"
                    }
                },
                {
                    "type": "log",
                    "properties": {
                        "query": f"SOURCE '/aws/lambda/{self.app_name}-rollback-handler' | fields @timestamp, @message | sort @timestamp desc | limit 20",
                        "region": "us-east-1",
                        "title": "Recent Rollback Activities"
                    }
                }
            ]
        }

        return aws.cloudwatch.Dashboard(
            f"{self.app_name}-dashboard",
            dashboard_name=f"{self.app_name}-ha-dashboard",
            dashboard_body=pulumi.Output.json_dumps(dashboard_body)
        )

    def create_alarm(
        self,
        name: str,
        metric_name: str,
        namespace: str,
        statistic: str,
        threshold: float,
        comparison_operator: str,
        evaluation_periods: int = 2,
        period: int = 300,
        dimensions: Dict[str, str] = None
    ) -> aws.cloudwatch.MetricAlarm:
        """Create CloudWatch alarm with SNS notification."""

        alarm = aws.cloudwatch.MetricAlarm(
            f"{self.app_name}-alarm-{name}",
            alarm_name=f"{self.app_name}-{name}",
            comparison_operator=comparison_operator,
            evaluation_periods=evaluation_periods,
            metric_name=metric_name,
            namespace=namespace,
            period=period,
            statistic=statistic,
            threshold=threshold,
            alarm_description=f"Alarm for {name}",
            alarm_actions=[self.sns_topic.arn],
            ok_actions=[self.sns_topic.arn],
            dimensions=dimensions,
            tags={
                "Application": self.app_name,
                "AlarmType": name
            }
        )

        self.alarms[name] = alarm
        return alarm

    def setup_standard_alarms(self, asg_name: pulumi.Output[str]):
        """Setup standard monitoring alarms."""

        # High CPU utilization
        self.create_alarm(
            name="high-cpu",
            metric_name="CPUUtilization",
            namespace="AWS/EC2",
            statistic="Average",
            threshold=80,
            comparison_operator="GreaterThanThreshold",
            dimensions={"AutoScalingGroupName": asg_name}
        )

        # Low health percentage
        self.create_alarm(
            name="low-health",
            metric_name="HealthPercentage",
            namespace="HA/WebApp",
            statistic="Average",
            threshold=60,
            comparison_operator="LessThanThreshold"
        )

        # High unhealthy instance count
        self.create_alarm(
            name="unhealthy-instances",
            metric_name="UnhealthyInstances",
            namespace="HA/WebApp",
            statistic="Sum",
            threshold=3,
            comparison_operator="GreaterThanThreshold"
        )

        # Lambda errors
        self.create_alarm(
            name="lambda-errors",
            metric_name="Errors",
            namespace="AWS/Lambda",
            statistic="Sum",
            threshold=5,
            comparison_operator="GreaterThanThreshold",
            period=60,
            evaluation_periods=1
        )
```

#### `infrastructure/storage.py`

```python
"""S3 storage configuration for logs and state management."""
import pulumi
import pulumi_aws as aws
from typing import Optional


class StorageStack:
    """Manages S3 buckets for logs and state storage."""

    def __init__(self, app_name: str):
        self.app_name = app_name
        self.log_bucket = self.create_log_bucket()
        self.state_bucket = self.create_state_bucket()

    def create_log_bucket(self) -> aws.s3.Bucket:
        """Create encrypted S3 bucket for log storage."""

        bucket = aws.s3.Bucket(
            f"{self.app_name}-logs-bucket",
            acl="private",
            server_side_encryption_configuration=aws.s3.BucketServerSideEncryptionConfigurationArgs(
                rule=aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                    apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                        sse_algorithm="AES256"
                    )
                )
            ),
            lifecycle_rules=[
                aws.s3.BucketLifecycleRuleArgs(
                    id="delete-old-logs",
                    enabled=True,
                    expiration=aws.s3.BucketLifecycleRuleExpirationArgs(
                        days=90
                    ),
                    transitions=[
                        aws.s3.BucketLifecycleRuleTransitionArgs(
                            days=30,
                            storage_class="STANDARD_IA"
                        ),
                        aws.s3.BucketLifecycleRuleTransitionArgs(
                            days=60,
                            storage_class="GLACIER"
                        )
                    ]
                )
            ],
            versioning=aws.s3.BucketVersioningArgs(
                enabled=True
            ),
            tags={
                "Purpose": "LogStorage",
                "Application": self.app_name,
                "Encryption": "AES256"
            }
        )

        # Block public access
        aws.s3.BucketPublicAccessBlock(
            f"{self.app_name}-logs-bucket-pab",
            bucket=bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True
        )

        return bucket

    def create_state_bucket(self) -> aws.s3.Bucket:
        """Create S3 bucket for infrastructure state storage."""

        bucket = aws.s3.Bucket(
            f"{self.app_name}-state-bucket",
            acl="private",
            server_side_encryption_configuration=aws.s3.BucketServerSideEncryptionConfigurationArgs(
                rule=aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                    apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                        sse_algorithm="aws:kms"
                    )
                )
            ),
            versioning=aws.s3.BucketVersioningArgs(
                enabled=True
            ),
            lifecycle_rules=[
                aws.s3.BucketLifecycleRuleArgs(
                    id="retain-state-history",
                    enabled=True,
                    noncurrent_version_expiration=aws.s3.BucketLifecycleRuleNoncurrentVersionExpirationArgs(
                        days=30
                    )
                )
            ],
            tags={
                "Purpose": "StateManagement",
                "Application": self.app_name,
                "Critical": "true"
            }
        )

        # Block public access
        aws.s3.BucketPublicAccessBlock(
            f"{self.app_name}-state-bucket-pab",
            bucket=bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True
        )

        return bucket
```

#### `infrastructure/compute.py`

```python
"""Auto Scaling and EC2 configuration."""
import pulumi
import pulumi_aws as aws
from typing import List, Optional


class ComputeStack:
    """Manages EC2 instances and Auto Scaling groups."""

    def __init__(
        self,
        app_name: str,
        vpc_id: str,
        subnet_ids: List[str],
        min_size: int = 2,
        max_size: int = 10,
        desired_capacity: int = 4
    ):
        self.app_name = app_name
        self.vpc_id = vpc_id
        self.subnet_ids = subnet_ids
        self.min_size = min_size
        self.max_size = max_size
        self.desired_capacity = desired_capacity

        self.security_group = self.create_security_group()
        self.launch_template = self.create_launch_template()
        self.asg = self.create_auto_scaling_group()
        self.target_group = self.create_target_group()

    def create_security_group(self) -> aws.ec2.SecurityGroup:
        """Create security group for instances."""

        sg = aws.ec2.SecurityGroup(
            f"{self.app_name}-instance-sg",
            description="Security group for application instances",
            vpc_id=self.vpc_id,
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=80,
                    to_port=80,
                    cidr_blocks=["10.0.0.0/8"]
                ),
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=443,
                    to_port=443,
                    cidr_blocks=["10.0.0.0/8"]
                ),
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=22,
                    to_port=22,
                    cidr_blocks=["10.0.0.0/8"]
                )
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            tags={
                "Name": f"{self.app_name}-instance-sg",
                "Application": self.app_name
            }
        )

        return sg

    def create_launch_template(self) -> aws.ec2.LaunchTemplate:
        """Create launch template for Auto Scaling."""

        # User data script for instance initialization
        user_data = """#!/bin/bash
# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
rpm -U ./amazon-cloudwatch-agent.rpm

# Configure CloudWatch agent
cat > /opt/aws/amazon-cloudwatch-agent/etc/config.json << EOF
{
  "metrics": {
    "namespace": "HA/WebApp",
    "metrics_collected": {
      "cpu": {
        "measurement": [
          {"name": "cpu_usage_idle", "rename": "CPU_IDLE", "unit": "Percent"},
          {"name": "cpu_usage_iowait", "rename": "CPU_IOWAIT", "unit": "Percent"}
        ],
        "totalcpu": false,
        "metrics_collection_interval": 60
      },
      "disk": {
        "measurement": [
          {"name": "used_percent", "rename": "DISK_USED", "unit": "Percent"}
        ],
        "metrics_collection_interval": 60,
        "resources": ["/"]
      },
      "mem": {
        "measurement": [
          {"name": "mem_used_percent", "rename": "MEM_USED", "unit": "Percent"}
        ],
        "metrics_collection_interval": 60
      }
    }
  },
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/application.log",
            "log_group_name": "/aws/ec2/application",
            "log_stream_name": "{instance_id}"
          }
        ]
      }
    }
  }
}
EOF

# Start CloudWatch agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c file:/opt/aws/amazon-cloudwatch-agent/etc/config.json

# Your application startup commands here
echo "Application starting..."
"""

        template = aws.ec2.LaunchTemplate(
            f"{self.app_name}-launch-template",
            name_prefix=f"{self.app_name}-",
            image_id="ami-0c55b159cbfafe1f0",  # Amazon Linux 2
            instance_type="t3.medium",
            key_name="your-key-pair",  # Replace with your key pair
            vpc_security_group_ids=[self.security_group.id],
            user_data=pulumi.Output.from_input(user_data).apply(
                lambda ud: pulumi.Output.from_input(ud).apply(
                    lambda text: text if isinstance(text, str) else str(text)
                ).apply(lambda s: s.encode('utf-8')).apply(
                    lambda b: b if isinstance(b, bytes) else bytes(b, 'utf-8')
                ).apply(lambda b: __import__('base64').b64encode(b).decode('utf-8'))
            ),
            iam_instance_profile=aws.ec2.LaunchTemplateIamInstanceProfileArgs(
                name=self.create_instance_profile().name
            ),
            monitoring=aws.ec2.LaunchTemplateMonitoringArgs(
                enabled=True
            ),
            metadata_options=aws.ec2.LaunchTemplateMetadataOptionsArgs(
                http_tokens="required",
                http_put_response_hop_limit=1
            ),
            tag_specifications=[
                aws.ec2.LaunchTemplateTagSpecificationArgs(
                    resource_type="instance",
                    tags={
                        "Name": f"{self.app_name}-instance",
                        "Application": self.app_name,
                        "ManagedBy": "Pulumi"
                    }
                ),
                aws.ec2.LaunchTemplateTagSpecificationArgs(
                    resource_type="volume",
                    tags={
                        "Name": f"{self.app_name}-volume",
                        "Application": self.app_name
                    }
                )
            ]
        )

        return template

    def create_instance_profile(self) -> aws.iam.InstanceProfile:
        """Create IAM instance profile for EC2 instances."""

        role = aws.iam.Role(
            f"{self.app_name}-instance-role",
            assume_role_policy="""{
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "ec2.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }"""
        )

        # Attach policies for CloudWatch and SSM
        aws.iam.RolePolicyAttachment(
            f"{self.app_name}-cloudwatch-policy",
            role=role.name,
            policy_arn="arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
        )

        aws.iam.RolePolicyAttachment(
            f"{self.app_name}-ssm-policy",
            role=role.name,
            policy_arn="arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
        )

        profile = aws.iam.InstanceProfile(
            f"{self.app_name}-instance-profile",
            role=role.name
        )

        return profile

    def create_auto_scaling_group(self) -> aws.autoscaling.Group:
        """Create Auto Scaling group with health checks."""

        asg = aws.autoscaling.Group(
            f"{self.app_name}-asg",
            name=f"{self.app_name}-asg",
            vpc_zone_identifiers=self.subnet_ids,
            min_size=self.min_size,
            max_size=self.max_size,
            desired_capacity=self.desired_capacity,
            health_check_type="ELB",
            health_check_grace_period=300,
            launch_template=aws.autoscaling.GroupLaunchTemplateArgs(
                id=self.launch_template.id,
                version="$Latest"
            ),
            enabled_metrics=[
                "GroupMinSize",
                "GroupMaxSize",
                "GroupDesiredCapacity",
                "GroupInServiceInstances",
                "GroupTotalInstances"
            ],
            tags=[
                aws.autoscaling.GroupTagArgs(
                    key="Name",
                    value=f"{self.app_name}-asg-instance",
                    propagate_at_launch=True
                ),
                aws.autoscaling.GroupTagArgs(
                    key="Application",
                    value=self.app_name,
                    propagate_at_launch=True
                ),
                aws.autoscaling.GroupTagArgs(
                    key="ManagedBy",
                    value="Pulumi",
                    propagate_at_launch=True
                )
            ]
        )

        # Create scaling policies
        self.create_scaling_policies(asg)

        return asg

    def create_scaling_policies(self, asg: aws.autoscaling.Group):
        """Create auto-scaling policies."""

        # Scale up policy
        scale_up = aws.autoscaling.Policy(
            f"{self.app_name}-scale-up",
            autoscaling_group_name=asg.name,
            adjustment_type="ChangeInCapacity",
            scaling_adjustment=2,
            cooldown=300,
            policy_type="SimpleScaling"
        )

        # Scale down policy
        scale_down = aws.autoscaling.Policy(
            f"{self.app_name}-scale-down",
            autoscaling_group_name=asg.name,
            adjustment_type="ChangeInCapacity",
            scaling_adjustment=-1,
            cooldown=300,
            policy_type="SimpleScaling"
        )

        # Target tracking policy for CPU
        aws.autoscaling.Policy(
            f"{self.app_name}-cpu-target-tracking",
            autoscaling_group_name=asg.name,
            policy_type="TargetTrackingScaling",
            target_tracking_configuration=aws.autoscaling.PolicyTargetTrackingConfigurationArgs(
                predefined_metric_specification=aws.autoscaling.PolicyTargetTrackingConfigurationPredefinedMetricSpecificationArgs(
                    predefined_metric_type="ASGAverageCPUUtilization"
                ),
                target_value=70.0
            )
        )

    def create_target_group(self) -> aws.lb.TargetGroup:
        """Create target group for load balancer."""

        tg = aws.lb.TargetGroup(
            f"{self.app_name}-tg",
            port=80,
            protocol="HTTP",
            vpc_id=self.vpc_id,
            health_check=aws.lb.TargetGroupHealthCheckArgs(
                enabled=True,
                interval=30,
                path="/health",
                timeout=5,
                healthy_threshold=2,
                unhealthy_threshold=3
            ),
            deregistration_delay=30,
            tags={
                "Name": f"{self.app_name}-tg",
                "Application": self.app_name
            }
        )

        # Attach to ASG
        aws.autoscaling.Attachment(
            f"{self.app_name}-asg-attachment",
            autoscaling_group_name=self.asg.name,
            lb_target_group_arn=tg.arn
        )

        return tg
```

#### `__main__.py`

```python
"""Main Pulumi program for HA infrastructure deployment."""
import pulumi
import pulumi_aws as aws
from pulumi import Config, ResourceOptions, Output

from config.settings import config, param_store
from infrastructure.iam import IAMManager
from infrastructure.compute import ComputeStack
from infrastructure.monitoring import MonitoringStack
from infrastructure.storage import StorageStack
from recovery.state_manager import StateManager
from recovery.rollback_orchestrator import RollbackOrchestrator


def main():
    """Main deployment function."""

    # Get configuration
    pulumi_config = Config()
    app_name = config.app_name
    environment = pulumi.get_stack()

    # Store configuration in Parameter Store
    param_store.create_parameter(
        "environment",
        environment,
        "Deployment environment"
    )

    param_store.create_parameter(
        "recovery_timeout",
        str(config.recovery_timeout_minutes),
        "Recovery timeout in minutes"
    )

    # Create SNS topic for notifications
    sns_topic = aws.sns.Topic(
        f"{app_name}-alerts",
        display_name=f"{app_name} Infrastructure Alerts",
        tags={"Application": app_name}
    )

    # Subscribe to SNS topic
    aws.sns.TopicSubscription(
        f"{app_name}-email-subscription",
        topic=sns_topic.arn,
        protocol="email",
        endpoint="your-email@example.com"  # Replace with your email
    )

    # Create IAM roles
    iam_manager = IAMManager(app_name)
    rollback_role = iam_manager.create_rollback_role()
    monitoring_role = iam_manager.create_monitoring_role()

    # Create storage resources
    storage = StorageStack(app_name)

    # Get VPC and subnets (using default VPC for simplicity)
    vpc = aws.ec2.get_vpc(default=True)
    subnets = aws.ec2.get_subnets(
        filters=[
            aws.ec2.GetSubnetsFilterArgs(
                name="vpc-id",
                values=[vpc.id]
            )
        ]
    )

    # Create compute resources
    compute = ComputeStack(
        app_name=app_name,
        vpc_id=vpc.id,
        subnet_ids=subnets.ids[:2],  # Use first 2 subnets
        min_size=config.min_instances,
        max_size=config.max_instances,
        desired_capacity=config.desired_capacity
    )

    # Create monitoring stack
    monitoring = MonitoringStack(app_name, sns_topic)
    monitoring.setup_standard_alarms(compute.asg.name)

    # Initialize state manager
    state_manager = StateManager(app_name, storage.state_bucket)

    # Save initial state
    initial_state = state_manager.create_state_snapshot(
        asg=compute.asg,
        instances=[],
        health_status={"status": "healthy", "initialized": True}
    )

    state_manager.save_state(initial_state)

    # Create rollback orchestrator
    rollback_orchestrator = RollbackOrchestrator(
        app_name=app_name,
        sns_topic=sns_topic,
        state_manager=state_manager
    )

    # Create Lambda functions
    rollback_lambda = rollback_orchestrator.create_rollback_lambda(
        role=rollback_role,
        state_bucket=storage.state_bucket
    )

    health_monitor_lambda = rollback_orchestrator.create_health_monitor_lambda(
        role=monitoring_role
    )

    # Update health monitor with rollback function ARN
    aws.lambda_.FunctionEnvironment(
        f"{app_name}-health-monitor-env-update",
        function_name=health_monitor_lambda.name,
        variables={
            "APP_NAME": app_name,
            "ROLLBACK_FUNCTION_ARN": rollback_lambda.arn,
            "FAILURE_THRESHOLD": "3"
        }
    )

    # Create CloudWatch Events rule for periodic health checks
    schedule_rule = aws.cloudwatch.EventRule(
        f"{app_name}-health-check-schedule",
        schedule_expression="rate(1 minute)",
        description="Periodic health check trigger",
        is_enabled=True
    )

    # Add Lambda permission for CloudWatch Events
    aws.lambda_.Permission(
        f"{app_name}-health-lambda-permission",
        statement_id="AllowExecutionFromCloudWatch",
        action="lambda:InvokeFunction",
        function=health_monitor_lambda.name,
        principal="events.amazonaws.com",
        source_arn=schedule_rule.arn
    )

    # Create CloudWatch Events target
    aws.cloudwatch.EventTarget(
        f"{app_name}-health-check-target",
        rule=schedule_rule.name,
        arn=health_monitor_lambda.arn
    )

    # Create cleanup Lambda for cost optimization
    cleanup_lambda_code = """
import json
import boto3
from datetime import datetime, timedelta

def handler(event, context):
    '''Clean up unused resources for cost optimization.'''

    ec2 = boto3.client('ec2')
    s3 = boto3.client('s3')

    # Clean up old snapshots
    snapshots = ec2.describe_snapshots(OwnerIds=['self'])
    cutoff_date = datetime.now() - timedelta(days=7)

    for snapshot in snapshots['Snapshots']:
        if snapshot['StartTime'].replace(tzinfo=None) < cutoff_date:
            try:
                ec2.delete_snapshot(SnapshotId=snapshot['SnapshotId'])
                print(f"Deleted snapshot: {snapshot['SnapshotId']}")
            except Exception as e:
                print(f"Error deleting snapshot: {e}")

    # Clean up unattached volumes
    volumes = ec2.describe_volumes(
        Filters=[{'Name': 'status', 'Values': ['available']}]
    )

    for volume in volumes['Volumes']:
        if volume['CreateTime'].replace(tzinfo=None) < cutoff_date:
            try:
                ec2.delete_volume(VolumeId=volume['VolumeId'])
                print(f"Deleted volume: {volume['VolumeId']}")
            except Exception as e:
                print(f"Error deleting volume: {e}")

    return {
        'statusCode': 200,
        'body': json.dumps('Cleanup completed')
    }
"""

    cleanup_lambda = aws.lambda_.Function(
        f"{app_name}-cleanup-handler",
        role=rollback_role.arn,
        runtime="python3.11",
        handler="index.handler",
        code=pulumi.AssetArchive({
            "index.py": pulumi.StringAsset(cleanup_lambda_code)
        }),
        timeout=300,
        description="Cleanup unused resources for cost optimization"
    )

    # Schedule cleanup to run daily
    cleanup_schedule = aws.cloudwatch.EventRule(
        f"{app_name}-cleanup-schedule",
        schedule_expression="rate(1 day)",
        description="Daily cleanup schedule"
    )

    aws.lambda_.Permission(
        f"{app_name}-cleanup-lambda-permission",
        statement_id="AllowExecutionFromCloudWatch",
        action="lambda:InvokeFunction",
        function=cleanup_lambda.name,
        principal="events.amazonaws.com",
        source_arn=cleanup_schedule.arn
    )

    aws.cloudwatch.EventTarget(
        f"{app_name}-cleanup-target",
        rule=cleanup_schedule.name,
        arn=cleanup_lambda.arn
    )

    # Export important values
    pulumi.export("sns_topic_arn", sns_topic.arn)
    pulumi.export("asg_name", compute.asg.name)
    pulumi.export("log_bucket", storage.log_bucket.bucket)
    pulumi.export("state_bucket", storage.state_bucket.bucket)
    pulumi.export("dashboard_url", monitoring.dashboard.dashboard_arn.apply(
        lambda arn: f"https://console.aws.amazon.com/cloudwatch/home?region={aws.get_region().name}#dashboards:name={app_name}-ha-dashboard"
    ))
    pulumi.export("rollback_lambda_arn", rollback_lambda.arn)
    pulumi.export("health_monitor_lambda_arn", health_monitor_lambda.arn)


if __name__ == "__main__":
    main()
```

## Deployment Instructions

### 1. Prerequisites

```bash
# Install Pulumi
curl -fsSL https://get.pulumi.com | sh

# Install Python dependencies
pip install -r requirements.txt

# Configure AWS credentials
aws configure
```

### 2. Initialize Pulumi Stack

```bash
# Initialize new project
pulumi new aws-python

# Set configuration
pulumi config set aws:region us-east-1
pulumi config set --secret email your-email@example.com
```

### 3. Deploy Infrastructure

```bash
# Preview changes
pulumi preview

# Deploy
pulumi up -y
```

### 4. Multi-Region Deployment

```bash
# Deploy to secondary region
pulumi stack init us-west-2
pulumi config set aws:region us-west-2
pulumi up -y
```

## Testing Recovery Mechanisms

### Simulate Failure

```bash
# Terminate instances to trigger recovery
aws ec2 terminate-instances --instance-ids <instance-id>

# Monitor CloudWatch dashboard for automated recovery
```

### Verify Rollback

```python
# Test rollback trigger
import boto3

lambda_client = boto3.client('lambda')
response = lambda_client.invoke(
    FunctionName='ha-webapp-rollback-handler',
    InvocationType='RequestResponse',
    Payload=json.dumps({'test': True})
)
```
