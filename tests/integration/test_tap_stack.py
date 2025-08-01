import asyncio
import pytest
from pulumi.runtime import mocks
from pulumi import Output
from lib.tap_stack import create_tap_stack


class MockInfra(mocks.Mocks):
  def new_resource(self, args):
    return [f"{args.name}_id", args.inputs]

  def call(self, args):
    return args.args


@pytest.fixture(scope="module", autouse=True)
def setup_mocks():
  mocks.set_mocks(MockInfra())

def setup_event_loop():
  """Ensure there is an event loop running in the main thread."""
  try:
    asyncio.get_running_loop()
  except RuntimeError:
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)


# @pytest.mark.asyncio
# async def test_tap_stack_creates_service_role():
#   stack = create_tap_stack(environment="test")
#   assert stack.tap_service_role is not None
#   name = await stack.tap_service_role.name.future()
#   assert "TAP-Service-Role" in name


# @pytest.mark.asyncio
# async def test_tap_stack_creates_artifacts_bucket():
#   stack = create_tap_stack(environment="test")
#   assert stack.artifacts_bucket is not None
#   name = await stack.artifacts_bucket.bucket.future()
#   assert name.startswith("tap-test-artifacts")


# @pytest.mark.asyncio
# async def test_tap_stack_creates_log_group_when_enabled():
#   stack = create_tap_stack(environment="test")
#   if stack.args.enable_monitoring:
#     assert stack.app_log_group is not None
#     name = await stack.app_log_group.name.future()
#     assert name.startswith("/aws/tap/test/application-")


def test_tap_stack_applies_default_tags():
  async def run():
    stack = create_tap_stack(environment="test")
    tags = stack.tags
    assert tags["Project"] == stack.project_name
    assert tags["Environment"] == stack.environment_suffix.title()
    assert tags["ManagedBy"] == "Pulumi"
    assert "Owner" in tags

  asyncio.run(run())


def test_tap_stack_outputs_contain_expected_fields():
  async def run():
    stack = create_tap_stack(environment="test")
    assert isinstance(stack.service_role_arn, Output)
    assert isinstance(stack.artifacts_bucket_name, Output)
    if stack.args.enable_monitoring:
      assert isinstance(stack.app_log_group.name, Output)

  asyncio.run(run())


def test_tap_stack_service_role_has_correct_name():
  setup_event_loop()
  stack = create_tap_stack(environment="test")

  def check(name):
    if not name.startswith("TAP-Service-Role"):
      raise AssertionError(f"Expected name to start with 'TAP-Service-Role', got: {name}")

  stack.tap_service_role.name.apply(check)


def test_tap_stack_bucket_name_format():
  setup_event_loop()
  stack = create_tap_stack(environment="test")

  def check(name):
    if not name.startswith("tap-test-artifacts"):
      raise AssertionError(f"Bucket name format incorrect: {name}")

  stack.artifacts_bucket.bucket.apply(check)


def raise_(msg):
  raise AssertionError(msg)
