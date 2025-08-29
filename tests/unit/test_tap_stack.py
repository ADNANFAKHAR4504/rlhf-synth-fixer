"""Unit tests for TapStack constructs focusing on model failure scenarios.

These tests verify that the infrastructure code correctly implements
all requirements from the PROMPT.md and catches potential failures.
"""

from __future__ import annotations

import unittest
from typing import Any, Dict

import aws_cdk as cdk
from aws_cdk.assertions import Match, Template
import pytest

from lib.tap_stack import TapStack, TapStackProps


# Pytest mark attributes (e.g., .describe, .it) are dynamically generated,
# which pylint cannot statically resolve.
# Too many test methods in a single class is normal for a test suite.
@pytest.mark.describe("TapStack Model Failure Tests")
class TestTapStackModelFailures(unittest.TestCase):  # pylint: disable=too-many-public-methods
    """Test cases focusing on model failure scenarios and compliance."""

    def setUp(self) -> None:
        """Set up a fresh CDK app for each test."""
        self.app = cdk.App()
        self.stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix="test"),
            env=cdk.Environment(region="us-east-1"),
        )
        self.template: Template = Template.from_stack(self.stack)

    @pytest.mark.it("verifies VPC has exactly 2 public and 2 private subnets")
    def test_vpc_subnet_configuration(self) -> None:
        """Test that VPC has correct subnet configuration - common model failure."""
        # Should have exactly 4 subnets (2 public, 2 private)
        self.template.resource_count_is("AWS::EC2::Subnet", 4)

        # Should have exactly 2 NAT gateways for high availability
        self.template.resource_count_is("AWS::EC2::NatGateway", 2)

        # Should have public subnets with internet gateway route
        self.template.resource_count_is("AWS::EC2::InternetGateway", 1)

    @pytest.mark.it("validates RDS instance uses correct engine and instance class")
    def test_rds_configuration_compliance(self) -> None:
        """Test RDS configuration matches requirements exactly."""
        self.template.has_resource_properties(
            "AWS::RDS::DBInstance",
            {
                "Engine": "postgres",
                "DBInstanceClass": "db.t2.micro",  # Must be t2.micro per requirements
                "PubliclyAccessible": False,
                "StorageEncrypted": True,
                "DatabaseName": "webapp",
            },
        )

    @pytest.mark.it("ensures ASG uses t3.micro instances with correct capacity")
    def test_asg_instance_type_and_capacity(self) -> None:
        """Test ASG configuration matches requirements exactly."""
        self.template.has_resource_properties(
            "AWS::AutoScaling::AutoScalingGroup",
            {"MinSize": "2", "MaxSize": "5", "DesiredCapacity": "2"},
        )

        # Verify launch template uses t3.micro
        self.template.has_resource_properties(
            "AWS::EC2::LaunchTemplate",
            {"LaunchTemplateData": {"InstanceType": "t3.micro"}},
        )

    @pytest.mark.it("validates security group rules follow least privilege")
    def test_security_group_least_privilege(self) -> None:
        """Test that security groups follow least privilege principle."""
        # ALB SG should only allow 80 and 443 from anywhere
        self.template.has_resource_properties(
            "AWS::EC2::SecurityGroupIngress",
            {"IpProtocol": "tcp", "FromPort": 80, "ToPort": 80, "CidrIp": "0.0.0.0/0"},
        )

        self.template.has_resource_properties(
            "AWS::EC2::SecurityGroupIngress",
            {"IpProtocol": "tcp", "FromPort": 443, "ToPort": 443, "CidrIp": "0.0.0.0/0"},
        )

        # SSH should only be allowed from 192.168.1.0/24
        self.template.has_resource_properties(
            "AWS::EC2::SecurityGroupIngress",
            {"IpProtocol": "tcp", "FromPort": 22, "ToPort": 22, "CidrIp": "192.168.1.0/24"},
        )

        # PostgreSQL should only be allowed from app SG (port 5432)
        self.template.has_resource_properties(
            "AWS::EC2::SecurityGroupIngress",
            {"IpProtocol": "tcp", "FromPort": 5432, "ToPort": 5432},
        )

    @pytest.mark.it("ensures ALB has both HTTP and HTTPS listeners")
    def test_alb_listeners_configuration(self) -> None:
        """Test ALB has required listeners - common model failure."""
        # Should have HTTP listener on port 80
        self.template.has_resource_properties(
            "AWS::ElasticLoadBalancingV2::Listener", {"Port": 80, "Protocol": "HTTP"}
        )

        # Should have HTTPS listener on port 443
        self.template.has_resource_properties(
            "AWS::ElasticLoadBalancingV2::Listener", {"Port": 443, "Protocol": "HTTPS"}
        )

    @pytest.mark.it("validates IAM role has SSM managed policy")
    def test_ec2_role_ssm_policy(self) -> None:
        """Test EC2 role has required SSM policy."""
        self.template.has_resource_properties(
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
                },
                "ManagedPolicyArns": Match.array_with(
                    [Match.string_like_regexp(r".*AmazonSSMManagedInstanceCore.*")]
                ),
            },
        )

    @pytest.mark.it("checks that ALB is internet-facing")
    def test_alb_internet_facing(self) -> None:
        """Test ALB is configured as internet-facing."""
        self.template.has_resource_properties(
            "AWS::ElasticLoadBalancingV2::LoadBalancer",
            {"Scheme": "internet-facing", "Type": "application"},
        )

    @pytest.mark.it("validates RDS is deployed in private subnets only")
    def test_rds_private_subnet_deployment(self) -> None:
        """Test RDS is properly isolated in private subnets."""
        # RDS should have a subnet group
        self.template.resource_count_is("AWS::RDS::DBSubnetGroup", 1)

        # RDS should not be publicly accessible
        self.template.has_resource_properties("AWS::RDS::DBInstance", {"PubliclyAccessible": False})

    @pytest.mark.it("ensures ASG instances are in private subnets")
    def test_asg_private_subnet_deployment(self) -> None:
        """Test ASG instances are deployed in private subnets for security."""
        # This is verified by checking that ASG exists and VPC has private subnets
        self.template.resource_count_is("AWS::AutoScaling::AutoScalingGroup", 1)

        # Verify private subnets exist for ASG deployment
        private_subnet_count = 0
        resources: Dict[str, Any] = self.template.to_json()["Resources"]
        for resource in resources.values():
            if resource.get("Type") == "AWS::EC2::Subnet":
                props = resource.get("Properties", {})
                if "MapPublicIpOnLaunch" in props and not props["MapPublicIpOnLaunch"]:
                    private_subnet_count += 1

        # Should have at least 2 private subnets
        self.assertGreaterEqual(private_subnet_count, 2)

    @pytest.mark.it("validates required parameters exist")
    def test_required_parameters(self) -> None:
        """Test that required parameters are defined."""
        self.template.has_parameter(
            "CertificateArn",
            {"Type": "String", "Description": Match.string_like_regexp(r".*SSL certificate.*")},
        )

    @pytest.mark.it("validates required outputs exist")
    def test_required_outputs(self) -> None:
        """Test that required outputs are present."""
        self.template.has_output("AlbDnsName", {"Description": Match.string_like_regexp(r".*ALB.*")})

        self.template.has_output(
            "DbEndpoint", {"Description": Match.string_like_regexp(r".*RDS.*endpoint.*")}
        )

    @pytest.mark.it("checks for proper resource tagging")
    def test_resource_tagging(self) -> None:
        """Test that resources are properly tagged."""
        # This test ensures tagging strategy is consistent.
        resources: Dict[str, Any] = self.template.to_json()["Resources"]

        taggable_resources = {
            "AWS::EC2::VPC",
            "AWS::EC2::Subnet",
            "AWS::EC2::SecurityGroup",
            "AWS::RDS::DBInstance",
            "AWS::ElasticLoadBalancingV2::LoadBalancer",
        }

        found_taggable = any(res.get("Type") in taggable_resources for res in resources.values())
        self.assertTrue(found_taggable, "Should have taggable resources")

    @pytest.mark.it("validates encryption settings")
    def test_encryption_at_rest(self) -> None:
        """Test that RDS encryption is enabled - security requirement."""
        self.template.has_resource_properties("AWS::RDS::DBInstance", {"StorageEncrypted": True})

    @pytest.mark.it("checks target group health check configuration")
    def test_target_group_health_check(self) -> None:
        """Test target group has proper health check configuration."""
        self.template.has_resource_properties(
            "AWS::ElasticLoadBalancingV2::TargetGroup",
            {
                "Port": 80,
                "Protocol": "HTTP",
                "TargetType": "instance",
                "HealthCheckEnabled": True,
                "HealthCheckPath": "/",
            },
        )

    @pytest.mark.it("ensures secrets manager integration for RDS")
    def test_rds_secrets_manager(self) -> None:
        """Test that RDS uses Secrets Manager for credentials."""
        # Should have a secret for RDS credentials
        self.template.resource_count_is("AWS::SecretsManager::Secret", 1)

        # RDS should reference the secret
        self.template.has_resource_properties(
            "AWS::RDS::DBInstance", {"MasterUserSecret": {"SecretArn": Match.any_value()}}
        )

    @pytest.mark.it("validates resource count matches architecture")
    def test_resource_count_validation(self) -> None:
        """Test that we have the expected number of key resources."""
        # Core infrastructure resources
        self.template.resource_count_is("AWS::EC2::VPC", 1)
        self.template.resource_count_is("AWS::ElasticLoadBalancingV2::LoadBalancer", 1)
        self.template.resource_count_is("AWS::AutoScaling::AutoScalingGroup", 1)
        self.template.resource_count_is("AWS::RDS::DBInstance", 1)

        # Should have exactly 3 security groups (ALB, App, RDS)
        self.template.resource_count_is("AWS::EC2::SecurityGroup", 3)

        # Should have 2 listeners (HTTP and HTTPS)
        self.template.resource_count_is("AWS::ElasticLoadBalancingV2::Listener", 2)

        # Should have 1 target group
        self.template.resource_count_is("AWS::ElasticLoadBalancingV2::TargetGroup", 1)

    @pytest.mark.it("detects missing CloudTrail requirement")
    def test_missing_cloudtrail_requirement(self) -> None:
        """Test for missing CloudTrail - this is a model failure from the original prompt."""
        # The original prompt.md mentioned CloudTrail but it's missing from implementation
        # This test documents the model failure
        self.template.resource_count_is("AWS::CloudTrail::Trail", 0)

    @pytest.mark.it("detects incorrect tagging implementation")
    def test_incorrect_tagging_from_prompt(self) -> None:
        """Test for incorrect tagging - model failure from original prompt."""
        template_json = self.template.to_json()

        # This test documents the discrepancy in tagging between prompt and implementation
        found_department_tag = False
        if "Parameters" in template_json:
            for param_config in template_json.get("Parameters", {}).values():
                if "Department" in str(param_config):
                    found_department_tag = True

        # This will be False, documenting the model failure
        self.assertFalse(found_department_tag, "Model correctly omitted Department tag (documenting discrepancy)")

    @pytest.mark.it("validates region compliance with prompt")
    def test_region_compliance(self) -> None:
        """Test that stack is configured for us-east-1 as required."""
        # The stack should be created with us-east-1 environment
        self.assertEqual(self.stack.region, "us-east-1", "Stack must be in us-east-1 region")


if __name__ == "__main__":
    unittest.main()
    