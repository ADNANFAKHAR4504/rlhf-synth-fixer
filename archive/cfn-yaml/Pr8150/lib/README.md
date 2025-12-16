# CI/CD Pipeline Infrastructure

This CloudFormation template creates a production-ready CI/CD pipeline for containerized applications with Blue/Green deployments.

## Architecture

The pipeline consists of 5 stages:

1. **Source**: Retrieves code from GitHub repository
2. **Build**: Builds Docker container images using CodeBuild
3. **Test**: Runs automated tests using CodeBuild
4. **Deploy-Staging**: Deploys to staging ECS cluster using CodeDeploy Blue/Green deployment
5. **Deploy-Production**: Manual approval followed by production deployment

## Prerequisites

Before deploying this stack, ensure you have:

- AWS Account with appropriate permissions
- GitHub repository with OAuth token
- ECS clusters and services for staging and production environments
- ECR repository for container images

## Deployment

### Parameters

The template requires the following parameters:

- `EnvironmentSuffix`: Unique suffix for resource names (e.g., dev, staging, prod)
- `GitHubToken`: GitHub OAuth token for source integration
- `GitHubOwner`: GitHub repository owner/organization
- `RepositoryName`: GitHub repository name
- `BranchName`: Git branch to track (default: main)
- `NotificationEmail`: Email address for pipeline notifications
- `ECSClusterNameStaging`: ECS cluster name for staging
- `ECSServiceNameStaging`: ECS service name for staging
- `ECSClusterNameProduction`: ECS cluster name for production
- `ECSServiceNameProduction`: ECS service name for production

### Deploy using AWS CLI
