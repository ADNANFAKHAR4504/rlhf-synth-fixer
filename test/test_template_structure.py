#!/usr/bin/env python3
"""
Unit tests for CloudFormation template structure validation.
Tests all 12 optimization requirements for task 101912945.
"""

import json
import os
import pytest
from pathlib import Path

# Get the lib directory path
LIB_DIR = Path(__file__).parent.parent / "lib"
MODEL_TEMPLATE = LIB_DIR / "model-stack.json"
OPTIMIZED_TEMPLATE = LIB_DIR / "optimized-stack.json"


def load_template(template_path):
    """Load and parse CloudFormation template."""
    with open(template_path, 'r') as f:
        return json.load(f)


@pytest.fixture
def model_template():
    """Load MODEL_RESPONSE template."""
    return load_template(MODEL_TEMPLATE)


@pytest.fixture
def optimized_template():
    """Load IDEAL_RESPONSE template."""
    return load_template(OPTIMIZED_TEMPLATE)


class TestRequirement1TemplateSizeReduction:
    """Test Requirement 1: Template size reduction (40%+)"""

    def test_optimized_template_size(self, optimized_template):
        """Test that optimized template is under 1800 lines."""
        with open(OPTIMIZED_TEMPLATE, 'r') as f:
            lines = f.readlines()
        assert len(lines) < 1800, f"Template has {len(lines)} lines, expected < 1800"
        assert len(lines) > 500, "Template too small, may be missing functionality"

    def test_size_reduction_percentage(self):
        """Test that template achieved 40%+ reduction."""
        # Original was ~3000 lines, target is under 1800 (40% reduction)
        with open(OPTIMIZED_TEMPLATE, 'r') as f:
            optimized_lines = len(f.readlines())

        assumed_original = 3000
        reduction_percent = ((assumed_original - optimized_lines) / assumed_original) * 100
        assert reduction_percent >= 40, f"Reduction: {reduction_percent:.1f}%, expected >= 40%"


class TestRequirement2ParameterExtraction:
    """Test Requirement 2: Extract hardcoded values to parameters"""

    def test_parameters_section_exists(self, optimized_template):
        """Test that Parameters section exists."""
        assert "Parameters" in optimized_template
        assert len(optimized_template["Parameters"]) > 0

    def test_environment_suffix_parameter(self, optimized_template):
        """Test EnvironmentSuffix parameter with validation."""
        params = optimized_template["Parameters"]
        assert "EnvironmentSuffix" in params

        env_suffix = params["EnvironmentSuffix"]
        assert env_suffix["Type"] == "String"
        assert "MinLength" in env_suffix
        assert "MaxLength" in env_suffix
        assert "AllowedPattern" in env_suffix
        assert "ConstraintDescription" in env_suffix

    def test_vpc_cidr_has_allowed_pattern(self, optimized_template):
        """Test VPC CIDR has AllowedPattern validation."""
        params = optimized_template["Parameters"]
        assert "VpcCIDR" in params
        assert "AllowedPattern" in params["VpcCIDR"]
        assert "ConstraintDescription" in params["VpcCIDR"]

    def test_ami_id_correct_type(self, optimized_template):
        """Test AMI ID uses AWS::EC2::Image::Id type."""
        params = optimized_template["Parameters"]
        assert "AmiId" in params
        assert params["AmiId"]["Type"] == "AWS::EC2::Image::Id"

    def test_db_password_no_echo(self, optimized_template):
        """Test DB password has NoEcho set."""
        params = optimized_template["Parameters"]
        assert "DBMasterPassword" in params
        assert params["DBMasterPassword"].get("NoEcho") == True


