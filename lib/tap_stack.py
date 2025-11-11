"""
tap_stack.py

This module defines the TapStack class, the main Pulumi ComponentResource for
the migration payment processing project.

It orchestrates the instantiation of all infrastructure components required for
a zero-downtime migration from on-premises to AWS.
"""

from typing import Optional
import pulumi
from pulumi import ResourceOptions, Output

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
        tags: Optional[dict] = None
    ):
        self.environment_suffix = environment_suffix or 'dev'
        self.alert_email_addresses = alert_email_addresses or []
        self.tags = tags or {}


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

        # 1. Network Infrastructure
        network_stack = NetworkStack(
            "network",
            NetworkStackArgs(
                environment_suffix=self.environment_suffix,
                primary_region="ap-southeast-1",
                secondary_region="us-east-1",
                tertiary_region="us-east-2",
                tags=self.tags
            ),
            opts=ResourceOptions(parent=self)
        )

        # 2. Storage Infrastructure (S3 buckets)
        storage_stack = StorageStack(
            "storage",
            StorageStackArgs(
                environment_suffix=self.environment_suffix,
                tags=self.tags
            ),
            opts=ResourceOptions(parent=self)
        )

        # 3. Notification Infrastructure (SNS topics)
        notification_stack = NotificationStack(
            "notification",
            NotificationStackArgs(
                environment_suffix=self.environment_suffix,
                alert_email_addresses=args.alert_email_addresses,
                tags=self.tags
            ),
            opts=ResourceOptions(parent=self)
        )

        # 4. Database Infrastructure (RDS Aurora)
        database_stack = DatabaseStack(
            "database",
            DatabaseStackArgs(
                environment_suffix=self.environment_suffix,
                vpc_id=network_stack.production_vpc.id,
                private_subnet_ids=[s.id for s in network_stack.production_private_subnets],
                db_security_group_id=network_stack.db_security_group.id,
                primary_region="ap-southeast-1",
                secondary_region="us-east-1",
                tertiary_region="us-east-2",
                tags=self.tags
            ),
            opts=ResourceOptions(parent=self, depends_on=[network_stack])
        )

        # 5. DMS Infrastructure
        dms_stack = DmsStack(
            "dms",
            DmsStackArgs(
                environment_suffix=self.environment_suffix,
                dms_subnet_ids=[s.id for s in network_stack.production_dms_subnets],
                dms_security_group_id=network_stack.dms_security_group.id,
                source_cluster_endpoint=database_stack.production_cluster.endpoint,
                source_cluster_arn=database_stack.production_cluster.arn,
                target_cluster_endpoint=database_stack.migration_cluster.endpoint,
                target_cluster_arn=database_stack.migration_cluster.arn,
                db_subnet_group_name=database_stack.db_subnet_group.name,
                tags=self.tags
            ),
            opts=ResourceOptions(parent=self, depends_on=[database_stack, network_stack])
        )

        # 6. Lambda Functions Infrastructure
        lambda_stack = LambdaStack(
            "lambda",
            LambdaStackArgs(
                environment_suffix=self.environment_suffix,
                vpc_id=network_stack.production_vpc.id,
                lambda_subnet_ids=[s.id for s in network_stack.production_private_subnets],
                lambda_security_group_id=network_stack.lambda_security_group.id,
                source_db_endpoint=database_stack.production_cluster.endpoint,
                target_db_endpoint=database_stack.migration_cluster.endpoint,
                sns_topic_arn=notification_stack.validation_alerts_topic.arn,
                tags=self.tags
            ),
            opts=ResourceOptions(parent=self, depends_on=[network_stack, database_stack, notification_stack])
        )

        # 7. API Gateway Infrastructure
        api_gateway_stack = ApiGatewayStack(
            "api-gateway",
            ApiGatewayStackArgs(
                environment_suffix=self.environment_suffix,
                authorizer_lambda_arn=lambda_stack.authorizer_lambda.arn,
                authorizer_lambda_name=lambda_stack.authorizer_lambda.name,
                production_db_endpoint=database_stack.production_cluster.endpoint,
                migration_db_endpoint=database_stack.migration_cluster.endpoint,
                tags=self.tags
            ),
            opts=ResourceOptions(parent=self, depends_on=[lambda_stack])
        )

        # 8. Parameter Store Infrastructure
        parameter_store_stack = ParameterStoreStack(
            "parameter-store",
            ParameterStoreStackArgs(
                environment_suffix=self.environment_suffix,
                production_db_endpoint=database_stack.production_cluster.endpoint,
                migration_db_endpoint=database_stack.migration_cluster.endpoint,
                api_gateway_endpoint=api_gateway_stack.api_endpoint,
                tags=self.tags
            ),
            opts=ResourceOptions(parent=self, depends_on=[database_stack, api_gateway_stack])
        )

        # 9. Step Functions Infrastructure
        stepfunctions_stack = StepFunctionsStack(
            "stepfunctions",
            StepFunctionsStackArgs(
                environment_suffix=self.environment_suffix,
                validation_lambda_arn=lambda_stack.validation_lambda.arn,
                dms_replication_task_arn=dms_stack.replication_task.replication_task_arn,
                sns_topic_arn=notification_stack.migration_status_topic.arn,
                checkpoints_bucket_name=storage_stack.checkpoints_bucket.bucket,
                rollback_bucket_name=storage_stack.rollback_bucket.bucket,
                tags=self.tags
            ),
            opts=ResourceOptions(
                parent=self,
                depends_on=[lambda_stack, dms_stack, notification_stack, storage_stack]
            )
        )

        # 10. Monitoring Infrastructure (CloudWatch)
        monitoring_stack = MonitoringStack(
            "monitoring",
            MonitoringStackArgs(
                environment_suffix=self.environment_suffix,
                production_cluster_id=database_stack.production_cluster.cluster_identifier,
                migration_cluster_id=database_stack.migration_cluster.cluster_identifier,
                dms_replication_task_arn=dms_stack.replication_task.replication_task_arn,
                validation_lambda_name=lambda_stack.validation_lambda.name,
                api_gateway_id=api_gateway_stack.rest_api.id,
                migration_state_machine_arn=stepfunctions_stack.migration_state_machine.arn,
                error_alerts_topic_arn=notification_stack.error_alerts_topic.arn,
                tags=self.tags
            ),
            opts=ResourceOptions(
                parent=self,
                depends_on=[
                    database_stack,
                    dms_stack,
                    lambda_stack,
                    api_gateway_stack,
                    stepfunctions_stack,
                    notification_stack
                ]
            )
        )

        # Register stack outputs
        self.register_outputs({
            # Network outputs
            'production_vpc_id': network_stack.production_vpc.id,
            'migration_vpc_id': network_stack.migration_vpc.id,
            'transit_gateway_id': network_stack.transit_gateway.id,

            # Database outputs
            'production_db_endpoint': database_stack.production_cluster.endpoint,
            'production_db_reader_endpoint': database_stack.production_cluster.reader_endpoint,
            'migration_db_endpoint': database_stack.migration_cluster.endpoint,
            'migration_db_reader_endpoint': database_stack.migration_cluster.reader_endpoint,

            # DMS outputs
            'dms_replication_instance_arn': dms_stack.replication_instance.replication_instance_arn,
            'dms_replication_task_arn': dms_stack.replication_task.replication_task_arn,

            # Lambda outputs
            'validation_lambda_arn': lambda_stack.validation_lambda.arn,
            'authorizer_lambda_arn': lambda_stack.authorizer_lambda.arn,

            # API Gateway outputs
            'api_gateway_endpoint': api_gateway_stack.api_endpoint,
            'api_gateway_id': api_gateway_stack.rest_api.id,

            # Step Functions outputs
            'migration_state_machine_arn': stepfunctions_stack.migration_state_machine.arn,
            'rollback_state_machine_arn': stepfunctions_stack.rollback_state_machine.arn,

            # Storage outputs
            'checkpoints_bucket_name': storage_stack.checkpoints_bucket.bucket,
            'rollback_bucket_name': storage_stack.rollback_bucket.bucket,

            # Monitoring outputs
            'dashboard_name': monitoring_stack.dashboard.dashboard_name,
            'dashboard_arn': monitoring_stack.dashboard.dashboard_arn,

            # SNS outputs
            'migration_status_topic_arn': notification_stack.migration_status_topic.arn,
            'error_alerts_topic_arn': notification_stack.error_alerts_topic.arn,

            # Parameter Store outputs
            'parameter_namespace': parameter_store_stack.prod_db_endpoint_param.name.apply(
                lambda name: '/'.join(name.split('/')[:3])
            )
        })
