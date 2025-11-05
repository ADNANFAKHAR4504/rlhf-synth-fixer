# Infrastructure Requirements

## Project Overview

Create a CDKTF program to deploy a highly available web application infrastructure for a fintech startup's payment processing application. The solution must meet strict compliance requirements while providing zero-downtime deployments and geographic distribution.

## Core Requirements

### 1. Container Orchestration
- Set up an ECS Fargate cluster with blue/green deployment capability using separate target groups
- Configure auto-scaling policies based on request count and database connections
- Use Fargate Spot instances for non-critical workloads to optimize costs

### 2. Load Balancing & Routing
- Configure an Application Load Balancer with path-based routing rules and custom health check parameters
- Support canary deployments with automated rollback capabilities

### 3. Database Infrastructure
- Deploy RDS Aurora PostgreSQL cluster with read replicas and automated backups to S3
- Store RDS passwords in AWS Secrets Manager with automatic rotation
- Set up cross-region replication for RDS snapshots

### 4. Content Delivery & Storage
- Implement CloudFront distribution with custom cache behaviors based on URL patterns
- Use custom SSL certificates from ACM with SNI support
- Create S3 buckets for static assets with versioning and lifecycle policies
- Enable server-side encryption with customer-managed KMS keys
- Configure cross-region replication for S3 buckets

### 5. Security & Monitoring
- Configure WAF rules to protect against common web exploits and rate limiting
- Implement custom CloudWatch dashboards with application-specific metrics
- Centralize all logs in CloudWatch with 30-day retention policy
- Follow principle of least privilege for VPC security groups with explicit egress rules

### 6. Network Optimization
- Set up VPC endpoints for S3 and ECR to reduce data transfer costs
- Configure VPC peering between regions for replication

## Environment Specifications

### AWS Regions
- **Primary**: us-east-2
- **Disaster Recovery**: us-west-2

### Technology Stack
- **Container Platform**: ECS Fargate
- **Database**: RDS Aurora PostgreSQL Multi-AZ cluster
- **Storage**: S3 for static content
- **CDN**: CloudFront for global content delivery
- **Load Balancer**: Application Load Balancer (ALB)

### Network Architecture
- **Public Subnets**: For Application Load Balancer
- **Private Subnets**: For ECS tasks and RDS
- **VPC Peering**: Between regions for replication

## Implementation Constraints

- All infrastructure must be defined in a single CDKTF stack with proper resource dependencies
- ECS task definitions must use IAM task roles with least privilege permissions
- Data encryption must be implemented at rest and in transit
- Infrastructure must support zero-downtime deployments
- Solution must provide low-latency access across multiple regions

## Expected Deliverables

A fully functional CDKTF application that generates Terraform configuration for a production-ready web application infrastructure with:
- Automated deployment capabilities
- Disaster recovery mechanisms
- Compliance with fintech security requirements
- Cost-optimized resource allocation