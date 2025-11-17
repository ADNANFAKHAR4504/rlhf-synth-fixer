# Payment Processing Application Infrastructure

This Pulumi TypeScript project deploys a highly available, production-grade payment processing infrastructure on AWS.

## Architecture

- **Multi-AZ VPC**: 3 public, 3 private, and 3 database subnets across 3 availability zones
- **Aurora Serverless v2**: PostgreSQL database with encryption and automatic scaling (0.5-2 ACUs)
- **ECS Fargate**: Containerized application deployment with auto-scaling
- **Application Load Balancer**: With AWS WAF for SQL injection and XSS protection
- **API Gateway**: Rate-limited API endpoints (1000 req/min per key)
- **CloudWatch**: 7-year log retention, dashboards, and alarms
- **X-Ray**: Distributed tracing with 10% sampling
- **Lambda**: Daily backup verification

## Prerequisites

- Node.js 18+ and npm
- Pulumi CLI 3.x
- AWS CLI configured with appropriate credentials
- Docker (for building container images)

## Configuration

Set the environment suffix:
