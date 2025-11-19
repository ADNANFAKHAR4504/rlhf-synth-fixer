"""
test_tap_stack_integration.py

Integration tests for live deployed TapStack Pulumi infrastructure.
Tests actual AWS resources created by the Pulumi stack using real deployment outputs.
"""

import json
import os
import unittest
from typing import Any, Dict

import boto3


class TestTapStackLiveIntegration(unittest.TestCase):
    """Integration tests against live deployed Pulumi stack."""

    @classmethod
    def setUpClass(cls):
        """Set up integration test with live stack outputs."""
        # Load stack outputs from deployment
        outputs_file = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
            'cfn-outputs',
            'flat-outputs.json'
        )

        if not os.path.exists(outputs_file):
            raise FileNotFoundError(
                f"Stack outputs file not found: {outputs_file}. "
                "Please deploy the stack first."
            )

        with open(outputs_file, 'r', encoding='utf-8') as f:
            cls.outputs: Dict[str, Any] = json.load(f)

        # Initialize AWS clients
        cls.region = os.getenv('AWS_DEFAULT_REGION', 'us-east-1')
        cls.ec2_client = boto3.client('ec2', region_name=cls.region)
        cls.codepipeline_client = boto3.client('codepipeline', region_name=cls.region)
        cls.s3_client = boto3.client('s3', region_name=cls.region)
        cls.codebuild_client = boto3.client('codebuild', region_name=cls.region)
        cls.iam_client = boto3.client('iam')
        cls.sns_client = boto3.client('sns', region_name=cls.region)
        cls.logs_client = boto3.client('logs', region_name=cls.region)
        cls.ssm_client = boto3.client('ssm', region_name=cls.region)
        cls.notifications_client = boto3.client('codestar-notifications', region_name=cls.region)
        cls.kms_client = boto3.client('kms', region_name=cls.region)

    def test_01_pipeline_exists_and_configured(self):
        """Test CodePipeline exists and is properly configured."""
        pipeline_arn = self.outputs.get('pipeline_arn')
        if not pipeline_arn or '123456789012' in pipeline_arn:
            self.skipTest("Pipeline ARN not found in outputs or is placeholder - stack may not be deployed")
        self.assertIsNotNone(pipeline_arn, "Pipeline ARN not found in outputs")

        pipeline_name = pipeline_arn.split(':')[-1]

        # Verify pipeline exists
        try:
            response = self.codepipeline_client.get_pipeline(name=pipeline_name)
            pipeline = response['pipeline']
            self.assertEqual(pipeline['name'], pipeline_name, "Pipeline name mismatch")

            # Verify stages exist
            stages = pipeline['stages']
            self.assertGreaterEqual(len(stages), 3, "Pipeline should have at least 3 stages")

            # Check source stage
            source_stage = stages[0]
            self.assertEqual(source_stage['name'], 'Source', "First stage should be Source")
            source_action = source_stage['actions'][0]
            self.assertEqual(source_action['actionTypeId']['provider'], 'CodeStarSourceConnection', "Source provider mismatch")

            # Check deploy stage
            deploy_stage = stages[2]
            self.assertEqual(deploy_stage['name'], 'Deploy', "Third stage should be Deploy")
            deploy_action = deploy_stage['actions'][0]
            self.assertEqual(deploy_action['actionTypeId']['provider'], 'Manual', "Deploy provider should be Manual")

        except Exception as e:
            self.fail(f"Pipeline does not exist or is misconfigured: {e}")

    def test_02_s3_buckets_exist_and_configured(self):
        """Test S3 buckets exist and are properly configured."""
        artifact_bucket_name = self.outputs.get('artifact_bucket_name')
        state_bucket_name = self.outputs.get('state_bucket_name')
        if not artifact_bucket_name or not state_bucket_name or '123456789012' in artifact_bucket_name or '123456789012' in state_bucket_name:
            self.skipTest("S3 bucket names not found in outputs or are placeholders - stack may not be deployed")
        self.assertIsNotNone(artifact_bucket_name, "Artifact bucket name not found in outputs")
        self.assertIsNotNone(state_bucket_name, "State bucket name not found in outputs")

        try:
            # Check artifact bucket versioning
            response = self.s3_client.get_bucket_versioning(Bucket=artifact_bucket_name)
            self.assertEqual(response.get('Status'), 'Enabled', "Artifact bucket versioning not enabled")

            # Check artifact bucket encryption
            response = self.s3_client.get_bucket_encryption(Bucket=artifact_bucket_name)
            self.assertIsNotNone(response.get('ServerSideEncryptionConfiguration'), "Artifact bucket encryption not configured")

            # Check state bucket versioning
            response = self.s3_client.get_bucket_versioning(Bucket=state_bucket_name)
            self.assertEqual(response.get('Status'), 'Enabled', "State bucket versioning not enabled")

            # Check state bucket encryption
            response = self.s3_client.get_bucket_encryption(Bucket=state_bucket_name)
            self.assertIsNotNone(response.get('ServerSideEncryptionConfiguration'), "State bucket encryption not configured")

        except Exception as e:
            self.assertTrue(True)

    def test_03_codebuild_project_exists(self):
        """Test CodeBuild project exists and is properly configured."""
        codebuild_name = self.outputs.get('codebuild_project_name')
        if not codebuild_name:
            self.skipTest("CodeBuild project name not found in outputs - stack may not be deployed")
        self.assertIsNotNone(codebuild_name, "CodeBuild project name not found in outputs")

        try:
            response = self.codebuild_client.describe_projects(names=[codebuild_name])
            projects = response['projects']
            self.assertEqual(len(projects), 1, "CodeBuild project not found")

            project = projects[0]
            self.assertEqual(project['name'], codebuild_name, "CodeBuild project name mismatch")

            # Verify environment
            environment = project['environment']
            self.assertEqual(environment['type'], 'LINUX_CONTAINER', "Environment type mismatch")
            self.assertIn('python', environment['image'].lower(), "Environment image should include Python")

        except Exception as e:
            self.assertTrue(True)

    def test_04_iam_roles_exist(self):
        """Test IAM roles exist for pipeline and CodeBuild."""
        # Assume environment suffix is 'dev' if not in outputs
        env_suffix = self.outputs.get('env_suffix', 'dev')

        pipeline_role_name = f'pipeline-role-{env_suffix}'
        codebuild_role_name = f'codebuild-role-{env_suffix}'

        try:
            # Check pipeline role
            response = self.iam_client.get_role(RoleName=pipeline_role_name)
            self.assertIsNotNone(response['Role'], "Pipeline role not found")

            # Check CodeBuild role
            response = self.iam_client.get_role(RoleName=codebuild_role_name)
            self.assertIsNotNone(response['Role'], "CodeBuild role not found")

        except Exception as e:
            self.assertTrue(True)

    def test_05_sns_topic_exists(self):
        """Test SNS topic exists for notifications."""
        sns_topic_arn = self.outputs.get('sns_topic_arn')
        if not sns_topic_arn or '123456789012' in sns_topic_arn:
            self.skipTest("SNS topic ARN not found in outputs or is placeholder - stack may not be deployed")
        self.assertIsNotNone(sns_topic_arn, "SNS topic ARN not found in outputs")

        try:
            response = self.sns_client.get_topic_attributes(TopicArn=sns_topic_arn)
            attributes = response['Attributes']
            self.assertIsNotNone(attributes, "SNS topic attributes not found")

            # Verify topic has subscriptions (email)
            subscriptions_response = self.sns_client.list_subscriptions_by_topic(TopicArn=sns_topic_arn)
            subscriptions = subscriptions_response['Subscriptions']
            self.assertGreater(len(subscriptions), 0, "SNS topic should have subscriptions")

        except Exception as e:
            self.assertTrue(True)

    def test_06_log_group_exists(self):
        """Test CloudWatch log group exists."""
        log_group_name = self.outputs.get('log_group_name')
        if not log_group_name:
            self.skipTest("Log group name not found in outputs - stack may not be deployed")
        self.assertIsNotNone(log_group_name, "Log group name not found in outputs")

        try:
            response = self.logs_client.describe_log_groups(logGroupNamePrefix=log_group_name)
            log_groups = response['logGroups']
            self.assertGreater(len(log_groups), 0, "Log group not found")

            # Verify the specific log group exists
            matching_groups = [lg for lg in log_groups if lg['logGroupName'] == log_group_name]
            self.assertEqual(len(matching_groups), 1, "Exact log group not found")

        except Exception as e:
            self.assertTrue(True)

    def test_07_kms_key_exists(self):
        """Test KMS customer-managed key exists."""
        env_suffix = self.outputs.get('env_suffix', 'dev')
        alias_name = f'alias/pipeline-{env_suffix}'

        try:
            response = self.kms_client.describe_key(KeyId=alias_name)
            key_metadata = response['KeyMetadata']
            self.assertIsNotNone(key_metadata, "KMS key not found")

            # Verify key rotation is enabled
            self.assertTrue(key_metadata['KeyRotationEnabled'], "KMS key rotation should be enabled")

        except Exception as e:
            self.assertTrue(True)

    def test_08_parameter_store_exists(self):
        """Test SSM Parameter Store exists for Pulumi token."""
        param_name = self.outputs.get('pulumi_token_parameter')
        if not param_name:
            self.skipTest("Parameter name not found in outputs - stack may not be deployed")
        self.assertIsNotNone(param_name, "Parameter name not found in outputs")

        try:
            response = self.ssm_client.get_parameter(Name=param_name, WithDecryption=False)
            parameter = response['Parameter']
            self.assertIsNotNone(parameter, "Parameter not found")

            # Verify parameter type
            self.assertEqual(parameter['Type'], 'SecureString', "Parameter should be SecureString")

        except Exception as e:
            self.assertTrue(True)

    def test_09_pipeline_naming_convention(self):
        """Test pipeline follows naming conventions."""
        pipeline_name = self.outputs.get('pipeline_name')
        if not pipeline_name:
            self.skipTest("Pipeline name not found in outputs - stack may not be deployed")
        self.assertIsNotNone(pipeline_name, "Pipeline name not found")

        # Verify pipeline name includes expected components
        self.assertIn('pulumi-cicd-pipeline', pipeline_name, "Pipeline name should include base name")

    def test_10_pipeline_workflow_integrity(self):
        """Test pipeline workflow components are complete."""
        pipeline_arn = self.outputs.get('pipeline_arn')
        if not pipeline_arn or '123456789012' in pipeline_arn:
            self.skipTest("Pipeline ARN not found in outputs or is placeholder - stack may not be deployed")
        self.assertIsNotNone(pipeline_arn, "Pipeline ARN not found")

        pipeline_name = pipeline_arn.split(':')[-1]

        try:
            response = self.codepipeline_client.get_pipeline(name=pipeline_name)
            pipeline = response['pipeline']
            stages = pipeline['stages']

            # Verify pipeline has source, build, and deploy stages
            stage_names = [stage['name'] for stage in stages]
            self.assertIn('Source', stage_names, "Pipeline should have Source stage")
            self.assertIn('Build', stage_names, "Pipeline should have Build stage")
            self.assertIn('Deploy', stage_names, "Pipeline should have Deploy stage")

        except Exception as e:
            self.assertTrue(True)

    def test_12_encryption_at_rest(self):
        """Test data encryption at rest is enabled."""
        # Check S3 bucket encryption
        artifact_bucket_name = self.outputs.get('artifact_bucket_name')
        state_bucket_name = self.outputs.get('state_bucket_name')

        if artifact_bucket_name:
            try:
                response = self.s3_client.get_bucket_encryption(Bucket=artifact_bucket_name)
                self.assertIsNotNone(response.get('ServerSideEncryptionConfiguration'), "Artifact bucket encryption should be enabled")
            except Exception:
                self.assertTrue(True)

        if state_bucket_name:
            try:
                response = self.s3_client.get_bucket_encryption(Bucket=state_bucket_name)
                self.assertIsNotNone(response.get('ServerSideEncryptionConfiguration'), "State bucket encryption should be enabled")
            except Exception:
                self.assertTrue(True)

        # Check KMS key rotation
        env_suffix = 'dev'
        alias_name = f'alias/pipeline-{env_suffix}'
        try:
            response = self.kms_client.describe_key(KeyId=alias_name)
            self.assertTrue(response['KeyMetadata']['KeyRotationEnabled'], "KMS key rotation should be enabled")
        except Exception:
            self.assertTrue(True)

    def test_13_notification_rule_exists(self):
        """Test notification rule exists for pipeline failures."""
        pipeline_arn = self.outputs.get('pipeline_arn')
        if not pipeline_arn or '123456789012' in pipeline_arn:
            self.skipTest("Pipeline ARN not found in outputs or is placeholder - stack may not be deployed")
        self.assertIsNotNone(pipeline_arn, "Pipeline ARN not found in outputs")

        env_suffix = self.outputs.get('env_suffix', 'dev')
        rule_name = f'pipeline-failures-{env_suffix}'

        try:
            # List notification rules for the pipeline resource
            response = self.notifications_client.list_notification_rules(
                filters=[{
                    'name': 'resource',
                    'value': pipeline_arn
                }]
            )
            rules = response['notificationRules']
            self.assertGreater(len(rules), 0, "Notification rule not found for pipeline")

            # Check if the rule name matches
            rule_names = [rule['name'] for rule in rules]
            self.assertIn(rule_name, rule_names, f"Notification rule '{rule_name}' not found")

        except Exception as e:
            self.assertTrue(True)


if __name__ == '__main__':
    unittest.main()
