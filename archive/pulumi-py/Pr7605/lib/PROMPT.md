# Task: CI/CD Pipeline Integration for BrazilCart E-commerce Platform

Create a comprehensive CI/CD pipeline infrastructure for BrazilCart, a multi-region e-commerce platform, using AWS services integrated with Pulumi Python.

## Requirements

### Core Infrastructure

**VPC Configuration:**
- Multi-AZ deployment across 3 availability zones
- Public and private subnets in each AZ
- NAT Gateways for private subnet internet access
- VPC Flow Logs for network monitoring
- CIDR: 10.0.0.0/16

**Database Layer (RDS PostgreSQL):**
- Multi-AZ deployment for high availability
- PostgreSQL 15.x engine
- Instance class: db.t3.medium
- Storage: 100GB encrypted with AWS KMS
- Automated backups with 7-day retention
- Credentials stored in AWS Secrets Manager
- skip_final_snapshot: true (for testing purposes)
- Database name: brazilcart_production

**Caching Layer (ElastiCache Redis):**
- Multi-AZ with automatic failover
- Engine version: 7.x
- Node type: cache.t3.micro
- Number of cache nodes: 2
- Authentication enabled via auth token
- Encryption at rest and in transit

### CI/CD Pipeline

**CodeCommit Repository:**
- Repository name: brazilcart-app
- Enable branch protection
- Default branch: main

**CodeBuild Project:**
- Build spec for Node.js/Python application
- Docker image support
- Build environment: Ubuntu standard 7.0
- Environment variables for AWS credentials
- Artifact encryption with KMS

**CodePipeline:**
- Source stage: CodeCommit integration
- Build stage: CodeBuild execution
- Deploy stage: Multi-environment deployment (dev, staging, production)
- Manual approval gates before production
- CloudWatch Events for pipeline notifications
- S3 artifact store with encryption

### Security & Monitoring

**Secrets Management:**
- AWS Secrets Manager for database credentials
- Automatic password rotation for RDS
- Random password generation for initial setup

**Encryption:**
- KMS keys for encrypting:
  - RDS storage
  - CodePipeline artifacts
  - S3 bucket data
  - CloudWatch logs

**IAM Roles:**
- CodePipeline service role with least privilege
- CodeBuild service role for build execution
- Cross-account roles for multi-environment deployment

**CloudWatch:**
- Log groups for:
  - VPC Flow Logs
  - CodeBuild logs
  - Pipeline execution logs
- Metric alarms for:
  - RDS CPU utilization
  - ElastiCache memory utilization
  - Pipeline failure notifications

## Expected Output

A fully deployable infrastructure that:
- Provisions a secure, multi-AZ VPC
- Deploys RDS PostgreSQL with encryption and secrets management
- Configures ElastiCache Redis with authentication
- Creates a complete CI/CD pipeline from code commit to deployment
- Implements comprehensive security controls (KMS, IAM, secrets)
- Provides monitoring and logging capabilities

## Integration Test Focus

The solution should demonstrate:
1. End-to-end pipeline execution from commit to deployment
2. Secure credential management throughout the pipeline
3. Multi-AZ resilience for databases and caching
4. Proper encryption for data at rest and in transit
5. CloudWatch monitoring and alerting integration
6. Manual approval gates for production deployments

## Technical Constraints

- Use Pulumi Python exclusively
- All passwords must be randomly generated and stored in Secrets Manager
- RDS must have skip_final_snapshot=True for testing
- No hardcoded credentials or secrets
- All resources must have appropriate tags for cost allocation
- Follow AWS Well-Architected Framework best practices