"""Unit tests for SecretsStack"""
import unittest
import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from pytest import mark

from lib.secrets_stack import SecretsStack


@mark.describe("SecretsStack")
class TestSecretsStack(unittest.TestCase):
    """Test cases for the SecretsStack"""

    def setUp(self):
        """Set up a fresh CDK app and stack for each test"""
        self.app = cdk.App()
        self.stack = cdk.Stack(self.app, "TestStack")

    @mark.it("creates secrets manager secret")
    def test_creates_secret(self):
        """Test that Secrets Manager secret is created"""
        secrets_stack = SecretsStack(
            self.stack,
            "SecretsStack",
            environment_suffix="test"
        )
        template = Template.from_stack(secrets_stack)

        template.resource_count_is("AWS::SecretsManager::Secret", 1)

    @mark.it("configures secret with correct name")
    def test_configures_secret_name(self):
        """Test that secret has correct name"""
        secrets_stack = SecretsStack(
            self.stack,
            "SecretsStack",
            environment_suffix="test"
        )
        template = Template.from_stack(secrets_stack)

        template.has_resource_properties(
            "AWS::SecretsManager::Secret",
            Match.object_like({
                "Name": "docker-credentials-test"
            })
        )

    @mark.it("configures secret with description")
    def test_configures_secret_description(self):
        """Test that secret has description"""
        secrets_stack = SecretsStack(
            self.stack,
            "SecretsStack",
            environment_suffix="test"
        )
        template = Template.from_stack(secrets_stack)

        template.has_resource_properties(
            "AWS::SecretsManager::Secret",
            Match.object_like({
                "Description": Match.string_like_regexp(".*Docker registry credentials.*")
            })
        )
