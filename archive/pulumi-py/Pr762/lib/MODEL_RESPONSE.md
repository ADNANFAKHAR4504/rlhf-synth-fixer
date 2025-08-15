# Complete Multi-Region Serverless CI/CD Pipeline Implementation

I'll provide a comprehensive implementation of the multi-region serverless infrastructure with Pulumi, following AWS best practices and the specified requirements.

## 1. Project Structure and Configuration

### Pulumi Project Configuration

**Pulumi.yaml**
```yaml
name: iac-aws-nova-model-breaking
runtime: python
description: Multi-region serverless CI/CD pipeline with rolling updates
template:
  config:
    aws:region:
      description: Primary AWS region
      default: us-east-1
```

**Pulumi.dev.yaml**
```yaml
config:
  aws:region: us-east-1
  iac-aws-nova-model-breaking:environment: dev
  iac-aws-nova-model-breaking:secondary-region: us-west-2
  iac-aws-nova-model-breaking:enable-monitoring: true
```

**requirements.txt**
```txt
pulumi>=3.0.0,<4.0.0
pulumi-aws>=6.0.0,<7.0.0
pulumi-awsx>=2.0.0,<3.0.0
pytest>=7.0.0
boto3>=1.26.0
moto>=4.0.0
```

## 2. Main Infrastructure Code

### lib/tap_stack.py