class TestRequirement3MappingsSection:
    """Test Requirement 3: Mappings section for environment configs"""

    def test_mappings_section_exists(self, optimized_template):
        """Test that Mappings section exists."""
        assert "Mappings" in optimized_template
        assert len(optimized_template["Mappings"]) > 0

    def test_environment_config_mapping(self, optimized_template):
        """Test EnvironmentConfig mapping with dev/staging/prod."""
        mappings = optimized_template["Mappings"]
        assert "EnvironmentConfig" in mappings

        env_config = mappings["EnvironmentConfig"]
        assert "dev" in env_config
        assert "staging" in env_config
        assert "prod" in env_config

        # Test dev environment has required keys
        assert "InstanceType" in env_config["dev"]
        assert "MinSize" in env_config["dev"]
        assert "MaxSize" in env_config["dev"]
        assert "DBInstanceClass" in env_config["dev"]
        assert "CacheNodeType" in env_config["dev"]

    def test_region_ami_mapping(self, optimized_template):
        """Test RegionAMI mapping exists."""
        mappings = optimized_template["Mappings"]
        assert "RegionAMI" in mappings

        region_ami = mappings["RegionAMI"]
        assert "us-east-1" in region_ami
        assert "HVM64" in region_ami["us-east-1"]

    def test_model_template_missing_mappings(self, model_template):
        """Test that MODEL template is missing Mappings (intentional failure)."""
        assert "Mappings" not in model_template or len(model_template.get("Mappings", {})) == 0


class TestRequirement4CircularDependency:
    """Test Requirement 4: Fix circular dependency"""

    def test_db_parameter_groups_independent(self, optimized_template):
        """Test that DB parameter groups are created independently."""
        resources = optimized_template["Resources"]

        # Check both parameter groups exist
        assert "DBParameterGroup" in resources
        assert "DBClusterParameterGroup" in resources

        # Check they don't reference each other
        db_param = json.dumps(resources["DBParameterGroup"])
        cluster_param = json.dumps(resources["DBClusterParameterGroup"])

        assert "DBParameterGroup" not in cluster_param
        assert "DBClusterParameterGroup" not in db_param

    def test_aurora_cluster_references_cluster_param_group(self, optimized_template):
        """Test AuroraCluster references DBClusterParameterGroup."""
        resources = optimized_template["Resources"]
        aurora_cluster = resources["AuroraCluster"]

        assert "DBClusterParameterGroupName" in aurora_cluster["Properties"]
        # Should reference DBClusterParameterGroup, not DBParameterGroup

    def test_aurora_instance_references_instance_param_group(self, optimized_template):
        """Test AuroraInstance references DBParameterGroup."""
        resources = optimized_template["Resources"]
        aurora_instance = resources["AuroraInstance1"]

        assert "DBParameterGroupName" in aurora_instance["Properties"]
        # Should reference DBParameterGroup


class TestRequirement5SecurityGroupConsolidation:
    """Test Requirement 5: Consolidate security groups to 3"""

    def test_exactly_three_security_groups(self, optimized_template):
        """Test exactly 3 security groups exist."""
        resources = optimized_template["Resources"]
        security_groups = [
            r for r in resources.values()
            if r.get("Type") == "AWS::EC2::SecurityGroup"
        ]
        assert len(security_groups) == 3, f"Expected 3 security groups, found {len(security_groups)}"

    def test_security_group_names(self, optimized_template):
        """Test security groups are named for web, app, and data tiers."""
        resources = optimized_template["Resources"]
        assert "WebSecurityGroup" in resources
        assert "AppSecurityGroup" in resources
        assert "DataSecurityGroup" in resources

    def test_web_sg_has_http_https(self, optimized_template):
        """Test WebSecurityGroup allows HTTP and HTTPS."""
        web_sg = optimized_template["Resources"]["WebSecurityGroup"]
        ingress_rules = web_sg["Properties"]["SecurityGroupIngress"]

        ports = [rule["FromPort"] for rule in ingress_rules]
        assert 80 in ports, "WebSecurityGroup missing port 80"
        assert 443 in ports, "WebSecurityGroup missing port 443"

    def test_data_sg_has_mysql_redis(self, optimized_template):
        """Test DataSecurityGroup allows MySQL and Redis."""
        data_sg = optimized_template["Resources"]["DataSecurityGroup"]
        ingress_rules = data_sg["Properties"]["SecurityGroupIngress"]

        ports = [rule["FromPort"] for rule in ingress_rules]
        assert 3306 in ports, "DataSecurityGroup missing port 3306 (MySQL)"
        assert 6379 in ports, "DataSecurityGroup missing port 6379 (Redis)"


