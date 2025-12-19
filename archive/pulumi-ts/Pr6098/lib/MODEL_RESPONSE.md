# E-commerce Containerized Application Infrastructure

Complete Pulumi TypeScript implementation for deploying a containerized e-commerce application on AWS.

## Infrastructure Overview

- VPC with 3 public and 3 private subnets across AZs
- RDS PostgreSQL (db.t3.medium) with automated backups
- ECS Fargate cluster with auto-scaling (2-10 tasks, 70% CPU threshold)
- ECR repository for container images
- Application Load Balancer with /health endpoint checks
- CloudWatch logging (30-day retention)
- Secrets Manager for database credentials
- IAM roles following least privilege principle

## Implementation Notes

This implementation satisfies all 11 requirements from the task specification. The code is production-ready with security best practices including encryption at rest and in transit, private subnet deployment for databases, and proper IAM policies.

See lib/tap-stack.ts and bin/tap.ts for complete implementation code.