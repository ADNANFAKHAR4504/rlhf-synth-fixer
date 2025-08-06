import os
import sys
import unittest
from unittest.mock import Mock
from lib.components.serverless import ServerlessComponent
from lib.components.database import DatabaseComponent
from lib.components.vpc import ComputeComponent
from lib.components.iam import IAMComponent
from lib.tap_stack import TapStackArgs, TapStack
import pulumi

# Set environment variable for Pulumi testing
os.environ["PULUMI_TEST_MODE"] = "true"


class MockComponentResource:
  def __init__(self, *args, **kwargs):
    self.type_name = args[0] if len(args) > 0 else None
    self.name = args[1] if len(args) > 1 else None
    self.props = kwargs.get("props", {})
    self.opts = kwargs.get("opts", None)
    self.outputs = None

  def register_outputs(self, outputs):
    self.outputs = outputs


class MockOutput:
  def __init__(self, value=None):
    self.value = value

  @staticmethod
  def all(*args):
    mock_result = Mock()
    mock_result.apply = Mock(return_value=Mock())
    return mock_result

  @staticmethod
  def concat(*args):
    return Mock()


class FakeResourceOptions:
  def __init__(self, *args, **kwargs):
    pass


# Inject Pulumi and AWS mocks before importing actual components
mock_pulumi = Mock()
mock_pulumi.ComponentResource = MockComponentResource
mock_pulumi.ResourceOptions = pulumi.ResourceOptions
mock_pulumi.Output = MockOutput
mock_pulumi.Output.concat = MockOutput.concat
mock_pulumi.Output.all = MockOutput.all
mock_pulumi.AssetArchive = Mock()
mock_pulumi.StringAsset = Mock()
mock_pulumi.get_stack = Mock(return_value="test")

mock_aws = Mock()
mock_aws.get_region.return_value = Mock(name="us-east-1")
mock_aws.get_availability_zones.return_value = Mock(
    names=["us-east-1a", "us-east-1b"]
)

sys.modules["pulumi_aws"] = mock_aws

# Mocking specific pulumi_aws classes
mock_aws_ec2 = Mock()
mock_aws_ec2.Vpc.return_value = Mock(id="vpc-123")
mock_aws_ec2.Subnet.return_value = Mock(id="subnet-123")
mock_aws_ec2.SecurityGroup.return_value = Mock(id="sg-123")

mock_aws_rds = Mock()
mock_aws_rds.Instance.return_value = Mock(endpoint="db-endpoint", id="db-123")

mock_aws_iam = Mock()
mock_aws_iam.Role.return_value = Mock(arn="arn:aws:iam::123:role/test")

mock_aws_apigateway = Mock()
mock_aws_apigateway.RestApi.return_value = Mock(id="api-123")
mock_aws_apigateway.Deployment.return_value = Mock()
mock_aws_apigateway.Stage.return_value = Mock()
mock_aws_apigateway.Resource.return_value = Mock()
mock_aws_apigateway.Method.return_value = Mock()
mock_aws_apigateway.Integration.return_value = Mock()
mock_aws_apigateway.IntegrationResponse.return_value = Mock()
mock_aws_apigateway.MethodResponse.return_value = Mock()

# Patch submodules into sys.modules
sys.modules["pulumi_aws.ec2"] = mock_aws_ec2
sys.modules["pulumi_aws.rds"] = mock_aws_rds
sys.modules["pulumi_aws.iam"] = mock_aws_iam
sys.modules["pulumi_aws.apigateway"] = mock_aws_apigateway


class TestTapStackComponents(unittest.TestCase):
  def setUp(self):
    self.test_args = TapStackArgs(
        environment_suffix="test",
        # passed only to TapStack, not to components
        tags={"Environment": "test", "Project": "tap-stack"}
    )

  def test_iam_component_initialization(self):
    iam = IAMComponent(
        name="test-iam",
        environment="test",
        opts=mock_pulumi.ResourceOptions(),
    )
    self.assertTrue(hasattr(iam, "lambda_role"))

  def test_compute_component_initialization(self):
    compute = ComputeComponent(
        name="test-compute",
        cidr_block="10.3.0.0/16",
        environment="test",
        opts=mock_pulumi.ResourceOptions(),
    )
    self.assertTrue(hasattr(compute, "vpc"))
    self.assertTrue(hasattr(compute, "private_subnet_ids"))
    self.assertTrue(hasattr(compute, "lambda_sg"))

  def test_database_component_initialization(self):
    compute = ComputeComponent(
        name="test-compute",
        cidr_block="10.3.0.0/16",
        environment="test",
        opts=mock_pulumi.ResourceOptions(),
    )
    db = DatabaseComponent(
        name="test-db",
        environment="test",
        db_security_group_id=compute.db_sg.id,
        username="admin",
        password="passw0rd",
        private_subnet_ids=compute.private_subnet_ids,
        opts=mock_pulumi.ResourceOptions(),
    )
    self.assertTrue(hasattr(db, "rds_instance"))

  def test_serverless_component_initialization(self):
    compute = ComputeComponent(
        name="test-compute",
        cidr_block="10.3.0.0/16",
        environment="test",
        opts=mock_pulumi.ResourceOptions(),
    )
    db = DatabaseComponent(
        name="test-db",
        environment="test",
        db_security_group_id=compute.db_sg.id,
        username="admin",
        password="passw0rd",
        private_subnet_ids=compute.private_subnet_ids,
        opts=mock_pulumi.ResourceOptions(),
    )
    iam = IAMComponent(
        name="test-iam",
        environment="test",
        opts=mock_pulumi.ResourceOptions(),
    )
    serverless = ServerlessComponent(
        name="test-serverless",
        environment="test",
        lambda_role_arn=iam.lambda_role.arn,
        private_subnet_ids=compute.private_subnet_ids,
        lambda_security_group_id=compute.lambda_sg.id,
        rds_endpoint=db.rds_instance.endpoint,
        db_name="tapdb",
        db_username="admin",
        db_password="passw0rd",
        opts=mock_pulumi.ResourceOptions(),
    )
    self.assertTrue(hasattr(serverless, "lambda_function"))
    self.assertTrue(hasattr(serverless, "api"))

  def test_tap_stack_initialization(self):
    stack = TapStack(
        name="tap-test",
        args=self.test_args,
        opts=mock_pulumi.ResourceOptions(),
    )
    self.assertTrue(hasattr(stack, "iam_component"))
    self.assertTrue(hasattr(stack, "compute_component"))
    self.assertTrue(hasattr(stack, "database_component"))
    self.assertTrue(hasattr(stack, "serverless_component"))


if __name__ == "__main__":
  unittest.main(verbosity=2, buffer=True)
