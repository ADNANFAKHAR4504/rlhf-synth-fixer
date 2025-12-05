# Task: CI/CD Pipeline Integration for Fintech Microservices

**Platform**: Pulumi
**Language**: TypeScript
**Difficulty**: Hard
**Region**: us-east-1

## Background

A fintech startup needs to establish a robust CI/CD pipeline for their payment processing microservices. The team uses GitHub for source control and requires automated testing, security scanning, and blue-green deployments to minimize downtime during releases.

## Environment

AWS deployment in us-east-1 region using CodePipeline for orchestration, CodeBuild for testing and building Docker images, ECS Fargate for container hosting, and Application Load Balancer for traffic management. Requires Pulumi CLI 3.x with TypeScript, Node.js 18+, and Docker installed locally. Infrastructure includes VPC with public and private subnets across 2 AZs, NAT Gateways for outbound connectivity, and ECR repository for container images. GitHub integration via webhooks and OIDC authentication.

## Problem Statement

Create a Pulumi TypeScript program to deploy a CI/CD pipeline for containerized microservices. The configuration must:

1. Set up CodePipeline with source, build, test, approval, and deploy stages.
2. Configure CodeBuild projects for running unit tests and building Docker images.
3. Create an ECR repository with lifecycle policies to keep only the last 10 images.
4. Deploy ECS Fargate service with task definition using the built container image.
5. Configure Application Load Balancer with target group health checks.
6. Implement blue-green deployment using CodeDeploy with ECS.
7. Set up EventBridge rule to trigger pipeline on GitHub push events.
8. Create SNS topic with email subscription for pipeline notifications.
9. Configure IAM roles with least privilege for all services.
10. Tag all resources with Environment, Project, and ManagedBy tags.

## Mandatory Requirements

1. Deploy to ECS Fargate with blue-green deployment strategy
2. Use AWS CodePipeline with manual approval stage before production deployment
3. Implement CodeBuild projects with separate buildspecs for unit tests and integration tests

## Optional Enhancements

1. Use Parameter Store for storing non-sensitive configuration values
2. Store build artifacts in S3 with encryption and versioning enabled
3. Use EventBridge to trigger pipeline on GitHub webhook events
4. Implement SNS notifications for pipeline state changes

## Expected Output

A fully functional CI/CD pipeline that automatically builds, tests, and deploys containerized applications with zero-downtime deployments, complete with monitoring and notification capabilities.

## Critical Requirements

- ALL resource names MUST include environmentSuffix parameter (e.g., `pipeline-${environmentSuffix}`)
- NO RemovalPolicy.RETAIN or deletion_protection settings (infrastructure must be destroyable)
- Use Pulumi with TypeScript as specified in metadata.json
- Follow AWS best practices for security, monitoring, and cost optimization
- Implement proper error handling and logging
- Use AWS managed policies where appropriate
- Enable encryption for data at rest and in transit
- Configure proper IAM roles with least privilege access

## AWS Services Required

- AWS CodePipeline (orchestration)
- AWS CodeBuild (build and test)
- AWS CodeDeploy (blue-green deployment)
- Amazon ECS Fargate (container hosting)
- Amazon ECR (container registry)
- Application Load Balancer (traffic management)
- Amazon EventBridge (pipeline triggering)
- Amazon SNS (notifications)
- AWS Systems Manager Parameter Store (configuration)
- Amazon S3 (artifact storage)
- Amazon VPC (networking)
- AWS IAM (permissions)

## Deployment Validation

After deployment, the infrastructure must:
- Successfully synthesize without errors
- Pass all unit tests with 100% coverage
- Deploy successfully to AWS
- Allow containers to be deployed via the pipeline
- Support blue-green deployments with zero downtime
- Send notifications for pipeline state changes
