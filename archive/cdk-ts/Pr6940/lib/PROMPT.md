We're building out our CI/CD infrastructure for a microservices platform and need help setting up the pipeline. Right now we're manually deploying containers to ECS, which is getting tedious and error-prone.

Here's what we're looking for:

I need a complete CDK stack that creates a CI/CD pipeline for our containerized microservices. The pipeline should pull code from an S3 bucket (we'll upload source code there), build Docker images, push them to ECR, run unit tests, do security scanning with OWASP dependency check, deploy to staging, run integration tests, wait for manual approval, then deploy to production.

For the infrastructure setup, we need:

- A VPC with public and private subnets across 2 availability zones. The ALB should go in public subnets, and ECS tasks in private subnets.

- An S3 bucket for storing pipeline artifacts with versioning enabled and a 30-day lifecycle policy to clean up old artifacts. We also need another S3 bucket as the source for the pipeline.

- An ECR repository for storing our Docker images with image scanning enabled on push and a lifecycle policy to keep only the last 10 images.

- An ECS Fargate cluster with a task definition that has proper CPU and memory settings. The containers should log to CloudWatch Logs. We'll need both a task execution role and a task role with appropriate permissions.

- An Application Load Balancer with blue and green target groups for blue-green deployments. The ALB should be internet-facing.

- Four CodeBuild projects: one for building and pushing Docker images to ECR, one for running unit tests, one for running OWASP dependency check security scans, and one for integration tests that can read the staging endpoint from SSM Parameter Store.

- A CodePipeline with 8 stages: Source (from S3), Build (Docker), UnitTests, SecurityScan, DeployToStaging (ECS), IntegrationTests, ManualApproval (with SNS notifications), and DeployToProduction (ECS).

- An SNS topic with email subscription for pipeline failure notifications.

- SSM parameters to store the image tag and endpoint URL.

- IAM roles with least privilege permissions for the pipeline, CodeBuild projects, and ECS tasks.

- CloudWatch Logs for all CodeBuild projects and ECS tasks.

- All resources should be tagged with Environment, Team, and CostCenter.

The stack should be written in TypeScript using CDK v2. The entry point should be in `bin/tap.ts` and the main stack in `lib/tap-stack.ts`. Make sure everything is properly connected and the pipeline flows correctly from source to production deployment.

Output the pipeline ARN, ALB endpoint, and ECR repository URI so we can use them after deployment.
