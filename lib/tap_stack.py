"""
tap_stack.py

This module defines the TapStack class, the main Pulumi ComponentResource for
the migration payment processing project.

It orchestrates the instantiation of all infrastructure components required for
a zero-downtime migration from on-premises to AWS.
"""

from typing import Optional
import pulumi
from pulumi import ResourceOptions
import pulumi_aws as aws

# Import all stack components
from .network_stack import NetworkStack, NetworkStackArgs
from .database_stack import DatabaseStack, DatabaseStackArgs
from .storage_stack import StorageStack, StorageStackArgs
from .notification_stack import NotificationStack, NotificationStackArgs
from .dms_stack import DmsStack, DmsStackArgs
from .lambda_stack import LambdaStack, LambdaStackArgs
from .api_gateway_stack import ApiGatewayStack, ApiGatewayStackArgs
from .parameter_store_stack import ParameterStoreStack, ParameterStoreStackArgs
from .stepfunctions_stack import StepFunctionsStack, StepFunctionsStackArgs
from .monitoring_stack import MonitoringStack, MonitoringStackArgs


class TapStackArgs:
    """
    TapStackArgs defines the input arguments for the TapStack Pulumi component.

    Args:
        environment_suffix (Optional[str]): Environment suffix for resource naming (e.g., 'dev', 'prod')
        alert_email_addresses (Optional[list]): Email addresses for migration alerts
        tags (Optional[dict]): Default tags to apply to all resources
    """

    def __init__(
        self,
        environment_suffix: Optional[str] = None,
        alert_email_addresses: Optional[list] = None,
        primary_region: str = "eu-central-1",
        secondary_region: str = "eu-central-2",
        tags: Optional[dict] = None,
        domain_name: Optional[str] = None
    ):
        self.environment_suffix = environment_suffix or 'dev'
        self.alert_email_addresses = alert_email_addresses or []
        self.primary_region = primary_region
        self.secondary_region = secondary_region
        self.tags = tags or {}
        self.domain_name = domain_name


