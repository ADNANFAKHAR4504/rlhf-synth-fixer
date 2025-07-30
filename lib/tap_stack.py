"""tap_stack.py
This module defines the TapStack class, which serves as the main CDK stack for 
the TAP (Test Automation Platform) project.
It orchestrates the instantiation of other resource-specific stacks and 
manages environment-specific configurations.
"""

from typing import Optional
from aws_cdk import (
    aws_s3 as s3,
    aws_s3_deployment as s3_deploy,
    aws_iam as iam,
    aws_logs as logs,
    aws_codepipeline as codepipeline,
    aws_codepipeline_actions as cp_actions,
    aws_codebuild as codebuild,
    RemovalPolicy,
)
import os
import aws_cdk as cdk
from constructs import Construct
import zipfile

def zip_directory_contents(source_dir: str, output_zip: str):
    """
    Zip all contents (files & subfolders) inside `source_dir` into `output_zip`
    without including the top-level folder itself.
    """
    with zipfile.ZipFile(output_zip, 'w', zipfile.ZIP_DEFLATED) as zipf:
      for root, dirs, files in os.walk(source_dir):
        for file in files:
          # Skip hidden files if necessary
          if file.startswith('.'):
            continue
          file_path = os.path.join(root, file)
          arcname = os.path.relpath(file_path, source_dir)
          zipf.write(file_path, arcname)


class TapStackProps(cdk.StackProps):
  """
  TapStackProps defines the properties for the TapStack CDK stack.

  Args:
    environment_suffix (Optional[str]): An optional suffix to identify the 
    deployment environment (e.g., 'dev', 'prod').
    **kwargs: Additional keyword arguments passed to the base cdk.StackProps.

  Attributes:
    environment_suffix (Optional[str]): Stores the environment suffix for the stack.
  """

  def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
    super().__init__(**kwargs)
    self.environment_suffix = environment_suffix


class TapStack(cdk.Stack):
  def __init__(
        self,
        scope: Construct,
        construct_id: str, props: Optional[TapStackProps] = None, **kwargs):
    super().__init__(scope, construct_id, **kwargs)

    _ = props

    # Static site and Artifact bucket
    bucket = s3.Bucket(
      self,
      "ArtifactBucket",
      bucket_name="privatebucketturingblacree",
      block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
      versioned=True,
      removal_policy=RemovalPolicy.DESTROY,
      auto_delete_objects=True
    )


    # 2. Define static file path and zip path for pipeline files
    static_folder = os.path.join(os.getcwd(), "lib/staticfiles_turing")
    zip_file = os.path.join(os.getcwd(), "lib/pipeline_zip_file/pipelinefiles_turing.zip")

    # 3. Create the zip (only contents)
    zip_directory_contents(static_folder, zip_file)

    # Uplaod pipeline zip file to s3 bucket
    s3_deploy.BucketDeployment(
      self,
      "UploadZipFile",
      sources=[s3_deploy.Source.asset("lib/pipeline_zip_file")],
      destination_bucket=bucket,
      retain_on_delete=False
    )

    # Add a bucket policy that grants any CodePipeline in this account full access
    # Allow CodePipeline and CodeBuild full access (scoped to your account)
    for service in ["codepipeline.amazonaws.com", "codebuild.amazonaws.com"]:
      bucket.add_to_resource_policy(
        iam.PolicyStatement(
          effect=iam.Effect.ALLOW,
          principals=[iam.ServicePrincipal(service)],
          actions=["s3:*"],
          resources=[
            bucket.bucket_arn,
            f"{bucket.bucket_arn}/*"
          ],
          conditions={
            "StringEquals": {"aws:PrincipalAccount": self.account}
          }
        )
      )


    # 3. IAM Roles (you can add policies manually later)
    codepipeline_role = iam.Role(
      self, "CodePipelineRole",
      assumed_by=iam.ServicePrincipal("codepipeline.amazonaws.com")
    )

    codepipeline_role.add_to_policy(
      iam.PolicyStatement(
        actions=[
          "s3:PutObject",
          "s3:ListObjects",
          "s3:GetObjectVersion",
          "s3:GetObject",
          "s3:GetBucketVersioning",
          "codebuild:StartBuild",
          "codebuild:BatchGetBuilds",
          "codebuild:ListBuilds",
          "codebuild:StopBuild",
          "codebuild:ListCuratedEnvironmentImages",
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ],
        resources=["*"]  # Can restrict to specific ARNs if desired
      )
    )

    codebuild_role = iam.Role(
      self, "CodeBuildRole",
      assumed_by=iam.ServicePrincipal("codebuild.amazonaws.com")
    )

    codebuild_role.add_managed_policy(
      iam.ManagedPolicy.from_aws_managed_policy_name("AmazonS3FullAccess")
    )

    codebuild_role.add_managed_policy(
      iam.ManagedPolicy.from_aws_managed_policy_name("CloudWatchLogsFullAccess")
    )

    codebuild_role.add_to_policy(
      iam.PolicyStatement(
        actions=[
          "cloudfront:*",
          "route53:*",
          "acm:*",
        ],
        resources=["*"]  # Can restrict to specific ARNs if desired
      )
    )

    log_group = logs.LogGroup(
      self,
      "TerraformApplyLogGroupTuring",
      log_group_name="terraform-apply-log-group-turing",
      retention=logs.RetentionDays.ONE_WEEK
    )

    # 4. CodeBuild Project
    codebuild_project = codebuild.PipelineProject(
      self,
      "TerraformBuildProject",
      project_name="cdkpythonturingproject",
      description="Terraform deploy execution",
      role=codebuild_role,
      environment=codebuild.BuildEnvironment(
        compute_type=codebuild.ComputeType.SMALL,
        build_image=codebuild.LinuxBuildImage.from_docker_registry("hashicorp/terraform:latest"),
        privileged=False
      ),
      logging=codebuild.LoggingOptions(
        cloud_watch=codebuild.CloudWatchLoggingOptions(
            log_group=log_group
        )
      ),
      build_spec=codebuild.BuildSpec.from_source_filename("terraform_apply.yml")
    )

    # 5. Pipeline Artifacts
    source_output = codepipeline.Artifact() 

    # 6. CodePipeline
    pipeline = codepipeline.Pipeline(
      self,
      "TuringCodePipeline",
      pipeline_name="TuringCodePipelineTerraform",
      role=codepipeline_role,
      artifact_bucket=bucket
    )

    # 7. Source Stage (S3)
    source_action = cp_actions.S3SourceAction(
      action_name="s3-connection",
      bucket=bucket,
      bucket_key="pipelinefiles_turing.zip",  # replace with actual zip name
      output=source_output,
      trigger=cp_actions.S3Trigger.POLL # equivalent to PollForSourceChanges = true
    )

    pipeline.add_stage(stage_name="Source", actions=[source_action])

    # 8. Deploy Stage (CodeBuild)
    deploy_action = cp_actions.CodeBuildAction(
      action_name="Terraform-Deploy",
      project=codebuild_project,
      input=source_output
    )

    pipeline.add_stage(stage_name="Deploy", actions=[deploy_action])





