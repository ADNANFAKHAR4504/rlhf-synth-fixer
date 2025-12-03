# Task: ECS Fargate Service Optimization

## Problem Statement

Create a Pulumi TypeScript program to refactor and optimize an existing ECS Fargate service deployment. The configuration must:

1. Fix the task definition to use proper memory and CPU configurations based on container requirements (512MB memory, 256 CPU units).
2. Replace all hardcoded values with proper Pulumi configuration management.
3. Add CloudWatch log group with 7-day retention for container logs.
4. Implement proper IAM task execution role with minimal required permissions.
5. Configure health check with appropriate intervals and thresholds.
6. Set up CPU and memory utilization alarms at 80% threshold.
7. Use ECR for container image management with lifecycle policy for cleanup.
8. Add proper resource tagging for cost allocation.
9. Implement graceful shutdown handling with 30-second stop timeout.

## Requirements

- Platform: Pulumi
- Language: TypeScript
- Difficulty: Hard
- Subject: IaC Program Optimization
- Category: IaC Optimization

## Expected Deliverables

1. Complete Pulumi TypeScript infrastructure code
2. Comprehensive unit tests with 100% coverage
3. Integration tests for deployment validation
4. Proper documentation of all resources
5. Metadata file with task details
