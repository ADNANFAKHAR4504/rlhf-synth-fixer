# Task: 101912376

## Platform: Pulumi
## Language: Python
## Difficulty: expert
## Subtask: Infrastructure as Code

## Problem Statement

Create a Pulumi Python program to deploy and maintain consistent fraud detection infrastructure across three environments. The configuration must: 1. Define a base ComponentResource class that encapsulates the full stack (ECS cluster, Aurora DB, DynamoDB) 2. Create environment-specific stacks (dev, staging, prod) that instantiate the base component with appropriate configs 3. Implement Aurora cross-region read replicas from prod to staging/dev for testing with production-like data 4. Configure DynamoDB global tables for multi-region replication of scoring rules 5. Set up ECS services with environment-specific container images and resource allocations 6. Create ALBs with path-based routing to different service versions 7. Implement IAM roles with environment-appropriate permissions (read-only in dev, limited write in staging) 8. Configure CloudWatch dashboards that aggregate metrics across all environments 9. Set up SNS topics for environment-specific alerts with different severity thresholds 10. Export critical resource ARNs and endpoints as stack outputs for cross-stack references 11. Implement a drift detection script using Automation API to compare actual vs desired state 12. Ensure all resources are tagged with Environment, Owner, and CostCenter tags. Expected output: A Pulumi Python project with base infrastructure components, three environment-specific programs, and an automation script that validates infrastructure consistency across all environments.

## Background

A financial services company needs to maintain identical infrastructure across development, staging, and production environments for their real-time fraud detection system. The infrastructure must be synchronized across all three environments with environment-specific configurations while ensuring zero configuration drift between deployments.

## Environment

Multi-environment AWS infrastructure deployed across three regions: us-east-1 (production), us-west-2 (staging), and eu-west-1 (development). Each environment consists of ECS Fargate clusters running containerized fraud detection services, RDS Aurora PostgreSQL clusters for transaction data, and DynamoDB tables for real-time scoring. VPCs in each region with 3 availability zones, private subnets for compute and database resources, public subnets for ALBs. Requires Pulumi 3.x with Python 3.9+, AWS CLI configured with appropriate credentials for all three accounts. Inter-region VPC peering for secure replication.

## Constraints

Use Pulumi StackReferences to share outputs between environment stacks | Implement custom ComponentResource classes for reusable infrastructure patterns | All environment-specific values must come from Pulumi config, not hardcoded | Use explicit provider configurations for cross-region deployments | Implement drift detection using Pulumi Automation API | Resource naming must follow pattern: {env}-{region}-{resource}-{random}
