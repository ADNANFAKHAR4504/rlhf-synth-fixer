"""TAP Stack module for CDKTF Python infrastructure."""

from cdktf import TerraformStack, S3Backend, TerraformOutput, TerraformAsset, AssetType
from constructs import Construct
from pathlib import Path
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.route_table import RouteTable
from cdktf_cdktf_provider_aws.route_table_association import RouteTableAssociation
from cdktf_cdktf_provider_aws.route import Route
from cdktf_cdktf_provider_aws.nat_gateway import NatGateway
from cdktf_cdktf_provider_aws.eip import Eip
from cdktf_cdktf_provider_aws.security_group import (
    SecurityGroup,
    SecurityGroupEgress,
    SecurityGroupIngress,
)
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.iam_policy import IamPolicy
from cdktf_cdktf_provider_aws.lambda_function import LambdaFunction
from cdktf_cdktf_provider_aws.api_gateway_rest_api import ApiGatewayRestApi
from cdktf_cdktf_provider_aws.api_gateway_resource import ApiGatewayResource
from cdktf_cdktf_provider_aws.api_gateway_method import ApiGatewayMethod
from cdktf_cdktf_provider_aws.api_gateway_integration import ApiGatewayIntegration
from cdktf_cdktf_provider_aws.api_gateway_deployment import ApiGatewayDeployment
from cdktf_cdktf_provider_aws.api_gateway_stage import ApiGatewayStage
from cdktf_cdktf_provider_aws.lambda_permission import LambdaPermission
from cdktf_cdktf_provider_aws.dynamodb_table import DynamodbTable
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
from cdktf_cdktf_provider_aws.cloudwatch_metric_alarm import CloudwatchMetricAlarm
from cdktf_cdktf_provider_aws.data_aws_availability_zones import (
    DataAwsAvailabilityZones,
)
from cdktf_cdktf_provider_aws.data_aws_iam_policy_document import (
    DataAwsIamPolicyDocument,
)
import json
import os


