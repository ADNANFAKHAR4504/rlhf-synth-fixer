import os
import json
import pulumi
import pulumi_aws as aws


class MonitoringComponent(pulumi.ComponentResource):
    def __init__(
            self,
            name: str,
            instances: list,
            tags: dict,
            notification_email: str,
            opts=None):
        super().__init__("custom:aws:Monitoring", name, None, opts)

        # Check if running in LocalStack by reading metadata.json
        is_localstack = False
        try:
            metadata_path = os.path.join(os.getcwd(), 'metadata.json')
            if os.path.exists(metadata_path):
                with open(metadata_path, 'r', encoding='utf-8') as f:
                    metadata = json.load(f)
                    is_localstack = metadata.get('provider', '').lower() == 'localstack'
            else:
                # If metadata.json doesn't exist, check environment variable
                is_localstack = os.getenv('PROVIDER', '').lower() == 'localstack'
        except Exception:
            # If we can't read metadata, check environment variable as fallback
            is_localstack = os.getenv('PROVIDER', '').lower() == 'localstack'

        # 1. Create SNS Topic
        self.sns_topic = aws.sns.Topic(
            f"{name}-sns-topic",
            display_name=f"{name}-alerts",
            tags={**tags, "Name": f"{name}-sns-topic"},
            opts=pulumi.ResourceOptions(parent=self),
        )

        # 2. Create SNS Subscription (skip email for LocalStack - not supported)
        # LocalStack doesn't support email subscriptions as they require confirmation
        if not is_localstack:
            self.sns_subscription = aws.sns.TopicSubscription(
                f"{name}-sns-subscription",
                topic=self.sns_topic.arn,
                protocol="email",
                endpoint=notification_email,
                opts=pulumi.ResourceOptions(parent=self),
            )
        else:
            # For LocalStack, create a dummy subscription or skip
            self.sns_subscription = None
            pulumi.log.info(
                "Skipping SNS email subscription in LocalStack (not supported)",
                resource=self
            )

        # 3. Create alarms for each instance
        self.alarms = []
        for instance in instances:
            # CPU Utilization Alarm
            cpu_alarm = aws.cloudwatch.MetricAlarm(
                f"{name}-{instance._name}-cpu-alarm",
                comparison_operator="GreaterThanThreshold",
                evaluation_periods=2,
                metric_name="CPUUtilization",
                namespace="AWS/EC2",
                period=300,  # 5 minutes
                statistic="Average",
                threshold=80,  # Alarm if CPU > 80%
                alarm_description=f"Alarm if {instance._name} CPU > 80%",
                dimensions={"InstanceId": instance.id},
                alarm_actions=[self.sns_topic.arn],
                tags={**tags, "Name": f"{instance._name}-cpu-alarm"},
                opts=pulumi.ResourceOptions(parent=self),
            )

            # Status Check Alarm
            status_alarm = aws.cloudwatch.MetricAlarm(
                f"{name}-{instance._name}-status-alarm",
                comparison_operator="GreaterThanThreshold",
                evaluation_periods=1,
                metric_name="StatusCheckFailed",
                namespace="AWS/EC2",
                period=60,
                statistic="Minimum",
                threshold=1,
                alarm_description=f"Alarm if {instance._name} instance/system check fails",
                dimensions={"InstanceId": instance.id},
                alarm_actions=[self.sns_topic.arn],
                tags={**tags, "Name": f"{instance._name}-status-alarm"},
                opts=pulumi.ResourceOptions(parent=self),
            )

            self.alarms.extend([cpu_alarm, status_alarm])

        self.register_outputs(
            {
                "sns_topic": self.sns_topic.arn,
                "alarms": [alarm.name for alarm in self.alarms],
            }
        )