```python
import json
from typing import Dict, List, Optional
import pulumi
import pulumi_aws as aws
import pulumi_awsx as awsx
from pulumi import ComponentResource, ResourceOptions, Output


class TapStackArgs:
    def __init__(
        self,
        environment: str,
        primary_region: str,
        secondary_region: str,
        enable_monitoring: bool = True,
        lambda_timeout: int = 30,
        api_stage_name: str = "v1"
    ):
        self.environment = environment
        self.primary_region = primary_region
        self.secondary_region = secondary_region
        self.enable_monitoring = enable_monitoring
        self.lambda_timeout = lambda_timeout
        self.api_stage_name = api_stage_name


class VPCComponent(ComponentResource):
    def __init__(self, name: str, args: TapStackArgs, opts: Optional[ResourceOptions] = None):
        super().__init__("custom:networking:VPC", name, {}, opts)
        
        # Create VPC
        self.vpc = aws.ec2.Vpc(
            f"{name}-vpc",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                "Name": f"nova-vpc-{args.environment}",
                "Environment": args.environment,
                "Project": "nova-model-breaking"
            },
            opts=ResourceOptions(parent=self)
        )
        
        # Create Internet Gateway
        self.igw = aws.ec2.InternetGateway(
            f"{name}-igw",
            vpc_id=self.vpc.id,
            tags={
                "Name": f"nova-igw-{args.environment}",
                "Environment": args.environment
            },
            opts=ResourceOptions(parent=self)
        )
        
        # Create public subnets
        self.public_subnets = []
        availability_zones = aws.get_availability_zones(state="available")
        
        for i, az in enumerate(availability_zones.names[:2]):
            subnet = aws.ec2.Subnet(
                f"{name}-public-subnet-{i+1}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i+1}.0/24",
                availability_zone=az,
                map_public_ip_on_launch=True,
                tags={
                    "Name": f"nova-public-subnet-{i+1}-{args.environment}",
                    "Environment": args.environment,
                    "Type": "public"
                },
                opts=ResourceOptions(parent=self)
            )
            self.public_subnets.append(subnet)
        
        # Create private subnets
        self.private_subnets = []
        for i, az in enumerate(availability_zones.names[:2]):
            subnet = aws.ec2.Subnet(
                f"{name}-private-subnet-{i+1}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i+10}.0/24",
                availability_zone=az,
                tags={
                    "Name": f"nova-private-subnet-{i+1}-{args.environment}",
                    "Environment": args.environment,
                    "Type": "private"
                },
                opts=ResourceOptions(parent=self)
            )
            self.private_subnets.append(subnet)
        
        # Create route table for public subnets
        self.public_route_table = aws.ec2.RouteTable(
            f"{name}-public-rt",
            vpc_id=self.vpc.id,
            routes=[
                aws.ec2.RouteTableRouteArgs(
                    cidr_block="0.0.0.0/0",
                    gateway_id=self.igw.id
                )
            ],
            tags={
                "Name": f"nova-public-rt-{args.environment}",
                "Environment": args.environment
            },
            opts=ResourceOptions(parent=self)
        )
        
        # Associate public subnets with route table
        for i, subnet in enumerate(self.public_subnets):
            aws.ec2.RouteTableAssociation(
                f"{name}-public-rta-{i+1}",
                subnet_id=subnet.id,
                route_table_id=self.public_route_table.id,
                opts=ResourceOptions(parent=self)
            )
        
        # Create security group for Lambda functions
        self.lambda_security_group = aws.ec2.SecurityGroup(
            f"{name}-lambda-sg",
            description="Security group for Lambda functions",
            vpc_id=self.vpc.id,
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            tags={
                "Name": f"nova-lambda-sg-{args.environment}",
                "Environment": args.environment
            },
            opts=ResourceOptions(parent=self)
        )
        
        # VPC Endpoints for AWS services
        self.s3_endpoint = aws.ec2.VpcEndpoint(
            f"{name}-s3-endpoint",
            vpc_id=self.vpc.id,
            service_name=f"com.amazonaws.{args.primary_region}.s3",
            vpc_endpoint_type="Gateway",
            route_table_ids=[self.public_route_table.id],
            tags={
                "Name": f"nova-s3-endpoint-{args.environment}",
                "Environment": args.environment
            },
            opts=ResourceOptions(parent=self)
        )


class LambdaComponent(ComponentResource):
    def __init__(self, name: str, args: TapStackArgs, vpc: VPCComponent, opts: Optional[ResourceOptions] = None):
        super().__init__("custom:compute:Lambda", name, {}, opts)
        
        # Create IAM role for Lambda
        self.lambda_role = aws.iam.Role(
            f"{name}-lambda-role",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Action": "sts:AssumeRole",
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "lambda.amazonaws.com"
                        }
                    }
                ]
            }),
            tags={
                "Name": f"nova-lambda-role-{args.environment}",
                "Environment": args.environment
            },
            opts=ResourceOptions(parent=self)
        )
        
        # Attach necessary policies
        aws.iam.RolePolicyAttachment(
            f"{name}-lambda-vpc-policy",
            role=self.lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole",
            opts=ResourceOptions(parent=self)
        )
        
        aws.iam.RolePolicyAttachment(
            f"{name}-lambda-basic-policy",
            role=self.lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
            opts=ResourceOptions(parent=self)
        )
        
        # Custom policy for S3 and CloudWatch
        lambda_policy = aws.iam.Policy(
            f"{name}-lambda-custom-policy",
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:GetObject",
                            "s3:PutObject",
                            "s3:DeleteObject"
                        ],
                        "Resource": "*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "cloudwatch:PutMetricData",
                            "logs:CreateLogGroup",
                            "logs:CreateLogStream",
                            "logs:PutLogEvents"
                        ],
                        "Resource": "*"
                    }
                ]
            }),
            opts=ResourceOptions(parent=self)
        )
        
        aws.iam.RolePolicyAttachment(
            f"{name}-lambda-custom-policy-attachment",
            role=self.lambda_role.name,
            policy_arn=lambda_policy.arn,
            opts=ResourceOptions(parent=self)
        )
        
        # Lambda function code
        lambda_code = """
import json
import boto3
import logging
from datetime import datetime

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    try:
        logger.info(f"Received event: {json.dumps(event)}")
        
        # Process the request
        response_body = {
            "message": "Hello from Nova Model Breaking API",
            "timestamp": datetime.utcnow().isoformat(),
            "region": context.invoked_function_arn.split(":")[3],
            "version": context.function_version,
            "request_id": context.aws_request_id
        }
        
        # Custom CloudWatch metric
        cloudwatch = boto3.client('cloudwatch')
        cloudwatch.put_metric_data(
            Namespace='NovaModelBreaking',
            MetricData=[
                {
                    'MetricName': 'RequestCount',
                    'Value': 1,
                    'Unit': 'Count',
                    'Dimensions': [
                        {
                            'Name': 'Environment',
                            'Value': event.get('environment', 'unknown')
                        }
                    ]
                }
            ]
        )
        
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type"
            },
            "body": json.dumps(response_body)
        }
        
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            },
            "body": json.dumps({
                "error": "Internal server error",
                "message": str(e)
            })
        }
"""
        
        # Create Lambda function
        self.function = aws.lambda_.Function(
            f"{name}-function",
            runtime="python3.9",
            code=pulumi.AssetArchive({
                "lambda_function.py": pulumi.StringAsset(lambda_code)
            }),
            handler="lambda_function.lambda_handler",
            role=self.lambda_role.arn,
            timeout=args.lambda_timeout,
            memory_size=256,
            vpc_config=aws.lambda_.FunctionVpcConfigArgs(
                subnet_ids=[subnet.id for subnet in vpc.private_subnets],
                security_group_ids=[vpc.lambda_security_group.id]
            ),
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    "ENVIRONMENT": args.environment,
                    "REGION": args.primary_region
                }
            ),
            tags={
                "Name": f"nova-function-{args.environment}",
                "Environment": args.environment,
                "Project": "nova-model-breaking"
            },
            opts=ResourceOptions(parent=self)
        )
        
        # Create Lambda alias for blue-green deployments
        self.alias = aws.lambda_.Alias(
            f"{name}-alias",
            function_name=self.function.name,
            function_version="$LATEST",
            description=f"Alias for {args.environment} environment",
            opts=ResourceOptions(parent=self)
        )


class APIGatewayComponent(ComponentResource):
    def __init__(self, name: str, args: TapStackArgs, lambda_func: LambdaComponent, opts: Optional[ResourceOptions] = None):
        super().__init__("custom:api:Gateway", name, {}, opts)
        
        # Create API Gateway
        self.api = aws.apigateway.RestApi(
            f"{name}-api",
            description=f"Nova Model Breaking API - {args.environment}",
            endpoint_configuration=aws.apigateway.RestApiEndpointConfigurationArgs(
                types="REGIONAL"
            ),
            tags={
                "Name": f"nova-api-{args.environment}",
                "Environment": args.environment,
                "Project": "nova-model-breaking"
            },
            opts=ResourceOptions(parent=self)
        )
        
        # Create API Gateway resource
        self.resource = aws.apigateway.Resource(
            f"{name}-api-resource",
            rest_api=self.api.id,
            parent_id=self.api.root_resource_id,
            path_part="nova",
            opts=ResourceOptions(parent=self)
        )
        
        # Create method
        self.method = aws.apigateway.Method(
            f"{name}-api-method",
            rest_api=self.api.id,
            resource_id=self.resource.id,
            http_method="GET",
            authorization="NONE",
            opts=ResourceOptions(parent=self)
        )
        
        # Create integration
        self.integration = aws.apigateway.Integration(
            f"{name}-api-integration",
            rest_api=self.api.id,
            resource_id=self.resource.id,
            http_method=self.method.http_method,
            integration_http_method="POST",
            type="AWS_PROXY",
            uri=lambda_func.alias.invoke_arn,
            opts=ResourceOptions(parent=self)
        )
        
        # Lambda permission for API Gateway
        self.lambda_permission = aws.lambda_.Permission(
            f"{name}-lambda-permission",
            statement_id="AllowExecutionFromAPIGateway",
            action="lambda:InvokeFunction",
            function=lambda_func.alias.function_name,
            qualifier=lambda_func.alias.name,
            principal="apigateway.amazonaws.com",
            source_arn=pulumi.Output.concat(self.api.execution_arn, "/*/*"),
            opts=ResourceOptions(parent=self)
        )
        
        # Create deployment
        self.deployment = aws.apigateway.Deployment(
            f"{name}-api-deployment",
            rest_api=self.api.id,
            stage_name=args.api_stage_name,
            stage_description=f"Deployment for {args.environment}",
            opts=ResourceOptions(
                parent=self,
                depends_on=[self.method, self.integration]
            )
        )
        
        # Create stage with monitoring
        self.stage = aws.apigateway.Stage(
            f"{name}-api-stage",
            deployment=self.deployment.id,
            rest_api=self.api.id,
            stage_name=args.api_stage_name,
            xray_tracing_enabled=True,
            tags={
                "Name": f"nova-api-stage-{args.environment}",
                "Environment": args.environment
            },
            opts=ResourceOptions(parent=self)
        )


class S3Component(ComponentResource):
    def __init__(self, name: str, args: TapStackArgs, opts: Optional[ResourceOptions] = None):
        super().__init__("custom:storage:S3", name, {}, opts)
        
        # Primary region bucket
        self.primary_bucket = aws.s3.Bucket(
            f"{name}-primary-bucket",
            bucket=f"nova-model-breaking-{args.environment}-{args.primary_region}",
            tags={
                "Name": f"nova-primary-bucket-{args.environment}",
                "Environment": args.environment,
                "Region": args.primary_region
            },
            opts=ResourceOptions(parent=self)
        )
        
        # Configure bucket versioning
        aws.s3.BucketVersioning(
            f"{name}-primary-bucket-versioning",
            bucket=self.primary_bucket.id,
            versioning_configuration=aws.s3.BucketVersioningVersioningConfigurationArgs(
                status="Enabled"
            ),
            opts=ResourceOptions(parent=self)
        )
        
        # Configure bucket encryption
        aws.s3.BucketServerSideEncryptionConfiguration(
            f"{name}-primary-bucket-encryption",
            bucket=self.primary_bucket.id,
            rules=[
                aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                    apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                        sse_algorithm="AES256"
                    )
                )
            ],
            opts=ResourceOptions(parent=self)
        )
        
        # Block public access
        aws.s3.BucketPublicAccessBlock(
            f"{name}-primary-bucket-pab",
            bucket=self.primary_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=ResourceOptions(parent=self)
        )


class MonitoringComponent(ComponentResource):
    def __init__(self, name: str, args: TapStackArgs, lambda_func: LambdaComponent, api: APIGatewayComponent, opts: Optional[ResourceOptions] = None):
        super().__init__("custom:monitoring:CloudWatch", name, {}, opts)
        
        # SNS topic for alerts
        self.alert_topic = aws.sns.Topic(
            f"{name}-alerts",
            name=f"nova-alerts-{args.environment}",
            tags={
                "Name": f"nova-alerts-{args.environment}",
                "Environment": args.environment
            },
            opts=ResourceOptions(parent=self)
        )
        
        # Lambda error alarm
        self.lambda_error_alarm = aws.cloudwatch.MetricAlarm(
            f"{name}-lambda-error-alarm",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="Errors",
            namespace="AWS/Lambda",
            period=300,
            statistic="Sum",
            threshold=1,
            alarm_description=f"Lambda function errors in {args.environment}",
            alarm_name=f"nova-lambda-errors-{args.environment}",
            dimensions={
                "FunctionName": lambda_func.function.name
            },
            alarm_actions=[self.alert_topic.arn],
            tags={
                "Environment": args.environment
            },
            opts=ResourceOptions(parent=self)
        )
        
        # Lambda duration alarm
        self.lambda_duration_alarm = aws.cloudwatch.MetricAlarm(
            f"{name}-lambda-duration-alarm",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=3,
            metric_name="Duration",
            namespace="AWS/Lambda",
            period=300,
            statistic="Average",
            threshold=10000,  # 10 seconds
            alarm_description=f"Lambda function duration in {args.environment}",
            alarm_name=f"nova-lambda-duration-{args.environment}",
            dimensions={
                "FunctionName": lambda_func.function.name
            },
            alarm_actions=[self.alert_topic.arn],
            tags={
                "Environment": args.environment
            },
            opts=ResourceOptions(parent=self)
        )
        
        # API Gateway 4XX errors alarm
        self.api_4xx_alarm = aws.cloudwatch.MetricAlarm(
            f"{name}-api-4xx-alarm",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="4XXError",
            namespace="AWS/ApiGateway",
            period=300,
            statistic="Sum",
            threshold=10,
            alarm_description=f"API Gateway 4XX errors in {args.environment}",
            alarm_name=f"nova-api-4xx-{args.environment}",
            dimensions={
                "ApiName": api.api.name,
                "Stage": args.api_stage_name
            },
            alarm_actions=[self.alert_topic.arn],
            tags={
                "Environment": args.environment
            },
            opts=ResourceOptions(parent=self)
        )
        
        # API Gateway 5XX errors alarm
        self.api_5xx_alarm = aws.cloudwatch.MetricAlarm(
            f"{name}-api-5xx-alarm",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="5XXError",
            namespace="AWS/ApiGateway",
            period=300,
            statistic="Sum",
            threshold=1,
            alarm_description=f"API Gateway 5XX errors in {args.environment}",
            alarm_name=f"nova-api-5xx-{args.environment}",
            dimensions={
                "ApiName": api.api.name,
                "Stage": args.api_stage_name
            },
            alarm_actions=[self.alert_topic.arn],
            tags={
                "Environment": args.environment
            },
            opts=ResourceOptions(parent=self)
        )
        
        # Custom dashboard
        self.dashboard = aws.cloudwatch.Dashboard(
            f"{name}-dashboard",
            dashboard_name=f"Nova-Model-Breaking-{args.environment}",
            dashboard_body=pulumi.Output.all(
                lambda_func.function.name,
                api.api.name
            ).apply(lambda args: json.dumps({
                "widgets": [
                    {
                        "type": "metric",
                        "x": 0,
                        "y": 0,
                        "width": 12,
                        "height": 6,
                        "properties": {
                            "metrics": [
                                ["AWS/Lambda", "Duration", "FunctionName", args[0]],
                                [".", "Errors", ".", "."],
                                [".", "Invocations", ".", "."]
                            ],
                            "period": 300,
                            "stat": "Average",
                            "region": "us-east-1",
                            "title": "Lambda Metrics"
                        }
                    },
                    {
                        "type": "metric",
                        "x": 0,
                        "y": 6,
                        "width": 12,
                        "height": 6,
                        "properties": {
                            "metrics": [
                                ["AWS/ApiGateway", "Count", "ApiName", args[1]],
                                [".", "Latency", ".", "."],
                                [".", "4XXError", ".", "."],
                                [".", "5XXError", ".", "."]
                            ],
                            "period": 300,
                            "stat": "Sum",
                            "region": "us-east-1",
                            "title": "API Gateway Metrics"
                        }
                    }
                ]
            })),
            opts=ResourceOptions(parent=self)
        )


class TapStack(ComponentResource):
    def __init__(self, name: str, args: TapStackArgs, opts: Optional[ResourceOptions] = None):
        super().__init__("custom:stack:TapStack", name, {}, opts)
        
        # Create VPC
        self.vpc = VPCComponent(f"{name}-vpc", args, ResourceOptions(parent=self))
        
        # Create Lambda function
        self.lambda_component = LambdaComponent(
            f"{name}-lambda", 
            args, 
            self.vpc, 
            ResourceOptions(parent=self)
        )
        
        # Create API Gateway
        self.api = APIGatewayComponent(
            f"{name}-api", 
            args, 
            self.lambda_component, 
            ResourceOptions(parent=self)
        )
        
        # Create S3 buckets
        self.s3 = S3Component(f"{name}-s3", args, ResourceOptions(parent=self))
        
        # Create monitoring (if enabled)
        if args.enable_monitoring:
            self.monitoring = MonitoringComponent(
                f"{name}-monitoring", 
                args, 
                self.lambda_component, 
                self.api, 
                ResourceOptions(parent=self)
            )
        
        # Outputs
        self.api_url = pulumi.Output.concat(
            "https://",
            self.api.api.id,
            ".execute-api.",
            args.primary_region,
            ".amazonaws.com/",
            args.api_stage_name,
            "/nova"
        )
        
        self.lambda_function_name = self.lambda_component.function.name
        self.s3_bucket_name = self.s3.primary_bucket.bucket


# Main stack instantiation
def create_stack():
    config = pulumi.Config()
    environment = config.require("environment")
    secondary_region = config.require("secondary-region")
    enable_monitoring = config.get_bool("enable-monitoring", True)
    
    current_region = aws.get_region()
    
    args = TapStackArgs(
        environment=environment,
        primary_region=current_region.name,
        secondary_region=secondary_region,
        enable_monitoring=enable_monitoring
    )
    
    stack = TapStack("nova-model-breaking", args)
    
    # Export outputs
    pulumi.export("api_url", stack.api_url)
    pulumi.export("lambda_function_name", stack.lambda_function_name)
    pulumi.export("s3_bucket_name", stack.s3_bucket_name)
    pulumi.export("vpc_id", stack.vpc.vpc.id)
    
    if enable_monitoring:
        pulumi.export("dashboard_url", pulumi.Output.concat(
            "https://console.aws.amazon.com/cloudwatch/home?region=",
            current_region.name,
            "#dashboards:name=",
            stack.monitoring.dashboard.dashboard_name
        ))
        pulumi.export("alert_topic_arn", stack.monitoring.alert_topic.arn)
    
    return stack


if __name__ == "__main__":
    create_stack()
```

