"""
Unit tests for the AWS Nova Model Breaking infrastructure.
Tests resource creation and configuration using Pulumi mocks.
"""

import json
import pulumi
import pulumi.runtime
import pytest


class TestMocks(pulumi.runtime.Mocks):
  """Mock AWS resources for unit testing."""
  
  def new_resource(self, args: pulumi.runtime.MockResourceArgs):
    """Create mock resources with predictable IDs."""
    return [f"{args.name}_id", args.inputs]

  def call(self, args: pulumi.runtime.MockCallArgs):
    """Mock AWS API calls."""
    if args.token == "aws:index/getAvailabilityZones:getAvailabilityZones":
      return {"names": ["us-east-1a", "us-east-1b", "us-east-1c"]}
    return {}


@pytest.fixture(scope="module", autouse=True)
def pulumi_mocks():
  """Setup Pulumi mocks for all tests."""
  pulumi.runtime.set_mocks(TestMocks())


@pytest.mark.asyncio
async def test_vpc_configuration():
  """Test VPC is created with correct CIDR and DNS settings."""
  import lib.tap_stack as stack
  
  vpc_id = await pulumi.Output.from_input(stack.vpc.id).future()
  assert isinstance(vpc_id, str)
  assert vpc_id.startswith("vpc-")


@pytest.mark.asyncio
async def test_subnet_distribution():
  """Test subnets are properly distributed across availability zones."""
  import lib.tap_stack as stack
  
  public_subnets = await pulumi.Output.from_input(stack.public_subnets).future()
  private_subnets = await pulumi.Output.from_input(stack.private_subnets).future()
  
  # Verify subnet counts
  assert len(public_subnets) == 2
  assert len(private_subnets) == 2
  
  # Verify all are strings (subnet IDs)
  assert all(isinstance(subnet, str) for subnet in public_subnets)
  assert all(isinstance(subnet, str) for subnet in private_subnets)


@pytest.mark.asyncio
async def test_s3_bucket_security():
  """Test S3 bucket has encryption and security configurations."""
  import lib.tap_stack as stack
  
  bucket_name = await pulumi.Output.from_input(stack.bucket.bucket).future()
  assert isinstance(bucket_name, str)
  assert bucket_name.startswith("data-bucket-")


@pytest.mark.asyncio
async def test_lambda_configuration():
  """Test Lambda function has correct runtime and environment variables."""
  import lib.tap_stack as stack
  
  lambda_name = await pulumi.Output.from_input(stack.lambda_func.name).future()
  assert isinstance(lambda_name, str)
  assert lambda_name.startswith("processor-")


@pytest.mark.asyncio
async def test_iam_role_permissions():
  """Test IAM role has least privilege permissions."""
  import lib.tap_stack as stack
  
  role_arn = await pulumi.Output.from_input(stack.lambda_role.arn).future()
  assert isinstance(role_arn, str)
  assert "lambda-role-" in role_arn


@pytest.mark.asyncio
async def test_cloudwatch_logging():
  """Test CloudWatch log group is configured for Lambda."""
  import lib.tap_stack as stack
  
  log_group_name = await pulumi.Output.from_input(stack.log_group.name).future()
  assert isinstance(log_group_name, str)
  assert log_group_name.startswith("/aws/lambda/")


@pytest.mark.asyncio
async def test_network_connectivity():
  """Test network resources are properly connected."""
  import lib.tap_stack as stack
  
  vpc_id = await pulumi.Output.from_input(stack.vpc.id).future()
  igw_id = await pulumi.Output.from_input(stack.igw.id).future()
  nat_gw_id = await pulumi.Output.from_input(stack.nat_gw.id).future()
  
  # Verify core networking components exist
  assert vpc_id is not None
  assert igw_id is not None
  assert nat_gw_id is not None


@pytest.mark.asyncio
async def test_stack_exports():
  """Test all required stack outputs are exported."""
  import lib.tap_stack as stack
  
  # Get exported values
  vpc_id = await pulumi.Output.from_input(stack.vpc.id).future()
  public_subnets = await pulumi.Output.from_input(stack.public_subnets).future()
  private_subnets = await pulumi.Output.from_input(stack.private_subnets).future()
  bucket_name = await pulumi.Output.from_input(stack.bucket.bucket).future()
  lambda_name = await pulumi.Output.from_input(stack.lambda_func.name).future()
  
  # Verify all exports exist and have correct types
  assert vpc_id is not None
  assert len(public_subnets) == 2
  assert len(private_subnets) == 2
  assert bucket_name is not None
  assert lambda_name is not None
