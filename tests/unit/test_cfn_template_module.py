"""Unit tests for CloudFormation Template Loader Module

Tests the cfn_template.py module functions to achieve 100% coverage.
"""
import json
import pytest
from pathlib import Path
from lib.cfn_template import CloudFormationTemplate


class TestCloudFormationTemplateInit:
    """Test CloudFormationTemplate initialization."""

    def test_default_template_path(self):
        """Test initialization with default path."""
        template = CloudFormationTemplate()
        assert template.template_path == Path("lib/TapStack.json")
        assert template.template_data is not None

    def test_custom_template_path(self):
        """Test initialization with custom path."""
        template = CloudFormationTemplate("lib/TapStack.json")
        assert template.template_path == Path("lib/TapStack.json")

    def test_nonexistent_template_raises_error(self):
        """Test that loading nonexistent template raises FileNotFoundError."""
        with pytest.raises(FileNotFoundError, match="Template file not found"):
            CloudFormationTemplate("nonexistent/template.json")


class TestTemplateGetters:
    """Test template getter methods."""

    @pytest.fixture
    def template(self):
        """Fixture for CloudFormation template."""
        return CloudFormationTemplate("lib/TapStack.json")

    def test_get_template(self, template):
        """Test getting full template data."""
        data = template.get_template()
        assert isinstance(data, dict)
        assert 'Resources' in data

    def test_get_resources(self, template):
        """Test getting all resources."""
        resources = template.get_resources()
        assert isinstance(resources, dict)
        assert len(resources) > 0

    def test_get_resource_existing(self, template):
        """Test getting an existing resource."""
        resource = template.get_resource('ApplicationLogGroup')
        assert resource is not None
        assert 'Type' in resource

    def test_get_resource_nonexistent(self, template):
        """Test getting a nonexistent resource returns None."""
        resource = template.get_resource('NonExistentResource')
        assert resource is None

    def test_get_resource_type_existing(self, template):
        """Test getting resource type for existing resource."""
        resource_type = template.get_resource_type('ApplicationLogGroup')
        assert resource_type == 'AWS::Logs::LogGroup'

    def test_get_resource_type_nonexistent(self, template):
        """Test getting resource type for nonexistent resource returns None."""
        resource_type = template.get_resource_type('NonExistentResource')
        assert resource_type is None

    def test_get_resource_properties_existing(self, template):
        """Test getting properties for existing resource."""
        properties = template.get_resource_properties('ApplicationLogGroup')
        assert isinstance(properties, dict)
        assert 'RetentionInDays' in properties

    def test_get_resource_properties_nonexistent(self, template):
        """Test getting properties for nonexistent resource returns empty dict."""
        properties = template.get_resource_properties('NonExistentResource')
        assert properties == {}

    def test_get_resources_by_type(self, template):
        """Test getting resources by type."""
        log_groups = template.get_resources_by_type('AWS::Logs::LogGroup')
        assert len(log_groups) >= 2
        for logical_id, resource in log_groups.items():
            assert resource['Type'] == 'AWS::Logs::LogGroup'

    def test_get_resources_by_type_no_match(self, template):
        """Test getting resources by nonexistent type."""
        resources = template.get_resources_by_type('AWS::NonExistent::Type')
        assert resources == {}

    def test_get_parameters(self, template):
        """Test getting all parameters."""
        parameters = template.get_parameters()
        assert isinstance(parameters, dict)
        assert 'environmentSuffix' in parameters

    def test_get_parameter_existing(self, template):
        """Test getting an existing parameter."""
        param = template.get_parameter('environmentSuffix')
        assert param is not None
        assert 'Type' in param

    def test_get_parameter_nonexistent(self, template):
        """Test getting a nonexistent parameter returns None."""
        param = template.get_parameter('NonExistentParameter')
        assert param is None

    def test_get_outputs(self, template):
        """Test getting all outputs."""
        outputs = template.get_outputs()
        assert isinstance(outputs, dict)
        assert len(outputs) > 0

    def test_get_output_existing(self, template):
        """Test getting an existing output."""
        output = template.get_output('ApplicationLogGroupName')
        assert output is not None
        assert 'Value' in output

    def test_get_output_nonexistent(self, template):
        """Test getting a nonexistent output returns None."""
        output = template.get_output('NonExistentOutput')
        assert output is None


