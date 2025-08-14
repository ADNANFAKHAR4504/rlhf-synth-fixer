# Enterprise Serverless Infrastructure - AWS Lambda with SSM Integration

I'll create a comprehensive Pulumi Python program that meets all your enterprise-scale requirements. This solution includes proper networking, security, monitoring, and cost optimization.

## Project Structure

```
serverless-infrastructure/
├── __main__.py
├── requirements.txt
├── Pulumi.yaml
├── lambda/
│   ├── function.py
│   ├── requirements.txt
│   └── layers/
│       └── python_optimized/
│           └── requirements.txt
├── config/
│   ├── dev.yaml
│   ├── staging.yaml
│   └── prod.yaml
└── README.md
```

## Main Infrastructure Code

### `__main__.py`

```python
"""
Enterprise Serverless Infrastructure - AWS Lambda with SSM Integration
Production-ready serverless infrastructure with comprehensive monitoring and security
"""

import json
import pulumi
import pulumi_aws as aws
from pulumi import Config, Output, ResourceOptions
from typing import Dict, List, Optional
import base64

# Configuration
config = Config()
environment = pulumi.get_stack()
project_name = pulumi.get_project()

# Global configuration
REGION = "us-east-1"
AVAILABILITY_ZONES = ["us-east-1a", "us-east-1b", "us-east-1c"]

# Resource naming convention
def get_resource_name(resource_type: str) -> str:
    return f"serverless-infra-{environment}-{resource_type}"

# Standard tags for all resources
def get_standard_tags() -> Dict[str, str]:
    return {
        "Environment": environment,
        "CostCenter": config.get("cost_center") or "engineering",
        "Owner": config.get("owner") or "platform-team",
        "Application": "serverless-infrastructure",
        "Backup": "required" if environment == "prod" else "optional",
        "Compliance": "required",
        "ManagedBy": "pulumi"
    }

# KMS Keys for different parameter categories
def create_kms_keys():
    """Create KMS keys for different parameter categories"""
    keys = {}
    categories = ["database", "api", "cache"]

    for category in categories:
        key = aws.kms.Key(
            f"ssm-{category}-key",
            description=f"KMS key for SSM parameters - {category}",
            deletion_window_in_days=7,
            tags={**get_standard_tags(), "Category": category}
        )

        # Create alias for the key
        aws.kms.Alias(
            f"ssm-{category}-key-alias",
            name=f"alias/{get_resource_name(f'ssm-{category}')}",
            target_key_id=key.key_id
        )

        keys[category] = key

    return keys

# VPC and Networking
def create_networking():
    """Create VPC with private subnets and VPC endpoints"""

    # VPC
    vpc = aws.ec2.Vpc(
        get_resource_name("vpc"),
        cidr_block="10.0.0.0/16",
        enable_dns_hostnames=True,
        enable_dns_support=True,
        tags={**get_standard_tags(), "Name": get_resource_name("vpc")}
    )

    # Internet Gateway
    igw = aws.ec2.InternetGateway(
        get_resource_name("igw"),
        vpc_id=vpc.id,
        tags={**get_standard_tags(), "Name": get_resource_name("igw")}
    )

    # Public subnets for NAT Gateway
    public_subnets = []
    for i, az in enumerate(AVAILABILITY_ZONES):
        subnet = aws.ec2.Subnet(
            f"{get_resource_name('public-subnet')}-{i+1}",
            vpc_id=vpc.id,
            cidr_block=f"10.0.{i+1}.0/24",
            availability_zone=az,
            map_public_ip_on_launch=True,
            tags={**get_standard_tags(), "Name": f"{get_resource_name('public-subnet')}-{i+1}", "Type": "public"}
        )
        public_subnets.append(subnet)

    # Private subnets for Lambda
    private_subnets = []
    for i, az in enumerate(AVAILABILITY_ZONES):
        subnet = aws.ec2.Subnet(
            f"{get_resource_name('private-subnet')}-{i+1}",
            vpc_id=vpc.id,
            cidr_block=f"10.0.{i+10}.0/24",
            availability_zone=az,
            tags={**get_standard_tags(), "Name": f"{get_resource_name('private-subnet')}-{i+1}", "Type": "private"}
        )
        private_subnets.append(subnet)

    # Elastic IP for NAT Gateway
    nat_eip = aws.ec2.Eip(
        get_resource_name("nat-eip"),
        domain="vpc",
        tags={**get_standard_tags(), "Name": get_resource_name("nat-eip")}
    )

    # NAT Gateway
    nat_gateway = aws.ec2.NatGateway(
        get_resource_name("nat-gateway"),
        allocation_id=nat_eip.id,
        subnet_id=public_subnets[0].id,
        tags={**get_standard_tags(), "Name": get_resource_name("nat-gateway")}
    )

    # Route tables
    public_rt = aws.ec2.RouteTable(
        get_resource_name("public-rt"),
        vpc_id=vpc.id,
        tags={**get_standard_tags(), "Name": get_resource_name("public-rt")}
    )

    private_rt = aws.ec2.RouteTable(
        get_resource_name("private-rt"),
        vpc_id=vpc.id,
        tags={**get_standard_tags(), "Name": get_resource_name("private-rt")}
    )

    # Routes
    aws.ec2.Route(
        get_resource_name("public-route"),
        route_table_id=public_rt.id,
        destination_cidr_block="0.0.0.0/0",
        gateway_id=igw.id
    )

    aws.ec2.Route(
        get_resource_name("private-route"),
        route_table_id=private_rt.id,
        destination_cidr_block="0.0.0.0/0",
        nat_gateway_id=nat_gateway.id
    )

    # Route table associations
    for i, subnet in enumerate(public_subnets):
        aws.ec2.RouteTableAssociation(
            f"{get_resource_name('public-rta')}-{i+1}",
            subnet_id=subnet.id,
            route_table_id=public_rt.id
        )

    for i, subnet in enumerate(private_subnets):
        aws.ec2.RouteTableAssociation(
            f"{get_resource_name('private-rta')}-{i+1}",
            subnet_id=subnet.id,
            route_table_id=private_rt.id
        )

    return {
        "vpc": vpc,
        "public_subnets": public_subnets,
        "private_subnets": private_subnets,
        "nat_gateway": nat_gateway
    }

def create_vpc_endpoints(vpc, private_subnets, route_table):
    """Create VPC endpoints for AWS services"""

    # Security group for VPC endpoints
    vpc_endpoint_sg = aws.ec2.SecurityGroup(
        get_resource_name("vpc-endpoint-sg"),
        vpc_id=vpc.id,
        description="Security group for VPC endpoints",
        ingress=[{
            "protocol": "tcp",
            "from_port": 443,
            "to_port": 443,
            "cidr_blocks": ["10.0.0.0/16"]
        }],
        egress=[{
            "protocol": "-1",
            "from_port": 0,
            "to_port": 0,
            "cidr_blocks": ["0.0.0.0/0"]
        }],
        tags={**get_standard_tags(), "Name": get_resource_name("vpc-endpoint-sg")}
    )

    # VPC Endpoints
    services = ["ssm", "kms", "logs", "monitoring", "xray"]
    endpoints = {}

    for service in services:
        endpoint = aws.ec2.VpcEndpoint(
            f"{get_resource_name('vpc-endpoint')}-{service}",
            vpc_id=vpc.id,
            service_name=f"com.amazonaws.{REGION}.{service}",
            vpc_endpoint_type="Interface",
            subnet_ids=[subnet.id for subnet in private_subnets],
            security_group_ids=[vpc_endpoint_sg.id],
            private_dns_enabled=True,
            tags={**get_standard_tags(), "Name": f"{get_resource_name('vpc-endpoint')}-{service}"}
        )
        endpoints[service] = endpoint

    # S3 Gateway endpoint
    s3_endpoint = aws.ec2.VpcEndpoint(
        f"{get_resource_name('vpc-endpoint')}-s3",
        vpc_id=vpc.id,
        service_name=f"com.amazonaws.{REGION}.s3",
        vpc_endpoint_type="Gateway",
        route_table_ids=[route_table.id],
        tags={**get_standard_tags(), "Name": f"{get_resource_name('vpc-endpoint')}-s3"}
    )
    endpoints["s3"] = s3_endpoint

    return endpoints, vpc_endpoint_sg

def create_ssm_parameters(kms_keys):
    """Create SSM parameters with hierarchical organization"""
    parameters = {}

    # Database parameters
    db_params = {
        "host": "prod-db.cluster-xyz.us-east-1.rds.amazonaws.com",
        "port": "5432",
        "database": "production",
        "username": "app_user",
        "password": "super-secure-password-123",
        "pool_size": "20",
        "timeout": "30"
    }

    for key, value in db_params.items():
        param = aws.ssm.Parameter(
            f"db-param-{key}",
            name=f"/myapp/{environment}/database/{key}",
            type="SecureString" if key == "password" else "String",
            value=value,
            key_id=kms_keys["database"].key_id if key == "password" else None,
            description=f"Database {key} for {environment}",
            tags={**get_standard_tags(), "Category": "database"}
        )
        parameters[f"database_{key}"] = param

    # API parameters
    api_params = {
        "rate_limit": "1000",
        "timeout": "30",
        "retry_attempts": "3",
        "api_key": "api-key-secret-xyz789"
    }

    for key, value in api_params.items():
        param = aws.ssm.Parameter(
            f"api-param-{key}",
            name=f"/myapp/{environment}/api/{key}",
            type="SecureString" if key == "api_key" else "String",
            value=value,
            key_id=kms_keys["api"].key_id if key == "api_key" else None,
            description=f"API {key} for {environment}",
            tags={**get_standard_tags(), "Category": "api"}
        )
        parameters[f"api_{key}"] = param

    # Cache parameters
    cache_params = {
        "redis_host": "prod-redis.abc123.cache.amazonaws.com",
        "redis_port": "6379",
        "ttl": "3600",
        "max_connections": "100"
    }

    for key, value in cache_params.items():
        param = aws.ssm.Parameter(
            f"cache-param-{key}",
            name=f"/myapp/{environment}/cache/{key}",
            type="String",
            value=value,
            key_id=kms_keys["cache"].key_id,
            description=f"Cache {key} for {environment}",
            tags={**get_standard_tags(), "Category": "cache"}
        )
        parameters[f"cache_{key}"] = param

    return parameters

def create_s3_bucket():
    """Create S3 bucket for deployment artifacts"""
    bucket = aws.s3.Bucket(
        get_resource_name("artifacts"),
        versioning={
            "enabled": True
        },
        server_side_encryption_configuration={
            "rule": {
                "apply_server_side_encryption_by_default": {
                    "sse_algorithm": "AES256"
                }
            }
        },
        lifecycle_rules=[{
            "enabled": True,
            "id": "cleanup_old_versions",
            "noncurrent_version_expiration": {
                "days": 30
            }
        }],
        tags=get_standard_tags()
    )

    # Block public access
    aws.s3.BucketPublicAccessBlock(
        f"{get_resource_name('artifacts')}-pab",
        bucket=bucket.id,
        block_public_acls=True,
        block_public_policy=True,
        ignore_public_acls=True,
        restrict_public_buckets=True
    )

    return bucket

def create_lambda_layer(bucket):
    """Create Lambda layer with optimized Python libraries"""

    # Create layer zip file
    layer_code = pulumi.AssetArchive({
        "python": pulumi.FileArchive("./lambda/layers/python_optimized")
    })

    # Upload layer to S3
    layer_object = aws.s3.BucketObject(
        get_resource_name("lambda-layer"),
        bucket=bucket.id,
        key="layers/python-optimized.zip",
        source=layer_code,
        tags=get_standard_tags()
    )

    # Create Lambda layer
    layer = aws.lambda_.LayerVersion(
        get_resource_name("python-layer"),
        layer_name=get_resource_name("python-optimized"),
        s3_bucket=bucket.id,
        s3_key=layer_object.key,
        compatible_runtimes=["python3.9", "python3.10", "python3.11"],
        description="Optimized Python libraries for enterprise workloads",
        source_code_hash=layer_object.etag
    )

    return layer

def create_lambda_function(vpc, private_subnets, layer, ssm_parameters, kms_keys):
    """Create Lambda function with comprehensive configuration"""

    # Lambda security group
    lambda_sg = aws.ec2.SecurityGroup(
        get_resource_name("lambda-sg"),
        vpc_id=vpc.id,
        description="Security group for Lambda function",
        egress=[{
            "protocol": "-1",
            "from_port": 0,
            "to_port": 0,
            "cidr_blocks": ["0.0.0.0/0"]
        }],
        tags={**get_standard_tags(), "Name": get_resource_name("lambda-sg")}
    )

    # IAM role for Lambda
    lambda_role = aws.iam.Role(
        get_resource_name("lambda-role"),
        assume_role_policy=json.dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Action": "sts:AssumeRole",
                "Effect": "Allow",
                "Principal": {
                    "Service": "lambda.amazonaws.com"
                }
            }]
        }),
        tags=get_standard_tags()
    )

    # Lambda execution policy
    lambda_policy = aws.iam.Policy(
        get_resource_name("lambda-policy"),
        policy=Output.all(
            kms_keys["database"].arn,
            kms_keys["api"].arn,
            kms_keys["cache"].arn
        ).apply(lambda arns: json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "logs:CreateLogGroup",
                        "logs:CreateLogStream",
                        "logs:PutLogEvents"
                    ],
                    "Resource": f"arn:aws:logs:{REGION}:*:*"
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "ec2:CreateNetworkInterface",
                        "ec2:DescribeNetworkInterfaces",
                        "ec2:DeleteNetworkInterface"
                    ],
                    "Resource": "*"
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "ssm:GetParameter",
                        "ssm:GetParameters",
                        "ssm:GetParametersByPath"
                    ],
                    "Resource": f"arn:aws:ssm:{REGION}:*:parameter/myapp/{environment}/*"
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "kms:Decrypt",
                        "kms:DescribeKey"
                    ],
                    "Resource": arns
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "xray:PutTraceSegments",
                        "xray:PutTelemetryRecords"
                    ],
                    "Resource": "*"
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "cloudwatch:PutMetricData"
                    ],
                    "Resource": "*"
                }
            ]
        }))
    )

    # Attach policy to role
    aws.iam.RolePolicyAttachment(
        get_resource_name("lambda-policy-attachment"),
        role=lambda_role.name,
        policy_arn=lambda_policy.arn
    )

    # Lambda function code
    function_code = pulumi.AssetArchive({
        ".": pulumi.FileArchive("./lambda")
    })

    # CloudWatch log group
    log_group = aws.cloudwatch.LogGroup(
        get_resource_name("lambda-logs"),
        name=f"/aws/lambda/{get_resource_name('processor')}",
        retention_in_days=30 if environment == "prod" else 7,
        tags=get_standard_tags()
    )

    # Lambda function
    lambda_function = aws.lambda_.Function(
        get_resource_name("processor"),
        runtime="python3.11",
        code=function_code,
        handler="function.lambda_handler",
        role=lambda_role.arn,
        layers=[layer.arn],
        timeout=300,
        memory_size=1024,
        reserved_concurrent_executions=1000,
        environment={
            "variables": {
                "ENVIRONMENT": environment,
                "SSM_PARAMETER_PREFIX": f"/myapp/{environment}",
                "LOG_LEVEL": "INFO" if environment == "prod" else "DEBUG",
                "ENABLE_XRAY": "true"
            }
        },
        vpc_config={
            "subnet_ids": [subnet.id for subnet in private_subnets],
            "security_group_ids": [lambda_sg.id]
        },
        tracing_config={
            "mode": "Active"
        },
        dead_letter_config={
            "target_arn": create_dead_letter_queue().arn
        },
        tags=get_standard_tags(),
        opts=ResourceOptions(depends_on=[log_group])
    )

    # Provisioned concurrency
    if environment == "prod":
        aws.lambda_.ProvisionedConcurrencyConfig(
            get_resource_name("lambda-concurrency"),
            function_name=lambda_function.function_name,
            qualifier=lambda_function.version,
            provisioned_concurrent_executions=100
        )

    return lambda_function, lambda_sg

def create_dead_letter_queue():
    """Create SQS dead letter queue for failed Lambda executions"""
    dlq = aws.sqs.Queue(
        get_resource_name("dlq"),
        message_retention_seconds=1209600,  # 14 days
        visibility_timeout_seconds=300,
        tags=get_standard_tags()
    )
    return dlq

def create_api_gateway(lambda_function):
    """Create API Gateway with rate limiting and caching"""

    # API Gateway
    api = aws.apigateway.RestApi(
        get_resource_name("api"),
        description=f"Serverless API for {environment}",
        endpoint_configuration={
            "types": "REGIONAL"
        },
        tags=get_standard_tags()
    )

    # API Gateway resource
    resource = aws.apigateway.Resource(
        get_resource_name("api-resource"),
        rest_api=api.id,
        parent_id=api.root_resource_id,
        path_part="process"
    )

    # API Gateway method
    method = aws.apigateway.Method(
        get_resource_name("api-method"),
        rest_api=api.id,
        resource_id=resource.id,
        http_method="POST",
        authorization="NONE"
    )

    # Lambda integration
    integration = aws.apigateway.Integration(
        get_resource_name("api-integration"),
        rest_api=api.id,
        resource_id=resource.id,
        http_method=method.http_method,
        integration_http_method="POST",
        type="AWS_PROXY",
        uri=lambda_function.invoke_arn
    )

    # Lambda permission for API Gateway
    aws.lambda_.Permission(
        get_resource_name("api-lambda-permission"),
        statement_id="AllowExecutionFromAPIGateway",
        action="lambda:InvokeFunction",
        function=lambda_function.function_name,
        principal="apigateway.amazonaws.com",
        source_arn=Output.concat(api.execution_arn, "/*/*")
    )

    # API Gateway deployment
    deployment = aws.apigateway.Deployment(
        get_resource_name("api-deployment"),
        rest_api=api.id,
        stage_name=environment,
        opts=ResourceOptions(depends_on=[integration])
    )

    # API Gateway stage with caching and throttling
    stage = aws.apigateway.Stage(
        get_resource_name("api-stage"),
        deployment=deployment.id,
        rest_api=api.id,
        stage_name=environment,
        cache_cluster_enabled=environment == "prod",
        cache_cluster_size="0.5" if environment == "prod" else None,
        throttle_settings={
            "rate_limit": 10000,
            "burst_limit": 5000
        },
        tags=get_standard_tags()
    )

    return api, deployment, stage

def create_monitoring_and_alarms(lambda_function, api):
    """Create comprehensive monitoring and alerting"""

    # Custom CloudWatch dashboard
    dashboard = aws.cloudwatch.Dashboard(
        get_resource_name("dashboard"),
        dashboard_name=get_resource_name("serverless-metrics"),
        dashboard_body=Output.all(lambda_function.function_name, api.id).apply(
            lambda args: json.dumps({
                "widgets": [
                    {
                        "type": "metric",
                        "x": 0, "y": 0,
                        "width": 12, "height": 6,
                        "properties": {
                            "metrics": [
                                ["AWS/Lambda", "Duration", "FunctionName", args[0]],
                                [".", "Errors", ".", "."],
                                [".", "Invocations", ".", "."],
                                [".", "Throttles", ".", "."]
                            ],
                            "period": 300,
                            "stat": "Average",
                            "region": REGION,
                            "title": "Lambda Metrics"
                        }
                    },
                    {
                        "type": "metric",
                        "x": 0, "y": 6,
                        "width": 12, "height": 6,
                        "properties": {
                            "metrics": [
                                ["AWS/ApiGateway", "Count", "ApiName", args[1]],
                                [".", "Latency", ".", "."],
                                [".", "4XXError", ".", "."],
                                [".", "5XXError", ".", "."]
                            ],
                            "period": 300,
                            "stat": "Sum",
                            "region": REGION,
                            "title": "API Gateway Metrics"
                        }
                    }
                ]
            })
        )
    )

    # SNS topic for alerts
    alert_topic = aws.sns.Topic(
        get_resource_name("alerts"),
        name=get_resource_name("serverless-alerts"),
        tags=get_standard_tags()
    )

    # CloudWatch alarms
    alarms = []

    # Lambda error rate alarm
    error_alarm = aws.cloudwatch.MetricAlarm(
        get_resource_name("lambda-error-alarm"),
        comparison_operator="GreaterThanThreshold",
        evaluation_periods=2,
        metric_name="Errors",
        namespace="AWS/Lambda",
        period=300,
        statistic="Sum",
        threshold=10,
        alarm_description="Lambda function error rate is too high",
        alarm_actions=[alert_topic.arn],
        dimensions={
            "FunctionName": lambda_function.function_name
        },
        tags=get_standard_tags()
    )
    alarms.append(error_alarm)

    # Lambda duration alarm
    duration_alarm = aws.cloudwatch.MetricAlarm(
        get_resource_name("lambda-duration-alarm"),
        comparison_operator="GreaterThanThreshold",
        evaluation_periods=2,
        metric_name="Duration",
        namespace="AWS/Lambda",
        period=300,
        statistic="Average",
        threshold=200,  # 200ms threshold
        alarm_description="Lambda function duration is too high",
        alarm_actions=[alert_topic.arn],
        dimensions={
            "FunctionName": lambda_function.function_name
        },
        tags=get_standard_tags()
    )
    alarms.append(duration_alarm)

    # API Gateway 5XX error alarm
    api_error_alarm = aws.cloudwatch.MetricAlarm(
        get_resource_name("api-error-alarm"),
        comparison_operator="GreaterThanThreshold",
        evaluation_periods=2,
        metric_name="5XXError",
        namespace="AWS/ApiGateway",
        period=300,
        statistic="Sum",
        threshold=5,
        alarm_description="API Gateway 5XX error rate is too high",
        alarm_actions=[alert_topic.arn],
        dimensions={
            "ApiName": api.name
        },
        tags=get_standard_tags()
    )
    alarms.append(api_error_alarm)

    return dashboard, alert_topic, alarms

def create_rds_database(vpc, private_subnets):
    """Create RDS database with read replicas and automated backups"""

    # DB subnet group
    db_subnet_group = aws.rds.SubnetGroup(
        get_resource_name("db-subnet-group"),
        subnet_ids=[subnet.id for subnet in private_subnets],
        tags={**get_standard_tags(), "Name": get_resource_name("db-subnet-group")}
    )

    # DB security group
    db_sg = aws.ec2.SecurityGroup(
        get_resource_name("db-sg"),
        vpc_id=vpc.id,
        description="Security group for RDS database",
        ingress=[{
            "protocol": "tcp",
            "from_port": 5432,
            "to_port": 5432,
            "cidr_blocks": ["10.0.0.0/16"]
        }],
        tags={**get_standard_tags(), "Name": get_resource_name("db-sg")}
    )

    # RDS instance
    db_instance = aws.rds.Instance(
        get_resource_name("database"),
        identifier=get_resource_name("postgres"),
        engine="postgres",
        engine_version="15.4",
        instance_class="db.t3.micro" if environment != "prod" else "db.r5.large",
        allocated_storage=20,
        max_allocated_storage=100,
        storage_type="gp2",
        storage_encrypted=True,
        db_name="serverless_app",
        username="postgres",
        password=config.require_secret("db_password"),
        vpc_security_group_ids=[db_sg.id],
        db_subnet_group_name=db_subnet_group.name,
        backup_retention_period=7 if environment == "prod" else 1,
        backup_window="03:00-04:00",
        maintenance_window="sun:04:00-sun:05:00",
        auto_minor_version_upgrade=True,
        deletion_protection=environment == "prod",
        skip_final_snapshot=environment != "prod",
        tags=get_standard_tags()
    )

    # Read replica for production
    if environment == "prod":
        read_replica = aws.rds.Instance(
            get_resource_name("database-replica"),
            identifier=get_resource_name("postgres-replica"),
            replicate_source_db=db_instance.identifier,
            instance_class="db.r5.large",
            publicly_accessible=False,
            auto_minor_version_upgrade=True,
            tags={**get_standard_tags(), "Role": "read-replica"}
        )

        return db_instance, read_replica

    return db_instance, None

# Main infrastructure deployment
def main():
    """Deploy the complete serverless infrastructure"""

    # Create KMS keys
    kms_keys = create_kms_keys()

    # Create networking
    networking = create_networking()
    vpc = networking["vpc"]
    private_subnets = networking["private_subnets"]

    # Create VPC endpoints
    vpc_endpoints, vpc_endpoint_sg = create_vpc_endpoints(
        vpc, private_subnets,
        aws.ec2.RouteTable.get(get_resource_name("private-rt-lookup"),
                              id=networking["private_subnets"][0].route_table_id)
    )

    # Create SSM parameters
    ssm_parameters = create_ssm_parameters(kms_keys)

    # Create S3 bucket
    bucket = create_s3_bucket()

    # Create Lambda layer
    layer = create_lambda_layer(bucket)

    # Create Lambda function
    lambda_function, lambda_sg = create_lambda_function(
        vpc, private_subnets, layer, ssm_parameters, kms_keys
    )

    # Create API Gateway
    api, deployment, stage = create_api_gateway(lambda_function)

    # Create monitoring
    dashboard, alert_topic, alarms = create_monitoring_and_alarms(lambda_function, api)

    # Create RDS database
    db_instance, read_replica = create_rds_database(vpc, private_subnets)

    # Export important values
    pulumi.export("vpc_id", vpc.id)
    pulumi.export("lambda_function_name", lambda_function.function_name)
    pulumi.export("api_gateway_url", Output.concat(
        "https://", api.id, ".execute-api.",
```
