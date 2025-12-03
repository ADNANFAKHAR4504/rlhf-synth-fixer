# CI/CD Pipeline Integration

## Subtask: CI/CD Pipeline

Create a Pulumi TypeScript program to set up a CI/CD pipeline for containerized applications. The configuration must: 1. Create an S3 bucket for storing build artifacts with versioning enabled. 2. Set up an ECR repository for Docker images with lifecycle policies to retain only the last 10 images. 3. Configure a CodeBuild project that builds Docker images from source code and pushes to ECR. 4. Create a CodePipeline with three stages: Source (GitHub), Build (CodeBuild), and Deploy (ECS). 5. Set up IAM roles with least-privilege permissions for CodeBuild and CodePipeline services. 6. Configure CodeBuild to use a buildspec.yml file from the source repository. 7. Enable CloudWatch Logs for CodeBuild with 7-day retention. 8. Add pipeline notifications to an SNS topic for build failures. 9. Tag all resources with Environment=Production and ManagedBy=Pulumi.

## Platform: Pulumi
## Language: TypeScript
## Difficulty: hard
