# CI/CD Pipeline for EC2 Application Deployment

We need a CloudFormation template that creates a complete CI/CD pipeline for deploying our application to EC2 instances.

## What We Need

Set up CodePipeline that orchestrates the entire workflow. The pipeline needs to pull source code from CodeCommit, send it to CodeBuild for compilation, require manual approval, then trigger CodeDeploy to push the artifacts to our EC2 fleet.

CodeBuild should compile the application and store build artifacts in an S3 bucket. The bucket stores artifacts that CodeDeploy retrieves during deployment. Enable versioning on the bucket so we can roll back if needed.

CodeDeploy handles the actual deployment to EC2 instances tagged with Environment=Production and Application=prod-cicd-target. Configure auto-rollback so failed deployments revert automatically.

For notifications, create an SNS topic that receives alerts when the pipeline fails or when CodeBuild errors out. Wire up CloudWatch Events rules that monitor pipeline state changes and send failure notifications to the SNS topic.

## IAM Requirements

Each service needs its own IAM role:
- CodePipeline role that can access S3 artifacts, start CodeBuild projects, and create CodeDeploy deployments
- CodeBuild role that can write to CloudWatch Logs and read/write S3 artifacts
- CodeDeploy role with the standard AWSCodeDeployRole managed policy
- EC2 instance role that lets the CodeDeploy agent pull artifacts from S3 and write logs to CloudWatch

Make sure all IAM policies follow least privilege - only grant the specific actions and resources each service actually needs.

## Production Standards

All resources must be prefixed with "prod-" since this is our production pipeline. Include a manual approval stage before deployment so someone reviews changes before they hit production.

The template should pass cfn-lint validation and follow AWS security best practices. Block all public access on the S3 bucket and enable server-side encryption.

## Outputs

Export the pipeline name, artifacts bucket name, SNS topic ARN, CodeDeploy application name, and EC2 instance profile ARN so other stacks can reference them.
