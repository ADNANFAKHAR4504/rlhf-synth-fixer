import aws_cdk as core
import aws_cdk.assertions as assertions

from lib.tap_stack import TapStack

def test_s3_bucket_created():
  app = core.App()
  stack = TapStack(app, "TapStack")

  # Create a template from the stack
  template = assertions.Template.from_stack(stack)

  # Assert S3 bucket exists with correct properties
  template.has_resource_properties("AWS::S3::Bucket", {
    "BucketName": "privatebucketturingblacree",
    "VersioningConfiguration": {"Status": "Enabled"}
  })

def test_pipeline_created():
  app = core.App()
  stack = TapStack(app, "TapStack")
  template = assertions.Template.from_stack(stack)

  # Assert CodePipeline exists
  template.resource_count_is("AWS::CodePipeline::Pipeline", 1)

def test_codebuild_project_created():
  app = core.App()
  stack = TapStack(app, "TapStack")
  template = assertions.Template.from_stack(stack)

  template.has_resource_properties("AWS::CodeBuild::Project", {
    "Environment": {
      "ComputeType": "BUILD_GENERAL1_SMALL",
      "Image": "hashicorp/terraform:latest",
      "Type": "LINUX_CONTAINER"
    }
  })

def test_iam_roles_exist():
  app = core.App()
  stack = TapStack(app, "TapStack")
  template = assertions.Template.from_stack(stack)

  # Check that CodePipelineRole exists
  template.has_resource_properties("AWS::IAM::Role", {
    "AssumeRolePolicyDocument": {
      "Statement": assertions.Match.array_with([
        assertions.Match.object_like({
          "Principal": {"Service": "codepipeline.amazonaws.com"}
        })
      ])
    }
  })

  # Check that CodeBuildRole exists
  template.has_resource_properties("AWS::IAM::Role", {
    "AssumeRolePolicyDocument": {
      "Statement": assertions.Match.array_with([
        assertions.Match.object_like({
          "Principal": {"Service": "codebuild.amazonaws.com"}
        })
      ])
    }
  })
