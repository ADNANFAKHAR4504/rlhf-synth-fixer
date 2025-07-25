import aws_cdk as cdk
from aws_cdk.assertions import Template
from lib.tap_stack import TapStack


def get_template():
    """Synthesizes the TapStack into a CloudFormation template."""
    app = cdk.App()
    stack = TapStack(app, "TestTapStack")
    return Template.from_stack(stack)


def test_template_structure():
    template = get_template().to_json()

    # Check AWSTemplateFormatVersion
    assert "AWSTemplateFormatVersion" in template

    # Ensure Resources section exists
    assert "Resources" in template
    assert isinstance(template["Resources"], dict)

    # Ensure there is a description
    # (CDK templates often don't have explicit descriptions unless added)
    # If Description is expected, uncomment below:
    # assert "Description" in template


def test_vpc_resource_exists():
    template = get_template()
    template.resource_count_is("AWS::EC2::VPC", 1)

    # Validate properties
    template.has_resource_properties("AWS::EC2::VPC", {
        "EnableDnsSupport": True,
        "EnableDnsHostnames": True
    })


def test_iam_role_for_ec2():
    template = get_template()
    template.resource_count_is("AWS::IAM::Role", 1)

    template.has_resource_properties("AWS::IAM::Role", {
        "AssumeRolePolicyDocument": {
            "Statement": [{
                "Action": "sts:AssumeRole",
                "Effect": "Allow",
                "Principal": {"Service": "ec2.amazonaws.com"}
            }]
        }
    })


def test_security_groups_exist():
    template = get_template()
    template.resource_count_is("AWS::EC2::SecurityGroup", 2)


def test_ec2_instance():
    template = get_template()
    template.resource_count_is("AWS::EC2::Instance", 1)

    template.has_resource_properties("AWS::EC2::Instance", {
        "InstanceType": "t3.micro"
    })


def test_cloudtrail_and_log_groups():
    template = get_template()
    template.resource_count_is("AWS::CloudTrail::Trail", 1)
    template.resource_count_is("AWS::Logs::LogGroup", 2)  # CloudTrail + EC2 logs


def test_total_resource_count():
    template = get_template().to_json()
    resource_count = len(template["Resources"].keys())

    # Validate minimum resources (will vary if you add new resources)
    assert resource_count >= 7, f"Expected at least 7 resources, found {resource_count}"

