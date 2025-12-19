"""
parameter_store_stack.py

Parameter Store infrastructure module.
Creates hierarchical parameter structures for environment-specific configurations.
"""

from typing import Optional, Dict
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions, Output


class ParameterStoreStackArgs:
    """Arguments for ParameterStoreStack component."""

    def __init__(
        self,
        environment_suffix: str,
        production_db_endpoint: Output[str],
        migration_db_endpoint: Output[str],
        api_gateway_endpoint: Output[str],
        tags: Optional[dict] = None
    ):
        self.environment_suffix = environment_suffix
        self.production_db_endpoint = production_db_endpoint
        self.migration_db_endpoint = migration_db_endpoint
        self.api_gateway_endpoint = api_gateway_endpoint
        self.tags = tags or {}


class ParameterStoreStack(pulumi.ComponentResource):
    """
    Parameter Store infrastructure for migration project.

    Creates hierarchical parameter structures for:
    - Database endpoints and configurations
    - API Gateway endpoints
    - Migration workflow settings
    - Feature flags for migration phases
    - Environment-specific configurations
    """

    def __init__(
        self,
        name: str,
        args: ParameterStoreStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:parameterstore:ParameterStoreStack', name, None, opts)

        self.environment_suffix = args.environment_suffix
        self.tags = {
            **args.tags,
            'EnvironmentSuffix': self.environment_suffix,
            'Component': 'ParameterStore'
        }

        # Database Configuration Parameters
        self.prod_db_endpoint_param = aws.ssm.Parameter(
            f"prod-db-endpoint-param-{self.environment_suffix}",
            name=f"/migration/{self.environment_suffix}/database/production/endpoint",
            type="String",
            value=args.production_db_endpoint,
            description=f"Production database endpoint for {self.environment_suffix}",
            tier="Standard",
            tags={
                **self.tags,
                'Name': f"prod-db-endpoint-{self.environment_suffix}",
                'ParameterType': 'DatabaseEndpoint'
            },
            opts=ResourceOptions(parent=self)
        )

        self.migration_db_endpoint_param = aws.ssm.Parameter(
            f"migration-db-endpoint-param-{self.environment_suffix}",
            name=f"/migration/{self.environment_suffix}/database/migration/endpoint",
            type="String",
            value=args.migration_db_endpoint,
            description=f"Migration database endpoint for {self.environment_suffix}",
            tier="Standard",
            tags={
                **self.tags,
                'Name': f"migration-db-endpoint-{self.environment_suffix}",
                'ParameterType': 'DatabaseEndpoint'
            },
            opts=ResourceOptions(parent=self)
        )

        self.db_name_param = aws.ssm.Parameter(
            f"db-name-param-{self.environment_suffix}",
            name=f"/migration/{self.environment_suffix}/database/name",
            type="String",
            value="payments",
            description="Database name for migration",
            tier="Standard",
            tags={
                **self.tags,
                'Name': f"db-name-{self.environment_suffix}",
                'ParameterType': 'DatabaseConfig'
            },
            opts=ResourceOptions(parent=self)
        )

        # API Gateway Configuration
        self.api_endpoint_param = aws.ssm.Parameter(
            f"api-endpoint-param-{self.environment_suffix}",
            name=f"/migration/{self.environment_suffix}/api/endpoint",
            type="String",
            value=args.api_gateway_endpoint,
            description=f"API Gateway endpoint for {self.environment_suffix}",
            tier="Standard",
            tags={
                **self.tags,
                'Name': f"api-endpoint-{self.environment_suffix}",
                'ParameterType': 'APIEndpoint'
            },
            opts=ResourceOptions(parent=self)
        )

        self.api_auth_token_param = aws.ssm.Parameter(
            f"api-auth-token-param-{self.environment_suffix}",
            name=f"/migration/{self.environment_suffix}/api/auth-token",
            type="SecureString",
            value="changeme-secure-token-12345",  # Should be generated securely
            description="API Gateway authorization token",
            tier="Standard",
            tags={
                **self.tags,
                'Name': f"api-auth-token-{self.environment_suffix}",
                'ParameterType': 'AuthToken'
            },
            opts=ResourceOptions(parent=self)
        )

        # Migration Workflow Configuration
        self.migration_mode_param = aws.ssm.Parameter(
            f"migration-mode-param-{self.environment_suffix}",
            name=f"/migration/{self.environment_suffix}/workflow/mode",
            type="String",
            value="preparation",
            description="Current migration mode: preparation, replication, validation, cutover, rollback",
            tier="Standard",
            tags={
                **self.tags,
                'Name': f"migration-mode-{self.environment_suffix}",
                'ParameterType': 'WorkflowMode'
            },
            opts=ResourceOptions(parent=self)
        )

        self.enable_replication_param = aws.ssm.Parameter(
            f"enable-replication-param-{self.environment_suffix}",
            name=f"/migration/{self.environment_suffix}/workflow/enable-replication",
            type="String",
            value="false",
            description="Feature flag to enable DMS replication",
            tier="Standard",
            tags={
                **self.tags,
                'Name': f"enable-replication-{self.environment_suffix}",
                'ParameterType': 'FeatureFlag'
            },
            opts=ResourceOptions(parent=self)
        )

        self.enable_validation_param = aws.ssm.Parameter(
            f"enable-validation-param-{self.environment_suffix}",
            name=f"/migration/{self.environment_suffix}/workflow/enable-validation",
            type="String",
            value="false",
            description="Feature flag to enable data validation",
            tier="Standard",
            tags={
                **self.tags,
                'Name': f"enable-validation-{self.environment_suffix}",
                'ParameterType': 'FeatureFlag'
            },
            opts=ResourceOptions(parent=self)
        )

        self.enable_cutover_param = aws.ssm.Parameter(
            f"enable-cutover-param-{self.environment_suffix}",
            name=f"/migration/{self.environment_suffix}/workflow/enable-cutover",
            type="String",
            value="false",
            description="Feature flag to enable cutover to migration database",
            tier="Standard",
            tags={
                **self.tags,
                'Name': f"enable-cutover-{self.environment_suffix}",
                'ParameterType': 'FeatureFlag'
            },
            opts=ResourceOptions(parent=self)
        )

        self.traffic_split_param = aws.ssm.Parameter(
            f"traffic-split-param-{self.environment_suffix}",
            name=f"/migration/{self.environment_suffix}/workflow/traffic-split-percentage",
            type="String",
            value="0",
            description="Percentage of traffic to route to migration database (0-100)",
            tier="Standard",
            tags={
                **self.tags,
                'Name': f"traffic-split-{self.environment_suffix}",
                'ParameterType': 'TrafficControl'
            },
            opts=ResourceOptions(parent=self)
        )

        # Monitoring Configuration
        self.validation_interval_param = aws.ssm.Parameter(
            f"validation-interval-param-{self.environment_suffix}",
            name=f"/migration/{self.environment_suffix}/monitoring/validation-interval-minutes",
            type="String",
            value="15",
            description="Interval in minutes for running data validation checks",
            tier="Standard",
            tags={
                **self.tags,
                'Name': f"validation-interval-{self.environment_suffix}",
                'ParameterType': 'MonitoringConfig'
            },
            opts=ResourceOptions(parent=self)
        )

        self.alert_threshold_param = aws.ssm.Parameter(
            f"alert-threshold-param-{self.environment_suffix}",
            name=f"/migration/{self.environment_suffix}/monitoring/replication-lag-threshold-seconds",
            type="String",
            value="300",
            description="Replication lag threshold in seconds before alerting",
            tier="Standard",
            tags={
                **self.tags,
                'Name': f"alert-threshold-{self.environment_suffix}",
                'ParameterType': 'AlertThreshold'
            },
            opts=ResourceOptions(parent=self)
        )

        # Rollback Configuration
        self.enable_auto_rollback_param = aws.ssm.Parameter(
            f"enable-auto-rollback-param-{self.environment_suffix}",
            name=f"/migration/{self.environment_suffix}/rollback/enable-auto-rollback",
            type="String",
            value="true",
            description="Enable automatic rollback on failure detection",
            tier="Standard",
            tags={
                **self.tags,
                'Name': f"enable-auto-rollback-{self.environment_suffix}",
                'ParameterType': 'RollbackConfig'
            },
            opts=ResourceOptions(parent=self)
        )

        self.rollback_threshold_param = aws.ssm.Parameter(
            f"rollback-threshold-param-{self.environment_suffix}",
            name=f"/migration/{self.environment_suffix}/rollback/error-threshold-percentage",
            type="String",
            value="5",
            description="Error rate percentage that triggers automatic rollback",
            tier="Standard",
            tags={
                **self.tags,
                'Name': f"rollback-threshold-{self.environment_suffix}",
                'ParameterType': 'RollbackThreshold'
            },
            opts=ResourceOptions(parent=self)
        )

        # Register outputs
        self.register_outputs({
            'parameter_namespace': f"/migration/{self.environment_suffix}",
            'prod_db_endpoint_param_name': self.prod_db_endpoint_param.name,
            'migration_db_endpoint_param_name': self.migration_db_endpoint_param.name,
            'api_endpoint_param_name': self.api_endpoint_param.name
        })
