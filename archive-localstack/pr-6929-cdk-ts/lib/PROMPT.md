I need to set up a CI/CD pipeline for our payment processing service. We're running it as a containerized application on ECS Fargate, and I want the whole deployment process automated.

Here's what I'm looking for:

The pipeline should pull code from CodeCommit (main branch), build a Docker image, push it to ECR, run unit tests with pytest and generate coverage reports, deploy to staging, run integration tests, wait for manual approval, then deploy to production using blue/green deployments.

For the infrastructure, I need:
- CodePipeline with stages for source, build, unit tests, staging deployment, integration tests, approval, and production deployment
- Three CodeBuild projects: one for building/pushing Docker images, one for unit tests with pytest coverage, and one for integration tests that run against the staging endpoint
- ECR repository with image scanning enabled and a lifecycle policy to keep only the last 10 images
- ECS Fargate service with CodeDeploy for blue/green deployments
- Application Load Balancer with blue and green target groups
- CloudWatch alarms for monitoring (5xx errors, unhealthy hosts, response time) that trigger automatic rollback
- A Lambda function that sends pipeline status updates to Slack using a webhook URL stored in SSM Parameter Store
- SNS topic for manual approval notifications
- S3 bucket for pipeline artifacts with encryption
- All IAM roles following least privilege principles

The stack should be written in TypeScript using CDK v2. The entry point should be in `bin/tap.ts` and the main stack in `lib/tap-stack.ts`. Make sure everything is properly connected and the pipeline flows from source to production deployment.

Output the ALB DNS name, ECR repository URI, CodeDeploy application name, and URLs for staging and production so we can access the service after deployment.