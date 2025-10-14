# AWS CDK EC2 Monitoring Infrastructure - Solution

This AWS CDK application in Python deploys a comprehensive EC2 monitoring infrastructure for a SaaS startup.

## Solution Overview

The solution creates a fully-featured EC2 monitoring system with:

- **15 EC2 t3.medium instances** deployed across multiple AZs
- **VPC with 10.0.0.0/16 CIDR** including public and private subnets
- **Security Groups** allowing HTTP traffic on port 80
- **CloudWatch alarms** for memory usage above 80% (plus CPU, disk, and status monitoring)
- **Dual logging**: Both S3 and CloudWatch Logs integration
- **IAM roles** with secure monitoring permissions
- **Cost-effective design** with configurable resource limits

## Key Features

- **Modular Architecture**: Uses nested stacks for better organization
- **Environment Support**: Configurable environment suffixes (dev/prod)
- **Flexible Configuration**: CDK context parameters for resource limits
- **Comprehensive Monitoring**: Memory, CPU, disk, and status check alarms
- **Dual Logging**: S3 for archival + CloudWatch Logs for real-time analysis
- **Cost Optimization**: Lifecycle policies, retention limits, single NAT gateway
- **Security Best Practices**: IAM least privilege, private subnets, encryption

## Complete Implementation