class TapStack(pulumi.ComponentResource):
    """
    Main Pulumi component resource for the migration payment processing infrastructure.

    This component orchestrates:
    - Network infrastructure (VPCs, Transit Gateway)
    - Database infrastructure (RDS Aurora PostgreSQL)
    - DMS replication for database migration
    - Lambda functions for data validation
    - API Gateway with custom authorizers
    - Step Functions for migration orchestration
    - S3 buckets for checkpoints and rollback
    - SNS topics for notifications
    - Parameter Store for configuration
    - CloudWatch dashboards and monitoring

    Args:
        name (str): The logical name of this Pulumi component
        args (TapStackArgs): Configuration arguments
        opts (ResourceOptions): Pulumi resource options
    """

    def __init__(
        self,
        name: str,
        args: TapStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:stack:TapStack', name, None, opts)

        self.environment_suffix = args.environment_suffix
        self.tags = {
            **args.tags,
            'Project': 'MigrationPaymentProcessing',
            'ManagedBy': 'Pulumi',
            'EnvironmentSuffix': self.environment_suffix
        }
        self.primary_region = args.primary_region
        self.secondary_region = args.secondary_region

        primary_provider = aws.Provider(
            f"aws-primary-{self.environment_suffix}",
            region=self.primary_region,
            opts=ResourceOptions(parent=self)
        )

        secondary_provider = aws.Provider(
            f"aws-secondary-{self.environment_suffix}",
            region=self.secondary_region,
            opts=ResourceOptions(parent=self)
        )

        self.primary_provider = primary_provider
        self.secondary_provider = secondary_provider

        # 1. Network Infrastructure
        self.network_stack = NetworkStack(
            "network",
            NetworkStackArgs(
                environment_suffix=self.environment_suffix,
                primary_region=self.primary_region,
                secondary_region=self.secondary_region,
                tertiary_region="us-east-2",
                tags=self.tags
            ),
            opts=ResourceOptions(parent=self, provider=primary_provider)
        )

        # 2. Storage Infrastructure (S3 buckets)
        self.storage_stack = StorageStack(
            "storage",
            StorageStackArgs(
                environment_suffix=self.environment_suffix,
                tags=self.tags
            ),
            opts=ResourceOptions(parent=self, provider=primary_provider)
        )

        # 3. Notification Infrastructure (SNS topics)
        self.notification_stack = NotificationStack(
            "notification",
            NotificationStackArgs(
                environment_suffix=self.environment_suffix,
                alert_email_addresses=args.alert_email_addresses,
                tags=self.tags
            ),
            opts=ResourceOptions(parent=self, provider=primary_provider)
        )

        # 4. Database Infrastructure (RDS Aurora)
        self.database_stack = DatabaseStack(
            "database",
            DatabaseStackArgs(
                environment_suffix=self.environment_suffix,
                vpc_id=self.network_stack.production_vpc.id,
                private_subnet_ids=[s.id for s in self.network_stack.production_private_subnets],
                db_security_group_id=self.network_stack.db_security_group.id,
                primary_region=self.primary_region,
                secondary_region=self.secondary_region,
                tertiary_region="us-east-2",
                tags=self.tags
            ),
            opts=ResourceOptions(parent=self, provider=primary_provider, depends_on=[self.network_stack])
        )

        # 5. DMS Infrastructure
        self.dms_stack = DmsStack(
            "dms",
            DmsStackArgs(
                environment_suffix=self.environment_suffix,
                dms_subnet_ids=[s.id for s in self.network_stack.production_dms_subnets],
                dms_security_group_id=self.network_stack.dms_security_group.id,
                source_cluster_endpoint=self.database_stack.production_cluster.endpoint,
                source_cluster_arn=self.database_stack.production_cluster.arn,
                target_cluster_endpoint=self.database_stack.migration_cluster.endpoint,
                target_cluster_arn=self.database_stack.migration_cluster.arn,
                db_subnet_group_name=self.database_stack.db_subnet_group.name,
                tags=self.tags
            ),
            opts=ResourceOptions(parent=self, provider=primary_provider, depends_on=[self.database_stack, self.network_stack])
        )

        # 6. Lambda Functions Infrastructure
        self.lambda_stack = LambdaStack(
            "lambda",
            LambdaStackArgs(
                environment_suffix=self.environment_suffix,
                vpc_id=self.network_stack.production_vpc.id,
                lambda_subnet_ids=[s.id for s in self.network_stack.production_private_subnets],
                lambda_security_group_id=self.network_stack.lambda_security_group.id,
                source_db_endpoint=self.database_stack.production_cluster.endpoint,
                target_db_endpoint=self.database_stack.migration_cluster.endpoint,
                sns_topic_arn=self.notification_stack.validation_alerts_topic.arn,
                tags=self.tags
            ),
            opts=ResourceOptions(parent=self, provider=primary_provider, depends_on=[self.network_stack, self.database_stack, self.notification_stack])
        )

        # 7. API Gateway Infrastructure
        self.api_gateway_stack = ApiGatewayStack(
            "api-gateway",
            ApiGatewayStackArgs(
                environment_suffix=self.environment_suffix,
                authorizer_lambda_arn=self.lambda_stack.authorizer_lambda.arn,
                authorizer_lambda_name=self.lambda_stack.authorizer_lambda.name,
                production_db_endpoint=self.database_stack.production_cluster.endpoint,
                migration_db_endpoint=self.database_stack.migration_cluster.endpoint,
                tags=self.tags
            ),
            opts=ResourceOptions(parent=self, provider=primary_provider, depends_on=[self.lambda_stack])
        )

        # 8. Parameter Store Infrastructure
        self.parameter_store_stack = ParameterStoreStack(
            "parameter-store",
            ParameterStoreStackArgs(
                environment_suffix=self.environment_suffix,
                production_db_endpoint=self.database_stack.production_cluster.endpoint,
                migration_db_endpoint=self.database_stack.migration_cluster.endpoint,
                api_gateway_endpoint=self.api_gateway_stack.api_endpoint,
                tags=self.tags
            ),
            opts=ResourceOptions(parent=self, provider=primary_provider, depends_on=[self.database_stack, self.api_gateway_stack])
        )

        # 9. Step Functions Infrastructure
        self.stepfunctions_stack = StepFunctionsStack(
            "stepfunctions",
            StepFunctionsStackArgs(
                environment_suffix=self.environment_suffix,
                validation_lambda_arn=self.lambda_stack.validation_lambda.arn,
                dms_replication_task_arn=self.dms_stack.replication_task.replication_task_arn,
                sns_topic_arn=self.notification_stack.migration_status_topic.arn,
                checkpoints_bucket_name=self.storage_stack.checkpoints_bucket.bucket,
                rollback_bucket_name=self.storage_stack.rollback_bucket.bucket,
                tags=self.tags
            ),
            opts=ResourceOptions(
                parent=self,
                provider=primary_provider,
                depends_on=[self.lambda_stack, self.dms_stack, self.notification_stack, self.storage_stack]
            )
        )

        # 10. Monitoring Infrastructure (CloudWatch)
        self.monitoring_stack = MonitoringStack(
            "monitoring",
            MonitoringStackArgs(
                environment_suffix=self.environment_suffix,
                production_cluster_id=self.database_stack.production_cluster.cluster_identifier,
                migration_cluster_id=self.database_stack.migration_cluster.cluster_identifier,
                dms_replication_task_arn=self.dms_stack.replication_task.replication_task_arn,
                validation_lambda_name=self.lambda_stack.validation_lambda.name,
                api_gateway_id=self.api_gateway_stack.rest_api.id,
                migration_state_machine_arn=self.stepfunctions_stack.migration_state_machine.arn,
                error_alerts_topic_arn=self.notification_stack.error_alerts_topic.arn,
                tags=self.tags
            ),
            opts=ResourceOptions(
                parent=self,
                provider=primary_provider,
                depends_on=[
                    self.database_stack,
                    self.dms_stack,
                    self.lambda_stack,
                    self.api_gateway_stack,
                    self.stepfunctions_stack,
                    self.notification_stack
                ]
            )
        )

        # Register stack outputs using pulumi.export()
        # Network outputs
        pulumi.export('production_vpc_id', self.network_stack.production_vpc.id)
        pulumi.export('migration_vpc_id', self.network_stack.migration_vpc.id)
        pulumi.export('transit_gateway_id', self.network_stack.transit_gateway.id)

        # Database outputs
        pulumi.export('production_db_endpoint', self.database_stack.production_cluster.endpoint)
        pulumi.export('production_db_reader_endpoint', self.database_stack.production_cluster.reader_endpoint)
        pulumi.export('migration_db_endpoint', self.database_stack.migration_cluster.endpoint)
        pulumi.export('migration_db_reader_endpoint', self.database_stack.migration_cluster.reader_endpoint)

        # DMS outputs
        pulumi.export('dms_replication_instance_arn', self.dms_stack.replication_instance.replication_instance_arn)
        pulumi.export('dms_replication_task_arn', self.dms_stack.replication_task.replication_task_arn)

        # Lambda outputs
        pulumi.export('validation_lambda_arn', self.lambda_stack.validation_lambda.arn)
        pulumi.export('authorizer_lambda_arn', self.lambda_stack.authorizer_lambda.arn)

        # API Gateway outputs
        pulumi.export('api_gateway_endpoint', self.api_gateway_stack.api_endpoint)
        pulumi.export('api_gateway_id', self.api_gateway_stack.rest_api.id)

        # Step Functions outputs
        pulumi.export('migration_state_machine_arn', self.stepfunctions_stack.migration_state_machine.arn)
        pulumi.export('rollback_state_machine_arn', self.stepfunctions_stack.rollback_state_machine.arn)

        # Storage outputs
        pulumi.export('checkpoints_bucket_name', self.storage_stack.checkpoints_bucket.bucket)
        pulumi.export('rollback_bucket_name', self.storage_stack.rollback_bucket.bucket)

        # Monitoring outputs
        pulumi.export('dashboard_name', self.monitoring_stack.dashboard.dashboard_name)
        pulumi.export('dashboard_arn', self.monitoring_stack.dashboard.dashboard_arn)

        # SNS outputs
        pulumi.export('migration_status_topic_arn', self.notification_stack.migration_status_topic.arn)
        pulumi.export('error_alerts_topic_arn', self.notification_stack.error_alerts_topic.arn)

        # Parameter Store outputs
        # Use environment_suffix directly to avoid NoneType errors in tests
        pulumi.export('parameter_namespace', pulumi.Output.from_input(f"/migration/{self.environment_suffix}"))
