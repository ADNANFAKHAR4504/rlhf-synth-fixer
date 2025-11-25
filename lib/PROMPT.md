# Payment Processing System Migration to AWS - Zero Downtime

## Background
A fintech startup needs to migrate their payment processing infrastructure from a legacy on-premises setup to AWS. The current system handles 50,000 transactions daily and requires zero downtime during migration. The team has chosen CDKTF with Python to maintain infrastructure consistency across environments.

## Environment Details
Production environment migrating from on-premises to AWS us-east-2 region. Requires Python 3.9+, CDKTF 0.20+, AWS CLI v2 configured with appropriate IAM permissions. Target architecture includes Application Load Balancer, EC2 Lambda functions across 3 AZs, Aurora PostgreSQL Multi-AZ cluster, and private subnets with NAT Gateways. Existing on-premises PostgreSQL 14 database contains 500GB of transaction data. VPC CIDR 10.0.0.0/16 with separate subnets for web, app, and data tiers.

## Requirements

Create a CDKTF Python program to migrate a payment processing system from on-premises to AWS with zero downtime. The configuration must:

1. **VPC and Network Architecture**
   - Define VPC with 6 subnets (3 public, 3 private) across 3 availability zones for high availability
   - Use CIDR 10.0.0.0/16 with separate subnets for web, app, and data tiers
   - Configure NAT Gateways for private subnets

2. **Database Layer**
   - Create Aurora PostgreSQL 14 cluster with Multi-AZ deployment
   - Implement encrypted storage using KMS customer-managed keys
   - All database connections must use SSL/TLS encryption with certificate rotation

3. **Application Layer**
   - Deploy Lambda functions running containerized payment API
   - Configure auto-scaling (2-10 tasks) based on CPU utilization
   - Configure Application Load Balancer with health checks and SSL termination using ACM certificate

4. **Database Migration**
   - Implement AWS Database Migration Service (DMS) for continuous data replication from on-premises PostgreSQL
   - Handle 500GB of existing transaction data

5. **Traffic Migration Strategy**
   - Create weighted routing policy to gradually shift traffic (0% → 10% → 50% → 100%)
   - Migration must support blue-green deployment pattern with traffic switching capabilities

6. **Monitoring and Observability**
   - Set up CloudWatch dashboards monitoring migration progress, API latency, and error rates

7. **Security**
   - Configure Secrets Manager for database credentials with automatic rotation every 30 days
   - Implement AWS WAF rules protecting against SQL injection and rate limiting (1000 req/min per IP)

8. **Automation and Validation**
   - Create CloudFormation custom resource for pre/post migration validation checks
   - Define rollback mechanism using CDKTF workspace isolation and state versioning
   - Migration rollback must be achievable within 5 minutes using CDKTF state management

9. **Documentation**
   - Generate migration runbook as Markdown output with step-by-step instructions

10. **Code Quality**
    - All Python code must follow PEP 8 standards and include type hints

## Constraints
- Resource costs must not exceed $3,000/month in the target environment

## Expected Output
Complete CDKTF Python application with modular stack definitions, migration orchestration logic, and automated validation tests that can migrate the payment system with zero downtime while maintaining data consistency.
