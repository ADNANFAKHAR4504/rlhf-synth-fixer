"""codepipeline_stack.py
This module defines the CodePipelineStack class, which creates the CodePipeline
for orchestrating the CI/CD workflow with build, staging, and production stages.
"""

from typing import Optional

import aws_cdk as cdk
from aws_cdk import aws_codebuild as codebuild
from aws_cdk import aws_codecommit as codecommit
from aws_cdk import aws_codepipeline as codepipeline
from aws_cdk import aws_codepipeline_actions as codepipeline_actions
from aws_cdk import aws_iam as iam
from aws_cdk import aws_s3 as s3
from constructs import Construct
class CodePipelineStackProps(cdk.StackProps):
  """
  CodePipelineStackProps defines the properties for the CodePipelineStack.
  
  Args:
    environment_suffix (Optional[str]): Environment suffix for resource naming
    codepipeline_role (iam.Role): IAM role for CodePipeline
    artifacts_bucket (s3.Bucket): S3 bucket for storing pipeline artifacts
    build_project (codebuild.Project): CodeBuild project for building code
    deploy_staging_project (codebuild.Project): CodeBuild project for staging deployment
    deploy_production_project (codebuild.Project): CodeBuild project for production deployment
    **kwargs: Additional keyword arguments passed to the base cdk.StackProps
  """
  
  def __init__(
    self,
    environment_suffix: Optional[str] = None,
    codepipeline_role: Optional[iam.Role] = None,
    artifacts_bucket: Optional[s3.Bucket] = None,
    build_project: Optional[codebuild.Project] = None,
    deploy_staging_project: Optional[codebuild.Project] = None,
    deploy_production_project: Optional[codebuild.Project] = None,
    **kwargs
  ):
    super().__init__(**kwargs)
    self.environment_suffix = environment_suffix
    self.codepipeline_role = codepipeline_role
    self.artifacts_bucket = artifacts_bucket
    self.build_project = build_project
    self.deploy_staging_project = deploy_staging_project
    self.deploy_production_project = deploy_production_project
class CodePipelineStack(cdk.NestedStack):
  """
  CodePipelineStack creates the CI/CD pipeline for automated deployments.
  
  This stack creates:
  - CodeCommit repository for source code
  - CodePipeline with source, build, staging, and production stages
  - Manual approval action between staging and production
  
  Args:
    scope (Construct): The parent construct
    construct_id (str): The unique identifier for this stack
    props (Optional[CodePipelineStackProps]): Optional properties for configuring the stack
    **kwargs: Additional keyword arguments passed to the CDK NestedStack
  """
  
  def __init__(
    self,
    scope: Construct,
    construct_id: str,
    props: Optional[CodePipelineStackProps] = None,
    **kwargs
  ):
    super().__init__(scope, construct_id, **kwargs)
    
    environment_suffix = props.environment_suffix if props else 'dev'
    codepipeline_role = props.codepipeline_role if props else None
    artifacts_bucket = props.artifacts_bucket if props else None
    build_project = props.build_project if props else None
    deploy_staging_project = props.deploy_staging_project if props else None
    deploy_production_project = props.deploy_production_project if props else None
    
    # Create CodeCommit repository
    self.repository = codecommit.Repository(
      self,
      "Repository",
      repository_name=f"ciapp-{environment_suffix}-repo",
      description=(f"Source code repository for CI/CD pipeline - "
                   f"{environment_suffix} environment")
    )
    
    # Define pipeline artifacts
    source_output = codepipeline.Artifact("SourceOutput")
    build_output = codepipeline.Artifact("BuildOutput")
    
    # Create the pipeline
    self.pipeline = codepipeline.Pipeline(
      self,
      "Pipeline",
      pipeline_name=f"ciapp-{environment_suffix}-pipeline",
      role=codepipeline_role,
      artifact_bucket=artifacts_bucket,
      stages=[
        # Source stage
        codepipeline.StageProps(
          stage_name="Source",
          actions=[
            codepipeline_actions.CodeCommitSourceAction(
              action_name="Source",
              repository=self.repository,
              branch="main",
              output=source_output,
              trigger=codepipeline_actions.CodeCommitTrigger.EVENTS
            )
          ]
        ),
        
        # Build stage
        codepipeline.StageProps(
          stage_name="Build",
          actions=[
            codepipeline_actions.CodeBuildAction(
              action_name="Build",
              project=build_project,
              input=source_output,
              outputs=[build_output]
            )
          ]
        ),
        
        # Deploy to Staging stage
        codepipeline.StageProps(
          stage_name="DeployStaging",
          actions=[
            codepipeline_actions.CodeBuildAction(
              action_name="DeployToStaging", 
              project=deploy_staging_project,
              input=build_output
            )
          ]
        ),
        
        # Manual approval stage
        codepipeline.StageProps(
          stage_name="ApproveProduction",
          actions=[
            codepipeline_actions.ManualApprovalAction(
              action_name="ApproveProductionDeployment",
              additional_information=("Please review the staging deployment "
                                      "and approve for production deployment.")
            )
          ]
        ),
        
        # Deploy to Production stage
        codepipeline.StageProps(
          stage_name="DeployProduction",
          actions=[
            codepipeline_actions.CodeBuildAction(
              action_name="DeployToProduction",
              project=deploy_production_project,
              input=build_output
            )
          ]
        )
      ]
    )
    
    # Output the repository clone URL
    cdk.CfnOutput(
      self,
      "RepositoryCloneUrl",
      value=self.repository.repository_clone_url_http,
      description="HTTP clone URL for the CodeCommit repository"
    )
    
    # Output the pipeline console URL
    cdk.CfnOutput(
      self,
      "PipelineUrl",
      value=(f"https://console.aws.amazon.com/codesuite/codepipeline/"
             f"pipelines/{self.pipeline.pipeline_name}/view"),
      description="AWS Console URL for the CodePipeline"
    )
    
    # Add tags to all resources
    cdk.Tags.of(self).add("Environment", environment_suffix)
    cdk.Tags.of(self).add("Component", "Pipeline")