class TestTemplateValidation:
    """Test template validation methods."""

    @pytest.fixture
    def template(self):
        """Fixture for CloudFormation template."""
        return CloudFormationTemplate("lib/TapStack.json")

    def test_validate_structure_success(self, template):
        """Test that valid template passes structure validation."""
        errors = template.validate_structure()
        assert len(errors) == 0

    def test_count_resources_by_type(self, template):
        """Test counting resources by type."""
        counts = template.count_resources_by_type()
        assert isinstance(counts, dict)
        assert counts['AWS::Logs::LogGroup'] >= 2
        assert counts['AWS::CloudWatch::Alarm'] == 5

    def test_has_environment_suffix_string(self, template):
        """Test environment suffix detection in string."""
        assert template.has_environment_suffix("test-${environmentSuffix}")
        assert template.has_environment_suffix("test-${EnvironmentSuffix}")
        assert not template.has_environment_suffix("test-production")

    def test_has_environment_suffix_fn_sub_string(self, template):
        """Test environment suffix detection in Fn::Sub with string."""
        fn_sub = {"Fn::Sub": "test-${environmentSuffix}"}
        assert template.has_environment_suffix(fn_sub)

        fn_sub = {"Fn::Sub": "test-${EnvironmentSuffix}"}
        assert template.has_environment_suffix(fn_sub)

        fn_sub = {"Fn::Sub": "test-production"}
        assert not template.has_environment_suffix(fn_sub)

    def test_has_environment_suffix_fn_sub_list(self, template):
        """Test environment suffix detection in Fn::Sub with list."""
        fn_sub = {"Fn::Sub": ["test-${environmentSuffix}", {}]}
        assert template.has_environment_suffix(fn_sub)

        fn_sub = {"Fn::Sub": ["test-production", {}]}
        assert not template.has_environment_suffix(fn_sub)

        # Test empty list
        fn_sub = {"Fn::Sub": []}
        assert not template.has_environment_suffix(fn_sub)

    def test_has_environment_suffix_other_types(self, template):
        """Test environment suffix detection with other types."""
        assert not template.has_environment_suffix(None)
        assert not template.has_environment_suffix(123)
        assert not template.has_environment_suffix([])
        assert not template.has_environment_suffix({"OtherKey": "value"})

    def test_get_resource_tags_list_format(self, template):
        """Test getting tags in list format."""
        tags = template.get_resource_tags('ApplicationLogGroup')
        assert isinstance(tags, list)
        assert len(tags) > 0
        assert all(isinstance(tag, dict) for tag in tags)
        assert all('Key' in tag and 'Value' in tag for tag in tags)

    def test_get_resource_tags_dict_format(self, template):
        """Test getting tags in dict format (SSM Parameter)."""
        tags = template.get_resource_tags('CPUThresholdParameter')
        assert isinstance(tags, list)
        # Convert to list of dicts format
        assert all(isinstance(tag, dict) for tag in tags)
        assert all('Key' in tag and 'Value' in tag for tag in tags)

    def test_get_resource_tags_no_tags(self, template):
        """Test getting tags for resource with no tags."""
        tags = template.get_resource_tags('AlarmEmailSubscription')
        assert tags == []

    def test_get_resource_tags_nonexistent_resource(self, template):
        """Test getting tags for nonexistent resource."""
        tags = template.get_resource_tags('NonExistentResource')
        assert tags == []

    def test_validate_required_tags_all_present(self, template):
        """Test validating required tags when all are present."""
        # Most resources have Environment and Team tags
        missing = template.validate_required_tags(['Environment'])
        # Filter non-taggable resources
        non_taggable = {'AWS::SNS::Subscription', 'AWS::CloudWatch::Dashboard'}
        filtered = {k: v for k, v in missing.items()
                   if template.get_resource_type(k) not in non_taggable}
        assert len(filtered) == 0

    def test_validate_required_tags_some_missing(self, template):
        """Test validating required tags when some are missing."""
        # Check for a tag that doesn't exist
        missing = template.validate_required_tags(['NonExistentTag'])
        assert len(missing) > 0