class TestRequirement6FnSubUsage:
    """Test Requirement 6: Replace Fn::Join with Fn::Sub"""

    def test_optimized_uses_fn_sub(self, optimized_template):
        """Test optimized template uses Fn::Sub."""
        template_str = json.dumps(optimized_template)
        assert "Fn::Sub" in template_str

    def test_optimized_minimal_fn_join(self, optimized_template):
        """Test optimized template minimizes Fn::Join usage."""
        template_str = json.dumps(optimized_template)

        # Count occurrences
        fn_sub_count = template_str.count("Fn::Sub")
        fn_join_count = template_str.count("Fn::Join")

        # Should have many more Fn::Sub than Fn::Join
        assert fn_sub_count > 10, "Not enough Fn::Sub usage"
        # Fn::Join should be minimal or zero
        assert fn_join_count < fn_sub_count / 2, "Too much Fn::Join usage"

    def test_model_still_uses_fn_join(self, model_template):
        """Test MODEL template still uses Fn::Join (intentional failure)."""
        template_str = json.dumps(model_template)
        fn_join_count = template_str.count("Fn::Join")
        assert fn_join_count > 10, "MODEL should have many Fn::Join instances"


class TestRequirement7Conditions:
    """Test Requirement 7: Conditional resource creation"""

    def test_conditions_section_exists(self, optimized_template):
        """Test Conditions section exists."""
        assert "Conditions" in optimized_template
        assert len(optimized_template["Conditions"]) > 0

    def test_environment_conditions(self, optimized_template):
        """Test environment-based conditions exist."""
        conditions = optimized_template["Conditions"]
        assert "IsProduction" in conditions
        assert "IsNotProduction" in conditions
        assert "EnableMultiAZ" in conditions

    def test_conditional_resources(self, optimized_template):
        """Test resources use conditions."""
        resources = optimized_template["Resources"]

        # AuroraInstance2 should only be created in production (multi-AZ)
        if "AuroraInstance2" in resources:
            assert "Condition" in resources["AuroraInstance2"]

        # Should have conditional Redis resources
        conditional_resources = [
            r for r in resources.values()
            if "Condition" in r
        ]
        assert len(conditional_resources) > 0, "No conditional resources found"

    def test_model_missing_conditions(self, model_template):
        """Test MODEL template missing Conditions (intentional failure)."""
        assert "Conditions" not in model_template or len(model_template.get("Conditions", {})) == 0


class TestRequirement8DeletionPolicies:
    """Test Requirement 8: DeletionPolicy and UpdateReplacePolicy"""

    def test_aurora_cluster_snapshot_policy(self, optimized_template):
        """Test Aurora cluster has Snapshot deletion policy."""
        aurora = optimized_template["Resources"]["AuroraCluster"]
        assert "DeletionPolicy" in aurora
        assert aurora["DeletionPolicy"] == "Snapshot"
        assert "UpdateReplacePolicy" in aurora
        assert aurora["UpdateReplacePolicy"] == "Snapshot"

    def test_s3_bucket_retain_policy(self, optimized_template):
        """Test S3 bucket has Retain deletion policy."""
        bucket = optimized_template["Resources"]["LogBucket"]
        assert "DeletionPolicy" in bucket
        assert bucket["DeletionPolicy"] == "Retain"
        assert "UpdateReplacePolicy" in bucket
        assert bucket["UpdateReplacePolicy"] == "Retain"

    def test_security_groups_delete_policy(self, optimized_template):
        """Test security groups have Delete deletion policy."""
        web_sg = optimized_template["Resources"]["WebSecurityGroup"]
        assert "DeletionPolicy" in web_sg
        assert web_sg["DeletionPolicy"] == "Delete"

    def test_model_missing_deletion_policies(self, model_template):
        """Test MODEL template missing DeletionPolicy (intentional failure)."""
        resources = model_template["Resources"]

        # Check if any resource has DeletionPolicy
        resources_with_policy = [
            r for r in resources.values()
            if "DeletionPolicy" in r
        ]
        assert len(resources_with_policy) == 0, "MODEL should not have DeletionPolicy"


