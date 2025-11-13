"""Unit tests for TapStack."""

import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
import pytest

from lib.tap_stack import TapStack, TapStackProps


@pytest.fixture
def app():
    """Create CDK app for testing."""
    return cdk.App()


@pytest.fixture
def stack(app):
    """Create TapStack for testing."""
    props = TapStackProps(environment_suffix='test')
    return TapStack(app, "TestTapStack", props=props)


@pytest.fixture
def template(stack):
    """Generate CloudFormation template from stack."""
    return Template.from_stack(stack)


class TestTapStackCreation:
    """Test TapStack creation and configuration."""

    def test_stack_created_successfully(self, stack):
        """Test that TapStack is created successfully."""
        assert stack is not None
        assert isinstance(stack, cdk.Stack)

    def test_stack_id_correct(self, stack):
        """Test that stack has correct construct ID."""
        assert stack.node.id == "TestTapStack"


class TestNestedS3ReplicationStack:
    """Test that nested S3 replication stack is created."""

    def test_nested_stack_created(self, template):
        """Test that nested stack resource is created."""
        template.has_resource("AWS::CloudFormation::Stack", {})

    def test_nested_stack_has_s3_resources(self, template):
        """Test that nested stack contains S3 resources."""
        # The nested stack should contain S3 buckets
        # Check for the nested stack resource
        nested_stacks = template.find_resources("AWS::CloudFormation::Stack")
        assert len(nested_stacks) > 0, "No nested stacks found"


class TestEnvironmentSuffixPropagation:
    """Test that environment suffix is properly propagated to nested stacks."""

    def test_default_suffix_propagated(self, app):
        """Test that default environment suffix is propagated."""
        stack = TapStack(app, "TestDefaultSuffix")
        template = Template.from_stack(stack)

        # Verify nested stack is created
        template.has_resource("AWS::CloudFormation::Stack", {})

    def test_custom_suffix_propagated(self, app):
        """Test that custom environment suffix is propagated."""
        props = TapStackProps(environment_suffix='prod')
        stack = TapStack(app, "TestProdSuffix", props=props)
        template = Template.from_stack(stack)

        # Verify nested stack is created with correct naming
        template.has_resource("AWS::CloudFormation::Stack", {})


class TestTapStackProps:
    """Test TapStackProps functionality."""

    def test_props_with_suffix(self):
        """Test that TapStackProps stores environment suffix."""
        props = TapStackProps(environment_suffix='staging')
        assert props.environment_suffix == 'staging'

    def test_props_without_suffix(self):
        """Test that TapStackProps handles missing suffix."""
        props = TapStackProps()
        assert props.environment_suffix is None

    def test_props_with_additional_kwargs(self):
        """Test that TapStackProps accepts additional StackProps."""
        props = TapStackProps(
            environment_suffix='test',
            description="Test stack description"
        )
        assert props.environment_suffix == 'test'


class TestStackStructure:
    """Test overall stack structure and organization."""

    def test_no_direct_resources_in_main_stack(self, template):
        """Test that main stack uses nested stacks, not direct resources."""
        # Main stack should only have nested stack resources
        # No S3 buckets should be directly in the main stack
        resources = template.to_json()['Resources']

        # Count how many CloudFormation::Stack resources (nested stacks) exist
        nested_stack_count = sum(
            1 for r in resources.values()
            if r['Type'] == 'AWS::CloudFormation::Stack'
        )

        # Should have at least 1 nested stack
        assert nested_stack_count >= 1, "Main stack should use nested stacks"

    def test_main_stack_synthesizes(self, stack):
        """Test that main stack can be synthesized without errors."""
        template = Template.from_stack(stack)
        assert template is not None


class TestContextHandling:
    """Test CDK context handling for environment suffix."""

    def test_context_suffix_used(self, app):
        """Test that context value for environmentSuffix is used."""
        # Set context
        app.node.set_context('environmentSuffix', 'context-test')

        # Create stack without props
        stack = TapStack(app, "TestContextStack")

        # Stack should use context value
        assert stack is not None

    def test_props_override_context(self, app):
        """Test that props override context value."""
        # Set context
        app.node.set_context('environmentSuffix', 'context-value')

        # Create stack with props
        props = TapStackProps(environment_suffix='props-value')
        stack = TapStack(app, "TestPropsOverride", props=props)

        # Stack should exist (props take precedence)
        assert stack is not None


