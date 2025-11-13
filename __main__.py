"""AWS CI/CD Pipeline Infrastructure for containerized applications."""
import pulumi
import pulumi_aws as aws
from lib.cicd_pipeline import CICDPipeline

# Get configuration
config = pulumi.Config()
environment_suffix = config.get("environmentSuffix") or "dev"
aws_region = config.get("region") or "ap-southeast-1"

# Configure AWS provider
aws_provider = aws.Provider(
    "aws-provider",
    region=aws_region
)

# Create the CI/CD pipeline infrastructure
pipeline = CICDPipeline(
    "cicd-pipeline",
    environment_suffix=environment_suffix,
    aws_region=aws_region,
    opts=pulumi.ResourceOptions(provider=aws_provider)
)

# Export important values
pulumi.export("ecrRepositoryUrl", pipeline.ecr_repository.repository_url)
pulumi.export("ecsClusterName", pipeline.ecs_cluster.name)
pulumi.export("ecsClusterArn", pipeline.ecs_cluster.arn)
pulumi.export("pipelineName", pipeline.pipeline.name)
pulumi.export("pipelineArn", pipeline.pipeline.arn)
pulumi.export("codeBuildProjectName", pipeline.build_project.name)
pulumi.export("codeDeployAppName", pipeline.deploy_app.name)
pulumi.export("kmsKeyId", pipeline.kms_key.id)
pulumi.export("kmsKeyArn", pipeline.kms_key.arn)
pulumi.export("artifactBucketName", pipeline.artifact_bucket.bucket)
