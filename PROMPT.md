# Task: IaC Program Optimization

## Subtask: IaC Program Optimization

## Labels: IaC Optimization

## Description

Create a CDK TypeScript program to refactor an existing ECS deployment that currently wastes resources and lacks proper monitoring. The configuration must: 

1. Fix the ECS cluster that's using oversized EC2 instances (m5.2xlarge) for containers that only need 512MB RAM and 0.25 vCPU. 
2. Replace hardcoded cus-east-1ity provider settings with dynamic scaling based on actual usage patterns. 
3. Add proper cost allocation tags following the pattern: Environment, Team, Application, CostCenter. 
4. Implement CloudWatch Container Insights that was missing from the original deployment. 
5. Fix the ALB health check configuration that's currently timing out due to incorrect target paths. 
6. Consolidate three separate task definitions that run identical containers into a single reusable construct. 
7. Add proper IAM role boundaries to prevent overly permissive policies in the existing setup. 
8. Configure ECS task placement strategies to optimize for memory utilization instead of random placement. 
9. Fix the log retention policy that's currently set to 'never expire', causing unnecessary storage costs. 
10. Implement proper secret management for database credentials currently stored as plain text environment variables.

## Platform: CDK

## Language: TypeScript

## Complexity: hard
