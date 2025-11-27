# CDKTF Python Implementation - Payment Processing Migration

This implementation provides a complete CDKTF Python solution for migrating payment processing infrastructure from development to production with automated validation and blue-green deployment capabilities.

## File: lib/tap_stack.py

```python
from constructs import Construct
from cdktf import TerraformStack, TerraformOutput
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.data_aws_vpc import DataAwsVpc
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.security_group import SecurityGroup, SecurityGroupIngress, SecurityGroupEgress
from cdktf_cdktf_provider_aws.kms_key import KmsKey
from cdktf_cdktf_provider_aws.kms_alias import KmsAlias
from cdktf_cdktf_provider_aws.rds_cluster import RdsCluster
from cdktf_cdktf_provider_aws.rds_cluster_instance import RdsClusterInstance
from cdktf_cdktf_provider_aws.db_subnet_group import DbSubnetGroup
from cdktf_cdktf_provider_aws.dynamodb_table import DynamodbTable, DynamodbTableAttribute, DynamodbTableGlobalSecondaryIndex
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_versioning import S3BucketVersioning
from cdktf_cdktf_provider_aws.s3_bucket_server_side_encryption_configuration import (
    S3BucketServerSideEncryptionConfiguration,
    S3BucketServerSideEncryptionConfigurationRuleA,
    S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA
)
from cdktf_cdktf_provider_aws.s3_bucket_replication_configuration import (
    S3BucketReplicationConfiguration,
    S3BucketReplicationConfigurationRule,
    S3BucketReplicationConfigurationRuleDestination,
    S3BucketReplicationConfigurationRuleFilter
)
from cdktf_cdktf_provider_aws.s3_bucket_lifecycle_configuration import (
    S3BucketLifecycleConfiguration,
    S3BucketLifecycleConfigurationRule,
    S3BucketLifecycleConfigurationRuleTransition
)
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy import IamRolePolicy
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.lambda_function import LambdaFunction
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
from cdktf_cdktf_provider_aws.cloudwatch_dashboard import CloudwatchDashboard
from cdktf_cdktf_provider_aws.cloudwatch_metric_alarm import CloudwatchMetricAlarm
from cdktf_cdktf_provider_aws.sns_topic import SnsTopic
from cdktf_cdktf_provider_aws.lb import Lb
from cdktf_cdktf_provider_aws.lb_target_group import LbTargetGroup, LbTargetGroupHealthCheck
from cdktf_cdktf_provider_aws.lb_listener import LbListener, LbListenerDefaultAction
from cdktf_cdktf_provider_aws.vpc_endpoint import VpcEndpoint
import json


class TapStack(TerraformStack):
    def __init__(self, scope: Construct, id: str, environment_suffix: str):
        super().__init__(scope, id)

        # AWS Provider
        AwsProvider(self, "aws",
            region="us-east-1",
            default_tags=[{
                "tags": {
                    "Environment": "production",
                    "CostCenter": "payments",
                    "ManagedBy": "CDKTF",
                    "EnvironmentSuffix": environment_suffix
                }
            }]
        )

        # Secondary provider for S3 replication
        aws_west = AwsProvider(self, "aws_west",
            alias="west",
            region="us-west-2"
        )

        # Import existing dev VPC for reference
        dev_vpc = DataAwsVpc(self, "dev_vpc",
            id="vpc-0a1b2c3d4e5f"
        )

        # KMS Key for encryption
        kms_key = KmsKey(self, f"kms_key_{environment_suffix}",
            description=f"KMS key for payment processing encryption {environment_suffix}",
            enable_key_rotation=True,
            deletion_window_in_days=10,
            tags={
                "Name": f"payment-kms-{environment_suffix}"
            }
        )

        KmsAlias(self, f"kms_alias_{environment_suffix}",
            name=f"alias/payment-processing-{environment_suffix}",
            target_key_id=kms_key.key_id
        )

        # Production VPC
        prod_vpc = Vpc(self, f"prod_vpc_{environment_suffix}",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                "Name": f"payment-prod-vpc-{environment_suffix}",
                "Environment": "production"
            }
        )

        # Private Subnets across 3 AZs
        private_subnets = []
        azs = ["us-east-1a", "us-east-1b", "us-east-1c"]
        for idx, az in enumerate(azs):
            subnet = Subnet(self, f"private_subnet_{idx}_{environment_suffix}",
                vpc_id=prod_vpc.id,
                cidr_block=f"10.0.{idx+1}.0/24",
                availability_zone=az,
                tags={
                    "Name": f"payment-private-subnet-{idx+1}-{environment_suffix}",
                    "Type": "Private"
                }
            )
            private_subnets.append(subnet)

        # Security Group for RDS
        rds_sg = SecurityGroup(self, f"rds_sg_{environment_suffix}",
            name=f"payment-rds-sg-{environment_suffix}",
            description="Security group for RDS Aurora PostgreSQL",
            vpc_id=prod_vpc.id,
            ingress=[
                SecurityGroupIngress(
                    from_port=5432,
                    to_port=5432,
                    protocol="tcp",
                    cidr_blocks=["10.0.0.0/16"],
                    description="PostgreSQL access from VPC"
                )
            ],
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound"
                )
            ],
            tags={
                "Name": f"payment-rds-sg-{environment_suffix}"
            }
        )

        # Security Group for Lambda
        lambda_sg = SecurityGroup(self, f"lambda_sg_{environment_suffix}",
            name=f"payment-lambda-sg-{environment_suffix}",
            description="Security group for Lambda functions",
            vpc_id=prod_vpc.id,
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound"
                )
            ],
            tags={
                "Name": f"payment-lambda-sg-{environment_suffix}"
            }
        )

        # Security Group for ALB
        alb_sg = SecurityGroup(self, f"alb_sg_{environment_suffix}",
            name=f"payment-alb-sg-{environment_suffix}",
            description="Security group for Application Load Balancer",
            vpc_id=prod_vpc.id,
            ingress=[
                SecurityGroupIngress(
                    from_port=80,
                    to_port=80,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"],
                    description="HTTP access"
                ),
                SecurityGroupIngress(
                    from_port=443,
                    to_port=443,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"],
                    description="HTTPS access"
                )
            ],
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound"
                )
            ],
            tags={
                "Name": f"payment-alb-sg-{environment_suffix}"
            }
        )

        # DB Subnet Group
        db_subnet_group = DbSubnetGroup(self, f"db_subnet_group_{environment_suffix}",
            name=f"payment-db-subnet-group-{environment_suffix}",
            subnet_ids=[subnet.id for subnet in private_subnets],
            tags={
                "Name": f"payment-db-subnet-group-{environment_suffix}"
            }
        )

        # RDS Aurora PostgreSQL Cluster
        rds_cluster = RdsCluster(self, f"rds_cluster_{environment_suffix}",
            cluster_identifier=f"payment-aurora-cluster-{environment_suffix}",
            engine="aurora-postgresql",
            engine_version="15.3",
            engine_mode="provisioned",
            database_name="payments",
            master_username="admin",
            master_password="ChangeMe123!",  # In production, use AWS Secrets Manager
            db_subnet_group_name=db_subnet_group.name,
            vpc_security_group_ids=[rds_sg.id],
            backup_retention_period=1,
            preferred_backup_window="03:00-04:00",
            skip_final_snapshot=True,
            storage_encrypted=True,
            kms_key_id=kms_key.arn,
            enabled_cloudwatch_logs_exports=["postgresql"],
            tags={
                "Name": f"payment-aurora-cluster-{environment_suffix}"
            }
        )

        # RDS Cluster Instances (Multi-AZ)
        for idx in range(2):
            RdsClusterInstance(self, f"rds_instance_{idx}_{environment_suffix}",
                identifier=f"payment-aurora-instance-{idx+1}-{environment_suffix}",
                cluster_identifier=rds_cluster.id,
                instance_class="db.t3.medium",
                engine="aurora-postgresql",
                publicly_accessible=False,
                tags={
                    "Name": f"payment-aurora-instance-{idx+1}-{environment_suffix}"
                }
            )

        # DynamoDB Table for Session Management
        session_table = DynamodbTable(self, f"session_table_{environment_suffix}",
            name=f"payment-sessions-{environment_suffix}",
            billing_mode="PAY_PER_REQUEST",
            hash_key="session_id",
            range_key="timestamp",
            attribute=[
                DynamodbTableAttribute(name="session_id", type="S"),
                DynamodbTableAttribute(name="timestamp", type="N"),
                DynamodbTableAttribute(name="user_id", type="S"),
                DynamodbTableAttribute(name="status", type="S")
            ],
            global_secondary_index=[
                DynamodbTableGlobalSecondaryIndex(
                    name="UserIdIndex",
                    hash_key="user_id",
                    range_key="timestamp",
                    projection_type="ALL"
                ),
                DynamodbTableGlobalSecondaryIndex(
                    name="StatusIndex",
                    hash_key="status",
                    range_key="timestamp",
                    projection_type="ALL"
                )
            ],
            point_in_time_recovery={
                "enabled": True
            },
            server_side_encryption={
                "enabled": True,
                "kms_key_arn": kms_key.arn
            },
            tags={
                "Name": f"payment-sessions-{environment_suffix}"
            }
        )

        # S3 Bucket for Audit Logs (Primary)
        audit_bucket = S3Bucket(self, f"audit_bucket_{environment_suffix}",
            bucket=f"payment-audit-logs-{environment_suffix}",
            force_destroy=True,
            tags={
                "Name": f"payment-audit-logs-{environment_suffix}"
            }
        )

        # S3 Bucket Versioning
        S3BucketVersioning(self, f"audit_bucket_versioning_{environment_suffix}",
            bucket=audit_bucket.id,
            versioning_configuration={
                "status": "Enabled"
            }
        )

        # S3 Bucket Encryption
        S3BucketServerSideEncryptionConfiguration(
            self, f"audit_bucket_encryption_{environment_suffix}",
            bucket=audit_bucket.id,
            rule=[
                S3BucketServerSideEncryptionConfigurationRuleA(
                    apply_server_side_encryption_by_default=
                    S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA(
                        sse_algorithm="AES256"
                    ),
                    bucket_key_enabled=True
                )
            ]
        )

        # S3 Lifecycle Policy
        S3BucketLifecycleConfiguration(
            self, f"audit_bucket_lifecycle_{environment_suffix}",
            bucket=audit_bucket.id,
            rule=[
                S3BucketLifecycleConfigurationRule(
                    id="glacier-transition",
                    status="Enabled",
                    transition=[
                        S3BucketLifecycleConfigurationRuleTransition(
                            days=90,
                            storage_class="GLACIER"
                        )
                    ]
                )
            ]
        )

        # S3 Bucket for Replication (us-west-2)
        replica_bucket = S3Bucket(self, f"replica_bucket_{environment_suffix}",
            bucket=f"payment-audit-logs-replica-{environment_suffix}",
            provider=aws_west,
            force_destroy=True,
            tags={
                "Name": f"payment-audit-logs-replica-{environment_suffix}"
            }
        )

        # S3 Bucket Versioning for Replica
        S3BucketVersioning(self, f"replica_bucket_versioning_{environment_suffix}",
            bucket=replica_bucket.id,
            provider=aws_west,
            versioning_configuration={
                "status": "Enabled"
            }
        )

        # IAM Role for S3 Replication
        replication_role = IamRole(self, f"replication_role_{environment_suffix}",
            name=f"payment-s3-replication-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "s3.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={
                "Name": f"payment-s3-replication-role-{environment_suffix}"
            }
        )

        IamRolePolicy(self, f"replication_policy_{environment_suffix}",
            name=f"payment-s3-replication-policy-{environment_suffix}",
            role=replication_role.id,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:GetReplicationConfiguration",
                            "s3:ListBucket"
                        ],
                        "Resource": audit_bucket.arn
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:GetObjectVersionForReplication",
                            "s3:GetObjectVersionAcl"
                        ],
                        "Resource": f"{audit_bucket.arn}/*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:ReplicateObject",
                            "s3:ReplicateDelete"
                        ],
                        "Resource": f"{replica_bucket.arn}/*"
                    }
                ]
            })
        )

        # S3 Replication Configuration
        S3BucketReplicationConfiguration(
            self, f"audit_bucket_replication_{environment_suffix}",
            bucket=audit_bucket.id,
            role=replication_role.arn,
            rule=[
                S3BucketReplicationConfigurationRule(
                    id="replicate-all",
                    status="Enabled",
                    priority=1,
                    filter=S3BucketReplicationConfigurationRuleFilter(
                        prefix=""
                    ),
                    destination=S3BucketReplicationConfigurationRuleDestination(
                        bucket=replica_bucket.arn,
                        storage_class="STANDARD"
                    ),
                    delete_marker_replication={
                        "status": "Enabled"
                    }
                )
            ],
            depends_on=[replication_role]
        )

        # IAM Role for Lambda
        lambda_role = IamRole(self, f"lambda_role_{environment_suffix}",
            name=f"payment-lambda-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "lambda.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={
                "Name": f"payment-lambda-role-{environment_suffix}"
            }
        )

        # Lambda Basic Execution Policy
        IamRolePolicyAttachment(self, f"lambda_basic_execution_{environment_suffix}",
            role=lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        )

        # Lambda VPC Execution Policy
        IamRolePolicyAttachment(self, f"lambda_vpc_execution_{environment_suffix}",
            role=lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
        )

        # Lambda Custom Policy for DynamoDB and S3
        IamRolePolicy(self, f"lambda_custom_policy_{environment_suffix}",
            name=f"payment-lambda-custom-policy-{environment_suffix}",
            role=lambda_role.id,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "dynamodb:GetItem",
                            "dynamodb:PutItem",
                            "dynamodb:UpdateItem",
                            "dynamodb:Query",
                            "dynamodb:Scan"
                        ],
                        "Resource": [
                            session_table.arn,
                            f"{session_table.arn}/index/*"
                        ]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:PutObject",
                            "s3:GetObject"
                        ],
                        "Resource": f"{audit_bucket.arn}/*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "rds:DescribeDBClusters",
                            "rds:DescribeDBInstances"
                        ],
                        "Resource": rds_cluster.arn
                    }
                ]
            })
        )

        # CloudWatch Log Group for Lambda
        lambda_log_group = CloudwatchLogGroup(self, f"lambda_log_group_{environment_suffix}",
            name=f"/aws/lambda/payment-processor-{environment_suffix}",
            retention_in_days=7,
            tags={
                "Name": f"payment-processor-logs-{environment_suffix}"
            }
        )

        # Lambda Function for Payment Processing
        payment_lambda = LambdaFunction(self, f"payment_lambda_{environment_suffix}",
            function_name=f"payment-processor-{environment_suffix}",
            runtime="python3.9",
            handler="index.handler",
            role=lambda_role.arn,
            filename="lib/lambda/payment_processor.zip",
            source_code_hash="${filebase64sha256(\"lib/lambda/payment_processor.zip\")}",
            timeout=30,
            memory_size=512,
            reserved_concurrent_executions=10,
            vpc_config={
                "subnet_ids": [subnet.id for subnet in private_subnets],
                "security_group_ids": [lambda_sg.id]
            },
            environment={
                "variables": {
                    "ENVIRONMENT": "production",
                    "SESSION_TABLE": session_table.name,
                    "AUDIT_BUCKET": audit_bucket.id,
                    "DB_CLUSTER_ENDPOINT": rds_cluster.endpoint,
                    "DB_NAME": "payments"
                }
            },
            tags={
                "Name": f"payment-processor-{environment_suffix}"
            },
            depends_on=[lambda_log_group]
        )

        # Lambda Function for Parameter Migration
        param_migration_lambda = LambdaFunction(self, f"param_migration_lambda_{environment_suffix}",
            function_name=f"parameter-migration-{environment_suffix}",
            runtime="python3.9",
            handler="index.handler",
            role=lambda_role.arn,
            filename="lib/lambda/parameter_migration.zip",
            source_code_hash="${filebase64sha256(\"lib/lambda/parameter_migration.zip\")}",
            timeout=300,
            memory_size=256,
            environment={
                "variables": {
                    "SOURCE_PREFIX": "/dev",
                    "TARGET_PREFIX": "/prod"
                }
            },
            tags={
                "Name": f"parameter-migration-{environment_suffix}"
            }
        )

        # IAM Policy for Parameter Store
        IamRolePolicy(self, f"param_migration_policy_{environment_suffix}",
            name=f"parameter-migration-policy-{environment_suffix}",
            role=lambda_role.id,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "ssm:GetParameter",
                            "ssm:GetParameters",
                            "ssm:GetParametersByPath"
                        ],
                        "Resource": "arn:aws:ssm:us-east-1:*:parameter/dev/*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "ssm:PutParameter",
                            "ssm:AddTagsToResource"
                        ],
                        "Resource": "arn:aws:ssm:us-east-1:*:parameter/prod/*"
                    }
                ]
            })
        )

        # VPC Endpoints
        s3_endpoint = VpcEndpoint(self, f"s3_endpoint_{environment_suffix}",
            vpc_id=prod_vpc.id,
            service_name="com.amazonaws.us-east-1.s3",
            vpc_endpoint_type="Gateway",
            tags={
                "Name": f"payment-s3-endpoint-{environment_suffix}"
            }
        )

        dynamodb_endpoint = VpcEndpoint(self, f"dynamodb_endpoint_{environment_suffix}",
            vpc_id=prod_vpc.id,
            service_name="com.amazonaws.us-east-1.dynamodb",
            vpc_endpoint_type="Gateway",
            tags={
                "Name": f"payment-dynamodb-endpoint-{environment_suffix}"
            }
        )

        # Application Load Balancer
        alb = Lb(self, f"alb_{environment_suffix}",
            name=f"payment-alb-{environment_suffix}",
            internal=False,
            load_balancer_type="application",
            security_groups=[alb_sg.id],
            subnets=[subnet.id for subnet in private_subnets],
            enable_deletion_protection=False,
            enable_http2=True,
            tags={
                "Name": f"payment-alb-{environment_suffix}"
            }
        )

        # Target Groups for Blue-Green Deployment
        blue_target_group = LbTargetGroup(self, f"blue_target_group_{environment_suffix}",
            name=f"payment-blue-tg-{environment_suffix}",
            port=80,
            protocol="HTTP",
            vpc_id=prod_vpc.id,
            target_type="lambda",
            health_check=LbTargetGroupHealthCheck(
                enabled=True,
                path="/health",
                protocol="HTTP",
                matcher="200",
                interval=30,
                timeout=5,
                healthy_threshold=2,
                unhealthy_threshold=2
            ),
            deregistration_delay=30,
            tags={
                "Name": f"payment-blue-tg-{environment_suffix}",
                "Environment": "blue"
            }
        )

        green_target_group = LbTargetGroup(self, f"green_target_group_{environment_suffix}",
            name=f"payment-green-tg-{environment_suffix}",
            port=80,
            protocol="HTTP",
            vpc_id=prod_vpc.id,
            target_type="lambda",
            health_check=LbTargetGroupHealthCheck(
                enabled=True,
                path="/health",
                protocol="HTTP",
                matcher="200",
                interval=30,
                timeout=5,
                healthy_threshold=2,
                unhealthy_threshold=2
            ),
            deregistration_delay=30,
            tags={
                "Name": f"payment-green-tg-{environment_suffix}",
                "Environment": "green"
            }
        )

        # ALB Listener
        LbListener(self, f"alb_listener_{environment_suffix}",
            load_balancer_arn=alb.arn,
            port=80,
            protocol="HTTP",
            default_action=[
                LbListenerDefaultAction(
                    type="forward",
                    target_group_arn=blue_target_group.arn
                )
            ],
            tags={
                "Name": f"payment-alb-listener-{environment_suffix}"
            }
        )

        # SNS Topic for Alarms
        alarm_topic = SnsTopic(self, f"alarm_topic_{environment_suffix}",
            name=f"payment-alarms-{environment_suffix}",
            tags={
                "Name": f"payment-alarms-{environment_suffix}"
            }
        )

        # CloudWatch Alarm for RDS CPU
        CloudwatchMetricAlarm(self, f"rds_cpu_alarm_{environment_suffix}",
            alarm_name=f"payment-rds-cpu-high-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="CPUUtilization",
            namespace="AWS/RDS",
            period=300,
            statistic="Average",
            threshold=80,
            alarm_description="Alert when RDS CPU exceeds 80%",
            alarm_actions=[alarm_topic.arn],
            dimensions={
                "DBClusterIdentifier": rds_cluster.cluster_identifier
            },
            tags={
                "Name": f"payment-rds-cpu-alarm-{environment_suffix}"
            }
        )

        # CloudWatch Alarm for Lambda Errors
        CloudwatchMetricAlarm(self, f"lambda_error_alarm_{environment_suffix}",
            alarm_name=f"payment-lambda-errors-high-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="Errors",
            namespace="AWS/Lambda",
            period=60,
            statistic="Sum",
            threshold=5,
            alarm_description="Alert when Lambda errors exceed 5 per minute",
            alarm_actions=[alarm_topic.arn],
            dimensions={
                "FunctionName": payment_lambda.function_name
            },
            tags={
                "Name": f"payment-lambda-error-alarm-{environment_suffix}"
            }
        )

        # CloudWatch Dashboard
        dashboard_body = json.dumps({
            "widgets": [
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/RDS", "CPUUtilization", {"stat": "Average"}],
                            [".", "DatabaseConnections", {"stat": "Sum"}],
                            [".", "FreeableMemory", {"stat": "Average"}]
                        ],
                        "period": 300,
                        "stat": "Average",
                        "region": "us-east-1",
                        "title": "RDS Metrics"
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
                        "stat": "Sum",
                        "region": "us-east-1",
                        "title": "Lambda Metrics"
                    }
                }
            ]
        })

        CloudwatchDashboard(self, f"dashboard_{environment_suffix}",
            dashboard_name=f"payment-processing-{environment_suffix}",
            dashboard_body=dashboard_body
        )

        # Outputs
        TerraformOutput(self, "vpc_id",
            value=prod_vpc.id
        )

        TerraformOutput(self, "rds_cluster_endpoint",
            value=rds_cluster.endpoint
        )

        TerraformOutput(self, "dynamodb_table_name",
            value=session_table.name
        )

        TerraformOutput(self, "audit_bucket_name",
            value=audit_bucket.id
        )

        TerraformOutput(self, "payment_lambda_arn",
            value=payment_lambda.arn
        )

        TerraformOutput(self, "alb_dns_name",
            value=alb.dns_name
        )
```

