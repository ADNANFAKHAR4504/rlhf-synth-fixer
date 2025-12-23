import os
from constructs import Construct
from cdktf import Fn, TerraformAsset, AssetType
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy import IamRolePolicy
from cdktf_cdktf_provider_aws.lambda_function import LambdaFunction
from cdktf_cdktf_provider_aws.cloudwatch_event_rule import CloudwatchEventRule
from cdktf_cdktf_provider_aws.cloudwatch_event_target import CloudwatchEventTarget
from cdktf_cdktf_provider_aws.lambda_permission import LambdaPermission


class FailoverOrchestrationConstruct(Construct):
    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        primary_provider,
        primary_subnet_ids: list,
        sns_topic_arn: str,
        primary_alb_arn: str,
        secondary_alb_arn: str,
        primary_region: str,
        secondary_region: str,
        lambda_security_group_id: str
    ):
        super().__init__(scope, construct_id)

        # IAM role for Lambda
        lambda_role = IamRole(
            self,
            "lambda-failover-role",
            name=f"lambda-failover-role-{environment_suffix}",
            assume_role_policy=Fn.jsonencode({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "lambda.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            provider=primary_provider
        )

        # Lambda execution policy
        IamRolePolicy(
            self,
            "lambda-failover-policy",
            name=f"lambda-failover-policy-{environment_suffix}",
            role=lambda_role.id,
            policy=Fn.jsonencode({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "logs:CreateLogGroup",
                            "logs:CreateLogStream",
                            "logs:PutLogEvents"
                        ],
                        "Resource": "arn:aws:logs:*:*:*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "ec2:CreateNetworkInterface",
                            "ec2:DescribeNetworkInterfaces",
                            "ec2:DeleteNetworkInterface"
                        ],
                        "Resource": "*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "route53:ChangeResourceRecordSets",
                            "route53:GetHealthCheck",
                            "route53:GetHealthCheckStatus"
                        ],
                        "Resource": "*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "rds:DescribeDBClusters",
                            "rds:FailoverDBCluster"
                        ],
                        "Resource": "*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "elasticloadbalancing:DescribeTargetHealth",
                            "elasticloadbalancing:DescribeLoadBalancers"
                        ],
                        "Resource": "*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "sns:Publish"
                        ],
                        "Resource": sns_topic_arn
                    }
                ]
            }),
            provider=primary_provider
        )

        # Lambda function asset
        lambda_asset = TerraformAsset(
            self,
            "lambda-code-asset",
            path=os.path.join(os.path.dirname(__file__), "lambda"),
            type=AssetType.ARCHIVE
        )

        # Lambda function for failover orchestration
        self.failover_function = LambdaFunction(
            self,
            "failover-function",
            function_name=f"failover-orchestrator-{environment_suffix}",
            role=lambda_role.arn,
            handler="failover.lambda_handler",
            runtime="python3.11",
            filename=lambda_asset.path,
            source_code_hash=lambda_asset.asset_hash,
            timeout=300,
            environment={
                "variables": {
                    "ENVIRONMENT_SUFFIX": environment_suffix,
                    "PRIMARY_REGION": primary_region,
                    "SECONDARY_REGION": secondary_region,
                    "PRIMARY_ALB_ARN": primary_alb_arn,
                    "SECONDARY_ALB_ARN": secondary_alb_arn,
                    "SNS_TOPIC_ARN": sns_topic_arn
                }
            },
            vpc_config={
                "subnet_ids": primary_subnet_ids,
                "security_group_ids": [lambda_security_group_id]
            },
            tags={"Name": f"failover-orchestrator-{environment_suffix}"},
            provider=primary_provider
        )

        # Lambda function for health check validation
        self.health_check_function = LambdaFunction(
            self,
            "health-check-function",
            function_name=f"health-check-validator-{environment_suffix}",
            role=lambda_role.arn,
            handler="health_check.lambda_handler",
            runtime="python3.11",
            filename=lambda_asset.path,
            source_code_hash=lambda_asset.asset_hash,
            timeout=60,
            environment={
                "variables": {
                    "ENVIRONMENT_SUFFIX": environment_suffix,
                    "PRIMARY_REGION": primary_region,
                    "SECONDARY_REGION": secondary_region,
                    "PRIMARY_ALB_ARN": primary_alb_arn,
                    "SECONDARY_ALB_ARN": secondary_alb_arn,
                    "SNS_TOPIC_ARN": sns_topic_arn
                }
            },
            vpc_config={
                "subnet_ids": primary_subnet_ids,
                "security_group_ids": [lambda_security_group_id]
            },
            tags={"Name": f"health-check-validator-{environment_suffix}"},
            provider=primary_provider
        )

        # CloudWatch Event Rule for periodic health checks (every 30 seconds)
        health_check_rule = CloudwatchEventRule(
            self,
            "health-check-rule",
            name=f"health-check-rule-{environment_suffix}",
            description="Trigger health check validation every 30 seconds",
            schedule_expression="rate(1 minute)",
            provider=primary_provider
        )

        # CloudWatch Event Target
        CloudwatchEventTarget(
            self,
            "health-check-target",
            rule=health_check_rule.name,
            arn=self.health_check_function.arn,
            provider=primary_provider
        )

        # Lambda permission for EventBridge
        LambdaPermission(
            self,
            "health-check-permission",
            statement_id="AllowExecutionFromEventBridge",
            action="lambda:InvokeFunction",
            function_name=self.health_check_function.function_name,
            principal="events.amazonaws.com",
            source_arn=health_check_rule.arn,
            provider=primary_provider
        )
