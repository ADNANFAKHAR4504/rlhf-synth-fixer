"""
Unit tests for template_validator module.
Tests all validation functions with 100% code coverage.
"""
import json
import pytest
import tempfile
from pathlib import Path
from lib.template_validator import TemplateValidator, validate_template


class TestTemplateValidator:
    """Unit tests for TemplateValidator class."""

    @pytest.fixture
    def valid_template(self):
        """Create a valid CloudFormation template."""
        return {
            "AWSTemplateFormatVersion": "2010-09-09",
            "Description": "Test template",
            "Parameters": {
                "EnvironmentSuffix": {
                    "Type": "String",
                    "Description": "Environment suffix",
                    "Default": "dev",
                    "AllowedPattern": "^[a-zA-Z0-9]+$",
                    "ConstraintDescription": "Must be alphanumeric"
                }
            },
            "Resources": {
                "TestTable": {
                    "Type": "AWS::DynamoDB::Table",
                    "DeletionPolicy": "Delete",
                    "Properties": {
                        "TableName": {"Fn::Sub": "TestTable${EnvironmentSuffix}"},
                        "BillingMode": "PAY_PER_REQUEST"
                    }
                }
            },
            "Outputs": {
                "TableName": {
                    "Description": "Table name",
                    "Value": {"Ref": "TestTable"},
                    "Export": {
                        "Name": {"Fn::Sub": "${AWS::StackName}-TableName"}
                    }
                }
            }
        }

    @pytest.fixture
    def temp_template_file(self, valid_template):
        """Create temporary template file."""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            json.dump(valid_template, f)
            return f.name

    def test_init(self, temp_template_file):
        """Test TemplateValidator initialization."""
        validator = TemplateValidator(temp_template_file)
        assert validator.template_path == Path(temp_template_file)
        assert validator.template is None
        assert validator.errors == []
        assert validator.warnings == []

    def test_load_template_success(self, temp_template_file):
        """Test successful template loading."""
        validator = TemplateValidator(temp_template_file)
        assert validator.load_template() is True
        assert validator.template is not None
        assert len(validator.errors) == 0

    def test_load_template_file_not_found(self):
        """Test loading non-existent template."""
        validator = TemplateValidator("/nonexistent/path/template.json")
        assert validator.load_template() is False
        assert len(validator.errors) == 1
        assert "not found" in validator.errors[0]

    def test_load_template_invalid_json(self):
        """Test loading invalid JSON."""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            f.write("{invalid json")
            temp_path = f.name

        validator = TemplateValidator(temp_path)
        assert validator.load_template() is False
        assert len(validator.errors) == 1
        assert "Invalid JSON" in validator.errors[0]

    def test_validate_structure_success(self, temp_template_file):
        """Test successful structure validation."""
        validator = TemplateValidator(temp_template_file)
        validator.load_template()
        assert validator.validate_structure() is True
        assert len(validator.errors) == 0

    def test_validate_structure_template_not_loaded(self):
        """Test structure validation without loading template."""
        validator = TemplateValidator("dummy.json")
        assert validator.validate_structure() is False
        assert "Template not loaded" in validator.errors

    def test_validate_structure_missing_version(self, temp_template_file):
        """Test structure validation with missing version."""
        validator = TemplateValidator(temp_template_file)
        validator.load_template()
        del validator.template["AWSTemplateFormatVersion"]
        assert validator.validate_structure() is False
        assert any("AWSTemplateFormatVersion" in error for error in validator.errors)

    def test_validate_structure_missing_resources(self, temp_template_file):
        """Test structure validation with missing resources."""
        validator = TemplateValidator(temp_template_file)
        validator.load_template()
        del validator.template["Resources"]
        assert validator.validate_structure() is False
        assert any("Resources" in error for error in validator.errors)

    def test_validate_structure_invalid_version(self, temp_template_file):
        """Test structure validation with invalid version."""
        validator = TemplateValidator(temp_template_file)
        validator.load_template()
        validator.template["AWSTemplateFormatVersion"] = "2000-01-01"
        assert validator.validate_structure() is False
        assert any("Invalid AWSTemplateFormatVersion" in error for error in validator.errors)

    def test_validate_parameters_success(self, temp_template_file):
        """Test successful parameters validation."""
        validator = TemplateValidator(temp_template_file)
        validator.load_template()
        assert validator.validate_parameters() is True

    def test_validate_parameters_not_loaded(self):
        """Test parameters validation without loading template."""
        validator = TemplateValidator("dummy.json")
        assert validator.validate_parameters() is False
        assert "Template not loaded" in validator.errors

    def test_validate_parameters_no_section(self, temp_template_file):
        """Test parameters validation with no Parameters section."""
        validator = TemplateValidator(temp_template_file)
        validator.load_template()
        del validator.template["Parameters"]
        assert validator.validate_parameters() is True
        assert any("No Parameters section" in warning for warning in validator.warnings)

    def test_validate_parameters_missing_type(self, temp_template_file):
        """Test parameters validation with missing Type."""
        validator = TemplateValidator(temp_template_file)
        validator.load_template()
        del validator.template["Parameters"]["EnvironmentSuffix"]["Type"]
        assert validator.validate_parameters() is False
        assert any("missing Type" in error for error in validator.errors)

    def test_validate_parameters_missing_description(self, temp_template_file):
        """Test parameters validation with missing Description."""
        validator = TemplateValidator(temp_template_file)
        validator.load_template()
        del validator.template["Parameters"]["EnvironmentSuffix"]["Description"]
        assert validator.validate_parameters() is True
        assert any("missing Description" in warning for warning in validator.warnings)

    def test_validate_parameters_pattern_without_constraint(self, temp_template_file):
        """Test parameters validation with AllowedPattern but no ConstraintDescription."""
        validator = TemplateValidator(temp_template_file)
        validator.load_template()
        del validator.template["Parameters"]["EnvironmentSuffix"]["ConstraintDescription"]
        assert validator.validate_parameters() is True
        assert any("no ConstraintDescription" in warning for warning in validator.warnings)

    def test_validate_resources_success(self, temp_template_file):
        """Test successful resources validation."""
        validator = TemplateValidator(temp_template_file)
        validator.load_template()
        assert validator.validate_resources() is True

    def test_validate_resources_not_loaded(self):
        """Test resources validation without loading template."""
        validator = TemplateValidator("dummy.json")
        assert validator.validate_resources() is False
        assert "Template not loaded" in validator.errors

    def test_validate_resources_no_section(self, temp_template_file):
        """Test resources validation with no Resources section."""
        validator = TemplateValidator(temp_template_file)
        validator.load_template()
        del validator.template["Resources"]
        assert validator.validate_resources() is False
        assert any("Missing Resources section" in error for error in validator.errors)

    def test_validate_resources_empty_section(self, temp_template_file):
        """Test resources validation with empty Resources section."""
        validator = TemplateValidator(temp_template_file)
        validator.load_template()
        validator.template["Resources"] = {}
        assert validator.validate_resources() is False
        assert any("Resources section is empty" in error for error in validator.errors)

    def test_validate_resources_missing_type(self, temp_template_file):
        """Test resources validation with missing Type."""
        validator = TemplateValidator(temp_template_file)
        validator.load_template()
        del validator.template["Resources"]["TestTable"]["Type"]
        assert validator.validate_resources() is False
        assert any("missing Type" in error for error in validator.errors)

    def test_validate_resources_no_properties(self, temp_template_file):
        """Test resources validation with no Properties."""
        validator = TemplateValidator(temp_template_file)
        validator.load_template()
        del validator.template["Resources"]["TestTable"]["Properties"]
        assert validator.validate_resources() is True
        assert any("has no Properties" in warning for warning in validator.warnings)

    def test_validate_outputs_success(self, temp_template_file):
        """Test successful outputs validation."""
        validator = TemplateValidator(temp_template_file)
        validator.load_template()
        assert validator.validate_outputs() is True

    def test_validate_outputs_not_loaded(self):
        """Test outputs validation without loading template."""
        validator = TemplateValidator("dummy.json")
        assert validator.validate_outputs() is False
        assert "Template not loaded" in validator.errors

    def test_validate_outputs_no_section(self, temp_template_file):
        """Test outputs validation with no Outputs section."""
        validator = TemplateValidator(temp_template_file)
        validator.load_template()
        del validator.template["Outputs"]
        assert validator.validate_outputs() is True
        assert any("No Outputs section" in warning for warning in validator.warnings)

    def test_validate_outputs_missing_value(self, temp_template_file):
        """Test outputs validation with missing Value."""
        validator = TemplateValidator(temp_template_file)
        validator.load_template()
        del validator.template["Outputs"]["TableName"]["Value"]
        assert validator.validate_outputs() is False
        assert any("missing Value" in error for error in validator.errors)

    def test_validate_outputs_missing_description(self, temp_template_file):
        """Test outputs validation with missing Description."""
        validator = TemplateValidator(temp_template_file)
        validator.load_template()
        del validator.template["Outputs"]["TableName"]["Description"]
        assert validator.validate_outputs() is True
        assert any("missing Description" in warning for warning in validator.warnings)

    def test_validate_outputs_export_missing_name(self, temp_template_file):
        """Test outputs validation with Export missing Name."""
        validator = TemplateValidator(temp_template_file)
        validator.load_template()
        del validator.template["Outputs"]["TableName"]["Export"]["Name"]
        assert validator.validate_outputs() is False
        assert any("Export missing Name" in error for error in validator.errors)

    def test_validate_outputs_export_with_name(self, temp_template_file):
        """Test outputs validation with Export that has Name (positive case)."""
        validator = TemplateValidator(temp_template_file)
        validator.load_template()
        # Ensure Export has Name (already present in fixture)
        assert "Name" in validator.template["Outputs"]["TableName"]["Export"]
        assert validator.validate_outputs() is True
        # No errors should be present for this specific case
        export_errors = [e for e in validator.errors if "Export missing Name" in e]
        assert len(export_errors) == 0

    def test_validate_outputs_without_export(self, temp_template_file):
        """Test outputs validation with output that has no Export section."""
        validator = TemplateValidator(temp_template_file)
        validator.load_template()
        # Remove Export section entirely
        del validator.template["Outputs"]["TableName"]["Export"]
        assert validator.validate_outputs() is True
        # No export-related errors should be present
        export_errors = [e for e in validator.errors if "Export" in e]
        assert len(export_errors) == 0

    def test_check_environment_suffix_usage_success(self, temp_template_file):
        """Test environment suffix usage check."""
        validator = TemplateValidator(temp_template_file)
        validator.load_template()
        assert validator.check_environment_suffix_usage() is True

    def test_check_environment_suffix_usage_not_loaded(self):
        """Test environment suffix check without loading template."""
        validator = TemplateValidator("dummy.json")
        assert validator.check_environment_suffix_usage() is False
        assert "Template not loaded" in validator.errors

    def test_check_environment_suffix_usage_not_defined(self, temp_template_file):
        """Test environment suffix check when parameter not defined."""
        validator = TemplateValidator(temp_template_file)
        validator.load_template()
        del validator.template["Parameters"]
        assert validator.check_environment_suffix_usage() is True
        assert any("EnvironmentSuffix parameter not defined" in warning for warning in validator.warnings)

    def test_check_environment_suffix_usage_not_used(self, temp_template_file):
        """Test environment suffix check when parameter not used."""
        validator = TemplateValidator(temp_template_file)
        validator.load_template()
        validator.template["Resources"]["TestTable"]["Properties"]["TableName"] = "HardcodedTableName"
        assert validator.check_environment_suffix_usage() is True
        assert any("defined but not used" in warning for warning in validator.warnings)

    def test_check_deletion_policies_success(self, temp_template_file):
        """Test deletion policies check."""
        validator = TemplateValidator(temp_template_file)
        validator.load_template()
        assert validator.check_deletion_policies() is True

    def test_check_deletion_policies_not_loaded(self):
        """Test deletion policies check without loading template."""
        validator = TemplateValidator("dummy.json")
        assert validator.check_deletion_policies() is False
        assert "Template not loaded" in validator.errors

    def test_check_deletion_policies_missing(self, temp_template_file):
        """Test deletion policies check with missing policy."""
        validator = TemplateValidator(temp_template_file)
        validator.load_template()
        del validator.template["Resources"]["TestTable"]["DeletionPolicy"]
        assert validator.check_deletion_policies() is True
        assert any("missing DeletionPolicy" in warning for warning in validator.warnings)

    def test_check_deletion_policies_retain(self, temp_template_file):
        """Test deletion policies check with Retain policy."""
        validator = TemplateValidator(temp_template_file)
        validator.load_template()
        validator.template["Resources"]["TestTable"]["DeletionPolicy"] = "Retain"
        assert validator.check_deletion_policies() is True
        assert any("Retain policy" in warning for warning in validator.warnings)

    def test_check_hardcoded_values_success(self, temp_template_file):
        """Test hardcoded values check."""
        validator = TemplateValidator(temp_template_file)
        validator.load_template()
        assert validator.check_hardcoded_values() is True

    def test_check_hardcoded_values_not_loaded(self):
        """Test hardcoded values check without loading template."""
        validator = TemplateValidator("dummy.json")
        assert validator.check_hardcoded_values() is False
        assert "Template not loaded" in validator.errors

    def test_check_hardcoded_values_dev_found(self, temp_template_file):
        """Test hardcoded values check with '-dev-' pattern."""
        validator = TemplateValidator(temp_template_file)
        validator.load_template()
        validator.template["Resources"]["TestTable"]["Properties"]["TableName"] = "my-dev-table"
        assert validator.check_hardcoded_values() is True
        assert any("'-dev-'" in warning for warning in validator.warnings)

    def test_validate_all_success(self, temp_template_file):
        """Test validate_all with valid template."""
        validator = TemplateValidator(temp_template_file)
        assert validator.validate_all() is True

    def test_validate_all_load_failure(self):
        """Test validate_all with load failure."""
        validator = TemplateValidator("/nonexistent/template.json")
        assert validator.validate_all() is False

    def test_validate_all_multiple_failures(self):
        """Test validate_all with multiple validation failures."""
        # Create invalid template file
        invalid_template = {"Description": "Missing required sections"}
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            json.dump(invalid_template, f)
            temp_path = f.name

        validator = TemplateValidator(temp_path)
        assert validator.validate_all() is False
        assert len(validator.errors) > 0

    def test_get_results(self, temp_template_file):
        """Test get_results method."""
        validator = TemplateValidator(temp_template_file)
        validator.load_template()
        validator.validate_all()
        errors, warnings = validator.get_results()
        assert isinstance(errors, list)
        assert isinstance(warnings, list)

    def test_get_resource_count(self, temp_template_file):
        """Test get_resource_count method."""
        validator = TemplateValidator(temp_template_file)
        validator.load_template()
        assert validator.get_resource_count() == 1

    def test_get_resource_count_no_template(self):
        """Test get_resource_count without template."""
        validator = TemplateValidator("dummy.json")
        assert validator.get_resource_count() == 0

    def test_get_resource_count_no_resources(self, temp_template_file):
        """Test get_resource_count with no resources section."""
        validator = TemplateValidator(temp_template_file)
        validator.load_template()
        del validator.template["Resources"]
        assert validator.get_resource_count() == 0

    def test_get_output_count(self, temp_template_file):
        """Test get_output_count method."""
        validator = TemplateValidator(temp_template_file)
        validator.load_template()
        assert validator.get_output_count() == 1

    def test_get_output_count_no_template(self):
        """Test get_output_count without template."""
        validator = TemplateValidator("dummy.json")
        assert validator.get_output_count() == 0

    def test_get_output_count_no_outputs(self, temp_template_file):
        """Test get_output_count with no outputs section."""
        validator = TemplateValidator(temp_template_file)
        validator.load_template()
        del validator.template["Outputs"]
        assert validator.get_output_count() == 0

    def test_get_parameter_count(self, temp_template_file):
        """Test get_parameter_count method."""
        validator = TemplateValidator(temp_template_file)
        validator.load_template()
        assert validator.get_parameter_count() == 1

    def test_get_parameter_count_no_template(self):
        """Test get_parameter_count without template."""
        validator = TemplateValidator("dummy.json")
        assert validator.get_parameter_count() == 0

    def test_get_parameter_count_no_parameters(self, temp_template_file):
        """Test get_parameter_count with no parameters section."""
        validator = TemplateValidator(temp_template_file)
        validator.load_template()
        del validator.template["Parameters"]
        assert validator.get_parameter_count() == 0

    def test_get_resource_types(self, temp_template_file):
        """Test get_resource_types method."""
        validator = TemplateValidator(temp_template_file)
        validator.load_template()
        types = validator.get_resource_types()
        assert "AWS::DynamoDB::Table" in types
        assert len(types) == 1

    def test_get_resource_types_no_template(self):
        """Test get_resource_types without template."""
        validator = TemplateValidator("dummy.json")
        assert validator.get_resource_types() == []

    def test_get_resource_types_no_resources(self, temp_template_file):
        """Test get_resource_types with no resources."""
        validator = TemplateValidator(temp_template_file)
        validator.load_template()
        del validator.template["Resources"]
        assert validator.get_resource_types() == []

    def test_has_dynamodb_table(self, temp_template_file):
        """Test has_dynamodb_table method."""
        validator = TemplateValidator(temp_template_file)
        validator.load_template()
        assert validator.has_dynamodb_table() is True

    def test_has_dynamodb_table_false(self, temp_template_file):
        """Test has_dynamodb_table when no DynamoDB table."""
        validator = TemplateValidator(temp_template_file)
        validator.load_template()
        validator.template["Resources"]["TestTable"]["Type"] = "AWS::S3::Bucket"
        assert validator.has_dynamodb_table() is False

    def test_has_s3_bucket(self, temp_template_file):
        """Test has_s3_bucket method."""
        validator = TemplateValidator(temp_template_file)
        validator.load_template()
        validator.template["Resources"]["TestBucket"] = {
            "Type": "AWS::S3::Bucket",
            "Properties": {}
        }
        assert validator.has_s3_bucket() is True

    def test_has_s3_bucket_false(self, temp_template_file):
        """Test has_s3_bucket when no S3 bucket."""
        validator = TemplateValidator(temp_template_file)
        validator.load_template()
        assert validator.has_s3_bucket() is False

    def test_has_lambda_function(self, temp_template_file):
        """Test has_lambda_function method."""
        validator = TemplateValidator(temp_template_file)
        validator.load_template()
        validator.template["Resources"]["TestFunction"] = {
            "Type": "AWS::Lambda::Function",
            "Properties": {}
        }
        assert validator.has_lambda_function() is True

    def test_has_lambda_function_false(self, temp_template_file):
        """Test has_lambda_function when no Lambda function."""
        validator = TemplateValidator(temp_template_file)
        validator.load_template()
        assert validator.has_lambda_function() is False

    def test_get_template_size(self, temp_template_file):
        """Test get_template_size method."""
        validator = TemplateValidator(temp_template_file)
        validator.load_template()
        size = validator.get_template_size()
        assert size > 0
        assert isinstance(size, int)

    def test_get_template_size_no_template(self):
        """Test get_template_size without template."""
        validator = TemplateValidator("dummy.json")
        assert validator.get_template_size() == 0

    def test_validate_template_convenience_function(self, temp_template_file):
        """Test validate_template convenience function."""
        is_valid, errors, warnings = validate_template(temp_template_file)
        assert is_valid is True
        assert isinstance(errors, list)
        assert isinstance(warnings, list)

    def test_validate_template_convenience_function_invalid(self):
        """Test validate_template with invalid template."""
        is_valid, errors, warnings = validate_template("/nonexistent/template.json")
        assert is_valid is False
        assert len(errors) > 0

    def test_check_deletion_policies_no_resources(self, temp_template_file):
        """Test deletion policies check with no resources section."""
        validator = TemplateValidator(temp_template_file)
        validator.load_template()
        del validator.template["Resources"]
        assert validator.check_deletion_policies() is True

    def test_check_deletion_policies_non_stateful_resource(self, temp_template_file):
        """Test deletion policies with non-stateful resource."""
        validator = TemplateValidator(temp_template_file)
        validator.load_template()
        validator.template["Resources"]["TestRole"] = {
            "Type": "AWS::IAM::Role",
            "Properties": {}
        }
        assert validator.check_deletion_policies() is True

    def test_get_resource_types_missing_type(self, temp_template_file):
        """Test get_resource_types with resource missing Type field."""
        validator = TemplateValidator(temp_template_file)
        validator.load_template()
        validator.template["Resources"]["BrokenResource"] = {"Properties": {}}
        types = validator.get_resource_types()
        assert "Unknown" in types

    def test_load_template_generic_exception(self):
        """Test load_template with generic exception."""
        # Create a validator and then make template_path invalid type to trigger generic exception
        import unittest.mock as mock

        validator = TemplateValidator("dummy.json")

        # Mock open to raise a generic exception (not FileNotFoundError or JSONDecodeError)
        with mock.patch('builtins.open', side_effect=PermissionError("Permission denied")):
            result = validator.load_template()
            assert result is False
            assert len(validator.errors) > 0
            assert "Error loading template" in validator.errors[0]

    def test_check_hardcoded_values_all_patterns(self):
        """Test all hardcoded value patterns."""
        patterns = {
            "my-prod-table": "'-prod-'",
            "my-staging-bucket": "'-staging-'",
            "dev-resource": "'dev-' prefix",
            "prod-resource": "'prod-' prefix",
            "staging-resource": "'staging-' prefix"
        }

        for value, expected_warning in patterns.items():
            template = {
                "AWSTemplateFormatVersion": "2010-09-09",
                "Resources": {
                    "TestResource": {
                        "Type": "AWS::S3::Bucket",
                        "Properties": {"BucketName": value}
                    }
                }
            }

            with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
                json.dump(template, f)
                temp_path = f.name

            validator = TemplateValidator(temp_path)
            validator.load_template()
            validator.check_hardcoded_values()
            assert any(expected_warning.lower() in w.lower() for w in validator.warnings), \
                f"Expected warning for pattern {expected_warning}"

    def test_check_deletion_policies_all_stateful_types(self):
        """Test deletion policy check for all stateful resource types."""
        stateful_types = [
            "AWS::RDS::DBCluster",
            "AWS::RDS::DBInstance",
            "AWS::S3::Bucket",
            "AWS::DynamoDB::Table"
        ]

        for resource_type in stateful_types:
            template = {
                "AWSTemplateFormatVersion": "2010-09-09",
                "Resources": {
                    "TestResource": {
                        "Type": resource_type,
                        "Properties": {}
                    }
                }
            }

            with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
                json.dump(template, f)
                temp_path = f.name

            validator = TemplateValidator(temp_path)
            validator.load_template()
            validator.check_deletion_policies()
            assert any("missing DeletionPolicy" in w for w in validator.warnings), \
                f"Expected warning for {resource_type}"
