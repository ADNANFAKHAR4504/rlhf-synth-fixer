"""TAP Stack module for CDKTF Python infrastructure - RDS Migration."""

import os
from datetime import datetime
from cdktf import TerraformStack, S3Backend, TerraformOutput, Fn, TerraformAsset, AssetType
from constructs import Construct
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.db_subnet_group import DbSubnetGroup
from cdktf_cdktf_provider_aws.security_group import SecurityGroup, SecurityGroupIngress, SecurityGroupEgress
from cdktf_cdktf_provider_aws.db_instance import DbInstance
from cdktf_cdktf_provider_aws.secretsmanager_secret import SecretsmanagerSecret
from cdktf_cdktf_provider_aws.secretsmanager_secret_version import SecretsmanagerSecretVersion
from cdktf_cdktf_provider_aws.secretsmanager_secret_rotation import SecretsmanagerSecretRotation
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.iam_policy import IamPolicy
from cdktf_cdktf_provider_aws.lambda_function import LambdaFunction
from cdktf_cdktf_provider_aws.lambda_permission import LambdaPermission
from cdktf_cdktf_provider_aws.cloudwatch_event_rule import CloudwatchEventRule
from cdktf_cdktf_provider_aws.cloudwatch_event_target import CloudwatchEventTarget
from cdktf_cdktf_provider_aws.vpc_endpoint import VpcEndpoint
from cdktf_cdktf_provider_aws.data_aws_availability_zones import DataAwsAvailabilityZones


