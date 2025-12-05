"""TAP Stack module for payment processing infrastructure migration."""

import json

from cdktf import Fn, S3Backend, TerraformOutput, TerraformStack
from cdktf_cdktf_provider_aws.apigatewayv2_api import Apigatewayv2Api
from cdktf_cdktf_provider_aws.apigatewayv2_integration import \
    Apigatewayv2Integration
from cdktf_cdktf_provider_aws.apigatewayv2_route import Apigatewayv2Route
from cdktf_cdktf_provider_aws.apigatewayv2_stage import Apigatewayv2Stage
from cdktf_cdktf_provider_aws.apigatewayv2_vpc_link import Apigatewayv2VpcLink
from cdktf_cdktf_provider_aws.cloudwatch_dashboard import CloudwatchDashboard
from cdktf_cdktf_provider_aws.cloudwatch_metric_alarm import \
    CloudwatchMetricAlarm
from cdktf_cdktf_provider_aws.db_subnet_group import DbSubnetGroup
from cdktf_cdktf_provider_aws.dynamodb_table import (
    DynamodbTable, DynamodbTableAttribute, DynamodbTableGlobalSecondaryIndex)
from cdktf_cdktf_provider_aws.eip import Eip
from cdktf_cdktf_provider_aws.iam_policy import IamPolicy
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import \
    IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.kms_alias import KmsAlias
from cdktf_cdktf_provider_aws.kms_key import KmsKey
from cdktf_cdktf_provider_aws.lambda_function import LambdaFunction
from cdktf_cdktf_provider_aws.lambda_permission import LambdaPermission
from cdktf_cdktf_provider_aws.lb import Lb
from cdktf_cdktf_provider_aws.lb_listener import (
    LbListener, LbListenerDefaultAction, LbListenerDefaultActionForward,
    LbListenerDefaultActionForwardTargetGroup)
from cdktf_cdktf_provider_aws.lb_target_group import LbTargetGroup
from cdktf_cdktf_provider_aws.nat_gateway import NatGateway
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.rds_cluster import RdsCluster
from cdktf_cdktf_provider_aws.rds_cluster_instance import RdsClusterInstance
from cdktf_cdktf_provider_aws.route_table import RouteTable, RouteTableRoute
from cdktf_cdktf_provider_aws.route_table_association import \
    RouteTableAssociation
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_lifecycle_configuration import (
    S3BucketLifecycleConfiguration, S3BucketLifecycleConfigurationRule,
    S3BucketLifecycleConfigurationRuleTransition)
from cdktf_cdktf_provider_aws.s3_bucket_versioning import S3BucketVersioningA
from cdktf_cdktf_provider_aws.secretsmanager_secret import SecretsmanagerSecret
from cdktf_cdktf_provider_aws.secretsmanager_secret_rotation import \
    SecretsmanagerSecretRotation
from cdktf_cdktf_provider_aws.secretsmanager_secret_version import \
    SecretsmanagerSecretVersion
from cdktf_cdktf_provider_aws.security_group import (SecurityGroup,
                                                     SecurityGroupEgress,
                                                     SecurityGroupIngress)
from cdktf_cdktf_provider_aws.sns_topic import SnsTopic
from cdktf_cdktf_provider_aws.ssm_parameter import SsmParameter
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.vpc import Vpc
from constructs import Construct