```python
"""tap_stack.py
This module defines the TapStack class, which serves as the main CDK stack for
the TAP (Test Automation Platform) project.
It orchestrates the instantiation of other resource-specific stacks and
manages environment-specific configurations.
"""

import json
from typing import Optional

import aws_cdk as cdk
from aws_cdk import (
    NestedStack,
    Duration,
    RemovalPolicy,
    CfnOutput,
    aws_ec2 as ec2,
    aws_iam as iam,
    aws_s3 as s3,
    aws_logs as logs,
    aws_cloudwatch as cloudwatch,
    aws_cloudwatch_actions as cw_actions,
    aws_sns as sns,
    Tags,
)
from constructs import Construct

# Import your stacks here
# from .ddb_stack import DynamoDBStack, DynamoDBStackProps


class TapStackProps(cdk.StackProps):
    """
    TapStackProps defines the properties for the TapStack CDK stack.

    Args:
        environment_suffix (Optional[str]): An optional suffix to identify the
        deployment environment (e.g., 'dev', 'prod').
        **kwargs: Additional keyword arguments passed to the base cdk.StackProps.

    Attributes:
        environment_suffix (Optional[str]): Stores the environment suffix for the stack.
    """

    def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix


class NestedEC2MonitoringStack(NestedStack):
    """
    Nested stack for EC2 monitoring infrastructure.

    This nested stack creates a comprehensive EC2 monitoring solution including:
    - VPC with public and private subnets
    - Security groups for HTTP traffic
    - S3 bucket for log storage
    - CloudWatch log groups
    - IAM roles with monitoring permissions
    - EC2 instances with CloudWatch agent
    - CloudWatch alarms for memory, CPU, disk, and status monitoring
    - SNS topic for alarm notifications
    """

    def __init__(self, scope: Construct, construct_id: str, environment_suffix: str, **kwargs):
        super().__init__(scope, construct_id, **kwargs)

        # Configuration parameters - can be customized based on AWS account limits
        instance_count = int(self.node.try_get_context("instanceCount") or 15)
        instance_size_name = self.node.try_get_context("instanceSize") or "MEDIUM"
        instance_type = ec2.InstanceType.of(ec2.InstanceClass.T3, getattr(ec2.InstanceSize, instance_size_name))

        # Create VPC with specified CIDR
        vpc = self.create_vpc()

        # Create Security Group
        security_group = self.create_security_group(vpc)

        # Create S3 bucket for logs
        log_bucket = self.create_log_bucket(environment_suffix)

        # Create CloudWatch Log Group
        log_group = self.create_log_group()

        # Create IAM role for EC2 instances
        instance_role = self.create_instance_role(log_bucket, log_group)

        # Create SNS topic for alarms
        alarm_topic = self.create_alarm_topic()

        # Get Amazon Linux 2 AMI
        ami = ec2.MachineImage.latest_amazon_linux2()

        # Create EC2 instances with monitoring
        instances = []
        for i in range(instance_count):
            instance = self.create_monitored_instance(
                vpc=vpc,
                security_group=security_group,
                instance_role=instance_role,
                instance_config={
                    "instance_type": instance_type,
                    "ami": ami,
                    "instance_index": i,
                    "log_group": log_group,
                    "log_bucket": log_bucket,
                },
            )
            instances.append(instance)

            # Create alarms for each instance
            self.create_instance_alarms(instance, alarm_topic, i)

        # Add cost-saving tags
        Tags.of(self).add("Environment", f"TAP-{environment_suffix}")
        Tags.of(self).add("ManagedBy", "CDK")
        Tags.of(self).add("Project", "TAP-EC2-Monitoring")

        # Store references for access from parent stack
        self.vpc = vpc
        self.instances = instances
        self.log_bucket = log_bucket
        self.log_group = log_group
        self.alarm_topic = alarm_topic

        # Add CloudFormation outputs for integration testing
        CfnOutput(
            self,
            "VpcId",
            value=vpc.vpc_id,
            description="VPC ID for the monitoring infrastructure",
            export_name=f"TAP-VPC-ID-{environment_suffix}",
        )

        CfnOutput(
            self,
            "S3BucketName",
            value=log_bucket.bucket_name,
            description="S3 bucket name for storing logs",
            export_name=f"TAP-S3-BUCKET-{environment_suffix}",
        )

        CfnOutput(
            self,
            "CloudWatchLogGroupName",
            value=log_group.log_group_name,
            description="CloudWatch log group name",
            export_name=f"TAP-CLOUDWATCH-LOG-GROUP-{environment_suffix}",
        )

        CfnOutput(
            self,
            "SNSTopicArn",
            value=alarm_topic.topic_arn,
            description="SNS topic ARN for alarms",
            export_name=f"TAP-SNS-TOPIC-ARN-{environment_suffix}",
        )

        CfnOutput(
            self,
            "SecurityGroupId",
            value=security_group.security_group_id,
            description="Security group ID for EC2 instances",
            export_name=f"TAP-SECURITY-GROUP-ID-{environment_suffix}",
        )

        # Output EC2 instance IDs as a comma-separated list
        instance_ids = [instance.instance_id for instance in instances]
        CfnOutput(
            self,
            "EC2InstanceIds",
            value=",".join(instance_ids),
            description="Comma-separated list of EC2 instance IDs",
            export_name=f"TAP-EC2-INSTANCE-IDS-{environment_suffix}",
        )

        CfnOutput(
            self,
            "InstanceCount",
            value=str(instance_count),
            description="Number of EC2 instances created",
            export_name=f"TAP-INSTANCE-COUNT-{environment_suffix}",
        )

    def create_vpc(self) -> ec2.Vpc:
        """Create VPC with public and private subnets"""
        # Allow customization of NAT gateway count based on account limits
        nat_gateway_count = int(self.node.try_get_context("natGatewayCount") or 1)
        max_azs = int(self.node.try_get_context("maxAzs") or 2)

        return ec2.Vpc(
            self,
            "TAP-MonitoringVPC",
            ip_addresses=ec2.IpAddresses.cidr("10.0.0.0/16"),
            max_azs=max_azs,  # Configurable AZ count
            nat_gateways=nat_gateway_count,  # Configurable NAT gateway count
            subnet_configuration=[
                ec2.SubnetConfiguration(name="Public", subnet_type=ec2.SubnetType.PUBLIC, cidr_mask=24),
                ec2.SubnetConfiguration(name="Private", subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS, cidr_mask=24),
            ],
        )

    def create_security_group(self, vpc: ec2.Vpc) -> ec2.SecurityGroup:
        """Create security group allowing HTTP traffic"""
        sg = ec2.SecurityGroup(
            self,
            "TAP-InstanceSecurityGroup",
            vpc=vpc,
            description="Security group for TAP monitored EC2 instances",
            allow_all_outbound=True,
        )

        # Allow HTTP traffic on port 80
        sg.add_ingress_rule(peer=ec2.Peer.any_ipv4(), connection=ec2.Port.tcp(80), description="Allow HTTP traffic")

        return sg

    def create_log_bucket(self, environment_suffix: str) -> s3.Bucket:
        """Create S3 bucket for storing logs"""
        return s3.Bucket(
            self,
            "TAP-EC2LogBucket",
            bucket_name=f"tap-ec2-monitoring-logs-{self.account}-{self.region}-{environment_suffix}",
            versioned=False,  # Keep costs low
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="DeleteOldLogs", expiration=Duration.days(30), enabled=True  # Auto-delete after 30 days
                )
            ],
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.DESTROY,  # For dev/test environments
            auto_delete_objects=True,  # Clean up on stack deletion
        )

    def create_log_group(self) -> logs.LogGroup:
        """Create CloudWatch Log Group"""
        return logs.LogGroup(
            self,
            "TAP-EC2LogGroup",
            log_group_name="/aws/ec2/tap-monitoring",
            retention=logs.RetentionDays.ONE_WEEK,  # Cost-effective retention
            removal_policy=RemovalPolicy.DESTROY,
        )

    def create_instance_role(self, log_bucket: s3.Bucket, log_group: logs.LogGroup) -> iam.Role:
        """Create IAM role for EC2 instances with monitoring permissions"""
        role = iam.Role(
            self,
            "TAP-EC2MonitoringRole",
            assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"),
            description="Role for TAP EC2 instances with CloudWatch monitoring",
        )

        # CloudWatch Agent permissions
        role.add_managed_policy(iam.ManagedPolicy.from_aws_managed_policy_name("CloudWatchAgentServerPolicy"))

        # SSM for managing CloudWatch Agent
        role.add_managed_policy(iam.ManagedPolicy.from_aws_managed_policy_name("AmazonSSMManagedInstanceCore"))

        # Custom policy for S3 log uploads
        role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=["s3:PutObject", "s3:PutObjectAcl", "s3:GetObject"],
                resources=[f"{log_bucket.bucket_arn}/*"],
            )
        )

        # CloudWatch Logs permissions
        role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=["logs:CreateLogStream", "logs:PutLogEvents", "logs:DescribeLogStreams"],
                resources=[log_group.log_group_arn],
            )
        )

        return role

    def create_alarm_topic(self) -> sns.Topic:
        """Create SNS topic for alarm notifications"""
        return sns.Topic(
            self, "TAP-AlarmTopic", display_name="TAP EC2 Monitoring Alarms", topic_name="tap-ec2-monitoring-alarms"
        )

    def create_monitored_instance(
        self, vpc: ec2.Vpc, security_group: ec2.SecurityGroup, instance_role: iam.Role, instance_config: dict
    ) -> ec2.Instance:
        """Create an EC2 instance with monitoring configuration"""

        # Extract configuration
        instance_type = instance_config["instance_type"]
        ami = instance_config["ami"]
        instance_index = instance_config["instance_index"]
        log_group = instance_config["log_group"]
        log_bucket = instance_config["log_bucket"]

        # User data script to install and configure CloudWatch agent
        user_data = ec2.UserData.for_linux()
        user_data.add_commands(
            # Update system
            "yum update -y",
            # Install CloudWatch agent
            "wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/"
            + "amazon-cloudwatch-agent.rpm",
            "rpm -U ./amazon-cloudwatch-agent.rpm",
            # Install collectd for additional metrics
            "yum install -y collectd",
            # Create CloudWatch agent configuration
            f"""cat > /opt/aws/amazon-cloudwatch-agent/etc/config.json << 'EOF'
{{
        "agent": {{
                "metrics_collection_interval": 60,
                "run_as_user": "cwagent",
                "region": "{self.region}",
                "logfile": "/opt/aws/amazon-cloudwatch-agent/logs/amazon-cloudwatch-agent.log"
        }},
        "metrics": {{
                "namespace": "TAP/EC2",
                "metrics_collected": {{
                        "cpu": {{
                                "measurement": [
                                        {{"name": "cpu_usage_idle", "rename": "CPU_IDLE", "unit": "Percent"}},
                                        {{"name": "cpu_usage_iowait", "rename": "CPU_IOWAIT", "unit": "Percent"}},
                                        "cpu_time_system",
                                        "cpu_time_user"
                                ],
                                "metrics_collection_interval": 60,
                                "drop_original_metrics": ["cpu_usage_guest"]
                        }},
                        "disk": {{
                                "measurement": [
                                        {{"name": "disk_used_percent", "rename": "DISK_USED", "unit": "Percent"}},
                                        "disk_free",
                                        "disk_used"
                                ],
                                "metrics_collection_interval": 60,
                                "resources": ["/", "/tmp"],
                                "drop_device": true
                        }},
                        "mem": {{
                                "measurement": [
                                        {{"name": "mem_used_percent", "rename": "MEM_USED", "unit": "Percent"}},
                                        "mem_available",
                                        "mem_used"
                                ],
                                "metrics_collection_interval": 60
                        }},
                        "net": {{
                                "measurement": [
                                        "bytes_sent",
                                        "bytes_recv",
                                        "drop_in",
                                        "drop_out"
                                ],
                                "metrics_collection_interval": 60
                        }},
                        "processes": {{
                                "measurement": [
                                        "running",
                                        "sleeping",
                                        "dead"
                                ],
                                "metrics_collection_interval": 60
                        }}
                }},
                "append_dimensions": {{
                        "InstanceId": "${{aws:InstanceId}}",
                        "InstanceType": "${{aws:InstanceType}}",
                        "AutoScalingGroupName": "${{aws:AutoScalingGroupName}}",
                        "ImageId": "${{aws:ImageId}}"
                }}
        }},
        "logs": {{
                "logs_collected": {{
                        "files": {{
                                "collect_list": [
                                        {{
                                                "file_path": "/var/log/messages",
                                                "log_group_name": "{log_group.log_group_name}",
                                                "log_stream_name": "instance-{instance_index}/messages",
                                                "timezone": "UTC"
                                        }},
                                        {{
                                                "file_path": "/var/log/secure",
                                                "log_group_name": "{log_group.log_group_name}",
                                                "log_stream_name": "instance-{instance_index}/secure",
                                                "timezone": "UTC"
                                        }}
                                ]
                        }}
                }},
                "log_stream_name": "instance-{instance_index}"
        }}
}}
EOF""",
            # Start CloudWatch agent
            (
                "/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl "
                "-a fetch-config -m ec2 -s -c file:/opt/aws/amazon-cloudwatch-agent/etc/config.json"
            ),
            # Setup log rotation and S3 sync
            f"""cat > /usr/local/bin/sync-logs-to-s3.sh << 'EOF'
#!/bin/bash
LOG_BUCKET="{log_bucket.bucket_name}"
INSTANCE_ID=$(ec2-metadata --instance-id | cut -d " " -f 2)
DATE=$(date +%Y-%m-%d)

# Sync logs to S3
aws s3 sync /var/log/ s3://${{LOG_BUCKET}}/ec2-logs/${{INSTANCE_ID}}/${{DATE}}/ \\
        --exclude "*" \\
        --include "*.log" \\
        --include "messages*" \\
        --include "secure*" \\
        --storage-class STANDARD_IA
EOF""",
            "chmod +x /usr/local/bin/sync-logs-to-s3.sh",
            # Add cron job for hourly S3 sync
            "echo '0 * * * * /usr/local/bin/sync-logs-to-s3.sh' | crontab -",
            # Install and start a simple web server for testing
            "yum install -y httpd",
            "systemctl start httpd",
            "systemctl enable httpd",
            f"echo '<h1>TAP Instance {instance_index}</h1>' > /var/www/html/index.html",
        )

        # Allow deployment to public subnets if no private subnets available (no NAT gateway)
        subnet_type = (
            ec2.SubnetType.PRIVATE_WITH_EGRESS
            if self.node.try_get_context("natGatewayCount") != "0"
            else ec2.SubnetType.PUBLIC
        )

        instance = ec2.Instance(
            self,
            f"TAP-MonitoredInstance{instance_index}",
            vpc=vpc,
            instance_type=instance_type,
            machine_image=ami,
            security_group=security_group,
            role=instance_role,
            user_data=user_data,
            vpc_subnets=ec2.SubnetSelection(subnet_type=subnet_type),
            detailed_monitoring=True,  # Enable detailed CloudWatch monitoring
            instance_name=f"tap-app-{instance_index}",
        )

        return instance

    def create_instance_alarms(self, instance: ec2.Instance, topic: sns.Topic, index: int):
        """Create CloudWatch alarms for the instance"""

        # Memory usage alarm
        memory_alarm = cloudwatch.Alarm(
            self,
            f"TAP-MemoryAlarm{index}",
            alarm_name=f"TAP-High-Memory-Instance-{index}",
            alarm_description=f"Alarm when memory usage exceeds 80% for TAP instance {index}",
            metric=cloudwatch.Metric(
                namespace="TAP/EC2",
                metric_name="MEM_USED",
                dimensions_map={"InstanceId": instance.instance_id},
                statistic="Average",
            ),
            threshold=80,
            evaluation_periods=2,
            datapoints_to_alarm=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            treat_missing_data=cloudwatch.TreatMissingData.BREACHING,
        )
        memory_alarm.add_alarm_action(cw_actions.SnsAction(topic))

        # CPU utilization alarm
        cpu_alarm = cloudwatch.Alarm(
            self,
            f"TAP-CPUAlarm{index}",
            alarm_name=f"TAP-High-CPU-Instance-{index}",
            alarm_description=f"Alarm when CPU usage exceeds 80% for TAP instance {index}",
            metric=cloudwatch.Metric(
                namespace="AWS/EC2",
                metric_name="CPUUtilization",
                dimensions_map={"InstanceId": instance.instance_id},
                statistic="Average",
            ),
            threshold=80,
            evaluation_periods=2,
            datapoints_to_alarm=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        )
        cpu_alarm.add_alarm_action(cw_actions.SnsAction(topic))

        # Disk usage alarm
        disk_alarm = cloudwatch.Alarm(
            self,
            f"TAP-DiskAlarm{index}",
            alarm_name=f"TAP-High-Disk-Instance-{index}",
            alarm_description=f"Alarm when disk usage exceeds 80% for TAP instance {index}",
            metric=cloudwatch.Metric(
                namespace="TAP/EC2",
                metric_name="DISK_USED",
                dimensions_map={"InstanceId": instance.instance_id},
                statistic="Average",
            ),
            threshold=80,
            evaluation_periods=1,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        )
        disk_alarm.add_alarm_action(cw_actions.SnsAction(topic))

        # Status check alarm
        status_alarm = cloudwatch.Alarm(
            self,
            f"TAP-StatusAlarm{index}",
            alarm_name=f"TAP-Status-Check-Failed-Instance-{index}",
            alarm_description=f"Alarm when status check fails for TAP instance {index}",
            metric=cloudwatch.Metric(
                namespace="AWS/EC2",
                metric_name="StatusCheckFailed",
                dimensions_map={"InstanceId": instance.instance_id},
                statistic="Maximum",
            ),
            threshold=1,
            evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        )
        status_alarm.add_alarm_action(cw_actions.SnsAction(topic))


class TapStack(cdk.Stack):
    """
    Represents the main CDK stack for the Tap project.

    This stack is responsible for orchestrating the instantiation of other resource-specific stacks.
    It determines the environment suffix from the provided properties,
        CDK context, or defaults to 'dev'.
    Note:
        - Do NOT create AWS resources directly in this stack.
        - Instead, instantiate separate stacks for each resource type within this stack.

    Args:
        scope (Construct): The parent construct.
        construct_id (str): The unique identifier for this stack.
        props (Optional[TapStackProps]): Optional properties for configuring the
            stack, including environment suffix.
        **kwargs: Additional keyword arguments passed to the CDK Stack.

    Attributes:
        environment_suffix (str): The environment suffix used for resource naming and configuration.
        ec2_monitoring_stack (NestedEC2MonitoringStack): The EC2 monitoring nested stack.
    """

    def __init__(self, scope: Construct, construct_id: str, props: Optional[TapStackProps] = None, **kwargs):
        super().__init__(scope, construct_id, **kwargs)

        # Get environment suffix from props, context, or use 'dev' as default
        environment_suffix = (
            (props.environment_suffix if props else None) or self.node.try_get_context("environmentSuffix") or "dev"
        )

        # Create separate stacks for each resource type
        # Create the EC2 monitoring stack as a nested stack

        # ! DO not create resources directly in this stack.
        # ! Instead, instantiate separate stacks for each resource type.

        # Create the EC2 monitoring nested stack
        self.ec2_monitoring_stack = NestedEC2MonitoringStack(
            self, f"EC2MonitoringStack-{environment_suffix}", environment_suffix=environment_suffix
        )

        # Make key resources available as properties of this stack
        self.vpc = self.ec2_monitoring_stack.vpc
        self.instances = self.ec2_monitoring_stack.instances
        self.log_bucket = self.ec2_monitoring_stack.log_bucket
        self.log_group = self.ec2_monitoring_stack.log_group
        self.alarm_topic = self.ec2_monitoring_stack.alarm_topic

        # Store environment suffix for access
        self.environment_suffix = environment_suffix

        # Add stack-level tags
        Tags.of(self).add("Environment", f"TAP-{environment_suffix}")
        Tags.of(self).add("ManagedBy", "CDK")
        Tags.of(self).add("Project", "TAP")

        # Add top-level CloudFormation outputs for integration testing
        CfnOutput(
            self,
            "TapStackVpcId",
            value=self.vpc.vpc_id,
            description="VPC ID for TAP monitoring infrastructure",
        )

        CfnOutput(
            self,
            "TapStackS3BucketName",
            value=self.log_bucket.bucket_name,
            description="S3 bucket name for TAP log storage",
        )

        CfnOutput(
            self,
            "TapStackCloudWatchLogGroupName",
            value=self.log_group.log_group_name,
            description="CloudWatch log group name for TAP monitoring",
        )

        CfnOutput(
            self,
            "TapStackSNSTopicArn",
            value=self.alarm_topic.topic_arn,
            description="SNS topic ARN for TAP monitoring alarms",
        )

        # Output instance information for integration testing
        instance_ids = [instance.instance_id for instance in self.instances]
        CfnOutput(
            self,
            "TapStackEC2InstanceIds",
            value=",".join(instance_ids),
            description="Comma-separated list of TAP EC2 instance IDs",
        )

        CfnOutput(
            self,
            "TapStackInstanceCount",
            value=str(len(self.instances)),
            description="Total number of TAP EC2 instances",
        )

        CfnOutput(
            self,
            "TapStackEnvironmentSuffix",
            value=environment_suffix,
            description="Environment suffix used for this TAP deployment",
        )

        # Example for future DynamoDB stack integration:
        # db_props = DynamoDBStackProps(
        #     environment_suffix=environment_suffix
        # )

        # dynamodb_stack = NestedDynamoDBStack(
        #     self,
        #     f"DynamoDBStack-{environment_suffix}",
        #     props=db_props
        # )

        # # Make the table available as a property of this stack
        # self.table = dynamodb_stack.table
```

