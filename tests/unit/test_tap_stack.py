"""Unit tests for the TapStack Pulumi component."""
import pytest
try:
    import pulumi
    from moto import mock_aws
except ImportError:
    pytest.skip("Pulumi or moto not available", allow_module_level=True)

from lib.tap_stack import *


class TestMocks(pulumi.runtime.Mocks):
    """Mock Pulumi resources for testing."""
    
    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        outputs = args.inputs.copy()
        outputs['id'] = f"{args.name}_id"
        
        resource_mocks = {
            "aws:ec2/vpc:Vpc": {
                'ipv6_cidr_block': "2600:1f18:1234:5600::/56",
                'cidr_block': "10.0.0.0/16"
            },
            "aws:iam/role:Role": {
                'arn': f"arn:aws:iam::123456789012:role/{args.name}"
            },
            "aws:iam/instanceProfile:InstanceProfile": {
                'arn': f"arn:aws:iam::123456789012:instance-profile/{args.name}"
            },
            "aws:ec2/instance:Instance": {
                'public_ip': "1.2.3.4",
                'ipv6_addresses': ["2600:1f18:1234:5600::1"]
            },
            "aws:lb/loadBalancer:LoadBalancer": {
                'dns_name': "test-alb.us-east-1.elb.amazonaws.com",
                'zone_id': "Z1D633PJN98FT9",
                'arn': f"arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/{args.name}/1234567890123456",
                'arn_suffix': "app/test-alb/1234567890123456"
            },
            "aws:lb/targetGroup:TargetGroup": {
                'arn': f"arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/{args.name}/1234567890123456",
                'arn_suffix': f"targetgroup/{args.name}/1234567890123456"
            },
            "aws:ec2/subnet:Subnet": {
                'availability_zone': "us-east-1a"
            }
        }
        
        if args.typ in resource_mocks:
            outputs.update(resource_mocks[args.typ])
        
        return [f"{args.name}_id", outputs]

    def call(self, args: pulumi.runtime.MockCallArgs):
        """Mock Pulumi function calls."""
        if args.token == "aws:index/getAvailabilityZones:getAvailabilityZones":
            return {"names": ["us-east-1a", "us-east-1b"]}
        if args.token == "aws:ec2/getAmi:getAmi":
            return {"id": "ami-12345678"}
        return {}


pulumi.runtime.set_mocks(TestMocks())


@pulumi.runtime.test
@mock_aws
def test_infrastructure_creation():
    """Test basic infrastructure creation."""
    assert vpc is not None
    assert alb is not None
    assert len(ec2_instances) == 2
    assert len(public_subnets) == 2


@pulumi.runtime.test
@mock_aws
def test_vpc_configuration():
    """Test VPC configuration."""
    assert vpc.cidr_block == "10.0.0.0/16"
    assert vpc.enable_dns_hostnames is True
    assert vpc.assign_generated_ipv6_cidr_block is True


@pulumi.runtime.test
@mock_aws
def test_security_groups():
    """Test security group creation."""
    assert alb_security_group is not None
    assert ec2_security_group is not None


@pulumi.runtime.test
@mock_aws
def test_ec2_configuration():
    """Test EC2 instance configuration."""
    for instance in ec2_instances:
        assert instance.instance_type == INSTANCE_TYPE
        assert instance.monitoring is True


@pulumi.runtime.test
@mock_aws
def test_load_balancer_configuration():
    """Test ALB configuration."""
    assert alb.load_balancer_type == "application"
    assert alb.internal is False
    assert target_group.port == 80
    assert target_group.protocol == "HTTP"


@pulumi.runtime.test
@mock_aws
def test_iam_resources():
    """Test IAM configuration."""
    assert ec2_role is not None
    assert ec2_policy is not None
    assert ec2_instance_profile is not None


@pulumi.runtime.test
@mock_aws
def test_monitoring_resources():
    """Test CloudWatch resources."""
    assert cloudwatch_dashboard is not None
    assert unhealthy_targets_alarm is not None
    assert high_response_time_alarm is not None


@pulumi.runtime.test
@mock_aws
def test_resource_naming():
    """Test resource naming functions."""
    vpc_name = get_resource_name("vpc")
    assert PROJECT_NAME in vpc_name
    assert ENVIRONMENT in vpc_name
    assert DEPLOYMENT_ID in vpc_name
    
    short_name = get_short_name("test", 10)
    assert len(short_name) <= 10


@pulumi.runtime.test
@mock_aws
def test_ipv6_cidr_calculation():
    """Test IPv6 CIDR calculation logic."""
    test_cidr = "2600:1f18:1234:5600::/56"
    
    result1 = calculate_ipv6_cidr(test_cidr, 0)
    assert result1 == "2600:1f18:1234:5600::/64"
    
    result2 = calculate_ipv6_cidr(test_cidr, 1)
    assert result2 == "2600:1f18:1234:5601::/64"


@pulumi.runtime.test
@mock_aws  
def test_configuration_constants():
    """Test configuration values."""
    assert ENVIRONMENT == "dev"
    assert AWS_REGION == "us-east-1"
    assert INSTANCE_TYPE == "t3.micro"
    assert PROJECT_NAME == "dswa-v5"
    assert len(DEPLOYMENT_ID) == 4