## File: lib/lambda/payment_processor.py

```python
import json
import os
import boto3
from datetime import datetime
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
s3 = boto3.client('s3')

SESSION_TABLE = os.environ['SESSION_TABLE']
AUDIT_BUCKET = os.environ['AUDIT_BUCKET']


def handler(event, context):
    """Payment processor Lambda function"""
    try:
        body = json.loads(event.get('body', '{}'))
        payment_id = body.get('payment_id')
        user_id = body.get('user_id')
        amount = Decimal(str(body.get('amount', 0)))

        if not payment_id or not user_id:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Missing required fields'})
            }

        # Record session in DynamoDB
        table = dynamodb.Table(SESSION_TABLE)
        timestamp = int(datetime.now().timestamp())

        table.put_item(
            Item={
                'session_id': payment_id,
                'timestamp': timestamp,
                'user_id': user_id,
                'status': 'processing',
                'amount': amount,
                'created_at': datetime.now().isoformat()
            }
        )

        # Log to S3
        audit_log = {
            'payment_id': payment_id,
            'user_id': user_id,
            'amount': float(amount),
            'timestamp': timestamp,
            'status': 'success'
        }

        s3.put_object(
            Bucket=AUDIT_BUCKET,
            Key=f"payments/{datetime.now().strftime('%Y/%m/%d')}/{payment_id}.json",
            Body=json.dumps(audit_log)
        )

        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'Payment processed', 'payment_id': payment_id})
        }

    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
```

## File: lib/lambda/parameter_migration.py

```python
import json
import os
import boto3
from botocore.exceptions import ClientError

ssm = boto3.client('ssm')

SOURCE_PREFIX = os.environ.get('SOURCE_PREFIX', '/dev')
TARGET_PREFIX = os.environ.get('TARGET_PREFIX', '/prod')

EXCLUDED_PARAMS = ['password', 'secret', 'api_key', 'token']


def handler(event, context):
    """Migrates parameters from dev to prod"""
    migrated = []
    skipped = []
    errors = []

    try:
        paginator = ssm.get_paginator('describe_parameters')

        for page in paginator.paginate(
            ParameterFilters=[{'Key': 'Name', 'Option': 'BeginsWith', 'Values': [SOURCE_PREFIX]}]
        ):
            for param in page['Parameters']:
                source_name = param['Name']

                if any(excluded in source_name.lower() for excluded in EXCLUDED_PARAMS):
                    skipped.append({'name': source_name, 'reason': 'sensitive'})
                    continue

                try:
                    response = ssm.get_parameter(Name=source_name, WithDecryption=False)
                    param_value = response['Parameter']['Value']
                    param_type = response['Parameter']['Type']

                    target_name = source_name.replace(SOURCE_PREFIX, TARGET_PREFIX, 1)

                    ssm.put_parameter(
                        Name=target_name,
                        Value=param_value,
                        Type=param_type,
                        Overwrite=True
                    )

                    migrated.append({'source': source_name, 'target': target_name})

                except ClientError as e:
                    errors.append({'parameter': source_name, 'error': str(e)})

        return {
            'statusCode': 200,
            'summary': {
                'migrated': len(migrated),
                'skipped': len(skipped),
                'errors': len(errors)
            },
            'migrated': migrated,
            'skipped': skipped
        }

    except Exception as e:
        return {'statusCode': 500, 'error': str(e)}
```

## File: lib/README.md

```markdown
# Payment Processing Migration - CDKTF Python

Infrastructure automation for migrating payment processing systems from development to production.

## Architecture

- VPC with 3 AZs and private subnets
- RDS Aurora PostgreSQL Multi-AZ with KMS encryption
- DynamoDB with GSIs and point-in-time recovery
- Lambda functions for payment processing and parameter migration
- S3 with cross-region replication to us-west-2
- ALB for blue-green deployment
- CloudWatch dashboards and alarms
- VPC endpoints for S3 and DynamoDB

## Prerequisites

- Python 3.9+
- Node.js 18+
- CDKTF CLI 0.19+
- AWS CLI configured

## Installation

```bash
pip install -r requirements.txt
npm install -g cdktf-cli
cdktf get
```

## Deployment

```bash
export ENVIRONMENT_SUFFIX="your-suffix"

# Create Lambda packages
mkdir -p lib/lambda
cd lib/lambda && zip payment_processor.zip payment_processor.py
cd lib/lambda && zip parameter_migration.zip parameter_migration.py

# Deploy
cdktf synth
cdktf deploy
```

## Blue-Green Deployment

Switch ALB listener between blue and green target groups:

```bash
aws elbv2 modify-listener \
  --listener-arn <listener-arn> \
  --default-actions Type=forward,TargetGroupArn=<green-target-group-arn>
```

## Parameter Migration

```bash
aws lambda invoke \
  --function-name parameter-migration-${ENVIRONMENT_SUFFIX} \
  response.json
```

## Monitoring

CloudWatch dashboard: `payment-processing-${ENVIRONMENT_SUFFIX}`

Alarms:
- RDS CPU > 80%
- Lambda errors > 5/min

## Cleanup

```bash
cdktf destroy
```
```
