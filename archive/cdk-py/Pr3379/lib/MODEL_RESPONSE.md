### Reasoning Trace

---

The user wants a comprehensive AWS CDK application in Python for monitoring EC2 instances. Let me break down the requirements:

1. 15 EC2 t3.medium instances in a VPC (10.0.0.0/16)
2. Security Groups allowing HTTP traffic on port 80
3. CloudWatch alarms for memory usage above 80%
4. Basic performance monitoring
5. Logs sent to both S3 and CloudWatch Logs
6. IAM roles and policies for secure monitoring
7. Simple, cost-effective, and error-free deployment

I'll need to create:

- VPC with subnets
- Security Group
- IAM role for EC2 instances
- CloudWatch Log Group
- S3 bucket for logs
- EC2 instances with CloudWatch agent
- CloudWatch alarms
- User data script to install and configure CloudWatch agent

Let me structure this as a complete CDK application with proper organization.

### Answer

---

I'll help you create a comprehensive AWS CDK application in Python for EC2 monitoring. This solution will be modular, cost-effective, and production-ready.

## Project Structure

```
ec2-monitoring-stack/
├── app.py
├── cdk.json
├── requirements.txt
├── ec2_monitoring/
│   ├── __init__.py
│   ├── ec2_monitoring_stack.py
│   └── user_data/
│       └── cloudwatch_config.json
└── README.md
```

## 1. Requirements File

**`requirements.txt`**

```python
aws-cdk-lib>=2.100.0
constructs>=10.0.0
```

## 2. Main CDK Application

**`app.py`**

```python
#!/usr/bin/env python3
import os
import aws_cdk as cdk
from ec2_monitoring.ec2_monitoring_stack import EC2MonitoringStack

app = cdk.App()

# Environment configuration
env = cdk.Environment(
    account=os.getenv('CDK_DEFAULT_ACCOUNT'),
    region=os.getenv('CDK_DEFAULT_REGION', 'us-east-1')
)

# Deploy the monitoring stack
EC2MonitoringStack(
    app,
    "EC2MonitoringStack",
    env=env,
    description="EC2 monitoring infrastructure for SaaS startup"
)

app.synth()
```

## 3. Main Stack Implementation

**`ec2_monitoring/ec2_monitoring_stack.py`**

