# Task: Infrastructure Migration - Blue-Green Deployment

## Background
A financial services company needs to migrate their monolithic application infrastructure from an on-premises data center to AWS. The application currently serves payment processing APIs and requires strict compliance with PCI-DSS standards. Migration must be completed with zero downtime using a blue-green deployment strategy.

## Problem Statement
Create a Terraform configuration to migrate an on-premises payment processing application to AWS using blue-green deployment strategy.

## MANDATORY REQUIREMENTS (Must complete)

### 1. VPC Configuration (CORE: VPC)
Configure VPC with 3 availability zones, each with public and private subnets.

### 2. ECS Fargate Service (CORE: ECS)
Deploy ECS Fargate service running containerized application in private subnets.

### 3. RDS Aurora PostgreSQL Cluster
Create RDS Aurora PostgreSQL cluster with Multi-AZ deployment.

### 4. Application Load Balancer
Set up Application Load Balancer with target groups for blue and green environments.

### 5. AWS DMS Configuration
Configure AWS DMS replication instance and migration task for Oracle to Aurora.

### 6. IAM Roles
Implement IAM roles with least privilege for ECS tasks and DMS.

### 7. CloudWatch Log Groups
Create CloudWatch Log Groups with 90-day retention for compliance.

### 8. Resource Tagging
Use consistent resource tagging: Environment, CostCenter, MigrationPhase.

## OPTIONAL ENHANCEMENTS (If time permits)

### Route 53 Weighted Routing (OPTIONAL: Route 53)
Add Route 53 weighted routing for gradual traffic shifting - enables controlled migration.

### AWS Systems Manager Parameter Store (OPTIONAL: SSM)
Implement AWS Systems Manager Parameter Store for secrets - improves security posture.

### AWS Config Rules (OPTIONAL: Config)
Configure AWS Config rules for compliance checking - ensures ongoing compliance.

## Constraints

1. All data must be encrypted at rest using AWS KMS customer-managed keys
2. Network traffic between application tiers must traverse private subnets only
3. Database migration must use AWS DMS with continuous replication enabled
4. Application logs must be retained for exactly 90 days for compliance
5. Each environment must have identical resource tagging for cost allocation
6. RDS instances must have automated backups with 7-day retention period
7. ALB must use SSL/TLS certificates from AWS Certificate Manager
8. Security groups must follow principle of least privilege with no 0.0.0.0/0 rules

## Environment Details

Production infrastructure deployment in us-east-1 region for payment processing system migration. Requires VPC with 3 availability zones, each containing public and private subnets. Core services include Application Load Balancer in public subnets, ECS Fargate containers in private subnets, and RDS Aurora PostgreSQL Multi-AZ cluster. NAT Gateways provide outbound internet access for private resources. AWS DMS for database migration from on-premises Oracle to Aurora. Terraform 1.5+ with AWS provider 5.x configured. Environment uses AWS Organizations with separate accounts for dev, staging, and production.

## Expected Output

Complete Terraform configuration with modules for networking, compute, database, and migration components that supports zero-downtime blue-green deployment from on-premises to AWS.

## Platform and Language (MANDATORY)

- Platform: Terraform
- Language: HCL
- Complexity: hard

These are MANDATORY constraints that must be followed. Do not use any other IaC tool or language.