## Configuration Options

The solution supports flexible configuration via CDK context parameters:

```bash
# Deploy with custom configuration
cdk deploy --context instanceCount=10 --context instanceSize=SMALL --context natGatewayCount=0
```

### Available Context Parameters

- `instanceCount` (default: 15) - Number of EC2 instances to create
- `instanceSize` (default: "MEDIUM") - EC2 instance size (SMALL, MEDIUM, LARGE, etc.)
- `natGatewayCount` (default: 1) - Number of NAT gateways (set to 0 for cost savings)
- `maxAzs` (default: 2) - Maximum number of Availability Zones to use
- `environmentSuffix` (default: "dev") - Environment identifier for resource naming

## CloudFormation Outputs

The stack exports the following outputs for integration and automation:

### Nested Stack Outputs

- `VpcId` - VPC ID for the monitoring infrastructure
- `S3BucketName` - S3 bucket name for storing logs
- `CloudWatchLogGroupName` - CloudWatch log group name
- `SNSTopicArn` - SNS topic ARN for alarms
- `SecurityGroupId` - Security group ID for EC2 instances
- `EC2InstanceIds` - Comma-separated list of instance IDs
- `InstanceCount` - Number of EC2 instances created

### Main Stack Outputs

- `TapStackVpcId` - VPC ID for TAP monitoring infrastructure
- `TapStackS3BucketName` - S3 bucket name for TAP log storage
- `TapStackCloudWatchLogGroupName` - CloudWatch log group name
- `TapStackSNSTopicArn` - SNS topic ARN for monitoring alarms
- `TapStackEC2InstanceIds` - Comma-separated list of instance IDs
- `TapStackInstanceCount` - Total number of EC2 instances
- `TapStackEnvironmentSuffix` - Environment suffix used
