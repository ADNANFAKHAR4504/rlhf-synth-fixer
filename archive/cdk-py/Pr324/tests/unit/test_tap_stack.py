import aws_cdk as cdk
from aws_cdk.assertions import Template
import pytest

from lib.tap_stack import TapStack, TapStackProps


@pytest.fixture
def synthesized_template():
  app = cdk.App()
  stack = TapStack(
    scope=app,
    construct_id="UnitTestTapStack",
    props=TapStackProps(
      environment_suffix="unit",
      principal_arns=["arn:aws:iam::123456789012:user/test-user"]
    )
  )
  return Template.from_stack(stack)


def test_template_is_valid_json(synthesized_template):
  assert isinstance(synthesized_template.to_json(), dict)


def test_template_contains_resources_section(synthesized_template):
  template_data = synthesized_template.to_json()
  assert "Resources" in template_data
  assert isinstance(template_data["Resources"], dict)


def test_output_keys_exist_if_defined(synthesized_template):
  outputs = synthesized_template.to_json().get("Outputs", {})
  expected_keys = ["BucketName", "BucketArn", "KmsKeyArn"]
  if outputs:
    for key in expected_keys:
      assert key in outputs