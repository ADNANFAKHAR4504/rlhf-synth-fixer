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
        """Test that stack has all required IAM roles imported"""
        assert hasattr(dms_prereq_stack, "dms_vpc_role")
        assert hasattr(dms_prereq_stack, "dms_cloudwatch_logs_role")


class TestDmsVpcRole:
    """Test DMS VPC management role"""

    def test_dms_vpc_role_created(self, dms_prereq_stack):
        """Test DMS VPC role is created with correct properties"""
        template = assertions.Template.from_stack(dms_prereq_stack)

        # Verify role exists in template
        template.has_resource_properties("AWS::IAM::Role", {
            "RoleName": "dms-vpc-role",
            "AssumeRolePolicyDocument": {
                "Statement": [
                    {
                        "Action": "sts:AssumeRole",
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "dms.us-east-1.amazonaws.com"
                        }
                    }
                ]
            }
        })

    def test_dms_vpc_role_has_managed_policy(self, dms_prereq_stack):
        """Test DMS VPC role has required managed policy"""
        template = assertions.Template.from_stack(dms_prereq_stack)

        # Verify the role has the AmazonDMSVPCManagementRole managed policy
        template.has_resource_properties("AWS::IAM::Role", {
            "ManagedPolicyArns": [
                {
                    "Fn::Join": assertions.Match.array_with([
                        assertions.Match.array_with([
                            assertions.Match.string_like_regexp(".*AmazonDMSVPCManagementRole")
                        ])
                    ])
                }
            ]
        })


class TestDmsCloudWatchLogsRole:
    """Test DMS CloudWatch Logs role"""

    def test_dms_cloudwatch_logs_role_created(self, dms_prereq_stack):
        """Test DMS CloudWatch Logs role is created with correct properties"""
        template = assertions.Template.from_stack(dms_prereq_stack)

        # Verify role exists in template
        template.has_resource_properties("AWS::IAM::Role", {
            "RoleName": "dms-cloudwatch-logs-role",
            "AssumeRolePolicyDocument": {
                "Statement": [
                    {
                        "Action": "sts:AssumeRole",
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "dms.us-east-1.amazonaws.com"
                        }
                    }
                ]
            }
        })

    def test_dms_cloudwatch_logs_role_has_managed_policy(self, dms_prereq_stack):
        """Test DMS CloudWatch Logs role has required managed policy"""
        template = assertions.Template.from_stack(dms_prereq_stack)

        # Verify the role has the AmazonDMSCloudWatchLogsRole managed policy
        template.has_resource_properties("AWS::IAM::Role", {
            "ManagedPolicyArns": [
                {
                    "Fn::Join": assertions.Match.array_with([
                        assertions.Match.array_with([
                            assertions.Match.string_like_regexp(".*AmazonDMSCloudWatchLogsRole")
                        ])
                    ])
                }
            ]
        })


class TestRoleCount:
    """Test that exactly two roles are created"""

    def test_exactly_two_roles_created(self, dms_prereq_stack):
        """Test that exactly two IAM roles are created in CloudFormation"""
        template = assertions.Template.from_stack(dms_prereq_stack)
        # Should create exactly 2 IAM roles: dms-vpc-role and dms-cloudwatch-logs-role
        template.resource_count_is("AWS::IAM::Role", 2)
