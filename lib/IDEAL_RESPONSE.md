# ECS Fargate Flask API Infrastructure - CDK Python Implementation (IDEAL)

This implementation provides a production-ready containerized Flask API deployment on ECS Fargate with comprehensive monitoring, autoscaling, and high availability across 3 availability zones. This corrected version addresses critical deployment issues identified in the MODEL_RESPONSE.

## Critical Fixes Applied

1. **Container Image Reference**: Uses ECR repository with DockerImageAsset for automated build
2. **Aurora Version**: Updated to 15.8 for compatibility
3. **Build Workflow**: Integrated container build into CDK deployment
4. **Structure**: Reorganized container files into `lib/container/` directory

## File: lib/tap_stack.py

```python
from aws_cdk import (
    Stack,
    aws_ec2 as ec2,
    aws_ecs as ecs,
    aws_elasticloadbalancingv2 as elbv2,
    aws_ecr as ecr,
    aws_ecr_assets as ecr_assets,
    aws_rds as rds,
    aws_secretsmanager as secretsmanager,
    aws_cloudwatch as cloudwatch,
    aws_iam as iam,
    aws_applicationautoscaling as autoscaling,
    aws_logs as logs,
    CfnOutput,
    Duration,
    RemovalPolicy,
)
from constructs import Construct


class TapStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, environment_suffix: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # VPC with public and private subnets across 3 AZs
        vpc = ec2.Vpc(
            self,
            f"vpc-{environment_suffix}",
            max_azs=3,
            nat_gateways=3,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name=f"public-subnet-{environment_suffix}",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24,
                ),
                ec2.SubnetConfiguration(
                    name=f"private-subnet-{environment_suffix}",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24,
                ),
                ec2.SubnetConfiguration(
                    name=f"isolated-subnet-{environment_suffix}",
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                    cidr_mask=24,
                ),
            ],
        )

        # ECR Repository with lifecycle rules
        ecr_repository = ecr.Repository(
            self,
            f"ecr-repository-{environment_suffix}",
            repository_name=f"flask-api-{environment_suffix}",
            removal_policy=RemovalPolicy.DESTROY,
            lifecycle_rules=[
                ecr.LifecycleRule(
                    description="Keep only last 10 images",
                    max_image_count=10,
                    rule_priority=1,
                )
            ],
        )

        # CRITICAL FIX: Build Flask container image using CDK Docker Asset
        # This ensures the container is built and pushed before ECS tries to use it
        flask_image = ecr_assets.DockerImageAsset(
            self,
            f"flask-image-{environment_suffix}",
            directory="lib/container",
            file="Dockerfile",
        )

        # RDS Aurora PostgreSQL cluster
        db_security_group = ec2.SecurityGroup(
            self,
            f"db-sg-{environment_suffix}",
            vpc=vpc,
            description="Security group for Aurora PostgreSQL cluster",
            allow_all_outbound=True,
        )

        # CRITICAL FIX: Use Aurora PostgreSQL 15.8 (current supported version)
        aurora_cluster = rds.DatabaseCluster(
            self,
            f"aurora-cluster-{environment_suffix}",
            engine=rds.DatabaseClusterEngine.aurora_postgres(
                version=rds.AuroraPostgresEngineVersion.of("15.8", "15")
            ),
            writer=rds.ClusterInstance.serverless_v2(
                f"writer-{environment_suffix}",
            ),
            readers=[
                rds.ClusterInstance.serverless_v2(
                    f"reader-{environment_suffix}",
                    scale_with_writer=True,
                )
            ],
            serverless_v2_min_capacity=0.5,
            serverless_v2_max_capacity=2,
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_ISOLATED),
            security_groups=[db_security_group],
            default_database_name="productdb",
            storage_encrypted=True,
            backup=rds.BackupProps(
                retention=Duration.days(7),
                preferred_window="03:00-04:00",
            ),
            removal_policy=RemovalPolicy.DESTROY,
        )

        # Store database connection string in Secrets Manager
        db_connection_secret = secretsmanager.Secret(
            self,
            f"db-connection-secret-{environment_suffix}",
            secret_name=f"flask-api-db-connection-{environment_suffix}",
            generate_secret_string=secretsmanager.SecretStringGenerator(
                secret_string_template='{"username": "postgres"}',
                generate_string_key="password",
                exclude_punctuation=True,
            ),
            removal_policy=RemovalPolicy.DESTROY,
        )

        # ECS Cluster with Container Insights
        cluster = ecs.Cluster(
            self,
            f"ecs-cluster-{environment_suffix}",
            cluster_name=f"flask-api-cluster-{environment_suffix}",
            vpc=vpc,
            container_insights=True,
        )

        # Add Fargate capacity providers with Spot at 70% weight
        cluster.enable_fargate_capacity_providers()

        # Application Load Balancer
        alb_security_group = ec2.SecurityGroup(
            self,
            f"alb-sg-{environment_suffix}",
            vpc=vpc,
            description="Security group for Application Load Balancer",
            allow_all_outbound=True,
        )
        alb_security_group.add_ingress_rule(
            ec2.Peer.any_ipv4(),
            ec2.Port.tcp(80),
            "Allow HTTP traffic from internet",
        )

        alb = elbv2.ApplicationLoadBalancer(
            self,
            f"alb-{environment_suffix}",
            vpc=vpc,
            internet_facing=True,
            security_group=alb_security_group,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PUBLIC),
        )

        # Task execution role
        task_execution_role = iam.Role(
            self,
            f"task-execution-role-{environment_suffix}",
            assumed_by=iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AmazonECSTaskExecutionRolePolicy"
                ),
                iam.ManagedPolicy.from_aws_managed_policy_name("CloudWatchLogsFullAccess"),
            ],
        )

        # Grant task execution role access to secrets
        db_connection_secret.grant_read(task_execution_role)
        aurora_cluster.secret.grant_read(task_execution_role)

        # Task role for application
        task_role = iam.Role(
            self,
            f"task-role-{environment_suffix}",
            assumed_by=iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("AWSXRayDaemonWriteAccess"),
            ],
        )

        # Grant task role access to secrets
        db_connection_secret.grant_read(task_role)

        # Task definition with Flask container and X-Ray sidecar
        task_definition = ecs.FargateTaskDefinition(
            self,
            f"task-definition-{environment_suffix}",
            memory_limit_mib=1024,
            cpu=512,
            execution_role=task_execution_role,
            task_role=task_role,
        )

        # CloudWatch Logs for containers
        flask_log_group = logs.LogGroup(
            self,
            f"flask-logs-{environment_suffix}",
            log_group_name=f"/ecs/flask-api-{environment_suffix}",
            removal_policy=RemovalPolicy.DESTROY,
        )

        xray_log_group = logs.LogGroup(
            self,
            f"xray-logs-{environment_suffix}",
            log_group_name=f"/ecs/xray-daemon-{environment_suffix}",
            removal_policy=RemovalPolicy.DESTROY,
        )

        # CRITICAL FIX: Use the built Docker image from ECR asset
        # This ensures the Flask application is actually running in the container
        flask_container = task_definition.add_container(
            f"flask-app-{environment_suffix}",
            image=ecs.ContainerImage.from_docker_image_asset(flask_image),
            logging=ecs.LogDrivers.aws_logs(
                stream_prefix="flask",
                log_group=flask_log_group,
            ),
            environment={
                "AWS_REGION": self.region,
                "AWS_XRAY_DAEMON_ADDRESS": "localhost:2000",
            },
            secrets={
                "DB_CONNECTION_STRING": ecs.Secret.from_secrets_manager(db_connection_secret),
                "DB_PASSWORD": ecs.Secret.from_secrets_manager(aurora_cluster.secret, "password"),
                "DB_HOST": ecs.Secret.from_secrets_manager(aurora_cluster.secret, "host"),
                "DB_PORT": ecs.Secret.from_secrets_manager(aurora_cluster.secret, "port"),
                "DB_NAME": ecs.Secret.from_secrets_manager(aurora_cluster.secret, "dbname"),
                "DB_USERNAME": ecs.Secret.from_secrets_manager(aurora_cluster.secret, "username"),
            },
        )

        flask_container.add_port_mappings(
            ecs.PortMapping(container_port=5000, protocol=ecs.Protocol.TCP)
        )

        # X-Ray daemon sidecar container
        xray_container = task_definition.add_container(
            f"xray-daemon-{environment_suffix}",
            image=ecs.ContainerImage.from_registry("public.ecr.aws/xray/aws-xray-daemon:latest"),
            logging=ecs.LogDrivers.aws_logs(
                stream_prefix="xray",
                log_group=xray_log_group,
            ),
            cpu=32,
            memory_reservation_mib=256,
        )

        xray_container.add_port_mappings(
            ecs.PortMapping(container_port=2000, protocol=ecs.Protocol.UDP)
        )

        # ECS Service security group
        service_security_group = ec2.SecurityGroup(
            self,
            f"service-sg-{environment_suffix}",
            vpc=vpc,
            description="Security group for ECS service",
            allow_all_outbound=True,
        )

        # Allow ALB to reach ECS tasks
        service_security_group.add_ingress_rule(
            alb_security_group,
            ec2.Port.tcp(5000),
            "Allow traffic from ALB",
        )

        # Allow ECS tasks to reach Aurora
        db_security_group.add_ingress_rule(
            service_security_group,
            ec2.Port.tcp(5432),
            "Allow traffic from ECS tasks",
        )

        # ECS Service with Fargate Spot
        service = ecs.FargateService(
            self,
            f"flask-service-{environment_suffix}",
            cluster=cluster,
            task_definition=task_definition,
            desired_count=2,
            min_healthy_percent=50,
            max_healthy_percent=200,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
            security_groups=[service_security_group],
            capacity_provider_strategies=[
                ecs.CapacityProviderStrategy(
                    capacity_provider="FARGATE_SPOT",
                    weight=70,
                    base=0,
                ),
                ecs.CapacityProviderStrategy(
                    capacity_provider="FARGATE",
                    weight=30,
                    base=1,
                ),
            ],
            enable_execute_command=True,
        )

        # Target group for API traffic
        api_target_group = elbv2.ApplicationTargetGroup(
            self,
            f"api-tg-{environment_suffix}",
            vpc=vpc,
            port=5000,
            protocol=elbv2.ApplicationProtocol.HTTP,
            target_type=elbv2.TargetType.IP,
            health_check=elbv2.HealthCheck(
                path="/health",
                interval=Duration.seconds(30),
                timeout=Duration.seconds(5),
                healthy_threshold_count=2,
                unhealthy_threshold_count=3,
            ),
            deregistration_delay=Duration.seconds(30),
        )

        # Register ECS service with target group
        service.attach_to_application_target_group(api_target_group)

        # ALB Listener with path-based routing
        listener = alb.add_listener(
            f"listener-{environment_suffix}",
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            default_action=elbv2.ListenerAction.fixed_response(
                status_code=404,
                content_type="text/plain",
                message_body="Not Found",
            ),
        )

        # Route /api/* to API target group
        listener.add_action(
            f"api-route-{environment_suffix}",
            priority=10,
            conditions=[elbv2.ListenerCondition.path_patterns(["/api/*"])],
            action=elbv2.ListenerAction.forward([api_target_group]),
        )

        # Route /health to API target group
        listener.add_action(
            f"health-route-{environment_suffix}",
            priority=20,
            conditions=[elbv2.ListenerCondition.path_patterns(["/health"])],
            action=elbv2.ListenerAction.forward([api_target_group]),
        )

        # Auto Scaling - CPU based
        scaling = service.auto_scale_task_count(
            min_capacity=2,
            max_capacity=10,
        )

        scaling.scale_on_cpu_utilization(
            f"cpu-scaling-{environment_suffix}",
            target_utilization_percent=70,
            scale_in_cooldown=Duration.seconds(60),
            scale_out_cooldown=Duration.seconds(60),
        )

        # CloudWatch Alarms
        # High CPU Alarm
        high_cpu_alarm = cloudwatch.Alarm(
            self,
            f"high-cpu-alarm-{environment_suffix}",
            metric=service.metric_cpu_utilization(),
            threshold=80,
            evaluation_periods=2,
            datapoints_to_alarm=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            alarm_description="Alert when CPU utilization exceeds 80%",
        )

        # Low task count alarm
        low_task_alarm = cloudwatch.Alarm(
            self,
            f"low-task-alarm-{environment_suffix}",
            metric=service.metric("RunningTaskCount", statistic="Average"),
            threshold=2,
            evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
            alarm_description="Alert when running task count is less than 2",
        )

        # CloudWatch Dashboard
        dashboard = cloudwatch.Dashboard(
            self,
            f"dashboard-{environment_suffix}",
            dashboard_name=f"flask-api-dashboard-{environment_suffix}",
        )

        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="ECS Service CPU Utilization",
                left=[service.metric_cpu_utilization()],
            ),
            cloudwatch.GraphWidget(
                title="ECS Service Memory Utilization",
                left=[service.metric_memory_utilization()],
            ),
        )

        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="ALB Target Response Time",
                left=[
                    api_target_group.metric_target_response_time(
                        statistic="Average"
                    )
                ],
            ),
            cloudwatch.GraphWidget(
                title="ALB Request Count",
                left=[alb.metric_request_count(statistic="Sum")],
            ),
        )

        dashboard.add_widgets(
            cloudwatch.SingleValueWidget(
                title="Running Tasks",
                metrics=[service.metric("RunningTaskCount", statistic="Average")],
            ),
            cloudwatch.SingleValueWidget(
                title="Target Health Count",
                metrics=[
                    api_target_group.metric_healthy_host_count(statistic="Average")
                ],
            ),
        )

        # Stack Outputs
        CfnOutput(
            self,
            "ALBDnsName",
            value=alb.load_balancer_dns_name,
            description="Application Load Balancer DNS Name",
            export_name=f"alb-dns-name-{environment_suffix}",
        )

        CfnOutput(
            self,
            "ECRRepositoryUri",
            value=ecr_repository.repository_uri,
            description="ECR Repository URI",
            export_name=f"ecr-repository-uri-{environment_suffix}",
        )

        CfnOutput(
            self,
            "CloudWatchDashboardUrl",
            value=(
                f"https://console.aws.amazon.com/cloudwatch/home?region={self.region}"
                f"#dashboards:name={dashboard.dashboard_name}"
            ),
            description="CloudWatch Dashboard URL",
            export_name=f"dashboard-url-{environment_suffix}",
        )

        CfnOutput(
            self,
            "ECSClusterName",
            value=cluster.cluster_name,
            description="ECS Cluster Name",
            export_name=f"ecs-cluster-name-{environment_suffix}",
        )

        CfnOutput(
            self,
            "ECSServiceName",
            value=service.service_name,
            description="ECS Service Name",
            export_name=f"ecs-service-name-{environment_suffix}",
        )

        CfnOutput(
            self,
            "AuroraDatabaseEndpoint",
            value=aurora_cluster.cluster_endpoint.hostname,
            description="Aurora Database Endpoint",
            export_name=f"aurora-endpoint-{environment_suffix}",
        )

        CfnOutput(
            self,
            "VpcId",
            value=vpc.vpc_id,
            description="VPC ID",
            export_name=f"vpc-id-{environment_suffix}",
        )

        CfnOutput(
            self,
            "FlaskImageUri",
            value=flask_image.image_uri,
            description="Flask Docker Image URI",
            export_name=f"flask-image-uri-{environment_suffix}",
        )
```

