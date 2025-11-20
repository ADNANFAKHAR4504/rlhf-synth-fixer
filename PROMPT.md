# Task 101912368: Multi-tenant SaaS Infrastructure

## Problem Statement

Create a Pulumi Python program to provision multi-tenant SaaS infrastructure with resource isolation. The configuration must: 1. Create a VPC with 3 public and 3 private subnets across availability zones. 2. Deploy an Aurora PostgreSQL cluster with one writer instance and parameter group enabling shared_preload_libraries. 3. Generate database schemas and users for each tenant with GRANT permissions only to their schema. 4. Create S3 buckets with tenant-prefixed naming (e.g., saas-platform-acme-corp-data). 5. Configure bucket policies restricting access to IAM roles matching tenant_id tags. 6. Deploy an ALB with listener rules routing *.acme-corp.example.com to acme-corp target group. 7. Create ECS task definitions per tenant with 1 vCPU and 2GB memory limits. 8. Configure Fargate services with desired_count=2 and auto-scaling between 2-8 tasks. 9. Set up CloudWatch Log Groups with /ecs/tenant/{tenant_id} naming pattern. 10. Store tenant database passwords in Secrets Manager with naming pattern rds/tenant/{tenant_id}/password. 11. Create security groups allowing port 5432 from ECS tasks to RDS, and port 80 from ALB to ECS. 12. Output tenant endpoints as {tenant_id}.example.com URLs and database connection strings. Expected output: A Pulumi program that creates isolated multi-tenant infrastructure supporting 3 initial tenants, with all resources properly tagged and secured using least-privilege IAM policies.

## Background

A B2B SaaS startup needs isolated environments for each customer tenant, with shared infrastructure components to minimize costs. Each tenant requires dedicated compute resources, database schemas, and storage buckets while sharing networking and monitoring infrastructure.

## Environment

Multi-tenant SaaS infrastructure deployed in us-east-1 across 3 availability zones. Core services include Aurora PostgreSQL 15.4 cluster, ECS Fargate for containerized workloads, Application Load Balancer for traffic routing, and S3 for tenant file storage. Requires Pulumi 3.x with Python 3.9+, AWS CLI v2 configured with appropriate permissions. VPC spans 10.0.0.0/16 with public subnets (10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24) and private subnets (10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24). NAT Gateways provide outbound internet access from private subnets.

## Constraints

- Each tenant must have isolated RDS database schemas within a shared Aurora cluster
- S3 buckets must enforce tenant-specific prefixes with IAM policies preventing cross-tenant access
- ECS tasks must run in dedicated security groups per tenant with no inter-tenant communication
- All tenant resources must be tagged with tenant_id and cost_center for billing allocation
- Shared ALB must route traffic based on Host header to tenant-specific target groups
- CloudWatch Log Groups must have separate streams per tenant with 30-day retention
- Secrets Manager must store per-tenant database credentials with automatic rotation disabled
- VPC must use 10.0.0.0/16 CIDR with /24 subnets allocated per availability zone
- All resources must have deletion_protection set to false for development environment
- Stack must support creating 3 initial tenants: acme-corp, globex-inc, initech-llc

## Subject Labels

aws, infrastructure, cloud-environment-setup