```python
import json
from aws_cdk import (
    Stack,
    Duration,
    RemovalPolicy,
    aws_ec2 as ec2,
    aws_iam as iam,
    aws_s3 as s3,
    aws_logs as logs,
    aws_cloudwatch as cloudwatch,
    aws_cloudwatch_actions as cw_actions,
    aws_sns as sns,
    Tags
)
from constructs import Construct

class EC2MonitoringStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Configuration parameters
        instance_count = 15
        instance_type = ec2.InstanceType.of(
            ec2.InstanceClass.T3,
            ec2.InstanceSize.MEDIUM
        )

        # Create VPC with specified CIDR
        vpc = self.create_vpc()

        # Create Security Group
        security_group = self.create_security_group(vpc)

        # Create S3 bucket for logs
        log_bucket = self.create_log_bucket()

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
                instance_type=instance_type,
                ami=ami,
                instance_index=i,
                log_group=log_group,
                log_bucket=log_bucket
            )
            instances.append(instance)

            # Create alarms for each instance
            self.create_instance_alarms(instance, alarm_topic, i)

        # Add cost-saving tags
        Tags.of(self).add("Environment", "Production")
        Tags.of(self).add("ManagedBy", "CDK")
        Tags.of(self).add("Project", "SaaSMonitoring")

    def create_vpc(self) -> ec2.Vpc:
        """Create VPC with public and private subnets"""
        return ec2.Vpc(
            self, "MonitoringVPC",
            ip_addresses=ec2.IpAddresses.cidr("10.0.0.0/16"),
            max_azs=2,  # Use 2 AZs for cost-effectiveness
            nat_gateways=1,  # Single NAT gateway to reduce costs
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name="Public",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name="Private",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24
                )
            ]
        )

    def create_security_group(self, vpc: ec2.Vpc) -> ec2.SecurityGroup:
        """Create security group allowing HTTP traffic"""
        sg = ec2.SecurityGroup(
            self, "InstanceSecurityGroup",
            vpc=vpc,
            description="Security group for monitored EC2 instances",
            allow_all_outbound=True
        )

        # Allow HTTP traffic on port 80
        sg.add_ingress_rule(
            peer=ec2.Peer.any_ipv4(),
            connection=ec2.Port.tcp(80),
            description="Allow HTTP traffic"
        )

        return sg

    def create_log_bucket(self) -> s3.Bucket:
        """Create S3 bucket for storing logs"""
        return s3.Bucket(
            self, "EC2LogBucket",
            bucket_name=f"ec2-monitoring-logs-{self.account}-{self.region}",
            versioned=False,  # Keep costs low
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="DeleteOldLogs",
                    expiration=Duration.days(30),  # Auto-delete after 30 days
                    enabled=True
                )
            ],
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.DESTROY,  # For dev/test environments
            auto_delete_objects=True  # Clean up on stack deletion
        )

    def create_log_group(self) -> logs.LogGroup:
        """Create CloudWatch Log Group"""
        return logs.LogGroup(
            self, "EC2LogGroup",
            log_group_name="/aws/ec2/monitoring",
            retention=logs.RetentionDays.ONE_WEEK,  # Cost-effective retention
            removal_policy=RemovalPolicy.DESTROY
        )

    def create_instance_role(self, log_bucket: s3.Bucket, log_group: logs.LogGroup) -> iam.Role:
        """Create IAM role for EC2 instances with monitoring permissions"""
        role = iam.Role(
            self, "EC2MonitoringRole",
            assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"),
            description="Role for EC2 instances with CloudWatch monitoring"
        )

        # CloudWatch Agent permissions
        role.add_managed_policy(
            iam.ManagedPolicy.from_aws_managed_policy_name("CloudWatchAgentServerPolicy")
        )

        # SSM for managing CloudWatch Agent
        role.add_managed_policy(
            iam.ManagedPolicy.from_aws_managed_policy_name("AmazonSSMManagedInstanceCore")
        )

        # Custom policy for S3 log uploads
        role.add_to_policy(iam.PolicyStatement(
            effect=iam.Effect.ALLOW,
            actions=[
                "s3:PutObject",
                "s3:PutObjectAcl",
                "s3:GetObject"
            ],
            resources=[f"{log_bucket.bucket_arn}/*"]
        ))

        # CloudWatch Logs permissions
        role.add_to_policy(iam.PolicyStatement(
            effect=iam.Effect.ALLOW,
            actions=[
                "logs:CreateLogStream",
                "logs:PutLogEvents",
                "logs:DescribeLogStreams"
            ],
            resources=[log_group.log_group_arn]
        ))

        return role

    def create_alarm_topic(self) -> sns.Topic:
        """Create SNS topic for alarm notifications"""
        return sns.Topic(
            self, "AlarmTopic",
            display_name="EC2 Monitoring Alarms",
            topic_name="ec2-monitoring-alarms"
        )

    def create_monitored_instance(
        self,
        vpc: ec2.Vpc,
        security_group: ec2.SecurityGroup,
        instance_role: iam.Role,
        instance_type: ec2.InstanceType,
        ami: ec2.IMachineImage,
        instance_index: int,
        log_group: logs.LogGroup,
        log_bucket: s3.Bucket
    ) -> ec2.Instance:
        """Create an EC2 instance with monitoring configuration"""

        # User data script to install and configure CloudWatch agent
        user_data = ec2.UserData.for_linux()
        user_data.add_commands(
            # Update system
            "yum update -y",

            # Install CloudWatch agent
            "wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm",
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
        "namespace": "SaaS/EC2",
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
            "/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c file:/opt/aws/amazon-cloudwatch-agent/etc/config.json",

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
            f"echo '<h1>Instance {instance_index}</h1>' > /var/www/html/index.html"
        )

        instance = ec2.Instance(
            self, f"MonitoredInstance{instance_index}",
            vpc=vpc,
            instance_type=instance_type,
            machine_image=ami,
            security_group=security_group,
            role=instance_role,
            user_data=user_data,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ),
            detailed_monitoring=True,  # Enable detailed CloudWatch monitoring
            instance_name=f"saas-app-{instance_index}"
        )

        return instance

    def create_instance_alarms(self, instance: ec2.Instance, topic: sns.Topic, index: int):
        """Create CloudWatch alarms for the instance"""

        # Memory usage alarm
        memory_alarm = cloudwatch.Alarm(
            self, f"MemoryAlarm{index}",
            alarm_name=f"High-Memory-Instance-{index}",
            alarm_description=f"Alarm when memory usage exceeds 80% for instance {index}",
            metric=cloudwatch.Metric(
                namespace="SaaS/EC2",
                metric_name="MEM_USED",
                dimensions_map={
                    "InstanceId": instance.instance_id
                },
                statistic="Average"
            ),
            threshold=80,
            evaluation_periods=2,
            datapoints_to_alarm=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            treat_missing_data=cloudwatch.TreatMissingData.BREACHING
        )
        memory_alarm.add_alarm_action(cw_actions.SnsAction(topic))

        # CPU utilization alarm
        cpu_alarm = cloudwatch.Alarm(
            self, f"CPUAlarm{index}",
            alarm_name=f"High-CPU-Instance-{index}",
            alarm_description=f"Alarm when CPU usage exceeds 80% for instance {index}",
            metric=cloudwatch.Metric(
                namespace="AWS/EC2",
                metric_name="CPUUtilization",
                dimensions_map={
                    "InstanceId": instance.instance_id
                },
                statistic="Average"
            ),
            threshold=80,
            evaluation_periods=2,
            datapoints_to_alarm=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD
        )
        cpu_alarm.add_alarm_action(cw_actions.SnsAction(topic))

        # Disk usage alarm
        disk_alarm = cloudwatch.Alarm(
            self, f"DiskAlarm{index}",
            alarm_name=f"High-Disk-Instance-{index}",
            alarm_description=f"Alarm when disk usage exceeds 80% for instance {index}",
            metric=cloudwatch.Metric(
                namespace="SaaS/EC2",
                metric_name="DISK_USED",
                dimensions_map={
                    "InstanceId": instance.instance_id
                },
                statistic="Average"
            ),
            threshold=80,
            evaluation_periods=1,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD
        )
        disk_alarm.add_alarm_action(cw_actions.SnsAction(topic))

        # Status check alarm
        status_alarm = cloudwatch.Alarm(
            self, f"StatusAlarm{index}",
            alarm_name=f"Status-Check-Failed-Instance-{index}",
            alarm_description=f"Alarm when status check fails for instance {index}",
            metric=cloudwatch.Metric(
                namespace="AWS/EC2",
                metric_name="StatusCheckFailed",
                dimensions_map={
                    "InstanceId": instance.instance_id
                },
                statistic="Maximum"
            ),
            threshold=1,
            evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD
        )
        status_alarm.add_alarm_action(cw_actions.SnsAction(topic))
```