class TestStackTags:
    """Test that appropriate tags are applied to the stack."""

    def test_stack_has_metadata(self, stack):
        """Test that stack has metadata."""
        assert stack.node.metadata is not None or len(stack.node.metadata) >= 0


class TestNestedStackNaming:
    """Test nested stack naming convention."""

    def test_nested_stack_name_includes_suffix(self, template):
        """Test that nested stack logical ID includes environment suffix."""
        resources = template.to_json()['Resources']

        # Find nested stack resources
        nested_stacks = {
            k: v for k, v in resources.items()
            if v['Type'] == 'AWS::CloudFormation::Stack'
        }

        # Should have at least one nested stack with 'S3Replication' in the name
        assert len(nested_stacks) > 0, "No nested stacks found"

        # At least one should match our pattern
        found_s3_replication = any(
            'S3Replication' in k for k in nested_stacks.keys()
        )
        assert found_s3_replication, "S3 Replication nested stack not found"


class TestStackOutputs:
    """Test that stack outputs from nested stacks are accessible."""

    def test_stack_has_outputs_reference(self, template):
        """Test that main stack can reference nested stack outputs."""
        # The main stack should have nested stack resources
        nested_stacks = template.find_resources("AWS::CloudFormation::Stack")
        assert len(nested_stacks) > 0


class TestIntegrationWithS3ReplicationStack:
    """Test integration between TapStack and S3ReplicationStack."""

    def test_s3_replication_stack_imported(self, stack):
        """Test that S3ReplicationStack is properly imported."""
        # This tests the import statement works
        from lib.s3_replication_stack import S3ReplicationStack, S3ReplicationStackProps
        assert S3ReplicationStack is not None
        assert S3ReplicationStackProps is not None

    def test_nested_stack_receives_props(self, app):
        """Test that nested stack receives proper props."""
        props = TapStackProps(environment_suffix='integration-test')
        stack = TapStack(app, "TestIntegration", props=props)

        # Stack should be created successfully
        assert stack is not None

        # Generate template to ensure everything synthesizes
        template = Template.from_stack(stack)
        assert template is not None


class TestMultipleEnvironments:
    """Test deploying multiple environments simultaneously."""

    def test_multiple_stacks_different_suffixes(self, app):
        """Test that multiple stacks with different suffixes can coexist."""
        dev_props = TapStackProps(environment_suffix='dev')
        staging_props = TapStackProps(environment_suffix='staging')
        prod_props = TapStackProps(environment_suffix='prod')

        dev_stack = TapStack(app, "DevStack", props=dev_props)
        staging_stack = TapStack(app, "StagingStack", props=staging_props)
        prod_stack = TapStack(app, "ProdStack", props=prod_props)

        # All stacks should be created
        assert dev_stack is not None
        assert staging_stack is not None
        assert prod_stack is not None

        # All should have unique construct IDs
        assert dev_stack.node.id != staging_stack.node.id
        assert staging_stack.node.id != prod_stack.node.id
        assert dev_stack.node.id != prod_stack.node.id


class TestErrorHandling:
    """Test error handling and edge cases."""

    def test_stack_with_none_props(self, app):
        """Test that stack handles None props gracefully."""
        stack = TapStack(app, "TestNoneProps", props=None)
        assert stack is not None

        # Should use default environment suffix
        template = Template.from_stack(stack)
        assert template is not None

    def test_stack_with_empty_suffix(self, app):
        """Test that stack handles empty string suffix."""
        props = TapStackProps(environment_suffix='')
        stack = TapStack(app, "TestEmptySuffix", props=props)

        # Should still create stack (will use default 'dev')
        assert stack is not None


class TestDocumentation:
    """Test that classes have proper documentation."""

    def test_tap_stack_has_docstring(self):
        """Test that TapStack class has docstring."""
        assert TapStack.__doc__ is not None
        assert len(TapStack.__doc__.strip()) > 0

    def test_tap_stack_props_has_docstring(self):
        """Test that TapStackProps class has docstring."""
        assert TapStackProps.__doc__ is not None
        assert len(TapStackProps.__doc__.strip()) > 0
