import types
import sys
from typing import Optional
import pulumi
from pulumi import ResourceOptions
from unittest.mock import Mock

# Mock pulumi_aws modules and submodules before importing anything that uses them
sys.modules["pulumi_aws"] = types.ModuleType("pulumi_aws")
sys.modules["pulumi_aws.ec2"] = types.ModuleType("pulumi_aws.ec2")
sys.modules["pulumi_aws.rds"] = types.ModuleType("pulumi_aws.rds")
sys.modules["pulumi_aws.iam"] = types.ModuleType("pulumi_aws.iam")
sys.modules["pulumi_aws.apigateway"] = types.ModuleType("pulumi_aws.apigateway")

# Attach mock classes and methods to the mocked modules
sys.modules["pulumi_aws.ec2"].Vpc = Mock(return_value=Mock(id="vpc-123"))
sys.modules["pulumi_aws.ec2"].Subnet = Mock(return_value=Mock(id="subnet-123"))
sys.modules["pulumi_aws.ec2"].SecurityGroup = Mock(return_value=Mock(id="sg-123"))

sys.modules["pulumi_aws.rds"].Instance = Mock(return_value=Mock(endpoint="db-endpoint", id="db-123"))

sys.modules["pulumi_aws.iam"].Role = Mock(return_value=Mock(arn="arn:aws:iam::123:role/test"))

sys.modules["pulumi_aws.apigateway"].RestApi = Mock(return_value=Mock(id="api-123"))
sys.modules["pulumi_aws.apigateway"].Deployment = Mock()
sys.modules["pulumi_aws.apigateway"].Stage = Mock()
sys.modules["pulumi_aws.apigateway"].Resource = Mock()
sys.modules["pulumi_aws.apigateway"].Method = Mock()
sys.modules["pulumi_aws.apigateway"].Integration = Mock()
sys.modules["pulumi_aws.apigateway"].IntegrationResponse = Mock()
sys.modules["pulumi_aws.apigateway"].MethodResponse = Mock()

# Add mock for get_region
mock_get_region_result = Mock()
mock_get_region_result.name = "us-east-1"
sys.modules["pulumi_aws"].get_region = Mock(return_value=mock_get_region_result)

# Now safely import your modules that use pulumi_aws
from lib.components.vpc import ComputeComponent
from lib.components.iam import IAMComponent
from lib.components.database import DatabaseComponent
from lib.components.serverless import ServerlessComponent


class TapStackArgs:
  def __init__(self, environment_suffix: Optional[str] = None, tags: Optional[dict] = None):
    self.environment_suffix = environment_suffix or 'dev'
    self.tags = tags


class TapStack(pulumi.ComponentResource):
  def __init__(
      self,
      name: str,
      args: TapStackArgs,
      opts: Optional[ResourceOptions] = None
  ):
    super().__init__('tap:stack:TapStack', name, None, opts)

    self.environment_suffix = args.environment_suffix
    self.tags = args.tags

    # Get current AWS region
    current_region = sys.modules["pulumi_aws"].get_region()

    # 2. Create IAM roles and policies
    self.iam_component = IAMComponent(
        f"iam-{self.environment_suffix}-turing",
        environment=self.environment_suffix,
        opts=pulumi.ResourceOptions(parent=self)
    )

    # 1. Create compute resources (Vpc, EC2, LoadBalancer)
    self.compute_component = ComputeComponent(
        f"vpc-{self.environment_suffix}",
        environment=self.environment_suffix,
        cidr_block="10.0.0.0/16",
        opts=pulumi.ResourceOptions(parent=self)
    )

    # 4. Create DynamoDB tables with PITR
    self.database_component = DatabaseComponent(
        f"database-{self.environment_suffix}",
        environment=self.environment_suffix,
        db_security_group_id=self.compute_component.db_sg.id,
        username="POSTGRES",
        password="POSTGRES",
        private_subnet_ids=self.compute_component.private_subnet_ids,
        opts=pulumi.ResourceOptions(parent=self)
    )

    # 5. Create serverless resources (Lambda)
    self.serverless_component = ServerlessComponent(
        f"serverless-{self.environment_suffix}",
        environment=self.environment_suffix,
        lambda_role_arn=self.iam_component.lambda_role.arn,
        private_subnet_ids=self.compute_component.private_subnet_ids,
        lambda_security_group_id=self.compute_component.lambda_sg.id,
        rds_endpoint=self.database_component.rds_instance.endpoint,
        db_name="appdb",
        db_username="POSTGRES",
        db_password="POSTGRES",
        opts=pulumi.ResourceOptions(parent=self, depends_on=[
            self.database_component
        ])
    )

    # Export important resource information
    pulumi.export("vpc_id", self.compute_component.vpc.id)
    pulumi.export("lambda_function_name", self.serverless_component.lambda_function.name)
    pulumi.export("api_gateway_address", self.serverless_component.api_url)
    pulumi.export("environment", self.environment_suffix)
    pulumi.export("region", current_region.name)
