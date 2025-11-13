"""
Main CDK stack for Payment Processing API infrastructure.
"""
from typing import Optional
import aws_cdk as cdk
from constructs import Construct

# Import nested stacks
from .network_stack import NetworkStack, NetworkStackProps
from .security_stack import SecurityStack, SecurityStackProps
from .database_stack import DatabaseStack, DatabaseStackProps
from .compute_stack import ComputeStack, ComputeStackProps
from .api_stack import ApiStack, ApiStackProps
from .storage_stack import StorageStack, StorageStackProps
from .monitoring_stack import MonitoringStack, MonitoringStackProps


class TapStackProps(cdk.StackProps):
    """Properties for TapStack."""

    def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix


class TapStack(cdk.Stack):
    """Main orchestration stack for payment processing infrastructure."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: Optional[TapStackProps] = None,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        environment_suffix = (
            props.environment_suffix if props else None
        ) or self.node.try_get_context('environmentSuffix') or 'dev'

        # 1. Network infrastructure
        network_stack = NetworkStack(
            self,
            f"NetworkStack{environment_suffix}",
            props=NetworkStackProps(environment_suffix=environment_suffix)
        )

        # 2. Security (KMS, Secrets Manager, IAM)
        security_stack = SecurityStack(
            self,
            f"SecurityStack{environment_suffix}",
            props=SecurityStackProps(
                environment_suffix=environment_suffix,
                vpc=network_stack.vpc
            )
        )
        security_stack.node.add_dependency(network_stack)

        # 3. Database (RDS Aurora)
        database_stack = DatabaseStack(
            self,
            f"DatabaseStack{environment_suffix}",
            props=DatabaseStackProps(
                environment_suffix=environment_suffix,
                vpc=network_stack.vpc,
                kms_key=security_stack.rds_kms_key,
                db_security_group=network_stack.database_security_group
            )
        )
        database_stack.node.add_dependency(network_stack)
        database_stack.node.add_dependency(security_stack)

        # 4. Storage (S3)
        storage_stack = StorageStack(
            self,
            f"StorageStack{environment_suffix}",
            props=StorageStackProps(
                environment_suffix=environment_suffix,
                kms_key=security_stack.s3_kms_key
            )
        )
        storage_stack.node.add_dependency(security_stack)

        # 5. Compute (ECS, Lambda, SQS)
        compute_stack = ComputeStack(
            self,
            f"ComputeStack{environment_suffix}",
            props=ComputeStackProps(
                environment_suffix=environment_suffix,
                vpc=network_stack.vpc,
                alb=network_stack.alb,
                alb_security_group=network_stack.alb_security_group,
                ecs_security_group=network_stack.ecs_security_group,
                lambda_security_group=network_stack.lambda_security_group,
                database=database_stack.cluster,
                storage_bucket=storage_stack.document_bucket,
                kms_key=security_stack.lambda_kms_key
            )
        )
        compute_stack.node.add_dependency(network_stack)
        compute_stack.node.add_dependency(database_stack)
        compute_stack.node.add_dependency(storage_stack)
        compute_stack.node.add_dependency(security_stack)

        # 6. API Gateway
        api_stack = ApiStack(
            self,
            f"ApiStack{environment_suffix}",
            props=ApiStackProps(
                environment_suffix=environment_suffix,
                alb=network_stack.alb
            )
        )
        api_stack.node.add_dependency(network_stack)

        # 7. Monitoring (CloudWatch)
        monitoring_stack = MonitoringStack(
            self,
            f"MonitoringStack{environment_suffix}",
            props=MonitoringStackProps(
                environment_suffix=environment_suffix,
                alb=network_stack.alb,
                ecs_service=compute_stack.ecs_service,
                database=database_stack.cluster,
                lambda_functions=compute_stack.lambda_functions,
                api=api_stack.api
            )
        )
        monitoring_stack.node.add_dependency(network_stack)
        monitoring_stack.node.add_dependency(compute_stack)
        monitoring_stack.node.add_dependency(database_stack)
        monitoring_stack.node.add_dependency(api_stack)

        # Outputs
        cdk.CfnOutput(
            self,
            "ALBDNSName",
            value=network_stack.alb.load_balancer_dns_name,
            description="Application Load Balancer DNS Name"
        )

        cdk.CfnOutput(
            self,
            "ApiGatewayEndpoint",
            value=api_stack.api.url,
            description="API Gateway Endpoint URL"
        )

        cdk.CfnOutput(
            self,
            "CloudWatchDashboardURL",
            value=f"https://{self.region}.console.aws.amazon.com/cloudwatch/home?region={self.region}#dashboards:name={monitoring_stack.dashboard.dashboard_name}",
            description="CloudWatch Dashboard URL"
        )

        cdk.CfnOutput(
            self,
            "DatabaseClusterEndpoint",
            value=database_stack.cluster.cluster_endpoint.hostname,
            description="RDS Aurora Cluster Endpoint"
        )

        cdk.CfnOutput(
            self,
            "DocumentBucketName",
            value=storage_stack.document_bucket.bucket_name,
            description="S3 Document Storage Bucket Name"
        )
