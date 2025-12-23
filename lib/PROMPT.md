Hey team,

We're modernizing our infrastructure deployment process with a fully automated CI/CD pipeline. The current manual process is error-prone and the business wants everything automated with proper validation and approval gates. Building this with Terraform in HCL.

The pipeline needs to integrate with our GitHub repo and automatically trigger when code gets pushed. CodeCommit is deprecated, so we're using CodeStar Connections for the GitHub integration. The pipeline orchestrates multiple CodeBuild projects that validate Terraform code, generate plans, and apply changes after approval.

## What we need

Set up a CodePipeline with four stages that connect together. The source stage connects to GitHub via CodeStar Connections and gets triggered automatically when developers push commits. It pulls the latest code and passes it to the validate stage.

The validate stage runs a CodeBuild project that executes terraform validate to check syntax and runs tfsec for security scanning. If validation passes, the artifacts flow to the plan stage.

The plan stage runs another CodeBuild project that executes terraform plan and saves the plan file to an S3 artifact bucket. The pipeline then waits at a manual approval gate where someone reviews the plan before proceeding.

After approval, the apply stage runs a CodeBuild project that pulls the plan from S3 and executes terraform apply. The state file is stored in a separate S3 bucket with DynamoDB locking to prevent concurrent modifications.

The connectivity flow is: GitHub → CodeStar Connection → CodePipeline Source Stage → CodeBuild Validate → CodeBuild Plan → S3 Artifacts → Manual Approval → CodeBuild Apply → S3 State Storage. DynamoDB provides state locking so multiple pipelines can't modify state simultaneously.

Create S3 buckets for pipeline artifacts and Terraform state, both with encryption enabled and public access blocked. Set up a DynamoDB table for state locking with point-in-time recovery enabled.

Configure IAM roles for CodePipeline to orchestrate the stages and separate service roles for each CodeBuild project with least privilege permissions. The CodeBuild roles need access to S3 for artifacts, CloudWatch for logs, and ability to assume roles for deploying infrastructure.

Set up CloudWatch log groups for each CodeBuild project with retention policies appropriate for troubleshooting. Create an SNS topic that publishes pipeline status changes and subscribe an email endpoint for notifications when builds fail or approvals are needed.

Use the environmentSuffix variable in all resource names for uniqueness. Deploy to us-east-1. Make all S3 buckets use force_destroy so they can be deleted during cleanup without manual intervention.
