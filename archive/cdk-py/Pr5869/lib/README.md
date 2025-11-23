# Multi-Environment Payment Processing Infrastructure

Complete CDK Python implementation for deploying identical payment processing infrastructure across Dev, Staging, and Prod environments.

## Architecture

- Abstract BasePaymentStack with shared components
- Environment-specific stacks (Dev, Staging, Prod)
- VPC with 3 AZs per environment
- RDS Aurora PostgreSQL Multi-AZ
- ECS Fargate with auto-scaling
- S3, DynamoDB, SQS for data and messaging
- CloudWatch monitoring and alarms

## Deployment
