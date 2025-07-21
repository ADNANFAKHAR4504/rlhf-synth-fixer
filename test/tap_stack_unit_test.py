import json
import os
import re
from pathlib import Path
import pytest

ENVIRONMENT_SUFFIX = os.getenv("ENVIRONMENT_SUFFIX", "dev")

@pytest.fixture(scope="module")
def template():
    template_path = Path(__file__).parent.parent / "lib" / "TapStack.json"
    with open(template_path, "r", encoding="utf-8") as f:
        return json.load(f)

def test_template_format_version(template):
    assert template.get("AWSTemplateFormatVersion") == "2010-09-09"

def test_template_description(template):
    desc = template.get("Description")
    assert desc is not None
    assert "TAP Stack" in desc

def test_metadata_and_interface(template):
    metadata = template.get("Metadata", {}).get("AWS::CloudFormation::Interface")
    assert metadata is not None
    assert "ParameterGroups" in metadata

def test_environment_suffix_parameter(template):
    param = template.get("Parameters", {}).get("EnvironmentSuffix")
    assert param is not None
    assert param.get("Type") == "String"
    assert param.get("Default") == "dev"
    assert param.get("AllowedPattern") == "^[a-zA-Z0-9]+$"

def test_allowed_ssh_location_cidr(template):
    ssh_param = template.get("Parameters", {}).get("SshCidrBlock")
    assert ssh_param is not None
    pattern = ssh_param.get("AllowedPattern")
    expected_pattern = r"^([0-9]{1,3}\.){3}[0-9]{1,3}/([0-9]|[1-2][0-9]|3[0-2])$"
    assert pattern == expected_pattern

def test_ami_id_parameter_exists(template):
    ami_param = template.get("Parameters", {}).get("AmiId")
    assert ami_param is not None

def get_resources_of_type(template, resource_type):
    return [res for res in template.get("Resources", {}).values() if res.get("Type") == resource_type]

def test_vpc_with_dns_support(template):
    vpcs = get_resources_of_type(template, "AWS::EC2::VPC")
    assert len(vpcs) > 0
    vpc = vpcs[0]
    props = vpc.get("Properties", {})
    assert props.get("EnableDnsSupport") is True
    assert props.get("EnableDnsHostnames") is True

def test_internet_gateway_and_attachment(template):
    igws = get_resources_of_type(template, "AWS::EC2::InternetGateway")
    vpc_attachments = get_resources_of_type(template, "AWS::EC2::VPCGatewayAttachment")
    assert len(igws) == 1
    assert len(vpc_attachments) == 1

def test_nat_gateway_and_eip(template):
    eips = get_resources_of_type(template, "AWS::EC2::EIP")
    nat_gateways = get_resources_of_type(template, "AWS::EC2::NatGateway")
    assert len(eips) >= 1
    assert len(nat_gateways) == 1

def test_public_route_to_igw(template):
    routes = get_resources_of_type(template, "AWS::EC2::Route")
    public_route = next((r for r in routes if "GatewayId" in r.get("Properties", {})), None)
    assert public_route is not None
    assert public_route["Properties"].get("DestinationCidrBlock") == "0.0.0.0/0"

def test_private_route_using_nat(template):
    routes = get_resources_of_type(template, "AWS::EC2::Route")
    private_route = next((r for r in routes if "NatGatewayId" in r.get("Properties", {})), None)
    assert private_route is not None

def test_ec2_instances_and_ami(template):
    instances = get_resources_of_type(template, "AWS::EC2::Instance")
    assert len(instances) == 2
    for inst in instances:
        image_id = inst.get("Properties", {}).get("ImageId")
        assert image_id is not None
        # Should be a reference to AmiId parameter
        assert isinstance(image_id, dict)
        assert "Ref" in image_id
        assert image_id["Ref"] == "AmiId"

def test_security_group_ssh_http(template):
    sgs = get_resources_of_type(template, "AWS::EC2::SecurityGroup")
    assert len(sgs) > 0
    ingress = sgs[0].get("Properties", {}).get("SecurityGroupIngress", [])
    from_ports = {rule.get("FromPort") for rule in ingress}
    to_ports = {rule.get("ToPort") for rule in ingress}
    assert 22 in from_ports and 22 in to_ports
    assert 80 in from_ports and 80 in to_ports


def test_outputs_exist(template):
    outputs = template.get("Outputs")
    assert outputs is not None
    expected_keys = [
        "VPCId",
        "PublicSubnetId",
        "PrivateSubnetId",
        "PublicInstanceId",
        "PrivateInstanceId",
        "PublicInstancePublicIP",
    ]
    for key in expected_keys:
        assert key in outputs
