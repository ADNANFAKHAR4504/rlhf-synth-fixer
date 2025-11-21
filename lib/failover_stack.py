"""failover_stack.py
Automated failover mechanism with Lambda and Route53 weighted routing.
Note: Failover is between primary and replica in the same region.
"""

from constructs import Construct
import aws_cdk as cdk
from aws_cdk import (
    aws_lambda as lambda_,
    aws_route53 as route53,
    aws_route53_targets as targets,
    aws_iam as iam,
    aws_ec2 as ec2,
    aws_logs as logs,
    Duration,
    RemovalPolicy
)


class FailoverStack(Construct):
    """
    Creates automated failover mechanism with Lambda and Route53.

    Args:
        scope (Construct): The parent construct
        construct_id (str): The unique identifier for this construct
        environment_suffix (str): Environment suffix for resource naming
        primary_db_instance: Primary RDS instance
        replica_db_instance: Replica RDS instance
        primary_vpc (ec2.Vpc): VPC in primary region

    Attributes:
        failover_function (lambda_.Function): Lambda function for failover
        hosted_zone (route53.PrivateHostedZone): Private hosted zone
        route53_cname (str): Route53 CNAME for database endpoint
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        primary_db_instance,
        replica_db_instance,
        primary_vpc: ec2.Vpc,
        sns_topic=None,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        # Private hosted zone
        self.hosted_zone = route53.PrivateHostedZone(
            self,
            f"PrivateZone-{environment_suffix}",
            zone_name=f"db-{environment_suffix}.internal",
            vpc=primary_vpc
        )

        # Weighted routing policy - primary (100%)
        # Health monitoring is done via CloudWatch alarms, not Route53 health checks
        # (PostgreSQL doesn't support HTTP/HTTPS health checks)
        primary_record = route53.CfnRecordSet(
            self,
            f"PrimaryRecord-{environment_suffix}",
            hosted_zone_id=self.hosted_zone.hosted_zone_id,
            name=f"postgres.{self.hosted_zone.zone_name}",
            type="CNAME",
            ttl="60",
            resource_records=[primary_db_instance.db_instance_endpoint_address],
            set_identifier="primary",
            weight=100
        )

        # Weighted routing policy - replica (0%)
        replica_record = route53.CfnRecordSet(
            self,
            f"ReplicaRecord-{environment_suffix}",
            hosted_zone_id=self.hosted_zone.hosted_zone_id,
            name=f"postgres.{self.hosted_zone.zone_name}",
            type="CNAME",
            ttl="60",
            resource_records=[replica_db_instance.db_instance_endpoint_address],
            set_identifier="replica",
            weight=0
        )

        self.route53_cname = f"postgres.{self.hosted_zone.zone_name}"

        # IAM role for failover Lambda
        failover_role = iam.Role(
            self,
            f"FailoverRole-{environment_suffix}",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            description="Role for automated failover Lambda function",
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaBasicExecutionRole"
                ),
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaVPCAccessExecutionRole"
                )
            ]
        )

        # Add permissions for RDS and Route53
        failover_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "rds:PromoteReadReplica",
                    "rds:DescribeDBInstances",
                    "rds:ModifyDBInstance"
                ],
                resources=[
                    primary_db_instance.instance_arn,
                    replica_db_instance.instance_arn
                ]
            )
        )

        failover_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "route53:ChangeResourceRecordSets",
                    "route53:GetChange",
                    "route53:ListResourceRecordSets"
                ],
                resources=[
                    self.hosted_zone.hosted_zone_arn,
                    "arn:aws:route53:::change/*"
                ]
            )
        )

        # Build environment variables
        lambda_env = {
            "PRIMARY_INSTANCE_ID": primary_db_instance.instance_identifier,
            "REPLICA_INSTANCE_ID": replica_db_instance.instance_identifier,
            "HOSTED_ZONE_ID": self.hosted_zone.hosted_zone_id,
            "RECORD_NAME": self.route53_cname,
            "PRIMARY_ENDPOINT": primary_db_instance.db_instance_endpoint_address,
            "REPLICA_ENDPOINT": replica_db_instance.db_instance_endpoint_address
        }

        # Add SNS topic ARN if provided
        if sns_topic:
            lambda_env["SNS_TOPIC_ARN"] = sns_topic.topic_arn

        # Lambda function for automated failover
        self.failover_function = lambda_.Function(
            self,
            f"FailoverFunction-{environment_suffix}",
            function_name=f"db-failover-{environment_suffix}",
            runtime=lambda_.Runtime.PYTHON_3_11,
            handler="index.handler",
            code=lambda_.Code.from_asset("lib/lambda/failover"),
            role=failover_role,
            timeout=Duration.seconds(300),
            vpc=primary_vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_ISOLATED
            ),
            environment=lambda_env,
            log_retention=logs.RetentionDays.ONE_WEEK,
            description="Automated failover function for PostgreSQL DR with retry and notifications"
        )

        # Grant Lambda permission to publish to SNS topic
        if sns_topic:
            sns_topic.grant_publish(self.failover_function)
