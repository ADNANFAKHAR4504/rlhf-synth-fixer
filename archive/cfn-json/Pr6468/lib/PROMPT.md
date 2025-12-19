# Task: Deploy Containerized Web Application on AWS ECS Fargate with High Availability

## Overview
Create a CloudFormation template (JSON format) to deploy a containerized web application on AWS ECS Fargate with high availability across multiple availability zones.

## Platform Requirements
- **Platform**: CloudFormation (cfn)
- **Language**: JSON
- **Complexity**: Hard
- **Region**: us-east-1

## Task Description
**ORIGINAL REQUIREMENT**: "Create a Terraform configuration to deploy a containerized web application on AWS ECS Fargate with high availability"

**TRANSFORMED REQUIREMENT**: Create a CloudFormation template (JSON format) that deploys a containerized web application on AWS ECS Fargate with high availability.

NOTE: The original task description mentioned Terraform, but the CSV platform/language columns mandate CloudFormation/JSON. Per platform enforcement rules, the CSV values are MANDATORY and take precedence.

## Required Infrastructure Components

### 1. Networking Layer
- VPC with CIDR block (e.g., 10.0.0.0/16)
- Public subnets in at least 2 availability zones
- Private subnets in at least 2 availability zones
- Internet Gateway
- NAT Gateways (one per AZ for high availability)
- Route Tables with appropriate routes
- Security Groups for ALB and ECS tasks

### 2. Load Balancing
- Application Load Balancer (ALB) in public subnets
- Target Group for ECS service
- Listener on port 80 (HTTP)
- Health check configuration

### 3. ECS Fargate Cluster
- ECS Cluster
- Task Definition with:
  - Container image (can use a sample like nginx or httpd)
  - CPU and memory allocation (e.g., 256 CPU units, 512 MB memory)
  - Port mappings
  - CloudWatch Logs configuration
- ECS Service with:
  - Desired count of at least 2 tasks
  - Launch type: FARGATE
  - Network configuration (subnets, security groups)
  - Load balancer integration
  - Service discovery (optional)

### 4. IAM Roles and Policies
- ECS Task Execution Role (for pulling images, writing logs)
- ECS Task Role (for application permissions)
- Required managed policies:
  - AmazonECSTaskExecutionRolePolicy

### 5. CloudWatch Logs
- Log Group for ECS task logs
- Retention period configuration

### 6. High Availability Features
- Multi-AZ deployment (minimum 2 AZs)
- Multiple task replicas (minimum 2)
- ALB health checks
- Auto-scaling (optional but recommended)

## Outputs
The CloudFormation template should include outputs for:
- ALB DNS name (for accessing the application)
- ECS Cluster name
- ECS Service name
- VPC ID
- Subnet IDs

## Constraints
- All resources must be defined in a single JSON CloudFormation template
- Use AWS best practices for naming and tagging
- Ensure proper security group rules (principle of least privilege)
- Enable container insights for monitoring (optional)

## Success Criteria
- Template successfully creates all required resources
- Application is accessible via ALB DNS name
- High availability is ensured through multi-AZ deployment
- Template is idempotent and can be updated safely
- All resources are properly tagged for identification

## Subject Labels
- aws
- infrastructure
- web-application-deployment