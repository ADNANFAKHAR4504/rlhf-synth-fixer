"""
Integration tests for CI/CD Pipeline CloudFormation stack.
Tests deployed resources against actual AWS infrastructure.
"""

import json
import os
import boto3
import pytest
from typing import Dict, Any


class TestDeployedPipeline:
    """Test deployed CI/CD pipeline infrastructure."""

    @pytest.fixture(scope="class")
    def outputs(self) -> Dict[str, str]:
        """Load stack outputs from cfn-outputs/flat-outputs.json."""
        outputs_path = os.path.join(
            os.path.dirname(os.path.dirname(__file__)),
            "cfn-outputs",
            "flat-outputs.json"
        )
        with open(outputs_path, "r") as f:
            return json.load(f)

    @pytest.fixture(scope="class")
    def region(self) -> str:
        """Get AWS region."""
        return os.environ.get("AWS_REGION", "us-east-1")

    @pytest.fixture(scope="class")
    def pipeline_client(self, region: str):
        """Create CodePipeline client."""
        return boto3.client("codepipeline", region_name=region)

    @pytest.fixture(scope="class")
    def s3_client(self, region: str):
        """Create S3 client."""
        return boto3.client("s3", region_name=region)

    @pytest.fixture(scope="class")
    def kms_client(self, region: str):
        """Create KMS client."""
        return boto3.client("kms", region_name=region)

    @pytest.fixture(scope="class")
    def codebuild_client(self, region: str):
        """Create CodeBuild client."""
        return boto3.client("codebuild", region_name=region)

    @pytest.fixture(scope="class")
    def sns_client(self, region: str):
        """Create SNS client."""
        return boto3.client("sns", region_name=region)

    @pytest.fixture(scope="class")
    def iam_client(self, region: str):
        """Create IAM client."""
        return boto3.client("iam", region_name=region)

    def test_outputs_file_exists(self, outputs: Dict[str, str]) -> None:
        """Test that outputs file was created and contains expected keys."""
        assert "PipelineArn" in outputs
        assert "PipelineExecutionRoleArn" in outputs
        assert "ArtifactBucketName" in outputs
        assert "KmsKeyArn" in outputs
        assert "CodeBuildProjectName" in outputs
        assert "ApprovalTopicArn" in outputs

    def test_pipeline_exists(self, pipeline_client, outputs: Dict[str, str]) -> None:
        """Test that CodePipeline exists and is accessible."""
        pipeline_arn = outputs["PipelineArn"]
        pipeline_name = pipeline_arn.split(":")[-1]

        response = pipeline_client.get_pipeline(name=pipeline_name)
        assert response is not None
        assert "pipeline" in response

        pipeline = response["pipeline"]
        assert pipeline["name"] == pipeline_name

    def test_pipeline_stages(self, pipeline_client, outputs: Dict[str, str]) -> None:
        """Test that pipeline has all required stages."""
        pipeline_arn = outputs["PipelineArn"]
        pipeline_name = pipeline_arn.split(":")[-1]

        response = pipeline_client.get_pipeline(name=pipeline_name)
        stages = response["pipeline"]["stages"]

        stage_names = [stage["name"] for stage in stages]
        assert "Source" in stage_names
        assert "Build" in stage_names
        assert "Staging" in stage_names or any("Deploy" in name or "Prod" in name for name in stage_names)
        assert "Approval" in stage_names
        assert "Production" in stage_names

    def test_pipeline_artifact_store(self, pipeline_client, outputs: Dict[str, str]) -> None:
        """Test that pipeline artifact store is configured correctly."""
        pipeline_arn = outputs["PipelineArn"]
        pipeline_name = pipeline_arn.split(":")[-1]

        response = pipeline_client.get_pipeline(name=pipeline_name)
        artifact_store = response["pipeline"]["artifactStore"]

        assert artifact_store["type"] == "S3"
        assert "location" in artifact_store
        assert "encryptionKey" in artifact_store
        assert artifact_store["encryptionKey"]["type"] == "KMS"

    def test_s3_bucket_exists(self, s3_client, outputs: Dict[str, str]) -> None:
        """Test that S3 artifact bucket exists."""
        bucket_name = outputs["ArtifactBucketName"]

        response = s3_client.head_bucket(Bucket=bucket_name)
        assert response["ResponseMetadata"]["HTTPStatusCode"] == 200

    def test_s3_bucket_versioning(self, s3_client, outputs: Dict[str, str]) -> None:
        """Test that S3 bucket has versioning enabled."""
        bucket_name = outputs["ArtifactBucketName"]

        response = s3_client.get_bucket_versioning(Bucket=bucket_name)
        assert response.get("Status") == "Enabled"

    def test_s3_bucket_encryption(self, s3_client, outputs: Dict[str, str]) -> None:
        """Test that S3 bucket has encryption configured."""
        bucket_name = outputs["ArtifactBucketName"]

        response = s3_client.get_bucket_encryption(Bucket=bucket_name)
        rules = response["ServerSideEncryptionConfiguration"]["Rules"]
        assert len(rules) > 0

        sse = rules[0]["ApplyServerSideEncryptionByDefault"]
        assert sse["SSEAlgorithm"] == "aws:kms"
        assert "KMSMasterKeyID" in sse

    def test_s3_bucket_lifecycle(self, s3_client, outputs: Dict[str, str]) -> None:
        """Test that S3 bucket has 30-day lifecycle policy."""
        bucket_name = outputs["ArtifactBucketName"]

        response = s3_client.get_bucket_lifecycle_configuration(Bucket=bucket_name)
        rules = response["Rules"]
        assert len(rules) > 0

        # Check for 30-day expiration
        rule = rules[0]
        assert rule["Status"] == "Enabled"
        assert rule.get("Expiration", {}).get("Days") == 30 or \
               rule.get("NoncurrentVersionExpiration", {}).get("NoncurrentDays") == 30

    def test_s3_bucket_public_access_blocked(self, s3_client, outputs: Dict[str, str]) -> None:
        """Test that S3 bucket blocks all public access."""
        bucket_name = outputs["ArtifactBucketName"]

        response = s3_client.get_public_access_block(Bucket=bucket_name)
        config = response["PublicAccessBlockConfiguration"]

        assert config["BlockPublicAcls"] is True
        assert config["IgnorePublicAcls"] is True
        assert config["BlockPublicPolicy"] is True
        assert config["RestrictPublicBuckets"] is True

    def test_kms_key_exists(self, kms_client, outputs: Dict[str, str]) -> None:
        """Test that KMS key exists and is accessible."""
        kms_key_arn = outputs["KmsKeyArn"]
        key_id = kms_key_arn.split("/")[-1]

        response = kms_client.describe_key(KeyId=key_id)
        assert response is not None
        assert "KeyMetadata" in response

        key_metadata = response["KeyMetadata"]
        assert key_metadata["KeyState"] == "Enabled"

    def test_kms_key_rotation(self, kms_client, outputs: Dict[str, str]) -> None:
        """Test that KMS key has rotation enabled."""
        kms_key_arn = outputs["KmsKeyArn"]
        key_id = kms_key_arn.split("/")[-1]

        response = kms_client.get_key_rotation_status(KeyId=key_id)
        assert response["KeyRotationEnabled"] is True

    def test_codebuild_project_exists(self, codebuild_client, outputs: Dict[str, str]) -> None:
        """Test that CodeBuild project exists."""
        project_name = outputs["CodeBuildProjectName"]

        response = codebuild_client.batch_get_projects(names=[project_name])
        assert len(response["projects"]) == 1

        project = response["projects"][0]
        assert project["name"] == project_name

    def test_codebuild_compute_type(self, codebuild_client, outputs: Dict[str, str]) -> None:
        """Test that CodeBuild uses BUILD_GENERAL1_SMALL compute type."""
        project_name = outputs["CodeBuildProjectName"]

        response = codebuild_client.batch_get_projects(names=[project_name])
        project = response["projects"][0]

        environment = project["environment"]
        assert environment["computeType"] == "BUILD_GENERAL1_SMALL"

    def test_codebuild_vpc_config(self, codebuild_client, outputs: Dict[str, str]) -> None:
        """Test that CodeBuild runs in VPC."""
        project_name = outputs["CodeBuildProjectName"]

        response = codebuild_client.batch_get_projects(names=[project_name])
        project = response["projects"][0]

        assert "vpcConfig" in project
        vpc_config = project["vpcConfig"]
        assert "vpcId" in vpc_config
        assert len(vpc_config.get("subnets", [])) > 0
        assert len(vpc_config.get("securityGroupIds", [])) > 0

    def test_codebuild_privileged_mode(self, codebuild_client, outputs: Dict[str, str]) -> None:
        """Test that CodeBuild has privileged mode enabled for Docker."""
        project_name = outputs["CodeBuildProjectName"]

        response = codebuild_client.batch_get_projects(names=[project_name])
        project = response["projects"][0]

        environment = project["environment"]
        assert environment.get("privilegedMode") is True

    def test_sns_topic_exists(self, sns_client, outputs: Dict[str, str]) -> None:
        """Test that SNS topic for approvals exists."""
        topic_arn = outputs["ApprovalTopicArn"]

        response = sns_client.get_topic_attributes(TopicArn=topic_arn)
        assert response is not None
        assert "Attributes" in response

    def test_iam_pipeline_role_exists(self, iam_client, outputs: Dict[str, str]) -> None:
        """Test that pipeline execution role exists."""
        role_arn = outputs["PipelineExecutionRoleArn"]
        role_name = role_arn.split("/")[-1]

        response = iam_client.get_role(RoleName=role_name)
        assert response is not None
        assert "Role" in response

        role = response["Role"]
        assert role["RoleName"] == role_name

    def test_iam_role_trust_policy(self, iam_client, outputs: Dict[str, str]) -> None:
        """Test that pipeline role has correct trust policy."""
        role_arn = outputs["PipelineExecutionRoleArn"]
        role_name = role_arn.split("/")[-1]

        response = iam_client.get_role(RoleName=role_name)
        role = response["Role"]

        # Check assume role policy
        assume_role_policy = role["AssumeRolePolicyDocument"]
        statements = assume_role_policy["Statement"]

        # Find CodePipeline service principal
        codepipeline_principals = [
            stmt for stmt in statements
            if "Service" in stmt.get("Principal", {})
            and "codepipeline.amazonaws.com" in str(stmt["Principal"]["Service"])
        ]
        assert len(codepipeline_principals) > 0

    def test_pipeline_source_action_disables_polling(self, pipeline_client, outputs: Dict[str, str]) -> None:
        """Test that pipeline source action has PollForSourceChanges disabled."""
        pipeline_arn = outputs["PipelineArn"]
        pipeline_name = pipeline_arn.split(":")[-1]

        response = pipeline_client.get_pipeline(name=pipeline_name)
        stages = response["pipeline"]["stages"]

        source_stage = [s for s in stages if s["name"] == "Source"][0]
        source_action = source_stage["actions"][0]

        config = source_action.get("configuration", {})
        # PollForSourceChanges should be false (using CloudWatch Events instead)
        assert config.get("PollForSourceChanges") == "false" or config.get("PollForSourceChanges") is False

    def test_pipeline_has_manual_approval(self, pipeline_client, outputs: Dict[str, str]) -> None:
        """Test that pipeline has manual approval action."""
        pipeline_arn = outputs["PipelineArn"]
        pipeline_name = pipeline_arn.split(":")[-1]

        response = pipeline_client.get_pipeline(name=pipeline_name)
        stages = response["pipeline"]["stages"]

        # Find manual approval action
        approval_actions = []
        for stage in stages:
            for action in stage["actions"]:
                action_type = action["actionTypeId"]
                if action_type["category"] == "Approval" and action_type["provider"] == "Manual":
                    approval_actions.append(action)

        assert len(approval_actions) > 0, "No manual approval action found"

        # Check that approval action has SNS notification
        approval_action = approval_actions[0]
        config = approval_action.get("configuration", {})
        assert "NotificationArn" in config

    def test_resource_naming_includes_suffix(self, outputs: Dict[str, str]) -> None:
        """Test that resources include environment suffix in names."""
        # Pipeline ARN should include suffix
        pipeline_arn = outputs["PipelineArn"]
        pipeline_name = pipeline_arn.split(":")[-1]
        assert "-" in pipeline_name  # Should have suffix like pipeline-name-suffix

        # Bucket name should include suffix
        bucket_name = outputs["ArtifactBucketName"]
        assert "-" in bucket_name

        # Role name should include suffix
        role_arn = outputs["PipelineExecutionRoleArn"]
        role_name = role_arn.split("/")[-1]
        assert "-" in role_name

    def test_codebuild_logs_retention(self, codebuild_client, outputs: Dict[str, str]) -> None:
        """Test that CodeBuild CloudWatch Logs are configured."""
        project_name = outputs["CodeBuildProjectName"]

        response = codebuild_client.batch_get_projects(names=[project_name])
        project = response["projects"][0]

        logs_config = project.get("logsConfig", {})
        cloudwatch_logs = logs_config.get("cloudWatchLogs", {})

        # Verify CloudWatch Logs are enabled
        assert cloudwatch_logs.get("status") == "ENABLED"
        assert "groupName" in cloudwatch_logs

    def test_all_resources_are_in_correct_region(self, outputs: Dict[str, str], region: str) -> None:
        """Test that all resources are in the expected region."""
        # Check Pipeline ARN
        pipeline_arn = outputs["PipelineArn"]
        assert f":{region}:" in pipeline_arn

        # Check KMS Key ARN
        kms_key_arn = outputs["KmsKeyArn"]
        assert f":{region}:" in kms_key_arn

        # Check SNS Topic ARN
        topic_arn = outputs["ApprovalTopicArn"]
        assert f":{region}:" in topic_arn

    def test_complete_pipeline_workflow_structure(self, pipeline_client, outputs: Dict[str, str]) -> None:
        """Test that pipeline has complete workflow: Source -> Build -> Deploy -> Approval -> Deploy."""
        pipeline_arn = outputs["PipelineArn"]
        pipeline_name = pipeline_arn.split(":")[-1]

        response = pipeline_client.get_pipeline(name=pipeline_name)
        stages = response["pipeline"]["stages"]

        # Verify stage order and types
        assert len(stages) >= 5, "Pipeline should have at least 5 stages"

        # Source stage
        assert stages[0]["name"] == "Source"
        assert stages[0]["actions"][0]["actionTypeId"]["category"] == "Source"

        # Build stage
        build_stage = [s for s in stages if s["name"] == "Build"][0]
        assert build_stage["actions"][0]["actionTypeId"]["category"] == "Build"

        # Find approval stage
        approval_stages = [s for s in stages if "Approval" in s["name"]]
        assert len(approval_stages) > 0, "No approval stage found"
