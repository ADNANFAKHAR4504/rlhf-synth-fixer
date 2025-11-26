# Task: ECS Fargate Optimization

## Background
A financial services company discovered their ECS-based microservices platform is experiencing frequent task failures and excessive costs due to inefficient resource allocation. The existing Terraform configuration was hastily assembled without proper optimization, resulting in over-provisioned instances, redundant resources, and poor auto-scaling configurations.

## Problem Statement
Create a Terraform configuration to optimize an existing ECS Fargate deployment that is experiencing performance issues and cost overruns.

## MANDATORY REQUIREMENTS (Must complete)

1. Define optimized ECS task definitions with right-sized CPU/memory for 3 services: api (256/512), worker (512/1024), and scheduler (256/512) (CORE: ECS)
2. Configure Application Load Balancer with proper health check settings: interval=15s, timeout=10s, healthy_threshold=2 (CORE: ALB)
3. Implement ECS Service Auto Scaling with step scaling policies based on CPU and memory utilization
4. Set proper deregistration_delay on target groups (30 seconds for api, 60 seconds for worker)
5. Configure circuit breaker on all ECS services with rollback enabled
6. Use lifecycle ignore_changes for task definition to prevent unnecessary redeployments
7. Implement proper CloudWatch log group retention (7 days for debug, 30 days for production)
8. Add cost allocation tags including Environment, Service, and CostCenter

## OPTIONAL ENHANCEMENTS (If time permits)

- Add Container Insights for deeper performance metrics (OPTIONAL: CloudWatch Container Insights) - provides detailed performance analytics
- Implement X-Ray tracing for request flow analysis (OPTIONAL: X-Ray) - helps identify bottlenecks
- Add EventBridge rules for task state changes (OPTIONAL: EventBridge) - enables automated responses to failures

## Expected Output
Optimized Terraform configuration that reduces resource waste while maintaining application performance, with proper scaling policies and health checks that prevent cascading failures.

## Constraints

1. Task definitions must use exact CPU/memory combinations that match Fargate supported configurations
2. Auto-scaling policies must have proper cooldown periods to prevent flapping
3. All ECS services must use rolling update deployment with circuit breaker enabled
4. Container health checks must have realistic timing parameters based on actual startup times
5. Target group deregistration delay must be optimized for graceful shutdowns
6. CloudWatch log groups must use appropriate retention periods to control costs

## Environment

Production ECS cluster deployed in us-east-1 running 12 microservices on AWS Fargate with Application Load Balancer. Current setup uses ECS Service Auto Scaling with CloudWatch metrics. Terraform 1.5+ with AWS provider 5.x required. VPC spans 3 availability zones with private subnets for ECS tasks and public subnets for ALB. Services communicate via service discovery using Cloud Map. Existing configuration has resource waste estimated at $3,000/month due to over-provisioning and inefficient scaling policies.

## Region
us-east-1

## AWS Services
- ECS (Elastic Container Service)
- ALB (Application Load Balancer)
- CloudWatch (for metrics and logging)
- Auto Scaling