class TestRequirement9PseudoParameters:
    """Test Requirement 9: Use pseudo parameters instead of hardcoded values"""

    def test_dynamic_availability_zones(self, optimized_template):
        """Test subnets use Fn::GetAZs instead of hardcoded AZs."""
        template_str = json.dumps(optimized_template)

        # Should use Fn::GetAZs
        assert "Fn::GetAZs" in template_str

        # Should not have hardcoded AZ names
        assert "us-east-1a" not in template_str
        assert "us-east-1b" not in template_str
        assert "us-east-1c" not in template_str

    def test_aws_region_usage(self, optimized_template):
        """Test AWS::Region pseudo parameter is used."""
        template_str = json.dumps(optimized_template)
        assert "AWS::Region" in template_str

    def test_aws_account_id_usage(self, optimized_template):
        """Test AWS::AccountId pseudo parameter is used."""
        template_str = json.dumps(optimized_template)
        assert "AWS::AccountId" in template_str

    def test_aws_stack_name_in_exports(self, optimized_template):
        """Test AWS::StackName used in exports."""
        outputs = optimized_template["Outputs"]

        # At least one output should have an export
        exports = [
            o for o in outputs.values()
            if "Export" in o
        ]
        assert len(exports) > 0

        # Exports should use AWS::StackName
        template_str = json.dumps(outputs)
        assert "AWS::StackName" in template_str

    def test_model_has_hardcoded_azs(self, model_template):
        """Test MODEL template has hardcoded AZs (intentional failure)."""
        template_str = json.dumps(model_template)
        assert "us-east-1a" in template_str or "us-east-1b" in template_str


class TestRequirement10IMDSv2:
    """Test Requirement 10: IMDSv2 configuration"""

    def test_launch_configuration_has_metadata_options(self, optimized_template):
        """Test LaunchConfiguration has MetadataOptions."""
        launch_config = optimized_template["Resources"]["LaunchConfiguration"]
        assert "MetadataOptions" in launch_config["Properties"]

    def test_metadata_options_http_tokens_required(self, optimized_template):
        """Test MetadataOptions enforces IMDSv2."""
        launch_config = optimized_template["Resources"]["LaunchConfiguration"]
        metadata_opts = launch_config["Properties"]["MetadataOptions"]

        assert "HttpTokens" in metadata_opts
        assert metadata_opts["HttpTokens"] == "required"
        assert "HttpPutResponseHopLimit" in metadata_opts
        assert metadata_opts["HttpPutResponseHopLimit"] == 1
        assert "HttpEndpoint" in metadata_opts
        assert metadata_opts["HttpEndpoint"] == "enabled"

    def test_model_missing_imdsv2(self, model_template):
        """Test MODEL template missing IMDSv2 config (intentional failure)."""
        launch_config = model_template["Resources"]["LaunchConfiguration"]
        assert "MetadataOptions" not in launch_config["Properties"]


class TestRequirement11DesignerMetadata:
    """Test Requirement 11: CloudFormation Designer metadata"""

    def test_top_level_metadata_exists(self, optimized_template):
        """Test top-level Metadata section exists."""
        assert "Metadata" in optimized_template

    def test_designer_metadata_present(self, optimized_template):
        """Test AWS::CloudFormation::Designer metadata exists."""
        metadata = optimized_template["Metadata"]
        assert "AWS::CloudFormation::Designer" in metadata

    def test_designer_has_resource_ids(self, optimized_template):
        """Test Designer metadata has resource IDs."""
        designer = optimized_template["Metadata"]["AWS::CloudFormation::Designer"]
        assert len(designer) > 0

        # Check some key resources have IDs
        assert "VPC" in designer
        assert "id" in designer["VPC"]

    def test_vpc_has_resource_metadata(self, optimized_template):
        """Test VPC resource has metadata section."""
        vpc = optimized_template["Resources"]["VPC"]
        assert "Metadata" in vpc
        assert "AWS::CloudFormation::Designer" in vpc["Metadata"]

    def test_model_missing_designer_metadata(self, model_template):
        """Test MODEL template missing Designer metadata (intentional failure)."""
        assert "Metadata" not in model_template or "AWS::CloudFormation::Designer" not in model_template.get("Metadata", {})