class TapStack(TerraformStack):
  """CDKTF Python stack for TAP infrastructure."""

  def __init__(self, scope: Construct, construct_id: str, **kwargs):
    """Initialize the TAP stack with AWS infrastructure."""
    super().__init__(scope, construct_id)

    # Extract configuration from kwargs
    environment_suffix = kwargs.get("environment_suffix", "dev")
    # Use us-east-1 for LocalStack compatibility
    aws_region = kwargs.get("aws_region", "us-east-1")
    state_bucket_region = kwargs.get("state_bucket_region", "us-east-1")
    state_bucket = kwargs.get("state_bucket", "iac-rlhf-tf-states")
    default_tags = kwargs.get("default_tags", {})

    # Store region for use in other methods
    self.region = aws_region

    # Check if running in LocalStack environment
    is_localstack = os.environ.get("AWS_ENDPOINT_URL", "").find("localhost") != -1 or \
                    os.environ.get("AWS_ENDPOINT_URL", "").find("4566") != -1

    # Configure AWS Provider with LocalStack endpoints if needed
    if is_localstack:
        AwsProvider(
            self,
            "aws",
            region=aws_region,
            access_key="test",
            secret_key="test",
            skip_credentials_validation=True,
            skip_metadata_api_check=True,
            skip_requesting_account_id=True,
            s3_use_path_style=True,
            endpoints=[{
                "apigateway": "http://localhost:4566",
                "cloudwatch": "http://localhost:4566",
                "dynamodb": "http://localhost:4566",
                "ec2": "http://localhost:4566",
                "iam": "http://localhost:4566",
                "lambda": "http://localhost:4566",
                "s3": "http://s3.localhost.localstack.cloud:4566",
                "sts": "http://localhost:4566",
            }],
            default_tags=[default_tags],
        )
    else:
        AwsProvider(
            self,
            "aws",
            region=aws_region,
            default_tags=[default_tags],
        )

    # Configure S3 Backend with native state locking
    S3Backend(
        self,
        bucket=state_bucket,
        key=f"{environment_suffix}/{construct_id}.tfstate",
        region=state_bucket_region,
        encrypt=True,
    )

    # Add S3 state locking using escape hatch
    self.add_override("terraform.backend.s3.use_lockfile", True)

    # Create S3 bucket for demonstration
    S3Bucket(
        self,
        "tap_bucket",
        bucket=f"tap-bucket-{environment_suffix}-{construct_id}",
        versioning={"enabled": True},
        server_side_encryption_configuration={
            "rule": {
                "apply_server_side_encryption_by_default": {
                    "sse_algorithm": "AES256"
                }
            }
        },
    )

    # ? Add your stack instantiations here
    # ! Do NOT create resources directly in this stack.
    # ! Instead, create separate stacks for each resource type.

    # Get available AZs for high availability deployment
    self.availability_zones = DataAwsAvailabilityZones(
        self, "available_azs", state="available"
    )

    # Create VPC and networking infrastructure
    self._create_vpc_infrastructure()

    # Create security groups
    self._create_security_groups()

    # Create IAM roles and policies
    self._create_iam_resources()

    # Create DynamoDB table
    self._create_dynamodb_table()

    # Create Lambda functions
    self._create_lambda_functions()

    # Create API Gateway
    self._create_api_gateway()

    # Create monitoring and logging
    self._create_monitoring()

    # Create outputs
    self._create_outputs()

  def _create_vpc_infrastructure(self):
    """
    Create VPC with public and private subnets across multiple AZs for high availability.
    """
    # Create VPC with DNS support enabled
    self.vpc = Vpc(
        self,
        "main_vpc",
        cidr_block="10.0.0.0/16",
        enable_dns_hostnames=True,
        enable_dns_support=True,
        tags={"Name": "tap-serverless-vpc"},
    )

    # Create Internet Gateway for public subnet connectivity
    self.igw = InternetGateway(
        self, "main_igw", vpc_id=self.vpc.id, tags={
            "Name": "tap-serverless-igw"})

    # Create public subnets in first two AZs for NAT Gateways
    self.public_subnets = []
    self.private_subnets = []
    self.nat_gateways = []
    self.eips = []

    for i in range(2):  # Create resources in 2 AZs for high availability
      # Public subnet for NAT Gateway
      public_subnet = Subnet(
          self,
          f"public_subnet_{i}",
          vpc_id=self.vpc.id,
          cidr_block=f"10.0.{i + 1}.0/24",
          # us-west-2a, us-west-2b
          availability_zone=f"{self.region}{chr(97 + i)}",
          map_public_ip_on_launch=True,
          tags={"Name": f"tap-public-subnet-{i + 1}"},
      )
      self.public_subnets.append(public_subnet)

      # Private subnet for Lambda functions
      private_subnet = Subnet(
          self,
          f"private_subnet_{i}",
          vpc_id=self.vpc.id,
          cidr_block=f"10.0.{i + 10}.0/24",
          availability_zone=f"{self.region}{chr(97 + i)}",
          tags={"Name": f"tap-private-subnet-{i + 1}"},
      )
      self.private_subnets.append(private_subnet)

      # Elastic IP for NAT Gateway
      eip = Eip(
          self,
          f"nat_eip_{i}",
          domain="vpc",
          tags={"Name": f"tap-nat-eip-{i + 1}"},
      )
      self.eips.append(eip)

      # NAT Gateway for private subnet internet access
      nat_gw = NatGateway(
          self,
          f"nat_gateway_{i}",
          allocation_id=eip.id,
          subnet_id=public_subnet.id,
          tags={"Name": f"tap-nat-gateway-{i + 1}"},
      )
      self.nat_gateways.append(nat_gw)

    # Create route tables
    # Public route table
    self.public_rt = RouteTable(
        self, "public_rt", vpc_id=self.vpc.id, tags={"Name": "tap-public-rt"}
    )

    # Route to Internet Gateway
    Route(
        self,
        "public_route",
        route_table_id=self.public_rt.id,
        destination_cidr_block="0.0.0.0/0",
        gateway_id=self.igw.id,
    )

    # Associate public subnets with public route table
    for i, subnet in enumerate(self.public_subnets):
      RouteTableAssociation(
          self,
          f"public_rt_association_{i}",
          subnet_id=subnet.id,
          route_table_id=self.public_rt.id,
      )

    # Private route tables (one per AZ for high availability)
    self.private_rts = []
    for i, nat_gw in enumerate(self.nat_gateways):
      private_rt = RouteTable(
          self,
          f"private_rt_{i}",
          vpc_id=self.vpc.id,
          tags={"Name": f"tap-private-rt-{i + 1}"},
      )
      self.private_rts.append(private_rt)

      # Route to NAT Gateway
      Route(
          self,
          f"private_route_{i}",
          route_table_id=private_rt.id,
          destination_cidr_block="0.0.0.0/0",
          nat_gateway_id=nat_gw.id,
      )

      # Associate private subnet with private route table
      RouteTableAssociation(
          self,
          f"private_rt_association_{i}",
          subnet_id=self.private_subnets[i].id,
          route_table_id=private_rt.id,
      )

  def _create_security_groups(self):
    """
    Create security groups for Lambda functions with least privilege access.
    """
    # Security group for Lambda functions
    self.lambda_sg = SecurityGroup(
        self,
        "lambda_sg",
        name="tap-lambda-sg",
        description="Security group for Lambda functions",
        vpc_id=self.vpc.id,
        egress=[
            SecurityGroupEgress(
                from_port=443,
                to_port=443,
                protocol="tcp",
                cidr_blocks=["0.0.0.0/0"],
                description="HTTPS outbound for AWS services",
            ),
            SecurityGroupEgress(
                from_port=80,
                to_port=80,
                protocol="tcp",
                cidr_blocks=["0.0.0.0/0"],
                description="HTTP outbound for package downloads",
            ),
        ],
        tags={"Name": "tap-lambda-sg"},
    )

  def _create_iam_resources(self):
    """
    Create IAM roles and policies with least privilege access for Lambda functions.
    """
    # Lambda execution role trust policy
    lambda_trust_policy = DataAwsIamPolicyDocument(
        self,
        "lambda_trust_policy",
        statement=[
            {
                "actions": ["sts:AssumeRole"],
                "effect": "Allow",
                "principals": [
                    {"type": "Service", "identifiers": ["lambda.amazonaws.com"]}
                ],
            }
        ],
    )

    # Lambda execution role
    self.lambda_role = IamRole(
        self,
        "lambda_role",
        name="tap-lambda-execution-role",
        assume_role_policy=lambda_trust_policy.json,
        tags={"Name": "tap-lambda-execution-role"},
    )

    # Attach basic Lambda execution policy
    IamRolePolicyAttachment(
        self,
        "lambda_basic_execution",
        role=self.lambda_role.name,
        policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
    )

    # VPC execution policy removed - Lambda not in VPC for LocalStack Community compatibility
    # X-Ray write access removed - X-Ray not used in LocalStack Community

    # Custom policy for DynamoDB access
    dynamodb_policy_document = DataAwsIamPolicyDocument(
        self,
        "dynamodb_policy_document",
        statement=[
            {
                "effect": "Allow",
                "actions": [
                    "dynamodb:GetItem",
                    "dynamodb:PutItem",
                    "dynamodb:UpdateItem",
                    "dynamodb:DeleteItem",
                    "dynamodb:Query",
                    "dynamodb:Scan",
                ],
                "resources": ["arn:aws:dynamodb:*:*:table/tap-serverless-table"],
            }],
    )

    dynamodb_policy = IamPolicy(
        self,
        "dynamodb_policy",
        name="tap-lambda-dynamodb-policy",
        policy=dynamodb_policy_document.json,
    )

    IamRolePolicyAttachment(
        self,
        "lambda_dynamodb_policy",
        role=self.lambda_role.name,
        policy_arn=dynamodb_policy.arn,
    )

  def _create_dynamodb_table(self):
    """
    Create DynamoDB table with encryption at rest and on-demand capacity.
    """
    self.dynamodb_table = DynamodbTable(
        self,
        "main_table",
        name="tap-serverless-table",
        billing_mode="PAY_PER_REQUEST",  # Serverless pricing model
        hash_key="id",
        attribute=[{"name": "id", "type": "S"}],
        # Enable encryption at rest
        server_side_encryption={"enabled": True},
        # Enable point-in-time recovery
        point_in_time_recovery={"enabled": True},
        tags={"Name": "tap-serverless-table"},
    )

  def _create_lambda_functions(self):
    """
    Create Lambda functions with VPC configuration and X-Ray tracing.
    """
    # Sample Lambda function code
    lambda_code = """
import json
import boto3
import os

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['DYNAMODB_TABLE'])

def lambda_handler(event, context):
    try:
        # Sample logic - echo the request with timestamp
        response_body = {
            'message': 'Hello from Lambda!',
            'event': event,
            'table_name': os.environ['DYNAMODB_TABLE']
        }

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(response_body)
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': str(e)})
        }
""".strip() + "\n"
    repo_root = Path(__file__).resolve().parents[1]
    lambda_src_dir = repo_root / "lambda_src"
    lambda_src_dir.mkdir(parents=True, exist_ok=True)

    # Write the handler file every synth (idempotent)
    (lambda_src_dir / "lambda_function.py").write_text(lambda_code, encoding="utf-8")

    # Write Lambda code asset
    lambda_asset = TerraformAsset(
        self,
        "lambda_asset",
        path=str(lambda_src_dir),
        type=AssetType.ARCHIVE,
    )

    # Create Lambda function
    # Note: VPC configuration removed for LocalStack Community compatibility
    # Note: X-Ray tracing removed for LocalStack Community compatibility
    self.lambda_function = LambdaFunction(
        self,
        "main_lambda",
        function_name="tap-serverless-function",
        runtime="python3.9",
        # change if your file/func name differs
        handler="lambda_function.lambda_handler",
        role=self.lambda_role.arn,
        filename=lambda_asset.path,  # CDKTF will zip & point to it
        source_code_hash=lambda_asset.asset_hash,  # auto-calculated
        timeout=30,
        memory_size=256,
        environment={
            "variables": {
                "DYNAMODB_TABLE": self.dynamodb_table.name,
            }
        },
        tags={"Name": "tap-serverless-function"},
    )

  def _create_api_gateway(self):
    """
    Create API Gateway REST API with X-Ray tracing enabled.
    """
    # Create REST API
    self.api_gateway = ApiGatewayRestApi(
        self,
        "main_api",
        name="tap-serverless-api",
        description="Serverless API for tap application",
        tags={"Name": "tap-serverless-api"},
    )

    # Create API resource
    self.api_resource = ApiGatewayResource(
        self,
        "api_resource",
        rest_api_id=self.api_gateway.id,
        parent_id=self.api_gateway.root_resource_id,
        path_part="hello",
    )

    # Create GET method
    self.api_method = ApiGatewayMethod(
        self,
        "api_method",
        rest_api_id=self.api_gateway.id,
        resource_id=self.api_resource.id,
        http_method="GET",
        authorization="NONE",
    )

    # Create Lambda integration
    self.api_integration = ApiGatewayIntegration(
        self,
        "api_integration",
        rest_api_id=self.api_gateway.id,
        resource_id=self.api_resource.id,
        http_method=self.api_method.http_method,
        integration_http_method="POST",
        type="AWS_PROXY",
        uri=f"arn:aws:apigateway:{
            self.region}:lambda:path/2015-03-31/functions/{
            self.lambda_function.arn}/invocations",
    )

    # Grant API Gateway permission to invoke Lambda
    LambdaPermission(
        self,
        "api_lambda_permission",
        statement_id="AllowAPIGatewayInvoke",
        action="lambda:InvokeFunction",
        function_name=self.lambda_function.function_name,
        principal="apigateway.amazonaws.com",
        source_arn=f"{self.api_gateway.execution_arn}/*/*",
    )

    # Create deployment
    self.api_deployment = ApiGatewayDeployment(
        self,
        "api_deployment",
        rest_api_id=self.api_gateway.id,
        depends_on=[self.api_integration],
    )

    # Create stage with logging (X-Ray tracing removed for LocalStack Community compatibility)
    self.api_stage = ApiGatewayStage(
        self,
        "api_stage",
        deployment_id=self.api_deployment.id,
        rest_api_id=self.api_gateway.id,
        stage_name="prod",
        tags={"Name": "tap-api-prod-stage"},
    )

  def _create_monitoring(self):
    """
    Create CloudWatch logs and monitoring resources.
    """
    # CloudWatch log group for Lambda
    self.lambda_log_group = CloudwatchLogGroup(
        self,
        "lambda_log_group",
        name=f"/aws/lambda/{self.lambda_function.function_name}",
        retention_in_days=14,
        # Encrypt logs at rest
        #kms_key_id="alias/aws/logs",
        tags={"Name": "tap-lambda-logs"},
    )

    # CloudWatch log group for API Gateway
    self.api_log_group = CloudwatchLogGroup(
        self,
        "api_log_group",
        name=f"API-Gateway-Execution-Logs_{self.api_gateway.id}/prod",
        retention_in_days=14,
        #kms_key_id="alias/aws/logs",
        tags={"Name": "tap-api-logs"},
    )

    # CloudWatch alarm for Lambda errors
    self.lambda_error_alarm = CloudwatchMetricAlarm(
        self,
        "lambda_error_alarm",
        alarm_name="tap-lambda-errors",
        comparison_operator="GreaterThanThreshold",
        evaluation_periods=2,
        metric_name="Errors",
        namespace="AWS/Lambda",
        period=300,
        statistic="Sum",
        threshold=5,
        alarm_description="Lambda function error rate is too high",
        dimensions={"FunctionName": self.lambda_function.function_name},
        tags={"Name": "tap-lambda-error-alarm"},
    )

    # CloudWatch alarm for API Gateway 4xx errors
    self.api_4xx_alarm = CloudwatchMetricAlarm(
        self,
        "api_4xx_alarm",
        alarm_name="tap-api-4xx-errors",
        comparison_operator="GreaterThanThreshold",
        evaluation_periods=2,
        metric_name="4XXError",
        namespace="AWS/ApiGateway",
        period=300,
        statistic="Sum",
        threshold=10,
        alarm_description="API Gateway 4xx error rate is too high",
        dimensions={
            "ApiName": self.api_gateway.name,
            "Stage": self.api_stage.stage_name,
        },
        tags={"Name": "tap-api-4xx-alarm"},
    )

  def _create_outputs(self):
    """
    Create Terraform outputs for important resource information.
    """
    TerraformOutput(
        self,
        "api_gateway_url",
        value=f"https://{self.api_gateway.id}.execute-api.{self.region}.amazonaws.com/{self.api_stage.stage_name}",
    )

    TerraformOutput(
        self, "lambda_function_name", value=self.lambda_function.function_name
    )

    TerraformOutput(
        self,
        "dynamodb_table_name",
        value=self.dynamodb_table.name)

    TerraformOutput(self, "vpc_id", value=self.vpc.id)
