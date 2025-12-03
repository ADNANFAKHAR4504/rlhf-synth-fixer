# IaC Program Optimization Task

## Problem Statement

Optimize the following Pulumi TypeScript infrastructure code for an ECS-based application deployment. The code has several issues that need to be fixed:

1. **Incorrect Output Type Handling**: Container definitions are using `JSON.stringify()` directly with Pulumi Output types, which causes runtime errors
2. **Missing Base64 Encoding**: EC2 Launch Template user data is not properly base64 encoded
3. **No Integration Tests**: Only unit tests with mocks are provided, need real integration tests
4. **Incomplete Test Coverage**: Test coverage is far below 100%

## Background

You are managing infrastructure for a containerized web application that needs to run on AWS ECS with EC2 launch templates for auto-scaling. The application requires:
- ECS cluster with Fargate capacity provider
- Task definition with container definitions
- EC2 launch template for auto-scaling group
- VPC with public and private subnets
- IAM roles and policies

## Current Infrastructure Code

The infrastructure creates:
- VPC with CIDR 10.0.0.0/16
- Public and private subnets
- Internet Gateway and NAT Gateway
- ECS cluster
- ECS task definition with container
- EC2 launch template for worker nodes
- IAM roles for ECS task execution

## Constraints

- Use Pulumi TypeScript
- All AWS resources must use proper Output type handling
- User data must be base64 encoded
- Achieve 100% test coverage
- Include both unit and integration tests
- Follow Pulumi best practices