## 3. CI/CD Pipeline Configuration

### .github/workflows/deploy.yml

```yaml
name: Deploy Nova Model Breaking Infrastructure

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  PULUMI_ACCESS_TOKEN: ${{ secrets.PULUMI_ACCESS_TOKEN }}
  AWS_REGION: us-east-1

jobs:
  test:
    name: Run Tests
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.9'

      - name: Install dependencies
        run: |
          pip install -r requirements.txt
          pip install -r requirements-dev.txt

      - name: Run unit tests
        run: |
          python -m pytest tests/unit/ -v --cov=lib --cov-report=xml

      - name: Run linting
        run: |
          flake8 lib/ tests/
          black --check lib/ tests/

      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage.xml

  deploy-dev:
    name: Deploy to Development
    runs-on: ubuntu-latest
    needs: test
    if: github.ref == 'refs/heads/develop'
    environment: development
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.9'

      - name: Install dependencies
        run: pip install -r requirements.txt

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Setup Pulumi
        uses: pulumi/actions@v4
        with:
          command: up
          stack-name: dev
          work-dir: .
        env:
          PULUMI_CONFIG_PASSPHRASE: ${{ secrets.PULUMI_CONFIG_PASSPHRASE }}

      - name: Run integration tests
        run: |
          python -m pytest tests/integration/ -v
        env:
          ENVIRONMENT: dev
          AWS_REGION: ${{ env.AWS_REGION }}

  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    needs: test
    if: github.ref == 'refs/heads/main'
    environment: staging
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.9'

      - name: Install dependencies
        run: pip install -r requirements.txt

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Setup Pulumi
        uses: pulumi/actions@v4
        with:
          command: up
          stack-name: staging
          work-dir: .
        env:
          PULUMI_CONFIG_PASSPHRASE: ${{ secrets.PULUMI_CONFIG_PASSPHRASE }}

      - name: Run smoke tests
        run: |
          python -m pytest tests/integration/test_smoke.py -v
        env:
          ENVIRONMENT: staging
          AWS_REGION: ${{ env.AWS_REGION }}

  deploy-production:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: deploy-staging
    if: github.ref == 'refs/heads/main'
    environment: production
    
    strategy:
      matrix:
        region: [us-east-1, us-west-2]
    
    steps: