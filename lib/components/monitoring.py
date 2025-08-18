import json

import pulumi
import pulumi_aws as aws
from pulumi import ComponentResource, ResourceOptions
from ..config import InfrastructureConfig, ComponentDependencies


class MonitoringComponent(ComponentResource):
  def __init__(self, name: str, config: InfrastructureConfig,
               dependencies: ComponentDependencies, opts: ResourceOptions = None):
    super().__init__('custom:monitoring:MonitoringComponent', name, None, opts)

    # Create CloudWatch Log Groups
    self._create_log_groups(name, config)

    # Create SNS topics for notifications
    self._create_notification_system(name, config)

    # Create CloudWatch Alarms
    self._create_alarms(name, config, dependencies.alb_arn)

    # Create AWS Budgets
    self._create_budget_alerts(name, config)

    # Create CloudWatch Dashboard
    self._create_dashboard(name, config)

    self.register_outputs({
      "log_group_name": self.app_log_group.name,
      "alert_topic_arn": self.alert_topic.arn
    })

  def _create_log_groups(self, name: str, config: InfrastructureConfig):
    # Application log group
    self.app_log_group = aws.cloudwatch.LogGroup(
      f"{name}-app-logs",
      name=f"/aws/ec2/{config.app_name}-{config.environment}",
      retention_in_days=config.monitoring.log_retention_days,
      tags={
        **config.tags,
        "Name": f"{config.app_name}-{config.environment}-app-logs"
      },
      opts=ResourceOptions(parent=self)
    )

    # ALB log group
    self.alb_log_group = aws.cloudwatch.LogGroup(
      f"{name}-alb-logs",
      name=f"/aws/elasticloadbalancing/{config.app_name}-{config.environment}",
      retention_in_days=config.monitoring.log_retention_days // 3,
      tags={
        **config.tags,
        "Name": f"{config.app_name}-{config.environment}-alb-logs"
      },
      opts=ResourceOptions(parent=self)
    )

    # Lambda log group
    self.lambda_log_group = aws.cloudwatch.LogGroup(
      f"{name}-lambda-logs",
      name=f"/aws/lambda/{config.app_name}-{config.environment}",
      retention_in_days=7,
      tags={
        "Name": f"{config.app_name}-{config.environment}-lambda-logs",
        **config.tags
      },
      opts=ResourceOptions(parent=self)
    )

  def _create_notification_system(self, name: str, config: InfrastructureConfig):
    # SNS topic for alerts
    self.alert_topic = aws.sns.Topic(
      f"{name}-alerts",
      name=f"{config.app_name}-{config.environment}-alerts",
      tags={
        "Name": f"{config.app_name}-{config.environment}-alerts",
        **config.tags
      },
      opts=ResourceOptions(parent=self)
    )

    # SNS topic policy
    aws.sns.TopicPolicy(
      f"{name}-alert-topic-policy",
      arn=self.alert_topic.arn,
      policy=self.alert_topic.arn.apply(lambda arn: json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
          "Effect": "Allow",
          "Principal": {"Service": "cloudwatch.amazonaws.com"},
          "Action": "SNS:Publish",
          "Resource": arn
        }]
      })),
      opts=ResourceOptions(parent=self)
    )

  def _create_alarms(self, name: str, config: InfrastructureConfig, alb_arn: pulumi.Output):
    # ALB target response time alarm
    aws.cloudwatch.MetricAlarm(
      f"{name}-alb-response-time",
      comparison_operator="GreaterThanThreshold",
      evaluation_periods=2,
      metric_name="TargetResponseTime",
      namespace="AWS/ApplicationELB",
      period=300,
      statistic="Average",
      threshold=1.0,
      alarm_description="ALB target response time too high",
      alarm_actions=[self.alert_topic.arn],
      dimensions=alb_arn.apply(lambda arn: {
        "LoadBalancer": arn.split("/", 1)[1]
      }),
      tags={
        **config.tags
      },
      opts=ResourceOptions(parent=self)
    )

    # ALB 5XX error rate alarm
    aws.cloudwatch.MetricAlarm(
      f"{name}-alb-5xx-errors",
      comparison_operator="GreaterThanThreshold",
      evaluation_periods=2,
      metric_name="HTTPCode_Target_5XX_Count",
      namespace="AWS/ApplicationELB",
      period=300,
      statistic="Sum",
      threshold=10,
      alarm_description="High 5XX error rate",
      alarm_actions=[self.alert_topic.arn],
      dimensions=alb_arn.apply(lambda arn: {
        "LoadBalancer": arn.split("/", 1)[1]
      }),
      tags={
        **config.tags
      },
      opts=ResourceOptions(parent=self)
    )

    # RDS CPU utilization alarm
    aws.cloudwatch.MetricAlarm(
      f"{name}-rds-cpu",
      comparison_operator="GreaterThanThreshold",
      evaluation_periods=2,
      metric_name="CPUUtilization",
      namespace="AWS/RDS",
      period=300,
      statistic="Average",
      threshold=80,
      alarm_description="RDS CPU utilization too high",
      alarm_actions=[self.alert_topic.arn],
      dimensions={
        "DBInstanceIdentifier": f"{config.app_name}-{config.environment}-db"
      },
      tags={
        **config.tags
      },
      opts=ResourceOptions(parent=self)
    )

    # RDS connection count alarm
    aws.cloudwatch.MetricAlarm(
      f"{name}-rds-connections",
      comparison_operator="GreaterThanThreshold",
      evaluation_periods=2,
      metric_name="DatabaseConnections",
      namespace="AWS/RDS",
      period=300,
      statistic="Average",
      threshold=50,
      alarm_description="Too many database connections",
      alarm_actions=[self.alert_topic.arn],
      dimensions={
        "DBInstanceIdentifier": f"{config.app_name}-{config.environment}-db"
      },
      tags={
        **config.tags
      },
      opts=ResourceOptions(parent=self)
    )

  def _create_budget_alerts(self, name: str, config: InfrastructureConfig):
    # Cost budget
    budget_limit = config.monitoring.budget_limit_usd

    self.cost_budget = aws.budgets.Budget(
      f"{name}-cost-budget",
      budget_type="COST",
      limit_amount=str(budget_limit),
      limit_unit="USD",
      time_unit="MONTHLY",
      cost_filters=[aws.budgets.BudgetCostFilterArgs(
        name="TagKeyValue",
        values=[f"Environment${config.environment}"]
      )],
      notifications=[
        {
          "comparison_operator": "GREATER_THAN",
          "threshold": 80,
          "threshold_type": "PERCENTAGE",
          "notification_type": "ACTUAL",
          "subscriber_email_addresses": ["admin@example.com"]
        },
        {
          "comparison_operator": "GREATER_THAN",
          "threshold": 100,
          "threshold_type": "PERCENTAGE",
          "notification_type": "FORECASTED",
          "subscriber_email_addresses": ["admin@example.com"]
        }
      ],
      opts=ResourceOptions(parent=self)
    )

  def _create_dashboard(self, name: str, config: InfrastructureConfig):
    # CloudWatch Dashboard
    dashboard_body = json.dumps({
      "widgets": [
        {
          "type": "metric",
          "x": 0, "y": 0,
          "width": 12, "height": 6,
          "properties": {
            "metrics": [
              ["AWS/ApplicationELB", "RequestCount"],
              [".", "TargetResponseTime"],
              [".", "HTTPCode_Target_2XX_Count"],
              [".", "HTTPCode_Target_4XX_Count"],
              [".", "HTTPCode_Target_5XX_Count"]
            ],
            "period": 300,
            "stat": "Sum",
            "region": aws.get_region().name,
            "title": "ALB Metrics"
          }
        },
        {
          "type": "metric",
          "x": 12, "y": 0,
          "width": 12, "height": 6,
          "properties": {
            "metrics": [
              ["AWS/EC2", "CPUUtilization"],
              [".", "NetworkIn"],
              [".", "NetworkOut"]
            ],
            "period": 300,
            "stat": "Average",
            "region": aws.get_region().name,
            "title": "EC2 Metrics"
          }
        },
        {
          "type": "metric",
          "x": 0, "y": 6,
          "width": 12, "height": 6,
          "properties": {
            "metrics": [
              ["AWS/RDS", "CPUUtilization"],
              [".", "DatabaseConnections"],
              [".", "ReadLatency"],
              [".", "WriteLatency"]
            ],
            "period": 300,
            "stat": "Average",
            "region": aws.get_region().name,
            "title": "RDS Metrics"
          }
        }
      ]
    })

    self.dashboard = aws.cloudwatch.Dashboard(
      f"{name}-dashboard",
      dashboard_name=f"{config.app_name}-{config.environment}-dashboard",
      dashboard_body=dashboard_body,
      opts=ResourceOptions(parent=self)
    )
