# CI/CD Pipeline for Microservices Deployment

## Background

A software company needs to implement a multi-stage CI/CD pipeline for their microservices architecture. The pipeline must support parallel builds for multiple services, automated testing environments, and blue-green deployments with automatic rollback capabilities.

## Problem Statement

Create a CDKTF Python program to build a production-grade CI/CD pipeline for microservices deployment. The configuration must:

1. Define a 5-stage pipeline with Source (CodeCommit), Build (CodeBuild), Test (CodeBuild), Staging (ECS), and Production (ECS) stages.
2. Configure CodeBuild projects for parallel builds of api-service, auth-service, and notification-service from a monorepo structure.
3. Set up ECR repositories with image scanning enabled and lifecycle policies for untagged image cleanup after 7 days.
4. Create ECS task definitions with CPU/memory limits (256/512 for staging, 512/1024 for production).
5. Implement blue-green deployments using ECS services with target group switching.
6. Configure CloudWatch alarms monitoring ECS task count, ALB target health, and 5XX error rates.
7. Add Lambda function to validate deployment health and trigger automatic rollback if alarms breach.
8. Store sensitive configuration in Parameter Store with paths like /pipeline/{stage}/{service}/.
9. Create SNS topic with email subscriptions for pipeline failures and manual approval notifications.
10. Output pipeline execution URL, ECR repository URIs, and ECS service endpoints.

## Environment

AWS multi-region deployment with primary pipeline in us-east-1 and disaster recovery in us-west-2. Infrastructure includes CodePipeline for orchestration, CodeBuild for compilation and testing, ECS Fargate for container hosting across 3 availability zones. Requires Python 3.9+, CDKTF 0.20+, Docker for local testing. VPC with private subnets for ECS tasks, public subnets for ALB. CodeCommit repository for source control, ECR for container images. CloudWatch Logs with 14-day retention for all services.

## Constraints

- Use CodePipeline with exactly 5 stages: Source, Build, Test, Staging, Production
- Implement parallel builds for at least 3 microservices using CodeBuild
- Store build artifacts in S3 with lifecycle policies for 30-day retention
- Deploy to ECS Fargate with task definitions versioned in ECR
- Configure automatic rollback based on CloudWatch alarm thresholds
- Use Parameter Store for build-time and runtime configuration
- Implement manual approval action before production deployment
- Generate unique deployment IDs using timestamp-based naming
- Configure SNS notifications for pipeline state changes
- Enforce separation of concerns with distinct IAM roles per stage

## Expected Output

A complete CDKTF Python application that provisions a fully automated CI/CD pipeline with parallel builds, staged deployments, health monitoring, and automatic rollback capabilities for microservices running on ECS Fargate.
