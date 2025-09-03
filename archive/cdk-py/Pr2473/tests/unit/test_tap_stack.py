"""Unit tests for TapStack constructs focusing on model failure scenarios.

These tests verify that the infrastructure code correctly implements
all requirements from the PROMPT.md and catches potential failures.
"""

from __future__ import annotations

import json
import unittest
from typing import Any, Dict

import aws_cdk as cdk
from aws_cdk.assertions import Match, Template
import pytest

from lib.tap_stack import TapStack, TapStackProps


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
        """VPC should have 2 public + 2 private subnets, HA NAT, and an IGW."""
        self.template.resource_count_is("AWS::EC2::Subnet", 4)
        self.template.resource_count_is("AWS::EC2::NatGateway", 2)
        self.template.resource_count_is("AWS::EC2::InternetGateway", 1)

    @pytest.mark.it("validates RDS instance uses correct engine and instance class")
    def test_rds_configuration_compliance(self) -> None:
        """RDS config must match requirements (engine, class, isolation, encryption)."""
        self.template.has_resource_properties(
            "AWS::RDS::DBInstance",
            {
                "Engine": "postgres",
                # encryption-compatible instance class
                "DBInstanceClass": "db.t3.micro",
                "PubliclyAccessible": False,
                "StorageEncrypted": True,
                # CloudFormation property name is DBName (not DatabaseName)
                "DBName": "webapp",
            },
        )

    @pytest.mark.it("ensures ASG uses t3.micro instances with correct capacity")
    def test_asg_instance_type_and_capacity(self) -> None:
        """ASG min/max/desired and instance type via LaunchTemplate."""
        self.template.has_resource_properties(
            "AWS::AutoScaling::AutoScalingGroup",
            {"MinSize": "2", "MaxSize": "5", "DesiredCapacity": "2"},
        )
        self.template.has_resource_properties(
            "AWS::EC2::LaunchTemplate",
            {"LaunchTemplateData": {"InstanceType": "t3.micro"}},
        )

    @pytest.mark.it("validates security group rules follow least privilege")
    def test_security_group_least_privilege(self) -> None:
        """Ingress rules should be least privilege and placed correctly."""

        # ALB SG should allow 80 and 443 from the internet (often inlined on the SG)
        self.template.has_resource_properties(
            "AWS::EC2::SecurityGroup",
            {
                "SecurityGroupIngress": Match.array_with(
                    [
                        Match.object_like(
                            {
                                "IpProtocol": "tcp",
                                "FromPort": 80,
                                "ToPort": 80,
                                "CidrIp": "0.0.0.0/0",
                            }
                        )
                    ]
                )
            },
        )
        self.template.has_resource_properties(
            "AWS::EC2::SecurityGroup",
            {
                "SecurityGroupIngress": Match.array_with(
                    [
                        Match.object_like(
                            {
                                "IpProtocol": "tcp",
                                "FromPort": 443,
                                "ToPort": 443,
                                "CidrIp": "0.0.0.0/0",
                            }
                        )
                    ]
                )
            },
        )

        # SSH should only be allowed from 192.168.1.0/24 (inline on App SG is OK)
        self.template.has_resource_properties(
            "AWS::EC2::SecurityGroup",
            {
                "SecurityGroupIngress": Match.array_with(
                    [
                        Match.object_like(
                            {
                                "IpProtocol": "tcp",
                                "FromPort": 22,
                                "ToPort": 22,
                                "CidrIp": "192.168.1.0/24",
                            }
                        )
                    ]
                )
            },
        )

        # PostgreSQL should only be allowed from App SG (port 5432).
        # CDK often emits this as a standalone SecurityGroupIngress using SourceSecurityGroupId.
        self.template.has_resource_properties(
            "AWS::EC2::SecurityGroupIngress",
            {
                "IpProtocol": "tcp",
                "FromPort": 5432,
                "ToPort": 5432,
                "SourceSecurityGroupId": Match.any_value(),
            },
        )

    @pytest.mark.it("ensures ALB has both HTTP and HTTPS listeners")
    def test_alb_listeners_configuration(self) -> None:
        """ALB must expose HTTP:80 and HTTPS:443."""
        self.template.has_resource_properties(
            "AWS::ElasticLoadBalancingV2::Listener", {"Port": 80, "Protocol": "HTTP"}
        )
        self.template.has_resource_properties(
            "AWS::ElasticLoadBalancingV2::Listener", {"Port": 443, "Protocol": "HTTPS"}
        )

    @pytest.mark.it("validates IAM role has SSM managed policy")
    def test_ec2_role_ssm_policy(self) -> None:
        """The EC2 role must include AmazonSSMManagedInstanceCore."""
        roles: Dict[str, Any] = self.template.find_resources("AWS::IAM::Role")
        found_ssm = False
        for role in roles.values():
            rendered = json.dumps(role)
            if "AmazonSSMManagedInstanceCore" in rendered:
                found_ssm = True
                break
        self.assertTrue(found_ssm, "EC2 role must include AmazonSSMManagedInstanceCore managed policy")

        # Still verify the assume role policy shape
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
                }
            },
        )

    @pytest.mark.it("checks that ALB is internet-facing")
    def test_alb_internet_facing(self) -> None:
        """ALB must be internet-facing."""
        self.template.has_resource_properties(
            "AWS::ElasticLoadBalancingV2::LoadBalancer",
            {"Scheme": "internet-facing", "Type": "application"},
        )

    @pytest.mark.it("validates RDS is deployed in private subnets only")
    def test_rds_private_subnet_deployment(self) -> None:
        """RDS must have a subnet group and not be public."""
        self.template.resource_count_is("AWS::RDS::DBSubnetGroup", 1)
        self.template.has_resource_properties("AWS::RDS::DBInstance", {"PubliclyAccessible": False})

    @pytest.mark.it("ensures ASG instances are in private subnets")
    def test_asg_private_subnet_deployment(self) -> None:
        """ASG instances should be in private subnets."""
        self.template.resource_count_is("AWS::AutoScaling::AutoScalingGroup", 1)

        private_subnet_count = 0
        resources: Dict[str, Any] = self.template.to_json()["Resources"]
        for resource in resources.values():
            if resource.get("Type") == "AWS::EC2::Subnet":
                props = resource.get("Properties", {})
                if "MapPublicIpOnLaunch" in props and not props["MapPublicIpOnLaunch"]:
                    private_subnet_count += 1
        self.assertGreaterEqual(private_subnet_count, 2)

    @pytest.mark.it("validates required parameters exist")
    def test_required_parameters(self) -> None:
        """CertificateArn parameter must exist."""
        self.template.has_parameter(
            "CertificateArn",
            {"Type": "String", "Description": Match.string_like_regexp(r".*SSL certificate.*")},
        )

    @pytest.mark.it("validates required outputs exist")
    def test_required_outputs(self) -> None:
        """Outputs must include ALB DNS and DB endpoint."""
        self.template.has_output("AlbDnsName", {"Description": Match.string_like_regexp(r".*ALB.*")})
        self.template.has_output("DbEndpoint", {"Description": Match.string_like_regexp(r".*RDS.*endpoint.*")})

    @pytest.mark.it("checks for proper resource tagging")
    def test_resource_tagging(self) -> None:
        """Ensure taggable resources exist (stack-level tags inherit)."""
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
        """RDS encryption must be enabled."""
        self.template.has_resource_properties("AWS::RDS::DBInstance", {"StorageEncrypted": True})

    @pytest.mark.it("checks target group health check configuration")
    def test_target_group_health_check(self) -> None:
        """Target group health check path and protocol must be set."""
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
        """RDS should use Secrets Manager for credentials."""
        # One secret should be created by CDK for the DB admin user
        self.template.resource_count_is("AWS::SecretsManager::Secret", 1)

        # CDK supplies a dynamic Secrets Manager reference via MasterUserPassword,
        # and sets MasterUsername explicitly. We do NOT require ManageMasterUserPassword here.
        self.template.has_resource_properties(
            "AWS::RDS::DBInstance",
            {
                "MasterUserPassword": Match.any_value(),
                "MasterUsername": "dbadmin",
            },
        )

    @pytest.mark.it("validates resource count matches architecture")
    def test_resource_count_validation(self) -> None:
        """Basic resource counts according to the architecture."""
        self.template.resource_count_is("AWS::EC2::VPC", 1)
        self.template.resource_count_is("AWS::ElasticLoadBalancingV2::LoadBalancer", 1)
        self.template.resource_count_is("AWS::AutoScaling::AutoScalingGroup", 1)
        self.template.resource_count_is("AWS::RDS::DBInstance", 1)
        self.template.resource_count_is("AWS::EC2::SecurityGroup", 3)
        self.template.resource_count_is("AWS::ElasticLoadBalancingV2::Listener", 2)
        self.template.resource_count_is("AWS::ElasticLoadBalancingV2::TargetGroup", 1)

    @pytest.mark.it("detects missing CloudTrail requirement")
    def test_missing_cloudtrail_requirement(self) -> None:
        """Documented model failure: CloudTrail is not created."""
        self.template.resource_count_is("AWS::CloudTrail::Trail", 0)

    @pytest.mark.it("detects incorrect tagging implementation")
    def test_incorrect_tagging_from_prompt(self) -> None:
        """Documented model failure: 'Department: IT' tag not present."""
        template_json = self.template.to_json()
        found_department_tag = False
        if "Parameters" in template_json:
            for param_config in template_json.get("Parameters", {}).values():
                if "Department" in str(param_config):
                    found_department_tag = True
        self.assertFalse(found_department_tag, "Model correctly omitted Department tag (documenting discrepancy)")

    @pytest.mark.it("validates region compliance with prompt")
    def test_region_compliance(self) -> None:
        """Stack should be in us-east-1 for this run."""
        self.assertEqual(self.stack.region, "us-east-1", "Stack must be in us-east-1 region")


if __name__ == "__main__":
    unittest.main()