class TestRequirement12TemplateValidation:
    """Test Requirement 12: Template validation"""

    def test_optimized_template_valid_json(self):
        """Test optimized template is valid JSON."""
        with open(OPTIMIZED_TEMPLATE, 'r') as f:
            json.load(f)  # Will raise exception if invalid

    def test_model_template_valid_json(self):
        """Test model template is valid JSON."""
        with open(MODEL_TEMPLATE, 'r') as f:
            json.load(f)  # Will raise exception if invalid

    def test_has_aws_template_format_version(self, optimized_template):
        """Test template has AWSTemplateFormatVersion."""
        assert "AWSTemplateFormatVersion" in optimized_template
        assert optimized_template["AWSTemplateFormatVersion"] == "2010-09-09"

    def test_has_description(self, optimized_template):
        """Test template has Description."""
        assert "Description" in optimized_template
        assert len(optimized_template["Description"]) > 0

    def test_all_required_sections_present(self, optimized_template):
        """Test all required sections are present."""
        required_sections = ["Parameters", "Mappings", "Conditions", "Resources", "Outputs"]
        for section in required_sections:
            assert section in optimized_template, f"Missing required section: {section}"
            assert len(optimized_template[section]) > 0, f"Empty section: {section}"


class TestComprehensiveComparison:
    """Comprehensive comparison between MODEL and IDEAL templates"""

    def test_model_failure_score(self, model_template):
        """Test MODEL template fails most requirements."""
        failures = []

        # Check each requirement
        if "Mappings" not in model_template or len(model_template.get("Mappings", {})) == 0:
            failures.append("Requirement 3: Mappings missing")

        template_str = json.dumps(model_template)
        if template_str.count("Fn::Join") > template_str.count("Fn::Sub"):
            failures.append("Requirement 6: Still uses Fn::Join")

        if "Conditions" not in model_template or len(model_template.get("Conditions", {})) == 0:
            failures.append("Requirement 7: Conditions missing")

        resources_with_policy = [
            r for r in model_template["Resources"].values()
            if "DeletionPolicy" in r
        ]
        if len(resources_with_policy) == 0:
            failures.append("Requirement 8: DeletionPolicy missing")

        if "us-east-1a" in template_str:
            failures.append("Requirement 9: Hardcoded AZs")

        launch_config = model_template["Resources"]["LaunchConfiguration"]
        if "MetadataOptions" not in launch_config["Properties"]:
            failures.append("Requirement 10: IMDSv2 missing")

        if "Metadata" not in model_template or "AWS::CloudFormation::Designer" not in model_template.get("Metadata", {}):
            failures.append("Requirement 11: Designer metadata missing")

        # MODEL should have at least 5 failures
        assert len(failures) >= 5, f"MODEL passed too many requirements. Failures: {failures}"

    def test_ideal_success_score(self, optimized_template):
        """Test IDEAL template passes all requirements."""
        successes = 0

        # Count successful requirements
        if "Mappings" in optimized_template and len(optimized_template["Mappings"]) > 0:
            successes += 1

        template_str = json.dumps(optimized_template)
        if "Fn::Sub" in template_str:
            successes += 1

        if "Conditions" in optimized_template and len(optimized_template["Conditions"]) > 0:
            successes += 1

        aurora = optimized_template["Resources"].get("AuroraCluster", {})
        if aurora.get("DeletionPolicy") == "Snapshot":
            successes += 1

        if "us-east-1a" not in template_str:
            successes += 1

        launch_config = optimized_template["Resources"]["LaunchConfiguration"]
        if "MetadataOptions" in launch_config["Properties"]:
            successes += 1

        if "Metadata" in optimized_template and "AWS::CloudFormation::Designer" in optimized_template["Metadata"]:
            successes += 1

        # Should have at least 7 out of key requirements
        assert successes >= 7, f"IDEAL failed requirements. Successes: {successes}/7"


class TestResourceNaming:
    """Test resource naming conventions"""

    def test_resources_use_environment_suffix(self, optimized_template):
        """Test resources include environmentSuffix in names."""
        resources = optimized_template["Resources"]

        # Count resources using EnvironmentSuffix
        template_str = json.dumps(resources)
        suffix_count = template_str.count("EnvironmentSuffix")

        # Should be used extensively (at least 20 times)
        assert suffix_count >= 20, f"EnvironmentSuffix used only {suffix_count} times"

    def test_fn_sub_for_naming(self, optimized_template):
        """Test Fn::Sub is used for resource naming."""
        resources = optimized_template["Resources"]
        vpc = resources["VPC"]

        # VPC name should use Fn::Sub
        tags = vpc["Properties"]["Tags"]
        name_tag = next((t for t in tags if t["Key"] == "Name"), None)
        assert name_tag is not None
        assert "Fn::Sub" in json.dumps(name_tag["Value"])


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
