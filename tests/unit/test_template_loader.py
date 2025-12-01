"""
Unit tests for template_loader module.

Tests cover all functionality of TemplateLoader and TemplateValidator classes.
"""

import json
import os
import pytest
import tempfile
from lib.template_loader import (
    TemplateLoader,
    TemplateValidator,
    load_template,
    validate_template,
)


@pytest.fixture
def template_path():
    """Path to the actual CloudFormation template."""
    return os.path.join(os.path.dirname(__file__), "../../lib/template.json")


@pytest.fixture
def template_loader(template_path):
    """TemplateLoader instance."""
    return TemplateLoader(template_path)


@pytest.fixture
def template_validator(template_loader):
    """TemplateValidator instance."""
    return TemplateValidator(template_loader)


@pytest.fixture
def sample_template():
    """Sample CloudFormation template for testing."""
    return {
        "AWSTemplateFormatVersion": "2010-09-09",
        "Description": "Test template",
        "Parameters": {
            "EnvironmentSuffix": {"Type": "String", "Default": "test"},
            "TestParam": {"Type": "String"},
        },
        "Resources": {
            "TestBucket": {
                "Type": "AWS::S3::Bucket",
                "DeletionPolicy": "Delete",
                "Properties": {"BucketName": "test-bucket-${EnvironmentSuffix}"},
            },
            "TestRole": {
                "Type": "AWS::IAM::Role",
                "Properties": {"RoleName": "test-role"},
            },
        },
        "Outputs": {"BucketName": {"Value": {"Ref": "TestBucket"}}},
    }


@pytest.fixture
def temp_template_file(sample_template):
    """Create a temporary template file for testing."""
    with tempfile.NamedTemporaryFile(
        mode="w", suffix=".json", delete=False
    ) as f:
        json.dump(sample_template, f)
        temp_path = f.name

    yield temp_path

    # Cleanup
    if os.path.exists(temp_path):
        os.unlink(temp_path)


class TestTemplateLoader:
    """Test TemplateLoader class."""

    def test_init(self, template_path):
        """Test TemplateLoader initialization."""
        loader = TemplateLoader(template_path)
        assert loader.template_path == template_path
        assert loader._template is None

    def test_load_success(self, temp_template_file):
        """Test successful template loading."""
        loader = TemplateLoader(temp_template_file)
        template = loader.load()

        assert template is not None
        assert "AWSTemplateFormatVersion" in template
        assert template["AWSTemplateFormatVersion"] == "2010-09-09"

    def test_load_file_not_found(self):
        """Test loading non-existent template file."""
        loader = TemplateLoader("/nonexistent/path/template.json")
        with pytest.raises(FileNotFoundError):
            loader.load()

    def test_load_invalid_json(self):
        """Test loading invalid JSON file."""
        with tempfile.NamedTemporaryFile(
            mode="w", suffix=".json", delete=False
        ) as f:
            f.write("{ invalid json content")
            temp_path = f.name

        try:
            loader = TemplateLoader(temp_path)
            with pytest.raises(json.JSONDecodeError):
                loader.load()
        finally:
            os.unlink(temp_path)

    def test_template_property(self, temp_template_file):
        """Test template property lazy loading."""
        loader = TemplateLoader(temp_template_file)
        assert loader._template is None

        # First access loads the template
        template = loader.template
        assert template is not None
        assert loader._template is not None

        # Second access returns cached template
        template2 = loader.template
        assert template2 is template

    def test_get_resources(self, temp_template_file):
        """Test getting resources from template."""
        loader = TemplateLoader(temp_template_file)
        resources = loader.get_resources()

        assert "TestBucket" in resources
        assert "TestRole" in resources
        assert resources["TestBucket"]["Type"] == "AWS::S3::Bucket"

    def test_get_parameters(self, temp_template_file):
        """Test getting parameters from template."""
        loader = TemplateLoader(temp_template_file)
        parameters = loader.get_parameters()

        assert "EnvironmentSuffix" in parameters
        assert "TestParam" in parameters
        assert parameters["EnvironmentSuffix"]["Type"] == "String"

    def test_get_outputs(self, temp_template_file):
        """Test getting outputs from template."""
        loader = TemplateLoader(temp_template_file)
        outputs = loader.get_outputs()

        assert "BucketName" in outputs
        assert "Value" in outputs["BucketName"]

    def test_get_resource_by_type(self, temp_template_file):
        """Test getting resources by type."""
        loader = TemplateLoader(temp_template_file)
        buckets = loader.get_resource_by_type("AWS::S3::Bucket")

        assert len(buckets) == 1
        assert "TestBucket" in buckets

        roles = loader.get_resource_by_type("AWS::IAM::Role")
        assert len(roles) == 1
        assert "TestRole" in roles

    def test_get_resource_by_type_empty(self, temp_template_file):
        """Test getting resources by type when none exist."""
        loader = TemplateLoader(temp_template_file)
        lambdas = loader.get_resource_by_type("AWS::Lambda::Function")

        assert len(lambdas) == 0

    def test_get_resource_names_by_type(self, temp_template_file):
        """Test getting resource names by type."""
        loader = TemplateLoader(temp_template_file)
        bucket_names = loader.get_resource_names_by_type("AWS::S3::Bucket")

        assert bucket_names == ["TestBucket"]

    def test_has_resource(self, temp_template_file):
        """Test checking if resource exists."""
        loader = TemplateLoader(temp_template_file)

        assert loader.has_resource("TestBucket") is True
        assert loader.has_resource("TestRole") is True
        assert loader.has_resource("NonExistentResource") is False

    def test_get_resource_exists(self, temp_template_file):
        """Test getting existing resource."""
        loader = TemplateLoader(temp_template_file)
        resource = loader.get_resource("TestBucket")

        assert resource is not None
        assert resource["Type"] == "AWS::S3::Bucket"
        assert "Properties" in resource

    def test_get_resource_not_found(self, temp_template_file):
        """Test getting non-existent resource."""
        loader = TemplateLoader(temp_template_file)
        resource = loader.get_resource("NonExistentResource")

        assert resource is None

    def test_actual_template_load(self, template_loader):
        """Test loading actual CloudFormation template."""
        template = template_loader.load()

        assert template is not None
        assert "Resources" in template
        assert len(template["Resources"]) > 0


