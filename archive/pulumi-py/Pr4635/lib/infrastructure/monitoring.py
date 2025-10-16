"""
CloudWatch monitoring, alarms, and logging configuration.

This module creates CloudWatch resources with proper alarm thresholds
and non-hardcoded regions.
"""

from typing import Dict, Optional

import pulumi
import pulumi_aws as aws
from pulumi import Output

from .config import Config


class MonitoringStack:
    """
    Configures CloudWatch monitoring, alarms, and dashboards.
    
    Addresses CloudWatch configuration issues from model failures.
    """
    
    def __init__(self, config: Config, sns_topic_arn: Output[str]):
        """
        Initialize monitoring stack.
        
        Args:
            config: Configuration object
            sns_topic_arn: SNS topic ARN for alarm notifications
        """
        self.config = config
        self.sns_topic_arn = sns_topic_arn
        self.log_groups: Dict[str, aws.cloudwatch.LogGroup] = {}
        self.alarms: Dict[str, aws.cloudwatch.MetricAlarm] = {}
        
        # Create log groups
        self._create_log_groups()
    
    def _create_log_groups(self):
        """Create CloudWatch log groups with encryption and retention."""
        # Log group for rollback Lambda
        self.log_groups['rollback'] = aws.cloudwatch.LogGroup(
            'rollback-lambda-logs',
            name=f"/aws/lambda/{self.config.get_resource_name('rollback-handler')}",
            retention_in_days=self.config.log_retention_days,
            tags=self.config.get_tags({'Purpose': 'RollbackLogs'})
        )
        
        # Log group for monitoring Lambda
        self.log_groups['monitoring'] = aws.cloudwatch.LogGroup(
            'monitoring-lambda-logs',
            name=f"/aws/lambda/{self.config.get_resource_name('health-monitor')}",
            retention_in_days=self.config.log_retention_days,
            tags=self.config.get_tags({'Purpose': 'MonitoringLogs'})
        )
        
        # Log group for cleanup Lambda
        self.log_groups['cleanup'] = aws.cloudwatch.LogGroup(
            'cleanup-lambda-logs',
            name=f"/aws/lambda/{self.config.get_resource_name('cleanup-handler')}",
            retention_in_days=self.config.log_retention_days,
            tags=self.config.get_tags({'Purpose': 'CleanupLogs'})
        )
        
        # Log group for application logs
        self.log_groups['application'] = aws.cloudwatch.LogGroup(
            'application-logs',
            name=f"/aws/ec2/{self.config.app_name}-{self.config.environment_suffix}",
            retention_in_days=self.config.log_retention_days,
            tags=self.config.get_tags({'Purpose': 'ApplicationLogs'})
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
        dimensions: Optional[Dict[str, Output[str]]] = None
    ) -> aws.cloudwatch.MetricAlarm:
        """
        Create CloudWatch alarm with SNS notification.
        
        Args:
            name: Alarm name
            metric_name: CloudWatch metric name
            namespace: Metric namespace
            statistic: Statistic type (Average, Sum, etc.)
            threshold: Alarm threshold
            comparison_operator: Comparison operator
            evaluation_periods: Number of evaluation periods
            period: Period in seconds
            dimensions: Optional metric dimensions
            
        Returns:
            CloudWatch MetricAlarm
        """
        alarm_name = self.config.get_resource_name(f"alarm-{name}")
        
        alarm = aws.cloudwatch.MetricAlarm(
            f"alarm-{name}",
            name=alarm_name,
            comparison_operator=comparison_operator,
            evaluation_periods=evaluation_periods,
            metric_name=metric_name,
            namespace=namespace,
            period=period,
            statistic=statistic,
            threshold=threshold,
            alarm_description=f"Alarm for {name}",
            alarm_actions=[self.sns_topic_arn],
            ok_actions=[self.sns_topic_arn],
            dimensions=dimensions,
            tags=self.config.get_tags({'AlarmType': name})
        )
        
        self.alarms[name] = alarm
        return alarm
    
    def setup_standard_alarms(self, asg_name: Output[str]):
        """
        Setup standard monitoring alarms for the infrastructure.
        
        Args:
            asg_name: Auto Scaling Group name
        """
        # High CPU utilization alarm
        self.create_alarm(
            name='high-cpu',
            metric_name='CPUUtilization',
            namespace='AWS/EC2',
            statistic='Average',
            threshold=80.0,
            comparison_operator='GreaterThanThreshold',
            evaluation_periods=2,
            period=300,
            dimensions={'AutoScalingGroupName': asg_name}
        )
        
        # Low health percentage alarm
        self.create_alarm(
            name='low-health',
            metric_name='HealthPercentage',
            namespace=self.config.metric_namespace,
            statistic='Average',
            threshold=60.0,
            comparison_operator='LessThanThreshold',
            evaluation_periods=3,
            period=60
        )
        
        # High unhealthy instance count alarm
        self.create_alarm(
            name='unhealthy-instances',
            metric_name='UnhealthyInstances',
            namespace=self.config.metric_namespace,
            statistic='Sum',
            threshold=float(self.config.failure_threshold),
            comparison_operator='GreaterThanOrEqualToThreshold',
            evaluation_periods=2,
            period=60
        )
        
        # Lambda errors alarm
        self.create_alarm(
            name='lambda-errors',
            metric_name='Errors',
            namespace='AWS/Lambda',
            statistic='Sum',
            threshold=5.0,
            comparison_operator='GreaterThanThreshold',
            evaluation_periods=1,
            period=60
        )
    
    def create_dashboard(self, asg_name: Output[str]) -> aws.cloudwatch.Dashboard:
        """
        Create CloudWatch dashboard for infrastructure monitoring.
        
        Args:
            asg_name: Auto Scaling Group name
            
        Returns:
            CloudWatch Dashboard
        """
        dashboard_name = self.config.get_resource_name('dashboard')
        
        # Build dashboard body dynamically with region from config
        dashboard_body = Output.all(
            asg_name,
            self.config.primary_region,
            self.config.app_name,
            self.config.environment_suffix
        ).apply(lambda args: {
            "widgets": [
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            [self.config.metric_namespace, "HealthPercentage", {"stat": "Average"}],
                            [".", "UnhealthyInstances", {"stat": "Sum"}]
                        ],
                        "period": 300,
                        "stat": "Average",
                        "region": args[1],  # Use config region, not hardcoded
                        "title": "Infrastructure Health"
                    }
                },
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/EC2", "CPUUtilization"],
                            ["AWS/EC2", "NetworkIn"]
                        ],
                        "period": 300,
                        "stat": "Average",
                        "region": args[1],
                        "title": "EC2 Metrics"
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
                        "region": args[1],
                        "title": "Lambda Functions"
                    }
                },
                {
                    "type": "log",
                    "properties": {
                        "query": f"SOURCE '/aws/lambda/{args[2]}-{args[3]}-rollback-handler' | fields @timestamp, @message | sort @timestamp desc | limit 20",
                        "region": args[1],
                        "title": "Recent Rollback Activities"
                    }
                }
            ]
        })
        
        dashboard = aws.cloudwatch.Dashboard(
            'infrastructure-dashboard',
            dashboard_name=dashboard_name,
            dashboard_body=dashboard_body.apply(lambda body: pulumi.Output.json_dumps(body))
        )
        
        return dashboard
    
    def get_log_group_name(self, log_type: str) -> Output[str]:
        """
        Get log group name.
        
        Args:
            log_type: Type of log group ('rollback', 'monitoring', 'cleanup', 'application')
            
        Returns:
            Log group name as Output[str]
        """
        if log_type not in self.log_groups:
            raise ValueError(f"Log group type {log_type} not found")
        return self.log_groups[log_type].name
    
    def get_log_group_arn(self, log_type: str) -> Output[str]:
        """
        Get log group ARN.
        
        Args:
            log_type: Type of log group
            
        Returns:
            Log group ARN as Output[str]
        """
        if log_type not in self.log_groups:
            raise ValueError(f"Log group type {log_type} not found")
        return self.log_groups[log_type].arn

