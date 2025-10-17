# Educational Content Delivery Platform - CI/CD Pipeline Infrastructure

## Overview

This CloudFormation template implements a secure, scalable CI/CD pipeline infrastructure for an educational content delivery platform. The solution includes automated build and deployment pipelines, content delivery through CloudFront CDN, application hosting on ECS Fargate, and comprehensive monitoring and security features.

## Architecture Components

### 1. CI/CD Pipeline
- **CodeCommit Repository**: Source control for application code
- **CodeBuild Project**: Automated build and test execution
- **CodePipeline**: Orchestrates the entire CI/CD workflow (Source → Build → Deploy)
- **EventBridge Rule**: Automatically triggers pipeline on code commits
- **S3 Artifact Bucket**: Encrypted storage for build artifacts with lifecycle policies

### 2. Application Infrastructure
- **ECS Fargate Cluster**: Serverless container orchestration for the educational platform
- **ECS Service**: Manages 2 application tasks for high availability
- **Application Load Balancer (ALB)**: Distributes traffic across ECS tasks
- **VPC with Public and Private Subnets**: Network isolation across 2 availability zones
- **Security Groups**: Least-privilege network access controls

### 3. Content Delivery
- **S3 Content Bucket**: Stores educational content (videos, documents, images)
- **CloudFront Distribution**: Global CDN for low-latency content delivery
- **Origin Access Identity (OAI)**: Secure S3 access from CloudFront only

### 4. Data Storage
- **DynamoDB UserProgress Table**: Tracks student progress through courses
- **DynamoDB CourseMetadata Table**: Stores course information and metadata
- **KMS Encryption**: All data encrypted at rest with customer-managed keys

### 5. Security & Compliance
- **KMS Key**: Customer-managed key for encryption with automatic rotation
- **IAM Roles**: Least-privilege access for all services
- **VPC Endpoints**: Private connectivity to S3 and DynamoDB (cost-optimized, no NAT)
- **Encryption**: All data at rest (S3, DynamoDB, Logs) and in transit (HTTPS/TLS)

### 6. Monitoring & Alerting
- **CloudWatch Log Groups**: Centralized logging for ECS and CodeBuild
- **CloudWatch Alarms**: Monitor pipeline failures, ECS CPU, and ALB response times
- **SNS Topic**: Email notifications for critical alerts

## Key Features

### Security Best Practices
1. All S3 buckets have:
   - Public access blocked
   - KMS encryption enabled
   - Versioning enabled
   - Lifecycle policies for cost optimization

2. All IAM roles follow least privilege:
   - ECS Task Execution Role: Pull images, write logs, decrypt KMS
   - ECS Task Role: Access DynamoDB tables, read S3 content
   - CodeBuild Role: Build permissions, artifact access
   - CodePipeline Role: Orchestration across services

3. Network security:
   - Private subnets for ECS tasks
   - Security groups with specific ingress/egress rules
   - VPC endpoints eliminate need for NAT Gateway

### High Availability
- ECS Service runs 2 tasks across 2 availability zones
- ALB distributes traffic with health checks
- Multi-AZ subnet architecture
- DynamoDB with point-in-time recovery

### Cost Optimization
- ECS Fargate eliminates server management
- DynamoDB on-demand billing (no idle capacity costs)
- VPC Gateway endpoints (free) instead of NAT Gateway
- S3 lifecycle policies delete old artifacts after 30 days
- CloudWatch Logs retention set to 7 days

### Educational Data Compliance
- Encryption at rest and in transit
- Audit trail through CloudWatch Logs
- Point-in-time recovery for student data
- Secure content delivery through CloudFront

## Resource Naming Convention

All resources use the `EnvironmentSuffix` parameter for unique naming:
- Pattern: `{resource-type}-{environment-suffix}`
- Example: `education-cluster-dev`, `UserProgress-prod`
- Ensures no naming conflicts across environments

## AWS Services Used

This infrastructure uses the following AWS services:

1. **Compute & Containers**: ECS Fargate, Application Load Balancer
2. **CI/CD**: CodeCommit, CodeBuild, CodePipeline, EventBridge
3. **Storage**: S3 (2 buckets), DynamoDB (2 tables)
4. **Content Delivery**: CloudFront
5. **Networking**: VPC, Subnets, Internet Gateway, Route Tables, Security Groups, VPC Endpoints
6. **Security**: IAM Roles, KMS
7. **Monitoring**: CloudWatch Logs, CloudWatch Alarms, SNS