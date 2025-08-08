import pulumi
import pulumi_aws as aws
import json
from typing import Dict, Any, List, Optional
from dataclasses import dataclass

@dataclass
class TapStackArgs:
    """Arguments for TapStack"""
    project_name: str = "iac-aws-nova"
    environment_suffix: str = "dev"  # Changed from 'environment' to 'environment_suffix'
    regions: List[str] = None
    
    def __post_init__(self):
        if self.regions is None:
            self.regions = ["us-east-1", "us-west-2"]

class TapStack(pulumi.ComponentResource):
    """Multi-region serverless infrastructure stack for AWS Lambda and API Gateway"""
    
    def __init__(self, name: str, args: TapStackArgs, opts: pulumi.ResourceOptions = None):
        super().__init__("custom:TapStack", name, None, opts)
        
        self.project_name = args.project_name
        self.environment = args.environment_suffix  # Use environment_suffix from args
        self.regions = args.regions
        
        # Resource collections
        self.lambda_functions = {}
        self.api_gateways = {}
        self.s3_buckets = {}
        self.cloudwatch_alarms = {}
        self.vpcs = {}
        
        # Create infrastructure in each region
        for region in self.regions:
            self._create_regional_infrastructure(region)
        
        # Create global monitoring dashboard
        self._create_global_monitoring()
        
        # Export key outputs
        self._register_outputs()

    def _create_regional_infrastructure(self, region: str):
        """Create infrastructure resources for a specific region"""
        region_opts = pulumi.ResourceOptions(provider=aws.Provider(
            f"provider-{region}",
            region=region
        ))
        
        # VPC for the region
        vpc = aws.ec2.Vpc(
            f"{self.project_name}-vpc-{region}-{self.environment}",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                "Name": f"{self.project_name}-vpc-{region}-{self.environment}",
                "Environment": self.environment,
                "Region": region
            },
            opts=region_opts
        )
        self.vpcs[region] = vpc
        
        # Private subnets for Lambda
        private_subnets = []
        for i, az_suffix in enumerate(['a', 'b']):
            subnet = aws.ec2.Subnet(
                f"{self.project_name}-private-{region}{az_suffix}-{self.environment}",
                vpc_id=vpc.id,
                cidr_block=f"10.0.{i+1}.0/24",
                availability_zone=f"{region}{az_suffix}",
                tags={
                    "Name": f"{self.project_name}-private-{region}{az_suffix}-{self.environment}",
                    "Type": "Private"
                },
                opts=region_opts
            )
            private_subnets.append(subnet)
        
        # Security group for Lambda functions
        lambda_sg = aws.ec2.SecurityGroup(
            f"{self.project_name}-lambda-sg-{region}-{self.environment}",
            vpc_id=vpc.id,
            description="Security group for Lambda functions",
            egress=[{
                "protocol": "-1",
                "from_port": 0,
                "to_port": 0,
                "cidr_blocks": ["0.0.0.0/0"]
            }],
            tags={
                "Name": f"{self.project_name}-lambda-sg-{region}-{self.environment}"
            },
            opts=region_opts
        )
        
        # S3 bucket for deployment artifacts
        s3_bucket = aws.s3.Bucket(
            f"{self.project_name}-artifacts-{region}-{self.environment}",
            bucket=f"{self.project_name}-artifacts-{region}-{self.environment}-{pulumi.get_stack()}",
            versioning=aws.s3.BucketVersioningArgs(enabled=True),
            server_side_encryption_configuration=aws.s3.BucketServerSideEncryptionConfigurationArgs(
                rule=aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                    apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                        sse_algorithm="AES256"
                    )
                )
            ),
            tags={
                "Environment": self.environment,
                "Region": region
            },
            opts=region_opts
        )
        self.s3_buckets[region] = s3_bucket
        
        # IAM role for Lambda functions
        lambda_role = aws.iam.Role(
            f"{self.project_name}-lambda-role-{region}-{self.environment}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {"Service": "lambda.amazonaws.com"}
                }]
            }),
            managed_policy_arns=[
                "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole",
                "arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess"
            ],
            opts=region_opts
        )
        
        # Lambda function
        lambda_function = aws.lambda_.Function(
            f"{self.project_name}-api-{region}-{self.environment}",
            runtime="python3.9",
            code=pulumi.AssetArchive({
                "index.py": pulumi.StringAsset(self._get_lambda_code())
            }),
            handler="index.handler",
            role=lambda_role.arn,
            timeout=30,
            memory_size=128,
            vpc_config=aws.lambda_.FunctionVpcConfigArgs(
                subnet_ids=[subnet.id for subnet in private_subnets],
                security_group_ids=[lambda_sg.id]
            ),
            tracing_config=aws.lambda_.FunctionTracingConfigArgs(mode="Active"),
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    "REGION": region,
                    "ENVIRONMENT": self.environment,
                    "PROJECT_NAME": self.project_name
                }
            ),
            tags={
                "Environment": self.environment,
                "Region": region
            },
            opts=region_opts
        )
        self.lambda_functions[region] = lambda_function
        
        # API Gateway
        api_gateway = aws.apigateway.RestApi(
            f"{self.project_name}-api-{region}-{self.environment}",
            description=f"API Gateway for {self.project_name} in {region}",
            tags={
                "Environment": self.environment,
                "Region": region
            },
            opts=region_opts
        )
        
        # API Gateway resource and method
        api_resource = aws.apigateway.Resource(
            f"{self.project_name}-api-resource-{region}-{self.environment}",
            rest_api=api_gateway.id,
            parent_id=api_gateway.root_resource_id,
            path_part="api",
            opts=region_opts
        )
        
        api_method = aws.apigateway.Method(
            f"{self.project_name}-api-method-{region}-{self.environment}",
            rest_api=api_gateway.id,
            resource_id=api_resource.id,
            http_method="ANY",
            authorization="NONE",
            opts=region_opts
        )
        
        # Lambda integration
        integration = aws.apigateway.Integration(
            f"{self.project_name}-api-integration-{region}-{self.environment}",
            rest_api=api_gateway.id,
            resource_id=api_resource.id,
            http_method=api_method.http_method,
            integration_http_method="POST",
            type="AWS_PROXY",
            uri=lambda_function.invoke_arn,
            opts=region_opts
        )
        
        # Lambda permission for API Gateway
        lambda_permission = aws.lambda_.Permission(
            f"{self.project_name}-api-permission-{region}-{self.environment}",
            statement_id="AllowExecutionFromAPIGateway",
            action="lambda:InvokeFunction",
            function=lambda_function.name,
            principal="apigateway.amazonaws.com",
            source_arn=pulumi.Output.concat(api_gateway.execution_arn, "/*/*"),
            opts=region_opts
        )
        
        # API Gateway deployment with rolling update strategy
        deployment = aws.apigateway.Deployment(
            f"{self.project_name}-api-deployment-{region}-{self.environment}",
            rest_api=api_gateway.id,
            stage_name=self.environment,
            stage_description=f"Deployment for {self.environment} environment",
            opts=pulumi.ResourceOptions(
                depends_on=[api_method, integration],
                parent=region_opts.provider if region_opts else None,
                replace_on_changes=["stage_name"]
            )
        )
        
        self.api_gateways[region] = {
            "api": api_gateway,
            "deployment": deployment
        }
        
        # CloudWatch monitoring
        self._create_regional_monitoring(region, lambda_function, api_gateway, region_opts)

    def _create_regional_monitoring(self, region: str, lambda_function, api_gateway, region_opts):
        """Create CloudWatch monitoring and alarms for a region"""
        
        # Lambda error rate alarm
        lambda_error_alarm = aws.cloudwatch.MetricAlarm(
            f"{self.project_name}-lambda-errors-{region}-{self.environment}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods="2",
            metric_name="Errors",
            namespace="AWS/Lambda",
            period="300",
            statistic="Sum",
            threshold="5",
            alarm_description="Lambda function error rate",
            alarm_name=f"{self.project_name}-lambda-errors-{region}-{self.environment}",
            dimensions={
                "FunctionName": lambda_function.name
            },
            opts=region_opts
        )
        
        # Lambda duration alarm
        lambda_duration_alarm = aws.cloudwatch.MetricAlarm(
            f"{self.project_name}-lambda-duration-{region}-{self.environment}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods="2",
            metric_name="Duration",
            namespace="AWS/Lambda",
            period="300",
            statistic="Average",
            threshold="25000",  # 25 seconds
            alarm_description="Lambda function duration",
            alarm_name=f"{self.project_name}-lambda-duration-{region}-{self.environment}",
            dimensions={
                "FunctionName": lambda_function.name
            },
            opts=region_opts
        )
        
        # API Gateway 4XX error alarm
        api_4xx_alarm = aws.cloudwatch.MetricAlarm(
            f"{self.project_name}-api-4xx-{region}-{self.environment}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods="2",
            metric_name="4XXError",
            namespace="AWS/ApiGateway",
            period="300",
            statistic="Sum",
            threshold="10",
            alarm_description="API Gateway 4XX errors",
            alarm_name=f"{self.project_name}-api-4xx-{region}-{self.environment}",
            dimensions={
                "ApiName": api_gateway.name
            },
            opts=region_opts
        )
        
        # API Gateway 5XX error alarm
        api_5xx_alarm = aws.cloudwatch.MetricAlarm(
            f"{self.project_name}-api-5xx-{region}-{self.environment}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods="1",
            metric_name="5XXError",
            namespace="AWS/ApiGateway",
            period="300",
            statistic="Sum",
            threshold="1",
            alarm_description="API Gateway 5XX errors",
            alarm_name=f"{self.project_name}-api-5xx-{region}-{self.environment}",
            dimensions={
                "ApiName": api_gateway.name
            },
            opts=region_opts
        )
        
        self.cloudwatch_alarms[region] = {
            "lambda_errors": lambda_error_alarm,
            "lambda_duration": lambda_duration_alarm,
            "api_4xx": api_4xx_alarm,
            "api_5xx": api_5xx_alarm
        }

    def _create_global_monitoring(self):
        """Create global CloudWatch dashboard"""
        primary_region = self.regions[0]
        primary_opts = pulumi.ResourceOptions(provider=aws.Provider(
            f"provider-{primary_region}",
            region=primary_region
        ))
        
        dashboard_body = {
            "widgets": []
        }
        
        # Add widgets for each region
        for i, region in enumerate(self.regions):
            dashboard_body["widgets"].extend([
                {
                    "type": "metric",
                    "x": 0,
                    "y": i * 6,
                    "width": 12,
                    "height": 6,
                    "properties": {
                        "metrics": [
                            ["AWS/Lambda", "Invocations", "FunctionName", f"{self.project_name}-api-{region}-{self.environment}"],
                            [".", "Errors", ".", "."],
                            [".", "Duration", ".", "."]
                        ],
                        "period": 300,
                        "stat": "Average",
                        "region": region,
                        "title": f"Lambda Metrics - {region}"
                    }
                },
                {
                    "type": "metric",
                    "x": 12,
                    "y": i * 6,
                    "width": 12,
                    "height": 6,
                    "properties": {
                        "metrics": [
                            ["AWS/ApiGateway", "Count", "ApiName", f"{self.project_name}-api-{region}-{self.environment}"],
                            [".", "4XXError", ".", "."],
                            [".", "5XXError", ".", "."]
                        ],
                        "period": 300,
                        "stat": "Sum",
                        "region": region,
                        "title": f"API Gateway Metrics - {region}"
                    }
                }
            ])
        
        dashboard = aws.cloudwatch.Dashboard(
            f"{self.project_name}-dashboard-{self.environment}",
            dashboard_name=f"{self.project_name}-{self.environment}",
            dashboard_body=json.dumps(dashboard_body),
            opts=primary_opts
        )

    def _get_lambda_code(self) -> str:
        """Return the Lambda function code"""
        return """
import json
import os

def handler(event, context):
    region = os.environ.get('REGION', 'unknown')
    environment = os.environ.get('ENVIRONMENT', 'unknown')
    project_name = os.environ.get('PROJECT_NAME', 'unknown')
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({
            'message': 'Hello from AWS Lambda!',
            'region': region,
            'environment': environment,
            'project': project_name,
            'timestamp': context.aws_request_id
        })
    }
"""

    def _register_outputs(self):
        """Register stack outputs"""
        # API Gateway URLs
        api_urls = {}
        for region in self.regions:
            api_urls[region] = pulumi.Output.concat(
                "https://",
                self.api_gateways[region]["api"].id,
                f".execute-api.{region}.amazonaws.com/{self.environment}/api"
            )
        
        # Lambda function ARNs
        lambda_arns = {region: func.arn for region, func in self.lambda_functions.items()}
        
        # S3 bucket names
        s3_names = {region: bucket.bucket for region, bucket in self.s3_buckets.items()}
        
        # Store outputs as instance attributes for export
        self.api_urls = api_urls
        self.lambda_arns = lambda_arns
        self.s3_buckets = s3_names
        self.vpc_ids = {region: vpc.id for region, vpc in self.vpcs.items()}
        
        # Also register them with Pulumi
        self.register_outputs({
            "api_urls": api_urls,
            "lambda_arns": lambda_arns,
            "s3_buckets": s3_names,
            "vpc_ids": self.vpc_ids
        })
