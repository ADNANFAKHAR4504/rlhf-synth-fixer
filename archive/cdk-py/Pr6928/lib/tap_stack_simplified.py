"""Simplified single-region disaster recovery stack for testing"""
from aws_cdk import (
    Stack,
    aws_ec2 as ec2,
    aws_rds as rds,
    aws_dynamodb as dynamodb,
    aws_lambda as lambda_,
    aws_s3 as s3,
    aws_backup as backup,
    aws_kms as kms,
    aws_iam as iam,
    aws_events as events,
    RemovalPolicy,
    Duration,
)
from constructs import Construct
import os


class SimplifiedDRStack(Stack):
    """Simplified single-region DR stack for deployment testing"""

    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        environment_suffix = self.node.try_get_context("environmentSuffix") or "dev"
        
        # 1. KMS Key
        kms_key = kms.Key(
            self, f"DRKey{environment_suffix}",
            description=f"DR encryption key {environment_suffix}",
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.DESTROY
        )
        
        # 2. VPC (single region, simplified)
        vpc = ec2.Vpc(
            self, f"DRVPC{environment_suffix}",
            vpc_name=f"dr-vpc-{environment_suffix}",
            ip_addresses=ec2.IpAddresses.cidr("10.0.0.0/16"),
            max_azs=2,
            nat_gateways=1,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name="Private",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name="Public",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name="Isolated",
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                    cidr_mask=24
                ),
            ],
        )
        
        # 3. Aurora (standard cluster, no global database)
        aurora_cluster = rds.DatabaseCluster(
            self, f"DRAurora{environment_suffix}",
            engine=rds.DatabaseClusterEngine.aurora_postgres(
                version=rds.AuroraPostgresEngineVersion.VER_14_6
            ),
            credentials=rds.Credentials.from_generated_secret("dbadmin"),
            instance_props=rds.InstanceProps(
                instance_type=ec2.InstanceType.of(
                    ec2.InstanceClass.BURSTABLE3,
                    ec2.InstanceSize.MEDIUM
                ),
                vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_ISOLATED),
                vpc=vpc,
            ),
            instances=1,
            storage_encrypted=True,
            storage_encryption_key=kms_key,
            removal_policy=RemovalPolicy.DESTROY,
            deletion_protection=False,
        )
        
        # 4. DynamoDB (single region table)
        dynamodb_table = dynamodb.TableV2(
            self, f"DRTable{environment_suffix}",
            table_name=f"dr-transactions-{environment_suffix}",
            partition_key=dynamodb.Attribute(
                name="transactionId",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="timestamp",
                type=dynamodb.AttributeType.STRING
            ),
            billing=dynamodb.Billing.on_demand(),
            point_in_time_recovery=True,
            dynamo_stream=dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
            encryption=dynamodb.TableEncryptionV2.customer_managed_key(kms_key),
            removal_policy=RemovalPolicy.DESTROY,
        )
        
        # 5. S3 (single bucket, no replication)
        # Note: bucket_name includes account for uniqueness, but only when account is resolved (not during unit tests)
        bucket_name_value = None
        if self.account and not "${" in str(self.account):
            bucket_name_value = f"dr-documents-{environment_suffix}-{self.account}".lower()

        s3_bucket = s3.Bucket(
            self, f"DRBucket{environment_suffix}",
            bucket_name=bucket_name_value,  # Let CDK auto-generate if account not resolved
            encryption=s3.BucketEncryption.KMS,
            encryption_key=kms_key,
            versioned=True,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
        )
        
        # 6. Lambda Function
        lambda_role = iam.Role(
            self, f"LambdaRole{environment_suffix}",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaVPCAccessExecutionRole"
                )
            ]
        )
        
        dynamodb_table.grant_read_write_data(lambda_role)
        
        lambda_fn = lambda_.Function(
            self, f"DRLambda{environment_suffix}",
            function_name=f"dr-transaction-processor-{environment_suffix}",
            runtime=lambda_.Runtime.PYTHON_3_11,
            code=lambda_.Code.from_asset("lib/lambda"),
            handler="index.handler",
            environment={
                "TABLE_NAME": dynamodb_table.table_name,
                "ENVIRONMENT_SUFFIX": environment_suffix,
            },
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
            timeout=Duration.seconds(30),
            role=lambda_role,
        )
        
        # 7. Backup Plan (simplified)
        backup_vault = backup.BackupVault(
            self, f"DRBackupVault{environment_suffix}",
            backup_vault_name=f"dr-backup-vault-{environment_suffix}",
            encryption_key=kms_key,
            removal_policy=RemovalPolicy.DESTROY,
        )
        
        backup_plan = backup.BackupPlan(
            self, f"DRBackupPlan{environment_suffix}",
            backup_plan_name=f"dr-backup-plan-{environment_suffix}",
            backup_vault=backup_vault,
        )
        
        backup_plan.add_rule(
            backup.BackupPlanRule(
                rule_name="HourlyBackup",
                schedule_expression=events.Schedule.cron(
                    hour="*",
                    minute="0",
                ),
                start_window=Duration.hours(1),
                completion_window=Duration.hours(2),
                delete_after=Duration.days(7),
            )
        )
        
        # Add Aurora to backup
        backup_plan.add_selection(
            f"AuroraSelection{environment_suffix}",
            resources=[
                backup.BackupResource.from_rds_database_cluster(aurora_cluster)
            ]
        )
        
        # Add DynamoDB to backup
        backup_plan.add_selection(
            f"DynamoDBSelection{environment_suffix}",
            resources=[
                backup.BackupResource.from_arn(dynamodb_table.table_arn)
            ]
        )
        
        # Outputs
        from aws_cdk import CfnOutput
        
        CfnOutput(self, "VPCId", value=vpc.vpc_id, description="VPC ID")
        CfnOutput(self, "AuroraClusterEndpoint", value=aurora_cluster.cluster_endpoint.hostname, description="Aurora endpoint")
        CfnOutput(self, "DynamoDBTableName", value=dynamodb_table.table_name, description="DynamoDB table")
        CfnOutput(self, "LambdaFunctionName", value=lambda_fn.function_name, description="Lambda function")
        CfnOutput(self, "S3BucketName", value=s3_bucket.bucket_name, description="S3 bucket")
        CfnOutput(self, "BackupVaultName", value=backup_vault.backup_vault_name, description="Backup vault")
