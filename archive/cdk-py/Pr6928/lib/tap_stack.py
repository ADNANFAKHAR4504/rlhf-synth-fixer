"""tap_stack.py
Main CDK stack for multi-region disaster recovery infrastructure.
Orchestrates nested stacks for different resource types.
"""

from typing import Optional
import aws_cdk as cdk
from aws_cdk import NestedStack
from constructs import Construct

from .kms_stack import KmsStack, KmsStackProps
from .vpc_stack import VpcStack, VpcStackProps
from .aurora_stack import AuroraStack, AuroraStackProps
from .dynamodb_stack import DynamoDBStack, DynamoDBStackProps
from .lambda_stack import LambdaStack, LambdaStackProps
from .s3_stack import S3Stack, S3StackProps
from .backup_stack import BackupStack, BackupStackProps
from .route53_stack import Route53Stack, Route53StackProps
from .monitoring_stack import MonitoringStack, MonitoringStackProps


class TapStackProps(cdk.StackProps):
    """Properties for the TapStack CDK stack."""

    def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix


class TapStack(cdk.Stack):
    """Main CDK stack for disaster recovery infrastructure.

    Orchestrates nested stacks for KMS, VPC, Aurora, DynamoDB, Lambda, S3,
    Backup, Route53, and Monitoring resources across multiple regions.
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: Optional[TapStackProps] = None,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        # Get environment suffix
        environment_suffix = (
            props.environment_suffix if props else None
        ) or self.node.try_get_context('environmentSuffix') or 'dev'

        # Define regions
        primary_region = 'us-east-1'
        secondary_region = 'us-west-2'

        # Apply global tags
        cdk.Tags.of(self).add('Environment', 'Production')
        cdk.Tags.of(self).add('DR-Role', 'Primary')
        cdk.Tags.of(self).add('ManagedBy', 'CDK')

        # Create nested KMS stack for encryption keys in both regions
        class NestedKmsStack(NestedStack):
            def __init__(self, scope, id, props=None, **kwargs):
                super().__init__(scope, id, **kwargs)
                self.kms_stack = KmsStack(self, "Resource", props=props)
                self.primary_key = self.kms_stack.primary_key
                self.secondary_key = self.kms_stack.secondary_key

        kms_props = KmsStackProps(
            environment_suffix=environment_suffix,
            primary_region=primary_region,
            secondary_region=secondary_region
        )
        kms_stack = NestedKmsStack(
            self,
            f"KmsStack{environment_suffix}",
            props=kms_props
        )

        # Create nested VPC stack with peering
        class NestedVpcStack(NestedStack):
            def __init__(self, scope, id, props=None, **kwargs):
                super().__init__(scope, id, **kwargs)
                self.vpc_stack = VpcStack(self, "Resource", props=props)
                self.primary_vpc = self.vpc_stack.primary_vpc
                self.secondary_vpc = self.vpc_stack.secondary_vpc

        vpc_props = VpcStackProps(
            environment_suffix=environment_suffix,
            primary_region=primary_region,
            secondary_region=secondary_region
        )
        vpc_stack = NestedVpcStack(
            self,
            f"VpcStack{environment_suffix}",
            props=vpc_props
        )

        # Create nested Aurora Global Database stack
        class NestedAuroraStack(NestedStack):
            def __init__(self, scope, id, props=None, **kwargs):
                super().__init__(scope, id, **kwargs)
                self.aurora_stack = AuroraStack(self, "Resource", props=props)
                self.global_cluster = self.aurora_stack.global_cluster
                self.primary_cluster = self.aurora_stack.primary_cluster
                self.secondary_cluster = self.aurora_stack.secondary_cluster

        aurora_props = AuroraStackProps(
            environment_suffix=environment_suffix,
            primary_region=primary_region,
            secondary_region=secondary_region,
            kms_key=kms_stack.primary_key,
            vpc=vpc_stack.primary_vpc
        )
        aurora_stack = NestedAuroraStack(
            self,
            f"AuroraStack{environment_suffix}",
            props=aurora_props
        )

        # Create nested DynamoDB global tables stack
        class NestedDynamoDBStack(NestedStack):
            def __init__(self, scope, id, props=None, **kwargs):
                super().__init__(scope, id, **kwargs)
                self.ddb_stack = DynamoDBStack(self, "Resource", props=props)
                self.table = self.ddb_stack.table

        ddb_props = DynamoDBStackProps(
            environment_suffix=environment_suffix,
            primary_region=primary_region,
            secondary_region=secondary_region
        )
        ddb_stack = NestedDynamoDBStack(
            self,
            f"DynamoDBStack{environment_suffix}",
            props=ddb_props
        )

        # Create nested Lambda stack
        class NestedLambdaStack(NestedStack):
            def __init__(self, scope, id, props=None, **kwargs):
                super().__init__(scope, id, **kwargs)
                self.lambda_stack = LambdaStack(self, "Resource", props=props)
                self.primary_function = self.lambda_stack.primary_function
                self.secondary_function = self.lambda_stack.secondary_function

        lambda_props = LambdaStackProps(
            environment_suffix=environment_suffix,
            primary_region=primary_region,
            secondary_region=secondary_region,
            primary_vpc=vpc_stack.primary_vpc,
            secondary_vpc=vpc_stack.secondary_vpc,
            table=ddb_stack.table
        )
        lambda_stack = NestedLambdaStack(
            self,
            f"LambdaStack{environment_suffix}",
            props=lambda_props
        )

        # Create nested S3 stack with cross-region replication
        class NestedS3Stack(NestedStack):
            def __init__(self, scope, id, props=None, **kwargs):
                super().__init__(scope, id, **kwargs)
                self.s3_stack = S3Stack(self, "Resource", props=props)
                self.primary_bucket = self.s3_stack.primary_bucket
                self.secondary_bucket = self.s3_stack.secondary_bucket

        s3_props = S3StackProps(
            environment_suffix=environment_suffix,
            primary_region=primary_region,
            secondary_region=secondary_region,
            primary_key=kms_stack.primary_key,
            secondary_key=kms_stack.secondary_key
        )
        s3_stack = NestedS3Stack(
            self,
            f"S3Stack{environment_suffix}",
            props=s3_props
        )

        # Create nested Backup stack
        class NestedBackupStack(NestedStack):
            def __init__(self, scope, id, props=None, **kwargs):
                super().__init__(scope, id, **kwargs)
                self.backup_stack = BackupStack(self, "Resource", props=props)
                self.backup_plan = self.backup_stack.backup_plan

        backup_props = BackupStackProps(
            environment_suffix=environment_suffix,
            primary_region=primary_region,
            secondary_region=secondary_region,
            aurora_cluster_arn=aurora_stack.primary_cluster.cluster_arn,
            dynamodb_table_arn=ddb_stack.table.table_arn
        )
        backup_stack = NestedBackupStack(
            self,
            f"BackupStack{environment_suffix}",
            props=backup_props
        )

        # Create nested Route53 stack
        class NestedRoute53Stack(NestedStack):
            def __init__(self, scope, id, props=None, **kwargs):
                super().__init__(scope, id, **kwargs)
                self.route53_stack = Route53Stack(self, "Resource", props=props)
                self.hosted_zone = self.route53_stack.hosted_zone

        route53_props = Route53StackProps(
            environment_suffix=environment_suffix,
            primary_function_url=f"{lambda_stack.primary_function.function_name}.lambda.{primary_region}.amazonaws.com",
            secondary_function_url=f"{lambda_stack.secondary_function.function_name}.lambda.{secondary_region}.amazonaws.com"
        )
        route53_stack = NestedRoute53Stack(
            self,
            f"Route53Stack{environment_suffix}",
            props=route53_props
        )

        # Create nested Monitoring stack
        class NestedMonitoringStack(NestedStack):
            def __init__(self, scope, id, props=None, **kwargs):
                super().__init__(scope, id, **kwargs)
                self.monitoring_stack = MonitoringStack(self, "Resource", props=props)
                self.dashboard = self.monitoring_stack.dashboard

        monitoring_props = MonitoringStackProps(
            environment_suffix=environment_suffix,
            primary_cluster=aurora_stack.primary_cluster,
            table=ddb_stack.table,
            backup_vault_name=backup_stack.backup_plan.backup_vault.backup_vault_name
        )
        monitoring_stack = NestedMonitoringStack(
            self,
            f"MonitoringStack{environment_suffix}",
            props=monitoring_props
        )

        # Outputs
        cdk.CfnOutput(
            self,
            'PrimaryRegion',
            value=primary_region,
            description='Primary AWS region'
        )
        cdk.CfnOutput(
            self,
            'SecondaryRegion',
            value=secondary_region,
            description='Secondary AWS region'
        )
        cdk.CfnOutput(
            self,
            'AuroraGlobalClusterIdentifier',
            value=aurora_stack.global_cluster.global_cluster_identifier,
            description='Aurora Global Database cluster identifier'
        )
        cdk.CfnOutput(
            self,
            'DynamoDBTableName',
            value=ddb_stack.table.table_name,
            description='DynamoDB global table name'
        )