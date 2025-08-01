import pytest
import pytest_asyncio
import pulumi.runtime
from pulumi.runtime import mocks
from pulumi import Output
from lib.tap_stack import create_tap_stack


class MockInfra(mocks.Mocks):
  def new_resource(self, args):
    return [f"{args.name}_id", args.inputs]

  def call(self, args):
    return args.args


@pytest_asyncio.fixture(scope="module", autouse=True)
async def setup_mocks():
  mocks.set_mocks(MockInfra())




def test_tap_stack_creates_service_role():
  stack = create_tap_stack(environment="test")
  assert stack.tap_service_role is not None

  captured_name = None

  def capture(name):
    nonlocal captured_name
    captured_name = name
    return name

  stack.tap_service_role.name.apply(capture)
  pulumi.runtime.run_in_stack(lambda: None)

  assert captured_name is not None
  assert "TAP-Service-Role" in captured_name


def test_tap_stack_creates_artifacts_bucket():
  stack = create_tap_stack(environment="test")
  assert stack.artifacts_bucket is not None

  captured_bucket_name = None

  def capture(name):
    nonlocal captured_bucket_name
    captured_bucket_name = name
    return name

  stack.artifacts_bucket.bucket.apply(capture)
  pulumi.runtime.run_in_stack(lambda: None)

  assert captured_bucket_name is not None
  assert captured_bucket_name.startswith("tap-test-artifacts")


def test_tap_stack_creates_log_group_when_enabled():
  stack = create_tap_stack(environment="test")

  if stack.args.enable_monitoring:
    assert stack.app_log_group is not None

    captured_log_group_name = None

    def capture(name):
      nonlocal captured_log_group_name
      captured_log_group_name = name
      return name

    stack.app_log_group.name.apply(capture)
    pulumi.runtime.run_in_stack(lambda: None)

    assert captured_log_group_name is not None
    assert captured_log_group_name.startswith("/aws/tap/test/application-")



@pytest.mark.asyncio
async def test_tap_stack_applies_default_tags():
  stack = create_tap_stack(environment="test")
  tags = stack.tags
  assert tags["Project"] == stack.project_name
  assert tags["Environment"] == stack.environment_suffix.title()
  assert tags["ManagedBy"] == "Pulumi"
  assert "Owner" in tags


@pytest.mark.asyncio
async def test_tap_stack_outputs_contain_expected_fields():
  stack = create_tap_stack(environment="test")
  assert isinstance(stack.service_role_arn, Output)
  assert isinstance(stack.artifacts_bucket_name, Output)
  if stack.args.enable_monitoring:
    assert isinstance(stack.app_log_group.name, Output)
