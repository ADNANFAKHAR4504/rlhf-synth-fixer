"""Unit tests for CrossAccountRolesStack"""
import unittest
import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from pytest import mark

from lib.cross_account_roles import CrossAccountRolesStack


@mark.describe("CrossAccountRolesStack")
class TestCrossAccountRolesStack(unittest.TestCase):
    """Test cases for the CrossAccountRolesStack"""

    def setUp(self):
        """Set up a fresh CDK app and stack for each test"""
        self.app = cdk.App()
        self.stack = cdk.Stack(self.app, "TestStack")

    @mark.it("creates IAM role for cross-account access")
    def test_creates_iam_role(self):
        """Test that IAM role is created"""
        roles_stack = CrossAccountRolesStack(
            self.stack,
            "CrossAccountRolesStack",
            environment_suffix="test",
            target_account_id="123456789012"
        )
        template = Template.from_stack(roles_stack)

        template.resource_count_is("AWS::IAM::Role", 1)

    @mark.it("configures role with correct name")
    def test_configures_role_name(self):
        """Test that role has correct name"""
        roles_stack = CrossAccountRolesStack(
            self.stack,
            "CrossAccountRolesStack",
            environment_suffix="test",
            target_account_id="123456789012"
        )
        template = Template.from_stack(roles_stack)

        template.has_resource_properties(
            "AWS::IAM::Role",
            Match.object_like({
                "RoleName": "cross-account-deploy-test"
            })
        )

    @mark.it("configures role with assume role policy")
    def test_configures_assume_role_policy(self):
        """Test that role has assume role policy"""
        roles_stack = CrossAccountRolesStack(
            self.stack,
            "CrossAccountRolesStack",
            environment_suffix="test",
            target_account_id="123456789012"
        )
        template = Template.from_stack(roles_stack)

        # Verify assume role policy exists
        template.has_resource_properties(
            "AWS::IAM::Role",
            Match.object_like({
                "AssumeRolePolicyDocument": Match.object_like({
                    "Statement": Match.any_value()
                })
            })
        )

    @mark.it("configures role with explicit deny policy")
    def test_configures_explicit_deny_policy(self):
        """Test that role has explicit deny policy for ec2:TerminateInstances"""
        roles_stack = CrossAccountRolesStack(
            self.stack,
            "CrossAccountRolesStack",
            environment_suffix="test",
            target_account_id="123456789012"
        )
        template = Template.from_stack(roles_stack)

        template.has_resource_properties(
            "AWS::IAM::Policy",
            Match.object_like({
                "PolicyDocument": Match.object_like({
                    "Statement": Match.array_with([
                        Match.object_like({
                            "Effect": "Deny",
                            "Action": "ec2:TerminateInstances"
                        })
                    ])
                })
            })
        )

    @mark.it("configures role with deployment permissions")
    def test_configures_deployment_permissions(self):
        """Test that role has deployment permissions"""
        roles_stack = CrossAccountRolesStack(
            self.stack,
            "CrossAccountRolesStack",
            environment_suffix="test",
            target_account_id="123456789012"
        )
        template = Template.from_stack(roles_stack)

        # Should have at least one policy with Allow effect
        template.has_resource_properties(
            "AWS::IAM::Policy",
            Match.object_like({
                "PolicyDocument": Match.object_like({
                    "Statement": Match.array_with([
                        Match.object_like({
                            "Effect": "Allow"
                        })
                    ])
                })
            })
        )
