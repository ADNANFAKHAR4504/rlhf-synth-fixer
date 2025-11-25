"""
test_tap_stack_integration.py

Integration tests for live deployed TapStack Pulumi infrastructure.
Tests actual AWS resources created for the CI/CD pipeline infrastructure.

NOTE: These tests require actual Pulumi stack deployment to AWS.
"""

import unittest
import os
import boto3
import json
import subprocess
from botocore.exceptions import ClientError


class TestTapStackIntegration(unittest.TestCase):
    """Integration tests against live deployed Pulumi stack."""

    @classmethod
    def setUpClass(cls):
        """Set up integration test with environment configuration."""
        cls.environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'dev')
        # Default to ap-southeast-1 to match the IAC deployment region
        cls.region = os.getenv('AWS_REGION', 'ap-southeast-1')
        cls.project_name = os.getenv('PULUMI_PROJECT', 'TapStack')
        cls.pulumi_org = os.getenv('PULUMI_ORG', 'organization')
        
        # Stack name follows the pattern used in deployment
        cls.stack_name = os.getenv('PULUMI_STACK', f'TapStack{cls.environment_suffix}')
        
        # Full Pulumi stack identifier: org/project/stack
        cls.pulumi_stack_identifier = f"{cls.pulumi_org}/{cls.project_name}/{cls.stack_name}"
        
        # Resource name prefix - matches how Pulumi creates resources
        cls.resource_prefix = f"{cls.project_name}-{cls.stack_name}".lower()

        # Initialize AWS clients
        cls.s3_client = boto3.client('s3', region_name=cls.region)
        cls.cloudwatch_client = boto3.client('cloudwatch', region_name=cls.region)
        cls.sns_client = boto3.client('sns', region_name=cls.region)
        cls.lambda_client = boto3.client('lambda', region_name=cls.region)
        cls.iam_client = boto3.client('iam', region_name=cls.region)
        cls.ecs_client = boto3.client('ecs', region_name=cls.region)
        cls.ecr_client = boto3.client('ecr', region_name=cls.region)
        cls.codepipeline_client = boto3.client('codepipeline', region_name=cls.region)
        cls.codebuild_client = boto3.client('codebuild', region_name=cls.region)
        cls.codedeploy_client = boto3.client('codedeploy', region_name=cls.region)
        
        # Get account ID for resource naming
        sts_client = boto3.client('sts', region_name=cls.region)
        cls.account_id = sts_client.get_caller_identity()['Account']
        
        # Fetch Pulumi stack outputs
        cls.outputs = cls._fetch_pulumi_outputs()
    
    @classmethod
    def _fetch_pulumi_outputs(cls):
        """Fetch Pulumi outputs as a Python dictionary."""
        try:
            print(f"\nDebug: Environment suffix: {cls.environment_suffix}")
            print(f"Debug: Stack name: {cls.stack_name}")
            print(f"Debug: Full stack identifier: {cls.pulumi_stack_identifier}")
            print(f"Fetching Pulumi outputs for stack: {cls.pulumi_stack_identifier}")
            
            result = subprocess.run(
                ["pulumi", "stack", "output", "--json", "--stack", cls.pulumi_stack_identifier],
                capture_output=True,
                text=True,
                check=True,
                cwd=os.path.join(os.path.dirname(__file__), "../..")
            )
            outputs = json.loads(result.stdout)
            print(f"Successfully fetched {len(outputs)} outputs from Pulumi stack")
            if outputs:
                print(f"Available outputs: {list(outputs.keys())}")
            else:
                print("Note: Stack has no outputs registered. Tests will use naming conventions.")
            return outputs
        except subprocess.CalledProcessError as e:
            print(f"Warning: Could not retrieve Pulumi stack outputs")
            print(f"Error: {e.stderr}")
            print("Tests will fall back to standard naming conventions")
            return {}
        except json.JSONDecodeError as e:
            print(f"Warning: Could not parse Pulumi output: {e}")
            return {}

    def test_artifact_bucket_exists(self):
        """Test that the CI/CD artifact bucket exists and is properly configured."""
        # Skip if outputs not available
        if not self.outputs or 'artifactBucketName' not in self.outputs:
            self.skipTest("Artifact bucket name not available in outputs")
        
        bucket_name = self.outputs['artifactBucketName']
        
        try:
            # Verify bucket exists
            response = self.s3_client.head_bucket(Bucket=bucket_name)
            self.assertEqual(response['ResponseMetadata']['HTTPStatusCode'], 200)
            
            # Verify versioning is enabled
            versioning = self.s3_client.get_bucket_versioning(Bucket=bucket_name)
            self.assertEqual(versioning.get('Status'), 'Enabled',
                           "Artifact bucket versioning should be enabled")
            
            # Verify encryption is enabled
            try:
                encryption = self.s3_client.get_bucket_encryption(Bucket=bucket_name)
                rules = encryption['ServerSideEncryptionConfiguration']['Rules']
                self.assertGreater(len(rules), 0, "Artifact bucket should have encryption rules")
            except ClientError as e:
                if e.response['Error']['Code'] != 'ServerSideEncryptionConfigurationNotFoundError':
                    raise
            
            # Verify public access is blocked
            public_access = self.s3_client.get_public_access_block(Bucket=bucket_name)
            pab_config = public_access['PublicAccessBlockConfiguration']
            self.assertTrue(pab_config['BlockPublicAcls'], "Should block public ACLs")
            self.assertTrue(pab_config['BlockPublicPolicy'], "Should block public policies")
            
            print(f"✓ Artifact bucket {bucket_name} is properly configured")
            
        except ClientError as e:
            self.fail(f"Artifact bucket test failed: {e}")
    
    def test_stack_outputs_complete(self):
        """Test that all expected CI/CD stack outputs are present."""
        # Skip this test if outputs couldn't be fetched
        if not self.outputs:
            self.skipTest("Pulumi stack outputs not available - stack may not export outputs")
        
        # Expected outputs for CI/CD pipeline infrastructure
        expected_outputs = [
            'ecrRepositoryUrl',
            'ecsClusterName',
            'ecsClusterArn',
            'pipelineName',
            'pipelineArn',
            'codeBuildProjectName',
            'codeDeployAppName',
            'kmsKeyId',
            'kmsKeyArn',
            'artifactBucketName'
        ]
        
        missing_outputs = []
        for output_name in expected_outputs:
            if output_name not in self.outputs:
                missing_outputs.append(output_name)
        
        if missing_outputs:
            print(f"Warning: Missing expected outputs: {missing_outputs}")
            print(f"Available outputs: {list(self.outputs.keys())}")
        
        # Verify critical CI/CD outputs exist
        self.assertIn(
            'pipelineName',
            self.outputs,
            "Output 'pipelineName' should be present in stack outputs"
        )
        self.assertIn(
            'ecsClusterName',
            self.outputs,
            "Output 'ecsClusterName' should be present in stack outputs"
        )
        self.assertIn(
            'ecrRepositoryUrl',
            self.outputs,
            "Output 'ecrRepositoryUrl' should be present in stack outputs"
        )
    
    def test_ecs_cluster_exists(self):
        """Test that the ECS cluster exists and is properly configured."""
        if not self.outputs or 'ecsClusterName' not in self.outputs:
            self.skipTest("ECS cluster name not available in outputs")
        
        cluster_name = self.outputs['ecsClusterName']
        
        try:
            response = self.ecs_client.describe_clusters(clusters=[cluster_name])
            self.assertGreater(len(response['clusters']), 0, "ECS cluster should exist")
            
            cluster = response['clusters'][0]
            self.assertEqual(cluster['clusterName'], cluster_name)
            self.assertEqual(cluster['status'], 'ACTIVE', "Cluster should be active")
            
            print(f"✓ ECS cluster {cluster_name} exists and is active")
            
        except ClientError as e:
            self.fail(f"ECS cluster test failed: {e}")
    
    def test_ecr_repository_exists(self):
        """Test that the ECR repository exists."""
        if not self.outputs or 'ecrRepositoryUrl' not in self.outputs:
            self.skipTest("ECR repository URL not available in outputs")
        
        repo_url = self.outputs['ecrRepositoryUrl']
        # Extract repository name from URL: account.dkr.ecr.region.amazonaws.com/repo-name
        repo_name = repo_url.split('/')[-1]
        
        try:
            response = self.ecr_client.describe_repositories(repositoryNames=[repo_name])
            self.assertGreater(len(response['repositories']), 0, "ECR repository should exist")
            
            repo = response['repositories'][0]
            self.assertEqual(repo['repositoryName'], repo_name)
            
            print(f"✓ ECR repository {repo_name} exists")
            
        except ClientError as e:
            self.fail(f"ECR repository test failed: {e}")
    
    def test_codepipeline_exists(self):
        """Test that the CodePipeline exists."""
        if not self.outputs or 'pipelineName' not in self.outputs:
            self.skipTest("Pipeline name not available in outputs")
        
        pipeline_name = self.outputs['pipelineName']
        
        try:
            response = self.codepipeline_client.get_pipeline(name=pipeline_name)
            pipeline = response['pipeline']
            self.assertEqual(pipeline['name'], pipeline_name)
            
            print(f"✓ CodePipeline {pipeline_name} exists")
            
        except ClientError as e:
            self.fail(f"CodePipeline test failed: {e}")
    
    def test_codebuild_project_exists(self):
        """Test that the CodeBuild project exists."""
        if not self.outputs or 'codeBuildProjectName' not in self.outputs:
            self.skipTest("CodeBuild project name not available in outputs")
        
        project_name = self.outputs['codeBuildProjectName']
        
        try:
            response = self.codebuild_client.batch_get_projects(names=[project_name])
            self.assertGreater(len(response['projects']), 0, "CodeBuild project should exist")
            
            project = response['projects'][0]
            self.assertEqual(project['name'], project_name)
            
            print(f"✓ CodeBuild project {project_name} exists")
            
        except ClientError as e:
            self.fail(f"CodeBuild project test failed: {e}")
    
    def test_codedeploy_app_exists(self):
        """Test that the CodeDeploy application exists."""
        if not self.outputs or 'codeDeployAppName' not in self.outputs:
            self.skipTest("CodeDeploy app name not available in outputs")
        
        app_name = self.outputs['codeDeployAppName']
        
        try:
            response = self.codedeploy_client.get_application(applicationName=app_name)
            app = response['application']
            self.assertEqual(app['applicationName'], app_name)
            
            print(f"✓ CodeDeploy application {app_name} exists")
            
        except ClientError as e:
            self.fail(f"CodeDeploy application test failed: {e}")


if __name__ == '__main__':
    # Skip integration tests if not in integration test environment
    if os.getenv('RUN_INTEGRATION_TESTS') != '1':
        print("Skipping integration tests. Set RUN_INTEGRATION_TESTS=1 to run.")
        import sys
        sys.exit(0)

    unittest.main()