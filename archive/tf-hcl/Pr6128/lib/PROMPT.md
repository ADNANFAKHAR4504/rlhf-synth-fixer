Prompt:
Create a conmplete Terraform configuration to deploy a consitent AWS payment processing infrastructure across development, staging, and production environments.

Requirements:

Use Terraform v1.5+ and AWS provider v5.x.

Define a reusable module for core infrastructure (VPC, subnets, security groups).

Manage environments using Terraform workspaces for dev, staging, and prod.

Store remote state in an S3 backend with a DynamoDB table for state locking.

Configure RDS PostgreSQL instances with environment specific sizes:

dev: t3.micro

staging: t3.small

prod: t3.medium

Deploy ECS Fargate services running a containerized payment API:

dev: 1 task

staging: 2 tasks

prod: 4 tasks

Add an Application Load Balancer with path-based routing to ECS services.

Create S3 buckets for transaction logs with:

Environment-specific names

Retention policies -

Implement security groups that only allow required traffic between components (ECS ->  RDS --> ALB).

Use .tfvars files to manage environment-specific settings (CIDR blocks, instance counts, etcs.).

Reference shared resources like AMI IDs and ECR URIs using data sources.

Tag all resources with:

Environment = workspace name

ManagedBy = Terraform

Expected output:
A modular Terraform setup including:

main.tf that configures workspaces and references modules

modules/core/ for shared infrastructure (VPC, subnets, SGs)

modules/ecs/ and modules/rds/ for services

Environment-specific .tfvars files (dev.tfvars, staging.tfvars, prod.tfvars)

Proper backend configuration for S3 and DynamoDB

Identical infrastructure pattern across all environments with size and scale variations

make sure you follow the structure of mentioned as per the modules