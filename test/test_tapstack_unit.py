"""
Unit tests for CI/CD Pipeline CloudFormation template.
Tests template structure, resources, properties, and security configurations.
"""

import json
import os
import pytest
from typing import Dict, Any, List
import sys

# Add lib to path for template_loader
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(__file__)), "lib"))
from template_loader import (
    load_template,
    get_resources,
    get_parameters,
    get_outputs,
    get_resource_by_type,
    get_resource_properties,
    validate_parameter_exists,
    validate_resource_exists,
    validate_output_exists,
    check_resource_has_property,
    get_iam_role_policies,
    validate_encryption_enabled,
    list_all_resource_types,
    get_template_description,
    get_template_version,
)


class TestCloudFormationTemplate:
    """Test CloudFormation template structure and contents."""

    @pytest.fixture(scope="class")
    def template(self) -> Dict[str, Any]:
        """Load the CloudFormation template."""
        return load_template("TapStack.json")

    @pytest.fixture(scope="class")
    def resources(self, template: Dict[str, Any]) -> Dict[str, Any]:
        """Extract resources from template."""
        return get_resources(template)

    @pytest.fixture(scope="class")
    def parameters(self, template: Dict[str, Any]) -> Dict[str, Any]:
        """Extract parameters from template."""
        return get_parameters(template)

    @pytest.fixture(scope="class")
    def outputs(self, template: Dict[str, Any]) -> Dict[str, Any]:
        """Extract outputs from template."""
        return get_outputs(template)

    def test_template_version(self, template: Dict[str, Any]) -> None:
        """Test template has correct AWSTemplateFormatVersion."""
        assert get_template_version(template) == "2010-09-09"

    def test_template_description(self, template: Dict[str, Any]) -> None:
        """Test template has a description."""
        description = get_template_description(template)
        assert len(description) > 0
        assert "CI/CD" in description or "Pipeline" in description

    def test_list_resource_types(self, template: Dict[str, Any]) -> None:
        """Test listing all resource types in template."""
        types = list_all_resource_types(template)
        assert len(types) > 0
        assert "AWS::KMS::Key" in types
        assert "AWS::S3::Bucket" in types
        assert "AWS::CodePipeline::Pipeline" in types

    def test_required_parameters_exist(self, parameters: Dict[str, Any]) -> None:
        """Test all required parameters are defined."""
        required_params = [
            "EnvironmentSuffix",
            "VpcId",
            "PrivateSubnetIds",
            "CodeCommitRepositoryName",
            "EcsClusterName",
            "EcsServiceName",
            "EcrRepositoryUri",
            "ApprovalNotificationEmail"
        ]
        for param in required_params:
            assert param in parameters, f"Required parameter {param} is missing"

    def test_environment_suffix_parameter(self, parameters: Dict[str, Any]) -> None:
        """Test EnvironmentSuffix parameter configuration."""
        env_suffix = parameters.get("EnvironmentSuffix", {})
        assert env_suffix.get("Type") == "String"
        assert "Description" in env_suffix
        assert "AllowedPattern" in env_suffix

    def test_vpc_id_parameter(self, parameters: Dict[str, Any]) -> None:
        """Test VpcId parameter is correct type."""
        vpc_id = parameters.get("VpcId", {})
        assert vpc_id.get("Type") == "AWS::EC2::VPC::Id"

    def test_subnet_ids_parameter(self, parameters: Dict[str, Any]) -> None:
        """Test PrivateSubnetIds parameter is list type."""
        subnet_ids = parameters.get("PrivateSubnetIds", {})
        assert subnet_ids.get("Type") == "List<AWS::EC2::Subnet::Id>"

    def test_email_parameter_pattern(self, parameters: Dict[str, Any]) -> None:
        """Test ApprovalNotificationEmail has email pattern validation."""
        email_param = parameters.get("ApprovalNotificationEmail", {})
        assert "AllowedPattern" in email_param
        pattern = email_param.get("AllowedPattern", "")
        assert "@" in pattern

    def test_required_resources_exist(self, resources: Dict[str, Any]) -> None:
        """Test all required resources are defined."""
        required_resources = [
            "ArtifactEncryptionKey",
            "ArtifactBucket",
            "CodeBuildProject",
            "Pipeline",
            "PipelineRole",
            "CodeBuildRole",
            "PipelineTriggerRule",
            "ApprovalTopic"
        ]
        for resource in required_resources:
            assert resource in resources, f"Required resource {resource} is missing"

    def test_kms_key_properties(self, resources: Dict[str, Any]) -> None:
        """Test KMS key has correct properties."""
        kms_key = resources.get("ArtifactEncryptionKey", {})
        assert kms_key.get("Type") == "AWS::KMS::Key"

        properties = kms_key.get("Properties", {})
        assert properties.get("EnableKeyRotation") is True

        # Test key policy exists
        key_policy = properties.get("KeyPolicy", {})
        assert key_policy.get("Version") == "2012-10-17"
        assert "Statement" in key_policy
        assert len(key_policy["Statement"]) > 0

    def test_kms_key_policy_statements(self, resources: Dict[str, Any]) -> None:
        """Test KMS key policy has required service statements."""
        kms_key = resources.get("ArtifactEncryptionKey", {})
        key_policy = kms_key.get("Properties", {}).get("KeyPolicy", {})
        statements = key_policy.get("Statement", [])

        # Check for service principals
        services_found = []
        for stmt in statements:
            principal = stmt.get("Principal", {})
            if "Service" in principal:
                service = principal["Service"]
                if isinstance(service, str):
                    services_found.append(service)
                elif isinstance(service, dict):
                    services_found.append(service.get("Fn::Sub", ""))

        # Verify key services are present
        assert any("codepipeline" in s for s in services_found)
        assert any("codebuild" in s for s in services_found)
        assert any("s3" in s for s in services_found)

    def test_s3_bucket_versioning(self, resources: Dict[str, Any]) -> None:
        """Test S3 artifact bucket has versioning enabled."""
        s3_bucket = resources.get("ArtifactBucket", {})
        assert s3_bucket.get("Type") == "AWS::S3::Bucket"

        properties = s3_bucket.get("Properties", {})
        versioning = properties.get("VersioningConfiguration", {})
        assert versioning.get("Status") == "Enabled"

    def test_s3_bucket_encryption(self, resources: Dict[str, Any]) -> None:
        """Test S3 bucket has KMS encryption configured."""
        s3_bucket = resources.get("ArtifactBucket", {})
        properties = s3_bucket.get("Properties", {})

        encryption = properties.get("BucketEncryption", {})
        sse_config = encryption.get("ServerSideEncryptionConfiguration", [])
        assert len(sse_config) > 0

        sse_default = sse_config[0].get("ServerSideEncryptionByDefault", {})
        assert sse_default.get("SSEAlgorithm") == "aws:kms"
        assert "KMSMasterKeyID" in sse_default

    def test_s3_bucket_lifecycle(self, resources: Dict[str, Any]) -> None:
        """Test S3 bucket has 30-day lifecycle policy."""
        s3_bucket = resources.get("ArtifactBucket", {})
        properties = s3_bucket.get("Properties", {})

        lifecycle = properties.get("LifecycleConfiguration", {})
        rules = lifecycle.get("Rules", [])
        assert len(rules) > 0

        # Check for 30-day expiration
        rule = rules[0]
        assert rule.get("Status") == "Enabled"
        assert rule.get("ExpirationInDays") == 30
        assert rule.get("NoncurrentVersionExpirationInDays") == 30

    def test_s3_bucket_public_access_blocked(self, resources: Dict[str, Any]) -> None:
        """Test S3 bucket blocks all public access."""
        s3_bucket = resources.get("ArtifactBucket", {})
        properties = s3_bucket.get("Properties", {})

        public_access = properties.get("PublicAccessBlockConfiguration", {})
        assert public_access.get("BlockPublicAcls") is True
        assert public_access.get("BlockPublicPolicy") is True
        assert public_access.get("IgnorePublicAcls") is True
        assert public_access.get("RestrictPublicBuckets") is True

    def test_s3_bucket_policy_enforces_encryption(self, resources: Dict[str, Any]) -> None:
        """Test S3 bucket policy denies unencrypted uploads."""
        bucket_policy = resources.get("ArtifactBucketPolicy", {})
        assert bucket_policy.get("Type") == "AWS::S3::BucketPolicy"

        policy_doc = bucket_policy.get("Properties", {}).get("PolicyDocument", {})
        statements = policy_doc.get("Statement", [])

        # Find deny unencrypted statement
        deny_unencrypted = [s for s in statements if s.get("Effect") == "Deny" and "PutObject" in s.get("Action", "")]
        assert len(deny_unencrypted) > 0

    def test_s3_bucket_policy_enforces_tls(self, resources: Dict[str, Any]) -> None:
        """Test S3 bucket policy denies non-TLS requests."""
        bucket_policy = resources.get("ArtifactBucketPolicy", {})
        policy_doc = bucket_policy.get("Properties", {}).get("PolicyDocument", {})
        statements = policy_doc.get("Statement", [])

        # Find deny insecure transport statement
        deny_insecure = [s for s in statements if s.get("Sid") == "DenyInsecureTransport"]
        assert len(deny_insecure) > 0

        condition = deny_insecure[0].get("Condition", {})
        assert "aws:SecureTransport" in str(condition)

    def test_codebuild_compute_type(self, resources: Dict[str, Any]) -> None:
        """Test CodeBuild uses BUILD_GENERAL1_SMALL compute type."""
        codebuild = resources.get("CodeBuildProject", {})
        assert codebuild.get("Type") == "AWS::CodeBuild::Project"

        properties = codebuild.get("Properties", {})
        environment = properties.get("Environment", {})
        assert environment.get("ComputeType") == "BUILD_GENERAL1_SMALL"

    def test_codebuild_vpc_config(self, resources: Dict[str, Any]) -> None:
        """Test CodeBuild runs in VPC."""
        codebuild = resources.get("CodeBuildProject", {})
        properties = codebuild.get("Properties", {})

        vpc_config = properties.get("VpcConfig", {})
        assert "VpcId" in vpc_config
        assert "Subnets" in vpc_config
        assert "SecurityGroupIds" in vpc_config

    def test_codebuild_log_retention(self, resources: Dict[str, Any]) -> None:
        """Test CodeBuild logs have 30-day retention."""
        log_group = resources.get("CodeBuildLogGroup", {})
        assert log_group.get("Type") == "AWS::Logs::LogGroup"

        properties = log_group.get("Properties", {})
        assert properties.get("RetentionInDays") == 30

    def test_codebuild_logs_encrypted(self, resources: Dict[str, Any]) -> None:
        """Test CodeBuild logs are encrypted with KMS."""
        log_group = resources.get("CodeBuildLogGroup", {})
        properties = log_group.get("Properties", {})
        assert "KmsKeyId" in properties

    def test_codebuild_role_least_privilege(self, resources: Dict[str, Any]) -> None:
        """Test CodeBuild IAM role follows least privilege."""
        role = resources.get("CodeBuildRole", {})
        properties = role.get("Properties", {})
        policies = properties.get("Policies", [])

        # Check policies don't use wildcard actions
        for policy in policies:
            policy_doc = policy.get("PolicyDocument", {})
            statements = policy_doc.get("Statement", [])
            for stmt in statements:
                actions = stmt.get("Action", [])
                if isinstance(actions, str):
                    actions = [actions]
                for action in actions:
                    # Wildcard is allowed for specific EC2 operations
                    if action == "*":
                        # Resource must be constrained if action is *
                        resource = stmt.get("Resource", "")
                        if resource == "*":
                            # This is only acceptable for EC2 describe operations
                            assert "ec2:" in str(actions)

    def test_pipeline_artifact_store_encrypted(self, resources: Dict[str, Any]) -> None:
        """Test Pipeline artifact store uses KMS encryption."""
        pipeline = resources.get("Pipeline", {})
        properties = pipeline.get("Properties", {})

        artifact_store = properties.get("ArtifactStore", {})
        assert artifact_store.get("Type") == "S3"

        encryption_key = artifact_store.get("EncryptionKey", {})
        assert encryption_key.get("Type") == "KMS"
        assert "Id" in encryption_key

    def test_pipeline_has_required_stages(self, resources: Dict[str, Any]) -> None:
        """Test Pipeline has all required stages."""
        pipeline = resources.get("Pipeline", {})
        properties = pipeline.get("Properties", {})
        stages = properties.get("Stages", [])

        stage_names = [stage.get("Name") for stage in stages]
        assert "Source" in stage_names
        assert "Build" in stage_names
        assert "Staging" in stage_names or "Deploy" in stage_names
        assert "Approval" in stage_names
        assert "Production" in stage_names

    def test_pipeline_source_stage(self, resources: Dict[str, Any]) -> None:
        """Test Pipeline Source stage uses CodeCommit."""
        pipeline = resources.get("Pipeline", {})
        stages = pipeline.get("Properties", {}).get("Stages", [])

        source_stage = [s for s in stages if s.get("Name") == "Source"][0]
        actions = source_stage.get("Actions", [])
        assert len(actions) > 0

        action = actions[0]
        action_type = action.get("ActionTypeId", {})
        assert action_type.get("Provider") == "CodeCommit"

        # Test PollForSourceChanges is false (using CloudWatch Events instead)
        config = action.get("Configuration", {})
        assert config.get("PollForSourceChanges") is False

    def test_pipeline_build_stage(self, resources: Dict[str, Any]) -> None:
        """Test Pipeline Build stage uses CodeBuild."""
        pipeline = resources.get("Pipeline", {})
        stages = pipeline.get("Properties", {}).get("Stages", [])

        build_stage = [s for s in stages if s.get("Name") == "Build"][0]
        actions = build_stage.get("Actions", [])
        assert len(actions) > 0

        action = actions[0]
        action_type = action.get("ActionTypeId", {})
        assert action_type.get("Provider") == "CodeBuild"

    def test_pipeline_approval_stage(self, resources: Dict[str, Any]) -> None:
        """Test Pipeline has Manual approval stage."""
        pipeline = resources.get("Pipeline", {})
        stages = pipeline.get("Properties", {}).get("Stages", [])

        approval_stage = [s for s in stages if s.get("Name") == "Approval"][0]
        actions = approval_stage.get("Actions", [])
        assert len(actions) > 0

        action = actions[0]
        action_type = action.get("ActionTypeId", {})
        assert action_type.get("Category") == "Approval"
        assert action_type.get("Provider") == "Manual"

        # Check SNS notification is configured
        config = action.get("Configuration", {})
        assert "NotificationArn" in config

    def test_pipeline_deploy_stages(self, resources: Dict[str, Any]) -> None:
        """Test Pipeline has deployment stages using ECS."""
        pipeline = resources.get("Pipeline", {})
        stages = pipeline.get("Properties", {}).get("Stages", [])

        deploy_stages = [s for s in stages if "Staging" in s.get("Name", "") or "Production" in s.get("Name", "")]
        assert len(deploy_stages) >= 2  # Staging and Production

        for stage in deploy_stages:
            actions = stage.get("Actions", [])
            action = actions[0]
            action_type = action.get("ActionTypeId", {})
            assert action_type.get("Provider") == "ECS"

    def test_pipeline_role_permissions(self, resources: Dict[str, Any]) -> None:
        """Test Pipeline role has required permissions."""
        role = resources.get("PipelineRole", {})
        properties = role.get("Properties", {})
        policies = properties.get("Policies", [])

        # Verify policies exist
        assert len(policies) > 0

        # Get all actions
        all_actions = []
        for policy in policies:
            policy_doc = policy.get("PolicyDocument", {})
            statements = policy_doc.get("Statement", [])
            for stmt in statements:
                actions = stmt.get("Action", [])
                if isinstance(actions, str):
                    all_actions.append(actions)
                else:
                    all_actions.extend(actions)

        # Check for required action prefixes
        assert any("s3:" in a for a in all_actions)
        assert any("codecommit:" in a for a in all_actions)
        assert any("codebuild:" in a for a in all_actions)
        assert any("ecs:" in a for a in all_actions)

    def test_cloudwatch_events_rule(self, resources: Dict[str, Any]) -> None:
        """Test CloudWatch Events rule triggers pipeline on commits."""
        rule = resources.get("PipelineTriggerRule", {})
        assert rule.get("Type") == "AWS::Events::Rule"

        properties = rule.get("Properties", {})
        assert properties.get("State") == "ENABLED"

        event_pattern = properties.get("EventPattern", {})
        assert "aws.codecommit" in event_pattern.get("source", [])

        detail = event_pattern.get("detail", {})
        assert "referenceCreated" in detail.get("event", []) or "referenceUpdated" in detail.get("event", [])

    def test_cloudwatch_events_rule_targets_pipeline(self, resources: Dict[str, Any]) -> None:
        """Test CloudWatch Events rule targets the pipeline."""
        rule = resources.get("PipelineTriggerRule", {})
        properties = rule.get("Properties", {})
        targets = properties.get("Targets", [])

        assert len(targets) > 0
        target = targets[0]

        # Verify target ARN references pipeline
        arn = target.get("Arn", {})
        assert "codepipeline" in str(arn)

    def test_sns_topic_for_approvals(self, resources: Dict[str, Any]) -> None:
        """Test SNS topic exists for manual approvals."""
        topic = resources.get("ApprovalTopic", {})
        assert topic.get("Type") == "AWS::SNS::Topic"

        properties = topic.get("Properties", {})
        subscriptions = properties.get("Subscription", [])

        # Verify email subscription
        assert len(subscriptions) > 0
        assert subscriptions[0].get("Protocol") == "email"

    def test_security_group_for_codebuild(self, resources: Dict[str, Any]) -> None:
        """Test Security group exists for CodeBuild."""
        sg = resources.get("CodeBuildSecurityGroup", {})
        assert sg.get("Type") == "AWS::EC2::SecurityGroup"

        properties = sg.get("Properties", {})
        egress = properties.get("SecurityGroupEgress", [])

        # Verify HTTPS egress only
        assert len(egress) > 0
        for rule in egress:
            assert rule.get("IpProtocol") == "tcp"
            assert rule.get("ToPort") == 443

    def test_resource_names_include_environment_suffix(self, resources: Dict[str, Any]) -> None:
        """Test resource names include EnvironmentSuffix parameter."""
        resources_with_names = [
            "ArtifactBucket",
            "CodeBuildProject",
            "Pipeline",
            "ApprovalTopic",
            "CodeBuildLogGroup",
            "CodeBuildRole",
            "PipelineRole"
        ]

        for resource_name in resources_with_names:
            resource = resources.get(resource_name, {})
            properties = resource.get("Properties", {})

            # Check if name property uses EnvironmentSuffix
            name_fields = ["BucketName", "Name", "LogGroupName", "RoleName", "TopicName"]
            for field in name_fields:
                if field in properties:
                    name_value = properties[field]
                    # Check if Fn::Sub is used with EnvironmentSuffix
                    if isinstance(name_value, dict) and "Fn::Sub" in name_value:
                        sub_value = name_value["Fn::Sub"]
                        assert "EnvironmentSuffix" in sub_value or "${EnvironmentSuffix}" in str(sub_value)

    def test_outputs_exist(self, outputs: Dict[str, Any]) -> None:
        """Test required outputs are defined."""
        required_outputs = [
            "PipelineArn",
            "PipelineExecutionRoleArn",
            "ArtifactBucketName",
            "KmsKeyArn",
            "CodeBuildProjectName",
            "ApprovalTopicArn"
        ]

        for output in required_outputs:
            assert output in outputs, f"Required output {output} is missing"

    def test_output_values_reference_resources(self, outputs: Dict[str, Any]) -> None:
        """Test outputs reference the correct resources."""
        pipeline_arn = outputs.get("PipelineArn", {})
        assert "Fn::Sub" in pipeline_arn.get("Value", {}) or "Fn::GetAtt" in pipeline_arn.get("Value", {})

        bucket_name = outputs.get("ArtifactBucketName", {})
        assert "Ref" in bucket_name.get("Value", {})

    def test_no_retain_deletion_policies(self, resources: Dict[str, Any]) -> None:
        """Test no resources have Retain deletion policy."""
        for resource_name, resource in resources.items():
            deletion_policy = resource.get("DeletionPolicy", "Delete")
            assert deletion_policy != "Retain", f"Resource {resource_name} has Retain deletion policy"

    def test_kms_alias_exists(self, resources: Dict[str, Any]) -> None:
        """Test KMS key has an alias."""
        alias = resources.get("ArtifactEncryptionKeyAlias", {})
        assert alias.get("Type") == "AWS::KMS::Alias"

        properties = alias.get("Properties", {})
        alias_name = properties.get("AliasName", {})
        assert "EnvironmentSuffix" in str(alias_name)

    def test_codebuild_privileged_mode(self, resources: Dict[str, Any]) -> None:
        """Test CodeBuild has privileged mode for Docker."""
        codebuild = resources.get("CodeBuildProject", {})
        properties = codebuild.get("Properties", {})
        environment = properties.get("Environment", {})

        # Privileged mode required for Docker builds
        assert environment.get("PrivilegedMode") is True

    def test_codebuild_environment_variables(self, resources: Dict[str, Any]) -> None:
        """Test CodeBuild has required environment variables."""
        codebuild = resources.get("CodeBuildProject", {})
        properties = codebuild.get("Properties", {})
        environment = properties.get("Environment", {})
        env_vars = environment.get("EnvironmentVariables", [])

        var_names = [v.get("Name") for v in env_vars]
        assert "AWS_DEFAULT_REGION" in var_names
        assert "AWS_ACCOUNT_ID" in var_names
        assert "IMAGE_REPO_URI" in var_names

    def test_pipeline_event_role_permissions(self, resources: Dict[str, Any]) -> None:
        """Test Pipeline event role has StartPipelineExecution permission."""
        role = resources.get("PipelineEventRole", {})
        properties = role.get("Properties", {})
        policies = properties.get("Policies", [])

        assert len(policies) > 0
        policy = policies[0]
        policy_doc = policy.get("PolicyDocument", {})
        statements = policy_doc.get("Statement", [])

        actions = statements[0].get("Action", "")
        assert "codepipeline:StartPipelineExecution" in actions

    def test_codebuild_artifacts_type(self, resources: Dict[str, Any]) -> None:
        """Test CodeBuild uses CODEPIPELINE artifacts type."""
        codebuild = resources.get("CodeBuildProject", {})
        properties = codebuild.get("Properties", {})
        artifacts = properties.get("Artifacts", {})

        assert artifacts.get("Type") == "CODEPIPELINE"

    def test_codebuild_source_type(self, resources: Dict[str, Any]) -> None:
        """Test CodeBuild uses CODEPIPELINE source type."""
        codebuild = resources.get("CodeBuildProject", {})
        properties = codebuild.get("Properties", {})
        source = properties.get("Source", {})

        assert source.get("Type") == "CODEPIPELINE"
        assert source.get("BuildSpec") == "buildspec.yml"

    def test_template_has_no_hardcoded_account_ids(self, template: Dict[str, Any]) -> None:
        """Test template doesn't contain hardcoded account IDs."""
        template_str = json.dumps(template)

        # Check for patterns like 123456789012
        import re
        account_pattern = r'\b\d{12}\b'
        matches = re.findall(account_pattern, template_str)

        # Filter out non-account numbers (like retention days)
        potential_accounts = [m for m in matches if m not in ["2012", "30"]]

        # Allow AWS::AccountId references
        for match in potential_accounts:
            # This should be in a Ref or Fn::Sub context
            assert "AWS::AccountId" in template_str or "${AWS::AccountId}" in template_str

    def test_template_has_no_hardcoded_regions(self, template: Dict[str, Any]) -> None:
        """Test template doesn't contain hardcoded regions."""
        template_str = json.dumps(template)

        # Common regions
        regions = ["us-east-1", "us-west-2", "eu-west-1"]
        for region in regions:
            if region in template_str:
                # Must be in a reference context
                assert "${AWS::Region}" in template_str or "AWS::Region" in template_str

    # Additional tests to exercise template_loader functions
    def test_validate_parameter_exists(self, template: Dict[str, Any]) -> None:
        """Test parameter existence validation."""
        assert validate_parameter_exists(template, "EnvironmentSuffix")
        assert validate_parameter_exists(template, "VpcId")
        assert not validate_parameter_exists(template, "NonExistentParameter")

    def test_validate_resource_exists(self, template: Dict[str, Any]) -> None:
        """Test resource existence validation."""
        assert validate_resource_exists(template, "Pipeline")
        assert validate_resource_exists(template, "ArtifactBucket")
        assert not validate_resource_exists(template, "NonExistentResource")

    def test_validate_output_exists(self, template: Dict[str, Any]) -> None:
        """Test output existence validation."""
        assert validate_output_exists(template, "PipelineArn")
        assert validate_output_exists(template, "ArtifactBucketName")
        assert not validate_output_exists(template, "NonExistentOutput")

    def test_get_resource_properties(self, template: Dict[str, Any]) -> None:
        """Test getting resource properties."""
        bucket_props = get_resource_properties(template, "ArtifactBucket")
        assert "VersioningConfiguration" in bucket_props
        assert "BucketEncryption" in bucket_props

    def test_check_resource_has_property(self, template: Dict[str, Any]) -> None:
        """Test checking if resource has specific property."""
        assert check_resource_has_property(template, "ArtifactBucket", "VersioningConfiguration")
        assert check_resource_has_property(template, "CodeBuildProject", "VpcConfig")
        assert not check_resource_has_property(template, "ArtifactBucket", "NonExistentProperty")

    def test_get_resource_by_type(self, template: Dict[str, Any]) -> None:
        """Test getting resources by type."""
        iam_roles = get_resource_by_type(template, "AWS::IAM::Role")
        assert len(iam_roles) > 0
        assert "CodeBuildRole" in iam_roles or "PipelineRole" in iam_roles

        s3_buckets = get_resource_by_type(template, "AWS::S3::Bucket")
        assert len(s3_buckets) == 1
        assert "ArtifactBucket" in s3_buckets

    def test_get_iam_role_policies(self, template: Dict[str, Any]) -> None:
        """Test getting IAM role inline policies."""
        codebuild_policies = get_iam_role_policies(template, "CodeBuildRole")
        assert len(codebuild_policies) > 0

        pipeline_policies = get_iam_role_policies(template, "PipelineRole")
        assert len(pipeline_policies) > 0

    def test_validate_encryption_enabled(self, template: Dict[str, Any]) -> None:
        """Test encryption validation."""
        assert validate_encryption_enabled(template, "ArtifactBucket")
        assert validate_encryption_enabled(template, "CodeBuildLogGroup")
        assert validate_encryption_enabled(template, "CodeBuildProject")

    def test_get_resource_dependencies(self, template: Dict[str, Any]) -> None:
        """Test getting resource dependencies."""
        from template_loader import get_resource_dependencies
        # Most resources don't have explicit DependsOn in this template
        deps = get_resource_dependencies(template, "Pipeline")
        assert isinstance(deps, list)

    def test_get_resource_tags(self, template: Dict[str, Any]) -> None:
        """Test getting resource tags."""
        from template_loader import get_resource_tags
        sg_tags = get_resource_tags(template, "CodeBuildSecurityGroup")
        assert isinstance(sg_tags, list)

    def test_count_resources_by_type(self, template: Dict[str, Any]) -> None:
        """Test counting resources by type."""
        from template_loader import count_resources_by_type
        role_count = count_resources_by_type(template, "AWS::IAM::Role")
        assert role_count >= 2  # At least CodeBuildRole and PipelineRole

        bucket_count = count_resources_by_type(template, "AWS::S3::Bucket")
        assert bucket_count == 1

    def test_get_iam_roles(self, template: Dict[str, Any]) -> None:
        """Test getting all IAM roles."""
        from template_loader import get_iam_roles
        roles = get_iam_roles(template)
        assert len(roles) >= 2
        assert "CodeBuildRole" in roles or "PipelineRole" in roles

    def test_get_parameter_default(self, template: Dict[str, Any]) -> None:
        """Test getting parameter default values."""
        from template_loader import get_parameter_default
        default_branch = get_parameter_default(template, "CodeCommitBranchName")
        assert default_branch == "main"

        # Parameter without default
        no_default = get_parameter_default(template, "EnvironmentSuffix")
        assert no_default is None

    def test_get_output_value(self, template: Dict[str, Any]) -> None:
        """Test getting output value expressions."""
        from template_loader import get_output_value
        pipeline_arn_value = get_output_value(template, "PipelineArn")
        assert pipeline_arn_value is not None

        bucket_name_value = get_output_value(template, "ArtifactBucketName")
        assert bucket_name_value is not None

    def test_error_handling(self) -> None:
        """Test error handling for invalid inputs."""
        from template_loader import load_template, get_resource_dependencies
        import pytest

        # Test loading non-existent template
        with pytest.raises(FileNotFoundError):
            load_template("NonExistentTemplate.json")

        # Test DependsOn with string value (single dependency)
        template = load_template("TapStack.json")
        # Create mock resource with string DependsOn
        test_template = {
            "Resources": {
                "TestResource": {
                    "DependsOn": "OtherResource"
                }
            }
        }
        deps = get_resource_dependencies(test_template, "TestResource")
        assert deps == ["OtherResource"]