## 4. CDK Configuration

**`cdk.json`**

```json
{
  "app": "python3 app.py",
  "watch": {
    "include": ["**"],
    "exclude": [
      "README.md",
      "cdk*.json",
      "requirements*.txt",
      "source.bat",
      "**/__init__.py",
      "python/__pycache__",
      "tests"
    ]
  },
  "context": {
    "@aws-cdk/aws-apigateway:usagePlanKeyOrderInsensitiveId": true,
    "@aws-cdk/core:stackRelativeExports": true,
    "@aws-cdk/aws-rds:lowercaseDbIdentifier": true,
    "@aws-cdk/aws-lambda:recognizeVersionProps": true,
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
    "@aws-cdk/aws-cloudfront:defaultSecurityPolicyTLSv1.2_2021": true,
    "@aws-cdk-containers/ecs-service-extensions:enableDefaultLogDriver": true,
    "@aws-cdk/aws-ec2:uniqueImdsv2TemplateName": true,
    "@aws-cdk/core:checkSecretUsage": true,
    "@aws-cdk/aws-iam:minimizePolicies": true,
    "@aws-cdk/aws-ecs:arnFormatIncludesClusterName": true,
    "@aws-cdk/core:validateSnapshotRemovalPolicy": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeyAliasStackSafeResourceName": true,
    "@aws-cdk/aws-s3:createDefaultLoggingPolicy": true,
    "@aws-cdk/aws-sns-subscriptions:restrictSqsDescryption": true,
    "@aws-cdk/aws-apigateway:disableCloudWatchRole": true,
    "@aws-cdk/core:enablePartitionLiterals": true,
    "@aws-cdk/core:target-partitions": ["aws", "aws-cn"]
  }
}
```

## 5. CloudWatch Dashboard (Optional Enhancement)

**`ec2_monitoring/dashboard_construct.py`**

