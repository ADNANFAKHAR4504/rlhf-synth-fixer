"""
Monitoring and observability module.
Creates CloudWatch Logs, Alarms, and VPC Flow Logs.
"""
from typing import Any, Dict

import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions


class MonitoringStack:
    """Creates CloudWatch monitoring and logging resources."""

    def __init__(self,
                 name: str,
                 vpc_id: Output[str],
                 alb_arn: Output[str],
                 rds_instance_id: Output[str],
                 asg_name: Output[str],
                 logs_bucket_name: Output[str],
                 environment_suffix: str,
                 tags: Dict[str, str],
                 opts: ResourceOptions = None):
        """
        Initialize monitoring infrastructure.

        Args:
            name: Resource name prefix
            vpc_id: VPC ID for Flow Logs
            alb_arn: ALB ARN for access logs
            rds_instance_id: RDS instance ID for alarms
            asg_name: Auto Scaling Group name for alarms
            logs_bucket_name: S3 bucket for ALB logs
            environment_suffix: Environment suffix
            tags: Common tags
            opts: Pulumi resource options
        """
        self.environment_suffix = environment_suffix
        self.tags = tags

        # CloudWatch Log Group for Application Logs
        self.app_log_group = aws.cloudwatch.LogGroup(
            f"app-logs-{environment_suffix}",
            name=f"/aws/app/{environment_suffix}",
            retention_in_days=7,
            tags={**tags, "Name": f"app-logs-{environment_suffix}"},
            opts=opts
        )

        # CloudWatch Log Group for VPC Flow Logs
        self.flow_log_group = aws.cloudwatch.LogGroup(
            f"vpc-flow-logs-{environment_suffix}",
            name=f"/aws/vpc/flowlogs/{environment_suffix}",
            retention_in_days=7,
            tags={**tags, "Name": f"vpc-flow-logs-{environment_suffix}"},
            opts=opts
        )

        # IAM Role for VPC Flow Logs
        flow_logs_assume_role = aws.iam.get_policy_document(
            statements=[
                aws.iam.GetPolicyDocumentStatementArgs(
                    effect="Allow",
                    principals=[
                        aws.iam.GetPolicyDocumentStatementPrincipalArgs(
                            type="Service",
                            identifiers=["vpc-flow-logs.amazonaws.com"]
                        )
                    ],
                    actions=["sts:AssumeRole"]
                )
            ]
        )

        self.flow_logs_role = aws.iam.Role(
            f"vpc-flow-logs-role-{environment_suffix}",
            name=f"vpc-flow-logs-role-{environment_suffix}",
            assume_role_policy=flow_logs_assume_role.json,
            tags={**tags, "Name": f"vpc-flow-logs-role-{environment_suffix}"},
            opts=opts
        )

        # IAM Policy for VPC Flow Logs
        flow_logs_policy = aws.iam.get_policy_document(
            statements=[
                aws.iam.GetPolicyDocumentStatementArgs(
                    effect="Allow",
                    actions=[
                        "logs:CreateLogGroup",
                        "logs:CreateLogStream",
                        "logs:PutLogEvents",
                        "logs:DescribeLogGroups",
                        "logs:DescribeLogStreams"
                    ],
                    resources=[f"arn:aws:logs:us-east-1:*:log-group:/aws/vpc/flowlogs/{environment_suffix}*"]
                )
            ]
        )

        self.flow_logs_policy = aws.iam.RolePolicy(
            f"vpc-flow-logs-policy-{environment_suffix}",
            role=self.flow_logs_role.id,
            policy=flow_logs_policy.json,
            opts=ResourceOptions(parent=self.flow_logs_role)
        )

        # VPC Flow Logs
        self.vpc_flow_log = aws.ec2.FlowLog(
            f"vpc-flow-log-{environment_suffix}",
            vpc_id=vpc_id,
            traffic_type="ALL",
            log_destination_type="cloud-watch-logs",
            log_destination=self.flow_log_group.arn,
            iam_role_arn=self.flow_logs_role.arn,
            tags={**tags, "Name": f"vpc-flow-log-{environment_suffix}"},
            opts=ResourceOptions(parent=self.flow_log_group, depends_on=[self.flow_logs_policy])
        )

        # Enable ALB Access Logs to S3
        # Note: This is configured on the ALB itself in web_tier.py
        # We document it here for observability completeness

        # CloudWatch Alarm: RDS High CPU
        self.rds_cpu_alarm = aws.cloudwatch.MetricAlarm(
            f"rds-high-cpu-{environment_suffix}",
            name=f"rds-high-cpu-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="CPUUtilization",
            namespace="AWS/RDS",
            period=300,
            statistic="Average",
            threshold=80.0,
            alarm_description="Alert when RDS CPU exceeds 80%",
            dimensions={
                "DBInstanceIdentifier": rds_instance_id
            },
            treat_missing_data="notBreaching",
            tags={**tags, "Name": f"rds-high-cpu-{environment_suffix}"},
            opts=opts
        )

        # CloudWatch Alarm: RDS High Connections
        self.rds_connections_alarm = aws.cloudwatch.MetricAlarm(
            f"rds-high-connections-{environment_suffix}",
            name=f"rds-high-connections-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="DatabaseConnections",
            namespace="AWS/RDS",
            period=300,
            statistic="Average",
            threshold=80.0,
            alarm_description="Alert when RDS connections exceed 80",
            dimensions={
                "DBInstanceIdentifier": rds_instance_id
            },
            treat_missing_data="notBreaching",
            tags={**tags, "Name": f"rds-high-connections-{environment_suffix}"},
            opts=opts
        )

        # Extract load balancer name from ARN for CloudWatch dimensions
        if hasattr(alb_arn, 'apply'):
            lb_name = alb_arn.apply(lambda arn: "/".join(arn.split(":")[5].split("/")[1:]) if arn else "test-lb")
        else:
            lb_name = "/".join(str(alb_arn).split(":")[5].split("/")[1:]) if alb_arn else "test-lb"

        # CloudWatch Alarm: ALB Unhealthy Hosts
        self.alb_unhealthy_alarm = aws.cloudwatch.MetricAlarm(
            f"alb-unhealthy-hosts-{environment_suffix}",
            name=f"alb-unhealthy-hosts-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="UnHealthyHostCount",
            namespace="AWS/ApplicationELB",
            period=60,
            statistic="Average",
            threshold=1.0,
            alarm_description="Alert when ALB has unhealthy hosts",
            dimensions={
                "LoadBalancer": lb_name
            },
            treat_missing_data="notBreaching",
            tags={**tags, "Name": f"alb-unhealthy-hosts-{environment_suffix}"},
            opts=opts
        )

        # CloudWatch Alarm: ALB High 5XX Errors
        self.alb_5xx_alarm = aws.cloudwatch.MetricAlarm(
            f"alb-high-5xx-{environment_suffix}",
            name=f"alb-high-5xx-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="HTTPCode_Target_5XX_Count",
            namespace="AWS/ApplicationELB",
            period=300,
            statistic="Sum",
            threshold=10.0,
            alarm_description="Alert when ALB 5XX errors exceed 10 in 5 minutes",
            dimensions={
                "LoadBalancer": lb_name
            },
            treat_missing_data="notBreaching",
            tags={**tags, "Name": f"alb-high-5xx-{environment_suffix}"},
            opts=opts
        )

        # CloudWatch Alarm: ASG High CPU (for scaling monitoring)
        # Note: This monitors if ASG instances are under high CPU load
        # Actual scaling policies would be defined in web_tier.py