## File: bin/tap.py

```python
#!/usr/bin/env python3
import os
import aws_cdk as cdk
from lib.tap_stack import TapStack


app = cdk.App()

# Get environment suffix from context or use default
environment_suffix = app.node.try_get_context("environmentSuffix") or "dev"

# Get AWS account and region from environment variables or use defaults
env = cdk.Environment(
    account=os.environ.get("CDK_DEFAULT_ACCOUNT"),
    region=os.environ.get("CDK_DEFAULT_REGION", "ap-southeast-2"),
)

TapStack(
    app,
    f"TapStack-{environment_suffix}",
    environment_suffix=environment_suffix,
    env=env,
    description=f"Flask API ECS Fargate infrastructure with ALB and Aurora PostgreSQL ({environment_suffix})",
)

app.synth()
```

## File: lib/__init__.py

```python
# AWS CDK Stack initialization
```

## File: lib/container/sample_flask_app.py

```python
"""
Sample Flask application for demonstration purposes.
This is containerized and automatically deployed to ECS via CDK.
"""
from flask import Flask, jsonify, request
import os
import json
import boto3
from aws_xray_sdk.core import xray_recorder
from aws_xray_sdk.ext.flask.middleware import XRayMiddleware

app = Flask(__name__)

# Configure X-Ray
xray_recorder.configure(service='flask-api')
XRayMiddleware(app, xray_recorder)


def get_db_connection_info():
    """Retrieve database connection information from environment variables."""
    return {
        'host': os.environ.get('DB_HOST'),
        'port': os.environ.get('DB_PORT'),
        'database': os.environ.get('DB_NAME'),
        'username': os.environ.get('DB_USERNAME'),
    }


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint for ALB target group."""
    return jsonify({
        'status': 'healthy',
        'service': 'flask-api',
        'version': '1.0.0'
    }), 200


@app.route('/api/products', methods=['GET'])
def get_products():
    """Get all products from the catalog."""
    # In production, this would query the Aurora PostgreSQL database
    sample_products = [
        {
            'id': 1,
            'name': 'Sample Product 1',
            'price': 29.99,
            'category': 'Electronics'
        },
        {
            'id': 2,
            'name': 'Sample Product 2',
            'price': 49.99,
            'category': 'Books'
        }
    ]

    return jsonify({
        'products': sample_products,
        'count': len(sample_products)
    }), 200


@app.route('/api/products/<int:product_id>', methods=['GET'])
def get_product(product_id):
    """Get a specific product by ID."""
    # In production, this would query the database
    sample_product = {
        'id': product_id,
        'name': f'Product {product_id}',
        'price': 39.99,
        'category': 'General'
    }

    return jsonify(sample_product), 200


@app.route('/api/products', methods=['POST'])
def create_product():
    """Create a new product."""
    data = request.get_json()

    # Validate input
    if not data or 'name' not in data or 'price' not in data:
        return jsonify({'error': 'Missing required fields'}), 400

    # In production, this would insert into the database
    new_product = {
        'id': 123,
        'name': data['name'],
        'price': data['price'],
        'category': data.get('category', 'General')
    }

    return jsonify(new_product), 201


@app.route('/api/info', methods=['GET'])
def get_info():
    """Get service information and configuration."""
    db_info = get_db_connection_info()

    return jsonify({
        'service': 'flask-api',
        'version': '1.0.0',
        'region': os.environ.get('AWS_REGION'),
        'database': {
            'host': db_info['host'],
            'port': db_info['port'],
            'database': db_info['database']
        }
    }), 200


if __name__ == '__main__':
    # Run Flask application
    app.run(host='0.0.0.0', port=5000, debug=False)
```

