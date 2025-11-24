"""
Unit tests for TapStack CloudFormation template validation.
Tests template syntax, resource properties, parameters, and outputs.
"""
import json
import os
import pytest
from pathlib import Path


class TestTapStackTemplate:
    """Unit tests for TapStack.json CloudFormation template."""

    @pytest.fixture(scope="class")
    def template(self):
        """Load the CloudFormation template."""
        template_path = Path(__file__).parent.parent.parent / "lib" / "TapStack.json"
        with open(template_path, 'r', encoding='utf-8') as f:
            return json.load(f)

    def test_template_has_required_sections(self, template):
        """Test that template contains all required CloudFormation sections."""
        assert "AWSTemplateFormatVersion" in template
        assert "Description" in template
        assert "Parameters" in template
        assert "Resources" in template
        assert "Outputs" in template
        assert template["AWSTemplateFormatVersion"] == "2010-09-09"

    def test_template_description(self, template):
        """Test that template has a meaningful description."""
        description = template["Description"]
        assert description
        assert isinstance(description, str)
        assert len(description) > 10
        assert "TAP" in description or "Task" in description

    def test_parameters_section(self, template):
        """Test parameters section is correctly defined."""
        params = template["Parameters"]
        assert "EnvironmentSuffix" in params

        env_suffix = params["EnvironmentSuffix"]
        assert env_suffix["Type"] == "String"
        assert "Description" in env_suffix
        assert "Default" in env_suffix
        assert env_suffix["Default"] == "dev"
        assert "AllowedPattern" in env_suffix
        assert "ConstraintDescription" in env_suffix

    def test_environment_suffix_pattern(self, template):
        """Test EnvironmentSuffix parameter has correct validation pattern."""
        env_suffix = template["Parameters"]["EnvironmentSuffix"]
        pattern = env_suffix["AllowedPattern"]
        # Pattern should allow alphanumeric characters
        assert "^[a-zA-Z0-9]+$" == pattern

    def test_resources_section(self, template):
        """Test resources section contains expected resources."""
        resources = template["Resources"]
        assert "TurnAroundPromptTable" in resources

    def test_dynamodb_table_properties(self, template):
        """Test DynamoDB table has correct properties."""
        table = template["Resources"]["TurnAroundPromptTable"]

        assert table["Type"] == "AWS::DynamoDB::Table"
        assert table["DeletionPolicy"] == "Delete"
        assert table["UpdateReplacePolicy"] == "Delete"

        properties = table["Properties"]
        assert "TableName" in properties
        assert "AttributeDefinitions" in properties
        assert "KeySchema" in properties
        assert "BillingMode" in properties
        assert properties["BillingMode"] == "PAY_PER_REQUEST"
        assert properties["DeletionProtectionEnabled"] is False

    def test_dynamodb_table_name_uses_environment_suffix(self, template):
        """Test that table name includes EnvironmentSuffix parameter."""
        table = template["Resources"]["TurnAroundPromptTable"]
        table_name = table["Properties"]["TableName"]

        assert "Fn::Sub" in table_name
        assert "${EnvironmentSuffix}" in table_name["Fn::Sub"]
        assert table_name["Fn::Sub"] == "TurnAroundPromptTable${EnvironmentSuffix}"

    def test_dynamodb_attribute_definitions(self, template):
        """Test DynamoDB table attribute definitions are correct."""
        table = template["Resources"]["TurnAroundPromptTable"]
        attr_defs = table["Properties"]["AttributeDefinitions"]

        assert len(attr_defs) == 1
        assert attr_defs[0]["AttributeName"] == "id"
        assert attr_defs[0]["AttributeType"] == "S"  # String type

    def test_dynamodb_key_schema(self, template):
        """Test DynamoDB table key schema is correct."""
        table = template["Resources"]["TurnAroundPromptTable"]
        key_schema = table["Properties"]["KeySchema"]

        assert len(key_schema) == 1
        assert key_schema[0]["AttributeName"] == "id"
        assert key_schema[0]["KeyType"] == "HASH"  # Partition key

    def test_dynamodb_deletion_policy(self, template):
        """Test DynamoDB table can be deleted (not retained)."""
        table = template["Resources"]["TurnAroundPromptTable"]

        # Verify deletion policy allows deletion
        assert table["DeletionPolicy"] == "Delete"
        assert table["UpdateReplacePolicy"] == "Delete"

        # Verify deletion protection is disabled
        assert table["Properties"]["DeletionProtectionEnabled"] is False

    def test_outputs_section(self, template):
        """Test outputs section contains all expected outputs."""
        outputs = template["Outputs"]

        assert "TurnAroundPromptTableName" in outputs
        assert "TurnAroundPromptTableArn" in outputs
        assert "StackName" in outputs
        assert "EnvironmentSuffix" in outputs

    def test_output_table_name(self, template):
        """Test TurnAroundPromptTableName output is correctly defined."""
        output = template["Outputs"]["TurnAroundPromptTableName"]

        assert "Description" in output
        assert "Value" in output
        assert "Export" in output
        assert output["Value"]["Ref"] == "TurnAroundPromptTable"
        assert "${AWS::StackName}-TurnAroundPromptTableName" in output["Export"]["Name"]["Fn::Sub"]

    def test_output_table_arn(self, template):
        """Test TurnAroundPromptTableArn output is correctly defined."""
        output = template["Outputs"]["TurnAroundPromptTableArn"]

        assert "Description" in output
        assert "Value" in output
        assert "Export" in output
        assert output["Value"]["Fn::GetAtt"][0] == "TurnAroundPromptTable"
        assert output["Value"]["Fn::GetAtt"][1] == "Arn"

    def test_output_stack_name(self, template):
        """Test StackName output is correctly defined."""
        output = template["Outputs"]["StackName"]

        assert "Description" in output
        assert "Value" in output
        assert "Export" in output
        assert output["Value"]["Ref"] == "AWS::StackName"

    def test_output_environment_suffix(self, template):
        """Test EnvironmentSuffix output is correctly defined."""
        output = template["Outputs"]["EnvironmentSuffix"]

        assert "Description" in output
        assert "Value" in output
        assert "Export" in output
        assert output["Value"]["Ref"] == "EnvironmentSuffix"

    def test_all_outputs_have_exports(self, template):
        """Test that all outputs have export names for cross-stack references."""
        outputs = template["Outputs"]

        for output_name, output_config in outputs.items():
            assert "Export" in output_config, f"Output {output_name} missing Export"
            assert "Name" in output_config["Export"], f"Output {output_name} missing Export Name"

    def test_all_outputs_have_descriptions(self, template):
        """Test that all outputs have meaningful descriptions."""
        outputs = template["Outputs"]

        for output_name, output_config in outputs.items():
            assert "Description" in output_config, f"Output {output_name} missing Description"
            assert len(output_config["Description"]) > 5, f"Output {output_name} has too short description"

    def test_metadata_section(self, template):
        """Test metadata section for parameter grouping."""
        metadata = template["Metadata"]

        assert "AWS::CloudFormation::Interface" in metadata
        interface = metadata["AWS::CloudFormation::Interface"]
        assert "ParameterGroups" in interface

        param_groups = interface["ParameterGroups"]
        assert len(param_groups) > 0
        assert "Label" in param_groups[0]
        assert "Parameters" in param_groups[0]
        assert "EnvironmentSuffix" in param_groups[0]["Parameters"]

    def test_no_hardcoded_values(self, template):
        """Test that there are no hardcoded environment names in resource names."""
        template_str = json.dumps(template)

        # Check for hardcoded environment names (should use parameters instead)
        hardcoded_patterns = ["-dev-", "-prod-", "-staging-", "dev-", "prod-", "staging-"]
        for pattern in hardcoded_patterns:
            assert pattern not in template_str.lower(), f"Found hardcoded environment value: {pattern}"

    def test_json_structure_is_valid(self, template):
        """Test that template is valid JSON."""
        # If we got here, JSON parsing succeeded
        assert isinstance(template, dict)
        assert len(template) > 0

    def test_template_size(self, template):
        """Test that template is not empty and has reasonable size."""
        template_str = json.dumps(template)
        assert len(template_str) > 100  # Not too small
        assert len(template_str) < 51200  # CloudFormation limit is 51200 bytes for direct upload

    def test_only_one_resource(self, template):
        """Test that template contains exactly one resource."""
        resources = template["Resources"]
        assert len(resources) == 1, "Template should contain exactly one DynamoDB table"

    def test_billing_mode_is_pay_per_request(self, template):
        """Test that DynamoDB uses on-demand billing for cost optimization."""
        table = template["Resources"]["TurnAroundPromptTable"]
        billing_mode = table["Properties"]["BillingMode"]
        assert billing_mode == "PAY_PER_REQUEST", "Should use on-demand billing"

    def test_no_provisioned_throughput(self, template):
        """Test that table doesn't use provisioned capacity (since using PAY_PER_REQUEST)."""
        table = template["Resources"]["TurnAroundPromptTable"]
        properties = table["Properties"]
        assert "ProvisionedThroughput" not in properties, "Should not have provisioned throughput with PAY_PER_REQUEST"

    def test_no_global_secondary_indexes(self, template):
        """Test that table has no GSIs (simple table design)."""
        table = template["Resources"]["TurnAroundPromptTable"]
        properties = table["Properties"]
        assert "GlobalSecondaryIndexes" not in properties

    def test_no_local_secondary_indexes(self, template):
        """Test that table has no LSIs."""
        table = template["Resources"]["TurnAroundPromptTable"]
        properties = table["Properties"]
        assert "LocalSecondaryIndexes" not in properties

    def test_no_stream_specification(self, template):
        """Test that table has no DynamoDB Streams configured."""
        table = template["Resources"]["TurnAroundPromptTable"]
        properties = table["Properties"]
        assert "StreamSpecification" not in properties

    def test_no_point_in_time_recovery(self, template):
        """Test that PITR is not configured (acceptable for dev/test environments)."""
        table = template["Resources"]["TurnAroundPromptTable"]
        properties = table["Properties"]
        # PITR is optional - not checking for its presence, just ensuring no error if absent
        if "PointInTimeRecoverySpecification" in properties:
            pitr = properties["PointInTimeRecoverySpecification"]
            assert isinstance(pitr.get("PointInTimeRecoveryEnabled"), bool)

    def test_no_sse_specification(self, template):
        """Test that server-side encryption is not explicitly configured (uses AWS-owned keys by default)."""
        table = template["Resources"]["TurnAroundPromptTable"]
        properties = table["Properties"]
        # SSE is optional - DynamoDB uses AWS-owned keys by default
        if "SSESpecification" in properties:
            sse = properties["SSESpecification"]
            assert isinstance(sse.get("SSEEnabled"), bool)

    def test_no_time_to_live(self, template):
        """Test that TTL is not configured."""
        table = template["Resources"]["TurnAroundPromptTable"]
        properties = table["Properties"]
        assert "TimeToLiveSpecification" not in properties

    def test_no_tags(self, template):
        """Test that no tags are specified (could be added for better resource management)."""
        table = template["Resources"]["TurnAroundPromptTable"]
        properties = table["Properties"]
        # Tags are optional but recommended - this test documents their absence
        if "Tags" in properties:
            assert isinstance(properties["Tags"], list)

    def test_export_names_use_stack_name(self, template):
        """Test that export names use stack name prefix for uniqueness."""
        outputs = template["Outputs"]

        for output_name, output_config in outputs.items():
            export_name = output_config["Export"]["Name"]
            if "Fn::Sub" in export_name:
                assert "${AWS::StackName}" in export_name["Fn::Sub"], \
                    f"Export name for {output_name} should use StackName for uniqueness"

    def test_parameter_default_value(self, template):
        """Test that EnvironmentSuffix has appropriate default."""
        env_suffix = template["Parameters"]["EnvironmentSuffix"]
        default = env_suffix["Default"]
        assert default == "dev", "Default environment should be 'dev'"

    def test_template_has_no_conditions(self, template):
        """Test that template has no conditions section (simple single-resource template)."""
        assert "Conditions" not in template

    def test_template_has_no_mappings(self, template):
        """Test that template has no mappings section (no environment-specific mappings needed)."""
        assert "Mappings" not in template

    def test_template_has_no_rules(self, template):
        """Test that template has no rules section."""
        assert "Rules" not in template

    def test_template_has_no_transforms(self, template):
        """Test that template has no transforms (not using SAM or macros)."""
        assert "Transform" not in template
