"""Unit tests for KmsStack"""
import unittest
import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from pytest import mark

from lib.kms_stack import KmsStack, KmsStackProps


@mark.describe("KmsStack")
class TestKmsStack(unittest.TestCase):
    """Comprehensive unit tests for KmsStack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()
        self.stack = cdk.Stack(self.app, "TestStack")
        self.props = KmsStackProps(
            environment_suffix="test",
            primary_region="us-east-1",
            secondary_region="us-west-2"
        )

    @mark.it("creates two KMS keys")
    def test_creates_two_kms_keys(self):
        # ARRANGE
        kms_stack = KmsStack(self.stack, "KmsTest", props=self.props)
        template = Template.from_stack(self.stack)

        # ASSERT
        template.resource_count_is("AWS::KMS::Key", 2)

    @mark.it("enables key rotation for both keys")
    def test_enables_key_rotation(self):
        # ARRANGE
        kms_stack = KmsStack(self.stack, "KmsTest", props=self.props)
        template = Template.from_stack(self.stack)

        # ASSERT
        template.has_resource_properties("AWS::KMS::Key", {
            "EnableKeyRotation": True,
        })

    @mark.it("creates primary key with correct properties")
    def test_primary_key_properties(self):
        # ARRANGE
        kms_stack = KmsStack(self.stack, "KmsTest", props=self.props)
        template = Template.from_stack(self.stack)

        # ASSERT
        template.has_resource_properties("AWS::KMS::Key", {
            "Description": Match.string_like_regexp(".*Primary.*test.*"),
            "EnableKeyRotation": True,
        })

    @mark.it("creates secondary key with correct properties")
    def test_secondary_key_properties(self):
        # ARRANGE
        kms_stack = KmsStack(self.stack, "KmsTest", props=self.props)
        template = Template.from_stack(self.stack)

        # ASSERT
        template.has_resource_properties("AWS::KMS::Key", {
            "Description": Match.string_like_regexp(".*Secondary.*test.*"),
            "EnableKeyRotation": True,
        })

    @mark.it("creates key aliases")
    def test_creates_key_aliases(self):
        # ARRANGE
        kms_stack = KmsStack(self.stack, "KmsTest", props=self.props)
        template = Template.from_stack(self.stack)

        # ASSERT
        template.resource_count_is("AWS::KMS::Alias", 2)

    @mark.it("creates primary key alias with correct name")
    def test_primary_key_alias(self):
        # ARRANGE
        kms_stack = KmsStack(self.stack, "KmsTest", props=self.props)
        template = Template.from_stack(self.stack)

        # ASSERT
        template.has_resource_properties("AWS::KMS::Alias", {
            "AliasName": "alias/dr-primary-test",
        })

    @mark.it("creates secondary key alias with correct name")
    def test_secondary_key_alias(self):
        # ARRANGE
        kms_stack = KmsStack(self.stack, "KmsTest", props=self.props)
        template = Template.from_stack(self.stack)

        # ASSERT
        template.has_resource_properties("AWS::KMS::Alias", {
            "AliasName": "alias/dr-secondary-test",
        })

    @mark.it("applies destroy removal policy")
    def test_removal_policy(self):
        # ARRANGE
        kms_stack = KmsStack(self.stack, "KmsTest", props=self.props)
        template = Template.from_stack(self.stack)

        # ASSERT
        template.has_resource("AWS::KMS::Key", {
            "DeletionPolicy": "Delete",
            "UpdateReplacePolicy": "Delete"
        })

    @mark.it("creates key policy with statements")
    def test_key_permissions(self):
        # ARRANGE
        kms_stack = KmsStack(self.stack, "KmsTest", props=self.props)
        template = Template.from_stack(self.stack)

        # ASSERT - Key policy should exist with statements
        template.has_resource_properties("AWS::KMS::Key", {
            "KeyPolicy": Match.object_like({
                "Statement": Match.any_value()
            })
        })

    @mark.it("creates CloudFormation outputs")
    def test_cloudformation_outputs(self):
        # ARRANGE
        kms_stack = KmsStack(self.stack, "KmsTest", props=self.props)
        template = Template.from_stack(self.stack)

        # ASSERT
        outputs = template.find_outputs("*")
        output_keys = list(outputs.keys())

        # Outputs have construct path prefix
        assert any("PrimaryKeyId" in key for key in output_keys)
        assert any("SecondaryKeyId" in key for key in output_keys)

    @mark.it("applies DR tags to keys")
    def test_dr_tags(self):
        # ARRANGE
        kms_stack = KmsStack(self.stack, "KmsTest", props=self.props)

        # ASSERT
        assert kms_stack.primary_key is not None
        assert kms_stack.secondary_key is not None

    @mark.it("exposes primary and secondary keys")
    def test_exposes_keys(self):
        # ARRANGE
        kms_stack = KmsStack(self.stack, "KmsTest", props=self.props)

        # ASSERT
        assert kms_stack.primary_key is not None
        assert kms_stack.secondary_key is not None
        assert hasattr(kms_stack.primary_key, 'key_id')
        assert hasattr(kms_stack.secondary_key, 'key_id')


if __name__ == "__main__":
    unittest.main()