class TapStack(TerraformStack):
    """CDKTF Python stack for payment processing infrastructure."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        **kwargs
    ):
        """Initialize the TAP stack with payment processing infrastructure."""
        super().__init__(scope, construct_id)

        # Extract configuration from kwargs
        environment_suffix = kwargs.get('environment_suffix', 'dev')
        aws_region = kwargs.get('aws_region', 'us-east-1')
        state_bucket_region = kwargs.get('state_bucket_region', 'us-east-1')
        state_bucket = kwargs.get('state_bucket', 'iac-rlhf-tf-states')
        default_tags = kwargs.get('default_tags', {})

        # Configure AWS Provider
        AwsProvider(
            self,
            "aws",
            region=aws_region,
            default_tags=[default_tags],
        )

        # Configure S3 Backend
        S3Backend(
            self,
            bucket=state_bucket,
            key=f"{environment_suffix}/{construct_id}.tfstate",
            region=state_bucket_region,
            encrypt=True,
        )

        # Availability zones for multi-AZ deployment
        azs = [f"{aws_region}a", f"{aws_region}b", f"{aws_region}c"]

        # ===========================
        # 1. Network Infrastructure
        # ===========================

        # VPC
        vpc = Vpc(
            self,
            f"vpc-{environment_suffix}",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
        )

        # Internet Gateway
        igw = InternetGateway(
            self,
            f"igw-{environment_suffix}",
            vpc_id=vpc.id,
        )

        # Public Subnets
        public_subnets = []
        for i, az in enumerate(azs):
            subnet = Subnet(
                self,
                f"public-subnet-{i}-{environment_suffix}",
                vpc_id=vpc.id,
                cidr_block=f"10.0.{i}.0/24",
                availability_zone=az,
                map_public_ip_on_launch=True,
            )
            public_subnets.append(subnet)

        # Private Subnets
        private_subnets = []
        for i, az in enumerate(azs):
            subnet = Subnet(
                self,
                f"private-subnet-{i}-{environment_suffix}",
                vpc_id=vpc.id,
                cidr_block=f"10.0.{10 + i}.0/24",
                availability_zone=az,
            )
            private_subnets.append(subnet)

        # Database Subnets
        db_subnets = []
        for i, az in enumerate(azs):
            subnet = Subnet(
                self,
                f"db-subnet-{i}-{environment_suffix}",
                vpc_id=vpc.id,
                cidr_block=f"10.0.{20 + i}.0/24",
                availability_zone=az,
            )
            db_subnets.append(subnet)

        # Elastic IPs for NAT Gateways
        eips = []
        for i in range(len(azs)):
            eip = Eip(
                self,
                f"eip-{i}-{environment_suffix}",
                domain="vpc",
            )
            eips.append(eip)

        # NAT Gateways (one per AZ for high availability)
        nat_gateways = []
        for i, public_subnet in enumerate(public_subnets):
            nat = NatGateway(
                self,
                f"nat-{i}-{environment_suffix}",
                allocation_id=eips[i].id,
                subnet_id=public_subnet.id,
                depends_on=[igw],
            )
            nat_gateways.append(nat)

        # Route Tables
        # Public Route Table
        public_rt = RouteTable(
            self,
            f"public-rt-{environment_suffix}",
            vpc_id=vpc.id,
            route=[RouteTableRoute(
                cidr_block="0.0.0.0/0",
                gateway_id=igw.id,
            )],
        )

        for i, subnet in enumerate(public_subnets):
            RouteTableAssociation(
                self,
                f"public-rta-{i}-{environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=public_rt.id,
            )

        # Private Route Tables (one per AZ for NAT Gateway)
        for i, subnet in enumerate(private_subnets):
            private_rt = RouteTable(
                self,
                f"private-rt-{i}-{environment_suffix}",
                vpc_id=vpc.id,
                route=[RouteTableRoute(
                    cidr_block="0.0.0.0/0",
                    nat_gateway_id=nat_gateways[i].id,
                )],
            )
            RouteTableAssociation(
                self,
                f"private-rta-{i}-{environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=private_rt.id,
            )

        # Database Route Table (no internet access)
        db_rt = RouteTable(
            self,
            f"db-rt-{environment_suffix}",
            vpc_id=vpc.id,
        )

        for i, subnet in enumerate(db_subnets):
            RouteTableAssociation(
                self,
                f"db-rta-{i}-{environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=db_rt.id,
            )

        # ===========================
        # 2. Security Groups
        # ===========================

        # ALB Security Group
        alb_sg = SecurityGroup(
            self,
            f"alb-sg-{environment_suffix}",
            name=f"alb-sg-{environment_suffix}",
            description="Security group for Application Load Balancer",
            vpc_id=vpc.id,
            ingress=[
                SecurityGroupIngress(
                    from_port=80,
                    to_port=80,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"],
                    description="HTTP access",
                ),
                SecurityGroupIngress(
                    from_port=443,
                    to_port=443,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"],
                    description="HTTPS access",
                ),
            ],
            egress=[SecurityGroupEgress(
                from_port=0,
                to_port=0,
                protocol="-1",
                cidr_blocks=["0.0.0.0/0"],
            )],
        )

        # Lambda Security Group
        lambda_sg = SecurityGroup(
            self,
            f"lambda-sg-{environment_suffix}",
            name=f"lambda-sg-{environment_suffix}",
            description="Security group for Lambda functions",
            vpc_id=vpc.id,
            egress=[SecurityGroupEgress(
                from_port=0,
                to_port=0,
                protocol="-1",
                cidr_blocks=["0.0.0.0/0"],
            )],
        )

        # RDS Security Group
        rds_sg = SecurityGroup(
            self,
            f"rds-sg-{environment_suffix}",
            name=f"rds-sg-{environment_suffix}",
            description="Security group for RDS Aurora cluster",
            vpc_id=vpc.id,
            ingress=[
                SecurityGroupIngress(
                    from_port=5432,
                    to_port=5432,
                    protocol="tcp",
                    security_groups=[lambda_sg.id],
                    description="PostgreSQL access from Lambda",
                ),
            ],
            egress=[SecurityGroupEgress(
                from_port=0,
                to_port=0,
                protocol="-1",
                cidr_blocks=["0.0.0.0/0"],
            )],
        )

        # ===========================
        # 3. KMS Keys for Encryption
        # ===========================

        # KMS Key for RDS
        rds_kms_key = KmsKey(
            self,
            f"rds-kms-key-{environment_suffix}",
            description=f"KMS key for RDS encryption - {environment_suffix}",
            deletion_window_in_days=7,
            enable_key_rotation=True,
        )

        KmsAlias(
            self,
            f"rds-kms-alias-{environment_suffix}",
            name=f"alias/rds-{environment_suffix}",
            target_key_id=rds_kms_key.key_id,
        )

        # KMS Key for DynamoDB
        dynamodb_kms_key = KmsKey(
            self,
            f"dynamodb-kms-key-{environment_suffix}",
            description=f"KMS key for DynamoDB encryption - {environment_suffix}",
            deletion_window_in_days=7,
            enable_key_rotation=True,
        )

        KmsAlias(
            self,
            f"dynamodb-kms-alias-{environment_suffix}",
            name=f"alias/dynamodb-{environment_suffix}",
            target_key_id=dynamodb_kms_key.key_id,
        )

        # ===========================
        # 4. RDS Aurora PostgreSQL
        # ===========================

        # DB Subnet Group
        db_subnet_group = DbSubnetGroup(
            self,
            f"db-subnet-group-{environment_suffix}",
            name=f"db-subnet-group-{environment_suffix}",
            subnet_ids=[subnet.id for subnet in db_subnets],
            description="Subnet group for RDS Aurora cluster",
        )

        # RDS Aurora Cluster
        aurora_cluster = RdsCluster(
            self,
            f"aurora-cluster-{environment_suffix}",
            cluster_identifier=f"aurora-cluster-{environment_suffix}",
            engine="aurora-postgresql",
            engine_mode="provisioned",
            database_name="payments",
            master_username="postgres",
            master_password="ChangeMeToSecurePassword123!",
            db_subnet_group_name=db_subnet_group.name,
            vpc_security_group_ids=[rds_sg.id],
            backup_retention_period=7,
            preferred_backup_window="03:00-04:00",
            preferred_maintenance_window="mon:04:00-mon:05:00",
            storage_encrypted=True,
            kms_key_id=rds_kms_key.arn,
            skip_final_snapshot=True,
            enabled_cloudwatch_logs_exports=["postgresql"],
            serverlessv2_scaling_configuration={
                "min_capacity": 0.5,
                "max_capacity": 1.0,
            },
        )

        # Aurora Cluster Instances (1 writer + 2 readers)
        RdsClusterInstance(
            self,
            f"aurora-writer-{environment_suffix}",
            identifier=f"aurora-writer-{environment_suffix}",
            cluster_identifier=aurora_cluster.cluster_identifier,
            instance_class="db.serverless",
            engine=aurora_cluster.engine,
            engine_version=aurora_cluster.engine_version,
            publicly_accessible=False,
        )

        for i in range(2):
            RdsClusterInstance(
                self,
                f"aurora-reader-{i}-{environment_suffix}",
                identifier=f"aurora-reader-{i}-{environment_suffix}",
                cluster_identifier=aurora_cluster.cluster_identifier,
                instance_class="db.serverless",
                engine=aurora_cluster.engine,
                engine_version=aurora_cluster.engine_version,
                publicly_accessible=False,
            )

        # ===========================
        # 5. DynamoDB Tables
        # ===========================

        # Transaction Records Table
        transactions_table = DynamodbTable(
            self,
            f"transactions-table-{environment_suffix}",
            name=f"transactions-{environment_suffix}",
            billing_mode="PAY_PER_REQUEST",
            hash_key="transaction_id",
            range_key="timestamp",
            attribute=[
                DynamodbTableAttribute(name="transaction_id", type="S"),
                DynamodbTableAttribute(name="timestamp", type="N"),
                DynamodbTableAttribute(name="user_id", type="S"),
                DynamodbTableAttribute(name="status", type="S"),
            ],
            global_secondary_index=[
                DynamodbTableGlobalSecondaryIndex(
                    name="user-index",
                    hash_key="user_id",
                    range_key="timestamp",
                    projection_type="ALL",
                ),
                DynamodbTableGlobalSecondaryIndex(
                    name="status-index",
                    hash_key="status",
                    range_key="timestamp",
                    projection_type="ALL",
                ),
            ],
            point_in_time_recovery={"enabled": True},
            server_side_encryption={
                "enabled": True,
                "kms_key_arn": dynamodb_kms_key.arn,
            },
        )

        # ===========================
        # 6. S3 Buckets for Audit Logs
        # ===========================

        # Audit Logs Bucket
        audit_bucket = S3Bucket(
            self,
            f"audit-logs-bucket-{environment_suffix}",
            bucket=f"payment-audit-logs-{environment_suffix}",
            force_destroy=True,
        )

        # Enable versioning
        S3BucketVersioningA(
            self,
            f"audit-bucket-versioning-{environment_suffix}",
            bucket=audit_bucket.id,
            versioning_configuration={"status": "Enabled"},
        )

        # Lifecycle configuration
        S3BucketLifecycleConfiguration(
            self,
            f"audit-bucket-lifecycle-{environment_suffix}",
            bucket=audit_bucket.id,
            rule=[
                S3BucketLifecycleConfigurationRule(
                    id="archive-old-logs",
                    status="Enabled",
                    transition=[
                        S3BucketLifecycleConfigurationRuleTransition(
                            days=90,
                            storage_class="GLACIER",
                        ),
                    ],
                ),
            ],
        )

        # ===========================
        # 7. IAM Roles for Lambda
        # ===========================

        # Lambda Execution Role
        lambda_role = IamRole(
            self,
            f"lambda-role-{environment_suffix}",
            name=f"lambda-execution-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "lambda.amazonaws.com"},
                    "Action": "sts:AssumeRole",
                }],
            }),
        )

        # Attach basic Lambda execution policy
        IamRolePolicyAttachment(
            self,
            f"lambda-basic-execution-{environment_suffix}",
            role=lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
        )

        # Attach VPC execution policy
        IamRolePolicyAttachment(
            self,
            f"lambda-vpc-execution-{environment_suffix}",
            role=lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole",
        )

        # Custom policy for DynamoDB and RDS access
        lambda_policy = IamPolicy(
            self,
            f"lambda-custom-policy-{environment_suffix}",
            name=f"lambda-custom-policy-{environment_suffix}",
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "dynamodb:PutItem",
                            "dynamodb:GetItem",
                            "dynamodb:Query",
                            "dynamodb:UpdateItem",
                        ],
                        "Resource": [
                            transactions_table.arn,
                            f"{transactions_table.arn}/index/*",
                        ],
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "secretsmanager:GetSecretValue",
                        ],
                        "Resource": "*",
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "ssm:GetParameter",
                            "ssm:GetParameters",
                        ],
                        "Resource": "*",
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "kms:Decrypt",
                        ],
                        "Resource": [
                            dynamodb_kms_key.arn,
                            rds_kms_key.arn,
                        ],
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:PutObject",
                        ],
                        "Resource": f"{audit_bucket.arn}/*",
                    },
                ],
            }),
        )

        IamRolePolicyAttachment(
            self,
            f"lambda-custom-policy-attachment-{environment_suffix}",
            role=lambda_role.name,
            policy_arn=lambda_policy.arn,
        )

        # Create placeholder Lambda zip (empty for now)
        # In production, this would contain actual Lambda code
        lambda_zip_path = "lambda_functions.zip"

        # ===========================
        # 8. Lambda Functions
        # ===========================

        # Payment Validation Lambda
        payment_validation_lambda = LambdaFunction(
            self,
            f"payment-validation-{environment_suffix}",
            function_name=f"payment-validation-{environment_suffix}",
            runtime="python3.9",
            handler="payment_validation.handler",
            role=lambda_role.arn,
            filename=lambda_zip_path,
            source_code_hash=Fn.filebase64sha256(lambda_zip_path),
            timeout=30,
            memory_size=512,
            vpc_config={
                "subnet_ids": [subnet.id for subnet in private_subnets],
                "security_group_ids": [lambda_sg.id],
            },
            environment={
                "variables": {
                    "ENVIRONMENT": environment_suffix,
                    "TABLE_NAME": transactions_table.name,
                },
            },
        )

        # Fraud Detection Lambda
        fraud_detection_lambda = LambdaFunction(
            self,
            f"fraud-detection-{environment_suffix}",
            function_name=f"fraud-detection-{environment_suffix}",
            runtime="python3.9",
            handler="fraud_detection.handler",
            role=lambda_role.arn,
            filename=lambda_zip_path,
            source_code_hash=Fn.filebase64sha256(lambda_zip_path),
            timeout=30,
            memory_size=512,
            vpc_config={
                "subnet_ids": [subnet.id for subnet in private_subnets],
                "security_group_ids": [lambda_sg.id],
            },
            environment={
                "variables": {
                    "ENVIRONMENT": environment_suffix,
                    "TABLE_NAME": transactions_table.name,
                },
            },
        )

        # Transaction Processing Lambda
        transaction_processing_lambda = LambdaFunction(
            self,
            f"transaction-processing-{environment_suffix}",
            function_name=f"transaction-processing-{environment_suffix}",
            runtime="python3.9",
            handler="transaction_processing.handler",
            role=lambda_role.arn,
            filename=lambda_zip_path,
            source_code_hash=Fn.filebase64sha256(lambda_zip_path),
            timeout=60,
            memory_size=1024,
            vpc_config={
                "subnet_ids": [subnet.id for subnet in private_subnets],
                "security_group_ids": [lambda_sg.id],
            },
            environment={
                "variables": {
                    "ENVIRONMENT": environment_suffix,
                    "TABLE_NAME": transactions_table.name,
                    "DB_CLUSTER_ENDPOINT": aurora_cluster.endpoint,
                    "AUDIT_BUCKET": audit_bucket.id,
                },
            },
        )

        # ===========================
        # 9. Application Load Balancer
        # ===========================

        # ALB
        alb = Lb(
            self,
            f"payment-alb-{environment_suffix}",
            name=f"payment-alb-{environment_suffix}",
            internal=True,
            load_balancer_type="application",
            security_groups=[alb_sg.id],
            subnets=[subnet.id for subnet in private_subnets],
        )

        # Blue Target Group
        blue_tg = LbTargetGroup(
            self,
            f"blue-tg-{environment_suffix}",
            name=f"blue-tg-{environment_suffix}",
            port=80,
            protocol="HTTP",
            vpc_id=vpc.id,
            target_type="lambda",
        )

        # Green Target Group
        green_tg = LbTargetGroup(
            self,
            f"green-tg-{environment_suffix}",
            name=f"green-tg-{environment_suffix}",
            port=80,
            protocol="HTTP",
            vpc_id=vpc.id,
            target_type="lambda",
        )

        # ALB Listener with weighted routing (blue-green)
        alb_listener = LbListener(
            self,
            f"alb-listener-{environment_suffix}",
            load_balancer_arn=alb.arn,
            port=80,
            protocol="HTTP",
            default_action=[
                LbListenerDefaultAction(
                    type="forward",
                    forward=LbListenerDefaultActionForward(
                        target_group=[
                            LbListenerDefaultActionForwardTargetGroup(
                                arn=blue_tg.arn,
                                weight=90,
                            ),
                            LbListenerDefaultActionForwardTargetGroup(
                                arn=green_tg.arn,
                                weight=10,
                            ),
                        ],
                    ),
                ),
            ],
        )

        # ===========================
        # 10. API Gateway with VPC Link
        # ===========================

        # VPC Link
        vpc_link = Apigatewayv2VpcLink(
            self,
            f"vpc-link-{environment_suffix}",
            name=f"payment-vpc-link-{environment_suffix}",
            subnet_ids=[subnet.id for subnet in private_subnets],
            security_group_ids=[alb_sg.id],
        )

        # HTTP API
        api = Apigatewayv2Api(
            self,
            f"payment-api-{environment_suffix}",
            name=f"payment-api-{environment_suffix}",
            protocol_type="HTTP",
        )

        # API Integration
        integration = Apigatewayv2Integration(
            self,
            f"api-integration-{environment_suffix}",
            api_id=api.id,
            integration_type="HTTP_PROXY",
            integration_method="ANY",
            integration_uri=alb_listener.arn,
            connection_type="VPC_LINK",
            connection_id=vpc_link.id,
        )

        # API Route
        Apigatewayv2Route(
            self,
            f"api-route-{environment_suffix}",
            api_id=api.id,
            route_key="ANY /{proxy+}",
            target=f"integrations/{integration.id}",
        )

        # API Stage
        api_stage = Apigatewayv2Stage(
            self,
            f"api-stage-{environment_suffix}",
            api_id=api.id,
            name="production",
            auto_deploy=True,
        )

        # ===========================
        # 11. SNS Topics for Alerting
        # ===========================

        # Failed Transactions Topic
        failed_transactions_topic = SnsTopic(
            self,
            f"failed-transactions-topic-{environment_suffix}",
            name=f"failed-transactions-{environment_suffix}",
            display_name="Failed Transactions Alerts",
        )

        # System Errors Topic
        system_errors_topic = SnsTopic(
            self,
            f"system-errors-topic-{environment_suffix}",
            name=f"system-errors-{environment_suffix}",
            display_name="System Errors Alerts",
        )

        # ===========================
        # 12. CloudWatch Alarms
        # ===========================

        # API Gateway Latency Alarm (99th percentile)
        api_latency_alarm = CloudwatchMetricAlarm(
            self,
            f"api-latency-alarm-{environment_suffix}",
            alarm_name=f"api-latency-p99-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="IntegrationLatency",
            namespace="AWS/ApiGateway",
            period=300,
            threshold=1000,
            extended_statistic="p99",
            alarm_description="API Gateway 99th percentile latency is too high",
            alarm_actions=[system_errors_topic.arn],
            dimensions={
                "ApiId": api.id,
            },
        )
        # Remove conflicting statistic field (only extended_statistic should be used with p99)
        api_latency_alarm.add_override("statistic", None)

        # RDS CPU Alarm
        CloudwatchMetricAlarm(
            self,
            f"rds-cpu-alarm-{environment_suffix}",
            alarm_name=f"rds-cpu-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="CPUUtilization",
            namespace="AWS/RDS",
            period=300,
            statistic="Average",
            threshold=80,
            alarm_description="RDS CPU utilization is too high",
            alarm_actions=[system_errors_topic.arn],
            dimensions={
                "DBClusterIdentifier": aurora_cluster.cluster_identifier,
            },
        )

        # DynamoDB Throttle Alarm
        CloudwatchMetricAlarm(
            self,
            f"dynamodb-throttle-alarm-{environment_suffix}",
            alarm_name=f"dynamodb-throttle-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="UserErrors",
            namespace="AWS/DynamoDB",
            period=300,
            statistic="Sum",
            threshold=10,
            alarm_description="DynamoDB throttling detected",
            alarm_actions=[system_errors_topic.arn],
            dimensions={
                "TableName": transactions_table.name,
            },
        )

        # ===========================
        # 13. CloudWatch Dashboard
        # ===========================

        dashboard_body = json.dumps({
            "widgets": [
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/ApiGateway", "IntegrationLatency", {"stat": "p99"}],
                        ],
                        "period": 300,
                        "stat": "Average",
                        "region": aws_region,
                        "title": "API Response Time (p99)",
                    },
                },
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/ApiGateway", "5XXError", {"stat": "Sum"}],
                            [".", "4XXError", {"stat": "Sum"}],
                        ],
                        "period": 300,
                        "stat": "Sum",
                        "region": aws_region,
                        "title": "API Error Rates",
                    },
                },
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/RDS", "CPUUtilization"],
                            [".", "DatabaseConnections"],
                        ],
                        "period": 300,
                        "stat": "Average",
                        "region": aws_region,
                        "title": "Database Performance",
                    },
                },
            ],
        })

        CloudwatchDashboard(
            self,
            f"payment-dashboard-{environment_suffix}",
            dashboard_name=f"payment-processing-{environment_suffix}",
            dashboard_body=dashboard_body,
        )

        # ===========================
        # 14. Secrets Manager
        # ===========================

        # Database credentials secret
        db_secret = SecretsmanagerSecret(
            self,
            f"db-secret-{environment_suffix}",
            name=f"payment-db-credentials-{environment_suffix}",
            description="Database credentials for payment processing",
            recovery_window_in_days=7,
        )

        # Secret version
        SecretsmanagerSecretVersion(
            self,
            f"db-secret-version-{environment_suffix}",
            secret_id=db_secret.id,
            secret_string=json.dumps({
                "username": "admin",
                "password": "ChangeMeToSecurePassword123!",
                "engine": "postgres",
                "host": aurora_cluster.endpoint,
                "port": 5432,
                "dbname": "payments",
            }),
        )

        # Lambda rotation function role
        rotation_lambda_role = IamRole(
            self,
            f"rotation-lambda-role-{environment_suffix}",
            name=f"rotation-lambda-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "lambda.amazonaws.com"},
                    "Action": "sts:AssumeRole",
                }],
            }),
        )

        IamRolePolicyAttachment(
            self,
            f"rotation-lambda-basic-{environment_suffix}",
            role=rotation_lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
        )

        IamRolePolicyAttachment(
            self,
            f"rotation-lambda-vpc-{environment_suffix}",
            role=rotation_lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole",
        )

        # Rotation Lambda policy
        rotation_policy = IamPolicy(
            self,
            f"rotation-policy-{environment_suffix}",
            name=f"rotation-policy-{environment_suffix}",
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "secretsmanager:DescribeSecret",
                            "secretsmanager:GetSecretValue",
                            "secretsmanager:PutSecretValue",
                            "secretsmanager:UpdateSecretVersionStage",
                        ],
                        "Resource": db_secret.arn,
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "secretsmanager:GetRandomPassword",
                        ],
                        "Resource": "*",
                    },
                ],
            }),
        )

        IamRolePolicyAttachment(
            self,
            f"rotation-policy-attachment-{environment_suffix}",
            role=rotation_lambda_role.name,
            policy_arn=rotation_policy.arn,
        )

        # Rotation Lambda function
        rotation_lambda = LambdaFunction(
            self,
            f"rotation-lambda-{environment_suffix}",
            function_name=f"db-secret-rotation-{environment_suffix}",
            runtime="python3.9",
            handler="rotation_handler.handler",
            role=rotation_lambda_role.arn,
            filename=lambda_zip_path,
            source_code_hash=Fn.filebase64sha256(lambda_zip_path),
            timeout=30,
            vpc_config={
                "subnet_ids": [subnet.id for subnet in private_subnets],
                "security_group_ids": [lambda_sg.id],
            },
        )

        # Allow Secrets Manager to invoke the rotation Lambda
        LambdaPermission(
            self,
            f"rotation-lambda-permission-{environment_suffix}",
            statement_id="AllowSecretsManagerInvoke",
            action="lambda:InvokeFunction",
            function_name=rotation_lambda.function_name,
            principal="secretsmanager.amazonaws.com",
        )

        # Secret rotation configuration
        SecretsmanagerSecretRotation(
            self,
            f"db-secret-rotation-{environment_suffix}",
            secret_id=db_secret.id,
            rotation_lambda_arn=rotation_lambda.arn,
            rotation_rules={
                "automatically_after_days": 30,
            },
        )

        # ===========================
        # 15. Systems Manager Parameters
        # ===========================

        # Store configuration values
        SsmParameter(
            self,
            f"api-endpoint-param-{environment_suffix}",
            name=f"/payment/{environment_suffix}/api-endpoint",
            type="String",
            value=api_stage.invoke_url,
            description="API Gateway endpoint URL",
        )

        SsmParameter(
            self,
            f"db-endpoint-param-{environment_suffix}",
            name=f"/payment/{environment_suffix}/db-endpoint",
            type="String",
            value=aurora_cluster.endpoint,
            description="RDS cluster endpoint",
        )

        SsmParameter(
            self,
            f"table-name-param-{environment_suffix}",
            name=f"/payment/{environment_suffix}/table-name",
            type="String",
            value=transactions_table.name,
            description="DynamoDB transactions table name",
        )

        # ===========================
        # Outputs
        # ===========================

        TerraformOutput(
            self,
            "vpc_id",
            value=vpc.id,
            description="VPC ID",
        )

        TerraformOutput(
            self,
            "aurora_endpoint",
            value=aurora_cluster.endpoint,
            description="Aurora cluster endpoint",
        )

        TerraformOutput(
            self,
            "api_endpoint",
            value=api_stage.invoke_url,
            description="API Gateway endpoint URL",
        )

        TerraformOutput(
            self,
            "alb_dns_name",
            value=alb.dns_name,
            description="Application Load Balancer DNS name",
        )

        TerraformOutput(
            self,
            "transactions_table",
            value=transactions_table.name,
            description="DynamoDB transactions table name",
        )

        TerraformOutput(
            self,
            "audit_bucket",
            value=audit_bucket.id,
            description="S3 audit logs bucket name",
        )