## File: lib/container/Dockerfile

```dockerfile
FROM public.ecr.aws/docker/library/python:3.9-slim

WORKDIR /app

# Install dependencies
RUN pip install --no-cache-dir \
    flask==2.3.0 \
    boto3==1.28.0 \
    psycopg2-binary==2.9.7 \
    aws-xray-sdk==2.12.0

# Copy application code
COPY sample_flask_app.py .

# Expose port
EXPOSE 5000

# Set environment variables
ENV FLASK_APP=sample_flask_app.py
ENV PYTHONUNBUFFERED=1

# Run the application
CMD ["python", "sample_flask_app.py"]
```

## File: requirements.txt

```
aws-cdk-lib==2.110.0
constructs>=10.0.0,<11.0.0
boto3>=1.28.0
```

## File: cdk.json

```json
{
  "app": "python3 bin/tap.py",
  "watch": {
    "include": ["**"],
    "exclude": [
      "README.md",
      "cdk*.json",
      "requirements*.txt",
      "source.bat",
      "**/__init__.py",
      "**/__pycache__",
      "tests"
    ]
  },
  "context": {
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
    "@aws-cdk/core:checkSecretUsage": true,
    "@aws-cdk/core:target-partitions": ["aws", "aws-cn"],
    "@aws-cdk-containers/ecs-service-extensions:enableDefaultLogDriver": true,
    "@aws-cdk/aws-ec2:uniqueImdsv2TemplateName": true,
    "@aws-cdk/aws-ecs:arnFormatIncludesClusterName": true,
    "@aws-cdk/aws-iam:minimizePolicies": true,
    "@aws-cdk/core:validateSnapshotRemovalPolicy": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeyAliasStackSafeResourceName": true,
    "@aws-cdk/aws-s3:createDefaultLoggingPolicy": true,
    "@aws-cdk/aws-sns-subscriptions:restrictSqsDescryption": true,
    "@aws-cdk/aws-apigateway:disableCloudWatchRole": true,
    "@aws-cdk/core:enablePartitionLiterals": true,
    "@aws-cdk/aws-events:eventsTargetQueueSameAccount": true,
    "@aws-cdk/aws-iam:standardizedServicePrincipals": true,
    "@aws-cdk/aws-ecs:disableExplicitDeploymentControllerForCircuitBreaker": true,
    "@aws-cdk/aws-iam:importedRoleStackSafeDefaultPolicyName": true,
    "@aws-cdk/aws-s3:serverAccessLogsUseBucketPolicy": true,
    "@aws-cdk/aws-route53-patters:useCertificate": true,
    "@aws-cdk/customresources:installLatestAwsSdkDefault": false,
    "@aws-cdk/aws-rds:databaseProxyUniqueResourceName": true,
    "@aws-cdk/aws-codedeploy:removeAlarmsFromDeploymentGroup": true,
    "@aws-cdk/aws-apigateway:authorizerChangeDeploymentLogicalId": true,
    "@aws-cdk/aws-ec2:launchTemplateDefaultUserData": true,
    "@aws-cdk/aws-secretsmanager:useAttachedSecretResourcePolicyForSecretTargetAttachments": true,
    "@aws-cdk/aws-redshift:columnId": true,
    "@aws-cdk/aws-stepfunctions-tasks:enableEmrServicePolicyV2": true,
    "@aws-cdk/aws-ec2:restrictDefaultSecurityGroup": true,
    "@aws-cdk/aws-apigateway:requestValidatorUniqueId": true,
    "@aws-cdk/aws-kms:aliasNameRef": true,
    "@aws-cdk/aws-autoscaling:generateLaunchTemplateInsteadOfLaunchConfig": true,
    "@aws-cdk/core:includePrefixInUniqueNameGeneration": true,
    "@aws-cdk/aws-efs:denyAnonymousAccess": true,
    "@aws-cdk/aws-opensearchservice:enableOpensearchMultiAzWithStandby": true,
    "@aws-cdk/aws-lambda-nodejs:useLatestRuntimeVersion": true,
    "@aws-cdk/aws-efs:mountTargetOrderInsensitiveLogicalId": true,
    "@aws-cdk/aws-rds:auroraClusterChangeScopeOfInstanceParameterGroupWithEachParameters": true,
    "@aws-cdk/aws-appsync:useArnForSourceApiAssociationIdentifier": true,
    "@aws-cdk/aws-rds:preventRenderingDeprecatedCredentials": true,
    "@aws-cdk/aws-codepipeline-actions:useNewDefaultBranchForCodeCommitSource": true,
    "@aws-cdk/aws-cloudwatch-actions:changeLambdaPermissionLogicalIdForLambdaAction": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeysDefaultValueToFalse": true,
    "@aws-cdk/aws-codepipeline:defaultPipelineTypeToV2": true,
    "@aws-cdk/aws-kms:reduceCrossAccountRegionPolicyScope": true,
    "@aws-cdk/aws-eks:nodegroupNameAttribute": true,
    "@aws-cdk/aws-ec2:ebsDefaultGp3Volume": true,
    "@aws-cdk/aws-ecs:removeDefaultDeploymentAlarm": true,
    "@aws-cdk/custom-resources:logApiResponseDataPropertyTrueDefault": false,
    "@aws-cdk/aws-s3:keepNotificationInImportedBucket": false,
    "environmentSuffix": "test"
  }
}
```

