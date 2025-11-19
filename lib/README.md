# CI/CD Pipeline Infrastructure for Containerized Applications

This Terraform configuration deploys a complete CI/CD pipeline for containerized applications with blue-green deployment capabilities, manual approval workflows, and strict security controls for PCI compliance.

## Architecture Overview

The infrastructure includes:

- **VPC**: Multi-AZ networking across 3 availability zones with public and private subnets
- **CodePipeline**: CI/CD orchestration with source, build, approval, and deploy stages
- **CodeCommit**: Source code repository with branch protection
- **CodeBuild**: Docker image build service with BUILD_GENERAL1_SMALL compute type
- **ECR**: Container registry with KMS encryption
- **ECS**: Container orchestration with Fargate launch type and blue-green deployments
- **Application Load Balancer**: Traffic distribution with target group switching
- **WAF**: Web application firewall for DDoS protection
- **KMS**: Customer-managed encryption keys for artifacts and container images
- **CloudWatch Logs**: Centralized logging with 30-day retention
- **SNS**: Notification service for manual approval workflow

## Prerequisites

- Terraform 1.5.0 or later
- AWS CLI configured with appropriate credentials
- AWS account with necessary permissions

## Deployment Instructions

### Step 1: Configure Variables

Create a `terraform.tfvars` file:

