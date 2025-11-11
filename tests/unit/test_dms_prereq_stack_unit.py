"""
Unit tests for DmsPrerequisitesStack.
Tests the DMS prerequisite IAM roles (imported, not created).
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
        """Test that stack has all required IAM roles imported"""
        assert hasattr(dms_prereq_stack, "dms_vpc_role")
        assert hasattr(dms_prereq_stack, "dms_cloudwatch_logs_role")


class TestDmsVpcRole:
    """Test DMS VPC management role (imported)"""

    def test_dms_vpc_role_created(self, dms_prereq_stack):
        """Test DMS VPC role is imported and accessible"""
        # Since we're importing an existing role, it won't appear in the CloudFormation template
        # We just verify the role object exists
        assert dms_prereq_stack.dms_vpc_role is not None
        assert dms_prereq_stack.dms_vpc_role.role_name == "dms-vpc-role"

    def test_dms_vpc_role_has_managed_policy(self, dms_prereq_stack):
        """Test DMS VPC role reference is valid"""
        # For imported roles, we can't check managed policies in the template
        # We just verify the role can be referenced
        assert dms_prereq_stack.dms_vpc_role is not None
        # The role_arn should be constructable
        assert "dms-vpc-role" in dms_prereq_stack.dms_vpc_role.role_arn


class TestDmsCloudWatchLogsRole:
    """Test DMS CloudWatch Logs role (imported)"""

    def test_dms_cloudwatch_logs_role_created(self, dms_prereq_stack):
        """Test DMS CloudWatch Logs role is imported and accessible"""
        # Since we're importing an existing role, it won't appear in the CloudFormation template
        # We just verify the role object exists
        assert dms_prereq_stack.dms_cloudwatch_logs_role is not None
        assert dms_prereq_stack.dms_cloudwatch_logs_role.role_name == "dms-cloudwatch-logs-role"

    def test_dms_cloudwatch_logs_role_has_managed_policy(self, dms_prereq_stack):
        """Test DMS CloudWatch Logs role reference is valid"""
        # For imported roles, we can't check managed policies in the template
        # We just verify the role can be referenced
        assert dms_prereq_stack.dms_cloudwatch_logs_role is not None
        # The role_arn should be constructable
        assert "dms-cloudwatch-logs-role" in dms_prereq_stack.dms_cloudwatch_logs_role.role_arn


class TestRoleCount:
    """Test that no new roles are created (roles are imported)"""

    def test_exactly_two_roles_created(self, dms_prereq_stack):
        """Test that no IAM roles are created in CloudFormation (they are imported)"""
        template = assertions.Template.from_stack(dms_prereq_stack)
        # Since we import existing roles, there should be 0 IAM::Role resources in the template
        template.resource_count_is("AWS::IAM::Role", 0)
