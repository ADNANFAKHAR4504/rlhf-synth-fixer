import json
import os
import unittest

import boto3
from pytest import mark

# Open file cfn-outputs/flat-outputs.json
base_dir = os.path.dirname(os.path.abspath(__file__))
flat_outputs_path = os.path.join(
    base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json'
)

if os.path.exists(flat_outputs_path):
  with open(flat_outputs_path, 'r', encoding='utf-8') as f:
    flat_outputs = f.read()
else:
  flat_outputs = '{}'

flat_outputs = json.loads(flat_outputs)


@mark.describe("TapStack Integration Tests")
class TestTapStackIntegration(unittest.TestCase):
  """Integration test cases for the TapStack CDK stack"""

  def setUp(self):
    """Set up AWS clients for integration testing"""
    self.s3_client = boto3.client('s3', region_name='us-west-2')
    self.codepipeline_client = boto3.client('codepipeline', region_name='us-west-2') 
    self.codebuild_client = boto3.client('codebuild', region_name='us-west-2')
    self.iam_client = boto3.client('iam', region_name='us-west-2')

  @mark.it("validates S3 artifacts bucket exists and is configured correctly")
  def test_s3_artifacts_bucket_exists(self):
    """Test that the S3 artifacts bucket is created and configured properly"""
    if not flat_outputs:
      self.skipTest("CloudFormation outputs not available - deployment may not be complete")
    
    # Extract bucket name from outputs or construct expected name
    environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'dev')
    account_id = boto3.client('sts').get_caller_identity()['Account']
    expected_bucket_name = f"ciapp-{environment_suffix}-artifacts-{account_id}"
    
    # Verify bucket exists
    response = self.s3_client.head_bucket(Bucket=expected_bucket_name)
    self.assertEqual(response['ResponseMetadata']['HTTPStatusCode'], 200)
    
    # Verify bucket encryption
    encryption = self.s3_client.get_bucket_encryption(Bucket=expected_bucket_name)
    self.assertIsNotNone(encryption['ServerSideEncryptionConfiguration'])

  @mark.it("validates S3 source bucket exists and is configured correctly")
  def test_s3_source_bucket_exists(self):
    """Test that the S3 source bucket is created and configured properly"""
    if not flat_outputs:
      self.skipTest("CloudFormation outputs not available - deployment may not be complete")
    
    environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'dev')
    account_id = boto3.client('sts').get_caller_identity()['Account']
    expected_bucket_name = f"ciapp-{environment_suffix}-source-{account_id}"
    
    # Verify bucket exists
    response = self.s3_client.head_bucket(Bucket=expected_bucket_name)
    self.assertEqual(response['ResponseMetadata']['HTTPStatusCode'], 200)
    
    # Verify bucket encryption
    encryption = self.s3_client.get_bucket_encryption(Bucket=expected_bucket_name)
    self.assertIsNotNone(encryption['ServerSideEncryptionConfiguration'])
    
    # Verify bucket versioning
    versioning = self.s3_client.get_bucket_versioning(Bucket=expected_bucket_name)
    self.assertEqual(versioning['Status'], 'Enabled')

  @mark.it("validates CodePipeline exists and has correct stages")
  def test_codepipeline_exists_with_stages(self):
    """Test that the CodePipeline is created with the expected stages"""
    if not flat_outputs:
      self.skipTest("CloudFormation outputs not available - deployment may not be complete")
    
    environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'dev')
    expected_pipeline_name = f"ciapp-{environment_suffix}-pipeline"
    
    # Verify pipeline exists
    response = self.codepipeline_client.get_pipeline(name=expected_pipeline_name)
    pipeline = response['pipeline']
    
    self.assertEqual(pipeline['name'], expected_pipeline_name)
    
    # Verify expected stages exist
    stage_names = [stage['name'] for stage in pipeline['stages']]
    expected_stages = ['Source', 'Build', 'DeployStaging', 'ApproveProduction', 'DeployProduction']
    
    for expected_stage in expected_stages:
      self.assertIn(expected_stage, stage_names)

  @mark.it("validates CodeBuild projects exist for build and deployment")
  def test_codebuild_projects_exist(self):
    """Test that CodeBuild projects are created for build and deployment"""
    if not flat_outputs:
      self.skipTest("CloudFormation outputs not available - deployment may not be complete")
    
    environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'dev')
    expected_projects = [
      f"ciapp-{environment_suffix}-build",
      f"ciapp-{environment_suffix}-deploy-staging", 
      f"ciapp-{environment_suffix}-deploy-production"
    ]
    
    # Verify all projects exist
    for project_name in expected_projects:
      response = self.codebuild_client.batch_get_projects(names=[project_name])
      self.assertEqual(len(response['projects']), 1)
      self.assertEqual(response['projects'][0]['name'], project_name)

  @mark.it("validates IAM roles exist with correct policies")
  def test_iam_roles_exist(self):
    """Test that IAM roles are created with appropriate policies"""
    if not flat_outputs:
      self.skipTest("CloudFormation outputs not available - deployment may not be complete")
    
    environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'dev')
    expected_roles = [
      f"ciapp-{environment_suffix}-codepipeline-role",
      f"ciapp-{environment_suffix}-codebuild-role",
      f"ciapp-{environment_suffix}-cloudformation-role"
    ]
    
    # Verify all roles exist
    for role_name in expected_roles:
      response = self.iam_client.get_role(RoleName=role_name)
      self.assertEqual(response['Role']['RoleName'], role_name)

  @mark.it("validates pipeline can be triggered manually")
  def test_pipeline_manual_trigger(self):
    """Test that the pipeline can be triggered manually"""
    if not flat_outputs:
      self.skipTest("CloudFormation outputs not available - deployment may not be complete")
    
    environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'dev')
    pipeline_name = f"ciapp-{environment_suffix}-pipeline"
    
    # Start pipeline execution (this will test if the pipeline is properly configured)
    try:
      response = self.codepipeline_client.start_pipeline_execution(name=pipeline_name)
      self.assertIsNotNone(response['pipelineExecutionId'])
      
      # Get pipeline state to verify it started
      state_response = self.codepipeline_client.get_pipeline_state(name=pipeline_name)
      self.assertIsNotNone(state_response['pipelineName'])
      
    except (
      self.codepipeline_client.exceptions.PipelineNotFoundException,
      self.codepipeline_client.exceptions.InvalidStageDeclarationException,
      self.codepipeline_client.exceptions.PipelineExecutionNotStoppableException
    ) as e:
      self.fail(f"Failed to start pipeline execution: {str(e)}")