class TestTemplateValidationErrors:
    """Test template validation with invalid templates."""

    def test_validate_structure_missing_format_version(self):
        """Test validation catches missing AWSTemplateFormatVersion."""
        # Create temporary invalid template
        invalid_template_path = "lib/test_invalid_template.json"
        invalid_data = {"Resources": {"Test": {"Type": "AWS::S3::Bucket"}}}

        with open(invalid_template_path, 'w') as f:
            json.dump(invalid_data, f)

        try:
            template = CloudFormationTemplate(invalid_template_path)
            errors = template.validate_structure()
            assert len(errors) > 0
            assert any("AWSTemplateFormatVersion" in err for err in errors)
        finally:
            # Cleanup
            Path(invalid_template_path).unlink(missing_ok=True)

    def test_validate_structure_missing_resources(self):
        """Test validation catches missing Resources section."""
        invalid_template_path = "lib/test_invalid_template2.json"
        invalid_data = {"AWSTemplateFormatVersion": "2010-09-09"}

        with open(invalid_template_path, 'w') as f:
            json.dump(invalid_data, f)

        try:
            template = CloudFormationTemplate(invalid_template_path)
            errors = template.validate_structure()
            assert len(errors) > 0
            assert any("Resources" in err for err in errors)
        finally:
            Path(invalid_template_path).unlink(missing_ok=True)

    def test_validate_structure_empty_resources(self):
        """Test validation catches empty Resources section."""
        invalid_template_path = "lib/test_invalid_template3.json"
        invalid_data = {
            "AWSTemplateFormatVersion": "2010-09-09",
            "Resources": {}
        }

        with open(invalid_template_path, 'w') as f:
            json.dump(invalid_data, f)

        try:
            template = CloudFormationTemplate(invalid_template_path)
            errors = template.validate_structure()
            assert len(errors) > 0
            assert any("empty" in err.lower() for err in errors)
        finally:
            Path(invalid_template_path).unlink(missing_ok=True)

    def test_validate_structure_resource_missing_type(self):
        """Test validation catches resource missing Type."""
        invalid_template_path = "lib/test_invalid_template4.json"
        invalid_data = {
            "AWSTemplateFormatVersion": "2010-09-09",
            "Resources": {
                "TestResource": {
                    "Properties": {}
                }
            }
        }

        with open(invalid_template_path, 'w') as f:
            json.dump(invalid_data, f)

        try:
            template = CloudFormationTemplate(invalid_template_path)
            errors = template.validate_structure()
            assert len(errors) > 0
            assert any("TestResource" in err and "Type" in err for err in errors)
        finally:
            Path(invalid_template_path).unlink(missing_ok=True)


class TestEdgeCases:
    """Test edge cases and boundary conditions."""

    @pytest.fixture
    def template(self):
        """Fixture for CloudFormation template."""
        return CloudFormationTemplate("lib/TapStack.json")

    def test_get_resource_with_no_properties(self, template):
        """Test getting properties for resource that might not have Properties key."""
        # This tests the else branch in get_resource_properties
        resource = template.get_resource('NonExistent')
        assert resource is None
        properties = template.get_resource_properties('NonExistent')
        assert properties == {}

    def test_count_resources_unknown_type(self, template):
        """Test counting includes unknown types."""
        counts = template.count_resources_by_type()
        # All resources should have a known type
        assert 'Unknown' not in counts

    def test_resource_tags_with_invalid_structure(self, template):
        """Test get_resource_tags with invalid tag structure."""
        # Create a temporary invalid template to test edge case
        invalid_template_path = "lib/test_tags_invalid.json"
        invalid_data = {
            "AWSTemplateFormatVersion": "2010-09-09",
            "Resources": {
                "TestResource": {
                    "Type": "AWS::S3::Bucket",
                    "Properties": {
                        "Tags": "invalid_string_instead_of_list_or_dict"
                    }
                }
            }
        }

        with open(invalid_template_path, 'w') as f:
            json.dump(invalid_data, f)

        try:
            template_invalid = CloudFormationTemplate(invalid_template_path)
            tags = template_invalid.get_resource_tags('TestResource')
            # Should return empty list for invalid tag format
            assert tags == []
        finally:
            Path(invalid_template_path).unlink(missing_ok=True)
