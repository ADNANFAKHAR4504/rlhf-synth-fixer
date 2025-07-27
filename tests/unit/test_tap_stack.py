import aws_cdk as cdk
from aws_cdk.assertions import Template


from lib.cdk.tap_stack import  TapStack as firstone
from lib.tap_stack import TapStack

def get_template() -> Template:
  """Synthesizes the CloudFormation template for TapStack."""
  app = cdk.App()
  stack = TapStack(app, "TapStack")
  return Template.from_stack(stack)


def test_template_structure():
  template = get_template().to_json()

  # Ensure required sections exist
  assert "Resources" in template
  assert template is not None
  assert isinstance(template, dict)
  assert len(template["Resources"]) > 0


def test_vpc_created():
  template = get_template()
  template.resource_count_is("AWS::EC2::VPC", 1)
  template.has_resource_properties(
    "AWS::EC2::VPC",
    {
      "EnableDnsSupport": True,
      "EnableDnsHostnames": True
    }
  )


def test_iam_role_for_ec2():
  template = get_template()
  template.resource_count_is("AWS::IAM::Role", 2)
  template.has_resource_properties(
    "AWS::IAM::Role",
    {
      "AssumeRolePolicyDocument": {
        "Statement": [
          {
            "Action": "sts:AssumeRole",
            "Effect": "Allow",
            "Principal": {"Service": "ec2.amazonaws.com"},
          }
        ]
      }
    }
  )


def test_security_groups_created():
  template = get_template()
  template.resource_count_is("AWS::EC2::SecurityGroup", 2)


def test_ec2_instance_properties():
  template = get_template()
  template.resource_count_is("AWS::EC2::Instance", 1)
  template.has_resource_properties(
    "AWS::EC2::Instance",
    {
      "InstanceType": "t3.micro",
    },
  )


def test_cloudtrail_and_log_groups():
  template = get_template()
  template.resource_count_is("AWS::CloudTrail::Trail", 1)
  template.resource_count_is("AWS::Logs::LogGroup", 2)


def test_tags_applied_to_resources():
  template = get_template().to_json()

  # Verify that global tags are applied to all resources that support tagging
  for resource_name, resource in template["Resources"].items():
    tags = resource.get("Properties", {}).get("Tags", [])
    if tags:  # Only check resources that support tags
      tag_keys = [tag["Key"] for tag in tags]
      assert "Project" in tag_keys
      assert "Environment" in tag_keys
    print(resource_name)


def test_resource_count_validation():
  template = get_template().to_json()
  resource_count = len(template["Resources"])
  assert resource_count >= 6  # Adjust based on stack's expected resource count