## File: tests/test_integration.py

```python
"""
Integration tests for the Flask API ECS Fargate infrastructure.
Tests read configuration from cfn-outputs/flat-outputs.json.
"""
import json
import os
import pytest
import boto3
import requests
from time import sleep


class TestInfrastructureDeployment:
    """Test suite for infrastructure deployment."""

    @classmethod
    def setup_class(cls):
        """Load stack outputs from cfn-outputs/flat-outputs.json."""
        outputs_file = os.path.join(
            os.path.dirname(os.path.dirname(__file__)),
            "cfn-outputs",
            "flat-outputs.json"
        )

        if not os.path.exists(outputs_file):
            raise FileNotFoundError(
                f"Stack outputs file not found: {outputs_file}\n"
                "Please deploy the stack and export outputs first."
            )

        with open(outputs_file, "r") as f:
            cls.outputs = json.load(f)

        cls.alb_dns = cls._get_output("ALBDnsName")
        cls.ecr_uri = cls._get_output("ECRRepositoryUri")
        cls.dashboard_url = cls._get_output("CloudWatchDashboardUrl")
        cls.cluster_name = cls._get_output("ECSClusterName")
        cls.service_name = cls._get_output("ECSServiceName")
        cls.aurora_endpoint = cls._get_output("AuroraDatabaseEndpoint")
        cls.vpc_id = cls._get_output("VpcId")

        # Initialize AWS clients
        cls.ecs_client = boto3.client("ecs")
        cls.elbv2_client = boto3.client("elbv2")
        cls.rds_client = boto3.client("rds")
        cls.ec2_client = boto3.client("ec2")
        cls.ecr_client = boto3.client("ecr")
        cls.cloudwatch_client = boto3.client("cloudwatch")

    @staticmethod
    def _get_output(key):
        """Extract output value by key from stack outputs."""
        for output in TestInfrastructureDeployment.outputs:
            if output.get("OutputKey") == key:
                return output.get("OutputValue")
        raise ValueError(f"Output key '{key}' not found in stack outputs")

    def test_vpc_configuration(self):
        """Test VPC is configured with correct subnets and NAT gateways."""
        response = self.ec2_client.describe_vpcs(VpcIds=[self.vpc_id])
        assert len(response["Vpcs"]) == 1

        # Check subnets
        subnets = self.ec2_client.describe_subnets(
            Filters=[{"Name": "vpc-id", "Values": [self.vpc_id]}]
        )
        subnet_count = len(subnets["Subnets"])
        assert subnet_count >= 9, f"Expected at least 9 subnets (3 types x 3 AZs), found {subnet_count}"

        # Check NAT gateways
        nat_gateways = self.ec2_client.describe_nat_gateways(
            Filters=[{"Name": "vpc-id", "Values": [self.vpc_id]}]
        )
        nat_count = len([ng for ng in nat_gateways["NatGateways"] if ng["State"] == "available"])
        assert nat_count == 3, f"Expected 3 NAT gateways, found {nat_count}"

    def test_ecs_cluster_exists(self):
        """Test ECS cluster exists and has Container Insights enabled."""
        response = self.ecs_client.describe_clusters(clusters=[self.cluster_name])
        assert len(response["clusters"]) == 1

        cluster = response["clusters"][0]
        assert cluster["status"] == "ACTIVE"

        # Check Container Insights
        settings = cluster.get("settings", [])
        container_insights = any(
            s["name"] == "containerInsights" and s["value"] == "enabled"
            for s in settings
        )
        assert container_insights, "Container Insights should be enabled"

    def test_ecs_service_configuration(self):
        """Test ECS service is configured correctly with Fargate Spot."""
        response = self.ecs_client.describe_services(
            cluster=self.cluster_name,
            services=[self.service_name]
        )

        assert len(response["services"]) == 1
        service = response["services"][0]

        assert service["status"] == "ACTIVE"
        assert service["desiredCount"] >= 2
        assert service["launchType"] == "FARGATE" or "capacityProviderStrategy" in service

        # Check capacity provider strategy
        if "capacityProviderStrategy" in service:
            strategies = service["capacityProviderStrategy"]
            fargate_spot = next(
                (s for s in strategies if s["capacityProvider"] == "FARGATE_SPOT"),
                None
            )
            assert fargate_spot is not None, "FARGATE_SPOT capacity provider should be configured"
            assert fargate_spot["weight"] == 70, "FARGATE_SPOT weight should be 70"

    def test_ecs_service_running_tasks(self):
        """Test ECS service has running tasks."""
        response = self.ecs_client.describe_services(
            cluster=self.cluster_name,
            services=[self.service_name]
        )

        service = response["services"][0]
        running_count = service["runningCount"]

        assert running_count >= 2, f"Expected at least 2 running tasks, found {running_count}"

    def test_ecr_repository_exists(self):
        """Test ECR repository exists with lifecycle policy."""
        repo_name = self.ecr_uri.split("/")[-1]

        response = self.ecr_client.describe_repositories(
            repositoryNames=[repo_name]
        )
        assert len(response["repositories"]) == 1

        # Check lifecycle policy
        try:
            policy_response = self.ecr_client.get_lifecycle_policy(
                repositoryName=repo_name
            )
            policy = json.loads(policy_response["lifecyclePolicyText"])
            assert len(policy["rules"]) > 0, "ECR lifecycle policy should have rules"
        except self.ecr_client.exceptions.LifecyclePolicyNotFoundException:
            pytest.fail("ECR lifecycle policy not found")

    def test_alb_health_check(self):
        """Test ALB health check endpoint responds correctly."""
        url = f"http://{self.alb_dns}/health"

        # Retry logic for eventual consistency
        max_retries = 5
        for i in range(max_retries):
            try:
                response = requests.get(url, timeout=10)
                if response.status_code == 200:
                    data = response.json()
                    assert "status" in data
                    assert data["status"] == "healthy"
                    return
            except requests.exceptions.RequestException:
                if i == max_retries - 1:
                    raise
                sleep(10)

        pytest.fail("Health check endpoint did not respond successfully")

    def test_alb_target_group_health(self):
        """Test ALB target group has healthy targets."""
        # Get load balancer ARN
        albs = self.elbv2_client.describe_load_balancers()
        alb = next(
            (lb for lb in albs["LoadBalancers"] if self.alb_dns in lb["DNSName"]),
            None
        )
        assert alb is not None, "ALB not found"

        # Get target groups
        target_groups = self.elbv2_client.describe_target_groups(
            LoadBalancerArn=alb["LoadBalancerArn"]
        )

        assert len(target_groups["TargetGroups"]) > 0, "No target groups found"

        # Check target health
        for tg in target_groups["TargetGroups"]:
            health = self.elbv2_client.describe_target_health(
                TargetGroupArn=tg["TargetGroupArn"]
            )

            healthy_targets = [
                t for t in health["TargetHealthDescriptions"]
                if t["TargetHealth"]["State"] == "healthy"
            ]

            # At least one target should be healthy
            assert len(healthy_targets) >= 1, f"No healthy targets in {tg['TargetGroupName']}"

    def test_aurora_cluster_status(self):
        """Test Aurora cluster is available and properly configured."""
        clusters = self.rds_client.describe_db_clusters()

        cluster = next(
            (c for c in clusters["DBClusters"] if self.aurora_endpoint in c["Endpoint"]),
            None
        )

        assert cluster is not None, "Aurora cluster not found"
        assert cluster["Status"] == "available"
        assert cluster["Engine"] == "aurora-postgresql"
        assert cluster["StorageEncrypted"] is True
        assert cluster["BackupRetentionPeriod"] >= 7

    def test_cloudwatch_alarms_exist(self):
        """Test CloudWatch alarms are configured."""
        response = self.cloudwatch_client.describe_alarms()

        alarm_names = [alarm["AlarmName"] for alarm in response["MetricAlarms"]]

        # Check for high CPU alarm
        high_cpu_alarms = [name for name in alarm_names if "high-cpu" in name.lower()]
        assert len(high_cpu_alarms) > 0, "High CPU alarm not found"

        # Check for low task count alarm
        low_task_alarms = [name for name in alarm_names if "low-task" in name.lower()]
        assert len(low_task_alarms) > 0, "Low task count alarm not found"

    def test_autoscaling_configuration(self):
        """Test autoscaling is configured for the ECS service."""
        service_namespace = "ecs"
        resource_id = f"service/{self.cluster_name}/{self.service_name}"

        autoscaling_client = boto3.client("application-autoscaling")

        # Check scalable targets
        targets = autoscaling_client.describe_scalable_targets(
            ServiceNamespace=service_namespace,
            ResourceIds=[resource_id]
        )

        assert len(targets["ScalableTargets"]) > 0, "No scalable targets found"

        target = targets["ScalableTargets"][0]
        assert target["MinCapacity"] == 2
        assert target["MaxCapacity"] == 10

        # Check scaling policies
        policies = autoscaling_client.describe_scaling_policies(
            ServiceNamespace=service_namespace,
            ResourceId=resource_id
        )

        assert len(policies["ScalingPolicies"]) > 0, "No scaling policies found"

    def test_stack_outputs_complete(self):
        """Test all required stack outputs are present."""
        required_outputs = [
            "ALBDnsName",
            "ECRRepositoryUri",
            "CloudWatchDashboardUrl",
            "ECSClusterName",
            "ECSServiceName",
            "AuroraDatabaseEndpoint",
            "VpcId"
        ]

        output_keys = [output.get("OutputKey") for output in self.outputs]

        for required in required_outputs:
            assert required in output_keys, f"Required output '{required}' not found"


class TestAPIEndpoints:
    """Test suite for API endpoint functionality."""

    @classmethod
    def setup_class(cls):
        """Load ALB DNS from stack outputs."""
        outputs_file = os.path.join(
            os.path.dirname(os.path.dirname(__file__)),
            "cfn-outputs",
            "flat-outputs.json"
        )

        with open(outputs_file, "r") as f:
            outputs = json.load(f)

        cls.alb_dns = None
        for output in outputs:
            if output.get("OutputKey") == "ALBDnsName":
                cls.alb_dns = output.get("OutputValue")
                break

        assert cls.alb_dns is not None, "ALB DNS not found in outputs"
        cls.base_url = f"http://{cls.alb_dns}"

    def test_health_endpoint_response(self):
        """Test health endpoint returns correct response format."""
        response = requests.get(f"{self.base_url}/health", timeout=10)
        assert response.status_code == 200

        data = response.json()
        assert "status" in data
        assert data["status"] == "healthy"

    def test_api_products_endpoint(self):
        """Test /api/products endpoint returns product list."""
        response = requests.get(f"{self.base_url}/api/products", timeout=10)
        assert response.status_code == 200

        data = response.json()
        assert "products" in data
        assert "count" in data
        assert len(data["products"]) > 0

    def test_invalid_path_returns_404(self):
        """Test ALB returns 404 for invalid paths."""
        response = requests.get(f"{self.base_url}/invalid-path", timeout=10)
        assert response.status_code == 404
```

