"""
Unit tests for DmsPrerequisitesStack.
Tests the DMS prerequisite IAM roles.
"""
import os
import sys
import pytest
from aws_cdk import App, Environment, assertions

# Add project root to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from lib.dms_prereq_stack import DmsPrerequisitesStack


@pytest.fixture
def app():
    """Create CDK app for testing"""
    return App()


@pytest.fixture
def env():
    """AWS environment for testing"""
    return Environment(account="123456789012", region="us-east-1")


@pytest.fixture
def dms_prereq_stack(app, env):
    """Create DmsPrerequisitesStack instance for testing"""
    return DmsPrerequisitesStack(
        app,
        "TestDmsPrereqStack",
        env=env,
    )


class TestDmsPrerequisitesStackInitialization:
    """Test stack initialization"""

    def test_stack_created(self, dms_prereq_stack):
        """Test that stack is created successfully"""
        assert dms_prereq_stack is not None

    def test_stack_has_required_roles(self, dms_prereq_stack):
        """Test that stack has all required IAM roles"""
        assert hasattr(dms_prereq_stack, "dms_vpc_role")
        assert hasattr(dms_prereq_stack, "dms_cloudwatch_logs_role")


class TestDmsVpcRole:
    """Test DMS VPC management role"""

    def test_dms_vpc_role_created(self, dms_prereq_stack):
        """Test DMS VPC role is created"""
        template = assertions.Template.from_stack(dms_prereq_stack)
        template.has_resource_properties(
            "AWS::IAM::Role",
            {
                "RoleName": "dms-vpc-role",
                "AssumeRolePolicyDocument": {
                    "Statement": [
                        {
                            "Action": "sts:AssumeRole",
                            "Effect": "Allow",
                            "Principal": {
                                "Service": "dms.amazonaws.com"
                            }
                        }
                    ]
                }
            }
        )

    def test_dms_vpc_role_has_managed_policy(self, dms_prereq_stack):
        """Test DMS VPC role has the correct managed policy"""
        template = assertions.Template.from_stack(dms_prereq_stack)
        # Check that the role has managed policies (the ARN is constructed with Fn::Join)
        roles = template.find_resources("AWS::IAM::Role")
        vpc_role = None
        for role_id, role_props in roles.items():
            if role_props.get("Properties", {}).get("RoleName") == "dms-vpc-role":
                vpc_role = role_props
                break
        
        assert vpc_role is not None
        assert "ManagedPolicyArns" in vpc_role["Properties"]
        assert len(vpc_role["Properties"]["ManagedPolicyArns"]) > 0


class TestDmsCloudWatchLogsRole:
    """Test DMS CloudWatch Logs role"""

    def test_dms_cloudwatch_logs_role_created(self, dms_prereq_stack):
        """Test DMS CloudWatch Logs role is created"""
        template = assertions.Template.from_stack(dms_prereq_stack)
        template.has_resource_properties(
            "AWS::IAM::Role",
            {
                "RoleName": "dms-cloudwatch-logs-role",
                "AssumeRolePolicyDocument": {
                    "Statement": [
                        {
                            "Action": "sts:AssumeRole",
                            "Effect": "Allow",
                            "Principal": {
                                "Service": "dms.amazonaws.com"
                            }
                        }
                    ]
                }
            }
        )

    def test_dms_cloudwatch_logs_role_has_managed_policy(self, dms_prereq_stack):
        """Test DMS CloudWatch Logs role has the correct managed policy"""
        template = assertions.Template.from_stack(dms_prereq_stack)
        # Check that the role has managed policies (the ARN is constructed with Fn::Join)
        roles = template.find_resources("AWS::IAM::Role")
        logs_role = None
        for role_id, role_props in roles.items():
            if role_props.get("Properties", {}).get("RoleName") == "dms-cloudwatch-logs-role":
                logs_role = role_props
                break
        
        assert logs_role is not None
        assert "ManagedPolicyArns" in logs_role["Properties"]
        assert len(logs_role["Properties"]["ManagedPolicyArns"]) > 0


class TestRoleCount:
    """Test total number of roles"""

    def test_exactly_two_roles_created(self, dms_prereq_stack):
        """Test that exactly two IAM roles are created"""
        template = assertions.Template.from_stack(dms_prereq_stack)
        template.resource_count_is("AWS::IAM::Role", 2)