class TestTemplateValidator:
    """Test TemplateValidator class."""

    def test_init(self, template_loader):
        """Test TemplateValidator initialization."""
        validator = TemplateValidator(template_loader)
        assert validator.loader is template_loader

    def test_validate_required_parameters_success(self, temp_template_file):
        """Test validating required parameters when all exist."""
        loader = TemplateLoader(temp_template_file)
        validator = TemplateValidator(loader)

        result = validator.validate_required_parameters(
            ["EnvironmentSuffix", "TestParam"]
        )
        assert result is True

    def test_validate_required_parameters_missing(self, temp_template_file):
        """Test validating required parameters when some are missing."""
        loader = TemplateLoader(temp_template_file)
        validator = TemplateValidator(loader)

        with pytest.raises(ValueError) as exc_info:
            validator.validate_required_parameters(
                ["EnvironmentSuffix", "NonExistentParam"]
            )

        assert "Missing required parameters" in str(exc_info.value)
        assert "NonExistentParam" in str(exc_info.value)

    def test_validate_required_resources_success(self, temp_template_file):
        """Test validating required resources when all exist."""
        loader = TemplateLoader(temp_template_file)
        validator = TemplateValidator(loader)

        result = validator.validate_required_resources(["TestBucket", "TestRole"])
        assert result is True

    def test_validate_required_resources_missing(self, temp_template_file):
        """Test validating required resources when some are missing."""
        loader = TemplateLoader(temp_template_file)
        validator = TemplateValidator(loader)

        with pytest.raises(ValueError) as exc_info:
            validator.validate_required_resources(["TestBucket", "NonExistentResource"])

        assert "Missing required resources" in str(exc_info.value)
        assert "NonExistentResource" in str(exc_info.value)

    def test_validate_resource_properties_success(self, temp_template_file):
        """Test validating resource properties when all exist."""
        loader = TemplateLoader(temp_template_file)
        validator = TemplateValidator(loader)

        result = validator.validate_resource_properties("TestBucket", ["BucketName"])
        assert result is True

    def test_validate_resource_properties_missing_resource(self, temp_template_file):
        """Test validating properties of non-existent resource."""
        loader = TemplateLoader(temp_template_file)
        validator = TemplateValidator(loader)

        with pytest.raises(ValueError) as exc_info:
            validator.validate_resource_properties(
                "NonExistentResource", ["SomeProperty"]
            )

        assert "Resource" in str(exc_info.value)
        assert "not found" in str(exc_info.value)

    def test_validate_resource_properties_missing_property(self, temp_template_file):
        """Test validating resource properties when some are missing."""
        loader = TemplateLoader(temp_template_file)
        validator = TemplateValidator(loader)

        with pytest.raises(ValueError) as exc_info:
            validator.validate_resource_properties(
                "TestBucket", ["BucketName", "NonExistentProperty"]
            )

        assert "missing properties" in str(exc_info.value)
        assert "NonExistentProperty" in str(exc_info.value)

    def test_validate_deletion_policies_success(self, temp_template_file):
        """Test validating deletion policies when all are allowed."""
        loader = TemplateLoader(temp_template_file)
        validator = TemplateValidator(loader)

        result = validator.validate_deletion_policies(["Delete", "Retain"])
        assert result is True

    def test_validate_deletion_policies_violation(self):
        """Test validating deletion policies with violations."""
        template_with_retain = {
            "Resources": {
                "TestResource": {
                    "Type": "AWS::S3::Bucket",
                    "DeletionPolicy": "Retain",
                }
            }
        }

        with tempfile.NamedTemporaryFile(
            mode="w", suffix=".json", delete=False
        ) as f:
            json.dump(template_with_retain, f)
            temp_path = f.name

        try:
            loader = TemplateLoader(temp_path)
            validator = TemplateValidator(loader)

            with pytest.raises(ValueError) as exc_info:
                validator.validate_deletion_policies(["Delete"])

            assert "Invalid deletion policies" in str(exc_info.value)
        finally:
            os.unlink(temp_path)

    def test_count_resources_by_type(self, temp_template_file):
        """Test counting resources by type."""
        loader = TemplateLoader(temp_template_file)
        validator = TemplateValidator(loader)

        bucket_count = validator.count_resources_by_type("AWS::S3::Bucket")
        assert bucket_count == 1

        role_count = validator.count_resources_by_type("AWS::IAM::Role")
        assert role_count == 1

        lambda_count = validator.count_resources_by_type("AWS::Lambda::Function")
        assert lambda_count == 0

    def test_validate_environment_suffix_usage_success(self, temp_template_file):
        """Test validating EnvironmentSuffix usage when present."""
        loader = TemplateLoader(temp_template_file)
        validator = TemplateValidator(loader)

        result = validator.validate_environment_suffix_usage()
        assert result is True

    def test_validate_environment_suffix_usage_missing(self):
        """Test validating EnvironmentSuffix usage when not present."""
        template_without_suffix = {
            "Resources": {
                "TestResource": {
                    "Type": "AWS::S3::Bucket",
                    "Properties": {"BucketName": "hardcoded-bucket-name"},
                }
            }
        }

        with tempfile.NamedTemporaryFile(
            mode="w", suffix=".json", delete=False
        ) as f:
            json.dump(template_without_suffix, f)
            temp_path = f.name

        try:
            loader = TemplateLoader(temp_path)
            validator = TemplateValidator(loader)

            with pytest.raises(ValueError) as exc_info:
                validator.validate_environment_suffix_usage()

            assert "EnvironmentSuffix" in str(exc_info.value)
            assert "not used" in str(exc_info.value)
        finally:
            os.unlink(temp_path)

    def test_actual_template_validation(self, template_validator):
        """Test validating actual CloudFormation template."""
        # Validate required parameters
        result = template_validator.validate_required_parameters(
            ["EnvironmentSuffix", "SecurityTeamEmail", "ApprovedAMIs"]
        )
        assert result is True

        # Validate deletion policies
        result = template_validator.validate_deletion_policies(["Delete"])
        assert result is True

        # Validate environment suffix usage
        result = template_validator.validate_environment_suffix_usage()
        assert result is True

        # Count Lambda functions
        lambda_count = template_validator.count_resources_by_type(
            "AWS::Lambda::Function"
        )
        assert lambda_count == 3


class TestConvenienceFunctions:
    """Test convenience functions."""

    def test_load_template_function(self, temp_template_file):
        """Test load_template convenience function."""
        template = load_template(temp_template_file)

        assert template is not None
        assert "Resources" in template
        assert "TestBucket" in template["Resources"]

    def test_validate_template_function_success(self, temp_template_file):
        """Test validate_template convenience function."""
        result = validate_template(
            temp_template_file,
            required_parameters=["EnvironmentSuffix"],
            required_resources=["TestBucket"],
        )
        assert result is True

    def test_validate_template_function_missing_parameters(self, temp_template_file):
        """Test validate_template with missing parameters."""
        with pytest.raises(ValueError):
            validate_template(
                temp_template_file, required_parameters=["NonExistentParam"]
            )

    def test_validate_template_function_missing_resources(self, temp_template_file):
        """Test validate_template with missing resources."""
        with pytest.raises(ValueError):
            validate_template(
                temp_template_file, required_resources=["NonExistentResource"]
            )

    def test_validate_template_function_no_requirements(self, temp_template_file):
        """Test validate_template with no requirements."""
        result = validate_template(temp_template_file)
        assert result is True