## File: tests/__init__.py

```python
# Test package initialization
```

## File: tests/requirements.txt

```
pytest>=7.4.0
boto3>=1.28.0
requests>=2.31.0
```

## File: .gitignore

```
.cdk.staging/
cdk.out/
*.pyc
__pycache__/
.pytest_cache/
.venv/
venv/
*.egg-info/
.DS_Store
cfn-outputs/
```

## Key Improvements Summary

1. **Container Build Integration**: Uses `DockerImageAsset` to automatically build and push the Flask container during CDK deployment
2. **Correct Image Reference**: References the built Docker image instead of base Python image
3. **Aurora Version**: Updated to 15.8 using flexible version specification
4. **Directory Structure**: Container files organized in `lib/container/` instead of misleading `lib/lambda/`
5. **Additional Output**: Added FlaskImageUri to stack outputs for reference
6. **Deployment Reliability**: Container is guaranteed to exist before ECS attempts to use it

## Deployment Instructions

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Bootstrap CDK (first time only):
```bash
cdk bootstrap aws://ACCOUNT-NUMBER/ap-southeast-2
```

3. Deploy stack (container builds automatically):
```bash
cdk deploy -c environmentSuffix=synth8v7c3
```

4. Export outputs for testing:
```bash
mkdir -p cfn-outputs
aws cloudformation describe-stacks --stack-name TapStack-synth8v7c3 --query "Stacks[0].Outputs" > cfn-outputs/outputs.json
python -c "import json; outputs = json.load(open('cfn-outputs/outputs.json')); flat = {o['OutputKey']: o['OutputValue'] for o in outputs}; json.dump(flat, open('cfn-outputs/flat-outputs.json', 'w'), indent=2)"
```

5. Run integration tests:
```bash
pip install -r tests/requirements.txt
pytest tests/test_integration.py -v
```

## What Changed from MODEL_RESPONSE

1. Line 6: Added `aws_ecr_assets` import
2. Lines 68-73: Added DockerImageAsset for container build
3. Line 77: Updated Aurora version from VER_15_3 to of("15.8", "15")
4. Lines 207-208: Changed from registry image to DockerImageAsset
5. Lines 488-493: Added FlaskImageUri output
6. File structure: Container files moved to lib/container/ directory

These changes ensure the Flask application is built, pushed, and correctly referenced before ECS attempts to run it, resolving the critical deployment blocker.
