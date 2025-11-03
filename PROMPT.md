# Task: Provisioning of Infrastructure Environments

## Problem Statement

Create a Pulumi TypeScript program to migrate a development environment's infrastructure to production with enhanced security and reliability. The configuration must:

1. Create a new VPC with private subnets across 2 availability zones for production.
2. Deploy an RDS MySQL 8.0 instance in Multi-AZ configuration with encrypted storage.
3. Migrate existing Lambda functions with updated environment variables pointing to production resources.
4. Configure database credentials rotation using AWS Secrets Manager with 30-day rotation.
5. Set up SNS topic for production alerts with email subscription.
6. Enable automated RDS backups with 7-day retention period.
7. Configure Lambda functions with reserved concurrent executions of 50.
8. Tag all resources with Environment='production' and Project='payment-processing'.

Expected output: A fully functional production environment isolated from development, with all Lambda functions connected to the new RDS instance through secure VPC endpoints, automated credential rotation active, and monitoring alerts configured.

11. Deploy AWS Server Migration Service (SMS) for incremental server replication.
12. Configure AWS Transfer Family for secure file transfer during migration.
13. Implement Amazon Route 53 Application Recovery Controller for multi-region failover.
14. Set up AWS Fault Injection Simulator for chaos engineering and resilience testing.
15. Configure AWS Resource Access Manager for cross-account resource sharing.
16. Deploy Amazon CloudWatch Evidently for feature flags and A/B testing during migration.
17. Implement AWS App Runner for simplified container deployment in target environment.
18. Set up AWS Network Firewall for advanced network protection in migrated infrastructure.

## Context

A fintech startup needs to migrate their payment processing infrastructure from development to production. The development environment has been running successfully for 6 months with an RDS MySQL database and Lambda functions for transaction processing.

## Environment Details

AWS production environment in eu-west-2 region featuring RDS MySQL Multi-AZ deployment, Lambda functions in private subnets, and Secrets Manager for credential rotation. Requires Pulumi CLI 3.x, Node.js 16+, TypeScript 4.x, and AWS credentials with appropriate IAM permissions. VPC spans 2 AZs with private subnets for database and compute resources.

## Constraints

1. RDS instance must use db.t3.medium instance class with 100GB allocated storage
2. Lambda functions must use Node.js 18.x runtime with 512MB memory allocation
3. All inter-service communication must occur within the VPC using security groups
4. Database passwords must be at least 16 characters with special characters
5. Lambda environment variables must be encrypted using AWS-managed KMS keys
6. Production VPC CIDR must not overlap with development environment (10.0.0.0/16)
7. Must implement infrastructure as code testing using Pulumi's testing framework
8. All resources must support disaster recovery with RTO < 1 hour and RPO < 15 minutes
9. Implement cost allocation tags and AWS Cost Explorer integration for budget tracking
10. Must include comprehensive documentation with architecture diagrams exported as code
11. Implement automated security scanning in CI/CD pipeline before deployment
12. All secrets and credentials must use automatic rotation with zero-downtime updates
13. Must implement infrastructure drift detection with automated remediation
14. Deploy resources across multiple regions for high availability and disaster recovery

## Platform and Language

- Platform: Pulumi
- Language: TypeScript
- Difficulty: hard