```python
from aws_cdk import (
    aws_cloudwatch as cloudwatch,
)
from constructs import Construct

class MonitoringDashboard(Construct):
    def __init__(self, scope: Construct, id: str, instances: list, **kwargs):
        super().__init__(scope, id)

        dashboard = cloudwatch.Dashboard(
            self, "EC2MonitoringDashboard",
            dashboard_name="EC2-SaaS-Monitoring",
            period_override=cloudwatch.PeriodOverride.AUTO
        )

        # CPU Utilization widget
        cpu_widget = cloudwatch.GraphWidget(
            title="CPU Utilization",
            left=[
                cloudwatch.Metric(
                    namespace="AWS/EC2",
                    metric_name="CPUUtilization",
                    dimensions_map={"InstanceId": instance.instance_id},
                    label=f"Instance {i}"
                ) for i, instance in enumerate(instances)
            ],
            width=12,
            height=6
        )

        # Memory Usage widget
        memory_widget = cloudwatch.GraphWidget(
            title="Memory Usage %",
            left=[
                cloudwatch.Metric(
                    namespace="SaaS/EC2",
                    metric_name="MEM_USED",
                    dimensions_map={"InstanceId": instance.instance_id},
                    label=f"Instance {i}"
                ) for i, instance in enumerate(instances)
            ],
            width=12,
            height=6
        )

        # Network Traffic widget
        network_widget = cloudwatch.GraphWidget(
            title="Network Traffic",
            left=[
                cloudwatch.Metric(
                    namespace="AWS/EC2",
                    metric_name="NetworkIn",
                    dimensions_map={"InstanceId": instances[0].instance_id},
                    statistic="Sum"
                )
            ],
            right=[
                cloudwatch.Metric(
                    namespace="AWS/EC2",
                    metric_name="NetworkOut",
                    dimensions_map={"InstanceId": instances[0].instance_id},
                    statistic="Sum"
                )
            ],
            width=12,
            height=6
        )

        dashboard.add_widgets(cpu_widget, memory_widget)
        dashboard.add_widgets(network_widget)
```

## 6. Deployment Instructions

**`README.md`**

````markdown
# EC2 Monitoring Stack

## Prerequisites

- Python 3.8+
- AWS CLI configured
- AWS CDK CLI installed (`npm install -g aws-cdk`)

## Setup

1. Create virtual environment:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```
````

2. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

3. Bootstrap CDK (first time only):
   ```bash
   cdk bootstrap
   ```

## Deployment

```bash
cdk deploy
```

## Configuration

- Edit `ec2_monitoring_stack.py` to adjust instance count, types, or monitoring thresholds
- SNS topic subscriptions can be added for email/SMS alerts

## Cost Optimization

- Uses single NAT gateway
- Implements S3 lifecycle policies
- CloudWatch Logs retention set to 7 days
- Detailed monitoring enabled only where necessary

## Cleanup

```bash
cdk destroy
```

````

## Key Features Explained

### 1. **Cost Optimization**
- Single NAT gateway instead of one per AZ
- S3 lifecycle rules to delete old logs
- CloudWatch Logs retention limited to 7 days
- Using STANDARD_IA storage class for S3 logs

### 2. **Security**
- EC2 instances in private subnets
- Least privilege IAM roles
- Security group restricts traffic to port 80 only
- S3 bucket with encryption and blocked public access

### 3. **Monitoring Coverage**
- CPU, Memory, Disk, and Network metrics
- Custom namespace for easy metric organization
- Automatic log collection from system logs
- Dual logging to CloudWatch and S3

### 4. **Reliability**
- Status check alarms for instance health
- Missing data treated as breaching for critical alarms
- Multi-evaluation periods to reduce false positives

## Deployment Steps

```bash
# 1. Initialize project
mkdir ec2-monitoring-stack && cd ec2-monitoring-stack
python -m venv .venv
source .venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure AWS credentials
export AWS_PROFILE=your-profile  # Optional

# 4. Deploy
cdk synth  # Verify CloudFormation template
cdk deploy --require-approval never  # Deploy stack

# 5. Subscribe to SNS topic for alerts (post-deployment)
aws sns subscribe --topic-arn <topic-arn> --protocol email --notification-endpoint your-email@example.com
````

This solution provides comprehensive monitoring while keeping costs low through strategic resource allocation and retention policies. The modular design allows easy customization for specific requirements.
