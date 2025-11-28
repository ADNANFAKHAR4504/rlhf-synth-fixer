"""Failover stack for Lambda functions and Route53."""

import os
from constructs import Construct
from cdktf import TerraformAsset, AssetType
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy import IamRolePolicy
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.lambda_function import LambdaFunction
from cdktf_cdktf_provider_aws.lambda_permission import LambdaPermission
from cdktf_cdktf_provider_aws.cloudwatch_event_rule import CloudwatchEventRule
from cdktf_cdktf_provider_aws.cloudwatch_event_target import CloudwatchEventTarget
from cdktf_cdktf_provider_aws.route53_health_check import Route53HealthCheck
from cdktf_cdktf_provider_aws.route53_zone import Route53Zone
from cdktf_cdktf_provider_aws.route53_record import Route53Record
from cdktf_cdktf_provider_aws.data_aws_caller_identity import DataAwsCallerIdentity
import json


class FailoverStack(Construct):
    """Failover orchestration with Lambda and Route53."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        primary_provider,
        secondary_provider,
        primary_cluster_endpoint: str,
        secondary_cluster_endpoint: str,
        global_cluster_id: str,
        primary_subnet_ids: list,
        secondary_subnet_ids: list,
        primary_lambda_security_group_id: str,
        secondary_lambda_security_group_id: str,
        primary_sns_topic_arn: str,
        secondary_sns_topic_arn: str,
        primary_replication_alarm=None,
        secondary_cpu_alarm=None,
    ):
        """Initialize failover orchestration infrastructure."""
        super().__init__(scope, construct_id)

        # Create TerraformAssets for Lambda zip files
        # Use absolute path to lambda directory relative to this file's location
        lambda_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "lambda")

        health_monitor_asset = TerraformAsset(
            self,
            "health_monitor_asset",
            path=os.path.join(lambda_dir, "health_monitor.zip"),
            type=AssetType.FILE,
        )

        failover_trigger_asset = TerraformAsset(
            self,
            "failover_trigger_asset",
            path=os.path.join(lambda_dir, "failover_trigger.zip"),
            type=AssetType.FILE,
        )

        # Get AWS account ID
        account = DataAwsCallerIdentity(
            self,
            "account",
            provider=primary_provider,
        )

        # Create IAM role for primary Lambda
        primary_lambda_role = IamRole(
            self,
            "primary_lambda_role",
            provider=primary_provider,
            name=f"primary-failover-lambda-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "lambda.amazonaws.com"
                        },
                        "Action": "sts:AssumeRole"
                    }
                ]
            }),
            tags={
                "Name": f"primary-failover-lambda-role-{environment_suffix}",
            },
        )

        # Attach basic Lambda execution policy
        IamRolePolicyAttachment(
            self,
            "primary_lambda_basic_policy",
            provider=primary_provider,
            role=primary_lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole",
        )

        # Create inline policy for RDS and SNS access
        primary_lambda_policy = IamRolePolicy(
            self,
            "primary_lambda_policy",
            provider=primary_provider,
            name=f"primary-failover-lambda-policy-{environment_suffix}",
            role=primary_lambda_role.id,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "rds:DescribeGlobalClusters",
                            "rds:DescribeDBClusters",
                            "rds:FailoverGlobalCluster",
                            "rds:RemoveFromGlobalCluster",
                        ],
                        "Resource": "*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "sns:Publish"
                        ],
                        "Resource": [
                            primary_sns_topic_arn,
                            secondary_sns_topic_arn,
                        ]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "cloudwatch:GetMetricStatistics",
                            "cloudwatch:ListMetrics"
                        ],
                        "Resource": "*"
                    }
                ]
            }),
        )

        # Create IAM role for secondary Lambda
        secondary_lambda_role = IamRole(
            self,
            "secondary_lambda_role",
            provider=secondary_provider,
            name=f"secondary-failover-lambda-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "lambda.amazonaws.com"
                        },
                        "Action": "sts:AssumeRole"
                    }
                ]
            }),
            tags={
                "Name": f"secondary-failover-lambda-role-{environment_suffix}",
            },
        )

        # Attach basic Lambda execution policy to secondary role
        IamRolePolicyAttachment(
            self,
            "secondary_lambda_basic_policy",
            provider=secondary_provider,
            role=secondary_lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole",
        )

        # Create inline policy for secondary Lambda
        secondary_lambda_policy = IamRolePolicy(
            self,
            "secondary_lambda_policy",
            provider=secondary_provider,
            name=f"secondary-failover-lambda-policy-{environment_suffix}",
            role=secondary_lambda_role.id,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "rds:DescribeGlobalClusters",
                            "rds:DescribeDBClusters",
                            "rds:FailoverGlobalCluster",
                            "rds:RemoveFromGlobalCluster",
                        ],
                        "Resource": "*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "sns:Publish"
                        ],
                        "Resource": [
                            primary_sns_topic_arn,
                            secondary_sns_topic_arn,
                        ]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "cloudwatch:GetMetricStatistics",
                            "cloudwatch:ListMetrics"
                        ],
                        "Resource": "*"
                    }
                ]
            }),
        )

        # Create Lambda function for health monitoring in primary region
        primary_health_lambda = LambdaFunction(
            self,
            "primary_health_lambda",
            provider=primary_provider,
            function_name=f"aurora-health-monitor-primary-{environment_suffix}",
            role=primary_lambda_role.arn,
            handler="health_monitor.lambda_handler",
            runtime="python3.11",
            timeout=60,
            memory_size=256,
            vpc_config={
                "subnet_ids": primary_subnet_ids,
                "security_group_ids": [primary_lambda_security_group_id],
            },
            environment={
                "variables": {
                    "CLUSTER_ENDPOINT": primary_cluster_endpoint,
                    "CLUSTER_REGION": "us-east-1",
                    "GLOBAL_CLUSTER_ID": global_cluster_id,
                    "SNS_TOPIC_ARN": primary_sns_topic_arn,
                    "ENVIRONMENT_SUFFIX": environment_suffix,
                }
            },
            filename=health_monitor_asset.path,
            source_code_hash=health_monitor_asset.asset_hash,
            tags={
                "Name": f"aurora-health-monitor-primary-{environment_suffix}",
            },
        )

        # Create Lambda function for failover trigger in primary region
        primary_failover_lambda = LambdaFunction(
            self,
            "primary_failover_lambda",
            provider=primary_provider,
            function_name=f"aurora-failover-trigger-primary-{environment_suffix}",
            role=primary_lambda_role.arn,
            handler="failover_trigger.lambda_handler",
            runtime="python3.11",
            timeout=300,
            memory_size=512,
            vpc_config={
                "subnet_ids": primary_subnet_ids,
                "security_group_ids": [primary_lambda_security_group_id],
            },
            environment={
                "variables": {
                    "GLOBAL_CLUSTER_ID": global_cluster_id,
                    "PRIMARY_REGION": "us-east-1",
                    "SECONDARY_REGION": "us-west-2",
                    "SNS_TOPIC_ARN": primary_sns_topic_arn,
                    "ENVIRONMENT_SUFFIX": environment_suffix,
                }
            },
            filename=failover_trigger_asset.path,
            source_code_hash=failover_trigger_asset.asset_hash,
            tags={
                "Name": f"aurora-failover-trigger-primary-{environment_suffix}",
            },
        )

        # Create Lambda function for health monitoring in secondary region
        secondary_health_lambda = LambdaFunction(
            self,
            "secondary_health_lambda",
            provider=secondary_provider,
            function_name=f"aurora-health-monitor-secondary-{environment_suffix}",
            role=secondary_lambda_role.arn,
            handler="health_monitor.lambda_handler",
            runtime="python3.11",
            timeout=60,
            memory_size=256,
            vpc_config={
                "subnet_ids": secondary_subnet_ids,
                "security_group_ids": [secondary_lambda_security_group_id],
            },
            environment={
                "variables": {
                    "CLUSTER_ENDPOINT": secondary_cluster_endpoint,
                    "CLUSTER_REGION": "us-west-2",
                    "GLOBAL_CLUSTER_ID": global_cluster_id,
                    "SNS_TOPIC_ARN": secondary_sns_topic_arn,
                    "ENVIRONMENT_SUFFIX": environment_suffix,
                }
            },
            filename=health_monitor_asset.path,
            source_code_hash=health_monitor_asset.asset_hash,
            tags={
                "Name": f"aurora-health-monitor-secondary-{environment_suffix}",
            },
        )

        # Create CloudWatch Event Rule to trigger primary health check every minute
        primary_health_rule = CloudwatchEventRule(
            self,
            "primary_health_rule",
            provider=primary_provider,
            name=f"aurora-health-check-primary-{environment_suffix}",
            description="Trigger health check for primary Aurora cluster",
            schedule_expression="rate(1 minute)",
            tags={
                "Name": f"aurora-health-check-primary-{environment_suffix}",
            },
        )

        # Add Lambda as target for primary health rule
        CloudwatchEventTarget(
            self,
            "primary_health_target",
            provider=primary_provider,
            rule=primary_health_rule.name,
            arn=primary_health_lambda.arn,
        )

        # Grant EventBridge permission to invoke primary health Lambda
        LambdaPermission(
            self,
            "primary_health_permission",
            provider=primary_provider,
            statement_id="AllowEventBridgeInvoke",
            action="lambda:InvokeFunction",
            function_name=primary_health_lambda.function_name,
            principal="events.amazonaws.com",
            source_arn=primary_health_rule.arn,
        )

        # Create CloudWatch Event Rule to trigger secondary health check every minute
        secondary_health_rule = CloudwatchEventRule(
            self,
            "secondary_health_rule",
            provider=secondary_provider,
            name=f"aurora-health-check-secondary-{environment_suffix}",
            description="Trigger health check for secondary Aurora cluster",
            schedule_expression="rate(1 minute)",
            tags={
                "Name": f"aurora-health-check-secondary-{environment_suffix}",
            },
        )

        # Add Lambda as target for secondary health rule
        CloudwatchEventTarget(
            self,
            "secondary_health_target",
            provider=secondary_provider,
            rule=secondary_health_rule.name,
            arn=secondary_health_lambda.arn,
        )

        # Grant EventBridge permission to invoke secondary health Lambda
        LambdaPermission(
            self,
            "secondary_health_permission",
            provider=secondary_provider,
            statement_id="AllowEventBridgeInvoke",
            action="lambda:InvokeFunction",
            function_name=secondary_health_lambda.function_name,
            principal="events.amazonaws.com",
            source_arn=secondary_health_rule.arn,
        )

        # Create Route53 health check for primary endpoint
        # Build depends_on list for primary health check
        primary_health_depends_on = []
        if primary_replication_alarm is not None:
            primary_health_depends_on.append(primary_replication_alarm)

        primary_health_check = Route53HealthCheck(
            self,
            "primary_health_check",
            provider=primary_provider,
            type="CLOUDWATCH_METRIC",
            cloudwatch_alarm_name=f"aurora-primary-replication-lag-{environment_suffix}",
            cloudwatch_alarm_region="us-east-1",
            insufficient_data_health_status="Unhealthy",
            depends_on=primary_health_depends_on if primary_health_depends_on else None,
            tags={
                "Name": f"aurora-primary-health-{environment_suffix}",
            },
        )

        # Build depends_on list for secondary health check
        secondary_health_depends_on = []
        if secondary_cpu_alarm is not None:
            secondary_health_depends_on.append(secondary_cpu_alarm)

        # Create Route53 health check for secondary endpoint
        secondary_health_check = Route53HealthCheck(
            self,
            "secondary_health_check",
            provider=secondary_provider,
            type="CLOUDWATCH_METRIC",
            cloudwatch_alarm_name=f"aurora-secondary-cpu-{environment_suffix}",
            cloudwatch_alarm_region="us-west-2",
            insufficient_data_health_status="Healthy",
            depends_on=secondary_health_depends_on if secondary_health_depends_on else None,
            tags={
                "Name": f"aurora-secondary-health-{environment_suffix}",
            },
        )

        # Export attributes for use in other stacks
        self.primary_health_lambda_arn = primary_health_lambda.arn
        self.primary_failover_lambda_arn = primary_failover_lambda.arn
        self.secondary_health_lambda_arn = secondary_health_lambda.arn
        self.primary_health_check_id = primary_health_check.id
        self.secondary_health_check_id = secondary_health_check.id