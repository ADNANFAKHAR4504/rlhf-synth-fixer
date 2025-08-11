"""
Monitoring Infrastructure Component
Handles CloudWatch dashboards, alarms, and SNS notifications
"""

from typing import Optional
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions, Output
import json

class MonitoringInfrastructure(pulumi.ComponentResource):
  def __init__(self, 
               name: str,
               region: str,
               environment: str,
               tags: dict,
               opts: Optional[ResourceOptions] = None):
    super().__init__('nova:infrastructure:Monitoring', name, None, opts)

    self.region = region
    self.environment = environment
    self.tags = tags
    self.region_suffix = region.replace('-', '').replace('gov', '')

    self._create_sns_topic()
    self._create_cloudwatch_dashboard()
    
    # Register outputs
    self.register_outputs({
      'dashboard_name': self.dashboard.dashboard_name,
      'sns_topic_arn': self.sns_topic.arn
    })

  def _create_sns_topic(self):
    """Create SNS topic for alerts"""
    self.sns_topic = aws.sns.Topic(
      f"alerts-topic-{self.region_suffix}",
      name=f"nova-alerts-{self.region_suffix}",
      display_name=f"Nova Application Alerts - {self.region_suffix.title()}",
      tags=self.tags,
      opts=ResourceOptions(parent=self)
    )

    # SNS topic policy for CloudWatch alarms
    self.sns_topic_policy = aws.sns.TopicPolicy(
      f"alerts-topic-policy-{self.region_suffix}",
      arn=self.sns_topic.arn,
      policy=self.sns_topic.arn.apply(lambda topic_arn: json.dumps({
        "Version": "2012-10-17",
        "Statement": [
          {
            "Effect": "Allow",
            "Principal": {"Service": "cloudwatch.amazonaws.com"},
            "Action": [
              "SNS:Publish"
            ],
            "Resource": topic_arn,
            "Condition": {
              "StringEquals": {
                "aws:SourceAccount": aws.get_caller_identity().account_id
              }
            }
          }
        ]
      })),
      opts=ResourceOptions(parent=self)
    )

  def _create_cloudwatch_dashboard(self):
    """Create CloudWatch dashboard for monitoring"""
    self.dashboard = aws.cloudwatch.Dashboard(
      f"dashboard-{self.region_suffix}",
      dashboard_name=f"nova-dashboard-{self.region_suffix}",
      dashboard_body=json.dumps({
        "widgets": [
          {
            "type": "metric",
            "x": 0,
            "y": 0,
            "width": 12,
            "height": 6,
            "properties": {
              "metrics": [
                ["AWS/ElasticBeanstalk", "EnvironmentHealth", "EnvironmentName", f"nova-env-{self.region_suffix}"],
                [".", "ApplicationRequests2xx", ".", "."],
                [".", "ApplicationRequests4xx", ".", "."],
                [".", "ApplicationRequests5xx", ".", "."]
              ],
              "view": "timeSeries",
              "stacked": False,
              "region": self.region,
              "title": "Application Health Metrics",
              "period": 300,
              "stat": "Sum",
              "yAxis": {
                "left": {
                  "min": 0
                }
              }
            }
          },
          {
            "type": "metric",
            "x": 12,
            "y": 0,
            "width": 12,
            "height": 6,
            "properties": {
              "metrics": [
                ["AWS/ApplicationELB", "RequestCount", "LoadBalancer", f"app/awseb-AWSEB-{self.region_suffix}"],
                [".", "TargetResponseTime", ".", "."],
                [".", "HTTPCode_Target_2XX_Count", ".", "."],
                [".", "HTTPCode_Target_4XX_Count", ".", "."],
                [".", "HTTPCode_Target_5XX_Count", ".", "."]
              ],
              "view": "timeSeries",
              "stacked": False,
              "region": self.region,
              "title": "Load Balancer Metrics",
              "period": 300,
              "stat": "Sum"
            }
          },
          {
            "type": "metric",
            "x": 0,
            "y": 6,
            "width": 12,
            "height": 6,
            "properties": {
              "metrics": [
                ["AWS/EC2", "CPUUtilization", "AutoScalingGroupName", f"nova-env-{self.region_suffix}"]
              ],
              "view": "timeSeries",
              "stacked": False,
              "region": self.region,
              "title": "CPU Utilization",
              "period": 300,
              "stat": "Average",
              "yAxis": {
                "left": {
                  "min": 0,
                  "max": 100
                }
              }
            }
          },
          {
            "type": "metric",
            "x": 12,
            "y": 6,
            "width": 12,
            "height": 6,
            "properties": {
              "metrics": [
                ["AWS/AutoScaling", "GroupDesiredCapacity", "AutoScalingGroupName", f"nova-env-{self.region_suffix}"],
                [".", "GroupInServiceInstances", ".", "."],
                [".", "GroupTotalInstances", ".", "."]
              ],
              "view": "timeSeries",
              "stacked": False,
              "region": self.region,
              "title": "Auto Scaling Metrics",
              "period": 300,
              "stat": "Average"
            }
          },
          {
            "type": "log",
            "x": 0,
            "y": 12,
            "width": 24,
            "height": 6,
            "properties": {
              "query": f"SOURCE '/aws/elasticbeanstalk/nova-env-{self.region_suffix}/var/log/eb-docker/containers/eb-current-app'\n| fields @timestamp, @message\n| sort @timestamp desc\n| limit 100",
              "region": self.region,
              "title": "Application Logs",
              "view": "table"
            }
          }
        ]
      }),
      opts=ResourceOptions(parent=self)
    )

  def create_cpu_alarm(self, environment_name: Output[str], autoscaling_group_name: Output[str]):
    """Create CPU utilization alarm"""
    return aws.cloudwatch.MetricAlarm(
      f"cpu-high-alarm-{self.region_suffix}",
      alarm_name=f"nova-cpu-high-{self.region_suffix}",
      comparison_operator="GreaterThanThreshold",
      evaluation_periods=2,
      metric_name="CPUUtilization",
      namespace="AWS/EC2",
      period=300,
      statistic="Average",
      threshold=80,
      alarm_description=f"High CPU utilization in {self.region}",
      alarm_actions=[self.sns_topic.arn],
      ok_actions=[self.sns_topic.arn],
      dimensions={
        "AutoScalingGroupName": autoscaling_group_name
      },
      tags=self.tags,
      opts=ResourceOptions(parent=self)
    )

  def create_error_alarm(self, environment_name: Output[str]):
    """Create application error alarm"""
    return aws.cloudwatch.MetricAlarm(
      f"error-alarm-{self.region_suffix}",
      alarm_name=f"nova-5xx-errors-{self.region_suffix}",
      comparison_operator="GreaterThanThreshold",
      evaluation_periods=2,
      metric_name="ApplicationRequests5xx",
      namespace="AWS/ElasticBeanstalk",
      period=300,
      statistic="Sum",
      threshold=10,
      alarm_description=f"High number of 5xx errors in {self.region}",
      alarm_actions=[self.sns_topic.arn],
      ok_actions=[self.sns_topic.arn],
      dimensions={
        "EnvironmentName": environment_name
      },
      tags=self.tags,
      opts=ResourceOptions(parent=self)
    )

  def create_health_alarm(self, environment_name: Output[str]):
    """Create environment health alarm"""
    return aws.cloudwatch.MetricAlarm(
      f"health-alarm-{self.region_suffix}",
      alarm_name=f"nova-env-health-{self.region_suffix}",
      comparison_operator="LessThanThreshold",
      evaluation_periods=2,
      metric_name="EnvironmentHealth",
      namespace="AWS/ElasticBeanstalk",
      period=300,
      statistic="Average",
      threshold=15,  # Below "Ok" health status
      alarm_description=f"Environment health degraded in {self.region}",
      alarm_actions=[self.sns_topic.arn],
      ok_actions=[self.sns_topic.arn],
      dimensions={
        "EnvironmentName": environment_name
      },
      tags=self.tags,
      opts=ResourceOptions(parent=self)
    )

  def create_response_time_alarm(self, load_balancer_full_name: Output[str]):
    """Create response time alarm for ALB"""
    return aws.cloudwatch.MetricAlarm(
      f"response-time-alarm-{self.region_suffix}",
      alarm_name=f"nova-response-time-{self.region_suffix}",
      comparison_operator="GreaterThanThreshold",
      evaluation_periods=2,
      metric_name="TargetResponseTime",
      namespace="AWS/ApplicationELB",
      period=300,
      statistic="Average",
      threshold=5.0,  # 5 seconds
      alarm_description=f"High response time in {self.region}",
      alarm_actions=[self.sns_topic.arn],
      ok_actions=[self.sns_topic.arn],
      dimensions={
        "LoadBalancer": load_balancer_full_name
      },
      tags=self.tags,
      opts=ResourceOptions(parent=self)
    )

  # Properties for easy access
  @property
  def dashboard_name(self):
    return self.dashboard.dashboard_name

  @property
  def sns_topic_arn(self):
    return self.sns_topic.arn