class TapStack(TerraformStack):
    """CDKTF Python stack for RDS MySQL migration infrastructure."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        **kwargs
    ):
        """Initialize the TAP stack with RDS migration infrastructure."""
        super().__init__(scope, construct_id)

        # Extract configuration from kwargs
        environment_suffix = kwargs.get('environment_suffix', 'dev')
        aws_region = kwargs.get('aws_region', 'ap-southeast-1')
        state_bucket_region = kwargs.get('state_bucket_region', 'us-east-1')
        state_bucket = kwargs.get('state_bucket', 'iac-rlhf-tf-states')
        default_tags = kwargs.get('default_tags', {})

        # Add migration date to tags
        migration_date = datetime.now().strftime('%Y-%m-%d')
        if 'tags' in default_tags:
            default_tags['tags']['MigrationDate'] = migration_date
            default_tags['tags']['Environment'] = 'production'

        # Configure AWS Provider
        AwsProvider(
            self,
            "aws",
            region=aws_region,
            default_tags=[default_tags],
        )

        # Configure S3 Backend only if bucket is provided and not empty
        # (DynamoDB table is used automatically for locking when S3 backend is used)
        if state_bucket and state_bucket.strip():
            S3Backend(
                self,
                bucket=state_bucket,
                key=f"{environment_suffix}/{construct_id}.tfstate",
                region=state_bucket_region,
                encrypt=True,
            )

        # Get availability zones
        azs = DataAwsAvailabilityZones(
            self,
            "available_azs",
            state="available"
        )

        # Create VPC for production RDS
        vpc = Vpc(
            self,
            "production_vpc",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                "Name": f"production-vpc-{environment_suffix}",
                "Environment": "production",
                "MigrationDate": migration_date
            }
        )

        # Create private subnets across 2 AZs for RDS
        private_subnet_1 = Subnet(
            self,
            "private_subnet_1",
            vpc_id=vpc.id,
            cidr_block="10.0.10.0/24",
            availability_zone=Fn.element(azs.names, 0),
            map_public_ip_on_launch=False,
            tags={
                "Name": f"private-subnet-1-{environment_suffix}",
                "Type": "private",
                "Environment": "production",
                "MigrationDate": migration_date
            }
        )

        private_subnet_2 = Subnet(
            self,
            "private_subnet_2",
            vpc_id=vpc.id,
            cidr_block="10.0.11.0/24",
            availability_zone=Fn.element(azs.names, 1),
            map_public_ip_on_launch=False,
            tags={
                "Name": f"private-subnet-2-{environment_suffix}",
                "Type": "private",
                "Environment": "production",
                "MigrationDate": migration_date
            }
        )

        # Create application subnet for security group rules
        app_subnet = Subnet(
            self,
            "app_subnet",
            vpc_id=vpc.id,
            cidr_block="10.0.1.0/24",
            availability_zone=Fn.element(azs.names, 0),
            map_public_ip_on_launch=False,
            tags={
                "Name": f"app-subnet-{environment_suffix}",
                "Type": "application",
                "Environment": "production",
                "MigrationDate": migration_date
            }
        )

        # Create DB subnet group
        db_subnet_group = DbSubnetGroup(
            self,
            "rds_subnet_group",
            name=f"rds-subnet-group-{environment_suffix}",
            subnet_ids=[private_subnet_1.id, private_subnet_2.id],
            tags={
                "Name": f"rds-subnet-group-{environment_suffix}",
                "Environment": "production",
                "MigrationDate": migration_date
            }
        )

        # Create security group for RDS
        rds_security_group = SecurityGroup(
            self,
            "rds_security_group",
            name=f"rds-sg-{environment_suffix}",
            description="Security group for production RDS MySQL instance",
            vpc_id=vpc.id,
            ingress=[
                SecurityGroupIngress(
                    description="MySQL access from application subnet",
                    from_port=3306,
                    to_port=3306,
                    protocol="tcp",
                    cidr_blocks=["10.0.1.0/24"]
                )
            ],
            egress=[
                SecurityGroupEgress(
                    description="Allow all outbound traffic",
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            tags={
                "Name": f"rds-sg-{environment_suffix}",
                "Environment": "production",
                "MigrationDate": migration_date
            }
        )

        # Create security group for Lambda
        lambda_security_group = SecurityGroup(
            self,
            "lambda_security_group",
            name=f"lambda-sg-{environment_suffix}",
            description="Security group for validation Lambda function",
            vpc_id=vpc.id,
            egress=[
                SecurityGroupEgress(
                    description="Allow all outbound traffic",
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            tags={
                "Name": f"lambda-sg-{environment_suffix}",
                "Environment": "production",
                "MigrationDate": migration_date
            }
        )

        # Create VPC Endpoints for AWS services
        secrets_endpoint = VpcEndpoint(
            self,
            "secrets_manager_endpoint",
            vpc_id=vpc.id,
            service_name=f"com.amazonaws.{aws_region}.secretsmanager",
            vpc_endpoint_type="Interface",
            subnet_ids=[private_subnet_1.id, private_subnet_2.id],
            security_group_ids=[lambda_security_group.id],
            private_dns_enabled=True,
            tags={
                "Name": f"secrets-endpoint-{environment_suffix}",
                "Environment": "production",
                "MigrationDate": migration_date
            }
        )

        logs_endpoint = VpcEndpoint(
            self,
            "logs_endpoint",
            vpc_id=vpc.id,
            service_name=f"com.amazonaws.{aws_region}.logs",
            vpc_endpoint_type="Interface",
            subnet_ids=[private_subnet_1.id, private_subnet_2.id],
            security_group_ids=[lambda_security_group.id],
            private_dns_enabled=True,
            tags={
                "Name": f"logs-endpoint-{environment_suffix}",
                "Environment": "production",
                "MigrationDate": migration_date
            }
        )

        # Create Secrets Manager secret for database credentials
        db_secret = SecretsmanagerSecret(
            self,
            "db_credentials",
            name=f"rds-db-credentials-{environment_suffix}",
            description="RDS MySQL database credentials",
            tags={
                "Name": f"rds-credentials-{environment_suffix}",
                "Environment": "production",
                "MigrationDate": migration_date
            }
        )

        # Store initial secret value (placeholder - in production, fetch existing secret)
        db_secret_version = SecretsmanagerSecretVersion(
            self,
            "db_credentials_version",
            secret_id=db_secret.id,
            secret_string='{"username":"admin","password":"PLACEHOLDER_CHANGE_ME"}'
        )

        # Create RDS MySQL instance from snapshot
        rds_instance = DbInstance(
            self,
            "production_rds",
            identifier=f"production-mysql-{environment_suffix}",
            instance_class="db.t3.micro",
            engine="mysql",
            engine_version="8.0",
            allocated_storage=20,
            db_name="production",
            username="admin",
            password="InitialPassword123!",
            db_subnet_group_name=db_subnet_group.name,
            vpc_security_group_ids=[rds_security_group.id],
            multi_az=False,
            publicly_accessible=False,
            storage_encrypted=True,
            backup_retention_period=7,
            backup_window="03:00-04:00",
            skip_final_snapshot=True,
            deletion_protection=False,
            tags={
                "Name": f"production-rds-{environment_suffix}",
                "Environment": "production",
                "MigrationDate": migration_date
            },
            depends_on=[db_subnet_group]
        )

        # IAM role for Lambda validation function
        lambda_role = IamRole(
            self,
            "lambda_validation_role",
            name=f"lambda-validation-role-{environment_suffix}",
            assume_role_policy="""{
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "lambda.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }""",
            tags={
                "Name": f"lambda-validation-role-{environment_suffix}",
                "Environment": "production",
                "MigrationDate": migration_date
            }
        )

        # Attach basic Lambda execution policy
        IamRolePolicyAttachment(
            self,
            "lambda_basic_execution",
            role=lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        )

        # Attach VPC execution policy
        IamRolePolicyAttachment(
            self,
            "lambda_vpc_execution",
            role=lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
        )

        # Create custom policy for RDS and Secrets Manager access
        lambda_custom_policy = IamPolicy(
            self,
            "lambda_custom_policy",
            name=f"lambda-rds-secrets-policy-{environment_suffix}",
            description="Policy for Lambda to access RDS and Secrets Manager",
            policy=f"""{{
                "Version": "2012-10-17",
                "Statement": [
                    {{
                        "Effect": "Allow",
                        "Action": [
                            "secretsmanager:GetSecretValue",
                            "secretsmanager:DescribeSecret"
                        ],
                        "Resource": "{db_secret.arn}"
                    }},
                    {{
                        "Effect": "Allow",
                        "Action": [
                            "rds:DescribeDBInstances",
                            "rds:DescribeDBClusters"
                        ],
                        "Resource": "*"
                    }}
                ]
            }}""",
            tags={
                "Name": f"lambda-custom-policy-{environment_suffix}",
                "Environment": "production",
                "MigrationDate": migration_date
            }
        )

        IamRolePolicyAttachment(
            self,
            "lambda_custom_policy_attachment",
            role=lambda_role.name,
            policy_arn=lambda_custom_policy.arn
        )

        # Create Lambda asset for deployment package
        # Use absolute path to lambda_function.zip from project root
        lambda_zip_path = os.path.join(os.getcwd(), "lambda_function.zip")
        lambda_asset = TerraformAsset(
            self,
            "lambda_asset",
            path=lambda_zip_path,
            type=AssetType.FILE
        )

        # Create Lambda function for validation
        validation_lambda = LambdaFunction(
            self,
            "validation_lambda",
            function_name=f"rds-validation-{environment_suffix}",
            runtime="python3.11",
            handler="validation_handler.lambda_handler",
            role=lambda_role.arn,
            timeout=300,
            memory_size=256,
            filename=lambda_asset.path,
            source_code_hash=lambda_asset.asset_hash,
            environment={
                "variables": {
                    "DB_SECRET_ARN": db_secret.arn,
                    "DB_ENDPOINT": rds_instance.endpoint,
                    "ENVIRONMENT": "production"
                }
            },
            vpc_config={
                "subnet_ids": [private_subnet_1.id, private_subnet_2.id],
                "security_group_ids": [lambda_security_group.id]
            },
            tags={
                "Name": f"rds-validation-lambda-{environment_suffix}",
                "Environment": "production",
                "MigrationDate": migration_date
            },
            depends_on=[rds_instance, db_secret_version, secrets_endpoint, logs_endpoint]
        )

        # Create EventBridge rule for RDS events
        rds_event_rule = CloudwatchEventRule(
            self,
            "rds_event_rule",
            name=f"rds-state-change-{environment_suffix}",
            description="Trigger validation Lambda on RDS state changes",
            event_pattern=f"""{{
                "source": ["aws.rds"],
                "detail-type": ["RDS DB Instance Event"],
                "detail": {{
                    "EventCategories": ["availability", "backup", "configuration change"],
                    "SourceArn": ["{rds_instance.arn}"]
                }}
            }}""",
            tags={
                "Name": f"rds-event-rule-{environment_suffix}",
                "Environment": "production",
                "MigrationDate": migration_date
            }
        )

        # Add Lambda permission for EventBridge
        LambdaPermission(
            self,
            "lambda_eventbridge_permission",
            statement_id="AllowEventBridgeInvoke",
            action="lambda:InvokeFunction",
            function_name=validation_lambda.function_name,
            principal="events.amazonaws.com",
            source_arn=rds_event_rule.arn
        )

        # Create EventBridge target
        CloudwatchEventTarget(
            self,
            "rds_event_target",
            rule=rds_event_rule.name,
            arn=validation_lambda.arn,
            target_id="ValidationLambdaTarget"
        )

        # Add Lambda permission for Secrets Manager to invoke for rotation
        LambdaPermission(
            self,
            "lambda_secrets_manager_permission",
            statement_id="AllowSecretsManagerInvoke",
            action="lambda:InvokeFunction",
            function_name=validation_lambda.function_name,
            principal="secretsmanager.amazonaws.com"
        )

        # Configure secret rotation (requires Lambda rotation function)
        # Note: This is a placeholder - full rotation requires additional Lambda function
        SecretsmanagerSecretRotation(
            self,
            "db_secret_rotation",
            secret_id=db_secret.id,
            rotation_lambda_arn=validation_lambda.arn,
            rotation_rules={
                "automatically_after_days": 30
            }
        )

        # Outputs
        TerraformOutput(
            self,
            "vpc_id",
            value=vpc.id,
            description="Production VPC ID"
        )

        TerraformOutput(
            self,
            "rds_endpoint",
            value=rds_instance.endpoint,
            description="RDS MySQL endpoint"
        )

        TerraformOutput(
            self,
            "rds_instance_id",
            value=rds_instance.id,
            description="RDS instance DBI resource ID"
        )

        TerraformOutput(
            self,
            "rds_instance_identifier",
            value=rds_instance.identifier,
            description="RDS instance identifier (DBInstanceIdentifier)"
        )

        TerraformOutput(
            self,
            "db_secret_arn",
            value=db_secret.arn,
            description="Database credentials secret ARN"
        )

        TerraformOutput(
            self,
            "validation_lambda_arn",
            value=validation_lambda.arn,
            description="Validation Lambda function ARN"
        )

        TerraformOutput(
            self,
            "private_subnet_ids",
            value=Fn.jsonencode([private_subnet_1.id, private_subnet_2.id]),
            description="Private subnet IDs for RDS"
        )
